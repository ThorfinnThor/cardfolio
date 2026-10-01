import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const LANGUAGES = ["en", "de"];
const OUTPUT_DIRECTORY = join(process.cwd(), "public", "data", "catalog");
const MARKETPLACE_OUTPUT_DIRECTORY = join(process.cwd(), "public", "data", "marketplace");
const SEMANTIC_INDEX_PATH = join(process.cwd(), "public", "data", "semantic", "card-artwork-search-v1.json");
const SEMANTIC_COVERAGE_PATH = join(process.cwd(), "data", "semantic", "catalog-coverage.json");
const MINIMUM_ITEMS = 50;
const MAXIMUM_SHRINK_RATIO = 0.15;
const IMAGE_FALLBACK_LANGUAGES = ["en", "de", "es", "it", "pt", "fr"];
const TCGPLAYER_MASS_ENTRY_SOURCE = "https://www.tcgplayer.com/massentry?productline=Pokemon";
const TCGPLAYER_SET_CODES_URL = "https://mpapi.tcgplayer.com/v2/massentry/sets/3";
const TCGPLAYER_SEARCH_URL = "https://mp-search-api.tcgplayer.com/v1/search/request";

const TCGPLAYER_SET_ALIASES = {
  "2011bw": ["McDonald's Promos 2011"],
  "2012bw": ["McDonald's Promos 2012"],
  "2014xy": ["McDonald's Promos 2014"],
  "2015xy": ["McDonald's Promos 2015"],
  "2016xy": ["McDonald's Promos 2016"],
  "2017sm": ["McDonald's Promos 2017"],
  "2018sm": ["McDonald's Promos 2018"],
  "2019sm": ["McDonald's Promos 2019"],
  "2021swsh": ["McDonald's 25th Anniversary Promos"],
  "2022swsh": ["McDonald's Promos 2022"],
  "2023sv": ["McDonald's Promos 2023"],
  "2024sv": ["McDonald's Promos 2024"],
  "30th-c": ["ME: 30th Celebration Classic Collection"],
  base1: ["Base Set", "Base Set (Shadowless)"],
  basep: ["WoTC Promo"],
  bog: ["Best of Promos"],
  bwp: ["Black and White Promos"],
  cel25cc: ["Celebrations: Classic Collection"],
  dpp: ["Diamond and Pearl Promos"],
  ecard1: ["Expedition"],
  "ex5.5": ["Kids WB Promos"],
  exu: ["EX Unseen Forces"],
  hgssp: ["HGSS Promos"],
  g1: ["Generations", "Generations: Radiant Collection"],
  me01: ["ME01: Mega Evolution"],
  mee: ["MEE: Mega Evolution Energies"],
  mep: ["ME: Mega Evolution Promo"],
  miscp: ["Miscellaneous Cards & Products"],
  np: ["Nintendo Promos"],
  bw11: ["Legendary Treasures", "Legendary Treasures: Radiant Collection"],
  rc: ["Legendary Treasures: Radiant Collection"],
  ru1: ["Rumble"],
  sm1: ["SM Base Set"],
  smp: ["SM Promos"],
  sp: ["e-Reader Sample Cards"],
  sv01: ["SV01: Scarlet & Violet Base Set"],
  "sv03.5": ["SV: Scarlet & Violet 151"],
  sve: ["SVE: Scarlet & Violet Energies"],
  svp: ["SV: Scarlet & Violet Promo Cards"],
  "swsh10.5": ["Pokemon GO"],
  swsh1: ["SWSH01: Sword & Shield Base Set"],
  swshp: ["SWSH: Sword & Shield Promo Cards"],
  "tk-bw-e": ["BW Trainer Kit: Excadrill & Zoroark"],
  "tk-bw-z": ["BW Trainer Kit: Excadrill & Zoroark"],
  "tk-dp-l": ["DP Trainer Kit: Manaphy & Lucario"],
  "tk-dp-m": ["DP Trainer Kit: Manaphy & Lucario"],
  "tk-ex-latia": ["EX Trainer Kit 1: Latias & Latios"],
  "tk-ex-latio": ["EX Trainer Kit 1: Latias & Latios"],
  "tk-ex-m": ["EX Trainer Kit 2: Plusle & Minun"],
  "tk-ex-p": ["EX Trainer Kit 2: Plusle & Minun"],
  "tk-hs-g": ["HGSS Trainer Kit: Gyarados & Raichu"],
  "tk-hs-r": ["HGSS Trainer Kit: Gyarados & Raichu"],
  "tk-sm-l": ["SM Trainer Kit: Lycanroc & Alolan Raichu"],
  "tk-sm-r": ["SM Trainer Kit: Lycanroc & Alolan Raichu"],
  "tk-xy-b": ["XY Trainer Kit: Bisharp & Wigglytuff"],
  "tk-xy-latia": ["XY Trainer Kit: Latias & Latios"],
  "tk-xy-latio": ["XY Trainer Kit: Latias & Latios"],
  "tk-xy-n": ["XY Trainer Kit: Sylveon & Noivern"],
  "tk-xy-p": ["XY Trainer Kit: Pikachu Libre & Suicune"],
  "tk-xy-su": ["XY Trainer Kit: Pikachu Libre & Suicune"],
  "tk-xy-sy": ["XY Trainer Kit: Sylveon & Noivern"],
  "tk-xy-w": ["XY Trainer Kit: Bisharp & Wigglytuff"],
  wp: ["WoTC Promo"],
  xy1: ["XY Base Set"],
  xya: ["Alternate Art Promos"],
  xyp: ["XY Promos"],
};

