import { formatCollectorNumber } from "./catalog-search";
import type { CardLanguage, ExportResult, MissingItem, UUID } from "./types";

export const TCGPLAYER_MASS_ENTRY_URL = "https://www.tcgplayer.com/massentry";

export interface TcgplayerSetMapping {
  tcgdexSetId: string;
  tcgdexSetName: string;
  language: CardLanguage;
  tcgplayerSetCode: string;
  tcgplayerSetName: string;
  source: string;
  verifiedAt: string;
}

export interface TcgplayerPrintingMapping {
  tcgdexCardId: string;
  language: CardLanguage;
  tcgplayerProductName: string;
  tcgplayerCollectorNumber: string;
  source: string;
  identitySource?: string;
  verifiedAt: string;
}

export type TcgplayerMatchStatus = "verified-printing" | "candidate" | "unresolved";

export interface TcgplayerMatch {
  identityKey: string;
  entryIds: UUID[];
  quantity: number;
  cardName: string;
  setName: string;
  collectorNumber: string;
  status: TcgplayerMatchStatus;
  reason: string;
  line?: string;
  setMapping?: TcgplayerSetMapping;
  printingMapping?: TcgplayerPrintingMapping;
}

export interface TcgplayerMassEntryExport extends ExportResult {
  matches: TcgplayerMatch[];
  massEntryUrl: typeof TCGPLAYER_MASS_ENTRY_URL;
}

function unsafeLineField(value: string): boolean {
  return !value.trim() || /[\r\n\u0000-\u001f\u007f\[\]]/.test(value);
}

function matchItem(
  item: MissingItem,
  setMappings: readonly TcgplayerSetMapping[],
  printingMappings: readonly TcgplayerPrintingMapping[],
): TcgplayerMatch {
  const base = {
    identityKey: item.identityKey,
    entryIds: [...item.entryIds],
    quantity: item.quantity,
    cardName: item.card.name,
    setName: item.card.setName,
    collectorNumber: formatCollectorNumber(item.card.collectorNumber, item.card.collectorTotal),
  };

  if (item.card.physicalStatus !== "physical") {
    return {
      ...base,
      status: "unresolved",
      reason: "Die physische Ausgabe ist nicht bestätigt.",
    };
  }

  if (unsafeLineField(item.card.name) || unsafeLineField(base.collectorNumber)) {
    return {
      ...base,
      status: "unresolved",
      reason: "Name oder Kartennummer ist nicht sicher als einzelne Mass-Entry-Zeile darstellbar.",
    };
  }

  const setMapping = setMappings.find(
    (candidate) => candidate.tcgdexSetId === item.card.setId && candidate.language === item.card.ref.language,
  );

  const printingMapping = printingMappings.find(
    (candidate) => candidate.tcgdexCardId === item.card.ref.id && candidate.language === item.card.ref.language,
  );

  if (item.card.ref.language !== "en" && !printingMapping) {
    return {
      ...base,
      status: "unresolved",
      reason: "Für diese deutsche Karte ist kein geprüfter englischer TCGplayer-Name hinterlegt.",
    };
  }

  if (!setMapping) {
    return {
      ...base,
      status: "candidate",
      reason: "Für dieses TCGdex-Set ist noch kein geprüfter TCGplayer-Set-Code hinterlegt.",
    };
  }

  if (!printingMapping) {
    return {
      ...base,
      status: "candidate",
      reason: "Der Set-Code ist geprüft, dieses konkrete Printing aber noch nicht im TCGplayer-Testset.",
      setMapping,
    };
  }

  if (unsafeLineField(printingMapping.tcgplayerProductName) || unsafeLineField(printingMapping.tcgplayerCollectorNumber)) {
    return {
      ...base,
      status: "unresolved",
      reason: "Der geprüfte TCGplayer-Name oder die Kartennummer ist nicht sicher als einzelne Mass-Entry-Zeile darstellbar.",
      setMapping,
      printingMapping,
    };
  }

  return {
    ...base,
    status: "verified-printing",
    reason: "TCGplayer-Name, Set-Code und Kartennummer sind für Mass Entry geprüft.",
    line: `${item.quantity} ${printingMapping.tcgplayerProductName} [${setMapping.tcgplayerSetCode}] ${printingMapping.tcgplayerCollectorNumber}`,
    setMapping,
    printingMapping,
  };
}

export function createTcgplayerMassEntryExport(
  items: readonly MissingItem[],
  setMappings: readonly TcgplayerSetMapping[],
  printingMappings: readonly TcgplayerPrintingMapping[],
): TcgplayerMassEntryExport {
  const matches = items.map((item) => matchItem(item, setMappings, printingMappings));
  const verified = matches.filter((match) => match.status === "verified-printing" && match.line);
  const candidates = matches.filter((match) => match.status === "candidate");
  const unresolved = matches.filter((match) => match.status === "unresolved");
  const warnings: string[] = [];

  if (verified.length > 0) {
    warnings.push("Druckart, Sprache, Zustand und Finish in TCGplayer Mass Entry vor dem Warenkorb prüfen.");
  }
  const candidatesWithoutSet = candidates.filter((match) => !match.setMapping);
  const candidatesWithoutPrinting = candidates.filter((match) => match.setMapping);
  if (candidatesWithoutSet.length > 0) {
    warnings.push(`${candidatesWithoutSet.length} Position(en) haben keinen geprüften TCGplayer-Set-Code und wurden ausgeschlossen.`);
  }
  if (candidatesWithoutPrinting.length > 0) {
    warnings.push(`${candidatesWithoutPrinting.length} Position(en) haben einen geprüften Set-Code, aber noch kein geprüftes Printing und wurden ausgeschlossen.`);
  }
  if (unresolved.length > 0) {
    warnings.push(`${unresolved.length} Position(en) sind nicht sicher zuordenbar und wurden ausgeschlossen.`);
  }

  return {
    text: verified.map((match) => match.line).join("\n"),
    mimeType: "text/plain",
    warnings,
    excludedEntryIds: matches
      .filter((match) => match.status !== "verified-printing")
      .flatMap((match) => match.entryIds),
    verifiedCount: verified.length,
    reviewRequiredCount: candidates.length + unresolved.length,
    matches,
    massEntryUrl: TCGPLAYER_MASS_ENTRY_URL,
  };
}
