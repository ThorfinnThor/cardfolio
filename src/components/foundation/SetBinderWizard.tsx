"use client";

import { ArrowLeft, Check, LoaderCircle, Search } from "lucide-react";
import { useMemo, useState } from "react";

import type { CatalogSetIndexEntry } from "@/domain/catalog-set";
import { createSetBinderPlan, type SetBinderPlan } from "@/domain/set-binder-plan";
import type { CatalogAdapter, CardLanguage, CardSnapshot } from "@/domain/types";

import { CardArtwork } from "./CardArtwork";
import styles from "./foundation-workspace.module.css";

interface SetBinderWizardProps {
  catalog: CatalogAdapter;
  sets: readonly CatalogSetIndexEntry[];
  onCancel: () => void;
  onCreate: (plan: SetBinderPlan, name: string) => Promise<void>;
}

export function SetBinderWizard({ catalog, sets, onCancel, onCreate }: SetBinderWizardProps) {
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState<CardLanguage>("de");
  const [scope, setScope] = useState<"official-numbered" | "complete-catalog">("official-numbered");
  const [variantStrategy, setVariantStrategy] = useState<"one-per-card" | "all-confirmed-finishes">("one-per-card");
  const [selectedId, setSelectedId] = useState<string>();
  const [plan, setPlan] = useState<SetBinderPlan>();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const visibleSets = useMemo(() => {
    const terms = query.trim().toLocaleLowerCase("de-DE").split(/\s+/).filter(Boolean);
    return sets.filter((entry) => entry.names[language] && terms.every((term) => [entry.id, entry.names.de, entry.names.en, entry.series.de?.name, entry.series.en?.name]
      .filter(Boolean)
      .some((value) => value!.toLocaleLowerCase("de-DE").includes(term))));
  }, [language, query, sets]);
  const selectedSet = visibleSets.find((entry) => entry.id === selectedId);
  const displayName = selectedSet?.names.de ?? selectedSet?.names[language] ?? selectedSet?.id ?? "";

  async function loadSet() {
    if (!selectedSet) return;
    setLoading(true);
    setError(undefined);
    setPlan(undefined);
    try {
      const items = new Map<string, { ref: { provider: "tcgdex"; id: string; language: CardLanguage } }>();
      let page = 1;
      let hasMore = true;
      while (hasMore && page <= 20) {
        const result = await catalog.search({ language, setId: selectedSet.id, page, pageSize: 100 });
        for (const item of result.items) {
          const belongsToSelectedSet = item.setId === selectedSet.id || item.ref.id.startsWith(`${selectedSet.id}-`);
          if (belongsToSelectedSet && item.ref.language === language) items.set(item.ref.id, item);
        }
        hasMore = result.hasMore;
        page += 1;
      }
      if (!items.size) throw new Error("Für dieses Set wurden in der gewählten Kartensprache keine physischen Karten gefunden.");
      const cards: CardSnapshot[] = [];
      const exactItems = [...items.values()];
      for (let index = 0; index < exactItems.length; index += 6) {
        const batch = await Promise.all(exactItems.slice(index, index + 6).map((item) => catalog.getCard(item.ref)));
        cards.push(...batch.filter((card) => card.physicalStatus !== "digital" && card.setId === selectedSet.id && card.ref.language === language));
      }
      if (!cards.length) throw new Error("Der Kartenkatalog hat für dieses Set keine eindeutig zuordenbaren Karten geliefert.");
      const nextPlan = createSetBinderPlan({
        setId: selectedSet.id,
        setName: displayName,
        language,
        scope,
        variantStrategy,
        catalogCardCount: selectedSet.cardCount,
        cards,
      });
      setPlan(nextPlan);
      setName(displayName);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Das Set konnte nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }

  async function create() {
    if (!plan || !name.trim()) return;
    setSubmitting(true);
    try {
      await onCreate(plan, name.trim());
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className={styles.setWizard} aria-labelledby="set-wizard-heading">
      <div className={styles.setWizardHeader}>
        <button type="button" className={styles.secondaryButton} onClick={onCancel}><ArrowLeft size={16} /> Zurück</button>
        <div><p className={styles.eyebrow}>Geführter Start</p><h1 id="set-wizard-heading">Binder mit einem Set erstellen</h1><p>Wähle Sprache und Umfang. Vor dem Speichern siehst du Kartenanzahl, Seiten und offene Varianten.</p></div>
      </div>
      <div className={styles.setWizardControls}>
        <label><span>Set suchen</span><div className={styles.searchLabel}><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="z. B. Grundset oder Base Set" /></div></label>
        <label><span>Kartensprache</span><select value={language} onChange={(event) => { setLanguage(event.target.value as CardLanguage); setSelectedId(undefined); setPlan(undefined); setError(undefined); }}><option value="de">Deutsch</option><option value="en">Englisch</option></select></label>
        <label><span>Umfang</span><select value={scope} onChange={(event) => { setScope(event.target.value as typeof scope); setPlan(undefined); }}><option value="official-numbered">Offizielle Nummern</option><option value="complete-catalog">Kompletter Katalog</option></select></label>
        <label><span>Varianten</span><select value={variantStrategy} onChange={(event) => { setVariantStrategy(event.target.value as typeof variantStrategy); setPlan(undefined); }}><option value="one-per-card">Eine Ausgabe pro Karte</option><option value="all-confirmed-finishes">Alle bestätigten Finishes</option></select></label>
      </div>
      {!plan ? (
        <div className={styles.setWizardSetList} aria-label="Sets auswählen">
          {visibleSets.slice(0, 80).map((entry) => {
            const label = entry.names.de ?? entry.names[language] ?? entry.id;
            const languageName = entry.names[language];
            const translatedName = language === "en" && languageName !== label ? `Englischer Setname: ${languageName} · ` : "";
            const seriesName = entry.series.de?.name ?? entry.series[language]?.name ?? "Serie unbekannt";
            return <button type="button" key={entry.id} className={`${styles.setWizardSet} ${selectedId === entry.id ? styles.setWizardSetActive : ""}`} onClick={() => { setSelectedId(entry.id); setError(undefined); }}><span><strong>{label}</strong><small>{translatedName}{seriesName} · {entry.cardCount.total} Karten</small></span>{selectedId === entry.id ? <Check size={18} /> : null}</button>;
          })}
          {!visibleSets.length ? <p className={styles.searchHint}>Keine Sets gefunden.</p> : null}
        </div>
      ) : null}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {loading ? <p className={styles.previewLoading} role="status"><LoaderCircle size={16} className={styles.spin} /> Kartendaten werden geladen…</p> : null}
      {!plan ? <button type="button" className={styles.primaryButton} disabled={!selectedSet || loading} onClick={() => void loadSet()}>Set prüfen</button> : (
        <div className={styles.setWizardPreview}>
          <div className={styles.setWizardSummary}><strong>{plan.selectedCardCount} Karten · {plan.pageCount} Seiten</strong><span>{plan.coverageComplete ? "Katalog vollständig" : plan.issues[0]}</span>{plan.reviewRequiredCount ? <span>{plan.reviewRequiredCount} Varianten später prüfen</span> : null}</div>
          {plan.issues.map((issue) => <p className={styles.warning} role="note" key={issue}>{issue}</p>)}
          <label className={styles.dialogField} htmlFor="set-binder-name"><span>Bindername</span><input id="set-binder-name" value={name} maxLength={100} onChange={(event) => setName(event.target.value)} /></label>
          <div className={styles.setWizardCards}>{plan.entries.slice(0, 12).map((entry) => <article key={`${entry.card.key}-${entry.variant.finish}`}><CardArtwork card={entry.card} className={styles.setWizardCardImage} fallback={<div className={styles.previewImageFallback}>Kein Bild</div>} /><strong>{entry.card.name}</strong><small>{entry.card.collectorNumber} · {entry.variant.finish}</small></article>)}</div>
          {plan.entries.length > 12 ? <p className={styles.searchHint}>Weitere {plan.entries.length - 12} Karten werden beim Anlegen automatisch eingeplant.</p> : null}
          <div className={styles.dialogActions}><button type="button" className={styles.secondaryButton} onClick={() => setPlan(undefined)}>Andere Auswahl</button><button type="button" className={styles.confirmButton} disabled={!name.trim() || submitting} onClick={() => void create()}>{submitting ? "Wird angelegt…" : "Binder anlegen"}</button></div>
        </div>
      )}
    </section>
  );
}
