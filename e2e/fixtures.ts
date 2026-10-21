import { expect, test as base } from "@playwright/test";

const CONSENT_KEY = "cardfolio-analytics-consent";

/**
 * The tests of the app and the content pages start with the analytics question already answered ("denied"), so the
 * banner does not cover the page. consent.spec.ts uses Playwright's own `test` to see the banner.
 */
export const test = base.extend({
  context: async ({ context }, provide) => {
    await context.addInitScript((key) => {
      try {
        if (!window.localStorage.getItem(key)) window.localStorage.setItem(key, JSON.stringify({ v: 1, analytics: "denied", at: new Date().toISOString() }));
      } catch { /* storage may be blocked */ }
    }, CONSENT_KEY);
    await provide(context);
  },
});

export { expect };
