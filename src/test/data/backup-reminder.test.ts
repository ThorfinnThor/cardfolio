import { beforeEach, describe, expect, it } from "vitest";

import { BACKUP_REMINDER_KEY, backupReminderDue, readBackupReminderState, recordBackup, snoozeBackupReminder } from "@/data/backup/backup-reminder";
import type { Binder, PlannedCard } from "@/domain/types";

const DAY = 24 * 60 * 60 * 1_000;
const NOW = Date.parse("2026-10-22T12:00:00.000Z");
const iso = (daysAgo: number) => new Date(NOW - daysAgo * DAY).toISOString();
const entry: PlannedCard = { id: crypto.randomUUID(), cardKey: "k", variant: { finish: "normal", edition: "unlimited", printing: "shadowed" }, preferences: { minimumCondition: "excellent" }, owned: false, addedAt: iso(0) };
const binder = (createdDaysAgo: number, updatedDaysAgo: number, planned = true): Binder => ({ id: crypto.randomUUID(), schemaVersion: 1, revision: 1, name: "B", description: "", layout: { rows: 3, columns: 3 }, pages: [{ id: crypto.randomUUID(), slots: [planned ? entry : null, null], note: "" }], createdAt: iso(createdDaysAgo), updatedAt: iso(updatedDaysAgo) });

beforeEach(() => window.localStorage.clear());

describe("backup reminder", () => {
  it("is not due for an empty collection, a very new binder, or a snoozed reminder", () => {
    expect(backupReminderDue([binder(10, 1, false)], { v: 1 }, NOW).due).toBe(false);
    expect(backupReminderDue([binder(1, 0)], { v: 1 }, NOW).due).toBe(false);
    expect(backupReminderDue([binder(10, 1)], { v: 1, snoozedUntil: iso(-3) }, NOW).due).toBe(false);
    expect(backupReminderDue([], { v: 1 }, NOW).due).toBe(false);
  });

  it("asks for a first backup once the oldest binder is a few days old", () => {
    expect(backupReminderDue([binder(5, 1)], { v: 1 }, NOW)).toEqual({ due: true });
    expect(backupReminderDue([binder(1, 0), binder(9, 2)], { v: 1 }, NOW).due).toBe(true);
  });

  it("repeats only when something changed since a backup that is a month old", () => {
    expect(backupReminderDue([binder(60, 5)], { v: 1, lastBackupAt: iso(40) }, NOW)).toEqual({ due: true, daysSince: 40 });
    expect(backupReminderDue([binder(60, 50)], { v: 1, lastBackupAt: iso(40) }, NOW).due).toBe(false);
    expect(backupReminderDue([binder(60, 5)], { v: 1, lastBackupAt: iso(10) }, NOW).due).toBe(false);
  });

  it("stores only times: a backup clears the snooze, a snooze keeps the last backup", () => {
    recordBackup(NOW);
    expect(readBackupReminderState()).toEqual({ v: 1, lastBackupAt: iso(0) });
    snoozeBackupReminder(NOW);
    expect(readBackupReminderState()).toEqual({ v: 1, lastBackupAt: iso(0), snoozedUntil: iso(-7) });
    recordBackup(NOW + DAY);
    expect(readBackupReminderState().snoozedUntil).toBeUndefined();
    expect(window.localStorage.getItem(BACKUP_REMINDER_KEY)).not.toMatch(/binder|card|name/i);
  });

  it("falls back to an empty state for damaged storage", () => {
    window.localStorage.setItem(BACKUP_REMINDER_KEY, "not json");
    expect(readBackupReminderState()).toEqual({ v: 1 });
    window.localStorage.setItem(BACKUP_REMINDER_KEY, JSON.stringify({ v: 1, lastBackupAt: "yesterday", snoozedUntil: 5 }));
    expect(readBackupReminderState()).toEqual({ v: 1 });
  });
});
