import { describe, expect, it } from "vitest";

import { asCollection } from "../../../scripts/cardtrader-response.mjs";

describe("CardTrader response normalization", () => {
  it("keeps documented array responses", () => {
    expect(asCollection([{ id: 1 }], "games")).toEqual([{ id: 1 }]);
  });

  it("accepts ID-keyed response objects", () => {
    expect(asCollection({ 1: { id: 1 }, 5: { id: 5 } }, "games")).toEqual([{ id: 1 }, { id: 5 }]);
  });

  it("unwraps data and endpoint-named collections and accepts empty objects", () => {
    expect(asCollection({ data: [{ id: 5 }] }, "games")).toEqual([{ id: 5 }]);
    expect(asCollection({ games: [{ id: 5 }] }, "games")).toEqual([{ id: 5 }]);
    expect(asCollection({}, "blueprints")).toEqual([]);
  });

  it("ignores scalar metadata beside ID-keyed records", () => {
    expect(asCollection({ 1: { id: 1 }, request_id: "public-request-id" }, "games")).toEqual([{ id: 1 }]);
  });

  it("rejects unsupported shapes without including response contents", () => {
    expect(() => asCollection("unexpected-secret", "games")).toThrow("CardTrader games response is not a collection.");
  });
});
