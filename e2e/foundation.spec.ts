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
      const cards = language === "de"
        ? query?.includes("glurak")
          ? [{ id: "base1-4", localId: "4", name: "Glurak" }]
          : query?.includes("pikachu")
            ? [{ id: "base1-58", localId: "58", name: "Pikachu" }]
            : []
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

    await route.abort();
  });
}

async function addCard(page: Page, slot: number, query: string, cardName: string) {
  await page.getByRole("button", { name: `Freier Platz ${slot}, Karte einsetzen` }).click();
  await page.getByPlaceholder("Name oder Nummer, z. B. Glurak 4/102").fill(query);
  await page
    .getByRole("listitem")
    .filter({ hasText: cardName })
    .getByRole("button", { name: "In Slot einsetzen" })
    .click();
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
  await page.getByRole("button", { name: "Verschieben" }).click();
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
  await expect(missingCards.getByRole("heading", { name: "Cardmarket Prüfliste" })).toBeVisible();
  await expect(missingCards.getByText(/Keine Exakt-Garantie/)).toBeVisible();
  await expect(missingCards.getByRole("textbox", { name: "Cardmarket-Prüflistenvorschau" })).toHaveValue(
    /1x Ivysaur \| Base Set \| Nr\. 2 \| EN/,
  );
  const cardmarketDownloadPromise = page.waitForEvent("download");
  await missingCards.getByRole("button", { name: "Prüfliste TXT" }).click();
  const cardmarketDownload = await cardmarketDownloadPromise;
  expect(cardmarketDownload.suggestedFilename()).toMatch(/^cardfolio-cardmarket-pruefliste-teil-1-.*\.txt$/);

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
  await expect(cleanPage.getByText("E2E Binder (Import)", { exact: true })).toBeVisible();
  await expect(cleanPage.getByText("Bulbasaur", { exact: true })).toBeVisible();
  await cleanContext.close();
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
  await expect(secondTab.getByText("Multi-Tab Binder", { exact: true })).toBeVisible();

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
  await expect(page.getByRole("button", { name: "Verschieben" })).toBeVisible();
});

test("shows a visible storage error when IndexedDB is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "indexedDB", { configurable: true, value: undefined });
  });
  await page.goto("/");

  await expect(page.getByText("IndexedDB is not available in this environment.")).toBeVisible();
  await expect(page.getByText("error")).toBeVisible();
  await expect(page.getByRole("button", { name: "Erneut versuchen" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Backup exportieren" }).first()).toBeVisible();
});

test("keeps the 3 x 3 grid usable on mobile and supports drawer focus and Escape", async ({
  page,
}) => {
  await page.setViewportSize({ height: 812, width: 375 });
  await page.goto("/");
  await page.getByLabel("Bindername").fill("Mobile Binder");
  await page.getByRole("button", { name: "Erstellen", exact: true }).click();

  await expect(page.getByRole("button", { name: /Freier Platz \d+, Karte einsetzen/ })).toHaveCount(9);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);

  await page.getByRole("button", { name: "Freier Platz 1, Karte einsetzen" }).click();
  const search = page.getByPlaceholder("Name oder Nummer, z. B. Glurak 4/102");
  await expect(search).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Karte suchen" })).toBeHidden();
});

test("searches German and English catalogs and labels the result language", async ({ page }) => {
  await mockCatalog(page);
  await page.goto("/");
  await page.getByLabel("Bindername").fill("Sprachsuche");
  await page.getByRole("button", { name: "Erstellen", exact: true }).click();

  await page.getByRole("button", { name: "Freier Platz 1, Karte einsetzen" }).click();
  await page.getByPlaceholder("Name oder Nummer, z. B. Glurak 4/102").fill("Glurak");
  const germanResult = page.getByRole("listitem").filter({ hasText: "Glurak" });
  await expect(germanResult).toContainText("DE · Nr. 4/102");
  await germanResult.getByRole("button", { name: "In Slot einsetzen" }).click();

  const card = page.getByRole("article", { name: "Glurak, Slot 1" });
  await expect(card).toBeVisible();
  await card.click();
  await page.getByRole("button", { name: "Version festlegen" }).click();
  const variantDialog = page.getByRole("dialog", { name: "Version für „Glurak“ festlegen" });
  await expect(variantDialog).toContainText("TCGdex meldet verfügbar: Holo, First Edition");
  await variantDialog.getByLabel("Finish").selectOption("holo");
  await variantDialog.getByLabel("Edition").selectOption("first-edition");
  await variantDialog.getByLabel("Druckvariante").selectOption("shadowless");
  await variantDialog.getByRole("button", { name: "Version speichern" }).click();
  await expect(card).toContainText("Holo · First Edition · Shadowless");
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
  await expect(results.nth(0)).toContainText("DE · Nr. 58/102");
  await expect(results.nth(1)).toContainText("EN · Nr. 58/102");

  await page.getByRole("button", { name: "English" }).click();
  await expect(results).toHaveCount(1);
  await expect(results).toContainText("EN · Nr. 58/102");
  await expect(results).not.toContainText("DE · Nr. 58/102");

  await page.getByRole("button", { name: "Deutsch" }).click();
  await expect(results).toHaveCount(1);
  await expect(results).toContainText("DE · Nr. 58/102");
  await expect(results).not.toContainText("EN · Nr. 58/102");
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
  await expect(result).toContainText("EN · Nr. 4/102");
  await result.getByRole("button", { name: "In Slot einsetzen" }).click();

  const card = page.getByRole("article", { name: "Charizard, Slot 1" });
  await expect(card).toContainText("Grundset · 4/102");
});
