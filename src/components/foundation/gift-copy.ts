import type { GiftCardCandidate } from "@/domain/gift-builder";
import type { VariantSelection } from "@/domain/types";
import { parseGiftSubjects } from "@/domain/gift-subject";

export type GiftLanguage = "de" | "en";

/**
 * Pokémon a gift buyer is likely to recognise, with the name used by the card
 * catalogue in each language. The search runs on these names, so a quick pick
 * must follow the selected card language.
 */
/**
 * `image` is the TCGdex image base of one card that shows the Pokémon (checked 2026-11-17, picture only). It is loaded
 * from assets.tcgdex.net like every other card picture and never stored.
 */
export const POPULAR_POKEMON = [
  { de: "Pikachu", en: "Pikachu", image: "https://assets.tcgdex.net/en/sv/sv03.5/173" },
  { de: "Glurak", en: "Charizard", image: "https://assets.tcgdex.net/en/sv/sv03.5/199" },
  { de: "Evoli", en: "Eevee", image: "https://assets.tcgdex.net/en/sv/sv03.5/133" },
  { de: "Mew", en: "Mew", image: "https://assets.tcgdex.net/en/sv/sv03.5/193" },
  { de: "Bisasam", en: "Bulbasaur", image: "https://assets.tcgdex.net/en/sv/sv03.5/166" },
  { de: "Schiggy", en: "Squirtle", image: "https://assets.tcgdex.net/en/sv/sv03.5/170" },
  { de: "Relaxo", en: "Snorlax", image: "https://assets.tcgdex.net/en/sv/sv03.5/143" },
  { de: "Gengar", en: "Gengar", image: "https://assets.tcgdex.net/en/sv/sv03.5/094" },
  { de: "Lucario", en: "Lucario", image: "https://assets.tcgdex.net/en/swsh/swsh9/079" },
  { de: "Dragoran", en: "Dragonite", image: "https://assets.tcgdex.net/en/sv/sv03.5/149" },
  { de: "Mimigma", en: "Mimikyu", image: "https://assets.tcgdex.net/en/sv/sv02/097" },
  { de: "Enton", en: "Psyduck", image: "https://assets.tcgdex.net/en/sv/sv03.5/175" },
] as const;

export function popularPokemonName(entry: (typeof POPULAR_POKEMON)[number], language: GiftLanguage): string {
  return entry[language];
}

/** Keeps a quick pick valid when the card language changes; free text is left untouched, name by name. */
export function translatePopularPokemon(query: string, language: GiftLanguage): string {
  const translate = (name: string) => {
    const normalized = name.trim().toLocaleLowerCase("de");
    const match = POPULAR_POKEMON.find((entry) =>
      entry.de.toLocaleLowerCase("de") === normalized || entry.en.toLocaleLowerCase("de") === normalized);
    return match ? match[language] : name;
  };
  const subjects = parseGiftSubjects(query);
  if (subjects.length < 2) return translate(query);
  const translated = subjects.map(translate);
  return translated.every((name, index) => name === subjects[index]) ? query : translated.join(", ");
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
  if (source === "cardtrader") return "CardTrader (günstigstes Angebot)";
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
