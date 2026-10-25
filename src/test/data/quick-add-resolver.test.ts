import { describe, expect, it, vi } from "vitest";

import { findSetByText, loadSetItems, resolveNumbers } from "@/data/catalog/quick-add-resolver";
import type { CardSnapshot, CatalogAdapter, CatalogSearchItem } from "@/domain/types";

const item = (number: string, setId = "sv01", language: "de" | "en" = "de"): CatalogSearchItem => ({ ref: { provider: "tcgdex", id: `${setId}-${number}`, language }, name: `Karte ${number}`, collectorNumber: number, setId, setName: "Set" });
const snapshot = (found: CatalogSearchItem, extra: Partial<CardSnapshot> = {}): CardSnapshot => ({ key: `tcgdex:${found.ref.id}:${found.ref.language}`, ref: found.ref, name: found.name, setId: found.setId!, setName: "Set", collectorNumber: found.collectorNumber, physicalStatus: "physical", fetchedAt: "2026-10-25T00:00:00.000Z", ...extra });

function adapter(listing: CatalogSearchItem[], overrides: Partial<Record<string, Partial<CardSnapshot> | "fail">> = {}): CatalogAdapter {
  return {
    search: vi.fn(async (query) => ({ items: listing.slice((query.page - 1) * query.pageSize, query.page * query.pageSize), hasMore: listing.length > query.page * query.pageSize })),
    getCard: vi.fn(async (ref) => {
      const found = listing.find((candidate) => candidate.ref.id === ref.id)!;
      const override = overrides[ref.id];
      if (override === "fail") throw new Error("boom");
      return snapshot(found, override);
    }),
  };
}

describe("loadSetItems", () => {
  it("reads every page of the set listing and keeps only cards of that set and language", async () => {
    const listing = [...Array.from({ length: 120 }, (_, index) => item(String(index + 1))), item("1", "other")];
    const catalog = adapter(listing);
    const items = await loadSetItems(catalog, "de", "sv01");
    expect(items).toHaveLength(120);
    expect(catalog.search).toHaveBeenCalledTimes(2);
  });
});

describe("resolveNumbers", () => {
  const listing = [item("001"), item("002"), item("003"), item("004")];

  it("matches typed numbers to padded catalogue numbers and reports what it cannot find", async () => {
    const results = await resolveNumbers(adapter(listing), "de", "sv01", [{ number: "1", quantity: 2 }, { number: "9", quantity: 1 }]);
    expect(results[0]).toMatchObject({ token: { number: "1", quantity: 2 }, card: { name: "Karte 001" } });
    expect(results[1]).toMatchObject({ problem: "not-found" });
  });

  it("treats digital cards as not found and a failing card request as an error without losing the others", async () => {
    const catalog = adapter(listing, { "sv01-002": { physicalStatus: "digital" }, "sv01-003": "fail" });
    const results = await resolveNumbers(catalog, "de", "sv01", [{ number: "2", quantity: 1 }, { number: "3", quantity: 1 }, { number: "4", quantity: 1 }]);
    expect(results.map((result) => result.problem ?? "ok")).toEqual(["not-found", "error", "ok"]);
    expect(results[2]!.card?.name).toBe("Karte 004");
  });
});

describe("findSetByText", () => {
  it("finds a set by its id and by its exact name, and offers candidates for a vague name", () => {
    expect(findSetByText("base1", "en").entry?.id).toBe("base1");
    expect(findSetByText("Base Set", "en").entry?.id).toBe("base1");
    expect(findSetByText("", "en")).toEqual({ candidates: [] });
    const vague = findSetByText("Neo", "en");
    expect(vague.entry).toBeUndefined();
    expect(vague.candidates.length).toBeGreaterThan(1);
  });
});
