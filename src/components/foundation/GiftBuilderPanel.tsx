"use client";

import { ArrowLeft, ArrowRight, Check, CircleAlert, Download, ExternalLink, Gift, LoaderCircle, Printer, RefreshCw, Search, ShoppingBag, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { GiftCandidateLoader } from "@/data/gift/gift-candidate-loader";
import { loadBinderPartnerCatalog, ReviewedBinderAffiliateAdapter } from "@/data/partners/binder-affiliate-adapter";
import { FEATURES } from "@/config/feature-flags";
import {
  DeterministicGiftSelectionEngine,
  giftCandidateHasArtwork,
  giftCandidateHasPrice,
  giftCandidateHasVerifiedFinish,
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
import { VariantFields } from "./VariantFields";
import styles from "./gift-builder.module.css";

export interface GiftBuilderPanelProps {
  loader: Pick<GiftCandidateLoader, "loadCandidatePool" | "hydrateCandidates">;
  smartSearch?: Pick<SmartSearchAdapter, "search">;
  initialDiscoveryMode?: "pokemon" | "theme";
  initialSubjectQuery?: string;
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
  { label: "Karten & Binder", description: "Beides zum Kauf vorbereiten" },
] as const;

const STEP_GUIDANCE: Record<GiftStep, { title: string; text: string }> = {
  details: { title: "Dein Geschenk-Binder beginnt hier", text: "Wähle ein Lieblings-Pokémon oder Bildmotiv. Wir zeigen dir sofort einen passenden Vorschlag." },
  candidates: { title: "Deine erste Binder-Seite", text: "So könnte sie aussehen. Du kannst Karten austauschen und danach alle mit einem Klick für die Bestellung vorbereiten." },
  review: { title: "Dein Geschenk-Binder ist fast fertig", text: "Prüfe die Auswahl und speichere den Binder. Danach helfen wir dir, Karten und Binder zu besorgen." },
  summary: { title: "Dein Geschenk-Binder ist gespeichert", text: "Als Nächstes kannst du die Karten besorgen und einen passenden physischen Binder auswählen." },
};

const initialPreferences: GiftPreferences = {
  recipientKind: "friend",
  subjectQuery: "Pikachu",
  targetCardCount: 9,
  budgetMinor: 10000,
  currency: "EUR",
  budgetTolerancePercent: 5,
  preferredLanguage: "de",
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

function candidateElementId(cardKey: string): string {
  return `gift-candidate-${cardKey.replace(/[^a-z0-9_-]/gi, "-")}`;
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

export function GiftBuilderPanel({ loader, smartSearch, initialDiscoveryMode = "pokemon", initialSubjectQuery = initialPreferences.subjectQuery, pricingEnabled, budgetGuaranteeEnabled = false, onCancel, onCreateBinder, onOpenBinder, onCardsPurchase }: GiftBuilderPanelProps) {
  const engine = useMemo(() => new DeterministicGiftSelectionEngine(), []);
  const [step, setStep] = useState<GiftStep>("details");
  const [preferences, setPreferences] = useState<GiftPreferences>(() => ({ ...initialPreferences, subjectQuery: initialSubjectQuery }));
  const [pokemonQuery, setPokemonQuery] = useState(initialSubjectQuery);
  const [discoveryMode, setDiscoveryMode] = useState<GiftDiscoveryMode>(initialDiscoveryMode);
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

  const selectedCardKeys = useMemo(
    () => new Set(selection?.selected.map((candidate) => candidate.card.key) ?? []),
    [selection],
  );
  const availableCandidates = useMemo(
    () => candidates.filter((candidate) => !selectedCardKeys.has(candidate.card.key) && !excludedKeys.has(candidate.card.key)),
    [candidates, excludedKeys, selectedCardKeys],
  );
  const candidateByKey = useMemo(() => new Map(candidates.map((candidate) => [candidate.card.key, candidate])), [candidates]);
  const recommendedBinderOffers = useMemo(() => {
    if (!binderOffers) return undefined;
    const available = binderOffers.filter((offer) => offer.status === "available");
    const capacityMatches = available.filter((offer) => !offer.capacityCards || offer.capacityCards >= preferences.targetCardCount);
    const layoutMatches = capacityMatches.filter((offer) => offer.pocketsPerPage === 9);
    const pool = layoutMatches.length ? layoutMatches : capacityMatches.length ? capacityMatches : available;
    return pool.toSorted((left, right) =>
      Number(right.pocketsPerPage === 9) - Number(left.pocketsPerPage === 9)
      || (left.price?.amountMinor ?? Number.MAX_SAFE_INTEGER) - (right.price?.amountMinor ?? Number.MAX_SAFE_INTEGER)
      || left.displayName.localeCompare(right.displayName, "de"),
    ).slice(0, 3);
  }, [binderOffers, preferences.targetCardCount]);

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
          || Number(!giftCandidateHasVerifiedFinish(left)) - Number(!giftCandidateHasVerifiedFinish(right))
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
        .filter(giftCandidateHasVerifiedFinish)
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
    const next = availableCandidates[0];
    if (!next) return;
    if (giftCandidateHasVerifiedFinish(next)) {
      setConfirmedVariantKeys((current) => new Set(current).add(next.card.key));
    }
    setSelection(summarizeSelection([...selection.selected, next], preferences, selection.issues));
  }

  function replaceCandidate(cardKey: string) {
    if (!selection) return;
    const replacement = availableCandidates[0];
    if (!replacement) return;
    setConfirmedVariantKeys((current) => {
      const next = new Set(current);
      next.delete(cardKey);
      if (giftCandidateHasVerifiedFinish(replacement)) next.add(replacement.card.key);
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

  function acceptRecommendedVariants() {
    if (!selection) return;
    setConfirmedVariantKeys((current) => {
      const next = new Set(current);
      for (const candidate of selection.selected) {
        if (isVariantSelectionValid(candidate.variant, variantAvailabilityForCard(candidate.card))) {
          next.add(candidate.card.key);
        }
      }
      return next;
    });
    setOpenVariantKey(undefined);
  }

  function applyConditionToAll(value: PurchasePreferences["minimumCondition"]) {
    setOrderCondition(value);
    setSelection((current) => current ? summarizeSelection(current.selected.map((candidate) => ({
      ...candidate,
      preferences: { ...candidate.preferences, minimumCondition: value },
    })), preferences, current.issues) : current);
  }

  const invalidOrderCandidates = selection?.selected.filter((candidate) =>
    !isVariantSelectionValid(candidate.variant, variantAvailabilityForCard(candidate.card))) ?? [];
  const recommendedOrderCandidates = selection?.selected.filter((candidate) =>
    isVariantSelectionValid(candidate.variant, variantAvailabilityForCard(candidate.card))
    && !confirmedVariantKeys.has(candidate.card.key)) ?? [];
  const pendingOrderCandidates = [...invalidOrderCandidates, ...recommendedOrderCandidates];
  const reviewReady = Boolean(selection?.selected.length === preferences.targetCardCount
    && pendingOrderCandidates.length === 0);
  const readyCardCount = (selection?.selected.length ?? 0) - pendingOrderCandidates.length;
  const missingSelectionCount = Math.max(preferences.targetCardCount - (selection?.selected.length ?? 0), 0);
  const estimatedRange = selection ? selectionRange(selection.selected) : undefined;
  const printSummary = selection && giftProject ? createGiftPrintSummary({ project: giftProject, selection, greeting }) : undefined;

  function guideToNextRequirement() {
    if (!selection) return;
    if (missingSelectionCount > 0) {
      setShowAll(true);
      window.requestAnimationFrame(() => {
        document.getElementById("gift-selection-tools")?.scrollIntoView?.({ behavior: "smooth", block: "center" });
      });
      return;
    }
    if (invalidOrderCandidates.length === 0 && recommendedOrderCandidates.length > 0) {
      acceptRecommendedVariants();
      setStep("review");
      return;
    }
    const nextCandidate = invalidOrderCandidates[0];
    if (nextCandidate) {
      setOpenVariantKey(nextCandidate.card.key);
      window.requestAnimationFrame(() => {
        const card = document.getElementById(candidateElementId(nextCandidate.card.key));
        card?.scrollIntoView?.({ behavior: "smooth", block: "center" });
        card?.querySelector<HTMLSelectElement>('select[aria-label="Ausführung der Karte"]')?.focus();
      });
      return;
    }
    setStep("review");
  }

  function addCandidateByKey(cardKey: string) {
    if (!selection || selection.selected.length >= preferences.targetCardCount) return;
    const candidate = candidateByKey.get(cardKey);
    if (!candidate || selection.selected.some((entry) => entry.card.key === cardKey)) return;
    if (giftCandidateHasVerifiedFinish(candidate)) {
      setConfirmedVariantKeys((current) => new Set(current).add(candidate.card.key));
    }
    setExcludedKeys((current) => {
      const next = new Set(current);
      next.delete(cardKey);
      return next;
    });
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

  return (
    <section className={styles.panel} aria-labelledby="gift-builder-heading">
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}><Gift aria-hidden="true" size={15} /> Persönliches Pokémon-Geschenk</p>
          <h1 id="gift-builder-heading">{STEP_GUIDANCE[step].title}</h1>
          <p className={styles.intro}>{STEP_GUIDANCE[step].text}</p>
        </div>
        <button type="button" className={styles.closeButton} onClick={onCancel} aria-label="Geschenk-Gestaltung schließen"><X size={18} /></button>
      </div>

      <ol className={styles.progressLine} aria-label="Schritte zum Geschenk-Binder">{GIFT_FLOW.map((item, index) => <li key={item.label} aria-current={index === (["details", "candidates", "review", "summary"] as const).indexOf(step) ? "step" : undefined}><span>{index + 1}</span>{item.label}</li>)}</ol>

      {error ? <div className={styles.error} role="alert"><strong>Vorschlag konnte nicht geladen werden</strong><span>{error}</span>{FEATURES.artworkReview && discoveryMode === "theme" ? <a className={styles.secondaryButton} href="/artwork-review/">Artwork lokal prüfen</a> : null}<button type="button" className={styles.secondaryButton} onClick={() => void createProposal()}><RefreshCw size={15} /> Erneut versuchen</button></div> : null}

      {step === "details" ? (
        <form className={styles.form} onSubmit={(event) => { event.preventDefault(); void createProposal(); }}>
          {smartSearch ? <fieldset className={styles.discoveryMode}>
            <legend>Was mag die beschenkte Person?</legend>
            <div className={styles.choiceRow}>
              <label className={styles.choice}><input type="radio" name="gift-discovery" checked={discoveryMode === "pokemon"} onChange={() => {
                setDiscoveryMode("pokemon");
                updatePreferences("subjectQuery", pokemonQuery);
              }} />Ein Lieblings-Pokémon</label>
              <label className={styles.choice}><input type="radio" name="gift-discovery" checked={discoveryMode === "theme"} onChange={() => setDiscoveryMode("theme")} />Ein Bildmotiv</label>
            </div>
          </fieldset> : null}
          <label className={styles.languageChoice}>Kartensprache
            <select disabled={discoveryMode === "theme"} value={discoveryMode === "theme" ? "en" : preferences.preferredLanguage ?? "de"} onChange={(event) => updatePreferences("preferredLanguage", event.target.value as "de" | "en") }>
              <option value="de">Deutsch</option><option value="en">English</option>
            </select>
            {discoveryMode === "theme" ? <small>Für Bildmotive gibt es derzeit nur geprüfte englische Karten.</small> : <small>{preferences.preferredLanguage === "de" ? "Suche mit deutschen Namen, zum Beispiel Glurak." : "Search with English names, for example Charizard."}</small>}
          </label>
          {discoveryMode === "pokemon" ? <label className={styles.subjectField}>Lieblings-Pokémon
            <span className={styles.inputWithIcon}><Search aria-hidden="true" size={17} /><input required value={pokemonQuery} onChange={(event) => {
              setPokemonQuery(event.target.value);
              updatePreferences("subjectQuery", event.target.value);
            }} placeholder="Zum Beispiel Pikachu" /></span>
          </label> : <fieldset className={styles.themePicker}>
            <legend>Wähle ein Motiv für die Seite</legend>
            <p>Zum Beispiel Meer, Wald oder Schnee. Wir zeigen Karten, auf denen das Motiv im Bild zu sehen ist.</p>
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
            <small>Motivseiten nutzen derzeit englische Kartenbilder. Du kannst später jede Karte austauschen.</small>
          </fieldset>}
          <div className={styles.quickChoices}>
            <fieldset><legend>Wie viele Karten?</legend><div className={styles.choiceRow}>{([9, 18, 36] as const).map((count) => <label key={count} className={styles.choice}><input type="radio" name="gift-count" checked={preferences.targetCardCount === count} onChange={() => updatePreferences("targetCardCount", count)} />{count === 9 ? "1 Seite · 9 Karten" : count === 18 ? "2 Seiten · 18 Karten" : "4 Seiten · 36 Karten"}</label>)}</div></fieldset>
            <label>Budget für die Karten
              <span className={styles.moneyInput}><input type="number" min="1" step="1" required value={preferences.budgetMinor / 100} onChange={(event) => updatePreferences("budgetMinor", Math.max(1, Math.round(Number(event.target.value || 0) * 100)))} /><select value={preferences.currency} onChange={(event) => updatePreferences("currency", event.target.value as GiftPreferences["currency"])} aria-label="Währung"><option value="EUR">EUR</option><option value="USD">USD</option></select></span>
              <small>Unverbindliche Schätzung. Tatsächliche Preise können abweichen.</small>
            </label>
          </div>
          <details className={styles.extraOptions}>
            <summary>Weitere Wünsche für das Geschenk <span>optional</span></summary>
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
              <label>Stil
                <select value={preferences.style} onChange={(event) => updatePreferences("style", event.target.value as GiftPreferences["style"])}><option value="mixed">Mix</option><option value="vintage">Vintage</option><option value="modern">Modern</option><option value="curated">Kuratiert</option></select>
              </label>
            </div>
            <label>Budgettoleranz
              <select value={preferences.budgetTolerancePercent ?? 0} onChange={(event) => updatePreferences("budgetTolerancePercent", Number(event.target.value) as GiftPreferences["budgetTolerancePercent"])}><option value="0">Keine</option><option value="5">Bis 5 %</option><option value="10">Bis 10 %</option><option value="15">Bis 15 %</option></select>
            </label>
            <label className={styles.orderConditionField}>Gewünschter Kartenzustand
              <select aria-label="Gewünschter Kartenzustand" value={orderCondition} onChange={(event) => setOrderCondition(event.target.value as PurchasePreferences["minimumCondition"])}>
                {conditionProfiles.map((profile) => <option value={profile.value} key={profile.value}>{profile.label}</option>)}
              </select>
              <span>{conditionProfile(orderCondition).providerSummary}. Diese Vorgabe gilt zunächst für alle vorgeschlagenen Karten und kann später einzeln geändert werden.</span>
            </label>
            <ConditionGuide />
          </details>
          <p className={styles.localHint}>{pricingEnabled ? `Geschenkangaben bleiben in diesem Browser. Kartenpreise sind unverbindliche Schätzungen ohne Versand und Steuern.${budgetGuaranteeEnabled ? "" : " Das Budget ist eine Orientierung."}` : "Geschenkangaben bleiben in diesem Browser. Die Preisprüfung ist derzeit deaktiviert; das Budget kann noch nicht zugesagt werden."}</p>
          <div className={styles.actions}><button type="button" className={styles.secondaryButton} onClick={onCancel}>Zurück</button><button type="submit" className={styles.primaryButton} disabled={loading || (discoveryMode === "theme" ? !selectedThemeId : !preferences.subjectQuery.trim())}>{loading ? <><LoaderCircle className={styles.spin} aria-hidden="true" size={16} /> Karten werden gesucht…</> : <>Binder-Seite ansehen <ArrowRight aria-hidden="true" size={18} /></>}</button></div>
        </form>
      ) : null}

      {step === "candidates" && selection ? (
        <div className={styles.resultsStep}>
          <div className={styles.summaryBar} data-status={selection.budgetStatus}><div><strong>{selection.selected.length} / {preferences.targetCardCount}</strong><span>ausgewählte Karten</span></div><div><strong>{pricingEnabled ? formatMoney(selection.estimatedTotalMinor, preferences.currency) : "Preisprüfung aus"}</strong><span>{pricingEnabled ? selection.budgetStatus === "unknown" ? "Schätzung unvollständig" : "geschätzter Kartenwert" : "noch nicht freigegeben"}</span></div><div><strong>{pricingEnabled ? selection.unpricedCount : "–"}</strong><span>{pricingEnabled ? "ohne Preis" : "keine Budgetzusage"}</span></div></div>
          {!pricingEnabled ? <p className={styles.gateNotice} role="status">Die Preisprüfung ist derzeit noch deaktiviert. Karten können trotzdem ausgewählt und als normaler Binder gespeichert werden; es gibt keine Budgetzusage.</p> : null}
          {pricingEnabled && !budgetGuaranteeEnabled ? <p className={styles.gateNotice} role="status">Schätzwert – den endgültigen Preis siehst du beim Kartenanbieter.</p> : null}
          {selection.budgetStatus === "over" ? <p className={styles.warning} role="status">Die geschätzten {formatMoney(selection.estimatedTotalMinor, preferences.currency)} liegen über deinem Budget von {formatMoney(preferences.budgetMinor, preferences.currency)}. Auch die günstigste vollständige Auswahl liegt derzeit darüber. Du kannst Wünsche oder Karten ändern.</p> : null}
          {selection.budgetStatus === "unknown" && pricingEnabled ? <p className={styles.warning} role="status">Für mindestens eine ausgewählte Karte fehlt ein Preis. Deshalb kann Cardfolio das Budget nicht vollständig berücksichtigen.</p> : null}
          <section className={styles.orderSetup} aria-labelledby="gift-order-setup-heading">
            <div>
              <strong id="gift-order-setup-heading">Bestellung vorbereiten</strong>
              <span>{invalidOrderCandidates.length > 0
                ? `${readyCardCount} von ${selection.selected.length} Karten sind fertig. ${invalidOrderCandidates.length} ${invalidOrderCandidates.length === 1 ? "Angabe fehlt" : "Angaben fehlen"}.`
                : recommendedOrderCandidates.length > 0
                  ? `Ausführung und Zustand sind für alle ${selection.selected.length} Karten vorausgewählt.`
                  : `Alle ${selection.selected.length} Karten sind vorbereitet.`}</span>
            </div>
            <label>Kartenzustand
              <select aria-label="Zustand für alle" value={orderCondition} onChange={(event) => applyConditionToAll(event.target.value as PurchasePreferences["minimumCondition"])}>
                {conditionProfiles.map((profile) => <option value={profile.value} key={profile.value}>{profile.label}</option>)}
              </select>
              <small>{conditionProfile(orderCondition).providerSummary}</small>
            </label>
          </section>
          {!reviewReady ? (
            <section className={styles.requirementGuide} data-kind={missingSelectionCount > 0 ? "selection" : invalidOrderCandidates.length > 0 ? "review" : "recommendation"} aria-labelledby="gift-requirement-heading" aria-live="polite">
              {missingSelectionCount === 0 && invalidOrderCandidates.length === 0 ? <Check aria-hidden="true" size={26} /> : <CircleAlert aria-hidden="true" size={26} />}
              <div>
                <span>Nächster Schritt</span>
                <h2 id="gift-requirement-heading">
                  {missingSelectionCount > 0
                    ? `Noch ${missingSelectionCount} ${missingSelectionCount === 1 ? "Karte" : "Karten"} auswählen`
                    : invalidOrderCandidates.length > 0
                      ? `Noch ${invalidOrderCandidates.length} ${invalidOrderCandidates.length === 1 ? "Angabe" : "Angaben"} korrigieren`
                    : "Auswahl bestätigen"}
                </h2>
                <p>{missingSelectionCount > 0
                  ? "Wähle die fehlenden Karten aus."
                  : invalidOrderCandidates.length > 0
                    ? "Öffne die rot markierten Karten und ergänze die fehlenden Angaben."
                    : "Alles ist vorbereitet. Du kannst einzelne Karten weiterhin ändern."}</p>
              </div>
              <button type="button" className={styles.requirementButton} onClick={guideToNextRequirement}>
                {missingSelectionCount > 0
                  ? "Fehlende Karte auswählen"
                  : invalidOrderCandidates.length > 0
                    ? "Erste fehlerhafte Angabe öffnen"
                    : "Empfehlung übernehmen & weiter"}
                <ArrowRight aria-hidden="true" size={18} />
              </button>
            </section>
          ) : (
            <p className={styles.readyNotice} role="status"><Check aria-hidden="true" size={18} /> Alle Karten sind bestellbereit. Du kannst jetzt zur Bestellprüfung weitergehen.</p>
          )}
          <div className={styles.cardGrid}>
            {selection.selected.map((candidate, index) => {
              const issue = variantSelectionIssue(candidate.variant, variantAvailabilityForCard(candidate.card));
              const hasRecommendation = !issue && !confirmedVariantKeys.has(candidate.card.key);
              const orderStatus = issue ? "invalid" : hasRecommendation ? "recommendation" : "ready";
              return <article className={styles.candidateCard} id={candidateElementId(candidate.card.key)} data-requires-review={Boolean(issue)} data-has-recommendation={hasRecommendation} key={candidate.card.key}>
                <CardArtwork card={candidate.card} className={styles.cardImage} fallback={<div className={styles.imageFallback}>Bild nicht verfügbar</div>} />
                {issue ? <span className={styles.reviewBadge}>Bitte korrigieren</span> : hasRecommendation ? <span className={styles.recommendationBadge}>Empfohlen</span> : null}
                <div className={styles.cardIdentity}><strong>{candidate.card.name}</strong><span>{candidate.card.setName} · Nr. {candidate.card.collectorNumber}</span><b>{pricingEnabled ? formatMoney(candidate.price.amountMinor, preferences.currency) : "Preisprüfung deaktiviert"}</b><small className={styles.priceMeta}>{pricingEnabled ? `${priceSourceLabel(candidate.price.source)} · Stand ${formatDate(candidate.price.sourceUpdatedAt ?? candidate.price.fetchedAt)}${formatRange(candidate.price.range, preferences.currency) ? ` · Spanne ${formatRange(candidate.price.range, preferences.currency)}` : ""}` : "Noch keine für diesen Ablauf freigegebene Preisquelle"}</small></div>
                <div className={styles.orderSummary} data-status={orderStatus}><strong>{issue ? "Angabe korrigieren" : hasRecommendation ? "Vorausgewählt" : "Bestellbereit"}</strong><span>{issue ?? `${formatVariantSelection(candidate.variant)} · ${conditionProfile(candidate.preferences.minimumCondition).shortLabel}`}</span></div>
                <div className={styles.cardActions}><button type="button" className={styles.linkButton} data-urgent={Boolean(issue)} onClick={() => setOpenVariantKey(openVariantKey === candidate.card.key ? undefined : candidate.card.key)}>{openVariantKey === candidate.card.key ? "Details schließen" : issue ? "Ausführung auswählen" : "Andere Ausführung wählen"}</button><button type="button" className={styles.replaceButton} onClick={() => replaceCandidate(candidate.card.key)} disabled={availableCandidates.length === 0} aria-label={availableCandidates.length > 0 ? `${candidate.card.name} austauschen` : `Keine alternative Karte für ${candidate.card.name} verfügbar`} title={availableCandidates.length > 0 ? "Gegen die nächste passende Karte austauschen" : "Alle passenden Karten sind bereits ausgewählt"}><RefreshCw aria-hidden="true" size={15} /><span>{availableCandidates.length > 0 ? "Austauschen" : "Keine Alternative"}</span></button><button type="button" className={styles.iconButton} onClick={() => removeCandidate(candidate.card.key)} aria-label={`${candidate.card.name} entfernen`}><X size={15} /></button></div>
                {openVariantKey === candidate.card.key ? <div className={styles.variantBox}><VariantFields variant={candidate.variant} preferences={candidate.preferences} availability={variantAvailabilityForCard(candidate.card)} onVariantChange={(variant) => updateVariant(candidate.card.key, variant)} onPreferencesChange={(next) => setSelection((current) => current ? summarizeSelection(current.selected.map((item) => item.card.key === candidate.card.key ? { ...item, preferences: next } : item), preferences, current.issues) : current)} />{issue ? <p className={styles.warning}>{issue}</p> : hasRecommendation ? <div className={styles.reviewInstructions}><strong>Cardfolio-Empfehlung</strong><p>Die Bestellangaben sind bereits sinnvoll vorausgewählt. Passe sie an, wenn du eine andere Ausführung möchtest.</p><button type="button" className={styles.secondaryButton} onClick={() => confirmVariant(candidate.card.key)}>Nur diese Empfehlung übernehmen</button></div> : null}</div> : null}
                <span className={styles.cardIndex}>{index + 1}</span>
              </article>;
            })}
          </div>
          {availableCandidates.length === 0 ? <section className={styles.candidateLimitNotice} role="status">
            <CircleAlert aria-hidden="true" size={21} />
            <div><strong>Keine weitere passende Karte verfügbar</strong><span>{discoveryMode === "theme" ? `Alle ${briefs.length} bestätigten Treffer für „${preferences.subjectQuery}“ sind bereits ausgewählt oder wurden entfernt.` : `Alle ${briefs.length} passenden Karten sind bereits ausgewählt oder wurden entfernt.`} {excludedKeys.size > 0 ? "Eine entfernte Karte kannst du unten erneut hinzufügen." : "Für einen anderen Vorschlag kannst du die Wünsche ändern."}</span></div>
            <button type="button" onClick={() => setStep("details")}>{discoveryMode === "theme" ? "Motiv ändern" : "Wünsche ändern"}<ArrowRight aria-hidden="true" size={16} /></button>
          </section> : null}
          <div className={styles.selectionTools} id="gift-selection-tools"><button type="button" className={styles.secondaryButton} onClick={addCandidate} disabled={selection.selected.length >= preferences.targetCardCount || availableCandidates.length === 0}>+ Karte hinzufügen</button><button type="button" className={styles.secondaryButton} onClick={() => setShowAll((current) => !current)}>{showAll ? "Trefferliste schließen" : `Alle passenden Karten ansehen (${briefs.length})`}</button></div>
          {showAll ? <div className={styles.allResults}>
            <p>{discoveryMode === "theme" ? `Die Liste enthält Artwork-Treffer zum Motiv „${preferences.subjectQuery}“ aus dem englischen Kartenkatalog.` : "Die Liste enthält Namens-Treffer. Karten, auf denen das Pokémon nur im Artwork vorkommt, sind nicht enthalten."}</p>
            {selection.selected.length >= preferences.targetCardCount ? <p className={styles.resultHint} role="status">Die Zielanzahl ist erreicht. Entferne zuerst oben eine Karte, um hier eine andere hinzuzufügen.</p> : null}
            <ul>{briefs.map((item) => {
              const cardKey = `tcgdex:${item.ref.id}:${item.ref.language}`;
              const candidate = candidateByKey.get(cardKey);
              const alreadySelected = selection.selected.some((entry) => entry.card.key === cardKey);
              const wasRemoved = excludedKeys.has(cardKey);
              const targetReached = selection.selected.length >= preferences.targetCardCount;
              const disabled = !candidate || alreadySelected || targetReached;
              const buttonLabel = !candidate ? "Nicht verfügbar" : alreadySelected ? "Ausgewählt" : targetReached ? "Zuerst Karte entfernen" : wasRemoved ? "Erneut hinzufügen" : "Hinzufügen";
              return <li key={`${item.ref.language}-${item.ref.id}`}>
                {candidate ? <CardArtwork card={candidate.card} className={styles.resultImage} fallback={<span className={styles.resultImageFallback}>Kein Bild</span>} /> : <span className={styles.resultImageFallback}>Kein Bild</span>}
                <span className={styles.resultIdentity}><strong>{item.name}</strong><small>{item.setName ? `${item.setName} · ` : ""}{item.ref.language.toUpperCase()} · Nr. {item.collectorNumber}</small></span>
                <button type="button" disabled={disabled} onClick={() => addCandidateByKey(cardKey)}>{buttonLabel}</button>
              </li>;
            })}</ul>
          </div> : null}
          <div className={styles.actions} id="gift-next-actions"><button type="button" className={styles.secondaryButton} onClick={() => setStep("details")}><ArrowLeft size={16} /> Wünsche ändern</button><button type="button" className={reviewReady ? styles.primaryButton : styles.guidanceButton} aria-label={reviewReady ? "Bestellung prüfen" : missingSelectionCount > 0 ? `Noch ${missingSelectionCount} ${missingSelectionCount === 1 ? "Karte" : "Karten"} auswählen` : invalidOrderCandidates.length > 0 ? `Noch ${invalidOrderCandidates.length} ${invalidOrderCandidates.length === 1 ? "Angabe" : "Angaben"} korrigieren` : "Empfehlung übernehmen und Bestellung prüfen"} onClick={guideToNextRequirement}>{reviewReady ? <>Weiter: Bestellung prüfen <ArrowRight size={18} /></> : missingSelectionCount > 0 ? <>Noch {missingSelectionCount} {missingSelectionCount === 1 ? "Karte" : "Karten"} auswählen <ArrowRight size={18} /></> : invalidOrderCandidates.length > 0 ? <>Angaben korrigieren <ArrowRight size={18} /></> : <>Empfehlung übernehmen &amp; weiter <ArrowRight size={18} /></>}</button></div>
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

          <div className={styles.purchaseFlowIntro} aria-labelledby="purchase-flow-heading">
            <p className={styles.eyebrow}>NOCH ZWEI SCHRITTE</p>
            <h3 id="purchase-flow-heading">Binder bestellen, dann Karten kaufen</h3>
            <p>Dein Plan ist gespeichert. Erledige beide Käufe nacheinander.</p>
          </div>
          <section className={styles.purchaseOptions} aria-label="Nächste Schritte: Karten und Binder kaufen">
            <article className={`${styles.purchaseCard} ${styles.purchaseCardFeatured}`}>
              <div><p className={styles.purchaseStep}>SCHRITT 1</p><h3>Passenden Binder bestellen</h3><p>Dieser Binder passt zum 3×3-Seitenplan.</p>
                {partnerLoadError ? <p role="status">Angebote sind momentan nicht erreichbar. Du kannst den lokalen Binder weiter bearbeiten.</p> : null}
                {!partnerLoadError && !binderOffers ? <p role="status">Binder-Angebote werden geprüft…</p> : null}
                {!partnerLoadError && recommendedBinderOffers?.length === 0 ? <p role="status">Zurzeit ist kein geprüfter Binder-Shop verfügbar. Du kannst den lokalen Binder trotzdem weiter bearbeiten.</p> : null}
                {recommendedBinderOffers?.length ? <p className={styles.binderMatch}><Check aria-hidden="true" size={20} /><span><strong>Passt zu deinem Plan</strong>{preferences.targetCardCount} Karten = {Math.ceil(preferences.targetCardCount / 9)} {Math.ceil(preferences.targetCardCount / 9) === 1 ? "Binder-Seite" : "Binder-Seiten"}.</span></p> : null}
                {recommendedBinderOffers?.map((offer, index) => {
                  const destinationUrl = offer.status === "available" ? partnerAdapter?.buildExternalUrl(offer.id) : undefined;
                  return <div className={styles.offerRow} data-recommended={index === 0} key={offer.id}>
                    <div><strong>{offer.displayName}{index === 0 ? <em>Empfohlen</em> : null}</strong><small>{offer.price ? `${offer.price.qualifier === "from" ? "ab " : ""}${formatMoney(offer.price.amountMinor, offer.price.currency)} · Stand ${formatDate(offer.price.sourceUpdatedAt)}` : "Kein bestätigter Binderpreis"}</small>
                      {offer.capacityCards ? <small>{offer.pocketsPerPage ? `${offer.pocketsPerPage}-Pocket · ` : ""}Platz für bis zu {offer.capacityCards} Karten</small> : null}
                      {offer.affiliateDisclosure ? <small>{offer.affiliateDisclosure}</small> : null}
                      {destinationUrl ? <small>Verfügbarkeit und Versand im Shop prüfen.</small> : null}
                      {offer.status !== "available" ? <small>{offer.statusReason ?? "Angebot nicht verfügbar."}</small> : null}
                    </div>
                    {destinationUrl ? <a className={styles.offerAction} href={destinationUrl} target="_blank" rel="noopener noreferrer">{offer.kind === "personalized" ? "Binder personalisieren" : "Diesen Binder bestellen"} <ExternalLink aria-hidden="true" size={15} /></a> : <button type="button" className={styles.offerAction} disabled>Derzeit nicht verfügbar</button>}
                  </div>;
                })}
              </div>
            </article>
            <article className={styles.purchaseCard}>
              <div><p className={styles.purchaseStep}>SCHRITT 2</p><h3>Kartenliste öffnen</h3><p>Wähle einen Anbieter und übernimm die vorbereitete Einkaufsliste.</p></div>
              <button type="button" className={styles.primaryButton} aria-label="Karten besorgen" onClick={onCardsPurchase}><ShoppingBag aria-hidden="true" size={18} /> Karten jetzt kaufen <ArrowRight aria-hidden="true" size={18} /></button>
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
