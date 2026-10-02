import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  artworkReviewIndexSchema,
  loadSemanticSearchIndex,
  LocalStaticSmartSearchAdapter,
  semanticResultToCatalogItem,
  semanticSearchIndexSchema,
} from "@/data/catalog/semantic-search";
import { GIFT_THEME_PRESETS } from "@/domain/gift-theme-presets";
import { SEMANTIC_TAGS, type SemanticSearchIndex } from "@/domain/semantic-card-search";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("semantic search index adapter", () => {
  it("validates the complete shipped public index", async () => {
    const file = resolve(process.cwd(), "public/data/semantic/card-artwork-search-v1.json");
    const parsed = semanticSearchIndexSchema.parse(JSON.parse(await readFile(file, "utf8")));

    expect(parsed.tags).toHaveLength(23);
    expect(parsed.cards).toHaveLength(19_635);
    expect(new Set(parsed.cards.map((row) => row[0])).size).toBe(parsed.cards.length);
  });

  it("validates the shipped curated artwork-review index and provenance", async () => {
    const file = resolve(process.cwd(), "public/data/semantic/gift-theme-reviews-v1.json");
    const parsed = artworkReviewIndexSchema.parse(JSON.parse(await readFile(file, "utf8")));
    expect(parsed.reviews).toHaveLength(428);
    expect(parsed.reviews.filter((review) => review.verdict === "dominant")).toHaveLength(146);
    expect(parsed.reviews.filter((review) => review.verdict === "secondary")).toHaveLength(63);
    expect(parsed.reviews.filter((review) => review.verdict === "incorrect")).toHaveLength(182);
    expect(parsed.reviews.filter((review) => review.verdict === "unsure")).toHaveLength(37);
    expect(parsed.reviews.filter((review) => review.source === "ai-assisted")).toHaveLength(100);
    expect(parsed.reviews.filter((review) => review.source === "human")).toHaveLength(328);
    for (const theme of GIFT_THEME_PRESETS) {
      const dominantCards = new Set(parsed.reviews
        .filter((review) => review.verdict === "dominant" && theme.mappedTags.includes(review.tag))
        .map((review) => review.cardId));
      expect(dominantCards.size, theme.label).toBeGreaterThanOrEqual(9);
    }
  });

  it("turns an index hit into an English TCGdex search result without fetching", () => {
    const item = semanticResultToCatalogItem({
      row: ["base1-4", 1, "Artwork at a beach.", "Charizard", "4", "base1", "Base Set", "base"],
      score: 100,
      tags: ["beach"],
    });

    expect(item).toMatchObject({
      ref: { provider: "tcgdex", id: "base1-4", language: "en" },
      name: "Charizard",
      collectorNumber: "4",
      collectorTotal: "102",
      setId: "base1",
      setName: "Base Set",
      imageBaseUrl: "https://assets.tcgdex.net/en/base/base1/4",
    });
  });

  it("implements the provider-neutral contract with the requested target language", async () => {
    const forestMask = 2 ** SEMANTIC_TAGS.indexOf("forest");
    const index: SemanticSearchIndex = {
      version: 1,
      source: "test",
      generatedAt: "2026-10-01",
      tags: SEMANTIC_TAGS,
      cards: [["base1-1", forestMask, "A Pokémon stands in a forest.", "Alakazam", "1", "base1", "Base Set", "base"]],
    };
    const adapter = new LocalStaticSmartSearchAdapter(async () => index);

    await expect(adapter.search({ text: "Wald", language: "de", limit: 8 })).resolves.toEqual([
      expect.objectContaining({
        ref: { provider: "tcgdex", id: "base1-1", language: "de" },
        reasonCode: "semantic",
      }),
    ]);
  });

  it("keeps broad search automatic but gates Gift themes to visually reviewed dominant motifs", async () => {
    const snowMask = 2 ** SEMANTIC_TAGS.indexOf("snow-ice");
    const index: SemanticSearchIndex = {
      version: 1,
      source: "test",
      generatedAt: "2026-10-01",
      tags: SEMANTIC_TAGS,
      cards: [
        ["dominant", snowMask, "Snow fills the artwork.", "Snow card", "1", "set", "Set", "series"],
        ["background", snowMask, "A snowy mountain is far behind.", "Background card", "2", "set", "Set", "series"],
      ],
    };
    const adapter = new LocalStaticSmartSearchAdapter(async () => index, async () => ({
      version: 1,
      generatedAt: "2026-10-02T10:00:00.000Z",
      reviews: [
        { cardId: "dominant", tag: "snow-ice", verdict: "dominant", reviewedAt: "2026-10-02T10:00:00.000Z" },
        { cardId: "background", tag: "snow-ice", verdict: "secondary", reviewedAt: "2026-10-02T10:00:00.000Z" },
      ],
    }));

    await expect(adapter.search({ text: "Schnee", language: "en", limit: 9 })).resolves.toHaveLength(2);
    await expect(adapter.search({ text: "Schnee", language: "en", limit: 9, matchQuality: "dominant" })).resolves.toEqual([
      expect.objectContaining({ ref: expect.objectContaining({ id: "dominant" }), reasonCode: "curated-reviewed" }),
    ]);
  });

  it("aborts a hanging index request after the configured timeout", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn((_url: string, init?: RequestInit) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(init.signal?.reason), { once: true });
    })));

    const request = loadSemanticSearchIndex(undefined, 25);
    const expectation = expect(request).rejects.toMatchObject({ name: "TimeoutError" });
    await vi.advanceTimersByTimeAsync(25);
    await expectation;
  });
});
