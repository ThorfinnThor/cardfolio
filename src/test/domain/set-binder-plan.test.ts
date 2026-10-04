import { describe, expect, it } from "vitest";

import { applyPageSelection } from "@/domain/page-selection";
import {
  createSetBinderPlan,
  setBinderPlanTarget,
  setBinderPlanToDraft,
} from "@/domain/set-binder-plan";
import type { CardSnapshot } from "@/domain/types";

function cards(count: number, overrides: (index: number) => Partial<CardSnapshot> = () => ({})): CardSnapshot[] {
  return Array.from({ length: count }, (_, offset) => {
    const index = offset + 1;
    const id = `set1-${index}`;
    return {
      key: `tcgdex:${id}:en`,
      ref: { provider: "tcgdex", id, language: "en" },
      name: `Card ${index}`,
      setId: "set1",
      setName: "Set One",
      collectorNumber: String(index),
      physicalStatus: "physical",
      fetchedAt: "2026-10-04T00:00:00.000Z",
      ...overrides(index),
    };
  });
}

describe("set binder planning", () => {
  it.each([1, 8, 9, 10, 18, 36])("calculates 3x3 capacity for %i selected cards", (count) => {
    const plan = createSetBinderPlan({
      setId: "set1",
      setName: "Set One",
      language: "en",
      scope: "complete-catalog",
      variantStrategy: "one-per-card",
      catalogCardCount: { official: count, total: count },
      cards: cards(count),
    });

    expect(plan.selectedCardCount).toBe(count);
    expect(plan.plannedCardCount).toBe(count);
    expect(plan.pageCount).toBe(Math.ceil(count / 9));
    expect(plan.coverageComplete).toBe(true);
  });

  it("keeps only official numbered cards for the official scope", () => {
    const source = cards(4, (index) => index === 4 ? { collectorNumber: "TG01" } : {});
    const plan = createSetBinderPlan({
      setId: "set1",
      setName: "Set One",
      language: "en",
      scope: "official-numbered",
      variantStrategy: "one-per-card",
      catalogCardCount: { official: 3, total: 4 },
      cards: source,
    });

    expect(plan.entries.map((entry) => entry.card.collectorNumber)).toEqual(["1", "2", "3"]);
    expect(plan.coverageComplete).toBe(true);
  });

  it("expands only confirmed finishes and marks unknown printings for review", () => {
    const source = cards(2, (index) => index === 1 ? {
      availableVariants: { normal: true, holo: true, reverse: false, firstEdition: false },
    } : {
      availableVariants: { normal: true, holo: false, reverse: false, firstEdition: false },
    });
    const plan = createSetBinderPlan({
      setId: "set1",
      setName: "Set One",
      language: "en",
      scope: "complete-catalog",
      variantStrategy: "all-confirmed-finishes",
      catalogCardCount: { official: 2, total: 2 },
      cards: source,
    });

    expect(plan.plannedCardCount).toBe(3);
    expect(plan.entries.slice(0, 2).map((entry) => entry.variant.finish)).toEqual(["normal", "holo"]);
    expect(plan.reviewRequiredCount).toBe(1);

    const result = applyPageSelection(
      setBinderPlanToDraft(plan),
      setBinderPlanTarget(plan, "Set One Binder"),
    );
    expect(result.placements).toHaveLength(3);
    expect(result.placements.filter((placement) => placement.variantReviewRequired)).toHaveLength(1);
  });

  it("reports incomplete provider coverage instead of presenting a complete plan", () => {
    const plan = createSetBinderPlan({
      setId: "set1",
      setName: "Set One",
      language: "en",
      scope: "complete-catalog",
      variantStrategy: "one-per-card",
      catalogCardCount: { official: 9, total: 10 },
      cards: cards(9),
    });

    expect(plan.coverageComplete).toBe(false);
    expect(plan.issues[0]).toContain("9 von erwarteten 10");
  });
});
