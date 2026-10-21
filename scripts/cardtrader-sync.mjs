/**
 * Builds the public CardTrader data files from the official API (written permission of 2026-10-20: images,
 * prices and the other API data may be used). Read-only: /expansions, /blueprints/export and
 * /marketplace/products. Cart, purchase and wishlist endpoints are never called, and no seller identity is kept.
 *
 *   CARDTRADER_API_TOKEN=… node scripts/cardtrader-sync.mjs [--out public/data/cardtrader]
 *       [--max-expansions N] [--skip-prices] [--coverage-out .cardtrader/coverage.json]
 *
 * Output (stable ordering, rewritten only when the content changed):
 *   index.json                  catalog key ("en:base1") -> CardTrader expansion id
 *   expansions/<id>.json        Pokémon Singles blueprints: collector number, name, rarity, image, product ids
 *   prices/<id>.json            cheapest EUR price per blueprint, language and minimum condition (p); offer counts
 *                               per language (o); seller country codes, cheapest first (c)
 *   manifest.json               counts, source, attribution
 */
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { asCollection } from "./cardtrader-response.mjs";
import { summarizeOffers } from "./cardtrader-offers.mjs";

const API_BASE = "https://api.cardtrader.com/api/v2";
const IMAGE_PREFIX = "https://cardtrader.com/uploads/blueprints/image/";
const SINGLES_CATEGORY_ID = 73;
const token = process.env.CARDTRADER_API_TOKEN?.trim();
const args = process.argv.slice(2);
const option = (name, fallback) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : fallback; };
const outDir = resolve(option("--out", "public/data/cardtrader"));
const coverageOut = resolve(option("--coverage-out", ".cardtrader/coverage.json"));
const maxExpansions = Number.parseInt(option("--max-expansions", "0"), 10);
const skipPrices = args.includes("--skip-prices");

if (!token) {
  console.error("CardTrader-Token fehlt. Setze CARDTRADER_API_TOKEN ausschließlich zur Laufzeit.");
  process.exit(2);
}

const wait = (ms) => new Promise((done) => setTimeout(done, ms));

async function get(path) {
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    let response;
    try {
      response = await fetch(`${API_BASE}${path}`, { headers: { Accept: "application/json", Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(180_000) });
    } catch {
      if (attempt === 5) throw new Error(`${path}: CardTrader nicht erreichbar.`);
      await wait(attempt * 3_000);
      continue;
    }
    if (response.status === 401 || response.status === 403) throw new Error("CardTrader-Token fehlt, ist ungültig oder abgelaufen.");
    if (response.status === 429 && attempt < 5) {
      const retryAfter = Number.parseInt(response.headers.get("retry-after") ?? "", 10);
      await wait(Number.isFinite(retryAfter) ? Math.min(retryAfter * 1_000, 60_000) : attempt * 5_000);
      continue;
    }
    if (response.status >= 500 && attempt < 5) { await wait(attempt * 3_000); continue; }
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
  }
  throw new Error(`${path}: nicht abgeschlossen.`);
}

/** Collector numbers differ in padding ("001" vs "1") between providers; compare the normalised form. */
export function normalizeNumber(value) {
  const text = String(value ?? "").trim().toLowerCase().split("/")[0].replace(/[^a-z0-9]+/g, "");
  // "0RC1" (a leading zero before the letters) and "RC1" are the same number.
  return text.replace(/^0+(?=[a-z])/, "").replace(/^([a-z]*)0+(\d)/, "$1$2");
}

/* Condition ranks, best first. A listing counts for its own grade and every looser minimum condition. */
const CONDITION_RANK = { Mint: 0, "Near Mint": 0, "Slightly Played": 1, "Moderately Played": 2, Played: 3, Poor: 4 };
const LANGUAGE_OFFSET = { en: 0, de: 5 };
const PRICE_SLOTS = 10;

