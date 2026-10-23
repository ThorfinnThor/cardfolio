import { readFile } from "node:fs/promises";

import { type Locator, type Page } from "@playwright/test";

import { expect, test } from "./fixtures";

const headers = {
  "access-control-allow-origin": "*",
  "content-type": "application/json",
};

/**
 * The Cardmarket decklist is written from the bundled, verified card identities (keyed by card ID), not from the mocked
 * catalog response. The fixture therefore has to use Ivysaur's real ID: base1-2 is Blastoise in the real Base Set.
 */
const IVYSAUR_ID = "base1-30";

/** The CardTrader supplement cards are served from the app's own data; tests keep them out unless they ask for them. */
async function mockSupplements(page: Page, sets: Record<string, unknown> = {}) {
  await page.route("**/data/cardtrader/supplements.json", async (route) => {
    await route.fulfill({ body: JSON.stringify({ schemaVersion: 1, source: "test", sets }), headers, status: 200 });
  });
}

async function mockCatalog(page: Page) {
  await mockSupplements(page);
  await page.route("https://api.tcgdex.net/**", async (route) => {
    const url = new URL(route.request().url());

    if (url.pathname.endsWith("/cards")) {
      const query = url.searchParams.get("name")?.toLowerCase();
      const setId = url.searchParams.get("set.id");
      const language = url.pathname.split("/")[2];
      const pageNumber = Number(url.searchParams.get("pagination:page") ?? "1");
      if (setId === "base1" && !query) {
        await route.fulfill({
          body: JSON.stringify(pageNumber === 1 ? [{ id: "base1-1", localId: "1", name: language === "de" ? "Bisasam" : "Bulbasaur" }] : []),
          headers,
          status: 200,
        });
        return;
      }
      if (language === "en" && query?.includes("mixed")) {
        await route.fulfill({
          body: JSON.stringify([
            { id: "base1-1", localId: "1", name: "Bulbasaur" },
            { id: "A1-1", localId: "1", name: "Pocket card" },
          ]),
          headers,
          status: 200,
        });
        return;
      }
      if (language === "en" && query?.includes("bulk")) {
        const cards = pageNumber === 1
          ? Array.from({ length: 40 }, (_, index) => ({ id: `base1-${index + 1}`, localId: String(index + 1), name: `Set card ${index + 1}` }))
          : pageNumber === 2
            ? [{ id: "base1-41", localId: "41", name: "Set card 41" }]
            : [];
        await route.fulfill({ body: JSON.stringify(cards), headers, status: 200 });
        return;
      }
      const cards = language === "de"
        ? query?.includes("glurak")
          ? [{ id: "base1-4", localId: "4", name: "Glurak" }]
          : query?.includes("tornupto")
            ? [{ id: "neo1-17", localId: "17", name: "Tornupto" }]
          : query?.includes("pikachu")
            ? [{ id: "base1-58", localId: "58", name: "Pikachu" }]
            : []
        : query?.includes("blaine")
          ? [{ id: "gym2-2", localId: "2", name: "Blaine's Charizard" }]
          : query?.includes("charizard")
            ? [
              { id: "base1-4", localId: "4", name: "Charizard" },
              { id: "ex14-4", localId: "4", name: "Charizard δ" },
              { id: "sm9-14", localId: "14", name: "Charizard" },
            ]
          : query?.includes("ivysaur")
            ? [{ id: IVYSAUR_ID, localId: "30", name: "Ivysaur" }]
            : query?.includes("pikachu")
              ? [{ id: "base1-58", localId: "58", name: "Pikachu" }]
            : [{ id: "base1-1", localId: "1", name: "Bulbasaur" }];

      await route.fulfill({ body: JSON.stringify(cards), headers, status: 200 });
      return;
    }

    if (url.pathname.endsWith("/cards/base1-1")) {
      await route.fulfill({
        body: JSON.stringify({
          id: "base1-1",
          localId: "1",
          name: "Bulbasaur",
          category: "Pokemon",
          attacks: [{ name: "Leech Seed" }],
          set: { cardCount: { official: 102 }, id: "base1", name: "Base Set" },
          variants: { firstEdition: true, holo: false, normal: true, reverse: false },
        }),
        headers,
        status: 200,
      });
      return;
    }

    if (url.pathname.endsWith(`/cards/${IVYSAUR_ID}`)) {
      await route.fulfill({
        body: JSON.stringify({
          id: IVYSAUR_ID,
          localId: "30",
          name: "Ivysaur",
          category: "Pokemon",
          attacks: [{ name: "Vine Whip" }, { name: "Poisonpowder" }],
          set: { cardCount: { official: 102 }, id: "base1", name: "Base Set" },
          variants: { firstEdition: true, holo: false, normal: true, reverse: false },
        }),
        headers,
        status: 200,
      });
      return;
    }

    if (url.pathname.endsWith("/cards/base1-4")) {
      const language = url.pathname.split("/")[2];
      await route.fulfill({
        body: JSON.stringify({
          id: "base1-4",
          localId: "4",
          name: language === "de" ? "Glurak" : "Charizard",
          category: language === "de" ? "Pokémon" : "Pokemon",
          abilities: [{ name: language === "de" ? "Energie verbrennen" : "Energy Burn" }],
          attacks: [{ name: language === "de" ? "Feuerwirbel" : "Fire Spin" }],
          image: language === "en" ? "https://assets.tcgdex.net/en/base/base1/4" : undefined,
          set: { cardCount: { official: 102 }, id: "base1", name: "Grundset" },
          variants: { firstEdition: true, holo: true, normal: false, reverse: false },
        }),
        headers,
        status: 200,
      });
      return;
    }

    if (url.pathname.endsWith("/cards/ex14-4")) {
      await route.fulfill({
        body: JSON.stringify({
          id: "ex14-4",
          localId: "4",
          name: "Charizard δ",
          set: { cardCount: { official: 100 }, id: "ex14", name: "Crystal Guardians" },
        }),
        headers,
        status: 200,
      });
      return;
    }

    if (url.pathname.endsWith("/cards/neo1-17")) {
      const language = url.pathname.split("/")[2];
      await route.fulfill({
        body: JSON.stringify({
          id: "neo1-17",
          localId: "17",
          name: language === "de" ? "Tornupto" : "Typhlosion",
          category: language === "de" ? "Pokémon" : "Pokemon",
          abilities: [{ name: language === "de" ? "Feueraufladung" : "Fire Recharge" }],
          attacks: [{ name: language === "de" ? "Flammenexplosion" : "Flame Burst" }],
          set: { cardCount: { official: 111 }, id: "neo1", name: "Neo Genesis" },
          variants: { firstEdition: true, holo: true, normal: false, reverse: false },
        }),
        headers,
        status: 200,
      });
      return;
    }

    if (url.pathname.endsWith("/cards/gym2-2")) {
      await route.fulfill({
        body: JSON.stringify({
          id: "gym2-2",
          localId: "2",
          name: "Blaine's Charizard",
          category: "Pokemon",
          attacks: [{ name: "Roaring Flames" }, { name: "Flame Jet" }],
          set: { cardCount: { official: 132 }, id: "gym2", name: "Gym Challenge" },
          variants: { firstEdition: true, holo: true, normal: false, reverse: false },
        }),
        headers,
        status: 200,
      });
      return;
    }

    if (url.pathname.endsWith("/sets/base1")) {
      await route.fulfill({
        body: JSON.stringify({
          cardCount: { official: 102 },
          id: "base1",
          name: "Base Set",
          serie: { id: "base", name: "Base" },
        }),
        headers,
        status: 200,
      });
      return;
    }

    if (url.pathname.endsWith("/sets/neo1")) {
      await route.fulfill({
        body: JSON.stringify({ id: "neo1", name: "Neo Genesis", serie: { id: "neo", name: "Neo" } }),
        headers,
        status: 200,
      });
      return;
    }

    if (url.pathname.endsWith("/sets/gym2")) {
      await route.fulfill({
        body: JSON.stringify({ id: "gym2", name: "Gym Challenge", serie: { id: "gym", name: "Gym" } }),
        headers,
        status: 200,
      });
      return;
    }

    await route.abort();
  });
}

