import { readFile } from "node:fs/promises";
import { join } from "node:path";

const languages = ["en", "de"];
const directory = join(process.cwd(), "public", "data", "catalog");

function validAsset(value) {
  if (value == null) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "assets.tcgdex.net";
  } catch {
    return false;
  }
}

const report = {};
let invalid = false;
for (const language of languages) {
  const catalog = JSON.parse(await readFile(join(directory, `${language}-sets.json`), "utf8"));
  if (!Array.isArray(catalog.items)) throw new Error(`${language}-sets.json has no items array.`);
  const ids = new Set();
  const invalidSetIds = [];
  for (const set of catalog.items) {
    const valid = typeof set.id === "string"
      && set.id.trim()
      && !ids.has(set.id)
      && typeof set.name === "string"
      && set.name.trim()
      && (set.releaseDate == null || /^\d{4}-\d{2}-\d{2}$/.test(set.releaseDate))
      && validAsset(set.logo)
      && validAsset(set.symbol);
    if (!valid) invalidSetIds.push(set.id ?? "<missing-id>");
    if (typeof set.id === "string") ids.add(set.id);
  }
  invalid ||= invalidSetIds.length > 0;
  report[language] = {
    sets: catalog.items.length,
    releaseDates: catalog.items.filter((set) => set.releaseDate).length,
    logos: catalog.items.filter((set) => set.logo).length,
    symbols: catalog.items.filter((set) => set.symbol).length,
    missingLogoSetIds: catalog.items.filter((set) => !set.logo).map((set) => set.id),
    missingSymbolSetIds: catalog.items.filter((set) => !set.symbol).map((set) => set.id),
    invalidSetIds,
  };
}

if (process.argv.includes("--summary")) {
  console.log("## Set-Katalog und Assets\n");
  console.log("| Sprache | Sets | Datum | Logo | Symbol | Ungültig |");
  console.log("|---|---:|---:|---:|---:|---:|");
  for (const language of languages) {
    const item = report[language];
    console.log(`| ${language.toUpperCase()} | ${item.sets} | ${item.releaseDates} | ${item.logos} | ${item.symbols} | ${item.invalidSetIds.length} |`);
  }
  for (const language of languages) {
    const item = report[language];
    console.log(`\n- ${language.toUpperCase()}: ${item.missingLogoSetIds.length} ohne Logo, ${item.missingSymbolSetIds.length} ohne Symbol.`);
  }
} else {
  console.log(JSON.stringify(Object.fromEntries(languages.map((language) => [language, {
    sets: report[language].sets,
    releaseDates: report[language].releaseDates,
    logos: report[language].logos,
    symbols: report[language].symbols,
    missingLogos: report[language].missingLogoSetIds.length,
    missingSymbols: report[language].missingSymbolSetIds.length,
    invalid: report[language].invalidSetIds.length,
  }])), null, 2));
}

if (invalid) process.exitCode = 1;
