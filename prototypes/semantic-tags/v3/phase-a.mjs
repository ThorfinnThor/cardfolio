// Phase A analysis.
//   node v3/phase-a.mjs merge <partsDir>     -> out/phaseA/passA.json, passB.json (validated)
//   node v3/phase-a.mjs agree                -> out/phaseA/agreement.json
//   node v3/phase-a.mjs sheets <tempDir>     -> precision-check sheets (temp, outside repo) + out/phaseA/precision-sample.json
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TAGS, validate } from './tags.mjs';
import { buildSheet, cropFor } from '../sheet.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, 'out', 'phaseA');
await fs.mkdir(OUT, { recursive: true });
const cards = JSON.parse(await fs.readFile(path.join(ROOT, '..', '..', 'semantic-search', 'out', 'cards.json'), 'utf8')).cards;
const byId = Object.fromEntries(cards.map((c) => [c.id, c]));
const read = async (f) => JSON.parse(await fs.readFile(path.join(OUT, f), 'utf8'));

// deterministic PRNG for samples
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32); }
function sample(arr, n, seed) { const r = rng(seed); const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); }

const [mode, arg] = process.argv.slice(2);
if (mode === 'merge') {
  for (const pass of ['A', 'B']) {
    const res = {};
    const invalid = [];
    for (let i = 1; i <= 4; i++) {
      for (const r of JSON.parse(await fs.readFile(path.join(arg, `${pass}-${i}.json`), 'utf8'))) {
        const e = validate(r);
        if (e.length) invalid.push({ id: r?.id, errors: e, raw: r }); else res[r.id] = { id: r.id, tags: [...r.tags].sort(), caption: r.caption.trim() };
      }
    }
    const missing = cards.filter((c) => !res[c.id]).map((c) => c.id);
    await fs.writeFile(path.join(OUT, `pass${pass}.json`), JSON.stringify(cards.filter((c) => res[c.id]).map((c) => res[c.id]), null, 0));
    console.log(pass, 'valid', Object.keys(res).length, 'invalid', invalid.length, 'missing', missing.length, JSON.stringify(invalid.slice(0, 5)));
  }
} else if (mode === 'agree') {
  const A = Object.fromEntries((await read('passA.json')).map((r) => [r.id, new Set(r.tags)]));
  const B = Object.fromEntries((await read('passB.json')).map((r) => [r.id, new Set(r.tags)]));
  const ids = Object.keys(A).filter((i) => B[i]);
  const rows = {};
  for (const t of TAGS) {
    let both = 0, onlyA = 0, onlyB = 0, none = 0;
    for (const i of ids) { const a = A[i].has(t), b = B[i].has(t); if (a && b) both++; else if (a) onlyA++; else if (b) onlyB++; else none++; }
    const n = ids.length, po = (both + none) / n;
    const pa = (both + onlyA) / n, pb = (both + onlyB) / n, pe = pa * pb + (1 - pa) * (1 - pb);
    rows[t] = { both, onlyA, onlyB, positiveAgreement: both + onlyA + onlyB ? +(2 * both / (2 * both + onlyA + onlyB)).toFixed(3) : null, kappa: pe < 1 ? +((po - pe) / (1 - pe)).toFixed(3) : null };
  }
  await fs.writeFile(path.join(OUT, 'agreement.json'), JSON.stringify({ cards: ids.length, measure: 'positiveAgreement = 2*both/(2*both+onlyA+onlyB) (Dice on positives); kappa = Cohen', tags: rows }, null, 1));
  for (const [t, r] of Object.entries(rows)) console.log(t.padEnd(17), String(r.both).padStart(4), String(r.onlyA).padStart(4), String(r.onlyB).padStart(4), r.positiveAgreement, r.kappa);
} else if (mode === 'sheets') {
  const A = Object.fromEntries((await read('passA.json')).map((r) => [r.id, new Set(r.tags)]));
  const B = Object.fromEntries((await read('passB.json')).map((r) => [r.id, new Set(r.tags)]));
  const ids = Object.keys(A).filter((i) => B[i]);
  const manifest = {};
  let k = 0;
  for (const [ti, t] of TAGS.entries()) {
    const both = ids.filter((i) => A[i].has(t) && B[i].has(t));
    const one = ids.filter((i) => A[i].has(t) !== B[i].has(t));
    const sBoth = sample(both, 24, 1000 + ti), sOne = sample(one, 12, 2000 + ti);
    manifest[t] = { bothPositive: both.length, onePositive: one.length, sampleBoth: sBoth, sampleOne: sOne };
    const groups = [['both', sBoth.slice(0, 12)], ['both', sBoth.slice(12, 24)], ['one', sOne]];
    for (const [g, list] of groups) {
      if (!list.length) continue;
      const items = list.map((i, n) => ({ label: `${n + 1}. ${i}`, image: byId[i].image, crop: cropFor(byId[i]) }));
      await fs.writeFile(path.join(arg, `${String(k++).padStart(3, '0')}-${t}-${g}.jpg`), await buildSheet(items, { title: `${t} — ${g === 'both' ? 'both passes positive' : 'only one pass positive'}`, cellW: 400, cellH: 285 }));
    }
  }
  await fs.writeFile(path.join(OUT, 'precision-sample.json'), JSON.stringify(manifest, null, 1));
  console.log('sheets', k);
}
