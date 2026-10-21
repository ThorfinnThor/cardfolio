/** Google Analytics 4 measurement id of the yourcardbinder.com web stream (property 559982761). Public by design. */
export const GA_MEASUREMENT_ID = "G-R8KEXRSCBR";

/** Browser storage key of the visitor's choice. Keeps the product's original prefix, like the other storage keys. */
export const CONSENT_STORAGE_KEY = "cardfolio-analytics-consent";

/** The choice is asked again after this time. */
export const CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1_000;

/** Fired on `window` to open the banner again ("Cookie-Einstellungen" in the footer). */
export const CONSENT_REOPEN_EVENT = "ycb:consent-reopen";

/** Fired on `window` after every stored choice, with the new decision as `detail`. */
export const CONSENT_CHANGE_EVENT = "ycb:consent-change";
