import { fireEvent, render, screen, cleanup, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MissingCardsPanel } from "@/components/foundation/MissingCardsPanel";
import { cardtraderCardmarketMappings } from "@/data/marketplace/cardtrader-cardmarket-products";
import { prepareCardtraderHandoff } from "@/data/marketplace/cardtrader-handoff";
import type { MarketplaceProductIdentityMapping } from "@/domain/marketplace-product-identity";
import type { TcgplayerCardMapping } from "@/domain/tcgplayer-export";
import type { MissingItem } from "@/domain/types";

vi.mock("@/data/marketplace/cardtrader-cardmarket-products", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/data/marketplace/cardtrader-cardmarket-products")>();
  return { ...actual, cardtraderCardmarketMappings: vi.fn(actual.cardtraderCardmarketMappings) };
});

vi.mock("@/data/marketplace/cardtrader-handoff", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/data/marketplace/cardtrader-handoff")>();
  return { ...actual, prepareCardtraderHandoff: vi.fn(actual.prepareCardtraderHandoff) };
});

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

    expect(screen.getByRole("heading", { name: "3 Karten gemeinsam kaufen" })).toBeInTheDocument();
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

    fireEvent.click(screen.getByText("Zustand: Sehr gut"));
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

    fireEvent.click(screen.getByRole("button", { name: "Andere Region · Versand prüfen" }));
    fireEvent.click(screen.getByRole("button", { name: "TCGplayer" }));
    expect(screen.getByRole("heading", { name: "TCGplayer Mass Entry" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "TCGplayer Mass-Entry-Vorschau" })).toHaveValue("1 Bulbasaur [BS] 044/102");
    expect(screen.getByText(/2× Pikachu · Wizards Black Star Promos · 001/)).toBeInTheDocument();
    expect(screen.getByText(/Kandidat: Für diese Karte wurde im aktuellen TCGplayer-Katalog/)).toBeInTheDocument();
    expect(screen.getByText("1 Karte braucht deine Aufmerksamkeit")).toBeInTheDocument();
    expect(screen.getByText("Vor der Übergabe prüfen")).toBeInTheDocument();
    expect(screen.getByText(/bleiben in deiner Fehlkartenliste/)).toBeInTheDocument();
    expect(screen.getByText("Schritt 1 von 4")).toBeInTheDocument();
    const handoffLink = screen.getByRole("link", { name: /1 Karte kopieren & TCGplayer öffnen/ });
    expect(handoffLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(new URL(handoffLink.getAttribute("href") ?? "").searchParams.get("c")).toBe("1 Bulbasaur [BS] 044/102");
    expect(screen.getByText(/Printing: Unlimited · Zustand: alle Zustände einschließlich Damaged/)).toBeInTheDocument();
    expect(screen.getByText("Bereits vorbereitete Karten anzeigen (1)").closest("details")).not.toHaveAttribute("open");
    expect(screen.getByText("Alle fehlenden Karten als Liste (2)").closest("details")).not.toHaveAttribute("open");

    fireEvent.click(handoffLink);
    expect(onTcgplayerCopy).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("heading", { name: "Karten in Mass Entry laden" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Karten sind geladen/ }));
    expect(screen.getByRole("heading", { name: "Printing und Zustand einstellen" })).toBeInTheDocument();
    expect(screen.getByText("Unlimited · 1 Karte")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Filter sind eingestellt/ }));
    expect(screen.getByRole("heading", { name: "Ergebnis prüfen und in den Warenkorb legen" })).toBeInTheDocument();
    expect(screen.getByText("Schritt 4 von 4")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "TCGplayer kopieren" }));
    fireEvent.click(screen.getByRole("button", { name: "TCGplayer TXT" }));

    expect(onTcgplayerCopy).toHaveBeenCalledTimes(2);
    expect(onTcgplayerCopy).toHaveBeenLastCalledWith(expect.objectContaining({ text: "1 Bulbasaur [BS] 044/102", verifiedCount: 1 }));
    expect(onTcgplayerTextExport).toHaveBeenCalledWith(expect.objectContaining({ text: "1 Bulbasaur [BS] 044/102", reviewRequiredCount: 1 }));
  });

  it("recommends a marketplace from a user-selected region without location access", () => {
    const onCardmarketPrepare = vi.fn();
    render(
      <MissingCardsPanel
        {...props()}
        tcgplayerEnabled
        tcgplayerCardMappings={tcgplayerCardMappings}
        cardmarketEnabled
        cardmarketDecklistIdentities={{
          "basep-1": "Pikachu Static Growl Thundershock",
          "base1-44": "Bulbasaur Leech Seed",
        }}
        onCardmarketPrepare={onCardmarketPrepare}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Europa & UK · Cardmarket empfohlen" }));
    expect(screen.getByRole("button", { name: "Cardmarket" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Für Europa und UK ist Cardmarket normalerweise der einfachste Start.")).toBeInTheDocument();
    expect(onCardmarketPrepare).toHaveBeenCalledWith(items);

    fireEvent.click(screen.getByRole("button", { name: "USA & Kanada · TCGplayer empfohlen" }));
    expect(screen.getByRole("button", { name: "TCGplayer" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Für USA und Kanada ist TCGplayer normalerweise der einfachste Start.")).toBeInTheDocument();
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

    fireEvent.click(screen.getByRole("button", { name: "Europa & UK · Cardmarket empfohlen" }));
    expect(onCardmarketPrepare).toHaveBeenCalledWith(items);
    expect(screen.getByRole("heading", { name: "2 Karten gemeinsam übertragen" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cardmarket-Anleitung" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Liste kopieren und Cardmarket öffnen" })).toBeInTheDocument();
    expect(screen.getByText("Schritt 1 von 4")).toBeInTheDocument();
    const bulkHandoff = screen.getByRole("link", { name: "2 Karten kopieren & Cardmarket öffnen" });
    expect(bulkHandoff).toHaveAttribute("href", "https://www.cardmarket.com/de/Pokemon/Wants");
    expect(bulkHandoff).toHaveAttribute("rel", "noopener noreferrer");
    fireEvent.click(bulkHandoff);
    expect(onCardmarketCopy).toHaveBeenCalledWith(expect.objectContaining({ index: 1, positionCount: 2 }));
    expect(screen.getByRole("heading", { name: "Kopierte Karten bei Cardmarket einfügen" })).toBeInTheDocument();
    expect(screen.getByText("Schritt 2 von 4")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Karten sind eingefügt/ }));
    expect(screen.getByRole("heading", { name: "Mindestzustand für alle Karten einstellen" })).toBeInTheDocument();
    expect(screen.getByText(/Die Karten haben unterschiedliche Zustandswünsche/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Zustand ist eingestellt/ }));
    expect(screen.getByRole("heading", { name: "Ergebnis prüfen und gemeinsam kaufen" })).toBeInTheDocument();
    expect(screen.getByText("Schritt 4 von 4")).toBeInTheDocument();

    const fallback = screen.getByText("Falls etwas nicht klappt").closest("details");
    expect(fallback).not.toHaveAttribute("open");
    fireEvent.click(screen.getByText("Falls etwas nicht klappt"));
    expect(screen.getByRole("heading", { name: "Einzelne Karten suchen (2)" })).toBeInTheDocument();
    expect(screen.getByText("Direkte Produktseiten")).toBeInTheDocument();
    expect(screen.getByText("Vorausgefüllte Suchlinks")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Produktseite öffnen/ })).toHaveAttribute("href", "https://www.cardmarket.com/en/Pokemon/Cards/Pikachu");
    const searchLinks = screen.getAllByRole("link", { name: /Karte suchen/ });
    expect(searchLinks).toHaveLength(1);
    expect(new URL(searchLinks[0].getAttribute("href") ?? "").searchParams.get("searchString")).toBe("Bulbasaur Base Set 044");
    expect(screen.getByRole("heading", { name: "Importliste kopieren oder als Datei speichern" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Cardmarket-Decklistenvorschau" })).toHaveValue(
      "2x Pikachu Static Growl Thundershock\n1x Bulbasaur Leech Seed",
    );
    expect(screen.getByRole("link", { name: "Cardmarket-Hilfe" })).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByRole("link", { name: "Cardmarket-Kartenübersicht öffnen" })).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText("Alle Karten sind für den Decklistenimport vorbereitet")).toBeInTheDocument();
    expect(screen.getByText("Alle fehlenden Karten als Liste (2)").closest("details")).not.toHaveAttribute("open");

    fireEvent.click(screen.getByRole("button", { name: "Deckliste kopieren" }));
    fireEvent.click(screen.getByRole("button", { name: "Deckliste TXT" }));

    expect(onCardmarketCopy).toHaveBeenCalledTimes(2);
    expect(onCardmarketTextExport).toHaveBeenCalledWith(expect.objectContaining({ index: 1, positionCount: 2 }));
  });

  it("translates Your Card Binder's shared condition into Cardmarket's minimum-condition code", () => {
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

    fireEvent.click(screen.getByRole("button", { name: "Europa & UK · Cardmarket empfohlen" }));

    fireEvent.click(screen.getByRole("link", { name: "2 Karten kopieren & Cardmarket öffnen" }));
    fireEvent.click(screen.getByRole("button", { name: /Karten sind eingefügt/ }));

    expect(screen.getByText("Sehr gut")).toBeInTheDocument();
    expect(screen.getByText("≥ EX · Excellent")).toBeInTheDocument();
    expect(screen.getByText("„Massenveränderung“ öffnen")).toBeInTheDocument();
    expect(screen.getByText("≥ EX", { exact: true }).parentElement).toHaveTextContent("Mindestzustand ≥ EX wählen");
  });

  it("keeps Cardmarket exceptions open while prepared details stay collapsed", () => {
    const unresolvedItem: MissingItem = {
      ...items[0],
      identityKey: "unresolved-pikachu",
      variant: { ...items[0].variant, finish: "unspecified" },
    };
    render(<MissingCardsPanel {...props()} items={[unresolvedItem]} cardmarketEnabled />);

    fireEvent.click(screen.getByRole("button", { name: "Europa & UK · Cardmarket empfohlen" }));

    fireEvent.click(screen.getByText("Falls etwas nicht klappt"));
    expect(screen.getByText("1 Karte fehlt im Importtext")).toBeInTheDocument();
    expect(screen.getByText("Vor dem Import prüfen")).toBeInTheDocument();
    expect(screen.getByText(/Variantenangaben prüfen/)).toBeInTheDocument();
  });

  it("shows only the marketplace selected by the user", () => {
    render(<MissingCardsPanel {...props()} tcgplayerEnabled tcgplayerCardMappings={tcgplayerCardMappings} cardmarketEnabled />);

    expect(screen.queryByRole("heading", { name: "TCGplayer Mass Entry" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Karten gemeinsam übertragen/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Andere Region · Versand prüfen" }));
    fireEvent.click(screen.getByRole("button", { name: "TCGplayer" }));
    expect(screen.getByRole("heading", { name: "TCGplayer Mass Entry" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Karten gemeinsam übertragen/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cardmarket" }));
    expect(screen.queryByRole("heading", { name: "TCGplayer Mass Entry" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "2 Karten gemeinsam übertragen" })).toBeInTheDocument();
  });

  it("keeps CardTrader progressive and shows one clear, non-purchase preview", () => {
    render(<MissingCardsPanel {...props()} />);

    expect(screen.queryByRole("button", { name: "CardTrader" })).not.toBeInTheDocument();
    cleanup();

    render(<MissingCardsPanel {...props()} cardtraderPreviewVisible cardtraderStatus="not-approved" />);
    fireEvent.click(screen.getByRole("button", { name: "Andere Region · Versand prüfen" }));
    fireEvent.click(screen.getByRole("button", { name: "CardTrader · Vorschau" }));
    expect(screen.getByRole("heading", { name: "CardTrader" })).toBeInTheDocument();
    expect(screen.getAllByRole("status").some((status) => status.textContent?.includes("noch nicht freigegeben"))).toBe(true);
    expect(screen.getByText("Preis unbekannt")).toBeInTheDocument();
    expect(screen.getByText("Versand & Steuer")).toBeInTheDocument();
    expect(screen.getByText("1× Bulbasaur")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Wishlist erstellen" })).toBeDisabled();
    expect(screen.getAllByText("Noch nicht freigegeben")).toHaveLength(2);
  });

  it("offers a direct Cardmarket product page for cards whose CardTrader product id is known", async () => {
    vi.mocked(cardtraderCardmarketMappings).mockResolvedValue([{
      schemaVersion: 1,
      provider: "cardmarket",
      tcgdexCardId: "base1-44",
      cardName: "Bulbasaur",
      scope: { language: "any", finish: "any", edition: "any", printing: "any" },
      status: "verified",
      providerProductId: "273700",
      productUrl: "https://www.cardmarket.com/en/Pokemon/Products?idProduct=273700",
      source: { kind: "provider-external-id", label: "Cardmarket-Produkt-ID laut CardTrader-Blueprint 111152" },
      checkedAt: "2026-10-21T10:00:00.000Z",
      verifiedAt: "2026-10-21T10:00:00.000Z",
    }]);
    render(
      <MissingCardsPanel
        {...props()}
        cardmarketEnabled
        cardmarketProductMappings={cardmarketProductMappings}
        cardmarketDecklistIdentities={{ "basep-1": "Pikachu Static Growl Thundershock", "base1-44": "Bulbasaur Leech Seed" }}
        onCardmarketPrepare={vi.fn()}
        onCardmarketCopy={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Europa & UK · Cardmarket empfohlen" }));
    fireEvent.click(screen.getByRole("link", { name: "2 Karten kopieren & Cardmarket öffnen" }));
    fireEvent.click(screen.getByRole("button", { name: /Karten sind eingefügt/ }));
    fireEvent.click(screen.getByRole("button", { name: /Zustand ist eingestellt/ }));
    fireEvent.click(screen.getByText("Falls etwas nicht klappt"));

    await waitFor(() => expect(screen.getAllByRole("link", { name: /Produktseite öffnen/ })).toHaveLength(2));
    const links = screen.getAllByRole("link", { name: /Produktseite öffnen/ });
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "https://www.cardmarket.com/en/Pokemon/Cards/Pikachu",
      "https://www.cardmarket.com/en/Pokemon/Products?idProduct=273700",
    ]);
    expect(screen.getByText(/ID laut CardTrader/)).toBeInTheDocument();
    expect(screen.getByText(/Die Produkt-IDs stammen von CardTrader/)).toBeInTheDocument();
    expect(screen.queryByText("Vorausgefüllte Suchlinks")).not.toBeInTheDocument();
    expect(vi.mocked(cardtraderCardmarketMappings)).toHaveBeenCalledWith(expect.any(Array), { alreadyMapped: new Set(["basep-1"]) });
  });

  describe("CardTrader as a marketplace", () => {
    const handoff = {
      entries: [
        { identityKey: "pikachu", blueprintId: 111, url: "https://www.cardtrader.com/en/cards/111?share_code=yourcardbinder", unitPriceMinor: 250, offerCount: 12, offersAtLeast: true, sellerCountries: ["DE", "IT"] },
        { identityKey: "bulbasaur" },
      ],
      linkedCount: 1,
      pricedCount: 1,
      pricedTotalMinor: 500,
      pricedQuantity: 2,
    };

    function openCardTrader(extra: Record<string, unknown> = {}) {
      render(<MissingCardsPanel {...props()} cardmarketEnabled cardtraderEnabled {...extra} />);
      fireEvent.click(screen.getByRole("button", { name: "Andere Region · Versand prüfen" }));
      fireEvent.click(screen.getByRole("button", { name: "CardTrader" }));
    }

    it("lists CardTrader next to Cardmarket from the start, without an extra click", () => {
      render(<MissingCardsPanel {...props()} cardmarketEnabled cardtraderEnabled />);

      const choices = screen.getByRole("group", { name: "Marketplace auswählen" });
      expect(within(choices).getByRole("button", { name: "Cardmarket" })).toBeInTheDocument();
      expect(within(choices).getByRole("button", { name: "CardTrader" })).toHaveAttribute("aria-pressed", "false");
      expect(screen.queryByRole("button", { name: "Anderen Anbieter wählen" })).not.toBeInTheDocument();
    });

    it("shows the list with a page per matched card, a price hint and the referral notice", async () => {
      vi.mocked(prepareCardtraderHandoff).mockResolvedValue(handoff);
      openCardTrader();

      expect(screen.getByRole("heading", { name: "3 Karten bei CardTrader kaufen" })).toBeInTheDocument();
      expect(screen.getByText(/Werbelink: Your Card Binder kann bei einem Kauf eine Provision erhalten/)).toBeInTheDocument();

      expect(await screen.findByRole("link", { name: "Bei CardTrader ansehen: Pikachu" })).toHaveAttribute("href", "https://www.cardtrader.com/en/cards/111?share_code=yourcardbinder");
      expect(screen.getByText("Keine sichere Zuordnung")).toBeInTheDocument();
      expect(screen.getByText("1 von 2 zugeordnet")).toBeInTheDocument();
      expect(screen.getByText("mind. 12 Angebote · Verkäufer aus DE, IT")).toBeInTheDocument();
      expect(screen.getByText(/Richtwert: ab ca\./)).toHaveTextContent("2 von 3 Karten");
      expect(screen.getByText(/ohne Versand/)).toBeInTheDocument();
    });

    it("guides through four steps and ends at the Shop Optimizer without a token", async () => {
      vi.mocked(prepareCardtraderHandoff).mockResolvedValue(handoff);
      openCardTrader();
      expect(screen.getByText("Schritt 1 von 4")).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: /Shop Optimizer öffnen/ })).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /^Weiter/ }));
      expect(screen.getByRole("heading", { name: "Karten bei CardTrader hinzufügen" })).toBeInTheDocument();
      expect(screen.queryByLabelText("CardTrader-Token")).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /^Weiter/ }));

      const optimizer = screen.getByRole("link", { name: /Shop Optimizer öffnen/ });
      expect(optimizer).toHaveAttribute("href", "https://www.cardtrader.com/en/wishlists/new?share_code=yourcardbinder");
      expect(optimizer).toHaveAttribute("rel", "noopener noreferrer");
      fireEvent.click(screen.getByRole("button", { name: /Ich bin im Shop Optimizer fertig/ }));
      expect(screen.getByRole("heading", { name: "Ergebnis prüfen und bei CardTrader bezahlen" })).toBeInTheDocument();
      expect(screen.getByText("Schritt 4 von 4")).toBeInTheDocument();
    });

    describe("wishlist with the user's own token", () => {
      const token = "eyJhbGciOiJIUzI1NiJ9.test-token-value-0123456789";
      afterEach(() => { vi.unstubAllGlobals(); });

      async function openWishlistStep() {
        vi.mocked(prepareCardtraderHandoff).mockResolvedValue(handoff);
        openCardTrader({ cardtraderWishlistEnabled: true });
        await screen.findByRole("link", { name: "Bei CardTrader ansehen: Pikachu" });
        fireEvent.click(screen.getByRole("button", { name: /^Weiter/ }));
      }

      it("states what is sent, sends nothing before the click and clears the token afterwards", async () => {
        const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: 9 }), { status: 200 }));
        vi.stubGlobal("fetch", fetchMock);
        await openWishlistStep();

        expect(screen.getByText(/private/)).toBeInTheDocument();
        expect(screen.getByText(/Es wird nichts gekauft und nichts in einen Warenkorb gelegt/)).toBeInTheDocument();
        const button = screen.getByRole("button", { name: "Wunschliste mit 2 Karten anlegen" });
        expect(button).toBeDisabled();
        fireEvent.change(screen.getByLabelText("CardTrader-Token"), { target: { value: token } });
        expect(fetchMock).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole("button", { name: "Wunschliste mit 2 Karten anlegen" }));
        await waitFor(() => expect(screen.getByRole("heading", { name: "Shop Optimizer öffnen und Verkäufer wählen" })).toBeInTheDocument());
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
        expect(url).toBe("https://api.cardtrader.com/api/v2/wishlists");
        expect(JSON.parse(String(init.body)).deck.deck_items_attributes).toEqual([{ blueprint_id: 111, language: "en", quantity: 2 }]);
        expect(screen.getByText(/liegt jetzt in deinem CardTrader-Konto/)).toBeInTheDocument();
        expect(document.body.innerHTML).not.toContain(token);
        fireEvent.click(screen.getByRole("button", { name: /Zurück/ }));
        expect((screen.getByLabelText("CardTrader-Token") as HTMLInputElement).value).toBe("");
      });

      it("shows a clear error for a rejected token and lets the user continue without a wishlist", async () => {
        vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 401 })));
        await openWishlistStep();
        fireEvent.change(screen.getByLabelText("CardTrader-Token"), { target: { value: token } });
        fireEvent.click(screen.getByRole("button", { name: "Wunschliste mit 2 Karten anlegen" }));
        expect(await screen.findByRole("alert")).toHaveTextContent("CardTrader hat das Token abgelehnt");
        fireEvent.click(screen.getByRole("button", { name: /^Weiter/ }));
        expect(screen.getByRole("heading", { name: "Shop Optimizer öffnen und Verkäufer wählen" })).toBeInTheDocument();
        expect(screen.queryByText(/liegt jetzt in deinem CardTrader-Konto/)).not.toBeInTheDocument();
      });
    });

    it("keeps the price hint out when no card has a price", async () => {
      vi.mocked(prepareCardtraderHandoff).mockResolvedValue({ entries: [{ identityKey: "pikachu" }, { identityKey: "bulbasaur" }], linkedCount: 0, pricedCount: 0, pricedTotalMinor: 0, pricedQuantity: 0 });
      openCardTrader();
      expect(await screen.findAllByText("Keine sichere Zuordnung")).toHaveLength(2);
      expect(screen.queryByText(/Richtwert/)).not.toBeInTheDocument();
    });

    it("compares the two providers without naming a winner or quoting end prices", () => {
      vi.mocked(prepareCardtraderHandoff).mockResolvedValue(handoff);
      render(<MissingCardsPanel {...props()} cardmarketEnabled cardtraderEnabled />);
      fireEvent.click(screen.getByRole("button", { name: "Andere Region · Versand prüfen" }));
      const comparison = screen.getByLabelText("Cardmarket und CardTrader im Vergleich");
      expect(comparison).toHaveTextContent("Shopping Wizard");
      expect(comparison).toHaveTextContent("Shop Optimizer");
      expect(comparison).toHaveTextContent("hängt vom Versand und von den Verkäufern ab");
      expect(comparison.textContent).not.toMatch(/€/);
    });
  });
});

