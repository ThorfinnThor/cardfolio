export const CARDMARKET_DECKLIST_IDENTITIES_URL = "/data/marketplace/cardmarket-decklist-identities.v1.json";

export interface CardmarketDecklistIdentityAudit {
  catalogDeclaredCardCount: number;
  physicalCardCount: number;
  verifiedCardCount: number;
  exactIdentityCount: number;
  correctedIdentityCount: number;
  excludedCardCount: number;
  pokemonCardCount: number;
  nonPokemonCardCount: number;
  unaddressableDeclaredCardCount: number;
}

export interface CardmarketDecklistIdentityCatalog {
  format: "cardfolio-cardmarket-decklist-identities";
  version: 1;
  generatedAt: string;
  sources: {
    tcgdex: string;
    cardmarket: string;
    cardmarketCreatedAt?: string;
  };
  audit: CardmarketDecklistIdentityAudit;
  identities: Readonly<Record<string, string>>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isCountRecord(value: unknown): value is Record<keyof CardmarketDecklistIdentityAudit, number> {
  if (!isRecord(value)) return false;
  return [
    "physicalCardCount",
    "catalogDeclaredCardCount",
    "verifiedCardCount",
    "exactIdentityCount",
    "correctedIdentityCount",
    "excludedCardCount",
    "pokemonCardCount",
    "nonPokemonCardCount",
    "unaddressableDeclaredCardCount",
  ].every((key) => Number.isInteger(value[key]) && Number(value[key]) >= 0);
}

export function parseCardmarketDecklistIdentityCatalog(value: unknown): CardmarketDecklistIdentityCatalog {
  if (!isRecord(value)
    || value.format !== "cardfolio-cardmarket-decklist-identities"
    || value.version !== 1
    || typeof value.generatedAt !== "string"
    || !Number.isFinite(Date.parse(value.generatedAt))
    || !isRecord(value.sources)
    || typeof value.sources.tcgdex !== "string"
    || typeof value.sources.cardmarket !== "string"
    || !isCountRecord(value.audit)
    || !isRecord(value.identities)
    || !Object.entries(value.identities).every(([id, line]) => id.trim() && typeof line === "string" && line.trim() && !/[\r\n]/u.test(line))) {
    throw new Error("Cardmarket-Decklistenprüfung hat ein ungültiges Format.");
  }

  const audit = value.audit;
  if (audit.physicalCardCount !== audit.verifiedCardCount + audit.excludedCardCount
    || audit.verifiedCardCount !== audit.exactIdentityCount + audit.correctedIdentityCount
    || audit.physicalCardCount !== audit.pokemonCardCount + audit.nonPokemonCardCount
    || audit.catalogDeclaredCardCount !== audit.physicalCardCount + audit.unaddressableDeclaredCardCount
    || Object.keys(value.identities).length !== audit.verifiedCardCount) {
    throw new Error("Cardmarket-Decklistenprüfung enthält widersprüchliche Summen.");
  }

  return value as unknown as CardmarketDecklistIdentityCatalog;
}

export async function loadCardmarketDecklistIdentityCatalog(signal?: AbortSignal): Promise<CardmarketDecklistIdentityCatalog> {
  const response = await fetch(CARDMARKET_DECKLIST_IDENTITIES_URL, {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal,
  });
  if (!response.ok) throw new Error(`Cardmarket-Decklistenprüfung konnte nicht geladen werden (HTTP ${response.status}).`);
  return parseCardmarketDecklistIdentityCatalog(await response.json());
}
