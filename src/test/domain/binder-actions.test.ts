import { describe, expect, it } from "vitest";

import {
  addPage,
  BINDER_DESCRIPTION_MAX_LENGTH,
  BINDER_NAME_MAX_LENGTH,
  changeBinderLayout,
  createBinder,
  createPlannedCard,
  deletePage,
  duplicateBinder,
  duplicatePage,
  movePage,
  moveOrSwapCard,
  placeCard,
  previewBinderLayoutChange,
  removeCard,
  renameBinder,
  PAGE_TITLE_MAX_LENGTH,
  PAGE_NOTE_MAX_LENGTH,
  setBinderDescription,
  setCardPreferences,
  setCardVariant,
  setOwned,
  setPageNote,
  setPageTitle,
} from "@/domain/binder-actions";
import { deriveBinderStats } from "@/domain/binder-stats";
import { deriveMissingItems } from "@/domain/missing-items";
import type { CardSnapshot } from "@/domain/types";

const card: CardSnapshot = {
  key: "tcgdex:base1-1:en",
  ref: { provider: "tcgdex", id: "base1-1", language: "en" },
  name: "Bulbasaur",
  setId: "base1",
  setName: "Base Set",
  collectorNumber: "001",
  physicalStatus: "physical",
  fetchedAt: "2026-09-27T00:00:00.000Z",
};

