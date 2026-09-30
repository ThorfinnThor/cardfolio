// Apply the visually confirmed corrections from the first full-catalogue audit.
// Usage: node v3/apply-audit-fixes.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FINAL_TAGS } from './final-tags.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const FULL = path.join(ROOT, 'out', 'full');
const progress = JSON.parse(await fs.readFile(path.join(FULL, 'progress.json'), 'utf8'));
const rank = new Map(FINAL_TAGS.map((tag, index) => [tag, index]));

const fixes = [
  // Water and shore relationships.
  ['base1-42', ['water-surface'], [], 'sea is visible behind the beach'],
  ['base3-51', ['water-surface'], [], 'sea is visible behind the beach'],
  ['lc-23', ['water-surface'], [], 'sea is visible beside the beach at sunset'],
  ['ecard1-102', ['water-surface'], [], 'waves form the visible water setting'],
  ['ecard1-131', ['water-surface'], [], 'surf is visible at the beach edge'],
  ['ex2-17', ['water-surface'], [], 'visible water and spray surround the Pokemon'],
  ['ex1-22', ['underwater'], [], 'submerged view with bubbles and water light'],
  ['ex6-66', ['water-surface'], [], 'water is visible at the shore'],
  ['ex7-73', ['water-surface'], [], 'Pokemon swims through visibly drawn water'],
  ['ex10-37', ['water-surface'], [], 'waves are visible at the beach'],
  ['dp1-69', ['water-surface'], [], 'water and surf are visible behind the pebble beach'],
  ['dp4-62', ['underwater'], [], 'seabed and underwater scene are visible'],
  ['ex13-57', ['underwater', 'swimming'], [], 'Pokemon swims in a submerged scene'],
  ['si1-13', [], ['beach'], 'sandy ground is shown without a sea shoreline'],

  // Forests and open fields.
  ['gym1-36', ['forest'], [], 'dense trees form the background'],
  ['ecard2-89', ['forest'], [], 'tree trunks and woodland ground form the setting'],
  ['ex1-68', ['forest'], [], 'dense woodland is visible behind the Pokemon'],
  ['ex5-35', ['forest'], [], 'Pokemon stands on a wooded forest floor'],
  ['ex6-1', ['forest'], [], 'dark trees form the background behind the flying Pokemon'],
  ['ex7-33', ['forest'], [], 'dense night forest is visible behind the grass'],
  ['ex10-33', ['forest'], [], 'leaf-covered forest floor forms the setting'],
  ['ex11-36', ['forest'], [], 'mossy woodland floor and vegetation are visible'],
  ['ex14-66', ['forest'], [], 'dense stylized trees form the setting'],
  ['dpp-DP21', ['forest'], [], 'dark woods are visible behind the Pokemon'],
  ['pl2-112', ['forest'], [], 'dark glowing forest is visible in the artwork'],
  ['gym1-99', ['grassland-field'], [], 'open grassy ground is the main setting'],
  ['ecard2-60', ['grassland-field'], [], 'open grassy field is the main ground'],
  ['pop7-2', ['grassland-field'], [], 'open field is visible under the evening sky'],
  ['pop3-10', [], ['forest'], 'palms and steps form a tropical arena, not dense forest'],

  // Geological and built settings.
  ['gym1-39', ['mountain-rocks'], [], 'large cliff face forms the setting'],
  ['ex6-65', ['mountain-rocks'], [], 'large coastal cliff is visible'],
  ['ex6-78', ['mountain-rocks'], [], 'snowy mountains form the background'],
  ['ecard3-77', ['cave'], [], 'split waterline scene is inside a stalactite cave'],
  ['ex7-38', ['cave'], [], 'rock walls enclose the lava cave'],
  ['ex11-49', ['cave', 'flying'], [], 'Pokemon visibly hovers inside a rocky cave'],
  ['ex12-43', ['cave'], [], 'ice cave walls enclose the scene'],
  ['ex16-52', ['cave'], [], 'rocky cavern encloses the scene'],
  ['base4-37', ['desert'], [], 'dry sandy plain forms the setting'],
  ['pl2-64', [], ['desert'], 'sand lies in a green park-like scene, not an arid desert'],
  ['pl2-3', ['city'], [], 'several city towers form the outdoor background'],
  ['bwp-BW35', ['city', 'ruins-building'], [], 'bridge and multiple city buildings are clearly visible'],
  ['ecard2-19', ['ruins-building'], [], 'sunken ruins are clearly visible'],
  ['neo2-74', ['ruins-building'], [], 'carved ruin wall is the main artwork'],
  ['ex4-47', ['ruins-building'], [], 'man-made gate is a clear part of the scene'],
  ['base5-69', [], ['city'], 'blurred lights do not show streets or buildings'],

  // Snow and ice that are part of the setting, not the Pokemon body.
  ['base1-57', ['snow-ice'], [], 'snow is visible on the mountains'],
  ['basep-29', ['snow-ice'], [], 'Pokemon is on a visibly frozen lake'],
  ['lc-85', ['snow-ice'], [], 'snow is visible on the mountains'],
  ['ex4-96', ['snow-ice'], [], 'ice formations are visible in the background'],
  ['ecard3-16', ['snow-ice'], [], 'snow is visible on the mountains'],
  ['ex6-114', ['snow-ice'], [], 'ice formations are visible around the flying Pokemon'],
  ['ex13-3', ['snow-ice'], [], 'blue ice crystals form the background'],
  ['ex14-52', ['snow-ice'], [], 'ice shards are clearly visible'],
  ['dp1-24', ['snow-ice'], [], 'snow is visible on the mountains'],
  ['dp1-112', ['snow-ice'], [], 'snow is visible on the mountains'],
  ['dp3-123', ['snow-ice'], [], 'snow is visible on the mountains'],
  ['pl2-6', ['snow-ice'], [], 'Pokemon is surrounded by an icy scene'],
  ['bw1-14', ['snow-ice'], [], 'snow is visible on the mountain'],
  ['bw1-66', ['snow-ice'], [], 'snow is visible on the mountain'],
  ['bwp-BW37', ['snow-ice'], [], 'ice formations are visible in the clash'],
  ['bwp-BW70', ['snow-ice'], [], 'snow is visible on the mountains'],
  ['ecard2-18', ['city', 'snow-ice'], [], 'town street and flying ice shards are clearly visible'],
  ['ex14-16', ['snow-ice'], [], 'blue ice shards are clearly visible'],
  ['bwp-BW63', ['snow-ice'], [], 'ice formations are visible in the clash'],
  ['bw2-30', ['snow-ice'], [], 'flying ice shards are clearly visible'],

  // Time of day.
  ['neo3-22', ['night'], [], 'starry night sky is visible'],
  ['neo3-65', ['night'], [], 'starry night sky fills the artwork'],
  ['ecard1-27', ['night'], [], 'bird flies across a starry night sky'],
  ['gym2-103', ['night'], [], 'rain falls in a clearly dark outdoor night scene'],
  ['ex8-21', ['night'], [], 'starry night sky is visible above the water'],
  ['dpp-DP15', ['night'], [], 'starry night sky is visible'],
  ['dp4-27', ['night'], [], 'moonlit dark outdoor scene is visible'],
  ['dp7-9', ['night'], [], 'moonlit blue forest is visible'],
  ['dpp-DP35', ['night'], [], 'clouds and stars form a visible night sky'],
  ['dp3-5', ['night'], [], 'Pokemon glides through a visible starry night sky'],
  ['dp3-14', ['night'], [], 'Pokemon glides through a visible starry night sky'],
  ['pop1-8', ['sunset-sunrise'], [], 'orange evening sky and low sun are visible'],
  ['ex3-59', ['sunset-sunrise'], [], 'orange-purple dusk sky is visible'],
  ['dp1-81', ['sunset-sunrise'], [], 'pink-orange evening sky fills the background'],
  ['dp4-23', ['sunset-sunrise'], [], 'purple-pink evening sky fills the background'],
  ['dp6-53', ['sunset-sunrise'], [], 'purple dusk sky and clouds form the background'],
  ['pop8-1', ['sunset-sunrise'], [], 'orange horizon shows a clear sunset'],

  // Objects and activities.
  ['neo3-16', ['food-visible'], [], 'berries and fruit are clearly drawn'],
  ['ex3-80', ['food-visible'], [], 'Pokemon visibly holds a berry'],
  ['ex10-15', ['food-visible'], [], 'fruit is clearly drawn on the tree'],
  ['ex15-72', ['food-visible'], [], 'cut fruit is clearly drawn'],
  ['neo4-51', ['sleeping'], [], 'a separate background Pokemon is visibly asleep'],
  ['ex6-53', ['sleeping'], [], 'Pokemon rests with closed eyes'],
  ['base3-47', ['flying'], [], 'Pokemon visibly hovers above the ground'],
  ['si1-10', ['flying'], [], 'small background Pokemon is airborne with wings spread'],
  ['ex2-53', ['flying'], [], 'winged Pokemon visibly hovers above the ground'],
  ['ex3-63', ['flying'], [], 'Pokemon visibly hovers indoors'],
  ['ex3-87', ['flying'], [], 'bird visibly flies over the water'],
  ['ex3-100', ['flying'], [], 'Pokemon is airborne with wings spread'],
  ['ex2-2', ['flying', 'multiple-pokemon'], [], 'small background bat is visibly airborne'],
  ['ecard2-52', ['flying'], [], 'Pokemon visibly hovers'],
  ['ecard2-39', ['flying'], [], 'winged Pokemon visibly hovers above the ground'],
  ['ecard2-149', ['flying'], [], 'Pokemon is airborne with wings spread'],
  ['ecard3-26', ['flying'], [], 'small background bird is airborne'],
  ['ecard3-104', ['flying', 'multiple-pokemon'], [], 'several background bats are visibly airborne'],
  ['ex11-48', ['flying'], [], 'Pokemon visibly hovers in the forest'],
  ['ex13-38', ['flying'], [], 'Pokemon visibly floats above the ground'],
  ['ex13-59', ['flying'], [], 'Pokemon visibly hovers in the air'],
  ['dp3-42', ['flying'], [], 'Pokemon visibly hovers among the plants'],
  ['dp3-43', ['flying'], [], 'Pokemon visibly hovers inside a building'],
  ['dp7-5', ['flying'], [], 'Pokemon visibly hovers in the forest'],
  ['dp7-36', ['flying'], [], 'Pokemon visibly floats above the landscape'],
  ['pl2-50', ['flying'], [], 'Pokemon visibly hovers above the water'],
  ['bw2-50', ['flying'], [], 'Pokemon visibly hovers above the ground'],

  // Captions exposed two additional clear setting omissions.
  ['ecard2-61', ['indoors'], [], 'Pokemon is inside beside a window overlooking the city'],
  ['dp6-131', ['ruins-building'], [], 'a man-made building is clearly visible behind the person'],
];

