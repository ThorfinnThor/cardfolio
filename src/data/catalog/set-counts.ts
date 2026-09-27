import deCatalog from "../../../public/data/catalog/de-sets.json";
import enCatalog from "../../../public/data/catalog/en-sets.json";

import type { CardLanguage } from "@/domain/types";

type SetRecord = {
  id: string;
  cardCount: { official: number; total: number };
};

const catalogs: Record<CardLanguage, Map<string, SetRecord>> = {
  de: new Map(deCatalog.items.map((set) => [set.id, set])),
  en: new Map(enCatalog.items.map((set) => [set.id, set])),
};

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
