/**
 * Builds the card lists behind the type and special-card themes of the gift builder.
 * The membership comes from TCGdex data fields (Pokémon type, rarity, set), not from picture recognition,
 * so every card in a list really has the property of the theme.
 * Usage: node scripts/build-curated-collections.mjs (needs network access to api.tcgdex.net)
 */
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

const API = "https://api.tcgdex.net/v2/en";
const OUTPUT = join(process.cwd(), "public", "data", "semantic", "curated-collections-v1.json");
const POCKET = /^(A\d|B\d|P-A|tcgp)/i;

/** Showiest first; this order decides which cards a gift page sees first. */
const RARITY_PRIORITY = [
  "Special illustration rare", "Illustration rare", "Hyper rare", "Mega Hyper Rare", "Secret Rare",
  "Ultra Rare", "Shiny Ultra Rare", "Amazing Rare", "Radiant Rare", "Shiny rare VMAX", "Shiny rare V", "Shiny rare",
  "Holo Rare VMAX", "Holo Rare VSTAR", "Holo Rare V", "Double rare", "Rare Holo LV.X", "Rare PRIME", "LEGEND", "Holo Rare", "Rare Holo",
];

const TYPES = ["Fire", "Water", "Grass", "Lightning", "Psychic", "Fighting", "Darkness", "Metal", "Dragon", "Fairy", "Colorless"];
const CLASSIC_SETS = ["base1", "base2", "base3", "base4", "base5", "gym1", "gym2", "neo1", "neo2", "neo3", "neo4"];

async function list(query) {
  const url = `${API}/cards?${query}`;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return await response.json();
    } catch {
      // retried below
    }
    await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
  }
  throw new Error(`TCGdex request failed: ${url}`);
}

async function detail(id) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch(`${API}/cards/${encodeURIComponent(id)}`);
      if (response.ok) return await response.json();
    } catch {
      // retried below
    }
    await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
  }
  return undefined;
}

/** One Pokémon, whatever the card suffix says: "Mega Emboar ex" and "Emboar V" both count as Emboar. */
function pokemonOf(name) {
  return name
    .replace(/^(Mega|M|Dark|Light|Hisuian|Alolan|Galarian|Paldean|Team Rocket's|Ethan's|Misty's|Blaine's|Sabrina's|Brock's|Erika's|Lt\. Surge's)\s+/i, "")
    .replace(/\s+(ex|EX|GX|V|VMAX|VSTAR|V-UNION|BREAK|LV\.X|δ|Star|☆|C|G|FB|SP)(\s+.*)?$/i, "")
    .trim()
    .toLowerCase();
}

function collect(entries, { maxPerPokemon, cap }) {
  const perPokemon = new Map();
  const seen = new Set();
  const ids = [];
  for (const entry of entries) {
    if (!entry.image || POCKET.test(entry.id) || seen.has(entry.id)) continue;
    const key = pokemonOf(entry.name);
    const used = perPokemon.get(key) ?? 0;
    if (used >= maxPerPokemon) continue;
    perPokemon.set(key, used + 1);
    seen.add(entry.id);
    ids.push(entry.id);
    if (ids.length >= cap) break;
  }
  return ids;
}

async function byRarities(rarities, extraQuery = "") {
  const entries = [];
  for (const rarity of rarities) {
    entries.push(...await list(`rarity=eq:${encodeURIComponent(rarity)}${extraQuery}`));
  }
  return entries;
}

const collections = {};

for (const type of TYPES) {
  collections[`type-${type.toLowerCase()}`] = collect(await byRarities(RARITY_PRIORITY, `&types=eq:${type}`), { maxPerPokemon: 3, cap: 120 });
}

collections.illustration = collect(await byRarities(["Special illustration rare", "Illustration rare"]), { maxPerPokemon: 2, cap: 150 });
collections.shiny = collect(await byRarities(["Shiny Ultra Rare", "Shiny rare VMAX", "Shiny rare V", "Shiny rare"]), { maxPerPokemon: 2, cap: 150 });
collections.mega = collect(
  (await byRarities(RARITY_PRIORITY, "&name=Mega")).filter((entry) => /^Mega /i.test(entry.name)),
  { maxPerPokemon: 2, cap: 120 },
);
const classics = [];
for (const setId of CLASSIC_SETS) {
  const cards = await list(`set.id=eq:${setId}`);
  for (let index = 0; index < cards.length; index += 8) {
    const details = await Promise.all(cards.slice(index, index + 8).map((card) => detail(card.id)));
    // A holo-only print is a Holo Rare in these sets, whatever the rarity label says.
    classics.push(...details.filter((card) => card?.variants?.holo === true && card.variants.normal !== true));
  }
}
collections.classics = collect(classics, { maxPerPokemon: 2, cap: 150 });

for (const [id, ids] of Object.entries(collections)) {
  if (ids.length < 18) throw new Error(`Collection ${id} has only ${ids.length} cards.`);
}

await writeFile(OUTPUT, `${JSON.stringify({ version: 1, generatedAt: new Date().toISOString().slice(0, 10), collections })}\n`);
console.log(Object.entries(collections).map(([id, ids]) => `${id}: ${ids.length}`).join("\n"));
