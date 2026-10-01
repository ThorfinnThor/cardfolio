import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GiftBuilderPanel } from "@/components/foundation/GiftBuilderPanel";
import { createGiftProject, type GiftCardCandidate } from "@/domain/gift-builder";
import type { CardSnapshot, CatalogSearchItem } from "@/domain/types";

const disabledPartners = {
  schemaVersion: 1,
  enabled: false,
  reviewedAt: "2026-10-01",
  disabledReason: "Kein freigegebener Anbieter.",
  partners: [{
    id: "partner-disabled",
    displayName: "Personalisierter Binder",
    enabled: false,
    verifiedAt: "2026-10-01",
    reviewAfter: "2026-10-31",
    disabledReason: "Kein freigegebener Anbieter.",
    affiliate: { enabled: false },
    capabilities: { personalization: false, photoUpload: false },
    evidenceUrls: ["https://example.com/terms"],
  }],
};

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
    fetchedAt: "2026-10-01T10:00:00.000Z",
  };
  return {
    card,
    variant: { finish: "normal", edition: "unlimited", printing: "shadowed" },
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
      hydrateCandidates: vi.fn(async () => Array.from({ length: 9 }, (_, index) => candidate(index + 1))),
    };
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => disabledPartners })));
    const onCreateBinder = vi.fn(async (_selection, preferences) => createGiftProject("Geschenk · Pikachu", preferences));
    const onCardsPurchase = vi.fn();
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
    render(<GiftBuilderPanel loader={loader} pricingEnabled={false} onCancel={vi.fn()} onCreateBinder={onCreateBinder} onOpenBinder={vi.fn()} onCardsPurchase={onCardsPurchase} />);

    fireEvent.click(screen.getByRole("button", { name: /Vorschlag erzeugen/i }));
    await screen.findByText("9 / 9");
    expect(screen.getByRole("status")).toHaveTextContent("Preisprüfung");
    fireEvent.click(screen.getByRole("button", { name: /Auswahl prüfen/i }));
    await screen.findByRole("heading", { name: /Vorschlag ist bereit/i });
    fireEvent.click(screen.getByRole("button", { name: /Als Binder anlegen/i }));
    await waitFor(() => expect(onCreateBinder).toHaveBeenCalledTimes(1));
    expect(onCreateBinder).toHaveBeenCalledWith(
      expect.objectContaining({ selected: expect.arrayContaining([expect.any(Object)]) }),
      expect.objectContaining({ subjectQuery: "Pikachu", targetCardCount: 9 }),
    );
    await screen.findByRole("heading", { name: "Geschenk · Pikachu" });
    expect(screen.getByText("Keine Budgetzusage")).toBeInTheDocument();
    expect(await screen.findByText(/Kein freigegebener Anbieter/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Derzeit nicht verfügbar/i })).toBeDisabled();
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

    fireEvent.click(screen.getByRole("button", { name: /Vorschlag erzeugen/i }));
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

    render(<GiftBuilderPanel loader={loader} smartSearch={smartSearch} pricingEnabled={false} onCancel={vi.fn()} onCreateBinder={vi.fn()} onOpenBinder={vi.fn()} onCardsPurchase={vi.fn()} />);

    expect(screen.getAllByRole("radio", { name: /Nach Artwork-Motiv/i })).toHaveLength(1);
    fireEvent.click(screen.getByRole("radio", { name: /Nach Artwork-Motiv/i }));
    expect(screen.getAllByRole("radio", { name: /Meer & Wasser/i })).toHaveLength(1);
    fireEvent.click(screen.getByRole("radio", { name: /Meer & Wasser/i }));
    fireEvent.click(screen.getByRole("button", { name: /Vorschlag erzeugen/i }));

    await screen.findByText("9 / 9");
    expect(loader.loadCandidatePool).not.toHaveBeenCalled();
    expect(smartSearch.search).toHaveBeenCalledWith(expect.objectContaining({
      text: "Meer",
      language: "en",
    }));
    fireEvent.click(screen.getByRole("button", { name: /Alle passenden Karten ansehen/i }));
    expect(screen.getByText(/Artwork-Treffer zum Motiv „Meer & Wasser“/i)).toBeInTheDocument();
  });
});
