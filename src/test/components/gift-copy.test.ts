import { describe, expect, it } from "vitest";

import { POPULAR_POKEMON } from "@/components/foundation/gift-copy";
import { cardImageUrl } from "@/data/catalog/images";

describe("popular Pokémon pictures", () => {
  it("point to TCGdex pictures, one card each", () => {
    const bases = POPULAR_POKEMON.map((entry) => entry.image);

    expect(new Set(bases).size).toBe(POPULAR_POKEMON.length);
    for (const base of bases) expect(cardImageUrl(base, "low")).toMatch(/^https:\/\/assets\.tcgdex\.net\/en\/[a-z]+\/[\w.]+\/\d+\/low\.webp$/);
  });
});
