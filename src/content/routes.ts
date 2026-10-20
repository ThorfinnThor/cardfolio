import type { PageLanguage } from "@/config/site";

import type { Guide } from "./guides";
import type { SpeciesEntry } from "./pokemon-species";

export const TOOL_PATH = "/geschenk/";

/** Opens the gift tool straight in step 1, so a visitor who clicked "Geschenk-Binder gestalten" does not meet a second hero. */
export const TOOL_START_PATH = "/geschenk/?start=1";

/** The full app (collector navigation, saved binders). Never reuse `/` for it: the home page is the public landing page. */
export function appPath(): string {
  return "/app/";
}

export function homePath(language: PageLanguage): string {
  return language === "de" ? "/" : "/en/";
}

export function guideIndexPath(language: PageLanguage): string {
  return language === "de" ? "/ratgeber/" : "/en/guides/";
}

export function guidePath(language: PageLanguage, guide: Guide): string {
  return `${guideIndexPath(language)}${guide[language].slug}/`;
}

export function speciesIndexPath(language: PageLanguage): string {
  return language === "de" ? "/pokemon-binder/" : "/en/pokemon-binder/";
}

/** German pages use the German Pokémon name in the URL, English pages the English one. */
export function speciesSlug(language: PageLanguage, entry: SpeciesEntry): string {
  return language === "de" ? entry.slug : entry.cardName.toLowerCase();
}

export function speciesPath(language: PageLanguage, entry: SpeciesEntry): string {
  return `${speciesIndexPath(language)}${speciesSlug(language, entry)}/`;
}

export function otherLanguage(language: PageLanguage): PageLanguage {
  return language === "de" ? "en" : "de";
}

export type LegalId = "imprint" | "privacy";

export function legalPath(language: PageLanguage, id: LegalId): string {
  const slug = { imprint: { de: "impressum", en: "legal-notice" }, privacy: { de: "datenschutz", en: "privacy" } }[id][language];
  return language === "de" ? `/${slug}/` : `/en/${slug}/`;
}
