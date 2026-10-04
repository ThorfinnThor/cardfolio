import { MAX_BINDER_PAGES, SUPPORTED_BINDER_LAYOUTS, type SupportedBinderLayout } from "./binder-actions";
import type { PageSelectionDraft, PageSelectionTarget } from "./page-selection";
import type { CardLanguage, CardSnapshot, VariantSelection } from "./types";
import { createInitialVariantSelection, variantAvailabilityForCard } from "./variant-selection";

export type SetCollectionScope = "official-numbered" | "complete-catalog";
export type SetVariantStrategy = "one-per-card" | "all-confirmed-finishes";

export interface SetBinderPlanRequest {
  setId: string;
  setName: string;
  language: CardLanguage;
  scope: SetCollectionScope;
  variantStrategy: SetVariantStrategy;
  layout?: SupportedBinderLayout;
  catalogCardCount: { official: number; total: number };
  /** Complete provider result for this set/language. Scope filtering happens here. */
  cards: readonly CardSnapshot[];
}

export interface SetBinderPlanEntry {
  card: CardSnapshot;
  variant: VariantSelection;
  reviewRequired: boolean;
}

export interface SetBinderPlan {
  setId: string;
  setName: string;
  language: CardLanguage;
  scope: SetCollectionScope;
  variantStrategy: SetVariantStrategy;
  layout: SupportedBinderLayout;
  sourceCardCount: number;
  selectedCardCount: number;
  plannedCardCount: number;
  pageCount: number;
  reviewRequiredCount: number;
  coverageComplete: boolean;
  issues: string[];
  entries: SetBinderPlanEntry[];
}

export class SetBinderPlanError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SetBinderPlanError";
  }
}

function supportedLayout(layout: SupportedBinderLayout): boolean {
  return SUPPORTED_BINDER_LAYOUTS.some((candidate) => candidate.rows === layout.rows && candidate.columns === layout.columns);
}

function officialCollectorNumber(card: CardSnapshot): number | undefined {
  const match = card.collectorNumber.trim().match(/^0*(\d+)/);
  return match ? Number(match[1]) : undefined;
}

function selectedCards(request: SetBinderPlanRequest): CardSnapshot[] {
  const unique = new Map<string, CardSnapshot>();
  for (const card of request.cards) {
    if (card.setId !== request.setId || card.ref.language !== request.language) {
      throw new SetBinderPlanError("Every card in a set-binder plan must match its set and language.");
    }
    if (unique.has(card.key)) throw new SetBinderPlanError(`Duplicate card snapshot in set plan: ${card.key}.`);
    unique.set(card.key, card);
  }
  const cards = [...unique.values()];
  if (request.scope === "complete-catalog") return cards;
  return cards.filter((card) => {
    const collectorNumber = officialCollectorNumber(card);
    return collectorNumber !== undefined && collectorNumber <= request.catalogCardCount.official;
  });
}

function entriesForCard(card: CardSnapshot, strategy: SetVariantStrategy): SetBinderPlanEntry[] {
  const availability = variantAvailabilityForCard(card);
  if (strategy === "all-confirmed-finishes" && availability.finishesVerified) {
    const finishes = [
      availability.normal ? "normal" as const : undefined,
      availability.holo ? "holo" as const : undefined,
      availability.reverse ? "reverse" as const : undefined,
    ].filter((finish): finish is "normal" | "holo" | "reverse" => Boolean(finish));
    if (finishes.length) return finishes.map((finish) => ({
      card,
      variant: { finish, edition: "unlimited", printing: "shadowed" },
      reviewRequired: false,
    }));
  }

  const variant = createInitialVariantSelection(availability);
  return [{ card, variant, reviewRequired: variant.finish === "unspecified" }];
}

/** Builds a deterministic, provider-independent plan from a complete set result. */
export function createSetBinderPlan(request: SetBinderPlanRequest): SetBinderPlan {
  const layout = request.layout ?? { rows: 3, columns: 3 };
  if (!supportedLayout(layout)) throw new SetBinderPlanError("The selected binder layout is not supported.");
  if (!request.setId.trim() || !request.setName.trim()) throw new SetBinderPlanError("Set ID and name are required.");
  if (request.catalogCardCount.official < 0 || request.catalogCardCount.total < request.catalogCardCount.official) {
    throw new SetBinderPlanError("Set card counts are inconsistent.");
  }

  const cards = selectedCards(request);
  const expectedCardCount = request.scope === "official-numbered"
    ? request.catalogCardCount.official
    : request.catalogCardCount.total;
  const entries = cards.flatMap((card) => entriesForCard(card, request.variantStrategy));
  const slotsPerPage = layout.rows * layout.columns;
  const pageCount = Math.max(1, Math.ceil(entries.length / slotsPerPage));
  if (pageCount > MAX_BINDER_PAGES) {
    throw new SetBinderPlanError(`This plan needs ${pageCount} pages; the binder limit is ${MAX_BINDER_PAGES}.`);
  }
  const coverageComplete = cards.length === expectedCardCount;
  const issues = [
    coverageComplete ? undefined : `Der Katalog liefert ${cards.length} von erwarteten ${expectedCardCount} Karten für diesen Umfang.`,
    entries.some((entry) => entry.reviewRequired)
      ? `${entries.filter((entry) => entry.reviewRequired).length} Ausgabe(n) müssen nach dem Anlegen geprüft werden.`
      : undefined,
  ].filter((issue): issue is string => Boolean(issue));

  return {
    setId: request.setId,
    setName: request.setName,
    language: request.language,
    scope: request.scope,
    variantStrategy: request.variantStrategy,
    layout,
    sourceCardCount: request.cards.length,
    selectedCardCount: cards.length,
    plannedCardCount: entries.length,
    pageCount,
    reviewRequiredCount: entries.filter((entry) => entry.reviewRequired).length,
    coverageComplete,
    issues,
    entries,
  };
}

export function setBinderPlanToDraft(plan: SetBinderPlan): PageSelectionDraft {
  return {
    items: plan.entries.map((entry) => ({
      card: entry.card,
      variant: entry.variant,
      preferences: { minimumCondition: "any" },
    })),
    allowDuplicateCardKeys: plan.entries.length !== new Set(plan.entries.map((entry) => entry.card.key)).size,
    allowUnresolvedVariants: plan.reviewRequiredCount > 0,
  };
}

export function setBinderPlanTarget(plan: SetBinderPlan, name: string): Extract<PageSelectionTarget, { kind: "new-binder" }> {
  return { kind: "new-binder", name, layout: plan.layout, overflow: "add-pages" };
}
