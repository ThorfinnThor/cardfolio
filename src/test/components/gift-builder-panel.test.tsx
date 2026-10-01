import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
    expect(screen.getByText("9 unbekannt · 0 angenähert")).toBeInTheDocument();
    expect(await screen.findByText(/Kein freigegebener Anbieter/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Derzeit nicht verfügbar/i })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Grußtext für die lokale Druckansicht/i), { target: { value: "Viel Freude!" } });
    expect(screen.getByText("Viel Freude!", { selector: "blockquote" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Drucken \/ als PDF speichern/i }));
    expect(print).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Karten besorgen" }));
    expect(onCardsPurchase).toHaveBeenCalledOnce();
  });
});
