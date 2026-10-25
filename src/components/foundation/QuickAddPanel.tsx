"use client";

import { LoaderCircle, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { findSetByText, resolveNumbers, type ResolvedNumber } from "@/data/catalog/quick-add-resolver";
import { searchCatalogSets } from "@/data/catalog/set-counts";
import type { CatalogSetIndexEntry } from "@/domain/catalog-set";
import { conditionProfile } from "@/domain/purchase-preferences";
import { parseQuickAddText, planQuickAdd, type QuickAddChange } from "@/domain/quick-add";
import type { Binder, CardLanguage, CatalogAdapter, OwnedCondition } from "@/domain/types";

import { SetLogo } from "./SetLogo";
import styles from "./quick-add-panel.module.css";

const CONDITIONS: readonly OwnedCondition[] = ["near-mint", "excellent", "lightly-played", "played"];

interface Group {
  key: string;
  setId?: string;
  setName: string;
  language: CardLanguage;
  rows: ResolvedNumber[];
  invalid: string[];
  error?: string;
}

function setLabel(entry: CatalogSetIndexEntry, language: CardLanguage): string {
  return entry.names[language] ?? entry.names.de ?? entry.names.en ?? entry.id;
}

/** Types or pastes collector numbers, checks them against the catalogue and enters the cards as owned. */
export function QuickAddPanel({ catalog, binder, onApply, onClose }: {
  catalog: CatalogAdapter;
  binder: Binder;
  onApply: (changes: QuickAddChange[], condition?: OwnedCondition) => Promise<void>;
  onClose: () => void;
}) {
  const [language, setLanguage] = useState<CardLanguage>("de");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CatalogSetIndexEntry>();
  const [text, setText] = useState("");
  const [condition, setCondition] = useState<OwnedCondition | "">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [groups, setGroups] = useState<Group[]>();
  const abort = useRef<AbortController>(undefined);

  const suggestions = useMemo(() => (query.trim().length >= 2 && !selected ? searchCatalogSets(query, language).slice(0, 6) : []), [query, selected, language]);
  const changes = useMemo(() => groups ? planQuickAdd(binder, groups.flatMap((group) => group.rows.flatMap((row) => (row.card ? [{ card: row.card, quantity: row.token.quantity }] : [])))) : [], [groups, binder]);
  const notFound = groups?.reduce((sum, group) => sum + group.rows.filter((row) => !row.card).length, 0) ?? 0;

  async function check() {
    setError(undefined);
    const sections = parseQuickAddText(text);
    if (sections.length === 0 || sections.every((section) => section.tokens.length === 0)) {
      setError("Gib mindestens eine Kartennummer ein, zum Beispiel „4 5 6 10-15 25x2“.");
      return;
    }
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setBusy(true);
    try {
      const next: Group[] = [];
      for (const section of sections) {
        const named = section.setText ? findSetByText(section.setText, language) : { entry: selected, candidates: [] as CatalogSetIndexEntry[] };
        if (!named.entry) {
          next.push({ key: section.setText || "—", setName: section.setText || "Kein Set gewählt", language, rows: [], invalid: section.invalid, error: section.setText
            ? (named.candidates.length > 0 ? `Set nicht eindeutig. Meintest du: ${named.candidates.map((entry) => setLabel(entry, language)).join(", ")}?` : "Dieses Set wurde nicht gefunden.")
            : "Wähle oben ein Set oder schreibe „Setname: Nummern“." });
          continue;
        }
        const rows = await resolveNumbers(catalog, language, named.entry.id, section.tokens, controller.signal);
        next.push({ key: named.entry.id, setId: named.entry.id, setName: setLabel(named.entry, language), language, rows, invalid: section.invalid });
      }
      if (!controller.signal.aborted) setGroups(next);
    } catch {
      if (!controller.signal.aborted) setError("Der Kartenkatalog hat nicht geantwortet. Versuche es später noch einmal.");
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  async function apply() {
    setBusy(true);
    try {
      await onApply(changes, condition || undefined);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.panel} aria-label="Karten schnell erfassen">
      <header>
        <div>
          <p className={styles.eyebrow}>Schnell erfassen</p>
          <h2>Karten per Nummer eintragen</h2>
        </div>
        <button type="button" className={styles.close} onClick={() => { abort.current?.abort(); onClose(); }} aria-label="Schnell erfassen schließen"><X size={18} /></button>
      </header>

      {!groups ? (
        <div className={styles.form}>
          <fieldset className={styles.language}>
            <legend>Kartensprache</legend>
            {(["de", "en"] as const).map((value) => (
              <label key={value}><input type="radio" name="quick-add-language" checked={language === value} onChange={() => { setLanguage(value); setSelected(undefined); }} /> {value === "de" ? "Deutsch" : "Englisch"}</label>
            ))}
          </fieldset>

          <div className={styles.setBox}>
            <label htmlFor="quick-add-set">Set</label>
            {selected ? (
              <p className={styles.chosen}><SetLogo setId={selected.id} language={language} className={styles.logo} /><strong>{setLabel(selected, language)}</strong><button type="button" onClick={() => { setSelected(undefined); setQuery(""); }}>Ändern</button></p>
            ) : (
              <input id="quick-add-set" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Set suchen, zum Beispiel Base Set oder 151" autoComplete="off" />
            )}
            {suggestions.length > 0 ? (
              <ul className={styles.suggestions} aria-label="Gefundene Sets">
                {suggestions.map((entry) => (
                  <li key={entry.id}><button type="button" onClick={() => { setSelected(entry); setQuery(""); }}><SetLogo setId={entry.id} language={language} className={styles.logo} /><span>{setLabel(entry, language)}<small>{entry.releaseDate?.slice(0, 4)} · {entry.cardCount.total} Karten</small></span></button></li>
                ))}
              </ul>
            ) : null}
          </div>

          <label className={styles.numbers}>
            <span>Kartennummern</span>
            <textarea value={text} onChange={(event) => setText(event.target.value)} rows={5} placeholder={"4 5 6 10-15 25x2\nFür mehrere Sets: eine Zeile pro Set, zum Beispiel  Jungle: 1 2 3"} spellCheck={false} />
            <small>Nummern mit Leerzeichen, Komma oder Zeilenumbruch trennen. „10-15“ ist ein Bereich, „25x2“ sind zwei Exemplare, „004“ ist 4.</small>
          </label>

          <label className={styles.condition}>
            <span>Zustand (optional, für alle)</span>
            <select value={condition} onChange={(event) => setCondition(event.target.value as OwnedCondition | "")}>
              <option value="">Nicht eintragen</option>
              {CONDITIONS.map((value) => <option key={value} value={value}>{conditionProfile(value).shortLabel}</option>)}
            </select>
          </label>

          {error ? <p className={styles.error} role="alert">{error}</p> : null}
          <div className={styles.actions}>
            <button type="button" className={styles.primary} disabled={busy} onClick={() => void check()}>{busy ? <><LoaderCircle className={styles.spin} size={16} aria-hidden="true" /> Karten werden gesucht …</> : "Karten prüfen"}</button>
          </div>
        </div>
      ) : (
        <div className={styles.review}>
          {groups.map((group) => (
            <section key={group.key} className={styles.group} aria-label={group.setName}>
              <h3>{group.setId ? <SetLogo setId={group.setId} language={group.language} className={styles.logo} /> : null}{group.setName}</h3>
              {group.error ? <p className={styles.error}>{group.error}</p> : null}
              {group.invalid.length > 0 ? <p className={styles.error}>Nicht lesbar: {group.invalid.join(", ")}</p> : null}
              <ul>
                {group.rows.map((row) => {
                  const change = row.card ? changes.find((candidate) => candidate.card.key === row.card!.key) : undefined;
                  return (
                    <li key={row.token.number} data-found={Boolean(row.card)}>
                      <span className={styles.number}>Nr. {row.token.number}</span>
                      <span>{row.card ? row.card.name : row.problem === "error" ? "Konnte nicht geladen werden" : "Nicht im Katalog gefunden"}</span>
                      <span className={styles.quantity}>{row.token.quantity > 1 ? `${row.token.quantity}×` : ""}</span>
                      <small>{change?.existingEntryId ? (change.alreadyOwned > 0 ? `schon im Binder (${change.alreadyOwned}×), Menge wird erhöht` : "schon im Binder, wird als vorhanden markiert") : ""}</small>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
          <p className={styles.summary} role="status">{changes.length} {changes.length === 1 ? "Karte wird" : "Karten werden"} eingetragen{notFound > 0 ? `, ${notFound} nicht gefunden` : ""}.</p>
          <div className={styles.actions}>
            <button type="button" className={styles.secondary} onClick={() => setGroups(undefined)} disabled={busy}>Zurück</button>
            <button type="button" className={styles.primary} disabled={busy || changes.length === 0} onClick={() => void apply()}>{busy ? "Wird eingetragen …" : `${changes.length} ${changes.length === 1 ? "Karte" : "Karten"} als vorhanden eintragen`}</button>
          </div>
        </div>
      )}
    </section>
  );
}
