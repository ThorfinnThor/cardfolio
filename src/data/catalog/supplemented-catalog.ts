import { CardTraderSupplements, cardtraderSupplements } from "@/data/cardtrader/supplements";
import type { CardRef, CardSnapshot, CatalogAdapter, CatalogQuery, CatalogSearchItem } from "@/domain/types";

import type { TCGdexCatalogAdapter, TCGdexGiftCardDetail } from "./tcgdex";

/**
 * The TCGdex catalogue plus the CardTrader supplement cards of a few reviewed sets. Supplement cards are added to the
 * first result page only (a few dozen cards at most), so they are seen without paging through every TCGdex result and
 * pagination stays consistent. They are looked up by their own identity provider.
 */
export class SupplementedCatalogAdapter implements CatalogAdapter {
  constructor(
    private readonly base: TCGdexCatalogAdapter,
    private readonly supplements: CardTraderSupplements = cardtraderSupplements,
  ) {}

  async search(query: CatalogQuery, signal?: AbortSignal): Promise<{ items: CatalogSearchItem[]; hasMore: boolean }> {
    const result = await this.base.search(query, signal);
    if (query.page !== 1) return result;
    const extra = await this.supplements.search(query);
    if (!extra.length) return result;
    const known = new Set(result.items.map((item) => `${item.setId ?? ""}|${item.collectorNumber}|${item.name}`));
    return { items: [...result.items, ...extra.filter((item) => !known.has(`${item.setId ?? ""}|${item.collectorNumber}|${item.name}`))], hasMore: result.hasMore };
  }

  getCard(ref: CardRef, signal?: AbortSignal): Promise<CardSnapshot> {
    return ref.provider === "cardtrader" ? this.supplements.card(ref) : this.base.getCard(ref, signal);
  }

  async getGiftCardDetail(ref: CardRef, signal?: AbortSignal): Promise<TCGdexGiftCardDetail> {
    if (ref.provider === "cardtrader") return { card: await this.supplements.card(ref), rawPricing: undefined };
    return this.base.getGiftCardDetail(ref, signal);
  }
}
