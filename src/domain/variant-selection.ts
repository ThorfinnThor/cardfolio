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

export function selectedPrinting(variant: VariantSelection): NonNullable<VariantSelection["printing"]> {
  return variant.printing ?? "unspecified";
}

export function formatVariantSelection(variant: VariantSelection): string {
  const values = [
    variant.label?.trim() || (variant.finish === "unspecified" ? undefined : finishLabels[variant.finish]),
    variant.edition === "unspecified" ? undefined : editionLabels[variant.edition],
    selectedPrinting(variant) === "unspecified" ? undefined : printingLabels[selectedPrinting(variant)],
  ].filter((value): value is string => Boolean(value));
  return values.length ? values.join(" · ") : "Version nicht festgelegt";
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
