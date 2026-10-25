import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { QuickAddPanel } from "@/components/foundation/QuickAddPanel";
import { createBinder } from "@/domain/binder-actions";
import type { CardSnapshot, CatalogAdapter, CatalogSearchItem } from "@/domain/types";

const items: CatalogSearchItem[] = ["1", "2", "3"].map((number) => ({ ref: { provider: "tcgdex", id: `base1-${number}`, language: "en" }, name: `Karte ${number}`, collectorNumber: number, setId: "base1", setName: "Base Set" }));
const catalog: CatalogAdapter = {
  search: vi.fn(async () => ({ items, hasMore: false })),
  getCard: vi.fn(async (ref): Promise<CardSnapshot> => {
    const found = items.find((item) => item.ref.id === ref.id)!;
    return { key: `tcgdex:${ref.id}:en`, ref, name: found.name, setId: "base1", setName: "Base Set", collectorNumber: found.collectorNumber, physicalStatus: "physical", fetchedAt: "2026-10-25T00:00:00.000Z" };
  }),
};

afterEach(cleanup);

async function chooseBaseSet() {
  fireEvent.click(screen.getByLabelText("Englisch"));
  fireEvent.change(screen.getByLabelText("Set"), { target: { value: "Base Set" } });
  const list = await screen.findByRole("list", { name: "Gefundene Sets" });
  fireEvent.click(within(list).getByRole("button", { name: /^Base Set1999/ }));
}

describe("QuickAddPanel", () => {
  it("checks typed numbers against the set, shows what was not found and sends the cards to be entered", async () => {
    const onApply = vi.fn(async () => undefined);
    render(<QuickAddPanel catalog={catalog} binder={createBinder("Sammlung")} onApply={onApply} onClose={vi.fn()} />);
    await chooseBaseSet();
    fireEvent.change(screen.getByLabelText(/^Kartennummern/), { target: { value: "1 2x2 99" } });
    fireEvent.change(screen.getByLabelText(/Zustand/), { target: { value: "near-mint" } });
    fireEvent.click(screen.getByRole("button", { name: "Karten prüfen" }));

    expect(await screen.findByText("Karte 1")).toBeInTheDocument();
    expect(screen.getByText("Karte 2")).toBeInTheDocument();
    expect(screen.getByText("Nicht im Katalog gefunden")).toBeInTheDocument();
    expect(screen.getByText("2 Karten werden eingetragen, 1 nicht gefunden.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "2 Karten als vorhanden eintragen" }));
    await waitFor(() => expect(onApply).toHaveBeenCalledTimes(1));
    const [changes, condition] = onApply.mock.calls[0] as unknown as [Array<{ card: CardSnapshot; quantity: number }>, string];
    expect(changes.map((change) => [change.card.name, change.quantity])).toEqual([["Karte 1", 1], ["Karte 2", 2]]);
    expect(condition).toBe("near-mint");
  });

  it("asks for numbers, and a pasted line names its own set", async () => {
    render(<QuickAddPanel catalog={catalog} binder={createBinder("Sammlung")} onApply={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Karten prüfen" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Gib mindestens eine Kartennummer ein");

    fireEvent.click(screen.getByLabelText("Englisch"));
    fireEvent.change(screen.getByLabelText(/^Kartennummern/), { target: { value: "Base Set: 3\n7" } });
    fireEvent.click(screen.getByRole("button", { name: "Karten prüfen" }));
    expect(await screen.findByText("Karte 3")).toBeInTheDocument();
    // The second line has no set of its own and none was chosen.
    expect(screen.getByText(/Wähle oben ein Set/)).toBeInTheDocument();
  });

  it("marks a card the binder already holds and can go back to the input", async () => {
    render(<QuickAddPanel catalog={catalog} binder={createBinder("Sammlung")} onApply={vi.fn()} onClose={vi.fn()} />);
    await chooseBaseSet();
    fireEvent.change(screen.getByLabelText(/^Kartennummern/), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Karten prüfen" }));
    await screen.findByText("Karte 1");
    fireEvent.click(screen.getByRole("button", { name: "Zurück" }));
    expect(screen.getByLabelText(/^Kartennummern/)).toHaveValue("1");
  });
});
