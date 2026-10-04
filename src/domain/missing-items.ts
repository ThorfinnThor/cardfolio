import type { Binder, CardSnapshot, MissingItem, PlannedCard } from "./types";
import { compareCollectorNumbers } from "./catalog-sort";

export interface MissingItemSetGroup {
  key: string;
  setId: string;
  setName: string;
  language: CardSnapshot["ref"]["language"];
  positionCount: number;
  quantity: number;
  items: MissingItem[];
}

function identity(entry: PlannedCard): string {
  return JSON.stringify([
    entry.cardKey,
    entry.variant.finish,
    entry.variant.edition,
    entry.variant.printing ?? "unspecified",
    entry.variant.label ?? "",
    entry.preferences.minimumCondition,
  ]);
}

export function deriveMissingItems(
  binder: Binder,
  cards: ReadonlyMap<string, CardSnapshot>,
): MissingItem[] {
  const grouped = new Map<string, MissingItem>();
  for (const entry of binder.pages.flatMap((page) => page.slots)) {
    if (!entry || entry.owned) continue;
    const card = cards.get(entry.cardKey);
    if (!card) throw new Error(`Missing card snapshot for ${entry.cardKey}.`);
    const key = identity(entry);
    const current = grouped.get(key);
    if (current) {
      current.quantity += 1;
      current.entryIds.push(entry.id);
    } else {
      grouped.set(key, {
        identityKey: key,
        card,
        variant: { ...entry.variant },
        preferences: { ...entry.preferences },
        quantity: 1,
        entryIds: [entry.id],
      });
    }
  }
  return sortMissingItems([...grouped.values()]);
}

export function sortMissingItems(items: readonly MissingItem[]): MissingItem[] {
  return [...items].sort((left, right) => {
    const setComparison = left.card.setName.localeCompare(right.card.setName, "de", { sensitivity: "base" });
    if (setComparison) return setComparison;
    const languageComparison = left.card.ref.language.localeCompare(right.card.ref.language);
    if (languageComparison) return languageComparison;
    const numberComparison = compareCollectorNumbers(left.card.collectorNumber, right.card.collectorNumber);
    if (numberComparison) return numberComparison;
    return left.card.name.localeCompare(right.card.name, "de", { sensitivity: "base" });
  });
}

/** Groups purchase needs without changing the physical order of binder slots. */
export function groupMissingItemsBySet(items: readonly MissingItem[]): MissingItemSetGroup[] {
  const groups = new Map<string, MissingItemSetGroup>();
  for (const item of sortMissingItems(items)) {
    const key = `${item.card.ref.language}:${item.card.setId}`;
    const current = groups.get(key);
    if (current) {
      current.items.push(item);
      current.positionCount += 1;
      current.quantity += item.quantity;
      continue;
    }
    groups.set(key, {
      key,
      setId: item.card.setId,
      setName: item.card.setName,
      language: item.card.ref.language,
      positionCount: 1,
      quantity: item.quantity,
      items: [item],
    });
  }
  return [...groups.values()].sort((left, right) => {
    const nameComparison = left.setName.localeCompare(right.setName, "de", { sensitivity: "base" });
    if (nameComparison) return nameComparison;
    return left.language.localeCompare(right.language);
  });
}

export function deriveMissingItemGroups(
  binder: Binder,
  cards: ReadonlyMap<string, CardSnapshot>,
): MissingItemSetGroup[] {
  return groupMissingItemsBySet(deriveMissingItems(binder, cards));
}
