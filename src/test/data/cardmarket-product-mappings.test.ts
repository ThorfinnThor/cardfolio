import { describe, expect, it } from "vitest";

import mappingData from "../../../public/data/marketplace/cardmarket-product-mappings.v1.json";
import {
  buildCardmarketProductMappingAudit,
  parseCardmarketProductMappingCatalog,
} from "@/data/marketplace/cardmarket-product-mappings";

describe("Cardmarket product mapping catalog", () => {
  it("parses the reviewed catalog and keeps the audit consistent", () => {
    const catalog = parseCardmarketProductMappingCatalog(mappingData);

    expect(catalog.audit).toEqual({
      reviewedScopeCardCount: 1,
      mappingCount: 1,
      verifiedCount: 1,
      probableCount: 0,
      missingCount: 0,
      invalidCount: 0,
      unmappedReviewedCardCount: 0,
    });
    expect(catalog.mappings[0].tcgdexCardId).toBe("pl1-99");
  });

  it("counts probable, missing and invalid rows without hiding them", () => {
    const reviewed = parseCardmarketProductMappingCatalog(mappingData).mappings[0];
    const mappings = [reviewed];
    mappings.push({
      ...reviewed,
      tcgdexCardId: "pl1-100",
      status: "probable",
      productUrl: undefined,
      verifiedAt: undefined,
      source: { ...reviewed.source, kind: "catalog-text-match", label: "Textkandidat" },
    });
    mappings.push({
      ...reviewed,
      tcgdexCardId: "pl1-101",
      status: "missing",
      productUrl: undefined,
      verifiedAt: undefined,
      source: { ...reviewed.source, kind: "manual-product-review", label: "Geprüft, aber nicht gefunden" },
    });
    mappings.push({
      ...reviewed,
      tcgdexCardId: "pl1-102",
      productUrl: "https://example.com/not-cardmarket",
    });

    expect(buildCardmarketProductMappingAudit(4, mappings)).toEqual({
      reviewedScopeCardCount: 4,
      mappingCount: 4,
      verifiedCount: 1,
      probableCount: 1,
      missingCount: 1,
      invalidCount: 1,
      unmappedReviewedCardCount: 0,
    });
  });

  it("rejects a tampered audit", () => {
    expect(() => parseCardmarketProductMappingCatalog({
      ...mappingData,
      audit: { ...mappingData.audit, verifiedCount: 0 },
    })).toThrow(/Audit/);
  });
});
