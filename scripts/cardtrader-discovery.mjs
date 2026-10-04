import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const API_BASE = "https://api.cardtrader.com/api/v2";
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_ATTEMPTS = 3;
const token = process.env.CARDTRADER_API_TOKEN?.trim();
const args = process.argv.slice(2);

function option(name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
}

function positiveInteger(value, label) {
  if (!/^\d+$/.test(String(value))) throw new Error(`${label} must be a non-negative integer.`);
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 0) throw new Error(`${label} must be a non-negative integer.`);
  return parsed;
}

if (!token) {
  console.error("CardTrader-Token fehlt. Setze CARDTRADER_API_TOKEN ausschließlich zur Laufzeit.");
  process.exit(2);
}

const outputPath = resolve(option("--out", ".cardtrader/discovery.json"));
const summaryOutput = option("--summary-out", "");
const summaryOutputPath = summaryOutput ? resolve(summaryOutput) : undefined;
const maxExpansions = positiveInteger(option("--max-expansions", "0"), "--max-expansions");

function wait(milliseconds) {
  return new Promise((resolveWait) => setTimeout(resolveWait, milliseconds));
}

function retryDelay(response, attempt) {
  const retryAfter = Number.parseInt(response.headers.get("retry-after") ?? "", 10);
  return Number.isFinite(retryAfter) ? Math.min(retryAfter * 1_000, 60_000) : attempt * 2_000;
}

async function get(path) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    let response;
    try {
      response = await fetch(`${API_BASE}${path}`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      throw new Error(`${path}: CardTrader ist nicht erreichbar oder die Anfrage wurde nach 30 Sekunden abgebrochen.`);
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error("CardTrader-Token fehlt, ist ungültig oder abgelaufen. Prüfe CARDTRADER_API_TOKEN.");
    }
    if (response.status === 429 && attempt < MAX_ATTEMPTS) {
      await wait(retryDelay(response, attempt));
      continue;
    }
    if (response.status === 429) {
      throw new Error("CardTrader begrenzt die Anfragen. Warte und starte den read-only Audit später erneut.");
    }
    if (!response.ok) throw new Error(`${path}: CardTrader-Anfrage fehlgeschlagen (HTTP ${response.status}).`);
    return response.json();
  }

  throw new Error(`${path}: CardTrader-Anfrage konnte nicht abgeschlossen werden.`);
}

const info = await get("/info");
const games = await get("/games");
const pokemon = games.find((game) => /pok[eé]mon/i.test(`${game.name} ${game.display_name}`));
if (!pokemon) throw new Error("The CardTrader games response contains no Pokémon game.");

const categories = await get(`/categories?${new URLSearchParams({ game_id: String(pokemon.id) })}`);
const expansions = (await get("/expansions")).filter((expansion) => expansion.game_id === pokemon.id);
const selectedExpansions = maxExpansions > 0 ? expansions.slice(0, maxExpansions) : expansions;
const blueprintsByExpansion = {};

// Catalog endpoints share the global API limit. Small batches keep this audit polite and reproducible.
for (let index = 0; index < selectedExpansions.length; index += 4) {
  const batch = selectedExpansions.slice(index, index + 4);
  const results = await Promise.all(batch.map(async (expansion) => [
    String(expansion.id),
    await get(`/blueprints/export?${new URLSearchParams({ expansion_id: String(expansion.id) })}`),
  ]));
  Object.assign(blueprintsByExpansion, Object.fromEntries(results));
  if (index + batch.length < selectedExpansions.length) await wait(300);
}

const blueprints = Object.values(blueprintsByExpansion).flat();
const snapshot = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  sources: {
    reference: "https://www.cardtrader.com/en-EU/docs/api/full/reference",
    terms: "https://static.cardtrader.com/en/pages/terms-of-service",
  },
  authentication: { verified: Boolean(info?.id) },
  pokemonGame: pokemon,
  categories,
  expansions,
  blueprintsByExpansion,
  summary: {
    expansionCount: expansions.length,
    sampledExpansionCount: selectedExpansions.length,
    blueprintCount: blueprints.length,
    blueprintImages: blueprints.filter((blueprint) => Boolean(blueprint.image_url)).length,
    missingBlueprintImages: blueprints.filter((blueprint) => !blueprint.image_url).length,
    propertyNames: [...new Set([
      ...categories.flatMap((category) => category.properties ?? []),
      ...blueprints.flatMap((blueprint) => blueprint.editable_properties ?? []),
    ].map((property) => property.name))].sort(),
  },
  marketplaceSamples: {
    status: "not-requested",
    reason: "Market APIs require separate written approval. This discovery script never calls cart or purchase endpoints.",
  },
};

const publicSummary = {
  schemaVersion: 1,
  generatedAt: snapshot.generatedAt,
  sources: snapshot.sources,
  authentication: snapshot.authentication,
  requestedEndpoints: ["/info", "/games", "/categories", "/expansions", "/blueprints/export"],
  pokemonGame: {
    id: pokemon.id,
    name: pokemon.name,
    displayName: pokemon.display_name,
  },
  summary: snapshot.summary,
  sample: {
    maxExpansions,
    isFullCatalog: maxExpansions === 0,
  },
  excludedData: [
    "token",
    "authorization-header",
    "shared_secret",
    "account-identifiers",
    "raw-blueprints",
    "image-urls",
    "marketplace-products",
    "prices",
    "wishlists",
    "cart",
    "purchases",
  ],
  featureActivation: {
    catalog: false,
    images: false,
    prices: false,
    wishlist: false,
    commerce: false,
  },
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, { mode: 0o600 });
console.log(`Wrote redacted CardTrader discovery snapshot to ${outputPath}`);
if (summaryOutputPath) {
  await mkdir(dirname(summaryOutputPath), { recursive: true });
  await writeFile(summaryOutputPath, `${JSON.stringify(publicSummary, null, 2)}\n`, { mode: 0o600 });
  console.log(`Wrote public-safe CardTrader summary to ${summaryOutputPath}`);
}
console.log(JSON.stringify(snapshot.summary, null, 2));
