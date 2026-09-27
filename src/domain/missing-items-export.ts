import type { ExportResult, MissingItem } from "./types";
import { formatCollectorNumber } from "./catalog-search";
import { printingLabels, selectedPrinting } from "./variant-selection";

const HEADERS = ["Menge", "Name", "Set", "Nummer", "Sprache", "Finish", "Edition", "Druckvariante", "Zustand", "Prüfhinweis"] as const;

const finishLabels = {
  normal: "Normal",
  holo: "Holo",
  reverse: "Reverse Holo",
  other: "Andere",
  unspecified: "Nicht angegeben",
} as const;

const editionLabels = {
  unlimited: "Unlimited",
  "first-edition": "First Edition",
  unspecified: "Nicht angegeben",
} as const;

const conditionLabels = {
  "near-mint": "Near Mint",
  "lightly-played": "Lightly Played",
  played: "Played",
  any: "Beliebig",
} as const;

export function missingItemReviewNote(item: MissingItem): string {
  const unknown: string[] = [];
  if (item.variant.finish === "unspecified") unknown.push("Finish");
  if (item.variant.edition === "unspecified") unknown.push("Edition");
  if (selectedPrinting(item.variant) === "unspecified") unknown.push("Druckvariante");
  if (item.card.physicalStatus !== "physical") unknown.push("physische Ausgabe");
  return unknown.length > 0
    ? `Manuell prüfen: ${unknown.join(", ")}`
    : "Ausgabe, Sprache und Variante vor dem Kauf prüfen";
}

function row(item: MissingItem): string[] {
  return [
    String(item.quantity),
    item.card.name,
    item.card.setName,
    formatCollectorNumber(item.card.collectorNumber, item.card.collectorTotal),
    item.card.ref.language.toUpperCase(),
    item.variant.label?.trim() || finishLabels[item.variant.finish],
    editionLabels[item.variant.edition],
    printingLabels[selectedPrinting(item.variant)],
    conditionLabels[item.preferences.minimumCondition],
    missingItemReviewNote(item),
  ];
}

function warningsFor(items: readonly MissingItem[]): string[] {
  const warnings: string[] = [];
  const incompleteVariantCount = items.filter(
    (item) => item.variant.finish === "unspecified" || item.variant.edition === "unspecified" || selectedPrinting(item.variant) === "unspecified",
  ).length;
  const unconfirmedPhysicalCount = items.filter((item) => item.card.physicalStatus !== "physical").length;
  if (incompleteVariantCount > 0) {
    warnings.push(`${incompleteVariantCount} Position(en) enthalten keine vollständige Variantenangabe.`);
  }
  if (unconfirmedPhysicalCount > 0) {
    warnings.push(`${unconfirmedPhysicalCount} Position(en) sind nicht als physische Ausgabe bestätigt.`);
  }
  return warnings;
}

function result(items: readonly MissingItem[], text: string, mimeType: ExportResult["mimeType"]): ExportResult {
  return {
    text,
    mimeType,
    warnings: warningsFor(items),
    excludedEntryIds: [],
    verifiedCount: 0,
    reviewRequiredCount: items.length,
  };
}

function inlineText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function safeSpreadsheetValue(value: string): string {
  if (/^[\u0000-\u0020]*[=+\-@]/.test(value) || /^0\d+$/.test(value)) return `'${value}`;
  return value;
}

function csvCell(value: string): string {
  return `"${safeSpreadsheetValue(value).replaceAll('"', '""')}"`;
}

export function createMissingItemsTextExport(items: readonly MissingItem[]): ExportResult {
  const lines = [HEADERS.join(" | "), ...items.map((item) => row(item).map(inlineText).join(" | "))];
  return result(items, lines.join("\n"), "text/plain");
}

export function createMissingItemsCsvExport(
  items: readonly MissingItem[],
  options: { includeBom?: boolean } = {},
): ExportResult {
  const bom = options.includeBom === false ? "" : "\uFEFF";
  const lines = [HEADERS, ...items.map(row)].map((values) => values.map(csvCell).join(","));
  return result(items, `${bom}${lines.join("\r\n")}`, "text/csv");
}
