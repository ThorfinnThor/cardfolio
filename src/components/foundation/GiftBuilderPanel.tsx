"use client";

import { ArrowLeft, ArrowRight, Check, Download, ExternalLink, Gift, LoaderCircle, Printer, RefreshCw, Search, ShoppingBag, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { GiftCandidateLoader } from "@/data/gift/gift-candidate-loader";
import { loadBinderPartnerCatalog, ReviewedBinderAffiliateAdapter } from "@/data/partners/binder-affiliate-adapter";
import { FEATURES } from "@/config/feature-flags";
import {
  DeterministicGiftSelectionEngine,
  giftCandidateHasArtwork,
  giftCandidateHasPrice,
  type GiftCardCandidate,
  type GiftPreferences,
  type GiftProject,
  type GiftSelectionResult,
} from "@/domain/gift-builder";
import type { BinderAffiliateAdapter, BinderOffer } from "@/domain/binder-affiliate";
import type { GiftPriceRange } from "@/domain/gift-builder";
import { createGiftPrintSummary } from "@/domain/gift-print-summary";
import { GIFT_THEME_PRESETS, giftThemePreset } from "@/domain/gift-theme-presets";
import { conditionProfile, conditionProfiles } from "@/domain/purchase-preferences";
import { ConditionGuide } from "./ConditionGuide";
import type { SmartSearchAdapter } from "@/domain/semantic-card-search";
import type { CardSnapshot, CatalogSearchItem, PurchasePreferences, VariantSelection } from "@/domain/types";
import { createInitialVariantSelection, formatVariantSelection, isVariantSelectionValid, variantAvailabilityForCard, variantSelectionIssue } from "@/domain/variant-selection";

import { CardArtwork } from "./CardArtwork";
import { GuidedFlow } from "./GuidedFlow";
import { VariantFields } from "./VariantFields";
import styles from "./gift-builder.module.css";

export interface GiftBuilderPanelProps {
  loader: Pick<GiftCandidateLoader, "loadCandidatePool" | "hydrateCandidates">;
  smartSearch?: Pick<SmartSearchAdapter, "search">;
  pricingEnabled: boolean;
  budgetGuaranteeEnabled?: boolean;
  onCancel: () => void;
  onCreateBinder: (selection: GiftSelectionResult, preferences: GiftPreferences) => Promise<GiftProject>;
  onOpenBinder: () => void;
  onCardsPurchase: () => void;
}

type GiftStep = "details" | "candidates" | "review" | "summary";
type GiftDiscoveryMode = "pokemon" | "theme";

const GIFT_FLOW = [
  { label: "Wünsche", description: "Pokémon, Größe und Budget" },
  { label: "Karten auswählen", description: "Vorschläge mit Bildern ansehen" },
  { label: "Bestellung prüfen", description: "Ausführung und Zustand bestätigen" },
  { label: "Karten kaufen", description: "Einkaufsliste beim Anbieter öffnen" },
] as const;

const STEP_GUIDANCE: Record<GiftStep, { title: string; text: string }> = {
  details: { title: "Beantworte ein paar kurze Fragen", text: "Pokémon-Fachwissen ist nicht nötig. Wir stellen danach einen passenden Vorschlag zusammen." },
  candidates: { title: "Sieh dir die vorgeschlagenen Karten an", text: "Du kannst jede Karte ersetzen. Wenn alles passt, gehst du unten zur Bestellprüfung weiter." },
  review: { title: "Letzter Check vor dem Speichern", text: "Kontrolliere Kartenanzahl, Schätzung und Bestellangaben. Gekauft wird erst im nächsten Schritt beim Anbieter." },
  summary: { title: "Der Binder ist gespeichert", text: "Als Nächstes bereitest du die fehlenden Karten für Cardmarket, TCGplayer oder CardTrader vor." },
};

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
  const initial = createInitialVariantSelection(availability);
  if (initial.finish !== "unspecified") return initial;
  return {
    ...initial,
    finish: availability.normal ? "normal" : availability.holo ? "holo" : "reverse",
  };
}

