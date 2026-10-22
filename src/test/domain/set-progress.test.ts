import { describe, expect, it } from "vitest";

import { deriveSetProgress } from "@/domain/set-progress";
import type { Binder, CardSnapshot, PlannedCard } from "@/domain/types";

function card(setId: string, setName: string, number: string, language: "en" | "de" = "en", total?: string): CardSnapshot {
  return { key: `tcgdex:${setId}-${number}:${language}`, ref: { provider: "tcgdex", id: `${setId}-${number}`, language }, name: `Card ${number}`, setId, setName, collectorNumber: number, ...(total ? { collectorTotal: total } : {}), physicalStatus: "physical", fetchedAt: "2026-10-22T00:00:00.000Z" };
}
const entry = (cardKey: string, owned: boolean): PlannedCard => ({ id: crypto.randomUUID(), cardKey, variant: { finish: "normal", edition: "unlimited", printing: "shadowed" }, preferences: { minimumCondition: "excellent" }, owned, addedAt: "2026-10-22T00:00:00.000Z" });
const binder = (slots: Array<PlannedCard | null>): Binder => ({ id: crypto.randomUUID(), schemaVersion: 1, revision: 1, name: "Test", description: "", layout: { rows: 3, columns: 3 }, pages: [{ id: crypto.randomUUID(), slots, note: "" }], createdAt: "2026-10-22T00:00:00.000Z", updatedAt: "2026-10-22T00:00:00.000Z" });

describe("deriveSetProgress", () => {
  const cards = new Map([
    card("base1", "Base Set", "1", "en", "102"),
    card("base1", "Base Set", "2", "en", "102"),
    card("base1", "Base Set", "3", "en", "102"),
    card("sv1", "Scarlet & Violet", "5"),
    card("base1", "Grundset", "1", "de", "102"),
  ].map((item) => [item.key, item] as const));

  it("counts owned and missing cards per set, leaves empty slots out and sorts by size", () => {
    const rows = deriveSetProgress(binder([
      entry("tcgdex:base1-1:en", true), entry("tcgdex:base1-2:en", false), entry("tcgdex:base1-3:en", true), null, null,
      entry("tcgdex:sv1-5:en", false), null, null, null,
    ]), cards);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ setName: "Base Set", planned: 3, owned: 2, missing: 1, distinctPlanned: 3, totalInSet: 102, completionPercent: 67 });
    expect(rows[1]).toMatchObject({ setName: "Scarlet & Violet", planned: 1, owned: 0, missing: 1, totalInSet: undefined, completionPercent: 0 });
  });

  it("counts copies separately but distinct cards once, and keeps the same set in two languages apart", () => {
    const rows = deriveSetProgress(binder([entry("tcgdex:base1-1:en", true), entry("tcgdex:base1-1:en", false), entry("tcgdex:base1-1:de", true)]), cards);
    const english = rows.find((row) => row.language === "en")!;
    expect(english).toMatchObject({ planned: 2, owned: 1, distinctPlanned: 1 });
    expect(rows.find((row) => row.language === "de")).toMatchObject({ planned: 1, owned: 1 });
  });

  it("returns nothing for an empty binder and ignores cards without a known snapshot", () => {
    expect(deriveSetProgress(binder([null, null]), cards)).toEqual([]);
    expect(deriveSetProgress(binder([entry("tcgdex:unknown-1:en", true)]), cards)).toEqual([]);
  });
});
