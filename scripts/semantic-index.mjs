import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

const root = process.cwd();
const manifestPath = join(root, "data", "semantic", "card-artwork-tags-v1.manifest.json");
const sourcePath = join(root, "data", "semantic", "card-artwork-tags-v1.jsonl");
const publicPath = join(root, "public", "data", "semantic", "card-artwork-search-v1.json");
const reviewSourcePath = join(root, "data", "semantic", "gift-theme-reviews-v1.json");
const publicReviewPath = join(root, "public", "data", "semantic", "gift-theme-reviews-v1.json");
const coveragePath = join(root, "data", "semantic", "catalog-coverage.json");

function assertString(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} must be a non-empty string.`);
  return value;
}

function encodeTags(tags, knownTags) {
  if (!Array.isArray(tags) || tags.some((tag) => !knownTags.has(tag))) throw new Error("Semantic source contains an unknown tag.");
  return tags.reduce((mask, tag) => mask | 2 ** knownTags.get(tag), 0);
}

async function readReviewedSource() {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  if (manifest.version !== 1 || !Array.isArray(manifest.tags) || manifest.tags.length !== 23) {
    throw new Error("Invalid semantic source manifest.");
  }
  const knownTags = new Map(manifest.tags.map((tag, index) => [tag, index]));
  const lines = (await readFile(sourcePath, "utf8")).trim().split("\n").filter(Boolean);
  const seen = new Set();
  const cards = lines.map((line, index) => {
    const row = JSON.parse(line);
    const id = assertString(row.id, `row ${index + 1} id`);
    if (seen.has(id)) throw new Error(`Duplicate semantic card id: ${id}`);
    seen.add(id);
    return [
      id,
      encodeTags(row.tags, knownTags),
      assertString(row.caption, `${id} caption`),
      assertString(row.name, `${id} name`),
      assertString(row.collectorNumber, `${id} collector number`),
      assertString(row.setId, `${id} set id`),
      assertString(row.setName, `${id} set name`),
      assertString(row.seriesId, `${id} series id`),
    ];
  }).sort((left, right) => left[0].localeCompare(right[0]));
  if (cards.length !== manifest.cardCount) throw new Error(`Expected ${manifest.cardCount} source cards, found ${cards.length}.`);
  return {
    version: 1,
    source: manifest.source,
    generatedAt: manifest.generatedAt,
    tags: manifest.tags,
    cards,
  };
}

async function readArtworkReviews(index) {
  const source = JSON.parse(await readFile(reviewSourcePath, "utf8"));
  if (source.version !== 1 || !Array.isArray(source.reviews)) throw new Error("Invalid artwork-review source.");
  const cardIds = new Set(index.cards.map((row) => row[0]));
  const knownTags = new Set(index.tags);
  const knownVerdicts = new Set(["dominant", "secondary", "incorrect", "unsure"]);
  const knownSources = new Set(["human", "ai-assisted"]);
  const seen = new Set();
  const reviews = source.reviews.map((review, position) => {
    const cardId = assertString(review.cardId, `review ${position + 1} card id`);
    const tag = assertString(review.tag, `${cardId} tag`);
    const verdict = assertString(review.verdict, `${cardId} verdict`);
    const reviewedAt = assertString(review.reviewedAt, `${cardId} reviewedAt`);
    const source = review.source === undefined ? "human" : assertString(review.source, `${cardId} source`);
    if (!cardIds.has(cardId)) throw new Error(`Artwork review references an unknown card: ${cardId}`);
    if (!knownTags.has(tag)) throw new Error(`Artwork review references an unknown tag: ${tag}`);
    if (!knownVerdicts.has(verdict)) throw new Error(`Artwork review has an unsupported verdict: ${verdict}`);
    if (!Number.isFinite(Date.parse(reviewedAt))) throw new Error(`Artwork review has an invalid timestamp: ${cardId}:${tag}`);
    if (!knownSources.has(source)) throw new Error(`Artwork review has an unsupported source: ${cardId}:${tag}`);
    const key = `${cardId}:${tag}`;
    if (seen.has(key)) throw new Error(`Duplicate artwork review: ${key}`);
    seen.add(key);
    return { cardId, tag, verdict, reviewedAt, source };
  }).sort((left, right) => left.cardId.localeCompare(right.cardId) || left.tag.localeCompare(right.tag));
  const generatedAt = assertString(source.generatedAt, "artwork review generatedAt");
  if (!Number.isFinite(Date.parse(generatedAt))) throw new Error("Artwork review generatedAt is invalid.");
  return { version: 1, generatedAt, reviews };
}

async function bootstrapSource() {
  const index = JSON.parse(await readFile(publicPath, "utf8"));
  const maxMask = 2 ** index.tags.length - 1;
  const rows = index.cards.map((row) => {
    if (!Array.isArray(row) || row.length !== 8 || !Number.isInteger(row[1]) || row[1] < 0 || row[1] > maxMask) {
      throw new Error("Cannot bootstrap from an invalid public semantic row.");
    }
    return JSON.stringify({
      id: row[0],
      tags: index.tags.filter((_, tagIndex) => (row[1] & 2 ** tagIndex) !== 0),
      caption: row[2],
      name: row[3],
      collectorNumber: row[4],
      setId: row[5],
      setName: row[6],
      seriesId: row[7],
    });
  });
  await mkdir(dirname(sourcePath), { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify({
    format: "cardfolio-reviewed-semantic-tags",
    version: 1,
    source: index.source,
    generatedAt: index.generatedAt,
    cardCount: index.cards.length,
    tags: index.tags,
  }, null, 2)}\n`);
  await writeFile(sourcePath, `${rows.join("\n")}\n`);
  console.log(`Bootstrapped reviewed semantic source: ${rows.length} cards.`);
}

