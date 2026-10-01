import { applyPageSelection, type PageSelectionPlacement } from "./page-selection";
import type {
  Binder,
  CardSnapshot,
  PurchasePreferences,
  UUID,
  VariantSelection,
} from "./types";
import { variantSelectionIssue } from "./variant-selection";

export type GiftRecipientKind = "partner" | "child" | "friend" | "other";
export type GiftOccasion = "birthday" | "christmas" | "anniversary" | "other";
export type GiftStyle = "mixed" | "vintage" | "modern" | "curated";
export type GiftCurrency = "EUR" | "USD";
export type GiftTargetCount = 9 | 18 | 36;
export type GiftPriceConfidence = "usable" | "approximate" | "unknown";

export interface GiftPreferences {
  recipientKind: GiftRecipientKind;
  recipientName?: string;
  occasion?: GiftOccasion;
  subjectQuery: string;
  targetCardCount: GiftTargetCount;
  budgetMinor: number;
  currency: GiftCurrency;
  budgetTolerancePercent?: 0 | 5 | 10 | 15;
  preferredLanguage?: "en" | "de";
  style: GiftStyle;
}

export interface GiftPriceRange {
  lowMinor: number;
  highMinor: number;
  lowMetric: string;
  highMetric: string;
}

export interface GiftPriceQuote {
  source?: "tcgdex-cardmarket" | "tcgdex-tcgplayer";
  currency: GiftCurrency;
  amountMinor?: number;
  metric?: "trend" | "avg30" | "avg" | "market" | "mid";
  range?: GiftPriceRange;
  fetchedAt: string;
  sourceUpdatedAt?: string;
  confidence: GiftPriceConfidence;
  issues: string[];
}

export interface GiftCardCandidate {
  card: CardSnapshot;
  variant: VariantSelection;
  preferences: PurchasePreferences;
  releaseYear?: number;
  price: GiftPriceQuote;
  reasonTags: string[];
}

export interface GiftProject {
  id: UUID;
  schemaVersion: 1;
  revision: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  preferences: GiftPreferences;
  binderId?: UUID;
  selectedCardKeys: string[];
  binderOfferId?: string;
}

export interface GiftPriceRequest {
  card: CardSnapshot;
  variant: VariantSelection;
  currency: GiftCurrency;
  rawPricing: unknown;
  fetchedAt: string;
  printingMatch: "verified-printing" | "candidate";
}

export interface PriceProvider {
  getPrice(request: GiftPriceRequest, signal?: AbortSignal): Promise<GiftPriceQuote>;
}

export interface GiftSelectionRequest {
  candidates: readonly GiftCardCandidate[];
  preferences: GiftPreferences;
}

export type GiftSelectionIssue =
  | "too-few-candidates"
  | "duplicates-removed"
  | "incomplete-variants"
  | "unknown-prices"
  | "approximate-prices"
  | "budget-impossible";

export interface GiftSelectionResult {
  selected: GiftCardCandidate[];
  estimatedTotalMinor?: number;
  unpricedCount: number;
  approximateCount: number;
  budgetStatus: "within" | "near" | "over" | "unknown";
  issues: GiftSelectionIssue[];
}

export interface GiftSelectionEngine {
  select(request: GiftSelectionRequest): GiftSelectionResult;
}

const MODERN_START_YEAR = 2010;

function validCandidate(candidate: GiftCardCandidate): boolean {
  return candidate.card.physicalStatus !== "digital"
    && candidate.card.key === `tcgdex:${candidate.card.ref.id}:${candidate.card.ref.language}`
    && !variantSelectionIssue(candidate.variant, candidate.card.availableVariants);
}

function styleMatches(candidate: GiftCardCandidate, style: GiftStyle): boolean {
  if (style === "vintage") return candidate.releaseYear !== undefined && candidate.releaseYear < MODERN_START_YEAR;
  if (style === "modern") return candidate.releaseYear !== undefined && candidate.releaseYear >= MODERN_START_YEAR;
  return true;
}

function hasArtwork(candidate: GiftCardCandidate): boolean {
  return Boolean(candidate.card.imageBaseUrl || candidate.card.imageFallbackBaseUrl);
}

function stableCandidateOrder(left: GiftCardCandidate, right: GiftCardCandidate): number {
  const leftPrice = left.price.amountMinor ?? Number.MAX_SAFE_INTEGER;
  const rightPrice = right.price.amountMinor ?? Number.MAX_SAFE_INTEGER;
  return leftPrice - rightPrice
    || Number(!hasArtwork(left)) - Number(!hasArtwork(right))
    || (left.releaseYear ?? Number.MAX_SAFE_INTEGER) - (right.releaseYear ?? Number.MAX_SAFE_INTEGER)
    || left.card.setId.localeCompare(right.card.setId)
    || left.card.key.localeCompare(right.card.key);
}

