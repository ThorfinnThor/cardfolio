// Step 1: fetch card metadata for the chosen EN sets from TCGdex and record skipped cards.
import fs from 'node:fs/promises';
import path from 'node:path';
import { API, OUT, fetchRetry, pool } from './lib.mjs';

// ~10 English sets across eras (WotC, EX, DP, HGSS, BW, XY, SM, SWSH, SV).
export const SETS = ['base1', 'ex1', 'dp1', 'hgss1', 'bw1', 'xy1', 'sm1', 'swsh1', 'sv01', 'sv03.5'];

const sets = await pool(SETS, 4, (id) => fetchRetry(`${API}/sets/${id}`));
const cards = [];
const skipped = [];
for (const set of sets) {
  for (const c of set.cards) {
    const meta = { id: c.id, name: c.name, localId: c.localId, setId: set.id, setName: set.name, image: c.image ?? null };
    (c.image ? cards : skipped).push(meta);
  }
}

// Total EN catalogue size, for extrapolation.
const all = await fetchRetry(`${API}/cards`);
const catalogue = { totalEnCards: all.length, totalEnCardsWithImage: all.filter((c) => c.image).length };

await fs.mkdir(OUT, { recursive: true });
await fs.writeFile(
  path.join(OUT, 'cards.json'),
  JSON.stringify(
    {
      source: API,
      fetchedAt: new Date().toISOString(),
      sets: sets.map((s) => ({ id: s.id, name: s.name, cards: s.cards.length })),
      skippedNoImage: skipped,
      catalogue,
      cards,
    },
    null,
    1,
  ),
);
console.log(`sets=${sets.length} cards=${cards.length} skipped=${skipped.length}`, catalogue);
