import { describe, expect, it } from "vitest";

import { defaultVariant } from "@/components/foundation/GiftBuilderPanel";
import type { CardSnapshot } from "@/domain/types";

function card(setId: string, id: string, language: "en" | "de", variants: NonNullable<CardSnapshot["availableVariants"]>): CardSnapshot {
  return {
    key: `tcgdex:${id}:${language}`,
    ref: { provider: "tcgdex", id, language },
    name: "Ponyta",
    setId,
    setName: "Set",
    collectorNumber: "60",
    physicalStatus: "physical",
    availableVariants: variants,
    fetchedAt: "2026-10-22T00:00:00.000Z",
  };
}

describe("default variant of a gift card", () => {
  it("is the 1st edition (shadowless in the English Base Set) for sets whose scan shows it, so the shown card is the priced card", () => {
    expect(defaultVariant(card("base1", "base1-60", "en", { normal: true, holo: false, reverse: false, firstEdition: true, shadowless: true })))
      .toEqual({ finish: "normal", edition: "first-edition", printing: "shadowless" });
    expect(defaultVariant(card("neo1", "neo1-20", "en", { normal: false, holo: true, reverse: false, firstEdition: true, shadowless: false })))
      .toEqual({ finish: "holo", edition: "first-edition", printing: "shadowed" });
  });

  it("stays Unlimited-style for sets without a 1st edition", () => {
    expect(defaultVariant(card("base4", "base4-60", "en", { normal: true, holo: false, reverse: false, firstEdition: false, shadowless: false })))
      .toEqual({ finish: "normal", edition: "unlimited", printing: "shadowed" });
    expect(defaultVariant(card("sv1", "sv1-60", "en", { normal: true, holo: false, reverse: true, firstEdition: false, shadowless: false })))
      .toMatchObject({ edition: "unlimited" });
  });
});
