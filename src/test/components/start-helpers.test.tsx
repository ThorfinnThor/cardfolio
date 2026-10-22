import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GuidedStart } from "@/components/foundation/GuidedStart";
import { KidsWishlist } from "@/components/foundation/KidsWishlist";
import { VariantGlossary } from "@/components/foundation/VariantGlossary";
import { parseGiftShare } from "@/domain/gift-share";
import { STARTER_SETS } from "@/domain/starter-sets";
import type { GiftCardCandidate } from "@/domain/gift-builder";
import type { CardSnapshot, CatalogSearchItem } from "@/domain/types";

afterEach(() => cleanup());

function candidate(index: number): GiftCardCandidate {
  const id = `kid-${index}`;
  const card: CardSnapshot = {
    key: `tcgdex:${id}:de`,
    ref: { provider: "tcgdex", id, language: "de" },
    name: `Pikachu ${index}`,
    setId: `set-${index}`,
    setName: `Set ${index}`,
    collectorNumber: String(index),
    physicalStatus: "physical",
    imageBaseUrl: `https://assets.tcgdex.net/de/set/${id}`,
    availableVariants: { normal: false, holo: true, reverse: false, firstEdition: false, shadowless: false },
    fetchedAt: "2026-10-01T10:00:00.000Z",
  };
  return { card, variant: { finish: "holo", edition: "unlimited", printing: "shadowed" }, preferences: { minimumCondition: "excellent" }, price: { currency: "EUR", fetchedAt: card.fetchedAt, confidence: "unknown", issues: [] }, reasonTags: [] };
}

describe("GuidedStart", () => {
  it("leads a gift giver, a collector and a child to different places", () => {
    const onGift = vi.fn();
    const onSet = vi.fn();
    const onFree = vi.fn();
    render(<GuidedStart disabled={false} onGift={onGift} onSet={onSet} onFree={onFree} />);
    expect(screen.getByRole("link", { name: /Ich bin ein Kind/ }).getAttribute("href")).toMatch(/^\/kinder\/?$/);
    fireEvent.click(screen.getByRole("button", { name: /Ich verschenke ihn/ }));
    expect(onGift).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole("button", { name: /Ich baue eine Sammlung auf/ }));
    expect(screen.getAllByRole("listitem")).toHaveLength(STARTER_SETS.length);
    fireEvent.click(screen.getByRole("button", { name: /Celebrations/ }));
    expect(onSet).toHaveBeenCalledWith("cel25");
    fireEvent.click(screen.getByRole("button", { name: "Mit einem leeren Binder starten" }));
    expect(onFree).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Zurück" }));
    expect(screen.getByRole("heading", { name: /Wofür brauchst du den Binder/ })).toBeInTheDocument();
  });

  it("offers only starts that are available", () => {
    render(<GuidedStart disabled onGift={vi.fn()} onSet={vi.fn()} onFree={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Ich verschenke ihn/ })).toBeDisabled();
  });
});

describe("VariantGlossary", () => {
  it("explains the finishes and editions in plain words", () => {
    render(<VariantGlossary />);
    fireEvent.click(screen.getByText("Was bedeuten Holo, Reverse Holo und 1. Edition?"));
    for (const term of ["Holo", "Reverse Holo", "1. Edition", "Shadowless"]) expect(screen.getAllByText(term).length).toBeGreaterThan(0);
  });
});

describe("KidsWishlist", () => {
  it("shows nine cards, lets a child swap one and hands the parents a link", async () => {
    const pool: CatalogSearchItem[] = Array.from({ length: 12 }, (_, index) => ({ ref: { provider: "tcgdex", id: `kid-${index + 1}`, language: "de" }, name: `Pikachu ${index + 1}`, collectorNumber: String(index + 1) }));
    const loader = {
      loadCandidatePool: vi.fn(async () => pool),
      hydrateCandidates: vi.fn(async () => Array.from({ length: 12 }, (_, index) => candidate(index + 1))),
    };
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<KidsWishlist loader={loader} />);

    fireEvent.click(screen.getByRole("button", { name: "Pikachu" }));
    expect(await screen.findByRole("heading", { name: /Deine neun Karten: Pikachu/ })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /tauschen$/ })).toHaveLength(9);
    expect(screen.queryByText(/€/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Pikachu 1 tauschen" }));
    expect(screen.queryByRole("button", { name: "Pikachu 1 tauschen" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pikachu 10 tauschen" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Das ist mein Wunschzettel/ }));
    expect(await screen.findByRole("heading", { name: /Zeig das Mama oder Papa/ })).toBeInTheDocument();
    const link = (writeText.mock.calls[0] as unknown as [string])[0];
    expect(link).toContain("/geschenk/#vorschlag=");
    const parsed = parseGiftShare(link.slice(link.indexOf("#")));
    expect(parsed?.cards).toHaveLength(9);
    expect(parsed?.cards.map((card) => card.id)).toContain("kid-10");
    expect(parsed?.cards.map((card) => card.id)).not.toContain("kid-1");
  });

  it("explains when no card is found", async () => {
    const loader = { loadCandidatePool: vi.fn(async () => []), hydrateCandidates: vi.fn(async () => []) };
    render(<KidsWishlist loader={loader} />);
    fireEvent.change(screen.getByLabelText(/schreib den Namen/), { target: { value: "Xyzzy" } });
    fireEvent.click(screen.getByRole("button", { name: "Los" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/keine Karten gefunden/));
  });
});
