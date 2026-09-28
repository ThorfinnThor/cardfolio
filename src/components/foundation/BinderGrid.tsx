"use client";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  MouseSensor,
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
import { formatVariantSelection } from "@/domain/variant-selection";
import type { BinderPage, CardSnapshot, PlannedCard } from "@/domain/types";

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
}

interface OccupiedSlotProps {
  entry: PlannedCard;
  card?: CardSnapshot;
  location: SlotLocation;
  selected: boolean;
  moving: boolean;
  onSelectCard: (location: SlotLocation) => void;
  onRefreshCard: (card: CardSnapshot) => void;
}

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
  onSelectCard,
  onRefreshCard,
}: OccupiedSlotProps) {
  const { isDragging, listeners, setNodeRef, transform } = useDraggable({
    id: `card:${entry.id}`,
    data: { location, label: card?.name ?? "Karte" },
  });
  const dragStyle: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : undefined,
  };

  return (
    <article
      ref={setNodeRef}
      style={dragStyle}
      className={`${styles.slot} ${selected ? styles.slotSelected : ""} ${moving ? styles.movingSlot : ""}`}
      data-owned={entry.owned}
      tabIndex={0}
      aria-label={card ? `${card.name}, Slot ${location.slotIndex + 1}` : `Kartendaten fehlen, Slot ${location.slotIndex + 1}`}
      onClick={() => onSelectCard(location)}
      onKeyDown={(event) => {
        if (event.currentTarget !== event.target || (event.key !== "Enter" && event.key !== " ")) return;
        event.preventDefault();
        onSelectCard(location);
      }}
    >
      <span className={styles.dragHandle} title="Mit der Maus ziehen" aria-hidden="true" {...listeners}>
        <GripVertical size={16} />
      </span>
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
          <span className={entry.owned ? styles.ownedBadge : styles.missingBadge}>{entry.owned ? "Vorhanden" : "Fehlt"}</span>
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
}: BinderGridProps) {
  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 7 } }));
  const [dragLabel, setDragLabel] = useState<string>();

  function dragStart(event: DragStartEvent) {
    setDragLabel(typeof event.active.data.current?.label === "string" ? event.active.data.current.label : "Karte");
  }

  function dragEnd(event: DragEndEvent) {
    setDragLabel(undefined);
    const from = event.active.data.current?.location as SlotLocation | undefined;
    const to = event.over?.data.current?.location as SlotLocation | undefined;
    if (!from || !to || sameLocation(from, to)) return;
    onMove(from, to);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={dragStart} onDragCancel={() => setDragLabel(undefined)} onDragEnd={dragEnd}>
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
                  onSelectCard={onSelectCard}
                  onRefreshCard={onRefreshCard}
                />
              ) : (
                <button
                  type="button"
                  className={`${styles.emptySlot} ${sameLocation(selectedLocation, location) ? styles.emptySlotSelected : ""}`}
                  onClick={() => movingLocation ? onMove(movingLocation, location) : onOpenSearch(location)}
                  aria-label={movingLocation ? `Freier Platz ${index + 1}, hierher verschieben` : `Freier Platz ${index + 1}, Karte einsetzen`}
                >
                  <span className={styles.emptySlotIcon}>+</span>
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
      <DragOverlay dropAnimation={null}>
        {dragLabel ? <div className={styles.dragOverlay}><GripVertical size={16} /> {dragLabel}</div> : null}
      </DragOverlay>
    </DndContext>
  );
}
