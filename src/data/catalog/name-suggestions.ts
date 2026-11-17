import { suggestNames } from "@/domain/name-suggestion";
import type { CardLanguage, CatalogAdapter } from "@/domain/types";

/**
 * "Did you mean …?" for a name the catalogue does not know. The catalogue can only search for text inside a name, so
 * the beginning and the end of the typo are tried as search text; the names that come back are compared with the typo.
 * At most three small requests, and only after a search found nothing.
 */
export async function suggestCardNames(
  catalog: Pick<CatalogAdapter, "search">,
  typo: string,
  language: CardLanguage,
  signal?: AbortSignal,
): Promise<string[]> {
  const text = typo.trim();
  if (text.length < 4) return [];
  const probes = [...new Set([text.slice(0, 4), text.slice(0, 3), text.slice(-4)])].filter((probe) => probe.length >= 3);
  for (const probe of probes) {
    if (signal?.aborted) return [];
    const { items } = await catalog.search({ language, name: probe, page: 1, pageSize: 60 }, signal);
    const suggestions = suggestNames(text, items.map((item) => item.name));
    if (suggestions.length) return suggestions;
  }
  return [];
}
