import { describe, expect, it } from "vitest";

import { PLACEHOLDERS_PER_SHEET, createPlaceholders, placeholderSheets } from "@/domain/placeholders";
import type { Binder, CardSnapshot, PlannedCard } from "@/domain/types";

const card = (number: string, language: "en" | "de" = "en"): CardSnapshot => ({ key: `tcgdex:base1-${number}:${language}`, ref: { provider: "tcgdex", id: `base1-${number}`, language }, name: `Card ${number}`, setId: "base1", setName: "Base Set", collectorNumber: number, collectorTotal: "102", physicalStatus: "physical", fetchedAt: "2026-10-22T00:00:00.000Z" });
const planned = (cardKey: string, owned: boolean): PlannedCard => ({ id: crypto.randomUUID(), cardKey, variant: { finish: "holo", edition: "first-edition", printing: "shadowless" }, preferences: { minimumCondition: "excellent" }, owned, addedAt: "2026-10-22T00:00:00.000Z" });
const binder = (pages: Array<Array<PlannedCard | null>>): Binder => ({ id: crypto.randomUUID(), schemaVersion: 1, revision: 1, name: "Test", description: "", layout: { rows: 3, columns: 3 }, pages: pages.map((slots) => ({ id: crypto.randomUUID(), slots, note: "" })), createdAt: "2026-10-22T00:00:00.000Z", updatedAt: "2026-10-22T00:00:00.000Z" });
const cards = new Map([card("1"), card("2"), card("3", "de")].map((item) => [item.key, item] as const));

describe("printable placeholders", () => {
  const sample = binder([[planned("tcgdex:base1-1:en", true), planned("tcgdex:base1-2:en", false), null], [planned("tcgdex:base1-3:de", false), null, null]]);

  it("makes a text-only placeholder for each planned card that is not owned yet, in reading order", () => {
    const result = createPlaceholders(sample, cards, { missing: true, free: false });
    expect(result).toEqual([
      { position: "Seite 1 · Platz 2", kind: "missing", name: "Card 2", setName: "Base Set", collectorNumber: "2/102", language: "en", variant: "Holo · 1. Edition · Shadowless" },
      { position: "Seite 2 · Platz 1", kind: "missing", name: "Card 3", setName: "Base Set", collectorNumber: "3/102", language: "de", variant: "Holo · 1. Edition · Shadowless" },
    ]);
    expect(JSON.stringify(result)).not.toMatch(/image|https?:/i);
  });

  it("can add blank placeholders for free slots, and never one for an owned card", () => {
    const result = createPlaceholders(sample, cards, { missing: true, free: true });
    expect(result.filter((item) => item.kind === "free").map((item) => item.position)).toEqual(["Seite 1 · Platz 3", "Seite 2 · Platz 2", "Seite 2 · Platz 3"]);
    expect(result.some((item) => item.position === "Seite 1 · Platz 1")).toBe(false);
  });

  it("leaves the variant out for a plain card", () => {
    const plain: PlannedCard = { ...planned("tcgdex:base1-2:en", false), variant: { finish: "normal", edition: "unlimited", printing: "shadowed" } };
    expect(createPlaceholders(binder([[plain]]), cards, { missing: true, free: false })[0]?.variant).toBeUndefined();
  });

  it("returns nothing when both kinds are off and skips planned cards with an unknown snapshot", () => {
    expect(createPlaceholders(sample, cards, { missing: false, free: false })).toEqual([]);
    expect(createPlaceholders(binder([[planned("tcgdex:unknown:en", false)]]), cards, { missing: true, free: false })).toEqual([]);
  });

  it("splits into sheets of nine", () => {
    const many = Array.from({ length: 20 }, (_, index) => ({ position: `p${index}`, kind: "free" as const }));
    const sheets = placeholderSheets(many);
    expect(sheets.map((sheet) => sheet.length)).toEqual([PLACEHOLDERS_PER_SHEET, PLACEHOLDERS_PER_SHEET, 2]);
  });
});
