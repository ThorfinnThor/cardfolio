import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CONSENT_CHANGE_EVENT, CONSENT_MAX_AGE_MS, CONSENT_STORAGE_KEY, GA_MEASUREMENT_ID } from "@/config/analytics";
import { readConsent, writeConsent } from "@/data/consent/consent";
import { disableAnalytics, enableAnalytics, trackPageView } from "@/data/consent/google-analytics";

beforeEach(() => {
  window.localStorage.clear();
  document.head.innerHTML = "";
  delete (window as unknown as Record<string, unknown>).gtag;
  delete (window as unknown as Record<string, unknown>).dataLayer;
  delete (window as unknown as Record<string, unknown>)[`ga-disable-${GA_MEASUREMENT_ID}`];
});
afterEach(() => vi.restoreAllMocks());

describe("consent storage", () => {
  it("has no choice at first, stores one and announces it", () => {
    expect(readConsent()).toBeUndefined();
    const heard = vi.fn();
    window.addEventListener(CONSENT_CHANGE_EVENT, heard);
    writeConsent("granted");
    window.removeEventListener(CONSENT_CHANGE_EVENT, heard);
    expect(readConsent()).toBe("granted");
    expect(heard).toHaveBeenCalledTimes(1);
    writeConsent("denied");
    expect(readConsent()).toBe("denied");
  });

  it("asks again after a year and ignores malformed or foreign values", () => {
    const now = Date.parse("2026-10-21T10:00:00.000Z");
    writeConsent("granted", now);
    expect(readConsent(now + CONSENT_MAX_AGE_MS - 1)).toBe("granted");
    expect(readConsent(now + CONSENT_MAX_AGE_MS + 1)).toBeUndefined();
    for (const bad of ["granted", "{}", JSON.stringify({ v: 2, analytics: "granted", at: "2026-10-21T10:00:00.000Z" }), JSON.stringify({ v: 1, analytics: "maybe", at: "2026-10-21T10:00:00.000Z" }), JSON.stringify({ v: 1, analytics: "granted", at: "yesterday" })]) {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, bad);
      expect(readConsent(now)).toBeUndefined();
    }
  });

  it("survives storage that throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    expect(readConsent()).toBeUndefined();
    expect(() => writeConsent("denied")).not.toThrow();
  });
});

describe("Google Analytics loader", () => {
  it("requests nothing until it is enabled", () => {
    expect(document.getElementById("ycb-gtag")).toBeNull();
    expect((window as unknown as Record<string, unknown>).gtag).toBeUndefined();
  });

  it("loads the tag once with advertising denied, and sends no automatic page view", () => {
    enableAnalytics();
    enableAnalytics();
    const scripts = document.querySelectorAll("script#ycb-gtag");
    expect(scripts).toHaveLength(1);
    expect((scripts[0] as HTMLScriptElement).src).toBe(`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`);
    const layer = (window as unknown as { dataLayer: IArguments[] }).dataLayer.map((entry) => Array.from(entry));
    expect(layer[0]).toEqual(["consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "granted" }]);
    expect(layer.find((entry) => entry[0] === "config")).toEqual(["config", GA_MEASUREMENT_ID, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false }]);
  });

  it("counts a page view with the path only", () => {
    enableAnalytics();
    trackPageView("/ratgeber/pokemon-sammlung-starten/");
    const events = (window as unknown as { dataLayer: IArguments[] }).dataLayer.map((entry) => Array.from(entry)).filter((entry) => entry[0] === "event");
    expect(events).toHaveLength(1);
    expect(events[0]?.[2]).toMatchObject({ page_path: "/ratgeber/pokemon-sammlung-starten/" });
  });

  it("stops measuring and removes the cookies when the choice is withdrawn", () => {
    enableAnalytics();
    document.cookie = "_ga=GA1.1.123; path=/";
    document.cookie = `_ga_${GA_MEASUREMENT_ID.slice(2)}=GS2.1.x; path=/`;
    disableAnalytics();
    expect(document.cookie).not.toContain("_ga");
    expect((window as unknown as Record<string, unknown>)[`ga-disable-${GA_MEASUREMENT_ID}`]).toBe(true);
    const before = (window as unknown as { dataLayer: unknown[] }).dataLayer.length;
    trackPageView("/x/");
    expect((window as unknown as { dataLayer: unknown[] }).dataLayer.length).toBe(before);
  });
});
