/**
 * CardTrader referral (affiliate) code of the owner. Anyone who opens CardTrader through a link carrying
 * `share_code` is registered as an invitee for 48 hours; the owner earns 1% of the card price of what they buy,
 * excluding shipping (CardTrader's referral programme, 2026-10-21). The price for the buyer does not change.
 */
export const CARDTRADER_SHARE_CODE = "yourcardbinder";

/** Adds the share code with `?` or `&`, as CardTrader's programme describes, and never twice. */
export function withCardtraderShareCode(url: string): string {
  const parsed = new URL(url);
  if (parsed.hostname !== "www.cardtrader.com" && parsed.hostname !== "cardtrader.com") throw new Error("Not a CardTrader address.");
  parsed.searchParams.set("share_code", CARDTRADER_SHARE_CODE);
  return parsed.toString();
}

/**
 * The page of one card. `/en/cards/<blueprint id>` redirects to the canonical page and keeps the share code
 * (opened by hand on 2026-10-21).
 */
export function cardtraderCardUrl(blueprintId: number): string {
  return withCardtraderShareCode(`https://www.cardtrader.com/en/cards/${blueprintId}`);
}

/** CardTrader's Shop Optimizer: build a list, then let it pick sellers (cheapest, fewest sellers, fastest). */
export const CARDTRADER_SHOP_OPTIMIZER_URL = withCardtraderShareCode("https://www.cardtrader.com/en/wishlists/new");

export const CARDTRADER_AFFILIATE_NOTICE = "Werbelink: Your Card Binder kann bei einem Kauf eine Provision erhalten. Dein Preis bleibt gleich.";
