import { type DBSchema, type IDBPDatabase, openDB } from "idb";

import type { Binder, CardSnapshot } from "@/domain/types";

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
}

let databasePromise: Promise<IDBPDatabase<CardfolioDB>> | undefined;

export function openCardfolioDB(): Promise<IDBPDatabase<CardfolioDB>> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is not available in this environment."));
  }
  databasePromise ??= openDB<CardfolioDB>("cardfolio", 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains("binders")) database.createObjectStore("binders");
      if (!database.objectStoreNames.contains("cards")) database.createObjectStore("cards");
      if (!database.objectStoreNames.contains("settings")) database.createObjectStore("settings");
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
