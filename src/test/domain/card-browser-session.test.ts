import { describe, expect, it } from "vitest";

import {
  addCardBrowserSelection,
  CardBrowserSessionError,
  createCardBrowserSession,
  deriveCardBrowserCardStatus,
  pageSelectionDraftFromBrowser,
  removeCardBrowserSelection,
  updateCardBrowserQuery,
  updateCardBrowserScroll,
} from "@/domain/card-browser-session";
import { createBinder, createPlannedCard, placeCard, setOwned } from "@/domain/binder-actions";
import type { PageSelectionItem } from "@/domain/page-selection";
import type { CardSnapshot, VariantSelection } from "@/domain/types";

const normal: VariantSelection = { finish: "normal", edition: "unlimited", printing: "shadowed" };
const holo: VariantSelection = { finish: "holo", edition: "unlimited", printing: "shadowed" };

function item(id: string, variant = normal): PageSelectionItem {
  const card: CardSnapshot = {
    key: `tcgdex:${id}:en`,
    ref: { provider: "tcgdex", id, language: "en" },
    name: id,
    setId: "base1",
    setName: "Base Set",
    collectorNumber: "1",
    physicalStatus: "physical",
    fetchedAt: "2026-10-03T00:00:00.000Z",
  };
  return { card, variant, preferences: { minimumCondition: "any" } };
}

function expectSessionError(action: () => unknown, code: CardBrowserSessionError["code"]): void {
  try {
    action();
    throw new Error("Expected card browser session to fail.");
  } catch (error) {
    expect(error).toBeInstanceOf(CardBrowserSessionError);
    expect((error as CardBrowserSessionError).code).toBe(code);
  }
}

describe("card browser session", () => {
  it("creates a transient slot session with novice-safe query defaults", () => {
    const binder = createBinder("Target");
    const session = createCardBrowserSession({
      binderId: binder.id,
      kind: "slot",
      pageId: binder.pages[0].id,
      slotIndex: 3,
    });

    expect(session.mode).toBe("single");
    expect(session.query).toEqual({
      text: "",
      language: "all",
      seriesId: undefined,
      setId: undefined,
      sort: "relevance",
    });
    expect(session.scroll).toEqual({ offset: 0 });
    expect(session.selections).toEqual([]);
  });

  it("preserves filters and a normalized scroll anchor across selection changes", () => {
    const binder = createBinder("Target");
    const original = createCardBrowserSession({ binderId: binder.id, kind: "next-free" });
    const queried = updateCardBrowserQuery(original, {
      text: "Pikachu",
      language: "de",
      seriesId: "base",
      setId: "base1",
      sort: "collector-number",
    });
    const scrolled = updateCardBrowserScroll(queried, { cardKey: item("base1-25").card.key, offset: 480 });
    const selected = addCardBrowserSelection(scrolled, item("base1-25"));

    expect(selected.query).toEqual(queried.query);
    expect(selected.scroll).toEqual({ cardKey: "tcgdex:base1-25:en", offset: 480 });
  });

  it("replaces the selection in single mode", () => {
    const binder = createBinder("Target");
    const session = createCardBrowserSession({ binderId: binder.id, kind: "next-free" });
    const first = addCardBrowserSelection(session, item("base1-1"));
    const second = addCardBrowserSelection(first, item("base1-2"));

    expect(second.selections).toHaveLength(1);
    expect(second.selections[0].item.card.key).toBe("tcgdex:base1-2:en");
  });

  it("requires the explicit duplicate action and preserves intentional copies", () => {
    const binder = createBinder("Target");
    const session = createCardBrowserSession(
      { binderId: binder.id, kind: "page", pageId: binder.pages[0].id },
      { mode: "multiple" },
    );
    const first = addCardBrowserSelection(session, item("base1-1"));
    expectSessionError(() => addCardBrowserSelection(first, item("base1-1")), "duplicate-selection");

    const copied = addCardBrowserSelection(first, item("base1-1"), { explicitDuplicate: true });
    const draft = pageSelectionDraftFromBrowser(copied);
    expect(draft.items).toHaveLength(2);
    expect(draft.allowDuplicateCardKeys).toBe(true);
    expect(removeCardBrowserSelection(copied, copied.selections[0].id).selections).toHaveLength(1);
  });

  it("derives selected, planned, missing and owned as independent counts", () => {
    const first = item("base1-1");
    const binder = createBinder("Statuses");
    const missingEntry = createPlannedCard(first.card.key, normal);
    const ownedEntry = createPlannedCard(first.card.key, holo);
    let planned = placeCard(binder, { pageId: binder.pages[0].id, slotIndex: 0 }, missingEntry);
    planned = placeCard(planned, { pageId: binder.pages[0].id, slotIndex: 1 }, ownedEntry);
    planned = setOwned(planned, ownedEntry.id, true);
    const session = addCardBrowserSelection(
      createCardBrowserSession({ binderId: binder.id, kind: "next-free" }),
      first,
    );

    expect(deriveCardBrowserCardStatus(planned, session, first.card.key)).toEqual({
      selected: true,
      planned: true,
      owned: true,
      missing: true,
      selectedCopies: 1,
      plannedCopies: 2,
      ownedCopies: 1,
      missingCopies: 1,
    });
    expect(deriveCardBrowserCardStatus(planned, session, first.card.key, normal)).toMatchObject({
      selectedCopies: 1,
      plannedCopies: 1,
      ownedCopies: 0,
      missingCopies: 1,
    });
    expect(deriveCardBrowserCardStatus(planned, session, first.card.key, holo)).toMatchObject({
      selectedCopies: 0,
      plannedCopies: 1,
      ownedCopies: 1,
      missingCopies: 0,
    });
  });

  it("validates target shape and selection capacity", () => {
    expectSessionError(
      () => createCardBrowserSession({ binderId: "binder", kind: "slot", pageId: "page" }),
      "invalid-target",
    );
    const binder = createBinder("Limit");
    const session = createCardBrowserSession(
      { binderId: binder.id, kind: "page", pageId: binder.pages[0].id },
      { mode: "multiple", selectionLimit: 1 },
    );
    const selected = addCardBrowserSelection(session, item("base1-1"));
    expectSessionError(() => addCardBrowserSelection(selected, item("base1-2")), "selection-limit");
  });
});