function aggregatePrices(listings, blueprintIds) {
  const prices = {};
  const offers = {};
  const stats = { listings: 0, used: 0, skipped: { graded: 0, vacation: 0, special: 0, edition: 0, currency: 0, language: 0, condition: 0, price: 0, other: 0 } };
  for (const [blueprintId, entries] of Object.entries(listings)) {
    if (!blueprintIds.has(Number(blueprintId)) || !Array.isArray(entries)) continue;
    const usable = [];
    for (const listing of entries) {
      stats.listings += 1;
      const properties = listing.properties_hash ?? {};
      const cents = listing.price_cents ?? listing.price?.cents;
      if (listing.graded) { stats.skipped.graded += 1; continue; }
      if (listing.on_vacation) { stats.skipped.vacation += 1; continue; }
      if (properties.signed === true || properties.altered === true) { stats.skipped.special += 1; continue; }
      if (properties.first_edition === true) { stats.skipped.edition += 1; continue; }
      if ((listing.price_currency ?? listing.price?.currency) !== "EUR") { stats.skipped.currency += 1; continue; }
      const offset = LANGUAGE_OFFSET[properties.pokemon_language];
      if (offset === undefined) { stats.skipped.language += 1; continue; }
      const rank = CONDITION_RANK[properties.condition];
      if (rank === undefined) { stats.skipped.condition += 1; continue; }
      if (!Number.isInteger(cents) || cents <= 0 || cents > 50_000_000) { stats.skipped.price += 1; continue; }
      const slots = (prices[blueprintId] ??= new Array(PRICE_SLOTS).fill(0));
      for (let bucket = rank; bucket < 5; bucket += 1) {
        const index = offset + bucket;
        if (slots[index] === 0 || cents < slots[index]) slots[index] = cents;
      }
      stats.used += 1;
      usable.push(listing);
    }
    const summary = summarizeOffers(usable);
    if (summary) offers[blueprintId] = summary;
  }
  return { prices, offers, stats };
}

/* Same shape the app validates (src/data/cardtrader/catalog.ts): numeric folder, plain file name. */
const IMAGE_PATH = /^\d+\/[A-Za-z0-9._()-]+\.(?:jpe?g|png|webp)$/i;

function imagePath(url) {
  if (typeof url !== "string" || !url.startsWith(IMAGE_PREFIX)) return undefined;
  const path = url.slice(IMAGE_PREFIX.length);
  return IMAGE_PATH.test(path) ? path : undefined;
}

function blueprintRecord(blueprint) {
  const properties = blueprint.fixed_properties ?? {};
  const record = { id: blueprint.id, n: String(properties.collector_number ?? ""), name: String(blueprint.name ?? "") };
  if (properties.pokemon_rarity) record.rar = String(properties.pokemon_rarity);
  const image = imagePath(blueprint.image_url);
  if (image) record.img = image;
  const cardmarket = (blueprint.card_market_ids ?? []).filter(Number.isInteger);
  if (cardmarket.length) record.cm = cardmarket;
  if (Number.isInteger(blueprint.tcg_player_id)) record.tp = blueprint.tcg_player_id;
  return record;
}

const lines = (items) => `[\n${items.map((item) => JSON.stringify(item)).join(",\n")}\n]`;

async function writeIfChanged(path, content) {
  await mkdir(dirname(path), { recursive: true });
  let current;
  try { current = await readFile(path, "utf8"); } catch { /* new file */ }
  if (current === content) return false;
  await writeFile(path, content);
  return true;
}

const review = JSON.parse(await readFile("data/marketplace/cardtrader-set-review.json", "utf8"));
const catalogToExpansion = Object.fromEntries(review.mappings.map((entry) => [entry.catalogKey, String(entry.cardtraderExpansionId)]));
let expansionIds = [...new Set(Object.values(catalogToExpansion))].sort((a, b) => Number(a) - Number(b));
if (maxExpansions > 0) expansionIds = expansionIds.slice(0, maxExpansions);

const expansions = asCollection(await get("/expansions"), "expansions");
const expansionById = new Map(expansions.map((expansion) => [String(expansion.id), expansion]));
const manifest = { expansions: 0, blueprints: 0, withImage: 0, withCardmarketId: 0, withTcgplayerId: 0, priced: 0, listingsUsed: 0, listingsSeen: 0, skipped: {}, missingExpansions: [] };
const perExpansion = {};
const written = { changed: 0, unchanged: 0 };

