import { z } from "zod";

import type { CardLanguage, MissingItem } from "@/domain/types";

import type { CardtraderHandoff } from "./cardtrader-handoff";
import { cardtraderWishlistCreateSchema } from "./cardtrader-schemas";

/** CardTrader's game id for Pokémon (`GET /games`). */
export const CARDTRADER_POKEMON_GAME_ID = 5;
export const CARDTRADER_WISHLISTS_ENDPOINT = "https://api.cardtrader.com/api/v2/wishlists";
const REQUEST_TIMEOUT_MS = 20_000;

export type CardtraderWishlistRequest = z.infer<typeof cardtraderWishlistCreateSchema>;

export interface CardtraderWishlistPlan {
  request: CardtraderWishlistRequest;
  /** Cards that go on the wishlist (copies counted). */
  quantity: number;
  /** Positions without a verified blueprint; they stay out of the wishlist. */
  skippedPositions: number;
}

/**
 * Builds the wishlist from verified blueprint matches only. Each item names the blueprint, the copies and the card
 * language; the minimum condition is left to the Shop Optimizer because CardTrader documents the wishlist condition
 * as one grade, not as a floor.
 */
export function planCardtraderWishlist(items: readonly MissingItem[], handoff: CardtraderHandoff, name: string): CardtraderWishlistPlan | undefined {
  const byKey = new Map<string, { blueprint_id: number; language: CardLanguage; quantity: number }>();
  let skippedPositions = 0;
  for (const item of items) {
    const blueprintId = handoff.entries.find((entry) => entry.identityKey === item.identityKey)?.blueprintId;
    if (!blueprintId) { skippedPositions += 1; continue; }
    const language = item.card.ref.language;
    const key = `${blueprintId}:${language}`;
    const existing = byKey.get(key);
    if (existing) existing.quantity += item.quantity;
    else byKey.set(key, { blueprint_id: blueprintId, language, quantity: item.quantity });
  }
  if (!byKey.size) return undefined;
  const entries = [...byKey.values()];
  const request = cardtraderWishlistCreateSchema.parse({
    deck: { name, public: false, game_id: CARDTRADER_POKEMON_GAME_ID, deck_items_attributes: entries },
  });
  return { request, quantity: entries.reduce((total, entry) => total + entry.quantity, 0), skippedPositions };
}

/** A personal access token is a long single-line string; anything else is refused before it can reach a header. */
export function isPlausibleCardtraderToken(value: string): boolean {
  return /^[A-Za-z0-9._~+/=-]{20,4096}$/.test(value);
}

const createdWishlistSchema = z.object({ id: z.number().int().positive() });

export type CardtraderWishlistResult =
  | { ok: true; id: number }
  | { ok: false; reason: "invalid-token" | "unauthorized" | "rejected" | "rate-limited" | "invalid-response" | "network"; status?: number };

/**
 * Creates one private wishlist in the user's own CardTrader account. The token stays in the argument: it is never
 * stored, logged or put into a URL, and the call sends no cookies and no referrer.
 */
export async function createCardtraderWishlist(
  token: string,
  request: CardtraderWishlistRequest,
  fetchImpl: typeof fetch = fetch,
): Promise<CardtraderWishlistResult> {
  const trimmed = token.trim();
  if (!isPlausibleCardtraderToken(trimmed)) return { ok: false, reason: "invalid-token" };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetchImpl(CARDTRADER_WISHLISTS_ENDPOINT, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${trimmed}` },
      body: JSON.stringify(request),
      credentials: "omit",
      referrerPolicy: "no-referrer",
      cache: "no-store",
      signal: controller.signal,
    });
    if (response.status === 401 || response.status === 403) return { ok: false, reason: "unauthorized", status: response.status };
    if (response.status === 429) return { ok: false, reason: "rate-limited", status: 429 };
    if (!response.ok) return { ok: false, reason: "rejected", status: response.status };
    const parsed = createdWishlistSchema.safeParse(await response.json().catch(() => undefined));
    return parsed.success ? { ok: true, id: parsed.data.id } : { ok: false, reason: "invalid-response", status: response.status };
  } catch {
    return { ok: false, reason: "network" };
  } finally {
    clearTimeout(timer);
  }
}