/** Creates an empty binder through the manual start, which sits behind "Ich sammle selbst" for first-time visitors. */
/** Opens the collector start modes. The page is static HTML first, so a click before hydration is lost: retry until the tabs appear. */
async function openCollectorStarts(page: Page) {
  await page.getByRole("button", { name: "Geschenk-Binder gestalten" }).waitFor();
  const link = page.getByRole("button", { name: "Ich sammle selbst" });
  const tabs = page.getByRole("tablist", { name: "Binder erstellen" });
  await expect(async () => {
    if (await link.isVisible()) await link.click();
    await expect(tabs).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
}

async function createBinderFromStart(page: Page, name: string) {
  await openCollectorStarts(page);
  await page.getByRole("tab", { name: "Selbst gestalten" }).click();
  await page.getByRole("textbox", { name: "Wie soll dein Binder heißen?" }).fill(name);
  await page.getByRole("button", { name: "Binder anlegen" }).click();
}

async function mockSemanticIndex(page: Page, status = 200) {
  await page.route("**/data/semantic/card-artwork-search-v1.json", async (route) => {
    if (status !== 200) {
      await route.fulfill({ body: "index unavailable", headers: { "content-type": "text/plain" }, status });
      return;
    }
    const forestMask = 2 ** 3;
    await route.fulfill({
      body: JSON.stringify({
        version: 1,
        source: "test",
        generatedAt: "2026-10-01",
        tags: [
          "beach", "water-surface", "underwater", "forest", "grassland-field", "mountain-rocks", "cave", "desert",
          "snow-ice", "city", "indoors", "ruins-building", "sky-clouds", "night", "sunset-sunrise", "fire-lava",
          "flowers", "food-visible", "human-present", "multiple-pokemon", "sleeping", "flying", "swimming",
        ],
        cards: [["base1-4", forestMask, "A Pokémon stands in a forest.", "Charizard", "4", "base1", "Base Set", "base"]],
      }),
      headers,
      status: 200,
    });
  });
}

const SEARCH_PLACEHOLDER = "Kartenname oder Nummer suchen";

/** The search drawer is ONE dialog whose name follows its state: "Karte auswählen" (results) or "Karte prüfen" (preview). */
const searchDialogOf = (page: Page) => page.getByRole("dialog", { name: "Karte auswählen" });
const resultTilesOf = (page: Page) => page.getByRole("list", { name: "Kartentreffer", exact: true }).getByRole("listitem");
const languageFilterOf = (page: Page) => page.getByRole("group", { name: "Kartensprache", exact: true });

/**
 * Finish, edition and printing sit behind "Andere Ausführung wählen" and stay collapsed while the catalog already
 * pre-selects a finish. Opens the section if needed so the selects can be driven.
 */
async function openVariantOptions(preview: Locator) {
  const summary = preview.locator("summary").filter({ hasText: "Ausführung" });
  const details = summary.locator("xpath=..");
  if (!(await details.evaluate((element) => (element as HTMLDetailsElement).open))) await summary.click();
}

/** The binder header and the sidebar both offer "Fehlende Karten (n)"; the header button is the one inside <main>. */
async function openMissingCards(page: Page, count: number) {
  await page.getByRole("main").getByRole("button", { name: `Fehlende Karten (${count})` }).click();
}

async function addCard(page: Page, slot: number, query: string, cardName: string) {
  await page.getByRole("button", { name: `Freier Platz ${slot}, Karte einsetzen` }).click();
  await page.getByPlaceholder(SEARCH_PLACEHOLDER).fill(query);
  await resultTilesOf(page).filter({ hasText: cardName }).getByRole("button", { name: "Details" }).click();
  const preview = page.getByRole("dialog", { name: "Karte prüfen" });
  await expect(preview).toContainText(cardName);
  const finish = preview.getByLabel("Ausführung der Karte");
  if (await finish.inputValue() === "unspecified") {
    await openVariantOptions(preview);
    await finish.selectOption("normal");
  }
  await preview.getByRole("button", { name: "Mit diesen Angaben einsetzen" }).click();
  await expect(page.getByRole("article", { name: `${cardName}, Slot ${slot}` })).toBeVisible();
}

test("completes the local-first binder, ownership, missing-list, and backup flow", async ({
  browser,
  page,
}) => {
  await mockCatalog(page);
  await page.goto("/app/");

  await createBinderFromStart(page, "E2E Binder");

  await addCard(page, 1, "Bulbasaur", "Bulbasaur");
  await addCard(page, 2, "Ivysaur", "Ivysaur");

  await page.getByRole("article", { name: "Bulbasaur, Slot 1" }).click();
  await page.getByRole("button", { name: "Verschieben", exact: true }).click();
  await page.getByRole("button", { name: "Hierher verschieben", exact: true }).click();
  await page.getByRole("article", { name: "Bulbasaur, Slot 2" }).click();
  await page.getByRole("button", { name: "Als vorhanden markieren" }).click();
  await expect(page.getByRole("button", { name: "Als fehlend markieren" })).toBeVisible();

  await page.reload();
  await page.getByRole("article", { name: "Bulbasaur, Slot 2" }).click();
  await expect(page.getByRole("button", { name: "Als fehlend markieren" })).toBeVisible();

  await openMissingCards(page, 1);
  const missingCards = page.getByRole("region", { name: "Fehlende Karten" });
  // The full list is a disclosure below the region chooser.
  await missingCards.getByText("Alle fehlenden Karten als Liste (1)").click();
  await expect(missingCards.getByText("Ivysaur", { exact: true })).toBeVisible();
  await missingCards.getByRole("button", { name: "Europa & UK · Cardmarket empfohlen" }).click();
  await expect(missingCards.getByRole("heading", { name: /Karten gemeinsam übertragen/ })).toBeVisible();
  const bulkHandoff = missingCards.getByRole("link", { name: "1 Karte kopieren & Cardmarket öffnen" });
  await expect(bulkHandoff).toHaveAttribute("href", "https://www.cardmarket.com/de/Pokemon/Wants");
  await missingCards.getByText("Falls etwas nicht klappt").click();
  await missingCards.getByText(/Wichtige Hinweise anzeigen/).click();
  await expect(missingCards.getByText(/vollständiger Kartenname, Fähigkeiten und Attacken/)).toBeVisible();
  await expect(missingCards.getByRole("textbox", { name: "Cardmarket-Decklistenvorschau" })).toHaveValue("1x Ivysaur Vine Whip Poisonpowder");
  const cardmarketDownloadPromise = page.waitForEvent("download");
  await missingCards.getByRole("button", { name: "Deckliste TXT" }).click();
  const cardmarketDownload = await cardmarketDownloadPromise;
  expect(cardmarketDownload.suggestedFilename()).toMatch(/^cardfolio-cardmarket-deckliste-teil-1-.*\.txt$/);

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Backup exportieren" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^cardfolio-backup-.*\.json$/);
  const downloadPath = await download.path();
  expect(downloadPath).toBeTruthy();
  const backup = await readFile(downloadPath as string);

  const cleanContext = await browser.newContext();
  const cleanPage = await cleanContext.newPage();
  await mockCatalog(cleanPage);
  await cleanPage.goto("/app/");
  // A first-time visitor lands on the gift-first start screen, without any binder.
  await expect(cleanPage.getByRole("heading", { name: "Ein Binder voller Karten vom Lieblings-Pokémon." })).toBeVisible();
  await cleanPage.locator("#backup-import").setInputFiles({
    buffer: backup,
    mimeType: "application/json",
    name: "cardfolio-backup.json",
  });

  const importReport = cleanPage.getByRole("status", { name: "Importbericht" });
  await expect(importReport).toContainText("1 Binder, 2 geplante Karten");
  await expect(cleanPage.getByRole("heading", { name: "E2E Binder (Import)", exact: true })).toBeVisible();
  await expect(cleanPage.getByText("Bulbasaur", { exact: true })).toBeVisible();
  await cleanContext.close();
});

test("inserts one card and safely undoes the exact saved mutation", async ({ page }) => {
  await mockCatalog(page);
  await page.goto("/app/");
  await createBinderFromStart(page, "Undo Binder");

  await addCard(page, 1, "Bulbasaur", "Bulbasaur");
  await expect(page.getByRole("article", { name: "Bulbasaur, Slot 1" })).toBeVisible();
  await page.getByRole("button", { name: "Rückgängig" }).click();
  await expect(page.getByRole("button", { name: "Freier Platz 1, Karte einsetzen" })).toBeVisible();
  await expect(page.getByRole("article", { name: "Bulbasaur, Slot 1" })).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole("button", { name: "Freier Platz 1, Karte einsetzen" })).toBeVisible();
});

test("reviews multiple cards and fills from the next free slot continuously", async ({ page }) => {
  await mockCatalog(page);
  await page.goto("/app/");
  await createBinderFromStart(page, "Mehrfachauswahl");
  await addCard(page, 1, "Bulbasaur", "Bulbasaur");

  await page.getByRole("button", { name: "Freier Platz 2, Karte einsetzen" }).click();
  const search = searchDialogOf(page);
  const query = search.getByPlaceholder(SEARCH_PLACEHOLDER);
  await query.fill("Bulbasaur");
  await resultTilesOf(page).filter({ hasText: "Bulbasaur" }).getByRole("button", { name: "Auswählen" }).click();
  await query.fill("Ivysaur");
  await resultTilesOf(page).filter({ hasText: "Ivysaur" }).getByRole("button", { name: "Auswählen" }).click();
  await expect(search.getByText("2 Karten ausgewählt")).toBeVisible();
  await search.getByRole("button", { name: "Auswahl prüfen" }).click();

  const review = page.getByRole("dialog", { name: "2 Karten als Auswahl übernehmen" });
  for (const finish of await review.getByLabel("Ausführung der Karte").all()) await expect(finish).toHaveValue("normal");
  await review.getByLabel("Ab nächstem freien Platz fortlaufend").check();
  const confirmSelection = review.getByRole("button", { name: "Auswahl übernehmen" });
  await expect(confirmSelection).toBeEnabled();
  await confirmSelection.click();

  await expect(page.getByRole("article", { name: "Bulbasaur, Slot 2" })).toBeVisible();
  await expect(page.getByRole("article", { name: "Ivysaur, Slot 3" })).toBeVisible();
  await expect(page.getByText("2 Karten wurden als Binderseite übernommen.")).toBeVisible();
});

test("creates a reviewed set binder through the guided start", async ({ page }) => {
  await mockCatalog(page);
  await page.goto("/app/");
  await openCollectorStarts(page);
  await page.getByRole("tab", { name: "Komplettes Set" }).click();
  await page.getByRole("button", { name: "Mit einem Set starten" }).click();

  const wizard = page.getByRole("region", { name: "Binder mit einem Set erstellen" });
  await wizard.getByPlaceholder(/Base Set/).fill("Base Set");
  const baseSet = wizard.locator('[aria-label="Sets auswählen"] button').filter({ hasText: /Grundset.*102 Karten/ });
  await expect(baseSet).toHaveCount(1);
  await baseSet.click();
  await wizard.getByRole("button", { name: "Set prüfen" }).click();
  await expect(wizard.getByLabel("Bindername")).toHaveValue("Grundset");
  await expect(wizard.getByText(/Katalog liefert 1 von erwarteten 102 Karten/).first()).toBeVisible();
  await wizard.getByLabel("Bindername").fill("Geführtes Base Set");
  await wizard.getByRole("button", { name: "Binder anlegen" }).click();

  await expect(page.getByRole("heading", { name: "Geführtes Base Set", exact: true })).toBeVisible();
  await expect(page.getByRole("article", { name: "Bulbasaur, Slot 1" })).toBeVisible();
  await expect(page.getByText(/1 Karten aus Grundset wurden eingeplant/)).toBeVisible();
});

test("keeps Your Card Binder views in the browser back and forward history", async ({ page }) => {
  await mockCatalog(page);
  await page.goto("/app/");

  await page.getByRole("button", { name: "Geschenk-Binder gestalten" }).click();
  await expect(page.getByRole("heading", { name: "Dein Geschenk-Binder beginnt hier" })).toBeVisible();

  await page.goBack();
  await expect(page.getByRole("heading", { name: "Ein Binder voller Karten vom Lieblings-Pokémon." })).toBeVisible();

  await page.goForward();
  await expect(page.getByRole("heading", { name: "Dein Geschenk-Binder beginnt hier" })).toBeVisible();
});

test("autosaves the binder description and each page note across reloads", async ({ page }) => {
  await page.goto("/app/");
  await createBinderFromStart(page, "Notizen Binder");

  const descriptionEditor = page.getByRole("group", { name: "Binderbeschreibung" });
  const pageNoteEditor = page.getByRole("group", { name: "Seitennotiz · Seite 1" });
  const description = descriptionEditor.getByRole("textbox", { name: "Binderbeschreibung" });
  const pageNote = pageNoteEditor.getByRole("textbox", { name: "Seitennotiz · Seite 1" });

  await expect(description).toHaveAttribute("maxlength", "500");
  await expect(pageNote).toHaveAttribute("maxlength", "2000");
  await description.fill("Erste Edition und Shadowless getrennt sammeln.");
  await expect(descriptionEditor.getByText("Lokal gespeichert")).toBeVisible();
  await pageNote.fill("Obere Reihe für Holo-Karten freihalten.");
  await pageNote.blur();
  await expect(pageNoteEditor.getByText("Lokal gespeichert")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("textbox", { name: "Binderbeschreibung" })).toHaveValue("Erste Edition und Shadowless getrennt sammeln.");
  await expect(page.getByRole("textbox", { name: "Seitennotiz · Seite 1" })).toHaveValue("Obere Reihe für Holo-Karten freihalten.");
});

test("renames binders and safely duplicates and deletes pages", async ({ page }) => {
  await mockCatalog(page);
  await page.goto("/app/");
  await createBinderFromStart(page, "Verwaltung Alt");

  await page.getByRole("button", { name: "Binder umbenennen" }).click();
  const renameDialog = page.getByRole("dialog", { name: "Binder umbenennen" });
  const nameInput = renameDialog.getByRole("textbox", { name: "Bindername" });
  await expect(nameInput).toHaveAttribute("maxlength", "100");
  await expect(nameInput).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(nameInput).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(renameDialog).toBeHidden();
  await expect(page.getByRole("button", { name: "Binder umbenennen" })).toBeFocused();
  await page.getByRole("button", { name: "Binder umbenennen" }).click();
  const reopenedRenameDialog = page.getByRole("dialog", { name: "Binder umbenennen" });
  const reopenedNameInput = reopenedRenameDialog.getByRole("textbox", { name: "Bindername" });
  await expect(reopenedNameInput).toBeFocused();
  await reopenedNameInput.fill("Verwaltung Neu");
  await reopenedRenameDialog.getByRole("button", { name: "Namen speichern" }).click();
  await expect(page.getByRole("heading", { name: "Verwaltung Neu", exact: true })).toBeVisible();

  await addCard(page, 1, "Bulbasaur", "Bulbasaur");
  const note = page.getByRole("textbox", { name: "Seitennotiz · Seite 1" });
  await note.fill("Diese Karten und Notiz gemeinsam duplizieren.");
  await note.blur();
  await expect(page.getByRole("group", { name: "Seitennotiz · Seite 1" }).getByText("Lokal gespeichert")).toBeVisible();

  await page.getByRole("button", { name: "Seite 1 duplizieren" }).click();
  await expect(page.getByText("2 / 2", { exact: true })).toBeVisible();
  await expect(page.getByRole("article", { name: "Bulbasaur, Slot 1" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Seitennotiz · Seite 2" })).toHaveValue("Diese Karten und Notiz gemeinsam duplizieren.");

  await page.getByRole("button", { name: "Seite 2 löschen" }).click();
  const deleteDialog = page.getByRole("dialog", { name: "Seite 2 wirklich löschen?" });
  await expect(deleteDialog).toContainText("1 geplante Karte wird dauerhaft");
  await expect(deleteDialog).toContainText("Auch die Seitennotiz wird gelöscht");
  await deleteDialog.getByRole("button", { name: "Seite löschen" }).click();
  await expect(page.getByText("1 / 1", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Seite 1 löschen" })).toBeDisabled();

  await page.reload();
  await expect(page.getByRole("heading", { name: "Verwaltung Neu", exact: true })).toBeVisible();
  await expect(page.getByText("1 / 1", { exact: true })).toBeVisible();
  await expect(page.getByRole("article", { name: "Bulbasaur, Slot 1" })).toBeVisible();
});

test("names and reorders pages, then duplicates and sorts binders", async ({ page }) => {
  await page.goto("/app/");
  await createBinderFromStart(page, "Sortierbasis");

  await page.getByRole("button", { name: "+ Seite" }).click();
  await page.getByRole("button", { name: "Seite 2 benennen" }).click();
  const pageNameDialog = page.getByRole("dialog", { name: "Seite 2 benennen" });
  const pageTitle = pageNameDialog.getByRole("textbox", { name: "Seitentitel" });
  await expect(pageTitle).toHaveAttribute("maxlength", "80");
  await pageTitle.fill("Showcase");
  await pageNameDialog.getByRole("button", { name: "Titel speichern" }).click();
  await expect(page.getByRole("heading", { name: "Showcase", exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: "Seite 2 nach vorne verschieben" }).click();
  await expect(page.getByText("1 / 2", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Showcase", exact: true }).first()).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Showcase", exact: true }).first()).toBeVisible();

  // The start screen also shows three example articles; only the shelf labelled "Binder auswählen" holds binders.
  const binderCards = page.locator('[aria-label="Binder auswählen"]').getByRole("article");
  await page.getByRole("button", { name: "Meine Binder", exact: true }).first().click();
  await page.getByRole("button", { name: "Sortierbasis duplizieren" }).click();
  await expect(binderCards.filter({ hasText: "Sortierbasis (Kopie)" })).toHaveCount(1);
  await page.getByRole("button", { name: "Sortierbasis (Kopie) nach hinten verschieben" }).click();
  await expect(binderCards.nth(0)).toContainText("Sortierbasis");
  await expect(binderCards.nth(1)).toContainText("Sortierbasis (Kopie)");

  await page.reload();
  await page.getByRole("button", { name: "Meine Binder", exact: true }).first().click();
  await expect(binderCards).toHaveCount(2);
  await expect(binderCards.nth(0)).toContainText("Sortierbasis");
  await expect(binderCards.nth(1)).toContainText("Sortierbasis (Kopie)");

  await binderCards.nth(1).getByRole("button").first().click();
  await expect(page.getByRole("heading", { name: "Showcase", exact: true }).first()).toBeVisible();
  await expect(page.getByText("1 / 2", { exact: true })).toBeVisible();
});

test("detects a binder update from another tab and reloads the current revision", async ({
  context,
  page,
}) => {
  await page.goto("/app/");
  await createBinderFromStart(page, "Multi-Tab Binder");

  const secondTab = await context.newPage();
  await secondTab.goto("/app/");
  await expect(secondTab.getByRole("heading", { name: "Multi-Tab Binder", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "+ Seite" }).click();
  await expect(secondTab.getByText(/anderen Tab geändert/)).toBeVisible();
  await secondTab.getByRole("button", { name: "Aktuellen Stand laden" }).click();
  await expect(secondTab.getByText("1 / 2", { exact: true })).toBeVisible();
});

test("confirms a lossless layout change and keeps mouse drag optional", async ({ page }) => {
  await mockCatalog(page);
  await page.goto("/app/");
  await createBinderFromStart(page, "Layout Binder");
  await addCard(page, 1, "Bulbasaur", "Bulbasaur");
  await addCard(page, 2, "Ivysaur", "Ivysaur");

  await page.getByLabel("Format").selectOption("2x2");
  const dialog = page.getByRole("dialog", { name: "3 × 3 auf 2 × 2 umstellen?" });
  await expect(dialog).toContainText("Keine Karte wird gelöscht");
  await expect(dialog).toContainText("2 Karten übernommen");
  await dialog.getByRole("button", { name: "Format anwenden" }).click();

  await expect(page.getByText(/2 × 2 · Seite 1 von 1/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Freier Platz \d+, Karte einsetzen/ })).toHaveCount(2);
  await expect(page.getByRole("article", { name: "Bulbasaur, Slot 1" })).toBeVisible();
  await expect(page.getByRole("article", { name: "Ivysaur, Slot 2" })).toBeVisible();

  const handle = page.getByRole("article", { name: "Bulbasaur, Slot 1" }).locator('[title="Mit der Maus ziehen"]');
  const target = page.getByRole("article", { name: "Ivysaur, Slot 2" });
  const targetHandle = target.locator('[title="Mit der Maus ziehen"]');
  const sourceBox = await handle.boundingBox();
  const targetBox = await targetHandle.boundingBox();
  expect(sourceBox).toBeTruthy();
  expect(targetBox).toBeTruthy();
  const sourceX = (sourceBox?.x ?? 0) + (sourceBox?.width ?? 0) / 2;
  const sourceY = (sourceBox?.y ?? 0) + (sourceBox?.height ?? 0) / 2;
  const targetX = (targetBox?.x ?? 0) + (targetBox?.width ?? 0) / 2;
  const targetY = (targetBox?.y ?? 0) + (targetBox?.height ?? 0) / 2;
  await page.mouse.move(sourceX, sourceY);
  await page.mouse.down();
  await page.mouse.move(sourceX + 10, sourceY, { steps: 3 });
  await expect(page.locator('[class*="dragOverlay"]')).toContainText("Bulbasaur");
  await page.mouse.move(targetX, targetY, { steps: 20 });
  await expect(page.locator('[data-drag-over="true"]')).toContainText("Ivysaur");
  await page.mouse.up();

  await expect(page.getByText("Karten wurden getauscht.")).toBeVisible();
  await expect(page.getByRole("article", { name: "Ivysaur, Slot 1" })).toBeVisible();
  await expect(page.getByRole("article", { name: "Bulbasaur, Slot 2" })).toBeVisible();
  await page.getByRole("article", { name: "Ivysaur, Slot 1" }).click();
  await expect(page.getByRole("button", { name: "Verschieben", exact: true })).toBeVisible();
});

test("shows a visible storage error when IndexedDB is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "indexedDB", { configurable: true, value: undefined });
  });
  await page.goto("/app/");

  await expect(page.getByText("IndexedDB is not available in this environment.")).toBeVisible();
  await expect(page.getByRole("banner").getByText("error", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Erneut versuchen" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Backup exportieren" }).first()).toBeVisible();
});

test("keeps the 3 x 3 grid usable on mobile and supports drawer focus and Escape", async ({
  page,
}) => {
  await mockCatalog(page);
  await page.setViewportSize({ height: 812, width: 375 });
  await page.goto("/app/");
  await createBinderFromStart(page, "Mobile Binder");

  await expect(page.getByRole("button", { name: /Freier Platz \d+, Karte einsetzen/ })).toHaveCount(9);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);

  await page.getByRole("button", { name: "Freier Platz 1, Karte einsetzen" }).click();
  const search = page.getByPlaceholder(SEARCH_PLACEHOLDER);
  await expect(search).toBeFocused();
  await search.fill("Bulbasaur");
  await resultTilesOf(page).getByRole("button", { name: "Details" }).click();
  await expect(page.getByRole("dialog", { name: "Karte prüfen" })).toBeVisible();
  // Escape steps back from the preview to the results, a second Escape closes the drawer.
  await page.keyboard.press("Escape");
  await expect(searchDialogOf(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(searchDialogOf(page)).toBeHidden();
  await expect(page.getByRole("button", { name: "Freier Platz 1, Karte einsetzen" })).toBeFocused();
});

test("offers Smart Search recovery, language choice and no mobile overflow", async ({ page }) => {
  await mockCatalog(page);
  await mockSemanticIndex(page);
  await page.setViewportSize({ height: 812, width: 375 });
  await page.goto("/app/");
  await createBinderFromStart(page, "Smart Search");
  await page.getByRole("button", { name: "Freier Platz 1, Karte einsetzen" }).click();
  const dialog = searchDialogOf(page);
  await dialog.getByRole("tab", { name: "Bildmotiv" }).click();
  const semanticInput = dialog.getByPlaceholder("Motiv beschreiben, z. B. Pokémon am Strand");
  await expect(semanticInput).toBeFocused();
  await semanticInput.fill("forest");
  await expect(dialog.getByText("Charizard", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
  await dialog.getByRole("button", { name: "Prüfen" }).click();
  const preview = page.getByRole("dialog", { name: "Karte prüfen" });
  await expect(preview.getByText("Kartensprache für den Binder")).toBeVisible();
  await preview.getByRole("button", { name: "Deutsch" }).click();
  await expect(preview.getByRole("button", { name: "Deutsch" })).toHaveAttribute("aria-pressed", "true");
  await openVariantOptions(preview);
  await preview.getByLabel("Ausführung der Karte").selectOption("holo");
  await preview.getByRole("button", { name: "Mit diesen Angaben einsetzen" }).click();
  await expect(page.getByRole("article", { name: "Glurak, Slot 1" })).toBeVisible();
});

test("offers a direct normal-search fallback when the Smart Search index fails", async ({ page }) => {
  await mockCatalog(page);
  await mockSemanticIndex(page, 503);
  await page.goto("/app/");
  await createBinderFromStart(page, "Smart Search Fehler");
  await page.getByRole("button", { name: "Freier Platz 1, Karte einsetzen" }).click();
  const dialog = searchDialogOf(page);
  await dialog.getByRole("tab", { name: "Bildmotiv" }).click();
  await expect(dialog.getByRole("alert")).toContainText("Motivindex konnte nicht geladen werden");
  await dialog.getByRole("button", { name: "Mit Name/Nummer suchen" }).click();
  await expect(dialog.getByPlaceholder(SEARCH_PLACEHOLDER)).toBeVisible();
});

test("searches German and English catalogs and labels the result language", async ({ page }) => {
  await mockCatalog(page);
  await page.goto("/app/");
  await createBinderFromStart(page, "Sprachsuche");

  await page.getByRole("button", { name: "Freier Platz 1, Karte einsetzen" }).click();
  await page.getByPlaceholder(SEARCH_PLACEHOLDER).fill("Glurak");
  const germanResult = resultTilesOf(page).filter({ hasText: "Glurak" });
  await expect(germanResult).toContainText("Grundset");
  await expect(germanResult).toContainText("DE · Nr. 4/102");
  await germanResult.getByRole("button", { name: "Details" }).click();

  const preview = page.getByRole("dialog", { name: "Karte prüfen" });
  await expect(page.getByRole("article", { name: "Glurak, Slot 1" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Freier Platz 1, Karte einsetzen" })).toBeVisible();
  await expect(preview).toContainText("Grundset");
  await expect(preview).toContainText("4/102");
  await expect(preview).toContainText("Bild auf Englisch");
  await expect(preview).toContainText("Katalog bestätigt: Holo, First Edition");
  await openVariantOptions(preview);
  await expect(preview.getByLabel("Druckvariante").locator('option[value="shadowless"]')).toHaveCount(0);
  await preview.getByLabel("Ausführung der Karte").selectOption("holo");
  await preview.getByLabel("Edition").selectOption("first-edition");
  await preview.getByRole("button", { name: "Mit diesen Angaben einsetzen" }).click();

  const card = page.getByRole("article", { name: "Glurak, Slot 1" });
  await expect(card).toBeVisible();
  await expect(card).toContainText("Holo · First Edition · Mit Schatten / Standard");
});

test("keeps Pocket cards out of the physical binder search", async ({ page }) => {
  await mockCatalog(page);
  await page.goto("/app/");
  await createBinderFromStart(page, "Physische Suche");

  await page.getByRole("button", { name: "Freier Platz 1, Karte einsetzen" }).click();
  await languageFilterOf(page).getByRole("button", { name: "EN", exact: true }).click();
  await page.getByPlaceholder(SEARCH_PLACEHOLDER).fill("Mixed");

  const searchDialog = searchDialogOf(page);
  await expect(resultTilesOf(page)).toHaveCount(1);
  await expect(searchDialog.getByText("Bulbasaur", { exact: true })).toBeVisible();
  await expect(searchDialog.getByText("Pocket card", { exact: true })).toHaveCount(0);
  await expect(searchDialog.getByText(/Pocket-Karten können nicht/)).toHaveCount(0);
});

test("creates an editable Gift Binder from the local-first wizard", async ({ page }) => {
  await mockCatalog(page);
  await page.route("https://api.tcgdex.net/v2/en/cards?*", async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get("name")?.toLowerCase() !== "pikachu") return route.fallback();
    const cards = Array.from({ length: 9 }, (_, index) => ({ id: `swsh1-${index + 1}`, localId: String(index + 1), name: `Pikachu ${index + 1}` }));
    await route.fulfill({ body: JSON.stringify(cards), headers, status: 200 });
  });
  await page.route("https://api.tcgdex.net/v2/en/cards/swsh1-*", async (route) => {
    const id = new URL(route.request().url()).pathname.split("/").pop() ?? "swsh1-1";
    const localId = id.split("-").pop() ?? "1";
    await route.fulfill({
      body: JSON.stringify({
        id,
        localId,
        name: `Pikachu ${localId}`,
        category: "Pokemon",
        variants: { firstEdition: false, holo: true, normal: false, reverse: false, wPromo: false },
        set: { cardCount: { official: 202 }, id: "swsh1", name: "Sword & Shield" },
      }),
      headers,
      status: 200,
    });
  });
  await page.route("https://api.tcgdex.net/v2/en/sets/swsh1", async (route) => {
    await route.fulfill({
      body: JSON.stringify({ id: "swsh1", name: "Sword & Shield", serie: { id: "swsh", name: "Sword & Shield" } }),
      headers,
      status: 200,
    });
  });
  await page.setViewportSize({ height: 900, width: 375 });
  await page.goto("/app/");
  await page.getByRole("button", { name: "Geschenk-Binder gestalten" }).click();
  await expect(page.getByRole("heading", { name: "Dein Geschenk-Binder beginnt hier" })).toBeVisible();
  await page.getByLabel("Kartensprache").selectOption("en");
  await page.getByRole("button", { name: /Binder-Seite ansehen/ }).click();
  await expect(page.getByText("9 / 9")).toBeVisible();
  await expect(page.getByText(/den endgültigen Preis siehst du beim Kartenanbieter/i)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
  await page.getByRole("button", { name: "Weiter zum Einkauf" }).click();
  await expect(page.getByRole("heading", { name: /Geschenk · Pikachu/ })).toBeVisible();
  await expect(page.getByText(/Die Kartenpreise sind Schätzwerte; Versand und Steuern sind nicht enthalten/i)).toBeVisible();
  await expect(page.getByText(/^Vault X 9-Pocket Binder/)).toBeVisible();
  await expect(page.getByText("17,99 €", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Preis geprüft am 19.10.2026", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/Werbelink: Your Card Binder kann bei einem Kauf eine Provision erhalten/i).first()).toBeVisible();
  await expect(page.getByText(/9-Pocket · Platz für bis zu 360 Karten/i).first()).toBeVisible();
  await expect(page.getByText("Alle passen zu deinem Plan")).toBeVisible();

  const binderLinks = page.getByRole("link", { name: /Bei Amazon bestellen/i });
  await expect(binderLinks).toHaveCount(6);
  const binderTargets = await binderLinks.evaluateAll((links) => links.map((link) => (link as HTMLAnchorElement).href));
  expect(binderTargets.map((href) => new URL(href).pathname)).toEqual([
    "/dp/B01MTYY0IB",
    "/dp/B00VBQHKFU",
    "/dp/B0GRHHKR8G",
    "/dp/B0FT4T733F",
    "/dp/B0DK7Y5QFY",
    "/dp/B09CLS5XNB",
  ]);
  for (const href of binderTargets) {
    const target = new URL(href);
    expect(target.origin).toBe("https://www.amazon.de");
    expect(target.searchParams.get("tag")).toBe("cardbinder-21");
  }

  await page.getByRole("button", { name: "Karten besorgen" }).click();
  const missingCards = page.getByRole("region", { name: "Fehlende Karten" });
  await expect(missingCards).toBeVisible();
  await expect(missingCards.getByText(/9 Positionen · gekauft wird erst beim Anbieter/i)).toBeVisible();
  // Gift buyers get the plain-language Cardmarket guide; the region question is one click away.
  await expect(missingCards.getByRole("heading", { name: "So bekommst du die Karten" })).toBeVisible();
  await expect(missingCards.getByText("Du kaufst bei Cardmarket.")).toBeVisible();
  await expect(missingCards.getByRole("heading", { name: "Wo wohnst du?" })).toBeVisible();
  await expect(missingCards.getByRole("button", { name: "Europa & UK · Cardmarket empfohlen" })).toHaveCount(0);
  await missingCards.getByRole("button", { name: "USA & Kanada · TCGplayer", exact: true }).click();
  await expect(missingCards.getByRole("button", { name: "Europa & UK · Cardmarket empfohlen" })).toBeVisible();
  await expect(missingCards.getByRole("button", { name: "USA & Kanada · TCGplayer empfohlen" })).toBeVisible();
  await missingCards.getByRole("button", { name: "Fehlkartenansicht schließen" }).click();
  // Closing the purchase view returns to the finished plan, not to the binder editor.
  await expect(page.getByRole("heading", { name: "Dein Geschenk-Binder ist fertig geplant" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Geschenk · Pikachu/ })).toBeVisible();
  await page.getByRole("button", { name: "Binder bearbeiten" }).click();
  await expect(page.getByRole("article", { name: "Pikachu 1, Slot 1" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("article", { name: "Pikachu 1, Slot 1" })).toBeVisible();

  // Coming back later: the saved gift binder says what is still to do and where to continue.
  const continueCard = page.getByRole("region", { name: "So geht es mit deinem Geschenk weiter" });
  await expect(continueCard).toBeVisible();
  await expect(continueCard.getByText(/Es fehlen noch/)).toBeVisible();
  await expect(continueCard.getByRole("heading", { name: /Binder auswählen und bestellen/ })).toBeVisible();
  await continueCard.getByRole("button", { name: "Karten besorgen" }).click();
  await expect(page.getByRole("heading", { name: "So bekommst du die Karten" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Wo wohnst du?" })).toBeVisible();
});

test("offers a lean gift entry without collector navigation", async ({ page }) => {
  await mockCatalog(page);
  await page.setViewportSize({ height: 812, width: 375 });
  await page.goto("/geschenk/");

  await expect(page.getByRole("heading", { name: "Ein Binder voller Karten vom Lieblings-Pokémon." })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Your Card Binder Navigation" })).toHaveCount(0);
  await expect(page.getByRole("tab")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Ich sammle selbst" })).toHaveAttribute("href", "/app/");
  await expect(page.getByRole("link", { name: /Anleitung: Karten bei Cardmarket kaufen/ })).toHaveAttribute("href", "/anleitung/cardmarket/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);

  // The first click can land before the page is interactive on a loaded machine: retry the click until the wizard shows.
  await expect(async () => {
    await page.getByRole("button", { name: "Geschenk-Binder gestalten" }).click({ timeout: 2000 });
    await expect(page.getByRole("heading", { name: "Dein Geschenk-Binder beginnt hier" })).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 20000 });
  await expect(page.getByRole("link", { name: /Anleitung: Karten bei Cardmarket kaufen/ })).toBeVisible();
  await page.getByRole("radio", { name: "Ich kenne mich nicht aus" }).check();
  await expect(page.getByRole("radio", { name: "Evoli" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Lieblings-Pokémon" })).toHaveCount(0);
});

test("shows the illustrated Cardmarket instructions without horizontal overflow on a phone", async ({ page }) => {
  await page.setViewportSize({ height: 812, width: 375 });
  await page.goto("/anleitung/cardmarket/");

  await expect(page.getByRole("heading", { level: 1, name: /Karten bei Cardmarket kaufen/ })).toBeVisible();
  await page.getByRole("link", { name: "Den Kartenzustand für alle Karten einstellen" }).click();
  await expect(page.getByRole("heading", { name: /Den Kartenzustand für alle Karten einstellen/ })).toBeInViewport();
  await expect(page.getByRole("table", { name: "Welchen Wert du bei Cardmarket einstellst" })).toBeVisible();
  const wide = await page.evaluate(() => [...document.querySelectorAll("body *")].filter((element) => element.getBoundingClientRect().right > 376).length);
  expect(wide).toBe(0);
});

test("sets, edits and persists the minimum condition for marketplace handoff", async ({ page }) => {
  await mockCatalog(page);
  await page.goto("/app/");
  await createBinderFromStart(page, "Zustandswunsch");

  await page.getByRole("button", { name: "Freier Platz 1, Karte einsetzen" }).click();
  await page.getByPlaceholder(SEARCH_PLACEHOLDER).fill("Ivysaur");
  await resultTilesOf(page).filter({ hasText: "Ivysaur" }).getByRole("button", { name: "Details" }).click();
  const preview = page.getByRole("dialog", { name: "Karte prüfen" });
  await openVariantOptions(preview);
  await preview.getByLabel("Ausführung der Karte").selectOption("normal");
  await preview.getByLabel("Mindestzustand beim Kauf").selectOption("near-mint");
  await preview.getByRole("button", { name: "Mit diesen Angaben einsetzen" }).click();

  // Placeholders for the card that is planned but not owned yet: text only, visible only when printing.
  await page.getByRole("button", { name: "Platzhalter drucken" }).click();
  await expect(page.getByRole("dialog", { name: "Platzhalter drucken" })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Platzhalter auf 1 Seite" })).toBeVisible();
  await expect(page.locator("[data-placeholder-print]")).toBeHidden();
  await page.emulateMedia({ media: "print" });
  await expect(page.locator("[data-placeholder-print]")).toBeVisible();
  await expect(page.locator("[data-placeholder-print]")).toContainText("Ivysaur");
  await expect(page.locator("[data-placeholder-print] img")).toHaveCount(0);
  await page.emulateMedia({ media: "screen" });
  await page.getByRole("button", { name: "Schließen", exact: true }).first().click();
  await expect(page.getByText("Fortschritt nach Set (1)")).toBeVisible();
  await page.getByRole("article", { name: "Ivysaur, Slot 1" }).click();
  await expect(page.getByRole("definition").filter({ hasText: "Wie neu" })).toBeVisible();
  await page.getByRole("button", { name: "Version & Zustand festlegen" }).click();
  const details = page.getByRole("dialog", { name: /Version und Mindestzustand/ });
  await details.getByLabel("Mindestzustand beim Kauf").selectOption("lightly-played");
  await details.getByRole("button", { name: "Angaben speichern" }).click();
  await expect(page.getByRole("definition").filter({ hasText: "Gebraucht – sichtbare Spuren okay" })).toBeVisible();

  await page.reload();
  await page.getByRole("article", { name: "Ivysaur, Slot 1" }).click();
  await expect(page.getByRole("definition").filter({ hasText: "Gebraucht – sichtbare Spuren okay" })).toBeVisible();
  await openMissingCards(page, 1);
  const missingCards = page.getByRole("region", { name: "Fehlende Karten" });
  await missingCards.getByRole("button", { name: "Andere Region · Versand prüfen" }).click();
  await expect(missingCards.getByText("Cardmarket und CardTrader im Vergleich")).toHaveCount(0);
  await missingCards.getByRole("button", { name: "CardTrader", exact: true }).click();
  await expect(missingCards.getByRole("heading", { name: "1 Karte bei CardTrader kaufen" })).toBeVisible();
  await expect(missingCards.getByText("Schritt 1 von 4")).toBeVisible();
  await missingCards.getByRole("button", { name: /^Weiter/ }).click();
  await expect(missingCards.getByRole("heading", { name: "Karten bei CardTrader hinzufügen" })).toBeVisible();
  await expect(missingCards.getByLabel("CardTrader-Token")).toBeHidden();
  await missingCards.getByText("Für Fortgeschrittene: Liste automatisch anlegen").click();
  await expect(missingCards.getByLabel("CardTrader-Token")).toBeVisible();
  await missingCards.getByRole("button", { name: /^Weiter/ }).click();
  const optimizer = new URL(await missingCards.getByRole("link", { name: /Shop Optimizer öffnen/ }).getAttribute("href") ?? "");
  expect(optimizer.origin + optimizer.pathname).toBe("https://www.cardtrader.com/en/wishlists/new");
  expect(optimizer.searchParams.get("share_code")).toBe("yourcardbinder");
  await expect(missingCards.getByText(/Werbelink: Your Card Binder kann bei einem Kauf eine Provision erhalten/)).toBeVisible();
  await missingCards.getByRole("button", { name: "Cardmarket", exact: true }).click();
  await missingCards.getByText("Falls etwas nicht klappt").click();
  await expect(missingCards.getByRole("textbox", { name: "Cardmarket-Decklistenvorschau" })).toHaveValue("1x Ivysaur Vine Whip Poisonpowder");
  await expect(missingCards.getByText("Zustand: Gebraucht", { exact: true })).toBeVisible();
});

test("filters equal card names by language and balances the combined results", async ({ page }) => {
  await mockCatalog(page);
  await page.goto("/app/");
  await createBinderFromStart(page, "Sprachfilter");

  await page.getByRole("button", { name: "Freier Platz 1, Karte einsetzen" }).click();
  await page.getByPlaceholder(SEARCH_PLACEHOLDER).fill("Pikachu");
  const results = resultTilesOf(page).filter({ hasText: "Pikachu" });
  await expect(results).toHaveCount(2);
  await expect(results.nth(0)).toContainText("Grundset");
  await expect(results.nth(0)).toContainText("DE · Nr. 58/102");
  await expect(results.nth(1)).toContainText("Base Set");
  await expect(results.nth(1)).toContainText("EN · Nr. 58/102");

  await languageFilterOf(page).getByRole("button", { name: "EN", exact: true }).click();
  await expect(results).toHaveCount(1);
  await expect(results).toContainText("Base Set");
  await expect(results).toContainText("EN · Nr. 58/102");
  await expect(results).not.toContainText("DE · Nr. 58/102");

  await languageFilterOf(page).getByRole("button", { name: "DE", exact: true }).click();
  await expect(results).toHaveCount(1);
  await expect(results).toContainText("Grundset");
  await expect(results).toContainText("DE · Nr. 58/102");
  await expect(results).not.toContainText("EN · Nr. 58/102");
});

test("browses a selected set and loads catalog results page by page", async ({ page }) => {
  await mockCatalog(page);
  await page.goto("/app/");
  await createBinderFromStart(page, "Setfilter");

  await page.getByRole("button", { name: "Freier Platz 1, Karte einsetzen" }).click();
  await languageFilterOf(page).getByRole("button", { name: "EN", exact: true }).click();
  const searchDialog = searchDialogOf(page);
  // Series, set and sorting sit behind "Weitere Filter".
  await searchDialog.getByText("Weitere Filter", { exact: true }).click();
  await page.locator("#card-series-filter").selectOption("base");
  await page.locator("#card-set-filter").selectOption("base1");

  await expect(resultTilesOf(page)).toHaveCount(1);
  await expect(resultTilesOf(page)).toContainText("Base Set");
  await expect(resultTilesOf(page)).toContainText("EN · Nr. 1/102");

  await page.getByPlaceholder(SEARCH_PLACEHOLDER).fill("Bulk");
  await expect(resultTilesOf(page)).toHaveCount(40);
  await expect(searchDialog.getByRole("button", { name: "Mehr laden" })).toBeVisible();
  await searchDialog.getByRole("button", { name: "Mehr laden" }).click();
  await expect(resultTilesOf(page)).toHaveCount(41);
  await expect(searchDialog.getByText("Set card 41", { exact: true })).toBeVisible();
  await expect(searchDialog.getByRole("button", { name: "Mehr laden" })).toBeHidden();
});

test("finds and displays an exact full collector number", async ({ page }) => {
  await mockCatalog(page);
  await page.goto("/app/");
  await createBinderFromStart(page, "Nummernsuche");

  await page.getByRole("button", { name: "Freier Platz 1, Karte einsetzen" }).click();
  await page.getByPlaceholder(SEARCH_PLACEHOLDER).fill("Charizard 04/102");
  const result = resultTilesOf(page).filter({ hasText: "Charizard" });
  await expect(result).toHaveCount(1);
  await expect(result).toContainText("Grundset");
  await expect(result).toContainText("EN · Nr. 4/102");
  await result.getByRole("button", { name: "Details" }).click();
  const preview = page.getByRole("dialog", { name: "Karte prüfen" });
  await expect(preview).toContainText("4/102");
  await openVariantOptions(preview);
  await expect(preview.getByLabel("Druckvariante").locator('option[value="shadowless"]')).toHaveCount(1);
  await preview.getByRole("button", { name: "Mit diesen Angaben einsetzen" }).click();

  const card = page.getByRole("article", { name: "Charizard, Slot 1" });
  await expect(card).toContainText("Grundset · 4/102");

  await openMissingCards(page, 1);
  const missingCards = page.getByRole("region", { name: "Fehlende Karten" });
  await missingCards.getByRole("button", { name: "Andere Region · Versand prüfen" }).click();
  await missingCards.getByRole("button", { name: "TCGplayer", exact: true }).click();
  await missingCards.getByText("Falls etwas nicht klappt").click();
  await expect(missingCards.getByRole("textbox", { name: "TCGplayer Mass-Entry-Vorschau" })).toHaveValue(
    "1 Charizard [BS] 004/102",
  );
  // Base Set Charizard carries TCGplayer product 42382 in the CardTrader data (opened by hand on 2026-10-22).
  await expect(missingCards.getByRole("link", { name: "TCGplayer-Produktseite öffnen: 1× Charizard" })).toHaveAttribute("href", "https://www.tcgplayer.com/product/42382");
  const tcgplayerLink = missingCards.getByRole("link", { name: "1 Karte kopieren & TCGplayer öffnen" });
  const tcgplayerUrl = new URL(await tcgplayerLink.getAttribute("href") ?? "");
  expect(tcgplayerUrl.searchParams.get("c")).toBe("1 Charizard [BS] 004/102");
  expect(tcgplayerUrl.searchParams.get("productline")).toBe("Pokemon");

  await missingCards.getByRole("button", { name: "Cardmarket", exact: true }).click();
  await expect(missingCards.getByRole("link", { name: "1 Karte kopieren & Cardmarket öffnen" })).toHaveAttribute(
    "href",
    "https://www.cardmarket.com/de/Pokemon/Wants",
  );
  await missingCards.getByText("Falls etwas nicht klappt").click();
  // Base Set Charizard has exactly one Cardmarket product id in the CardTrader data, so it gets a direct product page
  // (the id was opened by hand on 2026-10-21) instead of a prefilled search.
  await expect(missingCards.getByRole("link", { name: /Produktseite öffnen/ })).toHaveAttribute(
    "href",
    "https://www.cardmarket.com/en/Pokemon/Products?idProduct=273699",
  );
  await expect(missingCards.getByText(/ID laut CardTrader/)).toBeVisible();
  await expect(missingCards.getByRole("link", { name: /Karte suchen/ })).toHaveCount(0);
});

test("exports the verified Tornupto and Blaine's Charizard identities to TCGplayer", async ({ page }) => {
  await mockCatalog(page);
  await page.goto("/app/");
  await createBinderFromStart(page, "TCGplayer Mapping");

  await addCard(page, 1, "Tornupto", "Tornupto");
  await addCard(page, 2, "Blaine's Charizard", "Blaine's Charizard");

  await openMissingCards(page, 2);
  const missingCards = page.getByRole("region", { name: "Fehlende Karten" });
  await missingCards.getByRole("button", { name: "Andere Region · Versand prüfen" }).click();
  await missingCards.getByRole("button", { name: "TCGplayer", exact: true }).click();

  await expect(missingCards.getByText("2 übergabebereit · 2 Produktzuordnungen · 0 prüfen")).toBeVisible();
  await missingCards.getByText("Falls etwas nicht klappt").click();
  await expect(missingCards.getByRole("textbox", { name: "TCGplayer Mass-Entry-Vorschau" })).toHaveValue(
    "1 Blaine's Charizard [G2] 002/132\n1 Typhlosion (17) [N1] 017/111",
  );
  await missingCards.getByText("Alle fehlenden Karten als Liste (2)").click();
  await expect(missingCards.getByRole("region", { name: "Neo Genesis · DE" }).getByText("Nr. 17/111")).toBeVisible();
  await expect(missingCards.getByRole("region", { name: "Gym Challenge · EN" }).getByText("Nr. 2/132")).toBeVisible();

  await missingCards.getByRole("button", { name: "Cardmarket", exact: true }).click();
  await missingCards.getByText("Falls etwas nicht klappt").click();
  await expect(missingCards.getByRole("textbox", { name: "Cardmarket-Decklistenvorschau" })).toHaveValue(
    "1x Blaine's Charizard Roaring Flames Flame Jet\n1x Typhlosion Fire Recharge Flame Burst",
  );
});

test("offers a CardTrader supplement card that TCGdex does not list, with its own number and image", async ({ page }) => {
  await mockCatalog(page);
  await mockSupplements(page, {
    rc: { setName: "Radiant Collection", expansionId: 1931, total: 25, cards: [{ id: 500007, n: "0RC7/RC25", name: "Pikachu", img: "500007/preview_pikachu-rc7.jpg" }] },
  });
  await page.goto("/app/");
  await createBinderFromStart(page, "Ergänzung");

  await page.getByRole("button", { name: "Freier Platz 1, Karte einsetzen" }).click();
  await page.getByPlaceholder(SEARCH_PLACEHOLDER).fill("Pikachu");
  const supplement = resultTilesOf(page).filter({ hasText: "Radiant Collection" });
  await expect(supplement).toHaveCount(1);
  await expect(supplement).toContainText("RC7/RC25");
  await supplement.getByRole("button", { name: "Details" }).click();

  const preview = page.getByRole("dialog", { name: "Karte prüfen" });
  await expect(preview).toContainText("Pikachu");
  await expect(preview).toContainText("RC7/RC25");
  await openVariantOptions(preview);
  await preview.getByLabel("Ausführung der Karte").selectOption("holo");
  await preview.getByRole("button", { name: "Mit diesen Angaben einsetzen" }).click();

  const card = page.getByRole("article", { name: "Pikachu, Slot 1" });
  await expect(card).toBeVisible();
  await expect(card).toContainText("Radiant Collection · RC7/RC25");
  await page.reload();
  await expect(page.getByRole("article", { name: "Pikachu, Slot 1" })).toContainText("Radiant Collection · RC7/RC25");
});


test("opens a gift proposal that arrives in a link and lets the family change it", async ({ page }) => {
  await mockCatalog(page);
  const proposal = { v: 1, s: "Pikachu, Glurak", n: 9, l: "de", c: "EUR", b: 5000, k: [
    ["base1-58", "de", { finish: "normal", edition: "unlimited", printing: "shadowed" }],
    ["base1-4", "de", { finish: "holo", edition: "unlimited", printing: "shadowed" }],
  ] };
  await page.goto(`/geschenk/#vorschlag=${Buffer.from(JSON.stringify(proposal)).toString("base64url")}`);

  await expect(page.getByText(/Dieser Vorschlag wurde per Link geteilt/)).toBeVisible({ timeout: 20000 });
  await expect(page.getByText(/^[1-9] \/ 9$/).first()).toBeVisible();
  expect(new URL(page.url()).hash).toBe("");
  await expect(page.getByRole("button", { name: /Vorschlag als Link teilen/ })).toBeVisible();
});

test("guides a first visit to a small starter set and offers the children's page", async ({ page }) => {
  await mockCatalog(page);
  await page.goto("/app/");

  await expect(page.getByRole("heading", { name: /Neu hier\? Wofür brauchst du den Binder/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Ich bin ein Kind/ })).toHaveAttribute("href", "/kinder/");
  await page.getByRole("button", { name: /Ich baue eine Sammlung auf/ }).click();
  await expect(page.getByRole("list", { name: "Sets zum Start" }).getByRole("button")).toHaveCount(5);
  await page.getByRole("button", { name: /Celebrations/ }).click();
  await expect(page.getByRole("heading", { name: "Binder mit einem Set erstellen" })).toBeVisible();
});

test("lets a child pick a Pokémon and shows the wish list page without prices", async ({ page }) => {
  await mockCatalog(page);
  await page.goto("/kinder/");

  await expect(page.getByRole("heading", { name: "Dein Pokémon-Wunschzettel" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Pokémon auswählen" }).getByRole("button").first()).toBeVisible();
  await expect(page.getByText("Hier wird nichts gekauft")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("offers Pokémon types and special cards next to the picture themes", async ({ page }) => {
  await mockCatalog(page);
  await page.goto("/geschenk/?start=1");
  await page.getByRole("radio", { name: "Ein Bildmotiv" }).check();

  await expect(page.getByRole("heading", { name: "Nach Pokémon-Typ" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Besondere Karten" })).toBeVisible();
  await expect(page.getByRole("radio", { name: /Feuer-Pokémon/ })).toBeAttached();
  await expect(page.getByRole("radio", { name: /Klassische Holos/ })).toBeAttached();
  expect((await (await page.request.get("/data/semantic/curated-collections-v1.json")).json()).collections["type-fire"].length).toBeGreaterThanOrEqual(18);
});
