export const FEATURES = {
  designPreview: false,
  pricing: false,
  giftBuilderPricing: false,
  giftPriceEstimates: process.env.NEXT_PUBLIC_FEATURE_GIFT_PRICE_ESTIMATES !== "false",
  giftBudgetGuarantee: false,
  artworkReview: process.env.NEXT_PUBLIC_FEATURE_ARTWORK_REVIEW === "true" || process.env.NODE_ENV !== "production",
  smartSearch: process.env.NEXT_PUBLIC_FEATURE_SMART_SEARCH !== "false",
  tcgplayerTextExport: true,
  tcgplayerPrefill: false,
  cardmarketImport: true,
  cardtraderCommerce: false,
  publicSharing: false,
} as const;
