import { describe, expect, it } from "vitest";

import { setCopyDetails } from "@/domain/binder-actions";
import { deriveBinderValue, ownedCopies, recordValuePoint, valueChange } from "@/domain/collection-value";
import { backupSchema, plannedCardSchema } from "@/domain/validation";
import type { Binder, CardSnapshot, PlannedCard, ValuePoint } from "@/domain/types";

const iso = "2026-10-24T00:00:00.000Z";
const card = (number: string): CardSnapshot => ({ key: `tcgdex:base1-${number}:en`, ref: { provider: "tcgdex", id: `base1-${number}`, language: "en" }, name: `Card ${number}`, setId: "base1", setName: "Base Set", collectorNumber: number, physicalStatus: "physical", fetchedAt: iso });
const planned = (cardKey: string, extra: Partial<PlannedCard> = {}): PlannedCard => ({ id: crypto.randomUUID(), cardKey, variant: { finish: "normal", edition: "unlimited", printing: "shadowed" }, preferences: { minimumCondition: "excellent" }, owned: true, addedAt: iso, ...extra });
const binderWith = (slots: Array<PlannedCard | null>): Binder => ({ id: crypto.randomUUID(), schemaVersion: 1, revision: 1, name: "Test", description: "", layout: { rows: 3, columns: 3 }, pages: [{ id: crypto.randomUUID(), slots: [...slots, ...Array(9 - slots.length).fill(null)], note: "" }], createdAt: iso, updatedAt: iso });
const cards = new Map([card("1"), card("2"), card("3")].map((item) => [item.key, item] as const));
const point = (date: string, valueMinor: number, pricedCopies = 2, ownedCopies = 2): ValuePoint => ({ date, valueMinor, pricedCopies, ownedCopies });

describe("owned copies and binder value", () => {
  it("uses the recorded condition, else the wanted minimum, and skips cards that are not owned", () => {
    const withCondition = planned("tcgdex:base1-1:en", { condition: "near-mint", quantity: 3 });
    const without = planned("tcgdex:base1-2:en");
    const missing = planned("tcgdex:base1-3:en", { owned: false });
    const copies = ownedCopies(binderWith([withCondition, without, missing, null]), cards);
    expect(copies.map((owned) => [owned.condition, owned.copies, owned.conditionRecorded])).toEqual([["near-mint", 3, true], ["excellent", 1, false]]);
  });

  it("multiplies by the number of copies and never counts an unpriced card as zero", () => {
    const first = planned("tcgdex:base1-1:en", { quantity: 3 });
    const second = planned("tcgdex:base1-2:en");
    const third = planned("tcgdex:base1-3:en");
    const copies = ownedCopies(binderWith([first, second, third]), cards);
    const value = deriveBinderValue(copies, new Map([[first.id, 250], [second.id, undefined], [third.id, 0]]));
    expect(value).toEqual({ valueMinor: 750, pricedCopies: 3, ownedCopies: 5, ownedCards: 3, pricedCards: 1 });
  });

  it("has no value for an empty collection", () => {
    expect(deriveBinderValue([], new Map())).toEqual({ valueMinor: 0, pricedCopies: 0, ownedCopies: 0, ownedCards: 0, pricedCards: 0 });
  });
});

describe("value history", () => {
  it("keeps one point per day and lets a later visit replace it", () => {
    const history = recordValuePoint([point("2026-10-23", 1000)], point("2026-10-24", 1100));
    expect(recordValuePoint(history, point("2026-10-24", 1200)).map((entry) => [entry.date, entry.valueMinor])).toEqual([["2026-10-23", 1000], ["2026-10-24", 1200]]);
  });

  it("keeps only the ends of a flat stretch", () => {
    let history: ValuePoint[] = [];
    for (const day of ["01", "02", "03", "04", "05"]) history = recordValuePoint(history, point(`2026-10-${day}`, 1000));
    expect(history.map((entry) => entry.date)).toEqual(["2026-10-01", "2026-10-05"]);
  });

  it("is limited in length and reports the change since the first point", () => {
    let history: ValuePoint[] = [];
    for (let day = 1; day <= 6; day += 1) history = recordValuePoint(history, point(`2026-10-0${day}`, day * 100), 3);
    expect(history).toHaveLength(3);
    expect(valueChange([point("2026-10-01", 1000), point("2026-10-09", 1500)])).toEqual({ deltaMinor: 500, since: "2026-10-01" });
    expect(valueChange([point("2026-10-01", 1000)])).toBeUndefined();
  });
});

describe("condition and quantity on a slot", () => {
  it("are set without touching the rest and rejected when out of range", () => {
    const entry = planned("tcgdex:base1-1:en");
    const binder = binderWith([entry]);
    const updated = setCopyDetails(binder, entry.id, { condition: "lightly-played", quantity: 4 });
    expect(updated.pages[0]!.slots[0]).toMatchObject({ condition: "lightly-played", quantity: 4, owned: true });
    expect(setCopyDetails(updated, entry.id, { quantity: 2 }).pages[0]!.slots[0]).toMatchObject({ condition: "lightly-played", quantity: 2 });
    expect(() => setCopyDetails(binder, entry.id, { quantity: 0 })).toThrow();
    expect(() => setCopyDetails(binder, entry.id, { quantity: 100 })).toThrow();
    expect(() => setCopyDetails(binder, "missing", { quantity: 2 })).toThrow();
  });

  it("validate, and old slots without the fields stay valid", () => {
    const base = planned("tcgdex:base1-1:en");
    expect(plannedCardSchema.safeParse(base).success).toBe(true);
    expect(plannedCardSchema.safeParse({ ...base, condition: "played", quantity: 2 }).success).toBe(true);
    expect(plannedCardSchema.safeParse({ ...base, condition: "any" }).success).toBe(false);
    expect(plannedCardSchema.safeParse({ ...base, quantity: 1.5 }).success).toBe(false);
  });
});

describe("backup with value history", () => {
  const binder = binderWith([planned("tcgdex:base1-1:en")]);
  const backup = { format: "cardfolio-backup", version: 2, exportedAt: iso, binders: [binder], cards: [card("1")], giftProjects: [] };

  it("accepts a backup without history and one with history for its binders", () => {
    expect(backupSchema.safeParse(backup).success).toBe(true);
    expect(backupSchema.safeParse({ ...backup, valueHistory: { [binder.id]: [point("2026-10-24", 1000)] } }).success).toBe(true);
  });

  it("rejects malformed history points", () => {
    expect(backupSchema.safeParse({ ...backup, valueHistory: { [binder.id]: [{ date: "yesterday", valueMinor: 1, pricedCopies: 1, ownedCopies: 1 }] } }).success).toBe(false);
  });
});
