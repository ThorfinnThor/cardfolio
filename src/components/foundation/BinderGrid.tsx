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
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useState, type CSSProperties, type ReactNode } from "react";

import type { SlotLocation } from "@/domain/binder-actions";
import { formatCollectorNumber } from "@/domain/catalog-search";
import { formatVariantSelection, nextFinish, selectableFinishes, variantAvailabilityForCard } from "@/domain/variant-selection";
import type { BinderPage, CardSnapshot, PlannedCard, VariantSelection } from "@/domain/types";

import { CardArtwork } from "./CardArtwork";
import styles from "./foundation-workspace.module.css";

interface BinderGridProps {
  page: BinderPage;
  columns: number;
  cards: ReadonlyMap<string, CardSnapshot>;
  selectedLocation?: SlotLocation;
  movingLocation?: SlotLocation;
  onOpenSearch: (location: SlotLocation) => void;
  onSelectCard: (location: SlotLocation) => void;
  onMove: (from: SlotLocation, to: SlotLocation) => void;
  onRefreshCard: (card: CardSnapshot) => void;
  /** The circle on a card: the collector has it or not. */
  onToggleOwned: (entryId: string, owned: boolean) => void;
  /** The star on a card: the finish the card has (Normal, Holo, Reverse Holo). */
  onChangeVariant: (entryId: string, variant: VariantSelection) => void;
  /** Entry that was just marked as owned; receives a short gold pulse. */
  celebratedEntryId?: string;
}

interface OccupiedSlotProps {
  entry: PlannedCard;
  card?: CardSnapshot;
  location: SlotLocation;
  selected: boolean;
  moving: boolean;
  celebrate: boolean;
  onSelectCard: (location: SlotLocation) => void;
  onRefreshCard: (card: CardSnapshot) => void;
  onToggleOwned: (entryId: string, owned: boolean) => void;
  onChangeVariant: (entryId: string, variant: VariantSelection) => void;
}

const finishWords = { normal: "Normal", holo: "Holo", reverse: "Reverse Holo", other: "Sonderausgabe", unspecified: "noch offen" } as const;
const finishGlyphs = { normal: "☆", holo: "★", reverse: "R", other: "★", unspecified: "?" } as const;

function sameLocation(first: SlotLocation | undefined, second: SlotLocation): boolean {
  return first?.pageId === second.pageId && first.slotIndex === second.slotIndex;
}

function DropCell({ location, children }: { location: SlotLocation; children: ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `slot:${location.pageId}:${location.slotIndex}`,
    data: { location },
  });
  return <div ref={setNodeRef} className={styles.dropCell} data-drag-over={isOver}>{children}</div>;
}

function OccupiedSlot({
  entry,
  card,
  location,
  selected,
  moving,
  celebrate,
  onSelectCard,
  onRefreshCard,
  onToggleOwned,
  onChangeVariant,
}: OccupiedSlotProps) {
  const { isDragging, listeners, setNodeRef, transform } = useDraggable({
    id: `card:${entry.id}`,
    data: { location, label: card?.name ?? "Karte", card },
  });
  const dragStyle: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : undefined,
  };

  const finishes = card ? selectableFinishes(variantAvailabilityForCard(card), entry.variant.finish === "other" ? "unlimited" : entry.variant.edition) : [];
  const finish = entry.variant.finish;
  const starChoosable = Boolean(card) && finish !== "other" && (finishes.length > 1 || (finishes.length === 1 && finish !== finishes[0]));
  const starShown = starChoosable || finish === "holo" || finish === "reverse";

  return (
    <article
      ref={setNodeRef}
      style={dragStyle}
      className={`${styles.slot} ${selected ? styles.slotSelected : ""} ${moving ? styles.movingSlot : ""}`}
      data-owned={entry.owned}
      data-celebrate={celebrate || undefined}
      data-finish={entry.variant.finish}
      tabIndex={0}
      {...listeners}
      aria-label={card ? `${card.name}, Slot ${location.slotIndex + 1}` : `Kartendaten fehlen, Slot ${location.slotIndex + 1}`}
      onClick={() => onSelectCard(location)}
      onKeyDown={(event) => {
        if (event.currentTarget !== event.target || (event.key !== "Enter" && event.key !== " ")) return;
        event.preventDefault();
        onSelectCard(location);
      }}
    >
      {card ? (
        <>
          <CardArtwork
            card={card}
            className={styles.slotImage}
            fallback={<div className={styles.imageFallback}>
              <span role="img" aria-label={`Bild für ${card.name} nicht verfügbar`}>Bild nicht verfügbar</span>
              <button type="button" onClick={() => onRefreshCard(card)}>Kartendaten aktualisieren</button>
            </div>}
          />
          <button
            type="button"
            className={styles.slotDot}
            aria-pressed={entry.owned}
            aria-label={`Habe ich: ${card.name}`}
            title={entry.owned ? "Habe ich – antippen, wenn sie fehlt" : "Fehlt noch – antippen, wenn du sie hast"}
            onClick={(event) => { event.stopPropagation(); onToggleOwned(entry.id, !entry.owned); }}
          >{entry.owned ? "✓" : ""}</button>
          {starChoosable ? (
            <button
              type="button"
              className={styles.slotStar}
              data-finish={finish}
              aria-label={`Glanz: ${finishWords[finish]}. Antippen zum Wechseln`}
              title="Glanz der Karte wechseln (Normal, Holo, Reverse Holo)"
              onClick={(event) => { event.stopPropagation(); onChangeVariant(entry.id, { ...entry.variant, finish: nextFinish(entry.variant, variantAvailabilityForCard(card)) }); }}
            >{finishGlyphs[finish]}</button>
          ) : starShown ? (
            <span className={styles.slotStar} data-finish={finish} data-static="true" title={`Diese Karte gibt es nur als ${finishWords[finish]}`}>{finishGlyphs[finish]}</span>
          ) : null}
          <strong>{card.name}</strong>
          <small>{card.setName} · {formatCollectorNumber(card.collectorNumber, card.collectorTotal)}</small>
          <span className={styles.variantSummary}>{formatVariantSelection(entry.variant)}</span>
        </>
      ) : (
        <>
          <div className={styles.imageFallback}>Kartendaten fehlen</div>
          <strong>Kartendaten fehlen</strong>
        </>
      )}
    </article>
  );
}

