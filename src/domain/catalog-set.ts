import type { CardLanguage } from "./types";

export type CatalogProviderId = "tcgdex" | (string & {});

export interface CatalogSetAsset {
  kind: "logo" | "symbol";
  baseUrl: string;
}

export interface CatalogSetMetadata {
  provider: CatalogProviderId;
  id: string;
  language: CardLanguage;
  name: string;
  series?: { id: string; name: string };
  releaseDate?: string;
  cardCount: { official: number; total: number };
  logo?: CatalogSetAsset;
  symbol?: CatalogSetAsset;
}

export interface CatalogSetIndexEntry {
  provider: CatalogProviderId;
  id: string;
  names: Partial<Record<CardLanguage, string>>;
  series: Partial<Record<CardLanguage, { id: string; name: string }>>;
  releaseDate?: string;
  cardCount: { official: number; total: number };
  assets: Partial<Record<CardLanguage, { logo?: CatalogSetAsset; symbol?: CatalogSetAsset }>>;
}

export type CatalogSetSearchLanguage = CardLanguage | "all";

export function catalogSetKey(provider: CatalogProviderId, id: string): string {
  return `${provider}:${id}`;
}

export function catalogSetAssetUrl(asset: CatalogSetAsset, format: "webp" | "png" = "webp"): string {
  const url = new URL(asset.baseUrl);
  if (url.protocol !== "https:") throw new Error("Set assets must use HTTPS.");
  return `${url.toString().replace(/\/$/, "")}.${format}`;
}

function normalizedSearchText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("de-DE")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function searchableText(entry: CatalogSetIndexEntry, language: CatalogSetSearchLanguage): string {
  const languages: CardLanguage[] = language === "all" ? ["de", "en"] : [language];
  return normalizedSearchText([
    entry.id,
    ...languages.flatMap((candidate) => [entry.names[candidate], entry.series[candidate]?.name]),
  ].filter(Boolean).join(" "));
}

/** Searches provider-neutral set metadata without depending on a UI component. */
export function searchCatalogSetIndex(
  entries: readonly CatalogSetIndexEntry[],
  query: string,
  language: CatalogSetSearchLanguage = "all",
): CatalogSetIndexEntry[] {
  const terms = normalizedSearchText(query).split(" ").filter(Boolean);
  if (!terms.length) return [...entries];
  return entries.filter((entry) => {
    const haystack = searchableText(entry, language);
    return terms.every((term) => haystack.includes(term));
  });
}
