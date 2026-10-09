import { describe, expect, it } from "vitest";

import {
  DeterministicGiftSelectionEngine,
  giftSelectionToBinder,
  type GiftCardCandidate,
  type GiftPreferences,
} from "@/domain/gift-builder";
import type { CardSnapshot } from "@/domain/types";

function candidate(index: number, overrides: Partial<GiftCardCandidate> = {}): GiftCardCandidate {
  const card: CardSnapshot = {
    key: `tcgdex:set${index % 6}-card${index}:en`,
    ref: { provider: "tcgdex", id: `set${index % 6}-card${index}`, language: "en" },
    name: `Pikachu ${index}`,
    setId: `set${index % 6}`,
    setName: `Set ${index % 6}`,
    collectorNumber: String(index),
    physicalStatus: "physical",
    fetchedAt: "2026-10-01T00:00:00.000Z",
  };
  return {
    card,
    variant: { finish: "normal", edition: "unlimited", printing: "shadowed" },
    preferences: { minimumCondition: "excellent" },
    releaseYear: 1999 + (index % 25),
    price: {
      source: "tcgdex-cardmarket",
      currency: "EUR",
      amountMinor: 500,
      metric: "trend",
      fetchedAt: "2026-10-01T00:00:00.000Z",
      sourceUpdatedAt: "2026-09-30T00:00:00.000Z",
      confidence: "usable",
      issues: [],
    },
    reasonTags: [],
    ...overrides,
  };
}

function preferences(overrides: Partial<GiftPreferences> = {}): GiftPreferences {
  return {
    recipientKind: "friend",
    subjectQuery: "Pikachu",
    targetCardCount: 9,
    budgetMinor: 5_000,
    currency: "EUR",
    style: "mixed",
    ...overrides,
  };
}

