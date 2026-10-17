"use client";

import { ArrowLeft, ArrowRight, Check, CircleAlert, Download, ExternalLink, Gift, LoaderCircle, Printer, RefreshCw, Search, ShoppingBag, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

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
import { matchesGiftSubject, separateRepeatedCards } from "@/domain/gift-subject";
import type { SmartSearchAdapter } from "@/domain/semantic-card-search";
import type { CardSnapshot, CatalogSearchItem, PurchasePreferences, VariantSelection } from "@/domain/types";
import { createInitialVariantSelection, isVariantSelectionValid, variantAvailabilityForCard, variantSelectionIssue } from "@/domain/variant-selection";

import { CardArtwork } from "./CardArtwork";
import { GiftBinderSpread, type SpreadPocket } from "./GiftBinderSpread";
import { clearGiftResume, readGiftResume, saveGiftResume } from "./gift-resume";
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
  loader: Pick<GiftCandidateLoader, "loadCandidatePool" | "hydrateCandidates"> & Partial<Pick<GiftCandidateLoader, "countSubjectCards">>;
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

const AVAILABILITY_CAP = 80;
/** Average price per card below which the shipping cost is likely to exceed what a single card costs. */
const CHEAP_CARD_MINOR = 150;

/** The largest binder size (9, 18 or 36 cards) that `count` cards can fill; one page is always possible. */
function largestPlanSize(count: number): 9 | 18 | 36 {
  return count >= 36 ? 36 : count >= 18 ? 18 : 9;
}

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

/** Technical error texts (for example a list of data-validation problems) mean nothing to a gift buyer. */
function friendlyError(cause: unknown, fallback: string): string {
  if (!(cause instanceof Error)) return fallback;
  const technical = cause.name === "ZodError" || cause.message.length > 180 || /^\s*[[{]/.test(cause.message);
  return technical ? "Einige Kartendaten konnten gerade nicht gelesen werden. Bitte versuche es noch einmal." : cause.message;
}

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

/** Sum of the cards that have a price; a missing price on one card must not hide the total of the others. */
function knownTotal(selected: readonly GiftCardCandidate[]): { totalMinor: number; priced: number; unpriced: number } {
  let totalMinor = 0;
  let priced = 0;
  for (const candidate of selected) {
    if (candidate.price.amountMinor === undefined) continue;
    totalMinor += candidate.price.amountMinor;
    priced += 1;
  }
  return { totalMinor, priced, unpriced: selected.length - priced };
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
  const engine = useMemo(() => new DeterministicGiftSelectionEngine({ spendBudget: true }), []);
  // A finished plan comes back after a detour to the purchase view or the browser's back button.
  const [resumed] = useState(() => readGiftResume());
  const [step, setStep] = useState<GiftStep>(resumed ? "summary" : "details");
  const [preferences, setPreferences] = useState<GiftPreferences>(() => resumed?.preferences ?? { ...initialPreferences, subjectQuery: initialSubjectQuery });
  const [pokemonQuery, setPokemonQuery] = useState(resumed?.preferences.subjectQuery ?? initialSubjectQuery);
  const [discoveryMode, setDiscoveryMode] = useState<GiftDiscoveryMode>(initialDiscoveryMode);
  const [pokemonHelp, setPokemonHelp] = useState(false);
  const [orderCondition, setOrderCondition] = useState<PurchasePreferences["minimumCondition"]>("excellent");
  const [selectedThemeId, setSelectedThemeId] = useState<string>();
  const [briefs, setBriefs] = useState<CatalogSearchItem[]>([]);
  const [candidates, setCandidates] = useState<GiftCardCandidate[]>([]);
  const [selection, setSelection] = useState<GiftSelectionResult | undefined>(resumed?.selection);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [showAll, setShowAll] = useState(false);
  const [eraNote, setEraNote] = useState<string>();
  const [inspectedKey, setInspectedKey] = useState<string>();
  const [variantBoxKey, setVariantBoxKey] = useState<string>();
  const [confirmedVariantKeys, setConfirmedVariantKeys] = useState<Set<string>>(new Set());
  const [excludedKeys, setExcludedKeys] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [giftProject, setGiftProject] = useState<GiftProject | undefined>(resumed?.project);
  const [binderOffers, setBinderOffers] = useState<BinderOffer[]>();
  const [partnerAdapter, setPartnerAdapter] = useState<BinderAffiliateAdapter>();
  const [partnerLoadError, setPartnerLoadError] = useState<string>();
  const [greeting, setGreeting] = useState(resumed?.greeting ?? "");
  const stepMounted = useRef(false);
  // How many cards exist for the chosen Pokémon, so a size that cannot be met is not offered.
  const [availability, setAvailability] = useState<{ key: string; count: number; capped: boolean }>();
  const availabilityKey = `${preferences.preferredLanguage ?? "de"}:${pokemonQuery.trim().toLocaleLowerCase("de")}`;

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
  const planSize = selection?.selected.length || preferences.targetCardCount;
  const recommendedBinderOffers = useMemo(() => {
    if (!binderOffers) return undefined;
    const available = binderOffers.filter((offer) => offer.status === "available");
    const capacityMatches = available.filter((offer) => !offer.capacityCards || offer.capacityCards >= planSize);
    const layoutMatches = capacityMatches.filter((offer) => offer.pocketsPerPage === 9);
    const pool = layoutMatches.length ? layoutMatches : capacityMatches.length ? capacityMatches : available;
    return pool.toSorted((left, right) =>
      Number(right.pocketsPerPage === 9) - Number(left.pocketsPerPage === 9)
      || (left.price?.amountMinor ?? Number.MAX_SAFE_INTEGER) - (right.price?.amountMinor ?? Number.MAX_SAFE_INTEGER)
      || left.displayName.localeCompare(right.displayName, "de"),
    ).slice(0, 3);
  }, [binderOffers, planSize]);

  useEffect(() => {
    const subject = pokemonQuery.trim();
    if (step !== "details" || discoveryMode !== "pokemon" || subject.length < 2) return;
    const searchLanguage = preferences.preferredLanguage ?? "de";
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          let count: number;
          let capped: boolean;
          if (typeof loader.countSubjectCards === "function") {
            ({ count, capped } = await loader.countSubjectCards({ subjectQuery: subject, language: searchLanguage }, controller.signal));
          } else {
            const items = await loader.loadCandidatePool({ subjectQuery: subject, language: searchLanguage, maximum: AVAILABILITY_CAP, pageSize: 24 }, controller.signal);
            if (!Array.isArray(items)) return;
            count = items.filter((item) => matchesGiftSubject({ name: item.name }, subject)).length;
            capped = items.length >= AVAILABILITY_CAP;
          }
          if (controller.signal.aborted) return;
          setAvailability({ key: `${searchLanguage}:${subject.toLocaleLowerCase("de")}`, count, capped });
          // A size the catalogue cannot fill is lowered to the largest one that it can.
          setPreferences((current) => current.targetCardCount > largestPlanSize(count) && !capped
            ? { ...current, targetCardCount: largestPlanSize(count) }
            : current);
        } catch {
          // The count is only a hint; without it every size stays selectable.
        }
      })();
    }, 400);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [discoveryMode, loader, pokemonQuery, preferences.preferredLanguage, step]);

  useEffect(() => {
    if (!stepMounted.current) {
      stepMounted.current = true;
      return;
    }
    document.getElementById("gift-builder-heading")?.scrollIntoView?.({ block: "start" });
  }, [step]);

  useEffect(() => {
    if (step === "summary" && selection && giftProject) saveGiftResume({ selection, preferences, project: giftProject, greeting });
  }, [step, selection, giftProject, preferences, greeting]);

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

  function leaveFlow() {
    clearGiftResume();
    onCancel();
  }

  function openBinder() {
    clearGiftResume();
    onOpenBinder();
  }

  function choosePokemon(name: string) {
    setPokemonQuery(name);
    updatePreferences("subjectQuery", name);
  }

  function changeLanguage(next: GiftLanguage) {
    updatePreferences("preferredLanguage", next);
    const translated = translatePopularPokemon(pokemonQuery, next);
    if (translated !== pokemonQuery) choosePokemon(translated);
  }

  async function createProposal(override?: GiftPreferences) {
    const wanted = override ?? preferences;
    setLoading(true);
    setError(undefined);
    setSelection(undefined);
    setInspectedKey(undefined);
    setVariantBoxKey(undefined);
    setEraNote(undefined);
    setConfirmedVariantKeys(new Set());
    setExcludedKeys(new Set());
    try {
      const maximum = Math.min(80, Math.max(40, wanted.targetCardCount * 3));
      const theme = discoveryMode === "theme" ? giftThemePreset(selectedThemeId) : undefined;
      const pool = theme && smartSearch
        ? (await smartSearch.search({
          text: theme.query,
          language: "en",
          limit: maximum,
          matchQuality: "dominant",
        })).map((hit): CatalogSearchItem => ({ ref: hit.ref, name: theme.label, collectorNumber: "" }))
        : await loader.loadCandidatePool({
          subjectQuery: wanted.subjectQuery,
          language: wanted.preferredLanguage ?? "en",
          maximum,
          pageSize: 24,
          scan: 480,
          era: wanted.style === "vintage" || wanted.style === "modern" ? wanted.style : undefined,
        });
      if (!pool.length) {
        setError(theme
          ? "Für dieses Motiv gibt es noch keine visuell bestätigten dominanten Artwork-Treffer. Prüfe zuerst Karten in der lokalen Artwork-Prüfung."
          : "Keine Karten mit diesem Namen gefunden. Prüfe Schreibweise oder Sprache.");
        return;
      }
      if (theme && pool.length < wanted.targetCardCount) {
        setError(`Für „${theme.label}“ sind erst ${pool.length} dominante Artwork-Treffer geprüft. Für diesen Binder werden ${wanted.targetCardCount} benötigt; unbestätigte Treffer werden nicht mehr automatisch ergänzt.`);
        return;
      }
      const hydrated = await loader.hydrateCandidates(pool, {
        currency: wanted.currency,
        variantFor: defaultVariant,
        concurrency: 4,
        preferences: { minimumCondition: orderCondition },
      });
      const safe = hydrated
        .map((candidate) => safeCandidate(candidate, pricingEnabled, wanted.currency))
        .toSorted((left, right) =>
          Number(!giftCandidateHasArtwork(left)) - Number(!giftCandidateHasArtwork(right))
          || Number(!giftCandidateHasVerifiedFinish(left)) - Number(!giftCandidateHasVerifiedFinish(right))
          || Number(!giftCandidateHasPrice(left)) - Number(!giftCandidateHasPrice(right))
          || (left.price.amountMinor ?? Number.MAX_SAFE_INTEGER) - (right.price.amountMinor ?? Number.MAX_SAFE_INTEGER)
          || left.card.key.localeCompare(right.card.key));
      // Only the Pokémon itself (not "Evolith" for "Evoli"), and cards that look different first: reprints with
      // the same attacks come last and are only used when too few different cards exist.
      const relevant = theme ? safe : safe.filter((candidate) => matchesGiftSubject(candidate.card, wanted.subjectQuery));
      const subjectPool = relevant.length >= wanted.targetCardCount ? relevant : safe;
      const { distinct, ordered } = separateRepeatedCards(subjectPool);
      const selectionPool = distinct.length >= wanted.targetCardCount ? distinct : ordered;
      setBriefs(ordered.map(({ card }) => ({
        ref: card.ref,
        name: card.name,
        collectorNumber: card.collectorNumber,
        imageBaseUrl: card.imageBaseUrl,
        setId: card.setId,
        setName: card.setName,
      })));
      setCandidates(ordered);
      setConfirmedVariantKeys(new Set(ordered
        .filter(giftCandidateHasVerifiedFinish)
        .map((candidate) => candidate.card.key)));
      const selectionCandidates = budgetGuaranteeEnabled ? selectionPool : selectionPool.map((candidate) => candidate.price.confidence === "usable" ? {
        ...candidate,
        price: { ...candidate.price, confidence: "approximate" as const, issues: [...candidate.price.issues, "estimate-only-no-budget-guarantee"] },
      } : candidate);
      let result = engine.select({ candidates: selectionCandidates, preferences: wanted });
      let note: string | undefined;
      if ((wanted.style === "vintage" || wanted.style === "modern") && result.selected.length < wanted.targetCardCount) {
        // Too few cards of the wished era: top up with the best of the others instead of showing a half page.
        const mixed = engine.select({ candidates: selectionCandidates, preferences: { ...wanted, style: "mixed" } });
        const have = new Set(result.selected.map((candidate) => candidate.card.key));
        const filled = [...result.selected, ...mixed.selected.filter((candidate) => !have.has(candidate.card.key))].slice(0, wanted.targetCardCount);
        note = `Es gibt nicht genug ${wanted.style === "vintage" ? "alte" : "moderne"} Karten. Den Rest haben wir mit ${wanted.style === "vintage" ? "neueren" : "älteren"} Karten aufgefüllt.`;
        result = summarizeSelection(filled, wanted, result.issues);
      }
      setEraNote(note);
      setSelection(result);
      setStep("candidates");
    } catch (cause) {
      setError(friendlyError(cause, "Karten konnten nicht geladen werden. Prüfe die Verbindung und versuche es erneut."));
    } finally {
      setLoading(false);
    }
  }

  /** The German catalogue is smaller: offer the same Pokémon in English in one step. */
  function searchInEnglish() {
    const subject = translatePopularPokemon(preferences.subjectQuery, "en");
    const next: GiftPreferences = { ...preferences, preferredLanguage: "en", subjectQuery: subject };
    setPreferences(next);
    setPokemonQuery(subject);
    void createProposal(next);
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

  function swapCandidates(fromKey: string, toKey: string) {
    if (!selection || fromKey === toKey) return;
    const from = selection.selected.findIndex((candidate) => candidate.card.key === fromKey);
    const to = selection.selected.findIndex((candidate) => candidate.card.key === toKey);
    if (from < 0 || to < 0) return;
    const next = [...selection.selected];
    [next[from], next[to]] = [next[to], next[from]];
    setSelection(summarizeSelection(next, preferences, selection.issues));
  }

  function moveCandidate(cardKey: string, offset: -1 | 1) {
    if (!selection) return;
    const index = selection.selected.findIndex((candidate) => candidate.card.key === cardKey);
    const target = selection.selected[index + offset];
    if (index < 0 || !target) return;
    swapCandidates(cardKey, target.card.key);
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
  // No further card exists (the catalogue is the limit): continue with what there is instead of a dead end.
  const shortfall = Boolean(selection?.selected.length) && missingSelectionCount > 0 && availableCandidates.length === 0;
  const canContinue = Boolean(selection) && (missingSelectionCount === 0 || shortfall) && invalidOrderCandidates.length === 0;
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
      <div className={styles.inspectorActions}>
        <button type="button" className={styles.replaceButton} onClick={() => replaceCandidate(key)} disabled={availableCandidates.length === 0} aria-label={availableCandidates.length > 0 ? `${candidate.card.name} austauschen` : `Keine alternative Karte für ${candidate.card.name} verfügbar`} title={availableCandidates.length > 0 ? "Gegen die nächste passende Karte austauschen" : "Alle passenden Karten sind bereits ausgewählt"}><RefreshCw aria-hidden="true" size={15} /><span>{availableCandidates.length > 0 ? "Austauschen" : "Keine Alternative"}</span></button>
        <button type="button" className={styles.replaceButton} onClick={() => removeCandidate(key)} aria-label={`${candidate.card.name} entfernen`}><X aria-hidden="true" size={15} /><span>Entfernen</span></button>
        <button type="button" className={styles.replaceButton} onClick={() => moveCandidate(key, -1)} disabled={(selection?.selected.findIndex((entry) => entry.card.key === key) ?? 0) <= 0} aria-label={`${candidate.card.name} eine Position nach vorn`}><ArrowLeft aria-hidden="true" size={15} /><span>Nach vorn</span></button>
        <button type="button" className={styles.replaceButton} onClick={() => moveCandidate(key, 1)} disabled={(selection?.selected.findIndex((entry) => entry.card.key === key) ?? 0) >= (selection?.selected.length ?? 0) - 1} aria-label={`${candidate.card.name} eine Position nach hinten`}><span>Nach hinten</span><ArrowRight aria-hidden="true" size={15} /></button>
      </div>
      <button type="button" className={styles.linkButton} data-urgent={Boolean(issue)} aria-expanded={variantOpen} onClick={() => setVariantBoxKey(variantOpen ? undefined : key)}>{variantOpen ? "Auswahl einklappen" : issue ? "Ausführung auswählen" : "Andere Ausführung wählen"}</button>
      {variantOpen ? <div className={styles.variantBox}><VariantFields variant={candidate.variant} preferences={candidate.preferences} availability={availability} onVariantChange={(variant) => updateVariant(key, variant)} onPreferencesChange={(next) => setSelection((current) => current ? summarizeSelection(current.selected.map((item) => item.card.key === key ? { ...item, preferences: next } : item), preferences, current.issues) : current)} />{issue ? <p className={styles.warning}>{issue}</p> : hasRecommendation ? <div className={styles.reviewInstructions}><strong>Cardfolio-Empfehlung</strong><p>Die Bestellangaben sind bereits sinnvoll vorausgewählt. Passe sie an, wenn du eine andere Ausführung möchtest.</p><button type="button" className={styles.secondaryButton} onClick={() => confirmVariant(key)}>Nur diese Empfehlung übernehmen</button></div> : null}</div> : null}
    </section>;
  }

  const pages = selection ? chunkIntoPages(selection.selected) : [];
  const currentAvailability = availability?.key === availabilityKey ? availability : undefined;
  const planLimit = currentAvailability && !currentAvailability.capped ? currentAvailability.count : undefined;
  const availabilitySubject = pokemonQuery.trim();
  const availabilityText = !currentAvailability
    ? undefined
    : currentAvailability.capped
      ? `Für „${availabilitySubject}“ gibt es viele Karten – genug für jede Größe.`
      : currentAvailability.count === 0
        ? `Zu „${availabilitySubject}“ haben wir keine Karten gefunden. Prüfe die Schreibweise.`
        : `Für „${availabilitySubject}“ gibt es ${currentAvailability.count} ${currentAvailability.count === 1 ? "Karte" : "Karten"} auf ${language === "de" ? "Deutsch" : "Englisch"}.${currentAvailability.count < 36 && language === "de" ? " Auf Englisch gibt es oft mehr." : ""}`;
  const totals = knownTotal(selection?.selected ?? []);
  const cheapCards = totals.priced > 0 && totals.priced * 2 >= (selection?.selected.length ?? 0) && totals.totalMinor / totals.priced < CHEAP_CARD_MINOR;
  const spreadPages: SpreadPocket[][] = pages.map((pageCards) => pageCards.map((candidate) => {
    const issue = variantSelectionIssue(candidate.variant, variantAvailabilityForCard(candidate.card));
    const note = plainVariantNote(candidate.variant);
    return {
      key: candidate.card.key,
      card: candidate.card,
      flag: issue ? { text: "Prüfen", invalid: true } : note ? { text: note, invalid: false } : undefined,
      price: pricingEnabled ? (candidate.price.amountMinor === undefined ? "Preis offen" : `ca. ${formatMoney(candidate.price.amountMinor, preferences.currency)}`) : undefined,
    };
  }));
  const startChoice = discoveryMode === "theme" ? "theme" : pokemonHelp ? "help" : "known";
  const continueLabel = shortfall
    ? `Mit ${selection?.selected.length} Karten weiter`
    : missingSelectionCount > 0
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
        <button type="button" className={styles.closeButton} onClick={leaveFlow} aria-label="Geschenk-Gestaltung schließen"><X size={18} /></button>
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
            {availabilityText ? <p className={styles.availability} role="status">{availabilityText}</p> : null}
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
          {discoveryMode === "pokemon" ? <fieldset className={styles.discoveryMode}>
            <legend>Welche Karten?</legend>
            <div className={styles.choiceRow}>
              {([["mixed", "Alt und neu gemischt"], ["vintage", "Eher alte Karten (bis 2009)"], ["modern", "Eher moderne Karten (ab 2010)"]] as const).map(([value, label]) => (
                <label key={value} className={styles.choice}><input type="radio" name="gift-style" checked={preferences.style === value} onChange={() => updatePreferences("style", value)} />{label}</label>
              ))}
            </div>
          </fieldset> : null}
          <div className={styles.quickChoices}>
            <fieldset><legend>Wie viele Karten?</legend><div className={styles.choiceRow}>{([9, 18, 36] as const).map((count) => {
              const unavailable = planLimit !== undefined && count > 9 && count > planLimit;
              return <label key={count} className={styles.choice} data-unavailable={unavailable || undefined}><input type="radio" name="gift-count" checked={preferences.targetCardCount === count} disabled={unavailable} onChange={() => updatePreferences("targetCardCount", count)} />{count === 9 ? "1 Seite · 9 Karten" : count === 18 ? "2 Seiten · 18 Karten" : "4 Seiten · 36 Karten"}{unavailable ? <small> (nur {planLimit} verfügbar)</small> : null}</label>;
            })}</div></fieldset>
            <label>Budget für die Karten
              <span className={styles.moneyInput}><input type="number" min="1" step="1" required value={preferences.budgetMinor / 100} onChange={(event) => updatePreferences("budgetMinor", Math.max(1, Math.round(Number(event.target.value || 0) * 100)))} /><span className={styles.currencySuffix} aria-hidden="true">{preferences.currency === "EUR" ? "€" : "$"}</span></span>
              <small>Die Karten kosten zusammen etwa so viel, aber nie mehr (ohne Versand).</small>
            </label>
          </div>
          <details className={styles.extraOptions}>
            <summary>Kartensprache ändern <span>aktuell: {language === "de" ? "Deutsch" : "English"}</span></summary>
            <label className={styles.languageChoice}>Kartensprache
              <select disabled={discoveryMode === "theme"} value={discoveryMode === "theme" ? "en" : language} onChange={(event) => changeLanguage(event.target.value as GiftLanguage)}>
                <option value="de">Deutsch</option><option value="en">English</option>
              </select>
              {discoveryMode === "theme" ? <small>Für Bildmotive gibt es derzeit nur geprüfte englische Karten.</small> : <small>{language === "de" ? "Deutsche Karten sind für Käufer in Deutschland meist die richtige Wahl." : "Englische Karten sind oft günstiger und besser verfügbar."}</small>}
            </label>
          </details>
          <p className={styles.localHint}>{pricingEnabled ? `Alles bleibt in diesem Browser. Kartenpreise sind unverbindliche Schätzungen ohne Versand und Steuern.${budgetGuaranteeEnabled ? "" : " Das Budget ist eine Orientierung."}` : "Alles bleibt in diesem Browser. Die Preisprüfung ist derzeit deaktiviert; das Budget kann noch nicht zugesagt werden."}</p>
          <div className={styles.actions}><button type="button" className={styles.secondaryButton} onClick={leaveFlow}>Zurück</button><button type="submit" className={styles.primaryButton} disabled={loading || (discoveryMode === "theme" ? !selectedThemeId : !preferences.subjectQuery.trim())}>{loading ? <><LoaderCircle className={styles.spin} aria-hidden="true" size={16} /> Karten werden gesucht…</> : <>Binder-Seite ansehen <ArrowRight aria-hidden="true" size={18} /></>}</button></div>
        </form>
      ) : null}

      {step === "candidates" && selection ? (
        <div className={styles.resultsStep}>
          <div className={styles.pageSummary} data-status={selection.budgetStatus}>
            <div><strong>{selection.selected.length} / {preferences.targetCardCount}</strong><span>Karten</span></div>
            <div><strong>{pricingEnabled ? `${totals.unpriced > 0 ? "mind. " : ""}${formatMoney(totals.totalMinor, preferences.currency)}` : "Preisprüfung aus"}</strong><span>{pricingEnabled ? totals.unpriced > 0 ? `für ${totals.priced} von ${selection.selected.length} Karten` : "geschätzter Wert" : "keine Budgetzusage"}</span></div>
          </div>
          <GiftBinderSpread pages={spreadPages} inspectedKey={inspectedKey} onInspect={inspectCandidate} onSwap={swapCandidates} />
          {inspected ? renderInspector(inspected) : null}
          {!pricingEnabled ? <p className={styles.gateNotice} role="status">Die Preisprüfung ist derzeit noch deaktiviert. Karten können trotzdem ausgewählt und als normaler Binder gespeichert werden; es gibt keine Budgetzusage.</p> : null}
          {pricingEnabled && !budgetGuaranteeEnabled ? <p className={styles.gateNotice} role="status">Schätzwert – den endgültigen Preis siehst du beim Kartenanbieter.</p> : null}
          {pricingEnabled && hasBudgetSlack(selection.estimatedTotalMinor, preferences.budgetMinor) ? <p className={styles.gateNotice} role="status">Das liegt deutlich unter deinem Budget von {formatMoney(preferences.budgetMinor, preferences.currency)}: Für dieses Motiv gibt es nicht genug teurere Karten. Das Budget ist nur die Obergrenze – du kannst unter „Wünsche ändern“ mehr Karten wählen.</p> : null}
          {pricingEnabled && !hasBudgetSlack(selection.estimatedTotalMinor, preferences.budgetMinor) && cheapCards ? <p className={styles.gateNotice} role="status">Die Karten kosten im Schnitt nur etwa {formatMoney(Math.round(totals.totalMinor / totals.priced), preferences.currency)}. Der Versand bei Cardmarket kostet oft mehr als eine einzelne Karte. Tipp: Wähle weniger Karten oder ein höheres Budget, dann schlagen wir schönere Karten vor.</p> : null}
          {selection.budgetStatus === "over" ? <p className={styles.warning} role="status">Die geschätzten {formatMoney(selection.estimatedTotalMinor, preferences.currency)} liegen über deinem Budget von {formatMoney(preferences.budgetMinor, preferences.currency)}. Auch die günstigste vollständige Auswahl liegt derzeit darüber. Du kannst Wünsche oder Karten ändern.</p> : null}
          {eraNote ? <p className={styles.gateNotice} role="status">{eraNote}</p> : null}
          {pricingEnabled && totals.unpriced > 0 ? <p className={styles.gateNotice} role="status">Für {totals.unpriced} {totals.unpriced === 1 ? "Karte" : "Karten"} gibt es keinen Marktpreis. Die Summe zählt nur Karten mit Preis.</p> : null}
          <details className={styles.conditionBox}>
            <summary>Kartenzustand: <strong>{conditionProfile(orderCondition).shortLabel}</strong> <span>ändern</span></summary>
            <label>Zustand für alle Karten
              <select aria-label="Zustand für alle" value={orderCondition} onChange={(event) => applyConditionToAll(event.target.value as PurchasePreferences["minimumCondition"])}>
                {conditionProfiles.map((profile) => <option value={profile.value} key={profile.value}>{profile.label}</option>)}
              </select>
              <small>{conditionProfile(orderCondition).providerSummary}</small>
            </label>
            <ConditionGuide />
          </details>
          {availableCandidates.length === 0 ? <section className={styles.candidateLimitNotice} role="status">
            <CircleAlert aria-hidden="true" size={21} />
            <div><strong>{shortfall ? `Mehr als ${selection.selected.length} Karten gibt es dafür nicht` : "Keine weitere passende Karte verfügbar"}</strong><span>{discoveryMode === "theme" ? `Alle ${briefs.length} bestätigten Treffer für „${preferences.subjectQuery}“ sind bereits ausgewählt oder wurden entfernt.` : `Alle ${briefs.length} passenden Karten sind bereits ausgewählt oder wurden entfernt.`} {excludedKeys.size > 0 ? "Eine entfernte Karte kannst du unten erneut hinzufügen." : "Für einen anderen Vorschlag kannst du die Wünsche ändern."}</span></div>
            {shortfall && language === "de" && discoveryMode === "pokemon" ? <button type="button" onClick={searchInEnglish}>Auch englische Karten suchen<ArrowRight aria-hidden="true" size={16} /></button> : <button type="button" onClick={() => setStep("details")}>{discoveryMode === "theme" ? "Motiv ändern" : "Wünsche ändern"}<ArrowRight aria-hidden="true" size={16} /></button>}
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
            <h3 id="purchase-flow-heading">Bestelle einen Binder und die Karten.</h3>
            <p>Dein Plan ist gespeichert. Erledige beide Käufe nacheinander.</p>
          </div>
          <section className={styles.purchaseOptions} aria-label="Nächste Schritte: Karten und Binder kaufen">
            <article className={`${styles.purchaseCard} ${styles.purchaseCardFeatured}`}>
              <div><p className={styles.purchaseStep}>SCHRITT 1</p><h3>Passenden Binder bestellen</h3><p>Dieser Binder passt zum 3×3-Seitenplan.</p>
                {partnerLoadError ? <p role="status">Angebote sind momentan nicht erreichbar. Du kannst den lokalen Binder weiter bearbeiten.</p> : null}
                {!partnerLoadError && !binderOffers ? <p role="status">Binder-Angebote werden geprüft…</p> : null}
                {!partnerLoadError && recommendedBinderOffers?.length === 0 ? <p role="status">Zurzeit ist kein geprüfter Binder-Shop verfügbar. Du kannst den lokalen Binder trotzdem weiter bearbeiten.</p> : null}
                {recommendedBinderOffers?.length ? <p className={styles.binderMatch}><Check aria-hidden="true" size={20} /><span><strong>Passt zu deinem Plan</strong>{planSize} Karten = {Math.ceil(planSize / 9)} {Math.ceil(planSize / 9) === 1 ? "Binder-Seite" : "Binder-Seiten"}.</span></p> : null}
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
              <div><p className={styles.purchaseStep}>SCHRITT 2</p><h3>Kartenliste öffnen</h3><p>Wähle einen Anbieter und übernimm die vorbereitete Einkaufsliste.</p><a className={styles.howtoLink} href="/anleitung/cardmarket/" target="_blank" rel="noopener noreferrer">Anleitung mit Bildern <ExternalLink aria-hidden="true" size={14} /></a></div>
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
              <div><dt>{pricingEnabled ? "Geschätzter Kartenwert" : "Preisprüfung"}</dt><dd>{pricingEnabled ? `${totals.unpriced > 0 ? "mind. " : ""}${formatMoney(totals.totalMinor, printSummary.cardPurchase.currency)}` : "Deaktiviert"}</dd></div>
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
            <button type="button" className={styles.secondaryButton} onClick={openBinder}>Binder bearbeiten</button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
