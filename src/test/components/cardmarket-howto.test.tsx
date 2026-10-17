import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CardmarketHowTo } from "@/components/howto/CardmarketHowTo";

afterEach(() => cleanup());

describe("Cardmarket how-to page", () => {
  it("lists seven steps with working anchors", () => {
    render(<CardmarketHowTo />);

    const toc = screen.getByRole("navigation", { name: "Schritte dieser Anleitung" });
    const links = within(toc).getAllByRole("link");
    expect(links).toHaveLength(7);
    for (const [index, link] of links.entries()) {
      expect(link).toHaveAttribute("href", `#schritt-${index + 1}`);
      expect(document.getElementById(`schritt-${index + 1}`)).not.toBeNull();
    }
    expect(screen.getByRole("heading", { level: 1, name: /Karten bei Cardmarket kaufen/ })).toBeInTheDocument();
  });

  it("explains the condition mass change with the German button names and the code table", () => {
    render(<CardmarketHowTo />);

    const step = document.getElementById("schritt-5") as HTMLElement;
    expect(within(step).getByText("„≥ PO“")).toBeInTheDocument();
    for (const label of ["Massenveränderung", "„Mindest-Zustand“", "„Ausgewählte ändern“", "„Ausgewählte löschen“"]) {
      expect(within(step).getAllByText(new RegExp(label.replace(/[„“]/g, ""))).length).toBeGreaterThan(0);
    }
    const table = within(step).getByRole("table", { name: "Welchen Wert du bei Cardmarket einstellst" });
    const rows = within(table).getAllByRole("row").slice(1).map((row) => row.textContent);
    expect(rows).toEqual([
      "Wie neu≥ NM · Near Mint",
      "Sehr gut (empfohlen)≥ EX · Excellent",
      "Gebraucht≥ LP · Light Played",
      "Deutlich gebraucht≥ PL · Played",
      "Beliebig≥ PO · Poor",
    ]);
  });

  it("states what Cardmarket documents about the wizard", () => {
    render(<CardmarketHowTo />);

    const step = document.getElementById("schritt-6") as HTMLElement;
    expect(within(step).getByText("„Reduce Shipments“")).toBeInTheDocument();
    expect(within(step).getByText("„Reduce Price“")).toBeInTheDocument();
    expect(within(step).getByText(/sechs abgeschlossenen Käufen/)).toBeInTheDocument();
    expect(within(step).getByText(/zehnmal pro Tag/)).toBeInTheDocument();
    expect(within(step).getByText(/nicht alle Angebote/)).toBeInTheDocument();
  });

  it("opens every external link safely, hides the drawings from assistive technology and describes them in words", () => {
    render(<CardmarketHowTo />);

    for (const link of screen.getAllByRole("link").filter((entry) => /^https?:/.test(entry.getAttribute("href") ?? ""))) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
    const figures = document.querySelectorAll("figure");
    expect(figures.length).toBeGreaterThanOrEqual(5);
    for (const figure of figures) {
      expect(figure.querySelector("figcaption")?.textContent?.length).toBeGreaterThan(30);
      for (const drawing of figure.querySelectorAll("[aria-hidden='true']")) expect(drawing.textContent?.length).toBeGreaterThan(0);
    }
    expect(screen.getByText(/selbst gezeichnete Ansichten/)).toBeInTheDocument();
  });
});
