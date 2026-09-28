import { describe, expect, it } from "vitest";

import { createBinder, createPlannedCard, placeCard, setPageTitle } from "@/domain/binder-actions";
import type { CardSnapshot } from "@/domain/types";
import { RevisionConflictError } from "@/data/persistence/binder-repository";
import { IndexedDBBinderRepository } from "@/data/persistence/indexeddb-binder-repository";

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
});
