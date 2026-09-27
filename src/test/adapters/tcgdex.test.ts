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
    expect(search.items[0]).toMatchObject({ name: "Bulbasaur", collectorNumber: "001", collectorTotal: "102" });
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

  it("matches a full printed number exactly despite fuzzy provider results", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify([
        { id: "base1-4", localId: "4", name: "Charizard" },
        { id: "ex14-4", localId: "4", name: "Charizard δ" },
        { id: "sm9-14", localId: "14", name: "Charizard" },
      ])))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: "base1-4",
        localId: "4",
        name: "Charizard",
        set: { cardCount: { official: 102 }, id: "base1", name: "Base Set" },
      })))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: "ex14-4",
        localId: "4",
        name: "Charizard δ",
        set: { cardCount: { official: 100 }, id: "ex14", name: "Crystal Guardians" },
      })));

    const adapter = new TCGdexCatalogAdapter();
    const search = await adapter.search({
      name: "Charizard",
      collectorNumber: "4",
      collectorTotal: "102",
      language: "en",
      page: 1,
      pageSize: 40,
    });

    expect(search.items).toEqual([expect.objectContaining({
      name: "Charizard",
      collectorNumber: "4",
      collectorTotal: "102",
    })]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0][0].toString()).toContain("localId=4");
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

  it("uses the English artwork when a German card has no localized image", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: "base1-4",
        localId: "4",
        name: "Glurak",
        set: { cardCount: { official: 102 }, id: "base1", name: "Grundset" },
        variants: { firstEdition: true, holo: true, normal: false, reverse: false },
      })))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: "base1-4",
        localId: "4",
        name: "Charizard",
        image: "https://assets.tcgdex.net/en/base/base1/4",
        set: { cardCount: { official: 102 }, id: "base1", name: "Base Set" },
      })))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: "base1",
        name: "Grundset",
        serie: { id: "base", name: "Grundserie" },
      })));

    const adapter = new TCGdexCatalogAdapter();
    const card = await adapter.getCard({ provider: "tcgdex", id: "base1-4", language: "de" });

    expect(card.imageBaseUrl).toBe("https://assets.tcgdex.net/en/base/base1/4");
    expect(card.collectorTotal).toBe("102");
    expect(card.availableVariants).toEqual({ normal: false, holo: true, reverse: false, firstEdition: true });
  });

  it("loads a card detail only when synchronized set metadata cannot complete a search number", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify([
        { id: "2024sv-1", localId: "1", name: "Glurak" },
      ])))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: "2024sv-1",
        localId: "1",
        name: "Glurak",
        set: { cardCount: { official: 15, total: 15 }, id: "2024sv", name: "McDonald's Kollektion 2024" },
      })));

    const adapter = new TCGdexCatalogAdapter();
    const search = await adapter.search({ name: "Glurak", language: "de", page: 1, pageSize: 40 });

    expect(search.items[0]).toMatchObject({ collectorNumber: "1", collectorTotal: "15" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
