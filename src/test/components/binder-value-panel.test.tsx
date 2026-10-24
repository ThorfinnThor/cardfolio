import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BinderValuePanel, type ValueHistoryStore } from "@/components/foundation/BinderValuePanel";
import { CopyDetailsForm } from "@/components/foundation/CopyDetailsForm";
import type { GiftPriceRequest, PriceProvider } from "@/domain/gift-builder";
import type { Binder, CardSnapshot, PlannedCard, ValuePoint } from "@/domain/types";
import { fireEvent } from "@testing-library/react";

const iso = "2026-10-24T00:00:00.000Z";
const card = (number: string): CardSnapshot => ({ key: `tcgdex:base1-${number}:en`, ref: { provider: "tcgdex", id: `base1-${number}`, language: "en" }, name: `Card ${number}`, setId: "base1", setName: "Base Set", collectorNumber: number, physicalStatus: "physical", fetchedAt: iso });
const planned = (cardKey: string, extra: Partial<PlannedCard> = {}): PlannedCard => ({ id: crypto.randomUUID(), cardKey, variant: { finish: "normal", edition: "unlimited", printing: "shadowed" }, preferences: { minimumCondition: "excellent" }, owned: true, addedAt: iso, ...extra });
const binderWith = (slots: Array<PlannedCard | null>): Binder => ({ id: crypto.randomUUID(), schemaVersion: 1, revision: 1, name: "Test", description: "", layout: { rows: 3, columns: 3 }, pages: [{ id: crypto.randomUUID(), slots: [...slots, ...Array(9 - slots.length).fill(null)], note: "" }], createdAt: iso, updatedAt: iso });
const cards = new Map([card("1"), card("2")].map((item) => [item.key, item] as const));

const provider = (prices: Record<string, number | undefined>): PriceProvider => ({
  getPrice: vi.fn(async (request: GiftPriceRequest) => ({ currency: "EUR" as const, fetchedAt: request.fetchedAt, confidence: "approximate" as const, issues: [], amountMinor: prices[request.card.key] })),
});
const memoryStore = (initial: ValuePoint[] = []): ValueHistoryStore & { saved: ValuePoint[][] } => {
  const saved: ValuePoint[][] = [];
  return { saved, load: async () => initial, save: async (_id, history) => { saved.push([...history]); } };
};

afterEach(cleanup);

describe("BinderValuePanel", () => {
  it("asks for owned cards when there are none", () => {
    render(<BinderValuePanel binder={binderWith([planned("tcgdex:base1-1:en", { owned: false })])} cards={cards} provider={provider({})} store={memoryStore()} />);
    expect(screen.getByText(/Markiere Karten als vorhanden/)).toBeInTheDocument();
  });

  it("shows the value with its coverage, multiplies by quantity and saves today's point", async () => {
    const store = memoryStore();
    const binder = binderWith([planned("tcgdex:base1-1:en", { quantity: 2, condition: "near-mint" }), planned("tcgdex:base1-2:en")]);
    render(<BinderValuePanel binder={binder} cards={cards} provider={provider({ "tcgdex:base1-1:en": 500, "tcgdex:base1-2:en": undefined })} store={store} />);

    expect(await screen.findByText(/10,00/)).toBeInTheDocument();
    expect(screen.getByText("2 von 3 vorhandenen Karten bepreist")).toBeInTheDocument();
    expect(screen.getByText(/Es gilt der Mindestzustand/)).toBeInTheDocument();
    expect(screen.getByText(/Der Verlauf beginnt heute/)).toBeInTheDocument();
    expect(screen.getByText(/keine Anlageberatung/)).toBeInTheDocument();
    await waitFor(() => expect(store.saved).toHaveLength(1));
    expect(store.saved[0]![0]).toMatchObject({ valueMinor: 1000, pricedCopies: 2, ownedCopies: 3 });
  });

  it("draws the history and the change when earlier points exist", async () => {
    const earlier: ValuePoint = { date: "2026-10-01", valueMinor: 800, pricedCopies: 3, ownedCopies: 3 };
    render(<BinderValuePanel binder={binderWith([planned("tcgdex:base1-1:en")])} cards={cards} provider={provider({ "tcgdex:base1-1:en": 1000 })} store={memoryStore([earlier])} />);
    expect(await screen.findByRole("img", { name: /Wertverlauf von/ })).toBeInTheDocument();
    expect(screen.getByText(/Seit .*: \+2,00/)).toBeInTheDocument();
  });

  it("says so instead of showing zero when no card has a price", async () => {
    const store = memoryStore();
    render(<BinderValuePanel binder={binderWith([planned("tcgdex:base1-1:en")])} cards={cards} provider={provider({})} store={store} />);
    expect(await screen.findByText("Für diese Karten liegt noch kein Preis vor.")).toBeInTheDocument();
    expect(store.saved).toHaveLength(0);
  });
});

describe("CopyDetailsForm", () => {
  it("changes condition and quantity and keeps the quantity within one and ninety-nine", () => {
    const onChange = vi.fn();
    const { rerender } = render(<CopyDetailsForm entry={planned("tcgdex:base1-1:en")} onChange={onChange} />);
    expect(screen.getByRole("button", { name: "Eine Karte weniger" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Eine Karte mehr" }));
    expect(onChange).toHaveBeenLastCalledWith({ quantity: 2 });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "lightly-played" } });
    expect(onChange).toHaveBeenLastCalledWith({ condition: "lightly-played" });
    rerender(<CopyDetailsForm entry={planned("tcgdex:base1-1:en", { quantity: 99 })} onChange={onChange} />);
    expect(screen.getByRole("button", { name: "Eine Karte mehr" })).toBeDisabled();
  });
});
