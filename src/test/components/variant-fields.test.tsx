import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { VariantFields } from "@/components/foundation/VariantFields";

afterEach(() => cleanup());

describe("VariantFields", () => {
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

    const finish = screen.getByRole("combobox", { name: "Finish" });
    expect(within(finish).getByRole("option", { name: "Holo" })).toBeInTheDocument();
    expect(within(finish).queryByRole("option", { name: "Non-Holo / Normal" })).not.toBeInTheDocument();
    expect(within(finish).queryByRole("option", { name: "Reverse Holo" })).not.toBeInTheDocument();
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
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
