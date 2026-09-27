import type { TcgplayerPrintingMapping } from "@/domain/tcgplayer-export";

const OFFICIAL_MASS_ENTRY_SOURCE = "https://www.tcgplayer.com/massentry";
const VERIFIED_AT = "2026-09-27";

export const TCGPLAYER_PRINTING_MAPPINGS = [
  {
    tcgdexCardId: "base1-44",
    language: "en",
    tcgplayerProductName: "Bulbasaur",
    tcgplayerCollectorNumber: "044/102",
    source: OFFICIAL_MASS_ENTRY_SOURCE,
    verifiedAt: VERIFIED_AT,
  },
  {
    tcgdexCardId: "sv02-12",
    language: "en",
    tcgplayerProductName: "Sprigatito - 012/193",
    tcgplayerCollectorNumber: "012/193",
    source: OFFICIAL_MASS_ENTRY_SOURCE,
    verifiedAt: VERIFIED_AT,
  },
  {
    tcgdexCardId: "sv02-203",
    language: "en",
    tcgplayerProductName: "Magikarp - 203/193",
    tcgplayerCollectorNumber: "203/193",
    source: OFFICIAL_MASS_ENTRY_SOURCE,
    verifiedAt: VERIFIED_AT,
  },
] as const satisfies readonly TcgplayerPrintingMapping[];
