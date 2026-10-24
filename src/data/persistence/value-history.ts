import { z } from "zod";

import { valuePointSchema } from "@/domain/validation";
import type { UUID, ValuePoint } from "@/domain/types";

import { openAppDatabase } from "./db";

export const VALUE_HISTORY_PREFIX = "valueHistory:";

const historySchema = z.array(valuePointSchema).max(1000);

export function valueHistoryKey(binderId: UUID): string {
  return `${VALUE_HISTORY_PREFIX}${binderId}`;
}

/** The saved value history of a binder, oldest first. Unreadable data counts as no history. */
export async function loadValueHistory(binderId: UUID): Promise<ValuePoint[]> {
  try {
    const database = await openAppDatabase();
    const parsed = historySchema.safeParse(await database.get("settings", valueHistoryKey(binderId)));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export async function saveValueHistory(binderId: UUID, history: readonly ValuePoint[]): Promise<void> {
  const database = await openAppDatabase();
  await database.put("settings", [...history], valueHistoryKey(binderId));
}
