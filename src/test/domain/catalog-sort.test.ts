import { describe, expect, it } from "vitest";

import { compareCollectorNumbers, sortCatalogSearchItems } from "@/domain/catalog-sort";
import { createBinder, createPlannedCard, placeCard } from "@/domain/binder-actions";
import type { CatalogSearchItem } from "@/domain/types";

function item(id: string, collectorNumber: string, setName = "Set"): CatalogSearchItem {
  return {
    ref: { provider: "tcgdex", id, language: "en" },
    name: id,
    collectorNumber,
    setId: id.split("-")[0],
    setName,
  };
}

describe("catalog result sorting", () => {
  it("sorts numeric, prefixed, suffixed and secret-rare collector numbers naturally", () => {
    const values = ["TG10/TG30", "103/102", "2", "1b", "10", "TG2/TG30", "1a", "102/102"];
    expect([...values].sort(compareCollectorNumbers)).toEqual([
      "1a",
      "1b",
      "2",
      "10",
      "102/102",
      "103/102",
      "TG2/TG30",
      "TG10/TG30",
    ]);
  });

  it("sorts by set and number without mutating the result source", () => {
    const source = [item("b-10", "10", "Beta"), item("a-2", "2", "Alpha"), item("a-1", "1", "Alpha")];
    const sorted = sortCatalogSearchItems(source, "set-number");
    expect(sorted.map((candidate) => candidate.ref.id)).toEqual(["a-1", "a-2", "b-10"]);
    expect(source.map((candidate) => candidate.ref.id)).toEqual(["b-10", "a-2", "a-1"]);
  });

  it("sorts newest sets first and cannot change binder placements", () => {
    const source = [item("old-1", "1", "Old"), item("new-2", "2", "New")];
    const binder = createBinder("Unverändert");
    const first = createPlannedCard("tcgdex:old-1:en");
    const planned = placeCard(binder, { pageId: binder.pages[0].id, slotIndex: 4 }, first);
    const slotsBefore = planned.pages[0].slots.map((slot) => slot?.id ?? null);

    expect(sortCatalogSearchItems(source, "release-date", (candidate) => ({
      name: candidate.setName ?? "",
      releaseDate: candidate.setId === "new" ? "2026-01-01" : "1999-01-01",
    })).map((candidate) => candidate.ref.id)).toEqual(["new-2", "old-1"]);
    expect(planned.pages[0].slots.map((slot) => slot?.id ?? null)).toEqual(slotsBefore);
  });
});
