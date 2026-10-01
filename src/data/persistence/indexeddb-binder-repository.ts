import type { GiftProject } from "@/domain/gift-builder";
import type { Binder, CardSnapshot, LocalBackup, LocalBackupV2, UUID } from "@/domain/types";
import { MAX_BINDERS } from "@/domain/binder-actions";
import { validateBackup, validateBinder } from "@/domain/validation";

import { type BinderRepository, type ImportMode, RevisionConflictError } from "./binder-repository";
import { openCardfolioDB } from "./db";

const BINDER_ORDER_SETTING = "binder-order";

function storedBinderOrder(value: unknown): UUID[] {
  if (!Array.isArray(value)) return [];
  const ids = value.filter((item): item is string => typeof item === "string");
  return ids.length === new Set(ids).size ? ids : [];
}

function sortBinders(binders: Binder[], order: UUID[]): Binder[] {
  const orderIndex = new Map(order.map((id, index) => [id, index]));
  return [...binders].sort((left, right) => {
    const leftIndex = orderIndex.get(left.id);
    const rightIndex = orderIndex.get(right.id);
    if (leftIndex !== undefined && rightIndex !== undefined) return leftIndex - rightIndex;
    if (leftIndex !== undefined) return -1;
    if (rightIndex !== undefined) return 1;
    return right.updatedAt.localeCompare(left.updatedAt);
  });
}

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

