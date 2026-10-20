import type { MetadataRoute } from "next";

import { SITE_ORIGIN } from "@/config/site";

export const dynamic = "force-static";

/* Public, indexable routes only. The artwork review tool is internal and stays out. */
const ROUTES = ["/", "/geschenk/", "/help/", "/anleitung/cardmarket/"];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((path) => ({ url: `${SITE_ORIGIN}${path}` }));
}
