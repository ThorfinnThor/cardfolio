import { describe, expect, it, vi } from "vitest";

import { CardTraderCatalogAdapter } from "@/data/marketplace/cardtrader-adapter";
import { cardtraderWishlistCreateSchema } from "@/data/marketplace/cardtrader-schemas";

describe("CardTrader catalog adapter", () => {
  it("normalizes catalog data and keeps the token in the request header", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify([{
      id: 5,
      name: "Pokemon",
      display_name: "Pokémon",
    }]), { status: 200, headers: { "Content-Type": "application/json" } }));
    const adapter = new CardTraderCatalogAdapter({ token: "test-token", fetch: fetchMock as typeof fetch });
    await expect(adapter.listGames()).resolves.toEqual([{
      provider: "cardtrader",
      providerGameId: "5",
      name: "Pokemon",
      displayName: "Pokémon",
    }]);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.cardtrader.com/api/v2/games",
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer test-token" }) }),
    );
  });

  it("models explicit blueprint wishlist items rather than lossy free text", () => {
    expect(cardtraderWishlistCreateSchema.parse({
      deck: {
        name: "Cardfolio Prüfung",
        public: false,
        game_id: 5,
        deck_items_attributes: [{ blueprint_id: 123, quantity: 1, language: "de", condition: "Near Mint" }],
      },
    }).deck.deck_items_attributes[0].blueprint_id).toBe(123);
  });

  it("rejects wishlist rows without an identity", () => {
    expect(() => cardtraderWishlistCreateSchema.parse({
      deck: { name: "Invalid", game_id: 5, deck_items_attributes: [{ quantity: 1 }] },
    })).toThrow();
  });

  it("explains invalid and rate-limited credentials without exposing the token", async () => {
    const invalid = new CardTraderCatalogAdapter({
      token: "secret-token",
      fetch: vi.fn(async () => new Response(null, { status: 401 })) as typeof fetch,
    });
    await expect(invalid.listGames()).rejects.toThrow(/fehlt, ist ungültig oder abgelaufen/i);
    await expect(invalid.listGames()).rejects.not.toThrow(/secret-token/);

    const limited = new CardTraderCatalogAdapter({
      token: "secret-token",
      fetch: vi.fn(async () => new Response(null, { status: 429 })) as typeof fetch,
    });
    await expect(limited.listGames()).rejects.toThrow(/begrenzt die Anfragen/i);
  });
});
