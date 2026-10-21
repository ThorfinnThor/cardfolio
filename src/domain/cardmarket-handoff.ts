import type { MissingItem } from "./types";
import { formatCollectorNumber } from "./catalog-search";
import { conditionProfile } from "./purchase-preferences";
import {
  resolveMarketplaceProductIdentity,
  type MarketplaceProductIdentityMapping,
  type MarketplaceProductIdentityStatus,
} from "./marketplace-product-identity";
import { variantAvailabilityForCard, variantSelectionIssue } from "./variant-selection";

export const CARDMARKET_POKEMON_SINGLES_URL = "https://www.cardmarket.com/en/Pokemon/Products/Singles";
export const CARDMARKET_POKEMON_SEARCH_URL = "https://www.cardmarket.com/en/Pokemon/Products/Search";
export const CARDMARKET_POKEMON_WANTS_URL = "https://www.cardmarket.com/de/Pokemon/Wants";
export const CARDMARKET_POKEMON_WANTS_HELP_URL = "https://help.cardmarket.com/en/how-to-add-a-pkmn-decklist-to-wants";
export const CARDMARKET_SHOPPING_WIZARD_HELP_URL = "https://help.cardmarket.com/en/ShoppingWizard";
export const CARDMARKET_MAX_WANTS_POSITIONS = 150;

// A small provider-specific compatibility layer for cards whose printed level
// is missing from the upstream catalog but is part of Cardmarket's product
// identity. Keep these overrides keyed by the stable set/collector identity;
// do not modify the shared CardSnapshot just to satisfy one provider.
const CARDMARKET_LEVEL_OVERRIDES: Record<string, string> = {
  "dp2:16": "46",
  "pl1:99": "12",
};

export interface CardmarketHandoffPart {
  index: number;
  positionCount: number;
  importablePositionCount: number;
  text: string;
  items: readonly MissingItem[];
  searches: CardmarketSearchTarget[];
  products: CardmarketProductTarget[];
}

export interface CardmarketSearchTarget {
  identityKey: string;
  label: string;
  details: string;
  url: string;
}

export interface CardmarketProductTarget extends CardmarketSearchTarget {
  status: MarketplaceProductIdentityStatus;
  reason: string;
  productUrl?: string;
  /** "reviewed": checked by hand against the product page; "provider-id": product id listed by CardTrader. */
  productSource?: "reviewed" | "provider-id";
}

export interface CardmarketHandoff {
  parts: CardmarketHandoffPart[];
  positionCount: number;
  importablePositionCount: number;
  excluded: CardmarketExcludedItem[];
  totalQuantity: number;
  reviewRequiredCount: number;
  verifiedProductCount: number;
  searchRequiredCount: number;
  warnings: string[];
  singlesUrl: typeof CARDMARKET_POKEMON_SINGLES_URL;
  wantsUrl: typeof CARDMARKET_POKEMON_WANTS_URL;
  wantsHelpUrl: typeof CARDMARKET_POKEMON_WANTS_HELP_URL;
}

export interface CardmarketExcludedItem {
  identityKey: string;
  label: string;
  reason: string;
}

function inline(value: string): string {
  const normalized = value.replace(/[\r\n\u0000-\u001f\u007f|]+/g, " ").replace(/\s+/g, " ").trim();
  return normalized || "Nicht angegeben";
}

function cardmarketCardName(value: string, level?: string): string {
  const name = inline(value)
    .replace(/\s*δ$/u, " δ Delta Species")
    .replace(/\s*☆$/u, " Gold Star");
  if (!level || /\b(?:lv\.?|level)\s*[a-z0-9.-]+/iu.test(name)) return name;
  const normalizedLevel = inline(level).replace(/^lv\.?\s*/iu, "");
  return `${name} Lv.${normalizedLevel}`;
}

function cardmarketLevel(item: MissingItem): string | undefined {
  return item.card.level ?? CARDMARKET_LEVEL_OVERRIDES[`${item.card.setId}:${item.card.collectorNumber}`];
}

