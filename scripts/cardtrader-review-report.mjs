import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const inputPath = resolve(process.argv[2] ?? ".cardtrader/mapping-audit.json");
const outputPath = resolve(process.argv[3] ?? ".cardtrader/mapping-review.md");
const audit = JSON.parse(await readFile(inputPath, "utf8"));

function clean(value) {
  return String(value ?? "—").replaceAll("|", "\\|").replaceAll("\n", " ");
}

function exactRow(decision) {
  const candidate = decision.candidateExpansions?.[0];
  const nameCoverage = decision.cardNameCoverage;
  const tcgdexCount = decision.tcgdexCardCount?.total ?? decision.tcgdexCardCount?.official ?? "—";
  return `| ${clean(decision.catalogKey)} | ${clean(decision.setName)} | ${clean(decision.releaseDate)} | ${clean(tcgdexCount)} | ${clean(candidate?.singlesBlueprintCount)} | ${clean(candidate?.uniqueSinglesBlueprintNames)} | ${clean(nameCoverage?.tcgdexUniqueNameCount)} | ${clean(nameCoverage?.exactUniqueNameMatches)} | ${clean(nameCoverage?.normalizedUniqueNameMatches)} | ${clean(nameCoverage?.unmatchedTcgdexUniqueNames)} | ${clean(candidate?.blueprintsWithCollectorNumber)} | ${clean(candidate?.uniqueCollectorNumbers)} | ${clean(candidate?.id)} | ${clean(candidate?.code)} | ${clean(candidate?.name)} | ☐ |`;
}

function suggestionCell(decision) {
  if (!decision.suggestedExpansions?.length) return "kein Vorschlag";
  return decision.suggestedExpansions
    .map((candidate) => {
      const coverage = decision.suggestionCardNameCoverage?.find((entry) => entry.expansionId === candidate.id);
      const coverageLabel = coverage?.status === "complete"
        ? `, Namen ${coverage.normalizedUniqueNameMatches}/${coverage.tcgdexUniqueNameCount}`
        : "";
      return `${clean(candidate.name)} (${clean(candidate.code)}, ID ${clean(candidate.id)}, Ähnlichkeit ${candidate.score}, Blueprints ${candidate.singlesBlueprintCount}, eindeutige Namen ${candidate.uniqueSinglesBlueprintNames}${coverageLabel})`;
    })
    .join("<br>");
}

const exact = audit.decisions.filter((decision) => decision.status === "review-required");
const ambiguous = audit.decisions.filter((decision) => decision.status === "ambiguous");
const unmapped = audit.decisions.filter((decision) => decision.status === "unmapped");
const lines = [
  "# CardTrader-Setprüfung",
  "",
  `Erzeugt: ${audit.generatedAt}`,
  "",
  "> Diese Liste ist nur eine Prüfwarteschlange. Kein Eintrag wird dadurch verifiziert. Bestätigte Zuordnungen müssen einzeln in `data/marketplace/cardtrader-set-review.json` übernommen werden.",
  "",
  `- Direkt zu prüfen: ${exact.length}`,
  `- Mehrdeutig: ${ambiguous.length}`,
  `- Nicht zugeordnet: ${unmapped.length}`,
  "",
  "## Exakte oder sprachübergreifend exakte Kandidaten",
  "",
  "| Katalogschlüssel | TCGdex-Set | Release | TCGdex Karten gesamt | CardTrader Einzelkarten-Blueprints | eindeutige Blueprint-Namen | eindeutige TCGdex-Namen | exakte Namensüberschneidung | normalisierte Namensüberschneidung | nicht gefundene TCGdex-Namen | Blueprints mit Kartennummer | eindeutige Kartennummern | CardTrader-ID | Code | CardTrader-Name | Geprüft |",
  "|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---|---|---|",
  ...exact.map(exactRow),
  "",
  "## Mehrdeutige Kandidaten",
  "",
  "| Katalogschlüssel | TCGdex-Set | Kandidaten | Entscheidung |",
  "|---|---|---|---|",
  ...ambiguous.map((decision) => `| ${clean(decision.catalogKey)} | ${clean(decision.setName)} | ${decision.candidateExpansions.map((candidate) => `${clean(candidate.name)} (ID ${clean(candidate.id)})`).join("<br>")} | ☐ |`),
  "",
  "## Nicht zugeordnete Sets mit unverbindlichen Vorschlägen",
  "",
  "| Katalogschlüssel | TCGdex-Set | Vergleichsnamen | Vorschläge | Entscheidung |",
  "|---|---|---|---|---|",
  ...unmapped.map((decision) => `| ${clean(decision.catalogKey)} | ${clean(decision.setName)} | ${decision.comparisonNames.map(clean).join(" / ")} | ${suggestionCell(decision)} | ☐ |`),
  "",
];

await writeFile(outputPath, lines.join("\n"));
console.log(JSON.stringify({ outputPath, exact: exact.length, ambiguous: ambiguous.length, unmapped: unmapped.length }, null, 2));
