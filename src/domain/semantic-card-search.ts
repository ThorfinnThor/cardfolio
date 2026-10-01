export const SEMANTIC_TAGS = [
  "beach",
  "water-surface",
  "underwater",
  "forest",
  "grassland-field",
  "mountain-rocks",
  "cave",
  "desert",
  "snow-ice",
  "city",
  "indoors",
  "ruins-building",
  "sky-clouds",
  "night",
  "sunset-sunrise",
  "fire-lava",
  "flowers",
  "food-visible",
  "human-present",
  "multiple-pokemon",
  "sleeping",
  "flying",
  "swimming",
] as const;

export type SemanticTag = (typeof SEMANTIC_TAGS)[number];

export const SEMANTIC_TAG_LABELS: Readonly<Record<SemanticTag, string>> = {
  beach: "Strand",
  "water-surface": "Wasseroberfläche",
  underwater: "Unter Wasser",
  forest: "Wald",
  "grassland-field": "Wiese / Feld",
  "mountain-rocks": "Berge / Felsen",
  cave: "Höhle",
  desert: "Wüste",
  "snow-ice": "Schnee / Eis",
  city: "Stadt",
  indoors: "Innenraum",
  "ruins-building": "Gebäude / Ruinen",
  "sky-clouds": "Himmel / Wolken",
  night: "Nacht",
  "sunset-sunrise": "Sonnenauf- / -untergang",
  "fire-lava": "Feuer / Lava",
  flowers: "Blumen",
  "food-visible": "Essen sichtbar",
  "human-present": "Mensch / Trainer",
  "multiple-pokemon": "Mehrere Pokémon",
  sleeping: "Schlafend",
  flying: "Fliegend",
  swimming: "Schwimmend",
};

export type SemanticCardRow = readonly [
  id: string,
  tagMask: number,
  caption: string,
  name: string,
  collectorNumber: string,
  setId: string,
  setName: string,
  seriesId: string,
];

export interface SemanticSearchIndex {
  version: 1;
  source: string;
  generatedAt: string;
  tags: readonly SemanticTag[];
  cards: readonly SemanticCardRow[];
}

export interface ParsedSemanticQuery {
  normalizedQuery: string;
  mappedGroups: ReadonlyArray<{ source: string; anyOfTags: readonly SemanticTag[] }>;
  mappedTags: readonly SemanticTag[];
  unmappedTerms: readonly string[];
}

export interface SemanticSearchResult {
  row: SemanticCardRow;
  score: number;
  tags: readonly SemanticTag[];
}

const TAG_BITS = new Map<SemanticTag, number>(SEMANTIC_TAGS.map((tag, index) => [tag, 2 ** index]));

const TAG_SYNONYMS: ReadonlyArray<{ phrases: readonly string[]; anyOfTags: readonly SemanticTag[] }> = [
  { phrases: ["beach", "seaside", "shore", "shoreline", "coast", "coastal", "strand", "kuste"], anyOfTags: ["beach"] },
  { phrases: ["water surface", "surface water", "wasseroberflache"], anyOfTags: ["water-surface"] },
  { phrases: ["water", "sea", "ocean", "lake", "river", "pond", "waves", "surf", "wasser", "meer", "see", "fluss", "wellen"], anyOfTags: ["water-surface", "underwater"] },
  { phrases: ["underwater", "submerged", "seabed", "unterwasser", "unter wasser", "meeresboden"], anyOfTags: ["underwater"] },
  { phrases: ["forest", "woods", "woodland", "jungle", "wald", "dschungel"], anyOfTags: ["forest"] },
  { phrases: ["grass", "grassy", "field", "meadow", "lawn", "gras", "wiese", "feld"], anyOfTags: ["grassland-field"] },
  { phrases: ["mountain", "mountains", "cliff", "cliffs", "peak", "rock", "rocks", "rocky", "boulder", "stone", "berg", "berge", "felsen", "klippe", "stein"], anyOfTags: ["mountain-rocks"] },
  { phrases: ["cave", "cavern", "tunnel", "hohle", "hoehle"], anyOfTags: ["cave"] },
  { phrases: ["desert", "dune", "dunes", "arid", "wuste", "wueste", "dune"], anyOfTags: ["desert"] },
  { phrases: ["snow", "snowy", "ice", "icy", "frozen", "schnee", "eis", "gefroren"], anyOfTags: ["snow-ice"] },
  { phrases: ["city", "street", "town", "urban", "stadt", "strasse"], anyOfTags: ["city"] },
  { phrases: ["indoors", "indoor", "room", "interior", "innenraum", "drinnen", "zimmer"], anyOfTags: ["indoors"] },
  { phrases: ["ruins", "ruin", "building", "buildings", "tower", "lighthouse", "castle", "house", "gate", "temple", "ruine", "ruinen", "gebaude", "gebaeude", "turm", "leuchtturm", "schloss", "haus", "tempel"], anyOfTags: ["ruins-building"] },
  { phrases: ["sky", "skies", "cloud", "clouds", "cloudy", "himmel", "wolke", "wolken"], anyOfTags: ["sky-clouds"] },
  { phrases: ["night", "moonlight", "starry", "nacht", "mondlicht", "sternenklar"], anyOfTags: ["night"] },
  { phrases: ["sunset", "sunrise", "dusk", "dawn", "sonnenuntergang", "sonnenaufgang", "dammerung", "daemmerung"], anyOfTags: ["sunset-sunrise"] },
  { phrases: ["fire", "flame", "flames", "lava", "magma", "feuer", "flamme", "flammen"], anyOfTags: ["fire-lava"] },
  { phrases: ["flower", "flowers", "blossom", "blossoms", "petals", "blume", "blumen", "blute", "bluete"], anyOfTags: ["flowers"] },
  { phrases: ["food", "meal", "berry", "berries", "fruit", "snack", "essen", "mahlzeit", "beere", "beeren", "frucht"], anyOfTags: ["food-visible"] },
  { phrases: ["human", "person", "trainer", "girl", "boy", "man", "woman", "child", "mensch", "person", "madchen", "maedchen", "junge", "mann", "frau", "kind"], anyOfTags: ["human-present"] },
  { phrases: ["two pokemon", "multiple pokemon", "pokemon together", "group of pokemon", "zwei pokemon", "mehrere pokemon", "pokemon zusammen", "pokemon gruppe"], anyOfTags: ["multiple-pokemon"] },
  { phrases: ["sleeping", "asleep", "nap", "napping", "dozing", "schlafend", "schlaft", "schlaeft"], anyOfTags: ["sleeping"] },
  { phrases: ["flying", "flies", "soaring", "airborne", "fliegend", "fliegt"], anyOfTags: ["flying"] },
  { phrases: ["swimming", "swims", "schwimmend", "schwimmt"], anyOfTags: ["swimming"] },
];

