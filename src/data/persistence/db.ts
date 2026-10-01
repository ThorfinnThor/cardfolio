import { type DBSchema, type IDBPDatabase, openDB } from "idb";

import type { GiftProject } from "@/domain/gift-builder";
import type { Binder, CardSnapshot } from "@/domain/types";

export interface GiftCandidateCacheRecord {
  key: string;
  card: CardSnapshot;
  rawPricing: unknown;
  releaseYear?: number;
  cachedAt: string;
  expiresAt: string;
}

interface CardfolioDB extends DBSchema {
  binders: {
    key: string;
    value: Binder;
  };
  cards: {
    key: string;
    value: CardSnapshot;
  };
  settings: {
    key: string;
    value: unknown;
  };
  giftProjects: {
    key: string;
    value: GiftProject;
  };
  giftCandidateCache: {
    key: string;
    value: GiftCandidateCacheRecord;
  };
}

let databasePromise: Promise<IDBPDatabase<CardfolioDB>> | undefined;

export function openCardfolioDB(): Promise<IDBPDatabase<CardfolioDB>> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is not available in this environment."));
  }
  databasePromise ??= openDB<CardfolioDB>("cardfolio", 2, {
    upgrade(database) {
      if (!database.objectStoreNames.contains("binders")) database.createObjectStore("binders");
      if (!database.objectStoreNames.contains("cards")) database.createObjectStore("cards");
      if (!database.objectStoreNames.contains("settings")) database.createObjectStore("settings");
      if (!database.objectStoreNames.contains("giftProjects")) database.createObjectStore("giftProjects");
      if (!database.objectStoreNames.contains("giftCandidateCache")) database.createObjectStore("giftCandidateCache");
    },
    blocking() {
      databasePromise?.then((database) => database.close()).catch(() => undefined);
      databasePromise = undefined;
    },
    terminated() {
      databasePromise = undefined;
    },
  });
  return databasePromise;
}

export function resetDatabaseConnectionForTests(): void {
  databasePromise = undefined;
}
