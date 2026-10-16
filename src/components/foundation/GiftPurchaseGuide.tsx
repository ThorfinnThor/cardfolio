"use client";

import { ArrowLeft, ArrowRight, Check, Clipboard, ExternalLink } from "lucide-react";
import { useState } from "react";

import styles from "./missing-cards-panel.module.css";

type GuideStep = 1 | 2 | 3 | 4;

const GUIDE_STEPS = [
  { step: 1, label: "Liste kopieren" },
  { step: 2, label: "Karten einfügen" },
  { step: 3, label: "Zustand setzen" },
  { step: 4, label: "Verkäufer wählen" },
] as const;

export interface GiftPurchaseGuideProps {
  positionCount: number;
  partCount: number;
  partIndex: number;
  partLabels: readonly string[];
  onPartChange: (index: number) => void;
  wantsUrl: string;
  wizardHelpUrl: string;
  /** True once the verified import text exists and Cardmarket's catalogue check has finished. */
  ready: boolean;
  busyLabel: string;
  copyState: "idle" | "copied" | "error";
  onCopyAndOpen: () => void;
  /** The shared condition the buyer chose in Cardfolio and its Cardmarket equivalent, when all cards agree. */
  condition?: { cardfolio: string; code: string; label: string };
}

/**
 * Plain-language walkthrough of the Cardmarket handoff for gift buyers. It uses the same prepared list
 * and URLs as the detailed guide; it only changes what is said and in which order. Statements about
 * Cardmarket (account needed for the Shopping Wizard, the two strategies, "Add All to Cart" needing six
 * completed purchases) come from Cardmarket's own help centre (help.cardmarket.com, Shopping Wizard).
 */
const HOWTO_URL = "/anleitung/cardmarket/";

function Illustrated({ step }: { step: number }) {
  return <a className={styles.illustratedLink} href={`${HOWTO_URL}#schritt-${step}`} target="_blank" rel="noopener noreferrer">Mit Bildern erklärt ansehen <ExternalLink aria-hidden="true" size={14} /></a>;
}

