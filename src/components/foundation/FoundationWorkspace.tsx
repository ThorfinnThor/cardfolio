"use client";

/* eslint-disable @next/next/no-img-element -- TCGdex images remain external references and are never proxied. */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, BookOpen, CircleHelp, DatabaseBackup, ListFilter, Menu, Search, Settings2, X } from "lucide-react";
import Link from "next/link";
import { type ChangeEvent, type FormEvent, useEffect, useMemo, useRef, useState } from "react";

import {
  addPage,
  changeBinderLayout,
  createBinder,
  createPlannedCard,
  moveOrSwapCard,
  placeCard,
  previewBinderLayoutChange,
  removeCard,
  setCardVariant,
  setOwned,
  SUPPORTED_BINDER_LAYOUTS,
  type BinderLayoutPreview,
  type SlotLocation,
  type SupportedBinderLayout,
} from "@/domain/binder-actions";
import { deriveBinderStats } from "@/domain/binder-stats";
import { formatCollectorNumber, parseCatalogSearch } from "@/domain/catalog-search";
import { createMissingItemsCsvExport, createMissingItemsTextExport } from "@/domain/missing-items-export";
import { deriveMissingItems } from "@/domain/missing-items";
import type { CardmarketHandoffPart } from "@/domain/cardmarket-handoff";
import type { TcgplayerMassEntryExport } from "@/domain/tcgplayer-export";
import type { Binder, CardSnapshot, CatalogSearchItem, MissingItem, PlannedCard, VariantSelection } from "@/domain/types";
import { FEATURES } from "@/config/feature-flags";
import { PRODUCT_DESIGN } from "@/config/product";
import { validateBackup } from "@/domain/validation";
import { editionLabels, finishLabels, formatAvailableVariants, formatVariantSelection, printingLabels, selectedPrinting } from "@/domain/variant-selection";
import { catalogQueryKey, detailQueryKey, TCGdexCatalogAdapter } from "@/data/catalog/tcgdex";
import { cardImageUrl } from "@/data/catalog/images";
import { RevisionConflictError } from "@/data/persistence/binder-repository";
import { IndexedDBBinderRepository } from "@/data/persistence/indexeddb-binder-repository";

import { BinderOverview } from "./BinderOverview";
import { BinderGrid } from "./BinderGrid";
import { MissingCardsPanel } from "./MissingCardsPanel";
import styles from "./foundation-workspace.module.css";

const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

type CopyState = "idle" | "copied" | "error";
type SearchLanguage = "all" | "de" | "en";
type ImportReport = { binderCount: number; cardCount: number; plannedCount: number; names: string[] };
type BinderSyncMessage = { type: "binder-changed"; binderId: string; revision: number; deleted?: boolean };
type LayoutChangeRequest = { binderId: string; layout: SupportedBinderLayout; preview: BinderLayoutPreview };
type VariantEditRequest = {
  entryId: string;
  label: string;
  variant: VariantSelection;
  availableVariants?: CardSnapshot["availableVariants"];
};

function interleaveSearchResults(
  germanItems: readonly CatalogSearchItem[],
  englishItems: readonly CatalogSearchItem[],
) {
  const results: CatalogSearchItem[] = [];
  const maxLength = Math.max(germanItems.length, englishItems.length);

  for (let index = 0; index < maxLength; index += 1) {
    if (germanItems[index]) results.push(germanItems[index]);
    if (englishItems[index]) results.push(englishItems[index]);
  }

  return results;
}

