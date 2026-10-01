import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { semanticResultToCatalogItem, semanticSearchIndexSchema } from "@/data/catalog/semantic-search";

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
});
