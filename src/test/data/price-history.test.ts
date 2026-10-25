import { describe, expect, it } from "vitest";

import { CardTraderCatalog, historyFileSchema } from "@/data/cardtrader/catalog";
import { binderMarketHistory, cardPriceTrend } from "@/data/pricing/price-history";
import type { OwnedCopy } from "@/domain/collection-value";
import type { CardSnapshot, PlannedCard } from "@/domain/types";

const EXPANSION = {
  id: 1472, code: "bs", name: "Base Set",
  blueprints: [{ id: 1, n: "001", name: "Alakazam" }, { id: 2, n: "004", name: "Charizard" }, { id: 3, n: "005", name: "Dratini" }],
};
const HISTORY = {
  id: 1472, currency: "EUR", dates: ["2026-10-21", "2026-10-28", "2026-11-04"],
  s: {
    "1": { "en:nm": [1000, 1100, 1200], "en:lp": [800, 0, 900] },
    "2": { "en:nm": [5000, 5000, 4500] },
    "3": { "en:nm": [0, 300, 310] },
  },
};
const HIGH = { ...HISTORY, s: { ...HISTORY.s, "2": { "en:nm": [5000, 600_000, 4500] } } };
const FILES: Record<string, unknown> = { "index.json": { "en:base1": 1472 }, "expansions/1472.json": EXPANSION, "history/1472.json": HISTORY };
const catalog = () => new CardTraderCatalog(async (file) => { if (!(file in FILES)) throw new Error(`404 ${file}`); return FILES[file]; });

const card = (number: string, name: string): CardSnapshot => ({ key: `tcgdex:base1-${number}:en`, ref: { provider: "tcgdex", id: `base1-${number}`, language: "en" }, name, setId: "base1", setName: "Base Set", collectorNumber: number, physicalStatus: "physical", fetchedAt: "2026-10-24T00:00:00.000Z" });
const planned = (cardKey: string, condition: PlannedCard["preferences"]["minimumCondition"] = "near-mint", edition: "unlimited" | "first-edition" = "unlimited"): PlannedCard => ({ id: crypto.randomUUID(), cardKey, variant: { finish: "holo", edition, printing: "shadowed" }, preferences: { minimumCondition: "excellent" }, condition: condition === "any" ? undefined : condition, owned: true, addedAt: "2026-10-24T00:00:00.000Z" });
const owned = (number: string, name: string, copies = 1, condition: OwnedCopy["condition"] = "near-mint", edition: "unlimited" | "first-edition" = "unlimited"): OwnedCopy => {
  const snapshot = card(number, name);
  return { entry: planned(snapshot.key, condition, edition), card: snapshot, copies, condition, conditionRecorded: true };
};

describe("price history file and lookup", () => {
  it("validates the file and rejects unknown series names", () => {
    expect(historyFileSchema.safeParse(HISTORY).success).toBe(true);
    expect(historyFileSchema.safeParse({ ...HISTORY, s: { "1": { "en:any": [1, 2, 3] } } }).success).toBe(false);
  });

  it("returns the series of the card's language and condition, and nothing for the any-condition or a missing series", async () => {
    const match = await catalog().blueprint("en", "base1", "001", "Alakazam");
    expect(await catalog().priceHistory(match!, "en", "near-mint")).toEqual({ dates: HISTORY.dates, amounts: [1000, 1100, 1200] });
    expect(await catalog().priceHistory(match!, "en", "any")).toBeUndefined();
    expect(await catalog().priceHistory(match!, "de", "near-mint")).toBeUndefined();
    expect(await new CardTraderCatalog(async () => { throw new Error("404"); }).priceHistory(match!, "en", "near-mint")).toBeUndefined();
  });
});

describe("card price trend", () => {
  it("lists the weeks with a listing at the condition and none for first editions", async () => {
    const alakazam = owned("001", "Alakazam", 1, "lightly-played");
    expect(await cardPriceTrend(alakazam.card, alakazam.entry.variant, "lightly-played", catalog())).toEqual([{ date: "2026-10-21", amountMinor: 800 }, { date: "2026-11-04", amountMinor: 900 }]);
    expect(await cardPriceTrend(alakazam.card, { ...alakazam.entry.variant, edition: "first-edition" }, "lightly-played", catalog())).toEqual([]);
  });
});

describe("placeholder prices in the series", () => {
  const withHigh = new CardTraderCatalog(async (file) => { if (file === "history/1472.json") return HIGH; if (!(file in FILES)) throw new Error("404"); return FILES[file]; });

  it("show no trend for a card that once had a price above the trusted limit, and keep such a card out of the curve", async () => {
    const charizard = owned("004", "Charizard");
    expect(await cardPriceTrend(charizard.card, charizard.entry.variant, "near-mint", withHigh)).toEqual([]);
    const points = await binderMarketHistory([owned("001", "Alakazam"), charizard], withHigh);
    expect(points.map((point) => point.valueMinor)).toEqual([1000, 1100, 1200]);
    expect(points[0]).toMatchObject({ pricedCopies: 1, ownedCopies: 2 });
  });
});

describe("market history of the owned cards", () => {
  it("adds up copies week by week for cards that had a price in every week", async () => {
    const points = await binderMarketHistory([owned("001", "Alakazam", 2), owned("004", "Charizard")], catalog());
    expect(points.map((point) => [point.date, point.valueMinor])).toEqual([["2026-10-21", 7000], ["2026-10-28", 7200], ["2026-11-04", 6900]]);
    expect(points[0]).toMatchObject({ pricedCopies: 3, ownedCopies: 3 });
  });

  it("leaves out a card without a price in some week and counts it as not in the curve", async () => {
    const points = await binderMarketHistory([owned("001", "Alakazam"), owned("005", "Dratini")], catalog());
    expect(points.map((point) => point.valueMinor)).toEqual([1000, 1100, 1200]);
    expect(points[0]).toMatchObject({ pricedCopies: 1, ownedCopies: 2 });
  });

  it("returns nothing for the any-condition, first editions, unknown cards or a single week", async () => {
    expect(await binderMarketHistory([owned("001", "Alakazam", 1, "any")], catalog())).toEqual([]);
    expect(await binderMarketHistory([owned("001", "Alakazam", 1, "near-mint", "first-edition")], catalog())).toEqual([]);
    expect(await binderMarketHistory([owned("999", "Unknown")], catalog())).toEqual([]);
    const oneWeek: Record<string, unknown> = { ...FILES, "history/1472.json": { ...HISTORY, dates: ["2026-10-21"], s: { "1": { "en:nm": [1000] } } } };
    const single = new CardTraderCatalog(async (file) => { if (!(file in oneWeek)) throw new Error("404"); return oneWeek[file]; });
    expect(await binderMarketHistory([owned("001", "Alakazam")], single)).toEqual([]);
  });
});
