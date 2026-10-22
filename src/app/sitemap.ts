import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/config/site";
import { GUIDES } from "@/content/guides";
import { publishedSpecies } from "@/content/pokemon-stats";
import { guideIndexPath, guidePath, homePath, speciesIndexPath, speciesPath } from "@/content/routes";

export const dynamic = "force-static";

function pair(de: string, en: string, lastModified?: string): MetadataRoute.Sitemap {
  const languages = { de: absoluteUrl(de), en: absoluteUrl(en), "x-default": absoluteUrl(de) };
  return [
    { url: absoluteUrl(de), alternates: { languages }, ...(lastModified ? { lastModified } : {}) },
    { url: absoluteUrl(en), alternates: { languages }, ...(lastModified ? { lastModified } : {}) },
  ];
}

/*
 * Public, indexable routes only. /geschenk/ canonicalises to the home page and the artwork review tool is
 * internal, so neither is listed. Pairs carry hreflang so each language version points at the other.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const species = publishedSpecies();
  const latestGuideUpdate = GUIDES.map((guide) => guide.updated).sort().at(-1);
  return [
    ...pair(homePath("de"), homePath("en")),
    ...pair(guideIndexPath("de"), guideIndexPath("en"), latestGuideUpdate),
    ...GUIDES.flatMap((guide) => pair(guidePath("de", guide), guidePath("en", guide), guide.updated)),
    ...pair(speciesIndexPath("de"), speciesIndexPath("en")),
    ...species.flatMap(({ entry }) => pair(speciesPath("de", entry), speciesPath("en", entry))),
    { url: absoluteUrl("/anleitung/cardmarket/") },
    { url: absoluteUrl("/help/") },
  ];
}
