import type { Binder, CardSnapshot } from "./types";

export interface SetProgress {
  /** Catalogue set id plus card language: the same set in German and English counts separately. */
  key: string;
  /** Catalogue set id, for the set's logo. */
  setId: string;
  setName: string;
  language: CardSnapshot["ref"]["language"];
  planned: number;
  owned: number;
  missing: number;
  /** Distinct cards of the set that are planned, regardless of how many copies. */
  distinctPlanned: number;
  /** Printed number of cards in the set, when the catalogue gives one. */
  totalInSet?: number;
  completionPercent: number;
}

function printedTotal(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

/**
 * Progress per set inside one binder: how many of the planned cards of each set are owned. Empty slots are not
 * counted (a blank slot is not a missing card), and a planned card whose snapshot is unknown is left out.
 */
export function deriveSetProgress(binder: Binder, cards: ReadonlyMap<string, CardSnapshot>): SetProgress[] {
  const rows = new Map<string, SetProgress & { distinctKeys: Set<string> }>();
  for (const entry of binder.pages.flatMap((page) => page.slots)) {
    if (!entry) continue;
    const card = cards.get(entry.cardKey);
    if (!card) continue;
    const key = `${card.setId}:${card.ref.language}`;
    const row = rows.get(key) ?? {
      key,
      setId: card.setId,
      setName: card.setName,
      language: card.ref.language,
      planned: 0,
      owned: 0,
      missing: 0,
      distinctPlanned: 0,
      totalInSet: printedTotal(card.collectorTotal),
      completionPercent: 0,
      distinctKeys: new Set<string>(),
    };
    row.planned += 1;
    if (entry.owned) row.owned += 1; else row.missing += 1;
    row.distinctKeys.add(card.key);
    row.totalInSet ??= printedTotal(card.collectorTotal);
    rows.set(key, row);
  }
  return [...rows.values()]
    .map(({ distinctKeys, ...row }) => ({
      ...row,
      distinctPlanned: distinctKeys.size,
      completionPercent: row.planned === 0 ? 0 : Math.round((row.owned / row.planned) * 100),
    }))
    .sort((left, right) => right.planned - left.planned || left.setName.localeCompare(right.setName, "de"));
}
