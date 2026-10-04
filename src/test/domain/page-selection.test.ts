import { describe, expect, it } from "vitest";

import { addPage, createBinder, createPlannedCard, placeCard } from "@/domain/binder-actions";
import {
  applyPageSelection,
  createPageSelectionItem,
  PageSelectionError,
  type PageSelectionDraft,
} from "@/domain/page-selection";
import type { CardLanguage, CardSnapshot, VariantSelection } from "@/domain/types";

const completeVariant: VariantSelection = {
  finish: "normal",
  edition: "unlimited",
  printing: "shadowed",
};

function card(
  index: number,
  language: CardLanguage = "en",
  overrides: Partial<CardSnapshot> = {},
): CardSnapshot {
  const id = `swsh1-${index}`;
  return {
    key: `tcgdex:${id}:${language}`,
    ref: { provider: "tcgdex", id, language },
    name: `Card ${index}`,
    setId: "swsh1",
    setName: "Sword & Shield",
    collectorNumber: String(index),
    physicalStatus: "physical",
    fetchedAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  };
}

function draft(count: number, start = 1): PageSelectionDraft {
  return {
    items: Array.from({ length: count }, (_, offset) => ({
      card: card(start + offset),
      variant: completeVariant,
      preferences: { minimumCondition: "any" },
    })),
  };
}

function expectPageSelectionError(action: () => unknown, code: PageSelectionError["code"]): void {
  try {
    action();
    throw new Error("Expected page selection to fail.");
  } catch (error) {
    expect(error).toBeInstanceOf(PageSelectionError);
    expect((error as PageSelectionError).code).toBe(code);
  }
}

