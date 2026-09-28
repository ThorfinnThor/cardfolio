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
      category: "pokemon",
      abilities: [],
      attacks: ["Leech Seed"],
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
  it("uses Cardmarket's exact Pokemon decklist format and keeps separate review links", () => {
    const exported = createCardmarketHandoff([missingItem()]);

    expect(exported.parts[0].text).toBe("2x Bulbasaur Leech Seed");
    expect(exported.positionCount).toBe(1);
    expect(exported.importablePositionCount).toBe(1);
    expect(exported.totalQuantity).toBe(2);
    expect(exported.reviewRequiredCount).toBe(1);
    expect(exported.parts[0].searches).toHaveLength(1);
    expect(exported.parts[0].searches[0]).toMatchObject({
      label: "2× Bulbasaur",
      details: "Base Set · Nr. 001 · EN",
    });
    expect(exported.warnings.join(" ")).toMatch(/vollständiger Kartenname, Fähigkeiten und Attacken/);
    expect(exported.warnings.join(" ")).toMatch(/Set, Kartennummer, Sprache und Druckvariante nicht fest/);
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
        abilities: ["Duft | Spore"],
        attacks: ["Ranken\nHieb"],
      },
      variant: { finish: "other", edition: "first-edition", printing: "shadowless", label: "Cosmos | Holo" },
      preferences: { minimumCondition: "lightly-played" },
    });

    expect(createCardmarketHandoff([item]).parts[0].text).toBe("2x Bisa sam Sonderdruck Duft Spore Ranken Hieb");
  });

  it("uses the English catalog identity for German cards because Cardmarket parses that identity reliably", () => {
    const item = missingItem(17, {
      card: {
        ...missingItem().card,
        key: "tcgdex:neo1-17:de",
        ref: { provider: "tcgdex", id: "neo1-17", language: "de" },
        name: "Tornupto",
        setName: "Neo Genesis",
        collectorNumber: "17",
        collectorTotal: "111",
        abilities: [],
        attacks: ["Feueraufladung", "Flammenexplosion"],
        englishIdentity: {
          name: "Typhlosion",
          setName: "Neo Genesis",
          category: "pokemon",
          abilities: [],
          attacks: ["Fire Recharge", "Flame Burst"],
        },
      },
    });

    expect(createCardmarketHandoff([item]).parts[0].text).toBe("2x Typhlosion Fire Recharge Flame Burst");
    expect(new URL(createCardmarketSearchUrl(item)).searchParams.get("searchString")).toBe("Typhlosion Neo Genesis 17/111");
  });

  it("uses Cardmarket's explicit Delta Species and Gold Star product wording", () => {
    const delta = missingItem(12, {
      card: { ...missingItem().card, name: "Typhlosion δ", attacks: ["Shady Move", "Burning Ball"] },
    });
    const goldStar = missingItem(17, {
      card: { ...missingItem().card, name: "Umbreon ☆", attacks: ["Feint Attack", "Dark Ray"] },
    });

    const exported = createCardmarketHandoff([delta, goldStar]);

    expect(exported.parts[0].text).toBe(
      "2x Typhlosion δ Delta Species Shady Move Burning Ball\n2x Umbreon Gold Star Feint Attack Dark Ray",
    );
  });

  it("exports trainers by full name and excludes Pokemon without catalog attack data", () => {
    const trainer = missingItem(1, {
      card: { ...missingItem().card, name: "Scoop Up Net", category: "trainer", abilities: [], attacks: [] },
    });
    const incomplete = missingItem(2, {
      card: { ...missingItem().card, name: "Ivysaur", abilities: undefined, attacks: undefined },
    });

    const exported = createCardmarketHandoff([trainer, incomplete]);

    expect(exported.parts[0].text).toBe("2x Scoop Up Net");
    expect(exported.importablePositionCount).toBe(1);
    expect(exported.excluded).toEqual([expect.objectContaining({ label: expect.stringContaining("Ivysaur") })]);
  });

  it("returns no parts or warnings for an empty handoff", () => {
    expect(createCardmarketHandoff([])).toMatchObject({ parts: [], warnings: [], positionCount: 0, importablePositionCount: 0, reviewRequiredCount: 0 });
  });

  it("creates a concrete Cardmarket search without losing set or collector number", () => {
    const url = new URL(createCardmarketSearchUrl(missingItem()));

    expect(`${url.origin}${url.pathname}`).toBe(CARDMARKET_POKEMON_SEARCH_URL);
    expect(url.searchParams.get("searchString")).toBe("Bulbasaur Base Set 001");
  });
});
