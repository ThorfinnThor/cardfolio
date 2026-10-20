/**
 * One-off, read-only probe of the CardTrader API shapes we need for the data integration: blueprints with
 * image URLs and identifiers, and marketplace listings with price, condition and language. It writes a small
 * trimmed sample (no seller identity, no token) so the integration can be designed against real data.
 * Usage: CARDTRADER_API_TOKEN=… node scripts/cardtrader-sample.mjs --out .cardtrader/sample.json
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { asCollection } from "./cardtrader-response.mjs";

const API_BASE = "https://api.cardtrader.com/api/v2";
const token = process.env.CARDTRADER_API_TOKEN?.trim();
if (!token) {
  console.error("CardTrader-Token fehlt. Setze CARDTRADER_API_TOKEN ausschließlich zur Laufzeit.");
  process.exit(2);
}
const args = process.argv.slice(2);
const out = resolve(args[args.indexOf("--out") + 1] || ".cardtrader/sample.json");

const wait = (ms) => new Promise((done) => setTimeout(done, ms));
async function get(path) {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await fetch(`${API_BASE}${path}`, { headers: { Accept: "application/json", Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(60_000) });
    if (response.status === 429 && attempt < 4) { await wait(Math.min(Number.parseInt(response.headers.get("retry-after") ?? "", 10) * 1000 || attempt * 3000, 60_000)); continue; }
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return { json: await response.json(), headers: Object.fromEntries([...response.headers].filter(([k]) => /^(x-ratelimit|ratelimit|retry-after|content-type)/i.test(k))) };
  }
  throw new Error(`${path}: failed`);
}

const review = JSON.parse(await readFile("data/marketplace/cardtrader-set-review.json", "utf8"));
const wanted = ["en:base1", "en:sv3pt5", "de:sv3pt5"];
const sample = { generatedAt: new Date().toISOString(), sets: {} };
for (const key of wanted) {
  const mapping = review.mappings.find((entry) => entry.catalogKey === key);
  if (!mapping) { sample.sets[key] = { error: "not mapped" }; continue; }
  const expansionId = mapping.cardtraderExpansionId;
  const blueprintsResponse = await get(`/blueprints/export?${new URLSearchParams({ expansion_id: expansionId })}`);
  const blueprints = asCollection(blueprintsResponse.json, "blueprints");
  const singles = blueprints.filter((blueprint) => blueprint.category_id === 73);
  await wait(400);
  const productsResponse = await get(`/marketplace/products?${new URLSearchParams({ expansion_id: expansionId })}`);
  const products = productsResponse.json;
  const byBlueprint = Array.isArray(products) ? { _array: products } : products;
  const blueprintIds = Object.keys(byBlueprint);
  const strip = (product) => ({ ...product, user: product.user ? { country: product.user.country_code ?? product.user.country, can_sell_via_hub: product.user.can_sell_via_hub } : undefined });
  sample.sets[key] = {
    expansionId,
    blueprintCount: blueprints.length,
    singlesCount: singles.length,
    blueprintsWithImage: singles.filter((blueprint) => blueprint.image_url).length,
    blueprintSample: singles.slice(0, 4),
    productsShape: Array.isArray(products) ? "array" : `object(${blueprintIds.length} keys)`,
    productBlueprintCount: blueprintIds.length,
    productTotal: blueprintIds.reduce((total, id) => total + (Array.isArray(byBlueprint[id]) ? byBlueprint[id].length : 0), 0),
    productSample: Object.fromEntries(blueprintIds.slice(0, 3).map((id) => [id, (byBlueprint[id] ?? []).slice(0, 4).map(strip)])),
    responseHeaders: { blueprints: blueprintsResponse.headers, products: productsResponse.headers },
  };
  await wait(400);
}
await mkdir(dirname(out), { recursive: true });
await writeFile(out, `${JSON.stringify(sample, null, 2)}\n`);
console.log(`Wrote ${out}`);
