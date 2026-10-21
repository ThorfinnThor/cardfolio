import type { GiftPreferences, GiftProject, GiftSelectionResult } from "@/domain/gift-builder";

/**
 * The finished Gift plan survives a trip to the purchase view (and the browser's back button) for this tab
 * only: it is kept in sessionStorage, never leaves the browser and disappears with the tab. It is dropped as
 * soon as a new gift is started or the buyer leaves the flow on purpose.
 */
export interface GiftResume {
  selection: GiftSelectionResult;
  preferences: GiftPreferences;
  project: GiftProject;
}

const STORAGE_KEY = "cardfolio-gift-summary";
const MAX_AGE_MS = 6 * 60 * 60 * 1_000;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidResume(value: unknown): value is GiftResume {
  if (!isObject(value)) return false;
  const { selection, preferences, project } = value;
  if (!isObject(selection) || !Array.isArray(selection.selected) || selection.selected.length === 0) return false;
  const cardsOk = selection.selected.every((entry) => isObject(entry) && isObject(entry.card) && typeof entry.card.key === "string" && isObject(entry.variant) && isObject(entry.preferences) && isObject(entry.price));
  return cardsOk
    && isObject(preferences) && typeof preferences.subjectQuery === "string" && typeof preferences.targetCardCount === "number"
    && isObject(project) && typeof project.id === "string";
}

export function saveGiftResume(resume: GiftResume, now = Date.now()): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, savedAt: now, resume }));
  } catch {
    // Storage can be blocked or full; the plan then simply does not survive a detour.
  }
}

export function readGiftResume(now = Date.now()): GiftResume | undefined {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const record: unknown = JSON.parse(raw);
    if (!isObject(record) || record.version !== 1 || typeof record.savedAt !== "number" || now - record.savedAt > MAX_AGE_MS) return undefined;
    return isValidResume(record.resume) ? record.resume : undefined;
  } catch {
    return undefined;
  }
}

export function clearGiftResume(): void {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}
