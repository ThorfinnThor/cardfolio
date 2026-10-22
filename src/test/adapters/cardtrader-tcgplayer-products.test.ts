import { describe, expect, it } from "vitest";

import { CardTraderCatalog } from "@/data/cardtrader/catalog";
import { cardtraderTcgplayerLinks, tcgplayerProductUrl } from "@/data/marketplace/cardtrader-tcgplayer-products";
import type { MissingItem } from "@/domain/types";

const FILES: Record<string, unknown> = {
  "index.json": { "en:base1": 1472, "de:base1": 1472 },
  "expansions/1472.json": { id: 1472, code: "bs", name: "Base Set", blueprints: [
    { id: 111151, n: "004", name: "Charizard", tp: 42382 },
    { id: 111207, n: "060", name: "Ponyta" },
  ] },
};
const catalog = () => new CardTraderCatalog(async (file) => { if (!(file in FILES)) throw new Error("404"); return FILES[file]; });

function item(number: string, name: string, quantity: number, language: "en" | "de" = "en"): MissingItem {
  return {
    identityKey: `k${number}${language}`,
    card: { key: `tcgdex:base1-${number}:${language}`, ref: { provider: "tcgdex", id: `base1-${number}`, language }, name, setId: "base1", setName: "Base Set", collectorNumber: number, physicalStatus: "physical", fetchedAt: "2026-10-22T00:00:00.000Z" },
    variant: { finish: "holo", edition: "unlimited", printing: "unspecified" },
    preferences: { minimumCondition: "excellent" },
    quantity,
    entryIds: ["00000000-0000-4000-8000-000000000001"],
  } as MissingItem;
}

describe("direct TCGplayer product pages from CardTrader ids", () => {
  it("builds the product address", () => {
    expect(tcgplayerProductUrl(42382)).toBe("https://www.tcgplayer.com/product/42382");
  });

  it("links only cards whose blueprint carries a TCGplayer id and says when the card is German", async () => {
    const links = await cardtraderTcgplayerLinks([item("4", "Charizard", 2), item("60", "Ponyta", 1), item("9", "Unknown", 1), item("4", "Glurak", 1, "de")], catalog());
    expect(links).toEqual([
      { identityKey: "k4en", label: "2× Charizard", details: "Base Set · Nr. 4", url: "https://www.tcgplayer.com/product/42382" },
      { identityKey: "k4de", label: "1× Glurak", details: "Base Set · Nr. 4 · TCGplayer zeigt die englische Karte", url: "https://www.tcgplayer.com/product/42382" },
    ]);
  });
});
