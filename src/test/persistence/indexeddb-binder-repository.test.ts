import { describe, expect, it } from "vitest";

import { createBinder, createPlannedCard, placeCard, setPageTitle } from "@/domain/binder-actions";
import { type PageSelectionDraft } from "@/domain/page-selection";
import type { CardSnapshot } from "@/domain/types";
import { RevisionConflictError } from "@/data/persistence/binder-repository";
import { IndexedDBBinderRepository } from "@/data/persistence/indexeddb-binder-repository";
import { persistPageSelection } from "@/data/persistence/page-selection-service";

const card: CardSnapshot = {
  key: "tcgdex:base1-1:en",
  ref: { provider: "tcgdex", id: "base1-1", language: "en" },
  name: "Bulbasaur",
  setId: "base1",
  setName: "Base Set",
  collectorNumber: "001",
  imageBaseUrl: "https://assets.tcgdex.net/en/base/base1/1",
  physicalStatus: "physical",
  fetchedAt: "2026-09-27T00:00:00.000Z",
};

describe("IndexedDBBinderRepository", () => {
  it("creates, revisions, exports and imports a complete binder atomically", async () => {
    const repository = new IndexedDBBinderRepository();
    const empty = createBinder("Roundtrip");
    const binder = setPageTitle(
      placeCard(
        empty,
        { pageId: empty.pages[0].id, slotIndex: 0 },
        createPlannedCard(card.key),
      ),
      empty.pages[0].id,
      "Showcase",
    );
    await repository.create(binder, [card]);
    const secondTabRepository = new IndexedDBBinderRepository();
    const staleBinder = await secondTabRepository.get(binder.id);
    if (!staleBinder) throw new Error("Second-tab binder fixture is missing.");

    const saved = await repository.save({ ...binder, description: "Saved" }, [], 0);
    expect(saved.revision).toBe(1);
    await expect(
      secondTabRepository.save({ ...staleBinder, description: "Stale tab" }, [], staleBinder.revision),
    ).rejects.toBeInstanceOf(RevisionConflictError);

    const backup = await repository.exportBackup([binder.id]);
    expect(backup.binders[0].description).toBe("Saved");
    expect(backup.binders[0].pages[0].title).toBe("Showcase");
    expect(backup.cards).toEqual([card]);

    await repository.importBackup(backup, "import-as-new");
    const binders = await repository.list();
    expect(binders).toHaveLength(2);
    expect(new Set(binders.map((item) => item.id)).size).toBe(2);
    expect(binders.some((item) => item.name === "Roundtrip (Import)")).toBe(true);

    const imported = binders.find((item) => item.name === "Roundtrip (Import)");
    if (!imported) throw new Error("Imported binder fixture is missing.");
    await repository.saveOrder([binder.id, imported.id]);
    expect((await repository.list()).map((item) => item.name)).toEqual(["Roundtrip", "Roundtrip (Import)"]);
    await repository.remove(imported.id, imported.revision);
    expect((await repository.list()).map((item) => item.name)).toEqual(["Roundtrip"]);
  });

  it("creates a selected page and its card snapshots in one repository operation", async () => {
    const repository = new IndexedDBBinderRepository();
    const selection: PageSelectionDraft = {
      items: [{
        card,
        variant: { finish: "normal", edition: "unlimited", printing: "shadowed" },
        preferences: { minimumCondition: "excellent" },
      }],
    };

    const result = await persistPageSelection(repository, selection, {
      kind: "new-binder",
      name: "Selected page",
    });
    const stored = await repository.get(result.binder.id);
    const backup = await repository.exportBackup([result.binder.id]);

    expect(stored?.pages[0].slots[0]).toMatchObject({
      cardKey: card.key,
      variant: { finish: "normal", edition: "unlimited", printing: "shadowed" },
      preferences: { minimumCondition: "excellent" },
    });
    expect(backup.cards).toEqual([card]);
  });

  it("persists page selections atomically and rejects a concurrent stale revision", async () => {
    const repository = new IndexedDBBinderRepository();
    const binder = createBinder("Concurrent selection");
    await repository.create(binder, []);
    const staleBinder = await repository.get(binder.id);
    if (!staleBinder) throw new Error("Stale binder fixture is missing.");

    await repository.save({ ...binder, description: "Changed in another tab" }, [], binder.revision);
    const selection: PageSelectionDraft = {
      items: [{
        card,
        variant: { finish: "normal", edition: "unlimited", printing: "shadowed" },
        preferences: { minimumCondition: "any" },
      }],
    };

    await expect(persistPageSelection(repository, selection, {
      kind: "fill-current-page",
      binder: staleBinder,
      pageId: staleBinder.pages[0].id,
    })).rejects.toBeInstanceOf(RevisionConflictError);

    const current = await repository.get(binder.id);
    expect(current?.description).toBe("Changed in another tab");
    expect(current?.pages[0].slots.every((entry) => entry === null)).toBe(true);
  });
});
