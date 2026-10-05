import { describe, expect, it } from "vitest";

import { asCollection } from "../../../scripts/cardtrader-response.mjs";
import { summarizeProperties } from "../../../scripts/cardtrader-properties.mjs";

describe("CardTrader response normalization", () => {
  it("keeps documented array responses", () => {
    expect(asCollection([{ id: 1 }], "games")).toEqual([{ id: 1 }]);
  });

  it("accepts ID-keyed response objects", () => {
    expect(asCollection({ 1: { id: 1 }, 5: { id: 5 } }, "games")).toEqual([{ id: 1 }, { id: 5 }]);
  });

  it("unwraps data and endpoint-named collections and accepts empty objects", () => {
    expect(asCollection({ array: [{ id: 5 }] }, "games")).toEqual([{ id: 5 }]);
    expect(asCollection({ data: [{ id: 5 }] }, "games")).toEqual([{ id: 5 }]);
    expect(asCollection({ games: [{ id: 5 }] }, "games")).toEqual([{ id: 5 }]);
    expect(asCollection({}, "blueprints")).toEqual([]);
  });

  it("ignores scalar metadata beside ID-keyed records", () => {
    expect(asCollection({ 1: { id: 1 }, request_id: "public-request-id" }, "games")).toEqual([{ id: 1 }]);
  });

  it("rejects unsupported shapes without including response contents", () => {
    expect(() => asCollection("unexpected-secret", "games")).toThrow("CardTrader games response is not a collection.");
    expect(() => asCollection({ count: 2, status: "unexpected-secret" }, "games"))
      .toThrow("CardTrader games response has an unsupported collection shape (count:number,status:string).");
    expect(() => asCollection({ count: 2, status: "unexpected-secret" }, "games"))
      .not.toThrow(/unexpected-secret/);
  });

  it("summarizes safe property metadata without copying card rows", () => {
    expect(summarizeProperties([
      {
        source: "category",
        properties: [{
          name: "first_edition",
          type: "boolean",
          default_value: false,
          possible_values: [false, true],
        }],
      },
      {
        source: "blueprint",
        properties: [{
          name: "first_edition",
          type: "boolean",
          default_value: false,
          possible_values: [false, true],
          secret: "must-not-be-copied",
        }],
      },
    ])).toEqual([{
      name: "first_edition",
      types: ["boolean"],
      defaultValues: [false],
      possibleValues: [false, true],
      occurrenceCount: 2,
      categoryCount: 1,
      blueprintCount: 1,
    }]);
  });
});