for (const expansionId of expansionIds) {
  const expansion = expansionById.get(expansionId);
  if (!expansion) { manifest.missingExpansions.push(expansionId); continue; }
  const blueprints = asCollection(await get(`/blueprints/export?${new URLSearchParams({ expansion_id: expansionId })}`), "blueprints")
    .filter((blueprint) => blueprint.category_id === SINGLES_CATEGORY_ID && Number.isInteger(blueprint.id))
    .sort((a, b) => a.id - b.id);
  const records = blueprints.map(blueprintRecord);
  const file = `${JSON.stringify({ id: Number(expansionId), code: expansion.code, name: expansion.name })}`.replace(/}$/, `,"blueprints":${lines(records)}}`);
  written[(await writeIfChanged(join(outDir, "expansions", `${expansionId}.json`), `${file}\n`)) ? "changed" : "unchanged"] += 1;
  manifest.expansions += 1;
  manifest.blueprints += records.length;
  manifest.withImage += records.filter((record) => record.img).length;
  manifest.withCardmarketId += records.filter((record) => record.cm).length;
  manifest.withTcgplayerId += records.filter((record) => record.tp).length;
  perExpansion[expansionId] = { name: expansion.name, code: expansion.code, records };

  if (!skipPrices) {
    await wait(300);
    const listings = await get(`/marketplace/products?${new URLSearchParams({ expansion_id: expansionId })}`);
    const { prices, offers, stats } = aggregatePrices(Array.isArray(listings) ? {} : listings, new Set(blueprints.map((blueprint) => blueprint.id)));
    const ordered = Object.fromEntries(Object.keys(prices).sort((a, b) => Number(a) - Number(b)).map((key) => [key, prices[key]]));
    const offerKeys = Object.keys(offers).filter((key) => ordered[key]).sort((a, b) => Number(a) - Number(b));
    const offerCounts = offerKeys.map((key) => `${JSON.stringify(key)}:${JSON.stringify(offers[key].counts)}`).join(",\n");
    const offerCountries = offerKeys.filter((key) => offers[key].countries.length).map((key) => `${JSON.stringify(key)}:${JSON.stringify(offers[key].countries.join(","))}`).join(",\n");
    const body = `{"id":${expansionId},"currency":"EUR","slots":["en:nm","en:ex","en:lp","en:pl","en:any","de:nm","de:ex","de:lp","de:pl","de:any"],"p":{\n${Object.entries(ordered).map(([key, slots]) => `${JSON.stringify(key)}:${JSON.stringify(slots)}`).join(",\n")}\n},"o":{\n${offerCounts}\n},"c":{\n${offerCountries}\n}}\n`;
    written[(await writeIfChanged(join(outDir, "prices", `${expansionId}.json`), body)) ? "changed" : "unchanged"] += 1;
    manifest.priced += Object.keys(ordered).length;
    manifest.listingsUsed += stats.used;
    manifest.listingsSeen += stats.listings;
    for (const [reason, count] of Object.entries(stats.skipped)) manifest.skipped[reason] = (manifest.skipped[reason] ?? 0) + count;
    perExpansion[expansionId].prices = ordered;
  }
  await wait(300);
  console.log(`expansion ${expansionId} ${expansion.name}: ${records.length} blueprints`);
}

// Drop files of expansions that are no longer mapped, so the folder mirrors the review file.
for (const folder of ["expansions", "prices"]) {
  try {
    for (const name of await readdir(join(outDir, folder))) {
      if (maxExpansions === 0 && !expansionIds.includes(name.replace(/\.json$/, ""))) await rm(join(outDir, folder, name));
    }
  } catch { /* folder not created yet */ }
}