const CAPTION_SYNONYMS: Readonly<Record<string, readonly string[]>> = {
  bridge: ["bridge"],
  brucke: ["bridge"],
  dark: ["dark", "shadow", "shadows", "dimly lit"],
  dunkel: ["dark", "shadow", "shadows", "dimly lit"],
  eating: ["eat", "eats", "eating", "munch", "munches", "munching", "feeding"],
  isst: ["eat", "eats", "eating", "munch", "munches", "munching", "feeding"],
  holding: ["hold", "holds", "holding", "carry", "carries", "carrying", "clutch", "clutches"],
  halt: ["hold", "holds", "holding", "carry", "carries", "carrying", "clutch", "clutches"],
  kitchen: ["kitchen", "cook", "cooking", "stove", "frying pan"],
  kuche: ["kitchen", "cook", "cooking", "stove", "frying pan"],
  playing: ["play", "plays", "playing"],
  spielt: ["play", "plays", "playing"],
  rain: ["rain", "raining", "rainy", "rainfall"],
  regen: ["rain", "raining", "rainy", "rainfall"],
  space: ["space", "planet", "cosmos", "galaxy", "nebula"],
  weltraum: ["space", "planet", "cosmos", "galaxy", "nebula"],
  volcano: ["volcano", "volcanic", "lava", "magma"],
  vulkan: ["volcano", "volcanic", "lava", "magma"],
};

const STOP_WORDS = new Set([
  "a", "among", "an", "and", "art", "artwork", "at", "by", "card", "cards", "for", "from", "against", "in", "near", "of", "on", "or", "over", "place", "pokemon", "scene", "the", "together", "under", "with", "object",
  "am", "an", "auf", "bei", "bild", "darstellung", "der", "die", "ein", "eine", "einer", "einem", "einen", "gegen", "im", "in", "ist", "karte", "karten", "mit", "motiv", "neben", "oder", "pokemon", "szene", "uber", "ueber", "und", "unter", "von", "vor", "zu", "zusammen",
]);

export function normalizeSemanticText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function containsTerm(text: string, term: string): boolean {
  return ` ${text} `.includes(` ${term} `);
}

const SYNONYM_PHRASES = TAG_SYNONYMS
  .flatMap(({ phrases, anyOfTags }) => phrases.map((phrase) => ({
    phrase,
    tokens: normalizeSemanticText(phrase).split(" "),
    anyOfTags,
  })))
  .sort((left, right) => right.tokens.length - left.tokens.length || right.phrase.length - left.phrase.length);

const CAPTION_TERMS_BY_TAG = new Map<SemanticTag, readonly string[]>(SEMANTIC_TAGS.map((tag) => [
  tag,
  [...new Set(TAG_SYNONYMS
    .filter((entry) => entry.anyOfTags.includes(tag))
    .flatMap((entry) => entry.phrases)
    .map(normalizeSemanticText))],
]));