const TCGPLAYER_UNAVAILABLE_SETS = {
  fut2020: "TCGplayer führt Pokémon Futsal 2020 nicht in der offiziellen Pokémon-Mass-Entry-Setcodeliste.",
  mfb: "TCGplayer führt My First Battle als Marketplace-Set, aber ohne offiziellen Pokémon-Mass-Entry-Setcode.",
};

const SEMANTIC_BLOCKED_SOURCES = {
  dc1: "TCGdex lists image references, but all checked source image variants return HTTP 404.",
};

function normalizeSet(item, seriesBySetId) {
  if (!item || typeof item !== "object") throw new Error("Set entry must be an object.");
  if (typeof item.id !== "string" || !item.id.trim()) throw new Error("Set entry has no ID.");
  if (typeof item.name !== "string" || !item.name.trim()) throw new Error(`Set ${item.id} has no name.`);
  const total = item.cardCount?.total;
  const official = item.cardCount?.official;
  if (!Number.isInteger(total) || total < 0 || !Number.isInteger(official) || official < 0) {
    throw new Error(`Set ${item.id} has invalid card counts.`);
  }
  const series = seriesBySetId.get(item.id);
  return {
    id: item.id,
    name: item.name,
    cardCount: { official, total },
    ...(series ? { series } : {}),
  };
}

async function fetchJson(language, path) {
  const response = await fetch(`https://api.tcgdex.net/v2/${language}/${path}`, {
    headers: { Accept: "application/json", "User-Agent": "Cardfolio public-data sync" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`TCGdex ${language}/${path} failed with HTTP ${response.status}.`);
  return response.json();
}

async function fetchRemoteJson(url, init, label) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, { ...init, signal: AbortSignal.timeout(30_000) });
      if (response.ok) return response.json();
      lastError = new Error(`${label} failed with HTTP ${response.status}.`);
      if (response.status < 500 && response.status !== 429) break;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
  }
  throw lastError instanceof Error ? lastError : new Error(`${label} failed.`);
}

function normalizeSetName(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/^((sv|swsh|sm|xy|ex|hgss|dp|bw|me)\d*|sve|mee)\s*(?:[-:]\s*)?/i, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizedCollectorPart(value) {
  const part = String(value ?? "").split("/")[0].trim().toUpperCase();
  const numeric = part.match(/^(\D*)(\d+)(\D*)$/);
  return numeric ? `${numeric[1]}${Number(numeric[2])}${numeric[3]}` : part;
}

function normalizedCardName(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s*\(delta species\)\s*/g, " delta ")
    .replace(/\s+delta$/g, " delta")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function mapWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  }));
  return results;
}

