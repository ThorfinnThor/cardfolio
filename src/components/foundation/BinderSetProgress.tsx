"use client";

import { useMemo } from "react";

import { deriveSetProgress } from "@/domain/set-progress";
import type { Binder, CardSnapshot } from "@/domain/types";

import styles from "./binder-set-progress.module.css";

/** Progress per set inside the open binder: owned of planned, and how much of the printed set is planned. */
export function BinderSetProgress({ binder, cards }: { binder: Binder; cards: ReadonlyMap<string, CardSnapshot> }) {
  const rows = useMemo(() => deriveSetProgress(binder, cards), [binder, cards]);
  if (rows.length === 0) return null;
  return (
    <details className={styles.panel}>
      <summary>Fortschritt nach Set ({rows.length})</summary>
      <ul className={styles.list} aria-label="Fortschritt nach Set">
        {rows.map((row) => (
          <li key={row.key}>
            <span className={styles.name}><strong>{row.setName}</strong><small>{row.language === "de" ? "Deutsch" : "Englisch"}</small></span>
            <span className={styles.bar} role="img" aria-label={`${row.completionPercent} Prozent vorhanden`}><span style={{ width: `${row.completionPercent}%` }} /></span>
            <span className={styles.numbers}>
              {row.owned} von {row.planned} vorhanden
              {row.totalInSet ? <small>{row.distinctPlanned} von {row.totalInSet} Karten des Sets geplant</small> : null}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}
