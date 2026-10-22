"use client";

import { ArrowLeft, ArrowRight, Check, Clipboard, ExternalLink } from "lucide-react";
import { useState } from "react";

import type { TcgplayerMassEntryExport } from "@/domain/tcgplayer-export";

import styles from "./missing-cards-panel.module.css";

const TCGPLAYER_GUIDE_PATH = "/ratgeber/tcgplayer-pokemon-karten-kaufen/";

const GUIDE_STEPS = [
  { step: 1, label: "Liste öffnen" },
  { step: 2, label: "Liste prüfen" },
  { step: 3, label: "Printing & Zustand" },
  { step: 4, label: "Add to Cart" },
] as const;

type Step = (typeof GUIDE_STEPS)[number]["step"];

/** Distinct values with their number of cards, most frequent first. */
function tally(values: readonly string[]): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1]);
}

export function TcgplayerGuide({ exported, onCopy }: { exported: TcgplayerMassEntryExport; onCopy?: (exported: TcgplayerMassEntryExport) => void }) {
  const [step, setStep] = useState<Step>(1);
  const prepared = exported.matches.filter((match) => match.line);
  const printings = tally(prepared.map((match) => match.printingHint));
  const conditions = tally(prepared.map((match) => match.conditionHint));

  if (!exported.text) return null;

  return (
    <section className={styles.cardmarketGuide} aria-labelledby="tcgplayer-guide-heading">
      <header className={styles.cardmarketGuideHeader}>
        <div>
          <span className={styles.stepTag}>Anleitung · 4 Schritte</span>
          <h4 id="tcgplayer-guide-heading">TCGplayer-Anleitung</h4>
          <p>Erledige nur die groß angezeigte Aufgabe. Danach kommst du zu Your Card Binder zurück und klickst auf „Weiter“.</p>
        </div>
        <strong aria-live="polite">Schritt {step} von {GUIDE_STEPS.length}</strong>
      </header>

      <ol className={styles.cardmarketGuideProgress} aria-label="Fortschritt der TCGplayer-Anleitung">
        {GUIDE_STEPS.map((entry) => {
          const status = entry.step < step ? "done" : entry.step === step ? "active" : "todo";
          return (
            <li data-status={status} aria-current={status === "active" ? "step" : undefined} key={entry.step}>
              <span>{status === "done" ? <Check aria-hidden="true" size={15} /> : entry.step}</span>
              <b>{entry.label}</b>
            </li>
          );
        })}
      </ol>

      <div className={styles.cardmarketGuideCard} data-step={step}>
        {step === 1 ? <>
          <span className={styles.cardmarketGuideKicker}>Schritt 1</span>
          <h5>Liste kopieren und TCGplayer öffnen</h5>
          <p>Der große Button kopiert alle {exported.readyCount} vorbereiteten Karten und öffnet TCGplayers Mass Entry. Du musst keine Karte einzeln suchen.</p>
          <a
            className={styles.cardmarketBulkAction}
            href={exported.massEntryUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => { onCopy?.(exported); setStep(2); }}
          >
            <Clipboard aria-hidden="true" size={19} />
            {exported.readyCount === 1 ? "1 Karte" : `${exported.readyCount} Karten`} kopieren &amp; TCGplayer öffnen
            <ExternalLink aria-hidden="true" size={18} />
          </a>
          <small>Der Kauf wird nicht automatisch ausgelöst.</small>
        </> : null}

        {step === 2 ? <>
          <span className={styles.cardmarketGuideKicker}>Schritt 2</span>
          <h5>Liste in Mass Entry prüfen</h5>
          <ol className={styles.cardmarketInstructionList}>
            {exported.massEntryPrefilled
              ? <li>Die Karten stehen bereits <b>vorausgefüllt</b> im Feld <b>„Items“</b>. Sonst klicke in das Feld und füge sie mit <b>Strg+V</b> beziehungsweise <b>⌘V</b> ein.</li>
              : <li>Klicke in das Feld <b>„Items“</b> und füge die Liste mit <b>Strg+V</b> beziehungsweise <b>⌘V</b> ein.</li>}
            <li>Bei <b>„Select Product Line“</b> muss <b>Pokemon</b> stehen, und jede Karte sollte als eigene Zeile erscheinen.</li>
          </ol>
          <small>TCGplayer zeigt die Seite auf Englisch. Mit „Show Set/Series Codes“ siehst du die Set-Kürzel, falls eine Zeile nicht erkannt wird.</small>
          <div className={styles.cardmarketGuideActions}>
            <button type="button" className={styles.cardmarketBackButton} onClick={() => setStep(1)}><ArrowLeft aria-hidden="true" size={16} /> Zurück</button>
            <a href={exported.massEntryUrl} target="_blank" rel="noopener noreferrer" onClick={() => onCopy?.(exported)}>
              Liste erneut kopieren &amp; TCGplayer öffnen <ExternalLink aria-hidden="true" size={16} />
            </a>
            <button type="button" onClick={() => setStep(3)}>Die Liste stimmt <ArrowRight aria-hidden="true" size={17} /></button>
          </div>
        </> : null}

        {step === 3 ? <>
          <span className={styles.cardmarketGuideKicker}>Schritt 3</span>
          <h5>Printing und Condition einstellen</h5>
          <div className={styles.cardmarketConditionWarning} role="alert">
            <div>
              <strong>Mass Entry übernimmt nur Karte, Set und Nummer</strong>
              <p>Öffne bei TCGplayer den Bereich <b>„Item Options“</b> und setze Haken bei <b>Printing</b> und <b>Condition</b>. Holofoil, 1st Edition Holofoil und Unlimited Holofoil sind getrennte Optionen.</p>
            </div>
            <div className={styles.optionTally}>
              <span><small>Printing laut deiner Auswahl</small>{printings.map(([label, count]) => <b key={label}>{label} · {count === 1 ? "1 Karte" : `${count} Karten`}</b>)}</span>
              <span><small>Zustand laut deiner Auswahl</small>{conditions.map(([label, count]) => <b key={label}>{label} · {count === 1 ? "1 Karte" : `${count} Karten`}</b>)}</span>
            </div>
          </div>
          <div className={styles.cardmarketGuideActions}>
            <button type="button" className={styles.cardmarketBackButton} onClick={() => setStep(2)}><ArrowLeft aria-hidden="true" size={16} /> Zurück</button>
            <button type="button" onClick={() => setStep(4)}>Optionen sind gesetzt <ArrowRight aria-hidden="true" size={17} /></button>
          </div>
        </> : null}

        {step === 4 ? <>
          <span className={styles.cardmarketGuideKicker}>Schritt 4</span>
          <h5>„Add to Cart“ klicken und das Ergebnis prüfen</h5>
          <ol className={styles.cardmarketInstructionList}>
            <li>Klicke bei TCGplayer auf <b>„Add to Cart“</b>. TCGplayer sucht dann nach eigener Beschreibung die günstigsten passenden Angebote im Marktplatz.</li>
            <li>Prüfe, ob für alle <b>{exported.readyCount === 1 ? "1 Karte" : `${exported.readyCount} Karten`}</b> ein Angebot gefunden wurde, und kontrolliere Kartenname, Set, vollständige Nummer, Sprache, Printing und Zustand.</li>
            <li>Sieh dir <b>Versandkosten und Lieferart</b> an, bevor du bezahlst. Bezahlt wird bei TCGplayer.</li>
          </ol>
          <small>Your Card Binder legt nichts in deinen Warenkorb. TCGplayer zeigt bei einem Standort in Deutschland nur Verkäufer, die dorthin liefern. <a href={TCGPLAYER_GUIDE_PATH}>Ausführliche Anleitung mit allen Begriffen</a></small>
          <div className={styles.cardmarketGuideActions}>
            <button type="button" className={styles.cardmarketBackButton} onClick={() => setStep(3)}><ArrowLeft aria-hidden="true" size={16} /> Zurück</button>
          </div>
        </> : null}
      </div>
    </section>
  );
}
