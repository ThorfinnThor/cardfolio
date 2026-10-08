import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

function nonEmptyId(value) {
  if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) return String(value);
  if (typeof value === "string" && value.trim()) return value.trim();
  return undefined;
}

function idsFromBlueprint(blueprint) {
  const rawCardmarket = Array.isArray(blueprint.card_market_ids) ? blueprint.card_market_ids : [];
  const normalizedCardmarket = rawCardmarket.map(nonEmptyId);
  const cardmarket = [...new Set(normalizedCardmarket.filter(Boolean))];
  const tcgplayer = nonEmptyId(blueprint.tcg_player_id);
  return {
    cardmarket,
    tcgplayer: tcgplayer ? [tcgplayer] : [],
    invalidCardmarketReferences: normalizedCardmarket.filter((value) => !value).length,
    invalidTcgplayerReferences: blueprint.tcg_player_id == null || tcgplayer ? 0 : 1,
  };
}

function increment(index, values, blueprintKey) {
  for (const value of values) {
    const keys = index.get(value) ?? new Set();
    keys.add(blueprintKey);
    index.set(value, keys);
  }
}

function summarizeScope(rows) {
  const cardmarketIndex = new Map();
  const tcgplayerIndex = new Map();
  const normalized = rows.map((row, index) => {
    const ids = idsFromBlueprint(row.blueprint);
    const blueprintKey = nonEmptyId(row.blueprint.id) ?? `invalid-${index}`;
    increment(cardmarketIndex, ids.cardmarket, blueprintKey);
    increment(tcgplayerIndex, ids.tcgplayer, blueprintKey);
    return { ...ids, blueprintKey };
  });

  const uniqueCardmarket = new Set([...cardmarketIndex].filter(([, keys]) => keys.size === 1).map(([id]) => id));
  const uniqueTcgplayer = new Set([...tcgplayerIndex].filter(([, keys]) => keys.size === 1).map(([id]) => id));
  const duplicateCardmarket = [...cardmarketIndex].filter(([, keys]) => keys.size > 1);
  const duplicateTcgplayer = [...tcgplayerIndex].filter(([, keys]) => keys.size > 1);
  const sharedCardmarketBlueprints = new Set(duplicateCardmarket.flatMap(([, keys]) => [...keys]));
  const sharedTcgplayerBlueprints = new Set(duplicateTcgplayer.flatMap(([, keys]) => [...keys]));
  const blueprintsWithUniqueCardmarketId = normalized.filter((row) => row.cardmarket.some((id) => uniqueCardmarket.has(id))).length;
  const blueprintsWithUniqueTcgplayerId = normalized.filter((row) => row.tcgplayer.some((id) => uniqueTcgplayer.has(id))).length;
  const blueprintsWithAnyUniqueExternalId = normalized.filter((row) => (
    row.cardmarket.some((id) => uniqueCardmarket.has(id))
    || row.tcgplayer.some((id) => uniqueTcgplayer.has(id))
  )).length;

  return {
    blueprintCount: rows.length,
    blueprintsWithCardmarketIds: normalized.filter((row) => row.cardmarket.length).length,
    blueprintsWithTcgplayerId: normalized.filter((row) => row.tcgplayer.length).length,
    blueprintsWithBothProviders: normalized.filter((row) => row.cardmarket.length && row.tcgplayer.length).length,
    blueprintsWithNeitherProvider: normalized.filter((row) => !row.cardmarket.length && !row.tcgplayer.length).length,
    cardmarketIdReferences: normalized.reduce((total, row) => total + row.cardmarket.length, 0),
    distinctCardmarketIdValues: cardmarketIndex.size,
    duplicateCardmarketIdValues: duplicateCardmarket.length,
    blueprintsSharingCardmarketId: sharedCardmarketBlueprints.size,
    blueprintsWithUniqueCardmarketId,
    tcgplayerIdReferences: normalized.reduce((total, row) => total + row.tcgplayer.length, 0),
    distinctTcgplayerIdValues: tcgplayerIndex.size,
    duplicateTcgplayerIdValues: duplicateTcgplayer.length,
    blueprintsSharingTcgplayerId: sharedTcgplayerBlueprints.size,
    blueprintsWithUniqueTcgplayerId,
    blueprintsWithAnyUniqueExternalId,
    invalidBlueprintIdentifiers: rows.filter((row) => !nonEmptyId(row.blueprint.id)).length,
    invalidCardmarketIdReferences: normalized.reduce((total, row) => total + row.invalidCardmarketReferences, 0),
    invalidTcgplayerIdReferences: normalized.reduce((total, row) => total + row.invalidTcgplayerReferences, 0),
  };
}

