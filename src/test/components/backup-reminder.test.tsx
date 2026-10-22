import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BackupReminder } from "@/components/foundation/BackupReminder";
import { readBackupReminderState, recordBackup } from "@/data/backup/backup-reminder";
import type { Binder, PlannedCard } from "@/domain/types";

const old = new Date(Date.now() - 10 * 24 * 60 * 60 * 1_000).toISOString();
const entry: PlannedCard = { id: crypto.randomUUID(), cardKey: "k", variant: { finish: "normal", edition: "unlimited", printing: "shadowed" }, preferences: { minimumCondition: "excellent" }, owned: false, addedAt: old };
const binders: Binder[] = [{ id: crypto.randomUUID(), schemaVersion: 1, revision: 1, name: "B", description: "", layout: { rows: 3, columns: 3 }, pages: [{ id: crypto.randomUUID(), slots: [entry], note: "" }], createdAt: old, updatedAt: old }];

beforeEach(() => window.localStorage.clear());
afterEach(() => cleanup());

describe("BackupReminder", () => {
  it("reminds, exports on request and disappears after a backup was recorded", async () => {
    const onExport = vi.fn();
    render(<BackupReminder binders={binders} onExport={onExport} />);
    expect(await screen.findByText("Sichere deine Binder")).toBeInTheDocument();
    expect(screen.getByText(/noch kein Backup gemacht/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Backup exportieren" }));
    expect(onExport).toHaveBeenCalledOnce();
    act(() => recordBackup());
    expect(screen.queryByText("Sichere deine Binder")).not.toBeInTheDocument();
  });

  it("can be snoozed for a week", async () => {
    render(<BackupReminder binders={binders} onExport={vi.fn()} />);
    fireEvent.click(await screen.findByRole("button", { name: "In 7 Tagen erinnern" }));
    expect(screen.queryByText("Sichere deine Binder")).not.toBeInTheDocument();
    expect(readBackupReminderState().snoozedUntil).toBeDefined();
  });

  it("stays quiet for a new collection", async () => {
    const fresh = [{ ...binders[0]!, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }];
    const { container } = render(<BackupReminder binders={fresh} onExport={vi.fn()} />);
    await act(async () => { await Promise.resolve(); });
    expect(container).toBeEmptyDOMElement();
  });
});
