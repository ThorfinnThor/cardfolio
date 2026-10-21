import { describe, expect, it } from "vitest";

import { giftFunctionalKey, giftSubjectOf, matchesGiftSubject, parseGiftSubjects, separateRepeatedCards } from "@/domain/gift-subject";
import type { CardSnapshot } from "@/domain/types";

function card(name: string, extra: Partial<CardSnapshot> = {}): CardSnapshot {
  return {
    key: `tcgdex:${name}-${Math.random()}:de`,
    ref: { provider: "tcgdex", id: name, language: "de" },
    name,
    setId: "set",
    setName: "Set",
    collectorNumber: "1",
    physicalStatus: "physical",
    fetchedAt: "2026-10-01T00:00:00.000Z",
    ...extra,
  };
}

describe("matchesGiftSubject", () => {
  it("accepts the Pokémon itself and its variants, not words that merely contain the name", () => {
    expect(matchesGiftSubject(card("Evoli"), "Evoli")).toBe(true);
    expect(matchesGiftSubject(card("Evoli-ex"), "Evoli")).toBe(true);
    expect(matchesGiftSubject(card("Dunkles Evoli"), "Evoli")).toBe(true);
    expect(matchesGiftSubject(card("evoli V"), "  Evoli ")).toBe(true);
    expect(matchesGiftSubject(card("Evolith"), "Evoli")).toBe(false);
    expect(matchesGiftSubject(card("Evoli", { category: "trainer" }), "Evoli")).toBe(false);
    expect(matchesGiftSubject(card("Evoli", { category: "energy" }), "Evoli")).toBe(false);
  });

  it("handles names with punctuation and does not let a pattern character act as a pattern", () => {
    expect(matchesGiftSubject(card("Porygon-Z"), "Porygon-Z")).toBe(true);
    expect(matchesGiftSubject(card("Farfetch'd"), "Farfetch'd")).toBe(true);
    expect(matchesGiftSubject(card("Mew"), "M.w")).toBe(false);
    expect(matchesGiftSubject(card("Irgendwas"), "")).toBe(true);
  });
});

describe("several Pokémon", () => {
  it("splits what the buyer typed and keeps hyphens and apostrophes", () => {
    expect(parseGiftSubjects("Pikachu")).toEqual(["Pikachu"]);
    expect(parseGiftSubjects("Pikachu, Glurak")).toEqual(["Pikachu", "Glurak"]);
    expect(parseGiftSubjects("Pikachu und Glurak")).toEqual(["Pikachu", "Glurak"]);
    expect(parseGiftSubjects("Pikachu & Charizard + Evoli; Mew")).toEqual(["Pikachu", "Charizard", "Evoli", "Mew"]);
    expect(parseGiftSubjects("Ho-Oh, Porygon-Z, Farfetch'd")).toEqual(["Ho-Oh", "Porygon-Z", "Farfetch'd"]);
    expect(parseGiftSubjects("pikachu, Pikachu , ")).toEqual(["pikachu"]);
    expect(parseGiftSubjects("")).toEqual([]);
  });

  it("allows at most four Pokémon", () => {
    expect(parseGiftSubjects("A1, B2, C3, D4, E5, F6")).toHaveLength(4);
  });

  it("matches a card that belongs to any of them and names which one", () => {
    expect(matchesGiftSubject(card("Glurak-ex"), "Pikachu, Glurak")).toBe(true);
    expect(matchesGiftSubject(card("Pikachu V"), "Pikachu, Glurak")).toBe(true);
    expect(matchesGiftSubject(card("Evoli"), "Pikachu, Glurak")).toBe(false);
    expect(matchesGiftSubject(card("Glurak", { category: "trainer" }), "Pikachu, Glurak")).toBe(false);
    expect(giftSubjectOf(card("Glurak-ex"), "Pikachu, Glurak")).toBe("glurak");
    expect(giftSubjectOf(card("Evoli"), "Pikachu, Glurak")).toBeUndefined();
  });
});

describe("repeated cards", () => {
  it("gives reprints with the same attacks the same identity and leaves cards without attack data alone", () => {
    const a = card("Pikachu", { attacks: ["Donnerblitz"], abilities: [] });
    const b = card("Pikachu", { attacks: ["Donnerblitz"], abilities: [], setId: "other" });
    const c = card("Pikachu", { attacks: ["Kratzer"], abilities: [] });
    expect(giftFunctionalKey(a)).toBe(giftFunctionalKey(b));
    expect(giftFunctionalKey(a)).not.toBe(giftFunctionalKey(c));
    expect(giftFunctionalKey(card("Pikachu"))).toBeUndefined();
  });

  it("puts distinct cards first, keeps order, and never drops a card", () => {
    const first = { card: card("Pikachu", { attacks: ["A"], abilities: [] }) };
    const reprint = { card: card("Pikachu", { attacks: ["A"], abilities: [] }) };
    const other = { card: card("Pikachu", { attacks: ["B"], abilities: [] }) };
    const unknown1 = { card: card("Pikachu") };
    const unknown2 = { card: card("Pikachu") };
    const result = separateRepeatedCards([first, reprint, other, unknown1, unknown2]);
    expect(result.distinct).toEqual([first, other, unknown1, unknown2]);
    expect(result.repeats).toEqual([reprint]);
    expect(result.ordered).toEqual([first, other, unknown1, unknown2, reprint]);
  });
});
