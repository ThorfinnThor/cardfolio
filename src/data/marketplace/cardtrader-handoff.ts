import { cardtraderCardUrl } from "@/config/cardtrader";
import { cardtraderCatalog, type CardTraderCatalog } from "@/data/cardtrader/catalog";
import type { MissingItem } from "@/domain/types";

export interface CardtraderHandoffEntry {
  identityKey: string;
  /** Page of the card at CardTrader, only when the card is matched to exactly one blueprint. */
  url?: string;
  blueprintId?: number;
  /** Cheapest EUR listing at the item's minimum condition, from the weekly snapshot, per card. */
  unitPriceMinor?: number;
  /** Offers in the card's language from the weekly snapshot. */
  offerCount?: number;
  /** Seller countries of the offers, cheapest first. */
  sellerCountries?: string[];
}

export interface CardtraderHandoff {
  entries: CardtraderHandoffEntry[];
  linkedCount: number;
  pricedCount: number;
  /** Sum of unit price times quantity over the priced items; shipping is not part of it. */
  pricedTotalMinor: number;
  pricedQuantity: number;
}

/**
 * Looks each missing card up in the CardTrader data (verified set mapping plus collector number). A card without a
 * match simply has no link and no price; nothing is guessed.
 */
export async function prepareCardtraderHandoff(items: readonly MissingItem[], catalog: CardTraderCatalog = cardtraderCatalog): Promise<CardtraderHandoff> {
  const entries: CardtraderHandoffEntry[] = [];
  let pricedTotalMinor = 0;
  let pricedQuantity = 0;
  for (const item of items) {
    const match = await catalog.blueprint(item.card.ref.language, item.card.setId, item.card.collectorNumber, item.card.englishIdentity?.name ?? item.card.name);
    if (!match) { entries.push({ identityKey: item.identityKey }); continue; }
    // First editions are not part of the price snapshot.
    const price = item.variant.edition === "first-edition" ? undefined : await catalog.price(match, item.card.ref.language, item.preferences.minimumCondition);
    const offers = await catalog.offers(match, item.card.ref.language);
    entries.push({
      identityKey: item.identityKey,
      blueprintId: match.blueprint.id,
      url: cardtraderCardUrl(match.blueprint.id),
      ...(price ? { unitPriceMinor: price.amountMinor } : {}),
      ...(offers ? { offerCount: offers.count, ...(offers.countries.length ? { sellerCountries: offers.countries } : {}) } : {}),
    });
    if (price) { pricedTotalMinor += price.amountMinor * item.quantity; pricedQuantity += item.quantity; }
  }
  return {
    entries,
    linkedCount: entries.filter((entry) => entry.url).length,
    pricedCount: entries.filter((entry) => entry.unitPriceMinor !== undefined).length,
    pricedTotalMinor,
    pricedQuantity,
  };
}
