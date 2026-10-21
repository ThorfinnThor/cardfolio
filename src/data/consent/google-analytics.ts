import { GA_MEASUREMENT_ID } from "@/config/analytics";

const SCRIPT_ID = "ycb-gtag";
const SCRIPT_SRC = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
const DISABLE_KEY = `ga-disable-${GA_MEASUREMENT_ID}`;

type GtagWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void } & Record<string, unknown>;

function gtagWindow(): GtagWindow {
  return window as unknown as GtagWindow;
}

/** Google's tag reads `arguments` objects from the data layer, not arrays. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function gtag(..._args: unknown[]): void {
  const target = gtagWindow();
  target.dataLayer = target.dataLayer ?? [];
  // eslint-disable-next-line prefer-rest-params
  target.dataLayer.push(arguments);
}

/**
 * Loads Google Analytics. Only call this after the visitor agreed: nothing of Google's is requested before.
 * Advertising storage and signals stay denied, and the tag does not send a page view by itself (the route
 * component does, so client-side navigation is counted too).
 */
export function enableAnalytics(): void {
  const target = gtagWindow();
  delete target[DISABLE_KEY];
  if (document.getElementById(SCRIPT_ID)) {
    gtag("consent", "update", { analytics_storage: "granted" });
    return;
  }
  target.gtag = gtag;
  gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "granted" });
  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false });
  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.async = true;
  script.src = SCRIPT_SRC;
  document.head.appendChild(script);
}

/** Stops measuring and removes the Google Analytics cookies of this site. */
export function disableAnalytics(): void {
  const target = gtagWindow();
  target[DISABLE_KEY] = true;
  if (typeof target.gtag === "function") gtag("consent", "update", { analytics_storage: "denied" });
  const names = ["_ga", `_ga_${GA_MEASUREMENT_ID.replace(/^G-/, "")}`];
  const host = window.location.hostname;
  const parts = host.split(".");
  const registrable = parts.length >= 2 ? parts.slice(-2).join(".") : undefined;
  const domains = [undefined, host, registrable, registrable ? `.${registrable}` : undefined];
  for (const name of names) {
    for (const domain of domains) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain ? `; domain=${domain}` : ""}`;
    }
  }
}

/** Counts one page view; the address carries no personal data. */
export function trackPageView(path: string): void {
  const target = gtagWindow();
  if (target[DISABLE_KEY] === true || typeof target.gtag !== "function") return;
  gtag("event", "page_view", { page_title: document.title, page_location: window.location.origin + path, page_path: path });
}
