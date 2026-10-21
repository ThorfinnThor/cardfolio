/**
 * Offer statistics per blueprint from the listings /marketplace/products returns for an expansion (all listings:
 * the weekly run saw up to 300 per card, so there is no 25-listing limit on this query).
 * Only counts and ISO country codes are kept; no seller name, id or listing id leaves this function.
 */
const MAX_COUNTRIES = 6;
const LANGUAGES = ["en", "de"];

/**
 * @param {Array<{ price_cents?: number, price?: { cents?: number }, user?: { country_code?: string }, properties_hash?: Record<string, unknown> }>} usable
 *   listings that already passed the price filters, in any order
 * @returns {{ counts: [number, number], countries: string[] } | undefined}
 */
export function summarizeOffers(usable) {
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
  return { counts, countries };
}
