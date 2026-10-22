"use client";

import { Archive } from "lucide-react";
import { useEffect, useState } from "react";

import { BACKUP_RECORDED_EVENT, backupReminderDue, readBackupReminderState, snoozeBackupReminder, type BackupReminderState } from "@/data/backup/backup-reminder";
import type { Binder } from "@/domain/types";

import styles from "./backup-reminder.module.css";

/** A calm reminder that binders only live in this browser. It reads the stored state after mount. */
export function BackupReminder({ binders, onExport }: { binders: readonly Binder[]; onExport: () => void }) {
  const [state, setState] = useState<BackupReminderState>();

  useEffect(() => {
    const refresh = () => setState(readBackupReminderState());
    queueMicrotask(refresh);
    window.addEventListener(BACKUP_RECORDED_EVENT, refresh);
    return () => window.removeEventListener(BACKUP_RECORDED_EVENT, refresh);
  }, []);

  if (!state) return null;
  const { due, daysSince } = backupReminderDue(binders, state);
  if (!due) return null;
  return (
    <aside className={styles.reminder} aria-label="Sicherung empfohlen">
      <Archive aria-hidden="true" size={20} />
      <div>
        <strong>Sichere deine Binder</strong>
        <p>{daysSince === undefined ? "Deine Binder liegen nur in diesem Browser. Du hast noch kein Backup gemacht. Eine Datei reicht, um sie später wiederherzustellen." : `Deine Binder liegen nur in diesem Browser. Das letzte Backup ist ${daysSince} Tage her. Eine Datei reicht, um sie später wiederherzustellen.`}</p>
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={onExport}>Backup exportieren</button>
        <button type="button" onClick={() => snoozeBackupReminder()}>In 7 Tagen erinnern</button>
      </div>
    </aside>
  );
}
