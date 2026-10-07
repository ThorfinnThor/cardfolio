import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  exactExpansionMatches,
  expansionReference,
  rankExpansionSuggestions,
} from "./cardtrader-set-matching.mjs";

const args = process.argv.slice(2);
const TCGDEX_API_BASE = "https://api.tcgdex.net/v2/en";
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_ATTEMPTS = 3;

function requiredOption(name) {
  const index = args.indexOf(name);
  const value = index >= 0 ? args[index + 1] : undefined;
  if (!value) throw new Error(`${name} is required.`);
  return resolve(value);
}

function option(name, fallback) {
  const index = args.indexOf(name);
  return resolve(index >= 0 ? args[index + 1] : fallback);
}

function wait(milliseconds) {
  return new Promise((resolveWait) => setTimeout(resolveWait, milliseconds));
}

async function fetchTcgdexSet(setId) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(`${TCGDEX_API_BASE}/sets/${encodeURIComponent(setId)}`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (response.ok) return response.json();
      if (response.status < 500 || attempt === MAX_ATTEMPTS) {
        throw new Error(`TCGdex set ${setId} failed with HTTP ${response.status}.`);
      }
    } catch (error) {
      if (attempt === MAX_ATTEMPTS) throw error;
    }
    await wait(attempt * 1_000);
  }
  throw new Error(`TCGdex set ${setId} could not be loaded.`);
}

function caseFoldCardName(value) {
  return String(value ?? "").normalize("NFKC").trim().toLocaleLowerCase("en");
}

function normalizeCardName(value) {
  return caseFoldCardName(value)
    .normalize("NFKD")
    .replaceAll(/\p{Diacritic}/gu, "")
    .replaceAll(/[^a-z0-9]+/g, "");
}

function overlapCount(left, right) {
  let matches = 0;
  for (const value of left) if (value && right.has(value)) matches += 1;
  return matches;
}

function cardNameCoverage(tcgdexCards, cardtraderBlueprints) {
  const tcgdexCaseFolded = new Set(tcgdexCards.map((card) => caseFoldCardName(card.name)).filter(Boolean));
  const cardtraderCaseFolded = new Set(cardtraderBlueprints.map((blueprint) => caseFoldCardName(blueprint.name)).filter(Boolean));
  const tcgdexNormalized = new Set(tcgdexCards.map((card) => normalizeCardName(card.name)).filter(Boolean));
  const cardtraderNormalized = new Set(cardtraderBlueprints.map((blueprint) => normalizeCardName(blueprint.name)).filter(Boolean));
  const caseFoldedMatches = overlapCount(tcgdexCaseFolded, cardtraderCaseFolded);
  const normalizedMatches = overlapCount(tcgdexNormalized, cardtraderNormalized);
  return {
    status: "complete",
    sourceLanguage: "en",
    tcgdexCardCount: tcgdexCards.length,
    tcgdexUniqueNameCount: tcgdexCaseFolded.size,
    cardtraderUniqueNameCount: cardtraderCaseFolded.size,
    exactUniqueNameMatches: caseFoldedMatches,
    normalizedUniqueNameMatches: normalizedMatches,
    unmatchedTcgdexUniqueNames: Math.max(tcgdexNormalized.size - normalizedMatches, 0),
    exactCoverage: tcgdexCaseFolded.size ? caseFoldedMatches / tcgdexCaseFolded.size : 0,
    normalizedCoverage: tcgdexNormalized.size ? normalizedMatches / tcgdexNormalized.size : 0,
  };
}