function cardmarketSuffix(value?: string): string | undefined {
  if (!value) return undefined;
  const normalized = inline(value);
  return normalized === "Nicht angegeben" ? undefined : normalized;
}

function createDecklistLine(
  item: MissingItem,
  verifiedIdentities?: Readonly<Record<string, string>>,
): { line?: string; reason?: string } {
  const variantIssue = variantSelectionIssue(item.variant, variantAvailabilityForCard(item.card));
  if (variantIssue) return { reason: `Variantenangaben prüfen: ${variantIssue}` };
  if (verifiedIdentities) {
    const verifiedIdentity = verifiedIdentities[item.card.ref.id];
    if (!verifiedIdentity) {
      return { reason: "Diese Karte ist noch nicht eindeutig gegen den offiziellen Cardmarket-Produktkatalog geprüft und wurde sicherheitshalber nicht importiert." };
    }
    return { line: `${item.quantity}x ${inline(verifiedIdentity)}` };
  }
  const identity = item.card.ref.language === "de" ? item.card.englishIdentity : undefined;
  const name = identity?.name ?? item.card.name;
  const level = identity?.level ?? cardmarketLevel(item);
  const suffix = cardmarketSuffix(identity?.suffix ?? item.card.suffix);
  const category = identity?.category ?? item.card.category;
  const abilities = identity?.abilities ?? item.card.abilities;
  const attacks = identity?.attacks ?? item.card.attacks;
  if (!category || abilities === undefined || attacks === undefined) {
    return { reason: "Kartentyp, Fähigkeiten und Attacken müssen zuerst aus dem Katalog aktualisiert werden." };
  }

  if (category !== "pokemon") {
    return { line: `${item.quantity}x ${cardmarketCardName(name, level)}` };
  }

  const identifyingDetails = [...abilities, ...attacks].map(inline).filter(Boolean);
  if (!identifyingDetails.length) {
    return { reason: "Cardmarket benötigt bei Pokémon mindestens eine Fähigkeit oder Attacke zur eindeutigen Suche." };
  }

  const fullName = cardmarketCardName(name, level);
  const providerSuffix = suffix && !fullName.toLocaleLowerCase("en").includes(suffix.toLocaleLowerCase("en"))
    ? suffix
    : undefined;
  return { line: `${item.quantity}x ${[fullName, ...identifyingDetails, providerSuffix].filter(Boolean).join(" ")}` };
}

export function createCardmarketSearchUrl(item: MissingItem): string {
  const identity = item.card.ref.language === "de" ? item.card.englishIdentity : undefined;
  const url = new URL(CARDMARKET_POKEMON_SEARCH_URL);
  url.searchParams.set("searchString", [
    cardmarketCardName(identity?.name ?? item.card.name, identity?.level ?? cardmarketLevel(item)),
    inline(identity?.setName ?? item.card.setName),
    inline(formatCollectorNumber(item.card.collectorNumber, item.card.collectorTotal)),
  ].join(" "));
  return url.toString();
}

function createSearchTarget(item: MissingItem): CardmarketSearchTarget {
  return {
    identityKey: item.identityKey,
    label: `${item.quantity}× ${inline(item.card.name)}`,
    details: `${inline(item.card.setName)} · Nr. ${inline(formatCollectorNumber(item.card.collectorNumber, item.card.collectorTotal))} · ${item.card.ref.language.toUpperCase()} · Zustand: ${conditionProfile(item.preferences.minimumCondition).shortLabel}`,
    url: createCardmarketSearchUrl(item),
  };
}

function createProductTarget(
  item: MissingItem,
  mappings: readonly MarketplaceProductIdentityMapping[],
): CardmarketProductTarget {
  const search = createSearchTarget(item);
  const resolution = resolveMarketplaceProductIdentity("cardmarket", item, mappings);
  return {
    ...search,
    status: resolution.status,
    reason: resolution.reason,
    productUrl: resolution.status === "verified" ? resolution.mapping?.productUrl : undefined,
    productSource: resolution.status === "verified" && resolution.mapping?.productUrl
      ? (resolution.mapping.source.kind === "provider-external-id" ? "provider-id" : "reviewed")
      : undefined,
  };
}