const files = new Map();
const byId = new Map();
for (const setId of Object.keys(progress.sets)) {
  const file = path.join(FULL, `${setId}.json`);
  const rows = JSON.parse(await fs.readFile(file, 'utf8'));
  files.set(setId, { file, rows });
  for (const row of rows) {
    if (byId.has(row.id)) throw new Error(`duplicate result id ${row.id}`);
    byId.set(row.id, { setId, row });
  }
}

const report = [];
const touchedSets = new Set();
for (const [id, add, remove, reason] of fixes) {
  const found = byId.get(id);
  if (!found) throw new Error(`unknown result id ${id}`);
  for (const tag of [...add, ...remove]) if (!rank.has(tag)) throw new Error(`unknown tag ${tag}`);
  const before = [...found.row.tags];
  const tags = new Set(before);
  for (const tag of remove) tags.delete(tag);
  for (const tag of add) tags.add(tag);
  found.row.tags = [...tags].sort((a, b) => rank.get(a) - rank.get(b));
  if (before.join('\0') !== found.row.tags.join('\0')) touchedSets.add(found.setId);
  report.push({ id, setId: found.setId, add, remove, reason, resultTags: found.row.tags });
}

for (const setId of touchedSets) {
  const { file, rows } = files.get(setId);
  await fs.writeFile(file, JSON.stringify(rows));
}
await fs.writeFile(path.join(FULL, 'audit-fixes.json'), `${JSON.stringify(report, null, 1)}\n`);
console.log(JSON.stringify({ directives: fixes.length, touchedSets: touchedSets.size }, null, 2));
