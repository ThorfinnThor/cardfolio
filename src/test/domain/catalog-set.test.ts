import { describe, expect, it } from "vitest";

import { catalogSetAssetUrl, catalogSetKey, searchCatalogSetIndex, type CatalogSetIndexEntry } from "@/domain/catalog-set";

const sets: CatalogSetIndexEntry[] = [
  {
    provider: "tcgdex",
    id: "base1",
    names: { de: "Grundset", en: "Base Set" },
    series: { de: { id: "base", name: "Originalserie" }, en: { id: "base", name: "Base" } },
    releaseDate: "1999-01-09",
    cardCount: { official: 102, total: 102 },
    assets: { en: { logo: { kind: "logo", baseUrl: "https://assets.tcgdex.net/en/base/base1/logo" } } },
  },
  {
    provider: "tcgdex",
    id: "sv01",
    names: { de: "Karmesin & Purpur", en: "Scarlet & Violet" },
    series: { de: { id: "sv", name: "Karmesin & Purpur" }, en: { id: "sv", name: "Scarlet & Violet" } },
    releaseDate: "2023-03-31",
    cardCount: { official: 198, total: 258 },
    assets: {},
  },
];

describe("catalog set metadata", () => {
  it("searches localized names, series and stable IDs", () => {
    expect(searchCatalogSetIndex(sets, "grund", "de").map((set) => set.id)).toEqual(["base1"]);
    expect(searchCatalogSetIndex(sets, "scarlet", "en").map((set) => set.id)).toEqual(["sv01"]);
    expect(searchCatalogSetIndex(sets, "sv01", "all").map((set) => set.id)).toEqual(["sv01"]);
  });

  it("creates stable provider keys and displayable asset URLs", () => {
    expect(catalogSetKey("tcgdex", "base1")).toBe("tcgdex:base1");
    const logo = sets[0].assets.en?.logo;
    expect(logo).toBeDefined();
    if (!logo) throw new Error("Fixture logo is missing.");
    expect(catalogSetAssetUrl(logo, "webp")).toBe("https://assets.tcgdex.net/en/base/base1/logo.webp");
  });

  it("rejects insecure asset origins", () => {
    expect(() => catalogSetAssetUrl({ kind: "symbol", baseUrl: "http://example.test/symbol" })).toThrow("HTTPS");
  });
});
