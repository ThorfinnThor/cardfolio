import type { CardVariantAvailability, VariantSelection } from "./types";

export const finishLabels = {
  normal: "Normal",
  holo: "Holo",
  reverse: "Reverse Holo",
  other: "Andere",
  unspecified: "Nicht festgelegt",
} as const;

export const editionLabels = {
  unlimited: "Unlimited",
  "first-edition": "First Edition",
  unspecified: "Nicht festgelegt",
} as const;

export const printingLabels = {
  shadowless: "Shadowless",
  shadowed: "Mit Schatten / Standard",
  unspecified: "Nicht festgelegt",
} as const;

export function createInitialVariantSelection(availability?: CardVariantAvailability): VariantSelection {
  const reportedFinishes = availability
    ? [
        availability.normal ? "normal" as const : undefined,
        availability.holo ? "holo" as const : undefined,
        availability.reverse ? "reverse" as const : undefined,
      ].filter((value): value is "normal" | "holo" | "reverse" => Boolean(value))
    : [];

  return {
    finish: reportedFinishes.length === 1 ? reportedFinishes[0] : "unspecified",
    edition: "unspecified",
    printing: "unspecified",
  };
}

export function selectedPrinting(variant: VariantSelection): NonNullable<VariantSelection["printing"]> {
  return variant.printing ?? "unspecified";
}

export function formatVariantSelection(variant: VariantSelection): string {
  const missing = [
    variant.finish === "unspecified" ? "Finish" : undefined,
    variant.edition === "unspecified" ? "Edition" : undefined,
    selectedPrinting(variant) === "unspecified" ? "Druckvariante" : undefined,
  ].filter((value): value is string => Boolean(value));
  const values = [
    variant.label?.trim() || (variant.finish === "unspecified" ? undefined : finishLabels[variant.finish]),
    variant.edition === "unspecified" ? undefined : editionLabels[variant.edition],
    selectedPrinting(variant) === "unspecified" ? undefined : printingLabels[selectedPrinting(variant)],
  ].filter((value): value is string => Boolean(value));
  if (!values.length) return "Version nicht festgelegt";
  return [...values, missing.length ? `Offen: ${missing.join(", ")}` : undefined]
    .filter((value): value is string => Boolean(value))
    .join(" · ");
}

export function formatAvailableVariants(availability?: CardVariantAvailability): string {
  if (!availability) return "Keine Anbieterhinweise in den gespeicherten Kartendaten.";
  const values = [
    availability.normal ? "Normal" : undefined,
    availability.holo ? "Holo" : undefined,
    availability.reverse ? "Reverse Holo" : undefined,
    availability.firstEdition ? "First Edition" : undefined,
  ].filter((value): value is string => Boolean(value));
  return values.length ? `TCGdex meldet verfügbar: ${values.join(", ")}.` : "TCGdex meldet keine auswählbare Variante.";
}
