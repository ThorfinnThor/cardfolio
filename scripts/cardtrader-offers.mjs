/**
 * Offer statistics per blueprint from the listings /marketplace/products returns (the 25 cheapest per blueprint).
 * Only counts and ISO country codes are kept; no seller name, id or listing id leaves this function.
 */
export const OFFER_CAP = 25;
const MAX_COUNTRIES = 6;
const LANGUAGES = ["en", "de"];

/**
 * @param {Array<{ price_cents?: number, price?: { cents?: number }, user?: { country_code?: string }, properties_hash?: Record<string, unknown> }>} usable
 *   listings that already passed the price filters, in any order
 * @param {number} seen number of listings the API returned for the blueprint, before filtering
 * @returns {{ counts: [number, number], capped: 0 | 1, countries: string[] } | undefined}
 */
export function summarizeOffers(usable, seen) {
  if (!usable.length) return undefined;
  const counts = [0, 0];
  const byPrice = [...usable].sort((a, b) => (a.price_cents ?? a.price?.cents ?? 0) - (b.price_cents ?? b.price?.cents ?? 0));
  const countries = [];
  for (const listing of byPrice) {
    const index = LANGUAGES.indexOf(listing.properties_hash?.pokemon_language);
    if (index >= 0) counts[index] += 1;
    const country = listing.user?.country_code;
    if (typeof country === "string" && /^[A-Za-z]{2}$/.test(country)) {
      const code = country.toUpperCase();
      if (!countries.includes(code) && countries.length < MAX_COUNTRIES) countries.push(code);
    }
  }
  return { counts, capped: seen >= OFFER_CAP ? 1 : 0, countries };
}
