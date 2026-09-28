import type { PurchasePreferences } from "./types";

export const minimumConditionLabels: Record<PurchasePreferences["minimumCondition"], string> = {
  "near-mint": "Near Mint",
  excellent: "Excellent (Cardmarket) / Lightly Played (TCGplayer)",
  "lightly-played": "Lightly Played",
  played: "Played",
  any: "Beliebig",
};
