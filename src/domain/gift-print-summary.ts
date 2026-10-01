import type { BinderOffer, BinderOfferPrice } from "./binder-affiliate";
import { formatCollectorNumber } from "./catalog-search";
import type { GiftPriceRange, GiftProject, GiftSelectionResult } from "./gift-builder";
import { formatVariantSelection } from "./variant-selection";

export interface GiftPrintSummaryCard {
  name: string;
  setName: string;
  collectorNumber: string;
  language: "de" | "en";
  variant: string;
}

export interface GiftPrintSummary {
  schemaVersion: 1;
  generatedAt: string;
  title: string;
  recipientName?: string;
  greeting?: string;
  subject: string;
  cardCount: number;
  cards: GiftPrintSummaryCard[];
  cardPurchase: {
    currency: "EUR" | "USD";
    estimatedValueMinor?: number;
    estimatedRange?: Pick<GiftPriceRange, "lowMinor" | "highMinor">;
    unknownPriceCount: number;
    approximatePriceCount: number;
    shippingAndTaxExcluded: true;
  };
  binderPurchase: {
    offerId?: string;
    partnerName?: string;
    status: BinderOffer["status"] | "not-selected";
    price?: BinderOfferPrice;
    purchasedSeparately: true;
  };
  assetPolicy: "text-only-no-pokemon-art-or-logos";
  privacy: "generated-locally-no-upload";
}

export interface GiftPrintSummaryInput {
  project: GiftProject;
  selection: GiftSelectionResult;
  greeting?: string;
  binderOffer?: BinderOffer;
  generatedAt?: string;
}

function aggregateRange(selection: GiftSelectionResult): Pick<GiftPriceRange, "lowMinor" | "highMinor"> | undefined {
  if (!selection.selected.length || selection.selected.some((candidate) => !candidate.price.range)) return undefined;
  return selection.selected.reduce((sum, candidate) => ({
    lowMinor: sum.lowMinor + (candidate.price.range?.lowMinor ?? 0),
    highMinor: sum.highMinor + (candidate.price.range?.highMinor ?? 0),
  }), { lowMinor: 0, highMinor: 0 });
}

function optionalText(value: string | undefined, maximum: number): string | undefined {
  const clean = value?.replace(/\u0000/g, "").trim();
  if (!clean) return undefined;
  if (clean.length > maximum) throw new Error(`Print summary text exceeds ${maximum} characters.`);
  return clean;
}

export function createGiftPrintSummary(input: GiftPrintSummaryInput): GiftPrintSummary {
  if (!input.selection.selected.length) throw new Error("Print summary requires at least one selected card.");
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  if (Number.isNaN(Date.parse(generatedAt))) throw new Error("Print summary timestamp is invalid.");
  const binderOffer = input.binderOffer;
  return {
    schemaVersion: 1,
    generatedAt,
    title: optionalText(input.project.name, 100) ?? "Geschenk-Binder",
    recipientName: optionalText(input.project.preferences.recipientName, 100),
    greeting: optionalText(input.greeting, 500),
    subject: input.project.preferences.subjectQuery,
    cardCount: input.selection.selected.length,
    cards: input.selection.selected.map((candidate) => ({
      name: candidate.card.name,
      setName: candidate.card.setName,
      collectorNumber: formatCollectorNumber(candidate.card.collectorNumber, candidate.card.collectorTotal),
      language: candidate.card.ref.language,
      variant: formatVariantSelection(candidate.variant),
    })),
    cardPurchase: {
      currency: input.project.preferences.currency,
      estimatedValueMinor: input.selection.estimatedTotalMinor,
      estimatedRange: aggregateRange(input.selection),
      unknownPriceCount: input.selection.unpricedCount,
      approximatePriceCount: input.selection.approximateCount,
      shippingAndTaxExcluded: true,
    },
    binderPurchase: {
      offerId: binderOffer?.id,
      partnerName: binderOffer?.displayName,
      status: binderOffer?.status ?? "not-selected",
      price: binderOffer?.price ? { ...binderOffer.price } : undefined,
      purchasedSeparately: true,
    },
    assetPolicy: "text-only-no-pokemon-art-or-logos",
    privacy: "generated-locally-no-upload",
  };
}
