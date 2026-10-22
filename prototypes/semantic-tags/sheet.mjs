// Build labelled contact sheets from TCGdex card images.
// Images are fetched into memory, cropped and composited; only the finished sheet is written,
// and only into a temp directory outside the repo that the caller deletes after use.
import sharp from 'sharp';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export async function fetchImage(url, attempts = 5) {
  let err;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'cardfolio-semantic-tags-prototype' } });
      if (res.status === 404) { attempts = 0; } if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) {
      err = e;
      await sleep(1000 * 2 ** i);
    }
  }
  throw err;
}

export async function pool(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i], i); }
  }));
  return out;
}

// Artwork window per layout era, as fractions of the card [left, top, right, bottom].
// Approximate; calibrated by eye on one sample card per set.
export const CROPS = {
  base1: [0.09, 0.1, 0.91, 0.49],
  ex1: [0.08, 0.1, 0.92, 0.52],
  dp1: [0.08, 0.1, 0.92, 0.5],
  hgss1: [0.07, 0.09, 0.93, 0.52],
  bw1: [0.08, 0.1, 0.92, 0.51],
  xy1: [0.08, 0.1, 0.92, 0.52],
  sm1: [0.08, 0.1, 0.92, 0.51],
  swsh1: [0.08, 0.1, 0.92, 0.51],
  sv01: [0.05, 0.1, 0.95, 0.51],
  'sv03.5': [0.05, 0.1, 0.95, 0.51],
};
const OFFICIAL = { base1: 102, ex1: 109, dp1: 130, hgss1: 123, bw1: 114, xy1: 146, sm1: 149, swsh1: 202, sv01: 198, 'sv03.5': 165 };
const MODERN = new Set(['sm1', 'swsh1', 'sv01', 'sv03.5']);

/** Crop box for a card, or null (whole card) for secret rares and full-art style rule boxes. */
export function cropFor(card) {
  const n = parseInt(card.localId, 10);
  if (!Number.isNaN(n) && n > OFFICIAL[card.setId]) return null;
  if (MODERN.has(card.setId) && /(ex|GX| V| VMAX| VSTAR)$/.test(card.name)) return null;
  return CROPS[card.setId] ?? null;
}

const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

/**
 * items: [{ label, image (base URL), crop: [l,t,r,b] | null, lines?: bool }]
 * Returns a JPEG buffer: `cols` columns, each cell `cellW` wide, label strip on top.
 */
export async function buildSheet(items, { cols = 4, cellW = 420, cellH = 300, labelH = 30, title = null } = {}) {
  const cells = await pool(items, 4, async (it) => {
    const buf = await fetchImage(`${it.image}/high.webp`).catch(() => fetchImage(`${it.image}/high.png`));
    let img = sharp(buf);
    const { width: w, height: h } = await img.metadata();
    if (it.crop) {
      const [l, t, r, b] = it.crop;
      img = sharp(buf).extract({ left: Math.round(l * w), top: Math.round(t * h), width: Math.round((r - l) * w), height: Math.round((b - t) * h) });
    }
    let out = await img.resize(cellW, cellH, { fit: 'contain', background: '#ffffff' }).png().toBuffer();
    if (it.lines) {
      const lines = Array.from({ length: 19 }, (_, k) => { const y = Math.round(((k + 1) / 20) * cellH); return `<line x1="0" x2="${cellW}" y1="${y}" y2="${y}" stroke="red" stroke-width="1"/><text x="2" y="${y - 1}" font-size="10" fill="red">${(k + 1) * 5}</text>`; }).join('');
      out = await sharp(out).composite([{ input: Buffer.from(`<svg width="${cellW}" height="${cellH}">${lines}</svg>`) }]).png().toBuffer();
    }
    return out; // source bytes go out of scope here
  });
  const rows = Math.ceil(items.length / cols);
  const topH = title ? 36 : 0;
  const W = cols * cellW + (cols + 1) * 6;
  const H = topH + rows * (cellH + labelH) + (rows + 1) * 6;
  const composites = [];
  const svgParts = [];
  if (title) svgParts.push(`<text x="8" y="26" font-family="Helvetica" font-weight="bold" font-size="22" fill="#000">${esc(title)}</text>`);
  items.forEach((it, i) => {
    const c = i % cols, r = Math.floor(i / cols);
    const x = 6 + c * (cellW + 6), y = topH + 6 + r * (cellH + labelH + 6);
    svgParts.push(`<rect x="${x}" y="${y}" width="${cellW}" height="${labelH}" fill="#111"/><text x="${x + 8}" y="${y + 22}" font-family="Helvetica" font-weight="bold" font-size="20" fill="#fff">${esc(it.label)}</text>`);
    composites.push({ input: cells[i], left: x, top: y + labelH });
  });
  composites.push({ input: Buffer.from(`<svg width="${W}" height="${H}">${svgParts.join('')}</svg>`), left: 0, top: 0 });
  return sharp({ create: { width: W, height: H, channels: 3, background: '#ffffff' } }).composite(composites).jpeg({ quality: 85 }).toBuffer();
}
