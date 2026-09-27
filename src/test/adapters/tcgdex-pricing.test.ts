import { describe, expect, it } from "vitest";

import { parseTCGdexPriceEstimates } from "@/data/pricing/tcgdex-pricing";

const fetchedAt = "2026-09-27T10:00:00.000Z";
const furretPricing = {
  cardmarket: { updated: "2026-09-27T09:52:36.612Z", unit: "EUR", trend: 0.1, "trend-holo": 0.23 },
  tcgplayer: {
    updated: "2026-09-27T09:52:52.817Z",
    unit: "USD",
    normal: { marketPrice: 0.25 },
    "reverse-holofoil": { marketPrice: 0.45 },
  },
};

describe("TCGdex pricing normalization", () => {
  it("normalizes live-confirmed ISO/string/currency shapes into integer minor units", () => {
    const result = parseTCGdexPriceEstimates(furretPricing, {
      fetchedAt,
      language: "en",
      variant: { finish: "normal", edition: "unspecified" },
      printingMatch: "verified-printing",
    });

    expect(result.estimates).toEqual([
      {
        source: "tcgdex-cardmarket",
        currency: "EUR",
        amountMinor: 10,
        metric: "trend",
        fetchedAt,
        sourceUpdatedAt: "2026-09-27T09:52:36.612Z",
        matchQuality: "candidate",
        variantKey: "normal",
      },
      {
        source: "tcgdex-tcgplayer",
        currency: "USD",
        amountMinor: 25,
        metric: "market",
        fetchedAt,
        sourceUpdatedAt: "2026-09-27T09:52:52.817Z",
        matchQuality: "candidate",
        variantKey: "normal",
      },
    ]);
  });

  it("uses the explicit reverse-holofoil key and never infers a Cardmarket reverse value", () => {
    const result = parseTCGdexPriceEstimates(furretPricing, {
      fetchedAt,
      language: "en",
      variant: { finish: "reverse", edition: "unspecified" },
      printingMatch: "verified-printing",
    });

    expect(result.estimates).toEqual([
      expect.objectContaining({ source: "tcgdex-tcgplayer", amountMinor: 45, variantKey: "reverse-holofoil", matchQuality: "candidate" }),
    ]);
    expect(result.issues).toContainEqual(expect.objectContaining({ provider: "cardmarket", code: "unsupported-variant" }));
  });

  it("does not substitute a generic normal price for a requested first-edition printing", () => {
    const result = parseTCGdexPriceEstimates(furretPricing, {
      fetchedAt,
      language: "en",
      variant: { finish: "normal", edition: "first-edition" },
      printingMatch: "verified-printing",
    });

    expect(result.estimates).toEqual([]);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ provider: "cardmarket", code: "unsupported-variant" }),
      expect.objectContaining({ provider: "tcgplayer", code: "missing-metric", message: expect.stringContaining("1st-edition") }),
    ]));
  });

  it("rejects zero, negative, fractional-cent and non-finite amounts instead of displaying zero", () => {
    for (const marketPrice of [0, -1, 1.001, Number.POSITIVE_INFINITY]) {
      const result = parseTCGdexPriceEstimates({
        tcgplayer: { updated: "2026-09-27T09:52:52.817Z", unit: "USD", normal: { marketPrice } },
      }, {
        fetchedAt,
        language: "en",
        variant: { finish: "normal", edition: "unspecified" },
        printingMatch: "candidate",
      });
      expect(result.estimates).toEqual([]);
      expect(result.issues).toContainEqual(expect.objectContaining({ provider: "tcgplayer", code: "invalid-amount" }));
    }
  });

  it("requires provider currency and source timestamp rather than replacing them with fetch metadata", () => {
    const result = parseTCGdexPriceEstimates({
      cardmarket: { updated: 1_790_490_000, unit: "EUR", trend: 1 },
      tcgplayer: { updated: "not-a-date", unit: 1, normal: { marketPrice: 1 } },
    }, {
      fetchedAt,
      language: "en",
      variant: { finish: "normal", edition: "unspecified" },
      printingMatch: "candidate",
    });

    expect(result.estimates).toEqual([]);
    expect(result.issues.map((issue) => issue.code)).toEqual(["invalid-source-time", "unexpected-currency"]);
  });

  it("never uses TCGplayer data for German card identity and marks Cardmarket language coverage ambiguous", () => {
    const result = parseTCGdexPriceEstimates(furretPricing, {
      fetchedAt,
      language: "de",
      variant: { finish: "normal", edition: "unspecified" },
      printingMatch: "verified-printing",
    });

    expect(result.estimates).toEqual([expect.objectContaining({ source: "tcgdex-cardmarket", matchQuality: "candidate" })]);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ provider: "cardmarket", code: "ambiguous-language" }),
      expect.objectContaining({ provider: "tcgplayer", code: "ambiguous-language" }),
    ]));
  });

  it("rejects unknown response shapes and invalid fetch timestamps", () => {
    expect(parseTCGdexPriceEstimates([], {
      fetchedAt,
      language: "en",
      variant: { finish: "normal", edition: "unspecified" },
      printingMatch: "candidate",
    }).estimates).toEqual([]);
    expect(parseTCGdexPriceEstimates({}, {
      fetchedAt: "today",
      language: "en",
      variant: { finish: "normal", edition: "unspecified" },
      printingMatch: "candidate",
    }).issues).toEqual([expect.objectContaining({ code: "invalid-fetch-time" })]);
  });
});
