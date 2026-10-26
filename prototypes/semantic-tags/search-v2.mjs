// v2 tag search: same idea as search.mjs, over out/v2/tags.json (schema v2), with the query table
// adjusted to the new fields. The 6 extra queries were NOT used for tuning (generalisation check).
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const V2 = path.join(ROOT, 'out', 'v2');
const TOP_K = 8;

const place = (...v) => (t) => (v.includes(t.place) ? 3 : 0);
const activity = (a) => (t) => (t.activity[0] === a ? 3 : t.activity.includes(a) ? 2 : 0);
const time = (v) => (t) => (t.time === v ? 3 : 0);
const weather = (w, pts = 3) => (t) => (t.weather === w ? pts : 0);
const caption = (re, pts = 1) => (t) => (re.test(t.caption) ? pts : 0);
const multi = (t) => t.pokemon_count === '2' || t.pokemon_count === '3+';
// gate: the query only matches when `cond` holds
const only = (cond, rules) => rules.map((r) => (t) => (cond(t) ? r(t) : 0));

export const QUERIES = {
  'at the beach': [place('beach'), caption(/beach|sand|shore/i)],
  'in the forest': [place('forest', 'jungle'), caption(/forest|woods|trees/i)],
  'at night': [time('night'), caption(/night|moon/i)],
  'in the snow': [place('snow-ice'), weather('snow'), caption(/snow|ice|icy|frozen/i)],
  underwater: [place('underwater'), activity('swimming'), caption(/underwater/i)],
  'in space': [place('space'), caption(/space|planet|cosmos|galaxy|nebula/i)],
  'on a mountain': [place('mountain'), caption(/mountain|cliff|peak/i)],
  'in a city': [place('city'), caption(/city|street|building|town/i)],
  sleeping: [activity('sleeping'), caption(/sleep|asleep|dozing|napping/i)],
  'eating food': only((t) => t.kind === 'pokemon', [activity('eating'), (t) => (t.food_visible ? 1 : 0)]),
  'flying in the sky': [activity('flying'), place('sky'), caption(/fly|flies|flying|sky/i)],
  'near a volcano': [place('volcano'), caption(/volcan|lava|magma|crater/i)],
  'in the rain': [weather('rain'), caption(/\brain(?!bow)/i)],
  'in a desert': [place('desert'), caption(/desert|dune/i)],
  'at sunset': [time('sunset-sunrise'), caption(/sunset|sunrise|dusk/i)],
  'with flowers': [(t) => (t.has_flowers ? 3 : 0), place('garden'), caption(/flower|blossom|petal/i)],
  'in a cave': [place('cave'), caption(/cave|cavern/i)],
  'two pokemon playing together': only(multi, [(t) => (t.interaction === 'playing-together' ? 3 : 0), activity('playing'), caption(/play|together/i)]),
  'a pokemon with a human trainer': only((t) => t.pokemon_count !== '0', [(t) => (t.interaction === 'with-human' || (t.human_present && t.interaction === 'playing-together') ? 5 : t.human_present ? 3 : 0), caption(/trainer|person|girl|boy|\bman\b|woman|child/i)]),
  'in a kitchen': [place('kitchen'), caption(/kitchen|cook|stove|pan\b/i)],
};

// Generalisation check: existing fields only, not tuned on results.
export const EXTRA = {
  'pokemon on a bridge': [caption(/bridge/i, 3)],
  'pokemon in water at night': [place('ocean', 'underwater', 'river-lake'), time('night')],
  'pokemon on a rock': [caption(/\brock|boulder|stone/i, 3)],
  'a pokemon holding an object': [caption(/holding|holds|carrying|carries|clutch/i, 3)],
  'pokemon in a field of grass with clouds': [place('grassland'), caption(/cloud|sky/i, 2)],
  'pokemon in a dark place': [place('cave'), time('night'), caption(/dark|shadow/i, 2)],
};

const CONF = { high: 0.3, medium: 0.2, low: 0.1 };
export function search(tags, rules) {
  return tags
    .map((t) => {
      const core = rules.reduce((a, r) => a + r(t), 0);
      return { t, core, score: core ? core + (t.kind === 'pokemon' ? 0.5 : 0) + (CONF[t.confidence] ?? 0) : 0 };
    })
    .filter((x) => x.core > 0)
    .sort((a, b) => b.score - a.score || a.t.id.localeCompare(b.t.id));
}

const TAG_FIELDS = ['kind', 'place', 'time', 'weather', 'activity', 'interaction', 'pokemon_count', 'human_present', 'has_flowers', 'food_visible'];
const run = (tags, table) => Object.fromEntries(Object.entries(table).map(([q, rules]) => {
  const hits = search(tags, rules);
  return [q, {
    matchingCards: hits.length,
    top8: hits.slice(0, TOP_K).map(({ t, score }) => ({
      id: t.id, name: t.name, set: t.set, setId: t.setId, localId: t.localId, image: t.image, score: +score.toFixed(2),
      tags: Object.fromEntries(TAG_FIELDS.map((f) => [f, t[f]])), caption: t.caption, confidence: t.confidence,
    })),
  }];
}));

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const tags = JSON.parse(await fs.readFile(path.join(V2, 'tags.json'), 'utf8'));
  const dist = {};
  for (const f of TAG_FIELDS.filter((f) => f !== 'activity').concat('confidence')) {
    dist[f] = {};
    for (const t of tags) dist[f][String(t[f])] = (dist[f][String(t[f])] ?? 0) + 1;
  }
  dist.activity = {};
  for (const t of tags) for (const a of t.activity) dist.activity[a] = (dist.activity[a] ?? 0) + 1;
  const read = async (f) => JSON.parse(await fs.readFile(path.join(V2, f), 'utf8').catch(() => 'null'));
  const results = run(tags, QUERIES);
  const extra = run(tags, EXTRA);
  await fs.writeFile(path.join(V2, 'results.json'), JSON.stringify({ generatedAt: new Date().toISOString(), tagging: await read('tagging-meta.json'), distribution: dist, selfCheck: await read('self-check.json'), results, extraQueries: { note: 'not used for tuning', selfCheck: await read('self-check-extra.json'), results: extra } }, null, 1));
  for (const [q, r] of [...Object.entries(results), ...Object.entries(extra)]) console.log(`${q.padEnd(40)} ${String(r.matchingCards).padStart(4)}  ${r.top8.map((x) => x.id).join(' ')}`);
}
