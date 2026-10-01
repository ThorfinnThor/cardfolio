import { applyPageSelection, type PageSelectionDraft, type PageSelectionResult, type PageSelectionTarget } from "@/domain/page-selection";

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
