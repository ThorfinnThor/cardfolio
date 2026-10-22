import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FINAL_TAGS } from './final-tags.mjs';
import { encodeTags, validateCompactIndex } from './search.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const FULL = path.join(ROOT, 'out', 'full');
const SEARCH = path.join(ROOT, 'out', 'search');
const progress = JSON.parse(await fs.readFile(path.join(FULL, 'progress.json'), 'utf8'));
const cards = [];
const seen = new Set();

for (const setId of Object.keys(progress.sets).sort()) {
  const rows = JSON.parse(await fs.readFile(path.join(FULL, `${setId}.json`), 'utf8'));
  for (const row of rows) {
    if (seen.has(row.id)) throw new Error(`Duplicate card id: ${row.id}`);
    seen.add(row.id);
    cards.push([row.id, encodeTags(row.tags), row.caption]);
  }
}

cards.sort((left, right) => left[0].localeCompare(right[0]));
const index = validateCompactIndex({
  version: 1,
  tags: FINAL_TAGS,
  cards,
});

if (cards.length !== progress.totals.valid) {
  throw new Error(`Expected ${progress.totals.valid} valid cards, built ${cards.length}.`);
}

await fs.mkdir(SEARCH, { recursive: true });
const target = path.join(SEARCH, 'compact-index.json');
await fs.writeFile(target, `${JSON.stringify(index)}\n`);
console.log(JSON.stringify({ target, cards: cards.length, tags: FINAL_TAGS.length }, null, 2));
