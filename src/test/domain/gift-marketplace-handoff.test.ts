import { describe, expect, it } from "vitest";

import { TCGPLAYER_PRINTING_MAPPINGS } from "@/data/marketplace/tcgplayer-printing-mappings";
import { TCGPLAYER_SET_MAPPINGS } from "@/data/marketplace/tcgplayer-set-mappings";
import { createGiftMarketplaceHandoff } from "@/domain/gift-marketplace-handoff";
import type { MissingItem } from "@/domain/types";

const item: MissingItem = {
  identityKey: "bulbasaur-base-set",
  card: {
    key: "tcgdex:base1-44:en",
    ref: { provider: "tcgdex", id: "base1-44", language: "en" },
    name: "Bulbasaur",
    setId: "base1",
    setName: "Base Set",
    collectorNumber: "044",
    collectorTotal: "102",
    category: "pokemon",
    abilities: [],
    attacks: ["Leech Seed"],
    physicalStatus: "physical",
    fetchedAt: "2026-10-01T00:00:00.000Z",
  },
  variant: { finish: "normal", edition: "unlimited", printing: "shadowed" },
  preferences: { minimumCondition: "excellent" },
  quantity: 1,
  entryIds: ["00000000-0000-4000-8000-000000000001"],
};

describe("Gift marketplace handoff reuse", () => {
  it("reuses the verified TCGplayer exporter without changing ownership", () => {
    const handoff = createGiftMarketplaceHandoff("tcgplayer", [item], {
      setMappings: TCGPLAYER_SET_MAPPINGS,
      printingMappings: TCGPLAYER_PRINTING_MAPPINGS,
    });
    expect(handoff.documents[0].text).toBe("1 Bulbasaur [BS] 044/102");
    expect(handoff.externalUrl).toContain("tcgplayer.com/massentry");
    expect(handoff.readyCount).toBe(1);
    expect(handoff.ownershipEffect).toBe("none");
    expect(item.entryIds).toEqual(["00000000-0000-4000-8000-000000000001"]);
  });

  it("reuses the Cardmarket review format and preserves a separate external purchase", () => {
    const handoff = createGiftMarketplaceHandoff("cardmarket", [item]);
    expect(handoff.documents[0].text).toBe("1x Bulbasaur Leech Seed");
    expect(handoff.externalUrl).toBe("https://www.cardmarket.com/en/Pokemon/Products/Singles");
    expect(handoff.reviewRequiredCount).toBe(1);
    expect(handoff.ownershipEffect).toBe("none");
  });

  it("requires reviewed TCGplayer mappings instead of guessing", () => {
    expect(() => createGiftMarketplaceHandoff("tcgplayer", [item])).toThrow(/mappings are required/i);
  });
});