export function GiftPurchaseGuide({
  positionCount,
  partCount,
  partIndex,
  partLabels,
  onPartChange,
  wantsUrl,
  wizardHelpUrl,
  ready,
  busyLabel,
  copyState,
  onCopyAndOpen,
  condition,
}: GiftPurchaseGuideProps) {
  const [step, setStep] = useState<GuideStep>(1);
  const cardsLabel = positionCount === 1 ? "1 Karte" : `${positionCount} Karten`;

  return (
    <section className={styles.cardmarketGuide} aria-labelledby="gift-purchase-heading">
      <header className={styles.cardmarketGuideHeader}>
        <div>
          <span className={styles.stepTag}>Kaufanleitung · 4 Schritte</span>
          <h4 id="gift-purchase-heading">So bekommst du die Karten</h4>
          <p>Erledige immer nur die große Aufgabe. Danach kommst du hierher zurück.</p>
        </div>
        <strong aria-live="polite">Schritt {step} von {GUIDE_STEPS.length}</strong>
      </header>

      <ol className={styles.cardmarketGuideProgress} aria-label="Fortschritt der Kaufanleitung">
        {GUIDE_STEPS.map((item) => {
          const status = item.step < step ? "done" : item.step === step ? "active" : "todo";
          return (
            <li data-status={status} aria-current={status === "active" ? "step" : undefined} key={item.step}>
              <span>{status === "done" ? <Check aria-hidden="true" size={15} /> : item.step}</span>
              <b>{item.label}</b>
            </li>
          );
        })}
      </ol>

      <div className={styles.cardmarketGuideCard} data-step={step}>
        {step === 1 ? <>
          <span className={styles.cardmarketGuideKicker}>Schritt 1</span>
          <h5>Einkaufsliste kopieren und Cardmarket öffnen</h5>
          <p>Der große Button kopiert alle Karten und öffnet Cardmarket in einem neuen Tab. Du musst keine Karte einzeln suchen.</p>
          {partCount > 1 ? (
            <label className={styles.cardmarketBulkPart} htmlFor="gift-purchase-part">
              <span>Cardmarket erlaubt höchstens 150 Positionen pro Wants-Liste. Wähle den Teil, den du jetzt übertragen möchtest:</span>
              <select id="gift-purchase-part" value={partIndex} onChange={(event) => onPartChange(Number(event.target.value))}>
                {partLabels.map((label, index) => <option value={index} key={label}>{label}</option>)}
              </select>
            </label>
          ) : null}
          {ready ? (
            <a
              className={styles.cardmarketBulkAction}
              href={wantsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                onCopyAndOpen();
                setStep(2);
              }}
            >
              <Clipboard aria-hidden="true" size={19} />
              {copyState === "copied" ? "Liste erneut kopieren & Cardmarket öffnen" : `${cardsLabel} kopieren & Cardmarket öffnen`}
              <ExternalLink aria-hidden="true" size={18} />
            </a>
          ) : (
            <button type="button" className={styles.cardmarketBulkAction} disabled>
              <Clipboard aria-hidden="true" size={19} />
              {busyLabel}
            </button>
          )}
          <small>Der Kauf wird nicht automatisch ausgelöst.</small>
          <Illustrated step={2} />
          <aside className={styles.beginnerPrelude} aria-label="Das solltest du vorab wissen">
            <strong>Das solltest du vorab wissen</strong>
            <ul>
              <li>Cardfolio verkauft nichts. Du kaufst die Karten bei <b>Cardmarket</b>, einem Marktplatz, auf dem viele Verkäufer ihre Karten anbieten.</li>
              <li>Du brauchst ein <b>Cardmarket-Konto</b>. Der Einkaufsassistent „Shopping Wizard“ funktioniert nur, wenn du angemeldet bist.</li>
              <li>Jede Sendung kostet <b>Versand</b>. Bei sehr günstigen Karten kann das einen großen Teil der Kosten ausmachen.</li>
            </ul>
          </aside>
        </> : null}

        {step === 2 ? <>
          <span className={styles.cardmarketGuideKicker}>Schritt 2</span>
          <h5>Die Karten bei Cardmarket einfügen</h5>
          <ol className={styles.cardmarketInstructionList}>
            <li>Melde dich bei Cardmarket an – oder lege dort ein Konto an.</li>
            <li>Lege eine neue <b>Wants-Liste</b> an (so nennt Cardmarket die Wunschliste) oder öffne eine vorhandene.</li>
            <li>Wähle <b>„Deck-Liste hinzufügen“</b>, klicke in das große Textfeld und füge die Liste mit <b>Strg+V</b> beziehungsweise <b>⌘V</b> ein.</li>
            <li>Klicke auf <b>„Hinzufügen“</b>. Ein grünes Häkchen heißt: Karten hinzugefügt. Ein rotes Kreuz heißt: Karte nicht hinzugefügt.</li>
          </ol>
          <div className={styles.cardmarketGuideActions}>
            <a href={wantsUrl} target="_blank" rel="noopener noreferrer" onClick={onCopyAndOpen}>
              Liste erneut kopieren & Cardmarket öffnen <ExternalLink aria-hidden="true" size={16} />
            </a>
            <button type="button" onClick={() => setStep(3)}>Karten sind eingefügt <ArrowRight aria-hidden="true" size={17} /></button>
          </div>
          <Illustrated step={3} />
        </> : null}

        {step === 3 ? <>
          <span className={styles.cardmarketGuideKicker}>Schritt 3</span>
          <h5>Nur gut erhaltene Karten zulassen</h5>
          <div className={styles.cardmarketConditionWarning} role="alert">
            <div>
              <strong>Cardmarket zeigt nach dem Import zunächst „≥ PO“</strong>
              <p>Das bedeutet „Poor oder besser“ – also auch stark abgenutzte Karten. Stelle es jetzt einmal für alle Karten gemeinsam um.</p>
            </div>
            {condition ? (
              <div className={styles.cardmarketConditionTranslation}>
                <span><small>In Cardfolio gewählt</small><b>{condition.cardfolio}</b></span>
                <ArrowRight aria-hidden="true" size={20} />
                <span><small>Bei Cardmarket einstellen</small><b>≥ {condition.code} · {condition.label}</b></span>
              </div>
            ) : (
              <p><b>Die Karten haben unterschiedliche Zustandswünsche.</b> Stelle sie bei Cardmarket gruppenweise gemäß den Cardfolio-Angaben ein.</p>
            )}
            <ol className={styles.cardmarketConditionSteps}>
              <li>Alle Karten markieren (Kästchen in der Titelzeile der Tabelle)</li>
              <li>„Massenveränderung“ öffnen</li>
              <li>Bei „Mindest-Zustand“ {condition ? <b>{condition.code}</b> : "den passenden Wert"} wählen und „Ausgewählte ändern“ klicken</li>
            </ol>
          </div>
          <div className={styles.cardmarketGuideActions}>
            <button type="button" className={styles.cardmarketBackButton} onClick={() => setStep(2)}><ArrowLeft aria-hidden="true" size={16} /> Zurück</button>
            <button type="button" onClick={() => setStep(4)}>Zustand ist eingestellt <ArrowRight aria-hidden="true" size={17} /></button>
          </div>
          <Illustrated step={5} />
        </> : null}

        {step === 4 ? <>
          <span className={styles.cardmarketGuideKicker}>Schritt 4</span>
          <h5>Verkäufer finden und kaufen</h5>
          <ol className={styles.cardmarketInstructionList}>
            <li>Öffne bei Cardmarket den <b>Shopping Wizard</b> (der Einkaufsassistent), wähle deine Wants-Liste und klicke auf <b>„Run Wizard“</b>.</li>
            <li>Bei vielen günstigen Karten: Wähle die Strategie <b>„Reduce Shipments“</b>. Dann kommen die Karten von möglichst wenigen Verkäufern. Das spart meist Versand, kann die Karten selbst aber teurer machen. „Reduce Price“ sucht dagegen den niedrigsten Gesamtpreis, auch bei mehr Sendungen.</li>
            <li>Neu bei Cardmarket? „Add All to Cart“ funktioniert erst nach <b>sechs abgeschlossenen Käufen</b>. Lege die gefundenen Angebote dann einzeln in den Warenkorb.</li>
            <li>Prüfe vor dem Bezahlen Endpreis, Versand, Sprache und Zustand.</li>
          </ol>
          <div className={styles.cardmarketGuideActions}>
            <button type="button" className={styles.cardmarketBackButton} onClick={() => setStep(3)}><ArrowLeft aria-hidden="true" size={16} /> Zurück</button>
            <a className={styles.cardmarketFinalAction} href={wantsUrl} target="_blank" rel="noopener noreferrer">
              Cardmarket öffnen <ExternalLink aria-hidden="true" size={17} />
            </a>
          </div>
          <Illustrated step={6} />
          <small>
            Der Wizard durchsucht nicht alle Angebote. Wirkt das Ergebnis zu teuer, schau selbst nach oder wähle andere Karten. Preise, Versand und die endgültige Auswahl bestätigst du erst bei Cardmarket.{" "}
            <a href={wizardHelpUrl} target="_blank" rel="noopener noreferrer">Hilfe von Cardmarket zum Shopping Wizard <ExternalLink aria-hidden="true" size={13} /></a>
          </small>
        </> : null}
      </div>
    </section>
  );
}