export function hasSemanticTag(mask: number, tag: SemanticTag): boolean {
  const bit = TAG_BITS.get(tag);
  return Boolean(bit && (mask & bit) === bit);
}

export function decodeSemanticTags(mask: number): SemanticTag[] {
  return SEMANTIC_TAGS.filter((tag) => hasSemanticTag(mask, tag));
}

export function parseSemanticQuery(query: string): ParsedSemanticQuery {
  const normalizedQuery = normalizeSemanticText(query);
  const tokens = normalizedQuery ? normalizedQuery.split(" ") : [];
  const consumed = new Set<number>();
  const mappedGroups: Array<{ key: string; source: string; anyOfTags: readonly SemanticTag[] }> = [];

  for (const candidate of SYNONYM_PHRASES) {
    for (let start = 0; start <= tokens.length - candidate.tokens.length; start += 1) {
      const indices = candidate.tokens.map((_, offset) => start + offset);
      if (indices.some((index) => consumed.has(index))) continue;
      if (!candidate.tokens.every((token, offset) => tokens[start + offset] === token)) continue;
      indices.forEach((index) => consumed.add(index));
      const key = [...candidate.anyOfTags].sort().join("|");
      if (!mappedGroups.some((group) => group.key === key)) {
        mappedGroups.push({ key, source: candidate.phrase, anyOfTags: candidate.anyOfTags });
      }
    }
  }

  const unmappedTerms = [...new Set(tokens.filter((token, index) => !consumed.has(index) && !STOP_WORDS.has(token)))];
  return {
    normalizedQuery,
    mappedGroups: mappedGroups.map(({ source, anyOfTags }) => ({ source, anyOfTags })),
    mappedTags: [...new Set(mappedGroups.flatMap((group) => group.anyOfTags))],
    unmappedTerms,
  };
}

export function searchSemanticCards(
  index: SemanticSearchIndex,
  query: string,
  options: { requiredTags?: readonly SemanticTag[]; limit?: number } = {},
): { total: number; parsed: ParsedSemanticQuery; results: SemanticSearchResult[] } {
  const parsed = parseSemanticQuery(query);
  const requiredTags = [...new Set(options.requiredTags ?? [])];
  const limit = Math.max(0, Math.floor(options.limit ?? 20));
  if (!parsed.mappedGroups.length && !parsed.unmappedTerms.length && !requiredTags.length) {
    return { total: 0, parsed, results: [] };
  }

  const captionGroups = parsed.unmappedTerms.map((term) => ({
    term,
    alternatives: (CAPTION_SYNONYMS[term] ?? [term]).map(normalizeSemanticText),
  }));
  const queryTokens = new Set(parsed.normalizedQuery.split(" "));
  const asksForPokemon = queryTokens.has("pokemon");
  const asksForHuman = parsed.mappedTags.includes("human-present") || requiredTags.includes("human-present");
  const results: SemanticSearchResult[] = [];

  for (const row of index.cards) {
    const [, mask, caption] = row;
    if (!requiredTags.every((tag) => hasSemanticTag(mask, tag))) continue;
    if (!parsed.mappedGroups.every((group) => group.anyOfTags.some((tag) => hasSemanticTag(mask, tag)))) continue;

    const normalizedCaption = normalizeSemanticText(caption);
    if (!captionGroups.every((group) => group.alternatives.some((alternative) => containsTerm(normalizedCaption, alternative)))) continue;

    const matchedTags = parsed.mappedTags.filter((tag) => hasSemanticTag(mask, tag));
    let score = requiredTags.length * 110 + parsed.mappedGroups.length * 100 + captionGroups.length * 120 + matchedTags.length * 5;
    if (parsed.normalizedQuery && containsTerm(normalizedCaption, parsed.normalizedQuery)) score += 30;
    for (const tag of [...requiredTags, ...matchedTags]) {
      if (CAPTION_TERMS_BY_TAG.get(tag)?.some((term) => containsTerm(normalizedCaption, term))) score += 15;
    }
    for (const group of captionGroups) {
      if (containsTerm(normalizedCaption, group.term)) score += 10;
    }
    if (normalizedCaption.startsWith("artwork shows ")) score -= 30;
    if (asksForPokemon && asksForHuman && containsTerm(normalizedCaption, "pokemon")) score += 60;
    if (asksForPokemon && !asksForHuman && hasSemanticTag(mask, "human-present")) score -= 50;
    if (asksForPokemon && parsed.unmappedTerms.includes("holding") && /\b(robotic|mechanical)\b/.test(normalizedCaption)) score -= 50;

    results.push({ row, score, tags: decodeSemanticTags(mask) });
  }

  results.sort((left, right) => right.score - left.score || left.row[0].localeCompare(right.row[0]));
  return { total: results.length, parsed, results: results.slice(0, limit) };
}
