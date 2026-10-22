import { z } from "zod";

import type { CardLanguage, VariantSelection } from "./types";

/**
 * A gift proposal that travels inside a link, so a family can agree on the cards without an account or a server.
 * It sits in the URL fragment (`#vorschlag=…`), which the browser never sends to any server. It carries card ids,
 * the chosen variant and the wishes (subject, page size, budget) — no names, no dedication, no personal data.
 */
export const GIFT_SHARE_PARAM = "vorschlag";
export const GIFT_SHARE_MAX_CARDS = 36;
const GIFT_SHARE_MAX_ENCODED = 6_000;

const variantSchema = z.object({
  finish: z.enum(["normal", "holo", "reverse", "other", "unspecified"]),
  edition: z.enum(["unlimited", "first-edition", "unspecified"]),
  printing: z.enum(["shadowless", "shadowed", "unspecified"]).optional(),
});

const shareSchema = z.object({
  v: z.literal(1),
  /** Pokémon names (comma separated) or, in theme mode, the theme's label. */
  s: z.string().trim().max(80),
  /** Theme id when the proposal came from a theme. */
  t: z.string().regex(/^[a-z0-9-]{1,40}$/).optional(),
  n: z.union([z.literal(9), z.literal(18), z.literal(36)]),
  l: z.enum(["en", "de"]),
  c: z.enum(["EUR", "USD"]),
  b: z.number().int().min(100).max(1_000_000).optional(),
  k: z.array(z.tuple([
    z.string().regex(/^[A-Za-z0-9._-]{1,40}$/),
    z.enum(["en", "de"]),
    variantSchema,
  ])).min(1).max(GIFT_SHARE_MAX_CARDS),
});

export interface GiftShareCard {
  id: string;
  language: CardLanguage;
  variant: Pick<VariantSelection, "finish" | "edition" | "printing">;
}

export interface GiftShare {
  subject: string;
  themeId?: string;
  targetCardCount: 9 | 18 | 36;
  preferredLanguage: CardLanguage;
  currency: "EUR" | "USD";
  budgetMinor?: number;
  cards: GiftShareCard[];
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

/** The fragment value (without `#vorschlag=`). Throws when the data would not pass `parseGiftShare`. */
export function encodeGiftShare(share: GiftShare): string {
  const payload = shareSchema.parse({
    v: 1,
    s: share.subject,
    ...(share.themeId ? { t: share.themeId } : {}),
    n: share.targetCardCount,
    l: share.preferredLanguage,
    c: share.currency,
    ...(share.budgetMinor !== undefined ? { b: share.budgetMinor } : {}),
    k: share.cards.map((card) => [card.id, card.language, {
      finish: card.variant.finish,
      edition: card.variant.edition,
      ...(card.variant.printing ? { printing: card.variant.printing } : {}),
    }]),
  });
  return toBase64Url(JSON.stringify(payload));
}

/** Reads a location hash such as `#vorschlag=…`. Anything malformed, oversized or foreign yields `undefined`. */
export function parseGiftShare(hash: string): GiftShare | undefined {
  const match = /^#?vorschlag=([A-Za-z0-9_-]+)$/.exec(hash);
  if (!match || match[1]!.length > GIFT_SHARE_MAX_ENCODED) return undefined;
  try {
    const parsed = shareSchema.safeParse(JSON.parse(fromBase64Url(match[1]!)));
    if (!parsed.success) return undefined;
    const { s, t, n, l, c, b, k } = parsed.data;
    const unique = new Map<string, GiftShareCard>();
    for (const [id, language, variant] of k) {
      const key = `${id}:${language}`;
      if (!unique.has(key)) unique.set(key, { id, language, variant });
    }
    return { subject: s, themeId: t, targetCardCount: n, preferredLanguage: l, currency: c, budgetMinor: b, cards: [...unique.values()] };
  } catch {
    return undefined;
  }
}

export function giftShareUrl(origin: string, pathname: string, share: GiftShare): string {
  return `${origin}${pathname}#${GIFT_SHARE_PARAM}=${encodeGiftShare(share)}`;
}
