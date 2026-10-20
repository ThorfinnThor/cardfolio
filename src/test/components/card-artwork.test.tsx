import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CardArtwork } from "@/components/foundation/CardArtwork";
import { cardtraderCatalog } from "@/data/cardtrader/catalog";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const card = {
  ref: { provider: "tcgdex" as const, id: "base3-31", language: "en" as const },
  name: "Arbok",
  setName: "Fossil",
  collectorNumber: "31",
  imageBaseUrl: "https://assets.tcgdex.net/en/base/base3/31",
  imageFallbackBaseUrl: "https://assets.tcgdex.net/fr/base/base3/31",
};

describe("CardArtwork", () => {
  it("tries every image fallback before reporting the artwork unavailable", async () => {
    const onUnavailable = vi.fn();
    render(<CardArtwork card={card} className="art" fallback={<span>Kein Bild</span>} onUnavailable={onUnavailable} />);

    fireEvent.error(screen.getByRole("img"));
    expect(screen.getByRole("img")).toHaveAttribute("src", expect.stringContaining("/fr/base/base3/31/high.webp"));
    fireEvent.error(screen.getByRole("img"));

    expect(await screen.findByText("Kein Bild")).toBeInTheDocument();
    await waitFor(() => expect(onUnavailable).toHaveBeenCalledTimes(1));
  });

  it("only unlocks review controls after the image has loaded", () => {
    const onAvailable = vi.fn();
    render(<CardArtwork card={card} className="art" fallback={<span>Kein Bild</span>} onAvailable={onAvailable} />);

    fireEvent.load(screen.getByRole("img"));

    expect(onAvailable).toHaveBeenCalledTimes(1);
  });

  describe("CardTrader fallback", () => {
    const withSet = { ...card, setId: "base3" };
    const match = (img?: string) => ({ expansionId: 1, blueprint: { id: 7, n: "031", name: "Arbok", ...(img ? { img } : {}) } });

    it("shows the CardTrader image, labelled, once TCGdex has none that works", async () => {
      const lookup = vi.spyOn(cardtraderCatalog, "blueprint").mockResolvedValue(match("7/preview_arbok.jpg"));
      const onUnavailable = vi.fn();
      render(<CardArtwork card={withSet} className="art" fallback={<span>Kein Bild</span>} onUnavailable={onUnavailable} />);

      fireEvent.error(screen.getByRole("img"));
      fireEvent.error(screen.getByRole("img"));

      const image = await screen.findByRole("img");
      await waitFor(() => expect(image).toHaveAttribute("src", "https://cardtrader.com/uploads/blueprints/image/7/preview_arbok.jpg"));
      expect(screen.getByText("Bild: CardTrader")).toBeInTheDocument();
      expect(lookup).toHaveBeenCalledWith("en", "base3", "31", "Arbok");
      expect(onUnavailable).not.toHaveBeenCalled();
    });

    it("does not look anything up while TCGdex still delivers an image", () => {
      const lookup = vi.spyOn(cardtraderCatalog, "blueprint").mockResolvedValue(match("7/preview_arbok.jpg"));
      render(<CardArtwork card={withSet} className="art" fallback={<span>Kein Bild</span>} />);
      fireEvent.load(screen.getByRole("img"));
      expect(lookup).not.toHaveBeenCalled();
    });

    it("reports the artwork unavailable only when CardTrader has nothing either", async () => {
      vi.spyOn(cardtraderCatalog, "blueprint").mockResolvedValue(undefined);
      const onUnavailable = vi.fn();
      render(<CardArtwork card={{ ...withSet, imageBaseUrl: undefined, imageFallbackBaseUrl: undefined }} className="art" fallback={<span>Kein Bild</span>} onUnavailable={onUnavailable} />);

      expect(await screen.findByText("Kein Bild")).toBeInTheDocument();
      await waitFor(() => expect(onUnavailable).toHaveBeenCalledTimes(1));
    });

    it("falls back to the placeholder when the CardTrader image itself fails", async () => {
      vi.spyOn(cardtraderCatalog, "blueprint").mockResolvedValue(match("7/preview_arbok.jpg"));
      const onUnavailable = vi.fn();
      render(<CardArtwork card={{ ...withSet, imageBaseUrl: undefined, imageFallbackBaseUrl: undefined }} className="art" fallback={<span>Kein Bild</span>} onUnavailable={onUnavailable} />);

      fireEvent.error(await screen.findByRole("img"));

      expect(await screen.findByText("Kein Bild")).toBeInTheDocument();
      await waitFor(() => expect(onUnavailable).toHaveBeenCalledTimes(1));
    });

    it("does not look up cards without a set id", async () => {
      const lookup = vi.spyOn(cardtraderCatalog, "blueprint").mockResolvedValue(match("7/preview_arbok.jpg"));
      render(<CardArtwork card={{ ...card, imageBaseUrl: undefined, imageFallbackBaseUrl: undefined }} className="art" fallback={<span>Kein Bild</span>} />);
      expect(await screen.findByText("Kein Bild")).toBeInTheDocument();
      expect(lookup).not.toHaveBeenCalled();
    });
  });
});
