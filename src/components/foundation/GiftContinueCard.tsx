"use client";

import { PartyPopper } from "lucide-react";

import { GiftPurchaseSteps } from "./GiftPurchaseSteps";
import styles from "./gift-builder.module.css";

interface GiftContinueCardProps {
  planned: number;
  missing: number;
  onCardsPurchase: () => void;
}

/**
 * Shown on top of a saved gift binder: someone who comes back later sees at once what is still to do and
 * where to continue (order the binder, buy the missing cards).
 */
export function GiftContinueCard({ planned, missing, onCardsPurchase }: GiftContinueCardProps) {
  if (missing <= 0) {
    return (
      <section className={styles.continueCard} aria-labelledby="gift-continue-heading" data-done="true">
        <h2 id="gift-continue-heading"><PartyPopper aria-hidden="true" size={22} /> Alle Karten sind da</h2>
        <p>Jetzt fehlt nur noch, die Karten in den Binder zu stecken. Viel Freude beim Verschenken!</p>
      </section>
    );
  }
  return (
    <section className={styles.continueCard} aria-labelledby="gift-continue-heading">
      <div className={styles.continueIntro}>
        <h2 id="gift-continue-heading">So geht es mit deinem Geschenk weiter</h2>
        <p>Dein Geschenk-Binder ist geplant. Es fehlen noch <strong>{missing} von {planned} Karten</strong> und der Binder selbst.</p>
      </div>
      <GiftPurchaseSteps planSize={planned} onCardsPurchase={onCardsPurchase} />
    </section>
  );
}
