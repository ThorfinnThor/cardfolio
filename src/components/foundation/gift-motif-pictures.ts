/**
 * One example card per motif of the gift builder, shown as a small picture next to its name (chosen 2026-11-17).
 * Picture themes: the best-ranked card that the artwork review marked "dominant" for the motif. Pokémon types and
 * special cards: the first card of their curated list ("showiest first"). A card appears for one motif only.
 * The values are TCGdex image bases (picture only, loaded from assets.tcgdex.net, never stored).
 */
export const MOTIF_PICTURES: Readonly<Record<string, string>> = {
  sea: "https://assets.tcgdex.net/en/dp/dp2/44", // Croconaw (Mysterious Treasures, dp2-44)
  beach: "https://assets.tcgdex.net/en/base/base3/51", // Krabby (Fossil, base3-51)
  forest: "https://assets.tcgdex.net/en/base/base2/30", // Victreebel (Jungle, base2-30)
  meadow: "https://assets.tcgdex.net/en/base/base1/22", // Pidgeotto (Base Set, base1-22)
  mountains: "https://assets.tcgdex.net/en/base/base1/39", // Porygon (Base Set, base1-39)
  night: "https://assets.tcgdex.net/en/base/base2/50", // Cubone (Jungle, base2-50)
  fire: "https://assets.tcgdex.net/en/base/base1/36", // Magmar (Base Set, base1-36)
  snow: "https://assets.tcgdex.net/en/bw/bw11/107", // Bouffalant (Legendary Treasures, bw11-107)
  city: "https://assets.tcgdex.net/en/bw/bw3/82", // Bisharp (Noble Victories, bw3-82)
  sky: "https://assets.tcgdex.net/en/bw/bw11/92", // Altaria (Legendary Treasures, bw11-92)
  flowers: "https://assets.tcgdex.net/en/base/base2/23", // Nidoqueen (Jungle, base2-23)
  desert: "https://assets.tcgdex.net/en/bw/bw7/83", // Trapinch (Boundaries Crossed, bw7-83)
  cave: "https://assets.tcgdex.net/en/bw/bw10/57", // Aron (Plasma Blast, bw10-57)
  sleeping: "https://assets.tcgdex.net/en/hgss/hgss4/36", // Kangaskhan (Triumphant, hgss4-36)
  flying: "https://assets.tcgdex.net/en/base/base3/2", // Articuno (Fossil, base3-2)
  food: "https://assets.tcgdex.net/en/bw/bwp/BW14", // Pansage (BW Black Star Promos, bwp-BW14)
  swimming: "https://assets.tcgdex.net/en/base/base2/46", // Seaking (Jungle, base2-46)
  friends: "https://assets.tcgdex.net/en/hgss/hgss3/40", // Unown (Undaunted, hgss3-40)
  underwater: "https://assets.tcgdex.net/en/base/base1/64", // Starmie (Base Set, base1-64)
  indoors: "https://assets.tcgdex.net/en/sm/det1/14", // Jigglypuff (Detective Pikachu, det1-14)
  sunset: "https://assets.tcgdex.net/en/base/base4/39", // Exeggutor (Base Set 2, base4-39)
  "type-fire": "https://assets.tcgdex.net/en/me/me02/125", // Mega Charizard X ex (Phantasmal Flames, me02-125)
  "type-water": "https://assets.tcgdex.net/en/me/me04/116", // Mega Greninja ex (Chaos Rising, me04-116)
  "type-grass": "https://assets.tcgdex.net/en/sv/sv08.5/144", // Leafeon ex (Prismatic Evolutions, sv08.5-144)
  "type-lightning": "https://assets.tcgdex.net/en/me/me05/114", // Mega Zeraora ex (Pitch Black, me05-114)
  "type-psychic": "https://assets.tcgdex.net/en/me/me05/115", // Mega Chandelure ex (Pitch Black, me05-115)
  "type-fighting": "https://assets.tcgdex.net/en/me/me03/120", // Mega Zygarde ex (Perfect Order, me03-120)
  "type-darkness": "https://assets.tcgdex.net/en/sv/sv06.5/090", // Okidogi ex (Shrouded Fable, sv06.5-090)
  "type-metal": "https://assets.tcgdex.net/en/me/30th/155", // Jirachi ex (30th Celebration, 30th-155)
  "type-dragon": "https://assets.tcgdex.net/en/me/me04/118", // Mega Dragalge ex (Chaos Rising, me04-118)
  "type-fairy": "https://assets.tcgdex.net/en/xy/xy11/116", // Gardevoir EX (Steam Siege, xy11-116)
  "type-colorless": "https://assets.tcgdex.net/en/me/me04/119", // Cinccino ex (Chaos Rising, me04-119)
  illustration: "https://assets.tcgdex.net/en/sv/sv08.5/146", // Flareon ex (Prismatic Evolutions, sv08.5-146)
  shiny: "https://assets.tcgdex.net/en/sv/sv04.5/212", // Forretress ex (Paldean Fates, sv04.5-212)
  mega: "https://assets.tcgdex.net/en/me/me05/116", // Mega Darkrai ex (Pitch Black, me05-116)
  classics: "https://assets.tcgdex.net/en/base/base1/1", // Alakazam (Base Set, base1-1)
};
