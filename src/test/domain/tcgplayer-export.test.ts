import { describe, expect, it } from "vitest";

import { TCGPLAYER_PRINTING_MAPPINGS } from "@/data/marketplace/tcgplayer-printing-mappings";
import { TCGPLAYER_SET_MAPPINGS } from "@/data/marketplace/tcgplayer-set-mappings";
import { createTcgplayerMassEntryExport } from "@/domain/tcgplayer-export";
import type { MissingItem } from "@/domain/types";

function missingItem(overrides: Partial<MissingItem> = {}): MissingItem {
  return {
    identityKey: "bulbasaur-base-set",
    card: {
      key: "tcgdex:base1-44:en",
      ref: { provider: "tcgdex", id: "base1-44", language: "en" },
      name: "Bulbasaur",
      setId: "base1",
      setName: "Base Set",
      collectorNumber: "044",
      physicalStatus: "physical",
      fetchedAt: "2026-09-27T00:00:00.000Z",
    },
    variant: { finish: "normal", edition: "unlimited" },
    preferences: { minimumCondition: "near-mint" },
    quantity: 2,
    entryIds: ["00000000-0000-4000-8000-000000000001"],
    ...overrides,
  };
}

describe("TCGplayer Mass Entry export", () => {
  it("formats verified English printings with quantity, name, set code and card number", () => {
    const exported = createTcgplayerMassEntryExport([missingItem()], TCGPLAYER_SET_MAPPINGS, TCGPLAYER_PRINTING_MAPPINGS);

    expect(exported.text).toBe("2 Bulbasaur [BS] 044/102");
    expect(exported.verifiedCount).toBe(1);
    expect(exported.reviewRequiredCount).toBe(0);
    expect(exported.excludedEntryIds).toEqual([]);
    expect(exported.matches[0]).toMatchObject({
      status: "verified-printing",
      setMapping: { tcgdexSetId: "base1", tcgplayerSetCode: "BS" },
      printingMapping: { tcgdexCardId: "base1-44", tcgplayerProductName: "Bulbasaur" },
    });
  });

  it("contains only set mappings checked against the official TCGplayer Mass Entry list", () => {
    expect(TCGPLAYER_SET_MAPPINGS.map(({ tcgdexSetId, tcgplayerSetCode }) => [tcgdexSetId, tcgplayerSetCode])).toEqual([
      ["base1", "BS"],
      ["base2", "JU"],
      ["base3", "FO"],
      ["swsh1", "SWSH01"],
      ["swsh4", "SWSH04"],
      ["sv01", "SVI"],
      ["sv02", "PAL"],
      ["sv03", "OBF"],
    ]);
    expect(TCGPLAYER_SET_MAPPINGS.every((mapping) => mapping.language === "en")).toBe(true);
    expect(TCGPLAYER_SET_MAPPINGS.every((mapping) => mapping.source === "https://www.tcgplayer.com/massentry")).toBe(true);
    expect(TCGPLAYER_SET_MAPPINGS.every((mapping) => mapping.verifiedAt === "2026-09-27")).toBe(true);
    expect(TCGPLAYER_PRINTING_MAPPINGS.map((mapping) => mapping.tcgdexCardId)).toEqual(["base1-44", "sv02-12", "sv02-203"]);
    expect(TCGPLAYER_PRINTING_MAPPINGS.every((mapping) => mapping.source === "https://www.tcgplayer.com/massentry")).toBe(true);
    expect(TCGPLAYER_PRINTING_MAPPINGS.every((mapping) => mapping.verifiedAt === "2026-09-27")).toBe(true);
  });

  it("keeps an English card from an unmapped set visible as a candidate but excludes it", () => {
    const item = missingItem({
      card: { ...missingItem().card, setId: "basep", setName: "Wizards Black Star Promos" },
    });
    const exported = createTcgplayerMassEntryExport([item], TCGPLAYER_SET_MAPPINGS, TCGPLAYER_PRINTING_MAPPINGS);

    expect(exported.text).toBe("");
    expect(exported.matches[0]).toMatchObject({ status: "candidate" });
    expect(exported.excludedEntryIds).toEqual(item.entryIds);
    expect(exported.warnings).toContain("1 Position(en) haben keinen geprüften TCGplayer-Set-Code und wurden ausgeschlossen.");
  });

  it("does not promote a mapped set to a verified printing without a card-level parser test", () => {
    const item = missingItem({
      card: {
        ...missingItem().card,
        key: "tcgdex:base1-1:en",
        ref: { provider: "tcgdex", id: "base1-1", language: "en" },
        name: "Alakazam",
        collectorNumber: "001",
      },
    });
    const exported = createTcgplayerMassEntryExport([item], TCGPLAYER_SET_MAPPINGS, TCGPLAYER_PRINTING_MAPPINGS);

    expect(exported.text).toBe("");
    expect(exported.matches[0]).toMatchObject({
      status: "candidate",
      setMapping: { tcgplayerSetCode: "BS" },
      reason: "Der Set-Code ist geprüft, dieses konkrete Printing aber noch nicht im TCGplayer-Testset.",
    });
  });

  it("does not translate or export a German card name", () => {
    const item = missingItem({
      card: {
        ...missingItem().card,
        key: "tcgdex:base1-44:de",
        ref: { provider: "tcgdex", id: "base1-44", language: "de" },
        name: "Bisasam",
      },
    });
    const exported = createTcgplayerMassEntryExport([item], TCGPLAYER_SET_MAPPINGS, TCGPLAYER_PRINTING_MAPPINGS);

    expect(exported.text).toBe("");
    expect(exported.matches[0]).toMatchObject({
      status: "unresolved",
      reason: "Nur verifizierte englische Kartennamen werden an TCGplayer übergeben.",
    });
  });

  it("rejects unconfirmed physical cards and unsafe multiline fields", () => {
    const unknown = missingItem({ card: { ...missingItem().card, physicalStatus: "unknown" } });
    const multiline = missingItem({
      identityKey: "unsafe-name",
      card: { ...missingItem().card, name: "Bulbasaur\nPikachu" },
      entryIds: ["00000000-0000-4000-8000-000000000002"],
    });
    const exported = createTcgplayerMassEntryExport([unknown, multiline], TCGPLAYER_SET_MAPPINGS, TCGPLAYER_PRINTING_MAPPINGS);

    expect(exported.text).toBe("");
    expect(exported.matches.map((match) => match.status)).toEqual(["unresolved", "unresolved"]);
    expect(exported.excludedEntryIds).toEqual([...unknown.entryIds, ...multiline.entryIds]);
  });

  it("exports multiple verified eras without changing collector numbers", () => {
    const modern = missingItem({
      identityKey: "magikarp-pal",
      card: {
        ...missingItem().card,
        key: "tcgdex:sv02-203:en",
        ref: { provider: "tcgdex", id: "sv02-203", language: "en" },
        name: "Magikarp",
        setId: "sv02",
        setName: "Paldea Evolved",
        collectorNumber: "203",
      },
      quantity: 1,
      entryIds: ["00000000-0000-4000-8000-000000000003"],
    });
    const exported = createTcgplayerMassEntryExport([missingItem(), modern], TCGPLAYER_SET_MAPPINGS, TCGPLAYER_PRINTING_MAPPINGS);

    expect(exported.text).toBe("2 Bulbasaur [BS] 044/102\n1 Magikarp - 203/193 [PAL] 203/193");
    expect(exported.verifiedCount).toBe(2);
  });
});
