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
    expect(exactExpansionMatches(["Grundset", "Base Set"], "different-code", expansions))
      .toEqual([expansions[0]]);
  });

  it("accepts an exact set-code candidate for manual review", () => {
    expect(exactExpansionMatches(["Grundset"], "base1", expansions)).toEqual([expansions[0]]);
  });

  it("ranks fuzzy candidates but omits unrelated expansions", () => {
    expect(rankExpansionSuggestions(["Neo Genesis Set"], "unknown", expansions)).toEqual([{
      id: "2",
      code: "neo1",
      name: "Neo Genesis",
      score: 0.857,
      matchedAgainst: "Neo Genesis Set",
    }]);
  });
});
