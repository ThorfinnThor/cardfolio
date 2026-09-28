import { formatCollectorNumber } from "./catalog-search";
import type { CardLanguage, ExportResult, MissingItem, UUID } from "./types";
import { variantAvailabilityForCard, variantSelectionIssue } from "./variant-selection";

export const TCGPLAYER_MASS_ENTRY_URL = "https://www.tcgplayer.com/massentry";
export const TCGPLAYER_PREFILLED_URL_MAX_LENGTH = 7_000;

export interface TcgplayerSetMapping {
  tcgdexSetId: string;
  tcgdexSetName: string;
  tcgplayerSetCode: string;
  tcgplayerSetName: string;
  source: string;
  verifiedAt: string;
}

export interface TcgplayerUnavailableSet {
  tcgdexSetId: string;
  tcgdexSetName: string;
  reason: string;
}

export interface TcgplayerCardCandidate {
  productName: string;
  collectorNumber: string;
  tcgplayerSetCode: string;
  tcgplayerSetName: string;
  foilOnly: boolean;
  productId: number;
}

export interface TcgplayerCardMapping {
  tcgdexCardId: string;
  tcgdexName: string;
  candidates: TcgplayerCardCandidate[];
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

export type TcgplayerMatchStatus = "verified-printing" | "catalog-verified" | "candidate" | "unresolved";

export interface TcgplayerMatch {
  identityKey: string;
  entryIds: UUID[];
  quantity: number;
  cardName: string;
  setName: string;
  collectorNumber: string;
  status: TcgplayerMatchStatus;
  reason: string;
  printingHint: string;
  conditionHint: string;
  line?: string;
  setMapping?: TcgplayerSetMapping;
  printingMapping?: TcgplayerPrintingMapping;
  cardCandidate?: TcgplayerCardCandidate;
}

export interface TcgplayerMassEntryExport extends ExportResult {
  matches: TcgplayerMatch[];
  readyCount: number;
  massEntryUrl: string;
  massEntryPrefilled: boolean;
}

export function createTcgplayerMassEntryUrl(text: string): string {
  const cleanLines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  if (!cleanLines.length) return TCGPLAYER_MASS_ENTRY_URL;
  const url = new URL(TCGPLAYER_MASS_ENTRY_URL);
  url.searchParams.set("c", cleanLines.join("||"));
  url.searchParams.set("productline", "Pokemon");
  return url.toString().length <= TCGPLAYER_PREFILLED_URL_MAX_LENGTH
    ? url.toString()
    : TCGPLAYER_MASS_ENTRY_URL;
}

export function toTcgplayerItemNumber(collectorNumber: string): string {
  return collectorNumber.trim();
}

export function tcgplayerPrintingHint(item: MissingItem): string {
  const { edition, finish, label } = item.variant;
  if (label?.trim()) return `Manuell abgleichen: ${label.trim()}`;
  if (finish === "reverse") return "Reverse Holofoil";
  if (finish === "holo" && edition === "first-edition") return "1st Edition Holofoil";
  if (finish === "holo" && edition === "unlimited") return "Unlimited Holofoil";
  if (finish === "holo") return "Holofoil, 1st Edition Holofoil oder Unlimited Holofoil";
  if (finish === "normal" && edition === "first-edition") return "1st Edition";
  if (finish === "normal" && edition === "unlimited") return "Unlimited";
  if (finish === "normal") return "Normal, 1st Edition oder Unlimited";
  if (edition === "first-edition") return "1st Edition oder 1st Edition Holofoil";
  if (edition === "unlimited") return "Unlimited oder Unlimited Holofoil";
  return "Alle passenden Printing-Optionen";
}

export function tcgplayerConditionHint(item: MissingItem): string {
  switch (item.preferences.minimumCondition) {
    case "near-mint":
      return "Near Mint";
    case "excellent":
      return "Near Mint und Lightly Played (TCGplayer kennt keinen Zustand Excellent)";
    case "lightly-played":
      return "Near Mint und Lightly Played";
    case "played":
      return "Near Mint, Lightly Played, Moderately Played und Heavily Played";
    case "any":
      return "alle Zustände einschließlich Damaged";
  }
}

function unsafeLineField(value: string): boolean {
  return !value.trim() || /[\r\n\u0000-\u001f\u007f\[\]]/.test(value);
}

function normalizedName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-US")
    .replace(/\s*\(delta species\)\s*/g, " delta ")
    .replace(/\s+delta$/g, " delta")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function chooseCardCandidate(item: MissingItem, mapping?: TcgplayerCardMapping): TcgplayerCardCandidate | undefined {
  if (!mapping) return undefined;
  let candidates = mapping.candidates;
  if (item.variant.printing === "shadowless") {
    candidates = candidates.filter((candidate) => /shadowless/i.test(`${candidate.tcgplayerSetName} ${candidate.productName}`));
  } else {
    candidates = candidates.filter((candidate) => !/shadowless/i.test(`${candidate.tcgplayerSetName} ${candidate.productName}`));
  }
  if (item.variant.finish === "normal") candidates = candidates.filter((candidate) => !candidate.foilOnly);
  if (item.variant.finish === "holo") {
    const foilCandidates = candidates.filter((candidate) => candidate.foilOnly || /holo/i.test(candidate.productName));
    if (foilCandidates.length) candidates = foilCandidates;
  }
  if (item.variant.label?.trim()) {
    const label = normalizedName(item.variant.label);
    const labelled = candidates.filter((candidate) => normalizedName(candidate.productName).includes(label));
    if (labelled.length) candidates = labelled;
  }
  const exactName = normalizedName(mapping.tcgdexName);
  const exact = candidates.filter((candidate) => normalizedName(candidate.productName) === exactName);
  if (exact.length === 1) return exact[0];
  if (candidates.length === 1) return candidates[0];
  const identities = new Map(candidates.map((candidate) => [
    `${candidate.productName}\u0000${candidate.collectorNumber}\u0000${candidate.tcgplayerSetCode}`,
    candidate,
  ]));
  return identities.size === 1 ? [...identities.values()][0] : undefined;
}

function matchItem(
  item: MissingItem,
  setMappings: readonly TcgplayerSetMapping[],
  printingMappings: readonly TcgplayerPrintingMapping[],
  cardMappings: readonly TcgplayerCardMapping[],
  unavailableSets: readonly TcgplayerUnavailableSet[],
): TcgplayerMatch {
  const base = {
    identityKey: item.identityKey,
    entryIds: [...item.entryIds],
    quantity: item.quantity,
    cardName: item.card.name,
    setName: item.card.setName,
    collectorNumber: formatCollectorNumber(item.card.collectorNumber, item.card.collectorTotal),
    printingHint: tcgplayerPrintingHint(item),
    conditionHint: tcgplayerConditionHint(item),
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

  const setMapping = setMappings.find((candidate) => candidate.tcgdexSetId === item.card.setId);

  const printingMapping = printingMappings.find(
    (candidate) => candidate.tcgdexCardId === item.card.ref.id && candidate.language === item.card.ref.language,
  );
  const cardMapping = cardMappings.find((candidate) => candidate.tcgdexCardId === item.card.ref.id);
  const cardCandidate = chooseCardCandidate(item, cardMapping);
  const unavailableSet = unavailableSets.find((candidate) => candidate.tcgdexSetId === item.card.setId);

  const variantIssue = variantSelectionIssue(item.variant, variantAvailabilityForCard(item.card));
  if (variantIssue) {
    return {
      ...base,
      status: "unresolved",
      reason: variantIssue,
    };
  }

  if (unavailableSet) {
    return { ...base, status: "unresolved", reason: unavailableSet.reason };
  }

  if (!setMapping) {
    return {
      ...base,
      status: "candidate",
      reason: "Für dieses TCGdex-Set ist noch kein geprüfter TCGplayer-Set-Code hinterlegt.",
    };
  }

  if (printingMapping && item.variant.printing !== "shadowless") {
    const itemNumber = toTcgplayerItemNumber(printingMapping.tcgplayerCollectorNumber);
    if (unsafeLineField(printingMapping.tcgplayerProductName) || unsafeLineField(itemNumber)) {
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
      line: `${item.quantity} ${printingMapping.tcgplayerProductName} [${setMapping.tcgplayerSetCode}] ${itemNumber}`,
      setMapping,
      printingMapping,
    };
  }

  if (!cardCandidate) {
    return {
      ...base,
      status: "candidate",
      reason: cardMapping
        ? "Mehrere TCGplayer-Produkte passen zu dieser Karte. Finish, Edition oder eigene Variantenbezeichnung reichen noch nicht für eine eindeutige Auswahl."
        : "Für diese Karte wurde im aktuellen TCGplayer-Katalog kein eindeutiges Produkt mit passender Kartennummer gefunden.",
      setMapping,
    };
  }

  if (unsafeLineField(cardCandidate.productName) || unsafeLineField(cardCandidate.collectorNumber)) {
    return {
      ...base,
      status: "unresolved",
      reason: "Der TCGplayer-Produktname oder die Kartennummer ist nicht sicher als einzelne Mass-Entry-Zeile darstellbar.",
      setMapping,
      cardCandidate,
    };
  }

  return {
    ...base,
    status: "catalog-verified",
    reason: "Produktname, Set-Code und Kartennummer stammen aus dem aktuellen TCGplayer-Katalog.",
    line: `${item.quantity} ${cardCandidate.productName} [${cardCandidate.tcgplayerSetCode}] ${cardCandidate.collectorNumber}`,
    setMapping: setMappings.find((mapping) => mapping.tcgdexSetId === item.card.setId && mapping.tcgplayerSetCode === cardCandidate.tcgplayerSetCode) ?? setMapping,
    cardCandidate,
  };
}

export function createTcgplayerMassEntryExport(
  items: readonly MissingItem[],
  setMappings: readonly TcgplayerSetMapping[],
  printingMappings: readonly TcgplayerPrintingMapping[],
  cardMappings: readonly TcgplayerCardMapping[] = [],
  unavailableSets: readonly TcgplayerUnavailableSet[] = [],
): TcgplayerMassEntryExport {
  const matches = items.map((item) => matchItem(item, setMappings, printingMappings, cardMappings, unavailableSets));
  const verified = matches.filter((match) => (match.status === "verified-printing" || match.status === "catalog-verified") && match.line);
  const candidates = matches.filter((match) => match.status === "candidate");
  const unresolved = matches.filter((match) => match.status === "unresolved");
  const ready = matches.filter((match) => match.line);
  const text = ready.map((match) => match.line).join("\n");
  const massEntryUrl = createTcgplayerMassEntryUrl(text);
  const warnings: string[] = [];

  if (verified.length > 0) {
    warnings.push("Druckart, Sprache, Zustand und Finish in TCGplayer Mass Entry vor dem Warenkorb prüfen.");
  }
  const candidatesWithoutSet = candidates.filter((match) => !match.setMapping);
  const candidatesWithoutPrinting = candidates.filter((match) => match.setMapping);
  if (candidatesWithoutSet.length > 0) {
    warnings.push(`${formatPositionCount(candidatesWithoutSet.length)} ${candidatesWithoutSet.length === 1 ? "hat" : "haben"} keinen geprüften TCGplayer-Set-Code und ${candidatesWithoutSet.length === 1 ? "wird" : "werden"} nicht in die TCGplayer-Liste übernommen.`);
  }
  if (candidatesWithoutPrinting.length > 0) {
    warnings.push(`${formatPositionCount(candidatesWithoutPrinting.length)} ${candidatesWithoutPrinting.length === 1 ? "hat" : "haben"} keine eindeutige TCGplayer-Produktzuordnung und ${candidatesWithoutPrinting.length === 1 ? "wird" : "werden"} nicht in die TCGplayer-Liste übernommen.`);
  }
  if (unresolved.length > 0) {
    warnings.push(`${formatPositionCount(unresolved.length)} ${unresolved.length === 1 ? "ist" : "sind"} nicht sicher zuordenbar und ${unresolved.length === 1 ? "wird" : "werden"} nicht in die TCGplayer-Liste übernommen.`);
  }
  if (text && massEntryUrl === TCGPLAYER_MASS_ENTRY_URL) {
    warnings.push("Die Liste ist für eine vorausgefüllte URL zu lang. Kopiere den Mass-Entry-Text und füge ihn bei TCGplayer ein.");
  }

  return {
    text,
    mimeType: "text/plain",
    warnings,
    excludedEntryIds: matches
      .filter((match) => !match.line)
      .flatMap((match) => match.entryIds),
    verifiedCount: verified.length,
    reviewRequiredCount: candidates.length + unresolved.length,
    readyCount: ready.length,
    matches,
    massEntryUrl,
    massEntryPrefilled: Boolean(text) && massEntryUrl !== TCGPLAYER_MASS_ENTRY_URL,
  };
}

function formatPositionCount(count: number): string {
  return `${count} ${count === 1 ? "Position" : "Positionen"}`;
}
