import { z } from "zod";

import { inferredCardImageBaseUrl } from "@/data/catalog/images";
import { collectorTotalForSearchItem } from "@/data/catalog/set-counts";
import {
  SEMANTIC_TAGS,
  searchSemanticCards,
  type SmartSearchAdapter,
  type SmartSearchHit,
  type SmartSearchQuery,
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

export const SEMANTIC_INDEX_TIMEOUT_MS = 8_000;

function signalWithTimeout(parent: AbortSignal | undefined, timeoutMs: number): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(new DOMException("Motivindex-Zeitlimit überschritten.", "TimeoutError")),
    timeoutMs,
  );
  const abortFromParent = () => controller.abort(parent?.reason ?? new DOMException("Abgebrochen.", "AbortError"));
  if (parent?.aborted) abortFromParent();
  else parent?.addEventListener("abort", abortFromParent, { once: true });
  return {
    signal: controller.signal,
    cleanup: () => {
      window.clearTimeout(timeout);
      parent?.removeEventListener("abort", abortFromParent);
    },
  };
}

export async function loadSemanticSearchIndex(
  signal?: AbortSignal,
  timeoutMs = SEMANTIC_INDEX_TIMEOUT_MS,
): Promise<SemanticSearchIndex> {
  const request = signalWithTimeout(signal, timeoutMs);
  try {
    const response = await fetch("/data/semantic/card-artwork-search-v1.json", {
      signal: request.signal,
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Motivindex konnte nicht geladen werden (HTTP ${response.status}).`);
    return semanticSearchIndexSchema.parse(await response.json());
  } finally {
    request.cleanup();
  }
}

export class LocalStaticSmartSearchAdapter implements SmartSearchAdapter {
  constructor(
    private readonly loadIndex: (signal?: AbortSignal) => Promise<SemanticSearchIndex> = loadSemanticSearchIndex,
  ) {}

  async search(query: SmartSearchQuery, signal?: AbortSignal): Promise<SmartSearchHit[]> {
    const index = await this.loadIndex(signal);
    const outcome = searchSemanticCards(index, query.text, {
      requiredTags: query.requiredTags,
      limit: query.limit,
    });
    return outcome.results.map((result) => ({
      ref: { provider: "tcgdex" as const, id: result.row[0], language: query.language },
      score: result.score,
      reasonCode: "semantic" as const,
    }));
  }
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