const snapshotPath = requiredOption("--snapshot");
const outputPath = option("--out", ".cardtrader/mapping-audit.json");
const snapshot = JSON.parse(await readFile(snapshotPath, "utf8"));
const review = JSON.parse(await readFile(resolve("data/marketplace/cardtrader-set-review.json"), "utf8"));
const catalogs = await Promise.all(["en", "de"].map(async (language) => {
  const catalog = JSON.parse(await readFile(resolve(`public/data/catalog/${language}-sets.json`), "utf8"));
  return catalog.items.map((set) => ({ ...set, language, catalogKey: `${language}:${set.id}` }));
}));
const sets = catalogs.flat();
const expansions = snapshot.expansions.filter((expansion) => expansion.game_id === snapshot.pokemonGame.id);
const singlesCategoryId = snapshot.categories.find((category) => category.name?.trim() === "Pokémon Singles")?.id;
if (!singlesCategoryId) throw new Error("The snapshot has no Pokémon Singles category; card coverage cannot be audited.");
const singlesBlueprintsByExpansion = new Map();
for (const [expansionId, expansionBlueprints] of Object.entries(snapshot.blueprintsByExpansion ?? {})) {
  const singles = expansionBlueprints.filter((blueprint) => blueprint.category_id === singlesCategoryId);
  const collectorNumbers = new Set();
  let blueprintsWithCollectorNumber = 0;
  for (const blueprint of singles) {
    const collectorNumber = blueprint.editable_properties?.find((property) => property.name === "collector_number")?.default_value;
    if (typeof collectorNumber !== "string" || !collectorNumber.trim()) continue;
    blueprintsWithCollectorNumber += 1;
    collectorNumbers.add(collectorNumber.trim());
  }
  singlesBlueprintsByExpansion.set(expansionId, {
    count: singles.length,
    uniqueNames: new Set(singles.map((blueprint) => blueprint.name)).size,
    blueprintsWithCollectorNumber,
    uniqueCollectorNumbers: collectorNumbers.size,
  });
}
const reviewed = new Map(review.mappings.map((mapping) => [mapping.catalogKey, mapping]));
const namesBySetId = new Map();
for (const set of sets) {
  const names = namesBySetId.get(set.id) ?? new Set();
  names.add(set.name);
  namesBySetId.set(set.id, names);
}

const decisions = sets.map((set) => {
  const comparisonNames = [...(namesBySetId.get(set.id) ?? new Set([set.name]))];
  const tcgdexCardCount = set.cardCount ?? null;
  const accepted = reviewed.get(set.catalogKey);
  if (accepted) {
    const expansion = expansions.find((candidate) => String(candidate.id) === String(accepted.cardtraderExpansionId));
    if (!expansion) throw new Error(`Reviewed mapping ${set.catalogKey} references an unknown CardTrader expansion.`);
    const cardCoverage = singlesBlueprintsByExpansion.get(String(expansion.id)) ?? { count: 0, uniqueNames: 0, blueprintsWithCollectorNumber: 0, uniqueCollectorNumbers: 0 };
    return {
      catalogKey: set.catalogKey,
      setId: set.id,
      setName: set.name,
      language: set.language,
      seriesName: set.series?.name,
      releaseDate: set.releaseDate,
      tcgdexCardCount,
      status: "verified",
      method: "manual-review",
      candidateExpansionIds: [String(accepted.cardtraderExpansionId)],
      candidateExpansions: [{
        ...expansionReference(expansion),
        singlesBlueprintCount: cardCoverage.count,
        uniqueSinglesBlueprintNames: cardCoverage.uniqueNames,
        blueprintsWithCollectorNumber: cardCoverage.blueprintsWithCollectorNumber,
        uniqueCollectorNumbers: cardCoverage.uniqueCollectorNumbers,
      }],
      suggestedExpansions: [],
    };
  }
  const candidates = exactExpansionMatches(comparisonNames, expansions);
  const candidateExpansions = candidates.map((candidate) => {
    const cardCoverage = singlesBlueprintsByExpansion.get(String(candidate.id)) ?? { count: 0, uniqueNames: 0, blueprintsWithCollectorNumber: 0, uniqueCollectorNumbers: 0 };
    return {
      ...expansionReference(candidate),
      singlesBlueprintCount: cardCoverage.count,
      uniqueSinglesBlueprintNames: cardCoverage.uniqueNames,
      blueprintsWithCollectorNumber: cardCoverage.blueprintsWithCollectorNumber,
      uniqueCollectorNumbers: cardCoverage.uniqueCollectorNumbers,
    };
  });
  const method = candidates.length
    ? candidates.some((candidate) => candidate.name === set.name) ? "exact-name" : "exact-cross-language-name"
    : "none";
  return {
    catalogKey: set.catalogKey,
    setId: set.id,
    setName: set.name,
    language: set.language,
    seriesName: set.series?.name,
    releaseDate: set.releaseDate,
    tcgdexCardCount,
    comparisonNames,
    status: candidates.length === 1 ? "review-required" : candidates.length > 1 ? "ambiguous" : "unmapped",
    method,
    candidateExpansionIds: candidates.map((candidate) => String(candidate.id)),
    candidateExpansions,
    suggestedExpansions: candidates.length ? [] : rankExpansionSuggestions(comparisonNames, expansions).map((candidate) => {
      const cardCoverage = singlesBlueprintsByExpansion.get(String(candidate.id)) ?? { count: 0, uniqueNames: 0, blueprintsWithCollectorNumber: 0, uniqueCollectorNumbers: 0 };
      return {
        ...candidate,
        singlesBlueprintCount: cardCoverage.count,
        uniqueSinglesBlueprintNames: cardCoverage.uniqueNames,
        blueprintsWithCollectorNumber: cardCoverage.blueprintsWithCollectorNumber,
        uniqueCollectorNumbers: cardCoverage.uniqueCollectorNumbers,
      };
    }),
  };
});

