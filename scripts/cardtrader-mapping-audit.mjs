import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

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

function normalize(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
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

const decisions = sets.map((set) => {
  const accepted = reviewed.get(set.catalogKey);
  if (accepted) {
    return {
      catalogKey: set.catalogKey,
      setName: set.name,
      status: "verified",
      method: "manual-review",
      candidateExpansionIds: [String(accepted.cardtraderExpansionId)],
    };
  }
  const candidates = expansions.filter((expansion) => normalize(expansion.name) === normalize(set.name));
  return {
    catalogKey: set.catalogKey,
    setName: set.name,
    status: candidates.length === 1 ? "review-required" : candidates.length > 1 ? "ambiguous" : "unmapped",
    method: candidates.length ? "exact-normalized-name" : "none",
    candidateExpansionIds: candidates.map((candidate) => String(candidate.id)),
  };
});

const counts = Object.fromEntries(["verified", "review-required", "ambiguous", "unmapped"].map((status) => [
  status,
  decisions.filter((decision) => decision.status === status).length,
]));
const report = {
  schemaVersion: 1,
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

