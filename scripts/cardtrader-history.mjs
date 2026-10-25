/**
 * Weekly price history per CardTrader expansion (public/data/cardtrader/history/<id>.json).
 *
 * One line per blueprint with the cheapest EUR listing per condition, English and German, week by week:
 *   {"id":1472,"currency":"EUR","dates":["2026-10-21","2026-10-28"],"s":{
 *   "110032":{"en:nm":[4508,4510],"en:lp":[3434,0]},
 *   ...}}
 * A value of 0 means no listing that week. Series that are all zero are left out. The arrays always have as many
 * entries as `dates`. Only the four conditions the app prices with are kept (not "any"), and at most MAX_WEEKS weeks.
 */
export const HISTORY_SLOTS = [["en:nm", 0], ["en:ex", 1], ["en:lp", 2], ["en:pl", 3], ["de:nm", 5], ["de:ex", 6], ["de:lp", 7], ["de:pl", 8]];
export const MAX_WEEKS = 156;

/**
 * The history with one more week. `prices` maps a blueprint id to the ten price slots of the weekly price file. A date
 * that is not newer than the last one is ignored, so running the sync twice on one day changes nothing.
 */
export function appendWeek(history, expansionId, prices, date) {
  const dates = history?.dates ?? [];
  if (dates.length > 0 && date <= dates.at(-1)) return history;
  const previous = history?.s ?? {};
  const series = {};
  for (const id of new Set([...Object.keys(previous), ...Object.keys(prices)])) {
    const slots = prices[id];
    const entry = {};
    for (const [name, offset] of HISTORY_SLOTS) {
      const earlier = previous[id]?.[name] ?? new Array(dates.length).fill(0);
      const values = [...earlier, slots?.[offset] ?? 0];
      if (values.some((value) => value > 0)) entry[name] = values;
    }
    if (Object.keys(entry).length > 0) series[id] = entry;
  }
  const next = { id: Number(expansionId), currency: "EUR", dates: [...dates, date], s: series };
  return trim(next);
}

function trim(history) {
  const extra = history.dates.length - MAX_WEEKS;
  if (extra <= 0) return history;
  const series = {};
  for (const [id, entry] of Object.entries(history.s)) {
    const kept = {};
    for (const [name, values] of Object.entries(entry)) {
      const rest = values.slice(extra);
      if (rest.some((value) => value > 0)) kept[name] = rest;
    }
    if (Object.keys(kept).length > 0) series[id] = kept;
  }
  return { ...history, dates: history.dates.slice(extra), s: series };
}

/** Stable text form: sorted by blueprint id, one line each, so a weekly diff only touches what changed. */
export function serializeHistory(history) {
  const ids = Object.keys(history.s).sort((a, b) => Number(a) - Number(b));
  const lines = ids.map((id) => `${JSON.stringify(id)}:${JSON.stringify(history.s[id])}`).join(",\n");
  return `{"id":${history.id},"currency":"EUR","dates":${JSON.stringify(history.dates)},"s":{\n${lines}\n}}\n`;
}

/** Reads the prices of a weekly price file (`p`) from its text, or undefined when it cannot be read. */
export function pricesOf(text) {
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed.p === "object" ? parsed.p : undefined;
  } catch {
    return undefined;
  }
}

/* A cheapest-listing price far above the next cheaper condition of the same card is a placeholder or a mistake (typically
 * a single listing at 10,000.64 EUR), not a market price. The check needs a cheaper condition to compare with. */
export const OUTLIER_RATIO = 20;
export const OUTLIER_FLOOR_CENTS = 2000;

/** The four condition prices of one language (best condition first) with implausible high values set to 0 (no price). */
export function dropOutliers(values) {
  return values.map((value, index) => {
    if (!(value >= OUTLIER_FLOOR_CENTS)) return value;
    const cheaper = values.slice(index + 1).filter((other) => other > 0);
    return cheaper.length > 0 && value > OUTLIER_RATIO * Math.min(...cheaper) ? 0 : value;
  });
}

/** The ten price slots of a weekly price file with outliers removed in both languages; the "any" slots stay as they are. */
export function cleanSlots(slots) {
  return [...dropOutliers(slots.slice(0, 4)), slots[4], ...dropOutliers(slots.slice(5, 9)), slots[9]];
}

/** The same cleaning for a stored history, week by week, so older weeks lose their outliers too. Idempotent. */
export function cleanHistory(history) {
  if (!history) return history;
  const series = {};
  for (const [id, entry] of Object.entries(history.s)) {
    const cleaned = {};
    for (const language of ["en", "de"]) {
      const names = ["nm", "ex", "lp", "pl"].map((condition) => `${language}:${condition}`);
      const columns = history.dates.map((_, week) => dropOutliers(names.map((name) => entry[name]?.[week] ?? 0)));
      names.forEach((name, row) => {
        const values = columns.map((column) => column[row]);
        if (values.some((value) => value > 0)) cleaned[name] = values;
      });
    }
    if (Object.keys(cleaned).length > 0) series[id] = cleaned;
  }
  return { ...history, s: series };
}
