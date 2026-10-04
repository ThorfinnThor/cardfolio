import {
  cardtraderBlueprintsSchema,
  cardtraderCategoriesSchema,
  cardtraderExpansionsSchema,
  cardtraderGamesSchema,
} from "./cardtrader-schemas";
import type {
  MarketplaceBlueprint,
  MarketplaceCatalogAdapter,
  MarketplaceCategory,
  MarketplaceExpansion,
  MarketplaceGame,
  MarketplacePropertyDefinition,
} from "@/domain/marketplace-provider";

const BASE_URL = "https://api.cardtrader.com/api/v2";

export interface CardTraderAdapterOptions {
  /** Pass a token at runtime from a server/CLI secret. Never persist it. */
  token: string;
  fetch?: typeof fetch;
  baseUrl?: string;
}

function property(value: {
  name: string;
  type: "string" | "boolean";
  default_value?: string | boolean;
  possible_values: (string | boolean)[];
}): MarketplacePropertyDefinition {
  return {
    name: value.name,
    valueType: value.type,
    defaultValue: value.default_value,
    possibleValues: value.possible_values,
  };
}

/** Read-only catalog adapter. It intentionally exposes no cart or purchase call. */
export class CardTraderCatalogAdapter implements MarketplaceCatalogAdapter {
  readonly provider = "cardtrader" as const;
  readonly #token: string;
  readonly #fetch: typeof fetch;
  readonly #baseUrl: string;

  constructor(options: CardTraderAdapterOptions) {
    if (!options.token.trim()) throw new Error("CardTrader-Token fehlt. Setze CARDTRADER_API_TOKEN nur zur Laufzeit.");
    this.#token = options.token;
    this.#fetch = options.fetch ?? fetch;
    this.#baseUrl = (options.baseUrl ?? BASE_URL).replace(/\/$/, "");
  }

  async #get(path: string, signal?: AbortSignal): Promise<unknown> {
    const response = await this.#fetch(`${this.#baseUrl}${path}`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${this.#token}` },
      signal,
    });
    if (response.status === 401 || response.status === 403) {
      throw new Error("CardTrader-Token fehlt, ist ungültig oder abgelaufen. Prüfe CARDTRADER_API_TOKEN.");
    }
    if (response.status === 429) {
      throw new Error("CardTrader begrenzt die Anfragen. Warte und starte den read-only Audit später erneut.");
    }
    if (!response.ok) throw new Error(`CardTrader-Anfrage fehlgeschlagen (HTTP ${response.status}).`);
    return response.json();
  }

  async listGames(signal?: AbortSignal): Promise<readonly MarketplaceGame[]> {
    return cardtraderGamesSchema.parse(await this.#get("/games", signal)).map((item) => ({
      provider: this.provider,
      providerGameId: String(item.id),
      name: item.name,
      displayName: item.display_name,
    }));
  }

  async listCategories(gameId: string, signal?: AbortSignal): Promise<readonly MarketplaceCategory[]> {
    const query = new URLSearchParams({ game_id: gameId });
    return cardtraderCategoriesSchema.parse(await this.#get(`/categories?${query}`, signal)).map((item) => ({
      provider: this.provider,
      providerCategoryId: String(item.id),
      providerGameId: String(item.game_id),
      name: item.name,
      properties: item.properties.map(property),
    }));
  }

  async listExpansions(signal?: AbortSignal): Promise<readonly MarketplaceExpansion[]> {
    return cardtraderExpansionsSchema.parse(await this.#get("/expansions", signal)).map((item) => ({
      provider: this.provider,
      providerExpansionId: String(item.id),
      providerGameId: String(item.game_id),
      code: item.code,
      name: item.name,
    }));
  }

  async listBlueprints(expansionId: string, signal?: AbortSignal): Promise<readonly MarketplaceBlueprint[]> {
    const query = new URLSearchParams({ expansion_id: expansionId });
    return cardtraderBlueprintsSchema.parse(await this.#get(`/blueprints/export?${query}`, signal)).map((item) => ({
      provider: this.provider,
      providerBlueprintId: String(item.id),
      providerGameId: String(item.game_id),
      providerCategoryId: String(item.category_id),
      providerExpansionId: item.expansion_id == null ? undefined : String(item.expansion_id),
      name: item.name,
      version: item.version ?? undefined,
      imageUrl: item.image_url ?? undefined,
      editableProperties: item.editable_properties.map(property),
      externalIds: {
        cardmarket: item.card_market_ids.map(String),
        tcgplayer: item.tcg_player_id == null ? [] : [String(item.tcg_player_id)],
        scryfall: item.scryfall_id == null ? [] : [item.scryfall_id],
      },
    }));
  }
}
