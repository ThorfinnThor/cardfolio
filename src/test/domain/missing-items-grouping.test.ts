import { describe, expect, it } from "vitest";

import { groupMissingItemsBySet } from "@/domain/missing-items";
import type { CardLanguage, MissingItem } from "@/domain/types";

function missingItem(setId: string, setName: string, number: string, language: CardLanguage = "en", quantity = 1): MissingItem {
  const id = `${setId}-${number}`;
  return {
    identityKey: `${language}:${id}`,
    card: {
      key: `tcgdex:${id}:${language}`,
      ref: { provider: "tcgdex", id, language },
      name: `Card ${number}`,
      setId,
      setName,
      collectorNumber: number,
      physicalStatus: "physical",
      fetchedAt: "2026-10-04T00:00:00.000Z",
    },
    variant: { finish: "normal", edition: "unlimited", printing: "shadowed" },
    preferences: { minimumCondition: "any" },
    quantity,
    entryIds: [`entry-${language}-${id}`],
  };
}

describe("missing item set grouping", () => {
  it("groups by set and language and sorts collector numbers naturally", () => {
    const groups = groupMissingItemsBySet([
      missingItem("z1", "Zeta", "10"),
      missingItem("a1", "Alpha", "101"),
      missingItem("a1", "Alpha", "2", "en", 2),
      missingItem("a1", "Alpha", "10"),
      missingItem("a1", "Alpha", "2", "de"),
      missingItem("a1", "Alpha", "SV001"),
    ]);

    expect(groups.map((group) => group.key)).toEqual(["de:a1", "en:a1", "en:z1"]);
    expect(groups[1].items.map((item) => item.card.collectorNumber)).toEqual(["2", "10", "101", "SV001"]);
    expect(groups[1]).toMatchObject({ positionCount: 4, quantity: 5 });
  });
});
