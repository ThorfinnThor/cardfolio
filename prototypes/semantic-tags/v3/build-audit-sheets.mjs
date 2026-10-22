// Build one deterministic visual-audit sheet per final tag.
// Usage: node v3/build-audit-sheets.mjs <tempDir>
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
const audit = JSON.parse(await fs.readFile(path.join(ROOT, 'out', 'full', 'audit.json'), 'utf8'));
const byId = new Map(cards.map((card) => [card.id, card]));
const officialBySet = new Map(sets.map((set) => [set.id, set.official ?? null]));
await fs.mkdir(tempDir, { recursive: true });

for (const [index, [tag, sample]] of Object.entries(audit.visualSamples).entries()) {
  const rows = [
    ...sample.positives.map((row) => ({ ...row, kind: 'tagged' })),
    ...sample.omissions.map((row) => ({ ...row, kind: 'possible omission' })),
  ];
  const items = rows.map((row) => {
    const card = byId.get(row.id);
    if (!card) throw new Error(`unknown card ${row.id}`);
    return {
      label: `${row.id} | ${row.kind}`,
      image: card.image,
      crop: cropFor(card, officialBySet.get(card.setId)),
    };
  });
  const name = `${String(index + 1).padStart(2, '0')}-${tag}`;
  await fs.writeFile(path.join(tempDir, `${name}.jpg`), await buildSheet(items, { title: tag }));
  await fs.writeFile(path.join(tempDir, `${name}.json`), JSON.stringify(rows, null, 1));
  console.log(name, items.length);
}

for (let offset = 0; offset < audit.relationFlags.length; offset += 12) {
  const rows = audit.relationFlags.slice(offset, offset + 12);
  const items = rows.map((row) => {
    const card = byId.get(row.id);
    if (!card) throw new Error(`unknown card ${row.id}`);
    return {
      label: `${row.id} | ${row.type}`,
      image: card.image,
      crop: cropFor(card, officialBySet.get(card.setId)),
    };
  });
  const part = Math.floor(offset / 12) + 1;
  await fs.writeFile(path.join(tempDir, `relations-${part}.jpg`), await buildSheet(items, { title: `relation flags ${part}` }));
  await fs.writeFile(path.join(tempDir, `relations-${part}.json`), JSON.stringify(rows, null, 1));
  console.log(`relations-${part}`, items.length);
}

const omissionTags = [
  'city', 'grassland-field', 'mountain-rocks', 'cave', 'desert', 'ruins-building',
  'night', 'sunset-sunrise', 'food-visible', 'sleeping', 'swimming',
  'forest', 'snow-ice', 'flying',
];
for (const tag of omissionTags) {
  const rows = audit.omissionFlags.filter((row) => row.tag === tag);
  for (let offset = 0; offset < rows.length; offset += 12) {
    const chunk = rows.slice(offset, offset + 12);
    const items = chunk.map((row) => {
      const card = byId.get(row.id);
      if (!card) throw new Error(`unknown card ${row.id}`);
      return {
        label: `${row.id} | possible ${tag}`,
        image: card.image,
        crop: cropFor(card, officialBySet.get(card.setId)),
      };
    });
    const part = Math.floor(offset / 12) + 1;
    await fs.writeFile(path.join(tempDir, `omissions-${tag}-${part}.jpg`), await buildSheet(items, { title: `possible omissions: ${tag} ${part}` }));
    await fs.writeFile(path.join(tempDir, `omissions-${tag}-${part}.json`), JSON.stringify(chunk, null, 1));
    console.log(`omissions-${tag}-${part}`, items.length);
  }
}
