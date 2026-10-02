import { describe, expect, it } from "vitest";

import { GIFT_THEME_PRESETS } from "@/domain/gift-theme-presets";
import { parseSemanticQuery } from "@/domain/semantic-card-search";

describe("gift theme presets", () => {
  it("offers ten unique themes backed by the frozen semantic vocabulary", () => {
    expect(GIFT_THEME_PRESETS).toHaveLength(10);
    expect(new Set(GIFT_THEME_PRESETS.map((theme) => theme.id))).toHaveLength(10);

    for (const theme of GIFT_THEME_PRESETS) {
      const parsed = parseSemanticQuery(theme.query);
      expect(parsed.mappedTags, theme.label).toEqual(expect.arrayContaining([...theme.mappedTags]));
      expect(parsed.unmappedTerms, theme.label).toEqual([]);
    }
  });
});
