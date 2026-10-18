import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CardmarketHowTo } from "@/components/howto/CardmarketHowTo";

afterEach(() => cleanup());

describe("Cardmarket how-to page", () => {
  it("lists eight steps with working anchors", () => {
    render(<CardmarketHowTo />);

    const toc = screen.getByRole("navigation", { name: "Schritte dieser Anleitung" });
    const links = within(toc).getAllByRole("link");
    expect(links).toHaveLength(8);
    for (const [index, link] of links.entries()) {
      expect(link).toHaveAttribute("href", `#schritt-${index + 1}`);
      expect(document.getElementById(`schritt-${index + 1}`)).not.toBeNull();
    }
    expect(screen.getByRole("heading", { level: 1, name: /Karten bei Cardmarket kaufen/ })).toBeInTheDocument();
  });

  it("explains the condition mass change with the German button names and the code table", () => {
    render(<CardmarketHowTo />);

    const step = document.getElementById("schritt-5") as HTMLElement;
    expect(within(step).getAllByText(/≥ PO/).length).toBeGreaterThan(0);
    for (const label of ["Massenveränderung", "„Mindest-Zustand“", "„Ausgewählte ändern“", "„Ausgewählte löschen“"]) {
      expect(within(step).getAllByText(new RegExp(label.replace(/[„“]/g, ""))).length).toBeGreaterThan(0);
    }
    expect(within(step).getByText(/Kompromiss/)).toBeInTheDocument();
    const grades = within(step).getByRole("table", { name: "Die Zustände bei Cardmarket" });
    expect(within(grades).getAllByRole("row")).toHaveLength(8);
    expect(within(grades).getByText(/EX · Excellent \(empfohlen\)/)).toBeInTheDocument();
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

  it("explains the language setting and the wizard with the German button names", () => {
    render(<CardmarketHowTo />);

    const language = document.getElementById("schritt-6") as HTMLElement;
    expect(within(language).getByText("„Sprachen“")).toBeInTheDocument();
    const step = document.getElementById("schritt-7") as HTMLElement;
    expect(within(step).getByText("„Preis reduzieren“")).toBeInTheDocument();
    expect(within(step).getByText("„Bestellungen reduzieren“")).toBeInTheDocument();
    expect(within(step).getByText("„Wizard ausführen“")).toBeInTheDocument();
    expect(within(step).getByText("Europa", { selector: "b" })).toBeInTheDocument();
    expect(within(step).getByText(/zehnmal pro Tag/)).toBeInTheDocument();
    expect(within(step).getByText(/nicht alle Angebote/)).toBeInTheDocument();
  });

  it("opens every external link safely and describes every screenshot in words", () => {
    render(<CardmarketHowTo />);

    for (const link of screen.getAllByRole("link").filter((entry) => /^https?:/.test(entry.getAttribute("href") ?? ""))) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
    const figures = document.querySelectorAll("figure");
    expect(figures.length).toBeGreaterThanOrEqual(12);
    for (const figure of figures) {
      expect(figure.querySelector("figcaption")?.textContent?.length).toBeGreaterThan(30);
      const image = figure.querySelector("img");
      expect(image?.getAttribute("alt")?.length).toBeGreaterThan(30);
      expect(image?.getAttribute("src")).toMatch(/^\/howto\/cardmarket\/[a-z-]+\.webp$/);
    }
    expect(screen.getByText(/Screenshots der Cardmarket-Seite/)).toBeInTheDocument();
  });
});
