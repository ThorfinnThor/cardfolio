import { FINAL_TAGS } from './final-tags.mjs';

const TAG_BITS = new Map(FINAL_TAGS.map((tag, index) => [tag, 2 ** index]));

export const TAG_SYNONYMS = Object.freeze([
  { phrases: ['beach', 'seaside', 'shore', 'shoreline', 'coast', 'coastal'], anyOfTags: ['beach'] },
  { phrases: ['water surface', 'surface water'], anyOfTags: ['water-surface'] },
  { phrases: ['water', 'sea', 'ocean', 'lake', 'river', 'pond', 'waves', 'surf'], anyOfTags: ['water-surface', 'underwater'] },
  { phrases: ['underwater', 'submerged', 'seabed'], anyOfTags: ['underwater'] },
  { phrases: ['forest', 'woods', 'woodland', 'jungle'], anyOfTags: ['forest'] },
  { phrases: ['grass', 'grassy', 'field', 'meadow', 'lawn'], anyOfTags: ['grassland-field'] },
  { phrases: ['mountain', 'mountains', 'cliff', 'cliffs', 'peak', 'rock', 'rocks', 'rocky', 'boulder', 'stone'], anyOfTags: ['mountain-rocks'] },
  { phrases: ['cave', 'cavern', 'tunnel'], anyOfTags: ['cave'] },
  { phrases: ['desert', 'dune', 'dunes', 'arid'], anyOfTags: ['desert'] },
  { phrases: ['snow', 'snowy', 'ice', 'icy', 'frozen'], anyOfTags: ['snow-ice'] },
  { phrases: ['city', 'street', 'town', 'urban'], anyOfTags: ['city'] },
  { phrases: ['indoors', 'indoor', 'room', 'interior'], anyOfTags: ['indoors'] },
  { phrases: ['ruins', 'ruin', 'building', 'buildings', 'tower', 'lighthouse', 'castle', 'house', 'gate', 'temple'], anyOfTags: ['ruins-building'] },
  { phrases: ['sky', 'skies', 'cloud', 'clouds', 'cloudy'], anyOfTags: ['sky-clouds'] },
  { phrases: ['night', 'moonlight', 'starry'], anyOfTags: ['night'] },
  { phrases: ['sunset', 'sunrise', 'dusk', 'dawn'], anyOfTags: ['sunset-sunrise'] },
  { phrases: ['fire', 'flame', 'flames', 'lava', 'magma'], anyOfTags: ['fire-lava'] },
  { phrases: ['flower', 'flowers', 'blossom', 'blossoms', 'petals'], anyOfTags: ['flowers'] },
  { phrases: ['food', 'meal', 'berry', 'berries', 'fruit', 'snack'], anyOfTags: ['food-visible'] },
  { phrases: ['human', 'person', 'trainer', 'girl', 'boy', 'man', 'woman', 'child'], anyOfTags: ['human-present'] },
  { phrases: ['two pokemon', 'multiple pokemon', 'pokemon together', 'group of pokemon'], anyOfTags: ['multiple-pokemon'] },
  { phrases: ['sleeping', 'asleep', 'nap', 'napping', 'dozing'], anyOfTags: ['sleeping'] },
  { phrases: ['flying', 'flies', 'soaring', 'airborne'], anyOfTags: ['flying'] },
  { phrases: ['swimming', 'swims'], anyOfTags: ['swimming'] },
]);

export const CAPTION_SYNONYMS = Object.freeze({
  bridge: ['bridge'],
  dark: ['dark', 'shadow', 'shadows', 'dimly lit'],
  eating: ['eat', 'eats', 'eating', 'munch', 'munches', 'munching', 'feeding'],
  holding: ['hold', 'holds', 'holding', 'carry', 'carries', 'carrying', 'clutch', 'clutches'],
  kitchen: ['kitchen', 'cook', 'cooking', 'stove', 'frying pan'],
  playing: ['play', 'plays', 'playing'],
  rain: ['rain', 'raining', 'rainy', 'rainfall'],
  space: ['space', 'planet', 'cosmos', 'galaxy', 'nebula'],
  volcano: ['volcano', 'volcanic', 'lava', 'magma'],
});

const STOP_WORDS = new Set([
  'a', 'among', 'an', 'and', 'art', 'artwork', 'at', 'by', 'card', 'cards', 'for', 'from',
  'against', 'in', 'near', 'of', 'on', 'or', 'over', 'place', 'pokemon', 'scene', 'the',
  'together', 'under', 'with', 'object',
]);

const SYNONYM_PHRASES = TAG_SYNONYMS
  .flatMap(({ phrases, anyOfTags }) => phrases.map((phrase) => ({
    phrase,
    tokens: normalizeText(phrase).split(' '),
    anyOfTags,
  })))
  .sort((left, right) => right.tokens.length - left.tokens.length || right.phrase.length - left.phrase.length);

const CAPTION_TERMS_BY_TAG = new Map(FINAL_TAGS.map((tag) => [
  tag,
  [...new Set(TAG_SYNONYMS
    .filter((entry) => entry.anyOfTags.includes(tag))
    .flatMap((entry) => entry.phrases)
    .map(normalizeText))],
]));

export function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function containsTerm(text, term) {
  return ` ${text} `.includes(` ${term} `);
}

