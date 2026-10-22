// Usage: node v3/build-full-sheets.mjs count <setId>
//        node v3/build-full-sheets.mjs <tempDir> <setId> <firstSheet> <lastSheet>
// Contact sheets (12 artwork crops, 4x3, labelled with card id) for one set of the full EN catalogue.
// Written only to a temp dir outside the repo; delete right after tagging.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSheet } from '../sheet.mjs';
import { cropFor } from './sheet-full.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(ROOT, '..', '..', '..');
const { cards, sets } = JSON.parse(await fs.readFile(path.join(ROOT, 'out', 'catalog.json'), 'utf8'));
const PER = 12;
const [a, setId, first, last] = process.argv.slice(2);
const setCards = cards.filter((c) => c.setId === setId);
if (!setCards.length) throw new Error(`unknown or empty set ${setId}`);
const official = sets.find((s) => s.id === setId)?.official ?? null;
const nSheets = Math.ceil(setCards.length / PER);
if (a === 'count') { console.log(nSheets); process.exit(0); }
if (!a || path.resolve(a).startsWith(REPO)) throw new Error('tempDir must be outside the repo');
for (let s = +first; s <= +last && s < nSheets; s++) {
  const chunk = setCards.slice(s * PER, (s + 1) * PER);
  const items = chunk.map((c) => { const crop = cropFor(c, official); return { label: crop ? c.id : `${c.id} (whole card)`, image: c.image, crop }; });
  const base = path.join(a, `${setId}-sheet-${String(s).padStart(3, '0')}`);
  await fs.writeFile(`${base}.jpg`, await buildSheet(items));
  await fs.writeFile(`${base}.json`, JSON.stringify(chunk.map((c) => c.id)));
}
