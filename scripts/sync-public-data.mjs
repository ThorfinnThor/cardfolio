import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const LANGUAGES = ["en", "de"];
const OUTPUT_DIRECTORY = join(process.cwd(), "public", "data", "catalog");
const MINIMUM_ITEMS = 50;
const MAXIMUM_SHRINK_RATIO = 0.15;

function normalizeSet(item) {
  if (!item || typeof item !== "object") throw new Error("Set entry must be an object.");
  if (typeof item.id !== "string" || !item.id.trim()) throw new Error("Set entry has no ID.");
  if (typeof item.name !== "string" || !item.name.trim()) throw new Error(`Set ${item.id} has no name.`);
  const total = item.cardCount?.total;
  const official = item.cardCount?.official;
  if (!Number.isInteger(total) || total < 0 || !Number.isInteger(official) || official < 0) {
    throw new Error(`Set ${item.id} has invalid card counts.`);
  }
  return { id: item.id, name: item.name, cardCount: { official, total } };
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
  const response = await fetch(`https://api.tcgdex.net/v2/${language}/sets`, {
    headers: { Accept: "application/json", "User-Agent": "Cardfolio public-data sync" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`TCGdex ${language} sets failed with HTTP ${response.status}.`);
  const raw = await response.json();
  if (!Array.isArray(raw)) throw new Error(`TCGdex ${language} sets response is not an array.`);
  const items = raw.map(normalizeSet).sort((a, b) => a.id.localeCompare(b.id));
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
await writeFile(
  join(OUTPUT_DIRECTORY, "manifest.json"),
  `${JSON.stringify({ format: "cardfolio-public-catalog", version: 1, source: "tcgdex", counts }, null, 2)}\n`,
  "utf8",
);
console.log(`Validated public set metadata: ${JSON.stringify(counts)}`);
