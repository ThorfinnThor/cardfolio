import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GiftPurchaseSteps } from "@/components/foundation/GiftPurchaseSteps";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("GiftPurchaseSteps", () => {
  it("asks whether a binder exists and then puts buying the cards first", async () => {
    render(<GiftPurchaseSteps planSize={9} onCardsPurchase={vi.fn()} />);

    const headings = () => screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent?.replace(/\s+/g, " ").trim());
    expect(headings()).toEqual(["1 Binder auswählen und bestellen", "2 Karten kaufen"]);
    expect(screen.getByRole("radio", { name: "Nein, ich brauche einen" })).toBeChecked();

    fireEvent.click(screen.getByRole("radio", { name: "Ja, ich habe schon einen" }));
    expect(headings()).toEqual(["1 Karten kaufen", "2 Binder auswählen und bestellen"]);

    fireEvent.click(screen.getByRole("radio", { name: "Nein, ich brauche einen" }));
    expect(headings()).toEqual(["1 Binder auswählen und bestellen", "2 Karten kaufen"]);
  });
});
