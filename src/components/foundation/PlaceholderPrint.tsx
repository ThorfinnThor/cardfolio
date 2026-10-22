"use client";

import { Printer, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { createPlaceholders, placeholderSheets, type PlaceholderOptions } from "@/domain/placeholders";
import type { Binder, CardSnapshot } from "@/domain/types";

import styles from "./placeholder-print.module.css";

/**
 * Text-only stand-ins in card size (63 × 88 mm, nine per A4 sheet) for a physical binder. The print sheets live in a
 * portal on <body>; while this dialog is open the print stylesheet hides everything else.
 */
export function PlaceholderPrint({ binder, cards, onClose }: { binder: Binder; cards: ReadonlyMap<string, CardSnapshot>; onClose: () => void }) {
  const [options, setOptions] = useState<PlaceholderOptions>({ missing: true, free: false });
  const placeholders = useMemo(() => createPlaceholders(binder, cards, options), [binder, cards, options]);
  const sheets = useMemo(() => placeholderSheets(placeholders), [placeholders]);

  useEffect(() => {
    document.documentElement.classList.add("printing-placeholders");
    return () => document.documentElement.classList.remove("printing-placeholders");
  }, []);

  return (
    <>
      <div className={styles.backdrop}>
        <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="placeholder-print-heading">
          <header>
            <h2 id="placeholder-print-heading">Platzhalter drucken</h2>
            <button type="button" className={styles.close} onClick={onClose} aria-label="Schließen"><X size={18} /></button>
          </header>
          <p>Kartengroße Zettel (63 × 88 mm, neun pro A4-Seite) für die Taschen deines Binders, bis die echte Karte da ist. Sie zeigen nur Seite, Platz, Name, Set und Nummer, keine Kartenbilder.</p>
          <fieldset>
            <legend>Was soll gedruckt werden?</legend>
            <label><input type="checkbox" checked={options.missing} onChange={(event) => setOptions((current) => ({ ...current, missing: event.target.checked }))} /> Fehlende Karten</label>
            <label><input type="checkbox" checked={options.free} onChange={(event) => setOptions((current) => ({ ...current, free: event.target.checked }))} /> Freie Plätze (leer, nur mit Position)</label>
          </fieldset>
          <p className={styles.count} role="status">{placeholders.length === 0 ? "Nichts zu drucken. Wähle oben mindestens eine Art oder plane Karten im Binder." : `${placeholders.length} ${placeholders.length === 1 ? "Platzhalter" : "Platzhalter"} auf ${sheets.length} ${sheets.length === 1 ? "Seite" : "Seiten"}`}</p>
          <p className={styles.hint}>Stelle im Druckdialog „Skalierung 100 %“ und „Ränder: keine“ ein, damit die Zettel 63 × 88 mm groß bleiben.</p>
          <div className={styles.actions}>
            <button type="button" className={styles.secondary} onClick={onClose}>Schließen</button>
            <button type="button" className={styles.primary} disabled={placeholders.length === 0} onClick={() => window.print()}><Printer aria-hidden="true" size={16} /> Drucken</button>
          </div>
        </section>
      </div>
      {createPortal(
        <div data-placeholder-print className={styles.printRoot}>
          {sheets.map((sheet, sheetIndex) => (
            <section className={styles.sheet} key={sheetIndex} aria-hidden="true">
              {sheet.map((placeholder) => (
                <article className={styles.card} key={placeholder.position} data-kind={placeholder.kind}>
                  <small>{placeholder.position}</small>
                  {placeholder.kind === "missing" ? (
                    <>
                      <strong>{placeholder.name}</strong>
                      <span>{placeholder.setName}</span>
                      <span>Nr. {placeholder.collectorNumber} · {placeholder.language === "de" ? "Deutsch" : "Englisch"}</span>
                      {placeholder.variant ? <em>{placeholder.variant}</em> : null}
                      <p>Platzhalter · Karte fehlt noch</p>
                    </>
                  ) : <p>Freier Platz</p>}
                </article>
              ))}
            </section>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}
