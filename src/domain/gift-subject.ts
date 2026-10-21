import type { CardSnapshot } from "./types";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** A binder can be about at most this many Pokémon; more would leave too few cards for each. */
export const MAX_GIFT_SUBJECTS = 4;

/**
 * Splits what the buyer typed into Pokémon names: "Pikachu, Glurak", "Pikachu und Glurak", "Pikachu & Glurak" or
 * "Pikachu + Glurak" give two subjects. Hyphens and apostrophes stay (Ho-Oh, Farfetch'd), duplicates are dropped.
 */
export function parseGiftSubjects(query: string): string[] {
  const seen = new Set<string>();
  const subjects: string[] = [];
  for (const part of query.split(/\s*[,;+/]\s*|\s+(?:und|and|&)\s+/iu)) {
    const name = part.trim();
    const key = name.toLocaleLowerCase("de");
    if (!name || seen.has(key)) continue;
    seen.add(key);
    subjects.push(name);
  }
  return subjects.slice(0, MAX_GIFT_SUBJECTS);
}

function matchesOneSubject(card: Pick<CardSnapshot, "name" | "category">, needle: string): boolean {
  if (card.category === "trainer" || card.category === "energy") return false;
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(needle)}(?![\\p{L}\\p{N}])`, "iu");
  return pattern.test(card.name);
}

/** The subject (as typed, lower-cased) a card belongs to, or undefined when it matches none of them. */
export function giftSubjectOf(card: Pick<CardSnapshot, "name" | "category">, subjectQuery: string): string | undefined {
  const subject = parseGiftSubjects(subjectQuery).find((name) => matchesOneSubject(card, name));
  return subject?.toLocaleLowerCase("de");
}

/**
 * The catalogue search matches substrings, so "Evoli" also finds "Evolith" (the evolution-stone Trainer
 * card). A Pokémon gift should contain the Pokémon itself: the subject must appear as a whole word in the
 * card name ("Evoli", "Evoli-ex", "Dunkles Evoli"), and Trainer/Energy cards are not Pokémon. With several
 * subjects a card counts when it matches any of them.
 */
export function matchesGiftSubject(card: Pick<CardSnapshot, "name" | "category">, subject: string): boolean {
  const needles = parseGiftSubjects(subject);
  if (!needles.length) return true;
  return needles.some((needle) => matchesOneSubject(card, needle));
}

/**
 * Functional identity of a card: same name, level, suffix, abilities and attacks. Reprints of one card in
 * different sets share it and usually look the same to a gift buyer. Cards without attack data have no
 * reliable identity, so they are never treated as duplicates of each other.
 */
export function giftFunctionalKey(card: Pick<CardSnapshot, "name" | "level" | "suffix" | "abilities" | "attacks">): string | undefined {
  if (card.attacks === undefined && card.abilities === undefined) return undefined;
  const parts = [card.name, card.level ?? "", card.suffix ?? "", (card.abilities ?? []).join("+"), (card.attacks ?? []).join("+")];
  return parts.map((part) => part.trim().toLocaleLowerCase("de")).join("|");
}

/**
 * Splits candidates into those with a first-seen functional identity and the repeats. The input order is
 * kept inside both groups; `ordered` lists distinct cards first so that swapping never offers a repeat
 * before a different card is exhausted.
 */
export function separateRepeatedCards<T extends { card: CardSnapshot }>(candidates: readonly T[]): { distinct: T[]; repeats: T[]; ordered: T[] } {
  const seen = new Set<string>();
  const distinct: T[] = [];
  const repeats: T[] = [];
  for (const candidate of candidates) {
    const key = giftFunctionalKey(candidate.card);
    if (key === undefined || !seen.has(key)) {
      if (key !== undefined) seen.add(key);
      distinct.push(candidate);
    } else {
      repeats.push(candidate);
    }
  }
  return { distinct, repeats, ordered: [...distinct, ...repeats] };
}
