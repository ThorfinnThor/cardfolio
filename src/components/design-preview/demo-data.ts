export interface DemoCard {
  id: string;
  name: string;
  setName: string;
  collectorNumber: string;
  imageUrl: string;
  category: "pokemon" | "trainer";
}

export interface DemoSlot {
  id: string;
  card: DemoCard | null;
  status: "owned" | "missing" | "empty";
}

export interface DemoPage {
  id: string;
  label: string;
  slots: DemoSlot[];
}

const DEMO_NAMES = [
  "Bulbasaur",
  "Ivysaur",
  "Venusaur",
  "Charmander",
  "Charmeleon",
  "Charizard",
  "Squirtle",
  "Wartortle",
  "Blastoise",
  "Caterpie",
  "Metapod",
  "Butterfree",
  "Weedle",
  "Kakuna",
  "Beedrill",
  "Pidgey",
];

export const DEMO_CARDS: DemoCard[] = DEMO_NAMES.map((name, index) => ({
  id: `demo-card-${index + 1}`,
  name,
  setName: "Base Set",
  collectorNumber: `${index + 1}/102`,
  imageUrl: `https://assets.tcgdex.net/en/base/base1/${index + 1}/high.webp`,
  category: index % 5 === 0 ? "trainer" : "pokemon",
}));

function createPage(pageNumber: number, startIndex: number): DemoPage {
  const statuses: DemoSlot["status"][] = [
    "owned",
    "owned",
    "owned",
    "owned",
    "owned",
    "owned",
    "missing",
    "missing",
    "empty",
  ];

  return {
    id: `demo-page-${pageNumber}`,
    label: `Seite ${pageNumber}`,
    slots: statuses.map((status, slotIndex) => ({
      id: `demo-slot-${pageNumber}-${slotIndex + 1}`,
      card: status === "empty" ? null : DEMO_CARDS[startIndex + slotIndex],
      status,
    })),
  };
}

export const DEMO_PAGES: DemoPage[] = [createPage(1, 0), createPage(2, 8)];

export const DEMO_STATS = {
  pages: 2,
  slots: 18,
  planned: 16,
  owned: 12,
  missing: 4,
  empty: 2,
  completion: 75,
} as const;

export const DEMO_MISSING_SLOTS = DEMO_PAGES.flatMap((page) =>
  page.slots.filter((slot) => slot.status === "missing"),
);

export function findDemoSlot(slotId: string): DemoSlot | undefined {
  return DEMO_PAGES.flatMap((page) => page.slots).find((slot) => slot.id === slotId);
}
