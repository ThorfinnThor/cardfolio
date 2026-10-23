import { z } from "zod";

import { GIFT_COLLECTION_PRESETS } from "@/domain/gift-collections";
import type { CatalogSearchItem } from "@/domain/types";

const cardIdSchema = z.string().regex(/^[A-Za-z0-9._-]{1,40}$/);

export const curatedCollectionsSchema = z.object({
  version: z.literal(1),
  generatedAt: z.iso.date(),
  collections: z.record(z.string().regex(/^[a-z0-9-]{1,40}$/), z.array(cardIdSchema).min(9).max(400)),
});

export type CuratedCollections = z.infer<typeof curatedCollectionsSchema>;

let cached: Promise<CuratedCollections> | undefined;

export async function loadCuratedCollections(signal?: AbortSignal): Promise<CuratedCollections> {
  cached ??= fetch("/data/semantic/curated-collections-v1.json", { signal, credentials: "same-origin", headers: { Accept: "application/json" } })
    .then(async (response) => {
      if (!response.ok) throw new Error(`Kartenlisten konnten nicht geladen werden (HTTP ${response.status}).`);
      return curatedCollectionsSchema.parse(await response.json());
    })
    .catch((error: unknown) => {
      cached = undefined;
      throw error;
    });
  return cached;
}

/** The first `limit` cards of a collection, showiest first, as candidates for the gift builder. */
export async function curatedCollectionPool(collectionId: string, limit: number, signal?: AbortSignal): Promise<CatalogSearchItem[]> {
  const preset = GIFT_COLLECTION_PRESETS.find((candidate) => candidate.id === collectionId);
  if (!preset) return [];
  const { collections } = await loadCuratedCollections(signal);
  return (collections[collectionId] ?? []).slice(0, limit).map((id): CatalogSearchItem => ({
    ref: { provider: "tcgdex", id, language: "en" },
    name: preset.label,
    collectorNumber: "",
  }));
}
