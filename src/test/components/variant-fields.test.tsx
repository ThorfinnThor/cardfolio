import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { VariantFields } from "@/components/foundation/VariantFields";

afterEach(() => cleanup());

describe("VariantFields", () => {
  it("can explain condition choices in plain language for beginners", () => {
    render(
      <VariantFields
        variant={{ finish: "normal", edition: "unlimited", printing: "shadowed" }}
        preferences={{ minimumCondition: "excellent" }}
        availability={{ normal: true, holo: false, reverse: false, firstEdition: false, shadowless: false }}
        explainCondition
        onVariantChange={vi.fn()}
        onPreferencesChange={vi.fn()}
      />,
    );

    expect(screen.getByText(/Unsere Empfehlung für Geschenke/)).toBeInTheDocument();
    expect(screen.getByText("Was bedeutet der Kartenzustand?")).toBeInTheDocument();
  });

  it("hides finishes, editions and printings that the catalog does not confirm", () => {
    render(
      <VariantFields
        variant={{ finish: "unspecified", edition: "unspecified", printing: "shadowed" }}
        preferences={{ minimumCondition: "any" }}
        availability={{ normal: false, holo: true, reverse: false, firstEdition: false, shadowless: false }}
        onVariantChange={vi.fn()}
        onPreferencesChange={vi.fn()}
      />,
    );

    const finish = screen.getByRole("combobox", { name: "Ausführung der Karte" });
    expect(within(finish).getByRole("option", { name: "Holo – Bildbereich glänzt" })).toBeInTheDocument();
    expect(within(finish).queryByRole("option", { name: "Normal – nicht glänzend" })).not.toBeInTheDocument();
    expect(within(finish).queryByRole("option", { name: "Reverse Holo – übrige Karte glänzt" })).not.toBeInTheDocument();
    expect(within(screen.getByRole("combobox", { name: "Edition" })).queryByRole("option", { name: "First Edition" })).not.toBeInTheDocument();
    expect(within(screen.getByRole("combobox", { name: "Druckvariante" })).queryByRole("option", { name: "Shadowless" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("vollständig festgelegt");
  });

  it("offers First Edition and Shadowless for a confirmed English Base Set variant", () => {
    render(
      <VariantFields
        variant={{ finish: "normal", edition: "unlimited", printing: "shadowed" }}
        preferences={{ minimumCondition: "near-mint" }}
        availability={{ normal: true, holo: false, reverse: false, firstEdition: true, shadowless: true }}
        onVariantChange={vi.fn()}
        onPreferencesChange={vi.fn()}
      />,
    );

    expect(within(screen.getByRole("combobox", { name: "Edition" })).getByRole("option", { name: "First Edition" })).toBeInTheDocument();
    expect(within(screen.getByRole("combobox", { name: "Druckvariante" })).getByRole("option", { name: "Shadowless" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Für die Bestellung vorbereitet");
  });

  it("keeps unknown finishes manual while hiding impossible modern printings", () => {
    render(
      <VariantFields
        variant={{ finish: "unspecified", edition: "unlimited", printing: "shadowed" }}
        preferences={{ minimumCondition: "any" }}
        availability={{
          normal: true,
          holo: true,
          reverse: true,
          firstEdition: false,
          shadowless: false,
          finishesVerified: false,
        }}
        onVariantChange={vi.fn()}
        onPreferencesChange={vi.fn()}
      />,
    );

    expect(within(screen.getByRole("combobox", { name: "Ausführung der Karte" })).getByRole("option", { name: "Holo – Bildbereich glänzt" })).toBeInTheDocument();
    expect(within(screen.getByRole("combobox", { name: "Edition" })).queryByRole("option", { name: "First Edition" })).not.toBeInTheDocument();
    expect(within(screen.getByRole("combobox", { name: "Druckvariante" })).queryByRole("option", { name: "Shadowless" })).not.toBeInTheDocument();
    expect(screen.getByText(/Finish bleibt manuell/)).toBeInTheDocument();
  });

  it("automatically switches an English Base Set card to Shadowless for First Edition", async () => {
    const onVariantChange = vi.fn();
    render(
      <VariantFields
        variant={{ finish: "normal", edition: "unlimited", printing: "shadowed" }}
        preferences={{ minimumCondition: "any" }}
        availability={{
          normal: true,
          holo: false,
          reverse: false,
          firstEdition: true,
          shadowless: true,
          finishesVerified: true,
          printingPolicy: "english-base-set",
        }}
        onVariantChange={onVariantChange}
        onPreferencesChange={vi.fn()}
      />,
    );

    await userEvent.setup().selectOptions(screen.getByRole("combobox", { name: "Edition" }), "first-edition");

    expect(onVariantChange).toHaveBeenCalledWith({
      finish: "normal",
      edition: "first-edition",
      printing: "shadowless",
    });
  });

  it("switches Base Set Machamp between its commercial Holo and Trainer Deck A Non-Holo forms", async () => {
    const onVariantChange = vi.fn();
    render(
      <VariantFields
        variant={{ finish: "holo", edition: "first-edition", printing: "shadowless" }}
        preferences={{ minimumCondition: "any" }}
        availability={{
          normal: true,
          holo: true,
          reverse: false,
          firstEdition: true,
          shadowless: true,
          finishesVerified: true,
          printingPolicy: "english-base-set-machamp",
        }}
        onVariantChange={onVariantChange}
        onPreferencesChange={vi.fn()}
      />,
    );

    await userEvent.setup().selectOptions(screen.getByRole("combobox", { name: "Edition" }), "unlimited");

    expect(onVariantChange).toHaveBeenCalledWith({
      finish: "normal",
      edition: "unlimited",
      printing: "shadowed",
    });
  });

  it("identifies Excellent as Cardmarket-specific and gives the TCGplayer equivalent", () => {
    render(
      <VariantFields
        variant={{ finish: "normal", edition: "unlimited", printing: "shadowed" }}
        preferences={{ minimumCondition: "excellent" }}
        onVariantChange={vi.fn()}
        onPreferencesChange={vi.fn()}
      />,
    );

    expect(within(screen.getByRole("combobox", { name: "Mindestzustand beim Kauf" })).getByRole("option", {
      name: "Sehr gut – kleine Spuren okay (empfohlen)",
    })).toBeInTheDocument();
    expect(screen.getByText(/Cardmarket: Near Mint oder Excellent/)).toBeInTheDocument();
  });
});
