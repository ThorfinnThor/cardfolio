/** Folds case and diacritics so "Pokémon" and "pokemon" compare equal. */
function fold(value: string): string {
  return value.normalize("NFKD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("de");
}

function editDistance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = row[0]!;
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const above = row[j]!;
      row[j] = Math.min(above + 1, row[j - 1]! + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return row[b.length]!;
}

/**
 * The words of the given card names that are closest to a mistyped name ("Pikatschu" → "Pikachu"). Card names such as
 * "Surfendes Pikachu VMAX" are split into words, so the suggestion is the Pokémon, not the whole card title.
 * A word that is spelled exactly like the input is never suggested, and nothing is suggested when no word is close.
 */
export function suggestNames(typo: string, cardNames: readonly string[], limit = 3): string[] {
  const wanted = fold(typo.trim());
  if (wanted.length < 4) return [];
  const allowed = Math.max(1, Math.min(3, Math.floor(wanted.length / 3)));
  const best = new Map<string, { word: string; distance: number; count: number }>();
  for (const name of cardNames) {
    for (const word of name.split(/[\s,.:;()]+/)) {
      if (word.length < 4 || !/^\p{L}[\p{L}\-'’]*$/u.test(word)) continue;
      const folded = fold(word);
      if (folded === wanted) return [];
      const distance = editDistance(wanted, folded);
      if (distance === 0 || distance > allowed) continue;
      const known = best.get(folded);
      if (known) known.count += 1;
      else best.set(folded, { word, distance, count: 1 });
    }
  }
  return [...best.values()]
    .sort((left, right) => left.distance - right.distance || right.count - left.count || left.word.localeCompare(right.word, "de"))
    .slice(0, limit)
    .map((entry) => entry.word);
}
