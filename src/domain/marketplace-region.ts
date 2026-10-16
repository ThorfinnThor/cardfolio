export type SuggestedRegion = "europe" | "north-america" | "other";

const EUROPEAN_REGIONS: ReadonlySet<string> = new Set([
  "AT", "BE", "BG", "CH", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GB", "GR", "HR", "HU", "IE", "IS",
  "IT", "LI", "LT", "LU", "LV", "MT", "NL", "NO", "PL", "PT", "RO", "SE", "SI", "SK",
]);

/**
 * Suggests where a visitor probably buys from their browser's language list. This is a guess from the
 * language setting only: no location is requested or read. The buyer can always change it.
 *
 * "en-US", "en-CA" and "fr-CA" point to North America, a European region or a plain language such as "de"
 * points to Europe, another region (for example "en-AU") has no recommended provider. The interface is
 * German only, so a missing or region-less language also means Europe.
 */
export function suggestMarketplaceRegion(languages: readonly string[]): SuggestedRegion {
  const first = languages.find((tag) => tag.trim().length > 0);
  if (!first) return "europe";
  const region = first.trim().split(/[-_]/)[1]?.toUpperCase();
  if (!region) return "europe";
  if (region === "US" || region === "CA") return "north-america";
  if (EUROPEAN_REGIONS.has(region)) return "europe";
  return "other";
}
