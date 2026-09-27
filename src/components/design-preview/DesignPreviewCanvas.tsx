"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  CircleHelp,
  ExternalLink,
  Grid2X2,
  ImageOff,
  LayoutGrid,
  ListFilter,
  Menu,
  Plus,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import {
  DEMO_PAGES,
  DEMO_STATS,
  type DemoCard,
  type DemoPage,
  type DemoSlot,
} from "./demo-data";
import styles from "./design-preview.module.css";

type DesignVariant = "design-2" | "design-3";
type PreviewView = "overview" | "selected" | "search" | "missing" | "no-results" | "image-error";

interface DesignPreviewCanvasProps {
  variant: DesignVariant;
}

export function DesignPreviewCanvas({ variant }: DesignPreviewCanvasProps) {
  const [activePage, setActivePage] = useState(0);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [view, setView] = useState<PreviewView>("overview");
  const [brokenImageIds, setBrokenImageIds] = useState<Set<string>>(() => new Set());
  const isDesign3 = variant === "design-3";
  const currentPage = DEMO_PAGES[activePage];
  const selectedSlot = selectedSlotId ? findSlot(selectedSlotId) : undefined;
  const selectedCard = selectedSlot?.card ?? null;

  function chooseSlot(slot: DemoSlot) {
    setSelectedSlotId(slot.id);
    setView(slot.status === "missing" ? "missing" : "selected");
  }

  function markImageBroken(cardId: string) {
    setBrokenImageIds((current) => new Set(current).add(cardId));
  }

  return (
    <div className={`${styles.app} ${isDesign3 ? styles.design3 : styles.design2}`}>
      <PreviewSidebar variant={variant} activePage={activePage} onPageChange={setActivePage} />
      <div className={styles.mainColumn}>
        <PreviewTopbar variant={variant} view={view} onViewChange={setView} />
        <main className={styles.content}>
          <div className={styles.previewBar}>
            <div>
              <span className={styles.previewEyebrow}>CF-07 · Design Preview</span>
              <span className={styles.previewTitle}>Gemeinsame Binder-Demo</span>
            </div>
            <div className={styles.variantSwitch} aria-label="Design-Variante wechseln">
              <Link className={!isDesign3 ? styles.variantActive : ""} href="/design-preview/?variant=2">
                Design 2 · Clean Binder
              </Link>
              <Link className={isDesign3 ? styles.variantActive : ""} href="/design-preview/?variant=3">
                Design 3 · Collector Workspace
              </Link>
            </div>
          </div>

          <PreviewHeader variant={variant} onViewChange={setView} />
          {isDesign3 ? <Design3Metrics /> : <Design2Metrics />}
          <PreviewStateBar view={view} onViewChange={setView} />

          <div className={styles.workspace}>
            <section className={styles.boardPanel} aria-labelledby="binder-board-title">
              <div className={styles.sectionHeader}>
                <div>
                  <span className={styles.sectionKicker}>Aktueller Binder</span>
                  <h2 id="binder-board-title">Base Set · 3 × 3 Seiten</h2>
                </div>
                <div className={styles.pagePager} aria-label="Binderseiten">
                  <button
                    type="button"
                    aria-label="Vorherige Seite"
                    disabled={activePage === 0}
                    onClick={() => setActivePage((page) => Math.max(0, page - 1))}
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <span>
                    {activePage + 1} / {DEMO_PAGES.length}
                  </span>
                  <button
                    type="button"
                    aria-label="Nächste Seite"
                    disabled={activePage === DEMO_PAGES.length - 1}
                    onClick={() => setActivePage((page) => Math.min(DEMO_PAGES.length - 1, page + 1))}
                  >
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              <WorkspaceState view={view} />
              <BinderBoard
                page={currentPage}
                selectedSlotId={selectedSlotId}
                brokenImageIds={brokenImageIds}
                forceImageError={view === "image-error"}
                onSelect={chooseSlot}
                onImageError={markImageBroken}
              />
              <div className={styles.boardFooter}>
                <button type="button" className={styles.secondaryButton} onClick={() => setView("overview")}>
                  <Grid2X2 size={16} /> Übersicht zeigen
                </button>
                <span>Preise sind in dieser Preview deaktiviert.</span>
              </div>
            </section>

            {isDesign3 ? (
              <CollectorContextPanel view={view} selectedCard={selectedCard} onViewChange={setView} />
            ) : (
              <CleanOverviewPanel view={view} selectedCard={selectedCard} onViewChange={setView} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

interface PreviewSidebarProps {
  variant: DesignVariant;
  activePage: number;
  onPageChange: (page: number) => void;
}

function PreviewSidebar({ variant, activePage, onPageChange }: PreviewSidebarProps) {
  return (
    <aside className={styles.sidebar} aria-label="Cardfolio Navigation">
      <div className={styles.brand}>
        <span className={styles.brandMark}>C</span>
        <span>Cardfolio</span>
        <span className={styles.previewPill}>{variant === "design-2" ? "D2" : "D3"}</span>
      </div>
      <nav className={styles.primaryNav} aria-label="Hauptnavigation">
        <a className={styles.navItemActive} href="#binder">
          <BookOpen size={18} /> Binder
        </a>
        <a className={styles.navItem} href="#cards">
          <LayoutGrid size={18} /> Karten
        </a>
        <a className={styles.navItem} href="#missing">
          <ListFilter size={18} /> Fehlt noch <span className={styles.navBadge}>{DEMO_STATS.missing}</span>
        </a>
      </nav>
      <div className={styles.sidebarDivider} />
      <span className={styles.sidebarLabel}>Meine Binder</span>
      <button className={styles.binderItemActive} type="button">
        <span className={styles.binderDot} /> Base Set
        <ChevronDown size={15} />
      </button>
      <div className={styles.pageNav} aria-label="Seiten auswählen">
        {DEMO_PAGES.map((page, index) => (
          <button
            type="button"
            className={index === activePage ? styles.pageItemActive : styles.pageItem}
            key={page.id}
            onClick={() => onPageChange(index)}
          >
            <span>{page.label}</span>
            <span>{index === 0 ? "8/9" : "8/9"}</span>
          </button>
        ))}
      </div>
      <div className={styles.sidebarBottom}>
        <a className={styles.navItem} href="#import">
          <Upload size={18} /> Import / Backup
        </a>
        <a className={styles.navItem} href="#settings">
          <Settings2 size={18} /> Einstellungen
        </a>
      </div>
    </aside>
  );
}

interface PreviewTopbarProps {
  variant: DesignVariant;
  view: PreviewView;
  onViewChange: (view: PreviewView) => void;
}

function PreviewTopbar({ variant, view, onViewChange }: PreviewTopbarProps) {
  return (
    <header className={styles.topbar}>
      <button type="button" className={styles.mobileMenu} aria-label="Navigation öffnen">
        <Menu size={19} />
      </button>
      <div className={styles.breadcrumb}>
        <span>Meine Binder</span>
        <span>/</span>
        <strong>Base Set</strong>
        {variant === "design-3" && <span className={styles.breadcrumbHint}>Collector Workspace</span>}
      </div>
      <div className={styles.topbarActions}>
        <button
          type="button"
          className={styles.topbarSearch}
          onClick={() => onViewChange(view === "search" ? "overview" : "search")}
        >
          <Search size={17} /> <span>Karte suchen</span> <kbd>⌘ K</kbd>
        </button>
        <button type="button" className={styles.iconButton} aria-label="Hilfe">
          <CircleHelp size={18} />
        </button>
        <span className={styles.avatar} aria-label="Profil von Schayan">
          S
        </span>
      </div>
    </header>
  );
}

interface PreviewHeaderProps {
  variant: DesignVariant;
  onViewChange: (view: PreviewView) => void;
}

function PreviewHeader({ variant, onViewChange }: PreviewHeaderProps) {
  const isDesign3 = variant === "design-3";
  return (
    <section className={styles.pageHeader}>
      <div>
        {isDesign3 && <span className={styles.breadcrumbMobile}>Binder / Base Set</span>}
        <h1>{isDesign3 ? "Base Set" : "Base Set Binder"}</h1>
        <p>{isDesign3 ? "Dein Sammelstand auf einen Blick." : "Dein Fortschritt im Überblick."}</p>
      </div>
      <button type="button" className={styles.primaryButton} onClick={() => onViewChange("missing")}>
        <Plus size={17} /> Fehlende Karten
      </button>
    </section>
  );
}

function Design2Metrics() {
  return (
    <section className={styles.metricGrid} aria-label="Binder Fortschritt">
      <MetricCard label="Fortschritt" value={`${DEMO_STATS.completion}%`} hint="12 von 16 Karten" tone="blue" />
      <MetricCard label="Im Binder" value={`${DEMO_STATS.owned}`} hint="von 16 geplant" tone="green" />
      <MetricCard label="Fehlt noch" value={`${DEMO_STATS.missing}`} hint="Karten offen" tone="orange" />
      <MetricCard label="Leere Plätze" value={`${DEMO_STATS.empty}`} hint="auf 2 Seiten" tone="neutral" />
    </section>
  );
}

function Design3Metrics() {
  return (
    <section className={styles.metricStrip} aria-label="Binder Fortschritt">
      <div className={styles.metricStripIntro}>
        <span className={styles.metricStripValue}>{DEMO_STATS.completion}%</span>
        <span>Fortschritt</span>
      </div>
      <MetricStripItem label="Im Binder" value={`${DEMO_STATS.owned}`} detail="von 16" tone="green" />
      <MetricStripItem label="Fehlt noch" value={`${DEMO_STATS.missing}`} detail="Karten" tone="orange" />
      <MetricStripItem label="Leer" value={`${DEMO_STATS.empty}`} detail="Plätze" tone="neutral" />
    </section>
  );
}

function MetricCard({ label, value, hint, tone }: { label: string; value: string; hint: string; tone: string }) {
  return (
    <div className={`${styles.metricCard} ${styles[`tone${tone}`]}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </div>
  );
}

function MetricStripItem({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) {
  return (
    <div className={`${styles.metricStripItem} ${styles[`tone${tone}`]}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

interface PreviewStateBarProps {
  view: PreviewView;
  onViewChange: (view: PreviewView) => void;
}

function PreviewStateBar({ view, onViewChange }: PreviewStateBarProps) {
  const states: Array<{ id: PreviewView; label: string }> = [
    { id: "overview", label: "Normal" },
    { id: "selected", label: "Karte ausgewählt" },
    { id: "search", label: "Suche" },
    { id: "missing", label: "Fehlt noch" },
    { id: "no-results", label: "Keine Treffer" },
    { id: "image-error", label: "Bildfehler" },
  ];
  return (
    <div className={styles.stateBar} aria-label="Preview-Zustände">
      <span>Ansicht testen</span>
      {states.map((state) => (
        <button
          type="button"
          className={view === state.id ? styles.stateButtonActive : styles.stateButton}
          key={state.id}
          onClick={() => onViewChange(state.id)}
        >
          {state.label}
        </button>
      ))}
    </div>
  );
}

function WorkspaceState({ view }: { view: PreviewView }) {
  if (view === "overview" || view === "selected" || view === "missing" || view === "image-error") {
    return null;
  }
  if (view === "search") {
    return (
      <div className={styles.workspaceState} role="status">
        <Search size={18} />
        <div>
          <strong>Suche nach Karten</strong>
          <span>Tippe einen Namen, eine Set-ID oder Kartennummer ein.</span>
        </div>
        <button type="button" aria-label="Suche schließen">
          <X size={16} />
        </button>
      </div>
    );
  }
  return (
    <div className={`${styles.workspaceState} ${styles.workspaceStateEmpty}`} role="status">
      <Search size={18} />
      <div>
        <strong>Keine Karten gefunden</strong>
        <span>Versuche einen kürzeren Namen oder entferne Filter.</span>
      </div>
      <button type="button" aria-label="Filter zurücksetzen">
        Filter zurücksetzen
      </button>
    </div>
  );
}

interface BinderBoardProps {
  page: DemoPage;
  selectedSlotId: string | null;
  brokenImageIds: Set<string>;
  forceImageError: boolean;
  onSelect: (slot: DemoSlot) => void;
  onImageError: (cardId: string) => void;
}

function BinderBoard({ page, selectedSlotId, brokenImageIds, forceImageError, onSelect, onImageError }: BinderBoardProps) {
  return (
    <div className={styles.binderBoard}>
      <div className={styles.pageLabel}>
        <span>{page.label}</span>
        <span>6 im Binder · 2 fehlen · 1 leer</span>
      </div>
      <div className={styles.cardGrid}>
        {page.slots.map((slot) => (
          <CardSlot
            key={slot.id}
            slot={slot}
            selected={selectedSlotId === slot.id}
            imageBroken={slot.card ? brokenImageIds.has(slot.card.id) : false}
            forceImageError={forceImageError}
            onSelect={onSelect}
            onImageError={onImageError}
          />
        ))}
      </div>
    </div>
  );
}

interface CardSlotProps {
  slot: DemoSlot;
  selected: boolean;
  imageBroken: boolean;
  forceImageError: boolean;
  onSelect: (slot: DemoSlot) => void;
  onImageError: (cardId: string) => void;
}

function CardSlot({ slot, selected, imageBroken, forceImageError, onSelect, onImageError }: CardSlotProps) {
  const card = slot.card;
  if (!card) {
    return (
      <button type="button" className={`${styles.cardSlot} ${styles.emptySlot}`} onClick={() => onSelect(slot)}>
        <span className={styles.emptySlotIcon}>
          <Plus size={18} />
        </span>
        <span>Karte hinzufügen</span>
      </button>
    );
  }

  const isBroken = imageBroken || forceImageError;
  return (
    <button
      type="button"
      className={`${styles.cardSlot} ${slot.status === "missing" ? styles.missingSlot : styles.ownedSlot} ${selected ? styles.selectedSlot : ""}`}
      onClick={() => onSelect(slot)}
      aria-label={`${card.name}, ${slot.status === "missing" ? "fehlt" : "im Binder"}`}
    >
      <span className={styles.cardImageFrame}>
        {isBroken ? (
          <span className={styles.imageFallback}>
            <ImageOff size={22} />
            <span>Bild nicht verfügbar</span>
          </span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.imageUrl} alt="" onError={() => onImageError(card.id)} />
        )}
        <span className={styles.cardNumber}>{card.collectorNumber}</span>
      </span>
      <span className={styles.cardSlotMeta}>
        <strong>{card.name}</strong>
        {slot.status === "missing" ? (
          <span className={styles.missingBadge}>Fehlt</span>
        ) : (
          <span className={styles.ownedBadge}>
            <Check size={12} /> Im Binder
          </span>
        )}
      </span>
    </button>
  );
}

interface ContextPanelProps {
  view: PreviewView;
  selectedCard: DemoCard | null;
  onViewChange: (view: PreviewView) => void;
}

function CleanOverviewPanel({ view, selectedCard, onViewChange }: ContextPanelProps) {
  return (
    <aside className={styles.contextPanel} aria-label="Binder-Übersicht">
      <div className={styles.contextHeader}>
        <span className={styles.sectionKicker}>Übersicht</span>
        <button type="button" className={styles.iconButton} aria-label="Übersicht anpassen">
          <SlidersHorizontal size={17} />
        </button>
      </div>
      {selectedCard && view !== "overview" ? (
        <CardContext card={selectedCard} view={view} onViewChange={onViewChange} />
      ) : (
        <OverviewStats onMissing={() => onViewChange("missing")} />
      )}
    </aside>
  );
}

function CollectorContextPanel({ view, selectedCard, onViewChange }: ContextPanelProps) {
  return (
    <aside className={styles.contextPanel} aria-label="Collector-Kontext">
      <div className={styles.contextHeader}>
        <div>
          <span className={styles.sectionKicker}>Collector Workspace</span>
          <h2>Aktueller Kontext</h2>
        </div>
        <button type="button" className={styles.iconButton} aria-label="Kontext schließen">
          <X size={17} />
        </button>
      </div>
      {selectedCard && view !== "overview" ? (
        <CardContext card={selectedCard} view={view} onViewChange={onViewChange} />
      ) : (
        <>
          <div className={styles.contextCallout}>
            <Sparkles size={18} />
            <div>
              <strong>Gut unterwegs</strong>
              <span>Du hast bereits 75% dieses Binders gesammelt.</span>
            </div>
          </div>
          <OverviewStats onMissing={() => onViewChange("missing")} />
        </>
      )}
    </aside>
  );
}

function OverviewStats({ onMissing }: { onMissing: () => void }) {
  return (
    <div className={styles.overviewStack}>
      <div className={styles.overviewProgress}>
        <div className={styles.progressRing}>
          <strong>{DEMO_STATS.completion}%</strong>
        </div>
        <div>
          <strong>Binder-Fortschritt</strong>
          <span>{DEMO_STATS.owned} von {DEMO_STATS.planned} Karten vorhanden</span>
        </div>
      </div>
      <div className={styles.miniStats}>
        <div><span>Seiten</span><strong>{DEMO_STATS.pages}</strong></div>
        <div><span>Geplant</span><strong>{DEMO_STATS.planned}</strong></div>
        <div><span>Leer</span><strong>{DEMO_STATS.empty}</strong></div>
      </div>
      <div className={styles.missingCallout}>
        <div>
          <strong>{DEMO_STATS.missing} Karten fehlen</strong>
          <span>Schließe deine nächsten Lücken.</span>
        </div>
        <button type="button" onClick={onMissing}>Ansehen <ArrowRight size={14} /></button>
      </div>
      <div className={styles.contextNotes}>
        <span className={styles.sectionKicker}>Binder-Notiz</span>
        <p>Erste Edition vollständig halten und fehlende Karten als Nächstes ergänzen.</p>
      </div>
    </div>
  );
}

function CardContext({ card, view, onViewChange }: { card: DemoCard; view: PreviewView; onViewChange: (view: PreviewView) => void }) {
  return (
    <div className={styles.cardContext}>
      <div className={styles.contextCardPreview}>
        {view === "image-error" ? (
          <ImageOff size={28} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.imageUrl} alt="" />
        )}
      </div>
      <span className={styles.sectionKicker}>{card.setName} · {card.collectorNumber}</span>
      <h3>{card.name}</h3>
      <p>{view === "missing" ? "Diese Karte ist für deinen Binder geplant, aber noch nicht vorhanden." : "Diese Karte ist im aktiven Binder ausgewählt."}</p>
      {view === "missing" ? (
        <button type="button" className={styles.primaryButtonFull} onClick={() => onViewChange("search")}>
          <Search size={16} /> Bezugsquellen suchen
        </button>
      ) : (
        <button type="button" className={styles.secondaryButtonFull} onClick={() => onViewChange("overview")}>
          Auswahl aufheben
        </button>
      )}
      <a className={styles.externalLink} href="https://www.tcgplayer.com/" target="_blank" rel="noreferrer">
        Externe Quelle öffnen <ExternalLink size={14} />
      </a>
    </div>
  );
}

function findSlot(slotId: string): DemoSlot | undefined {
  return DEMO_PAGES.flatMap((page) => page.slots).find((slot) => slot.id === slotId);
}
void ListFilter;
void Search;
