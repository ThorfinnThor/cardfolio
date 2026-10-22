import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GiftBuilderPanel } from "@/components/foundation/GiftBuilderPanel";
import type { GiftCardCandidate } from "@/domain/gift-builder";
import { encodeGiftShare, parseGiftShare } from "@/domain/gift-share";
import type { CardSnapshot } from "@/domain/types";

function candidate(index: number): GiftCardCandidate {
  const id = `share-${index}`;
  const card: CardSnapshot = {
    key: `tcgdex:${id}:en`,
    ref: { provider: "tcgdex", id, language: "en" },
    name: `Pikachu ${index}`,
    setId: `set-${index}`,
    setName: `Set ${index}`,
    collectorNumber: String(index),
    physicalStatus: "physical",
    imageBaseUrl: `https://assets.tcgdex.net/en/set/${id}`,
    availableVariants: { normal: false, holo: true, reverse: false, firstEdition: false, shadowless: false },
    fetchedAt: "2026-10-01T10:00:00.000Z",
  };
  return { card, variant: { finish: "holo", edition: "unlimited", printing: "shadowed" }, preferences: { minimumCondition: "excellent" }, price: { currency: "EUR", fetchedAt: card.fetchedAt, confidence: "unknown", issues: [] }, reasonTags: [] };
}

const shared = {
  subject: "Pikachu",
  targetCardCount: 9 as const,
  preferredLanguage: "en" as const,
  currency: "EUR" as const,
  budgetMinor: 5_000,
  cards: Array.from({ length: 9 }, (_, index) => ({ id: `share-${index + 1}`, language: "en" as const, variant: { finish: "holo" as const, edition: "unlimited" as const, printing: "shadowed" as const } })),
};

beforeEach(() => {
  window.sessionStorage.clear();
  window.history.replaceState(null, "", `/geschenk/#vorschlag=${encodeGiftShare(shared)}`);
});
afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
});

describe("shared gift proposal", () => {
  it("opens the cards of the link, clears the fragment and offers to share the edited proposal again", async () => {
    const hydrate = vi.fn(async (items: readonly { ref: { id: string } }[]) => items.length === 9 ? Array.from({ length: 9 }, (_, index) => candidate(index + 1)) : []);
    const loader = { loadCandidatePool: vi.fn(async () => []), hydrateCandidates: hydrate };
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<GiftBuilderPanel loader={loader} pricingEnabled={false} onCancel={vi.fn()} onCreateBinder={vi.fn()} onOpenBinder={vi.fn()} onCardsPurchase={vi.fn()} />);

    expect(await screen.findByText(/Dieser Vorschlag wurde per Link geteilt/)).toBeInTheDocument();
    expect(screen.getAllByText("9 / 9")).not.toHaveLength(0);
    expect(window.location.hash).toBe("");
    expect(hydrate.mock.calls[0]![0].map((item) => item.ref.id)).toEqual(shared.cards.map((card) => card.id));

    fireEvent.click(screen.getByRole("button", { name: /Vorschlag als Link teilen/ }));
    expect(await screen.findByText("Link kopiert")).toBeInTheDocument();
    const link = (writeText.mock.calls[0] as unknown as [string])[0];
    expect(parseGiftShare(link.slice(link.indexOf("#")))?.cards.map((card) => card.id)).toEqual(shared.cards.map((card) => card.id));
    expect(screen.getByRole("textbox", { name: "Link zum Vorschlag" })).toHaveValue(link);
  });

  it("explains a link whose cards cannot be loaded instead of showing an empty page", async () => {
    const loader = { loadCandidatePool: vi.fn(async () => []), hydrateCandidates: vi.fn(async () => []) };
    render(<GiftBuilderPanel loader={loader} pricingEnabled={false} onCancel={vi.fn()} onCreateBinder={vi.fn()} onOpenBinder={vi.fn()} onCardsPurchase={vi.fn()} />);
    expect(await screen.findByText(/Bitte frage nach einem neuen Link/)).toBeInTheDocument();
  });

  it("ignores a damaged link and starts normally", () => {
    window.history.replaceState(null, "", "/geschenk/#vorschlag=kaputt");
    const loader = { loadCandidatePool: vi.fn(), hydrateCandidates: vi.fn() };
    render(<GiftBuilderPanel loader={loader} pricingEnabled={false} onCancel={vi.fn()} onCreateBinder={vi.fn()} onOpenBinder={vi.fn()} onCardsPurchase={vi.fn()} />);
    expect(screen.getByRole("textbox", { name: "Lieblings-Pokémon" })).toBeInTheDocument();
    expect(loader.hydrateCandidates).not.toHaveBeenCalled();
  });
});
