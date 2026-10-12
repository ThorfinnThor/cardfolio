export type BinderOfferCurrency = "EUR" | "USD";
export type BinderOfferStatus = "available" | "disabled" | "stale" | "invalid";
export type BinderOfferKind = "standard" | "personalized";

export interface BinderOfferPrice {
  amountMinor: number;
  currency: BinderOfferCurrency;
  qualifier: "fixed" | "from";
  sourceUpdatedAt: string;
}

export interface BinderAffiliateDisclosure {
  enabled: boolean;
  text?: string;
  staticQuery?: Readonly<Record<string, string>>;
}

export interface BinderPartnerCapabilities {
  personalization: boolean;
  photoUpload: boolean;
}

export interface BinderPartnerConfig {
  id: string;
  displayName: string;
  kind: BinderOfferKind;
  enabled: boolean;
  verifiedAt: string;
  reviewAfter: string;
  destinationUrl?: string;
  disabledReason?: string;
  affiliate: BinderAffiliateDisclosure;
  capabilities: BinderPartnerCapabilities;
  capacityCards?: number;
  pocketsPerPage?: number;
  price?: BinderOfferPrice;
  evidenceUrls: readonly string[];
}

export interface BinderPartnerCatalog {
  schemaVersion: 1;
  enabled: boolean;
  reviewedAt: string;
  disabledReason?: string;
  partners: readonly BinderPartnerConfig[];
}

export interface BinderOffer {
  id: string;
  displayName: string;
  kind: BinderOfferKind;
  status: BinderOfferStatus;
  statusReason?: string;
  verifiedAt: string;
  reviewAfter: string;
  destinationUrl?: string;
  affiliate: boolean;
  affiliateDisclosure?: string;
  capabilities: BinderPartnerCapabilities;
  capacityCards?: number;
  pocketsPerPage?: number;
  price?: BinderOfferPrice;
  evidenceUrls: readonly string[];
}

export interface BinderAffiliateAdapter {
  listOffers(now?: Date): readonly BinderOffer[];
  getOffer(id: string, now?: Date): BinderOffer | undefined;
  buildExternalUrl(id: string, now?: Date): string | undefined;
}

export function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
