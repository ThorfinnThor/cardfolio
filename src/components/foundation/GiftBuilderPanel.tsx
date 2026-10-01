"use client";

import { ArrowLeft, ArrowRight, Check, Gift, LoaderCircle, RefreshCw, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import type { GiftCandidateLoader } from "@/data/gift/gift-candidate-loader";
import {
  DeterministicGiftSelectionEngine,
  type GiftCardCandidate,
  type GiftPreferences,
  type GiftSelectionResult,
} from "@/domain/gift-builder";
import type { CardSnapshot, CatalogSearchItem, VariantSelection } from "@/domain/types";
import { isVariantSelectionValid, variantAvailabilityForCard, variantSelectionIssue } from "@/domain/variant-selection";

import { CardArtwork } from "./CardArtwork";
import { VariantFields } from "./VariantFields";
import styles from "./gift-builder.module.css";

export interface GiftBuilderPanelProps {
  loader: Pick<GiftCandidateLoader, "loadCandidatePool" | "hydrateCandidates">;
  pricingEnabled: boolean;
  onCancel: () => void;
  onCreateBinder: (selection: GiftSelectionResult, preferences: GiftPreferences) => Promise<void>;
}

type GiftStep = "details" | "candidates" | "review";

const initialPreferences: GiftPreferences = {
  recipientKind: "friend",
  subjectQuery: "Pikachu",
  targetCardCount: 9,
  budgetMinor: 10000,
  currency: "EUR",
  budgetTolerancePercent: 5,
  preferredLanguage: "en",
  style: "mixed",
};

function defaultVariant(card: CardSnapshot): VariantSelection {
  const availability = variantAvailabilityForCard(card);
  return {
    finish: availability.normal ? "normal" : availability.holo ? "holo" : "reverse",
    edition: "unlimited",
    printing: "shadowed",
  };
}

function formatMoney(amountMinor: number | undefined, currency: GiftPreferences["currency"]): string {
  if (amountMinor === undefined) return "Preis unbekannt";
  return new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(amountMinor / 100);
}

function formatDate(value: string | undefined): string {
  if (!value) return "Zeitpunkt unbekannt";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Zeitpunkt unbekannt" : new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(parsed);
}

function priceSourceLabel(source: GiftCardCandidate["price"]["source"]): string {
  if (source === "tcgdex-cardmarket") return "TCGdex · Cardmarket";
  if (source === "tcgdex-tcgplayer") return "TCGdex · TCGplayer";
  return "Keine Preisquelle";
}

function formatRange(range: GiftCardCandidate["price"]["range"], currency: GiftPreferences["currency"]): string | undefined {
  if (!range) return undefined;
  return `${formatMoney(range.lowMinor, currency)}–${formatMoney(range.highMinor, currency)}`;
}

function selectionRange(selected: GiftCardCandidate[]): GiftCardCandidate["price"]["range"] {
  if (!selected.length || selected.some((candidate) => !candidate.price.range)) return undefined;
  return selected.reduce((sum, candidate) => {
    const range = candidate.price.range;
    return range ? {
      lowMinor: sum.lowMinor + range.lowMinor,
      highMinor: sum.highMinor + range.highMinor,
      lowMetric: "sum",
      highMetric: "sum",
    } : sum;
  }, { lowMinor: 0, highMinor: 0, lowMetric: "sum", highMetric: "sum" });
}

function summarizeSelection(selected: GiftCardCandidate[], preferences: GiftPreferences, issues: GiftSelectionResult["issues"] = []): GiftSelectionResult {
  const unpricedCount = selected.filter((candidate) => candidate.price.amountMinor === undefined).length;
  const approximateCount = selected.filter((candidate) => candidate.price.confidence === "approximate").length;
  const allAmountsKnown = selected.every((candidate) => candidate.price.amountMinor !== undefined);
  const estimatedTotalMinor = allAmountsKnown ? selected.reduce((sum, candidate) => sum + (candidate.price.amountMinor ?? 0), 0) : undefined;
  const allUsable = selected.length > 0 && selected.every((candidate) => candidate.price.confidence === "usable" && candidate.price.currency === preferences.currency);
  const ceiling = preferences.budgetMinor + Math.floor(preferences.budgetMinor * (preferences.budgetTolerancePercent ?? 0) / 100);
  const budgetStatus = !allUsable || estimatedTotalMinor === undefined
    ? "unknown" as const
    : estimatedTotalMinor <= preferences.budgetMinor
      ? "within" as const
      : estimatedTotalMinor <= ceiling
        ? "near" as const
        : "over" as const;
  const nextIssues = new Set(issues);
  if (selected.length < preferences.targetCardCount) nextIssues.add("too-few-candidates");
  if (unpricedCount) nextIssues.add("unknown-prices");
  if (approximateCount) nextIssues.add("approximate-prices");
  return { selected, estimatedTotalMinor, unpricedCount, approximateCount, budgetStatus, issues: [...nextIssues] };
}

function safeCandidate(candidate: GiftCardCandidate, pricingEnabled: boolean, currency: GiftPreferences["currency"]): GiftCardCandidate {
  if (pricingEnabled) return candidate;
  return {
    ...candidate,
    price: {
      currency,
      fetchedAt: candidate.price.fetchedAt,
      confidence: "unknown",
      issues: ["pricing-feature-gated"],
    },
  };
}

export function GiftBuilderPanel({ loader, pricingEnabled, onCancel, onCreateBinder }: GiftBuilderPanelProps) {
  const engine = useMemo(() => new DeterministicGiftSelectionEngine(), []);
  const [step, setStep] = useState<GiftStep>("details");
  const [preferences, setPreferences] = useState<GiftPreferences>(initialPreferences);
  const [briefs, setBriefs] = useState<CatalogSearchItem[]>([]);
  const [candidates, setCandidates] = useState<GiftCardCandidate[]>([]);
  const [selection, setSelection] = useState<GiftSelectionResult>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [showAll, setShowAll] = useState(false);
  const [openVariantKey, setOpenVariantKey] = useState<string>();
  const [excludedKeys, setExcludedKeys] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const updatePreferences = <K extends keyof GiftPreferences>(key: K, value: GiftPreferences[K]) => {
    setPreferences((current) => ({ ...current, [key]: value }));
  };

  async function createProposal() {
    setLoading(true);
    setError(undefined);
    setSelection(undefined);
    setExcludedKeys(new Set());
    try {
      const pool = await loader.loadCandidatePool({
        subjectQuery: preferences.subjectQuery,
        language: preferences.preferredLanguage ?? "en",
        maximum: Math.max(40, preferences.targetCardCount * 3),
        pageSize: 24,
      });
      setBriefs(pool);
      if (!pool.length) {
        setError("Keine Karten mit diesem Namen gefunden. Prüfe Schreibweise oder Sprache.");
        return;
      }
      const hydrated = await loader.hydrateCandidates(pool, {
        currency: preferences.currency,
        variantFor: defaultVariant,
        concurrency: 4,
        preferences: { minimumCondition: "excellent" },
      });
      const safe = hydrated.map((candidate) => safeCandidate(candidate, pricingEnabled, preferences.currency));
      setCandidates(safe);
      setSelection(engine.select({ candidates: safe, preferences }));
      setStep("candidates");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Karten konnten nicht geladen werden. Prüfe die Verbindung und versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }

  function removeCandidate(cardKey: string) {
    if (!selection) return;
    const nextExcluded = new Set(excludedKeys).add(cardKey);
    setExcludedKeys(nextExcluded);
    setSelection(summarizeSelection(selection.selected.filter((candidate) => candidate.card.key !== cardKey), preferences, selection.issues));
  }

  function addCandidate() {
    if (!selection || selection.selected.length >= preferences.targetCardCount) return;
    const next = candidates.find((candidate) => !excludedKeys.has(candidate.card.key) && !selection.selected.some((selected) => selected.card.key === candidate.card.key));
    if (!next) return;
    setSelection(summarizeSelection([...selection.selected, next], preferences, selection.issues));
  }

  function replaceCandidate(cardKey: string) {
    if (!selection) return;
    const replacement = candidates.find((candidate) => !excludedKeys.has(candidate.card.key) && !selection.selected.some((selected) => selected.card.key === candidate.card.key));
    if (!replacement) return;
    const nextExcluded = new Set(excludedKeys).add(cardKey);
    setExcludedKeys(nextExcluded);
    setSelection(summarizeSelection(selection.selected.map((candidate) => candidate.card.key === cardKey ? replacement : candidate), preferences, selection.issues));
  }

  function updateVariant(cardKey: string, variant: VariantSelection) {
    if (!selection) return;
    const card = selection.selected.find((candidate) => candidate.card.key === cardKey);
    if (!card) return;
    const issue = variantSelectionIssue(variant, card.card.availableVariants);
    const nextSelected = selection.selected.map((candidate) => candidate.card.key === cardKey ? {
      ...candidate,
      variant,
      price: issue ? candidate.price : { currency: preferences.currency, fetchedAt: candidate.price.fetchedAt, confidence: "unknown" as const, issues: ["variant-changed-refresh-required"] },
    } : candidate);
    setSelection(summarizeSelection(nextSelected, preferences, selection.issues));
  }

  const reviewReady = Boolean(selection?.selected.length === preferences.targetCardCount
    && selection.selected.every((candidate) => isVariantSelectionValid(candidate.variant, variantAvailabilityForCard(candidate.card))));
  const estimatedRange = selection ? selectionRange(selection.selected) : undefined;

  return (
    <section className={styles.panel} aria-labelledby="gift-builder-heading">
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}><Gift aria-hidden="true" size={15} /> Geschenk erstellen</p>
          <h1 id="gift-builder-heading">Ein persönlicher Kartenbinder</h1>
          <p className={styles.intro}>Wähle Thema, Budget und Umfang. Das Ergebnis bleibt ein normaler, editierbarer Binder.</p>
        </div>
        <button type="button" className={styles.closeButton} onClick={onCancel} aria-label="Gift Builder schließen"><X size={18} /></button>
      </div>

      <ol className={styles.steps} aria-label="Gift-Schritte">
        {(["details", "candidates", "review"] as const).map((item, index) => (
          <li key={item} data-active={step === item} data-done={(["details", "candidates", "review"] as const).indexOf(step) > index}>
            <span>{index + 1}</span>{item === "details" ? "Wünsche" : item === "candidates" ? "Auswahl" : "Prüfen"}
          </li>
        ))}
      </ol>

      {error ? <div className={styles.error} role="alert"><strong>Vorschlag konnte nicht geladen werden</strong><span>{error}</span><button type="button" className={styles.secondaryButton} onClick={() => void createProposal()}><RefreshCw size={15} /> Erneut versuchen</button></div> : null}

      {step === "details" ? (
        <form className={styles.form} onSubmit={(event) => { event.preventDefault(); void createProposal(); }}>
          <div className={styles.formGrid}>
            <label>Für wen?
              <select value={preferences.recipientKind} onChange={(event) => updatePreferences("recipientKind", event.target.value as GiftPreferences["recipientKind"]) }>
                <option value="partner">Partner/in</option><option value="child">Kind</option><option value="friend">Freund/in</option><option value="other">Andere Person</option>
              </select>
            </label>
            <label>Name <span>(nur lokal)</span>
              <input value={preferences.recipientName ?? ""} maxLength={100} onChange={(event) => updatePreferences("recipientName", event.target.value || undefined)} placeholder="Optional" />
            </label>
            <label>Anlass
              <select value={preferences.occasion ?? "other"} onChange={(event) => updatePreferences("occasion", event.target.value as GiftPreferences["occasion"]) }>
                <option value="birthday">Geburtstag</option><option value="christmas">Weihnachten</option><option value="anniversary">Jubiläum</option><option value="other">Andere Gelegenheit</option>
              </select>
            </label>
            <label>Sprache
              <select value={preferences.preferredLanguage ?? "en"} onChange={(event) => updatePreferences("preferredLanguage", event.target.value as "de" | "en") }>
                <option value="de">Deutsch</option><option value="en">English</option>
              </select>
            </label>
          </div>
          <label className={styles.subjectField}>Lieblings-Pokémon oder Thema
            <span className={styles.inputWithIcon}><Search aria-hidden="true" size={17} /><input required value={preferences.subjectQuery} onChange={(event) => updatePreferences("subjectQuery", event.target.value)} placeholder="Zum Beispiel Pikachu" /></span>
          </label>
          <div className={styles.choiceGroup}>
            <fieldset><legend>Umfang</legend><div className={styles.choiceRow}>{([9, 18, 36] as const).map((count) => <label key={count} className={styles.choice}><input type="radio" name="gift-count" checked={preferences.targetCardCount === count} onChange={() => updatePreferences("targetCardCount", count)} />{count} Karten</label>)}</div></fieldset>
            <fieldset><legend>Stil</legend><div className={styles.choiceRow}>{(["mixed", "vintage", "modern", "curated"] as const).map((style) => <label key={style} className={styles.choice}><input type="radio" name="gift-style" checked={preferences.style === style} onChange={() => updatePreferences("style", style)} />{style === "mixed" ? "Mix" : style === "vintage" ? "Vintage" : style === "modern" ? "Modern" : "Kuratiert"}</label>)}</div></fieldset>
          </div>
          <div className={styles.budgetGrid}>
            <label>Maximales Budget
              <span className={styles.moneyInput}><input type="number" min="1" step="1" required value={preferences.budgetMinor / 100} onChange={(event) => updatePreferences("budgetMinor", Math.max(1, Math.round(Number(event.target.value || 0) * 100)))} /><select value={preferences.currency} onChange={(event) => updatePreferences("currency", event.target.value as GiftPreferences["currency"])} aria-label="Währung"><option value="EUR">EUR</option><option value="USD">USD</option></select></span>
            </label>
            <label>Budgettoleranz
              <select value={preferences.budgetTolerancePercent ?? 0} onChange={(event) => updatePreferences("budgetTolerancePercent", Number(event.target.value) as GiftPreferences["budgetTolerancePercent"])}><option value="0">Keine</option><option value="5">Bis 5 %</option><option value="10">Bis 10 %</option><option value="15">Bis 15 %</option></select>
            </label>
          </div>
          <p className={styles.localHint}>Name und Geschenkangaben werden nur in diesem Browser gespeichert. Kartenpreise sind Marktschätzungen; Versand und Steuern sind nicht enthalten.</p>
          <div className={styles.actions}><button type="button" className={styles.secondaryButton} onClick={onCancel}>Abbrechen</button><button type="submit" className={styles.primaryButton} disabled={loading || !preferences.subjectQuery.trim()}>{loading ? <><LoaderCircle className={styles.spin} size={16} /> Karten werden gesucht…</> : <>Vorschlag erzeugen <ArrowRight size={16} /></>}</button></div>
        </form>
      ) : null}

      {step === "candidates" && selection ? (
        <div className={styles.resultsStep}>
          <div className={styles.summaryBar} data-status={selection.budgetStatus}><div><strong>{selection.selected.length} / {preferences.targetCardCount}</strong><span>ausgewählte Karten</span></div><div><strong>{formatMoney(selection.estimatedTotalMinor, preferences.currency)}</strong><span>{selection.budgetStatus === "unknown" ? "Schätzung unvollständig" : "geschätzter Kartenwert"}</span></div><div><strong>{selection.unpricedCount}</strong><span>ohne Preis</span></div></div>
          {!pricingEnabled ? <p className={styles.gateNotice} role="status">Die Preisprüfung ist derzeit noch deaktiviert. Karten können trotzdem ausgewählt und als normaler Binder gespeichert werden; es gibt keine Budgetzusage.</p> : null}
          {selection.budgetStatus === "over" ? <p className={styles.warning} role="status">Die günstigste vollständige Auswahl liegt über deinem Budget. Karten können ersetzt oder entfernt werden.</p> : null}
          {selection.budgetStatus === "unknown" && pricingEnabled ? <p className={styles.warning} role="status">Unbekannte oder nur angenäherte Preise verhindern eine sichere „unter Budget“-Aussage.</p> : null}
          <div className={styles.cardGrid}>
            {selection.selected.map((candidate, index) => {
              const issue = variantSelectionIssue(candidate.variant, variantAvailabilityForCard(candidate.card));
              return <article className={styles.candidateCard} key={candidate.card.key}>
                <CardArtwork card={candidate.card} className={styles.cardImage} fallback={<div className={styles.imageFallback}>Bild nicht verfügbar</div>} />
                <div className={styles.cardIdentity}><strong>{candidate.card.name}</strong><span>{candidate.card.setName} · Nr. {candidate.card.collectorNumber}</span><b>{formatMoney(candidate.price.amountMinor, preferences.currency)}</b><small className={styles.priceMeta}>{priceSourceLabel(candidate.price.source)} · Stand {formatDate(candidate.price.sourceUpdatedAt ?? candidate.price.fetchedAt)}{formatRange(candidate.price.range, preferences.currency) ? ` · Spanne ${formatRange(candidate.price.range, preferences.currency)}` : ""}</small></div>
                <div className={styles.reasonTags}>{candidate.reasonTags.map((tag) => <span key={tag}>{tag === "set-diversity" ? "Set-Vielfalt" : tag === "vintage" ? "Vintage" : tag === "modern" ? "Modern" : tag}</span>)}</div>
                <div className={styles.cardActions}><button type="button" className={styles.linkButton} onClick={() => setOpenVariantKey(openVariantKey === candidate.card.key ? undefined : candidate.card.key)}>{openVariantKey === candidate.card.key ? "Version schließen" : "Version prüfen"}</button><button type="button" className={styles.iconButton} onClick={() => replaceCandidate(candidate.card.key)} disabled={!candidates.some((item) => !selection.selected.some((selected) => selected.card.key === item.card.key) && !excludedKeys.has(item.card.key))} aria-label={`${candidate.card.name} ersetzen`}><RefreshCw size={15} /></button><button type="button" className={styles.iconButton} onClick={() => removeCandidate(candidate.card.key)} aria-label={`${candidate.card.name} entfernen`}><X size={15} /></button></div>
                {openVariantKey === candidate.card.key ? <div className={styles.variantBox}><VariantFields variant={candidate.variant} preferences={candidate.preferences} availability={variantAvailabilityForCard(candidate.card)} onVariantChange={(variant) => updateVariant(candidate.card.key, variant)} onPreferencesChange={(next) => setSelection((current) => current ? summarizeSelection(current.selected.map((item) => item.card.key === candidate.card.key ? { ...item, preferences: next } : item), preferences, current.issues) : current)} />{issue ? <p className={styles.warning}>{issue}</p> : null}</div> : null}
                <span className={styles.cardIndex}>{index + 1}</span>
              </article>;
            })}
          </div>
          <div className={styles.selectionTools}><button type="button" className={styles.secondaryButton} onClick={addCandidate} disabled={selection.selected.length >= preferences.targetCardCount}>+ Karte hinzufügen</button><button type="button" className={styles.secondaryButton} onClick={() => setShowAll((current) => !current)}>{showAll ? "Trefferliste schließen" : `Alle passenden Karten ansehen (${briefs.length})`}</button></div>
          {showAll ? <div className={styles.allResults}><p>Die Liste enthält Namens-Treffer. Karten, auf denen das Pokémon nur im Artwork vorkommt, sind nicht enthalten.</p><ul>{briefs.map((item) => <li key={`${item.ref.language}-${item.ref.id}`}><span><strong>{item.name}</strong><small>{item.ref.language.toUpperCase()} · Nr. {item.collectorNumber}</small></span><button type="button" onClick={() => { const candidate = candidates.find((entry) => entry.card.key === `tcgdex:${item.ref.id}:${item.ref.language}`); if (candidate && selection.selected.length < preferences.targetCardCount && !selection.selected.some((entry) => entry.card.key === candidate.card.key)) setSelection(summarizeSelection([...selection.selected, candidate], preferences, selection.issues)); }}>Hinzufügen</button></li>)}</ul></div> : null}
          <div className={styles.actions}><button type="button" className={styles.secondaryButton} onClick={() => setStep("details")}><ArrowLeft size={16} /> Wünsche ändern</button><button type="button" className={styles.primaryButton} disabled={!reviewReady} onClick={() => setStep("review")}>Auswahl prüfen <ArrowRight size={16} /></button></div>
        </div>
      ) : null}

      {step === "review" && selection ? (
        <div className={styles.reviewStep}>
          <div className={styles.reviewHero}><span className={styles.reviewIcon}><Check size={22} /></span><div><h2>Dein Vorschlag ist bereit</h2><p>{preferences.subjectQuery} · {preferences.targetCardCount} Karten · {preferences.currency}</p></div></div>
          <dl className={styles.reviewMeta}><div><dt>Geschätzter Kartenwert</dt><dd>{formatMoney(selection.estimatedTotalMinor, preferences.currency)}</dd></div><div><dt>Preisspanne</dt><dd>{estimatedRange ? formatRange(estimatedRange, preferences.currency) : "Nicht vollständig verfügbar"}</dd></div><div><dt>Preissicherheit</dt><dd>{selection.unpricedCount ? `${selection.unpricedCount} unbekannt` : selection.approximateCount ? `${selection.approximateCount} angenähert` : "brauchbare Marktwerte"}</dd></div><div><dt>Binder</dt><dd>Normale Cardfolio-Seiten · editierbar</dd></div></dl>
          <p className={styles.reviewNotice}>Der Binder wird lokal angelegt. Karten und physischer Binder sind getrennte Käufe; Versand und Steuern sind nicht enthalten. „Karten besorgen“ folgt danach über die bestehende Fehlkarten-Übergabe.</p>
          <div className={styles.actions}><button type="button" className={styles.secondaryButton} onClick={() => setStep("candidates")}><ArrowLeft size={16} /> Auswahl bearbeiten</button><button type="button" className={styles.primaryButton} disabled={submitting} onClick={async () => { setSubmitting(true); try { await onCreateBinder(selection, preferences); } finally { setSubmitting(false); } }}>{submitting ? "Binder wird angelegt…" : "Als Binder anlegen"}</button></div>
        </div>
      ) : null}
    </section>
  );
}
