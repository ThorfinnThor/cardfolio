"use client";

import Link from "next/link";
import { useState } from "react";

import { STARTER_SETS } from "@/domain/starter-sets";

import styles from "./guided-start.module.css";

interface GuidedStartProps {
  disabled: boolean;
  onGift: () => void;
  onSet: (setId?: string) => void;
  onFree: () => void;
}

/** Two short questions for a first visit, so nobody has to understand the four ways to start. */
export function GuidedStart({ disabled, onGift, onSet, onFree }: GuidedStartProps) {
  const [step, setStep] = useState<"purpose" | "collect">("purpose");

  return (
    <section className={styles.guided} aria-labelledby="guided-start-heading">
      {step === "purpose" ? <>
        <h2 id="guided-start-heading">Neu hier? Wofür brauchst du den Binder?</h2>
        <div className={styles.options}>
          <button type="button" onClick={onGift} disabled={disabled}><strong>Ich verschenke ihn</strong><span>Wir stellen eine Seite mit Karten zusammen.</span></button>
          <button type="button" onClick={() => setStep("collect")}><strong>Ich baue eine Sammlung auf</strong><span>Mit einem Set oder ganz frei.</span></button>
          <Link href="/kinder/" className={styles.option}><strong>Ich bin ein Kind</strong><span>Wunschzettel für Mama und Papa.</span></Link>
        </div>
      </> : <>
        <h2 id="guided-start-heading">Wie möchtest du anfangen?</h2>
        <p>Ein kleines Set ist ein guter erster Binder. Du siehst sofort, was dir noch fehlt.</p>
        <ul className={styles.sets} aria-label="Sets zum Start">
          {STARTER_SETS.map((starter) => <li key={starter.id}><button type="button" onClick={() => onSet(starter.id)} disabled={disabled}><strong>{starter.title}</strong><span>{starter.blurb}</span></button></li>)}
        </ul>
        <div className={styles.row}>
          <button type="button" onClick={() => onSet()} disabled={disabled}>Anderes Set suchen</button>
          <button type="button" onClick={onFree} disabled={disabled}>Mit einem leeren Binder starten</button>
          <button type="button" onClick={() => setStep("purpose")}>Zurück</button>
        </div>
      </>}
    </section>
  );
}
