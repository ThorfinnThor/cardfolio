import type { Binder } from "@/domain/types";

/** Browser storage key; keeps the product's original prefix like the other keys. */
export const BACKUP_REMINDER_KEY = "cardfolio-backup-reminder";
export const BACKUP_RECORDED_EVENT = "ycb:backup-recorded";

const DAY_MS = 24 * 60 * 60 * 1_000;
/** A first backup is suggested once the oldest binder is this old. */
const FIRST_REMINDER_AFTER_DAYS = 3;
/** After a backup, changes older than this make the next reminder due. */
const REPEAT_REMINDER_AFTER_DAYS = 30;
const SNOOZE_DAYS = 7;

export interface BackupReminderState {
  v: 1;
  lastBackupAt?: string;
  snoozedUntil?: string;
}

function validTime(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

export function readBackupReminderState(): BackupReminderState {
  try {
    const raw = window.localStorage.getItem(BACKUP_REMINDER_KEY);
    if (!raw) return { v: 1 };
    const parsed = JSON.parse(raw) as Partial<BackupReminderState>;
    if (parsed.v !== 1) return { v: 1 };
    return {
      v: 1,
      ...(validTime(parsed.lastBackupAt) ? { lastBackupAt: parsed.lastBackupAt } : {}),
      ...(validTime(parsed.snoozedUntil) ? { snoozedUntil: parsed.snoozedUntil } : {}),
    };
  } catch {
    return { v: 1 };
  }
}

function write(state: BackupReminderState): void {
  try {
    window.localStorage.setItem(BACKUP_REMINDER_KEY, JSON.stringify(state));
  } catch {
    /* Without storage the reminder simply comes back next time. */
  }
  window.dispatchEvent(new CustomEvent(BACKUP_RECORDED_EVENT));
}

/** Remembers the time of a successful export; only the time is stored, never any binder content. */
export function recordBackup(now: number = Date.now()): void {
  write({ v: 1, lastBackupAt: new Date(now).toISOString() });
}

export function snoozeBackupReminder(now: number = Date.now()): void {
  write({ ...readBackupReminderState(), snoozedUntil: new Date(now + SNOOZE_DAYS * DAY_MS).toISOString() });
}

/**
 * Whether to gently remind the visitor to save a backup: the data only lives in this browser. Nothing is due when
 * there is nothing planned, when it was snoozed, or when nothing changed since the last backup.
 */
export function backupReminderDue(binders: readonly Binder[], state: BackupReminderState, now: number = Date.now()): { due: boolean; daysSince?: number } {
  const planned = binders.some((binder) => binder.pages.some((page) => page.slots.some((slot) => slot !== null)));
  if (!planned) return { due: false };
  if (state.snoozedUntil && Date.parse(state.snoozedUntil) > now) return { due: false };
  if (!state.lastBackupAt) {
    const oldest = Math.min(...binders.map((binder) => Date.parse(binder.createdAt)).filter(Number.isFinite));
    return { due: Number.isFinite(oldest) && now - oldest >= FIRST_REMINDER_AFTER_DAYS * DAY_MS };
  }
  const last = Date.parse(state.lastBackupAt);
  const changedSince = binders.some((binder) => Date.parse(binder.updatedAt) > last);
  const daysSince = Math.floor((now - last) / DAY_MS);
  return { due: changedSince && daysSince >= REPEAT_REMINDER_AFTER_DAYS, daysSince };
}
