// Tag search over out/tags.json for the 20 test queries. Deliberately simple and explicit:
// each query maps to weighted tag conditions plus caption keywords, so the test judges the tags.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, 'out');
const TOP_K = 8;

const place = (...v) => (t) => (v.includes(t.place) ? 3 : 0);
const activity = (a) => (t) => (t.activity[0] === a ? 3 : t.activity.includes(a) ? 2 : 0);
const time = (v) => (t) => (t.time === v ? 3 : 0);
const weather = (w, pts = 3) => (t) => (t.weather === w ? pts : 0);
const caption = (re, pts = 1) => (t) => (re.test(t.caption) ? pts : 0);

// query -> list of scoring rules (tag field conditions + caption keywords)
export const QUERIES = {
  'at the beach': [place('beach'), caption(/beach|sand|shore/i)],
  'in the forest': [place('forest', 'jungle'), caption(/forest|woods|trees/i)],
  'at night': [time('night'), caption(/night|moon/i)],
  'in the snow': [place('snow-ice'), weather('snow'), caption(/snow|ice|icy|frozen/i)],
  underwater: [place('underwater'), activity('swimming'), caption(/underwater/i)],
  'in space': [place('space'), caption(/space|planet|cosmos|galaxy/i)],
  'on a mountain': [place('mountain'), caption(/mountain|cliff|peak/i)],
  'in a city': [place('city'), caption(/city|street|building|town/i)],
  sleeping: [activity('sleeping'), caption(/sleep|asleep|dozing|napping/i)],
  'eating food': [activity('eating'), caption(/\beat|food|berry|berries|meal|snack/i)],
  'flying in the sky': [activity('flying'), place('sky'), caption(/fly|flies|flying|sky/i)],
  'near a volcano': [place('volcano'), caption(/volcan|lava|magma/i)],
  'in the rain': [weather('rain'), weather('storm', 2), caption(/rain/i)],
  'in a desert': [place('desert'), caption(/desert|dune/i)],
  'at sunset': [time('sunset-sunrise'), caption(/sunset|sunrise|dusk/i)],
  'with flowers': [(t) => (t.has_flowers ? 3 : 0), place('garden'), caption(/flower|blossom|petal/i)],
  'in a cave': [place('cave'), caption(/cave|cavern/i)],
  'two pokemon playing together': [(t) => (t.pokemon_count === '2' ? 2 : t.pokemon_count === '3+' ? 1 : 0), activity('playing'), caption(/play|together/i)],
  'a pokemon with a human trainer': [(t) => (t.human_present ? (t.pokemon_count !== '0' ? 5 : 2) : 0), caption(/trainer|person|girl|boy|\bman\b|woman|child/i)],
  'in a kitchen': [place('indoors'), caption(/kitchen|cook|stove|pan\b/i, 3)],
};

const CONF = { high: 0.3, medium: 0.2, low: 0.1 };

export function search(tags, query) {
  const rules = QUERIES[query];
  return tags
    .map((t) => {
      const parts = rules.map((r) => r(t));
      const core = parts.reduce((a, b) => a + b, 0);
      // small bonus for Pokémon cards and confident tags, only as tie-breakers
      return { t, core, score: core ? core + (t.kind === 'pokemon' ? 0.5 : 0) + (CONF[t.confidence] ?? 0) : 0 };
    })
    .filter((x) => x.core > 0)
    .sort((a, b) => b.score - a.score || a.t.id.localeCompare(b.t.id));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const tags = JSON.parse(await fs.readFile(path.join(OUT, 'tags.json'), 'utf8'));
  const results = {};
  for (const q of Object.keys(QUERIES)) {
    const hits = search(tags, q);
    results[q] = {
      matchingCards: hits.length,
      top8: hits.slice(0, TOP_K).map(({ t, score }) => ({
        id: t.id, name: t.name, set: t.set, setId: t.setId, localId: t.localId, image: t.image, score: +score.toFixed(2),
        tags: { kind: t.kind, place: t.place, time: t.time, weather: t.weather, activity: t.activity, pokemon_count: t.pokemon_count, human_present: t.human_present, has_flowers: t.has_flowers },
        caption: t.caption, confidence: t.confidence,
      })),
    };
  }
  const dist = {};
  for (const f of ['kind', 'place', 'time', 'weather', 'pokemon_count', 'human_present', 'has_flowers', 'confidence']) {
    dist[f] = {};
    for (const t of tags) dist[f][String(t[f])] = (dist[f][String(t[f])] ?? 0) + 1;
  }
  dist.activity = {};
  for (const t of tags) for (const a of t.activity) dist.activity[a] = (dist.activity[a] ?? 0) + 1;
  const meta = JSON.parse(await fs.readFile(path.join(OUT, 'tagging-meta.json'), 'utf8'));
  const selfCheck = JSON.parse(await fs.readFile(path.join(OUT, 'self-check.json'), 'utf8').catch(() => 'null'));
  await fs.writeFile(path.join(OUT, 'results.json'), JSON.stringify({ generatedAt: new Date().toISOString(), tagging: meta, distribution: dist, selfCheck, results }, null, 1));
  for (const [q, r] of Object.entries(results)) console.log(`${q.padEnd(32)} ${String(r.matchingCards).padStart(4)}  ${r.top8.map((x) => x.id).join(' ')}`);
}
