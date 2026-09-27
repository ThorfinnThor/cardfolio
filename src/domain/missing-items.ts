import type { Binder, CardSnapshot, MissingItem, PlannedCard } from "./types";

function identity(entry: PlannedCard): string {
  return JSON.stringify([
    entry.cardKey,
    entry.variant.finish,
    entry.variant.edition,
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
  return [...grouped.values()];
}
