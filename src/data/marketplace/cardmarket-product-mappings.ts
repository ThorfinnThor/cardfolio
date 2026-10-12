import {
  marketplaceProductIdentityIssues,
  type MarketplaceProductIdentityMapping,
} from "@/domain/marketplace-product-identity";

export const CARDMARKET_PRODUCT_MAPPINGS_URL = "/data/marketplace/cardmarket-product-mappings.v1.json";

export interface CardmarketProductMappingAudit {
  reviewedScopeCardCount: number;
  mappingCount: number;
  verifiedCount: number;
  probableCount: number;
  missingCount: number;
  invalidCount: number;
  unmappedReviewedCardCount: number;
}

export interface CardmarketProductMappingCatalog {
  format: "cardfolio-cardmarket-product-mappings";
  version: 1;
  source: string;
  generatedAt: string;
  reviewedScopeCardCount: number;
  mappings: readonly MarketplaceProductIdentityMapping[];
  audit: CardmarketProductMappingAudit;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validDate(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function isMapping(value: unknown): value is MarketplaceProductIdentityMapping {
  if (!isRecord(value)
    || value.schemaVersion !== 1
    || (value.provider !== "cardmarket" && value.provider !== "cardtrader" && value.provider !== "tcgplayer")
    || typeof value.tcgdexCardId !== "string"
    || typeof value.cardName !== "string"
    || !isRecord(value.scope)
    || !isRecord(value.source)
    || (value.status !== "verified" && value.status !== "probable" && value.status !== "missing")
    || typeof value.checkedAt !== "string"
    || !validDate(value.checkedAt)
    || typeof value.scope.language !== "string"
    || typeof value.scope.finish !== "string"
    || typeof value.scope.edition !== "string"
    || typeof value.scope.printing !== "string"
    || typeof value.source.kind !== "string"
    || typeof value.source.label !== "string"
    || (value.source.evidenceUrl !== undefined && typeof value.source.evidenceUrl !== "string")
    || (value.providerProductId !== undefined && typeof value.providerProductId !== "string")
    || (value.providerMetaProductId !== undefined && typeof value.providerMetaProductId !== "string")
    || (value.productUrl !== undefined && typeof value.productUrl !== "string")
    || (value.verifiedAt !== undefined && (typeof value.verifiedAt !== "string" || !validDate(value.verifiedAt)))
    || (value.note !== undefined && typeof value.note !== "string")) {
    return false;
  }
  return marketplaceProductIdentityIssues(value as unknown as MarketplaceProductIdentityMapping).length === 0;
}

function isAudit(value: unknown): value is CardmarketProductMappingAudit {
  if (!isRecord(value)) return false;
  return [
    "reviewedScopeCardCount",
    "mappingCount",
    "verifiedCount",
    "probableCount",
    "missingCount",
    "invalidCount",
    "unmappedReviewedCardCount",
  ].every((key) => typeof value[key] === "number" && Number.isInteger(value[key]) && value[key] >= 0);
}

export function parseCardmarketProductMappingCatalog(value: unknown): CardmarketProductMappingCatalog {
  if (!isRecord(value)
    || value.format !== "cardfolio-cardmarket-product-mappings"
    || value.version !== 1
    || typeof value.source !== "string"
    || !value.source.trim()
    || !validDate(value.generatedAt)
    || typeof value.reviewedScopeCardCount !== "number"
    || !Number.isInteger(value.reviewedScopeCardCount)
    || value.reviewedScopeCardCount < 0
    || !Array.isArray(value.mappings)
    || !value.mappings.every(isMapping)
    || !isAudit(value.audit)) {
    throw new Error("Cardmarket-Produktzuordnungen haben ein ungültiges Format.");
  }

  const mappings = value.mappings as MarketplaceProductIdentityMapping[];
  const audit = value.audit as CardmarketProductMappingAudit;
  const calculated = buildCardmarketProductMappingAudit(value.reviewedScopeCardCount, mappings);
  if (JSON.stringify(audit) !== JSON.stringify(calculated)) {
    throw new Error("Cardmarket-Mapping-Audit stimmt nicht mit den Zuordnungen überein.");
  }

  return {
    format: "cardfolio-cardmarket-product-mappings",
    version: 1,
    source: value.source,
    generatedAt: value.generatedAt,
    reviewedScopeCardCount: value.reviewedScopeCardCount,
    mappings,
    audit,
  };
}

export function buildCardmarketProductMappingAudit(
  reviewedScopeCardCount: number,
  mappings: readonly MarketplaceProductIdentityMapping[],
): CardmarketProductMappingAudit {
  const valid = mappings.filter((mapping) => marketplaceProductIdentityIssues(mapping).length === 0);
  const verifiedCount = valid.filter((mapping) => mapping.status === "verified").length;
  const probableCount = valid.filter((mapping) => mapping.status === "probable").length;
  const missingCount = valid.filter((mapping) => mapping.status === "missing").length;
  return {
    reviewedScopeCardCount,
    mappingCount: mappings.length,
    verifiedCount,
    probableCount,
    missingCount,
    invalidCount: mappings.length - valid.length,
    unmappedReviewedCardCount: Math.max(0, reviewedScopeCardCount - new Set(mappings.map((mapping) => mapping.tcgdexCardId)).size),
  };
}

export async function loadCardmarketProductMappingCatalog(signal?: AbortSignal): Promise<CardmarketProductMappingCatalog> {
  const response = await fetch(CARDMARKET_PRODUCT_MAPPINGS_URL, {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal,
  });
  if (!response.ok) throw new Error(`Cardmarket-Produktzuordnungen konnten nicht geladen werden (HTTP ${response.status}).`);
  return parseCardmarketProductMappingCatalog(await response.json());
}
