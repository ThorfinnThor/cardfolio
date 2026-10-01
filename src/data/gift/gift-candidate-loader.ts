import type { TCGdexGiftCardDetail } from "@/data/catalog/tcgdex";
import { openCardfolioDB, type GiftCandidateCacheRecord } from "@/data/persistence/db";
import type {
  GiftCardCandidate,
  GiftCurrency,
  PriceProvider,
} from "@/domain/gift-builder";
import type {
  CardLanguage,
  CardRef,
  CardSnapshot,
  CatalogAdapter,
  CatalogSearchItem,
  PurchasePreferences,
  VariantSelection,
} from "@/domain/types";

export interface GiftCatalogAdapter extends CatalogAdapter {
  getGiftCardDetail?(ref: CardRef, signal?: AbortSignal): Promise<TCGdexGiftCardDetail>;
}

export interface GiftSubjectPage {
  items: CatalogSearchItem[];
  page: number;
  hasMore: boolean;
}

export interface GiftCandidateHydrationOptions {
  currency: GiftCurrency;
  variantFor(card: CardSnapshot): VariantSelection;
  preferences?: PurchasePreferences;
  printingMatch?(card: CardSnapshot): "verified-printing" | "candidate";
  concurrency?: number;
  cacheTtlMs?: number;
}

const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1_000;

function abortReason(signal?: AbortSignal): unknown {
  return signal?.reason ?? new DOMException("Operation aborted", "AbortError");
}

async function cachedDetail(key: string): Promise<GiftCandidateCacheRecord | undefined> {
  const database = await openCardfolioDB();
  const cached = await database.get("giftCandidateCache", key);
  if (!cached) return undefined;
  if (Date.parse(cached.expiresAt) > Date.now()) return cached;
  await database.delete("giftCandidateCache", key);
  return undefined;
}

async function storeDetail(detail: TCGdexGiftCardDetail, ttlMs: number): Promise<void> {
  const cachedAt = new Date().toISOString();
  const value: GiftCandidateCacheRecord = {
    key: detail.card.key,
    card: detail.card,
    rawPricing: detail.rawPricing,
    releaseYear: detail.releaseYear,
    cachedAt,
    expiresAt: new Date(Date.now() + ttlMs).toISOString(),
  };
  const database = await openCardfolioDB();
  await database.put("giftCandidateCache", value, value.key);
}

export class GiftCandidateLoader {
  constructor(
    private readonly catalog: GiftCatalogAdapter,
    private readonly prices: PriceProvider,
  ) {}

  async loadSubjectPage(input: {
    subjectQuery: string;
    language: CardLanguage;
    page: number;
    pageSize?: number;
  }, signal?: AbortSignal): Promise<GiftSubjectPage> {
    if (signal?.aborted) throw abortReason(signal);
    const pageSize = input.pageSize ?? 24;
    const result = await this.catalog.search({
      name: input.subjectQuery.trim(),
      language: input.language,
      page: input.page,
      pageSize,
    }, signal);
    return { ...result, page: input.page };
  }

  /** Loads a bounded pool of lightweight briefs. It never hydrates details. */
  async loadCandidatePool(input: {
    subjectQuery: string;
    language: CardLanguage;
    maximum?: number;
    pageSize?: number;
  }, signal?: AbortSignal): Promise<CatalogSearchItem[]> {
    const maximum = Math.min(Math.max(input.maximum ?? 60, 1), 80);
    const pageSize = Math.min(input.pageSize ?? 24, maximum);
    const items: CatalogSearchItem[] = [];
    // The catalog adapter may remove a complete Pocket-only API page. Continue
    // across empty physical pages, but keep an explicit upper request bound.
    for (let page = 1; items.length < maximum && page <= 20; page += 1) {
      const result = await this.loadSubjectPage({ ...input, page, pageSize }, signal);
      items.push(...result.items.slice(0, maximum - items.length));
      if (!result.hasMore) break;
    }
    return items;
  }

  /** Hydrates only the explicitly supplied visible/shortlisted briefs. */
  async hydrateCandidates(
    items: readonly CatalogSearchItem[],
    options: GiftCandidateHydrationOptions,
    signal?: AbortSignal,
  ): Promise<GiftCardCandidate[]> {
    const concurrency = Math.min(Math.max(options.concurrency ?? 4, 1), 8);
    const ttl = options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
    const results = new Array<GiftCardCandidate | undefined>(items.length);
    let cursor = 0;
    const worker = async () => {
      while (cursor < items.length) {
        if (signal?.aborted) throw abortReason(signal);
        const index = cursor;
        cursor += 1;
        const brief = items[index];
        const key = `tcgdex:${brief.ref.id}:${brief.ref.language}`;
        const cached = await cachedDetail(key);
        let detail: TCGdexGiftCardDetail;
        if (cached) {
          detail = { card: cached.card, rawPricing: cached.rawPricing, releaseYear: cached.releaseYear };
        } else if (this.catalog.getGiftCardDetail) {
          detail = await this.catalog.getGiftCardDetail(brief.ref, signal);
          await storeDetail(detail, ttl);
        } else {
          detail = { card: await this.catalog.getCard(brief.ref, signal), rawPricing: undefined };
        }
        if (detail.card.physicalStatus === "digital") continue;
        const variant = options.variantFor(detail.card);
        const price = await this.prices.getPrice({
          card: detail.card,
          variant,
          currency: options.currency,
          rawPricing: detail.rawPricing,
          fetchedAt: detail.card.fetchedAt,
          printingMatch: options.printingMatch?.(detail.card) ?? "candidate",
        }, signal);
        results[index] = {
          card: detail.card,
          variant,
          preferences: options.preferences ?? { minimumCondition: "any" },
          releaseYear: detail.releaseYear,
          price,
          reasonTags: [],
        };
      }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
    return results.filter((candidate): candidate is GiftCardCandidate => candidate !== undefined);
  }
}
