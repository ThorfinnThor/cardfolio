import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SetBinderWizard } from "@/components/foundation/SetBinderWizard";
import type { CatalogSetIndexEntry } from "@/domain/catalog-set";
import type { CardSnapshot, CatalogAdapter } from "@/domain/types";

afterEach(() => cleanup());

const sets: CatalogSetIndexEntry[] = [{
  provider: "tcgdex",
  id: "base1",
  names: { de: "Grundset", en: "Base Set" },
  series: { de: { id: "base", name: "Basis" }, en: { id: "base", name: "Base" } },
  releaseDate: "1999-01-09",
  cardCount: { official: 102, total: 102 },
  assets: {},
}, {
  provider: "tcgdex",
  id: "english-only",
  names: { en: "English-only Set" },
  series: { en: { id: "other", name: "Other" } },
  cardCount: { official: 1, total: 1 },
  assets: {},
}, {
  provider: "tcgdex",
  id: "sv08.5",
  names: { de: "Prismatische Entwicklungen", en: "Prismatic Evolutions" },
  series: { de: { id: "sv", name: "Karmesin & Purpur" }, en: { id: "sv", name: "Scarlet & Violet" } },
  releaseDate: "2025-01-17",
  cardCount: { official: 131, total: 180 },
  assets: {},
}];

function card(id: string, setId = "base1"): CardSnapshot {
  return {
    key: `tcgdex:${id}:de`,
    ref: { provider: "tcgdex", id, language: "de" },
    name: "Bisasam",
    setId,
    setName: "Grundset",
    collectorNumber: "1",
    physicalStatus: "physical",
    fetchedAt: "2026-10-09T00:00:00.000Z",
  };
}

describe("SetBinderWizard", () => {
  it("uses German card language and German set names by default", () => {
    const catalog = { search: vi.fn(), getCard: vi.fn() } as unknown as CatalogAdapter;
    render(<SetBinderWizard catalog={catalog} sets={sets} onCancel={vi.fn()} onCreate={vi.fn()} />);

    expect(screen.getByLabelText("Kartensprache")).toHaveValue("de");
    expect(screen.getByLabelText("Umfang")).toHaveValue("complete-catalog");
    expect(screen.getByRole("button", { name: /Grundset.*Serie: Basis.*Veröffentlicht: 09.01.1999.*102 Karten/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Prismatische Entwicklungen.*180 Karten insgesamt \(131 regulär \+ 49 Secret Rares\)/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /English-only Set/ })).not.toBeInTheDocument();
  });

  it("keeps German UI names while exposing the English set name for English cards", () => {
    const catalog = { search: vi.fn(), getCard: vi.fn() } as unknown as CatalogAdapter;
    render(<SetBinderWizard catalog={catalog} sets={sets} onCancel={vi.fn()} onCreate={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Kartensprache"), { target: { value: "en" } });

    expect(screen.getByRole("button", { name: /Grundset.*Englischer Setname: Base Set/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /English-only Set/ })).toBeInTheDocument();
  });

  it("discards leaked results from another set before building the plan", async () => {
    const catalog = {
      search: vi.fn(async () => ({
        items: [{
          ref: { provider: "tcgdex" as const, id: "base1-1", language: "de" as const },
          name: "Bisasam",
          collectorNumber: "1",
          setId: "base1",
        }, {
          ref: { provider: "tcgdex" as const, id: "other-1", language: "de" as const },
          name: "Fremde Karte",
          collectorNumber: "1",
          setId: "other",
        }],
        hasMore: false,
      })),
      getCard: vi.fn(async (ref) => card(ref.id)),
    } satisfies CatalogAdapter;
    render(<SetBinderWizard catalog={catalog} sets={sets} onCancel={vi.fn()} onCreate={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /Grundset.*102 Karten/ }));
    fireEvent.click(screen.getByRole("button", { name: "Set prüfen" }));

    await waitFor(() => expect(catalog.getCard).toHaveBeenCalledTimes(1));
    expect(catalog.getCard).toHaveBeenCalledWith(expect.objectContaining({ id: "base1-1" }));
    expect(await screen.findByLabelText("Bindername")).toHaveValue("Grundset");
    expect(within(screen.getByRole("region", { name: "Binder mit einem Set erstellen" })).queryByText(/Every card/)).not.toBeInTheDocument();
  });
});
