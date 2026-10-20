import type { Metadata } from "next";

import { pageUrlMetadata, type PageLanguage } from "@/config/site";

import { GUIDES, guideBySlug, type Guide } from "./guides";
import { LANDING } from "./landing";
import { publishedSpecies, type PublishedSpecies } from "./pokemon-stats";
import { guideIndexPath, guidePath, homePath, speciesIndexPath, speciesPath, speciesSlug } from "./routes";

export function alternatesFor(de: string, en: string) {
  return { de, en };
}

export function homeMetadata(language: PageLanguage): Metadata {
  const copy = LANDING[language];
  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    ...pageUrlMetadata(homePath(language), copy.metaTitle, copy.metaDescription, { language, alternates: alternatesFor("/", "/en/") }),
  };
}

export function guideIndexMetadata(language: PageLanguage): Metadata {
  const title = language === "de" ? "Ratgeber für Pokémon-Binder und Sammelkarten · Cardfolio" : "Guides to Pokémon binders and trading cards · Cardfolio";
  const description = LANDING[language].guidesText;
  return { title, description, ...pageUrlMetadata(guideIndexPath(language), title, description, { language, alternates: alternatesFor(guideIndexPath("de"), guideIndexPath("en")) }) };
}

export function guideMetadata(language: PageLanguage, guide: Guide): Metadata {
  const text = guide[language];
  const title = `${text.metaTitle} · Cardfolio`;
  return {
    title,
    description: text.description,
    ...pageUrlMetadata(guidePath(language, guide), title, text.description, { language, alternates: alternatesFor(guidePath("de", guide), guidePath("en", guide)) }),
  };
}

export function speciesIndexMetadata(language: PageLanguage): Metadata {
  const title = language === "de" ? "Pokémon-Binder nach Lieblingsfigur · Cardfolio" : "Pokémon binders by favourite figure · Cardfolio";
  const description = LANDING[language].speciesText;
  return { title, description, ...pageUrlMetadata(speciesIndexPath(language), title, description, { language, alternates: alternatesFor(speciesIndexPath("de"), speciesIndexPath("en")) }) };
}

export function speciesMetadata(language: PageLanguage, published: PublishedSpecies): Metadata {
  const { entry, stats } = published;
  const name = entry.names[language];
  const title = language === "de" ? `${name}-Binder: Karten, Sets und Motive · Cardfolio` : `${name} binder: cards, sets and artwork · Cardfolio`;
  const description = language === "de"
    ? `${stats.cardCount} ${name}-Karten aus ${stats.setCount} Sets (${stats.firstYear}–${stats.lastYear}): Zahlen aus dem Katalog, häufige Motive und Tipps, wie du einen ${name}-Binder zusammenstellst.`
    : `${stats.cardCount} ${name} cards from ${stats.setCount} sets (${stats.firstYear}–${stats.lastYear}): figures from the catalogue, common artwork and tips for putting together a ${name} binder.`;
  return {
    title,
    description,
    ...pageUrlMetadata(speciesPath(language, entry), title, description, { language, alternates: alternatesFor(speciesPath("de", entry), speciesPath("en", entry)) }),
  };
}

export function guideParams(language: PageLanguage) {
  return GUIDES.map((guide) => ({ slug: guide[language].slug }));
}

export function speciesParams(language: PageLanguage) {
  return publishedSpecies().map(({ entry }) => ({ slug: speciesSlug(language, entry) }));
}

export function findGuide(language: PageLanguage, slug: string): Guide | undefined {
  return guideBySlug(language, slug);
}

export function findSpecies(language: PageLanguage, slug: string): PublishedSpecies | undefined {
  return publishedSpecies().find(({ entry }) => speciesSlug(language, entry) === slug);
}

