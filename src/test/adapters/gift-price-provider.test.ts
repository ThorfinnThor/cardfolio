import { describe, expect, it } from "vitest";

import { TCGdexGiftPriceProvider } from "@/data/pricing/gift-price-provider";
import type { GiftPriceRequest } from "@/domain/gift-builder";

const provider = new TCGdexGiftPriceProvider();
const base: Omit<GiftPriceRequest, "currency" | "rawPricing"> = {
  card: {
    key: "tcgdex:base1-4:en",
    ref: { provider: "tcgdex", id: "base1-4", language: "en" },
    name: "Charizard",
    setId: "base1",
    setName: "Base Set",
    collectorNumber: "4",
    physicalStatus: "physical",
    fetchedAt: "2026-10-01T10:00:00.000Z",
  },
  variant: { finish: "normal", edition: "unlimited", printing: "shadowed" },
  fetchedAt: "2026-10-01T10:00:00.000Z",
  printingMatch: "verified-printing",
};

describe("Gift price provider", () => {
  it("normalizes Cardmarket EUR using trend and an actual-metric range", async () => {
    const quote = await provider.getPrice({
      ...base,
      currency: "EUR",
      rawPricing: {
        cardmarket: { unit: "EUR", updated: "2026-10-01T09:00:00.000Z", low: 2, trend: 3, avg30: 4, avg: 5 },
        tcgplayer: { unit: "USD", updated: "2026-10-01T09:00:00.000Z", unlimited: { marketPrice: 99 } },
      },
    });
    expect(quote).toMatchObject({
      source: "tcgdex-cardmarket",
      currency: "EUR",
      amountMinor: 300,
      metric: "trend",
      confidence: "usable",
      range: { lowMinor: 200, highMinor: 500, lowMetric: "low", highMetric: "avg" },
    });
  });

  it("normalizes only the requested TCGplayer USD variant and falls back to mid", async () => {
    const quote = await provider.getPrice({
      ...base,
      currency: "USD",
      rawPricing: {
        cardmarket: { unit: "EUR", updated: "2026-10-01T09:00:00.000Z", trend: 1 },
        tcgplayer: {
          unit: "USD",
          updated: "2026-10-01T09:00:00.000Z",
          unlimited: { lowPrice: 2, midPrice: 4, highPrice: 6 },
          normal: { marketPrice: 99 },
        },
      },
    });
    expect(quote).toMatchObject({
      source: "tcgdex-tcgplayer",
      currency: "USD",
      amountMinor: 400,
      metric: "mid",
      confidence: "usable",
      range: { lowMinor: 200, highMinor: 600 },
    });
  });

  it("uses generic TCGplayer variant keys for sets without a historical First Edition", async () => {
    const modernCard = {
      ...base.card,
      key: "tcgdex:swsh1-1:en",
      ref: { ...base.card.ref, id: "swsh1-1" },
      setId: "swsh1",
      setName: "Sword & Shield",
    };
    const quote = await provider.getPrice({
      ...base,
      card: modernCard,
      currency: "USD",
      rawPricing: {
        tcgplayer: { unit: "USD", updated: "2026-10-01T09:00:00.000Z", normal: { marketPrice: 2.5 } },
      },
    });
    expect(quote).toMatchObject({ amountMinor: 250, metric: "market", confidence: "usable" });
  });

  it("keeps uncertain printing matches approximate and missing/zero prices unknown", async () => {
    const approximate = await provider.getPrice({
      ...base,
      currency: "USD",
      printingMatch: "candidate",
      rawPricing: {
        tcgplayer: { unit: "USD", updated: "2026-10-01T09:00:00.000Z", unlimited: { marketPrice: 1 } },
      },
    });
    const unknown = await provider.getPrice({
      ...base,
      currency: "EUR",
      rawPricing: { cardmarket: { unit: "EUR", updated: "2026-10-01T09:00:00.000Z", trend: 0 } },
    });
    expect(approximate.confidence).toBe("approximate");
    expect(unknown).toMatchObject({ currency: "EUR", confidence: "unknown" });
    expect(unknown.amountMinor).toBeUndefined();
  });

  it("does not silently use USD for EUR or TCGplayer for German cards", async () => {
    const noEur = await provider.getPrice({
      ...base,
      currency: "EUR",
      rawPricing: { tcgplayer: { unit: "USD", updated: "2026-10-01T09:00:00.000Z", unlimited: { marketPrice: 2 } } },
    });
    const german = await provider.getPrice({
      ...base,
      card: { ...base.card, key: "tcgdex:base1-4:de", ref: { ...base.card.ref, language: "de" } },
      currency: "USD",
      rawPricing: { tcgplayer: { unit: "USD", updated: "2026-10-01T09:00:00.000Z", unlimited: { marketPrice: 2 } } },
    });
    expect(noEur.confidence).toBe("unknown");
    expect(german.confidence).toBe("unknown");
  });
});