export function FoundationWorkspace() {
  const repository = useMemo(() => new IndexedDBBinderRepository(), []);
  const catalog = useMemo(() => new TCGdexCatalogAdapter(), []);
  const syncChannelRef = useRef<BroadcastChannel | undefined>(undefined);
  const queryClient = useQueryClient();
  const [binders, setBinders] = useState<Binder[]>([]);
  const [activeId, setActiveId] = useState<string>();
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [name, setName] = useState("");
  const [searchText, setSearchText] = useState("");
  const [searchLanguage, setSearchLanguage] = useState<SearchLanguage>("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SlotLocation>();
  const [contextLocation, setContextLocation] = useState<SlotLocation>();
  const [movingLocation, setMovingLocation] = useState<SlotLocation>();
  const [cards, setCards] = useState<Map<string, CardSnapshot>>(new Map());
  const [cardsBinderId, setCardsBinderId] = useState<string>();
  const [storageStatus, setStorageStatus] = useState("initializing");
  const [message, setMessage] = useState<string>();
  const [binderToDelete, setBinderToDelete] = useState<Binder>();
  const [cardToRemove, setCardToRemove] = useState<{ location: SlotLocation; label: string }>();
  const [layoutChange, setLayoutChange] = useState<LayoutChangeRequest>();
  const [variantEdit, setVariantEdit] = useState<VariantEditRequest>();
  const [missingOpen, setMissingOpen] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [tcgplayerCopyState, setTcgplayerCopyState] = useState<CopyState>("idle");
  const [cardmarketCopyState, setCardmarketCopyState] = useState<CopyState>("idle");
  const [importReport, setImportReport] = useState<ImportReport>();
  const [storageConflict, setStorageConflict] = useState(false);
  const [binderManagerOpen, setBinderManagerOpen] = useState(false);

  const activeBinder = binders.find((binder) => binder.id === activeId);
  const activePage = activeBinder?.pages[Math.min(activePageIndex, Math.max(activeBinder.pages.length - 1, 0))];
  const visiblePageIndex = activeBinder && activePage ? activeBinder.pages.indexOf(activePage) : 0;

  useEffect(() => {
    repository
      .list()
      .then((items) => {
        setBinders(items);
        setActiveId(items[0]?.id);
        setStorageStatus("ready");
      })
      .catch((error: unknown) => {
        setStorageStatus("error");
        setMessage(error instanceof Error ? error.message : "Lokaler Speicher konnte nicht geöffnet werden.");
      });
  }, [repository]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchText.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    if (!searchOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [searchOpen]);

  useEffect(() => {
    if (!activeId) return;
    repository.exportBackup([activeId]).then((backup) => {
      setCards(new Map(backup.cards.map((card) => [card.key, card])));
      setCardsBinderId(activeId);
    }).catch((error: unknown) => {
      setStorageStatus("error");
      setMessage(error instanceof Error ? error.message : "Kartendaten konnten nicht aus dem lokalen Speicher geladen werden.");
    });
  }, [activeId, binders, repository]);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel("cardfolio-binder-sync");
    syncChannelRef.current = channel;
    channel.onmessage = (event: MessageEvent<BinderSyncMessage>) => {
      const update = event.data;
      if (update.type !== "binder-changed" || update.binderId !== activeId) return;
      if (!update.deleted && update.revision <= (activeBinder?.revision ?? -1)) return;
      setStorageConflict(true);
      setStorageStatus("error");
      setMessage(update.deleted
        ? "Dieser Binder wurde in einem anderen Tab gelöscht. Lade den aktuellen lokalen Stand."
        : "Dieser Binder wurde in einem anderen Tab geändert. Lade den aktuellen Stand, bevor du weiterarbeitest.");
    };
    return () => {
      channel.close();
      if (syncChannelRef.current === channel) syncChannelRef.current = undefined;
    };
  }, [activeBinder?.revision, activeId]);

  const parsedSearch = useMemo(() => parseCatalogSearch(debouncedSearch), [debouncedSearch]);
  const searchEnabled = Boolean((parsedSearch.name?.length ?? 0) >= 2 || parsedSearch.collectorNumber);
  const germanCatalogQuery = { language: "de" as const, ...parsedSearch, page: 1, pageSize: 40 };
  const englishCatalogQuery = { language: "en" as const, ...parsedSearch, page: 1, pageSize: 40 };

  const germanSearchQuery = useQuery({
    queryKey: catalogQueryKey(germanCatalogQuery),
    queryFn: ({ signal }) =>
      catalog.search(germanCatalogQuery, signal),
    enabled: searchEnabled && searchLanguage !== "en",
    staleTime: 10 * 60 * 1_000,
  });

  const englishSearchQuery = useQuery({
    queryKey: catalogQueryKey(englishCatalogQuery),
    queryFn: ({ signal }) =>
      catalog.search(englishCatalogQuery, signal),
    enabled: searchEnabled && searchLanguage !== "de",
    staleTime: 10 * 60 * 1_000,
  });

  const germanSearchResults = germanSearchQuery.data?.items ?? [];
  const englishSearchResults = englishSearchQuery.data?.items ?? [];
  const searchResults = searchLanguage === "de"
    ? germanSearchResults
    : searchLanguage === "en"
      ? englishSearchResults
      : interleaveSearchResults(germanSearchResults, englishSearchResults);
  const searchIsRunning = searchLanguage === "de"
    ? germanSearchQuery.isFetching
    : searchLanguage === "en"
      ? englishSearchQuery.isFetching
      : germanSearchQuery.isFetching || englishSearchQuery.isFetching;
  const searchHasCompleted = searchLanguage === "de"
    ? Boolean(germanSearchQuery.data) && !searchIsRunning
    : searchLanguage === "en"
      ? Boolean(englishSearchQuery.data) && !searchIsRunning
      : Boolean(germanSearchQuery.data || englishSearchQuery.data) && !searchIsRunning;
  const searchError = searchLanguage === "de"
    ? germanSearchQuery.error
    : searchLanguage === "en"
      ? englishSearchQuery.error
      : germanSearchQuery.error ?? englishSearchQuery.error;

  function publishBinderChange(binder: Binder, deleted = false) {
    syncChannelRef.current?.postMessage({
      type: "binder-changed",
      binderId: binder.id,
      revision: binder.revision,
      deleted,
    } satisfies BinderSyncMessage);
  }

  function handleStorageError(error: unknown, fallback: string) {
    setStorageStatus("error");
    if (error instanceof RevisionConflictError) {
      setStorageConflict(true);
      setMessage("Dieser Binder wurde in einem anderen Tab geändert. Lade den aktuellen Stand, bevor du weiterarbeitest.");
      return;
    }
    setMessage(error instanceof Error ? error.message : fallback);
  }

  async function reloadActiveBinder() {
    if (!activeId) return;
    try {
      const current = await repository.get(activeId);
      if (!current) {
        const remaining = await repository.list();
        setBinders(remaining);
        setActiveId(remaining[0]?.id);
        setActivePageIndex(0);
        setStorageConflict(false);
        setStorageStatus("ready");
        setMessage("Der gelöschte Binder wurde aus dieser Ansicht entfernt.");
        return;
      }
      const backup = await repository.exportBackup([activeId]);
      setBinders((items) => items.map((binder) => (binder.id === current.id ? current : binder)));
      setCards(new Map(backup.cards.map((card) => [card.key, card])));
      setCardsBinderId(activeId);
      setActivePageIndex((index) => Math.min(index, current.pages.length - 1));
      setStorageConflict(false);
      setStorageStatus("saved");
      setMessage("Der aktuelle Stand aus diesem Browser wurde geladen.");
    } catch (error) {
      handleStorageError(error, "Der aktuelle Binderstand konnte nicht geladen werden.");
    }
  }

  async function retryStorage() {
    try {
      setStorageStatus("initializing");
      const items = await repository.list();
      setBinders(items);
      setActiveId((current) => current && items.some((binder) => binder.id === current) ? current : items[0]?.id);
      setStorageConflict(false);
      setStorageStatus("ready");
      setMessage("Der lokale Speicher ist wieder verfügbar.");
    } catch (error) {
      handleStorageError(error, "Lokaler Speicher konnte weiterhin nicht geöffnet werden.");
    }
  }

  async function createNewBinder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const binder = createBinder(name);
      setStorageStatus("saving");
      await repository.create(binder, []);
      publishBinderChange(binder);
      setBinders((current) => [binder, ...current]);
      setActiveId(binder.id);
      setActivePageIndex(0);
      setName("");
      setBinderManagerOpen(false);
      setStorageConflict(false);
      setStorageStatus("saved");
      setMessage("Binder wurde lokal gespeichert.");
    } catch (error) {
      handleStorageError(error, "Binder konnte nicht gespeichert werden.");
    }
  }

  async function deleteBinder() {
    if (!binderToDelete) return;
    try {
      setStorageStatus("saving");
      await repository.remove(binderToDelete.id, binderToDelete.revision);
      publishBinderChange(binderToDelete, true);
      const remaining = await repository.list();
      setBinders(remaining);
      setActiveId(remaining[0]?.id);
      setActivePageIndex(0);
      setContextLocation(undefined);
      setSelectedLocation(undefined);
      setMovingLocation(undefined);
      setSearchOpen(false);
      setBinderToDelete(undefined);
      setStorageStatus("saved");
      setMessage(`„${binderToDelete.name}“ wurde lokal gelöscht.`);
    } catch (error) {
      handleStorageError(error, "Binder konnte nicht gelöscht werden.");
    }
  }

  async function createNewPage() {
    if (!activeBinder) return;
    try {
      const next = addPage(activeBinder);
      setStorageStatus("saving");
      const saved = await repository.save(next, [], activeBinder.revision);
      publishBinderChange(saved);
      setBinders((current) => current.map((binder) => (binder.id === saved.id ? saved : binder)));
      setActivePageIndex(saved.pages.length - 1);
      setContextLocation(undefined);
      setStorageStatus("saved");
      setMessage(`Seite ${saved.pages.length} wurde angelegt.`);
    } catch (error) {
      handleStorageError(error, "Neue Seite konnte nicht angelegt werden.");
    }
  }

  function requestLayoutChange(layoutKey: string) {
    if (!activeBinder) return;
    const layout = SUPPORTED_BINDER_LAYOUTS.find((candidate) => candidate.key === layoutKey);
    if (!layout || (layout.rows === activeBinder.layout.rows && layout.columns === activeBinder.layout.columns)) return;
    const nextLayout = { rows: layout.rows, columns: layout.columns };
    setMovingLocation(undefined);
    setSelectedLocation(undefined);
    setSearchOpen(false);
    setLayoutChange({
      binderId: activeBinder.id,
      layout: nextLayout,
      preview: previewBinderLayoutChange(activeBinder, nextLayout),
    });
  }

  async function confirmLayoutChange() {
    if (!activeBinder || !layoutChange || layoutChange.binderId !== activeBinder.id) return;
    try {
      const next = changeBinderLayout(activeBinder, layoutChange.layout);
      setStorageStatus("saving");
      const saved = await repository.save(next, [], activeBinder.revision);
      publishBinderChange(saved);
      setBinders((current) => current.map((binder) => (binder.id === saved.id ? saved : binder)));
      setActivePageIndex((index) => Math.min(index, saved.pages.length - 1));
      setLayoutChange(undefined);
      setStorageStatus("saved");
      setMessage(`Binderformat wurde auf ${saved.layout.rows} × ${saved.layout.columns} geändert. Alle ${layoutChange.preview.plannedCards} Karten wurden übernommen.`);
    } catch (error) {
      handleStorageError(error, "Binderformat konnte nicht geändert werden.");
    }
  }

  function selectBinder(id: string) {
    setActiveId(id);
    setActivePageIndex(0);
    setSelectedLocation(undefined);
    setContextLocation(undefined);
    setMovingLocation(undefined);
    setSearchOpen(false);
    setMissingOpen(false);
    setCopyState("idle");
    setTcgplayerCopyState("idle");
    setCardmarketCopyState("idle");
    setLayoutChange(undefined);
    setVariantEdit(undefined);
    setStorageConflict(false);
    setBinderManagerOpen(false);
  }

  async function addCard(item: CatalogSearchItem) {
    if (!activeBinder) return;
    const location = selectedLocation
      ? {
          ...selectedLocation,
          slot: activeBinder.pages.find((page) => page.id === selectedLocation.pageId)?.slots[selectedLocation.slotIndex],
        }
      : activeBinder.pages
        .flatMap((page) => page.slots.map((slot, slotIndex) => ({ pageId: page.id, slotIndex, slot })))
        .find((candidate) => candidate.slot === null);
    if (!location) {
      setMessage("Der ausgewählte Slot ist nicht mehr verfügbar.");
      return;
    }
    if (location.slot) {
      setMessage("Der ausgewählte Slot ist bereits belegt.");
      return;
    }
    try {
      const snapshot = await queryClient.fetchQuery({
        queryKey: detailQueryKey(item.ref.language, item.ref.id),
        queryFn: ({ signal }) => catalog.getCard(item.ref, signal),
        staleTime: 24 * 60 * 60 * 1_000,
      });
      if (snapshot.physicalStatus === "digital") {
        setMessage("Pocket-Karten können nicht in einen physischen Binder eingesetzt werden.");
        return;
      }
      const next = placeCard(activeBinder, location, createPlannedCard(snapshot.key));
      setStorageStatus("saving");
      const saved = await repository.save(next, [snapshot], activeBinder.revision);
      publishBinderChange(saved);
      setBinders((current) => current.map((binder) => (binder.id === saved.id ? saved : binder)));
      setCards((current) => new Map(current).set(snapshot.key, snapshot));
      setSelectedLocation(undefined);
      setMovingLocation(undefined);
      setSearchOpen(false);
      setSearchText("");
      setStorageStatus("saved");
      setMessage(`${snapshot.name} wurde eingesetzt.`);
    } catch (error) {
      handleStorageError(error, "Karte konnte nicht eingesetzt werden.");
    }
  }

  function openSearchForSlot(location?: SlotLocation) {
    setMovingLocation(undefined);
    setSelectedLocation(location);
    setSearchOpen(true);
    setMessage(location ? `Slot ${location.slotIndex + 1} ausgewählt. Suche eine Karte zum Einsetzen.` : undefined);
  }

  function selectMoveSource(location: SlotLocation) {
    setSelectedLocation(undefined);
    setContextLocation(location);
    setSearchOpen(false);
    setMovingLocation(location);
    setMessage("Karte ausgewählt. Wähle jetzt einen freien oder belegten Zielslot.");
  }

  async function moveCard(from: SlotLocation, target: SlotLocation) {
    if (!activeBinder) return;
    if (from.pageId === target.pageId && from.slotIndex === target.slotIndex) {
      setMessage("Die Karte befindet sich bereits in diesem Slot.");
      setMovingLocation(undefined);
      return;
    }
    try {
      const sourceEntry = activeBinder.pages.find((page) => page.id === from.pageId)?.slots[from.slotIndex];
      const targetEntry = activeBinder.pages.find((page) => page.id === target.pageId)?.slots[target.slotIndex];
      const next = moveOrSwapCard(activeBinder, from, target);
      setStorageStatus("saving");
      const saved = await repository.save(next, [], activeBinder.revision);
      publishBinderChange(saved);
      setBinders((current) => current.map((binder) => (binder.id === saved.id ? saved : binder)));
      setMovingLocation(undefined);
      setStorageStatus("saved");
      setMessage(targetEntry ? "Karten wurden getauscht." : sourceEntry ? "Karte wurde verschoben." : "Karte wurde aktualisiert.");
    } catch (error) {
      handleStorageError(error, "Karte konnte nicht verschoben werden.");
    }
  }

  function requestRemove(location: SlotLocation, label: string) {
    setMovingLocation(undefined);
    setCardToRemove({ location, label });
  }

  async function confirmRemoveCard() {
    if (!activeBinder || !cardToRemove) return;
    try {
      const next = removeCard(activeBinder, cardToRemove.location);
      setStorageStatus("saving");
      const saved = await repository.save(next, [], activeBinder.revision);
      publishBinderChange(saved);
      setBinders((current) => current.map((binder) => (binder.id === saved.id ? saved : binder)));
      setCardToRemove(undefined);
      setMovingLocation(undefined);
      setContextLocation(undefined);
      setStorageStatus("saved");
      setMessage(`„${cardToRemove.label}“ wurde aus dem Binder entfernt.`);
    } catch (error) {
      handleStorageError(error, "Karte konnte nicht entfernt werden.");
    }
  }

  async function toggleOwned(entryId: string, owned: boolean) {
    if (!activeBinder) return;
    try {
      const next = setOwned(activeBinder, entryId, owned);
      setStorageStatus("saving");
      const saved = await repository.save(next, [], activeBinder.revision);
      publishBinderChange(saved);
      setBinders((current) => current.map((binder) => (binder.id === saved.id ? saved : binder)));
      setStorageStatus("saved");
    } catch (error) {
      handleStorageError(error, "Besitzstatus konnte nicht gespeichert werden.");
    }
  }

  function requestVariantEdit(entry: PlannedCard, card?: CardSnapshot) {
    setMovingLocation(undefined);
    setVariantEdit({
      entryId: entry.id,
      label: card?.name ?? "Karte",
      variant: { ...entry.variant, printing: selectedPrinting(entry.variant) },
      availableVariants: card?.availableVariants,
    });
  }

  async function saveVariantEdit() {
    if (!activeBinder || !variantEdit) return;
    try {
      const next = setCardVariant(activeBinder, variantEdit.entryId, variantEdit.variant);
      setStorageStatus("saving");
      const saved = await repository.save(next, [], activeBinder.revision);
      publishBinderChange(saved);
      setBinders((current) => current.map((binder) => (binder.id === saved.id ? saved : binder)));
      setVariantEdit(undefined);
      setStorageStatus("saved");
      setMessage(`Version für „${variantEdit.label}“ wurde gespeichert.`);
    } catch (error) {
      handleStorageError(error, "Kartenversion konnte nicht gespeichert werden.");
    }
  }

  async function refreshCardSnapshot(card: CardSnapshot) {
    if (!activeBinder) return;
    try {
      setStorageStatus("saving");
      const snapshot = await catalog.getCard(card.ref);
      const saved = await repository.save(activeBinder, [snapshot], activeBinder.revision);
      publishBinderChange(saved);
      setBinders((current) => current.map((binder) => (binder.id === saved.id ? saved : binder)));
      setCards((current) => new Map(current).set(snapshot.key, snapshot));
      setStorageStatus("saved");
      setMessage(snapshot.imageBaseUrl
        ? `Kartendaten und Bild für „${snapshot.name}“ wurden aktualisiert.`
        : `Kartendaten für „${snapshot.name}“ wurden aktualisiert; TCGdex stellt weiterhin kein Bild bereit.`);
    } catch (error) {
      handleStorageError(error, "Kartendaten konnten nicht aktualisiert werden.");
    }
  }

  async function exportBackup() {
    try {
      const backup = await repository.exportBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cardfolio-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      handleStorageError(error, "Backup konnte nicht aus dem lokalen Speicher erstellt werden.");
    }
  }

  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setImportReport(undefined);
    if (file.size > MAX_IMPORT_BYTES) {
      setMessage("Die Sicherungsdatei ist größer als 5 MiB.");
      return;
    }
    try {
      const backup = validateBackup(JSON.parse(await file.text()));
      setStorageStatus("saving");
      await repository.importBackup(backup, "import-as-new");
      const items = await repository.list();
      setBinders(items);
      setActiveId(items[0]?.id);
      setStorageConflict(false);
      setImportReport({
        binderCount: backup.binders.length,
        cardCount: backup.cards.length,
        plannedCount: backup.binders.reduce((total, binder) => total + deriveBinderStats(binder).planned, 0),
        names: backup.binders.map((binder) => binder.name),
      });
      setStorageStatus("saved");
      setMessage(`${backup.binders.length} Binder wurden als neue Binder importiert.`);
    } catch (error) {
      handleStorageError(error, "Sicherung ist ungültig.");
    }
  }

  function downloadMissingExport(items: readonly MissingItem[], format: "text" | "csv") {
    const exported = format === "csv" ? createMissingItemsCsvExport(items) : createMissingItemsTextExport(items);
    const blob = new Blob([exported.text], { type: `${exported.mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cardfolio-fehlkarten-${new Date().toISOString().slice(0, 10)}.${format === "csv" ? "csv" : "txt"}`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage(`${items.length} Fehlkartenpositionen wurden als ${format.toUpperCase()} vorbereitet.`);
  }

  async function copyMissingItems(items: readonly MissingItem[]) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(createMissingItemsTextExport(items).text);
      setCopyState("copied");
      setMessage(`${items.length} Fehlkartenpositionen wurden in die Zwischenablage kopiert.`);
    } catch {
      setCopyState("error");
      setMessage("Kopieren wurde vom Browser nicht erlaubt. Nutze stattdessen den TXT- oder CSV-Export.");
    }
  }

  async function copyTcgplayerExport(exported: TcgplayerMassEntryExport) {
    try {
      if (!exported.text) throw new Error("No verified TCGplayer lines available");
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(exported.text);
      setTcgplayerCopyState("copied");
      setMessage(`${exported.verifiedCount} geprüfte TCGplayer-Positionen wurden kopiert.`);
    } catch {
      setTcgplayerCopyState("error");
      setMessage("TCGplayer-Liste konnte nicht kopiert werden. Nutze die sichtbare Vorschau oder TXT-Datei.");
    }
  }

  function downloadTcgplayerExport(exported: TcgplayerMassEntryExport) {
    if (!exported.text) return;
    const blob = new Blob([exported.text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cardfolio-tcgplayer-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage(`${exported.verifiedCount} geprüfte TCGplayer-Positionen wurden als TXT vorbereitet.`);
  }

  async function copyCardmarketHandoff(part: CardmarketHandoffPart) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(part.text);
      setCardmarketCopyState("copied");
      setMessage(`Cardmarket-Prüfliste Teil ${part.index} mit ${part.positionCount} Positionen wurde kopiert.`);
    } catch {
      setCardmarketCopyState("error");
      setMessage("Cardmarket-Prüfliste konnte nicht kopiert werden. Nutze die sichtbare Vorschau oder TXT-Datei.");
    }
  }

  function downloadCardmarketHandoff(part: CardmarketHandoffPart) {
    const blob = new Blob([part.text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cardfolio-cardmarket-pruefliste-teil-${part.index}-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage(`Cardmarket-Prüfliste Teil ${part.index} mit ${part.positionCount} Positionen wurde als TXT vorbereitet.`);
  }

  const stats = activeBinder ? deriveBinderStats(activeBinder) : undefined;
  const missingResult = (() => {
    if (!activeBinder || !activeId || cardsBinderId !== activeId) return { items: [] as MissingItem[], error: undefined as string | undefined };
    try {
      return { items: deriveMissingItems(activeBinder, cards), error: undefined };
    } catch (error) {
      return { items: [] as MissingItem[], error: error instanceof Error ? error.message : "Fehlkarten konnten nicht abgeleitet werden." };
    }
  })();
  const missingWarnings = createMissingItemsTextExport(missingResult.items).warnings;
  const contextEntry = contextLocation
    ? activeBinder?.pages.find((page) => page.id === contextLocation.pageId)?.slots[contextLocation.slotIndex] ?? undefined
    : undefined;
  const contextCard = contextEntry ? cards.get(contextEntry.cardKey) : undefined;
  const activePageEntries = activePage?.slots.filter((entry): entry is PlannedCard => entry !== null) ?? [];
  const activePageOwned = activePageEntries.filter((entry) => entry.owned).length;
  const activePageMissing = activePageEntries
    .filter((entry) => !entry.owned)
    .map((entry) => ({ entry, card: cards.get(entry.cardKey) }));

  return (
    <div className={styles.appShell} data-design={PRODUCT_DESIGN}>
      <aside className={styles.sidebar} aria-label="Cardfolio Navigation">
        <button type="button" className={styles.brand} onClick={() => setBinderManagerOpen(true)}>
          <span className={styles.brandMark}><Archive size={18} /></span>
          <span>Cardfolio</span>
        </button>
        <nav className={styles.primaryNav} aria-label="Hauptnavigation">
          <button type="button" className={binderManagerOpen ? styles.navItemActive : styles.navItem} onClick={() => setBinderManagerOpen(true)}>
            <BookOpen size={18} /> <span>Meine Binder</span>
          </button>
          <button type="button" className={!binderManagerOpen && !missingOpen ? styles.navItemActive : styles.navItem} onClick={() => { setBinderManagerOpen(false); setMissingOpen(false); }} disabled={!activeBinder}>
            <Archive size={18} /> <span>Binder</span>
          </button>
          <button type="button" className={missingOpen ? styles.navItemActive : styles.navItem} onClick={() => { setBinderManagerOpen(false); setMissingOpen(true); setSearchOpen(false); }} disabled={!activeBinder}>
            <ListFilter size={18} /> <span>Fehlende Karten</span>{stats ? <span className={styles.navBadge}>{stats.missing}</span> : null}
          </button>
        </nav>
        {binders.length ? (
          <div className={styles.sidebarBinders}>
            <span>Binder</span>
            {binders.map((binder) => (
              <button type="button" key={binder.id} aria-pressed={binder.id === activeId} onClick={() => selectBinder(binder.id)}>
                <span className={styles.binderDot} /> <span>{binder.name}</span>
              </button>
            ))}
          </div>
        ) : null}
        <div className={styles.sidebarBottom}>
          <button type="button" className={styles.navItem} onClick={() => void exportBackup()} disabled={!binders.length}><DatabaseBackup size={18} /> <span>Backup exportieren</span></button>
          <Link className={styles.navItem} href="/help/"><CircleHelp size={18} /> <span>Hilfe</span></Link>
          <span className={styles.navItemMuted}><Settings2 size={18} /> <span>Einstellungen</span></span>
        </div>
      </aside>

      <div className={styles.mainColumn}>
        <header className={styles.topbar}>
          <button type="button" className={styles.mobileMenu} onClick={() => setBinderManagerOpen(true)} aria-label="Binderverwaltung öffnen"><Menu size={19} /></button>
          <div className={styles.breadcrumb}>
            <button type="button" onClick={() => setBinderManagerOpen(true)}>Meine Binder</button>
            <span>/</span>
            <strong>{activeBinder?.name ?? "Übersicht"}</strong>
          </div>
          <div className={styles.topbarActions}>
            <button type="button" className={styles.topbarSearch} onClick={() => { setBinderManagerOpen(false); setMissingOpen(false); openSearchForSlot(); }} disabled={!activeBinder}>
              <Search size={17} /> <span>Karte suchen</span>
            </button>
            <span className={styles.status} data-status={storageStatus}><span />{storageStatus === "ready" || storageStatus === "saved" ? "Lokal gespeichert" : storageStatus}</span>
          </div>
        </header>

        <main className={styles.page}>

      {message ? (
        <div className={styles.notice} role="status" data-conflict={storageConflict}>
          <span>{message}</span>
          {storageConflict ? (
            <button type="button" onClick={reloadActiveBinder}>Aktuellen Stand laden</button>
          ) : storageStatus === "error" ? (
            <div className={styles.noticeActions}>
              <button type="button" onClick={retryStorage}>Erneut versuchen</button>
              <button type="button" onClick={exportBackup} disabled={!binders.length}>Backup exportieren</button>
            </div>
          ) : null}
        </div>
      ) : null}

      {!activeBinder || binderManagerOpen ? (
        <BinderOverview
          binders={binders}
          activeId={activeId}
          name={name}
          storageStatus={storageStatus}
          onNameChange={(event) => setName(event.target.value)}
          onCreate={createNewBinder}
          onSelect={selectBinder}
          onRequestDelete={setBinderToDelete}
          onExport={exportBackup}
          onImport={importBackup}
        />
      ) : null}

      {importReport ? (
        <section className={styles.importReport} aria-label="Importbericht" role="status">
          <div>
            <strong>Import abgeschlossen</strong>
            <p>{importReport.binderCount} Binder, {importReport.plannedCount} geplante Karten und {importReport.cardCount} Kartendaten wurden als neue lokale Binder angelegt.</p>
          </div>
          <span>{importReport.names.join(" · ")}</span>
        </section>
      ) : null}

      {binderToDelete ? (
        <div className={styles.dialogBackdrop} role="presentation">
          <section className={styles.confirmDialog} role="dialog" aria-modal="true" aria-labelledby="delete-binder-heading">
            <p className={styles.eyebrow}>Binder löschen</p>
            <h2 id="delete-binder-heading">„{binderToDelete.name}“ wirklich löschen?</h2>
            <p>Alle Seiten und Karten dieses Binders werden aus diesem Browser entfernt. Ein Export ist danach nicht mehr möglich.</p>
            <div className={styles.dialogActions}>
              <button type="button" className={styles.secondaryButton} onClick={() => setBinderToDelete(undefined)}>Abbrechen</button>
              <button type="button" className={styles.dangerButton} onClick={deleteBinder}>Binder löschen</button>
            </div>
          </section>
        </div>
      ) : null}

      {cardToRemove ? (
        <div className={styles.dialogBackdrop} role="presentation">
          <section className={styles.confirmDialog} role="dialog" aria-modal="true" aria-labelledby="remove-card-heading">
            <p className={styles.eyebrow}>Karte entfernen</p>
            <h2 id="remove-card-heading">„{cardToRemove.label}“ aus dem Binder entfernen?</h2>
            <p>Die Karte wird aus diesem lokalen Binder entfernt. Dieser Schritt kann nicht automatisch rückgängig gemacht werden.</p>
            <div className={styles.dialogActions}>
              <button type="button" className={styles.secondaryButton} onClick={() => setCardToRemove(undefined)}>Abbrechen</button>
              <button type="button" className={styles.dangerButton} onClick={confirmRemoveCard}>Karte entfernen</button>
            </div>
          </section>
        </div>
      ) : null}

      {variantEdit ? (
        <div className={styles.dialogBackdrop} role="presentation">
          <section className={styles.confirmDialog} role="dialog" aria-modal="true" aria-labelledby="variant-heading">
            <p className={styles.eyebrow}>Kartenversion</p>
            <h2 id="variant-heading">Version für „{variantEdit.label}“ festlegen</h2>
            <p>Finish, Edition und Druckvariante werden getrennt gespeichert und in Fehlkartenlisten berücksichtigt.</p>
            <div className={styles.variantForm}>
              <label>
                Finish
                <select
                  value={variantEdit.variant.finish}
                  onChange={(event) => setVariantEdit((current) => current ? {
                    ...current,
                    variant: { ...current.variant, finish: event.target.value as VariantSelection["finish"] },
                  } : current)}
                >
                  {Object.entries(finishLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                </select>
              </label>
              <label>
                Edition
                <select
                  value={variantEdit.variant.edition}
                  onChange={(event) => setVariantEdit((current) => current ? {
                    ...current,
                    variant: { ...current.variant, edition: event.target.value as VariantSelection["edition"] },
                  } : current)}
                >
                  {Object.entries(editionLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                </select>
              </label>
              <label>
                Druckvariante
                <select
                  value={selectedPrinting(variantEdit.variant)}
                  onChange={(event) => setVariantEdit((current) => current ? {
                    ...current,
                    variant: { ...current.variant, printing: event.target.value as NonNullable<VariantSelection["printing"]> },
                  } : current)}
                >
                  {Object.entries(printingLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                </select>
              </label>
              <label>
                Eigene Variantenbezeichnung (optional)
                <input
                  value={variantEdit.variant.label ?? ""}
                  maxLength={100}
                  placeholder="z. B. Cosmos Holo"
                  onChange={(event) => setVariantEdit((current) => current ? {
                    ...current,
                    variant: { ...current.variant, label: event.target.value || undefined },
                  } : current)}
                />
              </label>
            </div>
            <p className={styles.variantHint}>{formatAvailableVariants(variantEdit.availableVariants)} Shadowless wird von TCGdex nicht separat geliefert und ist deshalb eine manuelle Auswahl.</p>
            <div className={styles.dialogActions}>
              <button type="button" className={styles.secondaryButton} onClick={() => setVariantEdit(undefined)}>Abbrechen</button>
              <button type="button" className={styles.confirmButton} onClick={saveVariantEdit}>Version speichern</button>
            </div>
          </section>
        </div>
      ) : null}

      {layoutChange && activeBinder?.id === layoutChange.binderId ? (
        <div className={styles.dialogBackdrop} role="presentation">
          <section className={styles.confirmDialog} role="dialog" aria-modal="true" aria-labelledby="change-layout-heading">
            <p className={styles.eyebrow}>Binderformat ändern</p>
            <h2 id="change-layout-heading">{layoutChange.preview.from.rows} × {layoutChange.preview.from.columns} auf {layoutChange.preview.to.rows} × {layoutChange.preview.to.columns} umstellen?</h2>
            <p>
              {layoutChange.preview.plannedCards} Karten werden in Lesereihenfolge neu verteilt. Dabei ändern {layoutChange.preview.movedCards} Karten ihre Position.
              Die Seitenzahl ändert sich von {layoutChange.preview.pagesBefore} auf {layoutChange.preview.pagesAfter}. Keine Karte wird gelöscht.
            </p>
            <div className={styles.layoutPreview} aria-label="Vorschau der Formatänderung">
              <span><strong>{layoutChange.preview.plannedCards}</strong> Karten übernommen</span>
              <span><strong>{layoutChange.preview.movedCards}</strong> Positionen geändert</span>
              <span><strong>{layoutChange.preview.pagesAfter}</strong> Seiten danach</span>
            </div>
            <div className={styles.dialogActions}>
              <button type="button" className={styles.secondaryButton} onClick={() => setLayoutChange(undefined)}>Abbrechen</button>
              <button type="button" className={styles.confirmButton} onClick={confirmLayoutChange}>Format anwenden</button>
            </div>
          </section>
        </div>
      ) : null}

      {activeBinder && stats && !binderManagerOpen ? (
        <>
          <section className={styles.binderHeader}>
            <div>
              <p className={styles.binderBreadcrumb}>Meine Binder / {activeBinder.name}</p>
              <h1>{activeBinder.name}</h1>
              <p>{activeBinder.pages.length} {activeBinder.pages.length === 1 ? "Seite" : "Seiten"} · {activeBinder.layout.rows} × {activeBinder.layout.columns} · lokal gespeichert</p>
            </div>
            <div className={styles.binderHeaderActions}>
              <button type="button" className={styles.secondaryButton} onClick={() => openSearchForSlot()}><Search size={17} /> Karte hinzufügen</button>
              <button type="button" className={styles.primaryButton} onClick={() => { setMissingOpen((open) => !open); setSearchOpen(false); setCopyState("idle"); setTcgplayerCopyState("idle"); setCardmarketCopyState("idle"); }} disabled={Boolean(missingResult.error) || cardsBinderId !== activeId}>
                <ListFilter size={17} /> {missingOpen ? "Zurück zum Binder" : `Fehlende Karten (${stats.missing})`}
              </button>
            </div>
          </section>

          <section className={styles.stats} aria-label="Binderfortschritt">
            <div><strong>{stats.owned}</strong><span>Vorhanden</span><small>{stats.completionPercent}% vollständig</small></div>
            <div><strong>{stats.missing}</strong><span>Fehlend</span><small>geplante Karten</small></div>
            <div><strong>{Math.max(stats.capacity - stats.planned, 0)}</strong><span>Freie Plätze</span><small>auf {activeBinder.pages.length} {activeBinder.pages.length === 1 ? "Seite" : "Seiten"}</small></div>
            <div><strong>{stats.planned}</strong><span>Geplant</span><small>von {stats.capacity} Slots</small></div>
          </section>

          {missingOpen ? (
            <MissingCardsPanel
              items={missingResult.items}
              warnings={missingWarnings}
              copyState={copyState}
              onCopy={copyMissingItems}
              onTextExport={(items) => downloadMissingExport(items, "text")}
              onCsvExport={(items) => downloadMissingExport(items, "csv")}
              onClose={() => setMissingOpen(false)}
              tcgplayerEnabled={FEATURES.tcgplayerTextExport}
              tcgplayerCopyState={tcgplayerCopyState}
              onTcgplayerCopy={copyTcgplayerExport}
              onTcgplayerTextExport={downloadTcgplayerExport}
              cardmarketEnabled={FEATURES.cardmarketImport}
              cardmarketCopyState={cardmarketCopyState}
              onCardmarketCopy={copyCardmarketHandoff}
              onCardmarketTextExport={downloadCardmarketHandoff}
            />
          ) : (
          <div className={styles.workspace}>
            <section className={`${styles.panel} ${styles.binderPanel}`} aria-labelledby="page-heading">
              <div className={styles.panelHeader}>
                <div><p className={styles.eyebrow}>{activeBinder.layout.rows} × {activeBinder.layout.columns} · Seite {visiblePageIndex + 1} von {activeBinder.pages.length}</p><h2 id="page-heading">Seite {visiblePageIndex + 1}</h2></div>
                <div className={styles.pageToolbar}>
                  <label className={styles.layoutSelect} htmlFor="binder-layout">
                    <span>Format</span>
                    <select
                      id="binder-layout"
                      value={`${activeBinder.layout.rows}x${activeBinder.layout.columns}`}
                      onChange={(event) => requestLayoutChange(event.target.value)}
                    >
                      {SUPPORTED_BINDER_LAYOUTS.map((layout) => <option value={layout.key} key={layout.key}>{layout.label}</option>)}
                    </select>
                  </label>
                  <div className={styles.pageControls} aria-label="Binderseiten">
                    <button type="button" className={styles.pageButton} aria-label="Vorherige Seite" disabled={visiblePageIndex === 0} onClick={() => { setActivePageIndex((page) => Math.max(page - 1, 0)); setContextLocation(undefined); }}>←</button>
                    <span>{visiblePageIndex + 1} / {activeBinder.pages.length}</span>
                    <button type="button" className={styles.pageButton} aria-label="Nächste Seite" disabled={visiblePageIndex === activeBinder.pages.length - 1} onClick={() => { setActivePageIndex((page) => Math.min(page + 1, activeBinder.pages.length - 1)); setContextLocation(undefined); }}>→</button>
                    <button type="button" className={styles.addPageButton} onClick={createNewPage}>+ Seite</button>
                  </div>
                </div>
              </div>
              {activePage ? (
                <div className={styles.binderSurface}>
                  <span className={styles.binderRings} aria-hidden="true"><i /><i /><i /></span>
                  <BinderGrid
                    page={activePage}
                    columns={activeBinder.layout.columns}
                    cards={cards}
                    selectedLocation={contextLocation ?? selectedLocation}
                    movingLocation={movingLocation}
                    onOpenSearch={openSearchForSlot}
                    onSelectCard={(location) => { setContextLocation(location); setSelectedLocation(undefined); setSearchOpen(false); }}
                    onMove={(from, to) => void moveCard(from, to)}
                    onRefreshCard={(card) => void refreshCardSnapshot(card)}
                  />
                </div>
              ) : null}
            </section>

            {searchOpen ? <aside className={styles.searchDrawer} aria-labelledby="search-heading" role="dialog" aria-modal="false">
              <div className={styles.drawerHeader}>
                <div>
                  <p className={styles.eyebrow}>Karte einsetzen</p>
                  <h2 id="search-heading">Karte suchen</h2>
                </div>
                <button type="button" className={styles.drawerClose} onClick={() => setSearchOpen(false)} aria-label="Suche schließen"><X size={18} /></button>
              </div>
              {selectedLocation ? <p className={styles.selectedSlotHint}>Ziel: Seite {visiblePageIndex + 1}, Slot {selectedLocation.slotIndex + 1}</p> : <p className={styles.selectedSlotHint}>Wähle einen Treffer, um ihn in den nächsten freien Slot einzusetzen.</p>}
              <fieldset className={styles.languageFilter}>
                <legend>Kartensprache</legend>
                <div>
                  {([
                    ["all", "Alle"],
                    ["de", "Deutsch"],
                    ["en", "English"],
                  ] as const).map(([value, label]) => (
                    <button
                      type="button"
                      key={value}
                      aria-pressed={searchLanguage === value}
                      onClick={() => setSearchLanguage(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>
              <label className={styles.searchLabel} htmlFor="card-search">
                <Search aria-hidden="true" size={18} />
                <input id="card-search" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Name oder Nummer, z. B. Glurak 4/102" autoFocus />
              </label>
              {searchIsRunning && searchEnabled ? <p>Suche läuft…</p> : null}
              {searchError ? <p className={styles.error}>Ein Sprachkatalog konnte nicht geladen werden: {searchError.message}</p> : null}
              {searchHasCompleted && !searchResults.length ? <p className={styles.noResults}>Keine Karten für „{debouncedSearch}“ gefunden. Prüfe Name oder Schreibweise.</p> : null}
              <ul className={styles.results}>
                {searchResults.slice(0, 12).map((item) => (
                  <li key={`${item.ref.language}-${item.ref.id}`}>
                    <span><strong>{item.name}</strong><small>{item.ref.language.toUpperCase()} · Nr. {formatCollectorNumber(item.collectorNumber, item.collectorTotal)}</small></span>
                    <button type="button" onClick={() => addCard(item)}>In Slot einsetzen</button>
                  </li>
                ))}
              </ul>
            </aside> : (
              <aside className={styles.contextPanel} aria-labelledby="context-heading">
                <div className={styles.contextHeader}>
                  <div>
                    <p className={styles.eyebrow}>{contextEntry ? "Kartendetails" : "Seitenübersicht"}</p>
                    <h2 id="context-heading">{contextCard?.name ?? `Seite ${visiblePageIndex + 1}`}</h2>
                  </div>
                  {contextEntry ? <button type="button" className={styles.drawerClose} onClick={() => setContextLocation(undefined)} aria-label="Kartendetails schließen"><X size={18} /></button> : null}
                </div>

                {contextEntry ? (
                  <div className={styles.cardContext}>
                    {contextCard?.imageBaseUrl ? (
                      <div className={styles.contextImage}>
                        <img src={cardImageUrl(contextCard.imageBaseUrl)} alt={`${contextCard.name}, ${contextCard.setName}`} />
                        {contextCard.ref.language === "de" && contextCard.imageBaseUrl.includes("/en/") ? <span>Bild auf Englisch</span> : null}
                      </div>
                    ) : <div className={styles.contextImageFallback}>Bild nicht verfügbar</div>}
                    <div className={styles.contextIdentity}>
                      <strong>{contextCard?.name ?? "Kartendaten fehlen"}</strong>
                      {contextCard ? <span>{contextCard.setName} · Nr. {formatCollectorNumber(contextCard.collectorNumber, contextCard.collectorTotal)}</span> : null}
                    </div>
                    <dl className={styles.contextDetails}>
                      <div><dt>Sprache</dt><dd>{contextCard?.ref.language.toUpperCase() ?? "–"}</dd></div>
                      <div><dt>Version</dt><dd>{formatVariantSelection(contextEntry.variant)}</dd></div>
                      <div><dt>Status</dt><dd>{contextEntry.owned ? "Vorhanden" : "Fehlt"}</dd></div>
                    </dl>
                    <div className={styles.contextActions}>
                      <button type="button" className={styles.primaryButton} onClick={() => void toggleOwned(contextEntry.id, !contextEntry.owned)}>{contextEntry.owned ? "Als fehlend markieren" : "Als vorhanden markieren"}</button>
                      <button type="button" className={styles.secondaryButton} onClick={() => requestVariantEdit(contextEntry, contextCard)}>Version festlegen</button>
                      <button type="button" className={styles.secondaryButton} onClick={() => contextLocation && selectMoveSource(contextLocation)}>Verschieben</button>
                      <button type="button" className={styles.dangerOutlineButton} onClick={() => contextLocation && requestRemove(contextLocation, contextCard?.name ?? "Karte ohne Metadaten")}>Entfernen</button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.contextSummary}>
                    <div className={styles.summaryProgress}>
                      <strong>{activePageEntries.length ? Math.round((activePageOwned / activePageEntries.length) * 100) : 0}%</strong>
                      <span>{activePageOwned} von {activePageEntries.length} geplanten Karten vorhanden</span>
                      <i><span style={{ width: `${activePageEntries.length ? Math.round((activePageOwned / activePageEntries.length) * 100) : 0}%` }} /></i>
                    </div>
                    <div className={styles.summaryStats}>
                      <div><strong>{activePageOwned}</strong><span>Vorhanden</span></div>
                      <div><strong>{activePageMissing.length}</strong><span>Fehlend</span></div>
                      <div><strong>{Math.max((activePage?.slots.length ?? 0) - activePageEntries.length, 0)}</strong><span>Frei</span></div>
                    </div>
                    <section className={styles.pageMissing} aria-labelledby="page-missing-heading">
                      <div><h3 id="page-missing-heading">Auf dieser Seite fehlt</h3><span>{activePageMissing.length}</span></div>
                      {activePageMissing.length ? (
                        <ul>{activePageMissing.slice(0, 5).map(({ entry, card }) => <li key={entry.id}><strong>{card?.name ?? "Kartendaten fehlen"}</strong><span>{card ? `Nr. ${formatCollectorNumber(card.collectorNumber, card.collectorTotal)}` : "Manuell prüfen"}</span></li>)}</ul>
                      ) : <p>Keine geplante Karte dieser Seite ist noch offen.</p>}
                    </section>
                    <button type="button" className={styles.primaryButton} onClick={() => openSearchForSlot()}><Search size={16} /> Karte hinzufügen</button>
                    <button type="button" className={styles.secondaryButton} onClick={() => setMissingOpen(true)}><ListFilter size={16} /> Gesamte Fehlkartenliste</button>
                  </div>
                )}
              </aside>
            )}
          </div>
          )}
        </>
      ) : null}

      <footer className={styles.footer}>
        <p>Keine Cloud-Synchronisierung. Sichere wichtige Binder regelmäßig als JSON-Datei.</p>
        <Link href="/help/">Hilfe, Datenflüsse und Hinweise</Link>
      </footer>
        </main>
      </div>
    </div>
  );
}
