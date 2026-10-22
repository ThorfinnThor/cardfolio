import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/config/site";

export const dynamic = "force-static";

/*
 * Everything public may be crawled, by search engines and by AI crawlers alike. The raw JSON data files are not pages
 * and the internal artwork review tool is not for visitors; /app/ and /geschenk/ stay crawlable so their "noindex"
 * can be seen. The sitemap is announced here so crawlers find it without a manual submission.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/data/", "/artwork-review/"] }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