const englishExactNameAuditCandidates = decisions.filter((decision) => (
  decision.language === "en"
  && decision.status === "review-required"
  && decision.candidateExpansionIds.length === 1
));
for (let index = 0; index < englishExactNameAuditCandidates.length; index += 8) {
  const batch = englishExactNameAuditCandidates.slice(index, index + 8);
  const results = await Promise.all(batch.map(async (decision) => {
    const expansionId = decision.candidateExpansionIds[0];
    try {
      const tcgdexSet = await fetchTcgdexSet(decision.setId);
      if (!Array.isArray(tcgdexSet.cards)) throw new Error(`TCGdex set ${decision.setId} has no card list.`);
      const cardtraderBlueprints = (snapshot.blueprintsByExpansion?.[expansionId] ?? [])
        .filter((blueprint) => blueprint.category_id === singlesCategoryId);
      return [decision.setId, expansionId, cardNameCoverage(tcgdexSet.cards, cardtraderBlueprints)];
    } catch {
      return [decision.setId, expansionId, {
        status: "unavailable",
        sourceLanguage: "en",
      }];
    }
  }));

  for (const [setId, expansionId, cardNameCoverage] of results) {
    for (const decision of decisions) {
      if (decision.setId !== setId || decision.candidateExpansionIds[0] !== expansionId) continue;
      decision.cardNameCoverage = cardNameCoverage;
    }
  }
}


const englishAliasAuditCandidates = decisions.filter((decision) => (
  decision.language === "en"
  && decision.status === "unmapped"
  && decision.suggestedExpansions.length > 0
));
for (let index = 0; index < englishAliasAuditCandidates.length; index += 8) {
  const batch = englishAliasAuditCandidates.slice(index, index + 8);
  const results = await Promise.all(batch.map(async (decision) => {
    try {
      const tcgdexSet = await fetchTcgdexSet(decision.setId);
      if (!Array.isArray(tcgdexSet.cards)) throw new Error(`TCGdex set ${decision.setId} has no card list.`);
      return [decision.catalogKey, decision.suggestedExpansions.map((suggestion) => {
        const cardtraderBlueprints = (snapshot.blueprintsByExpansion?.[suggestion.id] ?? [])
          .filter((blueprint) => blueprint.category_id === singlesCategoryId);
        return {
          expansionId: suggestion.id,
          ...cardNameCoverage(tcgdexSet.cards, cardtraderBlueprints),
        };
      })];
    } catch {
      return [decision.catalogKey, decision.suggestedExpansions.map((suggestion) => ({
        expansionId: suggestion.id,
        status: "unavailable",
        sourceLanguage: "en",
      }))];
    }
  }));

  for (const [catalogKey, suggestionCardNameCoverage] of results) {
    const decision = decisions.find((candidate) => candidate.catalogKey === catalogKey);
    if (decision) decision.suggestionCardNameCoverage = suggestionCardNameCoverage;
  }
}

const counts = Object.fromEntries(["verified", "review-required", "ambiguous", "unmapped"].map((status) => [
  status,
  decisions.filter((decision) => decision.status === status).length,
]));
const report = {
  schemaVersion: 4,
  generatedAt: new Date().toISOString(),
  snapshotGeneratedAt: snapshot.generatedAt,
  catalogSetCount: sets.length,
  cardtraderExpansionCount: expansions.length,
  counts,
  verifiedCoverage: sets.length ? counts.verified / sets.length : 0,
  decisions,
  policy: "Only entries in cardtrader-set-review.json are verified. Exact-name, fuzzy-name and card-name-overlap results remain review-required until manually reviewed. Card names are reduced to aggregate counts in this report.",
};

await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ catalogSetCount: report.catalogSetCount, ...counts, outputPath }, null, 2));
