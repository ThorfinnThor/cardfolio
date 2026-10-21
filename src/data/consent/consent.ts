import { CONSENT_CHANGE_EVENT, CONSENT_MAX_AGE_MS, CONSENT_STORAGE_KEY } from "@/config/analytics";

export type ConsentDecision = "granted" | "denied";

interface StoredConsent {
  v: 1;
  analytics: ConsentDecision;
  at: string;
}

/** The visitor's stored choice, or undefined when there is none, it is malformed, or it is older than a year. */
export function readConsent(now: number = Date.now()): ConsentDecision | undefined {
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Partial<StoredConsent>;
    if (parsed.v !== 1 || (parsed.analytics !== "granted" && parsed.analytics !== "denied") || typeof parsed.at !== "string") return undefined;
    const age = now - Date.parse(parsed.at);
    if (!Number.isFinite(age) || age < 0 || age > CONSENT_MAX_AGE_MS) return undefined;
    return parsed.analytics;
  } catch {
    return undefined;
  }
}

/** Stores the choice and tells the page. Storage that is blocked only means the question comes back next visit. */
export function writeConsent(decision: ConsentDecision, now: number = Date.now()): void {
  try {
    const value: StoredConsent = { v: 1, analytics: decision, at: new Date(now).toISOString() };
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* Without storage the choice only lasts for this page view. */
  }
  window.dispatchEvent(new CustomEvent<ConsentDecision>(CONSENT_CHANGE_EVENT, { detail: decision }));
}
