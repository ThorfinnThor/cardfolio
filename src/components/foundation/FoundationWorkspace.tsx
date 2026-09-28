"use client";

/* eslint-disable @next/next/no-img-element -- TCGdex images remain external references and are never proxied. */

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, BookOpen, CircleHelp, Copy, DatabaseBackup, ListFilter, Menu, Pencil, Search, Settings2, Trash2, X } from "lucide-react";
import Link from "next/link";
import { type ChangeEvent, type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  addPage,
  BINDER_DESCRIPTION_MAX_LENGTH,
  BINDER_NAME_MAX_LENGTH,
  changeBinderLayout,
  createBinder,
  createPlannedCard,
  deletePage,
  duplicatePage,
  MAX_BINDER_PAGES,
  moveOrSwapCard,
  placeCard,
  previewBinderLayoutChange,
  removeCard,
  renameBinder,
  PAGE_NOTE_MAX_LENGTH,
  setBinderDescription,
  setCardPreferences,
  setCardVariant,
  setOwned,
  setPageNote,
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
import type { Binder, CardSnapshot, CatalogSearchItem, MissingItem, PlannedCard, PurchasePreferences, VariantSelection } from "@/domain/types";
import { FEATURES } from "@/config/feature-flags";
import { PRODUCT_DESIGN } from "@/config/product";
import { minimumConditionLabels } from "@/domain/purchase-preferences";
import { validateBackup } from "@/domain/validation";
import { createInitialVariantSelection, editionLabels, finishLabels, formatAvailableVariants, formatVariantSelection, printingLabels, selectedPrinting } from "@/domain/variant-selection";
import { catalogQueryKey, detailQueryKey, TCGdexCatalogAdapter } from "@/data/catalog/tcgdex";
import { catalogSeries, catalogSets, completeCardSnapshotMetadata } from "@/data/catalog/set-counts";
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
type SearchFilterOption = { id: string; label: string };
type ImportReport = { binderCount: number; cardCount: number; plannedCount: number; names: string[] };
type BinderSyncMessage = { type: "binder-changed"; binderId: string; revision: number; deleted?: boolean };
type LayoutChangeRequest = { binderId: string; layout: SupportedBinderLayout; preview: BinderLayoutPreview };
type BinderRenameRequest = { binderId: string; name: string };
type PageDeleteRequest = {
  binderId: string;
  pageId: string;
  pageIndex: number;
  plannedCount: number;
  hasNote: boolean;
};
type VariantEditRequest = {
  entryId: string;
  label: string;
  variant: VariantSelection;
  preferences: PurchasePreferences;
  availableVariants?: CardSnapshot["availableVariants"];
};
type SearchPreview = {
  item: CatalogSearchItem;
  status: "loading" | "ready" | "error";
  snapshot?: CardSnapshot;
  variant: VariantSelection;
  preferences: PurchasePreferences;
  error?: string;
};

type TextSaveState = "idle" | "changed" | "saving" | "saved" | "error";

interface AutosaveTextareaProps {
  id: string;
  label: string;
  value: string;
  maxLength: number;
  placeholder: string;
  rows: number;
  className?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onSave: (value: string) => Promise<void>;
}

function AutosaveTextarea({
  id,
  label,
  value,
  maxLength,
  placeholder,
  rows,
  className,
  disabled,
  onChange,
  onSave,
}: AutosaveTextareaProps) {
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState<TextSaveState>("idle");
  const committedValueRef = useRef(value);
  const editVersionRef = useRef(0);
  const requestedVersionRef = useRef(0);
  const saveRef = useRef(onSave);

  useEffect(() => {
    saveRef.current = onSave;
  }, [onSave]);

  const persist = useCallback(async (nextValue: string, version: number) => {
    if (requestedVersionRef.current >= version || nextValue === committedValueRef.current) {
      if (nextValue === committedValueRef.current) {
        setDirty(false);
        setSaveState("idle");
      }
      return;
    }
    requestedVersionRef.current = version;
    setSaveState("saving");
    try {
      await saveRef.current(nextValue);
      committedValueRef.current = nextValue;
      if (editVersionRef.current === version) {
        setDirty(false);
        setSaveState("saved");
      }
    } catch {
      requestedVersionRef.current = Math.max(0, version - 1);
      setSaveState("error");
    }
  }, []);

  useEffect(() => {
    if (!dirty) committedValueRef.current = value;
  }, [dirty, value]);

  useEffect(() => {
    if (!dirty) return;
    const version = editVersionRef.current;
    const timer = window.setTimeout(() => void persist(value, version), 300);
    return () => window.clearTimeout(timer);
  }, [dirty, persist, value]);

  const stateLabel = saveState === "changed"
    ? "Änderungen offen"
    : saveState === "saving"
      ? "Wird lokal gespeichert…"
      : saveState === "saved"
        ? "Lokal gespeichert"
        : saveState === "error"
          ? "Speichern fehlgeschlagen – erneut bearbeiten oder Fokus wechseln"
          : "Automatische lokale Speicherung";

  return (
    <div className={`${styles.textEditor} ${className ?? ""}`} role="group" aria-labelledby={`${id}-label`}>
      <div className={styles.textEditorHeader}>
        <label id={`${id}-label`} htmlFor={id}>{label}</label>
        <span>{value.length} / {maxLength}</span>
      </div>
      <textarea
        id={id}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        onChange={(event) => {
          editVersionRef.current += 1;
          setDirty(event.target.value !== committedValueRef.current);
          setSaveState(event.target.value === committedValueRef.current ? "idle" : "changed");
          onChange(event.target.value);
        }}
        onBlur={() => dirty && void persist(value, editVersionRef.current)}
      />
      <span className={styles.textSaveStatus} data-status={saveState} aria-live="polite">{stateLabel}</span>
    </div>
  );
}

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

function mergeLocalizedOptions(
  german: readonly { id: string; name: string }[],
  english: readonly { id: string; name: string }[],
): SearchFilterOption[] {
  const options = new Map<string, { de?: string; en?: string }>();
  for (const item of german) options.set(item.id, { ...options.get(item.id), de: item.name });
  for (const item of english) options.set(item.id, { ...options.get(item.id), en: item.name });
  return [...options.entries()]
    .map(([id, names]) => ({
      id,
      label: names.de && names.en && names.de !== names.en ? `${names.de} / ${names.en}` : names.de ?? names.en ?? id,
    }))
    .sort((left, right) => left.label.localeCompare(right.label, "de"));
}

export function FoundationWorkspace() {
  const repository = useMemo(() => new IndexedDBBinderRepository(), []);
  const catalog = useMemo(() => new TCGdexCatalogAdapter(), []);
  const syncChannelRef = useRef<BroadcastChannel | undefined>(undefined);
  const bindersRef = useRef<Binder[]>([]);
  const binderWriteQueuesRef = useRef(new Map<string, Promise<void>>());
  const queryClient = useQueryClient();
  const [binders, setBinders] = useState<Binder[]>([]);
  const [activeId, setActiveId] = useState<string>();
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [name, setName] = useState("");
  const [searchText, setSearchText] = useState("");
  const [searchLanguage, setSearchLanguage] = useState<SearchLanguage>("all");
  const [searchSeriesId, setSearchSeriesId] = useState("");
  const [searchSetId, setSearchSetId] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchPreview, setSearchPreview] = useState<SearchPreview>();
  const [previewImageFailed, setPreviewImageFailed] = useState<string>();
  const [previewSubmitting, setPreviewSubmitting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SlotLocation>();
  const [contextLocation, setContextLocation] = useState<SlotLocation>();
  const [movingLocation, setMovingLocation] = useState<SlotLocation>();
  const [cards, setCards] = useState<Map<string, CardSnapshot>>(new Map());
  const [cardsBinderId, setCardsBinderId] = useState<string>();
  const [storageStatus, setStorageStatus] = useState("initializing");
  const [message, setMessage] = useState<string>();
  const [binderToDelete, setBinderToDelete] = useState<Binder>();
  const [binderRename, setBinderRename] = useState<BinderRenameRequest>();
  const [pageToDelete, setPageToDelete] = useState<PageDeleteRequest>();
  const [cardToRemove, setCardToRemove] = useState<{ location: SlotLocation; label: string }>();
  const [layoutChange, setLayoutChange] = useState<LayoutChangeRequest>();
  const [variantEdit, setVariantEdit] = useState<VariantEditRequest>();
  const [missingOpen, setMissingOpen] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [tcgplayerCopyState, setTcgplayerCopyState] = useState<CopyState>("idle");
  const [cardmarketCopyState, setCardmarketCopyState] = useState<CopyState>("idle");
  const [cardmarketPreparing, setCardmarketPreparing] = useState(false);
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
        bindersRef.current = items;
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
      if (event.key !== "Escape") return;
      if (searchPreview) {
        setSearchPreview(undefined);
        setPreviewImageFailed(undefined);
      } else {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [searchOpen, searchPreview]);

  useEffect(() => {
    if (!activeId) return;
    repository.exportBackup([activeId]).then((backup) => {
      setCards(new Map(backup.cards.map((card) => {
        const completed = completeCardSnapshotMetadata(card);
        return [completed.key, completed];
      })));
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
  const seriesOptions = useMemo(() => searchLanguage === "all"
    ? mergeLocalizedOptions(catalogSeries("de"), catalogSeries("en"))
    : catalogSeries(searchLanguage).map((series) => ({ id: series.id, label: series.name })), [searchLanguage]);
  const setOptions = useMemo(() => searchLanguage === "all"
    ? mergeLocalizedOptions(catalogSets("de", searchSeriesId || undefined), catalogSets("en", searchSeriesId || undefined))
    : catalogSets(searchLanguage, searchSeriesId || undefined).map((set) => ({ id: set.id, label: set.name })), [searchLanguage, searchSeriesId]);

  useEffect(() => {
    if (searchSeriesId && !seriesOptions.some((option) => option.id === searchSeriesId)) {
      setSearchSeriesId("");
      setSearchSetId("");
    }
  }, [searchSeriesId, seriesOptions]);

  useEffect(() => {
    if (searchSetId && !setOptions.some((option) => option.id === searchSetId)) setSearchSetId("");
  }, [searchSetId, setOptions]);

  const searchEnabled = Boolean(searchSetId || (parsedSearch.name?.length ?? 0) >= 2 || parsedSearch.collectorNumber);
  const searchPageSize = searchLanguage === "all" ? 20 : 40;
  const germanCatalogQuery = { language: "de" as const, ...parsedSearch, setId: searchSetId || undefined, page: 0, pageSize: searchPageSize };
  const englishCatalogQuery = { language: "en" as const, ...parsedSearch, setId: searchSetId || undefined, page: 0, pageSize: searchPageSize };

  const germanSearchQuery = useInfiniteQuery({
    queryKey: ["infinite-search", ...catalogQueryKey(germanCatalogQuery)],
    queryFn: ({ signal, pageParam }) =>
      catalog.search({ ...germanCatalogQuery, page: pageParam }, signal),
    enabled: searchEnabled && searchLanguage !== "en",
    staleTime: 10 * 60 * 1_000,
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => lastPage.hasMore ? pages.length + 1 : undefined,
  });

  const englishSearchQuery = useInfiniteQuery({
    queryKey: ["infinite-search", ...catalogQueryKey(englishCatalogQuery)],
    queryFn: ({ signal, pageParam }) =>
      catalog.search({ ...englishCatalogQuery, page: pageParam }, signal),
    enabled: searchEnabled && searchLanguage !== "de",
    staleTime: 10 * 60 * 1_000,
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => lastPage.hasMore ? pages.length + 1 : undefined,
  });

  const germanSearchResults = germanSearchQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const englishSearchResults = englishSearchQuery.data?.pages.flatMap((page) => page.items) ?? [];
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
  const searchHasMore = searchLanguage === "de"
    ? germanSearchQuery.hasNextPage
    : searchLanguage === "en"
      ? englishSearchQuery.hasNextPage
      : germanSearchQuery.hasNextPage || englishSearchQuery.hasNextPage;
  const searchIsLoadingMore = germanSearchQuery.isFetchingNextPage || englishSearchQuery.isFetchingNextPage;

  async function loadMoreSearchResults() {
    const requests: Promise<unknown>[] = [];
    if (searchLanguage !== "en" && germanSearchQuery.hasNextPage) requests.push(germanSearchQuery.fetchNextPage());
    if (searchLanguage !== "de" && englishSearchQuery.hasNextPage) requests.push(englishSearchQuery.fetchNextPage());
    await Promise.all(requests);
  }

  function publishBinderChange(binder: Binder, deleted = false) {
    syncChannelRef.current?.postMessage({
      type: "binder-changed",
      binderId: binder.id,
      revision: binder.revision,
      deleted,
    } satisfies BinderSyncMessage);
  }

  function replaceBinderInMemory(saved: Binder) {
    const next = bindersRef.current.map((binder) => (binder.id === saved.id ? saved : binder));
    bindersRef.current = next;
    setBinders(next);
  }

  function updateBinderDraft(binderId: string, update: (binder: Binder) => Binder) {
    const next = bindersRef.current.map((binder) => (binder.id === binderId ? update(binder) : binder));
    bindersRef.current = next;
    setBinders(next);
  }

  async function persistBinderChange(
    binderId: string,
    update: (binder: Binder) => Binder,
    cardSnapshots: CardSnapshot[] = [],
  ): Promise<Binder> {
    const previous = binderWriteQueuesRef.current.get(binderId) ?? Promise.resolve();
    const operation = previous.catch(() => undefined).then(async () => {
      const current = bindersRef.current.find((binder) => binder.id === binderId);
      if (!current) throw new Error("Der Binder ist nicht mehr verfügbar.");
      const saved = await repository.save(update(current), cardSnapshots, current.revision);
      replaceBinderInMemory(saved);
      publishBinderChange(saved);
      return saved;
    });
    const queueTail = operation.then(() => undefined, () => undefined);
    binderWriteQueuesRef.current.set(binderId, queueTail);
    void queueTail.finally(() => {
      if (binderWriteQueuesRef.current.get(binderId) === queueTail) binderWriteQueuesRef.current.delete(binderId);
    });
    return operation;
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
        bindersRef.current = remaining;
        setBinders(remaining);
        setActiveId(remaining[0]?.id);
        setActivePageIndex(0);
        setStorageConflict(false);
        setStorageStatus("ready");
        setMessage("Der gelöschte Binder wurde aus dieser Ansicht entfernt.");
        return;
      }
      const backup = await repository.exportBackup([activeId]);
      replaceBinderInMemory(current);
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
      bindersRef.current = items;
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
      const nextBinders = [binder, ...bindersRef.current];
      bindersRef.current = nextBinders;
      setBinders(nextBinders);
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
      bindersRef.current = remaining;
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
      setStorageStatus("saving");
      const saved = await persistBinderChange(activeBinder.id, addPage);
      setActivePageIndex(saved.pages.length - 1);
      setContextLocation(undefined);
      setStorageStatus("saved");
      setMessage(`Seite ${saved.pages.length} wurde angelegt.`);
    } catch (error) {
      handleStorageError(error, "Neue Seite konnte nicht angelegt werden.");
    }
  }

  async function duplicateActivePage() {
    if (!activeBinder || !activePage) return;
    const sourcePageId = activePage.id;
    const sourcePageIndex = visiblePageIndex;
    try {
      setStorageStatus("saving");
      const saved = await persistBinderChange(activeBinder.id, (binder) => duplicatePage(binder, sourcePageId));
      setActivePageIndex(Math.min(sourcePageIndex + 1, saved.pages.length - 1));
      setContextLocation(undefined);
      setSelectedLocation(undefined);
      setMovingLocation(undefined);
      setSearchOpen(false);
      setStorageStatus("saved");
      setMessage(`Seite ${sourcePageIndex + 1} wurde als Seite ${sourcePageIndex + 2} dupliziert.`);
    } catch (error) {
      handleStorageError(error, "Seite konnte nicht dupliziert werden.");
    }
  }

  function requestPageDelete() {
    if (!activeBinder || !activePage || activeBinder.pages.length === 1) return;
    setPageToDelete({
      binderId: activeBinder.id,
      pageId: activePage.id,
      pageIndex: visiblePageIndex,
      plannedCount: activePage.slots.filter(Boolean).length,
      hasNote: Boolean(activePage.note.trim()),
    });
  }

  async function confirmPageDelete() {
    if (!pageToDelete) return;
    try {
      setStorageStatus("saving");
      const saved = await persistBinderChange(
        pageToDelete.binderId,
        (binder) => deletePage(binder, pageToDelete.pageId, true),
      );
      setActivePageIndex(Math.min(pageToDelete.pageIndex, saved.pages.length - 1));
      setContextLocation(undefined);
      setSelectedLocation(undefined);
      setMovingLocation(undefined);
      setSearchOpen(false);
      setPageToDelete(undefined);
      setStorageStatus("saved");
      setMessage(`Seite ${pageToDelete.pageIndex + 1} wurde gelöscht.`);
    } catch (error) {
      handleStorageError(error, "Seite konnte nicht gelöscht werden.");
    }
  }

  async function saveBinderRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!binderRename?.name.trim()) return;
    try {
      setStorageStatus("saving");
      const saved = await persistBinderChange(
        binderRename.binderId,
        (binder) => renameBinder(binder, binderRename.name),
      );
      setBinderRename(undefined);
      setStorageStatus("saved");
      setMessage(`Binder wurde in „${saved.name}“ umbenannt.`);
    } catch (error) {
      handleStorageError(error, "Binder konnte nicht umbenannt werden.");
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
      setStorageStatus("saving");
      const saved = await persistBinderChange(activeBinder.id, (binder) => changeBinderLayout(binder, layoutChange.layout));
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
    setSearchPreview(undefined);
    setPreviewImageFailed(undefined);
    setMissingOpen(false);
    setCopyState("idle");
    setTcgplayerCopyState("idle");
    setCardmarketCopyState("idle");
    setCardmarketPreparing(false);
    setLayoutChange(undefined);
    setVariantEdit(undefined);
    setBinderRename(undefined);
    setPageToDelete(undefined);
    setStorageConflict(false);
    setBinderManagerOpen(false);
  }

  function changeBinderDescriptionDraft(value: string) {
    if (!activeBinder) return;
    updateBinderDraft(activeBinder.id, (binder) => setBinderDescription(binder, value));
  }

  async function saveBinderDescription(binderId: string, value: string) {
    try {
      setStorageStatus("saving");
      await persistBinderChange(binderId, (binder) => setBinderDescription(binder, value));
      setStorageStatus("saved");
    } catch (error) {
      handleStorageError(error, "Binderbeschreibung konnte nicht gespeichert werden.");
      throw error;
    }
  }

  function changePageNoteDraft(pageId: string, value: string) {
    if (!activeBinder) return;
    updateBinderDraft(activeBinder.id, (binder) => setPageNote(binder, pageId, value));
  }

  async function savePageNote(binderId: string, pageId: string, value: string) {
    try {
      setStorageStatus("saving");
      await persistBinderChange(binderId, (binder) => setPageNote(binder, pageId, value));
      setStorageStatus("saved");
    } catch (error) {
      handleStorageError(error, "Seitennotiz konnte nicht gespeichert werden.");
      throw error;
    }
  }

  async function previewSearchResult(item: CatalogSearchItem) {
    setPreviewImageFailed(undefined);
    setSearchPreview({
      item,
      status: "loading",
      variant: createInitialVariantSelection(),
      preferences: { minimumCondition: "any" },
    });
    try {
      const snapshot = await queryClient.fetchQuery({
        queryKey: detailQueryKey(item.ref.language, item.ref.id),
        queryFn: ({ signal }) => catalog.getCard(item.ref, signal),
        staleTime: 24 * 60 * 60 * 1_000,
      });
      if (snapshot.physicalStatus === "digital") {
        setSearchPreview((current) => current?.item.ref.id === item.ref.id && current.item.ref.language === item.ref.language
          ? { ...current, status: "error", error: "Pocket-Karten können nicht in einen physischen Binder eingesetzt werden." }
          : current);
        return;
      }
      setSearchPreview((current) => current?.item.ref.id === item.ref.id && current.item.ref.language === item.ref.language
        ? {
            ...current,
            status: "ready",
            snapshot,
            variant: createInitialVariantSelection(snapshot.availableVariants),
          }
        : current);
    } catch (error) {
      setSearchPreview((current) => current?.item.ref.id === item.ref.id && current.item.ref.language === item.ref.language
        ? {
            ...current,
            status: "error",
            error: error instanceof Error ? error.message : "Kartendetails konnten nicht geladen werden.",
          }
        : current);
    }
  }

  async function insertPreviewedCard() {
    if (!activeBinder || !searchPreview?.snapshot || searchPreview.status !== "ready") return;
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
    setPreviewSubmitting(true);
    try {
      const snapshot = searchPreview.snapshot;
      const plannedCard = createPlannedCard(snapshot.key, searchPreview.variant, searchPreview.preferences);
      setStorageStatus("saving");
      const saved = await persistBinderChange(
        activeBinder.id,
        (binder) => placeCard(binder, location, plannedCard),
        [snapshot],
      );
      setCards((current) => new Map(current).set(snapshot.key, snapshot));
      setSelectedLocation(undefined);
      setMovingLocation(undefined);
      setSearchOpen(false);
      setSearchPreview(undefined);
      setPreviewImageFailed(undefined);
      setSearchText("");
      const targetPageIndex = saved.pages.findIndex((page) => page.id === location.pageId);
      if (targetPageIndex >= 0) setActivePageIndex(targetPageIndex);
      setContextLocation(location);
      setStorageStatus("saved");
      setMessage(`${snapshot.name} wurde eingesetzt.`);
    } catch (error) {
      handleStorageError(error, "Karte konnte nicht eingesetzt werden.");
    } finally {
      setPreviewSubmitting(false);
    }
  }

  function openSearchForSlot(location?: SlotLocation) {
    setMovingLocation(undefined);
    setSelectedLocation(location);
    setSearchPreview(undefined);
    setPreviewImageFailed(undefined);
    setSearchOpen(true);
    setMessage(location ? `Slot ${location.slotIndex + 1} ausgewählt. Suche eine Karte zum Einsetzen.` : undefined);
  }

  function closeSearch() {
    setSearchOpen(false);
    setSearchPreview(undefined);
    setPreviewImageFailed(undefined);
    setPreviewSubmitting(false);
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
      setStorageStatus("saving");
      await persistBinderChange(activeBinder.id, (binder) => moveOrSwapCard(binder, from, target));
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
      setStorageStatus("saving");
      await persistBinderChange(activeBinder.id, (binder) => removeCard(binder, cardToRemove.location));
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
      setStorageStatus("saving");
      await persistBinderChange(activeBinder.id, (binder) => setOwned(binder, entryId, owned));
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
      preferences: { ...entry.preferences },
      availableVariants: card?.availableVariants,
    });
  }

  async function saveVariantEdit() {
    if (!activeBinder || !variantEdit) return;
    try {
      setStorageStatus("saving");
      await persistBinderChange(activeBinder.id, (binder) => setCardPreferences(
        setCardVariant(binder, variantEdit.entryId, variantEdit.variant),
        variantEdit.entryId,
        variantEdit.preferences,
      ));
      setVariantEdit(undefined);
      setStorageStatus("saved");
      setMessage(`Version und Mindestzustand für „${variantEdit.label}“ wurden gespeichert.`);
    } catch (error) {
      handleStorageError(error, "Kartenversion und Mindestzustand konnten nicht gespeichert werden.");
    }
  }

  async function refreshCardSnapshot(card: CardSnapshot) {
    if (!activeBinder) return;
    try {
      setStorageStatus("saving");
      const snapshot = await catalog.getCard(card.ref);
      await persistBinderChange(activeBinder.id, (binder) => binder, [snapshot]);
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
      bindersRef.current = items;
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
      setMessage(`${exported.readyCount} TCGplayer-Positionen wurden kopiert; ${exported.reviewRequiredCount} Positionen benötigen eine Prüfung.`);
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
    setMessage(`${exported.readyCount} TCGplayer-Positionen wurden als TXT vorbereitet; ${exported.reviewRequiredCount} Positionen benötigen eine Prüfung.`);
  }

  async function copyCardmarketHandoff(part: CardmarketHandoffPart) {
    try {
      if (!part.text) throw new Error("No Cardmarket decklist lines available");
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(part.text);
      setCardmarketCopyState("copied");
      setMessage(`Cardmarket-Deckliste Teil ${part.index} mit ${part.importablePositionCount} Positionen wurde kopiert.`);
    } catch {
      setCardmarketCopyState("error");
      setMessage("Cardmarket-Deckliste konnte nicht kopiert werden. Nutze die sichtbare Vorschau oder TXT-Datei.");
    }
  }

  function downloadCardmarketHandoff(part: CardmarketHandoffPart) {
    if (!part.text) return;
    const blob = new Blob([part.text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cardfolio-cardmarket-deckliste-teil-${part.index}-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage(`Cardmarket-Deckliste Teil ${part.index} mit ${part.importablePositionCount} Positionen wurde als TXT vorbereitet.`);
  }

  async function prepareCardmarketHandoff(items: readonly MissingItem[]) {
    if (!activeBinder || cardmarketPreparing) return;
    const cardsToRefresh = [...new Map(
      items
        .filter((item) => !item.card.category || item.card.abilities === undefined || item.card.attacks === undefined)
        .map((item) => [item.card.key, item.card]),
    ).values()];
    if (!cardsToRefresh.length) return;

    setCardmarketPreparing(true);
    setStorageStatus("saving");
    try {
      const results = await Promise.allSettled(cardsToRefresh.map((card) => catalog.getCard(card.ref)));
      const refreshed = results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
      if (!refreshed.length) {
        const failed = results.find((result): result is PromiseRejectedResult => result.status === "rejected");
        throw failed?.reason instanceof Error
          ? failed.reason
          : new Error("Cardmarket-Katalogdaten konnten nicht aktualisiert werden.");
      }
      await persistBinderChange(activeBinder.id, (binder) => binder, refreshed);
      setCards((current) => {
        const next = new Map(current);
        for (const card of refreshed) next.set(card.key, card);
        return next;
      });
      setStorageStatus("saved");
      const failedCount = results.length - refreshed.length;
      setMessage(failedCount
        ? `${refreshed.length} Kartendatensätze für Cardmarket aktualisiert; ${failedCount} konnten nicht geladen werden.`
        : `${refreshed.length} Kartendatensätze für das offizielle Cardmarket-Format aktualisiert.`);
    } catch (error) {
      handleStorageError(error, "Cardmarket-Kartendaten konnten nicht aktualisiert werden.");
    } finally {
      setCardmarketPreparing(false);
    }
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

      {binderRename ? (
        <div className={styles.dialogBackdrop} role="presentation">
          <section className={styles.confirmDialog} role="dialog" aria-modal="true" aria-labelledby="rename-binder-heading">
            <p className={styles.eyebrow}>Binder bearbeiten</p>
            <h2 id="rename-binder-heading">Binder umbenennen</h2>
            <p>Der neue Name wird nur in diesem Browser gespeichert und bleibt beim JSON-Backup erhalten.</p>
            <form onSubmit={saveBinderRename}>
              <label className={styles.dialogField} htmlFor="rename-binder-name">
                <span>Bindername</span>
                <input
                  id="rename-binder-name"
                  value={binderRename.name}
                  maxLength={BINDER_NAME_MAX_LENGTH}
                  autoFocus
                  onChange={(event) => setBinderRename((current) => current ? { ...current, name: event.target.value } : current)}
                />
                <small>{binderRename.name.length} / {BINDER_NAME_MAX_LENGTH}</small>
              </label>
              <div className={styles.dialogActions}>
                <button type="button" className={styles.secondaryButton} onClick={() => setBinderRename(undefined)}>Abbrechen</button>
                <button type="submit" className={styles.confirmButton} disabled={!binderRename.name.trim()}>Namen speichern</button>
              </div>
            </form>
          </section>
        </div>
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

      {pageToDelete ? (
        <div className={styles.dialogBackdrop} role="presentation">
          <section className={styles.confirmDialog} role="dialog" aria-modal="true" aria-labelledby="delete-page-heading">
            <p className={styles.eyebrow}>Binderseite löschen</p>
            <h2 id="delete-page-heading">Seite {pageToDelete.pageIndex + 1} wirklich löschen?</h2>
            <p>
              {pageToDelete.plannedCount
                ? `${pageToDelete.plannedCount} ${pageToDelete.plannedCount === 1 ? "geplante Karte wird" : "geplante Karten werden"} dauerhaft aus diesem Binder entfernt.`
                : "Diese Seite enthält keine geplanten Karten."}
              {pageToDelete.hasNote ? " Auch die Seitennotiz wird gelöscht." : ""}
            </p>
            <div className={styles.dialogActions}>
              <button type="button" className={styles.secondaryButton} onClick={() => setPageToDelete(undefined)}>Abbrechen</button>
              <button type="button" className={styles.dangerButton} onClick={confirmPageDelete}>Seite löschen</button>
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
            <p className={styles.eyebrow}>Kartendetails</p>
            <h2 id="variant-heading">Version und Mindestzustand für „{variantEdit.label}“ festlegen</h2>
            <p>Version und gewünschter Mindestzustand werden getrennt gespeichert und in Fehlkartenlisten sowie Exporten berücksichtigt.</p>
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
              <label>
                Mindestzustand
                <select
                  value={variantEdit.preferences.minimumCondition}
                  onChange={(event) => setVariantEdit((current) => current ? {
                    ...current,
                    preferences: {
                      ...current.preferences,
                      minimumCondition: event.target.value as PurchasePreferences["minimumCondition"],
                    },
                  } : current)}
                >
                  {Object.entries(minimumConditionLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                </select>
              </label>
            </div>
            <p className={styles.variantHint}>{formatAvailableVariants(variantEdit.availableVariants)} Shadowless wird von TCGdex nicht separat geliefert und ist deshalb eine manuelle Auswahl.</p>
            <div className={styles.dialogActions}>
              <button type="button" className={styles.secondaryButton} onClick={() => setVariantEdit(undefined)}>Abbrechen</button>
              <button type="button" className={styles.confirmButton} onClick={saveVariantEdit}>Angaben speichern</button>
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
              <p className={styles.binderMeta}>{activeBinder.pages.length} {activeBinder.pages.length === 1 ? "Seite" : "Seiten"} · {activeBinder.layout.rows} × {activeBinder.layout.columns}</p>
              <AutosaveTextarea
                key={`description-${activeBinder.id}`}
                id={`binder-description-${activeBinder.id}`}
                label="Binderbeschreibung"
                value={activeBinder.description}
                maxLength={BINDER_DESCRIPTION_MAX_LENGTH}
                placeholder="Worum geht es in diesem Binder?"
                rows={2}
                className={styles.binderDescriptionEditor}
                disabled={storageConflict}
                onChange={changeBinderDescriptionDraft}
                onSave={(value) => saveBinderDescription(activeBinder.id, value)}
              />
            </div>
            <div className={styles.binderHeaderActions}>
              <button type="button" className={styles.secondaryButton} onClick={() => setBinderRename({ binderId: activeBinder.id, name: activeBinder.name })}><Pencil size={16} /> Binder umbenennen</button>
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
              cardmarketPreparing={cardmarketPreparing}
              cardmarketCopyState={cardmarketCopyState}
              onCardmarketPrepare={(items) => void prepareCardmarketHandoff(items)}
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
                  <div className={styles.pageEditControls} aria-label="Aktuelle Binderseite bearbeiten">
                    <button
                      type="button"
                      className={styles.pageActionButton}
                      aria-label={`Seite ${visiblePageIndex + 1} duplizieren`}
                      title={activeBinder.pages.length >= MAX_BINDER_PAGES ? `Maximal ${MAX_BINDER_PAGES} Seiten` : "Seite duplizieren"}
                      disabled={!activePage || activeBinder.pages.length >= MAX_BINDER_PAGES}
                      onClick={() => void duplicateActivePage()}
                    >
                      <Copy size={15} />
                    </button>
                    <button
                      type="button"
                      className={`${styles.pageActionButton} ${styles.pageDeleteButton}`}
                      aria-label={`Seite ${visiblePageIndex + 1} löschen`}
                      title={activeBinder.pages.length === 1 ? "Mindestens eine Seite muss erhalten bleiben" : "Seite löschen"}
                      disabled={!activePage || activeBinder.pages.length === 1}
                      onClick={requestPageDelete}
                    >
                      <Trash2 size={15} />
                    </button>
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
              {activePage ? (
                <AutosaveTextarea
                  key={`page-note-${activePage.id}`}
                  id={`page-note-${activePage.id}`}
                  label={`Seitennotiz · Seite ${visiblePageIndex + 1}`}
                  value={activePage.note}
                  maxLength={PAGE_NOTE_MAX_LENGTH}
                  placeholder="Notizen zu Zustand, Zielen oder Anordnung dieser Seite…"
                  rows={4}
                  className={styles.pageNoteEditor}
                  disabled={storageConflict}
                  onChange={(value) => changePageNoteDraft(activePage.id, value)}
                  onSave={(value) => savePageNote(activeBinder.id, activePage.id, value)}
                />
              ) : null}
            </section>

            {searchOpen ? <aside className={styles.searchDrawer} aria-labelledby="search-heading" role="dialog" aria-modal="false">
              <div className={styles.drawerHeader}>
                <div>
                  <p className={styles.eyebrow}>{searchPreview ? "Ausgabe prüfen" : "Karte einsetzen"}</p>
                  <h2 id="search-heading">{searchPreview ? "Karte prüfen" : "Karte suchen"}</h2>
                </div>
                <button type="button" className={styles.drawerClose} onClick={closeSearch} aria-label="Suche schließen"><X size={18} /></button>
              </div>
              {selectedLocation ? <p className={styles.selectedSlotHint}>Ziel: Seite {visiblePageIndex + 1}, Slot {selectedLocation.slotIndex + 1}</p> : <p className={styles.selectedSlotHint}>Wähle einen Treffer, um ihn in den nächsten freien Slot einzusetzen.</p>}
              {searchPreview ? (
                <div className={styles.searchPreview}>
                  <button
                    type="button"
                    className={styles.previewBack}
                    onClick={() => { setSearchPreview(undefined); setPreviewImageFailed(undefined); }}
                  >
                    ← Zurück zu den Suchergebnissen
                  </button>
                  {searchPreview.status === "loading" ? <p className={styles.previewLoading} role="status">Kartendetails werden geladen…</p> : null}
                  {searchPreview.status === "error" ? (
                    <div className={styles.previewError}>
                      <p className={styles.error}>{searchPreview.error}</p>
                      <button type="button" className={styles.secondaryButton} onClick={() => void previewSearchResult(searchPreview.item)}>Erneut laden</button>
                    </div>
                  ) : null}
                  {searchPreview.status === "ready" && searchPreview.snapshot ? (
                    <>
                      {searchPreview.snapshot.imageBaseUrl && previewImageFailed !== searchPreview.snapshot.imageBaseUrl ? (
                        <div className={styles.previewImage}>
                          <img
                            src={cardImageUrl(searchPreview.snapshot.imageBaseUrl)}
                            alt={`${searchPreview.snapshot.name}, ${searchPreview.snapshot.setName}`}
                            onError={() => setPreviewImageFailed(searchPreview.snapshot?.imageBaseUrl)}
                          />
                          {searchPreview.snapshot.ref.language === "de" && searchPreview.snapshot.imageBaseUrl.includes("/en/") ? <span>Bild auf Englisch</span> : null}
                        </div>
                      ) : <div className={styles.previewImageFallback}>Bild nicht verfügbar</div>}
                      <div className={styles.previewIdentity}>
                        <strong>{searchPreview.snapshot.name}</strong>
                        <span>{searchPreview.snapshot.setName}</span>
                      </div>
                      <dl className={styles.previewMeta}>
                        <div><dt>Sprache</dt><dd>{searchPreview.snapshot.ref.language.toUpperCase()}</dd></div>
                        <div><dt>Kartennummer</dt><dd>{formatCollectorNumber(searchPreview.snapshot.collectorNumber, searchPreview.snapshot.collectorTotal)}</dd></div>
                      </dl>
                      <div className={styles.variantForm}>
                        <label>
                          Finish
                          <select
                            value={searchPreview.variant.finish}
                            onChange={(event) => setSearchPreview((current) => current ? {
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
                            value={searchPreview.variant.edition}
                            onChange={(event) => setSearchPreview((current) => current ? {
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
                            value={selectedPrinting(searchPreview.variant)}
                            onChange={(event) => setSearchPreview((current) => current ? {
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
                            value={searchPreview.variant.label ?? ""}
                            maxLength={100}
                            placeholder="z. B. Cosmos Holo"
                            onChange={(event) => setSearchPreview((current) => current ? {
                              ...current,
                              variant: { ...current.variant, label: event.target.value || undefined },
                            } : current)}
                          />
                        </label>
                        <label>
                          Mindestzustand
                          <select
                            value={searchPreview.preferences.minimumCondition}
                            onChange={(event) => setSearchPreview((current) => current ? {
                              ...current,
                              preferences: {
                                ...current.preferences,
                                minimumCondition: event.target.value as PurchasePreferences["minimumCondition"],
                              },
                            } : current)}
                          >
                            {Object.entries(minimumConditionLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                          </select>
                        </label>
                      </div>
                      <p className={styles.variantHint}>{formatAvailableVariants(searchPreview.snapshot.availableVariants)} Shadowless wird von TCGdex nicht separat geliefert und ist deshalb eine manuelle Auswahl.</p>
                      <button type="button" className={styles.primaryButton} disabled={previewSubmitting} onClick={() => void insertPreviewedCard()}>
                        {previewSubmitting ? "Wird eingesetzt…" : "Mit diesen Angaben einsetzen"}
                      </button>
                    </>
                  ) : null}
                </div>
              ) : (
                <>
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
                  <div className={styles.catalogFilters}>
                    <label htmlFor="card-series-filter">
                      Serie
                      <select
                        id="card-series-filter"
                        value={searchSeriesId}
                        onChange={(event) => {
                          setSearchSeriesId(event.target.value);
                          setSearchSetId("");
                        }}
                      >
                        <option value="">Alle Serien</option>
                        {seriesOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                      </select>
                    </label>
                    <label htmlFor="card-set-filter">
                      Set
                      <select id="card-set-filter" value={searchSetId} onChange={(event) => setSearchSetId(event.target.value)}>
                        <option value="">Alle Sets</option>
                        {setOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                      </select>
                    </label>
                  </div>
                  <label className={styles.searchLabel} htmlFor="card-search">
                    <Search aria-hidden="true" size={18} />
                    <input id="card-search" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Name oder Nummer, z. B. Glurak 4/102" autoFocus />
                  </label>
                  {searchIsRunning && searchEnabled ? <p>Suche läuft…</p> : null}
                  {searchError ? <p className={styles.error}>Ein Sprachkatalog konnte nicht geladen werden: {searchError.message}</p> : null}
                  {!searchEnabled ? <p className={styles.searchHint}>Gib mindestens zwei Buchstaben oder eine Kartennummer ein – oder wähle ein Set.</p> : null}
                  {searchHasCompleted && !searchResults.length ? <p className={styles.noResults}>Keine Karten mit diesen Filtern gefunden. Prüfe Name, Sprache, Serie oder Set.</p> : null}
                  <ul className={styles.results}>
                    {searchResults.map((item) => (
                      <li key={`${item.ref.language}-${item.ref.id}`}>
                        <span><strong>{item.name}</strong><small>{item.ref.language.toUpperCase()} · {item.setName ? `${item.setName} · ` : ""}Nr. {formatCollectorNumber(item.collectorNumber, item.collectorTotal)}</small></span>
                        <button type="button" onClick={() => void previewSearchResult(item)}>Prüfen</button>
                      </li>
                    ))}
                  </ul>
                  {searchHasMore ? (
                    <button type="button" className={styles.loadMoreButton} disabled={searchIsLoadingMore} onClick={() => void loadMoreSearchResults()}>
                      {searchIsLoadingMore ? "Weitere Treffer werden geladen…" : "Mehr laden"}
                    </button>
                  ) : null}
                </>
              )}
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
                      <div><dt>Zustand</dt><dd>{minimumConditionLabels[contextEntry.preferences.minimumCondition]}</dd></div>
                      <div><dt>Status</dt><dd>{contextEntry.owned ? "Vorhanden" : "Fehlt"}</dd></div>
                    </dl>
                    <div className={styles.contextActions}>
                      <button type="button" className={styles.primaryButton} onClick={() => void toggleOwned(contextEntry.id, !contextEntry.owned)}>{contextEntry.owned ? "Als fehlend markieren" : "Als vorhanden markieren"}</button>
                      <button type="button" className={styles.secondaryButton} onClick={() => requestVariantEdit(contextEntry, contextCard)}>Version &amp; Zustand festlegen</button>
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
