import { describe, expect, it } from "vitest";

import {
  exactExpansionMatches,
  normalizeSetName,
  rankExpansionSuggestions,
} from "../../../scripts/cardtrader-set-matching.mjs";

const expansions = [
  { id: 1, code: "base1", name: "Base Set" },
  { id: 2, code: "neo1", name: "Neo Genesis" },
  { id: 3, code: "swsh12", name: "Silver Tempest" },
];

describe("CardTrader set matching", () => {
  it("normalizes punctuation and accents", () => {
    expect(normalizeSetName("Pokémon: McDonald's")).toBe("pokemon mcdonald s");
  });

  it("uses a cross-language TCGdex name without auto-verifying it", () => {
    expect(exactExpansionMatches(["Grundset", "Base Set"], expansions))
      .toEqual([expansions[0]]);
  });

  it("does not treat a potentially colliding set code as a match", () => {
    expect(exactExpansionMatches(["Grundset"], expansions)).toEqual([]);
  });

  it("ranks fuzzy candidates but omits unrelated expansions", () => {
    expect(rankExpansionSuggestions(["Neo Genesis Set"], expansions)).toEqual([{
      id: "2",
      code: "neo1",
      name: "Neo Genesis",
      score: 0.857,
      matchedAgainst: "Neo Genesis Set",
    }]);
  });

  it("does not suggest a similarly named set from a different year", () => {
    expect(rankExpansionSuggestions(["McDonald's Collection 2021"], [
      { id: 9, code: "mc11", name: "McDonald's Collection 2011" },
    ])).toEqual([]);
  });
});
