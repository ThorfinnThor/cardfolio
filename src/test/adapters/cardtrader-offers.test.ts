import { describe, expect, it } from "vitest";

import { CardTraderCatalog, priceFileSchema } from "@/data/cardtrader/catalog";
import { summarizeOffers } from "../../../scripts/cardtrader-offers.mjs";

const listing = (cents: number, language: string, country?: string) => ({ price_cents: cents, user: country ? { country_code: country, username: "never-kept" } : undefined, properties_hash: { pokemon_language: language } });

describe("summarizeOffers (weekly sync)", () => {
  it("counts offers per language and lists seller countries cheapest first without repeats", () => {
    const summary = summarizeOffers([listing(500, "en", "it"), listing(100, "de", "DE"), listing(300, "en", "DE"), listing(200, "en", "FR")]);
    expect(summary).toEqual({ counts: [3, 1], countries: ["DE", "FR", "IT"] });
  });

  it("counts every listing and keeps at most six countries", () => {
    const many = ["DE", "IT", "FR", "ES", "NL", "PL", "AT"].map((country, index) => listing(100 + index, "en", country));
    expect(summarizeOffers([...many, ...many, ...many, ...many])).toMatchObject({ counts: [28, 0], countries: ["DE", "IT", "FR", "ES", "NL", "PL"] });
  });

  it("ignores malformed country codes, never stores seller identity and returns nothing without listings", () => {
    const summary = summarizeOffers([listing(100, "en", "Germany"), listing(200, "en")]);
    expect(summary).toEqual({ counts: [2, 0], countries: [] });
    expect(JSON.stringify(summary)).not.toContain("never-kept");
    expect(summarizeOffers([])).toBeUndefined();
  });
});

describe("offers in the price file", () => {
  const file = { id: 1, currency: "EUR", slots: new Array(10).fill(""), p: { "7": [100, 0, 0, 0, 0, 0, 0, 0, 0, 0] }, o: { "7": [12, 3] }, c: { "7": "DE,IT" } };

  it("accepts the new keys and still accepts files without them", () => {
    expect(priceFileSchema.safeParse(file).success).toBe(true);
    const old = { id: file.id, currency: file.currency, slots: file.slots, p: file.p };
    expect(priceFileSchema.safeParse(old).success).toBe(true);
    expect(priceFileSchema.safeParse({ ...file, c: { "7": "de;it" } }).success).toBe(false);
  });

  it("reads the count for the card's language", async () => {
    const catalog = new CardTraderCatalog(async (name) => {
      if (name === "index.json") return { "en:base1": 1, "de:base1": 1 };
      if (name === "expansions/1.json") return { id: 1, code: "bs", name: "Base Set", blueprints: [{ id: 7, n: "001", name: "Alakazam" }] };
      return file;
    });
    const match = await catalog.blueprint("en", "base1", "1");
    expect(match).toBeDefined();
    await expect(catalog.offers(match!, "en")).resolves.toEqual({ count: 12, countries: ["DE", "IT"] });
    await expect(catalog.offers(match!, "de")).resolves.toEqual({ count: 3, countries: ["DE", "IT"] });
  });
});
