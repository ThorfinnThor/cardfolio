import { cardtraderCatalog, type CardTraderCatalog } from "@/data/cardtrader/catalog";
import type { MarketplaceProductIdentityMapping } from "@/domain/marketplace-product-identity";
import type { MissingItem } from "@/domain/types";

/** Product page by Cardmarket product id. The format was opened and checked by hand on 2026-10-21. */
export function cardmarketProductUrl(productId: number): string {
  return `https://www.cardmarket.com/en/Pokemon/Products?idProduct=${productId}`;
}

/**
 * Direct Cardmarket product identities for missing cards, taken from the Cardmarket product id that CardTrader
 * lists on each blueprint (an exact provider id, source kind "provider-external-id"). A card gets a mapping only
 * when its blueprint is found by the verified set mapping and collector number and carries exactly one id.
 * Cards that already have a reviewed mapping are left out so the two can never contradict each other.
 */
export async function cardtraderCardmarketMappings(
  items: readonly MissingItem[],
  options: { catalog?: CardTraderCatalog; alreadyMapped?: ReadonlySet<string>; now?: string } = {},
): Promise<MarketplaceProductIdentityMapping[]> {
  const catalog = options.catalog ?? cardtraderCatalog;
  const checkedAt = options.now ?? new Date().toISOString();
  const seen = new Set<string>();
  const mappings: MarketplaceProductIdentityMapping[] = [];
  for (const item of items) {
    const cardId = item.card.ref.id;
    if (seen.has(cardId) || options.alreadyMapped?.has(cardId)) continue;
    seen.add(cardId);
    const match = await catalog.blueprint(item.card.ref.language, item.card.setId, item.card.collectorNumber, item.card.englishIdentity?.name ?? item.card.name);
    const ids = match?.blueprint.cm ?? [];
    if (ids.length !== 1) continue;
    mappings.push({
      schemaVersion: 1,
      provider: "cardmarket",
      tcgdexCardId: cardId,
      cardName: item.card.name,
      scope: { language: "any", finish: "any", edition: "any", printing: "any" },
      status: "verified",
      providerProductId: String(ids[0]),
      productUrl: cardmarketProductUrl(ids[0]!),
      source: {
        kind: "provider-external-id",
        label: `Cardmarket-Produkt-ID laut CardTrader-Blueprint ${match!.blueprint.id}`,
        evidenceUrl: `https://www.cardtrader.com/en/games/pokemon/expansions`,
      },
      checkedAt,
      verifiedAt: checkedAt,
    });
  }
  return mappings;
}
