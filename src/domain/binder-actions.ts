import type {
  Binder,
  BinderPage,
  CardRef,
  PlannedCard,
  PurchasePreferences,
  UUID,
  VariantSelection,
} from "./types";

export interface SlotLocation {
  pageId: UUID;
  slotIndex: number;
}

const DEFAULT_LAYOUT = { rows: 3, columns: 3 } as const;

export const BINDER_NAME_MAX_LENGTH = 100;
export const BINDER_DESCRIPTION_MAX_LENGTH = 500;
export const PAGE_TITLE_MAX_LENGTH = 80;
export const PAGE_NOTE_MAX_LENGTH = 2_000;
export const MAX_BINDERS = 50;
export const MAX_BINDER_PAGES = 40;

export const SUPPORTED_BINDER_LAYOUTS = [
  { key: "2x2", label: "2 × 2", rows: 2, columns: 2 },
  { key: "3x3", label: "3 × 3", rows: 3, columns: 3 },
  { key: "3x4", label: "3 × 4", rows: 3, columns: 4 },
] as const;

export type SupportedBinderLayout = Pick<(typeof SUPPORTED_BINDER_LAYOUTS)[number], "rows" | "columns">;

export interface BinderLayoutPreview {
  from: { rows: number; columns: number };
  to: SupportedBinderLayout;
  plannedCards: number;
  pagesBefore: number;
  pagesAfter: number;
  movedCards: number;
}

