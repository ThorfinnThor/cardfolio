import { describe, expect, it } from "vitest";

import { createBinder, createPlannedCard, placeCard } from "@/domain/binder-actions";
import { applyQuickAdd, parseQuickAddNumbers, parseQuickAddText, planQuickAdd } from "@/domain/quick-add";
import type { Binder, CardSnapshot } from "@/domain/types";

const card = (number: string, name = `Card ${number}`, holoOnly = true): CardSnapshot => ({
  key: `tcgdex:sv01-${number}:en`,
  ref: { provider: "tcgdex", id: `sv01-${number}`, language: "en" },
  name,
  setId: "sv01",
  setName: "Scarlet & Violet",
  collectorNumber: number,
  physicalStatus: "physical",
  availableVariants: holoOnly ? { normal: false, holo: true, reverse: false, firstEdition: false } : { normal: true, holo: true, reverse: true, firstEdition: false },
  fetchedAt: "2026-10-25T00:00:00.000Z",
});

describe("parseQuickAddNumbers", () => {
  it("reads numbers, ranges, quantities and printed totals, ignoring leading zeros", () => {
    const { tokens, invalid } = parseQuickAddNumbers("4 005, 10-12 25x2; 102/102 tg05 7×3");
    expect(tokens).toEqual([
      { number: "4", quantity: 1 }, { number: "5", quantity: 1 },
      { number: "10", quantity: 1 }, { number: "11", quantity: 1 }, { number: "12", quantity: 1 },
      { number: "25", quantity: 2 }, { number: "102", quantity: 1 }, { number: "TG05", quantity: 1 }, { number: "7", quantity: 3 },
    ]);
    expect(invalid).toEqual([]);
  });

  it("adds up a number typed twice and reports what it cannot read", () => {
    const { tokens, invalid } = parseQuickAddNumbers("4 4x2 abc 12-5 3x0 1-500");
    expect(tokens).toEqual([{ number: "4", quantity: 3 }]);
    expect(invalid).toEqual(["abc", "12-5", "3x0", "1-500"]);
  });

  it("keeps a quantity within ninety-nine copies", () => {
    expect(parseQuickAddNumbers("4x99 4x99").tokens).toEqual([{ number: "4", quantity: 99 }]);
  });
});

describe("parseQuickAddText", () => {
  it("takes lines without a colon for the chosen set and named lines for their sets", () => {
    const sections = parseQuickAddText("1 2 3\nJungle: 4 5\nScarlet & Violet: 6\njungle: 7");
    expect(sections.map((section) => [section.setText, section.tokens.map((token) => token.number)])).toEqual([
      ["", ["1", "2", "3"]], ["Jungle", ["4", "5", "7"]], ["Scarlet & Violet", ["6"]],
    ]);
  });

  it("returns nothing for an empty text", () => {
    expect(parseQuickAddText("  \n ")).toEqual([]);
  });
});

describe("planQuickAdd and applyQuickAdd", () => {
  const empty = createBinder("Sammlung");
  const withCard = (binder: Binder, snapshot: CardSnapshot, owned: boolean, quantity?: number): Binder => {
    const slot = binder.pages[0]!.slots.findIndex((entry) => entry === null);
    const planned = { ...createPlannedCard(snapshot.key, { finish: "normal", edition: "unlimited", printing: "shadowed" }), owned, ...(quantity ? { quantity } : {}) };
    return placeCard(binder, { pageId: binder.pages[0]!.id, slotIndex: slot }, planned);
  };

  it("puts new cards into the free slots as owned with quantity and condition", () => {
    const base = withCard(empty, card("1"), true);
    const changes = planQuickAdd(base, [{ card: card("4"), quantity: 2 }, { card: card("5"), quantity: 1 }]);
    const result = applyQuickAdd(base, changes, "near-mint");
    const slots = result.binder.pages[0]!.slots;
    expect(slots.slice(0, 3).map((entry) => [entry?.cardKey, entry?.owned, entry?.quantity, entry?.condition])).toEqual([
      ["tcgdex:sv01-1:en", true, undefined, undefined], ["tcgdex:sv01-4:en", true, 2, "near-mint"], ["tcgdex:sv01-5:en", true, 1, "near-mint"],
    ]);
    expect(result).toMatchObject({ added: 2, updated: 0, reviewRequired: 0 });
    expect(result.cards.map((snapshot) => snapshot.key)).toEqual(["tcgdex:sv01-4:en", "tcgdex:sv01-5:en"]);
  });

  it("raises the copies of a card the binder already holds and marks a planned card as owned", () => {
    const base = withCard(withCard(empty, card("1"), true, 2), card("2"), false);
    const changes = planQuickAdd(base, [{ card: card("1"), quantity: 3 }, { card: card("2"), quantity: 1 }]);
    expect(changes.map((change) => [change.existingEntryId !== undefined, change.alreadyOwned])).toEqual([[true, 2], [true, 0]]);
    const result = applyQuickAdd(base, changes);
    const [first, second] = result.binder.pages[0]!.slots;
    expect(first).toMatchObject({ owned: true, quantity: 5 });
    expect(second).toMatchObject({ owned: true, quantity: 1 });
    expect(result).toMatchObject({ added: 0, updated: 2 });
  });

  it("merges the same card listed twice and adds pages when the free slots run out", () => {
    const changes = planQuickAdd(empty, [{ card: card("1"), quantity: 1 }, { card: card("1"), quantity: 2 }]);
    expect(changes).toHaveLength(1);
    expect(changes[0]!.quantity).toBe(3);
    const many = planQuickAdd(empty, Array.from({ length: 12 }, (_, index) => ({ card: card(String(index + 1)), quantity: 1 })));
    const result = applyQuickAdd(empty, many);
    expect(result.binder.pages).toHaveLength(2);
    expect(result.binder.pages.flatMap((page) => page.slots).filter((entry) => entry?.owned)).toHaveLength(12);
  });

  it("marks a card with several printings for review instead of guessing", () => {
    const result = applyQuickAdd(empty, planQuickAdd(empty, [{ card: card("4", "Charizard", false), quantity: 1 }]));
    expect(result.reviewRequired).toBe(1);
    expect(result.binder.pages[0]!.slots[0]).toMatchObject({ owned: true, variantReview: "required" });
  });
});
