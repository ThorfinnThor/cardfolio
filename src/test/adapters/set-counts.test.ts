import { describe, expect, it } from "vitest";

import { collectorTotalForSearchItem, setIdFromCardId } from "@/data/catalog/set-counts";

describe("catalog set counts", () => {
  it("derives full printed collector numbers from synchronized set metadata", () => {
    expect(setIdFromCardId("base1-4", "4")).toBe("base1");
    expect(setIdFromCardId("base1-1", "001")).toBe("base1");
    expect(setIdFromCardId("sv03.5-006", "006")).toBe("sv03.5");
    expect(collectorTotalForSearchItem("de", "base1-4", "4")).toBe("102");
    expect(collectorTotalForSearchItem("de", "sm7.5-3", "3")).toBe("70");
  });
});
