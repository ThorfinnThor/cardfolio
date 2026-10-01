"use client";

import { Archive, ArrowLeft, ArrowRight, Copy, Gift, Plus, Trash2 } from "lucide-react";
import type { ChangeEvent, CSSProperties, FormEvent } from "react";

import { deriveBinderStats } from "@/domain/binder-stats";
import { MAX_BINDERS } from "@/domain/binder-actions";
import type { Binder } from "@/domain/types";

import { catalogLabel, coverLeather } from "./binder-cover";
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
  onGiftStart?: () => void;
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
  onGiftStart,
}: BinderOverviewProps) {
  const totalPlanned = binders.reduce((total, binder) => total + deriveBinderStats(binder).planned, 0);
  const totalOwned = binders.reduce((total, binder) => total + deriveBinderStats(binder).owned, 0);
  const totalPercent = totalPlanned ? Math.round((totalOwned / totalPlanned) * 100) : 0;

  return (
    <section className={styles.overview} aria-labelledby="binder-heading">
      <div className={styles.overviewHeader}>
        <div>
          <span className={styles.eyebrow}>Sammlung · lokal · {binders.length} / {MAX_BINDERS} Binder</span>
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
          <small className={styles.slabLabel}>Gesamtsammlung</small>
          <strong>{totalPercent}%</strong>
          <span className={styles.metricTrack} aria-hidden="true"><span style={{ width: `${totalPercent}%` }} /></span>
        </div>
        <div><small className={styles.slabLabel}>Ordner</small><strong>{binders.length}</strong><span>Binder</span></div>
        <div><small className={styles.slabLabel}>Plan</small><strong>{totalPlanned}</strong><span>Geplant</span></div>
        <div data-tone="ok"><small className={styles.slabLabel}>Im Binder</small><strong>{totalOwned}</strong><span>Vorhanden</span></div>
        <div data-tone="miss"><small className={styles.slabLabel}>Offen</small><strong>{Math.max(totalPlanned - totalOwned, 0)}</strong><span>Fehlt noch</span></div>
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

      <div className={styles.entryChoices} aria-label="Startpunkt auswählen">
        <div>
          <span className={styles.sectionKicker}>Wie möchtest du starten?</span>
          <p>Beide Wege bleiben im selben lokalen Cardfolio-Binder.</p>
        </div>
        <div className={styles.entryChoiceGrid}>
          <button type="button" className={styles.entryChoice} onClick={() => document.getElementById("new-binder-name")?.focus()}>
            <Archive aria-hidden="true" size={18} />
            <span><strong>Meine Sammlung planen</strong><small>Binder selbst anlegen und Karten gezielt ergänzen.</small></span>
          </button>
          <button type="button" className={styles.entryChoice} onClick={() => onGiftStart?.()}>
            <Gift aria-hidden="true" size={18} />
            <span><strong>Geschenk erstellen</strong><small>Lieblings-Pokémon, Budget und Umfang auswählen.</small></span>
          </button>
        </div>
      </div>

      {binders.length ? (
        <div>
          <div className={styles.shelfHeader}>
            <span className={styles.sectionKicker}>Regal</span>
            <p className={styles.orderHint}>Eigene Reihenfolge · mit den Pfeilen anpassen</p>
          </div>
          <div className={styles.binderGrid} aria-label="Binder auswählen">
            {binders.map((binder, index) => {
              const stats = deriveBinderStats(binder);
              const selected = binder.id === activeId;
              const complete = stats.planned > 0 && stats.owned === stats.planned;
              const firstPage = binder.pages[0];
              const coverStyle = { "--leather": coverLeather(binder.id), "--window-cols": binder.layout.columns } as CSSProperties;
              return (
                <article className={`${styles.binderCard} ${selected ? styles.binderCardActive : ""}`} key={binder.id} data-complete={complete}>
                  <button type="button" className={styles.binderCardMain} onClick={() => onSelect(binder.id)} aria-pressed={selected}>
                    <span className={styles.cover} style={coverStyle}>
                      <span className={styles.coverStitch} aria-hidden="true" />
                      <span className={styles.coverSpine} aria-hidden="true">{catalogLabel(index)}</span>
                      <span className={styles.coverWindow} aria-hidden="true">
                        {firstPage?.slots.map((slot, slotIndex) => (
                          <i key={slotIndex} data-state={slot ? (slot.owned ? "owned" : "missing") : "empty"} />
                        ))}
                      </span>
                      <strong className={styles.coverTitle}>{binder.name}</strong>
                      <span className={styles.coverFormat} aria-hidden="true">{binder.layout.rows}×{binder.layout.columns} · {binder.pages.length} S.</span>
                      {complete ? <span className={styles.plaque}>Komplett</span> : null}
                      <span className={styles.registerTab} aria-hidden="true">{stats.completionPercent}%</span>
                    </span>
                    <span className={styles.binderCardInfo}>
                      <span className={styles.binderCardMeta}>{binder.pages.length} {binder.pages.length === 1 ? "Seite" : "Seiten"} · zuletzt geändert {formatDate(binder.updatedAt)}</span>
                      <span className={styles.cardProgress} aria-label={`${stats.completionPercent} Prozent vollständig`}>
                        <span style={{ width: `${stats.completionPercent}%` }} />
                      </span>
                      <span className={styles.binderCardStats}><span data-tone="ok">{stats.owned} vorhanden</span><span data-tone="miss">{stats.missing} fehlen</span></span>
                    </span>
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
          <span className={styles.emptyCover} aria-hidden="true">
            <span className={styles.coverStitch} />
            <span className={styles.emptyCoverWindow}><i /><i /><i /><i /><i /><i /><i /><i /><i /></span>
            <span className={styles.emptyCoverLabel}>CF-01</span>
          </span>
          <h2>Noch kein Binder</h2>
          <p>Lege deinen ersten lokalen Binder an. Deine Daten werden nur in diesem Browser gespeichert.</p>
          <button type="button" className={styles.primaryButton} onClick={() => document.getElementById("new-binder-name")?.focus()}>
            <Plus size={17} /> Ersten Binder erstellen
          </button>
          <span className={styles.emptyHint}>Tipp: Ein vorhandenes JSON-Backup kannst du oben über „Backup importieren“ laden.</span>
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
