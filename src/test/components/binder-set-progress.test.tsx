import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BinderSetProgress } from "@/components/foundation/BinderSetProgress";
import type { Binder, CardSnapshot, PlannedCard } from "@/domain/types";

const card = (number: string): CardSnapshot => ({ key: `tcgdex:base1-${number}:en`, ref: { provider: "tcgdex", id: `base1-${number}`, language: "en" }, name: `Card ${number}`, setId: "base1", setName: "Base Set", collectorNumber: number, collectorTotal: "102", physicalStatus: "physical", fetchedAt: "2026-10-22T00:00:00.000Z" });
const planned = (cardKey: string, owned: boolean): PlannedCard => ({ id: crypto.randomUUID(), cardKey, variant: { finish: "normal", edition: "unlimited", printing: "shadowed" }, preferences: { minimumCondition: "excellent" }, owned, addedAt: "2026-10-22T00:00:00.000Z" });
const binderWith = (slots: Array<PlannedCard | null>): Binder => ({ id: crypto.randomUUID(), schemaVersion: 1, revision: 1, name: "Test", description: "", layout: { rows: 3, columns: 3 }, pages: [{ id: crypto.randomUUID(), slots, note: "" }], createdAt: "2026-10-22T00:00:00.000Z", updatedAt: "2026-10-22T00:00:00.000Z" });

describe("BinderSetProgress", () => {
  it("shows owned of planned per set and the share of the printed set", () => {
    const cards = new Map([card("1"), card("2")].map((item) => [item.key, item] as const));
    render(<BinderSetProgress binder={binderWith([planned("tcgdex:base1-1:en", true), planned("tcgdex:base1-2:en", false), null])} cards={cards} />);
    expect(screen.getByText("Fortschritt nach Set (1)")).toBeInTheDocument();
    expect(screen.getByText("Base Set")).toBeInTheDocument();
    expect(screen.getByText(/1 von 2 vorhanden/)).toBeInTheDocument();
    expect(screen.getByText("2 von 102 Karten des Sets geplant")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "50 Prozent vorhanden" })).toBeInTheDocument();
  });

  it("shows the set logo from the TCGdex asset host", () => {
    const cards = new Map([card("1")].map((item) => [item.key, item] as const));
    const { container } = render(<BinderSetProgress binder={binderWith([planned("tcgdex:base1-1:en", true)])} cards={cards} />);
    const image = container.querySelector("img");
    expect(image?.getAttribute("src")).toMatch(/^https:\/\/assets\.tcgdex\.net\//);
  });

  it("renders nothing for a binder without planned cards", () => {
    const { container } = render(<BinderSetProgress binder={binderWith([null, null])} cards={new Map()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
