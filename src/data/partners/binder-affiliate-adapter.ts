import {
  isHttpsUrl,
  type BinderAffiliateAdapter,
  type BinderOffer,
  type BinderPartnerCatalog,
  type BinderPartnerConfig,
} from "@/domain/binder-affiliate";

export const BINDER_PARTNER_CATALOG_URL = "/data/partners/binder-partners.v1.json";

function validDate(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

function invalidReason(partner: BinderPartnerConfig): string | undefined {
  if (!partner.id.trim() || !partner.displayName.trim()) return "Partner-ID oder Anzeigename fehlt.";
  if (!validDate(partner.verifiedAt) || !validDate(partner.reviewAfter)) return "Prüfdatum ist ungültig.";
  if (partner.destinationUrl && !isHttpsUrl(partner.destinationUrl)) return "Externe Ziele müssen HTTPS verwenden.";
  if (partner.enabled && !partner.destinationUrl) return "Aktivierter Partner hat keine Ziel-URL.";
  if (partner.enabled && !partner.evidenceUrls.length) return "Aktivierter Partner hat keine Prüfquellen.";
  if (partner.evidenceUrls.some((url) => !isHttpsUrl(url))) return "Prüfquellen müssen HTTPS verwenden.";
  if (partner.affiliate.enabled && !partner.affiliate.text?.trim()) return "Affiliate-Angebote benötigen eine sichtbare Kennzeichnung.";
  if (partner.price && (!Number.isInteger(partner.price.amountMinor) || partner.price.amountMinor <= 0 || !validDate(partner.price.sourceUpdatedAt))) {
    return "Preis oder Preisstand ist ungültig.";
  }
  return undefined;
}

function toOffer(catalog: BinderPartnerCatalog, partner: BinderPartnerConfig, now: Date): BinderOffer {
  const invalid = invalidReason(partner);
  const stale = validDate(partner.reviewAfter) && now.getTime() > Date.parse(partner.reviewAfter);
  const status = invalid
    ? "invalid" as const
    : !catalog.enabled || !partner.enabled
      ? "disabled" as const
      : stale
        ? "stale" as const
        : "available" as const;
  const statusReason = invalid
    ?? (!catalog.enabled ? catalog.disabledReason ?? "Binder-Partner sind zentral deaktiviert." : undefined)
    ?? (!partner.enabled ? partner.disabledReason ?? "Dieses Angebot ist deaktiviert." : undefined)
    ?? (stale ? "Die Anbieterprüfung ist abgelaufen und muss erneuert werden." : undefined);

  return {
    id: partner.id,
    displayName: partner.displayName,
    status,
    statusReason,
    verifiedAt: partner.verifiedAt,
    reviewAfter: partner.reviewAfter,
    destinationUrl: status === "available" ? partner.destinationUrl : undefined,
    affiliate: partner.affiliate.enabled,
    affiliateDisclosure: partner.affiliate.enabled ? partner.affiliate.text : undefined,
    capabilities: { ...partner.capabilities },
    price: partner.price ? { ...partner.price } : undefined,
    evidenceUrls: [...partner.evidenceUrls],
  };
}

export class ReviewedBinderAffiliateAdapter implements BinderAffiliateAdapter {
  constructor(private readonly catalog: BinderPartnerCatalog) {}

  listOffers(now = new Date()): readonly BinderOffer[] {
    return this.catalog.partners.map((partner) => toOffer(this.catalog, partner, now));
  }

  getOffer(id: string, now = new Date()): BinderOffer | undefined {
    return this.listOffers(now).find((offer) => offer.id === id);
  }

  buildExternalUrl(id: string, now = new Date()): string | undefined {
    const partner = this.catalog.partners.find((candidate) => candidate.id === id);
    const offer = partner ? toOffer(this.catalog, partner, now) : undefined;
    if (!partner || offer?.status !== "available" || !offer.destinationUrl) return undefined;
    const url = new URL(offer.destinationUrl);
    for (const [key, value] of Object.entries(partner.affiliate.staticQuery ?? {})) {
      if (key.trim() && value.trim()) url.searchParams.set(key, value);
    }
    return url.toString();
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function parseBinderPartnerCatalog(value: unknown): BinderPartnerCatalog {
  if (!isRecord(value) || value.schemaVersion !== 1 || typeof value.enabled !== "boolean" || typeof value.reviewedAt !== "string" || !validDate(value.reviewedAt) || !Array.isArray(value.partners)) {
    throw new Error("Binder-Partner-Konfiguration hat ein ungültiges Format.");
  }
  const partners = value.partners.map((entry) => {
    if (
      !isRecord(entry)
      || typeof entry.id !== "string"
      || typeof entry.displayName !== "string"
      || typeof entry.enabled !== "boolean"
      || typeof entry.verifiedAt !== "string"
      || typeof entry.reviewAfter !== "string"
      || !isRecord(entry.affiliate)
      || typeof entry.affiliate.enabled !== "boolean"
      || !isRecord(entry.capabilities)
      || typeof entry.capabilities.personalization !== "boolean"
      || typeof entry.capabilities.photoUpload !== "boolean"
      || !Array.isArray(entry.evidenceUrls)
      || !entry.evidenceUrls.every((url) => typeof url === "string")
      || (entry.destinationUrl !== undefined && typeof entry.destinationUrl !== "string")
      || (entry.disabledReason !== undefined && typeof entry.disabledReason !== "string")
      || (entry.affiliate.text !== undefined && typeof entry.affiliate.text !== "string")
      || (entry.affiliate.staticQuery !== undefined && (!isRecord(entry.affiliate.staticQuery) || !Object.values(entry.affiliate.staticQuery).every((part) => typeof part === "string")))
      || (entry.price !== undefined && (!isRecord(entry.price)
        || typeof entry.price.amountMinor !== "number"
        || (entry.price.currency !== "EUR" && entry.price.currency !== "USD")
        || (entry.price.qualifier !== "fixed" && entry.price.qualifier !== "from")
        || typeof entry.price.sourceUpdatedAt !== "string"))
    ) {
      throw new Error("Binder-Partner-Eintrag hat ein ungültiges Format.");
    }
    return {
      id: entry.id,
      displayName: entry.displayName,
      enabled: entry.enabled,
      verifiedAt: entry.verifiedAt,
      reviewAfter: entry.reviewAfter,
      destinationUrl: entry.destinationUrl,
      disabledReason: entry.disabledReason,
      affiliate: {
        enabled: entry.affiliate.enabled,
        text: entry.affiliate.text,
        staticQuery: entry.affiliate.staticQuery as Record<string, string> | undefined,
      },
      capabilities: {
        personalization: entry.capabilities.personalization,
        photoUpload: entry.capabilities.photoUpload,
      },
      price: entry.price as BinderPartnerConfig["price"],
      evidenceUrls: entry.evidenceUrls,
    } satisfies BinderPartnerConfig;
  });
  return {
    schemaVersion: 1,
    enabled: value.enabled,
    reviewedAt: value.reviewedAt,
    disabledReason: typeof value.disabledReason === "string" ? value.disabledReason : undefined,
    partners,
  };
}

export async function loadBinderPartnerCatalog(signal?: AbortSignal): Promise<BinderPartnerCatalog> {
  const response = await fetch(BINDER_PARTNER_CATALOG_URL, { cache: "no-store", signal });
  if (!response.ok) throw new Error(`Binder-Partner konnten nicht geladen werden (HTTP ${response.status}).`);
  return parseBinderPartnerCatalog(await response.json());
}
