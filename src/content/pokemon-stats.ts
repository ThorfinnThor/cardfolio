import { readFileSync } from "node:fs";
import path from "node:path";

import { SEMANTIC_TAGS, type SemanticTag } from "@/domain/semantic-card-search";

import { SPECIES, type SpeciesEntry } from "./pokemon-species";

/** A page is only published when the catalogue holds enough material to say something real about it. */
export const MIN_CARDS = 30;
export const MIN_SETS = 8;

export interface SpeciesCard {
  id: string;
  name: string;
  number: string;
  setName: string;
  year: number;
}

export interface SpeciesStats {
  cardCount: number;
  setCount: number;
  firstYear: number;
  lastYear: number;
  seriesCount: number;
  topSets: ReadonlyArray<{ setName: string; year: number; cards: number }>;
  topThemes: ReadonlyArray<{ tag: SemanticTag; cards: number }>;
  examples: readonly SpeciesCard[];
  dataDate: string;
}

interface SetInfo {
  name: string;
  year: number;
  seriesId: string;
}

type Row = [string, number, string, string, string, string, string, string];

const GENERIC_THEMES = new Set<SemanticTag>(["human-present", "multiple-pokemon", "indoors"]);

let cache: { rows: Row[]; sets: Map<string, SetInfo>; dataDate: string } | undefined;

function load() {
  if (cache) return cache;
  const root = path.join(process.cwd(), "public", "data");
  const index = JSON.parse(readFileSync(path.join(root, "semantic", "card-artwork-search-v1.json"), "utf8")) as { generatedAt: string; cards: Row[] };
  const setFile = JSON.parse(readFileSync(path.join(root, "catalog", "en-sets.json"), "utf8")) as {
    items: Array<{ id: string; name: string; releaseDate?: string; series?: { id: string } }>;
  };
  const sets = new Map<string, SetInfo>();
  for (const item of setFile.items) {
    sets.set(item.id, { name: item.name, year: Number((item.releaseDate ?? "").slice(0, 4)), seriesId: item.series?.id ?? "" });
  }
  cache = { rows: index.cards, sets, dataDate: index.generatedAt };
  return cache;
}

function nameMatcher(cardName: string): RegExp {
  return new RegExp(`(?<![\\p{L}\\p{N}])${cardName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}])`, "iu");
}

/** Spreads the examples over the years instead of listing the first few cards of one set. */
function pickExamples(cards: SpeciesCard[], count: number): SpeciesCard[] {
  const sorted = [...cards].sort((a, b) => a.year - b.year || a.setName.localeCompare(b.setName) || a.number.localeCompare(b.number, "en", { numeric: true }));
  const picked: SpeciesCard[] = [];
  const seenSets = new Set<string>();
  const step = sorted.length / count;
  for (let i = 0; i < count; i += 1) {
    const start = Math.floor(i * step);
    for (let offset = 0; offset < sorted.length; offset += 1) {
      const candidate = sorted[(start + offset) % sorted.length]!;
      if (!seenSets.has(candidate.setName)) {
        seenSets.add(candidate.setName);
        picked.push(candidate);
        break;
      }
    }
  }
  return picked.sort((a, b) => a.year - b.year);
}

export function computeSpeciesStats(entry: SpeciesEntry): SpeciesStats | undefined {
  const { rows, sets, dataDate } = load();
  const matcher = nameMatcher(entry.cardName);
  const matched = rows.filter((row) => matcher.test(row[3]));
  if (matched.length === 0) return undefined;

  const cards: SpeciesCard[] = matched.map((row) => ({
    id: row[0],
    name: row[3],
    number: row[4],
    setName: row[6],
    year: sets.get(row[5])?.year ?? 0,
  })).filter((card) => card.year > 0);

  const bySet = new Map<string, { setName: string; year: number; cards: number }>();
  for (const card of cards) {
    const current = bySet.get(card.setName) ?? { setName: card.setName, year: card.year, cards: 0 };
    current.cards += 1;
    bySet.set(card.setName, current);
  }
  const years = cards.map((card) => card.year);
  const series = new Set(matched.map((row) => row[7]));

  const themeCounts = new Map<SemanticTag, number>();
  SEMANTIC_TAGS.forEach((tag, index) => {
    if (GENERIC_THEMES.has(tag)) return;
    const bit = 2 ** index;
    const count = matched.filter((row) => Math.floor(row[1] / bit) % 2 === 1).length;
    if (count > 0) themeCounts.set(tag, count);
  });

  return {
    cardCount: cards.length,
    setCount: bySet.size,
    firstYear: Math.min(...years),
    lastYear: Math.max(...years),
    seriesCount: series.size,
    topSets: [...bySet.values()].sort((a, b) => b.cards - a.cards || a.year - b.year).slice(0, 5),
    topThemes: [...themeCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([tag, count]) => ({ tag, cards: count })),
    examples: pickExamples(cards, 8),
    dataDate,
  };
}

export function isPublishable(stats: SpeciesStats | undefined): stats is SpeciesStats {
  return Boolean(stats && stats.cardCount >= MIN_CARDS && stats.setCount >= MIN_SETS);
}

export interface PublishedSpecies {
  entry: SpeciesEntry;
  stats: SpeciesStats;
}

/** Every Pokémon that has both hand-written text and enough catalogue data. */
export function publishedSpecies(): PublishedSpecies[] {
  return SPECIES.flatMap((entry) => {
    const stats = computeSpeciesStats(entry);
    return isPublishable(stats) ? [{ entry, stats }] : [];
  });
}
