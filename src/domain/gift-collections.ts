/**
 * Themes whose cards are chosen by a card property (Pokémon type, rarity, era) instead of by what the picture shows.
 * The card lists come from `public/data/semantic/curated-collections-v1.json`, built by
 * `scripts/build-curated-collections.mjs` from TCGdex data, so every card really has the property.
 */
export interface GiftCollectionPreset {
  id: string;
  label: string;
  description: string;
  group: "type" | "special";
}

export const GIFT_COLLECTION_PRESETS: readonly GiftCollectionPreset[] = [
  { id: "type-fire", label: "Feuer-Pokémon", description: "Glurak, Panflam und alle anderen Feuer-Typen", group: "type" },
  { id: "type-water", label: "Wasser-Pokémon", description: "Schiggy, Garados und alle anderen Wasser-Typen", group: "type" },
  { id: "type-grass", label: "Pflanzen-Pokémon", description: "Bisasam, Bisaflor und alle anderen Pflanzen-Typen", group: "type" },
  { id: "type-lightning", label: "Elektro-Pokémon", description: "Pikachu, Raichu und alle anderen Elektro-Typen", group: "type" },
  { id: "type-psychic", label: "Psycho-Pokémon", description: "Mew, Mewtu und alle anderen Psycho-Typen", group: "type" },
  { id: "type-fighting", label: "Kampf-Pokémon", description: "Lucario, Machomei und alle anderen Kampf-Typen", group: "type" },
  { id: "type-darkness", label: "Finsternis-Pokémon", description: "Nachtara, Hundemon und alle anderen Finsternis-Typen", group: "type" },
  { id: "type-metal", label: "Metall-Pokémon", description: "Stahlos, Metagross und alle anderen Metall-Typen", group: "type" },
  { id: "type-dragon", label: "Drachen-Pokémon", description: "Dragoran, Rayquaza und alle anderen Drachen-Typen", group: "type" },
  { id: "type-fairy", label: "Feen-Pokémon", description: "Piepi, Guardevoir und alle anderen Feen-Typen", group: "type" },
  { id: "type-colorless", label: "Normal-Pokémon", description: "Evoli, Relaxo und alle anderen Normal-Typen", group: "type" },
  { id: "illustration", label: "Illustrations-Karten", description: "Seltene Karten, auf denen das ganze Bild eine Szene ist", group: "special" },
  { id: "shiny", label: "Shiny-Karten", description: "Pokémon in ihren seltenen Sonderfarben", group: "special" },
  { id: "mega", label: "Mega-Pokémon", description: "Kraftvolle Mega-Entwicklungen", group: "special" },
  { id: "classics", label: "Klassische Holos", description: "Glitzernde Sammlerstücke von 1999 bis 2002", group: "special" },
];

export function giftCollectionPreset(id: string | undefined): GiftCollectionPreset | undefined {
  return GIFT_COLLECTION_PRESETS.find((preset) => preset.id === id);
}
