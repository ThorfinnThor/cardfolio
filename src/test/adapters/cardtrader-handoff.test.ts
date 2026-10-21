import { describe, expect, it } from "vitest";

import { CARDTRADER_SHOP_OPTIMIZER_URL, cardtraderCardUrl, withCardtraderShareCode } from "@/config/cardtrader";
import { CardTraderCatalog } from "@/data/cardtrader/catalog";
import { prepareCardtraderHandoff } from "@/data/marketplace/cardtrader-handoff";
import type { MissingItem } from "@/domain/types";

describe("CardTrader referral links", () => {
  it("adds the share code with ? or & and never twice", () => {
    expect(withCardtraderShareCode("https://www.cardtrader.com/en/magic")).toBe("https://www.cardtrader.com/en/magic?share_code=yourcardbinder");
    expect(withCardtraderShareCode("https://www.cardtrader.com/en/some-page?foo=bar")).toBe("https://www.cardtrader.com/en/some-page?foo=bar&share_code=yourcardbinder");
    expect(withCardtraderShareCode("https://www.cardtrader.com/en/x?share_code=other")).toBe("https://www.cardtrader.com/en/x?share_code=yourcardbinder");
  });

  it("refuses addresses of other sites", () => {
    expect(() => withCardtraderShareCode("https://evil.example/en/magic")).toThrow();
    expect(() => withCardtraderShareCode("https://cardtrader.com.evil.example/en/magic")).toThrow();
  });

  it("builds the card page and the Shop Optimizer link", () => {
    expect(cardtraderCardUrl(111148)).toBe("https://www.cardtrader.com/en/cards/111148?share_code=yourcardbinder");
    expect(CARDTRADER_SHOP_OPTIMIZER_URL).toBe("https://www.cardtrader.com/en/wishlists/new?share_code=yourcardbinder");
  });
});

const FILES: Record<string, unknown> = {
  "index.json": { "en:base1": 1472 },
  "expansions/1472.json": { id: 1472, code: "bs", name: "Base Set", blueprints: [{ id: 111148, n: "001", name: "Alakazam" }, { id: 111149, n: "002", name: "Blastoise" }] },
  "prices/1472.json": { id: 1472, currency: "EUR", slots: new Array(10).fill(""), p: { "111148": [900, 500, 400, 300, 200, 0, 0, 0, 0, 0] }, o: { "111148": [12, 0] }, c: { "111148": "DE,IT,FR" } },
};
const catalog = () => new CardTraderCatalog(async (file) => { if (!(file in FILES)) throw new Error("404"); return FILES[file]; });

function item(number: string, name: string, quantity: number, overrides: Partial<MissingItem["variant"]> = {}, condition: MissingItem["preferences"]["minimumCondition"] = "excellent"): MissingItem {
  return {
    identityKey: `k${number}`,
    card: { key: `tcgdex:base1-${number}:en`, ref: { provider: "tcgdex", id: `base1-${number}`, language: "en" }, name, setId: "base1", setName: "Base Set", collectorNumber: number, physicalStatus: "physical", fetchedAt: "2026-10-21T00:00:00.000Z" },
    variant: { finish: "holo", edition: "unlimited", printing: "unspecified", ...overrides },
    preferences: { minimumCondition: condition },
    quantity,
    entryIds: ["00000000-0000-4000-8000-000000000001"],
  } as MissingItem;
}

describe("prepareCardtraderHandoff", () => {
  it("links and prices matched cards by quantity and leaves the rest out", async () => {
    const result = await prepareCardtraderHandoff([item("1", "Alakazam", 2), item("2", "Blastoise", 1), item("9", "Unknown", 1)], catalog());
    expect(result.entries[0]).toEqual({ identityKey: "k1", blueprintId: 111148, url: "https://www.cardtrader.com/en/cards/111148?share_code=yourcardbinder", unitPriceMinor: 500, offerCount: 12, sellerCountries: ["DE", "IT", "FR"] });
    expect(result.entries[1]?.offerCount).toBeUndefined();
    expect(result.entries[1]).toMatchObject({ identityKey: "k2", blueprintId: 111149 });
    expect(result.entries[1]?.unitPriceMinor).toBeUndefined();
    expect(result.entries[2]).toEqual({ identityKey: "k9" });
    expect(result).toMatchObject({ linkedCount: 2, pricedCount: 1, pricedTotalMinor: 1000, pricedQuantity: 2 });
  });

  it("prices at the item's minimum condition and never prices first editions", async () => {
    expect((await prepareCardtraderHandoff([item("1", "Alakazam", 1, {}, "near-mint")], catalog())).pricedTotalMinor).toBe(900);
    expect((await prepareCardtraderHandoff([item("1", "Alakazam", 1, {}, "any")], catalog())).pricedTotalMinor).toBe(200);
    const first = await prepareCardtraderHandoff([item("1", "Alakazam", 1, { edition: "first-edition" })], catalog());
    expect(first.pricedCount).toBe(0);
    expect(first.entries[0]?.url).toBeDefined();
  });

  it("returns nothing when the CardTrader data cannot be loaded", async () => {
    const result = await prepareCardtraderHandoff([item("1", "Alakazam", 1)], new CardTraderCatalog(async () => { throw new Error("offline"); }));
    expect(result).toEqual({ entries: [{ identityKey: "k1" }], linkedCount: 0, pricedCount: 0, pricedTotalMinor: 0, pricedQuantity: 0 });
  });
});
