import type { MissingItem } from "./types";
import { formatCollectorNumber } from "./catalog-search";

export const CARDMARKET_POKEMON_SINGLES_URL = "https://www.cardmarket.com/en/Pokemon/Products/Singles";
export const CARDMARKET_POKEMON_SEARCH_URL = "https://www.cardmarket.com/en/Pokemon/Products/Search";
export const CARDMARKET_POKEMON_WANTS_HELP_URL = "https://help.cardmarket.com/en/how-to-add-a-pkmn-decklist-to-wants";
export const CARDMARKET_MAX_WANTS_POSITIONS = 150;

export interface CardmarketHandoffPart {
  index: number;
  positionCount: number;
  importablePositionCount: number;
  text: string;
  items: readonly MissingItem[];
  searches: CardmarketSearchTarget[];
}

export interface CardmarketSearchTarget {
  identityKey: string;
  label: string;
  details: string;
  url: string;
}

export interface CardmarketHandoff {
  parts: CardmarketHandoffPart[];
  positionCount: number;
  importablePositionCount: number;
  excluded: CardmarketExcludedItem[];
  totalQuantity: number;
  reviewRequiredCount: number;
  warnings: string[];
  singlesUrl: typeof CARDMARKET_POKEMON_SINGLES_URL;
  wantsHelpUrl: typeof CARDMARKET_POKEMON_WANTS_HELP_URL;
}

export interface CardmarketExcludedItem {
  identityKey: string;
  label: string;
  reason: string;
}

function inline(value: string): string {
  const normalized = value.replace(/[\r\n\u0000-\u001f\u007f|]+/g, " ").replace(/\s+/g, " ").trim();
  return normalized || "Nicht angegeben";
}

function createDecklistLine(item: MissingItem): { line?: string; reason?: string } {
  if (!item.card.category || item.card.abilities === undefined || item.card.attacks === undefined) {
    return { reason: "Kartentyp, Fähigkeiten und Attacken müssen zuerst aus dem Katalog aktualisiert werden." };
  }

  if (item.card.category !== "pokemon") {
    return { line: `${item.quantity}x ${inline(item.card.name)}` };
  }

  const identifyingDetails = [...item.card.abilities, ...item.card.attacks].map(inline).filter(Boolean);
  if (!identifyingDetails.length) {
    return { reason: "Cardmarket benötigt bei Pokémon mindestens eine Fähigkeit oder Attacke zur eindeutigen Suche." };
  }

  return { line: `${item.quantity}x ${[inline(item.card.name), ...identifyingDetails].join(" ")}` };
}

export function createCardmarketSearchUrl(item: MissingItem): string {
  const url = new URL(CARDMARKET_POKEMON_SEARCH_URL);
  url.searchParams.set("searchString", [
    inline(item.card.name),
    inline(item.card.setName),
    inline(formatCollectorNumber(item.card.collectorNumber, item.card.collectorTotal)),
  ].join(" "));
  return url.toString();
}

function createSearchTarget(item: MissingItem): CardmarketSearchTarget {
  return {
    identityKey: item.identityKey,
    label: `${item.quantity}× ${inline(item.card.name)}`,
    details: `${inline(item.card.setName)} · Nr. ${inline(formatCollectorNumber(item.card.collectorNumber, item.card.collectorTotal))} · ${item.card.ref.language.toUpperCase()}`,
    url: createCardmarketSearchUrl(item),
  };
}

export function createCardmarketHandoff(items: readonly MissingItem[]): CardmarketHandoff {
  const parts: CardmarketHandoffPart[] = [];
  const matches = items.map((item) => ({ item, ...createDecklistLine(item) }));
  const excluded = matches
    .filter((match) => !match.line)
    .map((match) => ({
      identityKey: match.item.identityKey,
      label: `${match.item.quantity}× ${inline(match.item.card.name)} · ${inline(match.item.card.setName)} · Nr. ${inline(formatCollectorNumber(match.item.card.collectorNumber, match.item.card.collectorTotal))}`,
      reason: match.reason ?? "Kein sicheres Cardmarket-Importformat verfügbar.",
    }));

  for (let start = 0; start < items.length; start += CARDMARKET_MAX_WANTS_POSITIONS) {
    const partItems = items.slice(start, start + CARDMARKET_MAX_WANTS_POSITIONS);
    const partMatches = matches.slice(start, start + CARDMARKET_MAX_WANTS_POSITIONS);
    parts.push({
      index: parts.length + 1,
      positionCount: partItems.length,
      importablePositionCount: partMatches.filter((match) => match.line).length,
      text: partMatches.flatMap((match) => match.line ? [match.line] : []).join("\n"),
      items: partItems,
      searches: partItems.map(createSearchTarget),
    });
  }

  const warnings = items.length
    ? [
        "Offizielles Pokémon-Decklistenformat: Menge, vollständiger Kartenname, Fähigkeiten und Attacken – eine Karte pro Zeile.",
        "Das Decklistenformat legt Set, Kartennummer, Sprache und Druckvariante nicht fest.",
        "Vor dem Kauf jede Position anhand von Set, Kartennummer, Sprache, Finish, Edition, Druckvariante und Zustand prüfen.",
      ]
    : [];

  if (excluded.length > 0) {
    warnings.push(`${excluded.length} Position(en) fehlen die für das offizielle Cardmarket-Format benötigten Katalogdaten und wurden nicht in den Importtext aufgenommen.`);
  }

  if (parts.length > 1) {
    warnings.push(`Cardmarket erlaubt höchstens ${CARDMARKET_MAX_WANTS_POSITIONS} Einträge pro Wants-Liste. Die ${items.length} Positionen wurden deshalb in ${parts.length} Teile aufgeteilt.`);
  }

  return {
    parts,
    positionCount: items.length,
    importablePositionCount: matches.filter((match) => match.line).length,
    excluded,
    totalQuantity: items.reduce((total, item) => total + item.quantity, 0),
    reviewRequiredCount: items.length,
    warnings,
    singlesUrl: CARDMARKET_POKEMON_SINGLES_URL,
    wantsHelpUrl: CARDMARKET_POKEMON_WANTS_HELP_URL,
  };
}
