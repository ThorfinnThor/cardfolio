import { describe, expect, it } from "vitest";

import partnerData from "../../../public/data/partners/binder-partners.v1.json";
import { parseBinderPartnerCatalog, ReviewedBinderAffiliateAdapter } from "@/data/partners/binder-affiliate-adapter";

describe("production binder partner catalog", () => {
  it("exposes only the reviewed direct shop URL without tracking or personal data", () => {
    const catalog = parseBinderPartnerCatalog(partnerData);
    const adapter = new ReviewedBinderAffiliateAdapter(catalog);
    const offers = adapter.listOffers(new Date("2026-10-12T12:00:00Z"));

    expect(offers).toHaveLength(1);
    expect(offers[0]).toMatchObject({
      id: "vaultx-eu-9-pocket-zip",
      kind: "standard",
      status: "available",
      affiliate: false,
      capacityCards: 360,
      pocketsPerPage: 9,
      price: { amountMinor: 2699, currency: "EUR", qualifier: "from" },
    });

    const target = new URL(adapter.buildExternalUrl(offers[0].id, new Date("2026-10-12T12:00:00Z")) ?? "");
    expect(target.origin).toBe("https://eu.vaultx.com");
    expect(target.pathname).toBe("/collections/card-binders/products/9-pocket-exo-tec-zip-binder");
    expect(target.search).toBe("");
    expect(target.hash).toBe("");
  });

  it("closes the external route after the documented review deadline", () => {
    const adapter = new ReviewedBinderAffiliateAdapter(parseBinderPartnerCatalog(partnerData));

    expect(adapter.getOffer("vaultx-eu-9-pocket-zip", new Date("2026-10-27T00:00:00Z"))).toMatchObject({ status: "stale" });
    expect(adapter.buildExternalUrl("vaultx-eu-9-pocket-zip", new Date("2026-10-27T00:00:00Z"))).toBeUndefined();
  });
});
