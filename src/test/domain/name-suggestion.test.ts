import { describe, expect, it } from "vitest";

import { suggestNames } from "@/domain/name-suggestion";

const CARDS = ["Pikachu", "Surfendes Pikachu VMAX", "Raichu", "Pichu", "Pikachu V", "Glurak", "Glumanda", "Bisasam"];

describe("name suggestions", () => {
  it("suggests the Pokémon for a typo and not the whole card title", () => {
    expect(suggestNames("Pikatschu", CARDS)[0]).toBe("Pikachu");
    expect(suggestNames("Glurk", CARDS)[0]).toBe("Glurak");
  });

  it("ignores case and accents", () => {
    expect(suggestNames("pikatschu", ["Pikáchu"])[0]).toBe("Pikáchu");
  });

  it("suggests nothing for a correctly spelled name or when nothing is close", () => {
    expect(suggestNames("Pikachu", CARDS)).toEqual([]);
    expect(suggestNames("Xyzzyx", CARDS)).toEqual([]);
    expect(suggestNames("Pik", CARDS)).toEqual([]);
  });

  it("returns each word once, closest first, at most the limit", () => {
    const suggestions = suggestNames("Pickachu", [...CARDS, "Pikachu Libre"], 2);
    expect(suggestions[0]).toBe("Pikachu");
    expect(new Set(suggestions).size).toBe(suggestions.length);
    expect(suggestions.length).toBeLessThanOrEqual(2);
  });
});
