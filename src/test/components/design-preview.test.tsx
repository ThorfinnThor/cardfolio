import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DesignPreviewCanvas } from "@/components/design-preview/DesignPreviewCanvas";
import { DEMO_PAGES, DEMO_STATS } from "@/components/design-preview/demo-data";

describe("design preview fixture", () => {
  afterEach(() => cleanup());

  it("keeps the shared 18-slot demo counts stable", () => {
    const slots = DEMO_PAGES.flatMap((page) => page.slots);

    expect(slots).toHaveLength(DEMO_STATS.slots);
    expect(slots.filter((slot) => slot.status === "owned")).toHaveLength(DEMO_STATS.owned);
    expect(slots.filter((slot) => slot.status === "missing")).toHaveLength(DEMO_STATS.missing);
    expect(slots.filter((slot) => slot.status === "empty")).toHaveLength(DEMO_STATS.empty);
  });

  it("renders the clean binder shell and exposes the selected-card state", () => {
    render(<DesignPreviewCanvas variant="design-2" />);

    expect(screen.getByRole("heading", { name: "Base Set Binder" })).toBeInTheDocument();
    expect(screen.getByText("Design 2 · Clean Binder")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Bulbasaur/ }));

    expect(screen.getByRole("heading", { name: "Bulbasaur" })).toBeInTheDocument();
    expect(screen.getByText("Diese Karte ist im aktiven Binder ausgewählt.")).toBeInTheDocument();
  });

  it("renders the collector composition with the missing-card action", () => {
    render(<DesignPreviewCanvas variant="design-3" />);

    expect(screen.getByRole("heading", { name: "Base Set" })).toBeInTheDocument();
    expect(screen.getAllByText("Collector Workspace").length).toBeGreaterThanOrEqual(1);

    fireEvent.click(screen.getByRole("button", { name: "Fehlende Karten" }));

    expect(screen.getByText("4 Karten fehlen")).toBeInTheDocument();
  });
});
