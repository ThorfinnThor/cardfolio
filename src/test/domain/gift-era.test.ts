import { describe, expect, it } from "vitest";

import { eraOfSetId } from "@/domain/gift-era";

describe("eraOfSetId", () => {
  it.each(["base1", "base2", "basep", "gym1", "neo3", "ecard2", "ex7", "ex16", "dp1", "dpp", "pl4", "pop5", "np", "si1", "bog", "lc"])("%s is from before 2010", (id) => {
    expect(eraOfSetId(id)).toBe("vintage");
  });

  it.each(["hgss1", "col1", "bw1", "xy12", "sm9", "swsh45", "swsh12pt5", "sv3", "sv08.5", "g1", "cel25", "mcd19", "exu1x"])("%s is not vintage", (id) => {
    expect(eraOfSetId(id)).toBe("modern");
  });

  it("has no opinion without a set id", () => {
    expect(eraOfSetId(undefined)).toBeUndefined();
    expect(eraOfSetId("")).toBeUndefined();
  });
});
