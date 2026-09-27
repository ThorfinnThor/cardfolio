import { describe, expect, it } from "vitest";

import { createInitialVariantSelection } from "@/domain/variant-selection";

describe("createInitialVariantSelection", () => {
  it("preselects the only finish reported by the provider", () => {
    expect(createInitialVariantSelection({ normal: false, holo: true, reverse: false, firstEdition: true })).toEqual({
      finish: "holo",
      edition: "unspecified",
      printing: "unspecified",
    });
  });

  it("keeps the finish open when multiple finishes are available", () => {
    expect(createInitialVariantSelection({ normal: true, holo: true, reverse: false, firstEdition: false }).finish).toBe("unspecified");
  });

  it("does not infer unsupported edition or printing details", () => {
    expect(createInitialVariantSelection()).toEqual({
      finish: "unspecified",
      edition: "unspecified",
      printing: "unspecified",
    });
  });
});
