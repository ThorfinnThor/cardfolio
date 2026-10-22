import { describe, expect, it } from "vitest";

import { encodeGiftShare, giftShareUrl, parseGiftShare, type GiftShare } from "@/domain/gift-share";

const share: GiftShare = {
  subject: "Pikachu, Glurak",
  targetCardCount: 9,
  preferredLanguage: "de",
  currency: "EUR",
  budgetMinor: 5_000,
  cards: [
    { id: "base1-58", language: "en", variant: { finish: "normal", edition: "first-edition", printing: "shadowless" } },
    { id: "sv3pt5-25", language: "de", variant: { finish: "holo", edition: "unlimited" } },
  ],
};

describe("gift share link", () => {
  it("round-trips a proposal through the URL fragment", () => {
    const url = giftShareUrl("https://yourcardbinder.com", "/geschenk/", share);
    expect(url.startsWith("https://yourcardbinder.com/geschenk/#vorschlag=")).toBe(true);
    expect(parseGiftShare(url.slice(url.indexOf("#")))).toEqual({ ...share, themeId: undefined });
  });

  it("keeps umlauts and a theme id", () => {
    const themed: GiftShare = { ...share, subject: "Süßes & Essen", themeId: "sweets" };
    expect(parseGiftShare(`#vorschlag=${encodeGiftShare(themed)}`)).toMatchObject({ subject: "Süßes & Essen", themeId: "sweets" });
  });

  it("carries no names or dedication, only card ids and wishes", () => {
    const decoded = atob(encodeGiftShare(share).replace(/-/g, "+").replace(/_/g, "/"));
    expect(Object.keys(JSON.parse(decoded)).sort()).toEqual(["b", "c", "k", "l", "n", "s", "v"]);
  });

  it("drops duplicate cards", () => {
    const doubled: GiftShare = { ...share, cards: [...share.cards, share.cards[0]!] };
    expect(parseGiftShare(`#vorschlag=${encodeGiftShare(doubled)}`)?.cards).toHaveLength(2);
  });

  it("refuses foreign, damaged or oversized input", () => {
    expect(parseGiftShare("")).toBeUndefined();
    expect(parseGiftShare("#other=abc")).toBeUndefined();
    expect(parseGiftShare("#vorschlag=!!!")).toBeUndefined();
    expect(parseGiftShare("#vorschlag=bm90LWpzb24")).toBeUndefined();
    expect(parseGiftShare(`#vorschlag=${"A".repeat(7_000)}`)).toBeUndefined();
    const forged = btoa(JSON.stringify({ v: 1, s: "x", n: 9, l: "en", c: "EUR", k: [["../../etc", "en", { finish: "normal", edition: "unlimited" }]] })).replace(/=+$/, "");
    expect(parseGiftShare(`#vorschlag=${forged}`)).toBeUndefined();
    const tooMany = btoa(JSON.stringify({ v: 1, s: "x", n: 9, l: "en", c: "EUR", k: Array.from({ length: 40 }, (_, i) => [`a-${i}`, "en", { finish: "normal", edition: "unlimited" }]) })).replace(/=+$/, "");
    expect(parseGiftShare(`#vorschlag=${tooMany}`)).toBeUndefined();
  });

  it("refuses to encode more than a full 36-card proposal", () => {
    const big: GiftShare = { ...share, cards: Array.from({ length: 37 }, (_, i) => ({ id: `x-${i}`, language: "en" as const, variant: { finish: "normal" as const, edition: "unlimited" as const } })) };
    expect(() => encodeGiftShare(big)).toThrow();
  });
});
