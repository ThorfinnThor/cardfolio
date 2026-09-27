export type DesignVariant = "design-2" | "design-3";
export type CardLanguage = "en" | "de";
export type CardKey = string;
export type UUID = string;

export interface CardRef {
  provider: "tcgdex";
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
  imageBaseUrl?: string;
  category?: "pokemon" | "trainer" | "energy" | "other";
  physicalStatus: "physical" | "digital" | "unknown";
  fetchedAt: string;
}

export interface VariantSelection {
  finish: "normal" | "holo" | "reverse" | "other" | "unspecified";
  edition: "unlimited" | "first-edition" | "unspecified";
  label?: string;
}

export interface PurchasePreferences {
  minimumCondition: "near-mint" | "lightly-played" | "played" | "any";
}

export interface PlannedCard {
  id: UUID;
  cardKey: CardKey;
  variant: VariantSelection;
  preferences: PurchasePreferences;
  owned: boolean;
  addedAt: string;
}

export interface BinderPage {
  id: UUID;
  slots: Array<PlannedCard | null>;
  note: string;
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

export interface CatalogQuery {
  name?: string;
  setId?: string;
  collectorNumber?: string;
  language: CardLanguage;
  page: number;
  pageSize: number;
}

export interface CatalogSearchItem {
  ref: CardRef;
  name: string;
  collectorNumber: string;
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
