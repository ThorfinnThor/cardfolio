import type { CatalogQuery } from "@/domain/types";

export type ParsedCatalogSearch = Pick<CatalogQuery, "name" | "collectorNumber" | "collectorTotal">;

function normalizeNumericPart(value: string): string {
  const trimmed = value.trim();
  return /^\d+$/.test(trimmed) ? String(Number(trimmed)) : trimmed;
}

export function parseCatalogSearch(value: string): ParsedCatalogSearch {
  const input = value.trim();
  if (!input) return {};

  const numbered = input.match(/^(.*?)(?:\s+)?#?([a-z0-9-]+)\s*\/\s*([a-z0-9-]+)$/i);
  if (numbered) {
    const name = numbered[1].trim();
    return {
      ...(name ? { name } : {}),
      collectorNumber: normalizeNumericPart(numbered[2]),
      collectorTotal: normalizeNumericPart(numbered[3]),
    };
  }

  const hashNumber = input.match(/^(.*?)\s+#\s*([a-z0-9-]+)$/i);
  if (hashNumber) {
    const name = hashNumber[1].trim();
    return {
      ...(name ? { name } : {}),
      collectorNumber: normalizeNumericPart(hashNumber[2]),
    };
  }

  return { name: input };
}

export function sameCollectorPart(left: string, right: string): boolean {
  return normalizeNumericPart(left).toLocaleLowerCase("en-US") === normalizeNumericPart(right).toLocaleLowerCase("en-US");
}

export function formatCollectorNumber(number: string, total?: string): string {
  return total ? `${number}/${total}` : number;
}