async function buildIndex(write) {
  const index = await readReviewedSource();
  const serialized = `${JSON.stringify(index)}\n`;
  const reviews = await readArtworkReviews(index);
  const serializedReviews = `${JSON.stringify(reviews)}\n`;
  if (write) {
    await mkdir(dirname(publicPath), { recursive: true });
    await writeFile(publicPath, serialized);
    await writeFile(publicReviewPath, serializedReviews);
    console.log(`Built semantic index: ${index.cards.length} cards, ${Buffer.byteLength(serialized)} bytes; ${reviews.reviews.length} curated reviews.`);
    return;
  }
  const current = await readFile(publicPath, "utf8");
  if (current !== serialized) throw new Error("Public semantic index differs from the reviewed source. Run npm run semantic:index:build.");
  const currentReviews = await readFile(publicReviewPath, "utf8");
  if (currentReviews !== serializedReviews) throw new Error("Public artwork reviews differ from the reviewed source. Run npm run semantic:index:build.");
  console.log(`Semantic index is reproducible: ${index.cards.length} cards, ${Buffer.byteLength(serialized)} bytes; ${reviews.reviews.length} curated reviews.`);
}

async function coverageSummary() {
  const coverage = JSON.parse(await readFile(coveragePath, "utf8"));
  console.log("## Semantic artwork-search coverage");
  console.log("");
  console.log(`- Indexed reviewed cards: ${coverage.indexedCardCount}`);
  console.log(`- Eligible source cards: ${coverage.eligibleSourceCardCount}`);
  console.log(`- Untagged backlog: ${coverage.backlogCount}`);
  console.log(`- Blocked source cards: ${coverage.blockedSourceCardCount}`);
  if (coverage.backlogCount) console.log(`- Backlog IDs: ${coverage.backlogIds.join(", ")}`);
}

switch (process.argv[2]) {
  case "bootstrap-source": await bootstrapSource(); break;
  case "build": await buildIndex(true); break;
  case "check": await buildIndex(false); break;
  case "coverage-summary": await coverageSummary(); break;
  default: throw new Error("Use: semantic-index.mjs bootstrap-source|build|check|coverage-summary");
}
