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
  /** Release date of the set, to order cards within one year. */
  date: string;
}

/** How a card name is built; the kinds are told apart by the name alone. */
export type CardKind = "plain" | "mega" | "pair" | "v" | "gx" | "ex" | "delta" | "named";

export interface SpeciesKind {
  kind: CardKind;
  cards: number;
  /** The most frequent card name of this kind. */
  example: string;
}

/** A card picture, referenced on assets.tcgdex.net; nothing is copied or stored. */
export interface CardPhoto {
  id: string;
  name: string;
  setName: string;
  year: number;
  src: string;
}

export interface SpeciesStats {
  cardCount: number;
  setCount: number;
  firstYear: number;
  lastYear: number;
  seriesCount: number;
  topSets: ReadonlyArray<{ setName: string; year: number; cards: number }>;
  topThemes: ReadonlyArray<{ tag: SemanticTag; cards: number }>;
  decades: ReadonlyArray<{ decade: number; cards: number }>;
  busiestYear: { year: number; cards: number };
  oldest: SpeciesCard;
  newest: SpeciesCard;
  kinds: readonly SpeciesKind[];
  examples: readonly SpeciesCard[];
  /** A few of the example cards with their pictures. */
  photos: readonly CardPhoto[];
  dataDate: string;
}

interface SetInfo {
  name: string;
  year: number;
  date: string;
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
    sets.set(item.id, { name: item.name, date: item.releaseDate ?? "", year: Number((item.releaseDate ?? "").slice(0, 4)), seriesId: item.series?.id ?? "" });
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

/** The picture of a card of the English catalogue, or undefined when the id is unknown. */
export function cardPhoto(id: string): CardPhoto | undefined {
  const { rows, sets } = load();
  const row = rows.find((candidate) => candidate[0] === id);
  if (!row) return undefined;
  return {
    id,
    name: row[3],
    setName: row[6],
    year: sets.get(row[5])?.year ?? 0,
    src: `https://assets.tcgdex.net/en/${encodeURIComponent(row[7])}/${encodeURIComponent(row[5])}/${encodeURIComponent(row[4])}/low.webp`,
  };
}

/** Order of the rules matters: a "Mega Gengar ex" is a Mega card, a "Pikachu & Zekrom GX" is a pair. */
export function cardKind(name: string, cardName: string): CardKind {
  if (name.toLowerCase() === cardName.toLowerCase()) return "plain";
  if (/^(Mega|M) /.test(name)) return "mega";
  if (name.includes("&")) return "pair";
  if (/(^|[\s-])(V|VMAX|VSTAR|V-UNION)(\s|$)/.test(name)) return "v";
  if (/(^|\s)GX(\s|$)/.test(name)) return "gx";
  if (/(^|[\s-])(ex|EX)(\s|$)/.test(name)) return "ex";
  if (name.includes("δ")) return "delta";
  return "named";
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
    date: sets.get(row[5])?.date ?? "",
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

  const byDecade = new Map<number, number>();
  const byYear = new Map<number, number>();
  for (const card of cards) {
    const decade = Math.floor(card.year / 10) * 10;
    byDecade.set(decade, (byDecade.get(decade) ?? 0) + 1);
    byYear.set(card.year, (byYear.get(card.year) ?? 0) + 1);
  }
  const chronological = [...cards].sort((a, b) => a.date.localeCompare(b.date) || a.setName.localeCompare(b.setName) || a.number.localeCompare(b.number, "en", { numeric: true }));
  const busiest = [...byYear.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]!;

  const kindNames = new Map<CardKind, Map<string, number>>();
  for (const card of cards) {
    const kind = cardKind(card.name, entry.cardName);
    const names = kindNames.get(kind) ?? new Map<string, number>();
    names.set(card.name, (names.get(card.name) ?? 0) + 1);
    kindNames.set(kind, names);
  }
  const kinds: SpeciesKind[] = [...kindNames.entries()].map(([kind, names]) => ({
    kind,
    cards: [...names.values()].reduce((sum, count) => sum + count, 0),
    example: [...names.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]![0],
  })).sort((a, b) => b.cards - a.cards);

  const examples = pickExamples(cards, 8);

  return {
    decades: [...byDecade.entries()].sort((a, b) => a[0] - b[0]).map(([decade, count]) => ({ decade, cards: count })),
    busiestYear: { year: busiest[0], cards: busiest[1] },
    oldest: chronological[0]!,
    newest: chronological[chronological.length - 1]!,
    kinds,
    cardCount: cards.length,
    setCount: bySet.size,
    firstYear: Math.min(...years),
    lastYear: Math.max(...years),
    seriesCount: series.size,
    topSets: [...bySet.values()].sort((a, b) => b.cards - a.cards || a.year - b.year).slice(0, 5),
    topThemes: [...themeCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([tag, count]) => ({ tag, cards: count })),
    examples,
    photos: [0, 2, 5, 7].flatMap((position) => {
      const card = examples[position];
      const photo = card ? cardPhoto(card.id) : undefined;
      return photo ? [photo] : [];
    }),
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
