import { describe, expect, it } from "vitest";

import { formatCollectorNumber, parseCatalogSearch, sameCollectorPart } from "@/domain/catalog-search";

describe("catalog search syntax", () => {
  it("separates a printed card number from the card name", () => {
    expect(parseCatalogSearch("Charizard 04/102")).toEqual({
      name: "Charizard",
      collectorNumber: "4",
      collectorTotal: "102",
    });
  });

  it("supports number-only and hash searches without treating names with digits as numbers", () => {
    expect(parseCatalogSearch("TG01/TG30")).toEqual({ collectorNumber: "TG01", collectorTotal: "TG30" });
    expect(parseCatalogSearch("Porygon2")).toEqual({ name: "Porygon2" });
    expect(parseCatalogSearch("Pikachu #004")).toEqual({ name: "Pikachu", collectorNumber: "4" });
  });

  it("normalizes numeric parts for exact comparison and formats full numbers", () => {
    expect(sameCollectorPart("004", "4")).toBe(true);
    expect(sameCollectorPart("014", "4")).toBe(false);
    expect(formatCollectorNumber("4", "102")).toBe("4/102");
  });
});
