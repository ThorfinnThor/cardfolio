// Build the agreed Phase B quality sample: 10 sets x 24 cards.
// Usage: node v3/build-random-audit-sheets.mjs <tempDir>
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSheet } from '../sheet.mjs';
import { cropFor } from './sheet-full.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(ROOT, '..', '..', '..');
const tempDir = process.argv[2];
if (!tempDir || path.resolve(tempDir).startsWith(REPO)) throw new Error('tempDir must be outside the repo');
const { cards, sets } = JSON.parse(await fs.readFile(path.join(ROOT, 'out', 'catalog.json'), 'utf8'));
const setById = new Map(sets.map((set) => [set.id, set]));
const full = path.join(ROOT, 'out', 'full');
const selectedSets = ['base1', 'gym2', 'neo3', 'ecard2', 'ex4', 'ex10', 'ex16', 'dp3', 'pl2', 'bw2'];
const code = new Map([
  ['beach', 'B'], ['water-surface', 'W'], ['underwater', 'U'], ['forest', 'F'], ['grassland-field', 'G'],
  ['mountain-rocks', 'M'], ['cave', 'C'], ['desert', 'D'], ['snow-ice', 'S'], ['city', 'Y'], ['indoors', 'I'],
  ['ruins-building', 'R'], ['sky-clouds', 'K'], ['night', 'N'], ['sunset-sunrise', 'T'], ['fire-lava', 'L'],
  ['flowers', 'O'], ['food-visible', 'E'], ['human-present', 'H'], ['multiple-pokemon', 'P'], ['sleeping', 'Z'],
  ['flying', 'A'], ['swimming', 'Q'],
]);
function hash(value) {
  let h = 2166136261;
  for (const char of value) { h ^= char.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
await fs.mkdir(tempDir, { recursive: true });
const manifest = { legend: Object.fromEntries(code), sets: {} };
for (const setId of selectedSets) {
  const result = JSON.parse(await fs.readFile(path.join(full, `${setId}.json`), 'utf8'));
  const byId = new Map(result.map((row) => [row.id, row]));
  const sample = cards.filter((card) => card.setId === setId)
    .sort((a, b) => hash(`quality:${a.id}`) - hash(`quality:${b.id}`))
    .slice(0, 24);
  manifest.sets[setId] = sample.map((card) => byId.get(card.id));
  for (let offset = 0; offset < sample.length; offset += 12) {
    const chunk = sample.slice(offset, offset + 12);
    const items = chunk.map((card) => {
      const row = byId.get(card.id);
      return {
        label: `${card.id} [${row.tags.map((tag) => code.get(tag)).join('') || '-'}]`,
        image: card.image,
        crop: cropFor(card, setById.get(setId)?.official ?? null),
      };
    });
    const part = offset / 12 + 1;
    await fs.writeFile(path.join(tempDir, `${setId}-${part}.jpg`), await buildSheet(items, { title: `${setId} quality sample ${part}` }));
  }
  console.log(setId, sample.length);
}
await fs.writeFile(path.join(tempDir, 'manifest.json'), JSON.stringify(manifest, null, 1));
