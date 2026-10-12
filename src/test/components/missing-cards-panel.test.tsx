import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MissingCardsPanel } from "@/components/foundation/MissingCardsPanel";
import type { MarketplaceProductIdentityMapping } from "@/domain/marketplace-product-identity";
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

const cardmarketProductMappings: MarketplaceProductIdentityMapping[] = [{
  schemaVersion: 1,
  provider: "cardmarket",
  tcgdexCardId: "basep-1",
  cardName: "Pikachu",
  scope: { language: "any", finish: "any", edition: "any", printing: "any" },
  status: "verified",
  productUrl: "https://www.cardmarket.com/en/Pokemon/Cards/Pikachu",
  source: { kind: "manual-product-review", label: "Testzuordnung" },
  checkedAt: "2026-10-12T00:00:00.000Z",
  verifiedAt: "2026-10-12T00:00:00.000Z",
}];

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

  it("lets the user set one condition for all cards or override a single position", () => {
    const onConditionsChange = vi.fn();
    const conditionItems = items.map((item) => ({
      ...item,
      preferences: { minimumCondition: "excellent" as const },
    }));
    render(<MissingCardsPanel {...props()} items={conditionItems} onConditionsChange={onConditionsChange} />);

    const allConditions = screen.getByRole("combobox", { name: "Zustand für alle" });
    expect(allConditions).toHaveValue("excellent");
    expect(screen.getAllByText(/Cardmarket: Near Mint oder Excellent/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Unsere Empfehlung für Geschenke/)).toBeInTheDocument();
    expect(screen.getByText("Was bedeutet der Kartenzustand?")).toBeInTheDocument();
    fireEvent.change(allConditions, { target: { value: "near-mint" } });
    expect(onConditionsChange).toHaveBeenCalledWith(conditionItems, "near-mint");

    fireEvent.change(screen.getByRole("combobox", { name: "Zustand für Pikachu aus Wizards Black Star Promos" }), { target: { value: "played" } });
    expect(onConditionsChange).toHaveBeenLastCalledWith([conditionItems[0]], "played");
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
    expect(screen.getByText("1 Karte braucht deine Aufmerksamkeit")).toBeInTheDocument();
    expect(screen.getByText("Vor der Übergabe prüfen")).toBeInTheDocument();
    expect(screen.getByText(/bleiben in deiner Fehlkartenliste/)).toBeInTheDocument();
    const handoffLink = screen.getByRole("link", { name: /Liste bei TCGplayer öffnen/ });
    expect(handoffLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(new URL(handoffLink.getAttribute("href") ?? "").searchParams.get("c")).toBe("1 Bulbasaur [BS] 044/102");
    expect(screen.getByText(/Printing: Unlimited · Zustand: alle Zustände einschließlich Damaged/)).toBeInTheDocument();
    expect(screen.getByText("Bereits vorbereitete Karten anzeigen (1)").closest("details")).not.toHaveAttribute("open");
    expect(screen.getByText("Vollständige Fehlkartenliste anzeigen (2)").closest("details")).not.toHaveAttribute("open");

    fireEvent.click(screen.getByRole("button", { name: "TCGplayer kopieren" }));
    fireEvent.click(screen.getByRole("button", { name: "TCGplayer TXT" }));

    expect(onTcgplayerCopy).toHaveBeenCalledWith(expect.objectContaining({ text: "1 Bulbasaur [BS] 044/102", verifiedCount: 1 }));
    expect(onTcgplayerTextExport).toHaveBeenCalledWith(expect.objectContaining({ text: "1 Bulbasaur [BS] 044/102", reviewRequiredCount: 1 }));
  });

  it("makes the one-click Cardmarket bulk handoff primary and keeps single searches as fallback", () => {
    const onCardmarketPrepare = vi.fn();
    const onCardmarketCopy = vi.fn();
    const onCardmarketTextExport = vi.fn();
    render(
      <MissingCardsPanel
        {...props()}
        cardmarketEnabled
        cardmarketProductMappings={cardmarketProductMappings}
        cardmarketDecklistIdentities={{
          "basep-1": "Pikachu Static Growl Thundershock",
          "base1-44": "Bulbasaur Leech Seed",
        }}
        onCardmarketPrepare={onCardmarketPrepare}
        onCardmarketCopy={onCardmarketCopy}
        onCardmarketTextExport={onCardmarketTextExport}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cardmarket" }));
    expect(onCardmarketPrepare).toHaveBeenCalledWith(items);
    expect(screen.getByRole("heading", { name: "Komplette Liste zu Cardmarket" })).toBeInTheDocument();
    expect(screen.getByText("Nur einmal klicken – nicht jede Karte einzeln suchen")).toBeInTheDocument();
    expect(screen.getByText(/Cardmarket übernimmt den Zustand nicht automatisch/)).toBeInTheDocument();
    expect(screen.getByText(/Die Karten haben unterschiedliche Zustandswünsche/)).toBeInTheDocument();
    const bulkHandoff = screen.getByRole("link", { name: "2 Karten kopieren & Cardmarket öffnen" });
    expect(bulkHandoff).toHaveAttribute("href", "https://www.cardmarket.com/de/Pokemon/Wants");
    expect(bulkHandoff).toHaveAttribute("rel", "noopener noreferrer");
    fireEvent.click(bulkHandoff);
    expect(onCardmarketCopy).toHaveBeenCalledWith(expect.objectContaining({ index: 1, positionCount: 2 }));

    const fallback = screen.getByText("Nur falls Cardmarket eine Karte nicht erkennt: Einzelsuchen (2)").closest("details");
    expect(fallback).not.toHaveAttribute("open");
    fireEvent.click(screen.getByText("Nur falls Cardmarket eine Karte nicht erkennt: Einzelsuchen (2)"));
    expect(screen.getByText("Geprüfte Produktseiten")).toBeInTheDocument();
    expect(screen.getByText("Vorausgefüllte Suchlinks")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Produktseite öffnen/ })).toHaveAttribute("href", "https://www.cardmarket.com/en/Pokemon/Cards/Pikachu");
    const searchLinks = screen.getAllByRole("link", { name: /Karte suchen/ });
    expect(searchLinks).toHaveLength(1);
    expect(new URL(searchLinks[0].getAttribute("href") ?? "").searchParams.get("searchString")).toBe("Bulbasaur Base Set 044");
    expect(screen.getByText("Importliste ansehen oder als Datei speichern").closest("details")).not.toHaveAttribute("open");

    fireEvent.click(screen.getByText("Importliste ansehen oder als Datei speichern"));
    expect(screen.getByRole("textbox", { name: "Cardmarket-Decklistenvorschau" })).toHaveValue(
      "2x Pikachu Static Growl Thundershock\n1x Bulbasaur Leech Seed",
    );
    expect(screen.getByRole("link", { name: "Cardmarket-Hilfe" })).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByRole("link", { name: "Cardmarket-Kartenübersicht öffnen" })).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText("Alle Karten sind für den Decklistenimport vorbereitet")).toBeInTheDocument();
    expect(screen.getByText("Vollständige Fehlkartenliste anzeigen (2)").closest("details")).not.toHaveAttribute("open");

    fireEvent.click(screen.getByRole("button", { name: "Deckliste kopieren" }));
    fireEvent.click(screen.getByRole("button", { name: "Deckliste TXT" }));

    expect(onCardmarketCopy).toHaveBeenCalledTimes(2);
    expect(onCardmarketTextExport).toHaveBeenCalledWith(expect.objectContaining({ index: 1, positionCount: 2 }));
  });

  it("translates Cardfolio's shared condition into Cardmarket's minimum-condition code", () => {
    const excellentItems = items.map((item) => ({
      ...item,
      preferences: { minimumCondition: "excellent" as const },
    }));
    render(
      <MissingCardsPanel
        {...props()}
        items={excellentItems}
        cardmarketEnabled
        cardmarketDecklistIdentities={{
          "basep-1": "Pikachu Static Growl Thundershock",
          "base1-44": "Bulbasaur Leech Seed",
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cardmarket" }));

    expect(screen.getByText("Sehr gut")).toBeInTheDocument();
    expect(screen.getByText("≥ EX · Excellent")).toBeInTheDocument();
    expect(screen.getByText(/Massenveränderung.*Mindestzustand/)).toHaveTextContent("Mindestzustand auf ≥ EX setzen");
    expect(screen.getByText("Zustand einmal korrigieren")).toBeInTheDocument();
    expect(screen.getByText(/mindestens EX/)).toBeInTheDocument();
  });

  it("keeps Cardmarket exceptions open while prepared details stay collapsed", () => {
    const unresolvedItem: MissingItem = {
      ...items[0],
      identityKey: "unresolved-pikachu",
      variant: { ...items[0].variant, finish: "unspecified" },
    };
    render(<MissingCardsPanel {...props()} items={[unresolvedItem]} cardmarketEnabled />);

    fireEvent.click(screen.getByRole("button", { name: "Cardmarket" }));

    fireEvent.click(screen.getByText("Importliste ansehen oder als Datei speichern"));
    expect(screen.getByText("1 Karte fehlt im Importtext")).toBeInTheDocument();
    expect(screen.getByText("Vor dem Import prüfen")).toBeInTheDocument();
    expect(screen.getByText(/Variantenangaben prüfen/)).toBeInTheDocument();
  });

  it("shows only the marketplace selected by the user", () => {
    render(<MissingCardsPanel {...props()} tcgplayerEnabled tcgplayerCardMappings={tcgplayerCardMappings} cardmarketEnabled />);

    expect(screen.queryByRole("heading", { name: "TCGplayer Mass Entry" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Komplette Liste zu Cardmarket" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "TCGplayer" }));
    expect(screen.getByRole("heading", { name: "TCGplayer Mass Entry" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Komplette Liste zu Cardmarket" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cardmarket" }));
    expect(screen.queryByRole("heading", { name: "TCGplayer Mass Entry" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Komplette Liste zu Cardmarket" })).toBeInTheDocument();
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
