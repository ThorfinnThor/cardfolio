import { cardForNumber, type QuickAddToken } from "@/domain/quick-add";
import type { CardLanguage, CardSnapshot, CatalogAdapter, CatalogSearchItem } from "@/domain/types";
import type { CatalogSetIndexEntry } from "@/domain/catalog-set";

import { catalogSetIndex, searchCatalogSets } from "./set-counts";

const PAGE_SIZE = 100;
const MAX_PAGES = 20;
const CONCURRENCY = 6;

export interface ResolvedNumber {
  token: QuickAddToken;
  card?: CardSnapshot;
  problem?: "not-found" | "error";
}

/** Every card of one set in one language, as the catalogue lists it (a few requests, not one per card). */
export async function loadSetItems(catalog: CatalogAdapter, language: CardLanguage, setId: string, signal?: AbortSignal): Promise<CatalogSearchItem[]> {
  const items = new Map<string, CatalogSearchItem>();
  let page = 1;
  let hasMore = true;
  while (hasMore && page <= MAX_PAGES) {
    const result = await catalog.search({ language, setId, page, pageSize: PAGE_SIZE }, signal);
    for (const item of result.items) {
      const inSet = item.setId === setId || item.ref.id.startsWith(`${setId}-`);
      if (inSet && item.ref.language === language) items.set(item.ref.id, item);
    }
    hasMore = result.hasMore;
    page += 1;
  }
  return [...items.values()];
}

/** Looks up the cards behind typed collector numbers: one set listing, then one card request per found number. */
export async function resolveNumbers(catalog: CatalogAdapter, language: CardLanguage, setId: string, tokens: readonly QuickAddToken[], signal?: AbortSignal): Promise<ResolvedNumber[]> {
  const items = await loadSetItems(catalog, language, setId, signal);
  const results: ResolvedNumber[] = tokens.map((token) => ({ token }));
  const queue = results.map((result, index) => ({ result, item: cardForNumber(items, result.token.number), index }));
  for (const entry of queue) if (!entry.item) entry.result.problem = "not-found";
  const work = queue.filter((entry) => entry.item);
  let next = 0;
  async function worker() {
    while (next < work.length) {
      const { result, item } = work[next++]!;
      if (signal?.aborted) return;
      try {
        const card = await catalog.getCard(item!.ref, signal);
        if (card.physicalStatus === "digital" || card.setId !== setId || card.ref.language !== language) result.problem = "not-found";
        else result.card = card;
      } catch {
        result.problem = "error";
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, work.length) }, worker));
  return results;
}

function normalized(value: string): string {
  return value.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLocaleLowerCase("de-DE").replace(/[^a-z0-9]+/g, " ").trim();
}

/** The set a pasted line names: by catalogue id, by exact name, or by a search that finds exactly one set. */
export function findSetByText(text: string, language: CardLanguage): { entry?: CatalogSetIndexEntry; candidates: CatalogSetIndexEntry[] } {
  const wanted = text.trim();
  if (!wanted) return { candidates: [] };
  const byId = catalogSetIndex().find((entry) => entry.id.toLowerCase() === wanted.toLowerCase());
  if (byId) return { entry: byId, candidates: [] };
  const byName = catalogSetIndex().filter((entry) => Object.values(entry.names).some((name) => name && normalized(name) === normalized(wanted)));
  if (byName.length === 1) return { entry: byName[0], candidates: [] };
  const found = searchCatalogSets(wanted, language);
  if (found.length === 1) return { entry: found[0], candidates: [] };
  return { candidates: found.slice(0, 5) };
}
