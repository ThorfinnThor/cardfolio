import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import { CardTraderSupplements, supplementNumbers } from "@/data/cardtrader/supplements";
import { SupplementedCatalogAdapter } from "@/data/catalog/supplemented-catalog";
import type { TCGdexCatalogAdapter } from "@/data/catalog/tcgdex";
import { cardSnapshotSchema } from "@/domain/validation";
import type { CardRef, CatalogSearchItem } from "@/domain/types";

const FILE = {
  schemaVersion: 1,
  source: "test",
  sets: {
    rc: {
      setName: "Radiant Collection",
      expansionId: 1931,
      total: 25,
      cards: [
        { id: 500001, n: "0RC1/RC25", name: "Snivy", img: "500001/preview_snivy.jpg", cm: [1] },
        { id: 500002, n: "0RC7/RC25", name: "Pikachu" },
      ],
    },
    miscp: { setName: "Miscellaneous Promos", expansionId: 1470, cards: [{ id: 600001, n: "75a/98", name: "Hex Maniac" }, { id: 600002, n: "007", name: "Pansage" }] },
  },
};
const supplements = () => new CardTraderSupplements(async () => FILE, () => "2026-10-21T10:00:00.000Z");

describe("supplementNumbers", () => {
  it("shows the printed number and total", () => {
    expect(supplementNumbers("0RC1/RC25", 25)).toEqual({ collectorNumber: "RC1", collectorTotal: "RC25" });
    expect(supplementNumbers("75a/98")).toEqual({ collectorNumber: "75a", collectorTotal: "98" });
    expect(supplementNumbers("007", 25)).toEqual({ collectorNumber: "007", collectorTotal: "25" });
    expect(supplementNumbers("007")).toEqual({ collectorNumber: "007" });
  });
});

describe("CardTraderSupplements", () => {
  it("finds supplement cards by set, by name and by collector number, in English only", async () => {
    expect((await supplements().search({ language: "en", setId: "rc" })).map((item) => item.name)).toEqual(["Snivy", "Pikachu"]);
    expect((await supplements().search({ language: "en", name: "pika" })).map((item) => item.name)).toEqual(["Pikachu"]);
    expect((await supplements().search({ language: "en", setId: "rc", collectorNumber: "rc7" })).map((item) => item.name)).toEqual(["Pikachu"]);
    expect(await supplements().search({ language: "de", setId: "rc" })).toEqual([]);
    expect(await supplements().search({ language: "en" })).toEqual([]);
    expect(await supplements().search({ language: "en", setId: "sv1" })).toEqual([]);
  });

  it("describes a supplement card with its own identity and the real TCGdex set id", async () => {
    const [snivy] = await supplements().search({ language: "en", name: "snivy" });
    expect(snivy).toMatchObject({ ref: { provider: "cardtrader", id: "500001", language: "en" }, setId: "rc", setName: "Radiant Collection", collectorNumber: "RC1", collectorTotal: "RC25" });
    const snapshot = await supplements().card(snivy!.ref);
    expect(snapshot).toMatchObject({ key: "cardtrader:500001:en", setId: "rc", collectorNumber: "RC1", physicalStatus: "physical", fetchedAt: "2026-10-21T10:00:00.000Z" });
    expect(cardSnapshotSchema.safeParse(snapshot).success).toBe(true);
    await expect(supplements().card({ provider: "cardtrader", id: "999", language: "en" })).rejects.toThrow();
  });

  it("offers nothing when the data cannot be loaded or is invalid", async () => {
    expect(await new CardTraderSupplements(async () => { throw new Error("404"); }).search({ language: "en", setId: "rc" })).toEqual([]);
    expect(await new CardTraderSupplements(async () => ({ schemaVersion: 2 })).search({ language: "en", setId: "rc" })).toEqual([]);
  });
});

