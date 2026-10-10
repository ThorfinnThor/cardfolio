import type { PurchasePreferences } from "./types";

export interface ConditionProfile {
  value: PurchasePreferences["minimumCondition"];
  label: string;
  shortLabel: string;
  providerSummary: string;
  explanation: string;
}

export const conditionProfiles: readonly ConditionProfile[] = [
  {
    value: "near-mint",
    label: "Wie neu",
    shortLabel: "Wie neu",
    providerSummary: "Cardmarket: Near Mint · TCGplayer: Near Mint",
    explanation: "Fast keine sichtbaren Gebrauchsspuren. Meist teurer und besonders für Sammler geeignet.",
  },
  {
    value: "excellent",
    label: "Sehr gut – kleine Spuren okay (empfohlen)",
    shortLabel: "Sehr gut",
    providerSummary: "Cardmarket: Near Mint oder Excellent · TCGplayer: Near Mint oder Lightly Played",
    explanation: "Kleine Rand- oder Oberflächenspuren sind okay. Gute Balance aus Geschenkqualität, Preis und Verfügbarkeit.",
  },
  {
    value: "lightly-played",
    label: "Gebraucht – sichtbare Spuren okay",
    shortLabel: "Gebraucht",
    providerSummary: "Cardmarket: bis Light Played · TCGplayer: bis Lightly Played",
    explanation: "Sichtbare Kratzer oder Kantenabnutzung sind möglich, die Karte bleibt aber gut nutzbar.",
  },
  {
    value: "played",
    label: "Deutliche Gebrauchsspuren okay",
    shortLabel: "Deutlich gebraucht",
    providerSummary: "Cardmarket: bis Played · TCGplayer: bis Heavily Played",
    explanation: "Deutliche Kratzer, Kantenabnutzung oder kleine Knicke sind möglich. Für Geschenke meist nicht empfohlen.",
  },
  {
    value: "any",
    label: "Zustand egal",
    shortLabel: "Beliebig",
    providerSummary: "Alle Zustände; beschädigte Karten können enthalten sein",
    explanation: "Auch stark gebrauchte oder beschädigte Karten können angeboten werden. Nur wählen, wenn der Zustand wirklich egal ist.",
  },
];

export const minimumConditionLabels: Record<PurchasePreferences["minimumCondition"], string> = {
  "near-mint": "Near Mint",
  excellent: "Excellent (Cardmarket) / Lightly Played (TCGplayer)",
  "lightly-played": "Lightly Played",
  played: "Played",
  any: "Beliebig",
};

export function conditionProfile(
  value: PurchasePreferences["minimumCondition"],
): ConditionProfile {
  return conditionProfiles.find((profile) => profile.value === value) ?? conditionProfiles[4];
}
