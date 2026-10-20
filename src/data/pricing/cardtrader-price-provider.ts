import { cardtraderCatalog, type CardTraderCatalog } from "@/data/cardtrader/catalog";
import type { GiftPriceQuote, GiftPriceRequest, PriceProvider } from "@/domain/gift-builder";

function unknown(request: GiftPriceRequest, issues: string[]): GiftPriceQuote {
  return { currency: request.currency, fetchedAt: request.fetchedAt, confidence: "unknown", issues };
}

/**
 * Cheapest CardTrader listing at the buyer's minimum condition, from the synced snapshot. It is only an
 * estimate: CardTrader does not distinguish holo and reverse holo, and first-edition listings are not part of
 * the snapshot, so those variants stay unpriced instead of getting a wrong number.
 */
export class CardTraderGiftPriceProvider implements PriceProvider {
  constructor(private readonly catalog: CardTraderCatalog = cardtraderCatalog) {}

  async getPrice(request: GiftPriceRequest, signal?: AbortSignal): Promise<GiftPriceQuote> {
    if (signal?.aborted) throw signal.reason;
    if (request.currency !== "EUR") return unknown(request, ["cardtrader-prices-are-eur"]);
    if (request.variant.edition === "first-edition") return unknown(request, ["cardtrader-first-edition-not-priced"]);
    const { card } = request;
    const match = await this.catalog.blueprint(card.ref.language, card.setId, card.collectorNumber, card.englishIdentity?.name ?? card.name);
    if (!match) return unknown(request, ["cardtrader-card-not-matched"]);
    const price = await this.catalog.price(match, card.ref.language, request.minimumCondition ?? "excellent");
    if (!price) return unknown(request, ["cardtrader-no-listing-at-condition"]);
    return {
      source: "cardtrader",
      currency: "EUR",
      amountMinor: price.amountMinor,
      metric: "low-listing",
      fetchedAt: request.fetchedAt,
      confidence: "approximate",
      issues: ["cardtrader-cheapest-listing"],
    };
  }
}

/** Asks the primary provider first; only when it has no price does the fallback get a turn. */
export class FallbackGiftPriceProvider implements PriceProvider {
  constructor(private readonly primary: PriceProvider, private readonly fallback: PriceProvider) {}

  async getPrice(request: GiftPriceRequest, signal?: AbortSignal): Promise<GiftPriceQuote> {
    const quote = await this.primary.getPrice(request, signal);
    if (quote.amountMinor !== undefined) return quote;
    const alternative = await this.fallback.getPrice(request, signal);
    return alternative.amountMinor !== undefined ? alternative : quote;
  }
}
