import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GiftContinueCard } from "@/components/foundation/GiftContinueCard";

vi.mock("@/data/partners/binder-affiliate-adapter", () => ({
  loadBinderPartnerCatalog: vi.fn(() => new Promise(() => undefined)),
  ReviewedBinderAffiliateAdapter: class {},
}));

afterEach(() => cleanup());

describe("gift continue card", () => {
  it("tells a returning buyer what is missing and offers both purchase steps", () => {
    const onCardsPurchase = vi.fn();
    render(<GiftContinueCard planned={9} missing={9} onCardsPurchase={onCardsPurchase} />);

    expect(screen.getByRole("region", { name: "So geht es mit deinem Geschenk weiter" })).toBeInTheDocument();
    expect(screen.getByText("9 von 9 Karten")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Binder bestellen/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Karten kaufen/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Karten besorgen" }));
    expect(onCardsPurchase).toHaveBeenCalledTimes(1);
  });

  it("congratulates when every card is there", () => {
    render(<GiftContinueCard planned={9} missing={0} onCardsPurchase={() => undefined} />);

    expect(screen.getByRole("heading", { name: /Alle Karten sind da/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Karten besorgen" })).not.toBeInTheDocument();
  });
});
