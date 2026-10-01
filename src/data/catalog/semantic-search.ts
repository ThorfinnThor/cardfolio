import { z } from "zod";

import { inferredCardImageBaseUrl } from "@/data/catalog/images";
import { collectorTotalForSearchItem } from "@/data/catalog/set-counts";
import {
  SEMANTIC_TAGS,
  type SemanticSearchIndex,
  type SemanticSearchResult,
} from "@/domain/semantic-card-search";
import type { CatalogSearchItem } from "@/domain/types";

const semanticTagSchema = z.enum(SEMANTIC_TAGS);
const semanticCardRowSchema = z.tuple([
  z.string().min(1),
  z.number().int().nonnegative().max(2 ** SEMANTIC_TAGS.length - 1),
  z.string(),
  z.string().min(1),
  z.string().min(1),
  z.string().min(1),
  z.string().min(1),
  z.string().min(1),
]);

export const semanticSearchIndexSchema = z.object({
  version: z.literal(1),
  source: z.string().min(1),
  generatedAt: z.iso.date(),
  tags: z.array(semanticTagSchema).length(SEMANTIC_TAGS.length).refine(
    (tags) => tags.every((tag, index) => tag === SEMANTIC_TAGS[index]),
    "Die Reihenfolge der semantischen Tags stimmt nicht mit Version 1 überein.",
  ),
  cards: z.array(semanticCardRowSchema),
});

export async function loadSemanticSearchIndex(signal?: AbortSignal): Promise<SemanticSearchIndex> {
  const response = await fetch("/data/semantic/card-artwork-search-v1.json", {
    signal,
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Motivindex konnte nicht geladen werden (HTTP ${response.status}).`);
  return semanticSearchIndexSchema.parse(await response.json());
}

export function semanticResultToCatalogItem(result: SemanticSearchResult): CatalogSearchItem {
  const [id, , , name, collectorNumber, setId, setName, seriesId] = result.row;
  return {
    ref: { provider: "tcgdex", id, language: "en" },
    name,
    collectorNumber,
    collectorTotal: collectorTotalForSearchItem("en", id, collectorNumber),
    imageBaseUrl: inferredCardImageBaseUrl("en", seriesId, setId, collectorNumber),
    setId,
    setName,
  };
}
