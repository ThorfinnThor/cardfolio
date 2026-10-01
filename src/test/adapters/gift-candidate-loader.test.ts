import { describe, expect, it } from "vitest";

import { GiftCandidateLoader, type GiftCatalogAdapter } from "@/data/gift/gift-candidate-loader";
import type { PriceProvider } from "@/domain/gift-builder";
import type { CardRef, CardSnapshot, CatalogQuery } from "@/domain/types";

function snapshot(ref: CardRef): CardSnapshot {
  return {
    key: `tcgdex:${ref.id}:${ref.language}`,
    ref,
    name: `Pikachu ${ref.id}`,
    setId: "base1",
    setName: "Base Set",
    collectorNumber: ref.id,
    physicalStatus: "physical",
    fetchedAt: "2026-10-01T10:00:00.000Z",
  };
}

class CatalogFixture implements GiftCatalogAdapter {
  searches: CatalogQuery[] = [];
  active = 0;
  maxActive = 0;
  details = 0;

  async search(query: CatalogQuery) {
    this.searches.push(query);
    const start = (query.page - 1) * query.pageSize;
    const items = Array.from({ length: query.page < 3 ? query.pageSize : 2 }, (_, index) => {
      const id = `gift-loader-${start + index}-${crypto.randomUUID()}`;
      return { ref: { provider: "tcgdex" as const, id, language: query.language }, name: "Pikachu", collectorNumber: id };
    });
    return { items, hasMore: query.page < 3 };
  }

  async getCard(ref: CardRef) {
    return snapshot(ref);
  }

  async getGiftCardDetail(ref: CardRef) {
    this.details += 1;
    this.active += 1;
    this.maxActive = Math.max(this.maxActive, this.active);
    await new Promise((resolve) => setTimeout(resolve, 1));
    this.active -= 1;
    return { card: snapshot(ref), rawPricing: {}, releaseYear: 1999 };
  }
}

const prices: PriceProvider = {
  async getPrice(request) {
    return {
      currency: request.currency,
      fetchedAt: request.fetchedAt,
      confidence: "unknown",
      issues: ["fixture"],
    };
  },
};

describe("Gift candidate loader", () => {
  it("paginates only to a bounded brief pool and hydrates lazily with limited concurrency and TTL cache", async () => {
    const catalog = new CatalogFixture();
    const loader = new GiftCandidateLoader(catalog, prices);
    const briefs = await loader.loadCandidatePool({ subjectQuery: "Pikachu", language: "en", maximum: 5, pageSize: 3 });
    expect(briefs).toHaveLength(5);
    expect(catalog.searches.map((query) => query.page)).toEqual([1, 2]);
    expect(catalog.details).toBe(0);

    const options = {
      currency: "EUR" as const,
      variantFor: () => ({ finish: "normal" as const, edition: "unlimited" as const, printing: "shadowed" as const }),
      concurrency: 2,
      cacheTtlMs: 60_000,
    };
    const hydrated = await loader.hydrateCandidates(briefs, options);
    expect(hydrated).toHaveLength(5);
    expect(catalog.maxActive).toBeLessThanOrEqual(2);
    expect(catalog.details).toBe(5);

    await loader.hydrateCandidates(briefs, options);
    expect(catalog.details).toBe(5);
  });

  it("honors an already-aborted subject request", async () => {
    const loader = new GiftCandidateLoader(new CatalogFixture(), prices);
    const controller = new AbortController();
    controller.abort(new DOMException("Stopped", "AbortError"));
    await expect(loader.loadSubjectPage({ subjectQuery: "Pikachu", language: "en", page: 1 }, controller.signal))
      .rejects.toMatchObject({ name: "AbortError" });
  });
});
