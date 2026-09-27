import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const LANGUAGES = ["en", "de"];
const OUTPUT_DIRECTORY = join(process.cwd(), "public", "data", "catalog");
const MINIMUM_ITEMS = 50;
const MAXIMUM_SHRINK_RATIO = 0.15;

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
await writeFile(
  join(OUTPUT_DIRECTORY, "manifest.json"),
  `${JSON.stringify({ format: "cardfolio-public-catalog", version: 2, source: "tcgdex", counts }, null, 2)}\n`,
  "utf8",
);
console.log(`Validated public set metadata: ${JSON.stringify(counts)}`);
