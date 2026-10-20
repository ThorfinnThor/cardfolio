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

test("the home page explains the product below the app and states the independence notice", async ({ page }) => {
  await page.goto("/");
  const section = page.getByRole("region", { name: "Über Cardfolio" });
  await expect(section.getByRole("heading", { name: "Was Cardfolio macht" })).toBeAttached();
  await expect(section.getByText(/nicht mit Nintendo, Creatures Inc., GAME FREAK inc. oder The Pokémon Company verbunden/)).toBeAttached();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://yourcardbinder.com/");
});

test("the gift entry canonicalises to the home page", async ({ page }) => {
  await page.goto("/geschenk/");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://yourcardbinder.com/");
});
