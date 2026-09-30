// Allowed v3 tag names (multi-label presence tags). Order is fixed: it defines the bit order of the index.
export const TAGS = [
  'beach', 'water-surface', 'underwater', 'forest', 'grassland-field', 'mountain-rocks', 'cave', 'desert',
  'snow-ice', 'city', 'indoors', 'ruins-building', 'sky-clouds', 'space', 'night', 'sunset-sunrise',
  'storm-weather', 'fire-lava', 'flowers', 'food-visible', 'human-present', 'multiple-pokemon', 'sleeping',
  'flying', 'swimming',
];
export function validate(r) {
  const errs = [];
  if (typeof r?.id !== 'string') errs.push('id');
  if (!Array.isArray(r?.tags) || r.tags.some((t) => !TAGS.includes(t)) || new Set(r.tags).size !== r.tags.length) errs.push('tags');
  if (typeof r?.caption !== 'string' || !r.caption.trim() || r.caption.split(/\s+/).length > 20) errs.push('caption');
  return errs;
}
