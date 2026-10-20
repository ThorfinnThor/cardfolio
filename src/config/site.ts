import type { Metadata } from "next";

export const SITE_ORIGIN = "https://yourcardbinder.com";
export const SITE_NAME = "Cardfolio";

/** Shared social preview (1200 × 630, text only). Pages that set their own `openGraph` must list it again. */
export const OG_IMAGE = { url: "/og-cardfolio.png", width: 1200, height: 630, alt: "Cardfolio: Pokémon-Binder als Geschenk zusammenstellen" } as const;

export type PageLanguage = "de" | "en";

/** The same page in another language. Both directions must be declared, or hreflang is ignored. */
export interface LanguageAlternates {
  de: string;
  en: string;
  /** Page shown to visitors whose language matches neither version. Defaults to the German page. */
  xDefault?: string;
}

/* Canonical, hreflang and Open Graph URLs for one route. Pass paths with their trailing slash, e.g. "/help/". */
export function pageUrlMetadata(
  path: string,
  title: string,
  description: string,
  options: { alternates?: LanguageAlternates; language?: PageLanguage } = {},
): Pick<Metadata, "alternates" | "openGraph"> {
  const { alternates, language = "de" } = options;
  return {
    alternates: {
      canonical: path,
      ...(alternates ? { languages: { de: alternates.de, en: alternates.en, "x-default": alternates.xDefault ?? alternates.de } } : {}),
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      url: path,
      title,
      description,
      images: [OG_IMAGE],
      locale: language === "de" ? "de_DE" : "en_GB",
      ...(alternates ? { alternateLocale: language === "de" ? "en_GB" : "de_DE" } : {}),
    },
  };
}

export function absoluteUrl(path: string): string {
  return `${SITE_ORIGIN}${path}`;
}
