import { describe, expect, it } from "vitest";

import { IndexedDBBinderRepository } from "@/data/persistence/indexeddb-binder-repository";
import { IndexedDBGiftProjectRepository } from "@/data/persistence/gift-project-repository";
import type { GiftProject } from "@/domain/gift-builder";
import { validateBackup } from "@/domain/validation";

function project(name: string): GiftProject {
  const timestamp = "2026-10-01T12:00:00.000Z";
  return {
    id: crypto.randomUUID(),
    schemaVersion: 1,
    revision: 0,
    name,
    createdAt: timestamp,
    updatedAt: timestamp,
    preferences: {
      recipientKind: "friend",
      recipientName: "Local recipient",
      occasion: "birthday",
      subjectQuery: "Pikachu",
      targetCardCount: 9,
      budgetMinor: 10_000,
      currency: "EUR",
      budgetTolerancePercent: 5,
      preferredLanguage: "de",
      style: "mixed",
    },
    selectedCardKeys: [],
  };
}

describe("Gift Project persistence", () => {
  it("survives repository reload and validated backup/import", async () => {
    const gifts = new IndexedDBGiftProjectRepository();
    const binders = new IndexedDBBinderRepository();
    const original = project(`Gift ${crypto.randomUUID()}`);
    await gifts.create(original);

    const reloaded = await new IndexedDBGiftProjectRepository().get(original.id);
    expect(reloaded?.preferences).toEqual(original.preferences);

    const backup = await binders.exportBackup();
    expect(backup.version).toBe(2);
    expect(backup.giftProjects).toContainEqual(original);

    await binders.importBackup({
      ...backup,
      binders: [],
      cards: [],
      giftProjects: [original],
    }, "import-as-new");
    const imported = (await gifts.list()).find((item) => item.name === `${original.name} (Import)`);
    expect(imported?.id).not.toBe(original.id);
    expect(imported?.preferences.recipientName).toBe("Local recipient");
  });

  it("migrates a valid version-1 backup to an empty Gift Project list", () => {
    const migrated = validateBackup({
      format: "cardfolio-backup",
      version: 1,
      exportedAt: "2026-10-01T12:00:00.000Z",
      binders: [],
      cards: [],
    });
    expect(migrated).toMatchObject({ version: 2, giftProjects: [] });
  });
});