function hasUnambiguousCatalogFinish(card: CardSnapshot): boolean {
  return createInitialVariantSelection(variantAvailabilityForCard(card)).finish !== "unspecified";
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

function formatRange(range: Pick<GiftPriceRange, "lowMinor" | "highMinor"> | undefined, currency: GiftPreferences["currency"]): string | undefined {
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
  const allPriced = selected.length > 0 && selected.every((candidate) =>
    candidate.price.confidence !== "unknown"
    && candidate.price.currency === preferences.currency
    && candidate.price.amountMinor !== undefined);
  const ceiling = preferences.budgetMinor + Math.floor(preferences.budgetMinor * (preferences.budgetTolerancePercent ?? 0) / 100);
  const budgetStatus = !allPriced || estimatedTotalMinor === undefined
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

export function GiftBuilderPanel({ loader, smartSearch, pricingEnabled, budgetGuaranteeEnabled = false, onCancel, onCreateBinder, onOpenBinder, onCardsPurchase }: GiftBuilderPanelProps) {
  const engine = useMemo(() => new DeterministicGiftSelectionEngine(), []);
  const [step, setStep] = useState<GiftStep>("details");
  const [preferences, setPreferences] = useState<GiftPreferences>(initialPreferences);
  const [pokemonQuery, setPokemonQuery] = useState(initialPreferences.subjectQuery);
  const [discoveryMode, setDiscoveryMode] = useState<GiftDiscoveryMode>("pokemon");
  const [orderCondition, setOrderCondition] = useState<PurchasePreferences["minimumCondition"]>("excellent");
  const [selectedThemeId, setSelectedThemeId] = useState<string>();
  const [briefs, setBriefs] = useState<CatalogSearchItem[]>([]);
  const [candidates, setCandidates] = useState<GiftCardCandidate[]>([]);
  const [selection, setSelection] = useState<GiftSelectionResult>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [showAll, setShowAll] = useState(false);
  const [openVariantKey, setOpenVariantKey] = useState<string>();
  const [confirmedVariantKeys, setConfirmedVariantKeys] = useState<Set<string>>(new Set());
  const [excludedKeys, setExcludedKeys] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [giftProject, setGiftProject] = useState<GiftProject>();
  const [binderOffers, setBinderOffers] = useState<BinderOffer[]>();
  const [partnerAdapter, setPartnerAdapter] = useState<BinderAffiliateAdapter>();
  const [partnerLoadError, setPartnerLoadError] = useState<string>();
  const [greeting, setGreeting] = useState("");
  const [externalNavigationBlocked, setExternalNavigationBlocked] = useState(false);

  useEffect(() => {
    if (step !== "summary") return;
    const controller = new AbortController();
    void loadBinderPartnerCatalog(controller.signal)
      .then((catalog) => {
        if (controller.signal.aborted) return;
        const adapter = new ReviewedBinderAffiliateAdapter(catalog);
        setPartnerAdapter(adapter);
        setBinderOffers([...adapter.listOffers()]);
        setPartnerLoadError(undefined);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setPartnerAdapter(undefined);
        setBinderOffers([]);
        setPartnerLoadError(cause instanceof Error ? cause.message : "Binder-Angebote konnten nicht geladen werden.");
      });
    return () => controller.abort();
  }, [step]);

  const updatePreferences = <K extends keyof GiftPreferences>(key: K, value: GiftPreferences[K]) => {
    setPreferences((current) => ({ ...current, [key]: value }));
  };

  async function createProposal() {
    setLoading(true);
    setError(undefined);
    setSelection(undefined);
    setConfirmedVariantKeys(new Set());
    setExcludedKeys(new Set());
    try {
      const maximum = Math.min(80, Math.max(40, preferences.targetCardCount * 3));
      const theme = discoveryMode === "theme" ? giftThemePreset(selectedThemeId) : undefined;
      const pool = theme && smartSearch
        ? (await smartSearch.search({
          text: theme.query,
          language: "en",
          limit: maximum,
          matchQuality: "dominant",
        })).map((hit): CatalogSearchItem => ({ ref: hit.ref, name: theme.label, collectorNumber: "" }))
        : await loader.loadCandidatePool({
          subjectQuery: preferences.subjectQuery,
          language: preferences.preferredLanguage ?? "en",
          maximum,
          pageSize: 24,
        });
      if (!pool.length) {
        setError(theme
          ? "Für dieses Motiv gibt es noch keine visuell bestätigten dominanten Artwork-Treffer. Prüfe zuerst Karten in der lokalen Artwork-Prüfung."
          : "Keine Karten mit diesem Namen gefunden. Prüfe Schreibweise oder Sprache.");
        return;
      }
      if (theme && pool.length < preferences.targetCardCount) {
        setError(`Für „${theme.label}“ sind erst ${pool.length} dominante Artwork-Treffer geprüft. Für diesen Binder werden ${preferences.targetCardCount} benötigt; unbestätigte Treffer werden nicht mehr automatisch ergänzt.`);
        return;
      }
      const hydrated = await loader.hydrateCandidates(pool, {
        currency: preferences.currency,
        variantFor: defaultVariant,
        concurrency: 4,
        preferences: { minimumCondition: orderCondition },
      });
      const safe = hydrated
        .map((candidate) => safeCandidate(candidate, pricingEnabled, preferences.currency))
        .toSorted((left, right) =>
          Number(!giftCandidateHasArtwork(left)) - Number(!giftCandidateHasArtwork(right))
          || Number(!giftCandidateHasPrice(left)) - Number(!giftCandidateHasPrice(right))
          || (left.price.amountMinor ?? Number.MAX_SAFE_INTEGER) - (right.price.amountMinor ?? Number.MAX_SAFE_INTEGER)
          || left.card.key.localeCompare(right.card.key));
      setBriefs(safe.map(({ card }) => ({
        ref: card.ref,
        name: card.name,
        collectorNumber: card.collectorNumber,
        imageBaseUrl: card.imageBaseUrl,
        setId: card.setId,
        setName: card.setName,
      })));
      setCandidates(safe);
      setConfirmedVariantKeys(new Set(safe
        .filter((candidate) => hasUnambiguousCatalogFinish(candidate.card))
        .map((candidate) => candidate.card.key)));
      const selectionCandidates = budgetGuaranteeEnabled ? safe : safe.map((candidate) => candidate.price.confidence === "usable" ? {
        ...candidate,
        price: { ...candidate.price, confidence: "approximate" as const, issues: [...candidate.price.issues, "estimate-only-no-budget-guarantee"] },
      } : candidate);
      setSelection(engine.select({ candidates: selectionCandidates, preferences }));
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
    setConfirmedVariantKeys((current) => {
      const next = new Set(current);
      next.delete(cardKey);
      return next;
    });
    setSelection(summarizeSelection(selection.selected.filter((candidate) => candidate.card.key !== cardKey), preferences, selection.issues));
  }

  function addCandidate() {
    if (!selection || selection.selected.length >= preferences.targetCardCount) return;
    const next = candidates.find((candidate) => !excludedKeys.has(candidate.card.key) && !selection.selected.some((selected) => selected.card.key === candidate.card.key));
    if (!next) return;
    if (hasUnambiguousCatalogFinish(next.card)) {
      setConfirmedVariantKeys((current) => new Set(current).add(next.card.key));
    }
    setSelection(summarizeSelection([...selection.selected, next], preferences, selection.issues));
  }

  function replaceCandidate(cardKey: string) {
    if (!selection) return;
    const replacement = candidates.find((candidate) => !excludedKeys.has(candidate.card.key) && !selection.selected.some((selected) => selected.card.key === candidate.card.key));
    if (!replacement) return;
    setConfirmedVariantKeys((current) => {
      const next = new Set(current);
      next.delete(cardKey);
      if (hasUnambiguousCatalogFinish(replacement.card)) next.add(replacement.card.key);
      return next;
    });
    const nextExcluded = new Set(excludedKeys).add(cardKey);
    setExcludedKeys(nextExcluded);
    setSelection(summarizeSelection(selection.selected.map((candidate) => candidate.card.key === cardKey ? replacement : candidate), preferences, selection.issues));
  }

  function updateVariant(cardKey: string, variant: VariantSelection) {
    if (!selection) return;
    const card = selection.selected.find((candidate) => candidate.card.key === cardKey);
    if (!card) return;
    if (variant.finish !== card.variant.finish) {
      setConfirmedVariantKeys((current) => new Set(current).add(cardKey));
    }
    const issue = variantSelectionIssue(variant, card.card.availableVariants);
    const nextSelected = selection.selected.map((candidate) => candidate.card.key === cardKey ? {
      ...candidate,
      variant,
      price: issue ? candidate.price : { currency: preferences.currency, fetchedAt: candidate.price.fetchedAt, confidence: "unknown" as const, issues: ["variant-changed-refresh-required"] },
    } : candidate);
    setSelection(summarizeSelection(nextSelected, preferences, selection.issues));
  }

  function confirmVariant(cardKey: string) {
    setConfirmedVariantKeys((current) => new Set(current).add(cardKey));
  }

  function applyConditionToAll(value: PurchasePreferences["minimumCondition"]) {
    setOrderCondition(value);
    setSelection((current) => current ? summarizeSelection(current.selected.map((candidate) => ({
      ...candidate,
      preferences: { ...candidate.preferences, minimumCondition: value },
    })), preferences, current.issues) : current);
  }

  const reviewReady = Boolean(selection?.selected.length === preferences.targetCardCount
    && selection.selected.every((candidate) => confirmedVariantKeys.has(candidate.card.key)
      && isVariantSelectionValid(candidate.variant, variantAvailabilityForCard(candidate.card))));
  const readyCardCount = selection?.selected.filter((candidate) => confirmedVariantKeys.has(candidate.card.key)
    && isVariantSelectionValid(candidate.variant, variantAvailabilityForCard(candidate.card))).length ?? 0;
  const estimatedRange = selection ? selectionRange(selection.selected) : undefined;
  const printSummary = selection && giftProject ? createGiftPrintSummary({ project: giftProject, selection, greeting }) : undefined;
  const candidateByKey = useMemo(() => new Map(candidates.map((candidate) => [candidate.card.key, candidate])), [candidates]);

  function addCandidateByKey(cardKey: string) {
    if (!selection || selection.selected.length >= preferences.targetCardCount) return;
    const candidate = candidateByKey.get(cardKey);
    if (!candidate || selection.selected.some((entry) => entry.card.key === cardKey)) return;
    if (hasUnambiguousCatalogFinish(candidate.card)) {
      setConfirmedVariantKeys((current) => new Set(current).add(candidate.card.key));
    }
    setSelection(summarizeSelection([...selection.selected, candidate], preferences, selection.issues));
  }

  function downloadPrintSummary() {
    if (!printSummary) return;
    const lines = [
      printSummary.title,
      printSummary.recipientName ? `Für: ${printSummary.recipientName}` : undefined,
      printSummary.greeting,
      `${printSummary.subject} · ${printSummary.cardCount} Karten`,
      pricingEnabled ? `Geschätzter Kartenwert: ${formatMoney(printSummary.cardPurchase.estimatedValueMinor, printSummary.cardPurchase.currency)}` : "Preisprüfung: deaktiviert",
      pricingEnabled ? `Geschätzte Preisspanne: ${formatRange(printSummary.cardPurchase.estimatedRange, printSummary.cardPurchase.currency) ?? "nicht vollständig verfügbar"}` : undefined,
      pricingEnabled ? `Preis unbekannt: ${printSummary.cardPurchase.unknownPriceCount} · angenähert: ${printSummary.cardPurchase.approximatePriceCount}` : "Budgetzusage: keine",
      "Versand und Steuern sind nicht enthalten.",
      "Karten und physischer Binder sind getrennte Käufe.",
      "",
      "Karten:",
      ...printSummary.cards.map((card) => `• ${card.name} | ${card.setName} | Nr. ${card.collectorNumber} | ${card.language.toUpperCase()} | ${card.variant}`),
    ].filter((line): line is string => line !== undefined);
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${printSummary.title.replace(/[^\p{L}\p{N}-]+/gu, "-").replace(/^-|-$/g, "") || "geschenk-zusammenfassung"}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function openBinderPartner(offerId: string) {
    const url = partnerAdapter?.buildExternalUrl(offerId);
    if (!url) return;
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) setExternalNavigationBlocked(true);
  }

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

      <div className={styles.flowWrapper}><GuidedFlow steps={GIFT_FLOW} currentStep={(["details", "candidates", "review", "summary"] as const).indexOf(step) + 1} label="Schritte zum Geschenk-Binder" /></div>
      <div className={styles.stepLead}>
        <span>Schritt {(["details", "candidates", "review", "summary"] as const).indexOf(step) + 1} von 4</span>
        <div><strong>{STEP_GUIDANCE[step].title}</strong><p>{STEP_GUIDANCE[step].text}</p></div>
        <ArrowRight aria-hidden="true" size={26} />
      </div>

      {error ? <div className={styles.error} role="alert"><strong>Vorschlag konnte nicht geladen werden</strong><span>{error}</span>{FEATURES.artworkReview && discoveryMode === "theme" ? <a className={styles.secondaryButton} href="/artwork-review/">Artwork lokal prüfen</a> : null}<button type="button" className={styles.secondaryButton} onClick={() => void createProposal()}><RefreshCw size={15} /> Erneut versuchen</button></div> : null}

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
              <select disabled={discoveryMode === "theme"} value={discoveryMode === "theme" ? "en" : preferences.preferredLanguage ?? "en"} onChange={(event) => updatePreferences("preferredLanguage", event.target.value as "de" | "en") }>
                <option value="de">Deutsch</option><option value="en">English</option>
              </select>
            </label>
          </div>
          {smartSearch ? <fieldset className={styles.discoveryMode}>
            <legend>Wie sollen wir Karten finden?</legend>
            <div className={styles.choiceRow}>
              <label className={styles.choice}><input type="radio" name="gift-discovery" checked={discoveryMode === "pokemon"} onChange={() => {
                setDiscoveryMode("pokemon");
                updatePreferences("subjectQuery", pokemonQuery);
              }} />Nach Pokémonname</label>
              <label className={styles.choice}><input type="radio" name="gift-discovery" checked={discoveryMode === "theme"} onChange={() => setDiscoveryMode("theme")} />Nach Artwork-Motiv</label>
            </div>
          </fieldset> : null}
          {discoveryMode === "pokemon" ? <label className={styles.subjectField}>Lieblings-Pokémon
            <span className={styles.inputWithIcon}><Search aria-hidden="true" size={17} /><input required value={pokemonQuery} onChange={(event) => {
              setPokemonQuery(event.target.value);
              updatePreferences("subjectQuery", event.target.value);
            }} placeholder="Zum Beispiel Pikachu" /></span>
          </label> : <fieldset className={styles.themePicker}>
            <legend>Motiv für den Geschenk-Binder</legend>
            <p>Wähle eine von zehn kuratierten Ideen. Die lokale Motivsuche bevorzugt Karten mit vorhandenem Artwork.</p>
            <div className={styles.themeGrid}>
              {GIFT_THEME_PRESETS.map((theme) => <label className={styles.themeChoice} key={theme.id}>
                <input
                  type="radio"
                  name="gift-theme"
                  checked={selectedThemeId === theme.id}
                  onChange={() => {
                    setSelectedThemeId(theme.id);
                    updatePreferences("subjectQuery", theme.label);
                    updatePreferences("preferredLanguage", "en");
                  }}
                />
                <strong>{theme.label}</strong>
                <span>{theme.description}</span>
              </label>)}
            </div>
            <small>Die Motivsuche nutzt derzeit den geprüften englischen Artwork-Katalog. Der fertige Binder bleibt vollständig editierbar.</small>
          </fieldset>}
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
          <label className={styles.orderConditionField}>Gewünschter Kartenzustand
            <select aria-label="Gewünschter Kartenzustand" value={orderCondition} onChange={(event) => setOrderCondition(event.target.value as PurchasePreferences["minimumCondition"])}>
              {conditionProfiles.map((profile) => <option value={profile.value} key={profile.value}>{profile.label}</option>)}
            </select>
            <span>{conditionProfile(orderCondition).providerSummary}. Diese Vorgabe gilt zunächst für alle vorgeschlagenen Karten und kann später einzeln geändert werden.</span>
          </label>
          <ConditionGuide />
          <p className={styles.localHint}>{pricingEnabled ? `Name und Geschenkangaben werden nur in diesem Browser gespeichert. Kartenpreise sind unverbindliche Marktschätzungen; Versand und Steuern sind nicht enthalten.${budgetGuaranteeEnabled ? "" : " Das Budget dient nur zur Orientierung und wird nicht garantiert."}` : "Name und Geschenkangaben werden nur in diesem Browser gespeichert. Die Preisprüfung ist noch nicht freigegeben; Budget und Toleranz werden daher nicht zugesagt."}</p>
          <div className={styles.actions}><button type="button" className={styles.secondaryButton} onClick={onCancel}>Abbrechen</button><button type="submit" className={styles.primaryButton} aria-label="Vorschlag erzeugen – passende Karten zeigen" disabled={loading || (discoveryMode === "theme" ? !selectedThemeId : !preferences.subjectQuery.trim())}>{loading ? <><LoaderCircle className={styles.spin} size={16} /> Karten werden gesucht…</> : <>Passende Karten zeigen <ArrowRight size={18} /></>}</button></div>
        </form>
      ) : null}

      {step === "candidates" && selection ? (
        <div className={styles.resultsStep}>
          <div className={styles.summaryBar} data-status={selection.budgetStatus}><div><strong>{selection.selected.length} / {preferences.targetCardCount}</strong><span>ausgewählte Karten</span></div><div><strong>{pricingEnabled ? formatMoney(selection.estimatedTotalMinor, preferences.currency) : "Preisprüfung aus"}</strong><span>{pricingEnabled ? selection.budgetStatus === "unknown" ? "Schätzung unvollständig" : "geschätzter Kartenwert" : "noch nicht freigegeben"}</span></div><div><strong>{pricingEnabled ? selection.unpricedCount : "–"}</strong><span>{pricingEnabled ? "ohne Preis" : "keine Budgetzusage"}</span></div></div>
          {!pricingEnabled ? <p className={styles.gateNotice} role="status">Die Preisprüfung ist derzeit noch deaktiviert. Karten können trotzdem ausgewählt und als normaler Binder gespeichert werden; es gibt keine Budgetzusage.</p> : null}
          {pricingEnabled && !budgetGuaranteeEnabled ? <p className={styles.gateNotice} role="status">Die Auswahl orientiert sich an unverbindlichen TCGdex-Marktschätzungen und deinem Budget. Tatsächliche Preise, Verfügbarkeit, Versand und Steuern können abweichen.</p> : null}
          {selection.budgetStatus === "over" ? <p className={styles.warning} role="status">Selbst die günstigste vollständige Auswahl wird derzeit über deinem Budget geschätzt. Reduziere die Kartenzahl, erhöhe das Budget oder ersetze einzelne Karten.</p> : null}
          {selection.budgetStatus === "unknown" && pricingEnabled ? <p className={styles.warning} role="status">Für mindestens eine ausgewählte Karte fehlt ein Preis. Deshalb kann Cardfolio das Budget nicht vollständig berücksichtigen.</p> : null}
          <section className={styles.orderSetup} aria-labelledby="gift-order-setup-heading">
            <div>
              <strong id="gift-order-setup-heading">Bestellwunsch für alle Karten</strong>
              <span>{readyCardCount} von {selection.selected.length} Karten sind vollständig vorbereitet. Sonderfälle kannst du direkt an der Karte ändern.</span>
            </div>
            <label>Zustand für alle
              <select aria-label="Zustand für alle" value={orderCondition} onChange={(event) => applyConditionToAll(event.target.value as PurchasePreferences["minimumCondition"])}>
                {conditionProfiles.map((profile) => <option value={profile.value} key={profile.value}>{profile.label}</option>)}
              </select>
              <small>{conditionProfile(orderCondition).providerSummary}</small>
            </label>
          </section>
          <div className={styles.cardGrid}>
            {selection.selected.map((candidate, index) => {
              const issue = variantSelectionIssue(candidate.variant, variantAvailabilityForCard(candidate.card));
              const needsFinishConfirmation = !confirmedVariantKeys.has(candidate.card.key);
              const orderIssue = issue ?? (needsFinishConfirmation
                ? "Die Ausführung wurde nur vorausgewählt und muss einmal bestätigt werden."
                : undefined);
              return <article className={styles.candidateCard} key={candidate.card.key}>
                <CardArtwork card={candidate.card} className={styles.cardImage} fallback={<div className={styles.imageFallback}>Bild nicht verfügbar</div>} />
                <div className={styles.cardIdentity}><strong>{candidate.card.name}</strong><span>{candidate.card.setName} · Nr. {candidate.card.collectorNumber}</span><b>{pricingEnabled ? formatMoney(candidate.price.amountMinor, preferences.currency) : "Preisprüfung deaktiviert"}</b><small className={styles.priceMeta}>{pricingEnabled ? `${priceSourceLabel(candidate.price.source)} · Stand ${formatDate(candidate.price.sourceUpdatedAt ?? candidate.price.fetchedAt)}${formatRange(candidate.price.range, preferences.currency) ? ` · Spanne ${formatRange(candidate.price.range, preferences.currency)}` : ""}` : "Noch keine für diesen Ablauf freigegebene Preisquelle"}</small></div>
                <div className={styles.reasonTags}>{candidate.reasonTags.map((tag) => <span key={tag}>{tag === "set-diversity" ? "Set-Vielfalt" : tag === "vintage" ? "Vintage" : tag === "modern" ? "Modern" : tag}</span>)}</div>
                <div className={styles.orderSummary} data-ready={!orderIssue}><strong>{orderIssue ? "Bestellangaben offen" : "Bestellbereit"}</strong><span>{formatVariantSelection(candidate.variant)} · {conditionProfile(candidate.preferences.minimumCondition).shortLabel}</span></div>
                <div className={styles.cardActions}><button type="button" className={styles.linkButton} onClick={() => setOpenVariantKey(openVariantKey === candidate.card.key ? undefined : candidate.card.key)}>{openVariantKey === candidate.card.key ? "Bestellangaben schließen" : "Bestellangaben ändern"}</button><button type="button" className={styles.iconButton} onClick={() => replaceCandidate(candidate.card.key)} disabled={!candidates.some((item) => !selection.selected.some((selected) => selected.card.key === item.card.key) && !excludedKeys.has(item.card.key))} aria-label={`${candidate.card.name} ersetzen`}><RefreshCw size={15} /></button><button type="button" className={styles.iconButton} onClick={() => removeCandidate(candidate.card.key)} aria-label={`${candidate.card.name} entfernen`}><X size={15} /></button></div>
                {openVariantKey === candidate.card.key ? <div className={styles.variantBox}><VariantFields variant={candidate.variant} preferences={candidate.preferences} availability={variantAvailabilityForCard(candidate.card)} onVariantChange={(variant) => updateVariant(candidate.card.key, variant)} onPreferencesChange={(next) => setSelection((current) => current ? summarizeSelection(current.selected.map((item) => item.card.key === candidate.card.key ? { ...item, preferences: next } : item), preferences, current.issues) : current)} />{issue ? <p className={styles.warning}>{issue}</p> : needsFinishConfirmation ? <><p className={styles.warning}>Der Katalog bestätigt die Ausführung nicht eindeutig. Vergleiche das Kartenbild und bestätige die Vorauswahl oder wähle eine andere Ausführung.</p><button type="button" className={styles.secondaryButton} onClick={() => confirmVariant(candidate.card.key)}>Vorauswahl bestätigen</button></> : null}</div> : null}
                <span className={styles.cardIndex}>{index + 1}</span>
              </article>;
            })}
          </div>
          <div className={styles.selectionTools}><button type="button" className={styles.secondaryButton} onClick={addCandidate} disabled={selection.selected.length >= preferences.targetCardCount}>+ Karte hinzufügen</button><button type="button" className={styles.secondaryButton} onClick={() => setShowAll((current) => !current)}>{showAll ? "Trefferliste schließen" : `Alle passenden Karten ansehen (${briefs.length})`}</button></div>
          {showAll ? <div className={styles.allResults}>
            <p>{discoveryMode === "theme" ? `Die Liste enthält Artwork-Treffer zum Motiv „${preferences.subjectQuery}“ aus dem englischen Kartenkatalog.` : "Die Liste enthält Namens-Treffer. Karten, auf denen das Pokémon nur im Artwork vorkommt, sind nicht enthalten."}</p>
            {selection.selected.length >= preferences.targetCardCount ? <p className={styles.resultHint} role="status">Die Zielanzahl ist erreicht. Entferne zuerst oben eine Karte, um hier eine andere hinzuzufügen.</p> : null}
            <ul>{briefs.map((item) => {
              const cardKey = `tcgdex:${item.ref.id}:${item.ref.language}`;
              const candidate = candidateByKey.get(cardKey);
              const alreadySelected = selection.selected.some((entry) => entry.card.key === cardKey);
              const targetReached = selection.selected.length >= preferences.targetCardCount;
              const disabled = !candidate || alreadySelected || targetReached;
              const buttonLabel = !candidate ? "Nicht verfügbar" : alreadySelected ? "Ausgewählt" : targetReached ? "Zuerst Karte entfernen" : "Hinzufügen";
              return <li key={`${item.ref.language}-${item.ref.id}`}>
                {candidate ? <CardArtwork card={candidate.card} className={styles.resultImage} fallback={<span className={styles.resultImageFallback}>Kein Bild</span>} /> : <span className={styles.resultImageFallback}>Kein Bild</span>}
                <span className={styles.resultIdentity}><strong>{item.name}</strong><small>{item.setName ? `${item.setName} · ` : ""}{item.ref.language.toUpperCase()} · Nr. {item.collectorNumber}</small></span>
                <button type="button" disabled={disabled} onClick={() => addCandidateByKey(cardKey)}>{buttonLabel}</button>
              </li>;
            })}</ul>
          </div> : null}
          <div className={styles.actions}><button type="button" className={styles.secondaryButton} onClick={() => setStep("details")}><ArrowLeft size={16} /> Wünsche ändern</button><button type="button" className={styles.primaryButton} aria-label="Auswahl prüfen" disabled={!reviewReady} onClick={() => setStep("review")}>Weiter: Bestellung prüfen <ArrowRight size={18} /></button></div>
        </div>
      ) : null}

      {step === "review" && selection ? (
        <div className={styles.reviewStep}>
          <div className={styles.reviewHero}><span className={styles.reviewIcon}><Check size={22} /></span><div><h2>Dein Vorschlag ist bereit</h2><p>{preferences.subjectQuery} · {preferences.targetCardCount} Karten · {preferences.currency}</p></div></div>
          <dl className={styles.reviewMeta}><div><dt>{pricingEnabled ? "Geschätzter Kartenwert" : "Preisprüfung"}</dt><dd>{pricingEnabled ? formatMoney(selection.estimatedTotalMinor, preferences.currency) : "Deaktiviert"}</dd></div><div><dt>Preisspanne</dt><dd>{pricingEnabled && estimatedRange ? formatRange(estimatedRange, preferences.currency) : pricingEnabled ? "Nicht vollständig verfügbar" : "Nicht berechnet"}</dd></div><div><dt>Preissicherheit</dt><dd>{pricingEnabled ? selection.unpricedCount ? `${selection.unpricedCount} unbekannt` : selection.approximateCount ? `${selection.approximateCount} angenähert` : "brauchbare Marktwerte" : "Keine Budgetzusage"}</dd></div><div><dt>Binder</dt><dd>Normale Cardfolio-Seiten · editierbar</dd></div></dl>
          <p className={styles.reviewNotice}>Der Binder wird lokal angelegt. Karten und physischer Binder sind getrennte Käufe; Preisangaben sind unverbindliche Markt-Schätzwerte, Versand und Steuern sind nicht enthalten. „Karten besorgen“ folgt danach über die bestehende Fehlkarten-Übergabe.</p>
          <div className={styles.actions}><button type="button" className={styles.secondaryButton} onClick={() => setStep("candidates")}><ArrowLeft size={16} /> Auswahl bearbeiten</button><button type="button" className={styles.primaryButton} aria-label="Als Binder anlegen" disabled={submitting} onClick={async () => { setSubmitting(true); setError(undefined); try { const project = await onCreateBinder(selection, preferences); setGiftProject(project); setStep("summary"); } catch (cause) { setError(cause instanceof Error ? cause.message : "Der Geschenk-Binder konnte nicht angelegt werden."); } finally { setSubmitting(false); } }}>{submitting ? "Binder wird gespeichert…" : <>Binder speichern & weiter <ArrowRight size={18} /></>}</button></div>
        </div>
      ) : null}

      {step === "summary" && selection && giftProject && printSummary ? (
        <div className={styles.summaryStep}>
          <article className={styles.printSummary} aria-labelledby="gift-summary-title">
            <header className={styles.summaryHeader}>
              <p className={styles.eyebrow}><Check aria-hidden="true" size={15} /> Lokal angelegt</p>
              <h2 id="gift-summary-title">{printSummary.title}</h2>
              <p>{printSummary.recipientName ? `Für ${printSummary.recipientName} · ` : ""}{printSummary.subject} · {printSummary.cardCount} Karten</p>
            </header>
            {printSummary.greeting ? <blockquote className={styles.greetingPreview}>{printSummary.greeting}</blockquote> : null}
            <dl className={styles.summaryMeta}>
              <div><dt>{pricingEnabled ? "Geschätzter Kartenwert" : "Preisprüfung"}</dt><dd>{pricingEnabled ? formatMoney(printSummary.cardPurchase.estimatedValueMinor, printSummary.cardPurchase.currency) : "Deaktiviert"}</dd></div>
              <div><dt>Geschätzte Preisspanne</dt><dd>{pricingEnabled ? formatRange(printSummary.cardPurchase.estimatedRange, printSummary.cardPurchase.currency) ?? "Nicht vollständig verfügbar" : "Nicht berechnet"}</dd></div>
              <div><dt>Preissicherheit</dt><dd>{pricingEnabled ? `${printSummary.cardPurchase.unknownPriceCount} unbekannt · ${printSummary.cardPurchase.approximatePriceCount} angenähert` : "Keine Budgetzusage"}</dd></div>
              <div><dt>Binderpreis</dt><dd>{printSummary.binderPurchase.price ? formatMoney(printSummary.binderPurchase.price.amountMinor, printSummary.binderPurchase.price.currency) : "Kein bestätigter Preis"}</dd></div>
            </dl>
            <p className={styles.summaryDisclosure}>Karten und physischer Binder sind getrennte Käufe. {pricingEnabled ? "Die Kartenpreise sind Schätzwerte; Versand und Steuern sind nicht enthalten." : "Für Karten wird derzeit kein Preis berechnet und keine Budgetzusage abgegeben."} Alle Geschenkangaben bleiben lokal in diesem Browser.</p>
            <section className={styles.summaryCards} aria-labelledby="summary-cards-heading">
              <h3 id="summary-cards-heading">Karten im Binder</h3>
              <ol>{printSummary.cards.map((card, index) => {
                const candidate = selection.selected[index];
                return <li key={candidate?.card.key ?? `${card.name}-${card.setName}-${card.collectorNumber}-${index}`}>
                  {candidate ? <CardArtwork card={candidate.card} className={styles.summaryCardImage} fallback={<span className={styles.summaryCardImageFallback}>Kein Bild</span>} /> : <span className={styles.summaryCardImageFallback}>Kein Bild</span>}
                  <span className={styles.summaryCardIdentity}><strong>{card.name}</strong><small>{card.setName} · Nr. {card.collectorNumber} · {card.language.toUpperCase()} · {card.variant}</small></span>
                </li>;
              })}</ol>
            </section>
            <p className={styles.localHint}>Die Bildschirmansicht zeigt verfügbare Katalogbilder. Druckansicht und Textdatei enthalten nur Kartenangaben und keine Pokémon-Kartenbilder oder Logos. Persönliche Fotos werden nicht hochgeladen.</p>
          </article>

          <label className={styles.greetingField}>Grußtext für die lokale Druckansicht <span>(optional, nur in diesem Browser)</span>
            <textarea value={greeting} maxLength={500} rows={3} onChange={(event) => setGreeting(event.target.value)} placeholder="Viel Freude mit deinem Binder!" />
          </label>

          <section className={styles.purchaseOptions} aria-label="Getrennte nächste Schritte">
            <article className={styles.purchaseCard}>
              <div><p className={styles.eyebrow}>KARTENKAUF</p><h3>Karten besorgen</h3><p>Öffnet die vorhandene Fehlkarten-Übergabe mit den bekannten TCGplayer- und Cardmarket-Prüfschritten.</p></div>
              <button type="button" className={styles.primaryButton} aria-label="Karten besorgen" onClick={onCardsPurchase}><ShoppingBag aria-hidden="true" size={18} /> Karten jetzt kaufen <ArrowRight aria-hidden="true" size={18} /></button>
            </article>
            <article className={styles.purchaseCard}>
              <div><p className={styles.eyebrow}>BINDERKAUF</p><h3>Binder personalisieren</h3>
                {partnerLoadError ? <p role="status">Angebote sind momentan nicht erreichbar. Du kannst den lokalen Binder weiter bearbeiten.</p> : null}
                {!partnerLoadError && !binderOffers ? <p role="status">Binder-Angebote werden geprüft…</p> : null}
                {!partnerLoadError && binderOffers?.length === 0 ? <p role="status">Zurzeit ist kein geprüfter Personalisierungsanbieter verfügbar. Der Anbieterstatus wird vor jeder Aktivierung geprüft.</p> : null}
                {binderOffers?.map((offer) => <div className={styles.offerRow} key={offer.id}>
                  <div><strong>{offer.displayName}</strong><small>{offer.price ? `${offer.price.qualifier === "from" ? "ab " : ""}${formatMoney(offer.price.amountMinor, offer.price.currency)} · Stand ${formatDate(offer.price.sourceUpdatedAt)}` : "Kein bestätigter Binderpreis"}</small>
                    {offer.affiliateDisclosure ? <small>{offer.affiliateDisclosure}</small> : null}
                    {offer.status !== "available" ? <small>{offer.statusReason ?? "Angebot nicht verfügbar."}</small> : null}
                  </div>
                  <button type="button" className={styles.secondaryButton} disabled={offer.status !== "available"} onClick={() => openBinderPartner(offer.id)}>{offer.status === "available" ? <>Binder personalisieren <ExternalLink aria-hidden="true" size={14} /></> : "Derzeit nicht verfügbar"}</button>
                </div>)}
                {externalNavigationBlocked ? <p className={styles.warning} role="alert">Der Browser hat den externen Anbieteraufruf blockiert. Erlaube Pop-ups oder öffne den Link nach erneuter Auswahl.</p> : null}
              </div>
            </article>
          </section>

          <div className={styles.summaryActions}>
            <button type="button" className={styles.secondaryButton} onClick={() => window.print()}><Printer aria-hidden="true" size={16} /> Drucken / als PDF speichern</button>
            <button type="button" className={styles.secondaryButton} onClick={downloadPrintSummary}><Download aria-hidden="true" size={16} /> Textzusammenfassung herunterladen</button>
            <button type="button" className={styles.secondaryButton} onClick={onOpenBinder}>Binder bearbeiten</button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
