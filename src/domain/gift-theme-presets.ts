import type { SemanticTag } from "@/domain/semantic-card-search";

export interface GiftThemePreset {
  id: string;
  label: string;
  description: string;
  query: string;
  mappedTags: readonly SemanticTag[];
}

/**
 * Curated, deliberately broad artwork themes for the Gift Builder.
 * Each query maps only to reviewed semantic tags and stays broad enough for
 * a useful 36-card gift-binder candidate pool.
 */
export const GIFT_THEME_PRESETS: readonly GiftThemePreset[] = [
  { id: "sea", label: "Meer & Wasser", description: "Küste, Seen und Unterwasserwelten", query: "Meer", mappedTags: ["water-surface", "underwater"] },
  { id: "forest", label: "Wald", description: "Wälder, Bäume und Dschungel", query: "Wald", mappedTags: ["forest"] },
  { id: "meadow", label: "Wiese & Felder", description: "Grüne Landschaften und offene Felder", query: "Wiese", mappedTags: ["grassland-field"] },
  { id: "mountains", label: "Berge & Felsen", description: "Gipfel, Klippen und Steinlandschaften", query: "Berge", mappedTags: ["mountain-rocks"] },
  { id: "night", label: "Nacht", description: "Dunkle Szenen und Mondlicht", query: "Nacht", mappedTags: ["night"] },
  { id: "fire", label: "Feuer & Lava", description: "Flammen, Magma und Vulkane", query: "Feuer", mappedTags: ["fire-lava"] },
  { id: "snow", label: "Schnee & Eis", description: "Winterliche und gefrorene Motive", query: "Schnee", mappedTags: ["snow-ice"] },
  { id: "city", label: "Stadt", description: "Straßen, Orte und urbane Szenen", query: "Stadt", mappedTags: ["city"] },
  { id: "sky", label: "Himmel & Wolken", description: "Weite Himmel und Wolkenlandschaften", query: "Himmel", mappedTags: ["sky-clouds"] },
  { id: "flowers", label: "Blumen", description: "Blüten, Gärten und farbige Natur", query: "Blumen", mappedTags: ["flowers"] },
] as const;

export function giftThemePreset(id: string | undefined): GiftThemePreset | undefined {
  return GIFT_THEME_PRESETS.find((preset) => preset.id === id);
}
