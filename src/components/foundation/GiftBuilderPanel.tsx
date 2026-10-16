"use client";

import { ArrowLeft, ArrowRight, Check, CircleAlert, Download, ExternalLink, Gift, LoaderCircle, Printer, RefreshCw, Search, ShoppingBag, X } from "lucide-react";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";

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
import { createInitialVariantSelection, isVariantSelectionValid, variantAvailabilityForCard, variantSelectionIssue } from "@/domain/variant-selection";

import { CardArtwork } from "./CardArtwork";
import { VariantFields } from "./VariantFields";
import {
  POPULAR_POKEMON,
  chunkIntoPages,
  hasBudgetSlack,
  plainPriceSource,
  plainVariantNote,
  popularPokemonName,
  translatePopularPokemon,
  type GiftLanguage,
} from "./gift-copy";
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

type GiftStep = "details" | "candidates" | "summary";
type GiftDiscoveryMode = "pokemon" | "theme";

const GIFT_STEPS: readonly GiftStep[] = ["details", "candidates", "summary"];
const GIFT_FLOW = [{ label: "Motiv wählen" }, { label: "Seite ansehen" }, { label: "Besorgen" }] as const;

const STEP_GUIDANCE: Record<GiftStep, { title: string; text: string }> = {
  details: { title: "Dein Geschenk-Binder beginnt hier", text: "Sag uns, was die Person mag. Wir zeigen dir sofort einen fertigen Vorschlag." },
  candidates: { title: "Deine erste Binder-Seite", text: "So könnte sie aussehen. Tippe eine Karte an, um sie genauer zu sehen, oder tausche sie aus." },
  summary: { title: "Dein Geschenk-Binder ist fertig geplant", text: "Jetzt fehlen nur noch der Binder und die Karten. Beides bestellst du in zwei Schritten bei Shops." },
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

function formatRange(range: Pick<GiftPriceRange, "lowMinor" | "highMinor"> | undefined, currency: GiftPreferences["currency"]): string | undefined {
  if (!range) return undefined;
  return `${formatMoney(range.lowMinor, currency)}–${formatMoney(range.highMinor, currency)}`;
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
  const [pokemonHelp, setPokemonHelp] = useState(false);
  const [orderCondition, setOrderCondition] = useState<PurchasePreferences["minimumCondition"]>("excellent");
  const [selectedThemeId, setSelectedThemeId] = useState<string>();
  const [briefs, setBriefs] = useState<CatalogSearchItem[]>([]);
  const [candidates, setCandidates] = useState<GiftCardCandidate[]>([]);
  const [selection, setSelection] = useState<GiftSelectionResult>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [showAll, setShowAll] = useState(false);
  const [inspectedKey, setInspectedKey] = useState<string>();
  const [variantBoxKey, setVariantBoxKey] = useState<string>();
  const [confirmedVariantKeys, setConfirmedVariantKeys] = useState<Set<string>>(new Set());
  const [excludedKeys, setExcludedKeys] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [giftProject, setGiftProject] = useState<GiftProject>();
  const [binderOffers, setBinderOffers] = useState<BinderOffer[]>();
  const [partnerAdapter, setPartnerAdapter] = useState<BinderAffiliateAdapter>();
  const [partnerLoadError, setPartnerLoadError] = useState<string>();
  const [greeting, setGreeting] = useState("");
  const stepMounted = useRef(false);

  const language: GiftLanguage = preferences.preferredLanguage ?? "de";
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
    if (!stepMounted.current) {
      stepMounted.current = true;
      return;
    }
    document.getElementById("gift-builder-heading")?.scrollIntoView?.({ block: "start" });
  }, [step]);

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

  function choosePokemon(name: string) {
    setPokemonQuery(name);
    updatePreferences("subjectQuery", name);
  }

  function changeLanguage(next: GiftLanguage) {
    updatePreferences("preferredLanguage", next);
    const translated = translatePopularPokemon(pokemonQuery, next);
    if (translated !== pokemonQuery) choosePokemon(translated);
  }

  async function createProposal() {
    setLoading(true);
    setError(undefined);
    setSelection(undefined);
    setInspectedKey(undefined);
    setVariantBoxKey(undefined);
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

  function closeInspector(cardKey: string) {
    setInspectedKey((current) => current === cardKey ? undefined : current);
    setVariantBoxKey((current) => current === cardKey ? undefined : current);
  }

  function removeCandidate(cardKey: string) {
    if (!selection) return;
    const nextExcluded = new Set(excludedKeys).add(cardKey);
    setExcludedKeys(nextExcluded);
    closeInspector(cardKey);
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
    closeInspector(cardKey);
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
    setVariantBoxKey(undefined);
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
  const missingSelectionCount = Math.max(preferences.targetCardCount - (selection?.selected.length ?? 0), 0);
  const canContinue = Boolean(selection) && missingSelectionCount === 0 && invalidOrderCandidates.length === 0;
  const printSummary = selection && giftProject ? createGiftPrintSummary({ project: giftProject, selection, greeting }) : undefined;
  const inspected = selection?.selected.find((candidate) => candidate.card.key === inspectedKey);

  function inspectCandidate(cardKey: string) {
    const opening = inspectedKey !== cardKey;
    setInspectedKey(opening ? cardKey : undefined);
    setVariantBoxKey(undefined);
    if (!opening) return;
    window.requestAnimationFrame(() => {
      document.getElementById(`${candidateElementId(cardKey)}-details`)?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
    });
  }

  function guideToNextRequirement() {
    if (!selection) return;
    if (missingSelectionCount > 0) {
      setShowAll(true);
      window.requestAnimationFrame(() => {
        document.getElementById("gift-selection-tools")?.scrollIntoView?.({ behavior: "smooth", block: "center" });
      });
      return;
    }
    const nextCandidate = invalidOrderCandidates[0];
    if (nextCandidate) {
      setInspectedKey(nextCandidate.card.key);
      setVariantBoxKey(nextCandidate.card.key);
      window.requestAnimationFrame(() => {
        const details = document.getElementById(`${candidateElementId(nextCandidate.card.key)}-details`);
        details?.scrollIntoView?.({ behavior: "smooth", block: "center" });
        details?.querySelector<HTMLSelectElement>('select[aria-label="Ausführung der Karte"]')?.focus();
      });
    }
  }

  async function continueToShopping() {
    if (!selection) return;
    if (!canContinue) {
      guideToNextRequirement();
      return;
    }
    // One tap accepts the recommended finish and condition for every card and saves the plan locally.
    if (recommendedOrderCandidates.length > 0) acceptRecommendedVariants();
    setSubmitting(true);
    setError(undefined);
    try {
      const project = await onCreateBinder(selection, preferences);
      setGiftProject(project);
      setStep("summary");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Der Geschenk-Binder konnte nicht angelegt werden.");
    } finally {
      setSubmitting(false);
    }
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

  function renderTile(candidate: GiftCardCandidate, index: number) {
    const key = candidate.card.key;
    const issue = variantSelectionIssue(candidate.variant, variantAvailabilityForCard(candidate.card));
    const note = plainVariantNote(candidate.variant);
    const open = inspectedKey === key;
    return <article className={styles.tile} id={candidateElementId(key)} data-requires-review={Boolean(issue)} data-open={open}>
      <button type="button" className={styles.tileImageButton} aria-expanded={open} aria-controls={open ? `${candidateElementId(key)}-details` : undefined} aria-label={`${candidate.card.name}, ${candidate.card.setName}: Details ${open ? "schließen" : "ansehen"}`} onClick={() => inspectCandidate(key)}>
        <CardArtwork card={candidate.card} className={styles.cardImage} fallback={<span className={styles.imageFallback}>Bild nicht verfügbar</span>} />
      </button>
      <span className={styles.tileIndex} aria-hidden="true">{index + 1}</span>
      {issue ? <span className={styles.tileFlag} data-kind="invalid">Prüfen</span> : note ? <span className={styles.tileFlag}>{note}</span> : null}
      <div className={styles.tileText}>
        <strong>{candidate.card.name}</strong>
        {pricingEnabled ? <b>{candidate.price.amountMinor === undefined ? "Preis offen" : `ca. ${formatMoney(candidate.price.amountMinor, preferences.currency)}`}</b> : null}
      </div>
      <div className={styles.tileActions}>
        <button type="button" className={styles.replaceButton} onClick={() => replaceCandidate(key)} disabled={availableCandidates.length === 0} aria-label={availableCandidates.length > 0 ? `${candidate.card.name} austauschen` : `Keine alternative Karte für ${candidate.card.name} verfügbar`} title={availableCandidates.length > 0 ? "Gegen die nächste passende Karte austauschen" : "Alle passenden Karten sind bereits ausgewählt"}><RefreshCw aria-hidden="true" size={15} /><span>{availableCandidates.length > 0 ? "Austauschen" : "Keine Alternative"}</span></button>
        <button type="button" className={styles.iconButton} onClick={() => removeCandidate(key)} aria-label={`${candidate.card.name} entfernen`}><X size={15} /></button>
      </div>
    </article>;
  }

  function renderInspector(candidate: GiftCardCandidate) {
    const key = candidate.card.key;
    const availability = variantAvailabilityForCard(candidate.card);
    const issue = variantSelectionIssue(candidate.variant, availability);
    const hasRecommendation = !issue && !confirmedVariantKeys.has(key);
    const variantOpen = variantBoxKey === key;
    const source = plainPriceSource(candidate.price.source);
    const range = formatRange(candidate.price.range, preferences.currency);
    const note = plainVariantNote(candidate.variant);
    return <section className={styles.inspector} id={`${candidateElementId(key)}-details`} aria-label={`Details zu ${candidate.card.name}`} data-requires-review={Boolean(issue)}>
      <div className={styles.inspectorHead}>
        <CardArtwork card={candidate.card} className={styles.inspectorImage} fallback={<span className={styles.imageFallback}>Bild nicht verfügbar</span>} />
        <div className={styles.inspectorText}>
          <h3>{candidate.card.name}</h3>
          <p>{candidate.card.setName} · Nr. {candidate.card.collectorNumber}</p>
          {pricingEnabled ? <p><strong>{candidate.price.amountMinor === undefined ? "Preis noch offen" : `ca. ${formatMoney(candidate.price.amountMinor, preferences.currency)}`}</strong>{source && candidate.price.amountMinor !== undefined ? <small> laut {source}, Stand {formatDate(candidate.price.sourceUpdatedAt ?? candidate.price.fetchedAt)}{range ? ` · Spanne ${range}` : ""}</small> : null}</p> : null}
          <p className={styles.inspectorStatus} data-status={issue ? "invalid" : "ready"}>
            {issue ? <><CircleAlert aria-hidden="true" size={16} /> {issue}</> : <><Check aria-hidden="true" size={16} /> Bestellangaben vollständig · Zustand: {conditionProfile(candidate.preferences.minimumCondition).shortLabel}{note ? ` · ${note}` : ""}</>}
          </p>
        </div>
        <button type="button" className={styles.iconButton} onClick={() => closeInspector(key)} aria-label="Detailansicht schließen"><X size={15} /></button>
      </div>
      <button type="button" className={styles.linkButton} data-urgent={Boolean(issue)} aria-expanded={variantOpen} onClick={() => setVariantBoxKey(variantOpen ? undefined : key)}>{variantOpen ? "Auswahl einklappen" : issue ? "Ausführung auswählen" : "Andere Ausführung wählen"}</button>
      {variantOpen ? <div className={styles.variantBox}><VariantFields variant={candidate.variant} preferences={candidate.preferences} availability={availability} onVariantChange={(variant) => updateVariant(key, variant)} onPreferencesChange={(next) => setSelection((current) => current ? summarizeSelection(current.selected.map((item) => item.card.key === key ? { ...item, preferences: next } : item), preferences, current.issues) : current)} />{issue ? <p className={styles.warning}>{issue}</p> : hasRecommendation ? <div className={styles.reviewInstructions}><strong>Cardfolio-Empfehlung</strong><p>Die Bestellangaben sind bereits sinnvoll vorausgewählt. Passe sie an, wenn du eine andere Ausführung möchtest.</p><button type="button" className={styles.secondaryButton} onClick={() => confirmVariant(key)}>Nur diese Empfehlung übernehmen</button></div> : null}</div> : null}
    </section>;
  }

  const pages = selection ? chunkIntoPages(selection.selected) : [];
  const startChoice = discoveryMode === "theme" ? "theme" : pokemonHelp ? "help" : "known";
  const continueLabel = missingSelectionCount > 0
    ? `Noch ${missingSelectionCount} ${missingSelectionCount === 1 ? "Karte" : "Karten"} auswählen`
    : invalidOrderCandidates.length > 0
      ? `Noch ${invalidOrderCandidates.length} ${invalidOrderCandidates.length === 1 ? "Angabe" : "Angaben"} korrigieren`
      : "Weiter zum Einkauf";

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

      <ol className={styles.progressLine} aria-label="Schritte zum Geschenk-Binder">{GIFT_FLOW.map((item, index) => <li key={item.label} aria-current={index === GIFT_STEPS.indexOf(step) ? "step" : undefined}><span>{index + 1}</span>{item.label}</li>)}</ol>

      {error ? <div className={styles.error} role="alert"><strong>Vorschlag konnte nicht geladen werden</strong><span>{error}</span>{FEATURES.artworkReview && discoveryMode === "theme" ? <a className={styles.secondaryButton} href="/artwork-review/">Artwork lokal prüfen</a> : null}<button type="button" className={styles.secondaryButton} onClick={() => void createProposal()}><RefreshCw size={15} /> Erneut versuchen</button></div> : null}

      {step === "details" ? (
        <form className={styles.form} onSubmit={(event) => { event.preventDefault(); void createProposal(); }}>
          <fieldset className={styles.discoveryMode}>
            <legend>Was mag die beschenkte Person?</legend>
            <div className={styles.choiceRow}>
              <label className={styles.choice}><input type="radio" name="gift-discovery" checked={startChoice === "known"} onChange={() => {
                setDiscoveryMode("pokemon");
                setPokemonHelp(false);
                updatePreferences("subjectQuery", pokemonQuery);
              }} />Ein Lieblings-Pokémon</label>
              <label className={styles.choice}><input type="radio" name="gift-discovery" checked={startChoice === "help"} onChange={() => {
                setDiscoveryMode("pokemon");
                setPokemonHelp(true);
                updatePreferences("subjectQuery", pokemonQuery);
              }} />Ich kenne mich nicht aus</label>
              {smartSearch ? <label className={styles.choice}><input type="radio" name="gift-discovery" checked={startChoice === "theme"} onChange={() => setDiscoveryMode("theme")} />Ein Bildmotiv</label> : null}
            </div>
          </fieldset>
          {discoveryMode === "pokemon" && !pokemonHelp ? <div className={styles.subjectField}>
            <label htmlFor="gift-subject">Lieblings-Pokémon</label>
            <span className={styles.inputWithIcon}><Search aria-hidden="true" size={17} /><input id="gift-subject" required aria-describedby="gift-subject-hint" value={pokemonQuery} onChange={(event) => choosePokemon(event.target.value)} placeholder={language === "de" ? "Zum Beispiel Pikachu oder Glurak" : "For example Pikachu or Charizard"} /></span>
            <small id="gift-subject-hint">{language === "de" ? "Den deutschen Namen eintippen, zum Beispiel Glurak." : "Search with English names, for example Charizard."}</small>
          </div> : null}
          {discoveryMode === "pokemon" ? <fieldset className={styles.popularPicks}>
            <legend>{pokemonHelp ? "Welches Pokémon gefällt dir am besten?" : "Oder wähle ein beliebtes Pokémon"}</legend>
            {pokemonHelp ? <p>Kein Problem – diese Pokémon kennt fast jeder. Du kannst später jede einzelne Karte austauschen.</p> : null}
            <div className={styles.pickGrid}>
              {POPULAR_POKEMON.map((entry) => {
                const name = popularPokemonName(entry, language);
                return <label className={styles.pickChoice} key={entry.en}>
                  <input type="radio" name="gift-popular" checked={pokemonQuery.trim().toLocaleLowerCase("de") === name.toLocaleLowerCase("de")} onChange={() => choosePokemon(name)} />
                  <span>{name}</span>
                </label>;
              })}
            </div>
          </fieldset> : <fieldset className={styles.themePicker}>
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
              <span className={styles.moneyInput}><input type="number" min="1" step="1" required value={preferences.budgetMinor / 100} onChange={(event) => updatePreferences("budgetMinor", Math.max(1, Math.round(Number(event.target.value || 0) * 100)))} /><span className={styles.currencySuffix} aria-hidden="true">{preferences.currency === "EUR" ? "€" : "$"}</span></span>
              <small>Das ist die Obergrenze für die Karten, ohne Versand.</small>
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
              <label className={styles.languageChoice}>Kartensprache
                <select disabled={discoveryMode === "theme"} value={discoveryMode === "theme" ? "en" : language} onChange={(event) => changeLanguage(event.target.value as GiftLanguage)}>
                  <option value="de">Deutsch</option><option value="en">English</option>
                </select>
                {discoveryMode === "theme" ? <small>Für Bildmotive gibt es derzeit nur geprüfte englische Karten.</small> : <small>{language === "de" ? "Deutsche Karten sind für Käufer in Deutschland meist die richtige Wahl." : "Englische Karten sind oft günstiger und besser verfügbar."}</small>}
              </label>
              <label>Währung
                <select value={preferences.currency} onChange={(event) => updatePreferences("currency", event.target.value as GiftPreferences["currency"])} aria-label="Währung"><option value="EUR">Euro (EUR)</option><option value="USD">US-Dollar (USD)</option></select>
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
          <p className={styles.localHint}>{pricingEnabled ? `Alles bleibt in diesem Browser. Kartenpreise sind unverbindliche Schätzungen ohne Versand und Steuern.${budgetGuaranteeEnabled ? "" : " Das Budget ist eine Orientierung."}` : "Alles bleibt in diesem Browser. Die Preisprüfung ist derzeit deaktiviert; das Budget kann noch nicht zugesagt werden."}</p>
          <div className={styles.actions}><button type="button" className={styles.secondaryButton} onClick={onCancel}>Zurück</button><button type="submit" className={styles.primaryButton} disabled={loading || (discoveryMode === "theme" ? !selectedThemeId : !preferences.subjectQuery.trim())}>{loading ? <><LoaderCircle className={styles.spin} aria-hidden="true" size={16} /> Karten werden gesucht…</> : <>Binder-Seite ansehen <ArrowRight aria-hidden="true" size={18} /></>}</button></div>
        </form>
      ) : null}

      {step === "candidates" && selection ? (
        <div className={styles.resultsStep}>
          <div className={styles.pageSummary} data-status={selection.budgetStatus}>
            <div><strong>{selection.selected.length} / {preferences.targetCardCount}</strong><span>Karten</span></div>
            <div><strong>{pricingEnabled ? formatMoney(selection.estimatedTotalMinor, preferences.currency) : "Preisprüfung aus"}</strong><span>{pricingEnabled ? selection.budgetStatus === "unknown" ? "Schätzung unvollständig" : "geschätzter Wert" : "keine Budgetzusage"}</span></div>
          </div>
          {!pricingEnabled ? <p className={styles.gateNotice} role="status">Die Preisprüfung ist derzeit noch deaktiviert. Karten können trotzdem ausgewählt und als normaler Binder gespeichert werden; es gibt keine Budgetzusage.</p> : null}
          {pricingEnabled && !budgetGuaranteeEnabled ? <p className={styles.gateNotice} role="status">Schätzwert – den endgültigen Preis siehst du beim Kartenanbieter.</p> : null}
          {pricingEnabled && hasBudgetSlack(selection.estimatedTotalMinor, preferences.budgetMinor) ? <p className={styles.gateNotice} role="status">Das liegt deutlich unter deinem Budget von {formatMoney(preferences.budgetMinor, preferences.currency)}. Das Budget ist nur die Obergrenze – du kannst Karten austauschen oder unter „Wünsche ändern“ mehr Karten wählen.</p> : null}
          {selection.budgetStatus === "over" ? <p className={styles.warning} role="status">Die geschätzten {formatMoney(selection.estimatedTotalMinor, preferences.currency)} liegen über deinem Budget von {formatMoney(preferences.budgetMinor, preferences.currency)}. Auch die günstigste vollständige Auswahl liegt derzeit darüber. Du kannst Wünsche oder Karten ändern.</p> : null}
          {selection.budgetStatus === "unknown" && pricingEnabled ? <p className={styles.warning} role="status">Für mindestens eine ausgewählte Karte fehlt ein Preis. Deshalb kann Cardfolio das Budget nicht vollständig berücksichtigen.</p> : null}
          {pages.map((pageCards, pageIndex) => {
            const inspectedPosition = pageCards.findIndex((candidate) => candidate.card.key === inspected?.card.key);
            return <div className={styles.pageBlock} key={pageCards[0]?.card.key ?? pageIndex}>
              {pages.length > 1 ? <h2 className={styles.pageLabel}>Seite {pageIndex + 1}</h2> : null}
              <div className={styles.cardGrid}>
                {pageCards.map((candidate, indexInPage) => {
                  const rowEnd = indexInPage % 3 === 2 || indexInPage === pageCards.length - 1;
                  const inspectedInRow = inspected !== undefined && inspectedPosition >= 0 && Math.floor(inspectedPosition / 3) === Math.floor(indexInPage / 3);
                  return <Fragment key={candidate.card.key}>
                    {renderTile(candidate, pageIndex * 9 + indexInPage)}
                    {rowEnd && inspectedInRow && inspected ? renderInspector(inspected) : null}
                  </Fragment>;
                })}
              </div>
            </div>;
          })}
          <details className={styles.conditionBox}>
            <summary>Kartenzustand: <strong>{conditionProfile(orderCondition).shortLabel}</strong> <span>ändern</span></summary>
            <label>Zustand für alle Karten
              <select aria-label="Zustand für alle" value={orderCondition} onChange={(event) => applyConditionToAll(event.target.value as PurchasePreferences["minimumCondition"])}>
                {conditionProfiles.map((profile) => <option value={profile.value} key={profile.value}>{profile.label}</option>)}
              </select>
              <small>{conditionProfile(orderCondition).providerSummary}</small>
            </label>
          </details>
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
          <div className={styles.actions} id="gift-next-actions"><button type="button" className={styles.secondaryButton} onClick={() => setStep("details")}><ArrowLeft size={16} /> Wünsche ändern</button><button type="button" className={canContinue ? styles.primaryButton : styles.guidanceButton} aria-label={continueLabel} disabled={submitting} onClick={() => void continueToShopping()}>{submitting ? <><LoaderCircle className={styles.spin} aria-hidden="true" size={16} /> Wird gespeichert…</> : <>{continueLabel} <ArrowRight size={18} /></>}</button></div>
        </div>
      ) : null}

      {step === "summary" && selection && giftProject && printSummary ? (
        <div className={styles.summaryStep}>
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

          <article className={styles.printSummary} aria-labelledby="gift-summary-title">
            <header className={styles.summaryHeader}>
              <p className={styles.eyebrow}><Check aria-hidden="true" size={15} /> Lokal angelegt</p>
              <h2 id="gift-summary-title">{printSummary.title}</h2>
              <p>{printSummary.recipientName ? `Für ${printSummary.recipientName} · ` : ""}{printSummary.subject} · {printSummary.cardCount} Karten</p>
            </header>
            {printSummary.greeting ? <blockquote className={styles.greetingPreview}>{printSummary.greeting}</blockquote> : null}
            <dl className={styles.summaryMeta}>
              <div><dt>{pricingEnabled ? "Geschätzter Kartenwert" : "Preisprüfung"}</dt><dd>{pricingEnabled ? formatMoney(printSummary.cardPurchase.estimatedValueMinor, printSummary.cardPurchase.currency) : "Deaktiviert"}</dd></div>
              {pricingEnabled ? <div><dt>Geschätzte Preisspanne</dt><dd>{formatRange(printSummary.cardPurchase.estimatedRange, printSummary.cardPurchase.currency) ?? "Nicht vollständig verfügbar"}</dd></div> : <div><dt>Budget</dt><dd>Keine Budgetzusage</dd></div>}
              {pricingEnabled && printSummary.cardPurchase.unknownPriceCount > 0 ? <div><dt>Ohne Preis</dt><dd>{printSummary.cardPurchase.unknownPriceCount} {printSummary.cardPurchase.unknownPriceCount === 1 ? "Karte" : "Karten"}</dd></div> : null}
            </dl>
            <p className={styles.summaryDisclosure}>Karten und physischer Binder sind getrennte Käufe. {pricingEnabled ? "Die Kartenpreise sind Schätzwerte; Versand und Steuern sind nicht enthalten." : "Für Karten wird derzeit kein Preis berechnet und keine Budgetzusage abgegeben."} Alle Geschenkangaben bleiben lokal in diesem Browser.</p>
            <section className={styles.summaryCards} aria-labelledby="summary-cards-heading">
              <h3 id="summary-cards-heading">Karten im Binder</h3>
              <ol>{printSummary.cards.map((card, index) => {
                const candidate = selection.selected[index];
                const note = candidate ? plainVariantNote(candidate.variant) : undefined;
                return <li key={candidate?.card.key ?? `${card.name}-${card.setName}-${card.collectorNumber}-${index}`}>
                  {candidate ? <CardArtwork card={candidate.card} className={styles.summaryCardImage} fallback={<span className={styles.summaryCardImageFallback}>Kein Bild</span>} /> : <span className={styles.summaryCardImageFallback}>Kein Bild</span>}
                  <span className={styles.summaryCardIdentity}>
                    <strong>{card.name}</strong>
                    <small className={styles.screenOnly}>{card.setName} · Nr. {card.collectorNumber}{note ? ` · ${note}` : ""}</small>
                    <small className={styles.printOnly}>{card.setName} · Nr. {card.collectorNumber} · {card.language.toUpperCase()} · {card.variant}</small>
                  </span>
                </li>;
              })}</ol>
            </section>
            <p className={styles.localHint}>Die Bildschirmansicht zeigt verfügbare Katalogbilder. Druckansicht und Textdatei enthalten nur Kartenangaben und keine Pokémon-Kartenbilder oder Logos. Persönliche Fotos werden nicht hochgeladen.</p>
          </article>

          <label className={styles.greetingField}>Grußtext für die lokale Druckansicht <span>(optional, nur in diesem Browser)</span>
            <textarea value={greeting} maxLength={500} rows={3} onChange={(event) => setGreeting(event.target.value)} placeholder="Viel Freude mit deinem Binder!" />
          </label>

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
