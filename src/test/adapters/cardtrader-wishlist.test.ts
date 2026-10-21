import { describe, expect, it, vi } from "vitest";

import type { CardtraderHandoff } from "@/data/marketplace/cardtrader-handoff";
import { CARDTRADER_WISHLISTS_ENDPOINT, createCardtraderWishlist, isPlausibleCardtraderToken, planCardtraderWishlist } from "@/data/marketplace/cardtrader-wishlist";
import type { MissingItem } from "@/domain/types";

const TOKEN = "eyJhbGciOiJIUzI1NiJ9.test-token-value-0123456789";

function item(key: string, language: "en" | "de", quantity: number): MissingItem {
  return {
    identityKey: key,
    card: { key: `tcgdex:${key}:${language}`, ref: { provider: "tcgdex", id: key, language }, name: key, setId: "base1", setName: "Base Set", collectorNumber: "1", physicalStatus: "physical", fetchedAt: "2026-10-21T00:00:00.000Z" },
    variant: { finish: "holo", edition: "unlimited", printing: "unspecified" },
    preferences: { minimumCondition: "excellent" },
    quantity,
    entryIds: ["00000000-0000-4000-8000-000000000001"],
  } as MissingItem;
}

function handoff(entries: CardtraderHandoff["entries"]): CardtraderHandoff {
  return { entries, linkedCount: entries.filter((entry) => entry.blueprintId).length, pricedCount: 0, pricedTotalMinor: 0, pricedQuantity: 0 };
}

describe("planCardtraderWishlist", () => {
  it("lists verified blueprints with copies and language, merges duplicates and skips unmatched cards", () => {
    const plan = planCardtraderWishlist(
      [item("a", "en", 2), item("b", "de", 1), item("c", "en", 3), item("d", "en", 1)],
      handoff([{ identityKey: "a", blueprintId: 11 }, { identityKey: "b", blueprintId: 12 }, { identityKey: "c", blueprintId: 11 }, { identityKey: "d" }]),
      "Your Card Binder 2026-10-21",
    );
    expect(plan?.quantity).toBe(6);
    expect(plan?.skippedPositions).toBe(1);
    expect(plan?.request).toEqual({
      deck: {
        name: "Your Card Binder 2026-10-21",
        public: false,
        game_id: 5,
        deck_items_attributes: [
          { blueprint_id: 11, language: "en", quantity: 5 },
          { blueprint_id: 12, language: "de", quantity: 1 },
        ],
      },
    });
  });

  it("returns nothing when no card has a verified blueprint", () => {
    expect(planCardtraderWishlist([item("d", "en", 1)], handoff([{ identityKey: "d" }]), "x")).toBeUndefined();
  });
});

describe("createCardtraderWishlist", () => {
  const request = planCardtraderWishlist([item("a", "en", 1)], handoff([{ identityKey: "a", blueprintId: 11 }]), "Liste")!.request;

  it("posts the private list with the token in the header only", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: 77, name: "Liste" }), { status: 200 }));
    await expect(createCardtraderWishlist(`  ${TOKEN}  `, request, fetchMock as unknown as typeof fetch)).resolves.toEqual({ ok: true, id: 77 });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(CARDTRADER_WISHLISTS_ENDPOINT);
    expect(url).not.toContain(TOKEN);
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${TOKEN}`);
    expect(init.credentials).toBe("omit");
    expect(init.referrerPolicy).toBe("no-referrer");
    expect(String(init.body)).not.toContain(TOKEN);
    expect(JSON.parse(String(init.body)).deck.public).toBe(false);
  });

  it("refuses an implausible token without any request", async () => {
    const fetchMock = vi.fn();
    for (const bad of ["", "short", "has space in it 0123456789", `${TOKEN}\nX-Evil: 1`]) {
      await expect(createCardtraderWishlist(bad, request, fetchMock as unknown as typeof fetch)).resolves.toEqual({ ok: false, reason: "invalid-token" });
    }
    expect(fetchMock).not.toHaveBeenCalled();
    expect(isPlausibleCardtraderToken(TOKEN)).toBe(true);
  });

  it.each([
    [401, "unauthorized"],
    [403, "unauthorized"],
    [429, "rate-limited"],
    [422, "rejected"],
    [500, "rejected"],
  ])("maps HTTP %i to %s", async (status, reason) => {
    const fetchMock = vi.fn(async () => new Response("{}", { status }));
    await expect(createCardtraderWishlist(TOKEN, request, fetchMock as unknown as typeof fetch)).resolves.toMatchObject({ ok: false, reason });
  });

  it("does not claim success for an answer without a wishlist id", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ name: "Liste" }), { status: 200 }));
    await expect(createCardtraderWishlist(TOKEN, request, fetchMock as unknown as typeof fetch)).resolves.toMatchObject({ ok: false, reason: "invalid-response" });
  });

  it("reports a network failure", async () => {
    const fetchMock = vi.fn(async () => { throw new TypeError("offline"); });
    await expect(createCardtraderWishlist(TOKEN, request, fetchMock as unknown as typeof fetch)).resolves.toEqual({ ok: false, reason: "network" });
  });
});