async function fetchTcgplayerProducts(setName) {
  const products = [];
  let from = 0;
  let total = Infinity;
  while (from < total) {
    const body = {
      algorithm: "sales_exp_fields_experiment",
      from,
      size: 50,
      filters: { term: { productLineName: ["pokemon"], productTypeName: ["Cards"], setName: [setName] }, range: {}, match: {} },
      listingSearch: {
        context: { cart: {} },
        filters: {
          term: { sellerStatus: "Live", channelId: 0 },
          range: { quantity: { gte: 1 } },
          exclude: { channelExclusion: 0 },
        },
      },
      context: { cart: {}, shippingCountry: "", userProfile: {} },
      settings: { useFuzzySearch: false },
      sort: { field: "product-sorting-name", order: "asc" },
    };
    const response = await fetchRemoteJson(
      `${TCGPLAYER_SEARCH_URL}?q=&isList=true`,
      { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify(body) },
      `TCGplayer products for ${setName}`,
    );
    const result = response?.results?.[0];
    if (!result || !Array.isArray(result.results) || !Number.isInteger(result.totalResults)) {
      throw new Error(`TCGplayer products for ${setName} returned an invalid response.`);
    }
    products.push(...result.results);
    total = result.totalResults;
    from += result.results.length;
    if (!result.results.length) break;
  }
  return products;
}

async function searchTcgplayerProducts(query) {
  const body = {
    algorithm: "sales_exp_fields_experiment",
    from: 0,
    size: 50,
    filters: { term: { productLineName: ["pokemon"], productTypeName: ["Cards"] }, range: {}, match: {} },
    listingSearch: {
      context: { cart: {} },
      filters: {
        term: { sellerStatus: "Live", channelId: 0 },
        range: { quantity: { gte: 1 } },
        exclude: { channelExclusion: 0 },
      },
    },
    context: { cart: {}, shippingCountry: "", userProfile: {} },
    settings: { useFuzzySearch: false },
    sort: { field: "product-sorting-name", order: "asc" },
  };
  const response = await fetchRemoteJson(
    `${TCGPLAYER_SEARCH_URL}?q=${encodeURIComponent(query)}&isList=false`,
    { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify(body) },
    `TCGplayer cross-set search for ${query}`,
  );
  const result = response?.results?.[0];
  if (!result || !Array.isArray(result.results)) {
    throw new Error(`TCGplayer cross-set search for ${query} returned an invalid response.`);
  }
  return result.results;
}

