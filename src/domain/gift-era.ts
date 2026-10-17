export type GiftEra = "vintage" | "modern";

/**
 * Set ids of cards printed before 2010 (the same boundary the Gift selection uses for "alt" and "modern").
 * The catalogue search lists the set of every card but not its year, so this only lets the pool lean towards
 * an era before cards are loaded. The real release year decides afterwards.
 */
const VINTAGE_SET_ID = /^(base\d*|basep|gym\d|neo\d|ecard\d|ex\d+|dp\d*|dpp|pl\d|pop\d|np|si1|bog|lc|ru1)$/i;

export function eraOfSetId(setId: string | undefined): GiftEra | undefined {
  if (!setId) return undefined;
  return VINTAGE_SET_ID.test(setId) ? "vintage" : "modern";
}
