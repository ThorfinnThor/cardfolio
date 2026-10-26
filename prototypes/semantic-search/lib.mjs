// Shared helpers for the semantic-search prototype.
import { env } from '@huggingface/transformers';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const ROOT = path.dirname(fileURLToPath(import.meta.url));
export const OUT = path.join(ROOT, 'out');
export const API = 'https://api.tcgdex.net/v2/en';

// Model files live in a gitignored local cache next to the scripts.
env.cacheDir = path.join(ROOT, '.models');
env.allowLocalModels = false;

export const MODELS = ['Xenova/clip-vit-base-patch32', 'Xenova/clip-vit-base-patch16'];
export const modelSlug = (id) => id.split('/')[1];
export const DIM = 512;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** fetch with retry + exponential backoff (1s, 2s, 4s, 8s). */
export async function fetchRetry(url, { attempts = 5, as = 'json' } = {}) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'cardfolio-semantic-search-prototype' } });
      if (res.status === 404) throw Object.assign(new Error(`404 ${url}`), { fatal: true });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
      return as === 'json' ? await res.json() : await res.blob();
    } catch (err) {
      lastErr = err;
      if (err.fatal) break;
      await sleep(1000 * 2 ** i);
    }
  }
  throw lastErr;
}

/** Run `fn` over `items` with at most `limit` in flight; results keep input order. */
export async function pool(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i], i);
      }
    }),
  );
  return results;
}

export function l2normalize(v) {
  let s = 0;
  for (const x of v) s += x * x;
  const n = Math.sqrt(s) || 1;
  const out = new Float32Array(v.length);
  for (let i = 0; i < v.length; i++) out[i] = v[i] / n;
  return out;
}

/**
 * Symmetric per-vector int8 quantisation: q = round(v / scale), scale = max|v| / 127.
 * Stored as Int8Array(N*DIM) + Float32Array(N) scales.
 */
export function quantizeInt8(f32, n, dim = DIM) {
  const q = new Int8Array(n * dim);
  const scales = new Float32Array(n);
  for (let r = 0; r < n; r++) {
    let m = 0;
    for (let d = 0; d < dim; d++) m = Math.max(m, Math.abs(f32[r * dim + d]));
    const s = m / 127 || 1;
    scales[r] = s;
    for (let d = 0; d < dim; d++) q[r * dim + d] = Math.round(f32[r * dim + d] / s);
  }
  return { q, scales };
}
