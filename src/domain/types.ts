export type DesignVariant = "design-2" | "design-3";
export type CardLanguage = "en" | "de";
export type CardKey = string;
export type UUID = string;

export interface CardRef {
  /** "cardtrader" only for the few supplement cards TCGdex does not list (see data/cardtrader/supplements). */
  provider: "tcgdex" | "cardtrader";
  id: string;
  language: CardLanguage;
}

export interface CardSnapshot {
  key: CardKey;
  ref: CardRef;
  name: string;
  setId: string;
  setName: string;
  collectorNumber: string;
  collectorTotal?: string;
  availableVariants?: CardVariantAvailability;
  imageBaseUrl?: string;
  imageFallbackBaseUrl?: string;
  category?: "pokemon" | "trainer" | "energy" | "other";
  level?: string;
  levelChecked?: true;
  suffix?: string;
  cardmarketIdentityV2Checked?: true;
  abilities?: string[];
  attacks?: string[];
  englishIdentity?: {
    name: string;
    setName: string;
    category?: "pokemon" | "trainer" | "energy" | "other";
    level?: string;
    suffix?: string;
    abilities: string[];
    attacks: string[];
  };
  physicalStatus: "physical" | "digital" | "unknown";
  fetchedAt: string;
}

export interface CardVariantAvailability {
  normal: boolean;
  holo: boolean;
  reverse: boolean;
  firstEdition: boolean;
  shadowless?: boolean;
}

export interface VariantSelection {
  finish: "normal" | "holo" | "reverse" | "other" | "unspecified";
  edition: "unlimited" | "first-edition" | "unspecified";
  printing?: "shadowless" | "shadowed" | "unspecified";
  label?: string;
}

export interface PurchasePreferences {
  minimumCondition: "near-mint" | "excellent" | "lightly-played" | "played" | "any";
}

/** The grade of a card the collector owns. "any" is a purchase preference only and is not a grade. */
export type OwnedCondition = Exclude<PurchasePreferences["minimumCondition"], "any">;

export const MAX_COPIES = 99;

export interface PlannedCard {
  id: UUID;
  cardKey: CardKey;
  variant: VariantSelection;
  /** Present only while the physical printing still needs to be confirmed. */
  variantReview?: "required";
  preferences: PurchasePreferences;
  owned: boolean;
  /** Condition of the owned copy; when missing, the minimum condition wanted is used for the value. */
  condition?: OwnedCondition;
  /** Number of copies owned; missing means one. */
  quantity?: number;
  addedAt: string;
}

/** One saved value of a binder: the day it was recorded and what the owned cards were worth that day. */
export interface ValuePoint {
  /** YYYY-MM-DD in UTC. */
  date: string;
  /** Total in euro cents of the priced owned cards. */
  valueMinor: number;
  /** Owned copies that have a price, and owned copies in total. */
  pricedCopies: number;
  ownedCopies: number;
}

export interface BinderPage {
  id: UUID;
  slots: Array<PlannedCard | null>;
  note: string;
  title?: string;
}

export interface Binder {
  id: UUID;
  schemaVersion: 1;
  revision: number;
  name: string;
  description: string;
  layout: { rows: number; columns: number };
  pages: BinderPage[];
  createdAt: string;
  updatedAt: string;
}

export interface MissingItem {
  identityKey: string;
  card: CardSnapshot;
  variant: VariantSelection;
  preferences: PurchasePreferences;
  quantity: number;
  entryIds: UUID[];
}

export interface ExportResult {
  text: string;
  mimeType: "text/plain" | "text/csv";
  warnings: string[];
  excludedEntryIds: UUID[];
  verifiedCount: number;
  reviewRequiredCount: number;
}

export interface PriceEstimate {
  source: "tcgdex-cardmarket" | "tcgdex-tcgplayer";
  currency: "EUR" | "USD";
  amountMinor: number;
  metric: "trend" | "market";
  fetchedAt: string;
  sourceUpdatedAt?: string;
  matchQuality: "verified-printing" | "candidate";
  variantKey: string;
}

export interface LocalBackupV1 {
  format: "cardfolio-backup";
  version: 1;
  exportedAt: string;
  binders: Binder[];
  cards: CardSnapshot[];
}

export interface LocalBackupV2 {
  format: "cardfolio-backup";
  version: 2;
  exportedAt: string;
  binders: Binder[];
  cards: CardSnapshot[];
  giftProjects: import("./gift-builder").GiftProject[];
  /** Saved value history per binder id; absent in backups made before the value tracker. */
  valueHistory?: Record<UUID, ValuePoint[]>;
}

export type LocalBackup = LocalBackupV1 | LocalBackupV2;

export interface CatalogQuery {
  name?: string;
  setId?: string;
  collectorNumber?: string;
  collectorTotal?: string;
  language: CardLanguage;
  page: number;
  pageSize: number;
}

export interface CatalogSearchItem {
  ref: CardRef;
  name: string;
  collectorNumber: string;
  collectorTotal?: string;
  imageBaseUrl?: string;
  setId?: string;
  setName?: string;
}

export interface CatalogAdapter {
  search(
    query: CatalogQuery,
    signal?: AbortSignal,
  ): Promise<{ items: CatalogSearchItem[]; hasMore: boolean }>;
  getCard(ref: CardRef, signal?: AbortSignal): Promise<CardSnapshot>;
}
