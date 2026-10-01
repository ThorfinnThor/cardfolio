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
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByRole("heading", { name: "1 Karten als Auswahl übernehmen" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Deutsch" }));
    expect(onLanguageChange).toHaveBeenCalledWith("de");
    await user.click(screen.getByRole("button", { name: "Auswahl übernehmen" }));
    expect(onConfirm).toHaveBeenCalledWith("fill-current-page", "Smart-Search-Auswahl");
  });
});
