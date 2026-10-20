import type { AppLocale } from "./locale";

/**
 * Content pages (guides, Pokémon pages and the English section) are written in one language and linked to
 * their counterpart with hreflang. They must not follow the stored or browser language like the app does.
 */
export const FIXED_ENGLISH_PREFIX = "/en/";
export const FIXED_GERMAN_PREFIXES = ["/ratgeber/", "/pokemon-binder/", "/impressum/", "/datenschutz/"] as const;

export function fixedLocaleForPath(pathname: string): AppLocale | null {
  const path = pathname.endsWith("/") ? pathname : `${pathname}/`;
  if (path.startsWith(FIXED_ENGLISH_PREFIX)) return "en";
  if (FIXED_GERMAN_PREFIXES.some((prefix) => path.startsWith(prefix))) return "de";
  return null;
}
