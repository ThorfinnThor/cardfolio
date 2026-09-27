import type { Binder } from "./types";

export interface BinderStats {
  capacity: number;
  planned: number;
  owned: number;
  missing: number;
  completionPercent: number;
}

export function deriveBinderStats(binder: Binder): BinderStats {
  const entries = binder.pages.flatMap((page) => page.slots).filter((entry) => entry !== null);
  const owned = entries.filter((entry) => entry.owned).length;
  return {
    capacity: binder.pages.reduce((total, page) => total + page.slots.length, 0),
    planned: entries.length,
    owned,
    missing: entries.length - owned,
    completionPercent: entries.length === 0 ? 0 : Math.round((owned / entries.length) * 100),
  };
}
