"use client";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useSyncExternalStore } from "react";

import type { CardSnapshot } from "@/domain/types";

import { CardArtwork } from "./CardArtwork";
import styles from "./gift-builder.module.css";

export interface SpreadPocket {
  key: string;
  card: CardSnapshot;
  /** Short note on the card, for example "Holo" or "Prüfen". */
  flag?: { text: string; invalid: boolean };
  price?: string;
}

interface GiftBinderSpreadProps {
  pages: readonly (readonly SpreadPocket[])[];
  inspectedKey?: string;
  onInspect: (key: string) => void;
  onSwap: (fromKey: string, toKey: string) => void;
}

const POCKETS_PER_PAGE = 9;
const TWO_PAGE_QUERY = "(min-width: 900px)";

function subscribeToWidth(onChange: () => void): () => void {
  if (typeof window.matchMedia !== "function") return () => undefined;
  const query = window.matchMedia(TWO_PAGE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function widthSnapshot(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia(TWO_PAGE_QUERY).matches;
}

/** Wide screens show an open binder with two pages; narrow screens show one page at a time. */
function useTwoPages(): boolean {
  return useSyncExternalStore(subscribeToWidth, widthSnapshot, () => false);
}

function Pocket({ pocket, index, open, onInspect }: { pocket: SpreadPocket; index: number; open: boolean; onInspect: (key: string) => void }) {
  const drag = useDraggable({ id: pocket.key, data: { card: pocket.card } });
  const drop = useDroppable({ id: pocket.key });
  const setNodeRef = (node: HTMLElement | null) => {
    drag.setNodeRef(node);
    drop.setNodeRef(node);
  };
  return (
    <div
      ref={setNodeRef}
      className={styles.pocket}
      data-open={open}
      data-over={drop.isOver && !drag.isDragging}
      data-dragging={drag.isDragging}
      data-requires-review={pocket.flag?.invalid === true}
    >
      <button
        type="button"
        className={styles.pocketButton}
        aria-expanded={open}
        aria-label={`${pocket.card.name}, ${pocket.card.setName}: Details ${open ? "schließen" : "ansehen"}`}
        onClick={() => onInspect(pocket.key)}
        {...drag.listeners}
      >
        <CardArtwork card={pocket.card} className={styles.cardImage} fallback={<span className={styles.imageFallback}>Bild nicht verfügbar</span>} />
      </button>
      <span className={styles.tileIndex} aria-hidden="true">{index + 1}</span>
      {pocket.flag ? <span className={styles.tileFlag} data-kind={pocket.flag.invalid ? "invalid" : undefined}>{pocket.flag.text}</span> : null}
      {pocket.price ? <span className={styles.pocketPrice}>{pocket.price}</span> : null}
    </div>
  );
}

function BinderPage({ pockets, firstIndex, label, inspectedKey, onInspect }: { pockets: readonly SpreadPocket[]; firstIndex: number; label: string; inspectedKey?: string; onInspect: (key: string) => void }) {
  return (
    <section className={styles.binderPage} aria-label={label}>
      <div className={styles.pockets}>
        {Array.from({ length: POCKETS_PER_PAGE }, (_, slot) => {
          const pocket = pockets[slot];
          return pocket
            ? <Pocket key={pocket.key} pocket={pocket} index={firstIndex + slot} open={inspectedKey === pocket.key} onInspect={onInspect} />
            : <div className={styles.pocketEmpty} key={`empty-${slot}`} aria-hidden="true" />;
        })}
      </div>
    </section>
  );
}

/**
 * An open binder: leather cover, rings, plastic pockets. Cards are dragged onto each other to swap their
 * places; a tap opens the card. Two pages sit side by side on wide screens, one page on phones.
 */
export function GiftBinderSpread({ pages, inspectedKey, onInspect, onSwap }: GiftBinderSpreadProps) {
  const wide = useTwoPages();
  // A one-page plan is shown as one centred page; two pages side by side only when there are two to show.
  const twoPages = wide && pages.length > 1;
  const [view, setView] = useState(0);
  const [dragged, setDragged] = useState<CardSnapshot>();
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
  );

  const step = twoPages ? 2 : 1;
  const lastStart = Math.max(Math.floor((pages.length - 1) / step) * step, 0);
  const start = Math.min(twoPages ? view - (view % 2) : view, lastStart);

  // Bring a card the buyer is asked to fix, or just opened, into view, and keep following it when it is moved
  // to another page with the position buttons (adjusting state while rendering).
  const inspectedPage = inspectedKey ? pages.findIndex((page) => page.some((pocket) => pocket.key === inspectedKey)) : -1;
  const [shown, setShown] = useState<{ key?: string; page: number }>({ page: -1 });
  if (inspectedKey !== shown.key || inspectedPage !== shown.page) {
    setShown({ key: inspectedKey, page: inspectedPage });
    const visible = twoPages ? [start, start + 1] : [start];
    if (inspectedPage >= 0 && !visible.includes(inspectedPage)) setView(inspectedPage);
  }

  function dragStart(event: DragStartEvent) {
    setDragged(event.active.data.current?.card as CardSnapshot | undefined);
  }

  function dragEnd(event: DragEndEvent) {
    setDragged(undefined);
    const from = String(event.active.id);
    const to = event.over ? String(event.over.id) : undefined;
    if (to && to !== from) onSwap(from, to);
  }

  const leftIndex = twoPages ? start : undefined;
  const rightIndex = twoPages ? start + 1 : start;
  const left = leftIndex !== undefined ? pages[leftIndex] : undefined;
  const right = pages[rightIndex];
  const rangeLabel = twoPages && start + 1 < pages.length ? `Seite ${start + 1}–${start + 2}` : `Seite ${start + 1}`;

  return (
    <div className={styles.binderWrap}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={dragStart} onDragCancel={() => setDragged(undefined)} onDragEnd={dragEnd}>
        <div className={styles.binder} data-spread={twoPages ? "double" : "single"}>
          {twoPages ? <span className={styles.binderRings} aria-hidden="true"><i /><i /><i /></span> : null}
          {twoPages ? (left
            ? <BinderPage key={`page-${leftIndex}`} pockets={left} firstIndex={(leftIndex ?? 0) * POCKETS_PER_PAGE} label={`Seite ${(leftIndex ?? 0) + 1}`} inspectedKey={inspectedKey} onInspect={onInspect} />
            : <div className={styles.innerCover} aria-hidden="true"><span>Your Card Binder</span></div>) : null}
          {right
            ? <BinderPage key={`page-${rightIndex}`} pockets={right} firstIndex={rightIndex * POCKETS_PER_PAGE} label={`Seite ${rightIndex + 1}`} inspectedKey={inspectedKey} onInspect={onInspect} />
            : twoPages ? <div className={styles.blankPage} aria-hidden="true" /> : null}
        </div>
        <DragOverlay dropAnimation={null}>
          {dragged ? <div className={styles.dragGhost}><CardArtwork card={dragged} className={styles.cardImage} fallback={<span className={styles.imageFallback}>{dragged.name}</span>} /></div> : null}
        </DragOverlay>
      </DndContext>

      {pages.length > 1 ? (
        <nav className={styles.flip} aria-label="Binderseiten blättern">
          <button type="button" className={styles.secondaryButton} disabled={start === 0} onClick={() => setView(Math.max(start - step, 0))}><ChevronLeft aria-hidden="true" size={18} /> Zurück blättern</button>
          <span aria-live="polite">{rangeLabel} von {pages.length}</span>
          <button type="button" className={styles.secondaryButton} disabled={start >= lastStart} onClick={() => setView(Math.min(start + step, lastStart))}>Weiter blättern <ChevronRight aria-hidden="true" size={18} /></button>
        </nav>
      ) : null}
      <p className={styles.spreadHint}>Tippe eine Karte an, um sie zu sehen. Ziehe sie auf eine andere Karte, um beide zu tauschen. Auf dem Handy: Karte kurz gedrückt halten, dann ziehen.</p>
    </div>
  );
}
