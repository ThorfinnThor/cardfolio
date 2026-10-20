import { describe, expect, it } from "vitest";

import { GiftCandidateLoader, spreadSample, type GiftCatalogAdapter } from "@/data/gift/gift-candidate-loader";
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

  it("scans the whole catalogue list and samples evenly across it instead of taking the first sets", async () => {
    const catalog = new CatalogFixture();
    const loader = new GiftCandidateLoader(catalog, prices);
    const pool = await loader.loadCandidatePool({ subjectQuery: "Pikachu", language: "en", maximum: 4, pageSize: 3, scan: 50 });

    expect(catalog.searches.map((query) => query.page)).toEqual([1, 2, 3]);
    expect(pool).toHaveLength(4);
    // 8 briefs exist (ids end in 0..7): every second one, from the first to the last half.
    expect(pool.map((item) => item.ref.id.split("-")[2])).toEqual(["0", "2", "4", "6"]);
  });

  it("counts the cards of a Pokémon and drops names that merely contain it", async () => {
    const loader = new GiftCandidateLoader({
      async search(query: CatalogQuery) {
        const names = ["Evoli", "Evoli-ex", "Evolith", "Dunkles Evoli"];
        return { items: names.map((name, index) => ({ ref: { provider: "tcgdex" as const, id: `c-${index}`, language: query.language }, name, collectorNumber: String(index) })), hasMore: false };
      },
      async getCard(ref: CardRef) { return snapshot(ref); },
    }, prices);

    expect(await loader.countSubjectCards({ subjectQuery: "Evoli", language: "de" })).toEqual({ count: 3, capped: false });
  });

  it("reports a capped count when the scan limit is reached", async () => {
    const loader = new GiftCandidateLoader({
      async search(query: CatalogQuery) {
        return { items: Array.from({ length: query.pageSize }, (_, index) => ({ ref: { provider: "tcgdex" as const, id: `p${query.page}-${index}`, language: query.language }, name: "Pikachu", collectorNumber: String(index) })), hasMore: true };
      },
      async getCard(ref: CardRef) { return snapshot(ref); },
    }, prices);

    const result = await loader.countSubjectCards({ subjectQuery: "Pikachu", language: "en" });
    expect(result.capped).toBe(true);
    expect(result.count).toBeGreaterThanOrEqual(400);
  });

  it("spreads a sample over the whole list", () => {
    expect(spreadSample([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5)).toEqual([1, 3, 5, 7, 9]);
    expect(spreadSample([1, 2, 3], 5)).toEqual([1, 2, 3]);
    expect(spreadSample(Array.from({ length: 191 }, (_, index) => index), 80)[79]).toBeGreaterThan(185);
  });

  it("skips a card the catalogue cannot deliver and still returns the others", async () => {
    class FlakyCatalog extends CatalogFixture {
      async getGiftCardDetail(ref: CardRef) {
        if (ref.id.includes("-1-")) throw new Error("kaputt");
        return super.getGiftCardDetail(ref);
      }
    }
    const loader = new GiftCandidateLoader(new FlakyCatalog(), prices);
    const briefs = await loader.loadCandidatePool({ subjectQuery: "Pikachu", language: "en", maximum: 4, pageSize: 4 });
    const hydrated = await loader.hydrateCandidates(briefs, { currency: "EUR", variantFor: () => ({ finish: "normal", edition: "unlimited", printing: "shadowed" }), cacheTtlMs: 60_000 });
    expect(hydrated.length).toBe(3);
  });

  it("still reports the failure when no card at all can be loaded", async () => {
    class BrokenCatalog extends CatalogFixture {
      async getGiftCardDetail(): Promise<never> {
        throw new Error("alles kaputt");
      }
    }
    const loader = new GiftCandidateLoader(new BrokenCatalog(), prices);
    const briefs = await loader.loadCandidatePool({ subjectQuery: "Pikachu", language: "en", maximum: 3, pageSize: 3 });
    await expect(loader.hydrateCandidates(briefs, { currency: "EUR", variantFor: () => ({ finish: "normal", edition: "unlimited", printing: "shadowed" }), cacheTtlMs: 60_000 })).rejects.toThrow("alles kaputt");
  });

  it("leans the sample towards an era judged from the set id and falls back when that era is too thin", async () => {
    const sets = ["base1", "neo2", "ex5", "dp3", "xy1", "sm4", "swsh1", "sv2", "swsh9", "sv4", "xy7", "sm9"];
    const catalog = {
      async search(query: CatalogQuery) {
        const items = Array.from({ length: 24 }, (_, index) => ({ ref: { provider: "tcgdex" as const, id: `c${index}`, language: query.language }, name: "Pikachu", collectorNumber: String(index), setId: sets[index % sets.length] }));
        return { items, hasMore: false };
      },
      async getCard(ref: CardRef) { return snapshot(ref); },
    };
    const loader = new GiftCandidateLoader(catalog, prices);
    const vintage = await loader.loadCandidatePool({ subjectQuery: "Pikachu", language: "en", maximum: 8, pageSize: 24, scan: 100, era: "vintage" });
    // Eight of 24 briefs come from vintage sets: enough (>= 9 is needed) is not reached, so the sample is not narrowed.
    expect(vintage).toHaveLength(8);
    const modern = await loader.loadCandidatePool({ subjectQuery: "Pikachu", language: "en", maximum: 8, pageSize: 24, scan: 100, era: "modern" });
    expect(modern.every((item) => !["base1", "neo2", "ex5", "dp3"].includes(item.setId ?? ""))).toBe(true);
  });

  it("marks cards that only have CardTrader artwork, and passes the minimum condition to the price provider", async () => {
    const seen: Array<string | undefined> = [];
    const priceSpy: PriceProvider = { async getPrice(request) { seen.push(request.minimumCondition); return prices.getPrice(request); } };
    const withImage = (ref: CardRef) => ({ ...snapshot(ref), imageBaseUrl: "https://assets.tcgdex.net/en/base/base1/1" });
    const catalog = {
      async search(query: CatalogQuery) {
        return { items: [0, 1].map((index) => ({ ref: { provider: "tcgdex" as const, id: `a${index}`, language: query.language }, name: "Pikachu", collectorNumber: `${index}` })), hasMore: false };
      },
      async getCard(ref: CardRef) { return ref.id === "a1" ? withImage(ref) : snapshot(ref); },
    };
    const asked: string[] = [];
    const loader = new GiftCandidateLoader(catalog, priceSpy, async (card) => { asked.push(card.ref.id); return true; });
    const briefs = await loader.loadCandidatePool({ subjectQuery: "Pikachu", language: "en", maximum: 2, pageSize: 2 });
    const candidates = await loader.hydrateCandidates(briefs, { currency: "EUR", variantFor: () => ({ finish: "normal", edition: "unlimited", printing: "shadowed" }), preferences: { minimumCondition: "near-mint" }, cacheTtlMs: 60_000 });

    expect(seen).toEqual(["near-mint", "near-mint"]);
    expect(asked).toEqual(["a0"]);
    expect(candidates.find((candidate) => candidate.card.ref.id === "a0")?.cardtraderImage).toBe(true);
    expect(candidates.find((candidate) => candidate.card.ref.id === "a1")?.cardtraderImage).toBeUndefined();
  });
});