describe("page selection domain", () => {
  it("rejects a selection of zero cards", () => {
    expectPageSelectionError(
      () => applyPageSelection({ items: [] }, { kind: "new-binder", name: "Empty" }),
      "empty-selection",
    );
  });

  it.each([1, 8, 9])("creates an ordinary 3x3 binder for %i reviewed cards", (count) => {
    const result = applyPageSelection(draft(count), { kind: "new-binder", name: `Selection ${count}` });
    const entries = result.binder.pages[0].slots.filter(Boolean);

    expect(result.createdBinder).toBe(true);
    expect(result.binder.layout).toEqual({ rows: 3, columns: 3 });
    expect(entries).toHaveLength(count);
    expect(result.placements.map((placement) => placement.slotIndex)).toEqual(
      Array.from({ length: count }, (_, index) => index),
    );
    expect(entries.map((entry) => entry?.cardKey)).toEqual(result.cards.map((item) => item.key));
  });

  it("rejects ten cards for a 3x3 page without creating an extra page", () => {
    expectPageSelectionError(
      () => applyPageSelection(draft(10), { kind: "new-binder", name: "Too many" }),
      "insufficient-capacity",
    );
  });

  it.each([10, 18, 36])("adds enough pages for %i cards when overflow is explicitly allowed", (count) => {
    const result = applyPageSelection(draft(count), {
      kind: "new-binder",
      name: `Continuous ${count}`,
      overflow: "add-pages",
    });

    expect(result.binder.pages).toHaveLength(Math.ceil(count / 9));
    expect(result.placements).toHaveLength(count);
    expect(result.binder.pages.flatMap((page) => page.slots).filter(Boolean)).toHaveLength(count);
  });

  it("fills only free slots on the chosen page in deterministic reading order", () => {
    const original = createBinder("Existing");
    const occupiedA = createPlannedCard(card(90).key, completeVariant);
    const occupiedB = createPlannedCard(card(91).key, completeVariant);
    const withFirst = placeCard(original, { pageId: original.pages[0].id, slotIndex: 0 }, occupiedA);
    const withOccupied = placeCard(withFirst, { pageId: original.pages[0].id, slotIndex: 3 }, occupiedB);

    const result = applyPageSelection(draft(3), {
      kind: "fill-current-page",
      binder: withOccupied,
      pageId: withOccupied.pages[0].id,
    });

    expect(result.placements.map((placement) => placement.slotIndex)).toEqual([1, 2, 4]);
    expect(result.binder.pages[0].slots[0]?.id).toBe(occupiedA.id);
    expect(result.binder.pages[0].slots[3]?.id).toBe(occupiedB.id);
    expect(withOccupied.pages[0].slots[1]).toBeNull();
  });

  it("starts on an explicit free slot and never backfills earlier gaps", () => {
    const binder = createBinder("Start slot");
    const result = applyPageSelection(draft(3), {
      kind: "fill-current-page",
      binder,
      pageId: binder.pages[0].id,
      startSlotIndex: 4,
    });

    expect(result.placements.map((placement) => placement.slotIndex)).toEqual([4, 5, 6]);
    expect(result.binder.pages[0].slots.slice(0, 4)).toEqual([null, null, null, null]);
  });

  it("fills continuously across existing pages and skips every planned card", () => {
    let binder = addPage(createBinder("Continuous range"));
    binder = placeCard(
      binder,
      { pageId: binder.pages[0].id, slotIndex: 6 },
      createPlannedCard(card(90).key, completeVariant),
    );
    binder = placeCard(
      binder,
      { pageId: binder.pages[1].id, slotIndex: 0 },
      createPlannedCard(card(91).key, completeVariant),
    );

    const result = applyPageSelection(draft(4), {
      kind: "fill-continuously",
      binder,
      start: { pageId: binder.pages[0].id, slotIndex: 5 },
      overflow: "reject",
    });

    expect(result.placements.map((placement) => [placement.pageId, placement.slotIndex])).toEqual([
      [binder.pages[0].id, 5],
      [binder.pages[0].id, 7],
      [binder.pages[0].id, 8],
      [binder.pages[1].id, 1],
    ]);
    expect(result.binder.pages[0].slots[6]?.cardKey).toBe(card(90).key);
    expect(result.binder.pages[1].slots[0]?.cardKey).toBe(card(91).key);
  });

  it("requires an explicit overflow decision for a continuous range", () => {
    const binder = createBinder("Overflow decision");
    expectPageSelectionError(
      () => applyPageSelection(draft(10), {
        kind: "fill-continuously",
        binder,
        start: { pageId: binder.pages[0].id, slotIndex: 0 },
        overflow: "reject",
      }),
      "insufficient-capacity",
    );

    const result = applyPageSelection(draft(10), {
      kind: "fill-continuously",
      binder,
      start: { pageId: binder.pages[0].id, slotIndex: 0 },
      overflow: "add-pages",
    });
    expect(result.binder.pages).toHaveLength(2);
    expect(result.placements.at(-1)).toMatchObject({ pageId: result.binder.pages[1].id, slotIndex: 0 });
  });

  it("adds and fills one explicit new page without changing the previous page", () => {
    const binder = createBinder("Add page");
    const existing = createPlannedCard(card(90).key, completeVariant);
    const withExisting = placeCard(binder, { pageId: binder.pages[0].id, slotIndex: 8 }, existing);
    const result = applyPageSelection(draft(2), { kind: "new-page", binder: withExisting });

    expect(result.createdBinder).toBe(false);
    expect(result.binder.pages).toHaveLength(2);
    expect(result.binder.pages[0].slots[8]?.id).toBe(existing.id);
    expect(result.placements.map((placement) => placement.pageId)).toEqual([
      result.binder.pages[1].id,
      result.binder.pages[1].id,
    ]);
    expect(result.placements.map((placement) => placement.slotIndex)).toEqual([0, 1]);
  });

  it("rejects insufficient free capacity instead of overwriting an occupied slot", () => {
    let binder = createBinder("Nearly full");
    for (let slotIndex = 0; slotIndex < 8; slotIndex += 1) {
      binder = placeCard(
        binder,
        { pageId: binder.pages[0].id, slotIndex },
        createPlannedCard(card(80 + slotIndex).key, completeVariant),
      );
    }

    expectPageSelectionError(
      () => applyPageSelection(draft(2), {
        kind: "fill-current-page",
        binder,
        pageId: binder.pages[0].id,
      }),
      "insufficient-capacity",
    );
    expect(binder.pages[0].slots[8]).toBeNull();
  });

  it("rejects duplicate card identities within one transient selection", () => {
    const item = draft(1).items[0];
    expectPageSelectionError(
      () => applyPageSelection({ items: [item, item] }, { kind: "new-binder", name: "Duplicates" }),
      "duplicate-card",
    );
  });

  it("allows duplicate card identities only when the draft records explicit copies", () => {
    const item = draft(1).items[0];
    const result = applyPageSelection({
      items: [item, item],
      allowDuplicateCardKeys: true,
    }, { kind: "new-binder", name: "Two copies" });

    expect(result.placements).toHaveLength(2);
    expect(result.placements[0].entryId).not.toBe(result.placements[1].entryId);
    expect(result.binder.pages[0].slots.slice(0, 2).map((entry) => entry?.cardKey)).toEqual([
      item.card.key,
      item.card.key,
    ]);
  });

  it("uses explicit free target slots without filling earlier gaps", () => {
    const binder = createBinder("Explicit targets");
    const result = applyPageSelection(draft(2), {
      kind: "fill-current-page",
      binder,
      pageId: binder.pages[0].id,
      slotIndexes: [4, 7],
    });

    expect(result.placements.map((placement) => placement.slotIndex)).toEqual([4, 7]);
    expect(result.binder.pages[0].slots[0]).toBeNull();
  });

  it("rejects invalid or occupied explicit target slots atomically", () => {
    const original = createBinder("Explicit targets");
    const occupied = placeCard(
      original,
      { pageId: original.pages[0].id, slotIndex: 4 },
      createPlannedCard(card(90).key, completeVariant),
    );
    expectPageSelectionError(
      () => applyPageSelection(draft(2), {
        kind: "fill-current-page",
        binder: occupied,
        pageId: occupied.pages[0].id,
        slotIndexes: [2],
      }),
      "invalid-slot-selection",
    );
    expectPageSelectionError(
      () => applyPageSelection(draft(2), {
        kind: "fill-current-page",
        binder: occupied,
        pageId: occupied.pages[0].id,
        slotIndexes: [2, 4],
      }),
      "target-slot-occupied",
    );
    expect(occupied.pages[0].slots[2]).toBeNull();
    expect(occupied.pages[0].slots[4]?.cardKey).toBe(card(90).key);
  });

  it("preserves explicit English and German identities for the same provider ID", () => {
    const english = card(25, "en");
    const german = card(25, "de", { name: "Deutsche Karte" });
    const result = applyPageSelection({
      items: [english, german].map((snapshot) => ({
        card: snapshot,
        variant: completeVariant,
        preferences: { minimumCondition: "excellent" as const },
      })),
    }, { kind: "new-binder", name: "Languages" });

    expect(result.cards.map((item) => item.ref.language)).toEqual(["en", "de"]);
    expect(result.binder.pages[0].slots.slice(0, 2).map((entry) => entry?.cardKey)).toEqual([
      english.key,
      german.key,
    ]);
  });

  it("rejects mismatched snapshot identities and Pocket cards", () => {
    expectPageSelectionError(
      () => applyPageSelection({
        items: [{
          card: card(1, "de", { key: "tcgdex:swsh1-1:en" }),
          variant: completeVariant,
          preferences: { minimumCondition: "any" },
        }],
      }, { kind: "new-binder", name: "Wrong language" }),
      "invalid-card-identity",
    );
    expectPageSelectionError(
      () => applyPageSelection({
        items: [{
          card: card(2, "en", { physicalStatus: "digital" }),
          variant: completeVariant,
          preferences: { minimumCondition: "any" },
        }],
      }, { kind: "new-binder", name: "Pocket" }),
      "digital-card",
    );
  });

  it("requires a complete, historically valid variant before conversion", () => {
    const baseSetCard = card(4, "en", {
      key: "tcgdex:base1-4:en",
      ref: { provider: "tcgdex", id: "base1-4", language: "en" },
      setId: "base1",
      setName: "Base Set",
    });
    expectPageSelectionError(
      () => applyPageSelection({
        items: [{
          card: baseSetCard,
          variant: { finish: "unspecified", edition: "unlimited", printing: "shadowed" },
          preferences: { minimumCondition: "any" },
        }],
      }, { kind: "new-binder", name: "Incomplete" }),
      "invalid-variant",
    );
    expectPageSelectionError(
      () => applyPageSelection({
        items: [{
          card: baseSetCard,
          variant: { finish: "normal", edition: "first-edition", printing: "shadowed" },
          preferences: { minimumCondition: "any" },
        }],
      }, { kind: "new-binder", name: "Historical mismatch" }),
      "invalid-variant",
    );
  });

  it("persists an unresolved variant only as explicitly review-required", () => {
    const result = applyPageSelection({
      items: [{
        card: card(3),
        variant: { finish: "unspecified", edition: "unlimited", printing: "shadowed" },
        preferences: { minimumCondition: "any" },
      }],
      allowUnresolvedVariants: true,
    }, { kind: "new-binder", name: "Review variants" });

    expect(result.placements[0].variantReviewRequired).toBe(true);
    expect(result.binder.pages[0].slots[0]?.variantReview).toBe("required");
  });

  it("does not use review-required mode to accept a completed invalid printing", () => {
    const baseSetCard = card(4, "en", {
      key: "tcgdex:base1-4:en",
      ref: { provider: "tcgdex", id: "base1-4", language: "en" },
      setId: "base1",
      setName: "Base Set",
    });
    expectPageSelectionError(
      () => applyPageSelection({
        items: [{
          card: baseSetCard,
          variant: { finish: "normal", edition: "first-edition", printing: "shadowed" },
          preferences: { minimumCondition: "any" },
        }],
        allowUnresolvedVariants: true,
      }, { kind: "new-binder", name: "Invalid review escape" }),
      "invalid-variant",
    );
  });

  it("applies unlimited and shadowed defaults only after policy validation", () => {
    const item = createPageSelectionItem(card(7), "holo", {
      preferences: { minimumCondition: "near-mint" },
    });
    expect(item.variant).toEqual({
      finish: "holo",
      edition: "unlimited",
      printing: "shadowed",
      label: undefined,
    });
    expect(item.preferences.minimumCondition).toBe("near-mint");
  });

  it("rejects unsupported layouts and missing page targets", () => {
    expectPageSelectionError(
      () => applyPageSelection(draft(1), {
        kind: "new-binder",
        name: "Unsupported",
        layout: { rows: 2, columns: 4 },
      }),
      "unsupported-layout",
    );
    const binder = addPage(createBinder("Pages"));
    expectPageSelectionError(
      () => applyPageSelection(draft(1), {
        kind: "fill-current-page",
        binder,
        pageId: crypto.randomUUID(),
      }),
      "page-not-found",
    );
  });
});
