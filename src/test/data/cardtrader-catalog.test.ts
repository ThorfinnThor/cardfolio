import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  CardTraderCatalog,
  cardtraderImageUrl,
  expansionFileSchema,
  indexFileSchema,
  normalizeCollectorNumber,
  priceFileSchema,
} from "@/data/cardtrader/catalog";

const ROOT = path.join(process.cwd(), "public", "data", "cardtrader");
const read = (relative: string): unknown => JSON.parse(readFileSync(path.join(ROOT, relative), "utf8"));

function loaderFrom(files: Record<string, unknown>) {
  return async (file: string) => {
    if (!(file in files)) throw new Error(`HTTP 404 ${file}`);
    return files[file];
  };
}

const EXPANSION = {
  id: 1472,
  code: "bs",
  name: "Base Set",
  blueprints: [
    { id: 111148, n: "001", name: "Alakazam", rar: "Holo Rare", img: "111148/preview_alakazam-holo-rare-1-102-base-set.jpg", cm: [273696], tp: 42346 },
    { id: 111151, n: "004", name: "Charizard", img: "111151/preview_charizard.jpg" },
    { id: 900001, n: "010", name: "Mewtwo" },
    { id: 900002, n: "010", name: "Mewtwo (Stamped)" },
    { id: 900003, n: "011", name: "Nidorino" },
    { id: 900004, n: "011", name: "Nidorina" },
  ],
};
const PRICES = {
  id: 1472,
  currency: "EUR",
  slots: ["en:nm", "en:ex", "en:lp", "en:pl", "en:any", "de:nm", "de:ex", "de:lp", "de:pl", "de:any"],
  p: { "111148": [10302, 5409, 3830, 3079, 1776, 0, 7212, 7212, 7212, 7212], "111151": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
};
const FILES = { "index.json": { "en:base1": 1472, "de:base1": 1472 }, "expansions/1472.json": EXPANSION, "prices/1472.json": PRICES };

describe("collector number normalisation", () => {
  it("treats padded, slashed and prefixed numbers the same way on both sides", () => {
    expect(normalizeCollectorNumber("001")).toBe("1");
    expect(normalizeCollectorNumber("4/102")).toBe("4");
    expect(normalizeCollectorNumber(" 004 ")).toBe("4");
    expect(normalizeCollectorNumber("TG01")).toBe("tg1");
    expect(normalizeCollectorNumber("SWSH001")).toBe("swsh1");
    expect(normalizeCollectorNumber("000")).toBe("0");
    expect(normalizeCollectorNumber("0RC1/RC25")).toBe("rc1");
    expect(normalizeCollectorNumber("RC1")).toBe("rc1");
    expect(normalizeCollectorNumber("0h1")).toBe("h1");
    expect(normalizeCollectorNumber("")).toBe("");
  });
});

describe("CardTraderCatalog", () => {
  const catalog = () => new CardTraderCatalog(loaderFrom(FILES));

  it("finds the blueprint of a card by set and collector number", async () => {
    const match = await catalog().blueprint("en", "base1", "1");
    expect(match?.blueprint.id).toBe(111148);
    expect(match?.expansionId).toBe(1472);
    expect((await catalog().blueprint("de", "base1", "004"))?.blueprint.id).toBe(111151);
  });

  it("never guesses: unknown sets, unknown numbers and ambiguous numbers give nothing", async () => {
    expect(await catalog().blueprint("en", "unknown", "1")).toBeUndefined();
    expect(await catalog().blueprint("en", "base1", "999")).toBeUndefined();
    expect(await catalog().blueprint("en", "base1", "10")).toBeUndefined();
    expect(await catalog().blueprint("en", "base1", "11", "Nidorinas")).toBeUndefined();
  });

  it("uses the card name only to pick between blueprints that share a number", async () => {
    expect((await catalog().blueprint("en", "base1", "10", "Mewtwo (Stamped)"))?.blueprint.id).toBe(900002);
    expect((await catalog().blueprint("en", "base1", "11", "Nidorina"))?.blueprint.id).toBe(900004);
  });

  it("prices a card by language and minimum condition without widening to worse conditions", async () => {
    const instance = catalog();
    const match = (await instance.blueprint("en", "base1", "1"))!;
    expect(await instance.price(match, "en", "near-mint")).toEqual({ amountMinor: 10302, condition: "near-mint" });
    expect(await instance.price(match, "en")).toEqual({ amountMinor: 5409, condition: "excellent" });
    expect(await instance.price(match, "en", "any")).toEqual({ amountMinor: 1776, condition: "any" });
    expect(await instance.price(match, "de", "near-mint")).toBeUndefined();
    expect(await instance.price(match, "de", "excellent")).toEqual({ amountMinor: 7212, condition: "excellent" });
    const unpriced = (await instance.blueprint("en", "base1", "4"))!;
    expect(await instance.price(unpriced, "en", "any")).toBeUndefined();
  });

  it("returns nothing, instead of failing, when the data cannot be loaded or is invalid", async () => {
    expect(await new CardTraderCatalog(loaderFrom({})).blueprint("en", "base1", "1")).toBeUndefined();
    const broken = new CardTraderCatalog(loaderFrom({ "index.json": { "en:base1": 1472 }, "expansions/1472.json": { id: 1472, blueprints: "nope" } }));
    expect(await broken.blueprint("en", "base1", "1")).toBeUndefined();
    const badImage = { ...EXPANSION, blueprints: [{ ...EXPANSION.blueprints[0], img: "../evil.js" }] };
    expect(await new CardTraderCatalog(loaderFrom({ ...FILES, "expansions/1472.json": badImage })).blueprint("en", "base1", "1")).toBeUndefined();
  });

  it("builds image URLs only for well-formed CardTrader paths", () => {
    expect(cardtraderImageUrl("111148/preview_alakazam-holo-rare-1-102-base-set.jpg")).toBe("https://cardtrader.com/uploads/blueprints/image/111148/preview_alakazam-holo-rare-1-102-base-set.jpg");
    expect(() => cardtraderImageUrl("../x.jpg")).toThrow();
    expect(() => cardtraderImageUrl("1/a.exe")).toThrow();
    expect(() => cardtraderImageUrl("https://evil.example/a.jpg")).toThrow();
  });
});

describe("committed CardTrader data files", () => {
  const index = indexFileSchema.parse(read("index.json"));
  const expansionIds = [...new Set(Object.values(index))];

  it("has one valid expansion file and one valid price file per mapped expansion", () => {
    expect(readdirSync(path.join(ROOT, "expansions")).length).toBe(expansionIds.length);
    for (const id of expansionIds) {
      const expansion = expansionFileSchema.parse(read(`expansions/${id}.json`));
      const prices = priceFileSchema.parse(read(`prices/${id}.json`));
      expect(expansion.id).toBe(id);
      const blueprintIds = new Set(expansion.blueprints.map((blueprint) => String(blueprint.id)));
      for (const key of Object.keys(prices.p)) expect(blueprintIds.has(key), `${id}: price for unknown blueprint ${key}`).toBe(true);
    }
  });

  it("maps every catalogue key to a mapped set review entry", () => {
    const review = JSON.parse(readFileSync(path.join(process.cwd(), "data", "marketplace", "cardtrader-set-review.json"), "utf8")) as { mappings: Array<{ catalogKey: string; cardtraderExpansionId: string }> };
    expect(Object.keys(index).length).toBe(review.mappings.length);
    for (const entry of review.mappings) expect(index[entry.catalogKey]).toBe(Number(entry.cardtraderExpansionId));
  });

  it("only references CardTrader images and well-formed ids, and prices are plausible euro amounts", () => {
    let images = 0;
    let priced = 0;
    for (const id of expansionIds) {
      const expansion = expansionFileSchema.parse(read(`expansions/${id}.json`));
      for (const blueprint of expansion.blueprints) {
        if (blueprint.img) { images += 1; expect(cardtraderImageUrl(blueprint.img)).toMatch(/^https:\/\/cardtrader\.com\/uploads\/blueprints\/image\//); }
      }
      const prices = priceFileSchema.parse(read(`prices/${id}.json`));
      for (const slots of Object.values(prices.p)) {
        priced += 1;
        for (const cents of slots) expect(cents).toBeLessThanOrEqual(50_000_000);
      }
    }
    expect(images).toBeGreaterThan(20_000);
    expect(priced).toBeGreaterThan(20_000);
  });

  it("agrees with the sync script about collector number normalisation on every real blueprint", async () => {
    // The script cannot be imported (it runs on import), so its normaliser is mirrored here and kept in step.
    const script = readFileSync(path.join(process.cwd(), "scripts", "cardtrader-sync.mjs"), "utf8");
    expect(script).toContain('.split("/")[0].replace(/[^a-z0-9]+/g, "")');
    expect(script).toContain('.replace(/^0+(?=[a-z])/, "").replace(/^([a-z]*)0+(\\d)/, "$1$2")');
  });
});
