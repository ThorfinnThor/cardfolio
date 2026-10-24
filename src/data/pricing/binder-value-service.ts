import type { OwnedCopy } from "@/domain/collection-value";
import type { PriceProvider } from "@/domain/gift-builder";

const CONCURRENCY = 8;

/**
 * Looks up the price of one copy for every owned card, in euro cents. A card the provider cannot price maps to
 * undefined; the lookup never invents a number.
 */
export async function priceOwnedCopies(copies: readonly OwnedCopy[], provider: PriceProvider, signal?: AbortSignal): Promise<Map<string, number | undefined>> {
  const prices = new Map<string, number | undefined>();
  const fetchedAt = new Date().toISOString();
  let next = 0;
  async function worker() {
    while (next < copies.length) {
      const owned = copies[next++]!;
      if (signal?.aborted) return;
      try {
        const quote = await provider.getPrice({
          card: owned.card,
          variant: owned.entry.variant,
          currency: "EUR",
          rawPricing: undefined,
          fetchedAt,
          printingMatch: "candidate",
          minimumCondition: owned.condition,
        }, signal);
        prices.set(owned.entry.id, quote.currency === "EUR" ? quote.amountMinor : undefined);
      } catch {
        prices.set(owned.entry.id, undefined);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, copies.length) }, worker));
  return prices;
}
