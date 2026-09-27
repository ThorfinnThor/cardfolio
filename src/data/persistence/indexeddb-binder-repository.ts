import type { Binder, CardSnapshot, LocalBackupV1, UUID } from "@/domain/types";
import { validateBackup, validateBinder } from "@/domain/validation";

import { type BinderRepository, type ImportMode, RevisionConflictError } from "./binder-repository";
import { openCardfolioDB } from "./db";

function cloneAsNew(binder: Binder): Binder {
  const timestamp = new Date().toISOString();
  return {
    ...binder,
    id: crypto.randomUUID(),
    revision: 0,
    name: `${binder.name} (Import)`.slice(0, 100),
    createdAt: timestamp,
    updatedAt: timestamp,
    pages: binder.pages.map((page) => ({
      ...page,
      id: crypto.randomUUID(),
      slots: page.slots.map((entry) => (entry ? { ...entry, id: crypto.randomUUID() } : null)),
    })),
  };
}

export class IndexedDBBinderRepository implements BinderRepository {
  async list(): Promise<Binder[]> {
    const database = await openCardfolioDB();
    return (await database.getAll("binders")).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async get(id: UUID): Promise<Binder | null> {
    const database = await openCardfolioDB();
    return (await database.get("binders", id)) ?? null;
  }

  async create(binder: Binder, cards: CardSnapshot[]): Promise<void> {
    const cleanBinder = validateBinder(binder);
    const database = await openCardfolioDB();
    const transaction = database.transaction(["binders", "cards"], "readwrite");
    if (await transaction.objectStore("binders").get(cleanBinder.id)) {
      transaction.abort();
      await transaction.done.catch(() => undefined);
      throw new RevisionConflictError("A binder with this ID already exists.");
    }
    await transaction.objectStore("binders").add(cleanBinder, cleanBinder.id);
    for (const card of cards) await transaction.objectStore("cards").put(card, card.key);
    await transaction.done;
  }

  async save(
    binder: Binder,
    cards: CardSnapshot[],
    expectedRevision: number,
  ): Promise<Binder> {
    const cleanBinder = validateBinder(binder);
    const database = await openCardfolioDB();
    const transaction = database.transaction(["binders", "cards"], "readwrite");
    const store = transaction.objectStore("binders");
    const current = await store.get(cleanBinder.id);
    if (!current || current.revision !== expectedRevision) {
      transaction.abort();
      await transaction.done.catch(() => undefined);
      throw new RevisionConflictError();
    }
    const saved = validateBinder({
      ...cleanBinder,
      revision: expectedRevision + 1,
      updatedAt: new Date().toISOString(),
    });
    await store.put(saved, saved.id);
    for (const card of cards) await transaction.objectStore("cards").put(card, card.key);
    await transaction.done;
    return saved;
  }

  async remove(id: UUID, expectedRevision: number): Promise<void> {
    const database = await openCardfolioDB();
    const transaction = database.transaction("binders", "readwrite");
    const current = await transaction.store.get(id);
    if (!current || current.revision !== expectedRevision) {
      transaction.abort();
      await transaction.done.catch(() => undefined);
      throw new RevisionConflictError();
    }
    await transaction.store.delete(id);
    await transaction.done;
  }

  async exportBackup(ids?: UUID[]): Promise<LocalBackupV1> {
    const database = await openCardfolioDB();
    const transaction = database.transaction(["binders", "cards"], "readonly");
    const allBinders = await transaction.objectStore("binders").getAll();
    const binders = ids ? allBinders.filter((binder) => ids.includes(binder.id)) : allBinders;
    const requiredKeys = new Set(
      binders.flatMap((binder) =>
        binder.pages.flatMap((page) => page.slots.flatMap((entry) => (entry ? [entry.cardKey] : []))),
      ),
    );
    const cards = (await transaction.objectStore("cards").getAll()).filter((card) => requiredKeys.has(card.key));
    await transaction.done;
    return validateBackup({
      format: "cardfolio-backup",
      version: 1,
      exportedAt: new Date().toISOString(),
      binders,
      cards,
    });
  }

  async importBackup(input: LocalBackupV1, mode: ImportMode): Promise<void> {
    const backup = validateBackup(input);
    const binders = mode === "import-as-new" ? backup.binders.map(cloneAsNew) : backup.binders;
    const database = await openCardfolioDB();
    const transaction = database.transaction(["binders", "cards"], "readwrite");
    if (mode === "replace-all") {
      await transaction.objectStore("binders").clear();
      await transaction.objectStore("cards").clear();
    }
    for (const binder of binders) await transaction.objectStore("binders").put(binder, binder.id);
    for (const card of backup.cards) await transaction.objectStore("cards").put(card, card.key);
    await transaction.done;
  }
}
