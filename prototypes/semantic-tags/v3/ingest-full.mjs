// Validate an agent's per-set result file and store it as v3/out/full/<setId>.json; update progress.json and failed.json.
// Usage: node v3/ingest-full.mjs <resultFile> [agentTokens] [agentMinutes]
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FINAL_TAGS } from './final-tags.mjs';
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const FULL = path.join(ROOT, 'out', 'full');
await fs.mkdir(FULL, { recursive: true });
const { cards } = JSON.parse(await fs.readFile(path.join(ROOT, 'out', 'catalog.json'), 'utf8'));
const [file, tokens = 0, minutes = 0] = process.argv.slice(2);
const res = JSON.parse(await fs.readFile(file, 'utf8'));
const setId = path.basename(file, '.json');
const expected = cards.filter((c) => c.setId === setId);
if (!expected.length) throw new Error(`unknown set ${setId}`);
const byId = new Map(res.map((r) => [r?.id, r]));
const ok = [], bad = [];
for (const c of expected) {
  const r = byId.get(c.id);
  const errs = [];
  if (!r) errs.push('missing');
  else {
    if (!Array.isArray(r.tags) || r.tags.some((t) => !FINAL_TAGS.includes(t)) || new Set(r.tags).size !== r.tags.length) errs.push('tags');
    if (typeof r.caption !== 'string' || !r.caption.trim() || r.caption.trim().split(/\s+/).length > 20) errs.push('caption');
  }
  if (errs.length) bad.push({ id: c.id, setId, errors: errs, raw: r ?? null });
  else ok.push({ id: c.id, tags: FINAL_TAGS.filter((t) => r.tags.includes(t)), caption: r.caption.trim() });
}
await fs.writeFile(path.join(FULL, `${setId}.json`), JSON.stringify(ok));
const failedPath = path.join(FULL, 'failed.json');
const failed = JSON.parse(await fs.readFile(failedPath, 'utf8').catch(() => '[]')).filter((f) => f.setId !== setId).concat(bad);
await fs.writeFile(failedPath, JSON.stringify(failed, null, 1));
const progPath = path.join(FULL, 'progress.json');
const prog = JSON.parse(await fs.readFile(progPath, 'utf8').catch(() => '{"sets":{}}'));
prog.sets[setId] = { cards: expected.length, valid: ok.length, invalid: bad.length, at: new Date().toISOString(), agentTokens: +tokens, agentMinutes: +minutes };
prog.totals = Object.values(prog.sets).reduce((a, s) => ({ sets: a.sets + 1, cards: a.cards + s.cards, valid: a.valid + s.valid, invalid: a.invalid + s.invalid, agentTokens: a.agentTokens + s.agentTokens, agentMinutes: +(a.agentMinutes + s.agentMinutes).toFixed(1) }), { sets: 0, cards: 0, valid: 0, invalid: 0, agentTokens: 0, agentMinutes: 0 });
await fs.writeFile(progPath, JSON.stringify(prog, null, 1));
console.log(setId, 'valid', ok.length, 'invalid', bad.length);
