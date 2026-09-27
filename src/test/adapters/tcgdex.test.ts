import { afterEach, describe, expect, it, vi } from "vitest";

import { TCGdexCatalogAdapter } from "@/data/catalog/tcgdex";

describe("TCGdexCatalogAdapter", () => {
  afterEach(() => vi.restoreAllMocks());

  it("normalizes search and detail responses without inventing search metadata", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: "base1-1", localId: "001", name: "Bulbasaur" }])))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: "base1-1",
        localId: "001",
        name: "Bulbasaur",
        category: "Pokemon",
        set: { id: "base1", name: "Base Set" },
      })))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: "base1",
        name: "Base Set",
        serie: { id: "base", name: "Base" },
      })));

    const adapter = new TCGdexCatalogAdapter();
    const search = await adapter.search({ name: "bulb", language: "en", page: 1, pageSize: 40 });
    expect(search.items[0]).toMatchObject({ name: "Bulbasaur", collectorNumber: "001" });
    expect(search.items[0].setName).toBeUndefined();

    const card = await adapter.getCard(search.items[0].ref);
    expect(card).toMatchObject({ setId: "base1", physicalStatus: "physical", category: "pokemon" });
  });

  it("rejects a 404 without retrying", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("missing", { status: 404 }));
    const adapter = new TCGdexCatalogAdapter();

    await expect(
      adapter.getCard({ provider: "tcgdex", id: "missing", language: "en" }),
    ).rejects.toMatchObject({ name: "CatalogRequestError", status: 404 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("marks cards from the Pocket series as digital", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: "A1-1",
        localId: "001",
        name: "Pocket card",
        set: { id: "A1", name: "Genetic Apex" },
      })))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: "A1",
        name: "Genetic Apex",
        serie: { id: "tcgp", name: "Pokémon TCG Pocket" },
      })));
    const adapter = new TCGdexCatalogAdapter();
    const card = await adapter.getCard({ provider: "tcgdex", id: "A1-1", language: "en" });
    expect(card.physicalStatus).toBe("digital");
  });
});
