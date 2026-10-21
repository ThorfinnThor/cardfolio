"use client";

import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

import { CARDTRADER_AFFILIATE_NOTICE, CARDTRADER_SHOP_OPTIMIZER_URL } from "@/config/cardtrader";
import { prepareCardtraderHandoff, type CardtraderHandoff } from "@/data/marketplace/cardtrader-handoff";
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

export function CardTraderMarketplacePanel({ items }: { items: readonly MissingItem[] }) {
  const [handoff, setHandoff] = useState<CardtraderHandoff>();
  const signature = items.map((item) => `${item.identityKey}:${item.quantity}:${item.preferences.minimumCondition}`).join("|");

  useEffect(() => {
    let cancelled = false;
    void prepareCardtraderHandoff(items).then((result) => { if (!cancelled) setHandoff(result); });
    return () => { cancelled = true; };
    // The signature stands for the items; the array itself changes identity on every render pass.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  const totalQuantity = items.reduce((total, item) => total + item.quantity, 0);
  const entryFor = (key: string) => handoff?.entries.find((entry) => entry.identityKey === key);
  const conditions = new Set(items.map((item) => item.preferences.minimumCondition));
  const sharedCondition = conditions.size === 1 ? conditionProfile([...conditions][0]!).shortLabel : undefined;

  return (
    <section className={styles.marketplacePanel} aria-labelledby="cardtrader-handoff-heading">
      <div className={styles.marketplaceHeader}>
        <div>
          <p className={styles.eyebrow}>Marktplatz</p>
          <h3 id="cardtrader-handoff-heading">{items.length === 1 ? "1 Karte" : `${totalQuantity} Karten`} bei CardTrader kaufen</h3>
          <p>{items.length} Positionen · gekauft wird erst bei CardTrader</p>
        </div>
        <a href={CARDTRADER_SHOP_OPTIMIZER_URL} target="_blank" rel="noopener noreferrer">Shop Optimizer öffnen <ExternalLink aria-hidden="true" size={14} /></a>
      </div>

      <p className={styles.affiliateNotice}>{CARDTRADER_AFFILIATE_NOTICE}</p>

      <ol className={`${styles.handoffSteps} ${styles.numberedSteps}`} aria-label="So kaufst du bei CardTrader">
        <li>Öffne den Shop Optimizer. Dort legst du eine Liste an und wählst später, wie die Verkäufer ausgesucht werden.</li>
        <li>Füge deine Karten hinzu. Unten findest du zu jeder Karte die Seite bei CardTrader mit Set, Nummer und allen Angeboten.</li>
        <li>Stelle Sprache und Mindestzustand{sharedCondition ? ` (${sharedCondition})` : ""} ein, prüfe Gesamtpreis und Versand und zahle erst dort.</li>
      </ol>

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

      <p className={styles.reviewExplanation}>Your Card Binder legt nichts in deinen Warenkorb und kauft nichts. Prüfe Set, Kartennummer, Sprache, Finish, Edition und Zustand vor dem Kauf.</p>
    </section>
  );
}
