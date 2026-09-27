import type { CardLanguage, PriceEstimate, VariantSelection } from "@/domain/types";

export type PriceIssueCode =
  | "invalid-response"
  | "invalid-fetch-time"
  | "missing-provider"
  | "invalid-source-time"
  | "unexpected-currency"
  | "unsupported-variant"
  | "ambiguous-language"
  | "missing-metric"
  | "invalid-amount";

export interface PriceParseIssue {
  provider: "cardmarket" | "tcgplayer" | "response";
  code: PriceIssueCode;
  message: string;
}

export interface TCGdexPriceParseContext {
  fetchedAt: string;
  language: CardLanguage;
  variant: VariantSelection;
  printingMatch: "verified-printing" | "candidate";
}

export interface TCGdexPriceParseResult {
  estimates: PriceEstimate[];
  issues: PriceParseIssue[];
}

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : undefined;
}

function validIsoDate(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function amountMinor(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return undefined;
  const scaled = value * 100;
  const rounded = Math.round(scaled);
  if (!Number.isSafeInteger(rounded) || Math.abs(scaled - rounded) > 1e-7) return undefined;
  return rounded;
}

function tcgplayerVariantKey(variant: VariantSelection): { key?: string; exactEdition: boolean } {
  if (variant.finish === "other" || variant.finish === "unspecified") return { exactEdition: false };
  if (variant.edition === "first-edition") {
    if (variant.finish === "normal") return { key: "1st-edition", exactEdition: true };
    if (variant.finish === "holo") return { key: "1st-edition-holofoil", exactEdition: true };
    return { exactEdition: false };
  }
  if (variant.edition === "unlimited") {
    if (variant.finish === "normal") return { key: "unlimited", exactEdition: true };
    if (variant.finish === "holo") return { key: "unlimited-holofoil", exactEdition: true };
    return { exactEdition: false };
  }
  if (variant.finish === "normal") return { key: "normal", exactEdition: false };
  if (variant.finish === "holo") return { key: "holofoil", exactEdition: false };
  return { key: "reverse-holofoil", exactEdition: false };
}

function parseCardmarket(
  pricing: JsonRecord,
  context: TCGdexPriceParseContext,
  issues: PriceParseIssue[],
): PriceEstimate | undefined {
  const provider = record(pricing.cardmarket);
  if (!provider) {
    issues.push({ provider: "cardmarket", code: "missing-provider", message: "Keine Cardmarket-Preisdaten vorhanden." });
    return undefined;
  }
  if (provider.unit !== "EUR") {
    issues.push({ provider: "cardmarket", code: "unexpected-currency", message: "Cardmarket-Währung ist nicht eindeutig EUR." });
    return undefined;
  }
  if (!validIsoDate(provider.updated)) {
    issues.push({ provider: "cardmarket", code: "invalid-source-time", message: "Cardmarket-Datenstand fehlt oder ist kein ISO-Zeitstempel." });
    return undefined;
  }
  if (context.variant.edition === "first-edition") {
    issues.push({ provider: "cardmarket", code: "unsupported-variant", message: "Cardmarket trennt First Edition in dieser Antwort nicht belastbar." });
    return undefined;
  }
  const variantKey = context.variant.finish === "normal"
    ? "normal"
    : context.variant.finish === "holo"
      ? "holo"
      : undefined;
  if (!variantKey) {
    issues.push({ provider: "cardmarket", code: "unsupported-variant", message: "Cardmarket-Trendpreise sind nur für explizit Normal oder Holo zuordenbar; Reverse wird nicht abgeleitet." });
    return undefined;
  }
  const metricKey = variantKey === "holo" ? "trend-holo" : "trend";
  const minor = amountMinor(provider[metricKey]);
  if (minor === undefined) {
    issues.push({
      provider: "cardmarket",
      code: provider[metricKey] === undefined || provider[metricKey] === null ? "missing-metric" : "invalid-amount",
      message: `Cardmarket ${metricKey} fehlt, ist null, null Euro oder nicht centgenau normalisierbar.`,
    });
    return undefined;
  }
  if (context.language !== "en") {
    issues.push({ provider: "cardmarket", code: "ambiguous-language", message: "Cardmarket-Preisdaten der TCGdex-Antwort isolieren die Kartensprache nicht." });
  }
  return {
    source: "tcgdex-cardmarket",
    currency: "EUR",
    amountMinor: minor,
    metric: "trend",
    fetchedAt: context.fetchedAt,
    sourceUpdatedAt: provider.updated,
    matchQuality: "candidate",
    variantKey,
  };
}

function parseTcgplayer(
  pricing: JsonRecord,
  context: TCGdexPriceParseContext,
  issues: PriceParseIssue[],
): PriceEstimate | undefined {
  const provider = record(pricing.tcgplayer);
  if (!provider) {
    issues.push({ provider: "tcgplayer", code: "missing-provider", message: "Keine TCGplayer-Preisdaten vorhanden." });
    return undefined;
  }
  if (context.language !== "en") {
    issues.push({ provider: "tcgplayer", code: "ambiguous-language", message: "TCGplayer-Preise werden nur für geprüfte englische Printings ausgewertet." });
    return undefined;
  }
  if (provider.unit !== "USD") {
    issues.push({ provider: "tcgplayer", code: "unexpected-currency", message: "TCGplayer-Währung ist nicht eindeutig USD." });
    return undefined;
  }
  if (!validIsoDate(provider.updated)) {
    issues.push({ provider: "tcgplayer", code: "invalid-source-time", message: "TCGplayer-Datenstand fehlt oder ist kein ISO-Zeitstempel." });
    return undefined;
  }
  const variant = tcgplayerVariantKey(context.variant);
  if (!variant.key) {
    issues.push({ provider: "tcgplayer", code: "unsupported-variant", message: "Finish und Edition lassen sich keinem dokumentierten TCGplayer-Variantenschlüssel zuordnen." });
    return undefined;
  }
  const variantData = record(provider[variant.key]);
  if (!variantData) {
    issues.push({ provider: "tcgplayer", code: "missing-metric", message: `TCGplayer-Variante ${variant.key} ist in der Antwort nicht vorhanden.` });
    return undefined;
  }
  const minor = amountMinor(variantData.marketPrice);
  if (minor === undefined) {
    issues.push({ provider: "tcgplayer", code: variantData.marketPrice === undefined || variantData.marketPrice === null ? "missing-metric" : "invalid-amount", message: `TCGplayer ${variant.key}.marketPrice fehlt, ist null, null Dollar oder nicht centgenau normalisierbar.` });
    return undefined;
  }
  return {
    source: "tcgdex-tcgplayer",
    currency: "USD",
    amountMinor: minor,
    metric: "market",
    fetchedAt: context.fetchedAt,
    sourceUpdatedAt: provider.updated,
    matchQuality: context.printingMatch === "verified-printing" && variant.exactEdition ? "verified-printing" : "candidate",
    variantKey: variant.key,
  };
}

export function parseTCGdexPriceEstimates(rawPricing: unknown, context: TCGdexPriceParseContext): TCGdexPriceParseResult {
  const issues: PriceParseIssue[] = [];
  if (!validIsoDate(context.fetchedAt)) {
    return {
      estimates: [],
      issues: [{ provider: "response", code: "invalid-fetch-time", message: "Abrufzeitpunkt fehlt oder ist kein ISO-Zeitstempel." }],
    };
  }
  const pricing = record(rawPricing);
  if (!pricing) {
    return {
      estimates: [],
      issues: [{ provider: "response", code: "invalid-response", message: "Das TCGdex-Preisfeld ist kein Objekt." }],
    };
  }
  return {
    estimates: [parseCardmarket(pricing, context, issues), parseTcgplayer(pricing, context, issues)].filter(
      (estimate): estimate is PriceEstimate => Boolean(estimate),
    ),
    issues,
  };
}