function diverseOrder(candidates: GiftCardCandidate[]): GiftCardCandidate[] {
  const remaining = [...candidates];
  const result: GiftCardCandidate[] = [];
  const setCounts = new Map<string, number>();
  const yearCounts = new Map<number, number>();
  while (remaining.length) {
    remaining.sort((left, right) =>
      (setCounts.get(left.card.setId) ?? 0) - (setCounts.get(right.card.setId) ?? 0)
      || (left.releaseYear === undefined ? 1 : yearCounts.get(left.releaseYear) ?? 0)
        - (right.releaseYear === undefined ? 1 : yearCounts.get(right.releaseYear) ?? 0)
      || stableCandidateOrder(left, right));
    const next = remaining.shift();
    if (!next) break;
    result.push(next);
    setCounts.set(next.card.setId, (setCounts.get(next.card.setId) ?? 0) + 1);
    if (next.releaseYear !== undefined) {
      yearCounts.set(next.releaseYear, (yearCounts.get(next.releaseYear) ?? 0) + 1);
    }
  }
  return result;
}

function diverseSelectionWithinBudget(
  candidates: GiftCardCandidate[],
  target: number,
  ceiling: number,
): GiftCardCandidate[] {
  const remaining = [...candidates];
  const selected: GiftCardCandidate[] = [];
  const setCounts = new Map<string, number>();
  const yearCounts = new Map<number, number>();
  let total = 0;
  while (selected.length < target) {
    const ranked = [...remaining].sort((left, right) =>
      (setCounts.get(left.card.setId) ?? 0) - (setCounts.get(right.card.setId) ?? 0)
      || (left.releaseYear === undefined ? 1 : yearCounts.get(left.releaseYear) ?? 0)
        - (right.releaseYear === undefined ? 1 : yearCounts.get(right.releaseYear) ?? 0)
      || stableCandidateOrder(left, right));
    const slotsAfterThis = target - selected.length - 1;
    const next = ranked.find((candidate) => {
      const reserve = remaining
        .filter((item) => item !== candidate)
        .sort(stableCandidateOrder)
        .slice(0, slotsAfterThis)
        .reduce((sum, item) => sum + (item.price.amountMinor ?? 0), 0);
      return total + (candidate.price.amountMinor ?? 0) + reserve <= ceiling;
    });
    if (!next) return [];
    selected.push(next);
    total += next.price.amountMinor ?? 0;
    remaining.splice(remaining.indexOf(next), 1);
    setCounts.set(next.card.setId, (setCounts.get(next.card.setId) ?? 0) + 1);
    if (next.releaseYear !== undefined) yearCounts.set(next.releaseYear, (yearCounts.get(next.releaseYear) ?? 0) + 1);
  }
  return selected;
}

function withReasonTags(candidate: GiftCardCandidate, selected: GiftCardCandidate[]): GiftCardCandidate {
  const tags = new Set(candidate.reasonTags);
  if (candidate.releaseYear !== undefined) {
    tags.add(candidate.releaseYear < MODERN_START_YEAR ? "vintage" : "modern");
  }
  if (!selected.some((item) => item.card.setId === candidate.card.setId)) tags.add("set-diversity");
  return { ...candidate, reasonTags: [...tags].sort() };
}

