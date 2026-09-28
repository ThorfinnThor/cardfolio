import mappingData from "../../../public/data/marketplace/tcgplayer-set-mappings.json";

import type { TcgplayerSetMapping, TcgplayerUnavailableSet } from "@/domain/tcgplayer-export";

export const TCGPLAYER_SET_MAPPINGS = mappingData.mappings.map((mapping) => ({
  ...mapping,
  source: mappingData.source,
  verifiedAt: mappingData.verifiedAt,
})) satisfies readonly TcgplayerSetMapping[];

export const TCGPLAYER_UNAVAILABLE_SETS = mappingData.unavailable satisfies readonly TcgplayerUnavailableSet[];

export const TCGPLAYER_SET_COVERAGE = {
  catalogSetCount: mappingData.catalogSetCount,
  mappedSetCount: mappingData.mappedSetCount,
  unavailableSetCount: mappingData.unavailable.length,
  officialSetCodeCount: new Set(mappingData.mappings.map((mapping) => mapping.tcgplayerSetCode)).size,
  verifiedAt: mappingData.verifiedAt,
} as const;
