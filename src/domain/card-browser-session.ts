import type { PageSelectionDraft, PageSelectionItem } from "./page-selection";
import type { CatalogResultSort } from "./catalog-sort";
import type { Binder, CardLanguage, CardKey, UUID, VariantSelection } from "./types";

export type CardBrowserMode = "single" | "multiple" | "next-free";
export type CardBrowserLanguage = CardLanguage | "all";
export type CardBrowserSort = CatalogResultSort;

export interface CardBrowserTarget {
  binderId: UUID;
  kind: "slot" | "page" | "next-free";
  pageId?: UUID;
  slotIndex?: number;
}

export interface CardBrowserQueryState {
  text: string;
  language: CardBrowserLanguage;
  seriesId?: string;
  setId?: string;
  sort: CardBrowserSort;
}

export interface CardBrowserScrollAnchor {
  cardKey?: CardKey;
  offset: number;
}

export interface CardBrowserSelection {
  id: UUID;
  item: PageSelectionItem;
  explicitDuplicate: boolean;
}

/**
 * Short-lived browser state. It is intentionally absent from persistence and
 * backup contracts; closing the workflow may discard it without changing a
 * binder.
 */
export interface CardBrowserSession {
  id: UUID;
  mode: CardBrowserMode;
  target: CardBrowserTarget;
  query: CardBrowserQueryState;
  scroll: CardBrowserScrollAnchor;
  selections: readonly CardBrowserSelection[];
  selectionLimit: number;
}

export type CardBrowserSessionErrorCode =
  | "invalid-target"
  | "duplicate-selection"
  | "selection-limit";

export class CardBrowserSessionError extends Error {
  constructor(
    public readonly code: CardBrowserSessionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "CardBrowserSessionError";
  }
}

export interface CardBrowserCardStatus {
  selected: boolean;
  planned: boolean;
  owned: boolean;
  missing: boolean;
  selectedCopies: number;
  plannedCopies: number;
  ownedCopies: number;
  missingCopies: number;
}

function validateTarget(target: CardBrowserTarget): void {
  if (!target.binderId.trim()) {
    throw new CardBrowserSessionError("invalid-target", "A card browser target requires a binder ID.");
  }
  if (target.kind === "slot") {
    if (!target.pageId?.trim()
      || !Number.isInteger(target.slotIndex)
      || (target.slotIndex ?? -1) < 0) {
      throw new CardBrowserSessionError(
        "invalid-target",
        "A slot target requires a page ID and a non-negative slot index.",
      );
    }
  }
  if (target.kind === "page" && !target.pageId?.trim()) {
    throw new CardBrowserSessionError("invalid-target", "A page target requires a page ID.");
  }
}

export function createCardBrowserSession(
  target: CardBrowserTarget,
  options: {
    mode?: CardBrowserMode;
    query?: Partial<CardBrowserQueryState>;
    selectionLimit?: number;
  } = {},
): CardBrowserSession {
  validateTarget(target);
  const selectionLimit = options.selectionLimit ?? 9;
  if (!Number.isInteger(selectionLimit) || selectionLimit < 1 || selectionLimit > 360) {
    throw new CardBrowserSessionError("selection-limit", "Selection limit must be between 1 and 360.");
  }
  return {
    id: crypto.randomUUID(),
    mode: options.mode ?? (target.kind === "next-free" ? "next-free" : "single"),
    target: { ...target },
    query: {
      text: options.query?.text ?? "",
      language: options.query?.language ?? "all",
      seriesId: options.query?.seriesId,
      setId: options.query?.setId,
      sort: options.query?.sort ?? "relevance",
    },
    scroll: { offset: 0 },
    selections: [],
    selectionLimit,
  };
}

export function updateCardBrowserQuery(
  session: CardBrowserSession,
  update: Partial<CardBrowserQueryState>,
): CardBrowserSession {
  return { ...session, query: { ...session.query, ...update } };
}

export function updateCardBrowserScroll(
  session: CardBrowserSession,
  scroll: CardBrowserScrollAnchor,
): CardBrowserSession {
  return {
    ...session,
    scroll: {
      cardKey: scroll.cardKey,
      offset: Number.isFinite(scroll.offset) ? Math.max(0, scroll.offset) : 0,
    },
  };
}

function normalizedVariant(variant: VariantSelection): string {
  return [
    variant.finish,
    variant.edition,
    variant.printing ?? "unspecified",
    variant.label?.trim().toLocaleLowerCase("de-DE") ?? "",
  ].join("|");
}

function sameSelection(left: PageSelectionItem, right: PageSelectionItem): boolean {
  return left.card.key === right.card.key
    && normalizedVariant(left.variant) === normalizedVariant(right.variant);
}

export function addCardBrowserSelection(
  session: CardBrowserSession,
  item: PageSelectionItem,
  options: { explicitDuplicate?: boolean } = {},
): CardBrowserSession {
  const explicitDuplicate = options.explicitDuplicate === true;
  const duplicate = session.selections.some((selection) => sameSelection(selection.item, item));
  if (duplicate && !explicitDuplicate) {
    throw new CardBrowserSessionError(
      "duplicate-selection",
      "This card and variant are already selected. Use the explicit duplicate action to add another copy.",
    );
  }
  if (session.mode !== "single" && session.selections.length >= session.selectionLimit) {
    throw new CardBrowserSessionError(
      "selection-limit",
      `At most ${session.selectionLimit} cards can be selected in this workflow.`,
    );
  }
  const selection: CardBrowserSelection = {
    id: crypto.randomUUID(),
    item,
    explicitDuplicate,
  };
  return {
    ...session,
    selections: session.mode === "multiple" ? [...session.selections, selection] : [selection],
  };
}

export function removeCardBrowserSelection(
  session: CardBrowserSession,
  selectionId: UUID,
): CardBrowserSession {
  return {
    ...session,
    selections: session.selections.filter((selection) => selection.id !== selectionId),
  };
}

export function pageSelectionDraftFromBrowser(session: CardBrowserSession): PageSelectionDraft {
  const cardKeyCounts = new Map<CardKey, number>();
  session.selections.forEach(({ item }) => {
    cardKeyCounts.set(item.card.key, (cardKeyCounts.get(item.card.key) ?? 0) + 1);
  });
  return {
    items: session.selections.map((selection) => selection.item),
    allowDuplicateCardKeys: [...cardKeyCounts.values()].some((count) => count > 1),
  };
}

function variantMatches(
  planned: VariantSelection,
  filter: VariantSelection | undefined,
): boolean {
  return filter === undefined || normalizedVariant(planned) === normalizedVariant(filter);
}

export function deriveCardBrowserCardStatus(
  binder: Binder,
  session: Pick<CardBrowserSession, "selections">,
  cardKey: CardKey,
  variant?: VariantSelection,
): CardBrowserCardStatus {
  const selectedCopies = session.selections.filter(({ item }) => (
    item.card.key === cardKey && variantMatches(item.variant, variant)
  )).length;
  const plannedEntries = binder.pages.flatMap((page) => page.slots).filter((entry) => (
    entry?.cardKey === cardKey && variantMatches(entry.variant, variant)
  ));
  const ownedCopies = plannedEntries.filter((entry) => entry?.owned).length;
  const missingCopies = plannedEntries.length - ownedCopies;
  return {
    selected: selectedCopies > 0,
    planned: plannedEntries.length > 0,
    owned: ownedCopies > 0,
    missing: missingCopies > 0,
    selectedCopies,
    plannedCopies: plannedEntries.length,
    ownedCopies,
    missingCopies,
  };
}
