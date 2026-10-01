import { describe, expect, it } from "vitest";

import { parseBinderPartnerCatalog, ReviewedBinderAffiliateAdapter } from "@/data/partners/binder-affiliate-adapter";
import type { BinderPartnerCatalog } from "@/domain/binder-affiliate";

function catalog(overrides: Partial<BinderPartnerCatalog> = {}): BinderPartnerCatalog {
  return {
    schemaVersion: 1,
    enabled: true,
    reviewedAt: "2026-10-01",
    partners: [{
      id: "example-binder",
      displayName: "Example Binder",
      enabled: true,
      verifiedAt: "2026-10-01",
      reviewAfter: "2026-11-01",
      destinationUrl: "https://partner.example/custom-binder?product=binder",
      affiliate: {
        enabled: true,
        text: "Affiliate-Link: Cardfolio kann eine Provision erhalten.",
        staticQuery: { ref: "cardfolio", campaign: "gift" },
      },
      capabilities: { personalization: true, photoUpload: false },
      evidenceUrls: ["https://partner.example/terms"],
    }],
    ...overrides,
  };
}

describe("reviewed binder affiliate adapter", () => {
  it("keeps a centrally disabled catalog unavailable without breaking its status output", () => {
    const adapter = new ReviewedBinderAffiliateAdapter(catalog({ enabled: false, disabledReason: "Freigabe ausstehend." }));
    expect(adapter.listOffers(new Date("2026-10-15T00:00:00Z"))).toEqual([
      expect.objectContaining({ id: "example-binder", status: "disabled", statusReason: "Freigabe ausstehend." }),
    ]);
    expect(adapter.buildExternalUrl("example-binder", new Date("2026-10-15T00:00:00Z"))).toBeUndefined();
  });

  it("blocks a stale offer even when its configuration is enabled", () => {
    const adapter = new ReviewedBinderAffiliateAdapter(catalog());
    expect(adapter.getOffer("example-binder", new Date("2026-11-02T00:00:00Z"))).toMatchObject({ status: "stale" });
    expect(adapter.buildExternalUrl("example-binder", new Date("2026-11-02T00:00:00Z"))).toBeUndefined();
  });

  it("constructs an HTTPS URL only from reviewed static configuration", () => {
    const adapter = new ReviewedBinderAffiliateAdapter(catalog());
    const built = adapter.buildExternalUrl("example-binder", new Date("2026-10-15T00:00:00Z"));
    const url = new URL(built ?? "");
    expect(url.origin).toBe("https://partner.example");
    expect(url.searchParams.get("product")).toBe("binder");
    expect(url.searchParams.get("ref")).toBe("cardfolio");
    expect(url.searchParams.get("campaign")).toBe("gift");
    expect(built).not.toContain("recipient");
  });

  it("keeps missing prices explicit instead of inventing a binder amount", () => {
    const adapter = new ReviewedBinderAffiliateAdapter(catalog());
    expect(adapter.getOffer("example-binder", new Date("2026-10-15T00:00:00Z"))).toMatchObject({
      status: "available",
      price: undefined,
      affiliateDisclosure: "Affiliate-Link: Cardfolio kann eine Provision erhalten.",
    });
  });

  it("invalidates affiliate offers without a disclosure and rejects malformed catalogs", () => {
    const broken = catalog({
      partners: [{ ...catalog().partners[0], affiliate: { enabled: true } }],
    });
    expect(new ReviewedBinderAffiliateAdapter(broken).getOffer("example-binder", new Date("2026-10-15T00:00:00Z")))
      .toMatchObject({ status: "invalid", statusReason: expect.stringContaining("Kennzeichnung") });
    expect(() => parseBinderPartnerCatalog({ schemaVersion: 1, enabled: true, reviewedAt: "2026-10-01", partners: [{}] }))
      .toThrow(/ungültiges Format/);
  });
});
