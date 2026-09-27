import type {
  CardLanguage,
  CardRef,
  CardSnapshot,
  CatalogAdapter,
  CatalogQuery,
  CatalogSearchItem,
} from "@/domain/types";
import { makeCardKey } from "@/domain/binder-actions";
import { sameCollectorPart } from "@/domain/catalog-search";

import { tcgdexCardSchema, tcgdexSearchResponseSchema, tcgdexSetSchema } from "./schemas";

const BASE_URL = "https://api.tcgdex.net/v2";
const MAX_ATTEMPTS = 3;
const REQUEST_TIMEOUT_MS = 10_000;

export class CatalogRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "CatalogRequestError";
  }
}

function combineWithTimeout(signal?: AbortSignal): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(new DOMException("Request timed out", "TimeoutError")), REQUEST_TIMEOUT_MS);
  const onAbort = () => controller.abort(signal?.reason);
  signal?.addEventListener("abort", onAbort, { once: true });
  return {
    signal: controller.signal,
    cleanup: () => {
      window.clearTimeout(timeout);
      signal?.removeEventListener("abort", onAbort);
    },
  };
}

function retryDelay(response: Response, attempt: number): number {
  const retryAfter = response.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return Math.min(seconds * 1_000, 5_000);
  }
  return Math.min(250 * 2 ** attempt, 1_000);
}

async function wait(ms: number, signal: AbortSignal): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}

async function fetchJson(url: URL, externalSignal?: AbortSignal): Promise<unknown> {
  const request = combineWithTimeout(externalSignal);
  try {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      const response = await fetch(url, {
        signal: request.signal,
        credentials: "omit",
        headers: { Accept: "application/json" },
      });
      if (response.ok) return response.json();
      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable || attempt === MAX_ATTEMPTS - 1) {
        throw new CatalogRequestError(`TCGdex request failed with HTTP ${response.status}.`, response.status);
      }
      await wait(retryDelay(response, attempt), request.signal);
    }
    throw new CatalogRequestError("TCGdex request failed.");
  } finally {
    request.cleanup();
  }
}

function category(value?: string): CardSnapshot["category"] {
  switch (value?.toLowerCase()) {
    case "pokemon":
      return "pokemon";
    case "trainer":
      return "trainer";
    case "energy":
      return "energy";
    default:
      return value ? "other" : undefined;
  }
}

export class TCGdexCatalogAdapter implements CatalogAdapter {
  async search(
    query: CatalogQuery,
    signal?: AbortSignal,
  ): Promise<{ items: CatalogSearchItem[]; hasMore: boolean }> {
    const url = new URL(`${BASE_URL}/${query.language}/cards`);
    if (query.name?.trim()) url.searchParams.set("name", query.name.trim());
    if (query.setId?.trim()) url.searchParams.set("set.id", query.setId.trim());
    if (query.collectorNumber?.trim()) url.searchParams.set("localId", query.collectorNumber.trim());
    url.searchParams.set("pagination:page", String(query.page));
    url.searchParams.set("pagination:itemsPerPage", String(query.pageSize));

    const raw = tcgdexSearchResponseSchema.parse(await fetchJson(url, signal));
    const collectorNumber = query.collectorNumber;
    const collectorTotal = query.collectorTotal;
    const exactNumberItems = collectorNumber
      ? raw.filter((item) => sameCollectorPart(item.localId, collectorNumber))
      : raw;
    let items: CatalogSearchItem[];
    if (collectorTotal) {
      const hydratedItems = await Promise.all(exactNumberItems.map(async (item) => {
        const cardUrl = new URL(`${BASE_URL}/${query.language}/cards/${encodeURIComponent(item.id)}`);
        const card = tcgdexCardSchema.parse(await fetchJson(cardUrl, signal));
        const officialTotal = card.set.cardCount?.official;
        if (officialTotal === undefined || !sameCollectorPart(String(officialTotal), collectorTotal)) {
          return undefined;
        }
        return {
          ref: { provider: "tcgdex" as const, id: item.id, language: query.language },
          name: item.name,
          collectorNumber: item.localId,
          collectorTotal: String(officialTotal),
          imageBaseUrl: item.image,
        };
      }));
      items = hydratedItems.filter((item): item is NonNullable<typeof item> => item !== undefined);
    } else {
      items = exactNumberItems.map((item) => ({
        ref: { provider: "tcgdex" as const, id: item.id, language: query.language },
        name: item.name,
        collectorNumber: item.localId,
        imageBaseUrl: item.image,
      }));
    }
    return {
      items,
      hasMore: raw.length === query.pageSize,
    };
  }

  async getCard(ref: CardRef, signal?: AbortSignal): Promise<CardSnapshot> {
    const cardUrl = new URL(`${BASE_URL}/${ref.language}/cards/${encodeURIComponent(ref.id)}`);
    const card = tcgdexCardSchema.parse(await fetchJson(cardUrl, signal));
    const setUrl = new URL(`${BASE_URL}/${ref.language}/sets/${encodeURIComponent(card.set.id)}`);
    const set = tcgdexSetSchema.parse(await fetchJson(setUrl, signal));
    return {
      key: makeCardKey(ref),
      ref: { ...ref },
      name: card.name,
      setId: card.set.id,
      setName: card.set.name,
      collectorNumber: card.localId,
      collectorTotal: card.set.cardCount?.official === undefined ? undefined : String(card.set.cardCount.official),
      imageBaseUrl: card.image,
      category: category(card.category),
      physicalStatus: set.serie?.id === "tcgp" ? "digital" : set.serie ? "physical" : "unknown",
      fetchedAt: new Date().toISOString(),
    };
  }
}

export function catalogQueryKey(query: CatalogQuery): readonly unknown[] {
  return [
    "tcgdex",
    query.language,
    query.name?.trim() ?? "",
    query.setId?.trim() ?? "",
    query.collectorNumber?.trim() ?? "",
    query.collectorTotal?.trim() ?? "",
    query.page,
    query.pageSize,
  ] as const;
}

export function detailQueryKey(language: CardLanguage, id: string): readonly unknown[] {
  return ["tcgdex-card", language, id] as const;
}
