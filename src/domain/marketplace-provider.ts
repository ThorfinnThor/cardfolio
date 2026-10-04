export type MarketplaceProviderId = "cardmarket" | "cardtrader" | "tcgplayer";

export interface MarketplaceGame {
  provider: MarketplaceProviderId;
  providerGameId: string;
  name: string;
  displayName: string;
}

export interface MarketplacePropertyDefinition {
  name: string;
  valueType: "boolean" | "string";
  defaultValue?: boolean | string;
  possibleValues: readonly (boolean | string)[];
}

export interface MarketplaceCategory {
  provider: MarketplaceProviderId;
  providerCategoryId: string;
  providerGameId: string;
  name: string;
  properties: readonly MarketplacePropertyDefinition[];
}

export interface MarketplaceExpansion {
  provider: MarketplaceProviderId;
  providerExpansionId: string;
  providerGameId: string;
  code: string;
  name: string;
}

export interface MarketplaceBlueprint {
  provider: MarketplaceProviderId;
  providerBlueprintId: string;
  providerGameId: string;
  providerCategoryId: string;
  providerExpansionId?: string;
  name: string;
  version?: string;
  imageUrl?: string;
  editableProperties: readonly MarketplacePropertyDefinition[];
  externalIds: Readonly<Record<string, readonly string[]>>;
}

export interface MarketplaceCatalogAdapter {
  readonly provider: MarketplaceProviderId;
  listGames(signal?: AbortSignal): Promise<readonly MarketplaceGame[]>;
  listCategories(gameId: string, signal?: AbortSignal): Promise<readonly MarketplaceCategory[]>;
  listExpansions(signal?: AbortSignal): Promise<readonly MarketplaceExpansion[]>;
  listBlueprints(expansionId: string, signal?: AbortSignal): Promise<readonly MarketplaceBlueprint[]>;
}

export type MarketplaceMappingStatus = "verified" | "review-required" | "ambiguous" | "unmapped";
export type MarketplaceMappingMethod = "direct-external-id" | "set-number-name" | "set-number" | "set-name" | "none";

export interface MarketplaceCardIdentity {
  cardKey: string;
  name: string;
  setId: string;
  setNames: readonly string[];
  collectorNumber: string;
  externalIds?: Readonly<Record<string, readonly string[]>>;
}

export interface MarketplaceMappingDecision {
  cardKey: string;
  provider: MarketplaceProviderId;
  status: MarketplaceMappingStatus;
  method: MarketplaceMappingMethod;
  candidateBlueprintIds: readonly string[];
  note: string;
}

