import { describe, expect, it, vi } from "vitest";

import { CardTraderCatalog } from "@/data/cardtrader/catalog";
import { CardTraderGiftPriceProvider, FallbackGiftPriceProvider } from "@/data/pricing/cardtrader-price-provider";
import type { GiftPriceQuote, GiftPriceRequest, PriceProvider } from "@/domain/gift-builder";
import type { CardSnapshot } from "@/domain/types";

const FILES: Record<string, unknown> = {
  "index.json": { "en:base1": 1472, "de:base1": 1472 },
  "expansions/1472.json": { id: 1472, code: "bs", name: "Base Set", blueprints: [{ id: 1, n: "001", name: "Alakazam" }, { id: 2, n: "002", name: "Blastoise" }] },
  "prices/1472.json": { id: 1472, currency: "EUR", slots: new Array(10).fill(""), p: { "1": [900, 500, 400, 300, 200, 0, 700, 600, 500, 400] } },
};
const catalog = () => new CardTraderCatalog(async (file) => { if (!(file in FILES)) throw new Error("404"); return FILES[file]; });

function card(overrides: Partial<CardSnapshot> = {}): CardSnapshot {
  return { key: "k", ref: { provider: "tcgdex", id: "base1-1", language: "en" }, name: "Alakazam", setId: "base1", setName: "Base Set", collectorNumber: "1", physicalStatus: "physical", fetchedAt: "2026-10-20T10:00:00.000Z", ...overrides } as CardSnapshot;
}
function request(overrides: Partial<GiftPriceRequest> = {}): GiftPriceRequest {
  return { card: card(), variant: { finish: "holo", edition: "unlimited", printing: "unspecified" } as GiftPriceRequest["variant"], currency: "EUR", rawPricing: undefined, fetchedAt: "2026-10-20T10:00:00.000Z", printingMatch: "candidate", ...overrides };
}

describe("CardTraderGiftPriceProvider", () => {
  const provider = () => new CardTraderGiftPriceProvider(catalog());

  it("quotes the cheapest listing at the minimum condition as an approximate CardTrader price", async () => {
    const quote = await provider().getPrice(request({ minimumCondition: "excellent" }));
    expect(quote).toMatchObject({ source: "cardtrader", currency: "EUR", amountMinor: 500, metric: "low-listing", confidence: "approximate" });
    expect(quote.issues).toContain("cardtrader-cheapest-listing");
    expect((await provider().getPrice(request({ minimumCondition: "near-mint" }))).amountMinor).toBe(900);
    expect((await provider().getPrice(request())).amountMinor).toBe(500);
  });

  it("uses the German listings for German cards", async () => {
    const quote = await provider().getPrice(request({ card: card({ ref: { provider: "tcgdex", id: "base1-1", language: "de" } }), minimumCondition: "near-mint" }));
    expect(quote.amountMinor).toBeUndefined();
    expect((await provider().getPrice(request({ card: card({ ref: { provider: "tcgdex", id: "base1-1", language: "de" } }), minimumCondition: "excellent" }))).amountMinor).toBe(700);
  });

  it("stays unknown instead of guessing", async () => {
    const reasons = async (r: GiftPriceRequest) => (await provider().getPrice(r)).issues;
    expect(await reasons(request({ currency: "USD" }))).toEqual(["cardtrader-prices-are-eur"]);
    expect(await reasons(request({ variant: { finish: "holo", edition: "first-edition", printing: "unspecified" } as GiftPriceRequest["variant"] }))).toEqual(["cardtrader-first-edition-not-priced"]);
    expect(await reasons(request({ card: card({ collectorNumber: "99" }) }))).toEqual(["cardtrader-card-not-matched"]);
    expect(await reasons(request({ card: card({ collectorNumber: "2" }) }))).toEqual(["cardtrader-no-listing-at-condition"]);
    expect((await provider().getPrice(request({ card: card({ collectorNumber: "99" }) }))).confidence).toBe("unknown");
  });
});

describe("FallbackGiftPriceProvider", () => {
  const quote = (amountMinor?: number, source: GiftPriceQuote["source"] = "tcgdex-cardmarket"): GiftPriceQuote => ({ source, currency: "EUR", amountMinor, fetchedAt: "t", confidence: amountMinor ? "usable" : "unknown", issues: [] });
  const fixed = (value: GiftPriceQuote): PriceProvider => ({ getPrice: vi.fn(async () => value) });

  it("keeps the primary price when there is one and does not ask the fallback", async () => {
    const fallback = fixed(quote(111, "cardtrader"));
    const result = await new FallbackGiftPriceProvider(fixed(quote(250)), fallback).getPrice(request());
    expect(result.amountMinor).toBe(250);
    expect(fallback.getPrice).not.toHaveBeenCalled();
  });

  it("uses the fallback only when the primary has no price", async () => {
    expect((await new FallbackGiftPriceProvider(fixed(quote(undefined)), fixed(quote(111, "cardtrader"))).getPrice(request())).source).toBe("cardtrader");
  });

  it("returns the primary's unknown quote when neither has a price", async () => {
    const primary = quote(undefined);
    expect(await new FallbackGiftPriceProvider(fixed(primary), fixed(quote(undefined, "cardtrader"))).getPrice(request())).toBe(primary);
  });
});
