import { describe, expect, it } from "vitest";

import {
  addPage,
  changeBinderLayout,
  createBinder,
  createPlannedCard,
  moveOrSwapCard,
  placeCard,
  previewBinderLayoutChange,
  removeCard,
  setOwned,
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
});