function newId(): UUID {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

function slotCount(binder: Pick<Binder, "layout">): number {
  return binder.layout.rows * binder.layout.columns;
}

function emptyPage(count: number): BinderPage {
  return { id: newId(), slots: Array<PlannedCard | null>(count).fill(null), note: "" };
}

export function makeCardKey(ref: CardRef): string {
  if (!ref.id.trim()) throw new Error("Card provider ID must not be empty.");
  return `${ref.provider}:${encodeURIComponent(ref.id)}:${ref.language}`;
}

export function createBinder(
  name: string,
  layout: { rows: number; columns: number } = DEFAULT_LAYOUT,
): Binder {
  const cleanName = name.trim();
  if (!cleanName || cleanName.length > BINDER_NAME_MAX_LENGTH) {
    throw new Error(`Binder name must contain 1 to ${BINDER_NAME_MAX_LENGTH} characters.`);
  }
  if (layout.rows < 1 || layout.columns < 1 || layout.rows * layout.columns > 360) {
    throw new Error("Binder layout is outside the supported limits.");
  }
  const timestamp = now();
  const binder: Binder = {
    id: newId(),
    schemaVersion: 1,
    revision: 0,
    name: cleanName,
    description: "",
    layout: { ...layout },
    pages: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  return { ...binder, pages: [emptyPage(slotCount(binder))] };
}

export function createPlannedCard(
  cardKey: string,
  variant: VariantSelection = { finish: "unspecified", edition: "unspecified", printing: "shadowed" },
  preferences: PurchasePreferences = { minimumCondition: "any" },
): PlannedCard {
  if (!cardKey) throw new Error("Card key must not be empty.");
  return {
    id: newId(),
    cardKey,
    variant: { ...variant },
    preferences: { ...preferences },
    owned: false,
    addedAt: now(),
  };
}

function locate(binder: Binder, location: SlotLocation): { pageIndex: number; page: BinderPage } {
  const pageIndex = binder.pages.findIndex((page) => page.id === location.pageId);
  if (pageIndex < 0) throw new Error("Binder page does not exist.");
  const page = binder.pages[pageIndex];
  if (!Number.isInteger(location.slotIndex) || location.slotIndex < 0 || location.slotIndex >= page.slots.length) {
    throw new Error("Slot index is outside the page.");
  }
  return { pageIndex, page };
}

function withUpdatedPages(binder: Binder, pages: BinderPage[]): Binder {
  return { ...binder, pages, updatedAt: now() };
}

export function renameBinder(binder: Binder, name: string): Binder {
  const cleanName = name.trim();
  if (!cleanName || cleanName.length > BINDER_NAME_MAX_LENGTH) {
    throw new Error(`Binder name must contain 1 to ${BINDER_NAME_MAX_LENGTH} characters.`);
  }
  if (binder.name === cleanName) return binder;
  return { ...binder, name: cleanName, updatedAt: now() };
}

export function duplicateBinder(binder: Binder): Binder {
  const timestamp = now();
  const suffix = " (Kopie)";
  const name = `${binder.name.slice(0, BINDER_NAME_MAX_LENGTH - suffix.length).trimEnd()}${suffix}`;
  return {
    ...binder,
    id: newId(),
    revision: 0,
    name,
    layout: { ...binder.layout },
    pages: binder.pages.map((page) => ({
      ...page,
      id: newId(),
      slots: page.slots.map((entry) => entry ? {
        ...entry,
        id: newId(),
        variant: { ...entry.variant },
        preferences: { ...entry.preferences },
        addedAt: timestamp,
      } : null),
    })),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function setBinderDescription(binder: Binder, description: string): Binder {
  if (description.length > BINDER_DESCRIPTION_MAX_LENGTH) {
    throw new Error(`Binder description must not exceed ${BINDER_DESCRIPTION_MAX_LENGTH} characters.`);
  }
  if (binder.description === description) return binder;
  return { ...binder, description, updatedAt: now() };
}

export function setPageNote(binder: Binder, pageId: UUID, note: string): Binder {
  if (note.length > PAGE_NOTE_MAX_LENGTH) {
    throw new Error(`Page note must not exceed ${PAGE_NOTE_MAX_LENGTH} characters.`);
  }
  const pageIndex = binder.pages.findIndex((page) => page.id === pageId);
  if (pageIndex < 0) throw new Error("Binder page does not exist.");
  if (binder.pages[pageIndex].note === note) return binder;
  const pages = [...binder.pages];
  pages[pageIndex] = { ...pages[pageIndex], note };
  return withUpdatedPages(binder, pages);
}

export function setPageTitle(binder: Binder, pageId: UUID, title: string): Binder {
  const cleanTitle = title.trim();
  if (cleanTitle.length > PAGE_TITLE_MAX_LENGTH) {
    throw new Error(`Page title must not exceed ${PAGE_TITLE_MAX_LENGTH} characters.`);
  }
  const pageIndex = binder.pages.findIndex((page) => page.id === pageId);
  if (pageIndex < 0) throw new Error("Binder page does not exist.");
  const currentTitle = binder.pages[pageIndex].title ?? "";
  if (currentTitle === cleanTitle) return binder;
  const pages = [...binder.pages];
  pages[pageIndex] = { ...pages[pageIndex], title: cleanTitle || undefined };
  return withUpdatedPages(binder, pages);
}

function isSupportedLayout(layout: SupportedBinderLayout): boolean {
  return SUPPORTED_BINDER_LAYOUTS.some(
    (candidate) => candidate.rows === layout.rows && candidate.columns === layout.columns,
  );
}

function reflowBinderPages(binder: Binder, layout: SupportedBinderLayout): BinderPage[] {
  if (!isSupportedLayout(layout)) throw new Error("Binder layout is not supported.");
  const entries = binder.pages.flatMap((page) => page.slots.filter((entry): entry is PlannedCard => entry !== null));
  const slotsPerPage = layout.rows * layout.columns;
  const pageCount = Math.max(1, binder.pages.length, Math.ceil(entries.length / slotsPerPage));

  return Array.from({ length: pageCount }, (_, pageIndex) => {
    const previousPage = binder.pages[pageIndex];
    const slots = Array<PlannedCard | null>(slotsPerPage).fill(null);
    entries
      .slice(pageIndex * slotsPerPage, (pageIndex + 1) * slotsPerPage)
      .forEach((entry, slotIndex) => {
        slots[slotIndex] = { ...entry, variant: { ...entry.variant }, preferences: { ...entry.preferences } };
      });
    return {
      id: previousPage?.id ?? newId(),
      note: previousPage?.note ?? "",
      title: previousPage?.title,
      slots,
    };
  });
}

export function previewBinderLayoutChange(binder: Binder, layout: SupportedBinderLayout): BinderLayoutPreview {
  if (!isSupportedLayout(layout)) throw new Error("Binder layout is not supported.");
  const entries = binder.pages.flatMap((page) => page.slots.filter((entry): entry is PlannedCard => entry !== null));
  const slotsPerPage = layout.rows * layout.columns;
  const pagesAfter = Math.max(1, binder.pages.length, Math.ceil(entries.length / slotsPerPage));
  const oldLocations = new Map<UUID, string>();
  binder.pages.forEach((page, pageIndex) => page.slots.forEach((entry, slotIndex) => {
    if (entry) oldLocations.set(entry.id, `${pageIndex}:${slotIndex}`);
  }));
  const movedCards = entries.reduce((total, entry, index) => {
    const destination = `${Math.floor(index / slotsPerPage)}:${index % slotsPerPage}`;
    return total + (oldLocations.get(entry.id) === destination ? 0 : 1);
  }, 0);
  return {
    from: { ...binder.layout },
    to: { ...layout },
    plannedCards: entries.length,
    pagesBefore: binder.pages.length,
    pagesAfter,
    movedCards,
  };
}

export function changeBinderLayout(binder: Binder, layout: SupportedBinderLayout): Binder {
  if (binder.layout.rows === layout.rows && binder.layout.columns === layout.columns) return binder;
  return {
    ...binder,
    layout: { ...layout },
    pages: reflowBinderPages(binder, layout),
    updatedAt: now(),
  };
}

export function placeCard(binder: Binder, location: SlotLocation, card: PlannedCard): Binder {
  const { pageIndex, page } = locate(binder, location);
  if (page.slots[location.slotIndex]) throw new Error("Target slot is already occupied.");
  if (binder.pages.some((candidate) => candidate.slots.some((entry) => entry?.id === card.id))) {
    throw new Error("Planned card ID already exists in this binder.");
  }
  const slots = [...page.slots];
  slots[location.slotIndex] = { ...card, variant: { ...card.variant }, preferences: { ...card.preferences } };
  const pages = [...binder.pages];
  pages[pageIndex] = { ...page, slots };
  return withUpdatedPages(binder, pages);
}

export function moveOrSwapCard(binder: Binder, from: SlotLocation, to: SlotLocation): Binder {
  const source = locate(binder, from);
  const target = locate(binder, to);
  const sourceCard = source.page.slots[from.slotIndex];
  if (!sourceCard) throw new Error("Source slot is empty.");

  const pages = binder.pages.map((page) => ({ ...page, slots: [...page.slots] }));
  const targetCard = pages[target.pageIndex].slots[to.slotIndex];
  pages[target.pageIndex].slots[to.slotIndex] = sourceCard;
  pages[source.pageIndex].slots[from.slotIndex] = targetCard;
  return withUpdatedPages(binder, pages);
}

export function removeCard(binder: Binder, location: SlotLocation): Binder {
  const { pageIndex, page } = locate(binder, location);
  if (!page.slots[location.slotIndex]) return binder;
  const slots = [...page.slots];
  slots[location.slotIndex] = null;
  const pages = [...binder.pages];
  pages[pageIndex] = { ...page, slots };
  return withUpdatedPages(binder, pages);
}

export function setOwned(binder: Binder, entryId: UUID, owned: boolean): Binder {
  let found = false;
  const pages = binder.pages.map((page) => ({
    ...page,
    slots: page.slots.map((entry) => {
      if (entry?.id !== entryId) return entry;
      found = true;
      return { ...entry, owned };
    }),
  }));
  if (!found) throw new Error("Planned card does not exist.");
  return withUpdatedPages(binder, pages);
}

export function setCardVariant(binder: Binder, entryId: UUID, variant: VariantSelection): Binder {
  let found = false;
  const pages = binder.pages.map((page) => ({
    ...page,
    slots: page.slots.map((entry) => {
      if (entry?.id !== entryId) return entry;
      found = true;
      return { ...entry, variant: { ...variant } };
    }),
  }));
  if (!found) throw new Error("Planned card does not exist.");
  return withUpdatedPages(binder, pages);
}

export function setCardPreferences(binder: Binder, entryId: UUID, preferences: PurchasePreferences): Binder {
  let found = false;
  const pages = binder.pages.map((page) => ({
    ...page,
    slots: page.slots.map((entry) => {
      if (entry?.id !== entryId) return entry;
      found = true;
      return { ...entry, preferences: { ...preferences } };
    }),
  }));
  if (!found) throw new Error("Planned card does not exist.");
  return withUpdatedPages(binder, pages);
}

export function addPage(binder: Binder): Binder {
  if (binder.pages.length >= MAX_BINDER_PAGES) throw new Error(`A binder can contain at most ${MAX_BINDER_PAGES} pages.`);
  return withUpdatedPages(binder, [...binder.pages, emptyPage(slotCount(binder))]);
}

export function duplicatePage(binder: Binder, pageId: UUID): Binder {
  if (binder.pages.length >= MAX_BINDER_PAGES) throw new Error(`A binder can contain at most ${MAX_BINDER_PAGES} pages.`);
  const pageIndex = binder.pages.findIndex((candidate) => candidate.id === pageId);
  if (pageIndex < 0) throw new Error("Binder page does not exist.");
  const addedAt = now();
  const source = binder.pages[pageIndex];
  const duplicate: BinderPage = {
    id: newId(),
    note: source.note,
    title: source.title,
    slots: source.slots.map((entry) => entry ? {
      ...entry,
      id: newId(),
      variant: { ...entry.variant },
      preferences: { ...entry.preferences },
      addedAt,
    } : null),
  };
  const pages = [...binder.pages];
  pages.splice(pageIndex + 1, 0, duplicate);
  return withUpdatedPages(binder, pages);
}

export function movePage(binder: Binder, pageId: UUID, direction: "forward" | "backward"): Binder {
  const pageIndex = binder.pages.findIndex((candidate) => candidate.id === pageId);
  if (pageIndex < 0) throw new Error("Binder page does not exist.");
  const targetIndex = direction === "forward" ? pageIndex - 1 : pageIndex + 1;
  if (targetIndex < 0 || targetIndex >= binder.pages.length) return binder;
  const pages = [...binder.pages];
  [pages[pageIndex], pages[targetIndex]] = [pages[targetIndex], pages[pageIndex]];
  return withUpdatedPages(binder, pages);
}

export function deletePage(binder: Binder, pageId: UUID, allowNonEmpty = false): Binder {
  if (binder.pages.length === 1) throw new Error("A binder must keep at least one page.");
  const page = binder.pages.find((candidate) => candidate.id === pageId);
  if (!page) throw new Error("Binder page does not exist.");
  if (!allowNonEmpty && page.slots.some(Boolean)) {
    throw new Error("Deleting a non-empty page requires confirmation.");
  }
  return withUpdatedPages(binder, binder.pages.filter((candidate) => candidate.id !== pageId));
}
