"use client";

import { Archive, ArrowLeft, ArrowRight, BookOpen, Copy, Gift, Plus, Trash2 } from "lucide-react";
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
  onSetStart?: () => void;
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
  onSetStart,
}: BinderOverviewProps) {
  const totalPlanned = binders.reduce((total, binder) => total + deriveBinderStats(binder).planned, 0);
  const totalOwned = binders.reduce((total, binder) => total + deriveBinderStats(binder).owned, 0);
  const totalPercent = totalPlanned ? Math.round((totalOwned / totalPlanned) * 100) : 0;

  return (
    <section className={styles.overview} aria-labelledby="binder-heading">
      <div className={styles.giftHero} id="guided-start" data-has-binders={binders.length > 0}>
        <div className={styles.giftHeroCopy}>
          <span className={styles.eyebrow}>Ein Geschenk, das persönlich wird</span>
          <h1 id="binder-heading">Ein Pokémon-Binder als persönliches Geschenk.</h1>
          <p>Wähle ein Lieblings-Pokémon oder Bildmotiv. Wir schlagen passende Karten vor und führen dich bis zur Einkaufsliste.</p>
          <button type="button" className={styles.heroButton} onClick={() => onGiftStart?.()} disabled={binders.length >= MAX_BINDERS}>
            <Gift aria-hidden="true" size={22} /> Geschenk-Binder gestalten <ArrowRight aria-hidden="true" size={21} />
          </button>
          <span className={styles.heroReassurance}>Ohne Konto starten · Karten später austauschen · lokal gespeichert</span>
        </div>
        <div className={styles.giftHeroVisual} aria-hidden="true">
          <span className={styles.pageCaption}>So könnte deine erste Seite aussehen</span>
          <div className={styles.samplePage}>{Array.from({ length: 9 }, (_, index) => <span className={styles.sampleCard} key={index}><i /><b /></span>)}</div>
        </div>
      </div>

      <ol className={styles.simpleSteps} aria-label="So entsteht dein Geschenk-Binder">
        <li><strong>1</strong><span>Pokémon oder Motiv wählen</span></li>
        <li><strong>2</strong><span>Karten und Seite ansehen</span></li>
        <li><strong>3</strong><span>Binder und Karten besorgen</span></li>
      </ol>

      <div className={styles.alternativeStarts} aria-label="Weitere Startmöglichkeiten">
        <span>Du sammelst lieber gezielt?</span>
        <button type="button" onClick={() => onSetStart?.()} disabled={binders.length >= MAX_BINDERS} aria-label="Mit einem Set starten"><BookOpen aria-hidden="true" size={19} /> Mit einem Set starten <ArrowRight aria-hidden="true" size={17} /></button>
        <details className={styles.manualStart} id="manual-start">
          <summary>Leer starten</summary>
          <div className={styles.createPanel}>
            <p>Gib deinem Binder einen Namen. Danach kannst du jede Karte selbst auswählen.</p>
            <form className={styles.createForm} onSubmit={onCreate}>
              <label className={styles.srOnly} htmlFor="new-binder-name">Bindername</label>
              <input id="new-binder-name" value={name} maxLength={100} onChange={onNameChange} placeholder="Name für deinen Binder" />
              <button type="submit" className={styles.secondaryButton} disabled={!name.trim() || binders.length >= MAX_BINDERS}><Plus aria-hidden="true" size={16} /> Anlegen</button>
            </form>
          </div>
        </details>
      </div>

      {binders.length ? (
        <div>
          <div className={styles.shelfHeader}>
            <div><span className={styles.sectionKicker}>Deine Sammlung</span><h2>Hier kannst du weitergestalten</h2></div>
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
      ) : null}

      {binders.length ? <div className={styles.collectionFooter}>
        <span>{binders.length} von {MAX_BINDERS} Bindern · {totalPercent}% deiner geplanten Karten vorhanden ({totalOwned} von {totalPlanned})</span>
        <span className={styles.storageStatus} data-status={storageStatus}><span className={styles.statusDot} /> {storageStatus === "ready" || storageStatus === "saved" ? "Lokal gespeichert" : storageStatus}</span>
        <button type="button" onClick={onExport}><Archive aria-hidden="true" size={16} /> Backup exportieren</button>
      </div> : null}
      <label className={styles.backupImport} htmlFor="backup-import">Vorhandenen Binder aus Backup laden</label>
      <input id="backup-import" className={styles.srOnly} type="file" accept="application/json,.json" onChange={onImport} />
    </section>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "gerade eben";
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}
