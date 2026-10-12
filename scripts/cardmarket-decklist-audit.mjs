import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const TCGDEX_GRAPHQL_URL = "https://api.tcgdex.net/v2/graphql";
const CARDMARKET_PRODUCT_CATALOG_URL = "https://downloads.s3.cardmarket.com/productCatalog/productList/products_singles_6.json";
const DEFAULT_OUTPUT = "public/data/marketplace/cardmarket-decklist-identities.v1.json";

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function inline(value) {
  return String(value ?? "")
    .replace(/[\r\n\u0000-\u001f\u007f|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalized(value) {
  return inline(value).toLocaleLowerCase("en").replace(/[’‘]/g, "'");
}

function normalizedBaseName(value) {
  return normalized(value).replace(/[\s._'’-]+/gu, "");
}

function cardmarketBaseName(value) {
  return inline(value)
    .replace(/\s*δ$/u, " δ Delta Species")
    .replace(/\s*☆$/u, " Gold Star");
}

function parseCardmarketPokemonName(value) {
  const match = value.match(/^(.*?)\s*\[([^\]]+)\]\s*$/u);
  if (!match) return undefined;
  const productName = inline(match[1]);
  const baseName = inline(productName.replace(/\s+Lv\.[^ ]+$/iu, ""));
  const details = match[2].split("|").map(inline);
  return {
    line: inline([productName, ...details].join(" ")),
    baseName: normalizedBaseName(baseName),
    details: details.map(normalized),
  };
}

function tcgdexPokemonIdentity(card) {
  const baseName = cardmarketBaseName(card.name);
  const productName = card.level
    ? `${baseName} Lv.${inline(card.level).replace(/^lv\.?\s*/iu, "")}`
    : baseName;
  const details = [...(card.abilities ?? []), ...(card.attacks ?? [])]
    .filter(Boolean)
    .map((entry) => inline(entry.name))
    .filter(Boolean);
  let suffix = inline(card.suffix);
  if (suffix && productName.toLocaleLowerCase("en").includes(suffix.toLocaleLowerCase("en"))) suffix = "";
  return {
    line: inline([productName, ...details, suffix].filter(Boolean).join(" ")),
    baseName: normalizedBaseName(baseName),
    details: details.map(normalized),
  };
}

async function jsonFromFileOrUrl(file, url, init) {
  if (file) return JSON.parse(await readFile(path.resolve(file), "utf8"));
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}.`);
  return response.json();
}

const tcgdexQuery = `query CardmarketDecklistAudit {
  cards {
    id
    localId
    name
    category
    level
    suffix
    abilities { name }
    attacks { name }
    set { id name }
  }
}`;

const [setCatalog, tcgdexPayload, cardmarketPayload] = await Promise.all([
  jsonFromFileOrUrl("public/data/catalog/en-sets.json"),
  jsonFromFileOrUrl(argument("--tcgdex-file"), TCGDEX_GRAPHQL_URL, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ query: tcgdexQuery }),
  }),
  jsonFromFileOrUrl(argument("--cardmarket-file"), CARDMARKET_PRODUCT_CATALOG_URL),
]);

if (!Array.isArray(setCatalog.items) || !Array.isArray(tcgdexPayload?.data?.cards) || !Array.isArray(cardmarketPayload.products)) {
  throw new Error("Cardmarket decklist audit received an unexpected source format.");
}

const physicalSetIds = new Set(setCatalog.items.map((set) => set.id));
const exactProductNames = new Map();
const pokemonProductsByBaseName = new Map();

for (const product of cardmarketPayload.products) {
  if (typeof product?.name !== "string") continue;
  exactProductNames.set(normalized(product.name), inline(product.name));
  const parsed = parseCardmarketPokemonName(product.name);
  if (!parsed) continue;
  exactProductNames.set(normalized(parsed.line), parsed.line);
  const products = pokemonProductsByBaseName.get(parsed.baseName) ?? new Map();
  products.set(normalized(parsed.line), parsed);
  pokemonProductsByBaseName.set(parsed.baseName, products);
}

const identities = {};
const excludedExamples = [];
const audit = {
  catalogDeclaredCardCount: setCatalog.items.reduce((total, set) => total + Number(set.cardCount?.total ?? 0), 0),
  physicalCardCount: 0,
  verifiedCardCount: 0,
  exactIdentityCount: 0,
  correctedIdentityCount: 0,
  excludedCardCount: 0,
  pokemonCardCount: 0,
  nonPokemonCardCount: 0,
  unaddressableDeclaredCardCount: 0,
};

for (const card of tcgdexPayload.data.cards) {
  if (!card || !physicalSetIds.has(card.set?.id)) continue;
  audit.physicalCardCount += 1;
  let resolvedLine;
  let exact = false;

  if (card.category === "Pokemon") {
    audit.pokemonCardCount += 1;
    const identity = tcgdexPokemonIdentity(card);
    if (identity.details.length > 0) {
      resolvedLine = exactProductNames.get(normalized(identity.line));
      exact = Boolean(resolvedLine);
      if (!resolvedLine) {
        const candidates = [...(pokemonProductsByBaseName.get(identity.baseName)?.values() ?? [])]
          .filter((candidate) => identity.details.every((detail, index) => candidate.details[index] === detail))
          .map((candidate) => candidate.line);
        const uniqueCandidates = [...new Set(candidates)];
        if (uniqueCandidates.length === 1) resolvedLine = uniqueCandidates[0];
      }
    }
  } else {
    audit.nonPokemonCardCount += 1;
    resolvedLine = exactProductNames.get(normalized(card.name));
    exact = Boolean(resolvedLine);
  }

  if (resolvedLine) {
    identities[card.id] = resolvedLine;
    audit.verifiedCardCount += 1;
    if (exact) audit.exactIdentityCount += 1;
    else audit.correctedIdentityCount += 1;
  } else {
    audit.excludedCardCount += 1;
    if (excludedExamples.length < 100) {
      excludedExamples.push({ id: card.id, name: card.name, setId: card.set.id, setName: card.set.name });
    }
  }
}

if (audit.physicalCardCount !== audit.verifiedCardCount + audit.excludedCardCount) {
  throw new Error("Cardmarket decklist audit totals are inconsistent.");
}
audit.unaddressableDeclaredCardCount = Math.max(0, audit.catalogDeclaredCardCount - audit.physicalCardCount);

const sortedIdentities = Object.fromEntries(Object.entries(identities).sort(([left], [right]) => left.localeCompare(right, "en")));
const output = {
  format: "cardfolio-cardmarket-decklist-identities",
  version: 1,
  generatedAt: new Date().toISOString(),
  sources: {
    tcgdex: TCGDEX_GRAPHQL_URL,
    cardmarket: CARDMARKET_PRODUCT_CATALOG_URL,
    cardmarketCreatedAt: cardmarketPayload.createdAt,
  },
  audit,
  identities: sortedIdentities,
  excludedExamples,
};

const outputPath = path.resolve(argument("--out") ?? DEFAULT_OUTPUT);
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ output: outputPath, ...audit }, null, 2));
