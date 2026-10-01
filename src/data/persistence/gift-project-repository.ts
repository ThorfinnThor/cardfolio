import type { GiftProject } from "@/domain/gift-builder";
import type { UUID } from "@/domain/types";

import { RevisionConflictError } from "./binder-repository";
import { openCardfolioDB } from "./db";
import { validateGiftProject } from "@/domain/validation";

export interface GiftProjectRepository {
  list(): Promise<GiftProject[]>;
  get(id: UUID): Promise<GiftProject | null>;
  create(project: GiftProject): Promise<void>;
  save(project: GiftProject, expectedRevision: number): Promise<GiftProject>;
  remove(id: UUID, expectedRevision: number): Promise<void>;
}

export class IndexedDBGiftProjectRepository implements GiftProjectRepository {
  async list(): Promise<GiftProject[]> {
    const database = await openCardfolioDB();
    return (await database.getAll("giftProjects")).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async get(id: UUID): Promise<GiftProject | null> {
    const database = await openCardfolioDB();
    return (await database.get("giftProjects", id)) ?? null;
  }

  async create(project: GiftProject): Promise<void> {
    const clean = validateGiftProject(project);
    const database = await openCardfolioDB();
    const transaction = database.transaction("giftProjects", "readwrite");
    if (await transaction.store.get(clean.id)) {
      transaction.abort();
      await transaction.done.catch(() => undefined);
      throw new RevisionConflictError("A Gift Project with this ID already exists.");
    }
    await transaction.store.add(clean, clean.id);
    await transaction.done;
  }

  async save(project: GiftProject, expectedRevision: number): Promise<GiftProject> {
    const clean = validateGiftProject(project);
    const database = await openCardfolioDB();
    const transaction = database.transaction("giftProjects", "readwrite");
    const current = await transaction.store.get(clean.id);
    if (!current || current.revision !== expectedRevision) {
      transaction.abort();
      await transaction.done.catch(() => undefined);
      throw new RevisionConflictError("The Gift Project changed in another tab.");
    }
    const saved = validateGiftProject({
      ...clean,
      revision: expectedRevision + 1,
      updatedAt: new Date().toISOString(),
    });
    await transaction.store.put(saved, saved.id);
    await transaction.done;
    return saved;
  }

  async remove(id: UUID, expectedRevision: number): Promise<void> {
    const database = await openCardfolioDB();
    const transaction = database.transaction("giftProjects", "readwrite");
    const current = await transaction.store.get(id);
    if (!current || current.revision !== expectedRevision) {
      transaction.abort();
      await transaction.done.catch(() => undefined);
      throw new RevisionConflictError("The Gift Project changed in another tab.");
    }
    await transaction.store.delete(id);
    await transaction.done;
  }
}
