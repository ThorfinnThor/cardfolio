// Step 4+5: run 20 English queries (raw + templated) against f32 and int8 vectors, both models.
import fs from 'node:fs/promises';
import path from 'node:path';
import { AutoTokenizer, CLIPTextModelWithProjection } from '@huggingface/transformers';
import { OUT, MODELS, DIM, modelSlug, l2normalize } from './lib.mjs';

const QUERIES = [
  'at the beach', 'in the forest', 'at night', 'in the snow', 'underwater', 'in space', 'on a mountain',
  'in a city', 'sleeping', 'eating food', 'flying in the sky', 'near a volcano', 'in the rain', 'in a desert',
  'at sunset', 'with flowers', 'in a cave', 'two pokemon playing together', 'a pokemon with a human trainer',
  'in a kitchen',
];
const TEMPLATES = {
  raw: (q) => `pokemon ${q}`.replace(/^pokemon (two pokemon|a pokemon)/, '$1'),
  template: (q) => `a trading card illustration of a pokemon ${q}`.replace(/a pokemon (two pokemon|a pokemon)/, '$1'),
};
const TOP_K = 8;
const VARIANTS = ['full', 'art'];

const meta = JSON.parse(await fs.readFile(path.join(OUT, 'vectors.meta.json'), 'utf8'));
const cardsJson = JSON.parse(await fs.readFile(path.join(OUT, 'cards.json'), 'utf8'));
const N = meta.count;
const failed = new Set(meta.failedIds);
const readF32 = async (f) => new Float32Array((await fs.readFile(path.join(OUT, f))).buffer.slice(0));
const readI8 = async (f) => new Int8Array((await fs.readFile(path.join(OUT, f))).buffer.slice(0));

function topK(scoreFn) {
  const scored = [];
  for (let r = 0; r < N; r++) if (!failed.has(meta.cards[r].id)) scored.push([r, scoreFn(r)]);
  scored.sort((a, b) => b[1] - a[1]);
  return scored.slice(0, TOP_K);
}
const dotF32 = (q, db, r) => { let s = 0; const o = r * DIM; for (let d = 0; d < DIM; d++) s += q[d] * db[o + d]; return s; };
const dotI8 = (q, db, sc, r) => { let s = 0; const o = r * DIM; for (let d = 0; d < DIM; d++) s += q[d] * db[o + d]; return s * sc[r]; };
const fmt = (rows) => rows.map(([r, s]) => {
  const c = meta.cards[r];
  return { id: c.id, name: c.name, set: c.setName, setId: c.setId, localId: c.localId, image: c.image, score: +s.toFixed(4) };
});
const overlap = (a, b) => { const sa = new Set(a.map((x) => x[0])); return b.filter((x) => sa.has(x[0])).length / TOP_K; };
const mean = (a) => +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(3);

