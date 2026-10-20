import type { Metadata } from "next";

export const SITE_ORIGIN = "https://yourcardbinder.com";

/* Canonical and Open Graph URL for one route. Pass the route path with its trailing slash, e.g. "/help/". */
export function pageUrlMetadata(path: string, title: string, description: string): Pick<Metadata, "alternates" | "openGraph"> {
  return {
    alternates: { canonical: path },
    openGraph: { type: "website", siteName: "Cardfolio", url: path, title, description },
  };
}
