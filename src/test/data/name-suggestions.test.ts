import { describe, expect, it, vi } from "vitest";

import { suggestCardNames } from "@/data/catalog/name-suggestions";
import type { CatalogQuery } from "@/domain/types";

const item = (name: string) => ({ ref: { provider: "tcgdex" as const, id: name, language: "de" as const }, name, collectorNumber: "1" });

describe("suggestCardNames", () => {
  it("searches with parts of the typo and returns the closest card word", async () => {
    const search = vi.fn(async (query: CatalogQuery) => ({
      items: query.name === "Pika" ? [item("Pikachu"), item("Surfendes Pikachu VMAX")] : [],
      hasMore: false,
    }));

    expect(await suggestCardNames({ search }, "Pikatschu", "de")).toEqual(["Pikachu"]);
    expect(search).toHaveBeenCalledTimes(1);
    expect(search.mock.calls[0]![0]).toMatchObject({ language: "de", name: "Pika" });
  });

  it("falls back to the end of the typo and gives up quietly", async () => {
    const search = vi.fn(async () => ({ items: [], hasMore: false }));

    expect(await suggestCardNames({ search }, "Qqqqqq", "en")).toEqual([]);
    expect(search).toHaveBeenCalledTimes(3);
    expect(await suggestCardNames({ search }, "ab", "en")).toEqual([]);
  });
});