export function BinderGrid({
  page,
  columns,
  cards,
  selectedLocation,
  movingLocation,
  onOpenSearch,
  onSelectCard,
  onMove,
  onRefreshCard,
  onToggleOwned,
  onChangeVariant,
  celebratedEntryId,
}: BinderGridProps) {
  // A card is dragged by the whole card: with the mouse after a few pixels, by touch after a short press so that scrolling still works.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 7 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
  );
  const [dragged, setDragged] = useState<{ label: string; card?: CardSnapshot }>();

  function dragStart(event: DragStartEvent) {
    const data = event.active.data.current;
    setDragged({ label: typeof data?.label === "string" ? data.label : "Karte", card: data?.card as CardSnapshot | undefined });
  }

  function dragEnd(event: DragEndEvent) {
    setDragged(undefined);
    const from = event.active.data.current?.location as SlotLocation | undefined;
    const to = event.over?.data.current?.location as SlotLocation | undefined;
    if (!from || !to || sameLocation(from, to)) return;
    onMove(from, to);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={dragStart} onDragCancel={() => setDragged(undefined)} onDragEnd={dragEnd}>
      <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {page.slots.map((entry, index) => {
          const location = { pageId: page.id, slotIndex: index };
          const card = entry ? cards.get(entry.cardKey) : undefined;
          return (
            <DropCell location={location} key={entry?.id ?? `empty-${page.id}-${index}`}>
              {entry ? (
                <OccupiedSlot
                  entry={entry}
                  card={card}
                  location={location}
                  selected={sameLocation(selectedLocation, location)}
                  moving={sameLocation(movingLocation, location)}
                  celebrate={entry.id === celebratedEntryId}
                  onSelectCard={onSelectCard}
                  onRefreshCard={onRefreshCard}
                  onToggleOwned={onToggleOwned}
                  onChangeVariant={onChangeVariant}
                />
              ) : (
                <button
                  type="button"
                  className={`${styles.emptySlot} ${sameLocation(selectedLocation, location) ? styles.emptySlotSelected : ""}`}
                  onClick={() => movingLocation ? onMove(movingLocation, location) : onOpenSearch(location)}
                  aria-label={movingLocation ? `Freier Platz ${index + 1}, hierher verschieben` : `Freier Platz ${index + 1}, Karte einsetzen`}
                >
                  <span className={styles.emptySlotIcon} aria-hidden="true">+</span>
                  <span>Freier Platz {index + 1}</span>
                  <small>{movingLocation ? "Hierher verschieben" : "Karte einsetzen"}</small>
                </button>
              )}
              {entry && movingLocation && !sameLocation(movingLocation, location) ? (
                <button type="button" className={styles.moveTargetButton} onClick={() => onMove(movingLocation, location)}>Hierher verschieben</button>
              ) : null}
            </DropCell>
          );
        })}
      </div>
      {page.slots.some(Boolean) ? <p className={styles.dragHint}>Karten lassen sich auf einen anderen Platz ziehen. Am Handy die Karte kurz gedrückt halten, dann ziehen.</p> : null}
      <DragOverlay dropAnimation={null}>
        {dragged ? (
          <div className={styles.dragOverlay}>
            {dragged.card ? <CardArtwork card={dragged.card} className={styles.dragThumb} fallback={<GripVertical size={16} />} /> : <GripVertical size={16} />}
            <span>{dragged.label}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