async function syncTcgplayerMetadata(englishSets) {
  const officialResponse = await fetchRemoteJson(
    TCGPLAYER_SET_CODES_URL,
    { headers: { Accept: "application/json", "User-Agent": "Cardfolio public-data sync" } },
    "TCGplayer set codes",
  );
  const officialSets = officialResponse?.results;
  if (!Array.isArray(officialSets) || officialSets.length < 150) {
    throw new Error("TCGplayer returned too few official Pokémon Mass Entry set codes.");
  }
  const officialByName = new Map(officialSets.map((set) => [set.name, set]));
  const officialByNormalizedName = new Map();
  for (const set of officialSets) {
    const key = normalizeSetName(set.name);
    const matches = officialByNormalizedName.get(key) ?? [];
    matches.push(set);
    officialByNormalizedName.set(key, matches);
  }

  const mappedSets = [];
  const unavailableSets = [];
  for (const set of englishSets) {
    const unavailableReason = TCGPLAYER_UNAVAILABLE_SETS[set.id];
    if (unavailableReason) {
      unavailableSets.push({ tcgdexSetId: set.id, tcgdexSetName: set.name, reason: unavailableReason });
      continue;
    }
    const aliasNames = TCGPLAYER_SET_ALIASES[set.id];
    const candidates = aliasNames
      ? aliasNames.map((name) => officialByName.get(name)).filter(Boolean)
      : officialByNormalizedName.get(normalizeSetName(set.name)) ?? [];
    if (!candidates.length) throw new Error(`No verified TCGplayer set mapping for ${set.id} (${set.name}).`);
    if (!aliasNames && candidates.length !== 1) {
      throw new Error(`Ambiguous TCGplayer set mapping for ${set.id} (${set.name}).`);
    }
    for (const candidate of candidates) {
      mappedSets.push({
        tcgdexSetId: set.id,
        tcgdexSetName: set.name,
        tcgplayerSetCode: candidate.code,
        tcgplayerSetName: candidate.name,
      });
    }
  }
  if (new Set([...mappedSets.map((mapping) => mapping.tcgdexSetId), ...unavailableSets.map((set) => set.tcgdexSetId)]).size !== englishSets.length) {
    throw new Error("TCGplayer coverage does not account for every physical TCGdex set.");
  }

  const uniqueTcgplayerSetNames = [...new Set(mappedSets.map((mapping) => mapping.tcgplayerSetName))];
  const productSets = await mapWithConcurrency(uniqueTcgplayerSetNames, 6, async (setName) => ({
    setName,
    products: await fetchTcgplayerProducts(setName),
  }));
  const productsBySetName = new Map(productSets.map((set) => [set.setName, set.products]));

  const cardMappingResults = await mapWithConcurrency(englishSets, 6, async (set) => {
    const setMappings = mappedSets.filter((mapping) => mapping.tcgdexSetId === set.id);
    const tcgdexSet = await fetchJson("en", `sets/${encodeURIComponent(set.id)}`);
    if (!Array.isArray(tcgdexSet?.cards)) throw new Error(`TCGdex set ${set.id} has no card list.`);
    const semanticCards = tcgdexSet.cards
      .filter((card) => typeof card.image === "string" && card.image.trim())
      .map((card) => ({ id: card.id, setId: set.id }));
    if (!setMappings.length) return { catalogCardCount: tcgdexSet.cards.length, mappings: [], unmatchedCards: [], semanticCards };
    const products = setMappings.flatMap((mapping) => (productsBySetName.get(mapping.tcgplayerSetName) ?? []).map((product) => ({
      product,
      mapping,
    })));
    const unmatchedCards = [];
    const mappings = tcgdexSet.cards.flatMap((card) => {
      const collectorPart = normalizedCollectorPart(card.localId);
      let matchingProducts = products
        .filter(({ product }) => normalizedCollectorPart(product.customAttributes?.number) === collectorPart);
      if (!matchingProducts.length) {
        const cardName = normalizedCardName(card.name);
        matchingProducts = products.filter(({ product }) => {
          const productName = normalizedCardName(product.productName);
          return productName === cardName
            || productName.startsWith(`${cardName} `)
            || cardName.startsWith(`${productName} `);
        });
      }
      const candidates = matchingProducts
        .map(({ product, mapping }) => ({
          productName: product.productName,
          collectorNumber: product.customAttributes.number,
          tcgplayerSetCode: mapping.tcgplayerSetCode,
          tcgplayerSetName: mapping.tcgplayerSetName,
          foilOnly: Boolean(product.foilOnly),
          productId: product.productId,
        }))
        .filter((candidate, index, all) => all.findIndex((other) => other.productId === candidate.productId) === index);
      if (candidates.length) return [{ tcgdexCardId: card.id, tcgdexName: card.name, candidates }];
      unmatchedCards.push({ card });
      return [];
    });
    return { catalogCardCount: tcgdexSet.cards.length, mappings, unmatchedCards, semanticCards };
  });
  const crossSetMappings = await mapWithConcurrency(
    cardMappingResults.flatMap((result) => result.unmatchedCards),
    4,
    async ({ card }) => {
      const products = await searchTcgplayerProducts(`${card.name} ${card.localId}`);
      const collectorPart = normalizedCollectorPart(card.localId);
      const cardName = normalizedCardName(card.name);
      const candidates = products.flatMap((product) => {
        if (normalizedCollectorPart(product.customAttributes?.number) !== collectorPart) return [];
        const productName = normalizedCardName(product.productName);
        if (productName !== cardName
          && !productName.startsWith(`${cardName} `)
          && !cardName.startsWith(`${productName} `)) return [];
        const normalizedOfficialSets = officialByNormalizedName.get(normalizeSetName(product.setName)) ?? [];
        const officialSet = officialByName.get(product.setName)
          ?? (normalizedOfficialSets.length === 1 ? normalizedOfficialSets[0] : undefined);
        if (!officialSet) return [];
        return [{
          productName: product.productName,
          collectorNumber: product.customAttributes.number,
          tcgplayerSetCode: officialSet.code,
          tcgplayerSetName: product.setName,
          foilOnly: Boolean(product.foilOnly),
          productId: product.productId,
        }];
      }).filter((candidate, index, all) => all.findIndex((other) => other.productId === candidate.productId) === index);
      return candidates.length
        ? { tcgdexCardId: card.id, tcgdexName: card.name, candidates }
        : undefined;
    },
  );
  const cardMappings = [
    ...cardMappingResults.flatMap((result) => result.mappings),
    ...crossSetMappings.filter(Boolean),
  ];
  const catalogCards = cardMappingResults.reduce((total, result) => total + result.catalogCardCount, 0);
  if (catalogCards < 20_000 || cardMappings.length / catalogCards < 0.99) {
    throw new Error(`TCGplayer card coverage fell to ${cardMappings.length}/${catalogCards}; refusing partial metadata.`);
  }
  const requiredProducts = [
    { cardId: "xy8-20", code: "BKT", name: "Typhlosion", number: "20/162" },
    { cardId: "neo4-10", code: "N4", name: "Dark Typhlosion", number: "010/105" },
    { cardId: "ex15-12", code: "DF", name: "Typhlosion (Delta Species)", number: "12/101" },
    { cardId: "base1-8", code: "PR", name: "Machamp - 8/102 (Base Set Shadowless)", number: "008/102" },
  ];
  for (const required of requiredProducts) {
    const mapping = cardMappings.find((candidate) => candidate.tcgdexCardId === required.cardId);
    if (!mapping?.candidates.some((candidate) => candidate.tcgplayerSetCode === required.code
      && candidate.productName === required.name
      && candidate.collectorNumber === required.number)) {
      throw new Error(`Required TCGplayer regression mapping is missing for ${required.cardId}.`);
    }
  }

  const now = new Date().toISOString();
  await mkdir(MARKETPLACE_OUTPUT_DIRECTORY, { recursive: true });
  await writeFile(
    join(MARKETPLACE_OUTPUT_DIRECTORY, "tcgplayer-set-mappings.json"),
    `${JSON.stringify({
      format: "cardfolio-tcgplayer-set-mappings",
      version: 1,
      source: TCGPLAYER_MASS_ENTRY_SOURCE,
      sourceApi: TCGPLAYER_SET_CODES_URL,
      verifiedAt: now,
      catalogSetCount: englishSets.length,
      mappedSetCount: new Set(mappedSets.map((mapping) => mapping.tcgdexSetId)).size,
      mappings: mappedSets,
      unavailable: unavailableSets,
    }, null, 2)}\n`,
    "utf8",
  );
  await writeFile(
    join(MARKETPLACE_OUTPUT_DIRECTORY, "tcgplayer-card-mappings.json"),
    `${JSON.stringify({
      format: "cardfolio-tcgplayer-card-mappings",
      version: 1,
      source: TCGPLAYER_SEARCH_URL,
      verifiedAt: now,
      catalogCardCount: catalogCards,
      mappedCardCount: cardMappings.length,
      items: cardMappings,
    })}\n`,
    "utf8",
  );
  return {
    officialSetCodes: officialSets.length,
    mappedSets: new Set(mappedSets.map((mapping) => mapping.tcgdexSetId)).size,
    unavailableSets: unavailableSets.length,
    catalogCards,
    mappedCards: cardMappings.length,
    unmappedCards: catalogCards - cardMappings.length,
    semanticCards: cardMappingResults.flatMap((result) => result.semanticCards),
  };
}

