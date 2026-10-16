import { fireEvent, render, screen, cleanup, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";

import { BinderOverview } from "@/components/foundation/BinderOverview";
import { createBinder } from "@/domain/binder-actions";

afterEach(() => cleanup());

function props(overrides: Partial<ComponentProps<typeof BinderOverview>> = {}) {
  return {
    binders: [],
    name: "",
    storageStatus: "ready",
    onNameChange: vi.fn(),
    onCreate: vi.fn((event) => event.preventDefault()),
    onSelect: vi.fn(),
    onDuplicate: vi.fn(),
    onMove: vi.fn(),
    onRequestDelete: vi.fn(),
    onExport: vi.fn(),
    onImport: vi.fn(),
    ...overrides,
  };
}

describe("BinderOverview", () => {
  it("starts with the gift action and shows the short creation path", () => {
    render(<BinderOverview {...props()} />);

    expect(screen.getByRole("heading", { name: /Pokémon-Binder als persönliches Geschenk/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Geschenk-Binder gestalten" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "So entsteht dein Geschenk-Binder" }).children).toHaveLength(3);
    expect(screen.getByRole("heading", { name: "So kann eine fertige Binder-Seite aussehen." })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mit Glurak starten" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mit Pikachu starten" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mit Evoli starten" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Passende Karten gezielt und transparent vergleichen/ })).toBeInTheDocument();
    expect(screen.queryByText("Gesamtsammlung")).not.toBeInTheDocument();
  });

  it("keeps collector start modes behind a small link for first-time visitors", () => {
    render(<BinderOverview {...props()} />);

    expect(screen.queryByRole("tablist", { name: "Binder erstellen" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ich sammle selbst" }));

    const tabs = within(screen.getByRole("tablist", { name: "Binder erstellen" })).getAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent?.replace(/Empfohlen/, "").trim())).toEqual(["Als Geschenk", "Nach Bildmotiv", "Komplettes Set", "Selbst gestalten"]);
    expect(screen.queryByRole("button", { name: "Ich sammle selbst" })).not.toBeInTheDocument();
  });

  it("shows every start mode right away to people who already have binders", () => {
    render(<BinderOverview {...props({ binders: [createBinder("Base Set")] })} />);

    expect(screen.getByRole("tablist", { name: "Binder erstellen" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ich sammle selbst" })).not.toBeInTheDocument();
  });

  it("offers only the gift start in the lean gift entry", () => {
    render(<BinderOverview {...props({ binders: [createBinder("Base Set")], giftOnly: true })} />);

    expect(screen.getByRole("button", { name: "Geschenk-Binder gestalten" })).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ich sammle selbst" })).not.toBeInTheDocument();
    expect(screen.queryByText("Hier kannst du weitergestalten")).not.toBeInTheDocument();
    expect(screen.queryByText("Vorhandenen Binder aus Backup laden")).not.toBeInTheDocument();
  });

  it("starts a gift with the Pokémon from a visual example", () => {
    const onGiftExampleStart = vi.fn();
    render(<BinderOverview {...props({ onGiftExampleStart })} />);

    fireEvent.click(screen.getByRole("button", { name: "Mit Evoli starten" }));

    expect(onGiftExampleStart).toHaveBeenCalledWith("Evoli");
  });

  it("offers clear beginner starts for gifts and complete sets", () => {
    const onGiftStart = vi.fn();
    const onThemeStart = vi.fn();
    const onSetStart = vi.fn();
    render(<BinderOverview {...props({ onGiftStart, onThemeStart, onSetStart })} />);

    fireEvent.click(screen.getByRole("button", { name: "Geschenk-Binder gestalten" }));
    fireEvent.click(screen.getByRole("button", { name: "Ich sammle selbst" }));
    fireEvent.click(screen.getByRole("tab", { name: "Nach Bildmotiv" }));
    fireEvent.click(screen.getByRole("button", { name: "Bildmotiv auswählen" }));
    fireEvent.click(screen.getByRole("tab", { name: "Komplettes Set" }));
    fireEvent.click(screen.getByRole("button", { name: "Mit einem Set starten" }));

    expect(onGiftStart).toHaveBeenCalledOnce();
    expect(onThemeStart).toHaveBeenCalledOnce();
    expect(onSetStart).toHaveBeenCalledOnce();
  });

  it("keeps manual planning as a separate start tab", () => {
    render(<BinderOverview {...props()} />);

    fireEvent.click(screen.getByRole("button", { name: "Ich sammle selbst" }));
    fireEvent.click(screen.getByRole("tab", { name: "Selbst gestalten" }));
    expect(screen.getByRole("heading", { name: "Binder selbst gestalten." })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Wie soll dein Binder heißen?" })).toBeInTheDocument();
  });

  it("offers persistent binder ordering and duplication controls", () => {
    const first = createBinder("Base Set");
    const second = createBinder("Neo Genesis");
    const onDuplicate = vi.fn();
    const onMove = vi.fn();
    render(<BinderOverview {...props({ binders: [first, second], onDuplicate, onMove })} />);

    expect(screen.getByRole("button", { name: "Base Set nach vorne verschieben" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Base Set nach hinten verschieben" }));
    fireEvent.click(screen.getByRole("button", { name: "Neo Genesis duplizieren" }));

    expect(onMove).toHaveBeenCalledWith(first.id, "backward");
    expect(onDuplicate).toHaveBeenCalledWith(second);
  });

  it("shows binder progress and sends delete requests to the parent", () => {
    const binder = createBinder("Base Set");
    const onRequestDelete = vi.fn();
    render(<BinderOverview {...props({ binders: [binder], activeId: binder.id, onRequestDelete })} />);

    expect(screen.getByRole("button", { name: "Base Set löschen" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Base Set löschen" }));

    expect(onRequestDelete).toHaveBeenCalledWith(binder);
  });
});
