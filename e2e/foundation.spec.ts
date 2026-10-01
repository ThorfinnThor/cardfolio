import { readFile } from "node:fs/promises";

import { expect, type Page, test } from "@playwright/test";

const headers = {
  "access-control-allow-origin": "*",
  "content-type": "application/json",
};

async function mockCatalog(page: Page) {
  await page.route("https://api.tcgdex.net/**", async (route) => {
    const url = new URL(route.request().url());

    if (url.pathname.endsWith("/cards")) {
      const query = url.searchParams.get("name")?.toLowerCase();
      const language = url.pathname.split("/")[2];
      const pageNumber = Number(url.searchParams.get("pagination:page") ?? "1");
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
            ? [{ id: "base1-2", localId: "2", name: "Ivysaur" }]
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
        }),
        headers,
        status: 200,
      });
      return;
    }

    if (url.pathname.endsWith("/cards/base1-2")) {
      await route.fulfill({
        body: JSON.stringify({
          id: "base1-2",
          localId: "2",
          name: "Ivysaur",
          category: "Pokemon",
          attacks: [{ name: "Vine Whip" }, { name: "Poisonpowder" }],
          set: { cardCount: { official: 102 }, id: "base1", name: "Base Set" },
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

async function addCard(page: Page, slot: number, query: string, cardName: string) {
  await page.getByRole("button", { name: `Freier Platz ${slot}, Karte einsetzen` }).click();
  await page.getByPlaceholder("Name oder Nummer, z. B. Glurak 4/102").fill(query);
  await page
    .getByRole("listitem")
    .filter({ hasText: cardName })
    .getByRole("button", { name: "Prüfen" })
    .click();
  const preview = page.getByRole("dialog", { name: "Karte prüfen" });
  await expect(preview).toContainText(cardName);
  const finish = preview.getByLabel("Finish");
  if (await finish.inputValue() === "unspecified") await finish.selectOption("normal");
  await preview.getByLabel("Edition").selectOption("unlimited");
  await preview.getByRole("button", { name: "Mit diesen Angaben einsetzen" }).click();
  await expect(page.getByRole("article", { name: `${cardName}, Slot ${slot}` })).toBeVisible();
}

test("completes the local-first binder, ownership, missing-list, and backup flow", async ({
  browser,
  page,
}) => {
  await mockCatalog(page);
  await page.goto("/");

  await page.getByLabel("Bindername").fill("E2E Binder");
  await page.getByRole("button", { name: "Erstellen", exact: true }).click();

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

  await page.getByRole("button", { name: /Fehlende Karten \(\d+\)/ }).click();
  const missingCards = page.getByRole("region", { name: "Fehlende Karten" });
  await expect(missingCards.getByText("Ivysaur", { exact: true })).toBeVisible();
  await missingCards.getByRole("button", { name: "Cardmarket" }).click();
  await expect(missingCards.getByRole("heading", { name: "Cardmarket Deckliste" })).toBeVisible();
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
  await cleanPage.goto("/");
  await expect(cleanPage.getByRole("heading", { name: "Noch kein Binder" })).toBeVisible();
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

test("autosaves the binder description and each page note across reloads", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Bindername").fill("Notizen Binder");
  await page.getByRole("button", { name: "Erstellen", exact: true }).click();

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
  await page.goto("/");
  await page.getByLabel("Bindername").fill("Verwaltung Alt");
  await page.getByRole("button", { name: "Erstellen", exact: true }).click();

  await page.getByRole("button", { name: "Binder umbenennen" }).click();
  const renameDialog = page.getByRole("dialog", { name: "Binder umbenennen" });
  const nameInput = renameDialog.getByRole("textbox", { name: "Bindername" });
  await expect(nameInput).toHaveAttribute("maxlength", "100");
  await nameInput.fill("Verwaltung Neu");
  await renameDialog.getByRole("button", { name: "Namen speichern" }).click();
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
  await page.goto("/");
  await page.getByLabel("Bindername").fill("Sortierbasis");
  await page.getByRole("button", { name: "Erstellen", exact: true }).click();

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

  await page.getByRole("button", { name: "Meine Binder", exact: true }).first().click();
  await page.getByRole("button", { name: "Sortierbasis duplizieren" }).click();
  await expect(page.getByRole("article").filter({ hasText: "Sortierbasis (Kopie)" })).toHaveCount(1);
  await page.getByRole("button", { name: "Sortierbasis (Kopie) nach hinten verschieben" }).click();
  const reorderedCards = page.getByRole("article");
  await expect(reorderedCards.nth(0)).toContainText("Sortierbasis");
  await expect(reorderedCards.nth(1)).toContainText("Sortierbasis (Kopie)");

  await page.reload();
  await page.getByRole("button", { name: "Meine Binder", exact: true }).first().click();
  const binderCards = page.getByRole("article");
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
  await page.goto("/");
  await page.getByLabel("Bindername").fill("Multi-Tab Binder");
  await page.getByRole("button", { name: "Erstellen", exact: true }).click();

  const secondTab = await context.newPage();
  await secondTab.goto("/");
  await expect(secondTab.getByRole("heading", { name: "Multi-Tab Binder", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "+ Seite" }).click();
  await expect(secondTab.getByText(/anderen Tab geändert/)).toBeVisible();
  await secondTab.getByRole("button", { name: "Aktuellen Stand laden" }).click();
  await expect(secondTab.getByText("1 / 2", { exact: true })).toBeVisible();
});

test("confirms a lossless layout change and keeps mouse drag optional", async ({ page }) => {
  await mockCatalog(page);
  await page.goto("/");
  await page.getByLabel("Bindername").fill("Layout Binder");
  await page.getByRole("button", { name: "Erstellen", exact: true }).click();
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
  await page.goto("/");

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
  await page.goto("/");
  await page.getByLabel("Bindername").fill("Mobile Binder");
  await page.getByRole("button", { name: "Erstellen", exact: true }).click();

  await expect(page.getByRole("button", { name: /Freier Platz \d+, Karte einsetzen/ })).toHaveCount(9);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);

  await page.getByRole("button", { name: "Freier Platz 1, Karte einsetzen" }).click();
  const search = page.getByPlaceholder("Name oder Nummer, z. B. Glurak 4/102");
  await expect(search).toBeFocused();
  await search.fill("Bulbasaur");
  await page.getByRole("button", { name: "Prüfen" }).click();
  await expect(page.getByRole("dialog", { name: "Karte prüfen" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Karte suchen" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Karte suchen" })).toBeHidden();
  await expect(page.getByRole("button", { name: "Freier Platz 1, Karte einsetzen" })).toBeFocused();
});

test("offers Smart Search recovery, language choice and no mobile overflow", async ({ page }) => {
  await mockCatalog(page);
  await mockSemanticIndex(page);
  await page.setViewportSize({ height: 812, width: 375 });
  await page.goto("/");
  await page.getByLabel("Bindername").fill("Smart Search");
  await page.getByRole("button", { name: "Erstellen", exact: true }).click();
  await page.getByRole("button", { name: "Freier Platz 1, Karte einsetzen" }).click();
  const dialog = page.getByRole("dialog", { name: "Karte suchen" });
  await dialog.getByRole("button", { name: "Motiv im Artwork" }).click();
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
});

test("offers a direct normal-search fallback when the Smart Search index fails", async ({ page }) => {
  await mockCatalog(page);
  await mockSemanticIndex(page, 503);
  await page.goto("/");
  await page.getByLabel("Bindername").fill("Smart Search Fehler");
  await page.getByRole("button", { name: "Erstellen", exact: true }).click();
  await page.getByRole("button", { name: "Freier Platz 1, Karte einsetzen" }).click();
  const dialog = page.getByRole("dialog", { name: "Karte suchen" });
  await dialog.getByRole("button", { name: "Motiv im Artwork" }).click();
  await expect(dialog.getByRole("alert")).toContainText("Motivindex konnte nicht geladen werden");
  await dialog.getByRole("button", { name: "Mit Name/Nummer suchen" }).click();
  await expect(dialog.getByPlaceholder("Name oder Nummer, z. B. Glurak 4/102")).toBeVisible();
});

test("searches German and English catalogs and labels the result language", async ({ page }) => {
  await mockCatalog(page);
  await page.goto("/");
  await page.getByLabel("Bindername").fill("Sprachsuche");
  await page.getByRole("button", { name: "Erstellen", exact: true }).click();

  await page.getByRole("button", { name: "Freier Platz 1, Karte einsetzen" }).click();
  await page.getByPlaceholder("Name oder Nummer, z. B. Glurak 4/102").fill("Glurak");
  const germanResult = page.getByRole("listitem").filter({ hasText: "Glurak" });
  await expect(germanResult).toContainText("DE · Grundset · Nr. 4/102");
  await germanResult.getByRole("button", { name: "Prüfen" }).click();

  const preview = page.getByRole("dialog", { name: "Karte prüfen" });
  await expect(page.getByRole("article", { name: "Glurak, Slot 1" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Freier Platz 1, Karte einsetzen" })).toBeVisible();
  await expect(preview).toContainText("Grundset");
  await expect(preview).toContainText("4/102");
  await expect(preview).toContainText("Bild auf Englisch");
  await expect(preview).toContainText("Katalog bestätigt: Holo, First Edition");
  await expect(preview.getByLabel("Druckvariante").locator('option[value="shadowless"]')).toHaveCount(0);
  await preview.getByLabel("Finish").selectOption("holo");
  await preview.getByLabel("Edition").selectOption("first-edition");
  await preview.getByRole("button", { name: "Mit diesen Angaben einsetzen" }).click();

  const card = page.getByRole("article", { name: "Glurak, Slot 1" });
  await expect(card).toBeVisible();
  await expect(card).toContainText("Holo · First Edition · Mit Schatten / Standard");
});

test("keeps Pocket cards out of the physical binder search", async ({ page }) => {
  await mockCatalog(page);
  await page.goto("/");
  await page.getByLabel("Bindername").fill("Physische Suche");
  await page.getByRole("button", { name: "Erstellen", exact: true }).click();

  await page.getByRole("button", { name: "Freier Platz 1, Karte einsetzen" }).click();
  await page.getByRole("button", { name: "English" }).click();
  await page.getByPlaceholder("Name oder Nummer, z. B. Glurak 4/102").fill("Mixed");

  const searchDialog = page.getByRole("dialog", { name: "Karte suchen" });
  await expect(searchDialog.getByRole("listitem")).toHaveCount(1);
  await expect(searchDialog.getByText("Bulbasaur", { exact: true })).toBeVisible();
  await expect(searchDialog.getByText("Pocket card", { exact: true })).toHaveCount(0);
  await expect(searchDialog.getByText(/Pocket-Karten können nicht/)).toHaveCount(0);
});

test("creates an editable Gift Binder from the local-first wizard", async ({ page }) => {
  await mockCatalog(page);
  await page.route("https://api.tcgdex.net/v2/en/cards", async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get("name")?.toLowerCase() !== "pikachu") return route.fallback();
    const cards = Array.from({ length: 9 }, (_, index) => ({ id: `base1-${index + 1}`, localId: String(index + 1), name: `Pikachu ${index + 1}` }));
    await route.fulfill({ body: JSON.stringify(cards), headers, status: 200 });
  });
  await page.route("https://api.tcgdex.net/v2/en/cards/base1-*", async (route) => {
    const id = new URL(route.request().url()).pathname.split("/").pop() ?? "base1-1";
    const localId = id.split("-").pop() ?? "1";
    await route.fulfill({
      body: JSON.stringify({ id, localId, name: `Pikachu ${localId}`, category: "Pokemon", set: { cardCount: { official: 102 }, id: "base1", name: "Base Set" } }),
      headers,
      status: 200,
    });
  });
  await page.setViewportSize({ height: 900, width: 375 });
  await page.goto("/");
  await page.getByRole("button", { name: "Geschenk erstellen" }).click();
  await expect(page.getByRole("heading", { name: "Ein persönlicher Kartenbinder" })).toBeVisible();
  await page.getByRole("button", { name: /Vorschlag erzeugen/ }).click();
  await expect(page.getByText("9 / 9")).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Preisprüfung");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
  await page.getByRole("button", { name: "Auswahl prüfen" }).click();
  await page.getByRole("button", { name: "Als Binder anlegen" }).click();
  await expect(page.getByRole("heading", { name: /Geschenk · Pikachu/ })).toBeVisible();
  await expect(page.getByRole("article", { name: "Pikachu 1, Slot 1" })).toBeVisible();
});

test("sets, edits and persists the minimum condition for marketplace handoff", async ({ page }) => {
  await mockCatalog(page);
  await page.goto("/");
  await page.getByLabel("Bindername").fill("Zustandswunsch");
  await page.getByRole("button", { name: "Erstellen", exact: true }).click();

  await page.getByRole("button", { name: "Freier Platz 1, Karte einsetzen" }).click();
  await page.getByPlaceholder("Name oder Nummer, z. B. Glurak 4/102").fill("Ivysaur");
  await page.getByRole("listitem").filter({ hasText: "Ivysaur" }).getByRole("button", { name: "Prüfen" }).click();
  const preview = page.getByRole("dialog", { name: "Karte prüfen" });
  await preview.getByLabel("Finish").selectOption("normal");
  await preview.getByLabel("Edition").selectOption("unlimited");
  await preview.getByLabel("Mindestzustand").selectOption("near-mint");
  await preview.getByRole("button", { name: "Mit diesen Angaben einsetzen" }).click();

  await page.getByRole("article", { name: "Ivysaur, Slot 1" }).click();
  await expect(page.getByRole("definition").filter({ hasText: "Near Mint" })).toBeVisible();
  await page.getByRole("button", { name: "Version & Zustand festlegen" }).click();
  const details = page.getByRole("dialog", { name: /Version und Mindestzustand/ });
  await details.getByLabel("Mindestzustand").selectOption("lightly-played");
  await details.getByRole("button", { name: "Angaben speichern" }).click();
  await expect(page.getByRole("definition").filter({ hasText: "Lightly Played" })).toBeVisible();

  await page.reload();
  await page.getByRole("article", { name: "Ivysaur, Slot 1" }).click();
  await expect(page.getByRole("definition").filter({ hasText: "Lightly Played" })).toBeVisible();
  await page.getByRole("button", { name: /Fehlende Karten \(1\)/ }).click();
  const missingCards = page.getByRole("region", { name: "Fehlende Karten" });
  await missingCards.getByRole("button", { name: "Cardmarket" }).click();
  await expect(missingCards.getByRole("textbox", { name: "Cardmarket-Decklistenvorschau" })).toHaveValue("1x Ivysaur Vine Whip Poisonpowder");
  await expect(missingCards.getByText("Lightly Played", { exact: true })).toBeVisible();
});

test("filters equal card names by language and balances the combined results", async ({ page }) => {
  await mockCatalog(page);
  await page.goto("/");
  await page.getByLabel("Bindername").fill("Sprachfilter");
  await page.getByRole("button", { name: "Erstellen", exact: true }).click();

  await page.getByRole("button", { name: "Freier Platz 1, Karte einsetzen" }).click();
  await page.getByPlaceholder("Name oder Nummer, z. B. Glurak 4/102").fill("Pikachu");
  const results = page.getByRole("listitem").filter({ hasText: "Pikachu" });
  await expect(results).toHaveCount(2);
  await expect(results.nth(0)).toContainText("DE · Grundset · Nr. 58/102");
  await expect(results.nth(1)).toContainText("EN · Base Set · Nr. 58/102");

  await page.getByRole("button", { name: "English" }).click();
  await expect(results).toHaveCount(1);
  await expect(results).toContainText("EN · Base Set · Nr. 58/102");
  await expect(results).not.toContainText("DE · Grundset · Nr. 58/102");

  await page.getByRole("button", { name: "Deutsch" }).click();
  await expect(results).toHaveCount(1);
  await expect(results).toContainText("DE · Grundset · Nr. 58/102");
  await expect(results).not.toContainText("EN · Base Set · Nr. 58/102");
});

test("browses a selected set and loads catalog results page by page", async ({ page }) => {
  await mockCatalog(page);
  await page.goto("/");
  await page.getByLabel("Bindername").fill("Setfilter");
  await page.getByRole("button", { name: "Erstellen", exact: true }).click();

  await page.getByRole("button", { name: "Freier Platz 1, Karte einsetzen" }).click();
  await page.getByRole("button", { name: "English" }).click();
  await page.locator("#card-series-filter").selectOption("base");
  await page.locator("#card-set-filter").selectOption("base1");

  const searchDialog = page.getByRole("dialog", { name: "Karte suchen" });
  await expect(searchDialog.getByRole("listitem")).toHaveCount(1);
  await expect(searchDialog.getByRole("listitem")).toContainText("Base Set · Nr. 1/102");

  await page.getByPlaceholder("Name oder Nummer, z. B. Glurak 4/102").fill("Bulk");
  await expect(searchDialog.getByRole("listitem")).toHaveCount(40);
  await expect(searchDialog.getByRole("button", { name: "Mehr laden" })).toBeVisible();
  await searchDialog.getByRole("button", { name: "Mehr laden" }).click();
  await expect(searchDialog.getByRole("listitem")).toHaveCount(41);
  await expect(searchDialog.getByText("Set card 41", { exact: true })).toBeVisible();
  await expect(searchDialog.getByRole("button", { name: "Mehr laden" })).toBeHidden();
});

test("finds and displays an exact full collector number", async ({ page }) => {
  await mockCatalog(page);
  await page.goto("/");
  await page.getByLabel("Bindername").fill("Nummernsuche");
  await page.getByRole("button", { name: "Erstellen", exact: true }).click();

  await page.getByRole("button", { name: "Freier Platz 1, Karte einsetzen" }).click();
  await page.getByPlaceholder("Name oder Nummer, z. B. Glurak 4/102").fill("Charizard 04/102");
  const result = page.getByRole("listitem").filter({ hasText: "Charizard" });
  await expect(result).toHaveCount(1);
  await expect(result).toContainText("EN · Grundset · Nr. 4/102");
  await result.getByRole("button", { name: "Prüfen" }).click();
  const preview = page.getByRole("dialog", { name: "Karte prüfen" });
  await expect(preview).toContainText("4/102");
  await expect(preview.getByLabel("Druckvariante").locator('option[value="shadowless"]')).toHaveCount(1);
  await preview.getByLabel("Edition").selectOption("unlimited");
  await preview.getByRole("button", { name: "Mit diesen Angaben einsetzen" }).click();

  const card = page.getByRole("article", { name: "Charizard, Slot 1" });
  await expect(card).toContainText("Grundset · 4/102");

  await page.getByRole("button", { name: /Fehlende Karten \(1\)/ }).click();
  const missingCards = page.getByRole("region", { name: "Fehlende Karten" });
  await missingCards.getByRole("button", { name: "TCGplayer" }).click();
  await expect(missingCards.getByRole("textbox", { name: "TCGplayer Mass-Entry-Vorschau" })).toHaveValue(
    "1 Charizard [BS] 004/102",
  );
  const tcgplayerLink = missingCards.getByRole("link", { name: "Liste bei TCGplayer öffnen" });
  const tcgplayerUrl = new URL(await tcgplayerLink.getAttribute("href") ?? "");
  expect(tcgplayerUrl.searchParams.get("c")).toBe("1 Charizard [BS] 004/102");
  expect(tcgplayerUrl.searchParams.get("productline")).toBe("Pokemon");

  await missingCards.getByRole("button", { name: "Cardmarket" }).click();
  await missingCards.getByText("Einzelsuchen für Teil 1 anzeigen (1)").click();
  const cardmarketLink = missingCards.getByRole("link", { name: "Karte suchen" });
  const cardmarketUrl = new URL(await cardmarketLink.getAttribute("href") ?? "");
  expect(cardmarketUrl.searchParams.get("searchString")).toBe("Charizard Grundset 4/102");
});

test("exports the verified Tornupto and Blaine's Charizard identities to TCGplayer", async ({ page }) => {
  await mockCatalog(page);
  await page.goto("/");
  await page.getByLabel("Bindername").fill("TCGplayer Mapping");
  await page.getByRole("button", { name: "Erstellen", exact: true }).click();

  await addCard(page, 1, "Tornupto", "Tornupto");
  await addCard(page, 2, "Blaine's Charizard", "Blaine's Charizard");

  await page.getByRole("button", { name: /Fehlende Karten \(2\)/ }).click();
  const missingCards = page.getByRole("region", { name: "Fehlende Karten" });
  await missingCards.getByRole("button", { name: "TCGplayer" }).click();

  await expect(missingCards.getByText("2 übergabebereit · 2 Produktzuordnungen · 0 prüfen")).toBeVisible();
  await expect(missingCards.getByRole("textbox", { name: "TCGplayer Mass-Entry-Vorschau" })).toHaveValue(
    "1 Typhlosion (17) [N1] 017/111\n1 Blaine's Charizard [G2] 002/132",
  );
  await expect(missingCards.getByText("Neo Genesis · Nr. 17/111")).toBeVisible();
  await expect(missingCards.getByText("Gym Challenge · Nr. 2/132")).toBeVisible();

  await missingCards.getByRole("button", { name: "Cardmarket" }).click();
  await expect(missingCards.getByRole("textbox", { name: "Cardmarket-Decklistenvorschau" })).toHaveValue(
    "1x Typhlosion Fire Recharge Flame Burst\n1x Blaine's Charizard Roaring Flames Flame Jet",
  );
});
