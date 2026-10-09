import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MissingCardsPanel } from "@/components/foundation/MissingCardsPanel";
import type { TcgplayerCardMapping } from "@/domain/tcgplayer-export";
import type { MissingItem } from "@/domain/types";

afterEach(() => cleanup());

const items: MissingItem[] = [
  {
    identityKey: "pikachu",
    card: {
      key: "tcgdex:basep-1:en",
      ref: { provider: "tcgdex", id: "basep-1", language: "en" },
      name: "Pikachu",
      setId: "basep",
      setName: "Wizards Black Star Promos",
      collectorNumber: "001",
      category: "pokemon",
      abilities: ["Static"],
      attacks: ["Growl", "Thundershock"],
      physicalStatus: "physical",
      fetchedAt: "2026-09-27T00:00:00.000Z",
    },
    variant: { finish: "normal", edition: "unlimited", printing: "shadowed" },
    preferences: { minimumCondition: "near-mint" },
    quantity: 2,
    entryIds: ["00000000-0000-4000-8000-000000000001"],
  },
  {
    identityKey: "bulbasaur",
    card: {
      key: "tcgdex:base1-44:en",
      ref: { provider: "tcgdex", id: "base1-44", language: "en" },
      name: "Bulbasaur",
      setId: "base1",
      setName: "Base Set",
      collectorNumber: "044",
      category: "pokemon",
      abilities: [],
      attacks: ["Leech Seed"],
      physicalStatus: "physical",
      fetchedAt: "2026-09-27T00:00:00.000Z",
    },
    variant: { finish: "normal", edition: "unlimited", printing: "shadowed" },
    preferences: { minimumCondition: "any" },
    quantity: 1,
    entryIds: ["00000000-0000-4000-8000-000000000002"],
  },
];

const tcgplayerCardMappings: TcgplayerCardMapping[] = [
  {
    tcgdexCardId: "base1-44",
    tcgdexName: "Bulbasaur",
    candidates: [{
      productName: "Bulbasaur",
      collectorNumber: "044/102",
      tcgplayerSetCode: "BS",
      tcgplayerSetName: "Base Set",
      foilOnly: false,
      productId: 1,
    }],
  },
];

function props() {
  return {
    items,
    warnings: [],
    copyState: "idle" as const,
    onCopy: vi.fn(),
    onTextExport: vi.fn(),
    onCsvExport: vi.fn(),
    onClose: vi.fn(),
  };
}

