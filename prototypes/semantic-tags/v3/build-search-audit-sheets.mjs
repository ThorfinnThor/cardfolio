// Build six temporary overview sheets for visual review of the 30 search queries.
// Usage: node v3/build-search-audit-sheets.mjs <tempDir>
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { buildSheet } from '../sheet.mjs';
import { cropFor } from './sheet-full.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(ROOT, '..', '..', '..');
const tempDir = process.argv[2];
if (!tempDir || path.resolve(tempDir).startsWith(REPO)) throw new Error('tempDir must be outside the repo');

const report = JSON.parse(await fs.readFile(path.join(ROOT, 'out', 'search', 'evaluation.json'), 'utf8'));
await fs.mkdir(tempDir, { recursive: true });

for (let offset = 0; offset < report.evaluations.length; offset += 5) {
  const group = report.evaluations.slice(offset, offset + 5);
  const rows = [];
  for (const evaluation of group) {
    const items = evaluation.top.map((card) => ({
      label: card.id,
      image: card.image,
      crop: cropFor(card),
    }));
    rows.push(await buildSheet(items, {
      title: `${evaluation.number}. ${evaluation.query}`,
      cols: 8,
      cellW: 240,
      cellH: 180,
      labelH: 26,
    }));
  }

  const metadata = await Promise.all(rows.map((row) => sharp(row).metadata()));
  const width = Math.max(...metadata.map((item) => item.width));
  const height = metadata.reduce((sum, item) => sum + item.height, 0);
  let top = 0;
  const composites = rows.map((row, index) => {
    const item = { input: row, left: 0, top };
    top += metadata[index].height;
    return item;
  });
  const part = Math.floor(offset / 5) + 1;
  await sharp({ create: { width, height, channels: 3, background: '#fff' } })
    .composite(composites)
    .jpeg({ quality: 88 })
    .toFile(path.join(tempDir, `search-audit-${part}.jpg`));
  console.log(`search-audit-${part}`, group.reduce((sum, entry) => sum + entry.top.length, 0));
}