export function buildBlueprintIdAudit(snapshot, review) {
  if (!snapshot || typeof snapshot !== "object" || !snapshot.blueprintsByExpansion || typeof snapshot.blueprintsByExpansion !== "object") {
    throw new Error("CardTrader discovery snapshot has no blueprint catalog.");
  }
  if (!Array.isArray(snapshot.summary?.cardCategoryIds) || !snapshot.summary.cardCategoryIds.length) {
    throw new Error("CardTrader discovery snapshot has no verified Pokémon Singles category.");
  }
  if (!review || typeof review !== "object" || !Array.isArray(review.mappings)) {
    throw new Error("CardTrader set review has no verified mappings.");
  }

  const categoryIds = new Set(snapshot.summary.cardCategoryIds.map(String));
  const verifiedExpansionIds = new Set(review.mappings.map((mapping) => nonEmptyId(mapping.cardtraderExpansionId)).filter(Boolean));
  const rows = Object.entries(snapshot.blueprintsByExpansion).flatMap(([expansionId, blueprints]) => (
    Array.isArray(blueprints)
      ? blueprints
        .filter((blueprint) => blueprint && typeof blueprint === "object" && categoryIds.has(String(blueprint.category_id)))
        .map((blueprint) => ({ expansionId, blueprint }))
      : []
  ));
  const verifiedRows = rows.filter((row) => verifiedExpansionIds.has(String(row.expansionId)));

  return {
    schemaVersion: 1,
    generatedAt: snapshot.generatedAt,
    provider: "cardtrader",
    scope: {
      category: "Pokémon Singles",
      sampledExpansionCount: snapshot.summary.sampledExpansionCount ?? Object.keys(snapshot.blueprintsByExpansion).length,
      fullCatalog: snapshot.summary.sampledExpansionCount === snapshot.summary.expansionCount,
      verifiedLocaleMappingCount: review.mappings.length,
      uniqueVerifiedExpansionCount: verifiedExpansionIds.size,
    },
    allPokemonSingles: summarizeScope(rows),
    verifiedExpansions: summarizeScope(verifiedRows),
    interpretation: {
      automaticVerificationRule: "Only an external ID that resolves to exactly one Pokémon Singles blueprint in the audited scope is an automatic candidate.",
      expansionMappingIsNotBlueprintMapping: true,
      rawExternalIdsPublished: false,
      blueprintRowsPublished: false,
      imageUrlsPublished: false,
      featureActivationChanged: false,
    },
  };
}

function option(args, name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
}

async function main() {
  const args = process.argv.slice(2);
  const snapshotPath = resolve(option(args, "--snapshot", ".cardtrader/discovery.json"));
  const reviewPath = resolve(option(args, "--review", "data/marketplace/cardtrader-set-review.json"));
  const outputPath = resolve(option(args, "--out", ".cardtrader/blueprint-id-audit.json"));
  const snapshot = JSON.parse(await readFile(snapshotPath, "utf8"));
  const review = JSON.parse(await readFile(reviewPath, "utf8"));
  const audit = buildBlueprintIdAudit(snapshot, review);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(audit, null, 2)}\n`, { mode: 0o600 });
  console.log(`Wrote redacted CardTrader blueprint ID audit to ${outputPath}`);
  console.log(JSON.stringify(audit, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
