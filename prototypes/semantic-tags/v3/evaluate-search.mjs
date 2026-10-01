import fs from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { search, validateCompactIndex } from './search.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SEARCH = path.join(ROOT, 'out', 'search');
const indexPath = path.join(SEARCH, 'compact-index.json');

export const ORIGINAL_QUERIES = [
  'at the beach',
  'in the forest',
  'at night',
  'in the snow',
  'underwater',
  'in space',
  'on a mountain',
  'in a city',
  'sleeping',
  'eating food',
  'flying in the sky',
  'near a volcano',
  'in the rain',
  'in a desert',
  'at sunset',
  'with flowers',
  'in a cave',
  'two pokemon playing together',
  'a pokemon with a human trainer',
  'in a kitchen',
];

export const NEW_QUERIES = [
  'pokemon near a bridge',
  'water at night',
  'pokemon near mountains',
  'a pokemon holding an object',
  'pokemon in a field of grass with clouds',
  'against a dark background',
  'near a building',
  'pokemon swimming',
  'pokemon near fire',
  'pokemon among flowers at night',
];

const bytes = await fs.readFile(indexPath);
const index = validateCompactIndex(JSON.parse(bytes));
const catalog = JSON.parse(await fs.readFile(path.join(ROOT, 'out', 'catalog.json'), 'utf8'));
const metadata = new Map(catalog.cards.map((card) => [card.id, card]));
const queries = [...ORIGINAL_QUERIES, ...NEW_QUERIES];
let slots = 0;

const evaluations = queries.map((query, indexNumber) => {
  const outcome = search(index, query, { limit: 8 });
  slots += outcome.results.length;
  return {
    number: indexNumber + 1,
    group: indexNumber < ORIGINAL_QUERIES.length ? 'original' : 'new',
    query,
    mappedTags: outcome.mappedTags,
    mappedGroups: outcome.mappedGroups,
    unmappedTerms: outcome.unmappedTerms,
    totalMatches: outcome.total,
    top: outcome.results.map((result) => ({
      ...result,
      ...(metadata.get(result.id) ?? {}),
    })),
  };
});

const rawBytes = bytes.length;
const gzipBytes = gzipSync(bytes, { level: 9 }).length;
const size = {
  cards: index.cards.length,
  tags: index.tags.length,
  rawBytes,
  rawMiB: Number((rawBytes / 1024 / 1024).toFixed(3)),
  gzipBytes,
  gzipMiB: Number((gzipBytes / 1024 / 1024).toFixed(3)),
  bytesPerCardRaw: Number((rawBytes / index.cards.length).toFixed(1)),
  bytesPerCardGzip: Number((gzipBytes / index.cards.length).toFixed(1)),
};
const report = {
  generatedAt: new Date().toISOString(),
  cards: index.cards.length,
  queryCount: queries.length,
  requestedTopSlots: queries.length * 8,
  populatedTopSlots: slots,
  unfilledTopSlots: queries.length * 8 - slots,
  emptyQueries: evaluations.filter((entry) => entry.top.length === 0).map((entry) => entry.query),
  size,
  evaluations,
};

await fs.writeFile(path.join(SEARCH, 'evaluation.json'), `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(path.join(SEARCH, 'size.json'), `${JSON.stringify(size, null, 2)}\n`);
console.log(JSON.stringify({
  cards: report.cards,
  queries: report.queryCount,
  populatedTopSlots: report.populatedTopSlots,
  emptyQueries: report.emptyQueries,
  size,
}, null, 2));
