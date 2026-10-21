import type { MarketplaceProviderId } from "./marketplace-provider";
import type { CardLanguage, MissingItem, VariantSelection } from "./types";

export type MarketplaceProductIdentityStatus = "verified" | "probable" | "missing";

export type MarketplaceProductIdentitySourceKind =
  | "manual-product-review"
  | "provider-external-id"
  | "provider-api"
  | "catalog-text-match"
  | "legacy-override";

export type MarketplaceScopeValue<T extends string> = T | "any";

export interface MarketplaceProductScope {
  language: MarketplaceScopeValue<CardLanguage>;
  finish: MarketplaceScopeValue<VariantSelection["finish"]>;
  edition: MarketplaceScopeValue<VariantSelection["edition"]>;
  printing: MarketplaceScopeValue<NonNullable<VariantSelection["printing"]>>;
}

export interface MarketplaceProductIdentitySource {
  kind: MarketplaceProductIdentitySourceKind;
  label: string;
  evidenceUrl?: string;
}

/**
 * A reviewed bridge from Your Card Binder's stable TCGdex identity to one provider
 * product. It is deliberately separate from fuzzy catalog candidates: only a
 * valid `verified` row may be used as an order-ready product identity.
 */
export interface MarketplaceProductIdentityMapping {
  schemaVersion: 1;
  provider: MarketplaceProviderId;
  tcgdexCardId: string;
  cardName: string;
  scope: MarketplaceProductScope;
  status: MarketplaceProductIdentityStatus;
  providerProductId?: string;
  providerMetaProductId?: string;
  productUrl?: string;
  source: MarketplaceProductIdentitySource;
  checkedAt: string;
  verifiedAt?: string;
  note?: string;
}

export interface MarketplaceProductIdentityResolution {
  provider: MarketplaceProviderId;
  status: MarketplaceProductIdentityStatus;
  reason: string;
  mapping?: MarketplaceProductIdentityMapping;
  candidates: readonly MarketplaceProductIdentityMapping[];
}

const PROVIDER_HOSTS: Record<MarketplaceProviderId, readonly string[]> = {
  cardmarket: ["cardmarket.com"],
  cardtrader: ["cardtrader.com"],
  tcgplayer: ["tcgplayer.com"],
};

function validIsoTimestamp(value: string | undefined): boolean {
  if (!value || !/^\d{4}-\d{2}-\d{2}T/.test(value)) return false;
  return Number.isFinite(Date.parse(value));
}

function validHttpsUrl(value: string | undefined, provider?: MarketplaceProviderId): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    return !provider || PROVIDER_HOSTS[provider].some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

export function marketplaceProductIdentityIssues(mapping: MarketplaceProductIdentityMapping): string[] {
  const issues: string[] = [];
  if (mapping.schemaVersion !== 1) issues.push("schemaVersion muss 1 sein.");
  if (!mapping.tcgdexCardId.trim()) issues.push("TCGdex-Karten-ID fehlt.");
  if (!mapping.cardName.trim()) issues.push("Kartenname fehlt.");
  if (!mapping.source.label.trim()) issues.push("Quellenbeschreibung fehlt.");
  if (!validIsoTimestamp(mapping.checkedAt)) issues.push("checkedAt ist kein gültiger ISO-Zeitstempel.");
  if (mapping.source.evidenceUrl && !validHttpsUrl(mapping.source.evidenceUrl)) {
    issues.push("Die Evidenz-URL muss eine gültige HTTPS-URL sein.");
  }
  if (mapping.productUrl && !validHttpsUrl(mapping.productUrl, mapping.provider)) {
    issues.push("Die Produkt-URL muss eine HTTPS-URL des gewählten Anbieters sein.");
  }

  const hasProviderIdentity = Boolean(
    mapping.providerProductId?.trim()
    || mapping.providerMetaProductId?.trim()
    || mapping.productUrl,
  );
  if (mapping.status === "verified") {
    if (!hasProviderIdentity) issues.push("Eine verifizierte Zuordnung benötigt eine Anbieter-ID oder Produkt-URL.");
    if (!validIsoTimestamp(mapping.verifiedAt)) issues.push("Eine verifizierte Zuordnung benötigt verifiedAt.");
    if (mapping.source.kind === "catalog-text-match" || mapping.source.kind === "legacy-override") {
      issues.push("Texttreffer und Legacy-Overrides dürfen nicht als verifizierte Produktidentität gelten.");
    }
  } else if (mapping.verifiedAt) {
    issues.push("Nur verifizierte Zuordnungen dürfen verifiedAt enthalten.");
  }

  if (mapping.status === "missing" && hasProviderIdentity) {
    issues.push("Eine fehlende Zuordnung darf keine Anbieter-ID oder Produkt-URL enthalten.");
  }
  return issues;
}

function scopeMatches<T extends string>(scope: MarketplaceScopeValue<T>, value: T): boolean {
  return scope === "any" || scope === value;
}

function scopeSpecificity(mapping: MarketplaceProductIdentityMapping): number {
  return Object.values(mapping.scope).filter((value) => value !== "any").length;
}

function matchesItem(mapping: MarketplaceProductIdentityMapping, item: MissingItem): boolean {
  return mapping.tcgdexCardId === item.card.ref.id
    && scopeMatches(mapping.scope.language, item.card.ref.language)
    && scopeMatches(mapping.scope.finish, item.variant.finish)
    && scopeMatches(mapping.scope.edition, item.variant.edition)
    && scopeMatches(mapping.scope.printing, item.variant.printing ?? "unspecified");
}

export function resolveMarketplaceProductIdentity(
  provider: MarketplaceProviderId,
  item: MissingItem,
  mappings: readonly MarketplaceProductIdentityMapping[],
): MarketplaceProductIdentityResolution {
  const applicable = mappings
    .filter((mapping) => mapping.provider === provider)
    .filter((mapping) => marketplaceProductIdentityIssues(mapping).length === 0)
    .filter((mapping) => matchesItem(mapping, item));

  if (!applicable.length) {
    return {
      provider,
      status: "missing",
      reason: "Keine gültige, geprüfte Produktzuordnung vorhanden.",
      candidates: [],
    };
  }

  const highestSpecificity = Math.max(...applicable.map(scopeSpecificity));
  const candidates = applicable.filter((mapping) => scopeSpecificity(mapping) === highestSpecificity);
  const verified = candidates.filter((mapping) => mapping.status === "verified");
  if (verified.length === 1) {
    return {
      provider,
      status: "verified",
      reason: "Eindeutige, manuell oder über eine direkte Anbieter-ID verifizierte Produktzuordnung.",
      mapping: verified[0],
      candidates,
    };
  }
  if (verified.length > 1) {
    return {
      provider,
      status: "probable",
      reason: "Mehrere gleich spezifische verifizierte Produkte; manuelle Auswahl erforderlich.",
      candidates,
    };
  }

  const probable = candidates.filter((mapping) => mapping.status === "probable");
  if (probable.length === 1) {
    return {
      provider,
      status: "probable",
      reason: "Produktkandidat vorhanden, aber noch nicht für eine Bestellung verifiziert.",
      mapping: probable[0],
      candidates,
    };
  }

  const explicitMissing = candidates.find((mapping) => mapping.status === "missing");
  return {
    provider,
    status: explicitMissing ? "missing" : "probable",
    reason: explicitMissing
      ? explicitMissing.note ?? "Die Produktzuordnung wurde geprüft und fehlt weiterhin."
      : "Mehrere Produktkandidaten; manuelle Prüfung erforderlich.",
    mapping: explicitMissing,
    candidates,
  };
}
