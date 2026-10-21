import { z } from "zod";

import type { CardLanguage } from "@/domain/types";

/**
 * CardTrader data that fills gaps in the TCGdex catalogue: card images, Cardmarket/TCGplayer product ids and
 * cheapest listing prices. The files under public/data/cardtrader are written by scripts/cardtrader-sync.mjs
 * from the official API (written permission of CardTrader support, 2026-10-20). Nothing here is persisted in
 * binders or backups; it is looked up at display time and always shown as coming from CardTrader.
 */
export const CARDTRADER_IMAGE_PREFIX = "https://cardtrader.com/uploads/blueprints/image/";
export const CARDTRADER_DATA_PATH = "/data/cardtrader";

/** Price slots in the order written by the sync: five minimum-condition buckets for English, then for German. */
export const PRICE_CONDITIONS = ["near-mint", "excellent", "lightly-played", "played", "any"] as const;
export type PriceCondition = (typeof PRICE_CONDITIONS)[number];

/* Names can contain parentheses ("…-obsidian-flames(2).jpg"); nothing that could leave the image folder. */
const imagePath = z.string().regex(/^\d+\/[A-Za-z0-9._()-]+\.(?:jpe?g|png|webp)$/i);
const blueprintSchema = z.object({
  id: z.number().int().positive(),
  n: z.string(),
  name: z.string(),
  rar: z.string().optional(),
  img: imagePath.optional(),
  cm: z.array(z.number().int().positive()).optional(),
  tp: z.number().int().positive().optional(),
});
export const expansionFileSchema = z.object({
  id: z.number().int().positive(),
  code: z.string(),
  name: z.string(),
  blueprints: z.array(blueprintSchema),
});
export const priceFileSchema = z.object({
  id: z.number().int().positive(),
  currency: z.literal("EUR"),
  slots: z.array(z.string()).length(10),
  p: z.record(z.string(), z.array(z.number().int().nonnegative()).length(10)),
  /** Offers per blueprint: [English, German, 1 when the API's 25-listing limit was reached]. Absent in older files. */
  o: z.record(z.string(), z.tuple([z.number().int().nonnegative(), z.number().int().nonnegative(), z.union([z.literal(0), z.literal(1)])])).optional(),
  /** Seller countries of those offers, cheapest first, as "DE,IT". Absent in older files. */
  c: z.record(z.string(), z.string().regex(/^[A-Z]{2}(?:,[A-Z]{2})*$/)).optional(),
});
export const indexFileSchema = z.record(z.string().regex(/^(?:en|de):.+$/), z.number().int().positive());

export type CardTraderBlueprint = z.infer<typeof blueprintSchema>;
type ExpansionFile = z.infer<typeof expansionFileSchema>;
type PriceFile = z.infer<typeof priceFileSchema>;

/** Collector numbers are padded differently between providers ("001" vs "1"); compare the normalised form. */
export function normalizeCollectorNumber(value: string): string {
  const text = value.trim().toLowerCase().split("/")[0]!.replace(/[^a-z0-9]+/g, "");
  // "0RC1" (a leading zero before the letters) and "RC1" are the same number.
  return text.replace(/^0+(?=[a-z])/, "").replace(/^([a-z]*)0+(\d)/, "$1$2");
}

