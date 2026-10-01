"use client";

import { Clipboard, Download, ExternalLink, FileDown, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { loadTcgplayerCardMappings } from "@/data/marketplace/tcgplayer-card-mappings";
import { TCGPLAYER_SET_MAPPINGS, TCGPLAYER_UNAVAILABLE_SETS } from "@/data/marketplace/tcgplayer-set-mappings";
import { TCGPLAYER_PRINTING_MAPPINGS } from "@/data/marketplace/tcgplayer-printing-mappings";
import { createCardmarketHandoff, type CardmarketHandoffPart } from "@/domain/cardmarket-handoff";
import { formatCollectorNumber } from "@/domain/catalog-search";
import { missingItemReviewNote } from "@/domain/missing-items-export";
import { minimumConditionLabels } from "@/domain/purchase-preferences";
import { createTcgplayerMassEntryExport, type TcgplayerCardMapping, type TcgplayerMassEntryExport } from "@/domain/tcgplayer-export";
import type { MissingItem } from "@/domain/types";
import { printingLabels, selectedPrinting } from "@/domain/variant-selection";

import styles from "./missing-cards-panel.module.css";

const finishLabels = { normal: "Non-Holo / Normal", holo: "Holo", reverse: "Reverse Holo", other: "Andere", unspecified: "Nicht angegeben" } as const;
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
  tcgplayerCardMappings?: readonly TcgplayerCardMapping[];
  tcgplayerCopyState?: "idle" | "copied" | "error";
  onTcgplayerCopy?: (exported: TcgplayerMassEntryExport) => void;
  onTcgplayerTextExport?: (exported: TcgplayerMassEntryExport) => void;
  cardmarketEnabled?: boolean;
  cardmarketPreparing?: boolean;
  cardmarketCopyState?: "idle" | "copied" | "error";
  onCardmarketPrepare?: (items: readonly MissingItem[]) => void;
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
  tcgplayerCardMappings,
  tcgplayerCopyState = "idle",
  onTcgplayerCopy,
  onTcgplayerTextExport,
  cardmarketEnabled = false,
  cardmarketPreparing = false,
  cardmarketCopyState = "idle",
  onCardmarketPrepare,
  onCardmarketCopy,
  onCardmarketTextExport,
}: MissingCardsPanelProps) {
  const [query, setQuery] = useState("");
  const [cardmarketPartIndex, setCardmarketPartIndex] = useState(0);
  const [marketplaceChoice, setMarketplaceChoice] = useState<MarketplaceChoice>();
  const [loadedTcgplayerMappings, setLoadedTcgplayerMappings] = useState<readonly TcgplayerCardMapping[]>();
  const [tcgplayerMappingsError, setTcgplayerMappingsError] = useState<string>();
  const tcgplayerMappings = tcgplayerCardMappings ?? loadedTcgplayerMappings;
  useEffect(() => {
    if (marketplaceChoice !== "tcgplayer" || tcgplayerCardMappings || loadedTcgplayerMappings) return;
    const controller = new AbortController();
    loadTcgplayerCardMappings(controller.signal)
      .then(setLoadedTcgplayerMappings)
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setTcgplayerMappingsError(error instanceof Error ? error.message : "TCGplayer-Zuordnungen konnten nicht geladen werden.");
        }
      });
    return () => controller.abort();
  }, [loadedTcgplayerMappings, marketplaceChoice, tcgplayerCardMappings]);
  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("de-DE");
    if (!normalizedQuery) return items;
    return items.filter((item) => [item.card.name, item.card.setName, item.card.collectorNumber].some((value) => value.toLocaleLowerCase("de-DE").includes(normalizedQuery)));
  }, [items, query]);
  const visibleQuantity = visibleItems.reduce((total, item) => total + item.quantity, 0);
  const tcgplayerExport = useMemo(
    () => tcgplayerEnabled && tcgplayerMappings
      ? createTcgplayerMassEntryExport(
          visibleItems,
          TCGPLAYER_SET_MAPPINGS,
          TCGPLAYER_PRINTING_MAPPINGS,
          tcgplayerMappings,
          TCGPLAYER_UNAVAILABLE_SETS,
        )
      : undefined,
    [tcgplayerEnabled, tcgplayerMappings, visibleItems],
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
              <button
                type="button"
                aria-pressed={marketplaceChoice === "tcgplayer"}
                onClick={() => {
                  setTcgplayerMappingsError(undefined);
                  setMarketplaceChoice("tcgplayer");
                }}
              >TCGplayer</button>
            ) : null}
            {cardmarketEnabled ? (
              <button
                type="button"
                aria-pressed={marketplaceChoice === "cardmarket"}
                onClick={() => {
                  setMarketplaceChoice("cardmarket");
                  onCardmarketPrepare?.(visibleItems);
                }}
              >Cardmarket</button>
            ) : null}
          </div>
        </section>
      ) : null}

      {marketplaceChoice === "tcgplayer" && tcgplayerExport ? (
        <section className={styles.marketplacePanel} aria-labelledby="tcgplayer-export-heading">
          <div className={styles.marketplaceHeader}>
            <div>
              <p className={styles.eyebrow}>Kataloggeprüfte Marketplace-Übergabe</p>
              <h3 id="tcgplayer-export-heading">TCGplayer Mass Entry</h3>
              <p>{tcgplayerExport.readyCount} übergabebereit · {tcgplayerExport.verifiedCount} Produktzuordnungen · {tcgplayerExport.reviewRequiredCount} prüfen</p>
            </div>
            {tcgplayerExport.text ? (
              <a href={tcgplayerExport.massEntryUrl} target="_blank" rel="noopener noreferrer">
                {tcgplayerExport.massEntryPrefilled ? "Liste bei TCGplayer öffnen" : "TCGplayer öffnen"} <ExternalLink aria-hidden="true" size={15} />
              </a>
            ) : <span className={styles.marketplaceUnavailable}>Keine sichere Übergabe verfügbar</span>}
          </div>

          {tcgplayerExport.text ? (
            <ol className={styles.handoffSteps} aria-label="TCGplayer-Übergabeschritte">
              <li>{tcgplayerExport.massEntryPrefilled ? "Die übergabebereiten Positionen werden in Mass Entry vorausgefüllt." : "Kopiere den Text und füge ihn in Mass Entry ein."}</li>
              <li>Aktiviere dort die unten genannten Printing- und Zustandsfilter. Holofoil, 1st Edition Holofoil und Unlimited Holofoil sind getrennte Optionen.</li>
              <li>Prüfe Kartenname, Set, vollständige Nummer, Sprache, Printing und Zustand.</li>
              <li>Erst anschließend lässt du TCGplayer externe Angebote in den Warenkorb legen.</li>
            </ol>
          ) : null}

          <label className={styles.massEntryPreview}>
            <span>Mass-Entry-Text · offizielle Produktnamen, Setcodes und vollständige Kartennummern</span>
            <textarea
              aria-label="TCGplayer Mass-Entry-Vorschau"
              readOnly
              rows={Math.max(3, Math.min(tcgplayerExport.readyCount, 8))}
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

          {tcgplayerExport.matches.some((match) => match.line) ? (
            <div className={styles.reviewList}>
              <strong>Bei TCGplayer nach dem Einfügen auswählen</strong>
              <p className={styles.reviewExplanation}>Mass Entry übernimmt Karte, Set und Nummer. Printing und Zustand wählst du anschließend bei TCGplayer mit diesen Filtern aus, bevor du auf „Add to Cart“ klickst.</p>
              <ul>
                {tcgplayerExport.matches.filter((match) => match.line).map((match) => (
                  <li key={match.identityKey}>
                    <span>{match.quantity}× {match.cardName} · {match.setName} · {match.collectorNumber}</span>
                    <small>Printing: {match.printingHint} · Zustand: {match.conditionHint}</small>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {tcgplayerExport.matches.some((match) => !match.line) ? (
            <div className={styles.reviewList}>
              <strong>Nicht in die TCGplayer-Liste übernommen</strong>
              <p className={styles.reviewExplanation}>Diese Karten bleiben unverändert in deiner Fehlkartenliste. Cardfolio überträgt sie nur nicht automatisch, solange keine eindeutige TCGplayer-Produktzuordnung vorliegt.</p>
              <ul>
                {tcgplayerExport.matches.filter((match) => !match.line).map((match) => (
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

      {marketplaceChoice === "tcgplayer" && !tcgplayerExport ? (
        <section className={styles.marketplacePanel} aria-live="polite">
          {tcgplayerMappingsError ? (
            <p className={styles.error} role="alert">{tcgplayerMappingsError} Öffne die Ansicht erneut oder lade die Seite neu.</p>
          ) : (
            <p className={styles.handoffSteps} role="status">Die geprüften TCGplayer-Produktzuordnungen werden geladen …</p>
          )}
        </section>
      ) : null}

      {marketplaceChoice === "cardmarket" && cardmarketHandoff && activeCardmarketPart ? (
        <section className={styles.marketplacePanel} aria-labelledby="cardmarket-handoff-heading">
          <div className={styles.marketplaceHeader}>
            <div>
              <p className={styles.eyebrow}>Prüfpflichtige Marketplace-Übergabe</p>
              <h3 id="cardmarket-handoff-heading">Cardmarket Deckliste</h3>
              <p>{cardmarketHandoff.importablePositionCount} importierbar · {cardmarketHandoff.reviewRequiredCount} Ausgaben prüfen</p>
            </div>
            <a href={cardmarketHandoff.wantsHelpUrl} target="_blank" rel="noopener noreferrer">
              Offizielles Format <ExternalLink aria-hidden="true" size={15} />
            </a>
          </div>

          {cardmarketPreparing ? <p className={styles.handoffSteps} role="status">Fähigkeiten und Attacken werden aus dem Kartenkatalog aktualisiert …</p> : null}
          {cardmarketHandoff.warnings.map((warning) => <p className={styles.warning} role="note" key={warning}>{warning}</p>)}

          <details className={styles.marketplaceSearches}>
            <summary>Einzelsuchen für Teil {activeCardmarketPart.index} anzeigen ({activeCardmarketPart.searches.length})</summary>
            <ul>
              {activeCardmarketPart.searches.map((search) => (
                <li key={search.identityKey}>
                  <span><strong>{search.label}</strong><small>{search.details}</small></span>
                  <a href={search.url} target="_blank" rel="noopener noreferrer">Karte suchen <ExternalLink aria-hidden="true" size={14} /></a>
                </li>
              ))}
            </ul>
          </details>

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
            <span>Cardmarket-Importtext · exakt eine Karte pro Zeile</span>
            <textarea
              aria-label="Cardmarket-Decklistenvorschau"
              readOnly
              rows={Math.max(3, Math.min(activeCardmarketPart.importablePositionCount, 8))}
              value={activeCardmarketPart.text}
              placeholder={cardmarketPreparing ? "Kartendaten werden aktualisiert …" : "Für diese Positionen fehlen noch die von Cardmarket benötigten Fähigkeiten oder Attacken."}
            />
          </label>

          <div className={styles.marketplaceActions}>
            <button type="button" className={styles.primaryButton} disabled={!activeCardmarketPart.text || cardmarketPreparing} onClick={() => onCardmarketCopy?.(activeCardmarketPart)}>
              <Clipboard size={16} /> {cardmarketCopyState === "copied" ? `Teil ${activeCardmarketPart.index} kopiert` : "Deckliste kopieren"}
            </button>
            <button type="button" className={styles.secondaryButton} disabled={!activeCardmarketPart.text || cardmarketPreparing} onClick={() => onCardmarketTextExport?.(activeCardmarketPart)}>
              <Download size={16} /> Deckliste TXT
            </button>
            <a className={styles.helpLink} href={cardmarketHandoff.singlesUrl} target="_blank" rel="noopener noreferrer">Ausgaben auf Cardmarket prüfen</a>
          </div>

          {cardmarketCopyState === "error" ? <p className={styles.error} role="status">Kopieren wurde nicht erlaubt. Der Text bleibt oben markierbar oder kann als TXT geladen werden.</p> : null}
          {cardmarketHandoff.excluded.length ? (
            <div className={styles.reviewList}>
              <strong>Nicht im Importtext enthalten</strong>
              <ul>
                {cardmarketHandoff.excluded.map((item) => (
                  <li key={item.identityKey}><span>{item.label}</span><small>{item.reason}</small></li>
                ))}
              </ul>
            </div>
          ) : null}
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
