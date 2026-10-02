import semanticIndexData from "../../../public/data/semantic/card-artwork-search-v1.json";
import { describe, expect, it } from "vitest";

import { reviewThemeQueueLimit, sampleTheme } from "@/components/foundation/ArtworkReviewWorkspace";
import { semanticSearchIndexSchema } from "@/data/catalog/semantic-search";
import { setMetadataForSearchItem } from "@/data/catalog/set-counts";
import { artworkReviewKey, type ArtworkReviewRecord } from "@/domain/artwork-review";
import { GIFT_THEME_PRESETS } from "@/domain/gift-theme-presets";

function isRecentFullArt(row: ReturnType<typeof sampleTheme>[number]["row"]): boolean {
  if (!new Set(["me", "sv"]).has(row[7]) || !/^\d+$/.test(row[4])) return false;
  const set = setMetadataForSearchItem("en", row[0], row[4]);
  return Boolean(set && set.cardCount.official > 0 && Number(row[4]) > set.cardCount.official);
}

describe("ArtworkReviewWorkspace candidate sampling", () => {
  const index = semanticSearchIndexSchema.parse(semanticIndexData);

  it.each(GIFT_THEME_PRESETS)("prioritizes recent full arts for $label", (theme) => {
    const visibleQueue = sampleTheme(index, theme).slice(0, 20);

    expect(visibleQueue).toHaveLength(20);
    expect(new Set(visibleQueue.map((item) => item.row[0])).size).toBe(20);
    expect(visibleQueue.filter((item) => isRecentFullArt(item.row)).length).toBeGreaterThanOrEqual(10);
    expect(new Set(visibleQueue.map((item) => item.row[5])).size).toBeGreaterThanOrEqual(6);
  });

  it("opens a targeted reserve round when the first 20 lack dominant coverage", () => {
    const theme = GIFT_THEME_PRESETS.find((candidate) => candidate.id === "city");
    expect(theme).toBeDefined();
    const pool = sampleTheme(index, theme!);
    const reviews = new Map<string, ArtworkReviewRecord>(pool.slice(0, 20).map((item) => {
      const review: ArtworkReviewRecord = { cardId: item.row[0], tag: item.tag, verdict: "incorrect", reviewedAt: "2026-10-02T00:00:00.000Z" };
      return [artworkReviewKey(review.cardId, review.tag), review];
    }));

    expect(reviewThemeQueueLimit("city", pool, reviews)).toBe(40);

    const readyReviews = new Map(reviews);
    pool.slice(0, 9).forEach((item) => {
      const key = artworkReviewKey(item.row[0], item.tag);
      readyReviews.set(key, { ...readyReviews.get(key)!, verdict: "dominant" });
    });
    expect(reviewThemeQueueLimit("city", pool, readyReviews)).toBe(20);
  });

});
