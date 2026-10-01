import type {
  GiftPriceQuote,
  GiftPriceRequest,
  PriceProvider,
} from "@/domain/gift-builder";
import { variantAvailabilityForCard } from "@/domain/variant-selection";

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as JsonRecord
    : undefined;
}

function minor(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return undefined;
  const amount = Math.round(value * 100);
  return Number.isSafeInteger(amount) && Math.abs(value * 100 - amount) < 1e-7 ? amount : undefined;
}

function validTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function actualRange(metrics: Array<{ name: string; amount?: number }>): GiftPriceQuote["range"] {
  const values = metrics.filter((item): item is { name: string; amount: number } => item.amount !== undefined);
  if (values.length < 2) return undefined;
  const low = values.reduce((current, item) => item.amount < current.amount ? item : current);
  const high = values.reduce((current, item) => item.amount > current.amount ? item : current);
  if (low.amount === high.amount) return undefined;
  return {
    lowMinor: low.amount,
    highMinor: high.amount,
    lowMetric: low.name,
    highMetric: high.name,
  };
}

function unknown(request: GiftPriceRequest, issues: string[]): GiftPriceQuote {
  return {
    currency: request.currency,
    fetchedAt: request.fetchedAt,
    confidence: "unknown",
    issues,
  };
}

function cardmarket(request: GiftPriceRequest, pricing: JsonRecord): GiftPriceQuote {
  const provider = record(pricing.cardmarket);
  if (!provider) return unknown(request, ["missing-cardmarket-provider"]);
  if (provider.unit !== "EUR") return unknown(request, ["unexpected-cardmarket-currency"]);
  if (!validTimestamp(provider.updated)) return unknown(request, ["invalid-cardmarket-timestamp"]);
  if (request.variant.edition !== "unlimited" || !["normal", "holo"].includes(request.variant.finish)) {
    return unknown(request, ["unsupported-cardmarket-variant"]);
  }
  const suffix = request.variant.finish === "holo" ? "-holo" : "";
  const metrics = [
    { name: "low", amount: minor(provider[`low${suffix}`]) },
    { name: "trend", amount: minor(provider[`trend${suffix}`]) },
    { name: "avg30", amount: minor(provider[`avg30${suffix}`]) },
    { name: "avg", amount: minor(provider[`avg${suffix}`]) },
  ];
  const central = metrics.find((item) => item.name === "trend" && item.amount !== undefined)
    ?? metrics.find((item) => item.name === "avg30" && item.amount !== undefined)
    ?? metrics.find((item) => item.name === "avg" && item.amount !== undefined);
  if (!central?.amount) return unknown(request, ["missing-cardmarket-central-metric"]);
  const exact = request.printingMatch === "verified-printing" && request.card.ref.language === "en";
  return {
    source: "tcgdex-cardmarket",
    currency: "EUR",
    amountMinor: central.amount,
    metric: central.name as "trend" | "avg30" | "avg",
    range: actualRange(metrics),
    fetchedAt: request.fetchedAt,
    sourceUpdatedAt: provider.updated,
    confidence: exact ? "usable" : "approximate",
    issues: exact ? [] : ["cardmarket-language-or-printing-aggregate"],
  };
}

function tcgplayerVariant(request: GiftPriceRequest): { key?: string; exact: boolean } {
  const { finish, edition } = request.variant;
  if (finish === "other" || finish === "unspecified") return { exact: false };
  if (edition === "first-edition") {
    if (finish === "normal") return { key: "1st-edition", exact: true };
    if (finish === "holo") return { key: "1st-edition-holofoil", exact: true };
    return { exact: false };
  }
  if (edition === "unlimited") {
    const historicallyEditioned = variantAvailabilityForCard(request.card).firstEdition;
    if (finish === "normal") return { key: historicallyEditioned ? "unlimited" : "normal", exact: true };
    if (finish === "holo") return { key: historicallyEditioned ? "unlimited-holofoil" : "holofoil", exact: true };
  }
  if (finish === "normal") return { key: "normal", exact: false };
  if (finish === "holo") return { key: "holofoil", exact: false };
  return { key: "reverse-holofoil", exact: false };
}

function tcgplayer(request: GiftPriceRequest, pricing: JsonRecord): GiftPriceQuote {
  const provider = record(pricing.tcgplayer);
  if (!provider) return unknown(request, ["missing-tcgplayer-provider"]);
  if (request.card.ref.language !== "en") return unknown(request, ["tcgplayer-requires-english-card"]);
  if (provider.unit !== "USD") return unknown(request, ["unexpected-tcgplayer-currency"]);
  if (!validTimestamp(provider.updated)) return unknown(request, ["invalid-tcgplayer-timestamp"]);
  const variant = tcgplayerVariant(request);
  const data = variant.key ? record(provider[variant.key]) : undefined;
  if (!data) return unknown(request, ["missing-tcgplayer-variant"]);
  const metrics = [
    { name: "lowPrice", amount: minor(data.lowPrice) },
    { name: "marketPrice", amount: minor(data.marketPrice) },
    { name: "midPrice", amount: minor(data.midPrice) },
    { name: "highPrice", amount: minor(data.highPrice) },
  ];
  const central = metrics.find((item) => item.name === "marketPrice" && item.amount !== undefined)
    ?? metrics.find((item) => item.name === "midPrice" && item.amount !== undefined);
  if (!central?.amount) return unknown(request, ["missing-tcgplayer-central-metric"]);
  const exact = request.printingMatch === "verified-printing" && variant.exact;
  return {
    source: "tcgdex-tcgplayer",
    currency: "USD",
    amountMinor: central.amount,
    metric: central.name === "marketPrice" ? "market" : "mid",
    range: actualRange(metrics),
    fetchedAt: request.fetchedAt,
    sourceUpdatedAt: provider.updated,
    confidence: exact ? "usable" : "approximate",
    issues: exact ? [] : ["tcgplayer-printing-match-not-verified"],
  };
}

export class TCGdexGiftPriceProvider implements PriceProvider {
  async getPrice(request: GiftPriceRequest, signal?: AbortSignal): Promise<GiftPriceQuote> {
    if (signal?.aborted) throw signal.reason;
    if (!validTimestamp(request.fetchedAt)) return unknown(request, ["invalid-fetch-timestamp"]);
    const pricing = record(request.rawPricing);
    if (!pricing) return unknown(request, ["missing-pricing"]);
    return request.currency === "EUR" ? cardmarket(request, pricing) : tcgplayer(request, pricing);
  }
}
