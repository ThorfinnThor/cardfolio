import { describe, expect, it } from "vitest";

import {
  catalogSeries,
  catalogSets,
  collectorTotalForSearchItem,
  completeCardSnapshotMetadata,
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

  it("upgrades stored English cards without artwork to the verified fallback image", () => {
    const completed = completeCardSnapshotMetadata({
      key: "tcgdex:sm3.5-1:en",
      ref: { provider: "tcgdex", id: "sm3.5-1", language: "en" },
      name: "Bulbasaur",
      setId: "sm3.5",
      setName: "Shining Legends",
      collectorNumber: "1",
      imageBaseUrl: "https://assets.tcgdex.net/en/sm/sm3.5/1",
      physicalStatus: "physical",
      fetchedAt: "2026-09-30T00:00:00.000Z",
    });
    expect(completed.imageBaseUrl).toBe("https://assets.tcgdex.net/de/sm/sm3.5/1");
    expect(completed.imageFallbackBaseUrl).toBe("https://assets.tcgdex.net/en/sm/sm3.5/1");
  });
});
