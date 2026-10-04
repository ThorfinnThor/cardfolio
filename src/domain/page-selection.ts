import {
  addPage,
  createBinder,
  createPlannedCard,
  makeCardKey,
  MAX_BINDER_PAGES,
  placeCard,
  SUPPORTED_BINDER_LAYOUTS,
  type SlotLocation,
  type SupportedBinderLayout,
} from "./binder-actions";
import type {
  Binder,
  CardSnapshot,
  PurchasePreferences,
  UUID,
  VariantSelection,
} from "./types";
import { isVariantSelectionComplete, variantAvailabilityForCard, variantSelectionIssue } from "./variant-selection";

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
  /**
   * Duplicate card identities are rejected by default. The card browser may
   * set this only after an explicit "add another copy" action.
   */
  allowDuplicateCardKeys?: boolean;
  /**
   * Set-builder flows may persist an incomplete printing as review-required.
   * Invalid completed combinations are never accepted by this escape hatch.
   */
  allowUnresolvedVariants?: boolean;
}

export type PageSelectionOverflowPolicy = "reject" | "add-pages";

export type PageSelectionTarget =
  | {
      kind: "fill-current-page";
      binder: Binder;
      pageId: UUID;
      slotIndexes?: readonly number[];
      startSlotIndex?: number;
    }
  | {
      kind: "fill-continuously";
      binder: Binder;
      start: SlotLocation;
      overflow: PageSelectionOverflowPolicy;
    }
  | { kind: "new-page"; binder: Binder; overflow?: PageSelectionOverflowPolicy }
  | { kind: "new-binder"; name: string; layout?: SupportedBinderLayout; overflow?: PageSelectionOverflowPolicy };

