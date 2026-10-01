import enImageFallbacks from "../../../public/data/catalog/en-image-fallbacks.json";

import type { CardLanguage } from "@/domain/types";

function isTcgdexAsset(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "assets.tcgdex.net";
  } catch {
    return false;
  }
}

const fallbacks: Record<CardLanguage, Map<string, string>> = {
  de: new Map(),
  en: new Map(Object.entries(enImageFallbacks.items as Record<string, string>)
    .filter(([, url]) => isTcgdexAsset(url))),
};

/** A verified external image for a card that TCGdex lists without one, possibly in another language. */
export function verifiedImageFallback(language: CardLanguage, cardId: string): string | undefined {
  return fallbacks[language].get(cardId);
}

/** The language segment of an assets.tcgdex.net image reference, e.g. "de". */
export function imageLanguage(imageBaseUrl: string): string | undefined {
  try {
    return new URL(imageBaseUrl).pathname.split("/")[1] || undefined;
  } catch {
    return undefined;
  }
}
