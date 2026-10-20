/**
 * Provider details for the legal notice and the privacy policy. Same operator as the owner's other sites
 * (stargazingindex.com, besttravelclimate.com). The contact address is the one place to change if it moves.
 */
export const OPERATOR = {
  businessName: "SeitenHafen361",
  legalForm: { de: "Einzelunternehmen", en: "Sole proprietorship" },
  owner: "Schayan Yousefian",
  street: "Freienwalder Str. 34",
  postalCode: "13359",
  city: "Berlin",
  country: { de: "Deutschland", en: "Germany" },
  email: "info@yourcardbinder.com",
} as const;

/** The date the legal texts were last revised. Update it whenever `legal.ts` changes. */
export const LEGAL_UPDATED = "2026-10-20";
