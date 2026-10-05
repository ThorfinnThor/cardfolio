export function normalizeSetName(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function bigrams(value) {
  const compact = normalizeSetName(value).replace(/\s+/g, "");
  if (compact.length < 2) return compact ? [compact] : [];
  return Array.from({ length: compact.length - 1 }, (_, index) => compact.slice(index, index + 2));
}

function dice(left, right) {
  const leftPairs = bigrams(left);
  const rightPairs = bigrams(right);
  if (!leftPairs.length || !rightPairs.length) return 0;
  const remaining = new Map();
  for (const pair of rightPairs) remaining.set(pair, (remaining.get(pair) ?? 0) + 1);
  let overlap = 0;
  for (const pair of leftPairs) {
    const count = remaining.get(pair) ?? 0;
    if (count > 0) {
      overlap += 1;
      remaining.set(pair, count - 1);
    }
  }
  return (2 * overlap) / (leftPairs.length + rightPairs.length);
}

function tokenJaccard(left, right) {
  const leftTokens = new Set(normalizeSetName(left).split(" ").filter(Boolean));
  const rightTokens = new Set(normalizeSetName(right).split(" ").filter(Boolean));
  if (!leftTokens.size || !rightTokens.size) return 0;
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  return intersection / new Set([...leftTokens, ...rightTokens]).size;
}

function nameScore(left, right) {
  const normalizedLeft = normalizeSetName(left);
  const normalizedRight = normalizeSetName(right);
  if (!normalizedLeft || !normalizedRight) return 0;
  if (normalizedLeft === normalizedRight) return 1;
  const containment = normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft) ? 0.72 : 0;
  return Math.max(dice(normalizedLeft, normalizedRight), tokenJaccard(normalizedLeft, normalizedRight), containment);
}

export function exactExpansionMatches(names, setId, expansions) {
  const normalizedNames = new Set(names.map(normalizeSetName).filter(Boolean));
  const normalizedId = normalizeSetName(setId);
  return expansions.filter((expansion) =>
    normalizedNames.has(normalizeSetName(expansion.name))
    || (normalizedId && normalizedId === normalizeSetName(expansion.code)),
  );
}

export function rankExpansionSuggestions(names, setId, expansions, limit = 3) {
  const normalizedId = normalizeSetName(setId);
  return expansions
    .map((expansion) => {
      let score = normalizedId && normalizedId === normalizeSetName(expansion.code) ? 1 : 0;
      let matchedAgainst = score === 1 ? `code:${setId}` : names[0];
      for (const name of names) {
        const candidateScore = nameScore(name, expansion.name);
        if (candidateScore > score) {
          score = candidateScore;
          matchedAgainst = name;
        }
      }
      return {
        id: String(expansion.id),
        code: expansion.code,
        name: expansion.name,
        score: Number(score.toFixed(3)),
        matchedAgainst,
      };
    })
    .filter((candidate) => candidate.score >= 0.45)
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name, "en-US"))
    .slice(0, limit);
}

export function expansionReference(expansion) {
  return {
    id: String(expansion.id),
    code: expansion.code,
    name: expansion.name,
  };
}
