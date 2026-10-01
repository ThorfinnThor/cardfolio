import { describe, expect, it } from "vitest";

import { catalogSets } from "@/data/catalog/set-counts";
import {
  availableEditionValues,
  availableFinishValues,
  availablePrintingValues,
  createInitialVariantSelection,
  isVariantSelectionComplete,
  isProviderFallbackVariantSignal,
  isVariantSelectionValid,
  FIRST_EDITION_SET_IDS,
  variantAvailabilityForCard,
  variantSelectionIssue,
} from "@/domain/variant-selection";

describe("createInitialVariantSelection", () => {
  it("preselects the only finish reported by the provider", () => {
    expect(createInitialVariantSelection({ normal: false, holo: true, reverse: false, firstEdition: true })).toEqual({
      finish: "holo",
      edition: "unlimited",
      printing: "shadowed",
    });
  });

  it("keeps the finish open when multiple finishes are available", () => {
    expect(createInitialVariantSelection({ normal: true, holo: true, reverse: false, firstEdition: false }).finish).toBe("unspecified");
  });

  it("defaults to Unlimited and the standard shadowed printing while leaving the finish explicit", () => {
    expect(createInitialVariantSelection()).toEqual({
      finish: "unspecified",
      edition: "unlimited",
      printing: "shadowed",
    });
  });

  it("requires finish, edition and printing before a card can be saved", () => {
    expect(isVariantSelectionComplete({ finish: "normal", edition: "unlimited", printing: "shadowed" })).toBe(true);
    expect(isVariantSelectionComplete({ finish: "unspecified", edition: "unlimited", printing: "shadowed" })).toBe(false);
    expect(isVariantSelectionComplete({ finish: "holo", edition: "unspecified", printing: "shadowed" })).toBe(false);
  });

  it("only offers catalog-confirmed finishes and editions", () => {
    const availability = { normal: false, holo: true, reverse: false, firstEdition: false, shadowless: false };

    expect(availableFinishValues(availability)).toEqual(["unspecified", "holo", "other"]);
    expect(availableEditionValues(availability)).toEqual(["unspecified", "unlimited"]);
    expect(availablePrintingValues(availability)).toEqual(["shadowed"]);
    expect(isVariantSelectionValid({ finish: "holo", edition: "unlimited", printing: "shadowed" }, availability)).toBe(true);
    expect(variantSelectionIssue({ finish: "normal", edition: "unlimited", printing: "shadowed" }, availability)).toMatch(/nicht bestätigt/);
  });

  it("allows Shadowless only for English Base Set cards", () => {
    const baseAvailability = { normal: true, holo: false, reverse: false, firstEdition: true };
    const english = variantAvailabilityForCard({
      setId: "base1",
      ref: { provider: "tcgdex", id: "base1-44", language: "en" },
      availableVariants: baseAvailability,
    });
    const german = variantAvailabilityForCard({
      setId: "base1",
      ref: { provider: "tcgdex", id: "base1-44", language: "de" },
      availableVariants: baseAvailability,
    });

    expect(english?.shadowless).toBe(true);
    expect(german?.shadowless).toBe(false);
    expect(availablePrintingValues(english)).toEqual(["shadowed", "shadowless"]);
    expect(availablePrintingValues(german)).toEqual(["shadowed"]);
  });

  it("requires a label for a manually described variant", () => {
    expect(variantSelectionIssue({ finish: "other", edition: "unlimited", printing: "shadowed" })).toMatch(/Variantenbezeichnung/);
    expect(isVariantSelectionValid({ finish: "other", edition: "unlimited", printing: "shadowed", label: "Cosmos Holo" })).toBe(true);
  });
});

