export const FEATURES = {
  designPreview: false,
  pricing: false,
  giftBuilderPricing: false,
  smartSearch: process.env.NEXT_PUBLIC_FEATURE_SMART_SEARCH !== "false",
  tcgplayerTextExport: true,
  tcgplayerPrefill: false,
  cardmarketImport: true,
  cardtraderCommerce: false,
  publicSharing: false,
} as const;
