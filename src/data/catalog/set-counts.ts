import deCatalog from "../../../public/data/catalog/de-sets.json";
import enCatalog from "../../../public/data/catalog/en-sets.json";

import {
  searchCatalogSetIndex,
  type CatalogSetIndexEntry,
  type CatalogSetMetadata,
  type CatalogSetSearchLanguage,
} from "@/domain/catalog-set";
import type { CardLanguage, CardSnapshot } from "@/domain/types";
import { verifiedImageFallback } from "./image-fallbacks";

export type CatalogSetRecord = {
  id: string;
  name: string;
  cardCount: { official: number; total: number };
  series?: { id: string; name: string };
  releaseDate?: string;
  logo?: string;
  symbol?: string;
};

export type CatalogSeriesRecord = { id: string; name: string };

const catalogItems: Record<CardLanguage, readonly CatalogSetRecord[]> = {
  de: deCatalog.items,
  en: enCatalog.items,
};

const catalogs: Record<CardLanguage, Map<string, CatalogSetRecord>> = {
  de: new Map(deCatalog.items.map((set) => [set.id, set])),
  en: new Map(enCatalog.items.map((set) => [set.id, set])),
};

export function catalogSets(language: CardLanguage, seriesId?: string): readonly CatalogSetRecord[] {
  return catalogItems[language]
    .filter((set) => !seriesId || set.series?.id === seriesId)
    .toSorted((left, right) => left.name.localeCompare(right.name, language));
}

export function catalogSeries(language: CardLanguage): readonly CatalogSeriesRecord[] {
  const unique = new Map<string, CatalogSeriesRecord>();
  for (const set of catalogItems[language]) {
    if (set.series) unique.set(set.series.id, set.series);
  }
  return [...unique.values()].toSorted((left, right) => left.name.localeCompare(right.name, language));
}

export function catalogSetMetadata(language: CardLanguage, setId: string): CatalogSetMetadata | undefined {
  const set = catalogs[language].get(setId);
  if (!set) return undefined;
  return {
    provider: "tcgdex",
    id: set.id,
    language,
    name: set.name,
    series: set.series ? { ...set.series } : undefined,
    releaseDate: set.releaseDate,
    cardCount: { ...set.cardCount },
    logo: set.logo ? { kind: "logo", baseUrl: set.logo } : undefined,
    symbol: set.symbol ? { kind: "symbol", baseUrl: set.symbol } : undefined,
  };
}

const mergedSetIndex: readonly CatalogSetIndexEntry[] = (() => {
  const entries = new Map<string, CatalogSetIndexEntry>();
  for (const language of ["de", "en"] as const) {
    for (const set of catalogItems[language]) {
      const current = entries.get(set.id) ?? {
        provider: "tcgdex",
        id: set.id,
        names: {},
        series: {},
        releaseDate: set.releaseDate,
        cardCount: { ...set.cardCount },
        assets: {},
      } satisfies CatalogSetIndexEntry;
      current.names[language] = set.name;
      if (set.series) current.series[language] = { ...set.series };
      current.releaseDate ??= set.releaseDate;
      current.cardCount = current.cardCount.total >= set.cardCount.total ? current.cardCount : { ...set.cardCount };
      current.assets[language] = {
        logo: set.logo ? { kind: "logo", baseUrl: set.logo } : undefined,
        symbol: set.symbol ? { kind: "symbol", baseUrl: set.symbol } : undefined,
      };
      entries.set(set.id, current);
    }
  }
  return [...entries.values()].toSorted((left, right) => {
    const dateComparison = (right.releaseDate ?? "").localeCompare(left.releaseDate ?? "");
    if (dateComparison) return dateComparison;
    return (left.names.de ?? left.names.en ?? left.id).localeCompare(right.names.de ?? right.names.en ?? right.id, "de");
  });
})();

export function catalogSetIndex(): readonly CatalogSetIndexEntry[] {
  return mergedSetIndex;
}

export function searchCatalogSets(
  query: string,
  language: CatalogSetSearchLanguage = "all",
): CatalogSetIndexEntry[] {
  return searchCatalogSetIndex(mergedSetIndex, query, language);
}

export function setIdFromCardId(cardId: string, localId: string): string | undefined {
  const normalizedNumericId = /^\d+$/.test(localId) ? String(Number(localId)) : localId;
  for (const candidate of new Set([localId, normalizedNumericId])) {
    const suffix = `-${candidate}`;
    if (cardId.endsWith(suffix)) return cardId.slice(0, -suffix.length);
  }
  return undefined;
}

export function collectorTotalForSearchItem(
  language: CardLanguage,
  cardId: string,
  localId: string,
): string | undefined {
  const setId = setIdFromCardId(cardId, localId);
  const count = setId ? catalogs[language].get(setId)?.cardCount : undefined;
  if (!count) return undefined;
  const printedTotal = count.official > 0 ? count.official : count.total;
  return printedTotal > 0 ? String(printedTotal) : undefined;
}

export function setMetadataForSearchItem(
  language: CardLanguage,
  cardId: string,
  localId: string,
): CatalogSetRecord | undefined {
  const setId = setIdFromCardId(cardId, localId);
  return setId ? catalogs[language].get(setId) : undefined;
}

export function completeCardSnapshotMetadata(card: CardSnapshot): CardSnapshot {
  const collectorTotal = card.collectorTotal ?? collectorTotalForSearchItem(card.ref.language, card.ref.id, card.collectorNumber);
  const verifiedFallback = verifiedImageFallback(card.ref.language, card.ref.id)
    ?? (card.ref.language === "de" ? verifiedImageFallback("en", card.ref.id) : undefined);
  const imageCandidates = [verifiedFallback, card.imageBaseUrl, card.imageFallbackBaseUrl]
    .filter((value): value is string => Boolean(value))
    .filter((value, index, values) => values.indexOf(value) === index);
  return {
    ...card,
    collectorTotal,
    imageBaseUrl: imageCandidates[0],
    imageFallbackBaseUrl: imageCandidates[1],
  };
}
