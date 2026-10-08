import { describe, expect, it } from "vitest";

import { buildBlueprintIdAudit } from "../../../scripts/cardtrader-blueprint-id-audit.mjs";

describe("CardTrader blueprint external ID audit", () => {
  it("reports aggregate uniqueness without publishing external IDs or blueprint rows", () => {
    const snapshot = {
      generatedAt: "2026-10-08T00:00:00.000Z",
      summary: { cardCategoryIds: [73], expansionCount: 2, sampledExpansionCount: 2 },
      blueprintsByExpansion: {
        "100": [
          { id: 1, category_id: 73, card_market_ids: ["cm-secret-a"], tcg_player_id: "tcg-secret-shared" },
          { id: 2, category_id: 73, card_market_ids: ["cm-secret-b", "cm-secret-shared"], tcg_player_id: "tcg-secret-shared" },
          { id: 99, category_id: 10, card_market_ids: ["not-a-single"] },
        ],
        "200": [
          { id: 3, category_id: 73, card_market_ids: ["cm-secret-shared"] },
          { id: 4, category_id: 73, card_market_ids: [""], tcg_player_id: { invalid: true } },
        ],
      },
    };
    const review = { mappings: [{ catalogKey: "en:test", cardtraderExpansionId: "100" }] };

    const audit = buildBlueprintIdAudit(snapshot, review);

    expect(audit.scope).toMatchObject({ fullCatalog: true, verifiedLocaleMappingCount: 1, uniqueVerifiedExpansionCount: 1 });
    expect(audit.allPokemonSingles).toEqual({
      blueprintCount: 4,
      blueprintsWithCardmarketIds: 3,
      blueprintsWithTcgplayerId: 2,
      blueprintsWithBothProviders: 2,
      blueprintsWithNeitherProvider: 1,
      cardmarketIdReferences: 4,
      distinctCardmarketIdValues: 3,
      duplicateCardmarketIdValues: 1,
      blueprintsSharingCardmarketId: 2,
      blueprintsWithUniqueCardmarketId: 2,
      tcgplayerIdReferences: 2,
      distinctTcgplayerIdValues: 1,
      duplicateTcgplayerIdValues: 1,
      blueprintsSharingTcgplayerId: 2,
      blueprintsWithUniqueTcgplayerId: 0,
      blueprintsWithAnyUniqueExternalId: 2,
      invalidBlueprintIdentifiers: 0,
      invalidCardmarketIdReferences: 1,
      invalidTcgplayerIdReferences: 1,
    });
    expect(audit.verifiedExpansions.blueprintCount).toBe(2);
    expect(JSON.stringify(audit)).not.toMatch(/secret|not-a-single/);
    expect(audit.interpretation.featureActivationChanged).toBe(false);
  });

  it("rejects snapshots without a verified Singles category", () => {
    expect(() => buildBlueprintIdAudit({ blueprintsByExpansion: {}, summary: {} }, { mappings: [] }))
      .toThrow("no verified Pokémon Singles category");
  });
});