describe("binder domain", () => {
  it("reports zero-safe statistics for an empty binder", () => {
    expect(deriveBinderStats(createBinder("Empty"))).toEqual({
      capacity: 9,
      planned: 0,
      owned: 0,
      missing: 0,
      completionPercent: 0,
    });
  });

  it("places, owns, moves, swaps and removes cards without mutating prior state", () => {
    const empty = addPage(createBinder("Base Set"));
    const first = createPlannedCard(card.key);
    const second = createPlannedCard(card.key, { finish: "reverse", edition: "unlimited" });
    const withFirst = placeCard(empty, { pageId: empty.pages[0].id, slotIndex: 0 }, first);
    const withBoth = placeCard(withFirst, { pageId: empty.pages[1].id, slotIndex: 3 }, second);
    const swapped = moveOrSwapCard(
      withBoth,
      { pageId: empty.pages[0].id, slotIndex: 0 },
      { pageId: empty.pages[1].id, slotIndex: 3 },
    );
    const owned = setOwned(swapped, first.id, true);
    const removed = removeCard(owned, { pageId: empty.pages[0].id, slotIndex: 0 });

    expect(empty.pages[0].slots[0]).toBeNull();
    expect(swapped.pages[0].slots[0]?.id).toBe(second.id);
    expect(swapped.pages[1].slots[3]?.id).toBe(first.id);
    expect(owned.pages[1].slots[3]?.owned).toBe(true);
    expect(removed.pages[0].slots[0]).toBeNull();
  });

  it("keeps variants, language and condition as separate missing identities", () => {
    const empty = createBinder("Missing");
    const entries = [
      createPlannedCard(card.key, { finish: "normal", edition: "unlimited" }),
      createPlannedCard(card.key, { finish: "normal", edition: "unlimited" }),
      createPlannedCard(card.key, { finish: "normal", edition: "unlimited" }),
      createPlannedCard(card.key, { finish: "reverse", edition: "unlimited" }),
    ];
    let binder = empty;
    entries.forEach((entry, index) => {
      binder = placeCard(binder, { pageId: empty.pages[0].id, slotIndex: index }, entry);
    });
    binder = setOwned(binder, entries[0].id, true);

    const missing = deriveMissingItems(binder, new Map([[card.key, card]]));
    expect(missing).toHaveLength(2);
    expect(missing.map((item) => item.quantity).sort()).toEqual([1, 2]);
    expect(deriveBinderStats(binder)).toMatchObject({ planned: 4, owned: 1, missing: 3 });
  });

  it("rejects invalid positions and duplicate planned entry IDs", () => {
    const binder = createBinder("Safe");
    const entry = createPlannedCard(card.key);
    expect(() => placeCard(binder, { pageId: binder.pages[0].id, slotIndex: -1 }, entry)).toThrow();
    const placed = placeCard(binder, { pageId: binder.pages[0].id, slotIndex: 0 }, entry);
    expect(() => placeCard(placed, { pageId: binder.pages[0].id, slotIndex: 1 }, entry)).toThrow();
  });

  it("updates the selected finish, edition and printing without mutating the prior binder", () => {
    const binder = createBinder("Variants");
    const entry = createPlannedCard(card.key);
    const placed = placeCard(binder, { pageId: binder.pages[0].id, slotIndex: 0 }, entry);
    const updated = setCardVariant(placed, entry.id, {
      finish: "holo",
      edition: "first-edition",
      printing: "shadowless",
    });

    expect(placed.pages[0].slots[0]?.variant).toEqual({ finish: "unspecified", edition: "unspecified" });
    expect(updated.pages[0].slots[0]?.variant).toEqual({
      finish: "holo",
      edition: "first-edition",
      printing: "shadowless",
    });
  });

  it("updates the minimum condition without mutating the prior binder", () => {
    const binder = createBinder("Conditions");
    const entry = createPlannedCard(card.key);
    const placed = placeCard(binder, { pageId: binder.pages[0].id, slotIndex: 0 }, entry);
    const updated = setCardPreferences(placed, entry.id, { minimumCondition: "near-mint" });

    expect(placed.pages[0].slots[0]?.preferences).toEqual({ minimumCondition: "any" });
    expect(updated.pages[0].slots[0]?.preferences).toEqual({ minimumCondition: "near-mint" });
  });

  it("reflows into 2x2 pages without losing card identity, ownership, variants or notes", () => {
    let binder = addPage(createBinder("Resize"));
    binder.pages[0].note = "First page note";
    binder.pages[1].note = "Second page note";
    const entries = Array.from({ length: 10 }, (_, index) => createPlannedCard(
      card.key,
      { finish: index === 4 ? "reverse" : "normal", edition: "unlimited" },
    ));
    entries.forEach((entry, index) => {
      const pageIndex = index < 5 ? 0 : 1;
      const slotIndex = index < 5 ? index * 2 : (index - 5) * 2;
      binder = placeCard(binder, { pageId: binder.pages[pageIndex].id, slotIndex }, entry);
    });
    binder = setOwned(binder, entries[4].id, true);

    const resized = changeBinderLayout(binder, { rows: 2, columns: 2 });
    const resizedEntries = resized.pages.flatMap((page) => page.slots).filter(Boolean);

    expect(resized.layout).toEqual({ rows: 2, columns: 2 });
    expect(resized.pages).toHaveLength(3);
    expect(resized.pages.map((page) => page.slots)).toSatisfy((pages: Array<Array<unknown>>) => pages.every((slots) => slots.length === 4));
    expect(resizedEntries.map((entry) => entry?.id)).toEqual(entries.map((entry) => entry.id));
    expect(resizedEntries[4]).toMatchObject({ id: entries[4].id, owned: true, variant: { finish: "reverse" } });
    expect(resized.pages[0].note).toBe("First page note");
    expect(resized.pages[1].note).toBe("Second page note");
    expect(binder.layout).toEqual({ rows: 3, columns: 3 });
  });

  it("previews every moved card and preserves existing pages when expanding to 3x4", () => {
    let binder = addPage(createBinder("Expand"));
    const first = createPlannedCard(card.key);
    const second = createPlannedCard(card.key);
    binder = placeCard(binder, { pageId: binder.pages[0].id, slotIndex: 8 }, first);
    binder = placeCard(binder, { pageId: binder.pages[1].id, slotIndex: 8 }, second);

    const preview = previewBinderLayoutChange(binder, { rows: 3, columns: 4 });
    const resized = changeBinderLayout(binder, { rows: 3, columns: 4 });

    expect(preview).toEqual({
      from: { rows: 3, columns: 3 },
      to: { rows: 3, columns: 4 },
      plannedCards: 2,
      pagesBefore: 2,
      pagesAfter: 2,
      movedCards: 2,
    });
    expect(resized.pages).toHaveLength(2);
    expect(resized.pages[0].slots[0]?.id).toBe(first.id);
    expect(resized.pages[0].slots[1]?.id).toBe(second.id);
  });

  it("rejects unsupported layouts and is a no-op for the current layout", () => {
    const binder = createBinder("Stable");
    expect(changeBinderLayout(binder, { rows: 3, columns: 3 })).toBe(binder);
    expect(() => changeBinderLayout(binder, { rows: 2, columns: 4 })).toThrow("not supported");
  });

  it("updates binder descriptions and page notes immutably within their product limits", () => {
    const binder = createBinder("Notes");
    const described = setBinderDescription(binder, "Base Set master collection");
    const noted = setPageNote(described, described.pages[0].id, "Top row should stay holographic.");

    expect(binder.description).toBe("");
    expect(binder.pages[0].note).toBe("");
    expect(noted.description).toBe("Base Set master collection");
    expect(noted.pages[0].note).toBe("Top row should stay holographic.");
    expect(() => setBinderDescription(noted, "x".repeat(BINDER_DESCRIPTION_MAX_LENGTH + 1))).toThrow("500");
    expect(() => setPageNote(noted, noted.pages[0].id, "x".repeat(PAGE_NOTE_MAX_LENGTH + 1))).toThrow("2000");
    expect(() => setPageNote(noted, crypto.randomUUID(), "Lost page")).toThrow("does not exist");
  });

  it("renames binders with trimming and enforces the name limit", () => {
    const binder = createBinder("Original");
    const renamed = renameBinder(binder, "  Base Set Master  ");

    expect(binder.name).toBe("Original");
    expect(renamed.name).toBe("Base Set Master");
    expect(renameBinder(renamed, "Base Set Master")).toBe(renamed);
    expect(() => renameBinder(renamed, "   ")).toThrow("1 to 100");
    expect(() => renameBinder(renamed, "x".repeat(BINDER_NAME_MAX_LENGTH + 1))).toThrow("100");
  });

  it("duplicates pages with fresh page and entry IDs, then requires confirmation before deleting cards", () => {
    const binder = createBinder("Page management");
    const entry = createPlannedCard(card.key, { finish: "holo", edition: "first-edition" });
    const placed = setPageNote(
      placeCard(binder, { pageId: binder.pages[0].id, slotIndex: 0 }, entry),
      binder.pages[0].id,
      "Keep this layout together.",
    );
    const duplicated = duplicatePage(placed, placed.pages[0].id);
    const duplicateEntry = duplicated.pages[1].slots[0];

    expect(duplicated.pages).toHaveLength(2);
    expect(duplicated.pages[1].id).not.toBe(duplicated.pages[0].id);
    expect(duplicated.pages[1].note).toBe("Keep this layout together.");
    expect(duplicateEntry).toMatchObject({ cardKey: card.key, owned: false, variant: entry.variant });
    expect(duplicateEntry?.id).not.toBe(entry.id);
    expect(() => deletePage(duplicated, duplicated.pages[1].id)).toThrow("requires confirmation");

    const deleted = deletePage(duplicated, duplicated.pages[1].id, true);
    expect(deleted.pages).toHaveLength(1);
    expect(deleted.pages[0].slots[0]?.id).toBe(entry.id);
    expect(() => deletePage(deleted, deleted.pages[0].id, true)).toThrow("at least one page");
  });

  it("names and reorders pages without changing their contents", () => {
    const first = createBinder("Ordered pages");
    const withSecondPage = addPage(first);
    const named = setPageTitle(withSecondPage, withSecondPage.pages[0].id, "  Lieblingskarten  ");
    const moved = movePage(named, named.pages[1].id, "forward");

    expect(named.pages[0].title).toBe("Lieblingskarten");
    expect(moved.pages.map((page) => page.id)).toEqual([named.pages[1].id, named.pages[0].id]);
    expect(moved.pages[1].title).toBe("Lieblingskarten");
    expect(movePage(moved, moved.pages[0].id, "forward")).toBe(moved);
    expect(setPageTitle(named, named.pages[0].id, "   ").pages[0].title).toBeUndefined();
    expect(() => setPageTitle(named, named.pages[0].id, "x".repeat(PAGE_TITLE_MAX_LENGTH + 1))).toThrow("80");
  });

  it("duplicates a complete binder with fresh IDs", () => {
    const binder = createBinder("A".repeat(BINDER_NAME_MAX_LENGTH));
    const entry = createPlannedCard(card.key, { finish: "holo", edition: "first-edition" });
    const filled = setPageTitle(
      setPageNote(
        placeCard(binder, { pageId: binder.pages[0].id, slotIndex: 0 }, entry),
        binder.pages[0].id,
        "Page note",
      ),
      binder.pages[0].id,
      "Showcase",
    );
    const copy = duplicateBinder(filled);

    expect(copy.id).not.toBe(filled.id);
    expect(copy.revision).toBe(0);
    expect(copy.name).toHaveLength(BINDER_NAME_MAX_LENGTH);
    expect(copy.name).toMatch(/ \(Kopie\)$/);
    expect(copy.pages[0].id).not.toBe(filled.pages[0].id);
    expect(copy.pages[0].title).toBe("Showcase");
    expect(copy.pages[0].note).toBe("Page note");
    expect(copy.pages[0].slots[0]?.id).not.toBe(entry.id);
    expect(copy.pages[0].slots[0]).toMatchObject({ cardKey: card.key, variant: entry.variant });
  });
});
