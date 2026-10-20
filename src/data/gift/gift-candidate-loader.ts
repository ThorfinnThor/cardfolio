import type { TCGdexGiftCardDetail } from "@/data/catalog/tcgdex";
import { openCardfolioDB, type GiftCandidateCacheRecord } from "@/data/persistence/db";
import { eraOfSetId, type GiftEra } from "@/domain/gift-era";
import { matchesGiftSubject } from "@/domain/gift-subject";
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
/** Upper bound for how many catalogue briefs are scanned for one Pokémon (briefs are cheap, details are not). */
const MAX_SCAN = 480;
const MAX_SCAN_PAGES = 20;

/** Picks `count` items spread evenly over the list, so a sample covers every era and set instead of the first sets only. */
export function spreadSample<T>(items: readonly T[], count: number): T[] {
  if (items.length <= count) return [...items];
  return Array.from({ length: count }, (_, index) => items[Math.floor((index * items.length) / count)]);
}
const GIFT_CANDIDATE_CACHE_VERSION = 2;

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

async function storeDetail(key: string, detail: TCGdexGiftCardDetail, ttlMs: number): Promise<void> {
  const cachedAt = new Date().toISOString();
  const value: GiftCandidateCacheRecord = {
    key,
    card: detail.card,
    rawPricing: detail.rawPricing,
    releaseYear: detail.releaseYear,
    cachedAt,
    expiresAt: new Date(Date.now() + ttlMs).toISOString(),
  };
  const database = await openCardfolioDB();
  await database.put("giftCandidateCache", value, key);
}

export class GiftCandidateLoader {
  constructor(
    private readonly catalog: GiftCatalogAdapter,
    private readonly prices: PriceProvider,
    /** Optional check for artwork outside TCGdex, used when the catalogue has no image for a card. */
    private readonly alternativeArtwork?: (card: CardSnapshot) => Promise<boolean>,
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

  /** Reads catalogue briefs page by page up to `limit`. The catalogue adapter may remove a complete Pocket-only API page, so empty physical pages are skipped, within an explicit request bound. */
  private async gatherBriefs(input: { subjectQuery: string; language: CardLanguage; pageSize?: number }, limit: number, signal?: AbortSignal): Promise<{ items: CatalogSearchItem[]; complete: boolean }> {
    const pageSize = Math.min(input.pageSize ?? 24, limit);
    const items: CatalogSearchItem[] = [];
    let complete = false;
    for (let page = 1; items.length < limit && page <= MAX_SCAN_PAGES; page += 1) {
      const result = await this.loadSubjectPage({ ...input, page, pageSize }, signal);
      items.push(...result.items.slice(0, limit - items.length));
      if (!result.hasMore) {
        complete = true;
        break;
      }
    }
    return { items, complete };
  }

  /**
   * Loads a bounded pool of lightweight briefs. It never hydrates details.
   * With `scan` the catalogue is read more widely, only briefs whose name is the Pokémon itself are kept,
   * and `maximum` of them are sampled evenly across the whole list.
   */
  async loadCandidatePool(input: {
    subjectQuery: string;
    language: CardLanguage;
    maximum?: number;
    pageSize?: number;
    scan?: number;
    /** Lean the sample towards cards of this era (judged from the set id); the release year decides later. */
    era?: GiftEra;
  }, signal?: AbortSignal): Promise<CatalogSearchItem[]> {
    const maximum = Math.min(Math.max(input.maximum ?? 60, 1), 80);
    if (input.scan === undefined) return (await this.gatherBriefs(input, maximum, signal)).items;
    const scan = Math.min(Math.max(input.scan, maximum), MAX_SCAN);
    const { items } = await this.gatherBriefs(input, scan, signal);
    const relevant = items.filter((item) => matchesGiftSubject({ name: item.name }, input.subjectQuery));
    const ofEra = input.era ? relevant.filter((item) => eraOfSetId(item.setId) === input.era) : relevant;
    const basis = input.era && ofEra.length >= 9 ? ofEra : relevant.length >= maximum ? relevant : items;
    return spreadSample(basis, maximum);
  }

  /** How many cards exist for the Pokémon (whole-word name match). `capped` means more than the scan limit. */
  async countSubjectCards(input: { subjectQuery: string; language: CardLanguage }, signal?: AbortSignal): Promise<{ count: number; capped: boolean }> {
    const { items, complete } = await this.gatherBriefs(input, MAX_SCAN, signal);
    return { count: items.filter((item) => matchesGiftSubject({ name: item.name }, input.subjectQuery)).length, capped: !complete };
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
    const failures: unknown[] = [];
    let cursor = 0;
    const worker = async () => {
      while (cursor < items.length) {
        if (signal?.aborted) throw abortReason(signal);
        const index = cursor;
        cursor += 1;
        const brief = items[index];
        try {
          const key = `gift-candidate-v${GIFT_CANDIDATE_CACHE_VERSION}:tcgdex:${brief.ref.id}:${brief.ref.language}`;
          const cached = await cachedDetail(key);
          let detail: TCGdexGiftCardDetail;
          if (cached) {
            detail = { card: cached.card, rawPricing: cached.rawPricing, releaseYear: cached.releaseYear };
          } else if (this.catalog.getGiftCardDetail) {
            detail = await this.catalog.getGiftCardDetail(brief.ref, signal);
            await storeDetail(key, detail, ttl);
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
            minimumCondition: options.preferences?.minimumCondition,
          }, signal);
          const cardtraderImage = !detail.card.imageBaseUrl && !detail.card.imageFallbackBaseUrl && this.alternativeArtwork
            ? await this.alternativeArtwork(detail.card)
            : undefined;
          results[index] = {
            card: detail.card,
            variant,
            preferences: options.preferences ?? { minimumCondition: "any" },
            releaseYear: detail.releaseYear,
            price,
            reasonTags: [],
            ...(cardtraderImage ? { cardtraderImage: true } : {}),
          };
        } catch (error) {
          // A single card the catalogue cannot deliver must not stop the whole proposal; a stop request still does.
          if (signal?.aborted) throw error;
          failures.push(error);
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
    const candidates = results.filter((candidate): candidate is GiftCardCandidate => candidate !== undefined);
    // Only when nothing at all could be loaded is the failure worth showing.
    if (candidates.length === 0 && failures.length > 0) throw failures[0];
    return candidates;
  }
}
