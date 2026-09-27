"use client";

import { Clipboard, Download, ExternalLink, FileDown, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import { TCGPLAYER_SET_MAPPINGS } from "@/data/marketplace/tcgplayer-set-mappings";
import { TCGPLAYER_PRINTING_MAPPINGS } from "@/data/marketplace/tcgplayer-printing-mappings";
import { createCardmarketHandoff, type CardmarketHandoffPart } from "@/domain/cardmarket-handoff";
import { formatCollectorNumber } from "@/domain/catalog-search";
import { missingItemReviewNote } from "@/domain/missing-items-export";
import { minimumConditionLabels } from "@/domain/purchase-preferences";
import { createTcgplayerMassEntryExport, type TcgplayerMassEntryExport } from "@/domain/tcgplayer-export";
import type { MissingItem } from "@/domain/types";
import { printingLabels, selectedPrinting } from "@/domain/variant-selection";

import styles from "./missing-cards-panel.module.css";

const finishLabels = { normal: "Normal", holo: "Holo", reverse: "Reverse Holo", other: "Andere", unspecified: "Nicht angegeben" } as const;
const editionLabels = { unlimited: "Unlimited", "first-edition": "First Edition", unspecified: "Nicht angegeben" } as const;
type MarketplaceChoice = "tcgplayer" | "cardmarket";

interface MissingCardsPanelProps {
  items: readonly MissingItem[];
  warnings: readonly string[];
  copyState: "idle" | "copied" | "error";
  onCopy: (items: readonly MissingItem[]) => void;
  onTextExport: (items: readonly MissingItem[]) => void;
  onCsvExport: (items: readonly MissingItem[]) => void;
  onClose: () => void;
  tcgplayerEnabled?: boolean;
  tcgplayerCopyState?: "idle" | "copied" | "error";
  onTcgplayerCopy?: (exported: TcgplayerMassEntryExport) => void;
  onTcgplayerTextExport?: (exported: TcgplayerMassEntryExport) => void;
  cardmarketEnabled?: boolean;
  cardmarketCopyState?: "idle" | "copied" | "error";
  onCardmarketCopy?: (part: CardmarketHandoffPart) => void;
  onCardmarketTextExport?: (part: CardmarketHandoffPart) => void;
}

export function MissingCardsPanel({
  items,
  warnings,
  copyState,
  onCopy,
  onTextExport,
  onCsvExport,
  onClose,
  tcgplayerEnabled = false,
  tcgplayerCopyState = "idle",
  onTcgplayerCopy,
  onTcgplayerTextExport,
  cardmarketEnabled = false,
  cardmarketCopyState = "idle",
  onCardmarketCopy,
  onCardmarketTextExport,
}: MissingCardsPanelProps) {
  const [query, setQuery] = useState("");
  const [cardmarketPartIndex, setCardmarketPartIndex] = useState(0);
  const [marketplaceChoice, setMarketplaceChoice] = useState<MarketplaceChoice>();
  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("de-DE");
    if (!normalizedQuery) return items;
    return items.filter((item) => [item.card.name, item.card.setName, item.card.collectorNumber].some((value) => value.toLocaleLowerCase("de-DE").includes(normalizedQuery)));
  }, [items, query]);
  const visibleQuantity = visibleItems.reduce((total, item) => total + item.quantity, 0);
  const tcgplayerExport = useMemo(
    () => tcgplayerEnabled
      ? createTcgplayerMassEntryExport(visibleItems, TCGPLAYER_SET_MAPPINGS, TCGPLAYER_PRINTING_MAPPINGS)
      : undefined,
    [tcgplayerEnabled, visibleItems],
  );
  const cardmarketHandoff = useMemo(
    () => cardmarketEnabled ? createCardmarketHandoff(visibleItems) : undefined,
    [cardmarketEnabled, visibleItems],
  );
  const activeCardmarketPartIndex = cardmarketHandoff?.parts.length
    ? Math.min(cardmarketPartIndex, cardmarketHandoff.parts.length - 1)
    : 0;
  const activeCardmarketPart = cardmarketHandoff?.parts[activeCardmarketPartIndex];

  return (
    <section className={styles.panel} aria-labelledby="missing-cards-heading">
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Einkaufsliste · lokal</p>
          <h2 id="missing-cards-heading">Fehlende Karten</h2>
          <p className={styles.subline}>{visibleItems.length} Positionen · {visibleQuantity} Exemplare · aus diesem Binder</p>
        </div>
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Fehlkartenansicht schließen"><X size={18} /></button>
      </div>

      <div className={styles.toolbar}>
        <label className={styles.searchLabel} htmlFor="missing-card-filter">
          <Search aria-hidden="true" size={17} />
          <span className={styles.srOnly}>Fehlkarten filtern</span>
          <input id="missing-card-filter" placeholder="Name, Set oder Nummer" onChange={(event) => setQuery(event.target.value)} />
        </label>
        <div className={styles.exportActions}>
          <button type="button" className={styles.secondaryButton} onClick={() => onCopy(visibleItems)} disabled={!visibleItems.length}>
            <Clipboard size={16} /> {copyState === "copied" ? "Kopiert" : "Liste kopieren"}
          </button>
          <button type="button" className={styles.secondaryButton} onClick={() => onTextExport(visibleItems)} disabled={!visibleItems.length}><Download size={16} /> TXT</button>
          <button type="button" className={styles.primaryButton} onClick={() => onCsvExport(visibleItems)} disabled={!visibleItems.length}><FileDown size={16} /> CSV</button>
        </div>
      </div>

      {copyState === "error" ? <p className={styles.error} role="status">Kopieren wurde vom Browser nicht erlaubt. Nutze stattdessen TXT oder CSV.</p> : null}
      {warnings.map((warning) => <p className={styles.warning} role="note" key={warning}>{warning}</p>)}

      {tcgplayerEnabled || cardmarketEnabled ? (
        <section className={styles.marketplaceChoice} aria-labelledby="marketplace-choice-heading">
          <div>
            <h3 id="marketplace-choice-heading">Marketplace-Übergabe</h3>
            <p>Wähle einen Anbieter. Es wird immer nur die dazugehörige Übergabe angezeigt.</p>
          </div>
          <div className={styles.marketplaceChoiceActions} role="group" aria-label="Marketplace auswählen">
            {tcgplayerEnabled ? (
              <button type="button" aria-pressed={marketplaceChoice === "tcgplayer"} onClick={() => setMarketplaceChoice("tcgplayer")}>TCGplayer</button>
            ) : null}
            {cardmarketEnabled ? (
              <button type="button" aria-pressed={marketplaceChoice === "cardmarket"} onClick={() => setMarketplaceChoice("cardmarket")}>Cardmarket</button>
            ) : null}
          </div>
        </section>
      ) : null}

      {marketplaceChoice === "tcgplayer" && tcgplayerExport ? (
        <section className={styles.marketplacePanel} aria-labelledby="tcgplayer-export-heading">
          <div className={styles.marketplaceHeader}>
            <div>
              <p className={styles.eyebrow}>Geprüfte Marketplace-Übergabe</p>
              <h3 id="tcgplayer-export-heading">TCGplayer Mass Entry</h3>
              <p>{tcgplayerExport.verifiedCount} geprüft · {tcgplayerExport.reviewRequiredCount} manuell prüfen</p>
            </div>
            <a href={tcgplayerExport.massEntryUrl} target="_blank" rel="noopener noreferrer">
              TCGplayer öffnen <ExternalLink aria-hidden="true" size={15} />
            </a>
          </div>

          <label className={styles.massEntryPreview}>
            <span>Mass-Entry-Text · nur exakt geprüfte TCGplayer-Printings</span>
            <textarea
              aria-label="TCGplayer Mass-Entry-Vorschau"
              readOnly
              rows={Math.max(3, Math.min(tcgplayerExport.verifiedCount, 8))}
              value={tcgplayerExport.text}
              placeholder="Für den aktuellen Filter ist keine geprüfte TCGplayer-Zeile verfügbar."
            />
          </label>

          <div className={styles.marketplaceActions}>
            <button type="button" className={styles.primaryButton} disabled={!tcgplayerExport.text} onClick={() => onTcgplayerCopy?.(tcgplayerExport)}>
              <Clipboard size={16} /> {tcgplayerCopyState === "copied" && tcgplayerExport.text ? "TCGplayer kopiert" : "TCGplayer kopieren"}
            </button>
            <button type="button" className={styles.secondaryButton} disabled={!tcgplayerExport.text} onClick={() => onTcgplayerTextExport?.(tcgplayerExport)}>
              <Download size={16} /> TCGplayer TXT
            </button>
          </div>

          {tcgplayerCopyState === "error" ? <p className={styles.error} role="status">Kopieren wurde nicht erlaubt. Der Text bleibt oben markierbar oder kann als TXT geladen werden.</p> : null}
          {tcgplayerExport.warnings.map((warning) => <p className={styles.warning} role="note" key={warning}>{warning}</p>)}

          {tcgplayerExport.reviewRequiredCount > 0 ? (
            <div className={styles.reviewList}>
              <strong>Vom spezifischen Export ausgeschlossen</strong>
              <ul>
                {tcgplayerExport.matches.filter((match) => match.status !== "verified-printing").map((match) => (
                  <li key={match.identityKey}>
                    <span>{match.quantity}× {match.cardName} · {match.setName} · {match.collectorNumber}</span>
                    <small>{match.status === "candidate" ? "Kandidat" : "Nicht zugeordnet"}: {match.reason}</small>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      {marketplaceChoice === "cardmarket" && cardmarketHandoff && activeCardmarketPart ? (
        <section className={styles.marketplacePanel} aria-labelledby="cardmarket-handoff-heading">
          <div className={styles.marketplaceHeader}>
            <div>
              <p className={styles.eyebrow}>Prüfpflichtige Marketplace-Übergabe</p>
              <h3 id="cardmarket-handoff-heading">Cardmarket Prüfliste</h3>
              <p>{cardmarketHandoff.positionCount} Positionen · {cardmarketHandoff.reviewRequiredCount} Ausgaben prüfen</p>
            </div>
            <a href={cardmarketHandoff.singlesUrl} target="_blank" rel="noopener noreferrer">
              Auf Cardmarket suchen <ExternalLink aria-hidden="true" size={15} />
            </a>
          </div>

          {cardmarketHandoff.warnings.map((warning) => <p className={styles.warning} role="note" key={warning}>{warning}</p>)}

          <div className={styles.partControls}>
            <label htmlFor="cardmarket-part">Listenteil</label>
            <select
              id="cardmarket-part"
              value={activeCardmarketPartIndex}
              onChange={(event) => setCardmarketPartIndex(Number(event.target.value))}
            >
              {cardmarketHandoff.parts.map((part, index) => (
                <option value={index} key={part.index}>Teil {part.index} von {cardmarketHandoff.parts.length} · {part.positionCount} Positionen</option>
              ))}
            </select>
          </div>

          <label className={styles.massEntryPreview}>
            <span>Referenz für die manuelle Ausgabeprüfung · kein automatischer Decklistenimport</span>
            <textarea
              aria-label="Cardmarket-Prüflistenvorschau"
              readOnly
              rows={Math.max(3, Math.min(activeCardmarketPart.positionCount, 8))}
              value={activeCardmarketPart.text}
            />
          </label>

          <div className={styles.marketplaceActions}>
            <button type="button" className={styles.primaryButton} onClick={() => onCardmarketCopy?.(activeCardmarketPart)}>
              <Clipboard size={16} /> {cardmarketCopyState === "copied" ? `Teil ${activeCardmarketPart.index} kopiert` : "Prüfliste kopieren"}
            </button>
            <button type="button" className={styles.secondaryButton} onClick={() => onCardmarketTextExport?.(activeCardmarketPart)}>
              <Download size={16} /> Prüfliste TXT
            </button>
            <a className={styles.helpLink} href={cardmarketHandoff.wantsHelpUrl} target="_blank" rel="noopener noreferrer">Offizielles Importformat</a>
          </div>

          {cardmarketCopyState === "error" ? <p className={styles.error} role="status">Kopieren wurde nicht erlaubt. Der Text bleibt oben markierbar oder kann als TXT geladen werden.</p> : null}
        </section>
      ) : null}

      {visibleItems.length ? (
        <ul className={styles.list}>
          {visibleItems.map((item) => (
            <li className={styles.item} key={item.identityKey}>
              <span className={styles.quantity} aria-label={`${item.quantity} Exemplare`}>{item.quantity}×</span>
              <div className={styles.cardInfo}>
                <strong>{item.card.name}</strong>
                <span>{item.card.setName} · Nr. {formatCollectorNumber(item.card.collectorNumber, item.card.collectorTotal)}</span>
              </div>
              <div className={styles.metadata}>
                <span>{item.card.ref.language.toUpperCase()}</span>
                <span>{item.variant.label || finishLabels[item.variant.finish]}</span>
                <span>{editionLabels[item.variant.edition]}</span>
                <span>{printingLabels[selectedPrinting(item.variant)]}</span>
                <span>{minimumConditionLabels[item.preferences.minimumCondition]}</span>
                <span>{missingItemReviewNote(item).startsWith("Manuell") ? "Manuell prüfen" : "Prüfen"}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.empty}>
          <strong>{items.length ? "Keine Treffer für diesen Filter" : "Keine fehlenden Karten"}</strong>
          <p>{items.length ? "Passe den Suchbegriff an oder lösche den Filter." : "Leere Slots und vorhandene Karten werden nicht als Bedarf gezählt."}</p>
        </div>
      )}
    </section>
  );
}
