"use client";

import { ArrowLeft, ArrowRight, Check, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

import { CARDTRADER_AFFILIATE_NOTICE, CARDTRADER_SHOP_OPTIMIZER_URL } from "@/config/cardtrader";
import { prepareCardtraderHandoff, type CardtraderHandoff } from "@/data/marketplace/cardtrader-handoff";
import { createCardtraderWishlist, planCardtraderWishlist, type CardtraderWishlistResult } from "@/data/marketplace/cardtrader-wishlist";
import { formatCollectorNumber } from "@/domain/catalog-search";
import { conditionProfile } from "@/domain/purchase-preferences";
import type { MissingItem } from "@/domain/types";

import styles from "./missing-cards-panel.module.css";

function euro(amountMinor: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(amountMinor / 100);
}

/** The short, factual comparison shown next to the provider choice. It names no winner: shipping decides and is only known on the marketplace. */
export function MarketplaceComparison() {
  return (
    <div className={styles.marketplaceComparison} aria-label="Cardmarket und CardTrader im Vergleich">
      <div>
        <strong>Cardmarket</strong>
        <ul>
          <li>Größter Marktplatz für Pokémon-Karten in Europa.</li>
          <li>Du fügst die ganze Liste auf einmal ein, und der Shopping Wizard stellt die Bestellung zusammen.</li>
          <li>Versand wird pro Verkäufer berechnet.</li>
        </ul>
      </div>
      <div>
        <strong>CardTrader</strong>
        <ul>
          <li>Mit CardTrader Zero können Karten mehrerer Verkäufer in einer Sendung ankommen.</li>
          <li>Der Shop Optimizer wählt Verkäufer nach Preis, Anzahl der Verkäufer oder Tempo.</li>
          <li>Du legst deine Liste dort selbst an; Your Card Binder zeigt zu jeder Karte die passende Seite.</li>
        </ul>
      </div>
      <p>Welcher Weg günstiger ist, hängt vom Versand und von den Verkäufern ab. Beides siehst du erst vor dem Kauf, deshalb vergleichen wir keine Endpreise vorab.</p>
    </div>
  );
}

const GUIDE_STEPS = [
  { step: 1, label: "Karten prüfen" },
  { step: 2, label: "Liste anlegen" },
  { step: 3, label: "Shop Optimizer" },
  { step: 4, label: "Kauf prüfen" },
] as const;

const cards = (count: number) => (count === 1 ? "1 Karte" : `${count} Karten`);
const CARDTRADER_API_DOCS_URL = "https://www.cardtrader.com/en-EU/docs/api/full/reference";

const WISHLIST_ERRORS: Record<Extract<CardtraderWishlistResult, { ok: false }>["reason"], string> = {
  "invalid-token": "Das sieht nicht wie ein CardTrader-Token aus. Kopiere es vollständig und ohne Leerzeichen aus deinem Konto.",
  unauthorized: "CardTrader hat das Token abgelehnt. Prüfe, ob es vollständig und noch gültig ist.",
  "rate-limited": "CardTrader bittet gerade um eine Pause. Versuche es in einer Minute erneut.",
  rejected: "CardTrader hat die Liste nicht angenommen. Du kannst ohne Wunschliste weitermachen.",
  "invalid-response": "CardTrader hat geantwortet, aber wir können nicht sicher sagen, ob die Liste angelegt wurde. Prüfe deine Wunschlisten bei CardTrader, bevor du es erneut versuchst.",
  network: "Die Verbindung zu CardTrader ist fehlgeschlagen. Du kannst es erneut versuchen oder ohne Wunschliste weitermachen.",
};

export function CardTraderMarketplacePanel({ items, wishlistEnabled = false }: { items: readonly MissingItem[]; wishlistEnabled?: boolean }) {
  const [handoff, setHandoff] = useState<CardtraderHandoff>();
  const [guideStep, setGuideStep] = useState(1);
  // The token lives only in this state: never in storage, a URL, a backup or a log.
  const [token, setToken] = useState("");
  const [wishlist, setWishlist] = useState<{ signature: string; state: "sending" | "created" | "error"; error?: string }>();
  const signature = items.map((item) => `${item.identityKey}:${item.quantity}:${item.preferences.minimumCondition}`).join("|");

  useEffect(() => {
    let cancelled = false;
    void prepareCardtraderHandoff(items).then((result) => { if (!cancelled) setHandoff(result); });
    return () => { cancelled = true; };
    // The signature stands for the items; the array itself changes identity on every render pass.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  // A changed list makes an earlier wishlist outdated.
  const wishlistState = wishlist?.signature === signature ? wishlist.state : "idle";
  const wishlistError = wishlist?.signature === signature ? wishlist.error : undefined;
  const totalQuantity = items.reduce((total, item) => total + item.quantity, 0);
  const entryFor = (key: string) => handoff?.entries.find((entry) => entry.identityKey === key);
  const conditions = new Set(items.map((item) => item.preferences.minimumCondition));
  const sharedCondition = conditions.size === 1 ? conditionProfile([...conditions][0]!).shortLabel : undefined;
  const wishlistName = `Your Card Binder ${new Date().toISOString().slice(0, 10)}`;
  const plan = handoff ? planCardtraderWishlist(items, handoff, wishlistName) : undefined;

  async function createWishlist() {
    if (!plan || wishlistState === "sending") return;
    setWishlist({ signature, state: "sending" });
    const result = await createCardtraderWishlist(token, plan.request);
    if (result.ok) {
      setToken("");
      setWishlist({ signature, state: "created" });
      setGuideStep(3);
      return;
    }
    setWishlist({ signature, state: "error", error: WISHLIST_ERRORS[result.reason] });
  }

  return (
    <section className={styles.marketplacePanel} aria-labelledby="cardtrader-handoff-heading">
      <div className={styles.marketplaceHeader}>
        <div>
          <p className={styles.eyebrow}>CardTrader</p>
          <h3 id="cardtrader-handoff-heading">{items.length === 1 ? "1 Karte" : `${totalQuantity} Karten`} bei CardTrader kaufen</h3>
          <p>{items.length} Positionen · gekauft wird erst bei CardTrader</p>
        </div>
      </div>

      <p className={styles.affiliateNotice}>{CARDTRADER_AFFILIATE_NOTICE}</p>

      <section className={styles.cardmarketGuide} aria-labelledby="cardtrader-guide-heading">
        <header className={styles.cardmarketGuideHeader}>
          <div>
            <span className={styles.stepTag}>Anleitung · 4 Schritte</span>
            <h4 id="cardtrader-guide-heading">CardTrader-Anleitung</h4>
            <p>Erledige nur die groß angezeigte Aufgabe. Danach kommst du zu Your Card Binder zurück und klickst auf „Weiter“.</p>
          </div>
          <strong aria-live="polite">Schritt {guideStep} von {GUIDE_STEPS.length}</strong>
        </header>

        <ol className={styles.cardmarketGuideProgress} aria-label="Fortschritt der CardTrader-Anleitung">
          {GUIDE_STEPS.map((entry) => {
            const status = entry.step < guideStep ? "done" : entry.step === guideStep ? "active" : "todo";
            return (
              <li data-status={status} aria-current={status === "active" ? "step" : undefined} key={entry.step}>
                <span>{status === "done" ? <Check aria-hidden="true" size={15} /> : entry.step}</span>
                <b>{entry.label}</b>
              </li>
            );
          })}
        </ol>

        <div className={styles.cardmarketGuideCard} data-step={guideStep}>
          {guideStep === 1 ? <>
            <span className={styles.cardmarketGuideKicker}>Schritt 1</span>
            <h5>Diese Karten kommen auf deine Liste</h5>
            <p>{handoff ? `${handoff.linkedCount} von ${items.length} Positionen sind sicher einer CardTrader-Karte zugeordnet.` : "Die Zuordnung wird geladen …"} Was nicht sicher zugeordnet ist, bleibt draußen.</p>
            {handoff && handoff.pricedQuantity > 0 ? (
              <p className={styles.cardtraderEstimate} role="status">
                Richtwert: ab ca. <strong>{euro(handoff.pricedTotalMinor)}</strong> für {handoff.pricedQuantity} von {totalQuantity} Karten (günstigste Einzelangebote bei CardTrader im gewählten Zustand, ohne Versand). Der Endpreis hängt von den Verkäufern ab.
              </p>
            ) : null}
            <div className={styles.cardmarketProductSection}>
              <div className={styles.cardmarketProductHeading}>
                <div><h4>Seiten bei CardTrader</h4></div>
                <small>{handoff ? `${handoff.linkedCount} von ${items.length} zugeordnet` : "Wird geladen …"}</small>
              </div>
              <ul>
                {items.map((item) => {
                  const entry = entryFor(item.identityKey);
                  return (
                    <li key={item.identityKey}>
                      <span>
                        <strong>{item.quantity}× {item.card.name}</strong>
                        <small>{item.card.setName} · Nr. {formatCollectorNumber(item.card.collectorNumber, item.card.collectorTotal)} · {item.card.ref.language.toUpperCase()}{entry?.unitPriceMinor ? ` · ab ca. ${euro(entry.unitPriceMinor)}` : ""}</small>
                      </span>
                      {entry?.url
                        ? <a aria-label={`Bei CardTrader ansehen: ${item.card.name}`} href={entry.url} target="_blank" rel="noopener noreferrer">Bei CardTrader ansehen <ExternalLink aria-hidden="true" size={14} /></a>
                        : <small>{handoff ? "Keine sichere Zuordnung" : ""}</small>}
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className={styles.cardmarketGuideActions}>
              <button type="button" onClick={() => setGuideStep(2)}>Weiter <ArrowRight aria-hidden="true" size={17} /></button>
            </div>
          </> : null}

          {guideStep === 2 ? <>
            <span className={styles.cardmarketGuideKicker}>Schritt 2</span>
            <h5>Liste bei CardTrader anlegen</h5>
            {wishlistEnabled && plan ? <>
              <p>Your Card Binder kann die Liste in deinem CardTrader-Konto anlegen. Dafür brauchst du dein <b>persönliches API-Token</b> von CardTrader. <a href={CARDTRADER_API_DOCS_URL} target="_blank" rel="noopener noreferrer">So erzeugst du es <ExternalLink aria-hidden="true" size={13} /></a></p>
              <ul className={styles.tokenFacts}>
                <li>Das Token bleibt nur in diesem Fenster. Es wird nicht gespeichert, nicht in Sicherungen übernommen und nicht an uns gesendet.</li>
                <li>Gesendet wird direkt an CardTrader: eine <b>private</b> Liste „{wishlistName}“ mit {plan.request.deck.deck_items_attributes.length === 1 ? "1 Kartenseite" : `${plan.request.deck.deck_items_attributes.length} Kartenseiten`} ({cards(plan.quantity)}), jeweils mit Menge und Sprache.</li>
                {plan.skippedPositions ? <li>{plan.skippedPositions === 1 ? "1 Position" : `${plan.skippedPositions} Positionen`} ohne sichere Zuordnung {plan.skippedPositions === 1 ? "steht" : "stehen"} nicht auf der Liste.</li> : null}
                <li>Es wird nichts gekauft und nichts in einen Warenkorb gelegt.</li>
              </ul>
              <label className={styles.tokenField} htmlFor="cardtrader-token">
                <span>CardTrader-Token</span>
                <input id="cardtrader-token" type="password" autoComplete="off" autoCapitalize="off" spellCheck={false} value={token} onChange={(event) => setToken(event.target.value)} />
              </label>
              {wishlistError ? <p className={styles.error} role="alert">{wishlistError}</p> : null}
              <div className={styles.cardmarketGuideActions}>
                <button type="button" className={styles.cardmarketBackButton} onClick={() => setGuideStep(1)}><ArrowLeft aria-hidden="true" size={16} /> Zurück</button>
                <button type="button" className={styles.secondaryAction} onClick={() => { setToken(""); setGuideStep(3); }}>Ohne Wunschliste weiter</button>
                <button type="button" className={styles.cardmarketFinalAction} disabled={!token.trim() || wishlistState === "sending"} onClick={() => void createWishlist()}>
                  {wishlistState === "sending" ? "Wird angelegt …" : `Wunschliste mit ${cards(plan.quantity)} anlegen`}
                </button>
              </div>
            </> : <>
              <p>{plan ? "Du fügst die Karten im Shop Optimizer selbst hinzu. Die Seiten aus Schritt 1 zeigen dir zu jeder Karte Set, Nummer und alle Angebote." : "Keine der Karten ist sicher einer CardTrader-Karte zugeordnet. Suche sie bei CardTrader selbst oder nutze einen anderen Anbieter."}</p>
              <div className={styles.cardmarketGuideActions}>
                <button type="button" className={styles.cardmarketBackButton} onClick={() => setGuideStep(1)}><ArrowLeft aria-hidden="true" size={16} /> Zurück</button>
                <button type="button" onClick={() => setGuideStep(3)}>Weiter <ArrowRight aria-hidden="true" size={17} /></button>
              </div>
            </>}
          </> : null}

          {guideStep === 3 ? <>
            <span className={styles.cardmarketGuideKicker}>Schritt 3</span>
            <h5>Shop Optimizer öffnen und Verkäufer wählen</h5>
            {wishlistState === "created" ? <p className={styles.cardtraderCreated} role="status"><Check aria-hidden="true" size={16} /> Die Wunschliste „{wishlistName}“ liegt jetzt in deinem CardTrader-Konto.</p> : null}
            <ol className={styles.cardmarketInstructionList}>
              {wishlistState === "created"
                ? <li>Öffne bei CardTrader deine Wunschlisten und wähle <b>„{wishlistName}“</b>.</li>
                : <li>Lege im Shop Optimizer eine Liste an und füge deine Karten hinzu (Seiten aus Schritt 1).</li>}
              <li>Starte den <b>Shop Optimizer</b> und wähle, wie Verkäufer ausgesucht werden: günstigster Preis, wenige Verkäufer oder Tempo.</li>
              <li>Stelle Sprache und Mindestzustand{sharedCondition ? ` (${sharedCondition})` : ""} ein.</li>
            </ol>
            <div className={styles.cardmarketGuideActions}>
              <button type="button" className={styles.cardmarketBackButton} onClick={() => setGuideStep(2)}><ArrowLeft aria-hidden="true" size={16} /> Zurück</button>
              <a className={styles.cardmarketFinalAction} href={CARDTRADER_SHOP_OPTIMIZER_URL} target="_blank" rel="noopener noreferrer">Shop Optimizer öffnen <ExternalLink aria-hidden="true" size={17} /></a>
              <button type="button" onClick={() => setGuideStep(4)}>Ich bin im Shop Optimizer fertig <ArrowRight aria-hidden="true" size={17} /></button>
            </div>
          </> : null}

          {guideStep === 4 ? <>
            <span className={styles.cardmarketGuideKicker}>Schritt 4</span>
            <h5>Ergebnis prüfen und bei CardTrader bezahlen</h5>
            <ol className={styles.cardmarketInstructionList}>
              <li>Prüfe, ob alle <b>{totalQuantity} Karten</b> in der Auswahl stehen.</li>
              <li>Kontrolliere Gesamtpreis, Versand, Sprache, Kartenausführung und Zustand.</li>
              <li>Bezahle bei CardTrader. Erst dort wird gekauft.</li>
            </ol>
            <small>Your Card Binder legt nichts in deinen Warenkorb und kauft nichts. Preise, Versand und die endgültige Kartenauswahl bestätigst du erst bei CardTrader.</small>
            <div className={styles.cardmarketGuideActions}>
              <button type="button" className={styles.cardmarketBackButton} onClick={() => setGuideStep(3)}><ArrowLeft aria-hidden="true" size={16} /> Zurück</button>
            </div>
          </> : null}
        </div>
      </section>
    </section>
  );
}
