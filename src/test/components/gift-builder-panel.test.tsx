import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

beforeEach(() => window.sessionStorage.clear());
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
  it("prefills the Pokémon chosen from a homepage example", () => {
    const loader = { loadCandidatePool: vi.fn(), hydrateCandidates: vi.fn() };
    render(<GiftBuilderPanel loader={loader} initialSubjectQuery="Evoli" pricingEnabled={false} onCancel={vi.fn()} onCreateBinder={vi.fn()} onOpenBinder={vi.fn()} onCardsPurchase={vi.fn()} />);

    expect(screen.getByRole("textbox", { name: "Lieblings-Pokémon" })).toHaveValue("Evoli");
  });

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
    render(<GiftBuilderPanel loader={loader} pricingEnabled={false} onCancel={vi.fn()} onCreateBinder={onCreateBinder} onOpenBinder={vi.fn()} onCardsPurchase={onCardsPurchase} />);

    expect(screen.getByRole("combobox", { name: /Kartensprache/i })).toHaveValue("de");
    fireEvent.change(screen.getByRole("combobox", { name: /Kartensprache/i }), { target: { value: "en" } });
    expect(screen.queryByText("Für wen?")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Binder-Seite ansehen/i }));
    expect(await screen.findAllByText("9 / 9")).not.toHaveLength(0);
    expect(screen.getByText(/Unsere Empfehlung für Geschenke/)).toBeInTheDocument();
    expect(screen.getByText("Was bedeutet der Kartenzustand?")).toBeInTheDocument();
    expect(screen.getAllByRole("status").some((status) => status.textContent?.includes("Preisprüfung"))).toBe(true);
    expect(screen.getByRole("list", { name: "Schritte zum Geschenk-Binder" }).children).toHaveLength(3);
    expect(screen.queryByText(/Unlimited/)).not.toBeInTheDocument();
    expect(screen.queryByText(/TCGdex/)).not.toBeInTheDocument();
    const orderCondition = screen.getByRole("combobox", { name: "Zustand für alle" });
    expect(orderCondition).toHaveValue("excellent");
    fireEvent.change(orderCondition, { target: { value: "near-mint" } });
    expect(screen.getAllByText(/Wie neu/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Weiter zum Einkauf" }));
    await waitFor(() => expect(onCreateBinder).toHaveBeenCalledTimes(1));
    expect(onCreateBinder).toHaveBeenCalledWith(
      expect.objectContaining({ selected: expect.arrayContaining([expect.any(Object)]) }),
      expect.objectContaining({ subjectQuery: "Pikachu", targetCardCount: 9 }),
    );
    await screen.findByRole("heading", { name: "Geschenk · Pikachu" });
    expect(screen.getByRole("heading", { name: "Dein Geschenk-Binder ist fertig geplant" })).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: /Pikachu 1, Set 1 1/i }).length).toBeGreaterThan(0);
    expect(screen.getByText("Keine Budgetzusage")).toBeInTheDocument();
    expect(screen.queryByText(/Preissicherheit/)).not.toBeInTheDocument();
    expect(screen.queryByText("Kein bestätigter Preis")).not.toBeInTheDocument();
    expect(await screen.findByText("9-Pocket Test-Binder")).toBeInTheDocument();
    expect(screen.getByText(/9-Pocket · Platz für bis zu 360 Karten/i)).toBeInTheDocument();
    expect(screen.getByText("Alle passen zu deinem Plan")).toBeInTheDocument();
    expect(screen.queryByText(/kein Affiliate-Link/i)).not.toBeInTheDocument();
    const binderLink = screen.getByRole("link", { name: /Bei .+ bestellen/i });
    expect(binderLink).toHaveAttribute("href", "https://partner.example/9-pocket-binder");
    expect(binderLink).toHaveAttribute("target", "_blank");
    expect(binderLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.queryByLabelText(/Grußtext/i)).not.toBeInTheDocument();
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

    fireEvent.click(screen.getByRole("button", { name: "Pikachu 1, Set 1: Details ansehen" }));
    fireEvent.click(screen.getByRole("button", { name: "Pikachu 1 entfernen" }));
    fireEvent.click(within(unavailableRow as HTMLLIElement).getByRole("button", { name: "Hinzufügen" }));
    expect(screen.getByText("9 / 9")).toBeInTheDocument();
  });

  it("lets beginners accept unverified finish recommendations and continue with a single tap", async () => {
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
    const onCreateBinder = vi.fn(async (_selection, preferences) => createGiftProject("Geschenk · Pikachu", preferences));
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => availableStandardPartner })));
    render(<GiftBuilderPanel loader={loader} pricingEnabled={false} onCancel={vi.fn()} onCreateBinder={onCreateBinder} onOpenBinder={vi.fn()} onCardsPurchase={vi.fn()} />);

    fireEvent.change(screen.getByRole("combobox", { name: /Kartensprache/i }), { target: { value: "en" } });
    fireEvent.click(screen.getByRole("button", { name: /Binder-Seite ansehen/i }));
    await screen.findByText("9 / 9");
    // No per-card jargon and no second confirmation: the primary action is the only next step.
    expect(screen.queryByText("Vorausgewählt")).not.toBeInTheDocument();
    expect(screen.queryByText(/Non-Holo/)).not.toBeInTheDocument();
    expect(screen.queryByText("Prüfen")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Jetzt Ausführung prüfen/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Weiter zum Einkauf" }));
    expect(await screen.findByRole("heading", { name: "Dein Geschenk-Binder ist fertig geplant" })).toBeInTheDocument();
    expect(onCreateBinder).toHaveBeenCalledTimes(1);
  });

  it("opens a card in place with plain-language details and the confirmation status", async () => {
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
          amountMinor: 250,
          range: { lowMinor: 100, highMinor: 400, lowMetric: "low", highMetric: "avg" },
          fetchedAt: "2026-10-01T10:00:00.000Z",
          sourceUpdatedAt: "2026-10-01T09:00:00.000Z",
          confidence: "usable" as const,
          issues: [],
        },
      }))),
    };
    render(<GiftBuilderPanel loader={loader} pricingEnabled onCancel={vi.fn()} onCreateBinder={vi.fn()} onOpenBinder={vi.fn()} onCardsPurchase={vi.fn()} />);

    fireEvent.change(screen.getByRole("combobox", { name: /Kartensprache/i }), { target: { value: "en" } });
    fireEvent.click(screen.getByRole("button", { name: /Binder-Seite ansehen/i }));
    await screen.findByText("9 / 9");
    expect(screen.queryByRole("region", { name: /Details zu/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Pikachu 4, Set 4: Details ansehen" }));
    const details = screen.getByRole("region", { name: "Details zu Pikachu 4" });
    expect(within(details).getByText(/Bestellangaben vollständig · Zustand: Sehr gut/)).toBeInTheDocument();
    expect(within(details).getByText(/laut Cardmarket, Stand/)).toBeInTheDocument();
    expect(within(details).queryByText(/TCGdex/)).not.toBeInTheDocument();

    fireEvent.click(within(details).getByRole("button", { name: "Detailansicht schließen" }));
    expect(screen.queryByRole("region", { name: "Details zu Pikachu 4" })).not.toBeInTheDocument();
  });

  it("offers popular Pokémon for gift buyers who do not know the franchise and follows the card language", async () => {
    const loader = { loadCandidatePool: vi.fn(async () => []), hydrateCandidates: vi.fn() };
    render(<GiftBuilderPanel loader={loader} pricingEnabled={false} onCancel={vi.fn()} onCreateBinder={vi.fn()} onOpenBinder={vi.fn()} onCardsPurchase={vi.fn()} />);

    fireEvent.click(screen.getByRole("radio", { name: "Glurak" }));
    expect(screen.getByRole("textbox", { name: "Lieblings-Pokémon" })).toHaveValue("Glurak");
    fireEvent.change(screen.getByRole("combobox", { name: /Kartensprache/i }), { target: { value: "en" } });
    expect(screen.getByRole("textbox", { name: "Lieblings-Pokémon" })).toHaveValue("Charizard");

    fireEvent.click(screen.getByRole("radio", { name: "Ich kenne mich nicht aus" }));
    expect(screen.queryByRole("textbox", { name: "Lieblings-Pokémon" })).not.toBeInTheDocument();
    expect(screen.getByText(/Kein Problem/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "Eevee" }));
    fireEvent.click(screen.getByRole("button", { name: /Binder-Seite ansehen/i }));
    await waitFor(() => expect(loader.loadCandidatePool).toHaveBeenCalledWith(expect.objectContaining({ subjectQuery: "Eevee", language: "en" })));
  });

  it("asks only what changes the proposal and keeps the card language visible beside the Pokémon search", () => {
    const loader = { loadCandidatePool: vi.fn(), hydrateCandidates: vi.fn() };
    render(<GiftBuilderPanel loader={loader} pricingEnabled onCancel={vi.fn()} onCreateBinder={vi.fn()} onOpenBinder={vi.fn()} onCardsPurchase={vi.fn()} />);

    expect(screen.getByText("Die Karten kosten zusammen etwa so viel, aber nie mehr (ohne Versand).")).toBeInTheDocument();
    for (const gone of ["Weitere Wünsche für das Geschenk", "Für wen?", "Anlass", "Stil", "Budgettoleranz", "Währung"]) {
      expect(screen.queryByText(gone, { exact: false })).not.toBeInTheDocument();
    }
    const language = screen.getByRole("combobox", { name: /Kartensprache/i });
    expect(language).toHaveValue("de");
    expect(language.closest("details")).toBeNull();
  });

  it("tells the buyer when the proposal stays far below the budget instead of looking broken", async () => {
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
    render(<GiftBuilderPanel loader={loader} pricingEnabled onCancel={vi.fn()} onCreateBinder={vi.fn()} onOpenBinder={vi.fn()} onCardsPurchase={vi.fn()} />);

    fireEvent.change(screen.getByRole("combobox", { name: /Kartensprache/i }), { target: { value: "en" } });
    fireEvent.click(screen.getByRole("button", { name: /Binder-Seite ansehen/i }));
    await screen.findByText("9 / 9");
    expect(screen.getAllByRole("status").some((status) => status.textContent?.includes("deutlich unter deinem Budget") && status.textContent.includes("Obergrenze"))).toBe(true);
  });

  it("builds a proposal from one of the semantic artwork themes", async () => {
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
    fireEvent.click(screen.getByRole("button", { name: "Pikachu 2, Set 2: Details ansehen" }));
    expect(screen.getAllByRole("button", { name: /Keine alternative Karte für/ })).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Pikachu 1, Set 1: Details ansehen" }));
    fireEvent.click(screen.getByRole("button", { name: "Pikachu 1 entfernen" }));
    expect(screen.getByRole("button", { name: "+ Karte hinzufügen" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /Alle passenden Karten ansehen/i }));
    expect(screen.getByText(/Artwork-Treffer zum Motiv „Meer & Wasser“/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Erneut hinzufügen" }));
    expect(screen.getByText("9 / 9")).toBeInTheDocument();
  });

  it("explains a theme with too few reviewed cards in plain words instead of showing an error", async () => {
    const loader = { loadCandidatePool: vi.fn(async () => []), hydrateCandidates: vi.fn(async () => []) };
    const smartSearch = {
      search: vi.fn(async () => Array.from({ length: 5 }, (_, index) => ({
        ref: { provider: "tcgdex" as const, id: `gift-ui-${index + 1}`, language: "en" as const },
        score: 100,
        reasonCode: "semantic" as const,
      }))),
    };
    render(<GiftBuilderPanel initialDiscoveryMode="theme" loader={loader} smartSearch={smartSearch} pricingEnabled={false} onCancel={vi.fn()} onCreateBinder={vi.fn()} onOpenBinder={vi.fn()} onCardsPurchase={vi.fn()} />);
    fireEvent.click(screen.getByRole("radio", { name: /Am Strand/i }));
    fireEvent.click(screen.getByRole("button", { name: /Binder-Seite ansehen/i }));
    expect(await screen.findByText(/Für „Am Strand“ haben wir noch nicht genug geprüfte Karten für eine ganze Seite/)).toBeInTheDocument();
    expect(screen.queryByText("Vorschlag konnte nicht geladen werden")).not.toBeInTheDocument();
    expect(smartSearch.search).toHaveBeenCalledWith(expect.objectContaining({ text: "Strand", matchQuality: "dominant" }));
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
    expect(screen.getAllByText((_, element) => element?.tagName === "SPAN" && /^ca\.\s1,00/.test(element.textContent ?? ""))).toHaveLength(9);
    expect(screen.getByText(/9,00/)).toBeInTheDocument();
    expect(screen.getAllByRole("status").some((status) => status.textContent?.includes("den endgültigen Preis siehst du beim Kartenanbieter"))).toBe(true);
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

  function candidateWith(index: number, overrides: { name?: string; attacks?: string[]; category?: "pokemon" | "trainer"; setId?: string } = {}): GiftCardCandidate {
    const base = candidateWithArtwork(index);
    return {
      ...base,
      card: {
        ...base.card,
        name: overrides.name ?? "Pikachu",
        setId: overrides.setId ?? base.card.setId,
        attacks: overrides.attacks ?? [`Attack ${index}`],
        abilities: [],
        category: overrides.category ?? "pokemon",
      },
    };
  }

  it("keeps cards that are not the chosen Pokémon and reprints with the same attacks out of the first proposal", async () => {
    const pool = [
      ...Array.from({ length: 9 }, (_, index) => candidateWith(index + 1)),
      candidateWith(90, { name: "Pikachulith", category: "trainer", attacks: [] }),
      candidateWith(91, { attacks: ["Attack 1"], setId: "reprint-1" }),
      candidateWith(92, { attacks: ["Attack 2"], setId: "reprint-2" }),
    ];
    const loader = {
      loadCandidatePool: vi.fn(async () => pool.map((candidate) => ({ ref: candidate.card.ref, name: candidate.card.name, collectorNumber: candidate.card.collectorNumber }))),
      hydrateCandidates: vi.fn(async () => pool),
    };
    render(<GiftBuilderPanel loader={loader} pricingEnabled={false} onCancel={vi.fn()} onCreateBinder={vi.fn()} onOpenBinder={vi.fn()} onCardsPurchase={vi.fn()} />);

    fireEvent.change(screen.getByRole("combobox", { name: /Kartensprache/i }), { target: { value: "en" } });
    fireEvent.click(screen.getByRole("button", { name: /Binder-Seite ansehen/i }));
    await screen.findByText("9 / 9");

    expect(screen.getAllByRole("button", { name: /: Details ansehen$/ })).toHaveLength(9);
    for (const setName of ["Set 90", "Set 91", "Set 92"]) {
      expect(screen.queryByRole("button", { name: new RegExp(`${setName}: Details`) })).not.toBeInTheDocument();
    }
    // The Trainer card is not offered at all; the two reprints stay available as swap candidates of last resort.
    fireEvent.click(screen.getByRole("button", { name: /Alle passenden Karten ansehen \(11\)/ }));
    expect(screen.queryByText("Pikachulith")).not.toBeInTheDocument();
  });

  it("hands the proposal over to the binder editor for free card choice", async () => {
    const briefs: CatalogSearchItem[] = Array.from({ length: 9 }, (_, index) => ({
      ref: { provider: "tcgdex", id: `gift-ui-${index + 1}`, language: "en" },
      name: `Pikachu ${index + 1}`,
      collectorNumber: String(index + 1),
    }));
    const loader = {
      loadCandidatePool: vi.fn(async () => briefs),
      hydrateCandidates: vi.fn(async () => Array.from({ length: 9 }, (_, index) => candidateWithArtwork(index + 1))),
    };
    const onCreateBinder = vi.fn(async (_selection, preferences) => createGiftProject("Geschenk · Pikachu", preferences));
    const onOpenBinder = vi.fn();
    render(<GiftBuilderPanel loader={loader} pricingEnabled={false} onCancel={vi.fn()} onCreateBinder={onCreateBinder} onOpenBinder={onOpenBinder} onCardsPurchase={vi.fn()} />);

    fireEvent.change(screen.getByRole("combobox", { name: /Kartensprache/i }), { target: { value: "en" } });
    fireEvent.click(screen.getByRole("button", { name: /Binder-Seite ansehen/i }));
    await screen.findAllByText("9 / 9");
    fireEvent.click(screen.getByRole("button", { name: "Als Binder öffnen und Karten frei wählen" }));
    await waitFor(() => expect(onOpenBinder).toHaveBeenCalledTimes(1));
    expect(onCreateBinder).toHaveBeenCalledWith(
      expect.objectContaining({ selected: expect.arrayContaining([expect.any(Object)]) }),
      expect.objectContaining({ subjectQuery: "Pikachu" }),
    );
  });

  it("swaps a card whose picture cannot be loaded for another card instead of showing a gap", async () => {
    const pool = Array.from({ length: 12 }, (_, index) => candidateWithArtwork(index + 1));
    const loader = {
      loadCandidatePool: vi.fn(async () => pool.map((candidate) => ({ ref: candidate.card.ref, name: candidate.card.name, collectorNumber: candidate.card.collectorNumber }))),
      hydrateCandidates: vi.fn(async () => pool),
    };
    render(<GiftBuilderPanel loader={loader} pricingEnabled={false} onCancel={vi.fn()} onCreateBinder={vi.fn()} onOpenBinder={vi.fn()} onCardsPurchase={vi.fn()} />);
    fireEvent.change(screen.getByRole("combobox", { name: /Kartensprache/i }), { target: { value: "en" } });
    fireEvent.click(screen.getByRole("button", { name: /Binder-Seite ansehen/i }));
    await screen.findAllByText("9 / 9");

    const labels = () => screen.getAllByRole("button", { name: /: Details ansehen$/ }).map((button) => button.getAttribute("aria-label") ?? "");
    const before = labels();
    expect(before).toHaveLength(9);
    const [name, set] = before[0]!.replace(": Details ansehen", "").split(", ");
    const picture = screen.getAllByRole("img").find((image) => image.getAttribute("alt")?.startsWith(`${name}, ${set}`));
    expect(picture).toBeDefined();
    // The catalogue picture fails (and no CardTrader picture exists), so the card is swapped silently.
    fireEvent.error(picture!);
    await waitFor(() => expect(labels()).not.toContain(before[0]));
    expect(labels()).toHaveLength(9);
  });

  it("names the Unlimited version for early-set cards whose picture may show the 1st edition", async () => {
    const pool = Array.from({ length: 9 }, (_, index) => {
      const value = candidateWithArtwork(index + 1);
      return { ...value, card: { ...value.card, availableVariants: { normal: true, holo: false, reverse: false, firstEdition: true, shadowless: false } }, variant: { finish: "normal" as const, edition: "unlimited" as const, printing: "shadowed" as const } };
    });
    const loader = {
      loadCandidatePool: vi.fn(async () => pool.map((candidate) => ({ ref: candidate.card.ref, name: candidate.card.name, collectorNumber: candidate.card.collectorNumber }))),
      hydrateCandidates: vi.fn(async () => pool),
    };
    render(<GiftBuilderPanel loader={loader} pricingEnabled={false} onCancel={vi.fn()} onCreateBinder={vi.fn()} onOpenBinder={vi.fn()} onCardsPurchase={vi.fn()} />);
    fireEvent.change(screen.getByRole("combobox", { name: /Kartensprache/i }), { target: { value: "en" } });
    fireEvent.click(screen.getByRole("button", { name: /Binder-Seite ansehen/i }));
    await screen.findAllByText("9 / 9");
    expect(screen.getAllByText("Unlimited").length).toBeGreaterThanOrEqual(9);
    fireEvent.click(screen.getAllByRole("button", { name: /: Details ansehen$/ })[0]!);
    expect(await screen.findByText(/Die Abbildung kann eine 1\. Edition zeigen/)).toBeInTheDocument();
  });

  it("builds one page from several Pokémon and shows both", async () => {
    const pool = [
      ...Array.from({ length: 7 }, (_, index) => candidateWith(index + 1, { name: "Pikachu" })),
      ...Array.from({ length: 7 }, (_, index) => candidateWith(index + 20, { name: "Glurak" })),
    ];
    const loader = {
      loadCandidatePool: vi.fn(async () => pool.map((candidate) => ({ ref: candidate.card.ref, name: candidate.card.name, collectorNumber: candidate.card.collectorNumber }))),
      hydrateCandidates: vi.fn(async () => pool),
    };
    render(<GiftBuilderPanel loader={loader} pricingEnabled={false} onCancel={vi.fn()} onCreateBinder={vi.fn()} onOpenBinder={vi.fn()} onCardsPurchase={vi.fn()} />);

    fireEvent.change(screen.getByRole("combobox", { name: /Kartensprache/i }), { target: { value: "en" } });
    fireEvent.change(screen.getByLabelText("Lieblings-Pokémon"), { target: { value: "Pikachu, Glurak" } });
    fireEvent.click(screen.getByRole("button", { name: /Binder-Seite ansehen/i }));
    await screen.findByText("9 / 9");

    expect(loader.loadCandidatePool).toHaveBeenCalledWith(expect.objectContaining({ subjectQuery: "Pikachu, Glurak" }));
    const labels = screen.getAllByRole("button", { name: /: Details ansehen$/ }).map((button) => button.getAttribute("aria-label") ?? "");
    expect(labels).toHaveLength(9);
    const glurak = labels.filter((label) => label.startsWith("Glurak,")).length;
    expect(glurak).toBeGreaterThanOrEqual(4);
    expect(labels.length - glurak).toBeGreaterThanOrEqual(4);
  });

  it("tells the buyer that several Pokémon can be entered and fills in an example", () => {
    const loader = { loadCandidatePool: vi.fn(async () => []), hydrateCandidates: vi.fn() };
    render(<GiftBuilderPanel loader={loader} pricingEnabled={false} onCancel={vi.fn()} onCreateBinder={vi.fn()} onOpenBinder={vi.fn()} onCardsPurchase={vi.fn()} />);
    expect(screen.getByText("Ein oder mehrere Lieblings-Pokémon")).toBeInTheDocument();
    expect(screen.getByText("Auch mehrere Pokémon möglich:")).toBeInTheDocument();
    expect(screen.getByLabelText("Lieblings-Pokémon")).toHaveAccessibleDescription(/mehrere Pokémon möglich/);
    fireEvent.click(screen.getByRole("button", { name: "Beispiel: Pikachu, Glurak" }));
    expect((screen.getByLabelText("Lieblings-Pokémon") as HTMLInputElement).value).toBe("Pikachu, Glurak");
  });

  it("translates every popular Pokémon of a list when the card language changes", async () => {
    const loader = { loadCandidatePool: vi.fn(async () => []), hydrateCandidates: vi.fn() };
    render(<GiftBuilderPanel loader={loader} pricingEnabled={false} onCancel={vi.fn()} onCreateBinder={vi.fn()} onOpenBinder={vi.fn()} onCardsPurchase={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Lieblings-Pokémon"), { target: { value: "Pikachu, Glurak" } });
    fireEvent.change(screen.getByRole("combobox", { name: /Kartensprache/i }), { target: { value: "en" } });
    expect((screen.getByLabelText("Lieblings-Pokémon") as HTMLInputElement).value).toBe("Pikachu, Charizard");
  });

  it("moves a card one position at a time as the keyboard-friendly alternative to dragging", async () => {
    const pool = Array.from({ length: 9 }, (_, index) => candidateWith(index + 1, { name: `Pikachu ${index + 1}` }));
    const loader = {
      loadCandidatePool: vi.fn(async () => pool.map((candidate) => ({ ref: candidate.card.ref, name: candidate.card.name, collectorNumber: candidate.card.collectorNumber }))),
      hydrateCandidates: vi.fn(async () => pool),
    };
    render(<GiftBuilderPanel loader={loader} pricingEnabled={false} onCancel={vi.fn()} onCreateBinder={vi.fn()} onOpenBinder={vi.fn()} onCardsPurchase={vi.fn()} />);
    fireEvent.change(screen.getByRole("combobox", { name: /Kartensprache/i }), { target: { value: "en" } });
    fireEvent.click(screen.getByRole("button", { name: /Binder-Seite ansehen/i }));
    await screen.findByText("9 / 9");

    const order = () => screen.getAllByRole("button", { name: /: Details (ansehen|schließen)$/ }).map((button) => button.getAttribute("aria-label")?.split(",")[0]);
    expect(order().slice(0, 3)).toEqual(["Pikachu 1", "Pikachu 2", "Pikachu 3"]);

    fireEvent.click(screen.getByRole("button", { name: "Pikachu 1, Set 1: Details ansehen" }));
    expect(screen.getByRole("button", { name: "Pikachu 1 eine Position nach vorn" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Pikachu 1 eine Position nach hinten" }));
    expect(order().slice(0, 3)).toEqual(["Pikachu 2", "Pikachu 1", "Pikachu 3"]);
    // The opened card says where it sits now, so a move is visible even when the binder is scrolled out of view.
    expect(screen.getByText("Platz 2 von 9 · Seite 1")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Pikachu 1 eine Position nach vorn" }));
    expect(order().slice(0, 3)).toEqual(["Pikachu 1", "Pikachu 2", "Pikachu 3"]);
    expect(screen.getByText("Platz 1 von 9 · Seite 1")).toBeInTheDocument();
  });

  it("follows a card to the next page when it is moved across the page border", async () => {
    const pool = Array.from({ length: 24 }, (_, index) => candidateWith(index + 1, { name: `Pikachu ${index + 1}` }));
    const loader = {
      loadCandidatePool: vi.fn(async () => pool.map((candidate) => ({ ref: candidate.card.ref, name: candidate.card.name, collectorNumber: candidate.card.collectorNumber }))),
      hydrateCandidates: vi.fn(async () => pool),
    };
    render(<GiftBuilderPanel loader={loader} pricingEnabled={false} onCancel={vi.fn()} onCreateBinder={vi.fn()} onOpenBinder={vi.fn()} onCardsPurchase={vi.fn()} />);
    fireEvent.change(screen.getByRole("combobox", { name: /Kartensprache/i }), { target: { value: "en" } });
    fireEvent.click(screen.getByRole("radio", { name: /2 Seiten · 18 Karten/ }));
    fireEvent.click(screen.getByRole("button", { name: /Binder-Seite ansehen/i }));
    await screen.findByText("18 / 18");

    const visible = screen.getAllByRole("button", { name: /: Details ansehen$/ });
    expect(visible).toHaveLength(9);
    const lastOnPage = visible[8]!.getAttribute("aria-label")!.split(",")[0]!;
    fireEvent.click(visible[8]!);
    expect(screen.getByRole("region", { name: "Seite 1" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: `${lastOnPage} eine Position nach hinten` }));

    expect(screen.getByText("Platz 10 von 18 · Seite 2")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Seite 2" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Seite 1" })).not.toBeInTheDocument();
  });

  it("shows an open binder with two pages side by side on wide screens and lets the buyer turn the pages", async () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    const pool = Array.from({ length: 40 }, (_, index) => candidateWith(index + 1, { name: `Pikachu ${index + 1}` }));
    const loader = {
      loadCandidatePool: vi.fn(async () => pool.map((candidate) => ({ ref: candidate.card.ref, name: candidate.card.name, collectorNumber: candidate.card.collectorNumber }))),
      hydrateCandidates: vi.fn(async () => pool),
    };
    render(<GiftBuilderPanel loader={loader} pricingEnabled={false} onCancel={vi.fn()} onCreateBinder={vi.fn()} onOpenBinder={vi.fn()} onCardsPurchase={vi.fn()} />);
    fireEvent.change(screen.getByRole("combobox", { name: /Kartensprache/i }), { target: { value: "en" } });
    fireEvent.click(screen.getByRole("radio", { name: /4 Seiten · 36 Karten/ }));
    fireEvent.click(screen.getByRole("button", { name: /Binder-Seite ansehen/i }));
    await screen.findByText("36 / 36");

    expect(screen.getByRole("region", { name: "Seite 1" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Seite 2" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Seite 3" })).not.toBeInTheDocument();
    expect(screen.getByText("Seite 1–2 von 4")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Zurück blättern/ })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /Weiter blättern/ }));
    expect(screen.getByRole("region", { name: "Seite 3" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Seite 4" })).toBeInTheDocument();
    expect(screen.getByText("Seite 3–4 von 4")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Weiter blättern/ })).toBeDisabled();
    vi.unstubAllGlobals();
  });

  it("shows a single page with the inside of the cover next to it when the plan has only one page", async () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    const pool = Array.from({ length: 9 }, (_, index) => candidateWith(index + 1, { name: `Pikachu ${index + 1}` }));
    const loader = {
      loadCandidatePool: vi.fn(async () => pool.map((candidate) => ({ ref: candidate.card.ref, name: candidate.card.name, collectorNumber: candidate.card.collectorNumber }))),
      hydrateCandidates: vi.fn(async () => pool),
    };
    render(<GiftBuilderPanel loader={loader} pricingEnabled={false} onCancel={vi.fn()} onCreateBinder={vi.fn()} onOpenBinder={vi.fn()} onCardsPurchase={vi.fn()} />);
    fireEvent.change(screen.getByRole("combobox", { name: /Kartensprache/i }), { target: { value: "en" } });
    fireEvent.click(screen.getByRole("button", { name: /Binder-Seite ansehen/i }));
    await screen.findByText("9 / 9");

    expect(screen.getAllByRole("region", { name: /^Seite \d$/ })).toHaveLength(1);
    expect(screen.queryByRole("navigation", { name: "Binderseiten blättern" })).not.toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  function germanCandidate(index: number, price?: number): GiftCardCandidate {
    const base = candidateWith(index, { name: "Schiggy" });
    const id = `de-ui-${index}`;
    return {
      ...base,
      card: { ...base.card, key: `tcgdex:${id}:de`, ref: { provider: "tcgdex", id, language: "de" }, setName: `Set ${index}` },
      price: price === undefined
        ? base.price
        : { source: "tcgdex-cardmarket", currency: "EUR", amountMinor: price, fetchedAt: "2026-10-01T10:00:00.000Z", sourceUpdatedAt: "2026-10-01T09:00:00.000Z", confidence: "usable", issues: [] },
    };
  }

  it("does not leave the buyer in a dead end when the catalogue has fewer cards than wished", async () => {
    const pool = Array.from({ length: 12 }, (_, index) => germanCandidate(index + 1));
    const loader = {
      loadCandidatePool: vi.fn(async () => pool.map((candidate) => ({ ref: candidate.card.ref, name: candidate.card.name, collectorNumber: candidate.card.collectorNumber }))),
      hydrateCandidates: vi.fn(async () => pool),
    };
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => availableStandardPartner })));
    const onCreateBinder = vi.fn(async (_selection, preferences) => createGiftProject("Geschenk · Schiggy", preferences));
    render(<GiftBuilderPanel loader={loader} pricingEnabled={false} onCancel={vi.fn()} onCreateBinder={onCreateBinder} onOpenBinder={vi.fn()} onCardsPurchase={vi.fn()} />);

    fireEvent.click(screen.getByRole("radio", { name: "Schiggy" }));
    fireEvent.click(screen.getByRole("radio", { name: /4 Seiten · 36 Karten/ }));
    fireEvent.click(screen.getByRole("button", { name: /Binder-Seite ansehen/i }));
    await screen.findByText("12 / 36");

    expect(screen.getByText("Mehr als 12 Karten gibt es dafür nicht")).toBeInTheDocument();
    const next = screen.getByRole("button", { name: "Mit 12 Karten weiter" });
    expect(next).toBeEnabled();
    fireEvent.click(next);
    await waitFor(() => expect(onCreateBinder).toHaveBeenCalledTimes(1));
    expect(onCreateBinder.mock.calls[0][0].selected).toHaveLength(12);
    expect(await screen.findByText(/12 Karten = 2 Binder-Seiten/)).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("offers the same Pokémon in English in one step when German has too few cards", async () => {
    const pool = Array.from({ length: 12 }, (_, index) => germanCandidate(index + 1));
    const loader = {
      loadCandidatePool: vi.fn(async () => pool.map((candidate) => ({ ref: candidate.card.ref, name: candidate.card.name, collectorNumber: candidate.card.collectorNumber }))),
      hydrateCandidates: vi.fn(async () => pool),
    };
    render(<GiftBuilderPanel loader={loader} pricingEnabled={false} onCancel={vi.fn()} onCreateBinder={vi.fn()} onOpenBinder={vi.fn()} onCardsPurchase={vi.fn()} />);

    fireEvent.click(screen.getByRole("radio", { name: "Schiggy" }));
    fireEvent.click(screen.getByRole("radio", { name: /4 Seiten · 36 Karten/ }));
    fireEvent.click(screen.getByRole("button", { name: /Binder-Seite ansehen/i }));
    await screen.findByText("12 / 36");
    fireEvent.click(screen.getByRole("button", { name: /Auch englische Karten suchen/ }));

    await waitFor(() => expect(loader.loadCandidatePool).toHaveBeenLastCalledWith(expect.objectContaining({ subjectQuery: "Squirtle", language: "en" })));
  });

  it("still shows the total of the cards that have a price when one card has none", async () => {
    const pool = Array.from({ length: 9 }, (_, index) => germanCandidate(index + 1, index === 0 ? undefined : 100));
    const loader = {
      loadCandidatePool: vi.fn(async () => pool.map((candidate) => ({ ref: candidate.card.ref, name: candidate.card.name, collectorNumber: candidate.card.collectorNumber }))),
      hydrateCandidates: vi.fn(async () => pool),
    };
    render(<GiftBuilderPanel loader={loader} pricingEnabled onCancel={vi.fn()} onCreateBinder={vi.fn()} onOpenBinder={vi.fn()} onCardsPurchase={vi.fn()} />);

    fireEvent.click(screen.getByRole("radio", { name: "Schiggy" }));
    fireEvent.click(screen.getByRole("button", { name: /Binder-Seite ansehen/i }));
    await screen.findByText("9 / 9");

    expect(screen.getByText(/mind\. 8,00/)).toBeInTheDocument();
    expect(screen.getByText("für 8 von 9 Karten")).toBeInTheDocument();
    expect(screen.getAllByRole("status").some((status) => status.textContent?.includes("Für 1 Karte gibt es keinen Marktpreis"))).toBe(true);
  });

  function briefsOf(count: number, name = "Schiggy"): CatalogSearchItem[] {
    return Array.from({ length: count }, (_, index) => ({
      ref: { provider: "tcgdex", id: `de-ui-${index + 1}`, language: "de" },
      name,
      collectorNumber: String(index + 1),
    }));
  }

  it("shows how many cards exist for the chosen Pokémon and only offers sizes that can be filled", async () => {
    const loader = { loadCandidatePool: vi.fn(async () => [...briefsOf(25), ...briefsOf(2, "Schiggy-Ballon-Trainer").map((item) => ({ ...item, name: "Schiggys Wagen" }))]), hydrateCandidates: vi.fn() };
    render(<GiftBuilderPanel loader={loader} pricingEnabled={false} onCancel={vi.fn()} onCreateBinder={vi.fn()} onOpenBinder={vi.fn()} onCardsPurchase={vi.fn()} />);

    fireEvent.click(screen.getByRole("radio", { name: "Schiggy" }));
    expect(await screen.findByText(/Für „Schiggy“ gibt es 25 Karten auf Deutsch/)).toBeInTheDocument();
    expect(screen.getByText(/Auf Englisch gibt es oft mehr/)).toBeInTheDocument();
    expect(loader.loadCandidatePool).toHaveBeenCalledWith(expect.objectContaining({ subjectQuery: "Schiggy", language: "de" }), expect.anything());
    expect(screen.getByRole("radio", { name: /4 Seiten · 36 Karten/ })).toBeDisabled();
    expect(screen.getByText("(nur 25 verfügbar)")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /2 Seiten · 18 Karten/ })).toBeEnabled();
    expect(screen.getByRole("radio", { name: /1 Seite · 9 Karten/ })).toBeEnabled();
  });

  it("lowers a size the catalogue cannot fill to the largest one it can", async () => {
    const loader = { loadCandidatePool: vi.fn(async () => briefsOf(12)), hydrateCandidates: vi.fn() };
    render(<GiftBuilderPanel loader={loader} pricingEnabled={false} onCancel={vi.fn()} onCreateBinder={vi.fn()} onOpenBinder={vi.fn()} onCardsPurchase={vi.fn()} />);

    fireEvent.click(screen.getByRole("radio", { name: "Schiggy" }));
    fireEvent.click(screen.getByRole("radio", { name: /4 Seiten · 36 Karten/ }));
    expect(screen.getByRole("radio", { name: /4 Seiten · 36 Karten/ })).toBeChecked();

    await screen.findByText(/gibt es 12 Karten/);
    expect(screen.getByRole("radio", { name: /1 Seite · 9 Karten/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: /2 Seiten · 18 Karten/ })).toBeDisabled();
  });

  it("keeps every size for a Pokémon with many cards", async () => {
    const loader = { loadCandidatePool: vi.fn(async () => briefsOf(80, "Pikachu")), hydrateCandidates: vi.fn() };
    render(<GiftBuilderPanel loader={loader} pricingEnabled={false} onCancel={vi.fn()} onCreateBinder={vi.fn()} onOpenBinder={vi.fn()} onCardsPurchase={vi.fn()} />);

    expect(await screen.findByText(/Für „Pikachu“ gibt es viele Karten/)).toBeInTheDocument();
    for (const name of [/1 Seite/, /2 Seiten/, /4 Seiten/]) expect(screen.getByRole("radio", { name })).toBeEnabled();
  });

  it("does not block the form when the count cannot be loaded", async () => {
    const loader = { loadCandidatePool: vi.fn(async () => { throw new Error("offline"); }), hydrateCandidates: vi.fn() };
    render(<GiftBuilderPanel loader={loader} pricingEnabled={false} onCancel={vi.fn()} onCreateBinder={vi.fn()} onOpenBinder={vi.fn()} onCardsPurchase={vi.fn()} />);

    fireEvent.click(screen.getByRole("radio", { name: "Schiggy" }));
    await waitFor(() => expect(loader.loadCandidatePool).toHaveBeenCalled());
    expect(screen.queryByText(/gibt es .* Karten/)).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /4 Seiten · 36 Karten/ })).toBeEnabled();
  });

  it("offers an era choice and passes it on to the selection", async () => {
    const pool = Array.from({ length: 9 }, (_, index) => ({ ...germanCandidate(index + 1), releaseYear: 2001 }));
    const loader = {
      loadCandidatePool: vi.fn(async () => pool.map((candidate) => ({ ref: candidate.card.ref, name: candidate.card.name, collectorNumber: candidate.card.collectorNumber }))),
      hydrateCandidates: vi.fn(async () => pool),
    };
    const onCreateBinder = vi.fn(async (_selection, preferences) => createGiftProject("Geschenk · Schiggy", preferences));
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => availableStandardPartner })));
    render(<GiftBuilderPanel loader={loader} pricingEnabled={false} onCancel={vi.fn()} onCreateBinder={onCreateBinder} onOpenBinder={vi.fn()} onCardsPurchase={vi.fn()} />);

    expect(screen.getByRole("radio", { name: "Alt und neu gemischt" })).toBeChecked();
    fireEvent.click(screen.getByRole("radio", { name: "Schiggy" }));
    fireEvent.click(screen.getByRole("radio", { name: "Eher alte Karten (bis 2009)" }));
    fireEvent.click(screen.getByRole("button", { name: /Binder-Seite ansehen/i }));
    await screen.findByText("9 / 9");
    fireEvent.click(screen.getByRole("button", { name: "Weiter zum Einkauf" }));
    await waitFor(() => expect(onCreateBinder).toHaveBeenCalledTimes(1));
    expect(onCreateBinder.mock.calls[0][1]).toEqual(expect.objectContaining({ style: "vintage" }));
    vi.unstubAllGlobals();
  });

  it("comes back to the finished plan after a trip to the purchase view and forgets it when a gift is left on purpose", async () => {
    const pool = Array.from({ length: 9 }, (_, index) => germanCandidate(index + 1));
    const loader = {
      loadCandidatePool: vi.fn(async () => pool.map((candidate) => ({ ref: candidate.card.ref, name: candidate.card.name, collectorNumber: candidate.card.collectorNumber }))),
      hydrateCandidates: vi.fn(async () => pool),
    };
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => availableStandardPartner })));
    const onCreateBinder = vi.fn(async (_selection, preferences) => createGiftProject("Geschenk · Schiggy", preferences));
    const onCardsPurchase = vi.fn();
    const first = render(<GiftBuilderPanel loader={loader} pricingEnabled={false} onCancel={vi.fn()} onCreateBinder={onCreateBinder} onOpenBinder={vi.fn()} onCardsPurchase={onCardsPurchase} />);
    fireEvent.click(screen.getByRole("radio", { name: "Schiggy" }));
    fireEvent.click(screen.getByRole("button", { name: /Binder-Seite ansehen/i }));
    await screen.findByText("9 / 9");
    fireEvent.click(screen.getByRole("button", { name: "Weiter zum Einkauf" }));
    await screen.findByRole("heading", { name: "Dein Geschenk-Binder ist fertig geplant" });
    fireEvent.click(screen.getByRole("button", { name: "Karten besorgen" }));
    expect(onCardsPurchase).toHaveBeenCalledOnce();
    first.unmount();

    // The panel is mounted again (the buyer came back): the finished plan is there, without a second save.
    const onCancel = vi.fn();
    render(<GiftBuilderPanel loader={loader} pricingEnabled={false} onCancel={onCancel} onCreateBinder={onCreateBinder} onOpenBinder={vi.fn()} onCardsPurchase={vi.fn()} />);
    expect(await screen.findByRole("heading", { name: "Dein Geschenk-Binder ist fertig geplant" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Geschenk · Schiggy" })).toBeInTheDocument();
    expect(onCreateBinder).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Geschenk-Gestaltung schließen" }));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(window.sessionStorage.getItem("cardfolio-gift-summary")).toBeNull();
    vi.unstubAllGlobals();
  });

  it("warns that shipping can cost more than the cards when they are very cheap", async () => {
    const pool = Array.from({ length: 9 }, (_, index) => germanCandidate(index + 1, 40));
    const loader = {
      loadCandidatePool: vi.fn(async () => pool.map((candidate) => ({ ref: candidate.card.ref, name: candidate.card.name, collectorNumber: candidate.card.collectorNumber }))),
      hydrateCandidates: vi.fn(async () => pool),
    };
    render(<GiftBuilderPanel loader={loader} pricingEnabled onCancel={vi.fn()} onCreateBinder={vi.fn()} onOpenBinder={vi.fn()} onCardsPurchase={vi.fn()} />);
    fireEvent.click(screen.getByRole("radio", { name: "Schiggy" }));
    fireEvent.change(screen.getByRole("spinbutton", { name: /Budget/ }), { target: { value: "4" } });
    fireEvent.click(screen.getByRole("button", { name: /Binder-Seite ansehen/i }));
    await screen.findByText("9 / 9");

    expect(screen.getAllByRole("status").some((status) => status.textContent?.includes("Der Versand bei Cardmarket kostet oft mehr als eine einzelne Karte"))).toBe(true);
  });

  it("shows a plain message instead of raw validation output when card data cannot be read", async () => {
    const technical = Object.assign(new Error(JSON.stringify([{ expected: "string", code: "invalid_type", path: ["attacks", 0, "name"] }])), { name: "ZodError" });
    const loader = {
      loadCandidatePool: vi.fn(async () => briefsOf(9)),
      hydrateCandidates: vi.fn(async () => { throw technical; }),
    };
    render(<GiftBuilderPanel loader={loader} pricingEnabled={false} onCancel={vi.fn()} onCreateBinder={vi.fn()} onOpenBinder={vi.fn()} onCardsPurchase={vi.fn()} />);
    fireEvent.click(screen.getByRole("radio", { name: "Schiggy" }));
    fireEvent.click(screen.getByRole("button", { name: /Binder-Seite ansehen/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Einige Kartendaten konnten gerade nicht gelesen werden");
    expect(alert).not.toHaveTextContent("invalid_type");
  });

  it("tops up with other eras when there are too few cards of the wished one", async () => {
    const pool = Array.from({ length: 12 }, (_, index) => ({ ...germanCandidate(index + 1), releaseYear: index < 4 ? 2001 : 2018 }));
    const loader = {
      loadCandidatePool: vi.fn(async () => pool.map((candidate) => ({ ref: candidate.card.ref, name: candidate.card.name, collectorNumber: candidate.card.collectorNumber }))),
      hydrateCandidates: vi.fn(async () => pool),
    };
    render(<GiftBuilderPanel loader={loader} pricingEnabled={false} onCancel={vi.fn()} onCreateBinder={vi.fn()} onOpenBinder={vi.fn()} onCardsPurchase={vi.fn()} />);

    fireEvent.click(screen.getByRole("radio", { name: "Schiggy" }));
    fireEvent.click(screen.getByRole("radio", { name: "Eher alte Karten (bis 2009)" }));
    fireEvent.click(screen.getByRole("button", { name: /Binder-Seite ansehen/i }));
    await screen.findByText("9 / 9");

    expect(loader.loadCandidatePool).toHaveBeenLastCalledWith(expect.objectContaining({ era: "vintage" }));
    expect(screen.getAllByRole("status").some((status) => status.textContent?.includes("Es gibt nicht genug alte Karten. Den Rest haben wir mit neueren Karten aufgefüllt."))).toBe(true);
  });
});
