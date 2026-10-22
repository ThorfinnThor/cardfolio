import type { Binder, CardSnapshot, VariantSelection } from "./types";

export interface PlaceholderCard {
  /** "Seite 2 · Platz 5", counted in reading order. */
  position: string;
  kind: "missing" | "free";
  name?: string;
  setName?: string;
  collectorNumber?: string;
  language?: "de" | "en";
  variant?: string;
}

/** "Holo · 1. Edition · Shadowless": only what differs from a plain Unlimited card. */
function compactVariant(variant: VariantSelection): string | undefined {
  const parts = [
    variant.label?.trim() || (variant.finish === "holo" ? "Holo" : variant.finish === "reverse" ? "Reverse Holo" : undefined),
    variant.edition === "first-edition" ? "1. Edition" : undefined,
    variant.printing === "shadowless" ? "Shadowless" : undefined,
  ].filter((part): part is string => Boolean(part));
  return parts.length ? parts.join(" · ") : undefined;
}

export interface PlaceholderOptions {
  /** Planned cards that are not owned yet (default on). */
  missing: boolean;
  /** Slots without any planned card, printed blank with their position. */
  free: boolean;
}

/** Placeholders per sheet: 3 × 3 cards of 63 × 88 mm fit on one A4 page. */
export const PLACEHOLDERS_PER_SHEET = 9;

/**
 * Text-only stand-ins to slip into a physical binder until the real card arrives. They carry page, slot, name, set,
 * number and language, never a card picture. Owned cards get no placeholder.
 */
export function createPlaceholders(binder: Binder, cards: ReadonlyMap<string, CardSnapshot>, options: PlaceholderOptions): PlaceholderCard[] {
  const result: PlaceholderCard[] = [];
  binder.pages.forEach((page, pageIndex) => {
    page.slots.forEach((slot, slotIndex) => {
      const position = `Seite ${pageIndex + 1} · Platz ${slotIndex + 1}`;
      if (!slot) {
        if (options.free) result.push({ position, kind: "free" });
        return;
      }
      if (slot.owned || !options.missing) return;
      const card = cards.get(slot.cardKey);
      if (!card) return;
      result.push({
        position,
        kind: "missing",
        name: card.name,
        setName: card.setName,
        collectorNumber: card.collectorTotal ? `${card.collectorNumber}/${card.collectorTotal}` : card.collectorNumber,
        language: card.ref.language,
        variant: compactVariant(slot.variant),
      });
    });
  });
  return result;
}

export function placeholderSheets(placeholders: readonly PlaceholderCard[]): PlaceholderCard[][] {
  const sheets: PlaceholderCard[][] = [];
  for (let index = 0; index < placeholders.length; index += PLACEHOLDERS_PER_SHEET) sheets.push(placeholders.slice(index, index + PLACEHOLDERS_PER_SHEET));
  return sheets;
}