export function createCardmarketHandoff(
  items: readonly MissingItem[],
  productMappings: readonly MarketplaceProductIdentityMapping[] = [],
  verifiedIdentities?: Readonly<Record<string, string>>,
): CardmarketHandoff {
  const parts: CardmarketHandoffPart[] = [];
  const matches = items.map((item) => ({ item, ...createDecklistLine(item, verifiedIdentities) }));
  const products = items.map((item) => createProductTarget(item, productMappings));
  const excluded = matches
    .filter((match) => !match.line)
    .map((match) => ({
      identityKey: match.item.identityKey,
      label: `${match.item.quantity}× ${inline(match.item.card.name)} · ${inline(match.item.card.setName)} · Nr. ${inline(formatCollectorNumber(match.item.card.collectorNumber, match.item.card.collectorTotal))}`,
      reason: match.reason ?? "Kein sicheres Cardmarket-Importformat verfügbar.",
    }));

  for (let start = 0; start < items.length; start += CARDMARKET_MAX_WANTS_POSITIONS) {
    const partItems = items.slice(start, start + CARDMARKET_MAX_WANTS_POSITIONS);
    const partMatches = matches.slice(start, start + CARDMARKET_MAX_WANTS_POSITIONS);
    parts.push({
      index: parts.length + 1,
      positionCount: partItems.length,
      importablePositionCount: partMatches.filter((match) => match.line).length,
      text: partMatches.flatMap((match) => match.line ? [match.line] : []).join("\n"),
      items: partItems,
      searches: partItems.map(createSearchTarget),
      products: products.slice(start, start + CARDMARKET_MAX_WANTS_POSITIONS),
    });
  }

  const warnings = items.length
    ? [
        "Offizielles Pokémon-Decklistenformat: Menge, vollständiger Kartenname, Fähigkeiten und Attacken – eine Karte pro Zeile.",
        ...(verifiedIdentities ? ["Der Importtext enthält ausschließlich Kartenidentitäten, die mit dem offiziellen Cardmarket-Produktkatalog abgeglichen wurden."] : []),
        "Das Decklistenformat legt Set, Kartennummer, Sprache und Druckvariante nicht fest.",
        "Der in Cardfolio gewählte Zustand wird gespeichert, aber vom Decklistenformat nicht übertragen. Wähle ihn nach dem Import in Cardmarket aus.",
        "Vor dem Kauf jede Position anhand von Set, Kartennummer, Sprache, Finish, Edition, Druckvariante und Zustand prüfen.",
      ]
    : [];

  if (excluded.length > 0) {
    warnings.push(`${excluded.length} Position(en) fehlen die für das offizielle Cardmarket-Format benötigten Katalogdaten und wurden nicht in den Importtext aufgenommen.`);
  }

  if (parts.length > 1) {
    warnings.push(`Cardmarket erlaubt höchstens ${CARDMARKET_MAX_WANTS_POSITIONS} Einträge pro Wants-Liste. Die ${items.length} Positionen wurden deshalb in ${parts.length} Teile aufgeteilt.`);
  }

  return {
    parts,
    positionCount: items.length,
    importablePositionCount: matches.filter((match) => match.line).length,
    excluded,
    totalQuantity: items.reduce((total, item) => total + item.quantity, 0),
    reviewRequiredCount: items.length,
    verifiedProductCount: products.filter((product) => product.productUrl).length,
    searchRequiredCount: products.filter((product) => !product.productUrl).length,
    warnings,
    singlesUrl: CARDMARKET_POKEMON_SINGLES_URL,
    wantsUrl: CARDMARKET_POKEMON_WANTS_URL,
    wantsHelpUrl: CARDMARKET_POKEMON_WANTS_HELP_URL,
  };
}
