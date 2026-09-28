import { describe, expect, it } from "vitest";

import {
  availableEditionValues,
  availableFinishValues,
  availablePrintingValues,
  createInitialVariantSelection,
  isVariantSelectionComplete,
  isVariantSelectionValid,
  variantAvailabilityForCard,
  variantSelectionIssue,
} from "@/domain/variant-selection";

describe("createInitialVariantSelection", () => {
  it("preselects the only finish reported by the provider", () => {
    expect(createInitialVariantSelection({ normal: false, holo: true, reverse: false, firstEdition: true })).toEqual({
      finish: "holo",
      edition: "unspecified",
      printing: "shadowed",
    });
  });

  it("keeps the finish open when multiple finishes are available", () => {
    expect(createInitialVariantSelection({ normal: true, holo: true, reverse: false, firstEdition: false }).finish).toBe("unspecified");
  });

  it("defaults to the standard shadowed printing but leaves finish and edition explicit", () => {
    expect(createInitialVariantSelection()).toEqual({
      finish: "unspecified",
      edition: "unspecified",
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
