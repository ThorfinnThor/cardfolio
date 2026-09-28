import type { TcgplayerCardMapping } from "@/domain/tcgplayer-export";

const TCGPLAYER_CARD_MAPPINGS_URL = "/data/marketplace/tcgplayer-card-mappings.json";

type MappingPayload = {
  format: "cardfolio-tcgplayer-card-mappings";
  version: 1;
  source: string;
  verifiedAt: string;
  catalogCardCount: number;
  mappedCardCount: number;
  items: TcgplayerCardMapping[];
};

function isMappingPayload(value: unknown): value is MappingPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<MappingPayload>;
  return payload.format === "cardfolio-tcgplayer-card-mappings"
    && payload.version === 1
    && typeof payload.source === "string"
    && typeof payload.verifiedAt === "string"
    && typeof payload.catalogCardCount === "number"
    && Number.isInteger(payload.catalogCardCount)
    && typeof payload.mappedCardCount === "number"
    && Number.isInteger(payload.mappedCardCount)
    && Array.isArray(payload.items)
    && payload.mappedCardCount === payload.items.length
    && payload.items.every((item) => item
      && typeof item.tcgdexCardId === "string"
      && typeof item.tcgdexName === "string"
      && Array.isArray(item.candidates)
      && item.candidates.every((candidate) => candidate
        && typeof candidate.productName === "string"
        && typeof candidate.collectorNumber === "string"
        && typeof candidate.tcgplayerSetCode === "string"
        && typeof candidate.tcgplayerSetName === "string"
        && typeof candidate.foilOnly === "boolean"
        && Number.isInteger(candidate.productId)));
}

export async function loadTcgplayerCardMappings(signal?: AbortSignal): Promise<readonly TcgplayerCardMapping[]> {
  const response = await fetch(TCGPLAYER_CARD_MAPPINGS_URL, {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response.ok) throw new Error(`TCGplayer-Zuordnungen konnten nicht geladen werden (HTTP ${response.status}).`);
  const payload: unknown = await response.json();
  if (!isMappingPayload(payload)) throw new Error("TCGplayer-Zuordnungen haben ein ungültiges Format.");
  return payload.items;
}
