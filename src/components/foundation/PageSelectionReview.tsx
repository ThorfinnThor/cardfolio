"use client";

import type { Binder, PurchasePreferences, VariantSelection } from "@/domain/types";
import { isVariantSelectionValid, variantAvailabilityForCard } from "@/domain/variant-selection";
import type { PageSelectionItem } from "@/domain/page-selection";
import { useState } from "react";

import { CardArtwork } from "./CardArtwork";
import { VariantFields } from "./VariantFields";
import styles from "./foundation-workspace.module.css";

export type PageSelectionReviewTarget = "new-page" | "fill-current-page" | "fill-continuously" | "new-binder";

interface PageSelectionReviewProps {
  items: PageSelectionItem[];
  binder: Binder;
  pageId: string;
  language: "de" | "en";
  loading: boolean;
  submitting: boolean;
  notice?: string;
  error?: string;
  onLanguageChange: (language: "de" | "en") => void;
  onChange: (items: PageSelectionItem[]) => void;
  onRemove: (cardKey: string) => void;
  onContinueSearch: () => void;
  onCancel: () => void;
  onConfirm: (target: PageSelectionReviewTarget, binderName: string) => void;
}

function freeSlots(binder: Binder, pageId: string): number {
  return binder.pages.find((page) => page.id === pageId)?.slots.filter((slot) => slot === null).length ?? 0;
}

function pageCapacity(binder: Binder): number {
  return binder.layout.rows * binder.layout.columns;
}