function normalizeName(value: string): string {
  return value.normalize("NFKD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function cardtraderImageUrl(path: string): string {
  if (!imagePath.safeParse(path).success) throw new Error("Unsupported CardTrader image path.");
  return `${CARDTRADER_IMAGE_PREFIX}${path}`;
}

export interface CardTraderMatch {
  expansionId: number;
  blueprint: CardTraderBlueprint;
}

export interface CardTraderOffers {
  /** Offers in the card's language, among the 25 cheapest the API returns for the card. */
  count: number;
  /** True when the API's 25-listing limit was reached, so there may be more. */
  atLeast: boolean;
  /** ISO country codes of the sellers, cheapest offer first. */
  countries: string[];
}

export interface CardTraderPrice {
  amountMinor: number;
  /** The minimum-condition bucket the price belongs to. */
  condition: PriceCondition;
}

type Loader = (path: string) => Promise<unknown>;

const defaultLoader: Loader = async (path) => {
  const response = await fetch(`${CARDTRADER_DATA_PATH}/${path}`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`CardTrader data ${path}: HTTP ${response.status}`);
  return response.json();
};

export class CardTraderCatalog {
  private index?: Promise<Record<string, number> | undefined>;
  private readonly expansions = new Map<number, Promise<ExpansionFile | undefined>>();
  private readonly prices = new Map<number, Promise<PriceFile | undefined>>();

  constructor(private readonly load: Loader = defaultLoader) {}

  private async safe<T>(path: string, schema: z.ZodType<T>): Promise<T | undefined> {
    try {
      const parsed = schema.safeParse(await this.load(path));
      return parsed.success ? parsed.data : undefined;
    } catch {
      return undefined;
    }
  }

  private expansionFor(language: CardLanguage, setId: string): Promise<number | undefined> {
    this.index ??= this.safe("index.json", indexFileSchema);
    return this.index.then((index) => index?.[`${language}:${setId}`]);
  }

  private expansion(id: number): Promise<ExpansionFile | undefined> {
    let promise = this.expansions.get(id);
    if (!promise) {
      promise = this.safe(`expansions/${id}.json`, expansionFileSchema);
      this.expansions.set(id, promise);
    }
    return promise;
  }

  private priceFile(id: number): Promise<PriceFile | undefined> {
    let promise = this.prices.get(id);
    if (!promise) {
      promise = this.safe(`prices/${id}.json`, priceFileSchema);
      this.prices.set(id, promise);
    }
    return promise;
  }

  /**
   * The blueprint for one card, or undefined. The set mapping is manually verified; within it the collector
   * number must identify exactly one blueprint, or a name hint has to single one out. Never a guess.
   */
  async blueprint(language: CardLanguage, setId: string, collectorNumber: string, nameHint?: string): Promise<CardTraderMatch | undefined> {
    const expansionId = await this.expansionFor(language, setId);
    if (!expansionId) return undefined;
    const expansion = await this.expansion(expansionId);
    if (!expansion) return undefined;
    const number = normalizeCollectorNumber(collectorNumber);
    const candidates = expansion.blueprints.filter((blueprint) => normalizeCollectorNumber(blueprint.n) === number);
    if (candidates.length === 1) return { expansionId, blueprint: candidates[0]! };
    if (candidates.length > 1 && nameHint) {
      const wanted = normalizeName(nameHint);
      const named = candidates.filter((blueprint) => normalizeName(blueprint.name) === wanted);
      if (named.length === 1) return { expansionId, blueprint: named[0]! };
    }
    return undefined;
  }

  /** Cheapest EUR listing at or above the minimum condition, for the card's language. */
  async price(match: CardTraderMatch, language: CardLanguage, minimum: PriceCondition = "excellent"): Promise<CardTraderPrice | undefined> {
    const file = await this.priceFile(match.expansionId);
    const slots = file?.p[String(match.blueprint.id)];
    if (!slots) return undefined;
    const offset = language === "de" ? 5 : 0;
    // Each slot already covers its own condition and everything better. No widening to worse conditions:
    // an estimate for a worse card than the buyer asked for would be misleading, so "no listing" stays unknown.
    const amountMinor = slots[offset + PRICE_CONDITIONS.indexOf(minimum)];
    if (amountMinor && amountMinor > 0) return { amountMinor, condition: minimum };
    return undefined;
  }

  /** How many offers exist in the card's language and from which countries, from the weekly snapshot. */
  async offers(match: CardTraderMatch, language: CardLanguage): Promise<CardTraderOffers | undefined> {
    const file = await this.priceFile(match.expansionId);
    const key = String(match.blueprint.id);
    const entry = file?.o?.[key];
    if (!entry) return undefined;
    const count = entry[language === "de" ? 1 : 0];
    if (count <= 0) return undefined;
    return { count, atLeast: entry[2] === 1, countries: file?.c?.[key]?.split(",") ?? [] };
  }
}

export const cardtraderCatalog = new CardTraderCatalog();