describe("TCGdex fallback variant signal", () => {
  // Team Up 159/181 (Celebi & Bisaflor GX) has no curated variant data; TCGdex
  // still answers normal: true and everything else false although the card only
  // exists as Holo.
  const fallback = { normal: true, holo: false, reverse: false, firstEdition: false };
  const celebi = {
    setId: "sm9",
    ref: { provider: "tcgdex" as const, id: "sm9-159", language: "de" as const },
    availableVariants: fallback,
  };

  it("treats the provider fallback as unknown instead of a Non-Holo confirmation", () => {
    expect(isProviderFallbackVariantSignal(fallback)).toBe(true);
    const options = variantAvailabilityForCard(celebi);
    expect(options).toMatchObject({ finishesVerified: false, firstEdition: false, shadowless: false });
    expect(createInitialVariantSelection(options).finish).toBe("unspecified");
    expect(availableFinishValues(options)).toContain("holo");
    expect(availableEditionValues(options)).toEqual(["unspecified", "unlimited"]);
    expect(availablePrintingValues(options)).toEqual(["shadowed"]);
    expect(variantSelectionIssue({ finish: "holo", edition: "unlimited", printing: "shadowed" }, options)).toBeUndefined();
  });

  it("keeps curated signals that differ from the fallback", () => {
    expect(isProviderFallbackVariantSignal({ normal: true, holo: false, reverse: true, firstEdition: false })).toBe(false);
    expect(isProviderFallbackVariantSignal({ normal: false, holo: true, reverse: false, firstEdition: false })).toBe(false);
    expect(isProviderFallbackVariantSignal({ normal: true, holo: false, reverse: false, firstEdition: true })).toBe(false);
  });
});

describe("historical edition and printing policy", () => {
  const cardOptions = (setId: string, language: "en" | "de" = "en") => variantAvailabilityForCard({
    setId,
    ref: { provider: "tcgdex", id: `${setId}-1`, language },
    availableVariants: { normal: true, holo: false, reverse: false, firstEdition: false },
  });

  it("allows set-wide First Edition only through Neo Destiny and never for Base Set 2", () => {
    expect(cardOptions("base1").firstEdition).toBe(true);
    expect(cardOptions("neo4").firstEdition).toBe(true);
    expect(cardOptions("base4").firstEdition).toBe(false);
    expect(cardOptions("lc").firstEdition).toBe(false);
    expect(cardOptions("ecard1").firstEdition).toBe(false);
    expect(cardOptions("sm7").firstEdition).toBe(false);
  });

  it("allows Shadowless only for English Base Set even without reliable finish data", () => {
    expect(cardOptions("base1", "en").shadowless).toBe(true);
    expect(cardOptions("base1", "de").shadowless).toBe(false);
    expect(cardOptions("base2", "en").shadowless).toBe(false);
  });

  it("overrides contradictory provider edition flags with the historical set policy", () => {
    const modern = variantAvailabilityForCard({
      setId: "sm7",
      ref: { provider: "tcgdex", id: "sm7-112", language: "en" },
      availableVariants: { normal: false, holo: true, reverse: true, firstEdition: true },
    });

    expect(modern.finishesVerified).toBe(true);
    expect(modern.firstEdition).toBe(false);
    expect(availableEditionValues(modern)).toEqual(["unspecified", "unlimited"]);
    expect(availablePrintingValues(modern)).toEqual(["shadowed"]);
  });

  it("audits every synchronized physical set against the allowlists", () => {
    for (const language of ["en", "de"] as const) {
      const sets = catalogSets(language);
      const ids = new Set(sets.map((set) => set.id));
      for (const setId of FIRST_EDITION_SET_IDS) {
        if (language === "en" || ids.has(setId)) expect(ids.has(setId)).toBe(true);
      }
      for (const set of sets) {
        const options = cardOptions(set.id, language);
        expect(options.firstEdition, `${language}/${set.id} First Edition`).toBe(FIRST_EDITION_SET_IDS.has(set.id));
        expect(options.shadowless, `${language}/${set.id} Shadowless`).toBe(language === "en" && set.id === "base1");
      }
    }
  });
});
