// Artwork crop per series for the full EN catalogue (fractions of the card: left, top, right, bottom).
// Calibrated by eye on sample cards per series; whole card for secret rares and full-art rule boxes.
const BY_SERIE = {
  base: [0.09, 0.1, 0.91, 0.49],
  gym: [0.09, 0.1, 0.91, 0.5],
  neo: [0.09, 0.1, 0.91, 0.5],
  lc: [0.09, 0.1, 0.91, 0.5],
  ecard: [0.08, 0.1, 0.92, 0.52],
  ex: [0.08, 0.1, 0.92, 0.52],
  pop: [0.06, 0.09, 0.94, 0.5],
  dp: [0.08, 0.1, 0.92, 0.5],
  pl: [0.08, 0.1, 0.92, 0.5],
  hgss: [0.07, 0.09, 0.93, 0.52],
  col: [0.07, 0.09, 0.93, 0.52],
  bw: [0.08, 0.1, 0.92, 0.51],
  xy: [0.08, 0.1, 0.92, 0.52],
  sm: [0.08, 0.1, 0.92, 0.51],
  swsh: [0.08, 0.1, 0.92, 0.51],
  sv: [0.05, 0.1, 0.95, 0.51],
  me: [0.05, 0.1, 0.95, 0.51],
  tcgp: [0.09, 0.1, 0.91, 0.51],
};
const MODERN = new Set(['sm', 'swsh', 'sv', 'me', 'tcgp']);

/** card: { serie, localId, name }, official: printed set size (or null). Returns crop box or null (whole card). */
export function cropFor(card, official) {
  const n = parseInt(card.localId, 10);
  if (official && !Number.isNaN(n) && n > official) return null;
  if (MODERN.has(card.serie) && /(\bex|GX| V| VMAX| VSTAR)$/.test(card.name)) return null;
  return BY_SERIE[card.serie] ?? null;
}
