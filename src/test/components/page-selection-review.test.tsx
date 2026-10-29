import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createBinder } from "@/domain/binder-actions";
import { PageSelectionReview } from "@/components/foundation/PageSelectionReview";
import type { PageSelectionItem } from "@/domain/page-selection";

afterEach(() => cleanup());

const item: PageSelectionItem = {
  card: {
    key: "tcgdex:base1-1:en",
    ref: { provider: "tcgdex", id: "base1-1", language: "en" },
    name: "Bulbasaur",
    setId: "base1",
    setName: "Base Set",
    collectorNumber: "1",
    physicalStatus: "physical",
    fetchedAt: "2026-10-01T00:00:00.000Z",
    availableVariants: { normal: true, holo: false, reverse: false, firstEdition: true, shadowless: true },
  },
  variant: { finish: "normal", edition: "unlimited", printing: "shadowed" },
  preferences: { minimumCondition: "any" },
};

describe("PageSelectionReview", () => {
  it("keeps target choice explicit and exposes language switching before confirmation", async () => {
    const user = userEvent.setup();
    const binder = createBinder("Review");
    const onLanguageChange = vi.fn();
    const onConfirm = vi.fn();

    render(
      <PageSelectionReview
        items={[item]}
        binder={binder}
        pageId={binder.pages[0].id}
        language="en"
        loading={false}
        submitting={false}
        onLanguageChange={onLanguageChange}
        onChange={vi.fn()}
        onRemove={vi.fn()}
        onContinueSearch={vi.fn()}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByRole("heading", { name: "1 Karte zum Binder hinzufügen" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Deutsch" }));
    expect(onLanguageChange).toHaveBeenCalledWith("de");
    await user.click(screen.getByRole("button", { name: "Auswahl übernehmen" }));
    expect(onConfirm).toHaveBeenCalledWith("fill-current-page", "Smart-Search-Auswahl");
  });

  it("marks a card as owned and cycles the finish with the star and the dot", async () => {
    const user = userEvent.setup();
    const binder = createBinder("Review");
    const both: PageSelectionItem = {
      ...item,
      card: { ...item.card, availableVariants: { normal: true, holo: true, reverse: false, firstEdition: false, shadowless: false } },
      variant: { finish: "unspecified", edition: "unlimited", printing: "shadowed" },
    };
    let current = [both];
    const onChange = vi.fn((update: (items: PageSelectionItem[]) => PageSelectionItem[]) => { current = update(current); });
    const props = {
      binder, pageId: binder.pages[0].id, language: "en" as const, loading: false, submitting: false,
      onLanguageChange: vi.fn(), onChange, onRemove: vi.fn(), onContinueSearch: vi.fn(), onCancel: vi.fn(), onConfirm: vi.fn(),
    };
    const { rerender } = render(<PageSelectionReview items={current} {...props} />);

    expect(screen.getByRole("button", { name: "Auswahl übernehmen" })).toBeDisabled();
    expect(screen.getByText(/Noch bei einer Karte/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Glanz: Holo oder normal\?/ }));
    expect(current[0].variant.finish).toBe("holo");
    rerender(<PageSelectionReview items={current} {...props} />);
    await user.click(screen.getByRole("button", { name: "Glanz: Holo. Antippen zum Wechseln" }));
    expect(current[0].variant.finish).toBe("normal");
    rerender(<PageSelectionReview items={current} {...props} />);

    expect(screen.getByRole("button", { name: "Auswahl übernehmen" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Habe ich: Bulbasaur" }));
    expect(current[0].owned).toBe(true);
    rerender(<PageSelectionReview items={current} {...props} />);
    expect(screen.getByRole("button", { name: "Habe ich: Bulbasaur" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByLabelText("Mindestzustand beim Kauf")).not.toBeInTheDocument();
  });

  it("sets the wanted condition per card and for all missing cards at once", async () => {
    const user = userEvent.setup();
    const binder = createBinder("Review");
    const second: PageSelectionItem = {
      ...item,
      card: { ...item.card, key: "tcgdex:base1-2:en", ref: { ...item.card.ref, id: "base1-2" }, name: "Ivysaur" },
    };
    let current = [item, second];
    const onChange = vi.fn((update: (items: PageSelectionItem[]) => PageSelectionItem[]) => { current = update(current); });
    const props = {
      binder, pageId: binder.pages[0].id, language: "en" as const, loading: false, submitting: false,
      onLanguageChange: vi.fn(), onChange, onRemove: vi.fn(), onContinueSearch: vi.fn(), onCancel: vi.fn(), onConfirm: vi.fn(),
    };
    const { rerender } = render(<PageSelectionReview items={current} {...props} />);

    await user.selectOptions(screen.getByRole("combobox", { name: "Mindestzustand für Ivysaur" }), "near-mint");
    expect(current.map((entry) => entry.preferences.minimumCondition)).toEqual(["any", "near-mint"]);
    rerender(<PageSelectionReview items={current} {...props} />);
    expect(screen.getByRole("combobox", { name: "Mindestzustand beim Kauf" })).toHaveDisplayValue("Pro Karte verschieden");

    await user.selectOptions(screen.getByRole("combobox", { name: "Mindestzustand beim Kauf" }), "excellent");
    expect(current.map((entry) => entry.preferences.minimumCondition)).toEqual(["excellent", "excellent"]);
    rerender(<PageSelectionReview items={current} {...props} />);

    await user.click(screen.getByRole("button", { name: "Habe ich: Ivysaur" }));
    rerender(<PageSelectionReview items={current} {...props} />);
    expect(screen.queryByRole("combobox", { name: "Mindestzustand für Ivysaur" })).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Mindestzustand für Bulbasaur" })).toBeInTheDocument();
  });
});
