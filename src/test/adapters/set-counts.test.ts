import { describe, expect, it } from "vitest";

import {
  catalogSeries,
  catalogSets,
  collectorTotalForSearchItem,
  setIdFromCardId,
  setMetadataForSearchItem,
} from "@/data/catalog/set-counts";

describe("catalog set counts", () => {
  it("derives full printed collector numbers from synchronized set metadata", () => {
    expect(setIdFromCardId("base1-4", "4")).toBe("base1");
    expect(setIdFromCardId("base1-1", "001")).toBe("base1");
    expect(setIdFromCardId("sv03.5-006", "006")).toBe("sv03.5");
    expect(collectorTotalForSearchItem("de", "base1-4", "4")).toBe("102");
    expect(collectorTotalForSearchItem("de", "sm7.5-3", "3")).toBe("70");
  });

  it("provides synchronized physical series and sets for catalog filters", () => {
    expect(catalogSeries("en").some((series) => series.id === "tcgp")).toBe(false);
    expect(catalogSeries("en")).toContainEqual({ id: "base", name: "Base" });
    expect(catalogSets("de", "base")).toContainEqual(expect.objectContaining({ id: "base1", name: "Grundset" }));
    expect(catalogSets("de", "base").some((set) => set.id === "A1")).toBe(false);
    expect(setMetadataForSearchItem("en", "base1-4", "4")).toMatchObject({ id: "base1", name: "Base Set" });
  });
});
