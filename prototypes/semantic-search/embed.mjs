// Step 2+3: embed card images (in memory only) with both CLIP vision models, save f32 + int8 vectors.
// Image bytes are fetched from `${card.image}/low.webp`, decoded, embedded and discarded — never written to disk.
import fs from 'node:fs/promises';
import path from 'node:path';
import { AutoProcessor, CLIPVisionModelWithProjection, RawImage } from '@huggingface/transformers';
import { OUT, MODELS, DIM, modelSlug, fetchRetry, pool, l2normalize, quantizeInt8 } from './lib.mjs';

// Variants: the full card scan (as requested) and, for comparison, a fixed crop of the
// artwork window (approximate; full-art/modern layouts differ).
const VARIANTS = {
  full: (img) => img,
  art: (img) => {
    const w = img.width, h = img.height;
    return img.crop([Math.round(w * 0.08), Math.round(h * 0.1), Math.round(w * 0.92), Math.round(h * 0.55)]);
  },
};

const { cards } = JSON.parse(await fs.readFile(path.join(OUT, 'cards.json'), 'utf8'));
const N = cards.length;

const models = [];
for (const id of MODELS) {
  const t0 = performance.now();
  const processor = await AutoProcessor.from_pretrained(id);
  const model = await CLIPVisionModelWithProjection.from_pretrained(id, { dtype: 'fp32' });
  models.push({ id, processor, model, loadMs: performance.now() - t0, times: [], vecs: {} });
  for (const v of Object.keys(VARIANTS)) models.at(-1).vecs[v] = new Float32Array(N * DIM);
}

// Serialise inference so per-image timings are clean; fetching still runs 4-wide.
let lock = Promise.resolve();
const exclusive = (fn) => (lock = lock.then(fn, fn));

const failures = [];
const fetchTimes = [];
let done = 0;
const tStart = performance.now();
await pool(cards, 4, async (card, i) => {
  let img;
  try {
    const tf = performance.now();
    const blob = await fetchRetry(`${card.image}/low.webp`, { as: 'blob' });
    img = await RawImage.fromBlob(blob);
    fetchTimes.push(performance.now() - tf);
  } catch (err) {
    failures.push({ id: card.id, error: String(err.message ?? err) });
    return;
  }
  await exclusive(async () => {
    for (const m of models) {
      for (const [v, prep] of Object.entries(VARIANTS)) {
        const t0 = performance.now();
        const inputs = await m.processor(await prep(img));
        const { image_embeds } = await m.model(inputs);
        const vec = l2normalize(image_embeds.data);
        if (v === 'full') m.times.push(performance.now() - t0);
        m.vecs[v].set(vec, i * DIM);
      }
    }
  });
  img = null; // discard
  if (++done % 100 === 0) console.log(`${done}/${N} ${((performance.now() - tStart) / 1000).toFixed(0)}s`);
});

const stats = (a) => {
  const s = [...a].sort((x, y) => x - y);
  return { n: s.length, meanMs: +(s.reduce((x, y) => x + y, 0) / s.length).toFixed(1), p50Ms: +s[s.length >> 1].toFixed(1), p95Ms: +s[Math.floor(s.length * 0.95)].toFixed(1) };
};

const failed = new Set(failures.map((f) => f.id));
const report = { totalWallSec: +((performance.now() - tStart) / 1000).toFixed(1), fetchDecode: stats(fetchTimes), failures, models: {} };
for (const m of models) {
  const slug = modelSlug(m.id);
  for (const v of Object.keys(VARIANTS)) {
    const f32 = m.vecs[v];
    const { q, scales } = quantizeInt8(f32, N);
    const suffix = v === 'full' ? '' : `.${v}`;
    await fs.writeFile(path.join(OUT, `${slug}${suffix}.f32.bin`), Buffer.from(f32.buffer));
    await fs.writeFile(path.join(OUT, `${slug}${suffix}.i8.bin`), Buffer.from(q.buffer));
    await fs.writeFile(path.join(OUT, `${slug}${suffix}.i8scale.f32.bin`), Buffer.from(scales.buffer));
  }
  report.models[m.id] = { visionDtype: 'fp32', loadMs: Math.round(m.loadMs), perImageFullCard: stats(m.times) };
}

// Row order of every .bin file == order of `vectors.meta.json`.cards.
await fs.writeFile(
  path.join(OUT, 'vectors.meta.json'),
  JSON.stringify(
    {
      dim: DIM,
      count: N,
      normalised: 'L2',
      int8: 'per-row symmetric: value ≈ int8 * scale[row]; scales in *.i8scale.f32.bin',
      files: Object.fromEntries(MODELS.map((id) => [id, { full: modelSlug(id), art: `${modelSlug(id)}.art` }])),
      failedIds: [...failed],
      cards: cards.map((c) => ({ id: c.id, name: c.name, setId: c.setId, setName: c.setName, localId: c.localId, image: c.image })),
    },
    null,
    1,
  ),
);
await fs.writeFile(path.join(OUT, 'embed-report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