export function PageSelectionReview({
  items,
  binder,
  pageId,
  language,
  loading,
  submitting,
  notice,
  error,
  onLanguageChange,
  onChange,
  onRemove,
  onContinueSearch,
  onCancel,
  onConfirm,
}: PageSelectionReviewProps) {
  const availableSlots = freeSlots(binder, pageId);
  const hasAnyFreeSlot = binder.pages.some((page) => page.slots.some((slot) => slot === null));
  const newPageCapacity = pageCapacity(binder);
  const currentPageFits = items.length <= availableSlots;
  const newPageFits = items.length <= newPageCapacity;
  const complete = items.length > 0 && items.every((item) => item.card.physicalStatus !== "digital" && isVariantSelectionValid(
    item.variant,
    variantAvailabilityForCard(item.card),
  ));
  const [target, setTarget] = useTargetState(currentPageFits, newPageFits);
  const [binderName, setBinderName] = useBinderName();

  function updateItem(cardKey: string, update: (item: PageSelectionItem) => PageSelectionItem) {
    onChange(items.map((item) => item.card.key === cardKey ? update(item) : item));
  }

  return (
    <div className={styles.dialogBackdrop} role="presentation">
      <section className={`${styles.confirmDialog} ${styles.pageSelectionDialog}`} role="dialog" aria-modal="true" aria-labelledby="page-selection-heading">
        <p className={styles.eyebrow}>Smart Search · Binderseite</p>
        <h2 id="page-selection-heading">{items.length} Karten als Auswahl übernehmen</h2>
        <p>Die Auswahl bleibt bis zur Bestätigung ein Entwurf. Jede Karte braucht eine vollständige, für diese Karte gültige Variante.</p>
        <fieldset className={styles.languageFilter}>
          <legend>Kartensprache für die Auswahl</legend>
          <div>
            <button type="button" aria-pressed={language === "de"} disabled={loading} onClick={() => onLanguageChange("de")}>Deutsch</button>
            <button type="button" aria-pressed={language === "en"} disabled={loading} onClick={() => onLanguageChange("en")}>English</button>
          </div>
        </fieldset>
        {notice ? <p className={styles.variantHint} role="status">{notice}</p> : null}
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        {loading ? <p className={styles.previewLoading} role="status">Kartendaten werden für die Auswahl geladen…</p> : null}
        {!loading ? (
          <div className={styles.pageSelectionList}>
            {items.map((item, index) => (
              <details key={item.card.key} open={index === 0} className={styles.pageSelectionItem}>
                <summary>
                  <span>{index + 1}. {item.card.name}</span>
                  <small>{item.card.ref.language.toUpperCase()} · {item.card.setName} · Nr. {item.card.collectorNumber}</small>
                </summary>
                <div className={styles.pageSelectionCard}>
                  <CardArtwork
                    card={item.card}
                    className={styles.pageSelectionImage}
                    fallback={<div className={styles.previewImageFallback}>Bild nicht verfügbar</div>}
                  />
                  <div>
                    <VariantFields
                      variant={item.variant}
                      preferences={item.preferences}
                      availability={variantAvailabilityForCard(item.card)}
                      onVariantChange={(variant: VariantSelection) => updateItem(item.card.key, (current) => ({ ...current, variant }))}
                      onPreferencesChange={(preferences: PurchasePreferences) => updateItem(item.card.key, (current) => ({ ...current, preferences }))}
                    />
                    <button type="button" className={styles.removeSelectionButton} onClick={() => onRemove(item.card.key)}>Aus Auswahl entfernen</button>
                  </div>
                </div>
              </details>
            ))}
          </div>
        ) : null}
        <fieldset className={styles.selectionTargetFieldset} disabled={loading || submitting}>
          <legend>Übernahmeziel</legend>
          <label>
            <input type="radio" name="page-selection-target" value="new-page" checked={target === "new-page"} disabled={!newPageFits} onChange={() => setTarget("new-page")} />
            <span>Neue Seite <small>{newPageCapacity} Plätze</small></span>
          </label>
          <label>
            <input type="radio" name="page-selection-target" value="fill-current-page" checked={target === "fill-current-page"} disabled={!currentPageFits} onChange={() => setTarget("fill-current-page")} />
            <span>Freie Plätze auf Seite {binder.pages.findIndex((page) => page.id === pageId) + 1} <small>{availableSlots} frei</small></span>
          </label>
          <label>
            <input type="radio" name="page-selection-target" value="fill-continuously" checked={target === "fill-continuously"} disabled={!hasAnyFreeSlot} onChange={() => setTarget("fill-continuously")} />
            <span>Ab nächstem freien Platz fortlaufend <small>bei Bedarf weitere Seiten</small></span>
          </label>
          <label>
            <input type="radio" name="page-selection-target" value="new-binder" checked={target === "new-binder"} onChange={() => setTarget("new-binder")} />
            <span>Neuen Binder anlegen</span>
          </label>
        </fieldset>
        {target === "new-binder" ? (
          <label className={styles.dialogField} htmlFor="selection-binder-name">
            <span>Bindername</span>
            <input id="selection-binder-name" value={binderName} maxLength={100} onChange={(event) => setBinderName(event.target.value)} />
          </label>
        ) : null}
        <div className={styles.dialogActions}>
          <button type="button" className={styles.secondaryButton} disabled={submitting} onClick={onContinueSearch}>Weitere Karten auswählen</button>
          <button type="button" className={styles.secondaryButton} disabled={submitting} onClick={onCancel}>Abbrechen</button>
          <button type="button" className={styles.confirmButton} disabled={loading || submitting || !complete || !items.length || (target === "new-binder" && !binderName.trim())} onClick={() => onConfirm(target, binderName)}>
            {submitting ? "Wird gespeichert…" : "Auswahl übernehmen"}
          </button>
        </div>
      </section>
    </div>
  );
}

function useTargetState(currentPageFits: boolean, newPageFits: boolean): [PageSelectionReviewTarget, (target: PageSelectionReviewTarget) => void] {
  const [target, setTarget] = useState<PageSelectionReviewTarget>(currentPageFits ? "fill-current-page" : newPageFits ? "new-page" : "new-binder");
  const effectiveTarget = target === "fill-current-page" && !currentPageFits
    ? newPageFits ? "new-page" : "new-binder"
    : target === "new-page" && !newPageFits
      ? "new-binder"
      : target;
  return [effectiveTarget, setTarget];
}

function useBinderName(): [string, (name: string) => void] {
  const [name, setName] = useState("Smart-Search-Auswahl");
  return [name, setName];
}
