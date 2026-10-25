import { describe, expect, it } from "vitest";

import { appendWeek, MAX_WEEKS, pricesOf, serializeHistory } from "../../../scripts/cardtrader-history.mjs";

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
