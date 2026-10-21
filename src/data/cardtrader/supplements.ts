import { z } from "zod";

import { makeCardKey } from "@/domain/binder-actions";
import type { CardRef, CardSnapshot, CatalogQuery, CatalogSearchItem } from "@/domain/types";

import { CARDTRADER_DATA_PATH, normalizeCollectorNumber } from "./catalog";

/**
 * Cards that CardTrader has and TCGdex does not list, for a few reviewed sets (data/marketplace/
 * cardtrader-supplement-sets.json). They enter the catalogue as cards with the identity provider "cardtrader" and
 * the CardTrader blueprint id, in English only. Images, prices and product links reuse the set and collector number
 * lookup of the CardTrader data, so the snapshot carries the real TCGdex set id.
 */
const supplementCardSchema = z.object({
  id: z.number().int().positive(),
  n: z.string().min(1),
  name: z.string().min(1),
  rar: z.string().optional(),
  img: z.string().optional(),
  cm: z.array(z.number().int().positive()).optional(),
  tp: z.number().int().positive().optional(),
});
const supplementsFileSchema = z.object({
  schemaVersion: z.literal(1),
  sets: z.record(z.string(), z.object({
    setName: z.string().min(1),
    expansionId: z.number().int().positive(),
    total: z.number().int().positive().optional(),
    cards: z.array(supplementCardSchema),
  })),
});
type SupplementsFile = z.infer<typeof supplementsFileSchema>;
type SupplementCard = z.infer<typeof supplementCardSchema>;

/** "0RC1/RC25" is printed as RC1 of RC25; "75a/98" as 75a of 98. */
export function supplementNumbers(raw: string, total?: number): { collectorNumber: string; collectorTotal?: string } {
  const [first = "", second] = raw.trim().split("/");
  const collectorNumber = first.replace(/^0+(?=[A-Za-z])/, "") || first;
  const collectorTotal = second?.trim() || (total ? String(total) : undefined);
  return { collectorNumber, collectorTotal };
}

type Loader = () => Promise<unknown>;

const defaultLoader: Loader = async () => {
  const response = await fetch(`${CARDTRADER_DATA_PATH}/supplements.json`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};

export class CardTraderSupplements {
  private file?: Promise<SupplementsFile | undefined>;

  constructor(private readonly load: Loader = defaultLoader, private readonly now: () => string = () => new Date().toISOString()) {}

  private data(): Promise<SupplementsFile | undefined> {
    this.file ??= this.load().then((value) => {
      const parsed = supplementsFileSchema.safeParse(value);
      return parsed.success ? parsed.data : undefined;
    }, () => undefined);
    return this.file;
  }

  private item(setId: string, setName: string, total: number | undefined, card: SupplementCard): CatalogSearchItem {
    const { collectorNumber, collectorTotal } = supplementNumbers(card.n, total);
    return {
      ref: { provider: "cardtrader", id: String(card.id), language: "en" },
      name: card.name,
      collectorNumber,
      ...(collectorTotal ? { collectorTotal } : {}),
      setId,
      setName,
    };
  }

  /** The supplement cards a catalogue search should add: by set, by name and by collector number. English only. */
  async search(query: Pick<CatalogQuery, "language" | "name" | "setId" | "collectorNumber">): Promise<CatalogSearchItem[]> {
    if (query.language !== "en") return [];
    const name = query.name?.trim().toLocaleLowerCase("en");
    const setId = query.setId?.trim();
    if (!name && !setId && !query.collectorNumber?.trim()) return [];
    const file = await this.data();
    if (!file) return [];
    const wantedNumber = query.collectorNumber?.trim() ? normalizeCollectorNumber(query.collectorNumber) : undefined;
    const items: CatalogSearchItem[] = [];
    for (const [id, set] of Object.entries(file.sets)) {
      if (setId && setId !== id) continue;
      for (const card of set.cards) {
        if (name && !card.name.toLocaleLowerCase("en").includes(name)) continue;
        if (wantedNumber && normalizeCollectorNumber(card.n) !== wantedNumber) continue;
        items.push(this.item(id, set.setName, set.total, card));
      }
    }
    return items;
  }

  /** The snapshot of a supplement card, or an error when the blueprint is not part of the reviewed sets. */
  async card(ref: CardRef): Promise<CardSnapshot> {
    const file = await this.data();
    for (const [setId, set] of Object.entries(file?.sets ?? {})) {
      const card = set.cards.find((entry) => String(entry.id) === ref.id);
      if (!card) continue;
      const { collectorNumber, collectorTotal } = supplementNumbers(card.n, set.total);
      return {
        key: makeCardKey(ref),
        ref: { ...ref },
        name: card.name,
        setId,
        setName: set.setName,
        collectorNumber,
        ...(collectorTotal ? { collectorTotal } : {}),
        physicalStatus: "physical",
        fetchedAt: this.now(),
      };
    }
    throw new Error("Diese CardTrader-Karte gehört zu keinem geprüften Set.");
  }
}

export const cardtraderSupplements = new CardTraderSupplements();
