import deCatalog from "../../../public/data/catalog/de-sets.json";
import enCatalog from "../../../public/data/catalog/en-sets.json";

import type { CardLanguage, CardSnapshot } from "@/domain/types";

export type CatalogSetRecord = {
  id: string;
  name: string;
  cardCount: { official: number; total: number };
  series?: { id: string; name: string };
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
  if (card.collectorTotal) return card;
  const collectorTotal = collectorTotalForSearchItem(card.ref.language, card.ref.id, card.collectorNumber);
  return collectorTotal ? { ...card, collectorTotal } : card;
}
