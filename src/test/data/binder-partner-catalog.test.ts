import { describe, expect, it } from "vitest";

import partnerData from "../../../public/data/partners/binder-partners.v1.json";
import { parseBinderPartnerCatalog, ReviewedBinderAffiliateAdapter } from "@/data/partners/binder-affiliate-adapter";

describe("production binder partner catalog", () => {
  it("exposes three reviewed Pokémon-compatible binders with checked prices", () => {
    const catalog = parseBinderPartnerCatalog(partnerData);
    const adapter = new ReviewedBinderAffiliateAdapter(catalog);
    const offers = adapter.listOffers(new Date("2026-10-19T12:00:00Z"));

    expect(offers).toHaveLength(3);
    expect(offers.every((offer) => offer.status === "available")).toBe(true);
    expect(offers.every((offer) => offer.capacityCards === 360 && offer.pocketsPerPage === 9)).toBe(true);
    expect(offers.map((offer) => offer.price?.amountMinor)).toEqual([1799, 3163, 2849]);
  });

  it("sends all three offers to Amazon with the affiliate tag and visible disclosure", () => {
    const adapter = new ReviewedBinderAffiliateAdapter(parseBinderPartnerCatalog(partnerData));
    const now = new Date("2026-10-19T12:00:00Z");
    const offers = adapter.listOffers(now);

    expect(offers.every((offer) => offer.affiliate && offer.affiliateDisclosure?.includes("Werbelink"))).toBe(true);
    expect(offers[0]).toMatchObject({ price: { amountMinor: 1799, currency: "EUR", qualifier: "fixed" } });

    const targets = offers.map((offer) => new URL(adapter.buildExternalUrl(offer.id, now) ?? ""));
    expect(targets.map((target) => target.pathname)).toEqual(["/dp/B01MTYY0IB", "/dp/B0GRHHKR8G", "/dp/B00VBQHKFU"]);
    for (const target of targets) {
      expect(target.origin).toBe("https://www.amazon.de");
      expect(target.searchParams.get("tag")).toBe("cardbinder-21");
      expect(target.searchParams.get("linkCode")).toBe("ll2");
    }
    expect(targets[0].searchParams.get("linkId")).toBe("56e8c4651397e6496c96436b71e99d5f");
  });

  it("closes external routes after the documented review deadline", () => {
    const adapter = new ReviewedBinderAffiliateAdapter(parseBinderPartnerCatalog(partnerData));

    expect(adapter.getOffer("vaultx-amazon-9-pocket", new Date("2026-11-20T00:00:00Z"))).toMatchObject({ status: "stale" });
    expect(adapter.buildExternalUrl("vaultx-amazon-9-pocket", new Date("2026-11-20T00:00:00Z"))).toBeUndefined();
  });
});
