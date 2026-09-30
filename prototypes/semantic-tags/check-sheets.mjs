// Usage: node check-sheets.mjs <tempDir>
// For the honesty self-check: one sheet per query with its top 8 (artwork crops), written to a temp
// directory outside the repo. Delete right after reviewing.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSheet, cropFor } from './sheet.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const outDir = process.argv[2];
if (!outDir || outDir.startsWith(path.resolve(ROOT, '..', '..'))) throw new Error('outDir must be a temp dir outside the repo');
const { results } = JSON.parse(await fs.readFile(path.join(ROOT, 'out/results.json'), 'utf8'));
let i = 0;
for (const [q, r] of Object.entries(results)) {
  const items = r.top8.map((c, k) => ({ label: `${k + 1}. ${c.id}`, image: c.image, crop: cropFor(c) }));
  await fs.writeFile(path.join(outDir, `check-${String(i++).padStart(2, '0')}.jpg`), await buildSheet(items, { title: q, cellW: 400, cellH: 285 }));
}
