import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeTags, parseQuery, search, validateCompactIndex } from './search.mjs';
import { FINAL_TAGS } from './final-tags.mjs';

test('maps explicit synonyms to frozen tags', () => {
  assert.deepEqual(parseQuery('at the seaside').mappedTags, ['beach']);
  assert.deepEqual(parseQuery('in the woods').mappedTags, ['forest']);
  assert.deepEqual(parseQuery('flying in cloudy skies').mappedTags.sort(), ['flying', 'sky-clouds']);
});

test('returns unknown concepts for caption fallback', () => {
  const parsed = parseQuery('a pokemon eating in a kitchen');
  assert.deepEqual(parsed.mappedTags, []);
  assert.deepEqual(parsed.unmappedTerms, ['eating', 'kitchen']);
});

test('supports tag alternatives without inventing an exact water type', () => {
  const parsed = parseQuery('pokemon in water at night');
  assert.deepEqual(parsed.mappedGroups[0].anyOfTags, ['water-surface', 'underwater']);
  assert.deepEqual(parsed.mappedGroups[1].anyOfTags, ['night']);
});

test('search requires all tag groups and all caption fallback terms', () => {
  const index = validateCompactIndex({
    version: 1,
    tags: FINAL_TAGS,
    cards: [
      ['a', encodeTags(['multiple-pokemon']), 'Two Pokémon are playing beside a bridge.'],
      ['b', encodeTags(['multiple-pokemon']), 'Two Pokémon rest beside a bridge.'],
      ['c', encodeTags(['forest']), 'A Pokémon is playing beside a bridge.'],
    ],
  });
  const outcome = search(index, 'two pokemon playing on a bridge');
  assert.deepEqual(outcome.unmappedTerms, ['playing', 'bridge']);
  assert.deepEqual(outcome.results.map((result) => result.id), ['a']);
});

test('empty or stop-word-only searches return no results', () => {
  const index = { version: 1, tags: FINAL_TAGS, cards: [['a', 0, 'A card.']] };
  assert.equal(search(index, 'a pokemon card').total, 0);
});

test('caption fallback matches whole words rather than substrings', () => {
  const index = { version: 1, tags: FINAL_TAGS, cards: [['a', 0, 'Rocky terrain under blue sky.']] };
  assert.equal(search(index, 'in the rain').total, 0);
});

test('human queries rank captions that explicitly include Pokémon first', () => {
  const human = encodeTags(['human-present']);
  const index = {
    version: 1,
    tags: FINAL_TAGS,
    cards: [
      ['a', human, 'A trainer stands alone.'],
      ['b', human, 'A trainer stands with several Pokémon.'],
    ],
  };
  assert.deepEqual(search(index, 'a pokemon with a human trainer').results.map((result) => result.id), ['b', 'a']);
});
