import { describe, expect, it } from "vitest";

import {
  POPULAR_POKEMON,
  chunkIntoPages,
  hasBudgetSlack,
  plainPriceSource,
  plainVariantNote,
  popularPokemonName,
  translatePopularPokemon,
} from "@/components/foundation/gift-copy";

describe("gift copy helpers", () => {
  it("hides the unremarkable default version and names only real differences", () => {
    expect(plainVariantNote({ finish: "normal", edition: "unlimited", printing: "shadowed" })).toBeUndefined();
    expect(plainVariantNote({ finish: "holo", edition: "unlimited", printing: "shadowed" })).toBe("Holo");
    expect(plainVariantNote({ finish: "reverse", edition: "unlimited" })).toBe("Reverse Holo");
    expect(plainVariantNote({ finish: "holo", edition: "first-edition", printing: "shadowless" })).toBe("Holo · 1. Edition · Shadowless");
    expect(plainVariantNote({ finish: "unspecified", edition: "unlimited" })).toBe("Ausführung noch offen");
    expect(plainVariantNote({ finish: "other", edition: "unlimited", label: " Cosmos Holo " })).toBe("Cosmos Holo");
  });

  it("keeps a popular quick pick valid when the card language changes and leaves free text alone", () => {
    expect(translatePopularPokemon("Glurak", "en")).toBe("Charizard");
    expect(translatePopularPokemon("charizard", "de")).toBe("Glurak");
    expect(translatePopularPokemon("Pikachu", "en")).toBe("Pikachu");
    expect(translatePopularPokemon("Taschenlampe", "en")).toBe("Taschenlampe");
    expect(popularPokemonName(POPULAR_POKEMON[2], "de")).toBe("Evoli");
    expect(popularPokemonName(POPULAR_POKEMON[2], "en")).toBe("Eevee");
  });

  it("offers a bounded list of distinct popular Pokémon", () => {
    const names = POPULAR_POKEMON.map((entry) => entry.de);
    expect(new Set(names).size).toBe(names.length);
    expect(POPULAR_POKEMON.length).toBeGreaterThanOrEqual(8);
    expect(POPULAR_POKEMON.length).toBeLessThanOrEqual(12);
  });

  it("flags a proposal that uses well under half of the budget", () => {
    expect(hasBudgetSlack(1282, 10000)).toBe(true);
    expect(hasBudgetSlack(4000, 10000)).toBe(true);
    expect(hasBudgetSlack(4001, 10000)).toBe(false);
    expect(hasBudgetSlack(undefined, 10000)).toBe(false);
    expect(hasBudgetSlack(100, 0)).toBe(false);
  });

  it("names the marketplace behind a price without exposing the data provider", () => {
    expect(plainPriceSource("tcgdex-cardmarket")).toBe("Cardmarket");
    expect(plainPriceSource("tcgdex-tcgplayer")).toBe("TCGplayer");
    expect(plainPriceSource(undefined)).toBeUndefined();
  });

  it("splits a selection into binder pages of nine", () => {
    expect(chunkIntoPages(Array.from({ length: 18 }, (_, index) => index)).map((page) => page.length)).toEqual([9, 9]);
    expect(chunkIntoPages(Array.from({ length: 10 }, (_, index) => index)).map((page) => page.length)).toEqual([9, 1]);
    expect(chunkIntoPages([])).toEqual([]);
  });
});
