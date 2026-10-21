import { describe, expect, it } from "vitest";

import { CardTraderCatalog } from "@/data/cardtrader/catalog";
import { cardmarketProductUrl, cardtraderCardmarketMappings } from "@/data/marketplace/cardtrader-cardmarket-products";
import { createCardmarketHandoff } from "@/domain/cardmarket-handoff";
import type { MissingItem } from "@/domain/types";

const FILES: Record<string, unknown> = {
  "index.json": { "en:base1": 1472, "de:base1": 1472 },
  "expansions/1472.json": {
    id: 1472, code: "bs", name: "Base Set",
    blueprints: [
      { id: 111148, n: "001", name: "Alakazam", cm: [273696] },
      { id: 111149, n: "002", name: "Blastoise", cm: [1, 2] },
      { id: 111150, n: "003", name: "Chansey" },
    ],
  },
};
const catalog = () => new CardTraderCatalog(async (file) => { if (!(file in FILES)) throw new Error("404"); return FILES[file]; });

function item(number: string, name: string, language: "en" | "de" = "en"): MissingItem {
  return {
    identityKey: `${language}-${number}`,
    card: { key: `k${number}${language}`, ref: { provider: "tcgdex", id: `base1-${number}`, language }, name, setId: "base1", setName: "Base Set", collectorNumber: number, category: "pokemon", abilities: [], attacks: ["Attack"], physicalStatus: "physical", fetchedAt: "2026-10-21T00:00:00.000Z" },
    variant: { finish: "holo", edition: "unlimited", printing: "unspecified" },
    preferences: { minimumCondition: "excellent" },
    quantity: 1,
    entryIds: ["00000000-0000-4000-8000-000000000001"],
  } as MissingItem;
}

describe("Cardmarket product pages from CardTrader product ids", () => {
  it("builds the product page URL that was checked by hand", () => {
    expect(cardmarketProductUrl(273696)).toBe("https://www.cardmarket.com/en/Pokemon/Products?idProduct=273696");
  });

  it("maps a card with exactly one Cardmarket id and nothing else", async () => {
    const mappings = await cardtraderCardmarketMappings([item("1", "Alakazam"), item("2", "Blastoise"), item("3", "Chansey"), item("9", "Unknown")], { catalog: catalog(), now: "2026-10-21T10:00:00.000Z" });
    expect(mappings).toHaveLength(1);
    expect(mappings[0]).toMatchObject({
      provider: "cardmarket",
      tcgdexCardId: "base1-1",
      status: "verified",
      providerProductId: "273696",
      productUrl: "https://www.cardmarket.com/en/Pokemon/Products?idProduct=273696",
      source: { kind: "provider-external-id" },
      checkedAt: "2026-10-21T10:00:00.000Z",
      verifiedAt: "2026-10-21T10:00:00.000Z",
    });
  });

  it("works for German cards of the same set, once per card, and skips reviewed ones", async () => {
    const german = await cardtraderCardmarketMappings([item("1", "Simsala", "de")], { catalog: catalog() });
    expect(german.map((mapping) => mapping.tcgdexCardId)).toEqual(["base1-1"]);
    const twice = await cardtraderCardmarketMappings([item("1", "Alakazam"), item("1", "Alakazam")], { catalog: catalog() });
    expect(twice).toHaveLength(1);
    expect(await cardtraderCardmarketMappings([item("1", "Alakazam")], { catalog: catalog(), alreadyMapped: new Set(["base1-1"]) })).toEqual([]);
  });

  it("marks the product link in the handoff as coming from a provider id", async () => {
    const items = [item("1", "Alakazam"), item("3", "Chansey")];
    const mappings = await cardtraderCardmarketMappings(items, { catalog: catalog() });
    const handoff = createCardmarketHandoff(items, mappings, { "base1-1": "Alakazam Attack", "base1-3": "Chansey Attack" });
    const products = handoff.parts[0]!.products;
    expect(products[0]).toMatchObject({ productUrl: "https://www.cardmarket.com/en/Pokemon/Products?idProduct=273696", productSource: "provider-id", status: "verified" });
    expect(products[1]?.productUrl).toBeUndefined();
    expect(handoff.verifiedProductCount).toBe(1);
    expect(handoff.searchRequiredCount).toBe(1);
  });
});
