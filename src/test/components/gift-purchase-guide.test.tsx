import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MissingCardsPanel } from "@/components/foundation/MissingCardsPanel";
import type { MissingItem } from "@/domain/types";

afterEach(() => cleanup());

function item(id: string, name: string, quantity: number, minimumCondition: MissingItem["preferences"]["minimumCondition"]): MissingItem {
  return {
    identityKey: id,
    card: {
      key: `tcgdex:${id}:en`,
      ref: { provider: "tcgdex", id, language: "en" },
      name,
      setId: "base1",
      setName: "Base Set",
      collectorNumber: "001",
      category: "pokemon",
      abilities: [],
      attacks: ["Tackle"],
      physicalStatus: "physical",
      fetchedAt: "2026-09-27T00:00:00.000Z",
    },
    variant: { finish: "normal", edition: "unlimited", printing: "shadowed" },
    preferences: { minimumCondition },
    quantity,
    entryIds: [`00000000-0000-4000-8000-00000000000${quantity}`],
  };
}

const items = [item("base1-1", "Pikachu", 2, "excellent"), item("base1-2", "Evoli", 1, "excellent")];
const identities = { "base1-1": "Pikachu Tackle", "base1-2": "Eevee Tackle" };

function panel(overrides: Partial<React.ComponentProps<typeof MissingCardsPanel>> = {}) {
  return (
    <MissingCardsPanel
      items={items}
      warnings={[]}
      copyState="idle"
      onCopy={vi.fn()}
      onTextExport={vi.fn()}
      onCsvExport={vi.fn()}
      onClose={vi.fn()}
      onConditionsChange={vi.fn()}
      cardmarketEnabled
      tcgplayerEnabled
      cardmarketDecklistIdentities={identities}
      cardmarketProductMappings={[]}
      beginner
      {...overrides}
    />
  );
}

describe("gift purchase guide", () => {
  it("preselects Cardmarket for beginners instead of asking for a region, and prepares the list once", () => {
    const onCardmarketPrepare = vi.fn();
    const { rerender } = render(panel({ onCardmarketPrepare }));

    expect(screen.getByRole("heading", { name: "3 Karten bei Cardmarket kaufen" })).toBeInTheDocument();
    expect(screen.getByText("Du kaufst bei Cardmarket")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "So bekommst du die Karten" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Europa & UK · Cardmarket empfohlen" })).not.toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Schritte zum Kartenkauf" })).not.toBeInTheDocument();
    expect(screen.queryByText("Für Geschenke vorbereitet")).not.toBeInTheDocument();
    expect(screen.queryByText(/Vollständige Fehlkartenliste anzeigen/)).not.toBeInTheDocument();
    expect(screen.queryByText("Importliste ansehen oder als Datei speichern")).not.toBeInTheDocument();
    expect(onCardmarketPrepare).toHaveBeenCalledTimes(1);
    expect(onCardmarketPrepare).toHaveBeenCalledWith(items);

    rerender(panel({ onCardmarketPrepare: vi.fn() }));
    expect(onCardmarketPrepare).toHaveBeenCalledTimes(1);
  });

  it("says up front what a first-time buyer needs: an account, the shipping effect and that nothing is sold here", () => {
    render(panel());

    const prelude = screen.getByRole("complementary", { name: "Das solltest du vorab wissen" });
    expect(within(prelude).getByText(/Cardfolio verkauft nichts/)).toBeInTheDocument();
    expect(within(prelude).getByText("Cardmarket-Konto")).toBeInTheDocument();
    expect(within(prelude).getByText(/funktioniert nur, wenn du angemeldet bist/)).toBeInTheDocument();
    expect(within(prelude).getByText(/Jede Sendung kostet/)).toBeInTheDocument();
  });

  it("walks through four plain steps and states the Cardmarket rules a newcomer runs into", () => {
    const onCardmarketCopy = vi.fn();
    render(panel({ onCardmarketCopy }));

    expect(screen.getByText("Schritt 1 von 4")).toBeInTheDocument();
    const handoff = screen.getByRole("link", { name: "2 Karten kopieren & Cardmarket öffnen" });
    expect(handoff).toHaveAttribute("href", "https://www.cardmarket.com/de/Pokemon/Wants");
    expect(handoff).toHaveAttribute("rel", "noopener noreferrer");
    fireEvent.click(handoff);
    expect(onCardmarketCopy).toHaveBeenCalledWith(expect.objectContaining({ index: 1, positionCount: 2 }));

    expect(screen.getByRole("heading", { name: "Die Karten bei Cardmarket einfügen" })).toBeInTheDocument();
    expect(screen.getByText(/Melde dich bei Cardmarket an – oder lege dort ein Konto an/)).toBeInTheDocument();
    expect(screen.getByText(/Ein grünes Häkchen heißt: Karten hinzugefügt/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Karten sind eingefügt/ }));

    expect(screen.getByRole("heading", { name: "Nur gut erhaltene Karten zulassen" })).toBeInTheDocument();
    expect(screen.getByText("Sehr gut")).toBeInTheDocument();
    expect(screen.getByText("≥ EX · Excellent")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Zustand ist eingestellt/ }));

    expect(screen.getByText("Schritt 4 von 4")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Verkäufer finden und kaufen" })).toBeInTheDocument();
    expect(screen.getByText("„Run Wizard“")).toBeInTheDocument();
    expect(screen.getByText("„Reduce Shipments“")).toBeInTheDocument();
    expect(screen.getByText("sechs abgeschlossenen Käufen")).toBeInTheDocument();
    expect(screen.getByText(/Der Wizard durchsucht nicht alle Angebote/)).toBeInTheDocument();
    const help = screen.getByRole("link", { name: /Hilfe von Cardmarket zum Shopping Wizard/ });
    expect(help).toHaveAttribute("href", "https://help.cardmarket.com/en/ShoppingWizard");
    expect(help).toHaveAttribute("target", "_blank");
    expect(help).toHaveAttribute("rel", "noopener noreferrer");

    fireEvent.click(screen.getByRole("button", { name: /Zurück/ }));
    expect(screen.getByText("Schritt 3 von 4")).toBeInTheDocument();
  });

  it("shows a disabled, explained button while the card list is still being checked", () => {
    render(panel({ cardmarketPreparing: true }));

    expect(screen.queryByRole("link", { name: /kopieren & Cardmarket öffnen/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Kartenliste wird sicher geprüft …" })).toBeDisabled();
  });

  it("keeps the region and provider choice one click away", () => {
    render(panel());

    fireEvent.click(screen.getByRole("button", { name: "Anderer Wohnort oder Anbieter?" }));

    expect(screen.getByRole("button", { name: "Europa & UK · Cardmarket empfohlen" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "USA & Kanada · TCGplayer empfohlen" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Schritte zum Kartenkauf" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "So bekommst du die Karten" })).not.toBeInTheDocument();
  });

  it("falls back to the full provider choice when Cardmarket is not available", () => {
    render(panel({ cardmarketEnabled: false }));

    expect(screen.getByRole("button", { name: "Europa & UK · Cardmarket empfohlen" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "So bekommst du die Karten" })).not.toBeInTheDocument();
  });

  it("leaves the detailed collector view untouched", () => {
    render(panel({ beginner: false }));

    expect(screen.getByRole("heading", { name: "3 Karten gemeinsam kaufen" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Europa & UK · Cardmarket empfohlen" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "So bekommst du die Karten" })).not.toBeInTheDocument();
  });
});
