"use client";

import { ArrowLeft, ArrowRight, Check, Clipboard, Download, ExternalLink, FileDown, MapPin, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { FEATURES } from "@/config/feature-flags";
import { CardTraderMarketplacePanel, MarketplaceComparison } from "./CardTraderMarketplacePanel";
import { TcgplayerGuide } from "./TcgplayerGuide";
import { cardtraderCardmarketMappings } from "@/data/marketplace/cardtrader-cardmarket-products";
import { cardtraderTcgplayerLinks, type TcgplayerProductLink } from "@/data/marketplace/cardtrader-tcgplayer-products";
import { loadCardmarketProductMappingCatalog } from "@/data/marketplace/cardmarket-product-mappings";
import { loadCardmarketDecklistIdentityCatalog, type CardmarketDecklistIdentityCatalog } from "@/data/marketplace/cardmarket-decklist-identities";
import { loadTcgplayerCardMappings } from "@/data/marketplace/tcgplayer-card-mappings";
import { TCGPLAYER_SET_MAPPINGS, TCGPLAYER_UNAVAILABLE_SETS } from "@/data/marketplace/tcgplayer-set-mappings";
import { TCGPLAYER_PRINTING_MAPPINGS } from "@/data/marketplace/tcgplayer-printing-mappings";
import { CARDMARKET_SHOPPING_WIZARD_HELP_URL, createCardmarketHandoff, type CardmarketHandoffPart } from "@/domain/cardmarket-handoff";
import { formatCollectorNumber } from "@/domain/catalog-search";
import { groupMissingItemsBySet } from "@/domain/missing-items";
import { missingItemReviewNote } from "@/domain/missing-items-export";
import { cardmarketMinimumCondition, conditionProfile, conditionProfiles } from "@/domain/purchase-preferences";
import { suggestMarketplaceRegion } from "@/domain/marketplace-region";
import type { MarketplaceProductIdentityMapping } from "@/domain/marketplace-product-identity";
import { ConditionGuide } from "./ConditionGuide";
import { SetLogo } from "./SetLogo";
import { GiftPurchaseGuide } from "./GiftPurchaseGuide";
import { GuidedFlow } from "./GuidedFlow";
import { useStepHistory } from "./step-history";
import { createTcgplayerMassEntryExport, type TcgplayerCardMapping, type TcgplayerMassEntryExport } from "@/domain/tcgplayer-export";
import type { MissingItem, PurchasePreferences } from "@/domain/types";
import { printingLabels, selectedPrinting } from "@/domain/variant-selection";

import styles from "./missing-cards-panel.module.css";

const finishLabels = { normal: "Non-Holo / Normal", holo: "Holo", reverse: "Reverse Holo", other: "Andere", unspecified: "Nicht angegeben" } as const;
const editionLabels = { unlimited: "Unlimited", "first-edition": "First Edition", unspecified: "Nicht angegeben" } as const;
type MarketplaceChoice = "tcgplayer" | "cardmarket" | "cardtrader";
type MarketplaceRegion = "europe" | "north-america" | "other";
type CardmarketGuideStep = 1 | 2 | 3 | 4;
type CardTraderStatus = "not-approved" | "not-connected" | "review-required" | "stale" | "ready";

const PURCHASE_FLOW = [
  { label: "Region wählen", description: "Wir empfehlen den passenden Anbieter" },
  { label: "Liste übertragen", description: "Alle Karten gemeinsam vorbereiten" },
  { label: "Kauf prüfen", description: "Preis und Versand beim Anbieter prüfen" },
] as const;

const CARDMARKET_GUIDE_STEPS = [
  { step: 1, label: "Liste öffnen" },
  { step: 2, label: "Karten einfügen" },
  { step: 3, label: "Zustand setzen" },
  { step: 4, label: "Kauf prüfen" },
] as const;

export interface CardTraderQuotePreview {
  status: "unknown" | "estimated" | "stale" | "ready";
  currency?: "EUR" | "USD";
  minimumMinor?: number;
  maximumMinor?: number;
  fetchedAt?: string;
  confidence?: "low" | "medium" | "high";
}

interface MissingCardsPanelProps {
  items: readonly MissingItem[];
  warnings: readonly string[];
  copyState: "idle" | "copied" | "error";
  onCopy: (items: readonly MissingItem[]) => void;
  onTextExport: (items: readonly MissingItem[]) => void;
  onCsvExport: (items: readonly MissingItem[]) => void;
  onConditionsChange?: (items: readonly MissingItem[], condition: PurchasePreferences["minimumCondition"]) => void;
  onClose: () => void;
  tcgplayerEnabled?: boolean;
  tcgplayerCardMappings?: readonly TcgplayerCardMapping[];
  tcgplayerCopyState?: "idle" | "copied" | "error";
  onTcgplayerCopy?: (exported: TcgplayerMassEntryExport) => void;
  onTcgplayerTextExport?: (exported: TcgplayerMassEntryExport) => void;
  cardmarketEnabled?: boolean;
  cardmarketProductMappings?: readonly MarketplaceProductIdentityMapping[];
  cardmarketDecklistIdentities?: Readonly<Record<string, string>>;
  cardmarketPreparing?: boolean;
  cardmarketCopyState?: "idle" | "copied" | "error";
  onCardmarketPrepare?: (items: readonly MissingItem[]) => void;
  onCardmarketCopy?: (part: CardmarketHandoffPart) => void;
  onCardmarketTextExport?: (part: CardmarketHandoffPart) => void;
  cardtraderEnabled?: boolean;
  cardtraderWishlistEnabled?: boolean;
  cardtraderPreviewVisible?: boolean;
  cardtraderStatus?: CardTraderStatus;
  cardtraderQuote?: CardTraderQuotePreview;
  /** Plain-language purchase guide for gift buyers: Cardmarket preselected, expert sections collapsed. */
  beginner?: boolean;
}

export function MissingCardsPanel({
  items,
  warnings,
  copyState,
  onCopy,
  onTextExport,
  onCsvExport,
  onConditionsChange,
  onClose,
  tcgplayerEnabled = false,
  tcgplayerCardMappings,
  tcgplayerCopyState = "idle",
  onTcgplayerCopy,
  onTcgplayerTextExport,
  cardmarketEnabled = false,
  cardmarketProductMappings,
  cardmarketDecklistIdentities,
  cardmarketPreparing = false,
  cardmarketCopyState = "idle",
  onCardmarketPrepare,
  onCardmarketCopy,
  onCardmarketTextExport,
  cardtraderEnabled = false,
  cardtraderWishlistEnabled = false,
  cardtraderPreviewVisible = false,
  cardtraderStatus = "not-approved",
  cardtraderQuote = { status: "unknown" },
  beginner = false,
}: MissingCardsPanelProps) {
  const [query, setQuery] = useState("");
  const [cardmarketPartIndex, setCardmarketPartIndex] = useState(0);
  // The beginner guide starts with the provider that fits the browser language (a guess from the language
  // setting only, no location is read); the region stays changeable. The guide itself exists for Cardmarket.
  const [suggestedRegion] = useState<MarketplaceRegion | undefined>(() => beginner
    ? suggestMarketplaceRegion(typeof navigator === "undefined" ? [] : navigator.languages?.length ? navigator.languages : [navigator.language])
    : undefined);
  const suggestedChoice: MarketplaceChoice | undefined = suggestedRegion === "europe" && cardmarketEnabled
    ? "cardmarket"
    : suggestedRegion === "north-america" && tcgplayerEnabled ? "tcgplayer" : undefined;
  const beginnerCardmarket = beginner && suggestedChoice === "cardmarket";
  const [marketplaceChoice, setMarketplaceChoice] = useState<MarketplaceChoice | undefined>(suggestedChoice);
  const [marketplaceRegion, setMarketplaceRegion] = useState<MarketplaceRegion | undefined>(suggestedRegion);
  const [expertOpen, setExpertOpen] = useState(() => beginner && suggestedChoice !== "cardmarket");
  const beginnerPrepared = useRef(false);
  const [cardmarketGuideStep, setCardmarketGuideStepDirect] = useState<CardmarketGuideStep>(1);
  const setCardmarketGuideStep = useStepHistory("purchase-guide", cardmarketGuideStep, setCardmarketGuideStepDirect);
  const [loadedTcgplayerMappings, setLoadedTcgplayerMappings] = useState<readonly TcgplayerCardMapping[]>();
  const [tcgplayerMappingsError, setTcgplayerMappingsError] = useState<string>();
  const [loadedCardmarketMappings, setLoadedCardmarketMappings] = useState<readonly MarketplaceProductIdentityMapping[]>();
  const [cardmarketMappingsError, setCardmarketMappingsError] = useState<string>();
  const [cardmarketDecklistCatalog, setCardmarketDecklistCatalog] = useState<CardmarketDecklistIdentityCatalog>();
  const [cardmarketDecklistError, setCardmarketDecklistError] = useState<string>();
  const tcgplayerMappings = tcgplayerCardMappings ?? loadedTcgplayerMappings;
  const reviewedCardmarketMappings = cardmarketProductMappings ?? loadedCardmarketMappings;
  const [cardtraderCardmarketMappingList, setCardtraderCardmarketMappingList] = useState<readonly MarketplaceProductIdentityMapping[]>([]);
  // Cards with a reviewed mapping keep it; the rest get a direct product link from the CardTrader product id.
  const cardmarketMappings = useMemo(
    () => reviewedCardmarketMappings ? [...reviewedCardmarketMappings, ...cardtraderCardmarketMappingList] : undefined,
    [reviewedCardmarketMappings, cardtraderCardmarketMappingList],
  );
  useEffect(() => {
    if (marketplaceChoice !== "tcgplayer" || tcgplayerCardMappings || loadedTcgplayerMappings) return;
    const controller = new AbortController();
    loadTcgplayerCardMappings(controller.signal)
      .then(setLoadedTcgplayerMappings)
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setTcgplayerMappingsError(error instanceof Error ? error.message : "TCGplayer-Zuordnungen konnten nicht geladen werden.");
        }
      });
    return () => controller.abort();
  }, [loadedTcgplayerMappings, marketplaceChoice, tcgplayerCardMappings]);
  useEffect(() => {
    if (marketplaceChoice !== "cardmarket" || cardmarketProductMappings || loadedCardmarketMappings) return;
    const controller = new AbortController();
    loadCardmarketProductMappingCatalog(controller.signal)
      .then((catalog) => setLoadedCardmarketMappings(catalog.mappings))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setCardmarketMappingsError(error instanceof Error ? error.message : "Cardmarket-Produktzuordnungen konnten nicht geladen werden.");
        }
      });
    return () => controller.abort();
  }, [cardmarketProductMappings, loadedCardmarketMappings, marketplaceChoice]);
  useEffect(() => {
    if (marketplaceChoice !== "cardmarket" || cardmarketDecklistIdentities || cardmarketDecklistCatalog) return;
    const controller = new AbortController();
    loadCardmarketDecklistIdentityCatalog(controller.signal)
      .then(setCardmarketDecklistCatalog)
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setCardmarketDecklistError(error instanceof Error ? error.message : "Cardmarket-Decklistenprüfung konnte nicht geladen werden.");
        }
      });
    return () => controller.abort();
  }, [cardmarketDecklistCatalog, cardmarketDecklistIdentities, marketplaceChoice]);
  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("de-DE");
    if (!normalizedQuery) return items;
    return items.filter((item) => [item.card.name, item.card.setName, item.card.collectorNumber].some((value) => value.toLocaleLowerCase("de-DE").includes(normalizedQuery)));
  }, [items, query]);
  // Direct product pages from the CardTrader product ids, for the cards that are on screen and not reviewed by hand.
  const cardtraderIdentitySignature = visibleItems.map((item) => item.card.ref.id).join("|");
  useEffect(() => {
    if (!FEATURES.cardtraderProductIds || marketplaceChoice !== "cardmarket" || !reviewedCardmarketMappings) return;
    let cancelled = false;
    const reviewedIds = new Set(reviewedCardmarketMappings.map((mapping) => mapping.tcgdexCardId));
    void cardtraderCardmarketMappings(visibleItems, { alreadyMapped: reviewedIds }).then((mappings) => {
      if (!cancelled) setCardtraderCardmarketMappingList(mappings);
    });
    return () => { cancelled = true; };
    // The signature stands for the visible items; the list itself changes identity on every render pass.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardtraderIdentitySignature, marketplaceChoice, reviewedCardmarketMappings]);
  const [tcgplayerLinks, setTcgplayerLinks] = useState<{ signature: string; links: TcgplayerProductLink[] }>();
  useEffect(() => {
    if (!FEATURES.cardtraderProductIds || marketplaceChoice !== "tcgplayer") return;
    let cancelled = false;
    void cardtraderTcgplayerLinks(visibleItems).then((links) => {
      if (!cancelled) setTcgplayerLinks({ signature: cardtraderIdentitySignature, links });
    });
    return () => { cancelled = true; };
    // The signature stands for the visible items; the list itself changes identity on every render pass.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardtraderIdentitySignature, marketplaceChoice]);
  const tcgplayerProductLinks = tcgplayerLinks?.signature === cardtraderIdentitySignature ? tcgplayerLinks.links : [];
  const visibleQuantity = visibleItems.reduce((total, item) => total + item.quantity, 0);
  const visibleGroups = useMemo(() => groupMissingItemsBySet(visibleItems), [visibleItems]);
  const tcgplayerExport = useMemo(
    () => tcgplayerEnabled && tcgplayerMappings
      ? createTcgplayerMassEntryExport(
          visibleItems,
          TCGPLAYER_SET_MAPPINGS,
          TCGPLAYER_PRINTING_MAPPINGS,
          tcgplayerMappings,
          TCGPLAYER_UNAVAILABLE_SETS,
        )
      : undefined,
    [tcgplayerEnabled, tcgplayerMappings, visibleItems],
  );
  const cardmarketHandoff = useMemo(
    () => cardmarketEnabled
      ? createCardmarketHandoff(visibleItems, cardmarketMappings, cardmarketDecklistIdentities ?? cardmarketDecklistCatalog?.identities ?? {})
      : undefined,
    [cardmarketDecklistCatalog, cardmarketDecklistIdentities, cardmarketEnabled, cardmarketMappings, visibleItems],
  );
  const cardmarketDecklistReady = Boolean(cardmarketDecklistIdentities || cardmarketDecklistCatalog);
  const activeCardmarketPartIndex = cardmarketHandoff?.parts.length
    ? Math.min(cardmarketPartIndex, cardmarketHandoff.parts.length - 1)
    : 0;
  const activeCardmarketPart = cardmarketHandoff?.parts[activeCardmarketPartIndex];
  const verifiedCardmarketProducts = activeCardmarketPart?.products.filter((product) => product.productUrl) ?? [];
  const unresolvedCardmarketProducts = activeCardmarketPart?.products.filter((product) => !product.productUrl) ?? [];
  const cardmarketBulkLabel = activeCardmarketPart?.importablePositionCount === 1
    ? "1 Karte"
    : `${activeCardmarketPart?.importablePositionCount ?? 0} Karten`;
  const tcgplayerPreparedMatches = tcgplayerExport?.matches.filter((match) => match.line) ?? [];
  const tcgplayerExceptions = tcgplayerExport?.matches.filter((match) => !match.line) ?? [];
  const visibleConditions = new Set(visibleItems.map((item) => item.preferences.minimumCondition));
  const sharedCondition = visibleConditions.size === 1 ? [...visibleConditions][0] : undefined;
  const sharedCardmarketCondition = sharedCondition ? cardmarketMinimumCondition(sharedCondition) : undefined;
  const visibleLanguages = new Set(visibleItems.map((item) => item.card.ref.language));
  const sharedLanguage = visibleLanguages.size === 1 ? [...visibleLanguages][0] : undefined;

  useEffect(() => {
    if (!beginnerCardmarket || beginnerPrepared.current) return;
    beginnerPrepared.current = true;
    onCardmarketPrepare?.(visibleItems);
  }, [beginnerCardmarket, onCardmarketPrepare, visibleItems]);

  const showStandardLayout = !beginner || expertOpen;
  const showBeginnerGuide = beginner && !expertOpen && marketplaceChoice === "cardmarket";

  function chooseMarketplace(choice: MarketplaceChoice) {
    if (choice === "tcgplayer") setTcgplayerMappingsError(undefined);
    if (choice === "cardmarket") {
      setCardmarketGuideStep(1);
      setCardmarketMappingsError(undefined);
      setCardmarketDecklistError(undefined);
      onCardmarketPrepare?.(visibleItems);
    }
    setMarketplaceChoice(choice);
  }

  function chooseRegion(region: MarketplaceRegion) {
    setMarketplaceRegion(region);
    if (region === "europe" && cardmarketEnabled) {
      chooseMarketplace("cardmarket");
      return;
    }
    if (region === "north-america" && tcgplayerEnabled) {
      chooseMarketplace("tcgplayer");
      return;
    }
    setMarketplaceChoice(undefined);
  }

  return (
    <section className={styles.panel} aria-label="Fehlende Karten">
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>{beginner ? "Karten besorgen" : "Kartenkauf"}</p>
          <h2 id="missing-cards-heading">{beginner && marketplaceChoice === "cardmarket" ? `${visibleQuantity} Karten bei Cardmarket kaufen` : `${visibleQuantity} Karten gemeinsam kaufen`}</h2>
          <p className={styles.intro}>{beginner ? "Your Card Binder hat die Liste für dich vorbereitet. In vier kurzen Schritten kommst du zu den Karten." : "Wähle deine Region. Your Card Binder bereitet danach die komplette Liste für den passenden Anbieter vor."}</p>
          <p className={styles.subline}>{visibleItems.length} Positionen · gekauft wird erst beim Anbieter</p>
        </div>
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Fehlkartenansicht schließen"><X size={18} /></button>
      </div>

      {showStandardLayout ? <div className={styles.flowWrapper}><GuidedFlow steps={PURCHASE_FLOW} currentStep={marketplaceChoice ? 2 : 1} label="Schritte zum Kartenkauf" /></div> : null}

      {copyState === "error" ? <p className={styles.error} role="status">Kopieren wurde vom Browser nicht erlaubt. Nutze stattdessen TXT oder CSV.</p> : null}
      {warnings.map((warning) => <p className={styles.warning} role="note" key={warning}>{warning}</p>)}

      {showStandardLayout && onConditionsChange && visibleItems.length ? (
        <details className={styles.conditionBlock}>
          <summary className={styles.conditionSummary}>
            <span><Check aria-hidden="true" size={18} /></span>
            <span><strong>Zustand: {sharedCondition ? conditionProfile(sharedCondition).shortLabel : "unterschiedlich"}</strong><small>Für Geschenke vorbereitet</small></span>
            <b>Ändern</b>
          </summary>
          <div className={styles.conditionBody}>
            <section className={styles.conditionSetup} aria-labelledby="missing-condition-heading">
              <div>
                <h3 id="missing-condition-heading">Kartenzustand anpassen</h3>
                <p>Die Auswahl gilt für alle Karten. Einzelne Ausnahmen kannst du weiter unten ändern.</p>
              </div>
              <label htmlFor="missing-condition-all">
                <span>Zustand für alle</span>
                <select
                  id="missing-condition-all"
                  aria-label="Zustand für alle"
                  value={sharedCondition ?? "mixed"}
                  onChange={(event) => onConditionsChange(visibleItems, event.target.value as PurchasePreferences["minimumCondition"])}
                >
                  {sharedCondition ? null : <option value="mixed" disabled>Unterschiedliche Zustände</option>}
                  {conditionProfiles.map((profile) => <option value={profile.value} key={profile.value}>{profile.label}</option>)}
                </select>
                <small>{sharedCondition ? conditionProfile(sharedCondition).providerSummary : "Die Karten haben unterschiedliche Zustandswünsche."}</small>
              </label>
            </section>
            <ConditionGuide />
          </div>
        </details>
      ) : null}

      {beginner && !expertOpen && marketplaceChoice === "cardmarket" ? (
        <section className={styles.regionPick} aria-labelledby="region-pick-heading">
          <h3 id="region-pick-heading"><MapPin aria-hidden="true" size={20} /> Wo wohnst du?</h3>
          <p>Der Marktplatz hängt vom Wohnort ab: In <b>Europa</b> kauft man vor allem bei <b>Cardmarket</b>, in den <b>USA</b> vor allem bei <b>TCGplayer</b>. Wir haben nach deiner Browser-Sprache vorausgewählt. Stimmt das nicht, wähle hier den richtigen Ort.</p>
          <div className={styles.regionButtons} role="group" aria-label="Wohnort auswählen">
            <button type="button" aria-label="Europa & UK · Cardmarket" aria-pressed="true"><strong>Europa & UK</strong><small>Cardmarket</small><Check aria-hidden="true" size={16} /></button>
            <button type="button" aria-label="USA & Kanada · TCGplayer" aria-pressed="false" onClick={() => { chooseRegion("north-america"); setExpertOpen(true); }}><strong>USA & Kanada</strong><small>TCGplayer</small></button>
            <button type="button" aria-label="Andere Region · Versand prüfen" aria-pressed="false" onClick={() => { chooseRegion("other"); setExpertOpen(true); }}><strong>Andere Region</strong><small>Versand prüfen</small></button>
          </div>
          <p className={styles.regionHint} role="status"><strong>Du kaufst bei Cardmarket.</strong> Es ist der größte Marktplatz für Pokémon-Karten in Europa.</p>
        </section>
      ) : null}

      {showStandardLayout && (tcgplayerEnabled || cardmarketEnabled || cardtraderEnabled || cardtraderPreviewVisible) ? (
        <section className={styles.marketplaceChoice} id="marketplace-choice" aria-labelledby="marketplace-choice-heading">
          <div>
            <span className={styles.stepTag}>Schritt 1</span>
            <h3 id="marketplace-choice-heading">Wo möchtest du die Karten kaufen?</h3>
            <p>Ein Klick genügt. Wir empfehlen den passenden Marktplatz, ohne deinen Standort abzufragen.</p>
          </div>
          <div className={styles.regionGuide}>
            <span className={styles.regionGuideLabel}><MapPin aria-hidden="true" size={17} /> Wo wohnst du?</span>
            <div className={styles.regionButtons} role="group" aria-label="Region auswählen">
              <button type="button" aria-label="Europa & UK · Cardmarket empfohlen" aria-pressed={marketplaceRegion === "europe"} onClick={() => chooseRegion("europe")}>
                <strong>Europa & UK</strong><small>Cardmarket empfohlen</small>{marketplaceRegion === "europe" ? <Check aria-hidden="true" size={16} /> : null}
              </button>
              <button type="button" aria-label="USA & Kanada · TCGplayer empfohlen" aria-pressed={marketplaceRegion === "north-america"} onClick={() => chooseRegion("north-america")}>
                <strong>USA & Kanada</strong><small>TCGplayer empfohlen</small>{marketplaceRegion === "north-america" ? <Check aria-hidden="true" size={16} /> : null}
              </button>
              <button type="button" aria-label="Andere Region · Versand prüfen" aria-pressed={marketplaceRegion === "other"} onClick={() => chooseRegion("other")}>
                <strong>Andere Region</strong><small>Versand prüfen</small>{marketplaceRegion === "other" ? <Check aria-hidden="true" size={16} /> : null}
              </button>
            </div>
            {marketplaceRegion ? <p className={styles.regionHint} role="status">{marketplaceRegion === "europe"
              ? "Für Europa und UK ist Cardmarket normalerweise der einfachste Start."
              : marketplaceRegion === "north-america"
                ? "Für USA und Kanada ist TCGplayer normalerweise der einfachste Start."
                : "Verfügbarkeit und Versand unterscheiden sich je nach Land. Prüfe beide Anbieter vor dem Kauf."}</p> : null}
          </div>
          <div className={styles.providerHeading}><strong>Anbieter</strong><span>Verfügbarkeit und Versand unterscheiden sich je nach Region.</span></div>
          <div className={styles.marketplaceChoiceActions} role="group" aria-label="Marketplace auswählen">
            {tcgplayerEnabled ? (
              <button
                type="button"
                aria-label="TCGplayer"
                aria-pressed={marketplaceChoice === "tcgplayer"}
                onClick={() => chooseMarketplace("tcgplayer")}
              ><strong>TCGplayer {marketplaceRegion === "north-america" ? <em>Empfohlen</em> : null}</strong><small>Für USA & Kanada · Mass Entry vorbereiten</small><ArrowRight aria-hidden="true" size={17} /></button>
            ) : null}
            {cardmarketEnabled ? (
              <button
                type="button"
                aria-label="Cardmarket"
                aria-pressed={marketplaceChoice === "cardmarket"}
                onClick={() => chooseMarketplace("cardmarket")}
              ><strong>Cardmarket {marketplaceRegion === "europe" ? <em>Empfohlen</em> : null}</strong><small>Für Europa & UK · Kartenliste vorbereiten</small><ArrowRight aria-hidden="true" size={17} /></button>
            ) : null}
            {cardtraderEnabled || cardtraderPreviewVisible ? (
              <button
                type="button"
                aria-label={`CardTrader${!cardtraderEnabled ? " · Vorschau" : ""}`}
                aria-pressed={marketplaceChoice === "cardtrader"}
                onClick={() => chooseMarketplace("cardtrader")}
              ><strong>CardTrader{!cardtraderEnabled ? " · Vorschau" : ""}</strong><small>{cardtraderEnabled ? "Shop Optimizer · Karten mehrerer Verkäufer" : "Wishlist-Freigabe ausstehend"}</small><ArrowRight aria-hidden="true" size={17} /></button>
            ) : null}
          </div>
          {cardmarketEnabled && cardtraderEnabled ? <details className={styles.providerCompare}><summary>Cardmarket oder CardTrader? Der Unterschied</summary><MarketplaceComparison /></details> : null}
        </section>
      ) : null}

      {marketplaceChoice === "tcgplayer" && tcgplayerExport ? (
        <section className={styles.marketplacePanel} aria-labelledby="tcgplayer-export-heading">
          <div className={styles.marketplaceHeader}>
            <div>
              <p className={styles.eyebrow}>Vorbereitete Marketplace-Übergabe</p>
              <h3 id="tcgplayer-export-heading">TCGplayer Mass Entry</h3>
              <p>{tcgplayerExport.readyCount} übergabebereit · {tcgplayerExport.verifiedCount} Produktzuordnungen · {tcgplayerExport.reviewRequiredCount} prüfen</p>
            </div>
            {!tcgplayerExport.text ? <span className={styles.marketplaceUnavailable}>Keine sichere Übergabe verfügbar</span> : null}
          </div>

          <div className={styles.reviewOverview} data-has-exceptions={tcgplayerExceptions.length > 0}>
            <strong>{tcgplayerExceptions.length > 0 ? tcgplayerExceptions.length === 1 ? "1 Karte braucht deine Aufmerksamkeit" : `${tcgplayerExceptions.length} Karten brauchen deine Aufmerksamkeit` : "Alle Karten sind für die Übergabe vorbereitet"}</strong>
            <span>{tcgplayerPreparedMatches.length} vorbereitet · {tcgplayerExceptions.length} nicht automatisch zugeordnet</span>
          </div>

          {tcgplayerExceptions.length ? (
            <div className={styles.reviewList}>
              <strong>Vor der Übergabe prüfen</strong>
              <p className={styles.reviewExplanation}>Diese Karten bleiben in deiner Fehlkartenliste, werden aber nicht automatisch übertragen, solange die TCGplayer-Zuordnung nicht eindeutig ist.</p>
              <ul>
                {tcgplayerExceptions.map((match) => (
                  <li key={match.identityKey}>
                    <span>{match.quantity}× {match.cardName} · {match.setName} · {match.collectorNumber}</span>
                    <small>{match.status === "candidate" ? "Kandidat" : "Nicht zugeordnet"}: {match.reason}</small>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <TcgplayerGuide exported={tcgplayerExport} onCopy={onTcgplayerCopy} />

          <details className={styles.advancedCardmarket}>
            <summary>Falls etwas nicht klappt</summary>
            <div className={styles.advancedCardmarketBody}>
            <div className={styles.fallbackSection}>
              <h4>Mass-Entry-Text kopieren oder als Datei speichern</h4>
          <label className={styles.massEntryPreview}>
            <span>Mass-Entry-Text · offizielle Produktnamen, Setcodes und vollständige Kartennummern</span>
            <textarea
              aria-label="TCGplayer Mass-Entry-Vorschau"
              readOnly
              rows={Math.max(3, Math.min(tcgplayerExport.readyCount, 8))}
              value={tcgplayerExport.text}
              placeholder="Für den aktuellen Filter ist keine geprüfte TCGplayer-Zeile verfügbar."
            />
          </label>

          <div className={styles.marketplaceActions}>
            <button type="button" className={styles.primaryButton} disabled={!tcgplayerExport.text} onClick={() => onTcgplayerCopy?.(tcgplayerExport)}>
              <Clipboard size={16} /> {tcgplayerCopyState === "copied" && tcgplayerExport.text ? "TCGplayer kopiert" : "TCGplayer kopieren"}
            </button>
            <button type="button" className={styles.secondaryButton} disabled={!tcgplayerExport.text} onClick={() => onTcgplayerTextExport?.(tcgplayerExport)}>
              <Download size={16} /> TCGplayer TXT
            </button>
          </div>

          {tcgplayerCopyState === "error" ? <p className={styles.error} role="status">Kopieren wurde nicht erlaubt. Der Text bleibt oben markierbar oder kann als TXT geladen werden.</p> : null}
          {tcgplayerExport.warnings.length ? (
            <details className={styles.guidanceDisclosure}>
              <summary>Wichtige Hinweise anzeigen ({tcgplayerExport.warnings.length})</summary>
              <div>{tcgplayerExport.warnings.map((warning) => <p className={styles.warning} role="note" key={warning}>{warning}</p>)}</div>
            </details>
          ) : null}

          {tcgplayerPreparedMatches.length ? (
            <details className={styles.preparedCards}>
              <summary>Bereits vorbereitete Karten anzeigen ({tcgplayerPreparedMatches.length})</summary>
              <p>Mass Entry übernimmt Karte, Set und Nummer. Printing und Zustand wählst du anschließend bei TCGplayer mit diesen Filtern aus, bevor du auf „Add to Cart“ klickst.</p>
              <ul>
                {tcgplayerPreparedMatches.map((match) => (
                  <li key={match.identityKey}>
                    <span>{match.quantity}× {match.cardName} · {match.setName} · {match.collectorNumber}</span>
                    <small>Printing: {match.printingHint} · Zustand: {match.conditionHint}</small>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
            </div>
            {tcgplayerProductLinks.length ? (
              <div className={styles.fallbackSection}>
                <h4>Einzelne Karten bei TCGplayer öffnen ({tcgplayerProductLinks.length})</h4>
                <p className={styles.reviewExplanation}>Diese Links brauchst du nur für Karten, die Mass Entry nicht gefunden hat. Wähle dort das passende Angebot selbst aus und prüfe Printing und Zustand.</p>
                <section className={styles.cardmarketProductSection} aria-label="Direkte Produktseiten bei TCGplayer">
                  <ul>
                    {tcgplayerProductLinks.map((link) => (
                      <li key={link.identityKey}>
                        <span><strong>{link.label}</strong><small>{link.details}</small></span>
                        <a aria-label={`TCGplayer-Produktseite öffnen: ${link.label}`} href={link.url} target="_blank" rel="noopener noreferrer">Produktseite öffnen <ExternalLink aria-hidden="true" size={14} /></a>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            ) : null}
            </div>
          </details>
        </section>
      ) : null}

      {marketplaceChoice === "tcgplayer" && !tcgplayerExport ? (
        <section className={styles.marketplacePanel} aria-live="polite">
          {tcgplayerMappingsError ? (
            <p className={styles.error} role="alert">{tcgplayerMappingsError} Öffne die Ansicht erneut oder lade die Seite neu.</p>
          ) : (
            <p className={styles.handoffSteps} role="status">Die geprüften TCGplayer-Produktzuordnungen werden geladen …</p>
          )}
        </section>
      ) : null}

      {showBeginnerGuide && cardmarketHandoff && activeCardmarketPart ? (
        <>
          <GiftPurchaseGuide
            positionCount={activeCardmarketPart.positionCount}
            partCount={cardmarketHandoff.parts.length}
            partIndex={activeCardmarketPartIndex}
            partLabels={cardmarketHandoff.parts.map((part) => `Teil ${part.index} von ${cardmarketHandoff.parts.length} · ${part.positionCount} Positionen`)}
            onPartChange={setCardmarketPartIndex}
            wantsUrl={cardmarketHandoff.wantsUrl}
            wizardHelpUrl={CARDMARKET_SHOPPING_WIZARD_HELP_URL}
            ready={Boolean(activeCardmarketPart.text && !cardmarketPreparing && cardmarketDecklistReady)}
            busyLabel={cardmarketPreparing || !cardmarketDecklistReady ? "Kartenliste wird sicher geprüft …" : "Keine verifizierte Sammelliste verfügbar"}
            copyState={cardmarketCopyState}
            onCopyAndOpen={() => onCardmarketCopy?.(activeCardmarketPart)}
            language={sharedLanguage}
            condition={sharedCondition && sharedCardmarketCondition ? { cardfolio: conditionProfile(sharedCondition).shortLabel, code: sharedCardmarketCondition.code, label: sharedCardmarketCondition.label } : undefined}
          />
          {cardmarketDecklistError ? <p className={styles.error} role="alert">{cardmarketDecklistError} Aus Sicherheitsgründen wird keine ungeprüfte Sammelliste erzeugt.</p> : null}
          {cardmarketHandoff.excluded.length ? <p className={styles.warning} role="note">{cardmarketHandoff.excluded.length === 1 ? "1 Karte" : `${cardmarketHandoff.excluded.length} Karten`} können nicht automatisch übertragen werden. Du findest sie unter „Anderer Wohnort oder Anbieter?“ → „Importliste ansehen“ und kannst sie bei Cardmarket einzeln suchen.</p> : null}
        </>
      ) : null}

      {marketplaceChoice === "cardmarket" && showStandardLayout && cardmarketHandoff && activeCardmarketPart ? (
        <section className={styles.marketplacePanel} aria-labelledby="cardmarket-handoff-heading">
          <div className={styles.marketplaceHeader}>
            <div>
              <p className={styles.eyebrow}>Cardmarket</p>
              <h3 id="cardmarket-handoff-heading">{activeCardmarketPart.positionCount} Karten gemeinsam übertragen</h3>
              <p>Die Liste ist vorbereitet. Folge jetzt der Anleitung.</p>
            </div>
            <a href={cardmarketHandoff.wantsHelpUrl} target="_blank" rel="noopener noreferrer">
              Cardmarket-Hilfe <ExternalLink aria-hidden="true" size={15} />
            </a>
          </div>

          <section className={styles.cardmarketGuide} aria-labelledby="cardmarket-guide-heading">
            <header className={styles.cardmarketGuideHeader}>
              <div>
                <span className={styles.stepTag}>Anleitung · 4 Schritte</span>
                <h4 id="cardmarket-guide-heading">Cardmarket-Anleitung</h4>
                <p>Erledige nur die groß angezeigte Aufgabe. Danach kommst du zu Your Card Binder zurück und klickst auf „Weiter“.</p>
              </div>
              <strong aria-live="polite">Schritt {cardmarketGuideStep} von {CARDMARKET_GUIDE_STEPS.length}</strong>
            </header>

            <ol className={styles.cardmarketGuideProgress} aria-label="Fortschritt der Cardmarket-Anleitung">
              {CARDMARKET_GUIDE_STEPS.map((guideStep) => {
                const status = guideStep.step < cardmarketGuideStep ? "done" : guideStep.step === cardmarketGuideStep ? "active" : "todo";
                return (
                  <li data-status={status} aria-current={status === "active" ? "step" : undefined} key={guideStep.step}>
                    <span>{status === "done" ? <Check aria-hidden="true" size={15} /> : guideStep.step}</span>
                    <b>{guideStep.label}</b>
                  </li>
                );
              })}
            </ol>

            <div className={styles.cardmarketGuideCard} data-step={cardmarketGuideStep}>
              {cardmarketGuideStep === 1 ? <>
                <span className={styles.cardmarketGuideKicker}>Schritt 1</span>
                <h5>Liste kopieren und Cardmarket öffnen</h5>
                <p>Der große Button kopiert alle vorbereiteten Karten. Du musst keine Karte einzeln suchen.</p>
                {cardmarketHandoff.parts.length > 1 ? (
                  <label className={styles.cardmarketBulkPart} htmlFor="cardmarket-bulk-part">
                    <span>Cardmarket erlaubt höchstens 150 Positionen pro Wants-Liste. Wähle den zu übertragenden Teil:</span>
                    <select id="cardmarket-bulk-part" value={activeCardmarketPartIndex} onChange={(event) => setCardmarketPartIndex(Number(event.target.value))}>
                      {cardmarketHandoff.parts.map((part, index) => <option value={index} key={part.index}>Teil {part.index} von {cardmarketHandoff.parts.length} · {part.positionCount} Positionen</option>)}
                    </select>
                  </label>
                ) : null}
                {activeCardmarketPart.text && !cardmarketPreparing && cardmarketDecklistReady ? (
                  <a
                    className={styles.cardmarketBulkAction}
                    href={cardmarketHandoff.wantsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      onCardmarketCopy?.(activeCardmarketPart);
                      setCardmarketGuideStep(2);
                    }}
                  >
                    <Clipboard aria-hidden="true" size={19} />
                    {cardmarketCopyState === "copied"
                      ? "Liste erneut kopieren & Cardmarket öffnen"
                      : `${cardmarketBulkLabel} kopieren & Cardmarket öffnen`}
                    <ExternalLink aria-hidden="true" size={18} />
                  </a>
                ) : (
                  <button type="button" className={styles.cardmarketBulkAction} disabled>
                    <Clipboard aria-hidden="true" size={19} />
                    {cardmarketPreparing || !cardmarketDecklistReady ? "Kartenliste wird sicher geprüft …" : "Keine verifizierte Sammelliste verfügbar"}
                  </button>
                )}
                <small>Der Kauf wird nicht automatisch ausgelöst.</small>
              </> : null}

              {cardmarketGuideStep === 2 ? <>
                <span className={styles.cardmarketGuideKicker}>Schritt 2</span>
                <h5>Kopierte Karten bei Cardmarket einfügen</h5>
                <ol className={styles.cardmarketInstructionList}>
                  <li>Lege eine <b>neue Wants-Liste</b> an oder öffne eine bestehende.</li>
                  <li>Wähle <b>„Deckliste hinzufügen“</b>.</li>
                  <li>Klicke in das große Textfeld, drücke <b>Strg+V</b> beziehungsweise <b>⌘V</b> und anschließend <b>„Hinzufügen“</b>.</li>
                </ol>
                <div className={styles.cardmarketGuideActions}>
                  <a href={cardmarketHandoff.wantsUrl} target="_blank" rel="noopener noreferrer" onClick={() => onCardmarketCopy?.(activeCardmarketPart)}>
                    Liste erneut kopieren & Cardmarket öffnen <ExternalLink aria-hidden="true" size={16} />
                  </a>
                  <button type="button" onClick={() => setCardmarketGuideStep(3)}>Karten sind eingefügt <ArrowRight aria-hidden="true" size={17} /></button>
                </div>
              </> : null}

              {cardmarketGuideStep === 3 ? <>
                <span className={styles.cardmarketGuideKicker}>Schritt 3</span>
                <h5>Mindestzustand für alle Karten einstellen</h5>
                <div className={styles.cardmarketConditionWarning} role="alert">
                  <div>
                    <strong>Cardmarket zeigt nach dem Import zunächst ≥ PO</strong>
                    <p>Das bedeutet „Poor oder besser“. Ändere es jetzt einmal gesammelt auf den in Your Card Binder gewählten Zustand.</p>
                  </div>
                  {sharedCondition && sharedCardmarketCondition ? (
                    <div className={styles.cardmarketConditionTranslation}>
                      <span><small>In Your Card Binder gewählt</small><b>{conditionProfile(sharedCondition).shortLabel}</b></span>
                      <ArrowRight aria-hidden="true" size={20} />
                      <span><small>Bei Cardmarket einstellen</small><b>≥ {sharedCardmarketCondition.code} · {sharedCardmarketCondition.label}</b></span>
                    </div>
                  ) : (
                    <p><b>Die Karten haben unterschiedliche Zustandswünsche.</b> Stelle sie bei Cardmarket gruppenweise gemäß den Your Card Binder-Angaben ein.</p>
                  )}
                  <ol className={styles.cardmarketConditionSteps}>
                    <li>Alle Karten markieren</li>
                    <li>„Massenveränderung“ öffnen</li>
                    <li>Mindestzustand {sharedCardmarketCondition ? <b>≥ {sharedCardmarketCondition.code}</b> : "passend zu den Your Card Binder-Angaben"} wählen</li>
                  </ol>
                </div>
                <div className={styles.cardmarketGuideActions}>
                  <button type="button" className={styles.cardmarketBackButton} onClick={() => setCardmarketGuideStep(2)}><ArrowLeft aria-hidden="true" size={16} /> Zurück</button>
                  <button type="button" onClick={() => setCardmarketGuideStep(4)}>Zustand ist eingestellt <ArrowRight aria-hidden="true" size={17} /></button>
                </div>
              </> : null}

              {cardmarketGuideStep === 4 ? <>
                <span className={styles.cardmarketGuideKicker}>Schritt 4</span>
                <h5>Ergebnis prüfen und gemeinsam kaufen</h5>
                <ol className={styles.cardmarketInstructionList}>
                  <li>Prüfe kurz, ob alle <b>{activeCardmarketPart.positionCount} Kartenpositionen</b> in der Wants-Liste stehen.</li>
                  <li>Kontrolliere Endpreis, Versand, Sprache und Kartenausführung.</li>
                  <li>Starte bei Cardmarket den <b>Shopping Wizard</b>, um passende Verkäufer zu finden.</li>
                </ol>
                <div className={styles.cardmarketGuideActions}>
                  <button type="button" className={styles.cardmarketBackButton} onClick={() => setCardmarketGuideStep(3)}><ArrowLeft aria-hidden="true" size={16} /> Zurück</button>
                  <a className={styles.cardmarketFinalAction} href={cardmarketHandoff.wantsUrl} target="_blank" rel="noopener noreferrer">
                    Cardmarket öffnen und Shopping Wizard starten <ExternalLink aria-hidden="true" size={17} />
                  </a>
                </div>
                <small>Preise, Versand und die endgültige Kartenauswahl bestätigst du erst bei Cardmarket.</small>
              </> : null}
            </div>
          </section>

          {cardmarketMappingsError ? <p className={styles.error} role="status">{cardmarketMappingsError} Die sicheren Suchlinks bleiben verfügbar.</p> : null}
          {!cardmarketProductMappings && !loadedCardmarketMappings && !cardmarketMappingsError ? <p className={styles.handoffSteps} role="status">Optionale Cardmarket-Produktlinks werden geladen …</p> : null}
          {cardmarketDecklistError ? <p className={styles.error} role="alert">{cardmarketDecklistError} Aus Sicherheitsgründen wird keine ungeprüfte Sammelliste erzeugt.</p> : null}
          {!cardmarketDecklistReady && !cardmarketDecklistError ? <p className={styles.handoffSteps} role="status">Der vollständige Cardmarket-Produktabgleich wird geladen …</p> : null}

          <details className={styles.advancedCardmarket}>
            <summary>Falls etwas nicht klappt</summary>
            <div className={styles.advancedCardmarketBody}>
            <div className={styles.fallbackSection}>
              <h4>Importliste kopieren oder als Datei speichern</h4>
              <p className={styles.reviewExplanation}>Cardmarket erkennt Pokémon über den vollständigen Namen sowie Fähigkeiten und Attacken. Set, Sprache, Ausführung und Zustand werden vom Decklistenformat nicht automatisch übertragen und müssen im Ergebnis kurz kontrolliert werden.</p>

              <div className={styles.reviewOverview} data-has-exceptions={cardmarketHandoff.excluded.length > 0}>
                <strong>{cardmarketHandoff.excluded.length > 0 ? cardmarketHandoff.excluded.length === 1 ? "1 Karte fehlt im Importtext" : `${cardmarketHandoff.excluded.length} Karten fehlen im Importtext` : "Alle Karten sind für den Decklistenimport vorbereitet"}</strong>
                <span>{cardmarketHandoff.importablePositionCount} vorbereitet · {cardmarketHandoff.excluded.length} nicht importierbar</span>
              </div>

              {cardmarketHandoff.excluded.length ? (
                <div className={styles.reviewList}>
                  <strong>Vor dem Import prüfen</strong>
                  <ul>{cardmarketHandoff.excluded.map((item) => <li key={item.identityKey}><span>{item.label}</span><small>{item.reason}</small></li>)}</ul>
                </div>
              ) : null}

              {cardmarketPreparing ? <p className={styles.handoffSteps} role="status">Fähigkeiten und Attacken werden aus dem Kartenkatalog aktualisiert …</p> : null}
              {cardmarketHandoff.warnings.length ? (
                <details className={styles.guidanceDisclosure}>
                  <summary>Wichtige Hinweise anzeigen ({cardmarketHandoff.warnings.length})</summary>
                  <div>{cardmarketHandoff.warnings.map((warning) => <p className={styles.warning} role="note" key={warning}>{warning}</p>)}</div>
                </details>
              ) : null}

              <div className={styles.partControls}>
                <label htmlFor="cardmarket-part">Listenteil</label>
                <select id="cardmarket-part" value={activeCardmarketPartIndex} onChange={(event) => setCardmarketPartIndex(Number(event.target.value))}>
                  {cardmarketHandoff.parts.map((part, index) => <option value={index} key={part.index}>Teil {part.index} von {cardmarketHandoff.parts.length} · {part.positionCount} Positionen</option>)}
                </select>
              </div>

              <label className={styles.massEntryPreview}>
                <span>Cardmarket-Importtext · exakt eine Karte pro Zeile</span>
                <textarea aria-label="Cardmarket-Decklistenvorschau" readOnly rows={Math.max(3, Math.min(activeCardmarketPart.importablePositionCount, 8))} value={activeCardmarketPart.text} placeholder={cardmarketPreparing ? "Kartendaten werden aktualisiert …" : "Für diese Positionen fehlen noch die von Cardmarket benötigten Fähigkeiten oder Attacken."} />
              </label>

              <div className={styles.marketplaceActions}>
                <button type="button" className={styles.primaryButton} disabled={!activeCardmarketPart.text || cardmarketPreparing} onClick={() => onCardmarketCopy?.(activeCardmarketPart)}>
                  <Clipboard size={16} /> {cardmarketCopyState === "copied" ? `Teil ${activeCardmarketPart.index} kopiert` : "Deckliste kopieren"}
                </button>
                <button type="button" className={styles.secondaryButton} disabled={!activeCardmarketPart.text || cardmarketPreparing} onClick={() => onCardmarketTextExport?.(activeCardmarketPart)}>
                  <Download size={16} /> Deckliste TXT
                </button>
                <a className={styles.helpLink} href={cardmarketHandoff.singlesUrl} target="_blank" rel="noopener noreferrer">Cardmarket-Kartenübersicht öffnen</a>
              </div>
              {cardmarketCopyState === "error" ? <p className={styles.error} role="status">Kopieren wurde nicht erlaubt. Der Text bleibt oben markierbar oder kann als TXT geladen werden.</p> : null}
            </div>

          {verifiedCardmarketProducts.length || unresolvedCardmarketProducts.length ? (
            <div className={styles.fallbackSection}>
                <h4>Einzelne Karten suchen ({activeCardmarketPart.products.length})</h4>
                <p className={styles.reviewExplanation}>Diese Links brauchst du nur für Karten, die Cardmarket nach dem Sammelimport ausdrücklich nicht gefunden hat.</p>

                {verifiedCardmarketProducts.length ? (
                  <section className={styles.cardmarketProductSection} aria-labelledby="cardmarket-verified-heading">
                    <div className={styles.cardmarketProductHeading}>
                      <div><span className={styles.cardmarketNumber}>1</span><h4 id="cardmarket-verified-heading">Direkte Produktseiten</h4></div>
                      <small>{verifiedCardmarketProducts.length} Karten</small>
                    </div>
                    {verifiedCardmarketProducts.some((product) => product.productSource === "provider-id") ? <p className={styles.cardmarketSectionIntro}>Die Produkt-IDs stammen von CardTrader und führen direkt auf die Cardmarket-Produktseite. Prüfe dort Set, Nummer und Sprache, bevor du kaufst.</p> : null}
                    <ul>
                      {verifiedCardmarketProducts.map((product) => (
                        <li key={product.identityKey}>
                          <span><strong>{product.label}</strong><small>{product.details}{product.productSource === "provider-id" ? " · ID laut CardTrader" : ""}</small></span>
                          <a aria-label={`Produktseite öffnen: ${product.label}`} href={product.productUrl} target="_blank" rel="noopener noreferrer">Produktseite öffnen <ExternalLink aria-hidden="true" size={14} /></a>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {unresolvedCardmarketProducts.length ? (
                  <section className={styles.cardmarketProductSection} data-status="search" aria-labelledby="cardmarket-search-heading">
                    <div className={styles.cardmarketProductHeading}>
                      <div><span className={styles.cardmarketNumber}>2</span><h4 id="cardmarket-search-heading">Vorausgefüllte Suchlinks</h4></div>
                      <small>{unresolvedCardmarketProducts.length} Karten</small>
                    </div>
                    <p className={styles.cardmarketSectionIntro}>Vergleiche auf Cardmarket Kartenname, Set und Nummer mit den Angaben hier.</p>
                    <ul>
                      {unresolvedCardmarketProducts.map((product) => (
                        <li key={product.identityKey}>
                          <span><strong>{product.label}</strong><small>{product.details}</small></span>
                          <a aria-label={`Karte suchen: ${product.label}`} href={product.url} target="_blank" rel="noopener noreferrer">Karte suchen <ExternalLink aria-hidden="true" size={14} /></a>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
            </div>
          ) : null}
            </div>
          </details>

        </section>
      ) : null}

      {marketplaceChoice === "cardtrader" && cardtraderEnabled ? (
        <CardTraderMarketplacePanel items={visibleItems} wishlistEnabled={cardtraderWishlistEnabled} />
      ) : null}

      {marketplaceChoice === "cardtrader" && !cardtraderEnabled && cardtraderPreviewVisible ? (
        <CardTraderPanel items={visibleItems} status={cardtraderStatus} quote={cardtraderQuote} />
      ) : null}

      {!showStandardLayout ? (items.length ? null : <div className={styles.empty}><strong>Keine fehlenden Karten</strong><p>Leere Slots und vorhandene Karten werden nicht als Bedarf gezählt.</p></div>) : items.length ? <details className={styles.completeListDisclosure}>
        <summary>Alle fehlenden Karten als Liste ({visibleItems.length})</summary>
        <div className={styles.listTools}>
          <div className={styles.toolbar}>
            <label className={styles.searchLabel} htmlFor="missing-card-filter">
              <Search aria-hidden="true" size={17} />
              <span className={styles.srOnly}>Fehlkarten filtern</span>
              <input id="missing-card-filter" placeholder="Name, Set oder Nummer" onChange={(event) => setQuery(event.target.value)} />
            </label>
            <span className={styles.searchHint}>{visibleItems.length} Kartenpositionen</span>
          </div>
          <div className={styles.advancedExports} aria-label="Weitere Exportmöglichkeiten">
            <div><strong>Export nur bei Bedarf</strong><span>Für Tabellen oder ein eigenes Backup der gefilterten Liste.</span></div>
            <div className={styles.exportActions}>
              <button type="button" className={styles.secondaryButton} onClick={() => onCopy(visibleItems)} disabled={!visibleItems.length}>
                <Clipboard size={16} /> {copyState === "copied" ? "Kopiert" : "Liste kopieren"}
              </button>
              <button type="button" className={styles.secondaryButton} onClick={() => onTextExport(visibleItems)} disabled={!visibleItems.length}><Download size={16} /> TXT</button>
              <button type="button" className={styles.secondaryButton} onClick={() => onCsvExport(visibleItems)} disabled={!visibleItems.length}><FileDown size={16} /> CSV</button>
            </div>
          </div>
          {visibleItems.length ? <MissingItemGroups groups={visibleGroups} onConditionsChange={onConditionsChange} /> : <div className={styles.empty}><strong>Keine Treffer für diesen Filter</strong><p>Passe den Suchbegriff an oder lösche den Filter.</p></div>}
        </div>
      </details> : <div className={styles.empty}><strong>Keine fehlenden Karten</strong><p>Leere Slots und vorhandene Karten werden nicht als Bedarf gezählt.</p></div>}
    </section>
  );
}

function MissingItemGroups({
  groups,
  onConditionsChange,
}: {
  groups: ReturnType<typeof groupMissingItemsBySet>;
  onConditionsChange?: MissingCardsPanelProps["onConditionsChange"];
}) {
  return (
    <div className={styles.groupList}>
      {groups.map((group) => (
        <section className={styles.missingGroup} key={group.key} aria-labelledby={`missing-set-${group.key}`}>
          <div className={styles.groupHeader}><SetLogo setId={group.setId} language={group.language} className={styles.groupLogo} /><h3 id={`missing-set-${group.key}`}>{group.setName} · {group.language.toUpperCase()}</h3><span>{group.positionCount} Positionen · {group.quantity} Exemplare</span></div>
          <ul className={styles.list}>
            {group.items.map((item) => (
              <li className={styles.item} key={item.identityKey}>
                <span className={styles.quantity} aria-label={`${item.quantity} Exemplare`}>{item.quantity}×</span>
                <div className={styles.cardInfo}>
                  <strong>{item.card.name}</strong>
                  <span>Nr. {formatCollectorNumber(item.card.collectorNumber, item.card.collectorTotal)}</span>
                </div>
                <div className={styles.metadata}>
                  <span>{item.card.ref.language.toUpperCase()}</span>
                  <span>{item.variant.label || finishLabels[item.variant.finish]}</span>
                  <span>{editionLabels[item.variant.edition]}</span>
                  <span>{printingLabels[selectedPrinting(item.variant)]}</span>
                  {onConditionsChange ? (
                    <label className={styles.itemCondition}>
                      <span className={styles.srOnly}>Zustand für {item.card.name} aus {item.card.setName}</span>
                      <select
                        aria-label={`Zustand für ${item.card.name} aus ${item.card.setName}`}
                        value={item.preferences.minimumCondition}
                        onChange={(event) => onConditionsChange([item], event.target.value as PurchasePreferences["minimumCondition"])}
                      >
                        {conditionProfiles.map((profile) => <option value={profile.value} key={profile.value}>{profile.shortLabel}</option>)}
                      </select>
                    </label>
                  ) : <span>{conditionProfile(item.preferences.minimumCondition).label}</span>}
                  <span>{missingItemReviewNote(item).startsWith("Manuell") ? "Manuell prüfen" : "Prüfen"}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function cardTraderStatusCopy(status: CardTraderStatus): { label: string; title: string; body: string } {
  switch (status) {
    case "not-connected":
      return {
        label: "Nicht verbunden",
        title: "CardTrader ist noch nicht verbunden",
        body: "Für eine persönliche Wishlist wäre später eine ausdrückliche Verbindung nötig. Your Card Binder speichert dafür keinen Token im Browser oder Backup.",
      };
    case "review-required":
      return {
        label: "Manuell prüfen",
        title: "Einige Ausgaben brauchen eine Prüfung",
        body: "Set, Kartennummer, Sprache, Finish und Zustand werden erst nach einer eindeutigen Blueprint-Zuordnung übergeben.",
      };
    case "stale":
      return {
        label: "Daten veraltet",
        title: "Die letzte CardTrader-Abfrage ist nicht mehr aktuell",
        body: "Preise und Verfügbarkeit können sich geändert haben. Die Anzeige ist deshalb keine Kaufzusage.",
      };
    case "ready":
      return {
        label: "Geprüfte Vorschau",
        title: "CardTrader-Vorschau",
        body: "Diese Vorschau zeigt nur bestätigte Angaben. Your Card Binder legt keinen Artikel in einen Warenkorb und kauft nichts.",
      };
    default:
      return {
        label: "Noch nicht freigegeben",
        title: "CardTrader ist vorbereitet, aber noch nicht freigegeben",
        body: "Katalog, Bilder, Preise und Wishlists werden erst nach einer Testprüfung und schriftlichen Freigabe von CardTrader aktiviert.",
      };
  }
}

function formatMinorAmount(amountMinor: number | undefined, currency: CardTraderQuotePreview["currency"]): string {
  if (amountMinor == null || !currency) return "Preis unbekannt";
  return new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(amountMinor / 100);
}

function CardTraderPanel({
  items,
  status,
  quote,
}: {
  items: readonly MissingItem[];
  status: CardTraderStatus;
  quote: CardTraderQuotePreview;
}) {
  const statusCopy = cardTraderStatusCopy(status);
  const hasRange = (quote.status === "ready" || quote.status === "estimated")
    && quote.minimumMinor != null
    && quote.maximumMinor != null
    && quote.currency != null;
  const quoteLabel = hasRange
    ? `${formatMinorAmount(quote.minimumMinor, quote.currency)}–${formatMinorAmount(quote.maximumMinor, quote.currency)}`
    : quote.status === "stale" ? "Preis veraltet" : "Preis unbekannt";
  const quoteDetails = quote.fetchedAt
    ? `Stand ${new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(new Date(quote.fetchedAt))}${quote.confidence ? ` · Konfidenz ${quote.confidence}` : ""}`
    : "Keine freigegebene CardTrader-Preisdatenquelle";

  return (
    <section className={styles.marketplacePanel} aria-labelledby="cardtrader-handoff-heading">
      <div className={styles.marketplaceHeader}>
        <div>
          <p className={styles.eyebrow}>Provider-Vorschau · getrennt vom Warenkorb</p>
          <h3 id="cardtrader-handoff-heading">CardTrader</h3>
          <p>{items.length} Positionen · {items.reduce((total, item) => total + item.quantity, 0)} Exemplare</p>
        </div>
        <span className={styles.marketplaceStatus} data-status={status}>{statusCopy.label}</span>
      </div>

      <div className={styles.cardtraderStatus} role="status">
        <strong>{statusCopy.title}</strong>
        <p>{statusCopy.body}</p>
      </div>

      <div className={styles.cardtraderFacts} aria-label="CardTrader-Datenstatus">
        <div><span>Preis</span><strong>{quoteLabel}</strong><small>{quoteDetails}</small></div>
        <div><span>Versand &amp; Steuer</span><strong>Nicht enthalten</strong><small>Wird nicht aus einer Kartenpreisspanne abgeleitet.</small></div>
        <div><span>Bildquelle</span><strong>Your Card Binder-Katalog</strong><small>Ein Providerbild wäre als Fallback gekennzeichnet.</small></div>
      </div>

      <ol className={styles.handoffSteps} aria-label="CardTrader-Prüfschritte">
        <li>Prüfe Sprache, Kartennummer, Finish, Edition und Mindestzustand pro Position.</li>
        <li>Öffne Angebote erst nach bestätigter Blueprint-Zuordnung und beachte den Zeitstempel.</li>
        <li>Eine private Wishlist wäre eine separate, ausdrücklich bestätigte Aktion.</li>
      </ol>

      <div className={styles.cardtraderPreview}>
        <strong>Ausgabevorschau</strong>
        <ul>
          {items.map((item) => (
            <li key={item.identityKey}>
              <span><b>{item.quantity}× {item.card.name}</b><small>{item.card.setName} · Nr. {formatCollectorNumber(item.card.collectorNumber, item.card.collectorTotal)}</small></span>
              <span className={styles.cardtraderTags}>
                <em>{item.card.ref.language.toUpperCase()}</em>
                <em>{finishLabels[item.variant.finish]}</em>
                <em>{editionLabels[item.variant.edition]}</em>
                <em>{conditionProfile(item.preferences.minimumCondition).label}</em>
                <em>{item.card.imageBaseUrl ? "Bild: Your Card Binder" : item.card.imageFallbackBaseUrl ? "Bild: Fallback" : "Bild fehlt"}</em>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <details className={styles.cardtraderConnection}>
        <summary>Verbindung als fortgeschrittene Option</summary>
        <p>Eine spätere Verbindung verwendet einen eigenen CardTrader-Token nur zur Laufzeit. Your Card Binder fordert keine Zugangsdaten in diesem Panel an, legt keine Tokens in Backups ab und trennt „Wishlist erstellen“ klar von „Angebote ansehen“.</p>
      </details>

      <div className={styles.marketplaceActions}>
        <button type="button" className={styles.primaryButton} disabled aria-describedby="cardtrader-wishlist-note">Wishlist erstellen</button>
        <span id="cardtrader-wishlist-note" className={styles.marketplaceUnavailable}>Noch nicht freigegeben</span>
      </div>
    </section>
  );
}
