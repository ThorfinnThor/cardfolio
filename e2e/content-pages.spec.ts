import { expect, test } from "@playwright/test";

const PAGES = [
  { path: "/ratgeber/binder-groesse-taschen/", lang: "de", heading: /Welche Größe und wie viele Taschen/ },
  { path: "/pokemon-binder/glurak/", lang: "de", heading: /Glurak-Binder/ },
  { path: "/en/guides/pokemon-card-condition/", lang: "en", heading: /Pokémon card condition/ },
  { path: "/en/pokemon-binder/charizard/", lang: "en", heading: /Charizard binder/ },
] as const;

for (const { path, lang, heading } of PAGES) {
  test(`content page ${path} keeps its own language and fits a phone`, async ({ page }) => {
    await page.setViewportSize({ height: 812, width: 375 });
    /* A stored app language must not change a single-language content page. */
    await page.addInitScript(() => window.localStorage.setItem("cardfolio-locale", "en"));
    await page.goto(path);

    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
    await expect(page.getByRole("complementary").filter({ hasText: /Nintendo, Creatures/ })).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://yourcardbinder.com${path}`);
    expect(await page.locator('link[rel="alternate"][hreflang]').count()).toBe(3);
    /* Wide tables scroll inside their own wrapper; the page itself must not scroll sideways. */
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  });
}

test("the home page is a landing page with one clear way into the tool and a way to the app", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("cardfolio-locale", "en"));
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await expect(page.getByRole("heading", { level: 1, name: /Ein Binder voller Karten/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Geschenk-Binder gestalten" }).first()).toHaveAttribute("href", "/geschenk/?start=1");
  await expect(page.getByRole("link", { name: "Ich sammle selbst" })).toHaveAttribute("href", "/app/");
  await expect(page.getByRole("heading", { name: "Was Cardfolio macht" })).toBeVisible();
  await expect(page.getByText(/nicht mit Nintendo, Creatures Inc., GAME FREAK inc. oder The Pokémon Company verbunden/)).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://yourcardbinder.com/");
  await expect(page.locator('nav a[href="/ratgeber/"]').first()).toBeVisible();
});

for (const path of ["/", "/en/"]) {
  test(`landing page ${path} fits a phone`, async ({ page }) => {
    await page.setViewportSize({ height: 812, width: 375 });
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  });
}

test("the landing page opens the gift tool and the app on their own addresses", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Geschenk-Binder gestalten" }).first().click();
  await expect(page).toHaveURL(/\/geschenk\/$/);
  await expect(page.getByRole("heading", { name: "Dein Geschenk-Binder beginnt hier" })).toBeVisible();
  await page.goto("/");
  await page.getByRole("link", { name: "Ich sammle selbst" }).click();
  await expect(page).toHaveURL(/\/app\/$/);
  await expect(page.getByRole("button", { name: "Backup exportieren" }).or(page.getByText("Backup exportieren")).first()).toBeVisible();
});

test("the English landing page stays English whatever language was stored", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("cardfolio-locale", "de"));
  await page.goto("/en/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1, name: /A binder full of cards/ })).toBeVisible();
  await expect(page.locator('link[rel="alternate"][hreflang="de"]')).toHaveAttribute("href", "https://yourcardbinder.com/");
});

test("the gift tool and the app are not offered to search engines", async ({ page }) => {
  for (const path of ["/geschenk/", "/app/"]) {
    await page.goto(path);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  }
});

for (const { path, lang, heading } of [
  { path: "/impressum/", lang: "de", heading: /Impressum/ },
  { path: "/datenschutz/", lang: "de", heading: /Datenschutzerklärung/ },
  { path: "/en/legal-notice/", lang: "en", heading: /Legal notice/ },
  { path: "/en/privacy/", lang: "en", heading: /Privacy policy/ },
] as const) {
  test(`legal page ${path} is noindex, in its own language and fits a phone`, async ({ page }) => {
    await page.setViewportSize({ height: 812, width: 375 });
    await page.addInitScript(() => window.localStorage.setItem("cardfolio-locale", lang === "de" ? "en" : "de"));
    await page.goto(path);

    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.getByText("SeitenHafen361").first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  });
}

for (const path of ["/", "/app/", "/geschenk/", "/help/", "/anleitung/cardmarket/", "/ratgeber/pokemon-karten-verschenken/"]) {
  test(`${path} links the legal notice and the privacy policy`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('a[href="/impressum/"]').first()).toBeAttached();
    await expect(page.locator('a[href="/datenschutz/"]').first()).toBeAttached();
  });
}

test("every public content page uses the same column width", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  const widths: Record<string, number> = {};
  for (const path of ["/", "/en/", "/ratgeber/", "/ratgeber/pokemon-kartenzustand/", "/pokemon-binder/", "/pokemon-binder/glurak/", "/en/guides/", "/impressum/", "/datenschutz/", "/help/", "/anleitung/cardmarket/"]) {
    await page.goto(path);
    widths[path] = Math.round((await page.locator("main").first().boundingBox())!.width);
  }
  expect(Object.values(widths).every((width) => width === 1120), JSON.stringify(widths)).toBe(true);
});

test("articles fill the column with a sidebar on desktop and drop it on a phone", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  for (const path of ["/ratgeber/pokemon-karten-verschenken/", "/pokemon-binder/glurak/", "/datenschutz/", "/help/", "/anleitung/cardmarket/"]) {
    await page.goto(path);
    const toc = page.getByRole("navigation", { name: /Auf dieser Seite|Schritte dieser Anleitung/ });
    await expect(toc, path).toBeVisible();
    const box = (await toc.boundingBox())!;
    const main = (await page.locator("main").first().boundingBox())!;
    expect(box.x + box.width, `${path} sidebar sits at the right edge of the column`).toBeGreaterThan(main.x + main.width - 4);
  }

  await page.setViewportSize({ height: 812, width: 375 });
  await page.goto("/ratgeber/pokemon-karten-verschenken/");
  await expect(page.getByRole("navigation", { name: "Auf dieser Seite" })).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});

test("the app sidebar keeps accessible names when it shrinks to icons, and has no dead entries", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 768 });
  await page.goto("/app/");
  for (const name of ["Meine Binder", "Backup exportieren", "Hilfe"]) await expect(page.getByRole(name === "Hilfe" ? "link" : "button", { name }).first()).toBeAttached();
  await expect(page.getByRole("link", { name: /Kauf-Anleitung/ })).toBeAttached();
  await expect(page.getByText("Einstellungen")).toHaveCount(0);
  await expect(page.locator("footer").getByRole("link", { name: "Impressum" })).toHaveAttribute("href", "/impressum/");
  await expect(page.locator('footer a[href="/help/"]')).toHaveCount(1);
});
