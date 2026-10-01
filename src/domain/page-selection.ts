import {
  addPage,
  createBinder,
  createPlannedCard,
  makeCardKey,
  placeCard,
  SUPPORTED_BINDER_LAYOUTS,
  type SupportedBinderLayout,
} from "./binder-actions";
import type {
  Binder,
  CardSnapshot,
  PurchasePreferences,
  UUID,
  VariantSelection,
} from "./types";
import { variantAvailabilityForCard, variantSelectionIssue } from "./variant-selection";

export interface PageSelectionItem {
  card: CardSnapshot;
  variant: VariantSelection;
  preferences: PurchasePreferences;
}

/**
 * A short-lived reviewed selection. It is deliberately not part of the backup
 * or repository contracts: only ordinary Binder, PlannedCard and CardSnapshot
 * values are persisted after confirmation.
 */
export interface PageSelectionDraft {
  items: readonly PageSelectionItem[];
}

export type PageSelectionTarget =
  | { kind: "fill-current-page"; binder: Binder; pageId: UUID }
  | { kind: "new-page"; binder: Binder }
  | { kind: "new-binder"; name: string; layout?: SupportedBinderLayout };

export interface PageSelectionPlacement {
  entryId: UUID;
  cardKey: string;
  pageId: UUID;
  slotIndex: number;
}

export interface PageSelectionResult {
  binder: Binder;
  cards: CardSnapshot[];
  placements: PageSelectionPlacement[];
  createdBinder: boolean;
}

export type PageSelectionErrorCode =
  | "empty-selection"
  | "duplicate-card"
  | "invalid-card-identity"
  | "digital-card"
  | "invalid-variant"
  | "unsupported-layout"
  | "page-not-found"
  | "insufficient-capacity";

export class PageSelectionError extends Error {
  constructor(
    public readonly code: PageSelectionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "PageSelectionError";
  }
}

export interface PageSelectionItemOptions {
  edition?: VariantSelection["edition"];
  printing?: NonNullable<VariantSelection["printing"]>;
  label?: string;
  preferences?: PurchasePreferences;
}

/**
 * Creates a reviewed draft item. Finish is mandatory; safe historical defaults
 * are applied only to edition and printing and then checked against the same
 * policy used by the binder editor and marketplace exports.
 */
export function createPageSelectionItem(
  card: CardSnapshot,
  finish: Exclude<VariantSelection["finish"], "unspecified">,
  options: PageSelectionItemOptions = {},
): PageSelectionItem {
  const variant: VariantSelection = {
    finish,
    edition: options.edition ?? "unlimited",
    printing: options.printing ?? "shadowed",
    label: options.label,
  };
  assertCardAndVariant(card, variant);
  return {
    card,
    variant,
    preferences: options.preferences ?? { minimumCondition: "any" },
  };
}

function isSupportedLayout(layout: SupportedBinderLayout): boolean {
  return SUPPORTED_BINDER_LAYOUTS.some(
    (candidate) => candidate.rows === layout.rows && candidate.columns === layout.columns,
  );
}

function assertCardAndVariant(card: CardSnapshot, variant: VariantSelection): void {
  if (card.key !== makeCardKey(card.ref)) {
    throw new PageSelectionError(
      "invalid-card-identity",
      `Card snapshot ${card.key} does not match its provider, ID and language.`,
    );
  }
  if (card.physicalStatus === "digital") {
    throw new PageSelectionError(
      "digital-card",
      `Digital/Pocket card ${card.key} cannot be placed in a physical binder.`,
    );
  }
  const issue = variantSelectionIssue(variant, variantAvailabilityForCard(card));
  if (issue) {
    throw new PageSelectionError("invalid-variant", `${card.name}: ${issue}`);
  }
}

function validateDraft(draft: PageSelectionDraft): void {
  if (draft.items.length === 0) {
    throw new PageSelectionError("empty-selection", "Select at least one card for the page.");
  }
  const cardKeys = new Set<string>();
  for (const item of draft.items) {
    assertCardAndVariant(item.card, item.variant);
    if (cardKeys.has(item.card.key)) {
      throw new PageSelectionError(
        "duplicate-card",
        `Card ${item.card.key} occurs more than once in the selection.`,
      );
    }
    cardKeys.add(item.card.key);
  }
}

function destinationForTarget(target: PageSelectionTarget): {
  binder: Binder;
  pageId: UUID;
  createdBinder: boolean;
} {
  if (target.kind === "new-binder") {
    const layout = target.layout ?? { rows: 3, columns: 3 };
    if (!isSupportedLayout(layout)) {
      throw new PageSelectionError("unsupported-layout", "The selected binder layout is not supported.");
    }
    const binder = createBinder(target.name, layout);
    return { binder, pageId: binder.pages[0].id, createdBinder: true };
  }

  if (target.kind === "new-page") {
    const binder = addPage(target.binder);
    return {
      binder,
      pageId: binder.pages[binder.pages.length - 1].id,
      createdBinder: false,
    };
  }

  if (!target.binder.pages.some((page) => page.id === target.pageId)) {
    throw new PageSelectionError("page-not-found", "The selected binder page no longer exists.");
  }
  return { binder: target.binder, pageId: target.pageId, createdBinder: false };
}

/**
 * Converts a reviewed draft into ordinary binder entries. Items are placed in
 * draft order into free slots in reading order. Existing entries are never
 * replaced.
 */
export function applyPageSelection(
  draft: PageSelectionDraft,
  target: PageSelectionTarget,
): PageSelectionResult {
  validateDraft(draft);
  const destination = destinationForTarget(target);
  const page = destination.binder.pages.find((candidate) => candidate.id === destination.pageId);
  if (!page) {
    throw new PageSelectionError("page-not-found", "The selected binder page no longer exists.");
  }
  const freeSlotIndexes = page.slots.flatMap((entry, slotIndex) => entry === null ? [slotIndex] : []);
  if (draft.items.length > freeSlotIndexes.length) {
    throw new PageSelectionError(
      "insufficient-capacity",
      `The target page has ${freeSlotIndexes.length} free slots for ${draft.items.length} selected cards.`,
    );
  }

  let binder = destination.binder;
  const placements: PageSelectionPlacement[] = [];
  draft.items.forEach((item, index) => {
    const entry = createPlannedCard(item.card.key, item.variant, item.preferences);
    const slotIndex = freeSlotIndexes[index];
    binder = placeCard(binder, { pageId: destination.pageId, slotIndex }, entry);
    placements.push({
      entryId: entry.id,
      cardKey: item.card.key,
      pageId: destination.pageId,
      slotIndex,
    });
  });

  return {
    binder,
    cards: draft.items.map((item) => item.card),
    placements,
    createdBinder: destination.createdBinder,
  };
}