const index = Object.fromEntries(Object.keys(catalogToExpansion).sort().map((key) => [key, Number(catalogToExpansion[key])]));
await writeIfChanged(join(outDir, "index.json"), `${JSON.stringify(index, null, 1)}\n`);
await writeIfChanged(join(outDir, "manifest.json"), `${JSON.stringify({
  schemaVersion: 1,
  source: "https://www.cardtrader.com/en-EU/docs/api/full/reference",
  permission: "Written confirmation from CardTrader support, 2026-10-20: images, prices and the other API data may be used; listing links included.",
  attribution: "Card images, product ids and prices via the CardTrader API (cardtrader.com).",
  imagePrefix: IMAGE_PREFIX,
  priceSlots: ["en:nm", "en:ex", "en:lp", "en:pl", "en:any", "de:nm", "de:ex", "de:lp", "de:pl", "de:any"],
  counts: { expansions: manifest.expansions, blueprints: manifest.blueprints, withImage: manifest.withImage, withCardmarketId: manifest.withCardmarketId, withTcgplayerId: manifest.withTcgplayerId, pricedBlueprints: manifest.priced },
  sample: maxExpansions > 0 ? { maxExpansions } : undefined,
}, null, 1)}\n`);

// --- Coverage against TCGdex: what do the CardTrader data add?
const semantic = JSON.parse(await readFile("public/data/semantic/card-artwork-search-v1.json", "utf8"));
const tcgdexBySet = new Map();
for (const row of semantic.cards) { const [id, , , name, number, setId] = row; (tcgdexBySet.get(setId) ?? tcgdexBySet.set(setId, []).get(setId)).push({ id, name, number }); }
// Optional audit file (cards TCGdex has no image for). Not tracked on every branch, so the sync does not depend on it.
const noImage = await readFile("cards-without-images.en.json", "utf8").then((text) => JSON.parse(text).cards, () => []);
const coverage = { generatedAt: new Date().toISOString(), setsChecked: 0, tcgdexCards: 0, matched: 0, cardtraderOnly: 0, tcgdexOnly: 0, noImageCards: noImage.length, noImageWithCardtraderImage: 0, cardtraderOnlyBySet: [] };
for (const [key, expansionId] of Object.entries(catalogToExpansion)) {
  if (!key.startsWith("en:") || !perExpansion[expansionId]) continue;
  const setId = key.slice(3);
  const tcgdex = tcgdexBySet.get(setId) ?? [];
  const byNumber = new Map();
  for (const record of perExpansion[expansionId].records) (byNumber.get(normalizeNumber(record.n)) ?? byNumber.set(normalizeNumber(record.n), []).get(normalizeNumber(record.n))).push(record);
  const tcgNumbers = new Set(tcgdex.map((card) => normalizeNumber(card.number)));
  coverage.setsChecked += 1;
  coverage.tcgdexCards += tcgdex.length;
  const matched = tcgdex.filter((card) => byNumber.has(normalizeNumber(card.number))).length;
  const ctOnly = [...byNumber.keys()].filter((number) => !tcgNumbers.has(number)).reduce((total, number) => total + byNumber.get(number).length, 0);
  coverage.matched += matched;
  coverage.cardtraderOnly += ctOnly;
  coverage.tcgdexOnly += tcgdex.length - matched;
  if (ctOnly > 0) coverage.cardtraderOnlyBySet.push({ setId, name: perExpansion[expansionId].name, tcgdex: tcgdex.length, cardtrader: perExpansion[expansionId].records.length, cardtraderOnly: ctOnly });
  for (const card of noImage.filter((entry) => entry.setId === setId)) {
    if ((byNumber.get(normalizeNumber(card.localId)) ?? []).some((record) => record.img)) coverage.noImageWithCardtraderImage += 1;
  }
}
coverage.cardtraderOnlyBySet.sort((a, b) => b.cardtraderOnly - a.cardtraderOnly);
coverage.manifest = manifest;
coverage.written = written;
await mkdir(dirname(coverageOut), { recursive: true });
await writeFile(coverageOut, `${JSON.stringify(coverage, null, 1)}\n`);
console.log(JSON.stringify({ ...coverage, cardtraderOnlyBySet: coverage.cardtraderOnlyBySet.slice(0, 10) }, null, 1));
