import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CardArtwork } from "@/components/foundation/CardArtwork";

afterEach(() => cleanup());

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
});
