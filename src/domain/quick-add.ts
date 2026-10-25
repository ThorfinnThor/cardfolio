import { type SlotLocation, setCopyDetails, setOwned } from "./binder-actions";
import { applyPageSelection, type PageSelectionItem, type PageSelectionTarget } from "./page-selection";
import { sameCollectorPart } from "./catalog-search";
import { MAX_COPIES, type Binder, type CardSnapshot, type OwnedCondition } from "./types";
import { createInitialVariantSelection, variantAvailabilityForCard } from "./variant-selection";

export const MAX_RANGE = 400;

export interface QuickAddToken {
  /** The collector number as typed, without leading zeros on pure numbers ("004" is "4") and in capitals ("tg05" is "TG05"). */
  number: string;
  quantity: number;
}

export interface QuickAddSection {
  /** The set as typed before a colon; empty for numbers that belong to the set chosen in the panel. */
  setText: string;
  tokens: QuickAddToken[];
  /** Pieces of the text that are not a number, a range or a quantity. */
  invalid: string[];
}

function normalizeNumber(value: string): string {
  const upper = value.toUpperCase();
  return /^\d+$/.test(upper) ? String(Number(upper)) : upper;
}

const SINGLE = /^([A-Za-z]{0,4}\d{1,4}[A-Za-z]?)(?:\/\d{1,4})?(?:[x×*](\d{1,2}))?$/;
const RANGE = /^(\d{1,4})-(\d{1,4})(?:[x×*](\d{1,2}))?$/;

function mergeTokens(tokens: readonly QuickAddToken[]): QuickAddToken[] {
  const merged = new Map<string, QuickAddToken>();
  for (const token of tokens) {
    const key = token.number.toLowerCase();
    const existing = merged.get(key);
    if (existing) existing.quantity = Math.min(MAX_COPIES, existing.quantity + token.quantity);
    else merged.set(key, { ...token });
  }
  return [...merged.values()];
}

/**
 * Reads "4 5 6, 10-15 25x2 TG05 102/102" into numbers with a quantity. Separators are spaces, commas, semicolons and line
 * breaks; a range counts every number in it; a number typed twice adds up. Nothing here looks at the catalogue.
 */
export function parseQuickAddNumbers(text: string): { tokens: QuickAddToken[]; invalid: string[] } {
  const tokens: QuickAddToken[] = [];
  const invalid: string[] = [];
  for (const piece of text.split(/[\s,;]+/).filter(Boolean)) {
    const range = RANGE.exec(piece);
    if (range) {
      const [from, to, quantity] = [Number(range[1]), Number(range[2]), Number(range[3] ?? 1)];
      if (to < from || to - from + 1 > MAX_RANGE || quantity < 1) { invalid.push(piece); continue; }
      for (let number = from; number <= to; number += 1) tokens.push({ number: String(number), quantity });
      continue;
    }
    const single = SINGLE.exec(piece);
    if (single && Number(single[2] ?? 1) >= 1) tokens.push({ number: normalizeNumber(single[1]!), quantity: Number(single[2] ?? 1) });
    else invalid.push(piece);
  }
  return { tokens: mergeTokens(tokens), invalid };
}

/**
 * Splits a pasted list into sections. A line "Base Set: 4 5 6" names its set; a line without a colon belongs to the set
 * chosen in the panel (setText empty). Lines of one set are merged.
 */
export function parseQuickAddText(text: string): QuickAddSection[] {
  const sections = new Map<string, { tokens: QuickAddToken[]; invalid: string[] }>();
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const colon = line.indexOf(":");
    const setText = colon >= 0 ? line.slice(0, colon).trim() : "";
    const parsed = parseQuickAddNumbers(colon >= 0 ? line.slice(colon + 1) : line);
    const section = sections.get(setText.toLowerCase()) ?? { tokens: [], invalid: [] };
    section.tokens.push(...parsed.tokens);
    section.invalid.push(...parsed.invalid);
    sections.set(setText.toLowerCase(), section);
  }
  const names = new Map<string, string>();
  for (const line of text.split(/\r?\n/)) {
    const colon = line.indexOf(":");
    if (colon >= 0 && !names.has(line.slice(0, colon).trim().toLowerCase())) names.set(line.slice(0, colon).trim().toLowerCase(), line.slice(0, colon).trim());
  }
  return [...sections.entries()].map(([key, section]) => ({ setText: names.get(key) ?? "", tokens: mergeTokens(section.tokens), invalid: section.invalid }));
}

