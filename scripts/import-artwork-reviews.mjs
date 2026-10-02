import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const inputPath = process.argv[2] ? resolve(process.argv[2]) : undefined;
if (!inputPath) throw new Error("Use: npm run semantic:reviews:import -- /path/to/cardfolio-artwork-reviews.json");

const sourcePath = resolve(root, "data/semantic/gift-theme-reviews-v1.json");
const [current, incoming] = await Promise.all([
  readFile(sourcePath, "utf8").then(JSON.parse),
  readFile(inputPath, "utf8").then(JSON.parse),
]);
if (incoming.version !== 1 || !Array.isArray(incoming.reviews)) throw new Error("The imported artwork-review file is invalid.");

const merged = new Map(current.reviews.map((review) => [`${review.cardId}:${review.tag}`, review]));
for (const review of incoming.reviews) merged.set(`${review.cardId}:${review.tag}`, review);
const reviews = [...merged.values()].sort((left, right) => left.cardId.localeCompare(right.cardId) || left.tag.localeCompare(right.tag));
const generatedAt = new Date().toISOString();
await writeFile(sourcePath, `${JSON.stringify({ version: 1, generatedAt, reviews }, null, 2)}\n`);
console.log(`Imported ${incoming.reviews.length} decisions; source now contains ${reviews.length} reviews.`);
