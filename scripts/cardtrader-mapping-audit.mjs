import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  exactExpansionMatches,
  expansionReference,
  rankExpansionSuggestions,
} from "./cardtrader-set-matching.mjs";

const args = process.argv.slice(2);
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
const reviewed = new Map(review.mappings.map((mapping) => [mapping.catalogKey, mapping]));
const namesBySetId = new Map();
for (const set of sets) {
  const names = namesBySetId.get(set.id) ?? new Set();
  names.add(set.name);
  namesBySetId.set(set.id, names);
}

const decisions = sets.map((set) => {
  const comparisonNames = [...(namesBySetId.get(set.id) ?? new Set([set.name]))];
  const accepted = reviewed.get(set.catalogKey);
  if (accepted) {
    const expansion = expansions.find((candidate) => String(candidate.id) === String(accepted.cardtraderExpansionId));
    if (!expansion) throw new Error(`Reviewed mapping ${set.catalogKey} references an unknown CardTrader expansion.`);
    return {
      catalogKey: set.catalogKey,
      setId: set.id,
      setName: set.name,
      language: set.language,
      seriesName: set.series?.name,
      releaseDate: set.releaseDate,
      status: "verified",
      method: "manual-review",
      candidateExpansionIds: [String(accepted.cardtraderExpansionId)],
      candidateExpansions: [expansionReference(expansion)],
      suggestedExpansions: [],
    };
  }
  const candidates = exactExpansionMatches(comparisonNames, set.id, expansions);
  const method = candidates.length
    ? candidates.some((candidate) => candidate.name === set.name) ? "exact-name-or-code" : "exact-cross-language-name-or-code"
    : "none";
  return {
    catalogKey: set.catalogKey,
    setId: set.id,
    setName: set.name,
    language: set.language,
    seriesName: set.series?.name,
    releaseDate: set.releaseDate,
    comparisonNames,
    status: candidates.length === 1 ? "review-required" : candidates.length > 1 ? "ambiguous" : "unmapped",
    method,
    candidateExpansionIds: candidates.map((candidate) => String(candidate.id)),
    candidateExpansions: candidates.map(expansionReference),
    suggestedExpansions: candidates.length ? [] : rankExpansionSuggestions(comparisonNames, set.id, expansions),
  };
});

const counts = Object.fromEntries(["verified", "review-required", "ambiguous", "unmapped"].map((status) => [
  status,
  decisions.filter((decision) => decision.status === status).length,
]));
const report = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  snapshotGeneratedAt: snapshot.generatedAt,
  catalogSetCount: sets.length,
  cardtraderExpansionCount: expansions.length,
  counts,
  verifiedCoverage: sets.length ? counts.verified / sets.length : 0,
  decisions,
  policy: "Only entries in cardtrader-set-review.json are verified. Exact-name results remain review-required.",
};

await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ catalogSetCount: report.catalogSetCount, ...counts, outputPath }, null, 2));