export class DeterministicGiftSelectionEngine implements GiftSelectionEngine {
  select({ candidates, preferences }: GiftSelectionRequest): GiftSelectionResult {
    assertGiftPreferences(preferences);
    const issues = new Set<GiftSelectionIssue>();
    const seen = new Set<string>();
    const eligible: GiftCardCandidate[] = [];
    for (const candidate of candidates) {
      if (seen.has(candidate.card.key)) {
        issues.add("duplicates-removed");
        continue;
      }
      seen.add(candidate.card.key);
      if (!validCandidate(candidate)) {
        issues.add("incomplete-variants");
        continue;
      }
      if (preferences.preferredLanguage && candidate.card.ref.language !== preferences.preferredLanguage) continue;
      if (!styleMatches(candidate, preferences.style)) continue;
      eligible.push(candidate);
    }

    const target = preferences.targetCardCount;
    const usable = eligible.filter((candidate) =>
      candidate.price.confidence === "usable"
      && candidate.price.currency === preferences.currency
      && candidate.price.amountMinor !== undefined,
    ).sort(stableCandidateOrder);
    const uncertain = eligible.filter((candidate) => !usable.includes(candidate)).sort(stableCandidateOrder);
    const tolerance = preferences.budgetTolerancePercent ?? 0;
    const ceiling = preferences.budgetMinor + Math.floor(preferences.budgetMinor * tolerance / 100);
    const cheapestTarget = usable.slice(0, target);
    const cheapestTotal = cheapestTarget.reduce((sum, item) => sum + (item.price.amountMinor ?? 0), 0);

    let selectedPool: GiftCardCandidate[];
    if (usable.length >= target && cheapestTotal <= ceiling) {
      // Prefer set/year diversity only when the cheapest remaining cards prove
      // that the choice can still finish within the user-selected ceiling.
      selectedPool = diverseSelectionWithinBudget(usable, target, ceiling);
    } else if (usable.length >= target) {
      selectedPool = diverseOrder(cheapestTarget);
      issues.add("budget-impossible");
    } else {
      selectedPool = diverseOrder([...usable, ...uncertain]).slice(0, target);
    }

    const selected: GiftCardCandidate[] = [];
    for (const candidate of selectedPool) selected.push(withReasonTags(candidate, selected));
    if (selected.length < target) issues.add("too-few-candidates");

    const unpricedCount = selected.filter((candidate) => candidate.price.amountMinor === undefined).length;
    const approximateCount = selected.filter((candidate) => candidate.price.confidence === "approximate").length;
    if (unpricedCount) issues.add("unknown-prices");
    if (approximateCount) issues.add("approximate-prices");
    const allAmountsKnown = selected.every((candidate) => candidate.price.amountMinor !== undefined);
    const estimatedTotalMinor = allAmountsKnown
      ? selected.reduce((sum, candidate) => sum + (candidate.price.amountMinor ?? 0), 0)
      : undefined;
    const allUsable = selected.length > 0 && selected.every((candidate) =>
      candidate.price.confidence === "usable" && candidate.price.currency === preferences.currency,
    );
    const budgetStatus = !allUsable || estimatedTotalMinor === undefined
      ? "unknown" as const
      : estimatedTotalMinor <= preferences.budgetMinor
        ? "within" as const
        : estimatedTotalMinor <= ceiling
          ? "near" as const
          : "over" as const;

    return {
      selected,
      estimatedTotalMinor,
      unpricedCount,
      approximateCount,
      budgetStatus,
      issues: [...issues],
    };
  }
}

export function assertGiftPreferences(preferences: GiftPreferences): void {
  if (!preferences.subjectQuery.trim()) throw new Error("Gift subject is required.");
  if (![9, 18, 36].includes(preferences.targetCardCount)) throw new Error("Gift target must be 9, 18 or 36 cards.");
  if (!Number.isSafeInteger(preferences.budgetMinor) || preferences.budgetMinor <= 0) {
    throw new Error("Gift budget must be a positive integer in minor currency units.");
  }
  if (!([0, 5, 10, 15] as const).includes(preferences.budgetTolerancePercent ?? 0)) {
    throw new Error("Gift budget tolerance is unsupported.");
  }
}

export function createGiftProject(name: string, preferences: GiftPreferences): GiftProject {
  assertGiftPreferences(preferences);
  const cleanName = name.trim();
  if (!cleanName || cleanName.length > 100) throw new Error("Gift Project name must contain 1 to 100 characters.");
  const timestamp = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    schemaVersion: 1,
    revision: 0,
    name: cleanName,
    createdAt: timestamp,
    updatedAt: timestamp,
    preferences: {
      ...preferences,
      subjectQuery: preferences.subjectQuery.trim(),
      recipientName: preferences.recipientName?.trim() || undefined,
    },
    selectedCardKeys: [],
  };
}

/**
 * Converts a confirmed Gift selection into the existing ordinary Binder model.
 * The Step-3 engine is called once per 3x3 page; no Gift-only page type exists.
 */
export function giftSelectionToBinder(
  selection: GiftSelectionResult,
  name: string,
): { binder: Binder; cards: CardSnapshot[]; placements: PageSelectionPlacement[] } {
  if (selection.selected.length === 0) throw new Error("An empty Gift selection cannot create a binder.");
  let binder: Binder | undefined;
  const cards: CardSnapshot[] = [];
  const placements: PageSelectionPlacement[] = [];
  for (let offset = 0; offset < selection.selected.length; offset += 9) {
    const items = selection.selected.slice(offset, offset + 9).map((candidate) => ({
      card: candidate.card,
      variant: candidate.variant,
      preferences: candidate.preferences,
    }));
    const result = applyPageSelection(
      { items },
      binder ? { kind: "new-page", binder } : { kind: "new-binder", name },
    );
    binder = result.binder;
    cards.push(...result.cards);
    placements.push(...result.placements);
  }
  if (!binder) throw new Error("Gift binder conversion failed.");
  return { binder, cards, placements };
}
