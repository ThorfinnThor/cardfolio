import { describe, expect, it } from "vitest";

import { TCGPLAYER_PRINTING_MAPPINGS } from "@/data/marketplace/tcgplayer-printing-mappings";
import { TCGPLAYER_SET_MAPPINGS } from "@/data/marketplace/tcgplayer-set-mappings";
import { createTcgplayerMassEntryExport, createTcgplayerMassEntryUrl, TCGPLAYER_MASS_ENTRY_URL, toTcgplayerItemNumber } from "@/domain/tcgplayer-export";
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
    expect(exported.readyCount).toBe(1);
    expect(exported.excludedEntryIds).toEqual([]);
    expect(exported.massEntryPrefilled).toBe(true);
    const handoffUrl = new URL(exported.massEntryUrl);
    expect(`${handoffUrl.origin}${handoffUrl.pathname}`).toBe(TCGPLAYER_MASS_ENTRY_URL);
    expect(handoffUrl.searchParams.get("c")).toBe("2 Bulbasaur [BS] 044/102");
    expect(handoffUrl.searchParams.get("productline")).toBe("Pokemon");
    expect(exported.matches[0]).toMatchObject({
      status: "verified-printing",
      printingHint: "Unlimited",
      conditionHint: "Near Mint",
      setMapping: { tcgdexSetId: "base1", tcgplayerSetCode: "BS" },
      printingMapping: { tcgdexCardId: "base1-44", tcgplayerProductName: "Bulbasaur" },
    });
  });

  it("contains only set mappings checked against the official TCGplayer Mass Entry list", () => {
    expect(TCGPLAYER_SET_MAPPINGS.map(({ tcgdexSetId, tcgplayerSetCode }) => [tcgdexSetId, tcgplayerSetCode])).toEqual([
      ["base1", "BS"],
      ["base1", "BS"],
      ["base2", "JU"],
      ["base3", "FO"],
      ["neo1", "N1"],
      ["gym2", "G2"],
      ["ex14", "CG"],
      ["swsh1", "SWSH01"],
      ["swsh4", "SWSH04"],
      ["sv01", "SVI"],
      ["sv02", "PAL"],
      ["sv03", "OBF"],
    ]);
    expect(TCGPLAYER_SET_MAPPINGS.every((mapping) => mapping.language === "en" || ["base1", "neo1"].includes(mapping.tcgdexSetId))).toBe(true);
    expect(TCGPLAYER_SET_MAPPINGS.every((mapping) => mapping.source.startsWith("https://www.tcgplayer.com/"))).toBe(true);
    expect(TCGPLAYER_SET_MAPPINGS.every((mapping) => /^2026-09-(27|28)$/.test(mapping.verifiedAt))).toBe(true);
    expect(TCGPLAYER_PRINTING_MAPPINGS.map((mapping) => mapping.tcgdexCardId)).toEqual([
      "base1-4",
      "base1-4",
      "base1-30",
      "base1-44",
      "base1-58",
      "neo1-17",
      "gym2-2",
      "ex14-4",
      "sv02-12",
      "sv02-203",
    ]);
    expect(TCGPLAYER_PRINTING_MAPPINGS.every((mapping) => mapping.source.startsWith("https://www.tcgplayer.com/"))).toBe(true);
    expect(TCGPLAYER_PRINTING_MAPPINGS.every((mapping) => /^2026-09-(27|28)$/.test(mapping.verifiedAt))).toBe(true);
  });

  it("keeps an English card from an unmapped set visible as a candidate but excludes it", () => {
    const item = missingItem({
      card: { ...missingItem().card, setId: "basep", setName: "Wizards Black Star Promos" },
    });
    const exported = createTcgplayerMassEntryExport([item], TCGPLAYER_SET_MAPPINGS, TCGPLAYER_PRINTING_MAPPINGS);

    expect(exported.text).toBe("");
    expect(exported.matches[0]).toMatchObject({ status: "candidate" });
    expect(exported.excludedEntryIds).toEqual(item.entryIds);
    expect(exported.warnings).toContain("1 Position hat keinen geprüften TCGplayer-Set-Code und wird nicht in die TCGplayer-Liste übernommen.");
  });

  it("excludes an English mapped-set candidate until the printing is parser-tested", () => {
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
      reason: "Der Set-Code ist geprüft, dieses konkrete Printing aber noch nicht im TCGplayer-Testset und wird deshalb nicht in die TCGplayer-Liste übernommen.",
    });
    expect(exported.readyCount).toBe(0);
    expect(exported.verifiedCount).toBe(0);
    expect(exported.reviewRequiredCount).toBe(1);
    expect(exported.excludedEntryIds).toEqual(item.entryIds);
  });

  it("does not infer a TCGplayer name for an unverified German card", () => {
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
      reason: "Für diese deutsche Karte ist kein geprüfter englischer TCGplayer-Name hinterlegt.",
    });
  });

  it("does not send a Shadowless selection through the regular Base Set code", () => {
    const shadowless = missingItem({
      variant: { finish: "normal", edition: "unlimited", printing: "shadowless" },
    });

    const exported = createTcgplayerMassEntryExport([shadowless], TCGPLAYER_SET_MAPPINGS, TCGPLAYER_PRINTING_MAPPINGS);

    expect(exported.text).toBe("");
    expect(exported.matches[0]).toMatchObject({
      status: "candidate",
      reason: "Shadowless verwendet bei TCGplayer eine eigene Set-Zuordnung und wird ohne separat geprüftes Printing nicht in die TCGplayer-Liste übernommen.",
    });
    expect(exported.excludedEntryIds).toEqual(shadowless.entryIds);
  });

  it("exports the exact verified German Tornupto identity and English Blaine's Charizard printing", () => {
    const typhlosion = missingItem({
      identityKey: "tornupto-neo-genesis",
      card: {
        ...missingItem().card,
        key: "tcgdex:neo1-17:de",
        ref: { provider: "tcgdex", id: "neo1-17", language: "de" },
        name: "Tornupto",
        setId: "neo1",
        setName: "Neo Genesis",
        collectorNumber: "17",
        collectorTotal: "111",
      },
      quantity: 1,
    });
    const blainesCharizard = missingItem({
      identityKey: "blaines-charizard-gym-challenge",
      card: {
        ...missingItem().card,
        key: "tcgdex:gym2-2:en",
        ref: { provider: "tcgdex", id: "gym2-2", language: "en" },
        name: "Blaine's Charizard",
        setId: "gym2",
        setName: "Gym Challenge",
        collectorNumber: "2",
        collectorTotal: "132",
      },
      quantity: 1,
    });

    const exported = createTcgplayerMassEntryExport(
      [typhlosion, blainesCharizard],
      TCGPLAYER_SET_MAPPINGS,
      TCGPLAYER_PRINTING_MAPPINGS,
    );

    expect(exported.text).toBe("1 Typhlosion (17) [N1] 017/111\n1 Blaine's Charizard [G2] 002/132");
    expect(exported.verifiedCount).toBe(2);
    expect(exported.reviewRequiredCount).toBe(0);
    expect(exported.matches.map((match) => match.collectorNumber)).toEqual(["17/111", "2/132"]);
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

  it("exports TCGplayer's full displayed collector number", () => {
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

  it("preserves the full collector number required by TCGplayer's Pokemon parser", () => {
    expect(toTcgplayerItemNumber("002/132")).toBe("002/132");
    expect(toTcgplayerItemNumber("017/111")).toBe("017/111");
    expect(toTcgplayerItemNumber("TG01/TG30")).toBe("TG01/TG30");
  });

  it("falls back to the generic Mass Entry page when a prefilled URL would be too long", () => {
    const veryLongText = Array.from({ length: 300 }, (_, index) => `1 Test Card ${index} [BS] ${index}/999`).join("\n");
    expect(createTcgplayerMassEntryUrl(veryLongText)).toBe(TCGPLAYER_MASS_ENTRY_URL);
  });
});
