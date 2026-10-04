import type {
  MarketplaceBlueprint,
  MarketplaceCardIdentity,
  MarketplaceMappingDecision,
  MarketplaceProviderId,
} from "./marketplace-provider";

function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeCollectorNumber(value: string): string {
  const normalized = value.trim().replace(/^0+(?=\d)/, "");
  return normalized || "0";
}

function hasMatchingExternalId(identity: MarketplaceCardIdentity, blueprint: MarketplaceBlueprint): boolean {
  return Object.entries(identity.externalIds ?? {}).some(([namespace, values]) => {
    const candidateValues = new Set((blueprint.externalIds[namespace] ?? []).map(String));
    return values.some((value) => candidateValues.has(String(value)));
  });
}

function blueprintCollectorNumber(blueprint: MarketplaceBlueprint): string | undefined {
  const property = blueprint.editableProperties.find((candidate) => candidate.name === "collector_number");
  if (typeof property?.defaultValue === "string") return property.defaultValue;
  return undefined;
}

function decide(
  cardKey: string,
  provider: MarketplaceProviderId,
  method: MarketplaceMappingDecision["method"],
  candidates: readonly MarketplaceBlueprint[],
): MarketplaceMappingDecision {
  if (candidates.length === 0) {
    return { cardKey, provider, status: "unmapped", method: "none", candidateBlueprintIds: [], note: "Kein belastbarer Kandidat." };
  }
  if (candidates.length > 1) {
    return {
      cardKey,
      provider,
      status: "ambiguous",
      method,
      candidateBlueprintIds: candidates.map((candidate) => candidate.providerBlueprintId),
      note: "Mehrere Kandidaten; eine manuelle Prüfung ist erforderlich.",
    };
  }
  const verified = method === "direct-external-id";
  return {
    cardKey,
    provider,
    status: verified ? "verified" : "review-required",
    method,
    candidateBlueprintIds: [candidates[0].providerBlueprintId],
    note: verified
      ? "Eindeutige direkte Fremd-ID."
      : "Eindeutiger Textkandidat; erst nach manueller Prüfung freigeben.",
  };
}

/**
 * Builds conservative mapping decisions. Only a unique direct external ID is
 * accepted automatically. Name/number matches always remain review-required.
 */
export function mapMarketplaceCard(
  provider: MarketplaceProviderId,
  identity: MarketplaceCardIdentity,
  blueprints: readonly MarketplaceBlueprint[],
  expansionNames: Readonly<Record<string, string>>,
): MarketplaceMappingDecision {
  if (Object.keys(identity.externalIds ?? {}).length) {
    const matches = blueprints.filter((blueprint) => hasMatchingExternalId(identity, blueprint));
    if (matches.length) return decide(identity.cardKey, provider, "direct-external-id", matches);
  }

  const setNames = new Set(identity.setNames.map(normalize));
  const inSet = blueprints.filter((blueprint) => {
    if (!blueprint.providerExpansionId) return false;
    return setNames.has(normalize(expansionNames[blueprint.providerExpansionId] ?? ""));
  });
  const sameName = (blueprint: MarketplaceBlueprint) => normalize(blueprint.name) === normalize(identity.name);
  const sameNumber = (blueprint: MarketplaceBlueprint) => {
    const number = blueprintCollectorNumber(blueprint);
    return number != null && normalizeCollectorNumber(number) === normalizeCollectorNumber(identity.collectorNumber);
  };

  const exact = inSet.filter((blueprint) => sameName(blueprint) && sameNumber(blueprint));
  if (exact.length) return decide(identity.cardKey, provider, "set-number-name", exact);
  const numbered = inSet.filter(sameNumber);
  if (numbered.length) return decide(identity.cardKey, provider, "set-number", numbered);
  return decide(identity.cardKey, provider, "set-name", inSet.filter(sameName));
}
