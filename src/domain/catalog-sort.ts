import type { CatalogSearchItem } from "./types";

export type CatalogResultSort = "relevance" | "set-number" | "collector-number" | "release-date";

export interface CatalogSortSetMetadata {
  name: string;
  releaseDate?: string;
}

type CollectorToken = { kind: "number"; value: number; raw: string } | { kind: "text"; value: string };

function collectorPart(value: string): string {
  return value.split("/")[0]?.trim().normalize("NFKC").toLocaleUpperCase("en-US") ?? "";
}

function collectorTokens(value: string): CollectorToken[] {
  return (collectorPart(value).match(/\d+|[^\d]+/g) ?? []).map((token): CollectorToken => /^\d+$/.test(token)
    ? { kind: "number", value: Number(token), raw: token }
    : { kind: "text", value: token.replace(/[\s._-]+/g, " ").trim() });
}

/** Natural collector-number ordering for numeric, prefixed, suffixed and secret-rare IDs. */
export function compareCollectorNumbers(left: string, right: string): number {
  const leftTokens = collectorTokens(left);
  const rightTokens = collectorTokens(right);
  const count = Math.max(leftTokens.length, rightTokens.length);
  for (let index = 0; index < count; index += 1) {
    const leftToken = leftTokens[index];
    const rightToken = rightTokens[index];
    if (!leftToken) return -1;
    if (!rightToken) return 1;
    if (leftToken.kind !== rightToken.kind) return leftToken.kind === "number" ? -1 : 1;
    if (leftToken.kind === "number" && rightToken.kind === "number") {
      if (leftToken.value !== rightToken.value) return leftToken.value - rightToken.value;
      if (leftToken.raw.length !== rightToken.raw.length) return leftToken.raw.length - rightToken.raw.length;
      continue;
    }
    if (leftToken.kind === "text" && rightToken.kind === "text") {
      const comparison = leftToken.value.localeCompare(rightToken.value, "en", { sensitivity: "base" });
      if (comparison) return comparison;
    }
  }
  return collectorPart(left).localeCompare(collectorPart(right), "en", { sensitivity: "variant" });
}

function stableIdentity(item: CatalogSearchItem): string {
  return `${item.ref.language}\u0000${item.ref.id}`;
}

/** Returns a sorted copy. Binder/page state is never accepted or mutated here. */
export function sortCatalogSearchItems(
  items: readonly CatalogSearchItem[],
  sort: CatalogResultSort,
  setMetadata: (item: CatalogSearchItem) => CatalogSortSetMetadata | undefined = () => undefined,
): CatalogSearchItem[] {
  if (sort === "relevance") return [...items];
  return [...items].sort((left, right) => {
    const leftSet = setMetadata(left);
    const rightSet = setMetadata(right);
    if (sort === "release-date") {
      const dateComparison = (rightSet?.releaseDate ?? "").localeCompare(leftSet?.releaseDate ?? "");
      if (dateComparison) return dateComparison;
    }
    if (sort === "set-number" || sort === "release-date") {
      const setComparison = (leftSet?.name ?? left.setName ?? left.setId ?? "")
        .localeCompare(rightSet?.name ?? right.setName ?? right.setId ?? "", "de", { sensitivity: "base" });
      if (setComparison) return setComparison;
    }
    const collectorComparison = compareCollectorNumbers(left.collectorNumber, right.collectorNumber);
    if (collectorComparison) return collectorComparison;
    return stableIdentity(left).localeCompare(stableIdentity(right));
  });
}
