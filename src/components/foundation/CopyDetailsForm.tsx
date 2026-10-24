"use client";

import { copiesOf } from "@/domain/collection-value";
import { conditionProfile } from "@/domain/purchase-preferences";
import { MAX_COPIES, type OwnedCondition, type PlannedCard } from "@/domain/types";

import styles from "./copy-details-form.module.css";

const CONDITIONS: readonly OwnedCondition[] = ["near-mint", "excellent", "lightly-played", "played"];

/** Condition and number of copies of an owned card, as saved on the slot. */
export function CopyDetailsForm({ entry, onChange }: { entry: PlannedCard; onChange: (details: { condition?: OwnedCondition; quantity?: number }) => void }) {
  const quantity = copiesOf(entry);
  return (
    <div className={styles.form}>
      <label>
        <span>Zustand deiner Karte</span>
        <select value={entry.condition ?? ""} onChange={(event) => { if (event.target.value) onChange({ condition: event.target.value as OwnedCondition }); }}>
          {entry.condition ? null : <option value="">Nicht eingetragen</option>}
          {CONDITIONS.map((condition) => <option key={condition} value={condition}>{conditionProfile(condition).shortLabel}</option>)}
        </select>
      </label>
      <div className={styles.quantity}>
        <span id={`quantity-${entry.id}`}>Menge</span>
        <div role="group" aria-labelledby={`quantity-${entry.id}`}>
          <button type="button" aria-label="Eine Karte weniger" disabled={quantity <= 1} onClick={() => onChange({ quantity: quantity - 1 })}>−</button>
          <output aria-live="polite">{quantity}</output>
          <button type="button" aria-label="Eine Karte mehr" disabled={quantity >= MAX_COPIES} onClick={() => onChange({ quantity: quantity + 1 })}>+</button>
        </div>
      </div>
    </div>
  );
}
