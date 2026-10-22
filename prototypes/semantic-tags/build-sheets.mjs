// Usage: node build-sheets.mjs <outDir> <firstSheet> <lastSheet>
// Writes sheet-NNN.jpg (12 artwork crops, 4x3, labelled with card id) into <outDir>, which must be
// a temp directory outside the repo. Delete the sheets right after they are tagged.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSheet, cropFor } from './sheet.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const [outDir, first, last] = [process.argv[2], +process.argv[3], +process.argv[4]];
if (!outDir || outDir.startsWith(path.resolve(ROOT, '..', '..'))) throw new Error('outDir must be a temp dir outside the repo');
const { cards } = JSON.parse(await fs.readFile(path.join(ROOT, '../semantic-search/out/cards.json'), 'utf8'));
const PER = 12;
for (let s = first; s <= last && s * PER < cards.length; s++) {
  const chunk = cards.slice(s * PER, (s + 1) * PER);
  const items = chunk.map((c) => { const crop = cropFor(c); return { label: crop ? c.id : `${c.id} (whole card)`, image: c.image, crop }; });
  await fs.writeFile(path.join(outDir, `sheet-${String(s).padStart(3, '0')}.jpg`), await buildSheet(items));
  await fs.writeFile(path.join(outDir, `sheet-${String(s).padStart(3, '0')}.json`), JSON.stringify(chunk.map((c) => ({ id: c.id, name: c.name, setId: c.setId }))));
}
