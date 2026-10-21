import { expect, test } from "@playwright/test";

const GOOGLE = /googletagmanager\.com|google-analytics\.com|analytics\.google\.com/;

/** Blocks and records every request to Google so the tests can prove what is (not) sent. */
async function recordGoogleRequests(page: import("@playwright/test").Page) {
  const requests: string[] = [];
  await page.route(GOOGLE, async (route) => {
    requests.push(route.request().url());
    await route.fulfill({ status: 200, contentType: "application/javascript", body: "" });
  });
  return requests;
}

test("asks first and sends nothing to Google before an answer", async ({ page }) => {
  const requests = await recordGoogleRequests(page);
  await page.goto("/ratgeber/pokemon-sammlung-starten/");
  const banner = page.getByRole("dialog", { name: /Nutzung messen/ });
  await expect(banner).toBeVisible();
  await page.waitForTimeout(500);
  expect(requests).toEqual([]);
  expect(await page.evaluate(() => document.cookie)).toBe("");
});

test("declining keeps Google out and the banner away on the next page", async ({ page }) => {
  const requests = await recordGoogleRequests(page);
  await page.goto("/ratgeber/pokemon-sammlung-starten/");
  await page.getByRole("button", { name: "Ablehnen" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goto("/ratgeber/");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.waitForTimeout(500);
  expect(requests).toEqual([]);
});

test("allowing loads Google's tag, counts page views and can be withdrawn from the footer", async ({ page }) => {
  const requests = await recordGoogleRequests(page);
  await page.goto("/ratgeber/pokemon-sammlung-starten/");
  await page.getByRole("button", { name: "Erlauben" }).click();
  await expect.poll(() => requests.some((url) => url.includes("googletagmanager.com/gtag/js?id=G-R8KEXRSCBR"))).toBe(true);
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.getByRole("button", { name: "Cookie-Einstellungen" }).click();
  await expect(page.getByRole("dialog", { name: /Nutzung messen/ })).toBeVisible();
  await page.getByRole("button", { name: "Ablehnen" }).click();
  const stored = await page.evaluate(() => JSON.parse(window.localStorage.getItem("cardfolio-analytics-consent") ?? "{}"));
  expect(stored.analytics).toBe("denied");
  expect(await page.evaluate(() => (window as unknown as Record<string, unknown>)["ga-disable-G-R8KEXRSCBR"])).toBe(true);
});

test("the English pages ask in English", async ({ page }) => {
  await recordGoogleRequests(page);
  await page.goto("/en/guides/");
  await expect(page.getByRole("dialog", { name: /May Your Card Binder measure usage/ })).toBeVisible();
  await page.getByRole("button", { name: "Decline" }).click();
  await expect(page.getByRole("button", { name: "Cookie settings" })).toBeVisible();
});

test("the banner fits a phone without horizontal scrolling and stays usable", async ({ page }) => {
  await recordGoogleRequests(page);
  await page.setViewportSize({ width: 375, height: 700 });
  await page.goto("/");
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
  const box = await page.getByRole("dialog").boundingBox();
  expect(box && box.x >= 0 && box.x + box.width <= 375).toBe(true);
  await expect(page.getByRole("button", { name: "Erlauben" })).toBeInViewport();
});
