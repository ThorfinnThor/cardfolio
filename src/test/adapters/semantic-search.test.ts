import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  loadSemanticSearchIndex,
  LocalStaticSmartSearchAdapter,
  semanticResultToCatalogItem,
  semanticSearchIndexSchema,
} from "@/data/catalog/semantic-search";
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
