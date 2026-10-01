import type { CardSnapshot, CardVariantAvailability, VariantSelection } from "./types";

export type FinishValue = VariantSelection["finish"];
export type EditionValue = VariantSelection["edition"];
export type PrintingValue = NonNullable<VariantSelection["printing"]>;

export interface CardVariantOptions extends CardVariantAvailability {
  finishesVerified: boolean;
}

export const FIRST_EDITION_SET_IDS: ReadonlySet<string> = new Set([
  "base1",
  "base2",
  "base3",
  "base5",
  "gym1",
  "gym2",
  "neo1",
  "neo2",
  "neo3",
  "neo4",
]);

export const finishLabels = {
  normal: "Non-Holo / Normal",
  holo: "Holo",
  reverse: "Reverse Holo",
  other: "Andere",
  unspecified: "Nicht festgelegt",
} as const;

export const editionLabels = {
  unlimited: "Unlimited / Standard",
  "first-edition": "First Edition",
  unspecified: "Nicht festgelegt",
} as const;

export const printingLabels = {
  shadowless: "Shadowless",
  shadowed: "Mit Schatten / Standard",
  unspecified: "Nicht festgelegt",
} as const;

/**
 * TCGdex fills every card without curated variant data with the same fallback
 * (`normal: true`, everything else `false`). Whole sets such as Team Up carry no
 * variant data, so this shape cannot be told apart from "unknown" and must not be
 * presented as a catalog confirmation: it would hide Holo for GX, full-art and
 * secret-rare cards and Reverse Holo for commons.
 */
export function isProviderFallbackVariantSignal(availability: CardVariantAvailability): boolean {
  return availability.normal
    && !availability.holo
    && !availability.reverse
    && !availability.firstEdition;
}

export function variantAvailabilityForCard(
  card: Pick<CardSnapshot, "availableVariants" | "ref" | "setId">,
): CardVariantOptions {
  const finishesVerified = Boolean(
    card.availableVariants && !isProviderFallbackVariantSignal(card.availableVariants),
  );
  return {
    normal: finishesVerified ? Boolean(card.availableVariants?.normal) : true,
    holo: finishesVerified ? Boolean(card.availableVariants?.holo) : true,
    reverse: finishesVerified ? Boolean(card.availableVariants?.reverse) : true,
    firstEdition: FIRST_EDITION_SET_IDS.has(card.setId),
    shadowless: card.ref.language === "en" && card.setId === "base1",
    finishesVerified,
  };
}

export function areFinishesVerified(
  availability?: CardVariantAvailability | CardVariantOptions,
): boolean {
  return Boolean(
    availability
    && (!("finishesVerified" in availability) || availability.finishesVerified),
  );
}

export function availableFinishValues(availability?: CardVariantAvailability): readonly FinishValue[] {
  if (!availability || !areFinishesVerified(availability)) {
    return ["unspecified", "normal", "holo", "reverse", "other"];
  }
  return [
    "unspecified",
    availability.normal ? "normal" : undefined,
    availability.holo ? "holo" : undefined,
    availability.reverse ? "reverse" : undefined,
    "other",
  ].filter((value): value is FinishValue => Boolean(value));
}

export function availableEditionValues(availability?: CardVariantAvailability): readonly EditionValue[] {
  if (!availability) return ["unspecified", "unlimited", "first-edition"];
  return availability?.firstEdition
    ? ["unspecified", "unlimited", "first-edition"]
    : ["unspecified", "unlimited"];
}

export function availablePrintingValues(availability?: CardVariantAvailability): readonly PrintingValue[] {
  if (!availability) return ["shadowed", "shadowless"];
  return availability.shadowless ? ["shadowed", "shadowless"] : ["shadowed"];
}

export function createInitialVariantSelection(availability?: CardVariantAvailability): VariantSelection {
  const reportedFinishes = availability && areFinishesVerified(availability)
    ? [
        availability.normal ? "normal" as const : undefined,
        availability.holo ? "holo" as const : undefined,
        availability.reverse ? "reverse" as const : undefined,
      ].filter((value): value is "normal" | "holo" | "reverse" => Boolean(value))
    : [];

  return {
    finish: reportedFinishes.length === 1 ? reportedFinishes[0] : "unspecified",
    edition: "unlimited",
    printing: "shadowed",
  };
}

export function selectedPrinting(variant: VariantSelection): NonNullable<VariantSelection["printing"]> {
  return variant.printing ?? "unspecified";
}

export function isVariantSelectionComplete(variant: VariantSelection): boolean {
  return variant.finish !== "unspecified"
    && variant.edition !== "unspecified"
    && selectedPrinting(variant) !== "unspecified";
}

export function variantSelectionIssue(
  variant: VariantSelection,
  availability?: CardVariantAvailability,
): string | undefined {
  if (!isVariantSelectionComplete(variant)) {
    return "Finish, Edition und Druckvariante müssen vollständig festgelegt werden.";
  }
  if (variant.finish === "other" && !variant.label?.trim()) {
    return "Bei „Andere“ ist eine eigene Variantenbezeichnung erforderlich.";
  }
  if (!availability) return undefined;
  if (areFinishesVerified(availability)) {
    if (variant.finish === "normal" && !availability.normal) return "Non-Holo / Normal ist für diese Karte im Katalog nicht bestätigt.";
    if (variant.finish === "holo" && !availability.holo) return "Holo ist für diese Karte im Katalog nicht bestätigt.";
    if (variant.finish === "reverse" && !availability.reverse) return "Reverse Holo ist für diese Karte im Katalog nicht bestätigt.";
  }
  if (variant.edition === "first-edition" && !availability.firstEdition) return "First Edition ist für diese Karte im Katalog nicht bestätigt.";
  if (selectedPrinting(variant) === "shadowless" && !availability.shadowless) return "Shadowless ist nur für bestätigte englische Base-Set-Ausgaben auswählbar.";
  return undefined;
}

export function isVariantSelectionValid(
  variant: VariantSelection,
  availability?: CardVariantAvailability,
): boolean {
  return variantSelectionIssue(variant, availability) === undefined;
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
  if (!availability) return "Der Katalog enthält für diese Karte keine belastbaren Variantenangaben; Finish bitte anhand der Karte prüfen.";
  if (!areFinishesVerified(availability)) {
    const historicalOptions = [
      availability.firstEdition ? "First Edition" : undefined,
      availability.shadowless ? "Shadowless" : undefined,
    ].filter((value): value is string => Boolean(value));
    return historicalOptions.length
      ? `Das Finish ist nicht belastbar hinterlegt; anhand des Sets sind zusätzlich ${historicalOptions.join(" und ")} möglich.`
      : "Das Finish ist nicht belastbar hinterlegt; Edition und Druckvariante sind anhand des Sets begrenzt.";
  }
  const values = [
    availability.normal ? "Non-Holo / Normal" : undefined,
    availability.holo ? "Holo" : undefined,
    availability.reverse ? "Reverse Holo" : undefined,
    availability.firstEdition ? "First Edition" : undefined,
    availability.shadowless ? "Shadowless" : undefined,
  ].filter((value): value is string => Boolean(value));
  return values.length ? `Katalog bestätigt: ${values.join(", ")}.` : "Der Katalog meldet keine besondere Variante.";
}