describe("deterministic Gift selection", () => {
  const engine = new DeterministicGiftSelectionEngine();

  it.each([
    { targetCardCount: 9 as const, budgetMinor: 5_000, count: 9 },
    { targetCardCount: 18 as const, budgetMinor: 10_000, count: 18 },
    { targetCardCount: 36 as const, budgetMinor: 20_000, count: 36 },
  ])("selects $targetCardCount cards within a $budgetMinor-minor-unit budget", ({ targetCardCount, budgetMinor, count }) => {
    const result = engine.select({
      candidates: Array.from({ length: 40 }, (_, index) => candidate(index + 1)),
      preferences: preferences({ targetCardCount, budgetMinor }),
    });
    expect(result.selected).toHaveLength(count);
    expect(result.estimatedTotalMinor).toBe(count * 500);
    expect(result.budgetStatus).toBe("within");
    expect(new Set(result.selected.map((item) => item.card.key)).size).toBe(count);
  });

  it("uses an explicit tolerance only for a visible near-budget status", () => {
    const result = engine.select({
      candidates: Array.from({ length: 9 }, (_, index) => candidate(index + 1)),
      preferences: preferences({ budgetMinor: 4_400, budgetTolerancePercent: 5 }),
    });
    expect(result.estimatedTotalMinor).toBe(4_500);
    expect(result.budgetStatus).toBe("near");
  });

  it("reports over-budget when even the cheapest complete selection exceeds the ceiling", () => {
    const result = engine.select({
      candidates: Array.from({ length: 9 }, (_, index) => candidate(index + 1)),
      preferences: preferences({ budgetMinor: 4_000 }),
    });
    expect(result.budgetStatus).toBe("over");
    expect(result.issues).toContain("budget-impossible");
  });

  it("never claims under budget from approximate or unknown prices", () => {
    const candidates = Array.from({ length: 9 }, (_, index) => candidate(index + 1));
    candidates[0] = candidate(1, {
      price: { currency: "EUR", fetchedAt: "2026-10-01T00:00:00.000Z", confidence: "unknown", issues: ["missing-pricing"] },
    });
    candidates[1] = candidate(2, {
      price: { ...candidates[1].price, confidence: "approximate" },
    });
    const result = engine.select({ candidates, preferences: preferences() });
    expect(result.budgetStatus).toBe("unknown");
    expect(result.unpricedCount).toBe(1);
    expect(result.approximateCount).toBe(1);
    expect(result.issues).toEqual(expect.arrayContaining(["unknown-prices", "approximate-prices"]));
  });

  it("prefers candidates with artwork when prices are equally unknown", () => {
    const candidates = Array.from({ length: 10 }, (_, index) => candidate(index + 1, {
      card: {
        ...candidate(index + 1).card,
        imageBaseUrl: index < 9 ? `https://assets.tcgdex.net/en/set/card-${index + 1}` : undefined,
      },
      price: { currency: "EUR", fetchedAt: "2026-10-01T00:00:00.000Z", confidence: "unknown", issues: ["missing-pricing"] },
    }));
    const result = engine.select({ candidates, preferences: preferences() });
    expect(result.selected).toHaveLength(9);
    expect(result.selected.every((item) => Boolean(item.card.imageBaseUrl || item.card.imageFallbackBaseUrl))).toBe(true);
    expect(result.selected.map((item) => item.card.key)).not.toContain(candidates[9].card.key);
  });

  it("prioritizes artwork over a cheaper card when the illustrated selection still fits the budget", () => {
    const candidates = Array.from({ length: 10 }, (_, index) => candidate(index + 1, {
      card: {
        ...candidate(index + 1).card,
        imageBaseUrl: index < 9 ? `https://assets.tcgdex.net/en/set/card-${index + 1}` : undefined,
      },
      price: {
        ...candidate(index + 1).price,
        amountMinor: index < 9 ? 500 : 1,
      },
    }));

    const result = engine.select({ candidates, preferences: preferences() });

    expect(result.selected).toHaveLength(9);
    expect(result.selected.every((item) => Boolean(item.card.imageBaseUrl || item.card.imageFallbackBaseUrl))).toBe(true);
    expect(result.selected.map((item) => item.card.key)).not.toContain(candidates[9].card.key);
  });

  it("prioritizes cards with price estimates before unpriced cards when all prices are non-binding", () => {
    const priced = Array.from({ length: 9 }, (_, index) => candidate(index + 1, {
      card: {
        ...candidate(index + 1).card,
        setId: "same-set",
        imageBaseUrl: `https://assets.tcgdex.net/en/set/card-${index + 1}`,
      },
      price: { ...candidate(index + 1).price, confidence: "approximate" },
    }));
    const unpriced = candidate(10, {
      card: {
        ...candidate(10).card,
        setId: "diverse-set",
        imageBaseUrl: "https://assets.tcgdex.net/en/set/card-10",
      },
      price: { currency: "EUR", fetchedAt: "2026-10-01T00:00:00.000Z", confidence: "unknown", issues: ["missing-pricing"] },
    });

    const result = engine.select({ candidates: [...priced, unpriced], preferences: preferences() });

    expect(result.selected).toHaveLength(9);
    expect(result.unpricedCount).toBe(0);
    expect(result.selected.map((item) => item.card.key)).not.toContain(unpriced.card.key);
  });

  it("removes duplicates and incomplete variants and reports a too-small pool", () => {
    const first = candidate(1);
    const incomplete = candidate(2, {
      variant: { finish: "unspecified", edition: "unlimited", printing: "shadowed" },
    });
    const result = engine.select({
      candidates: [first, first, incomplete, ...Array.from({ length: 6 }, (_, index) => candidate(index + 3))],
      preferences: preferences(),
    });
    expect(result.selected).toHaveLength(7);
    expect(result.issues).toEqual(expect.arrayContaining([
      "duplicates-removed",
      "incomplete-variants",
      "too-few-candidates",
    ]));
  });

  it("uses only verified release years for vintage and modern filters", () => {
    const vintage = candidate(1, { releaseYear: 2009 });
    const modern = candidate(2, { releaseYear: 2010 });
    const unknown = candidate(3, { releaseYear: undefined });
    expect(engine.select({ candidates: [vintage, modern, unknown], preferences: preferences({ style: "vintage" }) }).selected)
      .toEqual([expect.objectContaining({ card: vintage.card })]);
    expect(engine.select({ candidates: [vintage, modern, unknown], preferences: preferences({ style: "modern" }) }).selected)
      .toEqual([expect.objectContaining({ card: modern.card })]);
  });

  it("converts accepted 18/36-card results through the normal 3x3 page engine", () => {
    for (const count of [18, 36] as const) {
      const selection = engine.select({
        candidates: Array.from({ length: count }, (_, index) => candidate(index + 1)),
        preferences: preferences({ targetCardCount: count, budgetMinor: count * 600 }),
      });
      const result = giftSelectionToBinder(selection, `Gift ${count}`);
      expect(result.binder.pages).toHaveLength(count / 9);
      expect(result.binder.pages.flatMap((page) => page.slots).filter(Boolean)).toHaveLength(count);
      expect(result.cards).toHaveLength(count);
    }
  });
});
