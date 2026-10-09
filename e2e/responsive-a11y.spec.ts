import { expect, test } from "@playwright/test";

const targetViewports = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "small-desktop", width: 1024, height: 768 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

test("start screen has no horizontal overflow and keeps keyboard focus visible", async ({ page }) => {
  for (const viewport of targetViewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(`/?viewport=${viewport.name}`);
    await expect(page.getByRole("heading", { name: "Meine Binder" })).toBeVisible();

    const layout = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
    }));
    expect(layout.documentWidth, `${viewport.name} document overflow`).toBeLessThanOrEqual(layout.viewportWidth + 1);
    expect(layout.bodyWidth, `${viewport.name} body overflow`).toBeLessThanOrEqual(layout.viewportWidth + 1);

    await page.keyboard.press("Tab");
    const focus = await page.evaluate(() => {
      const element = document.activeElement;
      if (!(element instanceof HTMLElement)) return undefined;
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return {
        label: element.getAttribute("aria-label") ?? element.textContent?.trim().slice(0, 80),
        visible: rect.width > 0 && rect.height > 0,
        inViewport: rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth,
        focusIndicator: style.outlineStyle !== "none" || style.boxShadow !== "none",
      };
    });

    expect(focus, `${viewport.name} should have a focusable first control`).toBeTruthy();
    expect(focus?.visible, `${viewport.name} first focused control should be visible`).toBe(true);
    expect(focus?.inViewport, `${viewport.name} first focused control should be in viewport`).toBe(true);
    expect(focus?.focusIndicator, `${viewport.name} first focused control should have a focus indicator`).toBe(true);
  }
});
