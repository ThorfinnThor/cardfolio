import { describe, expect, it } from "vitest";

import { createGiftPrintSummary } from "@/domain/gift-print-summary";
import type { GiftCardCandidate, GiftProject, GiftSelectionResult } from "@/domain/gift-builder";

const project: GiftProject = {
  id: "00000000-0000-4000-8000-000000000010",
  schemaVersion: 1,
  revision: 0,
  name: "Pikachu-Geschenk",
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
  preferences: {
    recipientKind: "friend",
    recipientName: "Sam",
    subjectQuery: "Pikachu",
    targetCardCount: 9,
    budgetMinor: 10_000,
    currency: "EUR",
    style: "mixed",
  },
  selectedCardKeys: [],
};

function candidate(index: number): GiftCardCandidate {
  return {
    card: {
      key: `tcgdex:base1-${index}:en`,
      ref: { provider: "tcgdex", id: `base1-${index}`, language: "en" },
      name: `Pikachu ${index}`,
      setId: "base1",
      setName: "Base Set",
      collectorNumber: String(index),
      collectorTotal: "102",
      imageBaseUrl: `https://assets.tcgdex.net/en/base/base1/${index}`,
      physicalStatus: "physical",
      fetchedAt: "2026-10-01T00:00:00.000Z",
    },
    variant: { finish: "normal", edition: "unlimited", printing: "shadowed" },
    preferences: { minimumCondition: "excellent" },
    price: {
      source: "tcgdex-cardmarket",
      currency: "EUR",
      amountMinor: 500,
      range: { lowMinor: 400, highMinor: 600, lowMetric: "avg30", highMetric: "avg" },
      fetchedAt: "2026-10-01T00:00:00.000Z",
      confidence: "usable",
      issues: [],
    },
    reasonTags: ["set-diversity"],
  };
}

describe("Gift Print Summary contract", () => {
  it("keeps card and binder costs separate and exports text-only card identity", () => {
    const selected = [candidate(1), candidate(2)];
    const selection: GiftSelectionResult = {
      selected,
      estimatedTotalMinor: 1_000,
      unpricedCount: 0,
      approximateCount: 0,
      budgetStatus: "within",
      issues: [],
    };
    const summary = createGiftPrintSummary({
      project,
      selection,
      greeting: "Viel Freude mit deinem Binder!",
      generatedAt: "2026-10-01T12:00:00.000Z",
    });

    expect(summary.cardPurchase).toMatchObject({
      estimatedValueMinor: 1_000,
      estimatedRange: { lowMinor: 800, highMinor: 1_200 },
      shippingAndTaxExcluded: true,
    });
    expect(summary.binderPurchase).toEqual({ status: "not-selected", purchasedSeparately: true });
    expect(summary.cards[0]).toMatchObject({ collectorNumber: "1/102", language: "en" });
    expect(summary.assetPolicy).toBe("text-only-no-pokemon-art-or-logos");
    expect(summary.privacy).toBe("generated-locally-no-upload");
    expect(JSON.stringify(summary)).not.toContain("assets.tcgdex.net");
    expect(JSON.stringify(summary)).not.toContain("imageBaseUrl");
  });

  it("keeps missing market prices unknown", () => {
    const unknown = candidate(1);
    unknown.price = { currency: "EUR", fetchedAt: "2026-10-01T00:00:00.000Z", confidence: "unknown", issues: ["missing-pricing"] };
    const summary = createGiftPrintSummary({
      project,
      selection: { selected: [unknown], unpricedCount: 1, approximateCount: 0, budgetStatus: "unknown", issues: ["unknown-prices"] },
      generatedAt: "2026-10-01T12:00:00.000Z",
    });
    expect(summary.cardPurchase.estimatedValueMinor).toBeUndefined();
    expect(summary.cardPurchase.estimatedRange).toBeUndefined();
    expect(summary.cardPurchase.unknownPriceCount).toBe(1);
  });
});
