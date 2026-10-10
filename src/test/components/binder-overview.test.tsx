import { fireEvent, render, screen, cleanup } from "@testing-library/react";
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
  it("explains the local empty state and exposes the create action", () => {
    render(<BinderOverview {...props()} />);

    expect(screen.getByRole("heading", { name: "Noch kein Binder" })).toBeInTheDocument();
    expect(screen.getByText("Lege deinen ersten lokalen Binder an. Deine Daten werden nur in diesem Browser gespeichert.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ersten Binder erstellen" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "So entsteht dein Binder" }).children).toHaveLength(4);
  });

  it("offers clear beginner starts for gifts and complete sets", () => {
    const onGiftStart = vi.fn();
    const onSetStart = vi.fn();
    render(<BinderOverview {...props({ onGiftStart, onSetStart })} />);

    fireEvent.click(screen.getByRole("button", { name: "Geschenk erstellen" }));
    fireEvent.click(screen.getByRole("button", { name: "Mit einem Set starten" }));

    expect(onGiftStart).toHaveBeenCalledOnce();
    expect(onSetStart).toHaveBeenCalledOnce();
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
