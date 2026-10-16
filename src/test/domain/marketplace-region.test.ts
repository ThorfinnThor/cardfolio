import { describe, expect, it } from "vitest";

import { suggestMarketplaceRegion } from "@/domain/marketplace-region";

describe("suggestMarketplaceRegion", () => {
  it.each([
    [["de-DE", "de"], "europe"],
    [["de"], "europe"],
    [["fr-CH"], "europe"],
    [["en-GB"], "europe"],
    [["en-US", "en"], "north-america"],
    [["en-CA"], "north-america"],
    [["fr-CA"], "north-america"],
    [["en-AU"], "other"],
    [["ja-JP"], "other"],
    [["pt-BR"], "other"],
  ] as const)("%j -> %s", (languages, expected) => {
    expect(suggestMarketplaceRegion(languages)).toBe(expected);
  });

  it("assumes Europe for a missing language and uses only the first one", () => {
    expect(suggestMarketplaceRegion([])).toBe("europe");
    expect(suggestMarketplaceRegion(["", "  "])).toBe("europe");
    expect(suggestMarketplaceRegion(["en"])).toBe("europe");
    expect(suggestMarketplaceRegion(["de-DE", "en-US"])).toBe("europe");
    expect(suggestMarketplaceRegion(["en-US", "de-DE"])).toBe("north-america");
  });
});
