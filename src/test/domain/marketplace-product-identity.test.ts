import { describe, expect, it } from "vitest";

import {
  marketplaceProductIdentityIssues,
  resolveMarketplaceProductIdentity,
  type MarketplaceProductIdentityMapping,
} from "@/domain/marketplace-product-identity";
import type { MissingItem } from "@/domain/types";

const item: MissingItem = {
  identityKey: "torchic-pl1-99",
  card: {
    key: "tcgdex:pl1-99:en",
    ref: { provider: "tcgdex", id: "pl1-99", language: "en" },
    name: "Torchic",
    setId: "pl1",
    setName: "Platinum",
    collectorNumber: "99",
    collectorTotal: "127",
    physicalStatus: "physical",
    fetchedAt: "2026-10-12T00:00:00.000Z",
  },
  variant: { finish: "normal", edition: "unlimited", printing: "shadowed" },
  preferences: { minimumCondition: "excellent" },
  quantity: 1,
  entryIds: ["00000000-0000-4000-8000-000000000099"],
};

function mapping(overrides: Partial<MarketplaceProductIdentityMapping> = {}): MarketplaceProductIdentityMapping {
  return {
    schemaVersion: 1,
    provider: "cardmarket",
    tcgdexCardId: "pl1-99",
    cardName: "Torchic Lv.12",
    scope: { language: "any", finish: "any", edition: "any", printing: "any" },
    status: "verified",
    productUrl: "https://www.cardmarket.com/en/Pokemon/Cards/Torchic-Lv12-Focus-Energy-Fire-Shard",
    source: {
      kind: "manual-product-review",
      label: "Cardmarket-Produktseite manuell mit Set und Kartennummer geprüft",
      evidenceUrl: "https://www.cardmarket.com/en/Pokemon/Cards/Torchic-Lv12-Focus-Energy-Fire-Shard",
    },
    checkedAt: "2026-10-12T00:00:00.000Z",
    verifiedAt: "2026-10-12T00:00:00.000Z",
    ...overrides,
  };
}

describe("marketplace product identity", () => {
  it("returns one valid verified product as order-ready identity", () => {
    const result = resolveMarketplaceProductIdentity("cardmarket", item, [mapping()]);

    expect(result.status).toBe("verified");
    expect(result.mapping?.productUrl).toContain("Torchic-Lv12");
  });

  it("prefers the most specific scope over a generic candidate", () => {
    const generic = mapping({
      status: "probable",
      productUrl: undefined,
      verifiedAt: undefined,
      source: { kind: "catalog-text-match", label: "Textkandidat" },
    });
    const exact = mapping({
      scope: { language: "en", finish: "normal", edition: "unlimited", printing: "shadowed" },
    });

    expect(resolveMarketplaceProductIdentity("cardmarket", item, [generic, exact]).mapping).toBe(exact);
  });

  it("never promotes a probable text match to verified", () => {
    const probable = mapping({
      status: "probable",
      productUrl: undefined,
      verifiedAt: undefined,
      source: { kind: "catalog-text-match", label: "Set-, Nummer- und Namenstreffer" },
    });

    expect(resolveMarketplaceProductIdentity("cardmarket", item, [probable])).toMatchObject({
      status: "probable",
      mapping: probable,
    });
  });

  it("returns missing when no applicable reviewed row exists", () => {
    const result = resolveMarketplaceProductIdentity("cardmarket", item, [
      mapping({ tcgdexCardId: "pl1-98" }),
    ]);

    expect(result).toMatchObject({ status: "missing", candidates: [] });
  });

  it("rejects an unverifiable provider URL and a verified legacy override", () => {
    const issues = marketplaceProductIdentityIssues(mapping({
      productUrl: "https://example.com/torchic",
      source: { kind: "legacy-override", label: "Temporärer Namensfix" },
    }));

    expect(issues.join(" ")).toMatch(/Produkt-URL/);
    expect(issues.join(" ")).toMatch(/Legacy-Overrides/);
  });

  it("allows an explicit reviewed missing row without a product identity", () => {
    const missing = mapping({
      status: "missing",
      productUrl: undefined,
      verifiedAt: undefined,
      source: { kind: "manual-product-review", label: "Cardmarket geprüft" },
      note: "Kein Cardmarket-Produkt für diese Ausgabe gefunden.",
    });

    expect(marketplaceProductIdentityIssues(missing)).toEqual([]);
    expect(resolveMarketplaceProductIdentity("cardmarket", item, [missing])).toMatchObject({
      status: "missing",
      reason: "Kein Cardmarket-Produkt für diese Ausgabe gefunden.",
    });
  });
});
