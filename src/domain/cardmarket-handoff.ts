import type { MissingItem } from "./types";
import { formatCollectorNumber } from "./catalog-search";
import { minimumConditionLabels } from "./purchase-preferences";
import { printingLabels, selectedPrinting } from "./variant-selection";

export const CARDMARKET_POKEMON_SINGLES_URL = "https://www.cardmarket.com/en/Pokemon/Products/Singles";
export const CARDMARKET_POKEMON_WANTS_HELP_URL = "https://help.cardmarket.com/en/how-to-add-a-pkmn-decklist-to-wants";
export const CARDMARKET_MAX_WANTS_POSITIONS = 150;

const finishLabels = {
  normal: "Normal",
  holo: "Holo",
  reverse: "Reverse Holo",
  other: "Andere",
  unspecified: "Nicht angegeben",
} as const;

const editionLabels = {
  unlimited: "Unlimited",
  "first-edition": "First Edition",
  unspecified: "Nicht angegeben",
} as const;

export interface CardmarketHandoffPart {
  index: number;
  positionCount: number;
  text: string;
  items: readonly MissingItem[];
}

export interface CardmarketHandoff {
  parts: CardmarketHandoffPart[];
  positionCount: number;
  totalQuantity: number;
  reviewRequiredCount: number;
  warnings: string[];
  singlesUrl: typeof CARDMARKET_POKEMON_SINGLES_URL;
  wantsHelpUrl: typeof CARDMARKET_POKEMON_WANTS_HELP_URL;
}

function inline(value: string): string {
  const normalized = value.replace(/[\r\n\u0000-\u001f\u007f|]+/g, " ").replace(/\s+/g, " ").trim();
  return normalized || "Nicht angegeben";
}

function formatReferenceLine(item: MissingItem): string {
  const finish = item.variant.label ? inline(item.variant.label) : finishLabels[item.variant.finish];
  return [
    `${item.quantity}x ${inline(item.card.name)}`,
    inline(item.card.setName),
    `Nr. ${inline(formatCollectorNumber(item.card.collectorNumber, item.card.collectorTotal))}`,
    item.card.ref.language.toUpperCase(),
    finish,
    editionLabels[item.variant.edition],
    printingLabels[selectedPrinting(item.variant)],
    minimumConditionLabels[item.preferences.minimumCondition],
  ].join(" | ");
}

export function createCardmarketHandoff(items: readonly MissingItem[]): CardmarketHandoff {
  const parts: CardmarketHandoffPart[] = [];

  for (let start = 0; start < items.length; start += CARDMARKET_MAX_WANTS_POSITIONS) {
    const partItems = items.slice(start, start + CARDMARKET_MAX_WANTS_POSITIONS);
    parts.push({
      index: parts.length + 1,
      positionCount: partItems.length,
      text: partItems.map(formatReferenceLine).join("\n"),
      items: partItems,
    });
  }

  const warnings = items.length
    ? [
        "Keine Exakt-Garantie: Cardmarket kann trotz Name eine andere Ausgabe oder Illustration zuordnen.",
        "Vor dem Kauf jede Position anhand von Set, Kartennummer, Sprache, Finish, Edition, Druckvariante und Zustand prüfen.",
        "Diese Datei ist eine Prüfliste, kein automatisch zuordenbarer Pokémon-Decklistenimport: Cardfolio speichert Attacken und Fähigkeiten nicht verlässlich.",
      ]
    : [];

  if (parts.length > 1) {
    warnings.push(`Cardmarket erlaubt höchstens ${CARDMARKET_MAX_WANTS_POSITIONS} Einträge pro Wants-Liste. Die ${items.length} Positionen wurden deshalb in ${parts.length} Teile aufgeteilt.`);
  }

  return {
    parts,
    positionCount: items.length,
    totalQuantity: items.reduce((total, item) => total + item.quantity, 0),
    reviewRequiredCount: items.length,
    warnings,
    singlesUrl: CARDMARKET_POKEMON_SINGLES_URL,
    wantsHelpUrl: CARDMARKET_POKEMON_WANTS_HELP_URL,
  };
}
