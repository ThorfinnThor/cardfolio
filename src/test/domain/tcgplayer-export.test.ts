import { describe, expect, it } from "vitest";

import { TCGPLAYER_PRINTING_MAPPINGS } from "@/data/marketplace/tcgplayer-printing-mappings";
import { TCGPLAYER_SET_COVERAGE, TCGPLAYER_SET_MAPPINGS, TCGPLAYER_UNAVAILABLE_SETS } from "@/data/marketplace/tcgplayer-set-mappings";
import { createTcgplayerMassEntryExport, createTcgplayerMassEntryUrl, TCGPLAYER_MASS_ENTRY_URL, toTcgplayerItemNumber } from "@/domain/tcgplayer-export";
import type { TcgplayerCardMapping } from "@/domain/tcgplayer-export";
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
    variant: { finish: "normal", edition: "unlimited", printing: "shadowed" },
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

  it("accounts for every physical TCGdex set using the official Mass Entry list", () => {
    expect(TCGPLAYER_SET_COVERAGE).toMatchObject({ catalogSetCount: 205, mappedSetCount: 203, unavailableSetCount: 2 });
    expect(new Set(TCGPLAYER_SET_MAPPINGS.map((mapping) => mapping.tcgdexSetId)).size).toBe(203);
    expect(TCGPLAYER_UNAVAILABLE_SETS.map((set) => set.tcgdexSetId).toSorted()).toEqual(["fut2020", "mfb"]);
    expect(TCGPLAYER_SET_MAPPINGS).toEqual(expect.arrayContaining([
      expect.objectContaining({ tcgdexSetId: "xy8", tcgplayerSetCode: "BKT" }),
      expect.objectContaining({ tcgdexSetId: "neo4", tcgplayerSetCode: "N4" }),
      expect.objectContaining({ tcgdexSetId: "ex15", tcgplayerSetCode: "DF" }),
      expect.objectContaining({ tcgdexSetId: "base1", tcgplayerSetCode: "BSS" }),
    ]));
    expect(TCGPLAYER_SET_MAPPINGS.every((mapping) => mapping.source.startsWith("https://www.tcgplayer.com/"))).toBe(true);
    expect(TCGPLAYER_SET_MAPPINGS.every((mapping) => !Number.isNaN(Date.parse(mapping.verifiedAt)))).toBe(true);
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

  it("keeps a card from an unknown set visible as a candidate but excludes it", () => {
    const item = missingItem({
      card: { ...missingItem().card, setId: "unknown-set", setName: "Unknown Set" },
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
      reason: "Für diese Karte wurde im aktuellen TCGplayer-Katalog kein eindeutiges Produkt mit passender Kartennummer gefunden.",
    });
    expect(exported.readyCount).toBe(0);
    expect(exported.verifiedCount).toBe(0);
    expect(exported.reviewRequiredCount).toBe(1);
    expect(exported.excludedEntryIds).toEqual(item.entryIds);
  });

  it("uses the verified TCGplayer catalog identity for a German card", () => {
    const item = missingItem({
      card: {
        ...missingItem().card,
        key: "tcgdex:xy8-20:de",
        ref: { provider: "tcgdex", id: "xy8-20", language: "de" },
        name: "Tornupto",
        setId: "xy8",
        setName: "TURBOstart",
        collectorNumber: "20",
        collectorTotal: "162",
      },
      variant: { finish: "holo", edition: "unlimited", printing: "shadowed" },
    });
    const mappings: TcgplayerCardMapping[] = [{
      tcgdexCardId: "xy8-20",
      tcgdexName: "Typhlosion",
      candidates: [{ productName: "Typhlosion", collectorNumber: "20/162", tcgplayerSetCode: "BKT", tcgplayerSetName: "XY - BREAKthrough", foilOnly: true, productId: 107139 }],
    }];
    const exported = createTcgplayerMassEntryExport([item], TCGPLAYER_SET_MAPPINGS, TCGPLAYER_PRINTING_MAPPINGS, mappings);

    expect(exported.text).toBe("2 Typhlosion [BKT] 20/162");
    expect(exported.matches[0]).toMatchObject({
      status: "catalog-verified",
      cardCandidate: { productId: 107139 },
    });
  });

  it("uses the dedicated Shadowless set code when Shadowless is selected", () => {
    const shadowless = missingItem({
      variant: { finish: "normal", edition: "unlimited", printing: "shadowless" },
    });
    const mappings: TcgplayerCardMapping[] = [{
      tcgdexCardId: "base1-44",
      tcgdexName: "Bulbasaur",
      candidates: [
        { productName: "Bulbasaur", collectorNumber: "044/102", tcgplayerSetCode: "BS", tcgplayerSetName: "Base Set", foilOnly: false, productId: 42392 },
        { productName: "Bulbasaur", collectorNumber: "044/102", tcgplayerSetCode: "BSS", tcgplayerSetName: "Base Set (Shadowless)", foilOnly: false, productId: 107040 },
      ],
    }];

    const exported = createTcgplayerMassEntryExport([shadowless], TCGPLAYER_SET_MAPPINGS, TCGPLAYER_PRINTING_MAPPINGS, mappings);

    expect(exported.text).toBe("2 Bulbasaur [BSS] 044/102");
    expect(exported.matches[0]).toMatchObject({
      status: "catalog-verified",
      cardCandidate: { tcgplayerSetCode: "BSS" },
    });
    expect(exported.excludedEntryIds).toEqual([]);
  });

  it("uses a cross-listed Deck Exclusives product for Base Set Machamp", () => {
    const machamp = missingItem({
      identityKey: "machamp-base-set",
      card: {
        ...missingItem().card,
        key: "tcgdex:base1-8:en",
        ref: { provider: "tcgdex", id: "base1-8", language: "en" },
        name: "Machamp",
        collectorNumber: "8",
        collectorTotal: "102",
      },
      variant: { finish: "holo", edition: "first-edition", printing: "shadowless" },
      quantity: 1,
    });
    const mappings: TcgplayerCardMapping[] = [{
      tcgdexCardId: "base1-8",
      tcgdexName: "Machamp",
      candidates: [
        { productName: "Machamp - 8/102", collectorNumber: "008/102", tcgplayerSetCode: "PR", tcgplayerSetName: "Deck Exclusives", foilOnly: true, productId: 42425 },
        { productName: "Machamp - 8/102 (Base Set Shadowless)", collectorNumber: "008/102", tcgplayerSetCode: "PR", tcgplayerSetName: "Deck Exclusives", foilOnly: true, productId: 107004 },
      ],
    }];

    const exported = createTcgplayerMassEntryExport(
      [machamp],
      TCGPLAYER_SET_MAPPINGS,
      TCGPLAYER_PRINTING_MAPPINGS,
      mappings,
    );

    expect(exported.text).toBe("1 Machamp - 8/102 (Base Set Shadowless) [PR] 008/102");
    expect(exported.matches[0]).toMatchObject({
      status: "catalog-verified",
      cardCandidate: { productId: 107004, tcgplayerSetCode: "PR" },
    });
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
