import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { MOTIF_PICTURES } from "@/components/foundation/gift-motif-pictures";
import { cardImageUrl } from "@/data/catalog/images";
import { isDominantArtworkMatch } from "@/domain/artwork-review";
import { GIFT_COLLECTION_PRESETS } from "@/domain/gift-collections";
import { GIFT_THEME_PRESETS } from "@/domain/gift-theme-presets";
import { artworkReviewIndexSchema, semanticSearchIndexSchema } from "@/data/catalog/semantic-search";

const read = (file: string): unknown => JSON.parse(readFileSync(`public/data/semantic/${file}`, "utf8"));

/** Image base "https://assets.tcgdex.net/en/<series>/<set>/<number>" → the card in the index. */
function cardOf(base: string, rows: ReturnType<typeof semanticSearchIndexSchema.parse>["cards"]) {
  const [, , series, setId, number] = new URL(base).pathname.split("/");
  return rows.find((row) => row[7] === series && row[5] === setId && row[4] === number);
}

describe("motif example pictures", () => {
  const index = semanticSearchIndexSchema.parse(read("card-artwork-search-v1.json"));
  const reviews = artworkReviewIndexSchema.parse(read("gift-theme-reviews-v1.json"));
  const curated = read("curated-collections-v1.json") as { collections: Record<string, string[]> };

  it("exist for every motif, with a different card each", () => {
    const ids = [...GIFT_THEME_PRESETS.map((preset) => preset.id), ...GIFT_COLLECTION_PRESETS.map((preset) => preset.id)];

    expect(Object.keys(MOTIF_PICTURES).sort()).toEqual([...ids].sort());
    expect(new Set(Object.values(MOTIF_PICTURES)).size).toBe(ids.length);
    for (const base of Object.values(MOTIF_PICTURES)) expect(cardImageUrl(base, "low")).toMatch(/^https:\/\/assets\.tcgdex\.net\/en\//);
  });

  it("show a card that really belongs to the motif (reviewed as dominant, or on the curated list)", () => {
    for (const theme of GIFT_THEME_PRESETS) {
      const row = cardOf(MOTIF_PICTURES[theme.id]!, index.cards);
      expect(row, theme.id).toBeDefined();
      expect(isDominantArtworkMatch(reviews, row![0], theme.mappedTags), theme.id).toBe(true);
    }
    for (const preset of GIFT_COLLECTION_PRESETS) {
      const row = cardOf(MOTIF_PICTURES[preset.id]!, index.cards);
      expect(row, preset.id).toBeDefined();
      expect(curated.collections[preset.id], preset.id).toContain(row![0]);
    }
  });
});
