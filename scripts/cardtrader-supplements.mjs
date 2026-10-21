/**
 * Writes public/data/cardtrader/supplements.json: for each set in data/marketplace/cardtrader-supplement-sets.json,
 * the CardTrader blueprints whose collector number TCGdex does not list for that set. No CardTrader token is
 * needed; it reads the committed expansion files and the public TCGdex API.
 *
 *   node scripts/cardtrader-supplements.mjs [--check]     (--check only verifies the file is current)
 */
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const TCGDEX = "https://api.tcgdex.net/v2/en";
const OUT = resolve("public/data/cardtrader/supplements.json");
const check = process.argv.includes("--check");

/* Mirrors normalizeCollectorNumber in src/data/cardtrader/catalog.ts and scripts/cardtrader-sync.mjs. */
function normalizeNumber(value) {
  const text = String(value ?? "").trim().toLowerCase().split("/")[0].replace(/[^a-z0-9]+/g, "");
  return text.replace(/^0+(?=[a-z])/, "").replace(/^([a-z]*)0+(\d)/, "$1$2");
}

async function getJson(url) {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(30_000) });
      if (response.ok) return response.json();
      if (response.status < 500) throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (attempt === 4) throw new Error(`${url}: ${error.message}`);
    }
    await new Promise((done) => setTimeout(done, attempt * 1500));
  }
}

const config = JSON.parse(await readFile("data/marketplace/cardtrader-supplement-sets.json", "utf8"));
const index = JSON.parse(await readFile("public/data/cardtrader/index.json", "utf8"));
const sets = {};
for (const { catalogKey } of config.sets) {
  const [language, setId] = catalogKey.split(":");
  if (language !== "en") throw new Error(`${catalogKey}: only English sets are supported.`);
  const expansionId = index[catalogKey];
  if (!expansionId) throw new Error(`${catalogKey}: no verified CardTrader expansion.`);
  const expansion = JSON.parse(await readFile(`public/data/cardtrader/expansions/${expansionId}.json`, "utf8"));
  const tcgdexSet = await getJson(`${TCGDEX}/sets/${encodeURIComponent(setId)}`);
  const listed = new Set((tcgdexSet.cards ?? []).map((card) => normalizeNumber(card.localId)));
  const total = tcgdexSet.cardCount?.official || tcgdexSet.cardCount?.total || undefined;
  const missing = expansion.blueprints.filter((blueprint) => !listed.has(normalizeNumber(blueprint.n)));
  // A number shared by several blueprints (variants) would need its own identity; those are left out and reported.
  const byNumber = new Map();
  for (const blueprint of missing) byNumber.set(normalizeNumber(blueprint.n), [...(byNumber.get(normalizeNumber(blueprint.n)) ?? []), blueprint]);
  const unique = [...byNumber.values()].filter((group) => group.length === 1 && group[0].n.trim()).map((group) => group[0]);
  const skipped = missing.length - unique.length;
  sets[setId] = {
    setName: tcgdexSet.name,
    expansionId,
    total,
    tcgdexListed: listed.size,
    skippedAmbiguous: skipped,
    cards: unique.map(({ id, n, name, rar, img, cm, tp }) => ({ id, n, name, ...(rar ? { rar } : {}), ...(img ? { img } : {}), ...(cm ? { cm } : {}), ...(tp ? { tp } : {}) })),
  };
  console.log(`${catalogKey}: TCGdex lists ${listed.size}, CardTrader has ${expansion.blueprints.length}, supplement ${unique.length}, skipped ${skipped}`);
}

const content = `${JSON.stringify({ schemaVersion: 1, source: "CardTrader blueprints not listed by TCGdex", sets }, null, 1)}\n`;
if (check) {
  const current = await readFile(OUT, "utf8").catch(() => "");
  if (current !== content) { console.error("supplements.json is out of date. Run: node scripts/cardtrader-supplements.mjs"); process.exit(1); }
  console.log("supplements.json is current.");
} else {
  await writeFile(OUT, content);
  console.log(`Wrote ${OUT}`);
}
