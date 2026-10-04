import { removeCard } from "./binder-actions";
import {
  applyPageSelection,
  type PageSelectionDraft,
  type PageSelectionPlacement,
  type PageSelectionResult,
  type PageSelectionTarget,
} from "./page-selection";
import type { Binder, UUID } from "./types";

type ExistingPageTarget = Extract<PageSelectionTarget, { kind: "fill-current-page" }>;

export interface PageSelectionUndoToken {
  kind: "page-selection-insert";
  binderId: UUID;
  /** Revision expected after the insert has been saved once. */
  expectedRevision: number;
  placements: readonly PageSelectionPlacement[];
}

export interface ReversiblePageSelectionResult extends PageSelectionResult {
  undo: PageSelectionUndoToken;
}

export type ReversiblePageSelectionErrorCode =
  | "revision-conflict"
  | "binder-mismatch"
  | "insert-changed";

export class ReversiblePageSelectionError extends Error {
  constructor(
    public readonly code: ReversiblePageSelectionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ReversiblePageSelectionError";
  }
}

function entryAt(binder: Binder, placement: PageSelectionPlacement) {
  return binder.pages
    .find((page) => page.id === placement.pageId)
    ?.slots[placement.slotIndex];
}

/**
 * Applies a reviewed one- or multi-card selection to an existing page. The
 * returned undo token is short-lived and valid only after exactly one
 * repository save, which increments the binder revision by one.
 */
export function applyReversiblePageSelection(
  draft: PageSelectionDraft,
  target: ExistingPageTarget,
  expectedRevision: number,
): ReversiblePageSelectionResult {
  if (target.binder.revision !== expectedRevision) {
    throw new ReversiblePageSelectionError(
      "revision-conflict",
      "The binder changed before the card selection could be applied.",
    );
  }
  const result = applyPageSelection(draft, target);
  return {
    ...result,
    undo: {
      kind: "page-selection-insert",
      binderId: target.binder.id,
      expectedRevision: expectedRevision + 1,
      placements: result.placements.map((placement) => ({ ...placement })),
    },
  };
}

/**
 * Removes exactly the entries created by the corresponding insert. Any saved
 * mutation after the insert changes the revision and invalidates this token,
 * so undo cannot silently erase a later edit or another tab's work.
 */
export function undoPageSelection(
  binder: Binder,
  token: PageSelectionUndoToken,
): Binder {
  if (binder.id !== token.binderId) {
    throw new ReversiblePageSelectionError(
      "binder-mismatch",
      "The undo action belongs to another binder.",
    );
  }
  if (binder.revision !== token.expectedRevision) {
    throw new ReversiblePageSelectionError(
      "revision-conflict",
      "The binder changed after the insert and can no longer be undone safely.",
    );
  }
  const unchanged = token.placements.every((placement) => {
    const entry = entryAt(binder, placement);
    return entry?.id === placement.entryId && entry.cardKey === placement.cardKey;
  });
  if (!unchanged) {
    throw new ReversiblePageSelectionError(
      "insert-changed",
      "At least one inserted card moved or changed after the insert.",
    );
  }
  return token.placements.reduce(
    (current, placement) => removeCard(current, {
      pageId: placement.pageId,
      slotIndex: placement.slotIndex,
    }),
    binder,
  );
}

