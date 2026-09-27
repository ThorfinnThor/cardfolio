import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BinderGrid } from "@/components/foundation/BinderGrid";
import type { BinderPage, CardSnapshot, PlannedCard } from "@/domain/types";

afterEach(() => cleanup());

const card: CardSnapshot = {
  key: "tcgdex:base1-44:en",
  ref: { provider: "tcgdex", id: "base1-44", language: "en" },
  name: "Bulbasaur",
  setId: "base1",
  setName: "Base Set",
  collectorNumber: "044",
  physicalStatus: "physical",
  fetchedAt: "2026-09-27T00:00:00.000Z",
};

const entry: PlannedCard = {
  id: "00000000-0000-4000-8000-000000000001",
  cardKey: card.key,
  variant: { finish: "holo", edition: "first-edition", printing: "shadowless" },
  preferences: { minimumCondition: "any" },
  owned: false,
  addedAt: "2026-09-27T00:00:00.000Z",
};

const page: BinderPage = {
  id: "00000000-0000-4000-8000-000000000002",
  note: "",
  slots: [entry, null, null, null],
};

describe("BinderGrid", () => {
  it("keeps button-based move and placement controls alongside mouse drag", () => {
    const onOpenSearch = vi.fn();
    const onSelectMoveSource = vi.fn();
    render(
      <BinderGrid
        page={page}
        columns={2}
        cards={new Map([[card.key, card]])}
        onOpenSearch={onOpenSearch}
        onSelectMoveSource={onSelectMoveSource}
        onMove={vi.fn()}
        onToggleOwned={vi.fn()}
        onRequestVariant={vi.fn()}
        onRefreshCard={vi.fn()}
        onRequestRemove={vi.fn()}
      />,
    );

    expect(screen.getByRole("article", { name: "Bulbasaur, Slot 1" })).toBeInTheDocument();
    expect(screen.getByText("Holo · First Edition · Shadowless")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Freier Platz \d+, Karte einsetzen/ })).toHaveLength(3);

    fireEvent.click(screen.getByRole("button", { name: "Verschieben" }));
    fireEvent.click(screen.getByRole("button", { name: "Freier Platz 2, Karte einsetzen" }));

    expect(onSelectMoveSource).toHaveBeenCalledWith({ pageId: page.id, slotIndex: 0 });
    expect(onOpenSearch).toHaveBeenCalledWith({ pageId: page.id, slotIndex: 1 });
  });

  it("exposes occupied and empty target buttons while move mode is active", () => {
    const secondEntry = { ...entry, id: "00000000-0000-4000-8000-000000000003" };
    const onMove = vi.fn();
    render(
      <BinderGrid
        page={{ ...page, slots: [entry, secondEntry, null, null] }}
        columns={2}
        cards={new Map([[card.key, card]])}
        movingLocation={{ pageId: page.id, slotIndex: 0 }}
        onOpenSearch={vi.fn()}
        onSelectMoveSource={vi.fn()}
        onMove={onMove}
        onToggleOwned={vi.fn()}
        onRequestVariant={vi.fn()}
        onRefreshCard={vi.fn()}
        onRequestRemove={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Freier Platz 3, hierher verschieben" })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Hierher verschieben" })[0]);
    expect(onMove).toHaveBeenCalledWith(
      { pageId: page.id, slotIndex: 0 },
      { pageId: page.id, slotIndex: 1 },
    );
  });

  it("replaces a failed remote card image with an accessible fallback", () => {
    const cardWithImage = {
      ...card,
      imageBaseUrl: "https://assets.tcgdex.net/en/base/base1/44",
    };
    const onRefreshCard = vi.fn();
    render(
      <BinderGrid
        page={page}
        columns={2}
        cards={new Map([[card.key, cardWithImage]])}
        onOpenSearch={vi.fn()}
        onSelectMoveSource={vi.fn()}
        onMove={vi.fn()}
        onToggleOwned={vi.fn()}
        onRequestVariant={vi.fn()}
        onRefreshCard={onRefreshCard}
        onRequestRemove={vi.fn()}
      />,
    );

    fireEvent.error(screen.getByRole("img", { name: "Bulbasaur, Base Set 044" }));

    expect(screen.getByRole("img", { name: "Bild für Bulbasaur nicht verfügbar" })).toHaveTextContent("Bild nicht verfügbar");
    fireEvent.click(screen.getByRole("button", { name: "Kartendaten aktualisieren" }));
    expect(onRefreshCard).toHaveBeenCalledWith(cardWithImage);
  });
});
