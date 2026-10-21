import { afterEach, describe, expect, it } from "vitest";

import { clearGiftResume, readGiftResume, saveGiftResume, type GiftResume } from "@/components/foundation/gift-resume";
import { createGiftProject, type GiftPreferences } from "@/domain/gift-builder";

const preferences: GiftPreferences = { recipientKind: "friend", subjectQuery: "Evoli", targetCardCount: 9, budgetMinor: 10_000, currency: "EUR", style: "mixed", preferredLanguage: "de" };

function resume(): GiftResume {
  return {
    preferences,
    project: createGiftProject("Geschenk · Evoli", preferences),
    selection: {
      selected: [{
        card: { key: "tcgdex:a-1:de", ref: { provider: "tcgdex", id: "a-1", language: "de" }, name: "Evoli", setId: "a", setName: "Set", collectorNumber: "1", physicalStatus: "physical", fetchedAt: "2026-10-01T00:00:00.000Z" },
        variant: { finish: "normal", edition: "unlimited", printing: "shadowed" },
        preferences: { minimumCondition: "excellent" },
        price: { currency: "EUR", fetchedAt: "2026-10-01T00:00:00.000Z", confidence: "unknown", issues: [] },
        reasonTags: [],
      }],
      unpricedCount: 1,
      approximateCount: 0,
      budgetStatus: "unknown",
      issues: [],
    },
  };
}

afterEach(() => window.sessionStorage.clear());

describe("gift plan resume", () => {
  it("stores the finished plan for this tab and reads it back", () => {
    saveGiftResume(resume());
    const back = readGiftResume();
    expect(back?.selection.selected[0].card.name).toBe("Evoli");
    expect(back?.project.name).toBe("Geschenk · Evoli");
  });

  it("forgets it on request and after six hours", () => {
    const now = Date.now();
    saveGiftResume(resume(), now);
    expect(readGiftResume(now + 5 * 60 * 60 * 1_000)).toBeDefined();
    expect(readGiftResume(now + 7 * 60 * 60 * 1_000)).toBeUndefined();
    clearGiftResume();
    expect(readGiftResume(now)).toBeUndefined();
  });

  it("ignores anything that is not a valid stored plan", () => {
    for (const raw of ["not json", "{}", JSON.stringify({ version: 2, savedAt: Date.now(), resume: resume() }), JSON.stringify({ version: 1, savedAt: Date.now(), resume: { ...resume(), selection: { selected: [] } } }), JSON.stringify({ version: 1, savedAt: Date.now(), resume: { ...resume(), project: {} } }), JSON.stringify({ version: 1, savedAt: Date.now(), resume: { ...resume(), selection: { selected: [{ card: {} }] } } })]) {
      window.sessionStorage.setItem("cardfolio-gift-summary", raw);
      expect(readGiftResume()).toBeUndefined();
    }
  });
});
