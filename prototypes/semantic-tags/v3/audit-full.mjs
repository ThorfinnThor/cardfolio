// Audit completed Phase B results and prepare deterministic visual samples.
// Usage: node v3/audit-full.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FINAL_TAGS } from './final-tags.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const FULL = path.join(ROOT, 'out', 'full');
const { cards } = JSON.parse(await fs.readFile(path.join(ROOT, 'out', 'catalog.json'), 'utf8'));
const progress = JSON.parse(await fs.readFile(path.join(FULL, 'progress.json'), 'utf8'));
const completedSets = Object.keys(progress.sets);
const expectedCards = cards.filter((card) => completedSets.includes(card.setId));
const expectedById = new Map(expectedCards.map((card) => [card.id, card]));
const tagRank = new Map(FINAL_TAGS.map((tag, index) => [tag, index]));
const all = [];
const schemaErrors = [];

for (const setId of completedSets) {
  const result = JSON.parse(await fs.readFile(path.join(FULL, `${setId}.json`), 'utf8'));
  const expected = expectedCards.filter((card) => card.setId === setId);
  const seen = new Set();
  for (const row of result) {
    const errors = [];
    if (!expectedById.has(row.id) || expectedById.get(row.id).setId !== setId) errors.push('unexpected-id');
    if (seen.has(row.id)) errors.push('duplicate-id');
    seen.add(row.id);
    if (!Array.isArray(row.tags)) errors.push('tags-not-array');
    else {
      if (row.tags.some((tag) => !tagRank.has(tag))) errors.push('unknown-tag');
      if (new Set(row.tags).size !== row.tags.length) errors.push('duplicate-tag');
      const canonical = [...row.tags].sort((a, b) => tagRank.get(a) - tagRank.get(b));
      if (canonical.join('\0') !== row.tags.join('\0')) errors.push('tag-order');
    }
    const words = typeof row.caption === 'string' ? row.caption.trim().split(/\s+/).filter(Boolean).length : 0;
    if (!words || words > 20) errors.push('caption');
    if (errors.length) schemaErrors.push({ id: row.id, setId, errors });
    all.push({ ...row, setId });
  }
  for (const card of expected) {
    if (!seen.has(card.id)) schemaErrors.push({ id: card.id, setId, errors: ['missing-id'] });
  }
}

const byTag = Object.fromEntries(FINAL_TAGS.map((tag) => [tag, all.filter((row) => row.tags.includes(tag))]));
const relationFlags = [];
for (const row of all) {
  const has = (tag) => row.tags.includes(tag);
  if (has('beach') && !has('water-surface')) relationFlags.push({ id: row.id, type: 'beach-without-water-surface' });
  if (has('swimming') && !has('water-surface') && !has('underwater')) relationFlags.push({ id: row.id, type: 'swimming-without-water' });
  if (has('underwater') && has('water-surface')) relationFlags.push({ id: row.id, type: 'underwater-and-water-surface' });
}

const omissionPatterns = {
  beach: /\b(beach|shoreline|seashore)\b/i,
  underwater: /\b(underwater|seabed|coral reef)\b/i,
  forest: /\b(forest|woods|woodland|jungle)\b/i,
  'grassland-field': /\b(meadow|grassland|grassy field|open field|lawn)\b/i,
  'mountain-rocks': /\b(mountain|cliff|canyon|rock formation)\b/i,
  cave: /\b(cave|cavern|rock tunnel)\b/i,
  desert: /\b(desert|sand dunes?|cacti|cactus)\b/i,
  'snow-ice': /\b(snow|snowy|ice|icy|iceberg)\b/i,
  city: /\b(city|cityscape|street|urban)\b/i,
  indoors: /\b(indoors?|interior|inside (a|the) (room|building|lab|kitchen)|bedroom|laboratory)\b/i,
  'ruins-building': /\b(ruins?|temple|pagoda|tower|lighthouse|bridge|castle|house|gate|building)\b/i,
  'sky-clouds': /\b(clouds?|cloudy sky)\b/i,
  night: /\b(night|nighttime|moonlit|starry sky)\b/i,
  'sunset-sunrise': /\b(sunset|sunrise|dawn|dusk|setting sun|rising sun)\b/i,
  'fire-lava': /\b(flames?|fire|lava|magma|eruption|erupting volcano)\b/i,
  flowers: /\b(flowers?|blossoms?)\b/i,
  'food-visible': /\b(food|berries|berry|fruit|meal|cake|sweets?|drink|tea|sandwich|bread)\b/i,
  'human-present': /\b(human|person|people|man|woman|girl|boy|trainer|professor|scientist|grunts?|soldier|maid|breeder|figure)\b/i,
  'multiple-pokemon': /\b(two|three|several|multiple|another|pair of|group of)\b/i,
  sleeping: /\b(sleeping|asleep|napping|curled up asleep)\b/i,
  flying: /\b(flying|flies|airborne|hovers?|soars?|glides? through the air)\b/i,
  swimming: /\b(swimming|swims)\b/i,
};
const omissionFlags = [];
for (const row of all) {
  for (const [tag, pattern] of Object.entries(omissionPatterns)) {
    if (!row.tags.includes(tag) && pattern.test(row.caption)) omissionFlags.push({ id: row.id, tag, caption: row.caption });
  }
}

function hash(value) {
  let h = 2166136261;
  for (const char of value) { h ^= char.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const visualSamples = {};
for (const tag of FINAL_TAGS) {
  const positives = [...byTag[tag]].sort((a, b) => hash(`${tag}:${a.id}`) - hash(`${tag}:${b.id}`)).slice(0, 8);
  const omissions = omissionFlags.filter((flag) => flag.tag === tag).sort((a, b) => hash(`missing:${tag}:${a.id}`) - hash(`missing:${tag}:${b.id}`)).slice(0, 4);
  visualSamples[tag] = { positives: positives.map(({ id, caption }) => ({ id, caption })), omissions };
}

const report = {
  generatedAt: new Date().toISOString(),
  completedSets: completedSets.length,
  expectedCards: expectedCards.length,
  resultRows: all.length,
  schemaErrors,
  tagCounts: Object.fromEntries(FINAL_TAGS.map((tag) => [tag, byTag[tag].length])),
  relationFlags,
  omissionFlags,
  visualSamples,
};
await fs.writeFile(path.join(FULL, 'audit.json'), JSON.stringify(report, null, 1));
console.log(JSON.stringify({
  completedSets: report.completedSets,
  cards: report.resultRows,
  schemaErrors: schemaErrors.length,
  relationFlags: relationFlags.length,
  omissionFlags: omissionFlags.length,
  tagCounts: report.tagCounts,
}, null, 2));