const results = {};
const summary = {};
for (const id of MODELS) {
  const slug = modelSlug(id);
  const tok = await AutoTokenizer.from_pretrained(id);
  const enc = {};
  const load = {};
  for (const dtype of ['q8', 'fp32']) {
    const t0 = performance.now();
    enc[dtype] = await CLIPTextModelWithProjection.from_pretrained(id, { dtype });
    load[dtype] = Math.round(performance.now() - t0);
  }
  const embedText = async (dtype, text) => {
    const inputs = tok([text], { padding: 'max_length', max_length: 77, truncation: true });
    const { text_embeds } = await enc[dtype](inputs);
    return l2normalize(text_embeds.data);
  };

  // Latency: q8 and fp32 text encoder, warm (after 3 warm-up calls), over all 40 prompt strings.
  const prompts = QUERIES.flatMap((q) => Object.values(TEMPLATES).map((t) => t(q)));
  const latency = {};
  for (const dtype of ['q8', 'fp32']) {
    for (let i = 0; i < 3; i++) await embedText(dtype, prompts[i]);
    const ts = [];
    for (const p of prompts) { const t0 = performance.now(); await embedText(dtype, p); ts.push(performance.now() - t0); }
    ts.sort((a, b) => a - b);
    latency[dtype] = { coldLoadMs: load[dtype], meanMs: mean(ts), p50Ms: +ts[ts.length >> 1].toFixed(2), maxMs: +ts.at(-1).toFixed(2) };
  }

  results[id] = {};
  const ov = { int8VsF32: {}, q8VsFp32Text: {} };
  for (const variant of VARIANTS) {
    const base = variant === 'full' ? slug : `${slug}.${variant}`;
    const f32 = await readF32(`${base}.f32.bin`);
    const i8 = await readI8(`${base}.i8.bin`);
    const sc = await readF32(`${base}.i8scale.f32.bin`);
    results[id][variant] = {};
    for (const [tname, tfn] of Object.entries(TEMPLATES)) {
      const perQ = {};
      const oInt = [], oTxt = [];
      for (const q of QUERIES) {
        const text = tfn(q);
        const vq8 = await embedText('q8', text);
        const vfp = await embedText('fp32', text);
        const rf = topK((r) => dotF32(vq8, f32, r));
        const ri = topK((r) => dotI8(vq8, i8, sc, r));
        const rfp = topK((r) => dotF32(vfp, f32, r));
        oInt.push(overlap(rf, ri));
        oTxt.push(overlap(rf, rfp));
        perQ[q] = { prompt: text, float32: fmt(rf), int8: fmt(ri), int8VsFloat32Top8Overlap: overlap(rf, ri) };
      }
      results[id][variant][tname] = perQ;
      ov.int8VsF32[`${variant}/${tname}`] = mean(oInt);
      ov.q8VsFp32Text[`${variant}/${tname}`] = mean(oTxt);
    }
  }
  summary[id] = { textEncoderLatencyNode: latency, meanTop8Overlap: ov };
}

// Model file sizes actually downloaded into the local cache.
async function sizes(dir) {
  const out = {};
  for (const e of await fs.readdir(dir, { withFileTypes: true, recursive: true })) {
    if (!e.isFile()) continue;
    const p = path.join(e.parentPath, e.name);
    out[path.relative(path.join(dir, 'Xenova'), p)] = +((await fs.stat(p)).size / 1e6).toFixed(1);
  }
  return out;
}
const modelFilesMB = await sizes(path.join(path.dirname(OUT), '.models'));

// Extrapolation for the full EN catalogue.
const { totalEnCards, totalEnCardsWithImage } = cardsJson.catalogue;
const bytesPerRowI8 = DIM + 4; // int8 vector + float32 scale
const extrapolation = {
  totalEnCards,
  totalEnCardsWithImage,
  int8_512d: { bytesPerRow: bytesPerRowI8, allCardsMB: +(totalEnCards * bytesPerRowI8 / 1e6).toFixed(2), withImageMB: +(totalEnCardsWithImage * bytesPerRowI8 / 1e6).toFixed(2) },
  float32_512d: { bytesPerRow: DIM * 4, allCardsMB: +(totalEnCards * DIM * 4 / 1e6).toFixed(2), withImageMB: +(totalEnCardsWithImage * DIM * 4 / 1e6).toFixed(2) },
  note: 'Vectors only; per-card metadata (id, name, set, image URL) adds roughly 100–150 bytes/card as JSON before compression.',
};

const embedReport = JSON.parse(await fs.readFile(path.join(OUT, 'embed-report.json'), 'utf8'));
await fs.writeFile(
  path.join(OUT, 'results.json'),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      setup: {
        sets: cardsJson.sets,
        cards: N,
        skippedNoImage: cardsJson.skippedNoImage.length,
        failedImageFetch: meta.failedIds.length,
        image: '${card.image}/low.webp (in memory only)',
        visionDtype: 'fp32',
        queryTextEncoder: 'q8 (results below); fp32 used only for the overlap comparison',
        variants: { full: 'whole card scan', art: 'fixed crop x 8–92%, y 10–55% (approx. artwork window)' },
        templates: { raw: TEMPLATES.raw('{query}'), template: TEMPLATES.template('{query}') },
        topK: TOP_K,
      },
      embedding: embedReport,
      modelFilesMB,
      summary,
      extrapolation,
      results,
    },
    null,
    1,
  ),
);
console.log(JSON.stringify({ summary, modelFilesMB, extrapolation }, null, 2));
