import { createCardmarketHandoff } from "./cardmarket-handoff";
import {
  createTcgplayerMassEntryExport,
  type TcgplayerCardMapping,
  type TcgplayerPrintingMapping,
  type TcgplayerSetMapping,
  type TcgplayerUnavailableSet,
} from "./tcgplayer-export";
import type { MissingItem } from "./types";

export type GiftMarketplaceProvider = "tcgplayer" | "cardmarket";

export interface GiftMarketplaceDocument {
  index: number;
  positionCount: number;
  text: string;
}

export interface GiftMarketplaceHandoff {
  provider: GiftMarketplaceProvider;
  externalUrl: string;
  documents: GiftMarketplaceDocument[];
  readyCount: number;
  reviewRequiredCount: number;
  warnings: string[];
  ownershipEffect: "none";
}

export interface TcgplayerHandoffDependencies {
  setMappings: readonly TcgplayerSetMapping[];
  printingMappings: readonly TcgplayerPrintingMapping[];
  cardMappings?: readonly TcgplayerCardMapping[];
  unavailableSets?: readonly TcgplayerUnavailableSet[];
}

/**
 * Wraps the existing marketplace exporters for Gift completion. This function is
 * deliberately pure: opening or preparing a provider never changes binder state.
 */
export function createGiftMarketplaceHandoff(
  provider: GiftMarketplaceProvider,
  items: readonly MissingItem[],
  tcgplayer?: TcgplayerHandoffDependencies,
): GiftMarketplaceHandoff {
  if (provider === "tcgplayer") {
    if (!tcgplayer) throw new Error("TCGplayer mappings are required for this handoff.");
    const handoff = createTcgplayerMassEntryExport(
      items,
      tcgplayer.setMappings,
      tcgplayer.printingMappings,
      tcgplayer.cardMappings ?? [],
      tcgplayer.unavailableSets ?? [],
    );
    return {
      provider,
      externalUrl: handoff.massEntryUrl,
      documents: [{ index: 1, positionCount: handoff.readyCount, text: handoff.text }],
      readyCount: handoff.readyCount,
      reviewRequiredCount: handoff.reviewRequiredCount,
      warnings: [...handoff.warnings],
      ownershipEffect: "none",
    };
  }

  const handoff = createCardmarketHandoff(items);
  return {
    provider,
    externalUrl: handoff.singlesUrl,
    documents: handoff.parts.map((part) => ({ index: part.index, positionCount: part.importablePositionCount, text: part.text })),
    readyCount: handoff.importablePositionCount,
    reviewRequiredCount: handoff.reviewRequiredCount,
    warnings: [...handoff.warnings],
    ownershipEffect: "none",
  };
}
