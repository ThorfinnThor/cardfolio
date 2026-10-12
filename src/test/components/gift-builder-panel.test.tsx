import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GiftBuilderPanel } from "@/components/foundation/GiftBuilderPanel";
import { createGiftProject, type GiftCardCandidate } from "@/domain/gift-builder";
import type { CardSnapshot, CatalogSearchItem, VariantSelection } from "@/domain/types";

const availableStandardPartner = {
  schemaVersion: 1,
  enabled: true,
  reviewedAt: "2026-10-12",
  partners: [{
    id: "standard-binder",
    displayName: "9-Pocket Test-Binder",
    kind: "standard",
    enabled: true,
    verifiedAt: "2026-10-12",
    reviewAfter: "2026-10-31",
    destinationUrl: "https://partner.example/9-pocket-binder",
    affiliate: { enabled: false },
    capabilities: { personalization: false, photoUpload: false },
    capacityCards: 360,
    pocketsPerPage: 9,
    price: { amountMinor: 2699, currency: "EUR", qualifier: "from", sourceUpdatedAt: "2026-10-12" },
    evidenceUrls: ["https://example.com/terms"],
  }],
};

afterEach(() => cleanup());

function candidate(index: number): GiftCardCandidate {
  const id = `gift-ui-${index}`;
  const card: CardSnapshot = {
    key: `tcgdex:${id}:en`,
    ref: { provider: "tcgdex", id, language: "en" },
    name: `Pikachu ${index}`,
    setId: `set-${index}`,
    setName: `Set ${index}`,
    collectorNumber: String(index),
    physicalStatus: "physical",
    availableVariants: { normal: false, holo: true, reverse: false, firstEdition: false, shadowless: false },
    fetchedAt: "2026-10-01T10:00:00.000Z",
  };
  return {
    card,
    variant: { finish: "holo", edition: "unlimited", printing: "shadowed" },
    preferences: { minimumCondition: "excellent" },
    price: { currency: "EUR", fetchedAt: card.fetchedAt, confidence: "unknown", issues: ["fixture"] },
    reasonTags: [],
  };
}

function candidateWithArtwork(index: number): GiftCardCandidate {
  const value = candidate(index);
  return {
    ...value,
    card: {
      ...value.card,
      imageBaseUrl: `https://assets.tcgdex.net/en/set/gift-ui-${index}`,
    },
  };
}