function cloneGiftProject(project: GiftProject, binderIds: ReadonlyMap<UUID, UUID>): GiftProject {
  const timestamp = new Date().toISOString();
  return {
    ...project,
    id: crypto.randomUUID(),
    revision: 0,
    name: `${project.name} (Import)`.slice(0, 100),
    binderId: project.binderId ? binderIds.get(project.binderId) : undefined,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export class IndexedDBBinderRepository implements BinderRepository {
  async list(): Promise<Binder[]> {
    const database = await openCardfolioDB();
    const transaction = database.transaction(["binders", "settings"], "readonly");
    const [binders, order] = await Promise.all([
      transaction.objectStore("binders").getAll(),
      transaction.objectStore("settings").get(BINDER_ORDER_SETTING),
    ]);
    await transaction.done;
    return sortBinders(binders, storedBinderOrder(order));
  }

  async get(id: UUID): Promise<Binder | null> {
    const database = await openCardfolioDB();
    return (await database.get("binders", id)) ?? null;
  }

  async create(binder: Binder, cards: CardSnapshot[]): Promise<void> {
    const cleanBinder = validateBinder(binder);
    const database = await openCardfolioDB();
    const transaction = database.transaction(["binders", "cards", "settings"], "readwrite");
    const binderStore = transaction.objectStore("binders");
    if (await binderStore.get(cleanBinder.id)) {
      transaction.abort();
      await transaction.done.catch(() => undefined);
      throw new RevisionConflictError("A binder with this ID already exists.");
    }
    const existingBinders = await binderStore.getAll();
    if (existingBinders.length >= MAX_BINDERS) {
      transaction.abort();
      await transaction.done.catch(() => undefined);
      throw new Error(`Es können höchstens ${MAX_BINDERS} Binder gespeichert werden.`);
    }
    const settingsStore = transaction.objectStore("settings");
    const currentOrder = sortBinders(
      existingBinders,
      storedBinderOrder(await settingsStore.get(BINDER_ORDER_SETTING)),
    ).map((item) => item.id);
    await binderStore.add(cleanBinder, cleanBinder.id);
    await settingsStore.put([cleanBinder.id, ...currentOrder], BINDER_ORDER_SETTING);
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

  async saveOrder(ids: UUID[]): Promise<void> {
    if (ids.length !== new Set(ids).size) throw new Error("Binder order contains duplicate IDs.");
    const database = await openCardfolioDB();
    const transaction = database.transaction(["binders", "settings"], "readwrite");
    const currentIds = (await transaction.objectStore("binders").getAllKeys()).map(String);
    const currentSet = new Set(currentIds);
    if (ids.length !== currentIds.length || ids.some((id) => !currentSet.has(id))) {
      transaction.abort();
      await transaction.done.catch(() => undefined);
      throw new RevisionConflictError("The binder list changed in another tab.");
    }
    await transaction.objectStore("settings").put([...ids], BINDER_ORDER_SETTING);
    await transaction.done;
  }

  async remove(id: UUID, expectedRevision: number): Promise<void> {
    const database = await openCardfolioDB();
    const transaction = database.transaction(["binders", "settings"], "readwrite");
    const binderStore = transaction.objectStore("binders");
    const current = await binderStore.get(id);
    if (!current || current.revision !== expectedRevision) {
      transaction.abort();
      await transaction.done.catch(() => undefined);
      throw new RevisionConflictError();
    }
    await binderStore.delete(id);
    const settingsStore = transaction.objectStore("settings");
    const order = storedBinderOrder(await settingsStore.get(BINDER_ORDER_SETTING)).filter((binderId) => binderId !== id);
    await settingsStore.put(order, BINDER_ORDER_SETTING);
    await transaction.done;
  }

  async exportBackup(ids?: UUID[]): Promise<LocalBackupV2> {
    const database = await openCardfolioDB();
    const transaction = database.transaction(["binders", "cards", "giftProjects"], "readonly");
    const allBinders = await transaction.objectStore("binders").getAll();
    const binders = ids ? allBinders.filter((binder) => ids.includes(binder.id)) : allBinders;
    const requiredKeys = new Set(
      binders.flatMap((binder) =>
        binder.pages.flatMap((page) => page.slots.flatMap((entry) => (entry ? [entry.cardKey] : []))),
      ),
    );
    const cards = (await transaction.objectStore("cards").getAll()).filter((card) => requiredKeys.has(card.key));
    const allGiftProjects = await transaction.objectStore("giftProjects").getAll();
    const giftProjects = ids
      ? allGiftProjects.filter((project) => project.binderId && ids.includes(project.binderId))
      : allGiftProjects;
    await transaction.done;
    return validateBackup({
      format: "cardfolio-backup",
      version: 2,
      exportedAt: new Date().toISOString(),
      binders,
      cards,
      giftProjects,
    });
  }

  async importBackup(input: LocalBackup, mode: ImportMode): Promise<void> {
    const backup = validateBackup(input);
    const binderIds = new Map<UUID, UUID>();
    const binders = mode === "import-as-new" ? backup.binders.map((binder) => {
      const cloned = cloneAsNew(binder);
      binderIds.set(binder.id, cloned.id);
      return cloned;
    }) : backup.binders;
    const giftProjects = mode === "import-as-new"
      ? backup.giftProjects.map((project) => cloneGiftProject(project, binderIds))
      : backup.giftProjects;
    const database = await openCardfolioDB();
    const transaction = database.transaction(["binders", "cards", "settings", "giftProjects"], "readwrite");
    const binderStore = transaction.objectStore("binders");
    const settingsStore = transaction.objectStore("settings");
    const existingBinders = mode === "replace-all" ? [] : await binderStore.getAll();
    if (existingBinders.length + binders.length > MAX_BINDERS) {
      transaction.abort();
      await transaction.done.catch(() => undefined);
      throw new Error(`Es können höchstens ${MAX_BINDERS} Binder gespeichert werden.`);
    }
    if (mode === "replace-all") {
      await binderStore.clear();
      await transaction.objectStore("cards").clear();
      await transaction.objectStore("giftProjects").clear();
    }
    for (const binder of binders) await binderStore.put(binder, binder.id);
    for (const card of backup.cards) await transaction.objectStore("cards").put(card, card.key);
    for (const project of giftProjects) await transaction.objectStore("giftProjects").put(project, project.id);
    const existingOrder = mode === "replace-all"
      ? []
      : sortBinders(
        existingBinders,
        storedBinderOrder(await settingsStore.get(BINDER_ORDER_SETTING)),
      ).map((binder) => binder.id);
    await settingsStore.put([...binders.map((binder) => binder.id), ...existingOrder], BINDER_ORDER_SETTING);
    await transaction.done;
  }
}
