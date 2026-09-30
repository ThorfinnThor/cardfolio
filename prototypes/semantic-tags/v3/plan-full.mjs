// Pack all EN sets into agent jobs of at most ~MAX sheets (12 cards per sheet). Sets already done are skipped.
// Usage: node v3/plan-full.mjs [maxSheets=36]  -> prints JSON list of jobs [{sets:[...], sheets}]
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const MAX = +(process.argv[2] ?? 36);
const { sets } = JSON.parse(await fs.readFile(path.join(ROOT, 'out', 'catalog.json'), 'utf8'));
const done = new Set((await fs.readdir(path.join(ROOT, 'out', 'full')).catch(() => [])).filter((f) => f.endsWith('.json') && !['progress.json', 'failed.json'].includes(f)).map((f) => f.slice(0, -5)));
const todo = sets.filter((s) => s.withImage > 0 && !done.has(s.id)).map((s) => ({ id: s.id, sheets: Math.ceil(s.withImage / 12) }));
const jobs = [];
let cur = { sets: [], sheets: 0 };
for (const s of todo) {
  if (cur.sheets && cur.sheets + s.sheets > MAX) { jobs.push(cur); cur = { sets: [], sheets: 0 }; }
  cur.sets.push(s.id); cur.sheets += s.sheets;
}
if (cur.sets.length) jobs.push(cur);
console.log(JSON.stringify({ doneSets: done.size, todoSets: todo.length, todoSheets: todo.reduce((a, s) => a + s.sheets, 0), jobs }));