describe("SupplementedCatalogAdapter", () => {
  const tcgdexItem = (name: string, number: string, setId = "rc"): CatalogSearchItem => ({ ref: { provider: "tcgdex", id: `${setId}-${number}`, language: "en" }, name, collectorNumber: number, setId });
  function base(result: { items: CatalogSearchItem[]; hasMore: boolean }) {
    return { search: vi.fn(async () => result), getCard: vi.fn(async (ref: CardRef) => ({ ref }) as never), getGiftCardDetail: vi.fn(async () => ({ card: {}, rawPricing: 1 }) as never) } as unknown as TCGdexCatalogAdapter;
  }
  const query = { language: "en" as const, setId: "rc", page: 1, pageSize: 40 };

  it("adds the supplement cards to the first TCGdex page only and keeps the paging flag", async () => {
    const first = new SupplementedCatalogAdapter(base({ items: [tcgdexItem("Other", "9")], hasMore: true }), supplements());
    const result = await first.search(query);
    expect(result.items.map((item) => item.name)).toEqual(["Other", "Snivy", "Pikachu"]);
    expect(result.hasMore).toBe(true);

    const second = new SupplementedCatalogAdapter(base({ items: [tcgdexItem("Other", "9")], hasMore: false }), supplements());
    expect((await second.search({ ...query, page: 2 })).items.map((item) => item.name)).toEqual(["Other"]);
  });

  it("does not repeat a card TCGdex already lists", async () => {
    const adapter = new SupplementedCatalogAdapter(base({ items: [tcgdexItem("Snivy", "RC1")], hasMore: false }), supplements());
    expect((await adapter.search(query)).items.map((item) => item.name)).toEqual(["Snivy", "Pikachu"]);
  });

  it("asks CardTrader's data for cardtrader cards and TCGdex for everything else", async () => {
    const tcgdex = base({ items: [], hasMore: false });
    const adapter = new SupplementedCatalogAdapter(tcgdex, supplements());
    expect((await adapter.getCard({ provider: "cardtrader", id: "500001", language: "en" })).name).toBe("Snivy");
    await adapter.getCard({ provider: "tcgdex", id: "base1-4", language: "en" });
    expect(tcgdex.getCard).toHaveBeenCalledTimes(1);
    expect((await adapter.getGiftCardDetail({ provider: "cardtrader", id: "500001", language: "en" })).rawPricing).toBeUndefined();
    await adapter.getGiftCardDetail({ provider: "tcgdex", id: "base1-4", language: "en" });
    expect(tcgdex.getGiftCardDetail).toHaveBeenCalledTimes(1);
  });
});

describe("committed supplements file", () => {
  const root = path.join(process.cwd(), "public", "data", "cardtrader");
  const file = JSON.parse(readFileSync(path.join(root, "supplements.json"), "utf8")) as typeof FILE;

  it("only lists reviewed sets, with the blueprints and images of the CardTrader data", async () => {
    const review = JSON.parse(readFileSync(path.join(process.cwd(), "data", "marketplace", "cardtrader-supplement-sets.json"), "utf8")) as { sets: Array<{ catalogKey: string }> };
    expect(Object.keys(file.sets).sort()).toEqual(review.sets.map((set) => set.catalogKey.replace("en:", "")).sort());
    const index = JSON.parse(readFileSync(path.join(root, "index.json"), "utf8")) as Record<string, number>;
    for (const [setId, set] of Object.entries(file.sets)) {
      expect(index[`en:${setId}`]).toBe(set.expansionId);
      const expansion = JSON.parse(readFileSync(path.join(root, "expansions", `${set.expansionId}.json`), "utf8")) as { blueprints: Array<{ id: number; img?: string }> };
      const blueprints = new Map(expansion.blueprints.map((blueprint) => [blueprint.id, blueprint]));
      for (const card of set.cards) {
        expect(blueprints.has(card.id), `${setId} ${card.n}`).toBe(true);
        expect((card as { img?: string }).img).toBe(blueprints.get(card.id)?.img);
      }
    }
    expect(file.sets.rc!.cards).toHaveLength(25);
  });

  it("can be searched through the module", async () => {
    const supplements = new CardTraderSupplements(async () => file);
    expect((await supplements.search({ language: "en", setId: "rc" }))).toHaveLength(25);
    const first = (await supplements.search({ language: "en", setId: "rc" }))[0]!;
    expect(cardSnapshotSchema.safeParse(await supplements.card(first.ref)).success).toBe(true);
  });
});