/** The catalogue card with this collector number in a loaded set, or undefined. Leading zeros do not matter ("4" is "004"). */
export function cardForNumber<T extends { collectorNumber: string }>(items: readonly T[], number: string): T | undefined {
  return items.find((item) => sameCollectorPart(item.collectorNumber, number));
}

export interface QuickAddAddition {
  card: CardSnapshot;
  quantity: number;
}

export interface QuickAddChange {
  card: CardSnapshot;
  quantity: number;
  /** The slot entry that already holds this card, when the binder has one. */
  existingEntryId?: string;
  /** Copies already counted for that entry (0 when it was planned but not owned). */
  alreadyOwned: number;
}

/** Merges duplicates and looks up which cards the binder already holds. */
export function planQuickAdd(binder: Binder, additions: readonly QuickAddAddition[]): QuickAddChange[] {
  const byKey = new Map<string, QuickAddAddition>();
  for (const addition of additions) {
    const existing = byKey.get(addition.card.key);
    if (existing) byKey.set(addition.card.key, { card: existing.card, quantity: Math.min(MAX_COPIES, existing.quantity + addition.quantity) });
    else byKey.set(addition.card.key, { ...addition });
  }
  const entries = binder.pages.flatMap((page) => page.slots).filter((entry) => entry !== null);
  return [...byKey.values()].map(({ card, quantity }) => {
    const entry = entries.find((candidate) => candidate.cardKey === card.key);
    return { card, quantity, existingEntryId: entry?.id, alreadyOwned: entry?.owned ? (entry.quantity ?? 1) : 0 };
  });
}

function firstFreeSlot(binder: Binder): SlotLocation | undefined {
  for (const page of binder.pages) {
    const slotIndex = page.slots.findIndex((slot) => slot === null);
    if (slotIndex >= 0) return { pageId: page.id, slotIndex };
  }
  return undefined;
}

export interface QuickAddResult {
  binder: Binder;
  /** Snapshots of the cards that were placed, to be saved with the binder. */
  cards: CardSnapshot[];
  added: number;
  updated: number;
  /** New entries whose printing could not be settled and needs a look. */
  reviewRequired: number;
}

/**
 * Puts the cards into the binder as owned: a card the binder already holds gets its copies raised, every other card goes
 * into the free slots in reading order (new pages when needed). Condition is recorded when given.
 */
export function applyQuickAdd(binder: Binder, changes: readonly QuickAddChange[], condition?: OwnedCondition): QuickAddResult {
  let next = binder;
  let updated = 0;
  for (const change of changes) {
    if (!change.existingEntryId) continue;
    next = setOwned(next, change.existingEntryId, true);
    next = setCopyDetails(next, change.existingEntryId, { quantity: Math.min(MAX_COPIES, change.alreadyOwned + change.quantity), ...(condition ? { condition } : {}) });
    updated += 1;
  }
  const fresh = changes.filter((change) => !change.existingEntryId);
  if (fresh.length === 0) return { binder: next, cards: [], added: 0, updated, reviewRequired: 0 };

  const items: PageSelectionItem[] = fresh.map((change) => ({
    card: change.card,
    variant: createInitialVariantSelection(variantAvailabilityForCard(change.card)),
    preferences: { minimumCondition: condition ?? "excellent" },
  }));
  const start = firstFreeSlot(next);
  const target: PageSelectionTarget = start
    ? { kind: "fill-continuously", binder: next, start, overflow: "add-pages" }
    : { kind: "new-page", binder: next, overflow: "add-pages" };
  const placed = applyPageSelection({ items, allowUnresolvedVariants: true }, target);
  next = placed.binder;
  fresh.forEach((change, index) => {
    const placement = placed.placements[index]!;
    next = setOwned(next, placement.entryId, true);
    next = setCopyDetails(next, placement.entryId, { quantity: change.quantity, ...(condition ? { condition } : {}) });
  });
  return { binder: next, cards: placed.cards, added: fresh.length, updated, reviewRequired: placed.placements.filter((placement) => placement.variantReviewRequired).length };
}