async function writeSemanticCoverage(semanticCards) {
  const index = JSON.parse(await readFile(SEMANTIC_INDEX_PATH, "utf8"));
  if (!Array.isArray(index.cards)) throw new Error("Semantic artwork index has no cards array.");
  const uniqueSourceCards = [...new Map(semanticCards.map((card) => [card.id, card])).values()]
    .sort((left, right) => left.id.localeCompare(right.id));
  const sourceIds = new Set(uniqueSourceCards.map((card) => card.id));
  const indexedIds = new Set(index.cards.map((card) => card[0]));
  const blockedSources = Object.entries(SEMANTIC_BLOCKED_SOURCES).map(([setId, reason]) => ({
    setId,
    cardCount: uniqueSourceCards.filter((card) => card.setId === setId).length,
    reason,
  }));
  const blockedSetIds = new Set(blockedSources.map((source) => source.setId));
  const backlogIds = uniqueSourceCards
    .filter((card) => !blockedSetIds.has(card.setId) && !indexedIds.has(card.id))
    .map((card) => card.id);
  const orphanedIndexIds = [...indexedIds].filter((id) => !sourceIds.has(id)).sort();
  const blockedSourceCardCount = blockedSources.reduce((total, source) => total + source.cardCount, 0);
  const coverage = {
    format: "cardfolio-semantic-catalog-coverage",
    version: 1,
    indexedCardCount: indexedIds.size,
    eligibleSourceCardCount: uniqueSourceCards.length,
    reviewedCoverageCount: uniqueSourceCards.filter((card) => indexedIds.has(card.id)).length,
    backlogCount: backlogIds.length,
    backlogIds,
    blockedSourceCardCount,
    blockedSources,
    orphanedIndexCount: orphanedIndexIds.length,
    orphanedIndexIds,
  };
  await mkdir(dirname(SEMANTIC_COVERAGE_PATH), { recursive: true });
  await writeFile(SEMANTIC_COVERAGE_PATH, `${JSON.stringify(coverage, null, 2)}\n`, "utf8");
  if (backlogIds.length) console.warn(`Semantic artwork index has ${backlogIds.length} untagged eligible cards.`);
  return coverage;
}