describe("MissingCardsPanel", () => {
  it("shows missing positions and sends the filtered list to copy", () => {
    const panelProps = props();
    render(<MissingCardsPanel {...panelProps} />);

    expect(screen.getByRole("heading", { name: "Fehlende Karten" })).toBeInTheDocument();
    expect(screen.getByText("Pikachu")).toBeInTheDocument();
    expect(screen.getByText("Bulbasaur")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("textbox", { name: "Fehlkarten filtern" }), { target: { value: "pikachu" } });
    expect(screen.getByText("Pikachu")).toBeInTheDocument();
    expect(screen.queryByText("Bulbasaur")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Liste kopieren" }));

    expect(panelProps.onCopy).toHaveBeenCalledWith([items[0]]);
  });

  it("explains when clipboard permission is missing and keeps file exports available", () => {
    const panelProps = { ...props(), copyState: "error" as const };
    render(<MissingCardsPanel {...panelProps} />);

    expect(screen.getByRole("status")).toHaveTextContent("Kopieren wurde vom Browser nicht erlaubt");
    expect(screen.getByRole("button", { name: "TXT" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "CSV" })).toBeEnabled();
  });

  it("opens a prefilled TCGplayer handoff and keeps excluded candidates visible", () => {
    const onTcgplayerCopy = vi.fn();
    const onTcgplayerTextExport = vi.fn();
    render(
      <MissingCardsPanel
        {...props()}
        tcgplayerEnabled
        tcgplayerCardMappings={tcgplayerCardMappings}
        onTcgplayerCopy={onTcgplayerCopy}
        onTcgplayerTextExport={onTcgplayerTextExport}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "TCGplayer" }));
    expect(screen.getByRole("heading", { name: "TCGplayer Mass Entry" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "TCGplayer Mass-Entry-Vorschau" })).toHaveValue("1 Bulbasaur [BS] 044/102");
    expect(screen.getByText(/2× Pikachu · Wizards Black Star Promos · 001/)).toBeInTheDocument();
    expect(screen.getByText(/Kandidat: Für diese Karte wurde im aktuellen TCGplayer-Katalog/)).toBeInTheDocument();
    expect(screen.getByText("Nicht in die TCGplayer-Liste übernommen")).toBeInTheDocument();
    expect(screen.getByText(/bleiben unverändert in deiner Fehlkartenliste/)).toBeInTheDocument();
    const handoffLink = screen.getByRole("link", { name: /Liste bei TCGplayer öffnen/ });
    expect(handoffLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(new URL(handoffLink.getAttribute("href") ?? "").searchParams.get("c")).toBe("1 Bulbasaur [BS] 044/102");
    expect(screen.getByText(/Printing: Unlimited · Zustand: alle Zustände einschließlich Damaged/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "TCGplayer kopieren" }));
    fireEvent.click(screen.getByRole("button", { name: "TCGplayer TXT" }));

    expect(onTcgplayerCopy).toHaveBeenCalledWith(expect.objectContaining({ text: "1 Bulbasaur [BS] 044/102", verifiedCount: 1 }));
    expect(onTcgplayerTextExport).toHaveBeenCalledWith(expect.objectContaining({ text: "1 Bulbasaur [BS] 044/102", reviewRequiredCount: 1 }));
  });

  it("shows the exact Cardmarket decklist format and keeps review links separate", () => {
    const onCardmarketPrepare = vi.fn();
    const onCardmarketCopy = vi.fn();
    const onCardmarketTextExport = vi.fn();
    render(
      <MissingCardsPanel
        {...props()}
        cardmarketEnabled
        onCardmarketPrepare={onCardmarketPrepare}
        onCardmarketCopy={onCardmarketCopy}
        onCardmarketTextExport={onCardmarketTextExport}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cardmarket" }));
    expect(onCardmarketPrepare).toHaveBeenCalledWith(items);
    expect(screen.getByRole("heading", { name: "Cardmarket Deckliste" })).toBeInTheDocument();
    expect(screen.getByText(/vollständiger Kartenname, Fähigkeiten und Attacken/)).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Cardmarket-Decklistenvorschau" })).toHaveValue(
      "2x Pikachu Static Growl Thundershock\n1x Bulbasaur Leech Seed",
    );
    expect(screen.getByRole("link", { name: "Offizielles Format" })).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByRole("link", { name: "Ausgaben auf Cardmarket prüfen" })).toHaveAttribute("rel", "noopener noreferrer");
    fireEvent.click(screen.getByText("Einzelsuchen für Teil 1 anzeigen (2)"));
    const searchLinks = screen.getAllByRole("link", { name: /Karte suchen/ });
    expect(searchLinks).toHaveLength(2);
    expect(new URL(searchLinks[0].getAttribute("href") ?? "").searchParams.get("searchString")).toBe("Pikachu Wizards Black Star Promos 001");

    fireEvent.click(screen.getByRole("button", { name: "Deckliste kopieren" }));
    fireEvent.click(screen.getByRole("button", { name: "Deckliste TXT" }));

    expect(onCardmarketCopy).toHaveBeenCalledWith(expect.objectContaining({ index: 1, positionCount: 2 }));
    expect(onCardmarketTextExport).toHaveBeenCalledWith(expect.objectContaining({ index: 1, positionCount: 2 }));
  });

  it("shows only the marketplace selected by the user", () => {
    render(<MissingCardsPanel {...props()} tcgplayerEnabled tcgplayerCardMappings={tcgplayerCardMappings} cardmarketEnabled />);

    expect(screen.queryByRole("heading", { name: "TCGplayer Mass Entry" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Cardmarket Deckliste" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "TCGplayer" }));
    expect(screen.getByRole("heading", { name: "TCGplayer Mass Entry" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Cardmarket Deckliste" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cardmarket" }));
    expect(screen.queryByRole("heading", { name: "TCGplayer Mass Entry" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cardmarket Deckliste" })).toBeInTheDocument();
  });

  it("keeps CardTrader progressive and shows one clear, non-purchase preview", () => {
    render(<MissingCardsPanel {...props()} />);

    expect(screen.queryByRole("button", { name: "CardTrader" })).not.toBeInTheDocument();
    cleanup();

    render(<MissingCardsPanel {...props()} cardtraderPreviewVisible cardtraderStatus="not-approved" />);
    fireEvent.click(screen.getByRole("button", { name: "CardTrader · Vorschau" }));
    expect(screen.getByRole("heading", { name: "CardTrader" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("noch nicht freigegeben");
    expect(screen.getByText("Preis unbekannt")).toBeInTheDocument();
    expect(screen.getByText("Versand & Steuer")).toBeInTheDocument();
    expect(screen.getByText("1× Bulbasaur")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Wishlist erstellen" })).toBeDisabled();
    expect(screen.getAllByText("Noch nicht freigegeben")).toHaveLength(2);
  });
});
