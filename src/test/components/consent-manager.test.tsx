import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ConsentManager } from "@/components/consent/ConsentManager";
import { CookieSettingsButton } from "@/components/consent/CookieSettingsButton";
import { CONSENT_STORAGE_KEY, GA_MEASUREMENT_ID } from "@/config/analytics";
import { readConsent, writeConsent } from "@/data/consent/consent";

let pathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

const analyticsScript = () => document.getElementById("ycb-gtag");
const pageViews = () => ((window as unknown as { dataLayer?: IArguments[] }).dataLayer ?? []).map((entry) => Array.from(entry)).filter((entry) => entry[0] === "event");

beforeEach(() => {
  pathname = "/";
  window.localStorage.clear();
  document.head.innerHTML = "";
  delete (window as unknown as Record<string, unknown>).gtag;
  delete (window as unknown as Record<string, unknown>).dataLayer;
  delete (window as unknown as Record<string, unknown>)[`ga-disable-${GA_MEASUREMENT_ID}`];
});
afterEach(() => cleanup());

describe("ConsentManager", () => {
  it("asks first and loads nothing of Google's", async () => {
    render(<ConsentManager />);
    expect(await screen.findByRole("dialog", { name: /Nutzung messen/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mehr in der Datenschutzerklärung" }).getAttribute("href")).toMatch(/^\/datenschutz\/?$/);
    expect(analyticsScript()).toBeNull();
    expect(readConsent()).toBeUndefined();
  });

  it("offers both answers with the same prominence", async () => {
    render(<ConsentManager />);
    const deny = await screen.findByRole("button", { name: "Ablehnen" });
    const allow = screen.getByRole("button", { name: "Erlauben" });
    expect(deny.className).toBe(allow.className);
  });

  it("declining stores the choice, hides the banner and still loads nothing", async () => {
    render(<ConsentManager />);
    fireEvent.click(await screen.findByRole("button", { name: "Ablehnen" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(readConsent()).toBe("denied");
    expect(analyticsScript()).toBeNull();
  });

  it("allowing loads the tag and counts the current page", async () => {
    pathname = "/ratgeber/pokemon-sammlung-starten/";
    render(<ConsentManager />);
    fireEvent.click(await screen.findByRole("button", { name: "Erlauben" }));
    expect(readConsent()).toBe("granted");
    expect(analyticsScript()).not.toBeNull();
    expect(pageViews()).toHaveLength(1);
    expect(pageViews()[0]?.[2]).toMatchObject({ page_path: "/ratgeber/pokemon-sammlung-starten/" });
  });

  it("a stored yes loads the tag without asking again", async () => {
    writeConsent("granted");
    render(<ConsentManager />);
    await act(async () => { await Promise.resolve(); });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(analyticsScript()).not.toBeNull();
  });

  it("a stored no stays quiet", async () => {
    writeConsent("denied");
    render(<ConsentManager />);
    await act(async () => { await Promise.resolve(); });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(analyticsScript()).toBeNull();
  });

  it("the footer link asks again, and withdrawing stops measuring and removes the cookies", async () => {
    writeConsent("granted");
    render(<><ConsentManager /><CookieSettingsButton label="Cookie-Einstellungen" /></>);
    await act(async () => { await Promise.resolve(); });
    document.cookie = "_ga=GA1.1.123; path=/";
    fireEvent.click(screen.getByRole("button", { name: "Cookie-Einstellungen" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ablehnen" }));
    expect(readConsent()).toBe("denied");
    expect(document.cookie).not.toContain("_ga");
    expect((window as unknown as Record<string, unknown>)[`ga-disable-${GA_MEASUREMENT_ID}`]).toBe(true);
  });

  it("asks again when the stored choice is damaged", async () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, "not json");
    render(<ConsentManager />);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("speaks English on the English pages", async () => {
    pathname = "/en/guides/";
    render(<ConsentManager />);
    expect(await screen.findByRole("dialog", { name: /May Your Card Binder measure usage/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "More in the privacy policy" }).getAttribute("href")).toMatch(/^\/en\//);
  });
});
