"use client";

import { Archive, ArrowLeft, ArrowRight, Copy, Plus, Trash2 } from "lucide-react";
import type { ChangeEvent, FormEvent } from "react";

import { deriveBinderStats } from "@/domain/binder-stats";
import { MAX_BINDERS } from "@/domain/binder-actions";
import type { Binder } from "@/domain/types";

import styles from "./binder-overview.module.css";

interface BinderOverviewProps {
  binders: Binder[];
  activeId?: string;
  name: string;
  storageStatus: string;
  onNameChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onCreate: (event: FormEvent<HTMLFormElement>) => void;
  onSelect: (id: string) => void;
  onDuplicate: (binder: Binder) => void;
  onMove: (id: string, direction: "forward" | "backward") => void;
  onRequestDelete: (binder: Binder) => void;
  onExport: () => void;
  onImport: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function BinderOverview({
  binders,
  activeId,
  name,
  storageStatus,
  onNameChange,
  onCreate,
  onSelect,
  onDuplicate,
  onMove,
  onRequestDelete,
  onExport,
  onImport,
}: BinderOverviewProps) {
  const totalPlanned = binders.reduce((total, binder) => total + deriveBinderStats(binder).planned, 0);
  const totalOwned = binders.reduce((total, binder) => total + deriveBinderStats(binder).owned, 0);

  return (
    <section className={styles.overview} aria-labelledby="binder-heading">
      <div className={styles.overviewHeader}>
        <div>
          <span className={styles.eyebrow}>Collector Workspace · lokal</span>
          <h1 id="binder-heading">Meine Binder</h1>
          <p>Deine Sammlung bleibt in diesem Browser. Kein Konto, kein Upload.</p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.storageStatus} data-status={storageStatus}>
            <span className={styles.statusDot} /> {storageStatus === "ready" || storageStatus === "saved" ? "Lokal gespeichert" : storageStatus}
          </span>
          <button type="button" className={styles.secondaryButton} onClick={onExport} disabled={!binders.length}>
            <Archive aria-hidden="true" size={16} /> Backup exportieren
          </button>
          <label className={styles.secondaryButton} htmlFor="backup-import">
            Backup importieren
          </label>
          <input id="backup-import" className={styles.srOnly} type="file" accept="application/json,.json" onChange={onImport} />
          <button type="button" className={styles.primaryButton} onClick={() => document.getElementById("new-binder-name")?.focus()} disabled={binders.length >= MAX_BINDERS}>
            <Plus aria-hidden="true" size={17} /> Binder erstellen
          </button>
        </div>
      </div>

      <div className={styles.metricStrip} aria-label="Sammlungsübersicht">
        <div className={styles.metricIntro}>
          <strong>{binders.length}</strong>
          <span>Binder</span>
        </div>
        <div><strong>{totalPlanned}</strong><span>Geplant</span></div>
        <div><strong>{totalOwned}</strong><span>Vorhanden</span></div>
        <div><strong>{Math.max(totalPlanned - totalOwned, 0)}</strong><span>Fehlt noch</span></div>
      </div>

      <div className={styles.createPanel}>
        <div>
          <span className={styles.sectionKicker}>Neuen Binder anlegen</span>
          <p>Starte mit einem Namen, Seiten und Karten kommen danach.</p>
        </div>
        <form className={styles.createForm} onSubmit={onCreate}>
          <label className={styles.srOnly} htmlFor="new-binder-name">Bindername</label>
          <input id="new-binder-name" value={name} maxLength={100} onChange={onNameChange} placeholder="Zum Beispiel Base Set" />
          <button type="submit" className={styles.primaryButton} disabled={!name.trim() || binders.length >= MAX_BINDERS}><Plus size={16} /> Erstellen</button>
        </form>
      </div>

      {binders.length ? (
        <div>
          <p className={styles.orderHint}>Eigene Reihenfolge · mit den Pfeilen anpassen</p>
          <div className={styles.binderGrid} aria-label="Binder auswählen">
            {binders.map((binder, index) => {
              const stats = deriveBinderStats(binder);
              const selected = binder.id === activeId;
              return (
                <article className={`${styles.binderCard} ${selected ? styles.binderCardActive : ""}`} key={binder.id}>
                  <button type="button" className={styles.binderCardMain} onClick={() => onSelect(binder.id)} aria-pressed={selected}>
                    <span className={styles.binderCardTopline}>
                      <span className={styles.binderMark}><Archive size={19} /></span>
                    </span>
                    <strong>{binder.name}</strong>
                    <span className={styles.binderCardMeta}>{binder.pages.length} {binder.pages.length === 1 ? "Seite" : "Seiten"} · zuletzt geändert {formatDate(binder.updatedAt)}</span>
                    <span className={styles.cardProgress} aria-label={`${stats.completionPercent} Prozent vollständig`}>
                      <span style={{ width: `${stats.completionPercent}%` }} />
                    </span>
                    <span className={styles.binderCardStats}><span>{stats.owned} vorhanden</span><span>{stats.missing} fehlen</span></span>
                  </button>
                  <div className={styles.binderCardActions} aria-label={`${binder.name} verwalten`}>
                    <button type="button" onClick={() => onMove(binder.id, "forward")} aria-label={`${binder.name} nach vorne verschieben`} title="Nach vorne" disabled={index === 0}><ArrowLeft size={15} /></button>
                    <button type="button" onClick={() => onMove(binder.id, "backward")} aria-label={`${binder.name} nach hinten verschieben`} title="Nach hinten" disabled={index === binders.length - 1}><ArrowRight size={15} /></button>
                    <button type="button" onClick={() => onDuplicate(binder)} aria-label={`${binder.name} duplizieren`} title="Binder duplizieren" disabled={binders.length >= MAX_BINDERS}><Copy size={15} /></button>
                    <button type="button" className={styles.deleteButton} onClick={() => onRequestDelete(binder)} aria-label={`${binder.name} löschen`} title="Binder löschen"><Trash2 size={15} /></button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}><Archive size={25} /></span>
          <h2>Noch kein Binder</h2>
          <p>Lege deinen ersten lokalen Binder an. Deine Daten werden nur in diesem Browser gespeichert.</p>
          <button type="button" className={styles.primaryButton} onClick={() => document.getElementById("new-binder-name")?.focus()}>
            <Plus size={17} /> Ersten Binder erstellen
          </button>
        </div>
      )}
    </section>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "gerade eben";
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}
