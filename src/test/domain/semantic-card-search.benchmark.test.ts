import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { semanticSearchIndexSchema } from "@/data/catalog/semantic-search";
import {
  decodeSemanticTags,
  normalizeSemanticText,
  searchSemanticCards,
  type SemanticCardRow,
} from "@/domain/semantic-card-search";

interface EvaluationQuery {
  query: string;
  tagGroups?: string[][];
  captionGroups?: string[][];
  minimumRelevant?: number;
}

const lexicalStopWords = new Set([
  "a", "an", "and", "at", "in", "near", "of", "on", "the", "with", "pokemon", "under", "against",
]);

function containsWhole(text: string, term: string): boolean {
  return ` ${text} `.includes(` ${normalizeSemanticText(term)} `);
}

function isRelevant(row: SemanticCardRow, query: EvaluationQuery): boolean {
  const tags = new Set(decodeSemanticTags(row[1]));
  const caption = normalizeSemanticText(row[2]);
  return (query.tagGroups ?? []).every((group) => group.some((tag) => tags.has(tag as never)))
    && (query.captionGroups ?? []).every((group) => group.some((term) => containsWhole(caption, term)));
}

function lexicalResults(cards: readonly SemanticCardRow[], query: string, limit: number): SemanticCardRow[] {
  const terms = normalizeSemanticText(query).split(" ").filter((term) => term && !lexicalStopWords.has(term));
  if (!terms.length) return [];
  return cards.filter((row) => {
    const identity = normalizeSemanticText(`${row[3]} ${row[4]} ${row[6]}`);
    return terms.every((term) => containsWhole(identity, term));
  }).slice(0, limit);
}

describe("semantic artwork-search benchmark", () => {
  it("keeps 50 predeclared motif queries materially ahead of identity-only lexical search", async () => {
    const indexPath = resolve(process.cwd(), "public/data/semantic/card-artwork-search-v1.json");
    const evaluationPath = resolve(process.cwd(), "data/semantic/search-evaluation-v1.json");
    const index = semanticSearchIndexSchema.parse(JSON.parse(await readFile(indexPath, "utf8")));
    const evaluation = JSON.parse(await readFile(evaluationPath, "utf8")) as { limit: number; queries: EvaluationQuery[] };
    expect(evaluation.queries).toHaveLength(50);

    let semanticRelevant = 0;
    let lexicalRelevant = 0;
    const shortfalls: string[] = [];
    for (const query of evaluation.queries) {
      const semantic = searchSemanticCards(index, query.query, { limit: evaluation.limit }).results;
      const semanticMatches = semantic.filter((result) => isRelevant(result.row, query)).length;
      const lexicalMatches = lexicalResults(index.cards, query.query, evaluation.limit)
        .filter((row) => isRelevant(row, query)).length;
      semanticRelevant += semanticMatches;
      lexicalRelevant += lexicalMatches;
      const minimum = query.minimumRelevant ?? evaluation.limit;
      if (semanticMatches < minimum) shortfalls.push(`${query.query}: ${semanticMatches}/${minimum}`);
    }

    expect(shortfalls).toEqual([]);
    expect(semanticRelevant).toBeGreaterThanOrEqual(375);
    expect(semanticRelevant).toBeGreaterThan(lexicalRelevant + 300);
  });
});
