import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { TcgplayerHowTo } from "@/components/howto/TcgplayerHowTo";

afterEach(() => cleanup());

describe("TCGplayer how-to page", () => {
  it("lists five steps with working anchors", () => {
    render(<TcgplayerHowTo />);

    const toc = screen.getByRole("navigation", { name: "Schritte dieser Anleitung" });
    const links = within(toc).getAllByRole("link");
    expect(links).toHaveLength(5);
    for (const [index, link] of links.entries()) {
      expect(link).toHaveAttribute("href", `#schritt-${index + 1}`);
      expect(document.getElementById(`schritt-${index + 1}`)).not.toBeNull();
    }
    expect(screen.getByRole("heading", { level: 1, name: /Karten bei TCGplayer kaufen/ })).toBeInTheDocument();
  });

  it("shows three shipped screenshots and never claims an order was placed", () => {
    render(<TcgplayerHowTo />);

    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(3);
    for (const image of images) {
      const path = (image.getAttribute("src") ?? "").replace(/^\//, "");
      expect(existsSync(resolve(process.cwd(), "public", path)), path).toBe(true);
    }
    expect(screen.getByText(/keine Bestellung ausgelöst/)).toBeInTheDocument();
  });
});
