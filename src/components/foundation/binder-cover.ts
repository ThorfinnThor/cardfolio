/**
 * Purely presentational cover styling for binders (Synthese 2 "Kabinett" covers).
 * Colours are derived from the binder ID so they stay stable without touching persistence.
 */
export const COVER_LEATHERS = ["#2B3A67", "#54406E", "#1F1D1A", "#7A2E33", "#A87A2A", "#55616B", "#2E6C6A"] as const;

export function coverLeather(binderId: string): string {
  let hash = 0;
  for (let index = 0; index < binderId.length; index += 1) {
    hash = (hash * 31 + binderId.charCodeAt(index)) >>> 0;
  }
  return COVER_LEATHERS[hash % COVER_LEATHERS.length];
}

export function catalogLabel(index: number): string {
  return `CF-${String(index + 1).padStart(2, "0")}`;
}
