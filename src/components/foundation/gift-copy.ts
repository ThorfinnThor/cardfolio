import type { GiftCardCandidate } from "@/domain/gift-builder";
import type { VariantSelection } from "@/domain/types";

export type GiftLanguage = "de" | "en";

/**
 * Pokémon a gift buyer is likely to recognise, with the name used by the card
 * catalogue in each language. The search runs on these names, so a quick pick
 * must follow the selected card language.
 */
export const POPULAR_POKEMON = [
  { de: "Pikachu", en: "Pikachu" },
  { de: "Glurak", en: "Charizard" },
  { de: "Evoli", en: "Eevee" },
  { de: "Mew", en: "Mew" },
  { de: "Bisasam", en: "Bulbasaur" },
  { de: "Schiggy", en: "Squirtle" },
  { de: "Relaxo", en: "Snorlax" },
  { de: "Gengar", en: "Gengar" },
  { de: "Lucario", en: "Lucario" },
  { de: "Dragoran", en: "Dragonite" },
  { de: "Mimigma", en: "Mimikyu" },
  { de: "Enton", en: "Psyduck" },
] as const;

export function popularPokemonName(entry: (typeof POPULAR_POKEMON)[number], language: GiftLanguage): string {
  return entry[language];
}

/** Keeps a quick pick valid when the card language changes; free text is left untouched. */
export function translatePopularPokemon(query: string, language: GiftLanguage): string {
  const normalized = query.trim().toLocaleLowerCase("de");
  const match = POPULAR_POKEMON.find((entry) =>
    entry.de.toLocaleLowerCase("de") === normalized || entry.en.toLocaleLowerCase("de") === normalized);
  return match ? match[language] : query;
}

/**
 * Describes a card version only when it differs from what a beginner expects.
 * "Normal / Unlimited / mit Schatten" is the unremarkable default and is not
 * worth a line of jargon on every card.
 */
export function plainVariantNote(variant: VariantSelection): string | undefined {
  const parts: string[] = [];
  if (variant.finish === "holo") parts.push("Holo");
  else if (variant.finish === "reverse") parts.push("Reverse Holo");
  else if (variant.finish === "other") parts.push(variant.label?.trim() || "Besondere Ausführung");
  else if (variant.finish === "unspecified") parts.push("Ausführung noch offen");
  if (variant.edition === "first-edition") parts.push("1. Edition");
  if (variant.printing === "shadowless") parts.push("Shadowless");
  return parts.length ? parts.join(" · ") : undefined;
}

export function plainPriceSource(source: GiftCardCandidate["price"]["source"]): string | undefined {
  if (source === "tcgdex-cardmarket") return "Cardmarket";
  if (source === "tcgdex-tcgplayer") return "TCGplayer";
  return undefined;
}

/** True when the proposal uses clearly less than the budget, so the buyer is told that is intentional. */
export function hasBudgetSlack(estimatedTotalMinor: number | undefined, budgetMinor: number): boolean {
  return estimatedTotalMinor !== undefined && budgetMinor > 0 && estimatedTotalMinor <= budgetMinor * 0.4;
}

export function chunkIntoPages<T>(items: readonly T[], pageSize = 9): T[][] {
  const pages: T[][] = [];
  for (let offset = 0; offset < items.length; offset += pageSize) pages.push(items.slice(offset, offset + pageSize));
  return pages;
}