export function encodeTags(tags) {
  return tags.reduce((mask, tag) => {
    const bit = TAG_BITS.get(tag);
    if (!bit) throw new Error(`Unknown semantic tag: ${tag}`);
    return mask | bit;
  }, 0);
}

export function decodeTags(mask) {
  return FINAL_TAGS.filter((tag) => hasTag(mask, tag));
}

export function hasTag(mask, tag) {
  const bit = TAG_BITS.get(tag);
  return Boolean(bit && (mask & bit) === bit);
}

export function parseQuery(query) {
  const normalizedQuery = normalizeText(query);
  const tokens = normalizedQuery ? normalizedQuery.split(' ') : [];
  const consumed = new Set();
  const mappedGroups = [];

  for (const candidate of SYNONYM_PHRASES) {
    for (let start = 0; start <= tokens.length - candidate.tokens.length; start += 1) {
      const indices = candidate.tokens.map((_, offset) => start + offset);
      if (indices.some((index) => consumed.has(index))) continue;
      if (!candidate.tokens.every((token, offset) => tokens[start + offset] === token)) continue;

      indices.forEach((index) => consumed.add(index));
      const key = [...candidate.anyOfTags].sort().join('|');
      if (!mappedGroups.some((group) => group.key === key)) {
        mappedGroups.push({
          key,
          source: candidate.phrase,
          anyOfTags: [...candidate.anyOfTags],
        });
      }
    }
  }

  const unmappedTerms = tokens.filter((token, index) => !consumed.has(index) && !STOP_WORDS.has(token));
  const uniqueUnmappedTerms = [...new Set(unmappedTerms)];
  const mappedTags = [...new Set(mappedGroups.flatMap((group) => group.anyOfTags))];

  return {
    query: String(query ?? ''),
    normalizedQuery,
    mappedTags,
    mappedGroups: mappedGroups.map(({ key: _key, ...group }) => group),
    unmappedTerms: uniqueUnmappedTerms,
  };
}

export function search(index, query, options = {}) {
  const parsed = typeof query === 'string' ? parseQuery(query) : query;
  const limit = Math.max(0, Number(options.limit ?? 24));
  const cards = Array.isArray(index) ? index : index?.cards;
  if (!Array.isArray(cards)) throw new Error('Search index must contain a cards array.');
  if (parsed.mappedGroups.length === 0 && parsed.unmappedTerms.length === 0) {
    return { ...parsed, total: 0, results: [] };
  }

  const captionGroups = parsed.unmappedTerms.map((term) => ({
    term,
    alternatives: (CAPTION_SYNONYMS[term] ?? [term]).map(normalizeText),
  }));
  const normalizedQuery = parsed.normalizedQuery;
  const queryTokens = new Set(normalizedQuery.split(' '));
  const asksForPokemon = queryTokens.has('pokemon');
  const asksForHuman = parsed.mappedTags.includes('human-present');
  const results = [];

  for (const row of cards) {
    const [id, mask, caption = ''] = row;
    if (!parsed.mappedGroups.every((group) => group.anyOfTags.some((tag) => hasTag(mask, tag)))) continue;

    const normalizedCaption = normalizeText(caption);
    if (!captionGroups.every((group) => group.alternatives.some((alternative) => containsTerm(normalizedCaption, alternative)))) continue;

    const matchedTags = parsed.mappedTags.filter((tag) => hasTag(mask, tag));
    let score = parsed.mappedGroups.length * 100 + captionGroups.length * 120 + matchedTags.length * 5;
    if (normalizedQuery && containsTerm(normalizedCaption, normalizedQuery)) score += 30;
    for (const tag of matchedTags) {
      if (CAPTION_TERMS_BY_TAG.get(tag).some((term) => containsTerm(normalizedCaption, term))) score += 15;
    }
    for (const group of captionGroups) {
      if (containsTerm(normalizedCaption, group.term)) score += 10;
    }
    // Prefer specific human-written descriptions over the intentionally terse
    // fallback captions used for the 30th-anniversary source batch.
    if (normalizedCaption.startsWith('artwork shows ')) score -= 30;
    if (asksForPokemon && asksForHuman && containsTerm(normalizedCaption, 'pokemon')) score += 60;
    if (asksForPokemon && !asksForHuman && hasTag(mask, 'human-present')) score -= 50;
    if (asksForPokemon && parsed.unmappedTerms.includes('holding') && /\b(robotic|mechanical)\b/.test(normalizedCaption)) score -= 50;

    results.push({
      id,
      score,
      tags: decodeTags(mask),
      caption,
    });
  }

  results.sort((left, right) => right.score - left.score || left.id.localeCompare(right.id));
  return {
    ...parsed,
    total: results.length,
    results: results.slice(0, limit),
  };
}

export function validateCompactIndex(index) {
  if (!index || index.version !== 1 || !Array.isArray(index.tags) || !Array.isArray(index.cards)) {
    throw new Error('Invalid compact search index.');
  }
  if (index.tags.join('\n') !== FINAL_TAGS.join('\n')) {
    throw new Error('Search index tag order differs from the frozen v3 tag order.');
  }
  for (const row of index.cards) {
    if (!Array.isArray(row) || row.length !== 3 || typeof row[0] !== 'string' || !Number.isInteger(row[1]) || typeof row[2] !== 'string') {
      throw new Error('Invalid compact card row.');
    }
  }
  return index;
}
