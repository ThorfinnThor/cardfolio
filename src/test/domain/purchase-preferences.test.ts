import { describe, expect, it } from "vitest";

import { cardmarketMinimumCondition } from "@/domain/purchase-preferences";

describe("Cardmarket minimum-condition mapping", () => {
  it.each([
    ["near-mint", "NM"],
    ["excellent", "EX"],
    ["lightly-played", "LP"],
    ["played", "PL"],
    ["any", "PO"],
  ] as const)("maps %s to %s", (condition, code) => {
    expect(cardmarketMinimumCondition(condition).code).toBe(code);
  });
});
