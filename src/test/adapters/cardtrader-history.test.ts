import { describe, expect, it } from "vitest";

import { appendWeek, cleanHistory, cleanSlots, dropOutliers, MAX_WEEKS, pricesOf, serializeHistory } from "../../../scripts/cardtrader-history.mjs";

const slots = (en: [number, number, number, number], de: [number, number, number, number] = [0, 0, 0, 0]) => [...en, 999, ...de, 999];

describe("weekly price history (sync)", () => {
  it("starts from one week and adds the next, keeping every series as long as the dates", () => {
    const first = appendWeek(undefined, 1472, { "7": slots([100, 90, 80, 70]) }, "2026-10-21");
    const second = appendWeek(first, 1472, { "7": slots([110, 90, 80, 70]), "8": slots([0, 0, 0, 5]) }, "2026-10-28");
    expect(second.dates).toEqual(["2026-10-21", "2026-10-28"]);
    expect(second.s["7"]["en:nm"]).toEqual([100, 110]);
    // A card that appears later gets a zero for the weeks before.
    expect(second.s["8"]).toEqual({ "en:pl": [0, 5] });
  });

  it("keeps only the four conditions (not the any-slot), leaves out series that are all zero and keeps a card that vanished", () => {
    const first = appendWeek(undefined, 1, { "7": slots([100, 0, 0, 0], [0, 0, 0, 50]) }, "2026-10-21");
    expect(first.s["7"]).toEqual({ "en:nm": [100], "de:pl": [50] });
    const second = appendWeek(first, 1, {}, "2026-10-28");
    expect(second.s["7"]).toEqual({ "en:nm": [100, 0], "de:pl": [50, 0] });
    expect(appendWeek(undefined, 1, { "9": slots([0, 0, 0, 0]) }, "2026-10-21").s).toEqual({});
  });

  it("ignores a date that is not newer, so a second run on the same day changes nothing", () => {
    const first = appendWeek(undefined, 1, { "7": slots([100, 0, 0, 0]) }, "2026-10-21");
    expect(appendWeek(first, 1, { "7": slots([200, 0, 0, 0]) }, "2026-10-21")).toBe(first);
    expect(appendWeek(first, 1, { "7": slots([200, 0, 0, 0]) }, "2026-10-14")).toBe(first);
  });

  it("keeps at most the last 156 weeks", () => {
    let history = appendWeek(undefined, 1, { "7": slots([1, 0, 0, 0]) }, "2020-01-01");
    for (let week = 1; week <= MAX_WEEKS + 4; week += 1) {
      const date = new Date(Date.UTC(2020, 0, 1) + week * 7 * 86_400_000).toISOString().slice(0, 10);
      history = appendWeek(history, 1, { "7": slots([week + 1, 0, 0, 0]) }, date);
    }
    expect(history.dates).toHaveLength(MAX_WEEKS);
    expect(history.s["7"]["en:nm"]).toHaveLength(MAX_WEEKS);
    expect(history.s["7"]["en:nm"].at(-1)).toBe(MAX_WEEKS + 5);
  });

  it("writes a stable text form sorted by blueprint id and reads the prices of a price file", () => {
    const history = appendWeek(undefined, 5, { "20": slots([2, 0, 0, 0]), "3": slots([1, 0, 0, 0]) }, "2026-10-21");
    const text = serializeHistory(history);
    expect(text.indexOf('"3"')).toBeLessThan(text.indexOf('"20"'));
    expect(JSON.parse(text)).toEqual(history);
    expect(pricesOf('{"id":1,"p":{"7":[1,2,3,4,5,6,7,8,9,10]}}')).toEqual({ "7": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] });
    expect(pricesOf("not json")).toBeUndefined();
    expect(pricesOf("")).toBeUndefined();
  });
});

describe("implausible prices (sync)", () => {
  it("drops a price far above the next cheaper condition and keeps plausible gaps and cheap cards", () => {
    expect(dropOutliers([1_000_064, 35, 35, 35])).toEqual([0, 35, 35, 35]);
    expect(dropOutliers([0, 1_008_598, 29, 29])).toEqual([0, 0, 29, 29]);
    expect(dropOutliers([10_302, 5_409, 3_830, 3_079])).toEqual([10_302, 5_409, 3_830, 3_079]);
    // Below the floor a big ratio is normal (a 3 EUR near mint card next to a 10 cent played one).
    expect(dropOutliers([300, 10, 10, 10])).toEqual([300, 10, 10, 10]);
  });

  it("has nothing to compare a lone listing with, so it stays", () => {
    expect(dropOutliers([1_500_128, 1_500_128, 1_500_128, 1_500_128])).toEqual([1_500_128, 1_500_128, 1_500_128, 1_500_128]);
    expect(dropOutliers([1_000_064, 0, 0, 0])).toEqual([1_000_064, 0, 0, 0]);
  });

  it("cleans both languages of the ten slots and leaves the any-slots alone", () => {
    expect(cleanSlots([1_000_064, 35, 35, 35, 28, 900_000, 30, 30, 30, 30])).toEqual([0, 35, 35, 35, 28, 0, 30, 30, 30, 30]);
  });

  it("cleans a stored history week by week and is idempotent", () => {
    const history = appendWeek(appendWeek(undefined, 1, { "7": [1_000_064, 35, 35, 35, 28, 0, 0, 0, 0, 0] }, "2026-10-21"), 1, { "7": [100, 35, 35, 35, 28, 0, 0, 0, 0, 0] }, "2026-10-28");
    const cleaned = cleanHistory(history);
    expect(cleaned.s["7"]["en:nm"]).toEqual([0, 100]);
    expect(cleaned.s["7"]["en:ex"]).toEqual([35, 35]);
    expect(cleanHistory(cleaned)).toEqual(cleaned);
    expect(cleanHistory(undefined)).toBeUndefined();
  });
});
