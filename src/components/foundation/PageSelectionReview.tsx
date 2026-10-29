"use client";

import type { Binder, PurchasePreferences } from "@/domain/types";
import { conditionProfile, conditionProfiles } from "@/domain/purchase-preferences";
import {
  finishLabels,
  isVariantSelectionValid,
  nextFinish,
  selectableFinishes,
  variantAvailabilityForCard,
} from "@/domain/variant-selection";
import type { PageSelectionItem } from "@/domain/page-selection";
import { useState } from "react";

import { CardArtwork } from "./CardArtwork";
import { VariantAdvancedFields } from "./VariantFields";
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
  onChange: (update: (items: PageSelectionItem[]) => PageSelectionItem[]) => void;
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
  const pending = items.filter((item) => !isVariantSelectionValid(item.variant, variantAvailabilityForCard(item.card)));
  const complete = items.length > 0 && items.every((item) => item.card.physicalStatus !== "digital") && !pending.length;
  const allOwned = items.every((item) => item.owned);
  const noneOwned = items.every((item) => !item.owned);
  const wantedCondition = items[0]?.preferences.minimumCondition ?? "any";
  const [target, setTarget] = useTargetState(currentPageFits, newPageFits);
  const [binderName, setBinderName] = useBinderName();

  function updateItem(cardKey: string, update: (item: PageSelectionItem) => PageSelectionItem) {
    onChange((current) => current.map((item) => item.card.key === cardKey ? update(item) : item));
  }

  function setAllOwned(owned: boolean) {
    onChange((current) => current.map((item) => ({ ...item, owned })));
  }

  function setWantedCondition(minimumCondition: PurchasePreferences["minimumCondition"]) {
    onChange((current) => current.map((item) => ({ ...item, preferences: { ...item.preferences, minimumCondition } })));
  }

  return (
    <div className={styles.dialogBackdrop} role="presentation">
      <section className={`${styles.confirmDialog} ${styles.pageSelectionDialog}`} role="dialog" aria-modal="true" aria-labelledby="page-selection-heading">
        <div className={styles.selectionMain}>
        <p className={styles.eyebrow}>Binderseite zusammenstellen</p>
        <h2 id="page-selection-heading">{items.length} {items.length === 1 ? "Karte" : "Karten"} zum Binder hinzufügen</h2>
        <p>Tippe auf den Stern oben rechts, wenn die Karte glänzt (Holo), und auf den Kreis oben links, wenn du sie schon hast. Gespeichert wird erst, wenn du übernimmst.</p>
        <div className={styles.selectionToolbar}>
          <fieldset className={styles.languageFilter}>
            <legend>Kartensprache</legend>
            <div>
              <button type="button" aria-pressed={language === "de"} disabled={loading} onClick={() => onLanguageChange("de")}>Deutsch</button>
              <button type="button" aria-pressed={language === "en"} disabled={loading} onClick={() => onLanguageChange("en")}>English</button>
            </div>
          </fieldset>
          {items.length > 1 && !loading ? (
            <div className={styles.selectionBulk}>
              <button type="button" onClick={() => setAllOwned(true)} disabled={allOwned}>Alle vorhanden</button>
              <button type="button" onClick={() => setAllOwned(false)} disabled={noneOwned}>Alle fehlen noch</button>
            </div>
          ) : null}
        </div>
        {notice ? <p className={styles.variantHint} role="status">{notice}</p> : null}
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        {loading ? <p className={styles.previewLoading} role="status">Kartendaten werden für die Auswahl geladen…</p> : null}
        {!loading ? (
          <ul className={styles.selectionGrid} aria-label="Ausgewählte Karten">
            {items.map((item) => (
              <SelectionTile
                key={item.card.key}
                item={item}
                onChange={(update) => updateItem(item.card.key, update)}
                onRemove={() => onRemove(item.card.key)}
              />
            ))}
          </ul>
        ) : null}
        </div>
        <div className={styles.selectionSide}>
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
        {items.some((item) => !item.owned) && !loading ? (
          <div className={styles.variantForm}>
            <label>
              Gewünschter Zustand der fehlenden Karten
              <select aria-label="Mindestzustand beim Kauf" value={wantedCondition} onChange={(event) => setWantedCondition(event.target.value as PurchasePreferences["minimumCondition"])}>
                {conditionProfiles.map((profile) => <option value={profile.value} key={profile.value}>{profile.label}</option>)}
              </select>
              <small>{conditionProfile(wantedCondition).providerSummary}</small>
            </label>
          </div>
        ) : null}
        {target === "new-binder" ? (
          <label className={styles.dialogField} htmlFor="selection-binder-name">
            <span>Bindername</span>
            <input id="selection-binder-name" value={binderName} maxLength={100} onChange={(event) => setBinderName(event.target.value)} />
          </label>
        ) : null}
        <div className={styles.selectionFooter}>
          {pending.length ? <p className={styles.selectionPending} role="status">Noch bei {pending.length === 1 ? "einer Karte" : `${pending.length} Karten`}: Stern antippen und Normal oder Holo wählen.</p> : null}
        <div className={styles.dialogActions}>
          <button type="button" className={styles.secondaryButton} disabled={submitting} onClick={onContinueSearch}>Weitere Karten auswählen</button>
          <button type="button" className={styles.secondaryButton} data-dialog-cancel disabled={submitting} onClick={onCancel}>Abbrechen</button>
          <button type="button" className={styles.confirmButton} disabled={loading || submitting || !complete || !items.length || (target === "new-binder" && !binderName.trim())} onClick={() => onConfirm(target, binderName)}>
            {submitting ? "Wird gespeichert…" : "Auswahl übernehmen"}
          </button>
        </div>
        </div>
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

const finishBadge: Record<string, string> = { normal: "☆", holo: "★", reverse: "R", unspecified: "?", other: "★" };
const finishWords: Record<string, string> = { normal: "Normal", holo: "Holo", reverse: "Reverse Holo", other: "Sonderausgabe", unspecified: "Holo oder normal?" };

interface SelectionTileProps {
  item: PageSelectionItem;
  onChange: (update: (item: PageSelectionItem) => PageSelectionItem) => void;
  onRemove: () => void;
}

/** One card of the selection: the star sets the finish, the dot says whether the collector has the card. */
function SelectionTile({ item, onChange, onRemove }: SelectionTileProps) {
  const availability = variantAvailabilityForCard(item.card);
  const finishes = selectableFinishes(availability, item.variant.edition);
  const choosable = finishes.length > 1 || (finishes.length === 1 && item.variant.finish !== finishes[0]);
  const finish = item.variant.finish;
  const valid = isVariantSelectionValid(item.variant, availability);
  const needsDetails = availability.firstEdition || availability.shadowless || finish === "other" || Boolean(item.variant.label?.trim());
  const badge = finishBadge[finish] ?? "?";
  const word = finishWords[finish] ?? finishLabels[finish];
  const owned = Boolean(item.owned);

  return (
    <li className={styles.selectionTile} data-owned={owned} data-incomplete={!valid}>
      <div className={styles.selectionTileImage}>
        <CardArtwork
          card={item.card}
          className={styles.selectionTileArt}
          fallback={<span className={styles.selectionTileArt}><span className={styles.previewImageFallback}>Bild nicht verfügbar</span></span>}
        />
        {choosable ? (
          <button
            type="button"
            className={styles.selectionStar}
            data-finish={finish}
            aria-label={`Glanz: ${word}. Antippen zum Wechseln`}
            onClick={() => onChange((current) => ({ ...current, variant: { ...current.variant, finish: nextFinish(current.variant, availability) } }))}
          >{badge}</button>
        ) : finish === "holo" || finish === "reverse" ? (
          <span className={styles.selectionStar} data-finish={finish} data-static="true" title={`Diese Karte gibt es nur als ${word}`}>{badge}</span>
        ) : null}
        <button
          type="button"
          className={styles.selectionDot}
          aria-pressed={owned}
          aria-label={`Habe ich: ${item.card.name}`}
          onClick={() => onChange((current) => ({ ...current, owned: !current.owned }))}
        >{owned ? "✓" : ""}</button>
      </div>
      <strong title={item.card.name}>{item.card.name}</strong>
      <small>{item.card.ref.language.toUpperCase()} · {item.card.setName} · Nr. {item.card.collectorNumber}</small>
      <span className={styles.selectionTileState}>{finish === "unspecified" ? "Stern antippen: Holo oder normal?" : word} · {owned ? "habe ich" : "fehlt noch"}</span>
      {!valid && finish !== "unspecified" ? <span className={styles.selectionTileState}>Bitte Angaben prüfen</span> : null}
      {needsDetails ? (
        <VariantAdvancedFields
          variant={item.variant}
          availability={availability}
          summary="Edition und Druck"
          onVariantChange={(variant) => onChange((current) => ({ ...current, variant }))}
        />
      ) : null}
      <button type="button" className={styles.removeSelectionButton} aria-label={`${item.card.name} aus der Auswahl entfernen`} onClick={onRemove}>Entfernen</button>
    </li>
  );
}