export interface PageSelectionPlacement {
  entryId: UUID;
  cardKey: string;
  pageId: UUID;
  slotIndex: number;
  variantReviewRequired: boolean;
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
  | "invalid-slot-selection"
  | "target-slot-occupied"
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

function assertCardAndVariant(card: CardSnapshot, variant: VariantSelection, allowUnresolvedVariant = false): void {
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
  if (allowUnresolvedVariant && !isVariantSelectionComplete(variant)) return;
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
    assertCardAndVariant(item.card, item.variant, draft.allowUnresolvedVariants);
    if (!draft.allowDuplicateCardKeys && cardKeys.has(item.card.key)) {
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

  const pageId = target.kind === "fill-continuously" ? target.start.pageId : target.pageId;
  if (!target.binder.pages.some((page) => page.id === pageId)) {
    throw new PageSelectionError("page-not-found", "The selected binder page no longer exists.");
  }
  return { binder: target.binder, pageId, createdBinder: false };
}

function assertSlotIndex(page: Binder["pages"][number], slotIndex: number): void {
  if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= page.slots.length) {
    throw new PageSelectionError("invalid-slot-selection", "The selected start slot is outside the page.");
  }
}

function explicitLocations(
  draft: PageSelectionDraft,
  target: Extract<PageSelectionTarget, { kind: "fill-current-page" }>,
  page: Binder["pages"][number],
): SlotLocation[] | undefined {
  if (target.slotIndexes === undefined) return undefined;
  if (target.startSlotIndex !== undefined) {
    throw new PageSelectionError("invalid-slot-selection", "Choose either explicit target slots or one start slot.");
  }
  const indexes = [...target.slotIndexes];
  if (indexes.length !== draft.items.length
    || indexes.length !== new Set(indexes).size
    || indexes.some((slotIndex) => !Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= page.slots.length)) {
    throw new PageSelectionError(
      "invalid-slot-selection",
      "The explicit target slots must be unique, valid and match the number of selected cards.",
    );
  }
  if (indexes.some((slotIndex) => page.slots[slotIndex] !== null)) {
    throw new PageSelectionError("target-slot-occupied", "At least one explicit target slot is already occupied.");
  }
  return indexes.map((slotIndex) => ({ pageId: page.id, slotIndex }));
}

function freeLocations(
  binder: Binder,
  startPageId: UUID,
  startSlotIndex: number,
  continuous: boolean,
  requireStartFree: boolean,
): SlotLocation[] {
  const startPageIndex = binder.pages.findIndex((page) => page.id === startPageId);
  if (startPageIndex < 0) throw new PageSelectionError("page-not-found", "The selected binder page no longer exists.");
  const startPage = binder.pages[startPageIndex];
  assertSlotIndex(startPage, startSlotIndex);
  if (requireStartFree && startPage.slots[startSlotIndex] !== null) {
    throw new PageSelectionError("target-slot-occupied", "The selected start slot is already occupied.");
  }
  const lastPageIndex = continuous ? binder.pages.length - 1 : startPageIndex;
  const locations: SlotLocation[] = [];
  for (let pageIndex = startPageIndex; pageIndex <= lastPageIndex; pageIndex += 1) {
    const page = binder.pages[pageIndex];
    const firstSlot = pageIndex === startPageIndex ? startSlotIndex : 0;
    for (let slotIndex = firstSlot; slotIndex < page.slots.length; slotIndex += 1) {
      if (page.slots[slotIndex] === null) locations.push({ pageId: page.id, slotIndex });
    }
  }
  return locations;
}

function overflowPolicy(target: PageSelectionTarget): PageSelectionOverflowPolicy {
  if (target.kind === "fill-current-page") return "reject";
  return target.overflow ?? "reject";
}

function locationsForTarget(
  draft: PageSelectionDraft,
  target: PageSelectionTarget,
  destination: ReturnType<typeof destinationForTarget>,
): { binder: Binder; locations: SlotLocation[] } {
  const page = destination.binder.pages.find((candidate) => candidate.id === destination.pageId);
  if (!page) throw new PageSelectionError("page-not-found", "The selected binder page no longer exists.");

  if (target.kind === "fill-current-page") {
    const explicit = explicitLocations(draft, target, page);
    if (explicit) return { binder: destination.binder, locations: explicit };
  }

  const startSlotIndex = target.kind === "fill-continuously"
    ? target.start.slotIndex
    : target.kind === "fill-current-page"
      ? target.startSlotIndex ?? 0
      : 0;
  const continuous = target.kind !== "fill-current-page";
  const requireStartFree = target.kind === "fill-continuously"
    || (target.kind === "fill-current-page" && target.startSlotIndex !== undefined);
  let binder = destination.binder;
  let locations = freeLocations(binder, destination.pageId, startSlotIndex, continuous, requireStartFree);

  if (locations.length < draft.items.length && overflowPolicy(target) === "add-pages") {
    const slotsPerPage = binder.layout.rows * binder.layout.columns;
    const pagesNeeded = Math.ceil((draft.items.length - locations.length) / slotsPerPage);
    if (binder.pages.length + pagesNeeded > MAX_BINDER_PAGES) {
      throw new PageSelectionError(
        "insufficient-capacity",
        `The selection needs ${pagesNeeded} additional pages, but the binder limit is ${MAX_BINDER_PAGES}.`,
      );
    }
    for (let index = 0; index < pagesNeeded; index += 1) binder = addPage(binder);
    locations = freeLocations(binder, destination.pageId, startSlotIndex, true, requireStartFree);
  }

  if (locations.length < draft.items.length) {
    throw new PageSelectionError(
      "insufficient-capacity",
      `The selected range has ${locations.length} free slots for ${draft.items.length} selected cards.`,
    );
  }
  return { binder, locations };
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
  const resolved = locationsForTarget(draft, target, destination);
  let binder = resolved.binder;
  const placements: PageSelectionPlacement[] = [];
  draft.items.forEach((item, index) => {
    const entry = createPlannedCard(item.card.key, item.variant, item.preferences);
    const location = resolved.locations[index];
    binder = placeCard(binder, location, entry);
    placements.push({
      entryId: entry.id,
      cardKey: item.card.key,
      pageId: location.pageId,
      slotIndex: location.slotIndex,
      variantReviewRequired: entry.variantReview === "required",
    });
  });

  return {
    binder,
    cards: draft.items.map((item) => item.card),
    placements,
    createdBinder: destination.createdBinder,
  };
}
