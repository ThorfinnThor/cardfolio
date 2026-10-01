import { describe, expect, it } from "vitest";

import {
  SEMANTIC_TAGS,
  parseSemanticQuery,
  searchSemanticCards,
  type SemanticCardRow,
  type SemanticSearchIndex,
  type SemanticTag,
} from "@/domain/semantic-card-search";

function mask(...tags: SemanticTag[]): number {
  return tags.reduce((value, tag) => value | 2 ** SEMANTIC_TAGS.indexOf(tag), 0);
}

function row(id: string, tags: SemanticTag[], caption: string): SemanticCardRow {
  return [id, mask(...tags), caption, `Card ${id}`, "1", "base1", "Base Set", "base"];
}

const index: SemanticSearchIndex = {
  version: 1,
  source: "test",
  generatedAt: "2026-10-01",
  tags: SEMANTIC_TAGS,
  cards: [
    row("forest", ["forest", "multiple-pokemon"], "Two Pokémon are playing beside a bridge in a forest."),
    row("rain", ["city"], "A Pokémon stands in the rain on a city street."),
    row("terrain", ["mountain-rocks"], "A Pokémon crosses rocky terrain."),
  ],
};

describe("semantic card search", () => {
  it("maps German and English wording to the same frozen tags", () => {
    expect(parseSemanticQuery("Pokémon am Strand bei Nacht").mappedTags).toEqual(["beach", "night"]);
    expect(parseSemanticQuery("auf der Straße").mappedTags).toEqual(["city"]);
    expect(parseSemanticQuery("flying in cloudy skies").mappedTags.toSorted()).toEqual(["flying", "sky-clouds"]);
  });

  it("combines selected chips with free-text caption terms", () => {
    const outcome = searchSemanticCards(index, "playing near a bridge", {
      requiredTags: ["forest", "multiple-pokemon"],
    });
    expect(outcome.results.map((result) => result.row[0])).toEqual(["forest"]);
  });

  it("matches caption terms as whole words and never pads sparse results", () => {
    expect(searchSemanticCards(index, "rain", { limit: 20 }).results.map((result) => result.row[0])).toEqual(["rain"]);
    expect(searchSemanticCards(index, "sleeping", { limit: 20 })).toMatchObject({ total: 0, results: [] });
  });

  it("requires a query or at least one selected tag", () => {
    expect(searchSemanticCards(index, "").results).toEqual([]);
    expect(searchSemanticCards(index, "", { requiredTags: ["city"] }).results.map((result) => result.row[0])).toEqual(["rain"]);
  });
});
