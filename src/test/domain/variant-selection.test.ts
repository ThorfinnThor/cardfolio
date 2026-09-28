import { describe, expect, it } from "vitest";

import { createInitialVariantSelection, isVariantSelectionComplete } from "@/domain/variant-selection";

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
});
