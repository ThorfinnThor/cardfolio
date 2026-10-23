import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GiftBuilderPanel } from "@/components/foundation/GiftBuilderPanel";
import type { GiftCardCandidate } from "@/domain/gift-builder";
import type { CardSnapshot } from "@/domain/types";

function candidate(id: string): GiftCardCandidate {
  const card: CardSnapshot = {
    key: `tcgdex:${id}:en`,
    ref: { provider: "tcgdex", id, language: "en" },
    name: `Feuer ${id}`,
    setId: "base1",
    setName: "Base Set",
    collectorNumber: "1",
    physicalStatus: "physical",
    imageBaseUrl: `https://assets.tcgdex.net/en/base/base1/${id}`,
    availableVariants: { normal: false, holo: true, reverse: false, firstEdition: false, shadowless: false },
    fetchedAt: "2026-10-01T10:00:00.000Z",
  };
  return { card, variant: { finish: "holo", edition: "unlimited", printing: "shadowed" }, preferences: { minimumCondition: "excellent" }, price: { currency: "EUR", fetchedAt: card.fetchedAt, confidence: "unknown", issues: [] }, reasonTags: [] };
}

const ids = Array.from({ length: 20 }, (_, index) => `fire-${index + 1}`);

beforeEach(() => {
  window.sessionStorage.clear();
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ version: 1, generatedAt: "2026-10-23", collections: { "type-fire": ids } }) })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("gift builder with a type collection", () => {
  it("offers type and special themes and builds a page from the chosen collection", async () => {
    const hydrate = vi.fn(async (items: readonly { ref: { id: string } }[]) => items.map((item) => candidate(item.ref.id)));
    const loader = { loadCandidatePool: vi.fn(), hydrateCandidates: hydrate };
    const smartSearch = { search: vi.fn(async () => []) };
    render(<GiftBuilderPanel loader={loader} smartSearch={smartSearch} initialDiscoveryMode="theme" pricingEnabled={false} onCancel={vi.fn()} onCreateBinder={vi.fn()} onOpenBinder={vi.fn()} onCardsPurchase={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Nach Pokémon-Typ" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Besondere Karten" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: /Feuer-Pokémon/ }));
    fireEvent.click(screen.getByRole("button", { name: /Binder-Seite ansehen/i }));

    await waitFor(() => expect(hydrate).toHaveBeenCalled());
    expect((hydrate.mock.calls[0]![0] as { ref: { id: string } }[]).map((item) => item.ref.id).slice(0, 3)).toEqual(["fire-1", "fire-2", "fire-3"]);
    expect(await screen.findAllByText("9 / 9")).not.toHaveLength(0);
    expect(smartSearch.search).not.toHaveBeenCalled();
  });
  it("opens with the theme a guide linked to already chosen and ignores unknown ids", () => {
    const loader = { loadCandidatePool: vi.fn(), hydrateCandidates: vi.fn() };
    const smartSearch = { search: vi.fn(async () => []) };
    const props = { loader, smartSearch, pricingEnabled: false, onCancel: vi.fn(), onCreateBinder: vi.fn(), onOpenBinder: vi.fn(), onCardsPurchase: vi.fn() };
    const { unmount } = render(<GiftBuilderPanel {...props} initialThemeId="type-fire" />);
    expect(screen.getByRole("radio", { name: /Feuer-Pokémon/ })).toBeChecked();
    unmount();

    render(<GiftBuilderPanel {...props} initialThemeId="does-not-exist" />);
    expect(screen.queryByRole("heading", { name: "Nach Pokémon-Typ" })).not.toBeInTheDocument();
  });
});
