import type { ReactNode } from "react";

import styles from "./howto.module.css";

/**
 * Simplified redrawings of the Cardmarket screens a first-time buyer meets. They are our own drawings, not
 * screenshots: no logo, no account data, labels as seen on the German Wants page (checked October 2026).
 * The real page may look slightly different. The drawings are hidden from assistive technology; each is
 * placed in a <figure> whose caption says the same in words.
 */

function Hint({ n, children }: { n: number; children?: ReactNode }) {
  return <span className={styles.hint} data-n={n}>{children}</span>;
}

type ToolbarTarget = "deck" | "sellers" | "wizard";

export function MockToolbar({ highlight }: { highlight?: ToolbarTarget }) {
  return (
    <div className={styles.mock} aria-hidden="true">
      <div className={styles.mockTitle}>Evoli-Geschenk</div>
      <div className={styles.mockToolbar}>
        <span className={styles.btnGreen}>+ Wants hinzufügen</span>
        <span className={styles.btnGreenOutline} data-hl={highlight === "deck" || undefined}>+ Deck-Liste hinzufügen{highlight === "deck" ? <Hint n={1} /> : null}</span>
        <span className={styles.spacer} />
        <span className={styles.btnNavyOutline} data-hl={highlight === "sellers" || undefined}>Verkäufer mit den meisten Karten{highlight === "sellers" ? <Hint n={2} /> : null}</span>
        <span className={styles.btnNavy} data-hl={highlight === "wizard" || undefined}>Shopping Wizard{highlight === "wizard" ? <Hint n={1} /> : null}</span>
      </div>
    </div>
  );
}

export function MockPaste() {
  return (
    <div className={styles.mock} aria-hidden="true">
      <div className={styles.mockTitle}>Deck-Liste hinzufügen</div>
      <div className={styles.pasteBox}>
        <span>1x Evoli Tackle Sprint</span>
        <span>1x Evoli Fähigkeit Tritt</span>
        <span>1x Evoli Nagen</span>
        <Hint n={1} />
      </div>
      <div className={styles.pasteActions}>
        <span className={styles.btnGreen} data-hl="true">Hinzufügen<Hint n={2} /></span>
      </div>
      <ul className={styles.results}>
        <li><b className={styles.ok}>✓</b> Evoli – hinzugefügt</li>
        <li><b className={styles.ok}>✓</b> Evoli – hinzugefügt</li>
        <li><b className={styles.bad}>✕</b> Karte nicht gefunden</li>
      </ul>
    </div>
  );
}

const SAMPLE_ROWS = ["Evoli [Tackle | Sprint]", "Evoli [Nagen | Schweifvertrimmer]", "Evoli [Tritt | Aufmuntern]"];

export function MockWantsTable({ condition, markSelectAll = false, showCount = false }: { condition: "PO" | "EX"; markSelectAll?: boolean; showCount?: boolean }) {
  return (
    <div className={styles.mock} aria-hidden="true">
      {showCount ? <div className={styles.countLine} data-hl="true">9 Wants – 9 Karten<Hint n={1} /></div> : null}
      <div className={styles.table}>
        <div className={styles.tableHead}>
          <span className={styles.checkbox} data-checked="true" data-hl={markSelectAll || undefined}>{markSelectAll ? <Hint n={1} /> : null}</span>
          <span>Karte</span>
          <span>Zustand</span>
        </div>
        {SAMPLE_ROWS.map((name) => (
          <div className={styles.tableRow} key={name}>
            <span className={styles.checkbox} data-checked="true" />
            <span className={styles.cardName}>{name}</span>
            <span className={condition === "PO" ? styles.badgeRed : styles.badgeBlue}>≥ {condition}</span>
          </div>
        ))}
        <div className={styles.tableMore}>…</div>
      </div>
    </div>
  );
}

export function MockMassChange({ value }: { value: string }) {
  return (
    <div className={styles.mock} aria-hidden="true">
      <div className={styles.panelHead}>Massenveränderung<Hint n={2} /></div>
      <div className={styles.fields}>
        <label><small>Kaufpreis</small><span className={styles.field}>0.00</span></label>
        <label><small>Sprachen</small><span className={styles.field}>&nbsp;</span></label>
        <label data-hl="true"><small>Mindest-Zustand</small><span className={styles.field}>{value} <i>▾</i></span><Hint n={3} /></label>
        <label><small>Reverse Holo</small><span className={styles.field}>&nbsp;</span></label>
      </div>
      <div className={styles.panelActions}>
        <span className={styles.btnNavyOutline} data-hl="true">Ausgewählte ändern<Hint n={4} /></span>
        <span className={styles.btnRedOutline}>Ausgewählte löschen</span>
      </div>
    </div>
  );
}