async function imageExists(baseUrl) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/high.webp`, {
        method: "HEAD",
        headers: { "User-Agent": "Cardfolio public-data sync" },
        signal: AbortSignal.timeout(20_000),
      });
      if (response.ok) return true;
      if (response.status < 500 && response.status !== 429) return false;
    } catch {
      // Retry transient network failures below.
    }
    await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
  }
  throw new Error(`Could not verify card image ${baseUrl}.`);
}

// TCGdex leaves `image` empty for many English cards although the same print is
// on assets.tcgdex.net (unlinked in English, or scanned in another language).
// Record one verified external image reference per such card; no bytes are stored.
async function syncImageFallbacks(englishSets) {
  const setsWithCards = await mapWithConcurrency(englishSets, 6, async (set) => {
    const tcgdexSet = await fetchJson("en", `sets/${encodeURIComponent(set.id)}`);
    if (!Array.isArray(tcgdexSet?.cards)) throw new Error(`TCGdex set ${set.id} has no card list.`);
    return { set, cards: tcgdexSet.cards };
  });
  const cardsWithoutImage = setsWithCards.flatMap(({ set, cards }) => set.series
    ? cards.filter((card) => !card.image).map((card) => ({ set, card }))
    : []);
  const resolved = await mapWithConcurrency(cardsWithoutImage, 6, async ({ set, card }) => {
    for (const language of IMAGE_FALLBACK_LANGUAGES) {
      const baseUrl = [language, set.series.id, set.id, card.localId.trim()]
        .map((segment) => encodeURIComponent(segment))
        .join("/");
      if (await imageExists(`https://assets.tcgdex.net/${baseUrl}`)) {
        return [card.id, `https://assets.tcgdex.net/${baseUrl}`];
      }
    }
    return undefined;
  });
  const items = Object.fromEntries(resolved.filter(Boolean).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(
    join(OUTPUT_DIRECTORY, "en-image-fallbacks.json"),
    `${JSON.stringify({
      format: "cardfolio-image-fallbacks",
      version: 1,
      source: "tcgdex",
      language: "en",
      fallbackLanguages: IMAGE_FALLBACK_LANGUAGES,
      items,
    }, null, 2)}\n`,
    "utf8",
  );
  return { cardsWithoutImage: cardsWithoutImage.length, fallbacks: Object.keys(items).length };
}