describe("GiftBuilderPanel", () => {
  it("walks through the reference flow with unknown-price disclosure and creates a normal binder", async () => {
    const briefs: CatalogSearchItem[] = Array.from({ length: 9 }, (_, index) => ({
      ref: { provider: "tcgdex", id: `gift-ui-${index + 1}`, language: "en" },
      name: `Pikachu ${index + 1}`,
      collectorNumber: String(index + 1),
    }));
    const loader = {
      loadCandidatePool: vi.fn(async () => briefs),
      hydrateCandidates: vi.fn(async () => Array.from({ length: 9 }, (_, index) => candidateWithArtwork(index + 1))),
    };
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => availableStandardPartner })));
    const onCreateBinder = vi.fn(async (_selection, preferences) => createGiftProject("Geschenk · Pikachu", preferences));
    const onCardsPurchase = vi.fn();
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
    const open = vi.spyOn(window, "open").mockImplementation(() => window);
    render(<GiftBuilderPanel loader={loader} pricingEnabled={false} onCancel={vi.fn()} onCreateBinder={onCreateBinder} onOpenBinder={vi.fn()} onCardsPurchase={onCardsPurchase} />);

    expect(screen.getByRole("combobox", { name: /Kartensprache/i })).toHaveValue("de");
    fireEvent.change(screen.getByRole("combobox", { name: /Kartensprache/i }), { target: { value: "en" } });
    expect(screen.getByText(/Unsere Empfehlung für Geschenke/)).toBeInTheDocument();
    expect(screen.getByText("Was bedeutet der Kartenzustand?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Binder-Seite ansehen/i }));
    expect(await screen.findAllByText("9 / 9")).not.toHaveLength(0);
    expect(screen.getAllByRole("status").some((status) => status.textContent?.includes("Preisprüfung"))).toBe(true);
    expect(screen.getByText("9 von 9 Karten sind vollständig vorbereitet. Sonderfälle kannst du direkt an der Karte ändern.")).toBeInTheDocument();
    const orderCondition = screen.getByRole("combobox", { name: "Zustand für alle" });
    expect(orderCondition).toHaveValue("excellent");
    fireEvent.change(orderCondition, { target: { value: "near-mint" } });
    expect(screen.getAllByText(/Wie neu/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /Auswahl prüfen/i }));
    await screen.findByRole("heading", { name: /Vorschlag ist bereit/i });
    fireEvent.click(screen.getByRole("button", { name: /Als Binder anlegen/i }));
    await waitFor(() => expect(onCreateBinder).toHaveBeenCalledTimes(1));
    expect(onCreateBinder).toHaveBeenCalledWith(
      expect.objectContaining({ selected: expect.arrayContaining([expect.any(Object)]) }),
      expect.objectContaining({ subjectQuery: "Pikachu", targetCardCount: 9 }),
    );
    await screen.findByRole("heading", { name: "Geschenk · Pikachu" });
    expect(screen.getAllByRole("img", { name: /Pikachu 1, Set 1 1/i }).length).toBeGreaterThan(0);
    expect(screen.getByText("Keine Budgetzusage")).toBeInTheDocument();
    expect(await screen.findByText("9-Pocket Test-Binder")).toBeInTheDocument();
    expect(screen.getByText(/9-Pocket · Platz für bis zu 360 Karten/i)).toBeInTheDocument();
    expect(screen.getByText(/kein Affiliate-Link/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Diesen Binder bestellen/i }));
    expect(open).toHaveBeenCalledWith("https://partner.example/9-pocket-binder", "_blank", "noopener,noreferrer");
    fireEvent.change(screen.getByLabelText(/Grußtext für die lokale Druckansicht/i), { target: { value: "Viel Freude!" } });
    expect(screen.getByText("Viel Freude!", { selector: "blockquote" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Drucken \/ als PDF speichern/i }));
    expect(print).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Karten besorgen" }));
    expect(onCardsPurchase).toHaveBeenCalledOnce();
  });

  it("shows artwork in the complete result list and explains why adding is unavailable at the target count", async () => {
    const briefs: CatalogSearchItem[] = Array.from({ length: 10 }, (_, index) => ({
      ref: { provider: "tcgdex", id: `gift-ui-${index + 1}`, language: "en" },
      name: `Pikachu ${index + 1}`,
      collectorNumber: String(index + 1),
      setName: `Set ${index + 1}`,
    }));
    const loader = {
      loadCandidatePool: vi.fn(async () => briefs),
      hydrateCandidates: vi.fn(async () => [
        ...Array.from({ length: 9 }, (_, index) => candidateWithArtwork(index + 1)),
        candidate(10),
      ]),
    };
    render(<GiftBuilderPanel loader={loader} pricingEnabled={false} onCancel={vi.fn()} onCreateBinder={vi.fn()} onOpenBinder={vi.fn()} onCardsPurchase={vi.fn()} />);

    fireEvent.change(screen.getByRole("combobox", { name: /Kartensprache/i }), { target: { value: "en" } });
    fireEvent.click(screen.getByRole("button", { name: /Binder-Seite ansehen/i }));
    await screen.findByText("9 / 9");
    expect(screen.getAllByText("Preisprüfung aus").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /Alle passenden Karten ansehen/i }));
    expect(screen.getAllByRole("status").some((status) => status.textContent?.includes("Entferne zuerst oben eine Karte"))).toBe(true);
    expect(screen.getAllByRole("img", { name: /Pikachu 1, Set 1 1/i }).length).toBeGreaterThan(0);

    const unavailableRow = screen.getByText("Pikachu 10").closest("li");
    expect(unavailableRow).not.toBeNull();
    expect(within(unavailableRow as HTMLLIElement).getByRole("button", { name: "Zuerst Karte entfernen" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Pikachu 1 entfernen" }));
    fireEvent.click(within(unavailableRow as HTMLLIElement).getByRole("button", { name: "Hinzufügen" }));
    expect(screen.getByText("9 / 9")).toBeInTheDocument();
  });

  it("lets beginners accept unverified finish recommendations together instead of checking every card", async () => {
    const briefs: CatalogSearchItem[] = Array.from({ length: 9 }, (_, index) => ({
      ref: { provider: "tcgdex", id: `gift-ui-${index + 1}`, language: "en" },
      name: `Pikachu ${index + 1}`,
      collectorNumber: String(index + 1),
    }));
    const loader = {
      loadCandidatePool: vi.fn(async () => briefs),
      hydrateCandidates: vi.fn(async (
        _items: readonly CatalogSearchItem[],
        options: { variantFor: (card: CardSnapshot) => VariantSelection },
      ) => Array.from({ length: 9 }, (_, index) => {
        const value = candidateWithArtwork(index + 1);
        const card = { ...value.card, availableVariants: undefined };
        return { ...value, card, variant: options.variantFor(card) };
      })),
    };
    render(<GiftBuilderPanel loader={loader} pricingEnabled={false} onCancel={vi.fn()} onCreateBinder={vi.fn()} onOpenBinder={vi.fn()} onCardsPurchase={vi.fn()} />);

    fireEvent.change(screen.getByRole("combobox", { name: /Kartensprache/i }), { target: { value: "en" } });
    fireEvent.click(screen.getByRole("button", { name: /Binder-Seite ansehen/i }));
    await screen.findByText("Für alle 9 Karten gibt es eine vorausgewählte Bestellvariante. Ein Klick übernimmt sie gemeinsam.");
    expect(screen.getByRole("heading", { name: "Empfehlungen für 9 Karten übernehmen" })).toBeInTheDocument();
    expect(screen.getByText(/musst Normal, Holo oder Reverse Holo nicht selbst erkennen/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Jetzt Ausführung prüfen/i })).not.toBeInTheDocument();
    expect(screen.getAllByText("Empfehlung vorbereitet")).toHaveLength(9);

    fireEvent.click(screen.getAllByRole("button", { name: "Alle Empfehlungen übernehmen" })[0]);
    expect(screen.getByText("Alle Karten sind bestellbereit. Du kannst jetzt zur Bestellprüfung weitergehen.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Auswahl prüfen" })).toBeEnabled();
  });

  it("builds a proposal from one of ten semantic artwork themes", async () => {
    const loader = {
      loadCandidatePool: vi.fn(async () => []),
      hydrateCandidates: vi.fn(async () => Array.from({ length: 9 }, (_, index) => candidateWithArtwork(index + 1))),
    };
    const smartSearch = {
      search: vi.fn(async () => Array.from({ length: 9 }, (_, index) => ({
        ref: { provider: "tcgdex" as const, id: `gift-ui-${index + 1}`, language: "en" as const },
        score: 100,
        reasonCode: "semantic" as const,
      }))),
    };

    render(<GiftBuilderPanel initialDiscoveryMode="theme" loader={loader} smartSearch={smartSearch} pricingEnabled={false} onCancel={vi.fn()} onCreateBinder={vi.fn()} onOpenBinder={vi.fn()} onCardsPurchase={vi.fn()} />);

    expect(screen.getAllByRole("radio", { name: /Ein Bildmotiv/i })).toHaveLength(1);
    expect(screen.getByRole("radio", { name: /Ein Bildmotiv/i })).toBeChecked();
    expect(screen.getAllByRole("radio", { name: /Meer & Wasser/i })).toHaveLength(1);
    fireEvent.click(screen.getByRole("radio", { name: /Meer & Wasser/i }));
    fireEvent.click(screen.getByRole("button", { name: /Binder-Seite ansehen/i }));

    await screen.findByText("9 / 9");
    expect(loader.loadCandidatePool).not.toHaveBeenCalled();
    expect(smartSearch.search).toHaveBeenCalledWith(expect.objectContaining({
      text: "Meer",
      language: "en",
      matchQuality: "dominant",
    }));
    expect(screen.getByText("Keine weitere passende Karte verfügbar")).toBeInTheDocument();
    expect(screen.getByText(/Alle 9 bestätigten Treffer für „Meer & Wasser“ sind bereits ausgewählt/)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Keine alternative Karte für/ })).toHaveLength(9);

    fireEvent.click(screen.getByRole("button", { name: "Pikachu 1 entfernen" }));
    expect(screen.getByRole("button", { name: "+ Karte hinzufügen" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /Alle passenden Karten ansehen/i }));
    expect(screen.getByText(/Artwork-Treffer zum Motiv „Meer & Wasser“/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Erneut hinzufügen" }));
    expect(screen.getByText("9 / 9")).toBeInTheDocument();
  });

  it("shows price estimates without claiming that the gift is under budget", async () => {
    const briefs: CatalogSearchItem[] = Array.from({ length: 9 }, (_, index) => ({
      ref: { provider: "tcgdex", id: `gift-ui-${index + 1}`, language: "en" },
      name: `Pikachu ${index + 1}`,
      collectorNumber: String(index + 1),
    }));
    const loader = {
      loadCandidatePool: vi.fn(async () => briefs),
      hydrateCandidates: vi.fn(async () => Array.from({ length: 9 }, (_, index) => ({
        ...candidateWithArtwork(index + 1),
        price: {
          source: "tcgdex-cardmarket" as const,
          currency: "EUR" as const,
          amountMinor: 100,
          range: { lowMinor: 80, highMinor: 120, lowMetric: "low", highMetric: "avg" },
          fetchedAt: "2026-10-01T10:00:00.000Z",
          sourceUpdatedAt: "2026-10-01T09:00:00.000Z",
          confidence: "usable" as const,
          issues: [],
        },
      }))),
    };
    render(<GiftBuilderPanel loader={loader} pricingEnabled budgetGuaranteeEnabled={false} onCancel={vi.fn()} onCreateBinder={vi.fn()} onOpenBinder={vi.fn()} onCardsPurchase={vi.fn()} />);

    fireEvent.change(screen.getByRole("combobox", { name: /Kartensprache/i }), { target: { value: "en" } });
    fireEvent.click(screen.getByRole("button", { name: /Binder-Seite ansehen/i }));
    expect(await screen.findAllByText("9 / 9")).not.toHaveLength(0);
    expect(screen.getAllByText((_, element) => element?.tagName === "B" && element.textContent?.includes("1,00") === true)).toHaveLength(9);
    expect(screen.getByText(/9,00/)).toBeInTheDocument();
    expect(screen.getAllByRole("status").some((status) => status.textContent?.includes("Preise sind Schätzungen ohne Versand und Steuern"))).toBe(true);
    expect(screen.queryByText(/Budget nicht vollständig berücksichtigen/i)).not.toBeInTheDocument();
  });

  it("uses approximate market estimates to keep a 50 euro proposal within budget", async () => {
    const briefs: CatalogSearchItem[] = Array.from({ length: 18 }, (_, index) => ({
      ref: { provider: "tcgdex", id: `gift-ui-${index + 1}`, language: "en" },
      name: `Pikachu ${index + 1}`,
      collectorNumber: String(index + 1),
    }));
    const loader = {
      loadCandidatePool: vi.fn(async () => briefs),
      hydrateCandidates: vi.fn(async () => Array.from({ length: 18 }, (_, index) => ({
        ...candidateWithArtwork(index + 1),
        price: {
          source: "tcgdex-cardmarket" as const,
          currency: "EUR" as const,
          amountMinor: index < 9 ? 400 : 4_000,
          range: { lowMinor: index < 9 ? 300 : 3_500, highMinor: index < 9 ? 500 : 4_500, lowMetric: "low", highMetric: "avg" },
          fetchedAt: "2026-10-01T10:00:00.000Z",
          sourceUpdatedAt: "2026-10-01T09:00:00.000Z",
          confidence: "usable" as const,
          issues: [],
        },
      }))),
    };
    render(<GiftBuilderPanel loader={loader} pricingEnabled budgetGuaranteeEnabled={false} onCancel={vi.fn()} onCreateBinder={vi.fn()} onOpenBinder={vi.fn()} onCardsPurchase={vi.fn()} />);

    fireEvent.change(screen.getByRole("combobox", { name: /Kartensprache/i }), { target: { value: "en" } });
    fireEvent.change(screen.getByRole("spinbutton", { name: /Budget für die Karten/i }), { target: { value: "50" } });
    fireEvent.click(screen.getByRole("button", { name: /Binder-Seite ansehen/i }));

    expect(await screen.findByText(/36,00/)).toBeInTheDocument();
    expect(screen.queryByText("Pikachu 10")).not.toBeInTheDocument();
    expect(screen.queryByText(/günstigste vollständige Auswahl liegt derzeit darüber/i)).not.toBeInTheDocument();
  });
});
