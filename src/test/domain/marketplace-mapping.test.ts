import { describe, expect, it } from "vitest";

import { mapMarketplaceCard } from "@/domain/marketplace-mapping";
import type { MarketplaceBlueprint, MarketplaceCardIdentity } from "@/domain/marketplace-provider";

const identity: MarketplaceCardIdentity = {
  cardKey: "tcgdex:base1-4:en",
  name: "Charizard",
  setId: "base1",
  setNames: ["Base Set"],
  collectorNumber: "004",
  externalIds: { tcgplayer: ["123"] },
};

function blueprint(overrides: Partial<MarketplaceBlueprint> = {}): MarketplaceBlueprint {
  return {
    provider: "cardtrader",
    providerBlueprintId: "700",
    providerGameId: "5",
    providerCategoryId: "9",
    providerExpansionId: "42",
    name: "Charizard",
    editableProperties: [{
      name: "collector_number",
      valueType: "string",
      defaultValue: "4",
      possibleValues: [],
    }],
    externalIds: { tcgplayer: ["123"] },
    ...overrides,
  };
}

describe("provider-neutral marketplace mapping", () => {
  it("verifies one unique direct external ID", () => {
    const result = mapMarketplaceCard("cardtrader", identity, [blueprint()], { "42": "Base Set" });
    expect(result.status).toBe("verified");
    expect(result.method).toBe("direct-external-id");
  });

  it("keeps an exact set, number and name match in review", () => {
    const result = mapMarketplaceCard(
      "cardtrader",
      { ...identity, externalIds: undefined },
      [blueprint({ externalIds: {} })],
      { "42": "Base Set" },
    );
    expect(result.status).toBe("review-required");
    expect(result.method).toBe("set-number-name");
  });

  it("never chooses between multiple matching blueprints", () => {
    const result = mapMarketplaceCard("cardtrader", identity, [
      blueprint(),
      blueprint({ providerBlueprintId: "701" }),
    ], { "42": "Base Set" });
    expect(result.status).toBe("ambiguous");
    expect(result.candidateBlueprintIds).toEqual(["700", "701"]);
  });

  it("does not compare identifiers across provider namespaces", () => {
    const result = mapMarketplaceCard("cardtrader", identity, [
      blueprint({ externalIds: { cardmarket: ["123"] } }),
    ], { "42": "Base Set" });
    expect(result.status).toBe("review-required");
    expect(result.method).toBe("set-number-name");
  });
});
