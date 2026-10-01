import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SemanticCardSearch } from "@/components/foundation/SemanticCardSearch";
import { SEMANTIC_TAGS } from "@/domain/semantic-card-search";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("SemanticCardSearch", () => {
  it("labels automatic detection and returns a selected artwork result", async () => {
    const forestMask = 2 ** SEMANTIC_TAGS.indexOf("forest");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      version: 1,
      source: "test",
      generatedAt: "2026-10-01",
      tags: SEMANTIC_TAGS,
      cards: [["base1-1", forestMask, "A Pokémon stands in a forest.", "Alakazam", "1", "base1", "Base Set", "base"]],
    }), { status: 200 })));
    const onPreview = vi.fn();
    const onFallbackToCatalog = vi.fn();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={client}>
        <SemanticCardSearch onPreview={onPreview} onFallbackToCatalog={onFallbackToCatalog} />
      </QueryClientProvider>,
    );

    expect(screen.getByText("Motivmerkmale automatisch erkannt.")).toBeInTheDocument();
    await user.click(screen.getByText("Schlagwörter kombinieren", { selector: "summary" }));
    await user.click(screen.getByRole("button", { name: "Wald" }));
    await waitFor(() => expect(screen.getByText("Alakazam")).toBeInTheDocument());
    expect(screen.getByText(/Automatisch: Wald/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Prüfen" }));
    expect(onPreview).toHaveBeenCalledWith(expect.objectContaining({
      ref: { provider: "tcgdex", id: "base1-1", language: "en" },
      name: "Alakazam",
    }));
  });

  it("offers a direct catalog fallback for timeout and no-result states", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("too slow", "TimeoutError")));
    const onFallbackToCatalog = vi.fn();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={client}>
        <SemanticCardSearch onPreview={vi.fn()} onFallbackToCatalog={onFallbackToCatalog} />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByText(/zu lange/)).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Mit Name/Nummer suchen" }));
    expect(onFallbackToCatalog).toHaveBeenCalledWith("");
  });

  it("keeps multi-selection local until the user reviews the page", async () => {
    const forestMask = 2 ** SEMANTIC_TAGS.indexOf("forest");
    const secondMask = 2 ** SEMANTIC_TAGS.indexOf("city");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      version: 1,
      source: "test",
      generatedAt: "2026-10-01",
      tags: SEMANTIC_TAGS,
      cards: [
        ["base1-1", forestMask, "A Pokémon stands in a forest.", "Bulbasaur", "1", "base1", "Base Set", "base"],
        ["base1-2", secondMask, "A Pokémon stands in a city.", "Ivysaur", "2", "base1", "Base Set", "base"],
      ],
    }), { status: 200 })));
    const onReviewSelection = vi.fn();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={client}>
        <SemanticCardSearch onPreview={vi.fn()} onFallbackToCatalog={vi.fn()} onReviewSelection={onReviewSelection} />
      </QueryClientProvider>,
    );

    await user.type(screen.getByPlaceholderText("Motiv beschreiben, z. B. Pokémon am Strand"), "forest");
    await waitFor(() => expect(screen.getByText("Bulbasaur")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Auswählen" }));
    expect(onReviewSelection).not.toHaveBeenCalled();
    expect(screen.getByText("1 von 9 Karten ausgewählt")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Als Binderseite übernehmen" }));
    expect(onReviewSelection).toHaveBeenCalledWith([expect.objectContaining({
      ref: { provider: "tcgdex", id: "base1-1", language: "en" },
    })]);
  });
});
