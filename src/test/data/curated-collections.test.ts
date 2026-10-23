import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it, vi } from "vitest";

import { curatedCollectionPool, curatedCollectionsSchema } from "@/data/catalog/curated-collections";
import { GIFT_COLLECTION_PRESETS } from "@/domain/gift-collections";
import { GIFT_THEME_PRESETS } from "@/domain/gift-theme-presets";

describe("curated card collections", () => {
  it("ships a valid list for every collection theme, with unique cards and no Pocket cards", async () => {
    const file = JSON.parse(await readFile(resolve(process.cwd(), "public/data/semantic/curated-collections-v1.json"), "utf8"));
    const parsed = curatedCollectionsSchema.parse(file);
    for (const preset of GIFT_COLLECTION_PRESETS) {
      const ids = parsed.collections[preset.id];
      expect(ids, preset.id).toBeDefined();
      expect(ids!.length, preset.id).toBeGreaterThanOrEqual(18);
      expect(new Set(ids).size, preset.id).toBe(ids!.length);
      expect(ids!.some((id) => /^(A\d|B\d|P-A|tcgp)/i.test(id)), preset.id).toBe(false);
    }
  });

  it("keeps theme ids unique across artwork motifs and collections", () => {
    const ids = [...GIFT_THEME_PRESETS.map((theme) => theme.id), ...GIFT_COLLECTION_PRESETS.map((preset) => preset.id)];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("turns the first cards of a collection into candidates and refuses unknown ones", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ version: 1, generatedAt: "2026-10-23", collections: { "type-fire": Array.from({ length: 12 }, (_, index) => `base1-${index + 1}`) } }) })));
    const pool = await curatedCollectionPool("type-fire", 5);
    expect(pool.map((item) => item.ref.id)).toEqual(["base1-1", "base1-2", "base1-3", "base1-4", "base1-5"]);
    expect(pool[0]).toMatchObject({ ref: { provider: "tcgdex", language: "en" } });
    expect(await curatedCollectionPool("nope", 5)).toEqual([]);
    vi.unstubAllGlobals();
  });
});
