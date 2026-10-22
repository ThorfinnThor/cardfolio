import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PlaceholderPrint } from "@/components/foundation/PlaceholderPrint";
import type { Binder, CardSnapshot, PlannedCard } from "@/domain/types";

const card = (number: string): CardSnapshot => ({ key: `tcgdex:base1-${number}:en`, ref: { provider: "tcgdex", id: `base1-${number}`, language: "en" }, name: `Karte ${number}`, setId: "base1", setName: "Base Set", collectorNumber: number, collectorTotal: "102", physicalStatus: "physical", fetchedAt: "2026-10-22T00:00:00.000Z" });
const planned = (cardKey: string, owned: boolean): PlannedCard => ({ id: crypto.randomUUID(), cardKey, variant: { finish: "normal", edition: "unlimited", printing: "shadowed" }, preferences: { minimumCondition: "excellent" }, owned, addedAt: "2026-10-22T00:00:00.000Z" });
const binder: Binder = { id: crypto.randomUUID(), schemaVersion: 1, revision: 1, name: "Test", description: "", layout: { rows: 3, columns: 3 }, pages: [{ id: crypto.randomUUID(), slots: [planned("tcgdex:base1-1:en", true), planned("tcgdex:base1-2:en", false), null], note: "" }], createdAt: "2026-10-22T00:00:00.000Z", updatedAt: "2026-10-22T00:00:00.000Z" };
const cards = new Map([card("1"), card("2")].map((item) => [item.key, item] as const));

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("PlaceholderPrint", () => {
  it("counts what will be printed, lets the buyer add free slots and prints on request", () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
    render(<PlaceholderPrint binder={binder} cards={cards} onClose={vi.fn()} />);
    expect(screen.getByRole("dialog", { name: "Platzhalter drucken" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("1 Platzhalter auf 1 Seite");
    fireEvent.click(screen.getByRole("checkbox", { name: /Freie Plätze/ }));
    expect(screen.getByRole("status")).toHaveTextContent("2 Platzhalter auf 1 Seite");
    fireEvent.click(screen.getByRole("button", { name: "Drucken" }));
    expect(print).toHaveBeenCalledOnce();
  });

  it("prints text only: position, name, set and number of the missing card, never an image", () => {
    render(<PlaceholderPrint binder={binder} cards={cards} onClose={vi.fn()} />);
    const sheet = document.querySelector("[data-placeholder-print]")!;
    expect(sheet.textContent).toContain("Seite 1 · Platz 2");
    expect(sheet.textContent).toContain("Karte 2");
    expect(sheet.textContent).toContain("Nr. 2/102 · Englisch");
    expect(sheet.textContent).not.toContain("Karte 1");
    expect(sheet.querySelector("img")).toBeNull();
  });

  it("hides the rest of the page for printing only while it is open, and disables printing with nothing to print", () => {
    const { unmount } = render(<PlaceholderPrint binder={binder} cards={cards} onClose={vi.fn()} />);
    expect(document.documentElement.classList.contains("printing-placeholders")).toBe(true);
    fireEvent.click(screen.getByRole("checkbox", { name: "Fehlende Karten" }));
    expect(screen.getByRole("button", { name: "Drucken" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Nichts zu drucken");
    unmount();
    expect(document.documentElement.classList.contains("printing-placeholders")).toBe(false);
    expect(document.querySelector("[data-placeholder-print]")).toBeNull();
  });
});
