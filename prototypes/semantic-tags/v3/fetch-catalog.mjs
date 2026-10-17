// Phase B step 1: complete TCGdex EN card list (metadata only, no images) -> v3/out/catalog.json
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const API = 'https://api.tcgdex.net/v2/en';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url, attempts = 5) {
  let err;
  for (let i = 0; i < attempts; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'cardfolio-semantic-tags-prototype' } });
      if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
      return await r.json();
    } catch (e) { err = e; await sleep(1000 * 2 ** i); }
  }
  throw err;
}
async function pool(items, n, fn) {
  const out = new Array(items.length); let next = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (next < items.length) { const i = next++; out[i] = await fn(items[i]); } }));
  return out;
}

const list = await get(`${API}/sets`);
const sets = await pool(list, 4, (s) => get(`${API}/sets/${encodeURIComponent(s.id)}`));
const cards = [];
const out = [];
let noImage = 0;
for (const s of sets) {
  const withImg = s.cards.filter((c) => c.image);
  noImage += s.cards.length - withImg.length;
  out.push({ id: s.id, name: s.name, serie: s.serie?.id ?? null, releaseDate: s.releaseDate ?? null, official: s.cardCount?.official ?? null, cards: s.cards.length, withImage: withImg.length });
  for (const c of withImg) cards.push({ id: c.id, name: c.name, localId: c.localId, setId: s.id, setName: s.name, serie: s.serie?.id ?? null, image: c.image });
}
const allCards = await get(`${API}/cards`);
await fs.writeFile(path.join(ROOT, 'out', 'catalog.json'), JSON.stringify({ source: API, fetchedAt: new Date().toISOString(), totalCardsListEndpoint: allCards.length, cardsInSets: cards.length + noImage, cardsWithImage: cards.length, cardsWithoutImage: noImage, sets: out, cards }, null, 0));
console.log({ sets: sets.length, withImage: cards.length, noImage, listEndpoint: allCards.length });
