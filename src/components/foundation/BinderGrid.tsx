"use client";

/* eslint-disable @next/next/no-img-element -- External card images intentionally bypass app-side proxying. */

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

import { cardImageUrl } from "@/data/catalog/images";
import type { SlotLocation } from "@/domain/binder-actions";
import { formatCollectorNumber } from "@/domain/catalog-search";
import { formatVariantSelection } from "@/domain/variant-selection";
import type { BinderPage, CardSnapshot, PlannedCard } from "@/domain/types";

import styles from "./foundation-workspace.module.css";

interface BinderGridProps {
  page: BinderPage;
  columns: number;
  cards: ReadonlyMap<string, CardSnapshot>;
  selectedLocation?: SlotLocation;
  movingLocation?: SlotLocation;
  onOpenSearch: (location: SlotLocation) => void;
  onSelectMoveSource: (location: SlotLocation) => void;
  onMove: (from: SlotLocation, to: SlotLocation) => void;
  onToggleOwned: (entryId: string, owned: boolean) => void;
  onRequestVariant: (entry: PlannedCard, card?: CardSnapshot) => void;
  onRefreshCard: (card: CardSnapshot) => void;
  onRequestRemove: (location: SlotLocation, label: string) => void;
}

interface OccupiedSlotProps {
  entry: PlannedCard;
  card?: CardSnapshot;
  location: SlotLocation;
  selected: boolean;
  moving: boolean;
  onSelectMoveSource: (location: SlotLocation) => void;
  onToggleOwned: (entryId: string, owned: boolean) => void;
  onRequestVariant: (entry: PlannedCard, card?: CardSnapshot) => void;
  onRefreshCard: (card: CardSnapshot) => void;
  onRequestRemove: (location: SlotLocation, label: string) => void;
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
  onSelectMoveSource,
  onToggleOwned,
  onRequestVariant,
  onRefreshCard,
  onRequestRemove,
}: OccupiedSlotProps) {
  const imageSource = card?.imageBaseUrl ? cardImageUrl(card.imageBaseUrl) : undefined;
  const [failedImageSource, setFailedImageSource] = useState<string>();
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
    >
      <span className={styles.dragHandle} title="Mit der Maus ziehen" aria-hidden="true" {...listeners}>
        <GripVertical size={16} />
      </span>
      {card ? (
        <>
          {imageSource && failedImageSource !== imageSource ? (
            <img
              src={imageSource}
              alt={`${card.name}, ${card.setName} ${card.collectorNumber}`}
              onError={() => setFailedImageSource(imageSource)}
            />
          ) : (
            <div className={styles.imageFallback}>
              <span role="img" aria-label={`Bild für ${card.name} nicht verfügbar`}>Bild nicht verfügbar</span>
              <button type="button" onClick={() => onRefreshCard(card)}>Kartendaten aktualisieren</button>
            </div>
          )}
          <strong>{card.name}</strong>
          <small>{card.setName} · {formatCollectorNumber(card.collectorNumber, card.collectorTotal)}</small>
          <span className={styles.variantSummary}>{formatVariantSelection(entry.variant)}</span>
          <div className={styles.slotActions}>
            <button type="button" className={styles.variantAction} onClick={() => onRequestVariant(entry, card)}>
              Version festlegen
            </button>
            <button type="button" className={styles.ownershipAction} onClick={() => onToggleOwned(entry.id, !entry.owned)}>
              {entry.owned ? "Als fehlend markieren" : "Als vorhanden markieren"}
            </button>
            <button type="button" className={styles.moveAction} onClick={() => onSelectMoveSource(location)} aria-pressed={moving}>
              {moving ? "Quelle gewählt" : "Verschieben"}
            </button>
            <button type="button" className={styles.removeAction} onClick={() => onRequestRemove(location, card.name)}>Entfernen</button>
          </div>
        </>
      ) : (
        <>
          <div className={styles.imageFallback}>Kartendaten fehlen</div>
          <div className={styles.slotActions}>
            <button type="button" className={styles.moveAction} onClick={() => onSelectMoveSource(location)} aria-pressed={moving}>
              {moving ? "Quelle gewählt" : "Verschieben"}
            </button>
            <button type="button" className={styles.removeAction} onClick={() => onRequestRemove(location, "Karte ohne Metadaten")}>Entfernen</button>
          </div>
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
  onSelectMoveSource,
  onMove,
  onToggleOwned,
  onRequestVariant,
  onRefreshCard,
  onRequestRemove,
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
                  onSelectMoveSource={onSelectMoveSource}
                  onToggleOwned={onToggleOwned}
                  onRequestVariant={onRequestVariant}
                  onRefreshCard={onRefreshCard}
                  onRequestRemove={onRequestRemove}
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
