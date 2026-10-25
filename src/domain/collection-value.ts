import type { Binder, CardSnapshot, OwnedCondition, PlannedCard, PurchasePreferences, ValuePoint } from "./types";

export const MAX_VALUE_POINTS = 400;

/**
 * A single cheapest listing above this (in cents) cannot be told from a placeholder price, so it is not added to the
 * value; the panel says how many copies were left out. The sync already drops prices far above a cheaper condition of
 * the same card; this catches the ones with nothing to compare against.
 */
export const MAX_TRUSTED_PRICE_MINOR = 500_000;

export interface OwnedCopy {
  entry: PlannedCard;
  card: CardSnapshot;
  copies: number;
  /** The grade the price is looked up for. */
  condition: PurchasePreferences["minimumCondition"];
  /** False when the collector did not record a condition and the wanted minimum stands in for it. */
  conditionRecorded: boolean;
}

export interface BinderValue {
  valueMinor: number;
  pricedCopies: number;
  ownedCopies: number;
  ownedCards: number;
  pricedCards: number;
  /** Copies whose price was above MAX_TRUSTED_PRICE_MINOR and is not counted. */
  unverifiedCopies: number;
}

export function copiesOf(entry: PlannedCard): number {
  return entry.quantity ?? 1;
}

/** The owned cards of a binder with their snapshots; owned cards whose snapshot is unknown are left out. */
export function ownedCopies(binder: Binder, cards: ReadonlyMap<string, CardSnapshot>): OwnedCopy[] {
  const result: OwnedCopy[] = [];
  for (const entry of binder.pages.flatMap((page) => page.slots)) {
    if (!entry?.owned) continue;
    const card = cards.get(entry.cardKey);
    if (!card) continue;
    result.push({
      entry,
      card,
      copies: copiesOf(entry),
      condition: entry.condition ?? entry.preferences.minimumCondition,
      conditionRecorded: entry.condition !== undefined,
    });
  }
  return result;
}

/**
 * Adds up the prices of the owned cards. `prices` maps a planned-card id to the price of one copy in cents; a card
 * without a price is not counted as zero, it only lowers the coverage.
 */
export function deriveBinderValue(copies: readonly OwnedCopy[], prices: ReadonlyMap<string, number | undefined>): BinderValue {
  let valueMinor = 0;
  let pricedCopies = 0;
  let pricedCards = 0;
  let total = 0;
  let unverifiedCopies = 0;
  for (const owned of copies) {
    total += owned.copies;
    const price = prices.get(owned.entry.id);
    if (price === undefined || price <= 0) continue;
    if (price > MAX_TRUSTED_PRICE_MINOR) {
      unverifiedCopies += owned.copies;
      continue;
    }
    valueMinor += price * owned.copies;
    pricedCopies += owned.copies;
    pricedCards += 1;
  }
  return { valueMinor, pricedCopies, ownedCopies: total, ownedCards: copies.length, pricedCards, unverifiedCopies };
}

export function todayUtc(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Adds today's value to the history: one point per day (a later visit the same day replaces it), and a point that
 * repeats the two before it is folded into the last one so a long flat stretch stays short.
 */
export function recordValuePoint(history: readonly ValuePoint[], point: ValuePoint, limit: number = MAX_VALUE_POINTS): ValuePoint[] {
  const without = history.filter((existing) => existing.date !== point.date);
  const earlier = without.filter((existing) => existing.date < point.date);
  const later = without.filter((existing) => existing.date > point.date);
  const next = [...earlier];
  const [last, beforeLast] = [earlier.at(-1), earlier.at(-2)];
  const same = (a: ValuePoint | undefined) => a && a.valueMinor === point.valueMinor && a.pricedCopies === point.pricedCopies && a.ownedCopies === point.ownedCopies;
  if (same(last) && same(beforeLast)) next[next.length - 1] = point; else next.push(point);
  return [...next, ...later].slice(-limit);
}

/** Change between the first and the last point of a history, or undefined with fewer than two points. */
export function valueChange(history: readonly ValuePoint[]): { deltaMinor: number; since: string } | undefined {
  if (history.length < 2) return undefined;
  const first = history[0]!;
  const last = history.at(-1)!;
  return { deltaMinor: last.valueMinor - first.valueMinor, since: first.date };
}

export type { OwnedCondition };