async function fetchSeriesMetadata(language) {
  const summaries = await fetchJson(language, "series");
  if (!Array.isArray(summaries)) throw new Error(`TCGdex ${language} series response is not an array.`);

  const seriesBySetId = new Map();
  const digitalSetIds = new Set();
  for (const summary of summaries) {
    if (!summary || typeof summary.id !== "string" || !summary.id.trim()) {
      throw new Error(`TCGdex ${language} series entry has no ID.`);
    }
    const detail = await fetchJson(language, `series/${encodeURIComponent(summary.id)}`);
    if (!detail || typeof detail.name !== "string" || !Array.isArray(detail.sets)) {
      throw new Error(`TCGdex ${language} series ${summary.id} is invalid.`);
    }
    for (const set of detail.sets) {
      if (!set || typeof set.id !== "string" || !set.id.trim()) {
        throw new Error(`TCGdex ${language} series ${summary.id} contains an invalid set.`);
      }
      if (summary.id === "tcgp") {
        digitalSetIds.add(set.id);
      } else {
        seriesBySetId.set(set.id, { id: summary.id, name: detail.name });
      }
    }
  }
  return { digitalSetIds, seriesBySetId };
}

async function readPreviousCount(path) {
  try {
    const previous = JSON.parse(await readFile(path, "utf8"));
    return Array.isArray(previous.items) ? previous.items.length : 0;
  } catch (error) {
    if (error?.code === "ENOENT") return 0;
    throw error;
  }
}

async function syncLanguage(language) {
  const { digitalSetIds, seriesBySetId } = await fetchSeriesMetadata(language);
  const raw = await fetchJson(language, "sets");
  if (!Array.isArray(raw)) throw new Error(`TCGdex ${language} sets response is not an array.`);
  const items = raw
    .filter((item) => !digitalSetIds.has(item?.id))
    .map((item) => normalizeSet(item, seriesBySetId))
    .sort((a, b) => a.id.localeCompare(b.id));
  if (items.length < MINIMUM_ITEMS) throw new Error(`TCGdex ${language} returned only ${items.length} sets.`);

  const path = join(OUTPUT_DIRECTORY, `${language}-sets.json`);
  const previousCount = await readPreviousCount(path);
  if (previousCount > 0 && items.length < previousCount * (1 - MAXIMUM_SHRINK_RATIO)) {
    throw new Error(`TCGdex ${language} set count shrank from ${previousCount} to ${items.length}; refusing update.`);
  }
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify({ source: "tcgdex", language, items }, null, 2)}\n`, "utf8");
  return items.length;
}

const counts = {};
for (const language of LANGUAGES) counts[language] = await syncLanguage(language);
const englishCatalog = JSON.parse(await readFile(join(OUTPUT_DIRECTORY, "en-sets.json"), "utf8"));
const tcgplayerResult = await syncTcgplayerMetadata(englishCatalog.items);
const { semanticCards, ...tcgplayer } = tcgplayerResult;
const semanticCoverage = await writeSemanticCoverage(semanticCards);
const imageFallbacks = await syncImageFallbacks(englishCatalog.items);
await writeFile(
  join(OUTPUT_DIRECTORY, "manifest.json"),
  `${JSON.stringify({ format: "cardfolio-public-catalog", version: 3, source: "tcgdex", counts, tcgplayer, imageFallbacks }, null, 2)}\n`,
  "utf8",
);
console.log(`Validated public catalog and marketplace metadata: ${JSON.stringify({ counts, tcgplayer, semanticCoverage, imageFallbacks })}`);
