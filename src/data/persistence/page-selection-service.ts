import { applyPageSelection, type PageSelectionDraft, type PageSelectionResult, type PageSelectionTarget } from "@/domain/page-selection";
import {
  applyReversiblePageSelection,
  undoPageSelection,
  type PageSelectionUndoToken,
  type ReversiblePageSelectionResult,
} from "@/domain/reversible-page-selection";
import type { Binder } from "@/domain/types";

import type { BinderRepository } from "./binder-repository";

/**
 * Persists the complete selection and every referenced card snapshot in the
 * repository's single transaction. Existing binders use their draft revision,
 * so another tab cannot be overwritten silently.
 */
export async function persistPageSelection(
  repository: BinderRepository,
  draft: PageSelectionDraft,
  target: PageSelectionTarget,
): Promise<PageSelectionResult> {
  const result = applyPageSelection(draft, target);
  if (target.kind === "new-binder") {
    await repository.create(result.binder, result.cards);
    return result;
  }

  const binder = await repository.save(result.binder, result.cards, target.binder.revision);
  return { ...result, binder };
}

/**
 * Persists a reviewed selection into an existing page and returns an undo token
 * bound to the saved revision. The caller keeps the token only for the current
 * browser workflow.
 */
export async function persistReversiblePageSelection(
  repository: BinderRepository,
  draft: PageSelectionDraft,
  target: Extract<PageSelectionTarget, { kind: "fill-current-page" }>,
): Promise<ReversiblePageSelectionResult> {
  const result = applyReversiblePageSelection(draft, target, target.binder.revision);
  const binder = await repository.save(result.binder, result.cards, target.binder.revision);
  return {
    ...result,
    binder,
    undo: { ...result.undo, expectedRevision: binder.revision },
  };
}

/** Persists a safe undo. Repository revision checks remain the final guard. */
export async function persistPageSelectionUndo(
  repository: BinderRepository,
  binder: Binder,
  token: PageSelectionUndoToken,
): Promise<Binder> {
  const reverted = undoPageSelection(binder, token);
  return repository.save(reverted, [], binder.revision);
}
