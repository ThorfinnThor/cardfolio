import { describe, expect, it } from "vitest";

import identityData from "../../../public/data/marketplace/cardmarket-decklist-identities.v1.json";
import { parseCardmarketDecklistIdentityCatalog } from "@/data/marketplace/cardmarket-decklist-identities";

describe("Cardmarket decklist identity catalog", () => {
  it("covers the full physical catalog and keeps its totals consistent", () => {
    const catalog = parseCardmarketDecklistIdentityCatalog(identityData);

    expect(catalog.audit.physicalCardCount).toBeGreaterThan(20_000);
    expect(catalog.audit.catalogDeclaredCardCount).toBeGreaterThanOrEqual(catalog.audit.physicalCardCount);
    expect(catalog.audit.verifiedCardCount).toBe(Object.keys(catalog.identities).length);
    expect(catalog.audit.correctedIdentityCount).toBeGreaterThan(1_000);
    expect(catalog.identities["dp2-16"]).toBe("Typhlosion Lv.46 Firestarter Evaporating Heat");
    expect(catalog.identities["hgss1-110"]).toBe("Typhlosion Afterburner Flare Destroy Prime");
    expect(catalog.identities["pl1-99"]).toBe("Torchic Lv.12 Focus Energy Fire Shard");
    expect(catalog.identities["sm9-1"]).toBe("Celebi & Venusaur GX Pollen Hazard Solar Beam Evergreen GX");
  });

  it("rejects a missing identity hidden by manipulated totals", () => {
    const identities: Record<string, string> = { ...identityData.identities };
    delete identities["dp2-16"];
    expect(() => parseCardmarketDecklistIdentityCatalog({ ...identityData, identities })).toThrow(/Summen/);
  });
});
