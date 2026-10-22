import { cardtraderCatalog, type CardTraderCatalog } from "@/data/cardtrader/catalog";
import type { MissingItem } from "@/domain/types";

/** Product page by TCGplayer product id. Opened and checked in a browser on 2026-10-22 (Base Set Charizard, 42382). */
export function tcgplayerProductUrl(productId: number): string {
  return `https://www.tcgplayer.com/product/${productId}`;
}

export interface TcgplayerProductLink {
  identityKey: string;
  label: string;
  details: string;
  url: string;
}

/**
 * Direct TCGplayer product pages for missing cards, from the TCGplayer product id that CardTrader lists on each
 * blueprint. A card gets a link only when its blueprint is found by the verified set mapping and collector number.
 * TCGplayer lists the English card, so a German card is marked as such.
 */
export async function cardtraderTcgplayerLinks(items: readonly MissingItem[], catalog: CardTraderCatalog = cardtraderCatalog): Promise<TcgplayerProductLink[]> {
  const links: TcgplayerProductLink[] = [];
  for (const item of items) {
    const match = await catalog.blueprint(item.card.ref.language, item.card.setId, item.card.collectorNumber, item.card.englishIdentity?.name ?? item.card.name);
    const productId = match?.blueprint.tp;
    if (!productId) continue;
    links.push({
      identityKey: item.identityKey,
      label: `${item.quantity}× ${item.card.name}`,
      details: `${item.card.setName} · Nr. ${item.card.collectorNumber}${item.card.ref.language === "de" ? " · TCGplayer zeigt die englische Karte" : ""}`,
      url: tcgplayerProductUrl(productId),
    });
  }
  return links;
}
