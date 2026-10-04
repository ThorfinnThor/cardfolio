import { describe, expect, it } from "vitest";

import { createBinder, createPlannedCard, moveOrSwapCard, placeCard, setOwned } from "@/domain/binder-actions";
import type { PageSelectionDraft } from "@/domain/page-selection";
import {
  applyReversiblePageSelection,
  ReversiblePageSelectionError,
  undoPageSelection,
} from "@/domain/reversible-page-selection";
import type { CardSnapshot, VariantSelection } from "@/domain/types";

const variant: VariantSelection = { finish: "normal", edition: "unlimited", printing: "shadowed" };

function card(index: number): CardSnapshot {
  const id = `swsh1-${index}`;
  return {
    key: `tcgdex:${id}:en`,
    ref: { provider: "tcgdex", id, language: "en" },
    name: `Card ${index}`,
    setId: "swsh1",
    setName: "Sword & Shield",
    collectorNumber: String(index),
    physicalStatus: "physical",
    fetchedAt: "2026-10-03T00:00:00.000Z",
  };
}

function draft(count: number): PageSelectionDraft {
  return {
    items: Array.from({ length: count }, (_, index) => ({
      card: card(index + 1),
      variant,
      preferences: { minimumCondition: "any" },
    })),
  };
}

function expectUndoError(action: () => unknown, code: ReversiblePageSelectionError["code"]): void {
  try {
    action();
    throw new Error("Expected reversible selection to fail.");
  } catch (error) {
    expect(error).toBeInstanceOf(ReversiblePageSelectionError);
    expect((error as ReversiblePageSelectionError).code).toBe(code);
  }
}

describe("reversible page selection", () => {
  it("inserts one reviewed card into an exact slot without setting ownership", () => {
    const binder = createBinder("Single");
    const result = applyReversiblePageSelection(draft(1), {
      kind: "fill-current-page",
      binder,
      pageId: binder.pages[0].id,
      slotIndexes: [5],
    }, binder.revision);

    expect(result.placements[0].slotIndex).toBe(5);
    expect(result.binder.pages[0].slots[5]).toMatchObject({
      cardKey: card(1).key,
      owned: false,
    });
    expect(result.undo.expectedRevision).toBe(binder.revision + 1);
  });

  it("inserts and undoes multiple cards atomically after one save revision", () => {
    const original = createBinder("Multiple");
    const existing = createPlannedCard(card(90).key, variant);
    const binder = placeCard(original, { pageId: original.pages[0].id, slotIndex: 0 }, existing);
    const result = applyReversiblePageSelection(draft(3), {
      kind: "fill-current-page",
      binder,
      pageId: binder.pages[0].id,
      slotIndexes: [2, 4, 8],
    }, binder.revision);
    const saved = { ...result.binder, revision: binder.revision + 1 };
    const undone = undoPageSelection(saved, result.undo);

    expect(undone.pages[0].slots[0]?.id).toBe(existing.id);
    expect([2, 4, 8].map((slotIndex) => undone.pages[0].slots[slotIndex])).toEqual([null, null, null]);
  });

  it("rejects an insert prepared against another revision", () => {
    const binder = { ...createBinder("Stale"), revision: 3 };
    expectUndoError(
      () => applyReversiblePageSelection(draft(1), {
        kind: "fill-current-page",
        binder,
        pageId: binder.pages[0].id,
      }, 2),
      "revision-conflict",
    );
  });

  it("invalidates undo after any later saved mutation", () => {
    const binder = createBinder("Changed");
    const result = applyReversiblePageSelection(draft(1), {
      kind: "fill-current-page",
      binder,
      pageId: binder.pages[0].id,
      slotIndexes: [1],
    }, binder.revision);
    const savedThenChanged = { ...result.binder, revision: result.undo.expectedRevision + 1 };

    expectUndoError(() => undoPageSelection(savedThenChanged, result.undo), "revision-conflict");
  });

  it("invalidates undo when the inserted entry moved without a revision update", () => {
    const binder = createBinder("Moved");
    const result = applyReversiblePageSelection(draft(1), {
      kind: "fill-current-page",
      binder,
      pageId: binder.pages[0].id,
      slotIndexes: [1],
    }, binder.revision);
    const saved = { ...result.binder, revision: result.undo.expectedRevision };
    const moved = moveOrSwapCard(
      saved,
      { pageId: saved.pages[0].id, slotIndex: 1 },
      { pageId: saved.pages[0].id, slotIndex: 2 },
    );

    expectUndoError(() => undoPageSelection(moved, result.undo), "insert-changed");
  });

  it("rejects a token from another binder", () => {
    const source = createBinder("Source");
    const result = applyReversiblePageSelection(draft(1), {
      kind: "fill-current-page",
      binder: source,
      pageId: source.pages[0].id,
    }, source.revision);
    const other = { ...createBinder("Other"), revision: result.undo.expectedRevision };

    expectUndoError(() => undoPageSelection(other, result.undo), "binder-mismatch");
  });

  it("cannot undo after the inserted entry was marked owned", () => {
    const binder = createBinder("Owned later");
    const result = applyReversiblePageSelection(draft(1), {
      kind: "fill-current-page",
      binder,
      pageId: binder.pages[0].id,
    }, binder.revision);
    const saved = { ...result.binder, revision: result.undo.expectedRevision };
    const changed = setOwned(saved, result.placements[0].entryId, true);
    const savedAgain = { ...changed, revision: saved.revision + 1 };

    expectUndoError(() => undoPageSelection(savedAgain, result.undo), "revision-conflict");
  });
});

