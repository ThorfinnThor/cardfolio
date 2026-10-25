import { cardtraderCatalog, type CardTraderCatalog, type PriceCondition } from "@/data/cardtrader/catalog";
import type { OwnedCopy } from "@/domain/collection-value";
import type { CardSnapshot, ValuePoint, VariantSelection } from "@/domain/types";

export interface PriceTrendPoint {
  date: string;
  amountMinor: number;
}

async function seriesOf(catalog: CardTraderCatalog, card: CardSnapshot, variant: VariantSelection, condition: PriceCondition) {
  // Same limits as the current price: first editions are not part of the snapshot.
  if (variant.edition === "first-edition") return undefined;
  const match = await catalog.blueprint(card.ref.language, card.setId, card.collectorNumber, card.englishIdentity?.name ?? card.name);
  if (!match) return undefined;
  return catalog.priceHistory(match, card.ref.language, condition);
}

/**
 * The weekly price of one card at one condition. Weeks without a listing are left out, so the result can be shorter than
 * the snapshot list; it is empty when nothing is known.
 */
export async function cardPriceTrend(card: CardSnapshot, variant: VariantSelection, condition: PriceCondition, catalog: CardTraderCatalog = cardtraderCatalog): Promise<PriceTrendPoint[]> {
  const history = await seriesOf(catalog, card, variant, condition);
  if (!history) return [];
  return history.dates.flatMap((date, index) => (history.amounts[index]! > 0 ? [{ date, amountMinor: history.amounts[index]! }] : []));
}

/**
 * How the prices of the cards a collector owns now have moved, week by week. Only cards that had a price in every
 * week of the common period count, so the curve shows price movement and not a changing set of priced cards.
 * Returns nothing when fewer than two common weeks or no such card exist.
 */
export async function binderMarketHistory(copies: readonly OwnedCopy[], catalog: CardTraderCatalog = cardtraderCatalog): Promise<ValuePoint[]> {
  const found = await Promise.all(copies.map(async (owned) => ({
    owned,
    history: owned.condition === "any" ? undefined : await seriesOf(catalog, owned.card, owned.entry.variant, owned.condition),
  })));
  const usable = found.flatMap(({ owned, history }) => (history ? [{ owned, history }] : []));
  if (usable.length === 0) return [];
  const common = usable[0]!.history.dates.filter((date) => usable.every(({ history }) => history.dates.includes(date)));
  if (common.length < 2) return [];
  const basket = usable.filter(({ history }) => common.every((date) => history.amounts[history.dates.indexOf(date)]! > 0));
  if (basket.length === 0) return [];
  const ownedTotal = copies.reduce((sum, owned) => sum + owned.copies, 0);
  const basketCopies = basket.reduce((sum, { owned }) => sum + owned.copies, 0);
  return common.map((date) => ({
    date,
    valueMinor: basket.reduce((sum, { owned, history }) => sum + history.amounts[history.dates.indexOf(date)]! * owned.copies, 0),
    pricedCopies: basketCopies,
    ownedCopies: ownedTotal,
  }));
}
