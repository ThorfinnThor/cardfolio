import { describe, expect, it } from "vitest";

import { createMissingItemsCsvExport, createMissingItemsTextExport } from "@/domain/missing-items-export";
import type { MissingItem } from "@/domain/types";

function missingItem(overrides: Partial<MissingItem> = {}): MissingItem {
  return {
    identityKey: "bulbasaur-normal",
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
    entryIds: ["00000000-0000-4000-8000-000000000001", "00000000-0000-4000-8000-000000000002"],
    ...overrides,
  };
}

describe("generic missing-item exports", () => {
  it("exports quantity, printing, language, variant and condition as neutral text", () => {
    const exported = createMissingItemsTextExport([missingItem()]);

    expect(exported.mimeType).toBe("text/plain");
    expect(exported.text).toContain("Menge | Name | Set | Nummer | Sprache | Finish | Edition | Druckvariante | Zustand | Prüfhinweis");
    expect(exported.text).toContain("2 | Bulbasaur | Base Set | 044 | EN | Normal | Unlimited | Mit Schatten / Standard | Near Mint");
    expect(exported.excludedEntryIds).toEqual([]);
    expect(exported.reviewRequiredCount).toBe(1);
    expect(exported.verifiedCount).toBe(0);
  });

  it("creates UTF-8 CSV with correct escaping and spreadsheet-formula neutralization", () => {
    const item = missingItem({
      card: {
        ...missingItem().card,
        name: '=HYPERLINK("https://example.invalid")',
        setName: "Set, \"Special\"\nLine",
        collectorNumber: "001",
      },
      variant: { finish: "other", edition: "first-edition", printing: "shadowless", label: "@custom" },
    });
    const exported = createMissingItemsCsvExport([item]);

    expect(exported.text.startsWith("\uFEFF")).toBe(true);
    expect(exported.text).toContain("\"'=HYPERLINK(\"\"https://example.invalid\"\")\"");
    expect(exported.text).toContain("\"Set, \"\"Special\"\"\nLine\"");
    expect(exported.text).toContain("\"'001\"");
    expect(exported.text).toContain("\"'@custom\"");
  });

  it("reports incomplete metadata instead of inventing a variant", () => {
    const item = missingItem({
      card: { ...missingItem().card, physicalStatus: "unknown" },
      variant: { finish: "unspecified", edition: "unspecified" },
      preferences: { minimumCondition: "any" },
    });
    const exported = createMissingItemsTextExport([item]);

    expect(exported.text).toContain("Nicht angegeben | Nicht angegeben | Nicht festgelegt | Beliebig");
    expect(exported.text).toContain("Manuell prüfen: Finish, Edition, Druckvariante, physische Ausgabe");
    expect(exported.warnings).toHaveLength(2);
  });

  it("supports CSV without BOM and a header-only empty export", () => {
    const exported = createMissingItemsCsvExport([], { includeBom: false });

    expect(exported.text.startsWith("\uFEFF")).toBe(false);
    expect(exported.text).toBe('"Menge","Name","Set","Nummer","Sprache","Finish","Edition","Druckvariante","Zustand","Prüfhinweis"');
    expect(exported.reviewRequiredCount).toBe(0);
  });
});
