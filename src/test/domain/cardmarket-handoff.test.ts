import { describe, expect, it } from "vitest";

import { CARDMARKET_MAX_WANTS_POSITIONS, CARDMARKET_POKEMON_SEARCH_URL, createCardmarketHandoff, createCardmarketSearchUrl } from "@/domain/cardmarket-handoff";
import type { MissingItem } from "@/domain/types";

function missingItem(index = 1, overrides: Partial<MissingItem> = {}): MissingItem {
  return {
    identityKey: `bulbasaur-${index}`,
    card: {
      key: `tcgdex:base1-${index}:en`,
      ref: { provider: "tcgdex", id: `base1-${index}`, language: "en" },
      name: "Bulbasaur",
      setId: "base1",
      setName: "Base Set",
      collectorNumber: String(index).padStart(3, "0"),
      physicalStatus: "physical",
      fetchedAt: "2026-09-27T00:00:00.000Z",
    },
    variant: { finish: "normal", edition: "unlimited", printing: "shadowed" },
    preferences: { minimumCondition: "near-mint" },
    quantity: 2,
    entryIds: [`00000000-0000-4000-8000-${String(index).padStart(12, "0")}`],
    ...overrides,
  };
}

describe("Cardmarket handoff", () => {
  it("keeps the original printing preferences visible and requires review", () => {
    const exported = createCardmarketHandoff([missingItem()]);

    expect(exported.parts[0].text).toBe("2x Bulbasaur | Base Set | Nr. 001 | EN | Normal | Unlimited | Mit Schatten / Standard | Near Mint");
    expect(exported.positionCount).toBe(1);
    expect(exported.totalQuantity).toBe(2);
    expect(exported.reviewRequiredCount).toBe(1);
    expect(exported.parts[0].searches).toHaveLength(1);
    expect(exported.parts[0].searches[0]).toMatchObject({
      label: "2× Bulbasaur",
      details: "Base Set · Nr. 001 · EN",
    });
    expect(exported.warnings.join(" ")).toMatch(/andere Ausgabe oder Illustration/);
    expect(exported.warnings.join(" ")).toMatch(/kein automatisch zuordenbarer Pokémon-Decklistenimport/);
  });

  it("splits by positions rather than card quantity at the official 150-entry limit", () => {
    const items = Array.from({ length: CARDMARKET_MAX_WANTS_POSITIONS + 1 }, (_, index) => missingItem(index + 1, { quantity: 99 }));
    const exported = createCardmarketHandoff(items);

    expect(exported.parts.map((part) => part.positionCount)).toEqual([150, 1]);
    expect(exported.totalQuantity).toBe(151 * 99);
    expect(exported.warnings.join(" ")).toMatch(/in 2 Teile aufgeteilt/);
  });

  it("preserves German names without translating and flattens unsafe line breaks", () => {
    const item = missingItem(44, {
      card: {
        ...missingItem().card,
        key: "tcgdex:base1-44:de",
        ref: { provider: "tcgdex", id: "base1-44", language: "de" },
        name: "Bisa\nsam | Sonderdruck",
        setName: "Basis\rSet",
        collectorNumber: "044",
      },
      variant: { finish: "other", edition: "first-edition", printing: "shadowless", label: "Cosmos | Holo" },
      preferences: { minimumCondition: "lightly-played" },
    });

    expect(createCardmarketHandoff([item]).parts[0].text).toBe(
      "2x Bisa sam Sonderdruck | Basis Set | Nr. 044 | DE | Cosmos Holo | First Edition | Shadowless | Lightly Played",
    );
  });

  it("returns no parts or warnings for an empty handoff", () => {
    expect(createCardmarketHandoff([])).toMatchObject({ parts: [], warnings: [], positionCount: 0, reviewRequiredCount: 0 });
  });

  it("creates a concrete Cardmarket search without losing set or collector number", () => {
    const url = new URL(createCardmarketSearchUrl(missingItem()));

    expect(`${url.origin}${url.pathname}`).toBe(CARDMARKET_POKEMON_SEARCH_URL);
    expect(url.searchParams.get("searchString")).toBe("Bulbasaur Base Set 001");
  });
});
