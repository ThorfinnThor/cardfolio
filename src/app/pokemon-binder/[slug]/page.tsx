import { notFound } from "next/navigation";

import { SpeciesArticle } from "@/components/content/Articles";
import { ContentFrame } from "@/components/content/ContentFrame";
import { findSpecies, speciesMetadata, speciesParams } from "@/content/page-meta";
import { publishedSpecies } from "@/content/pokemon-stats";
import { homePath, speciesIndexPath, speciesPath } from "@/content/routes";

export const dynamicParams = false;

export function generateStaticParams() {
  return speciesParams("de");
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const published = findSpecies("de", (await params).slug);
  return published ? speciesMetadata("de", published) : {};
}

export default async function SpeciesPage({ params }: { params: Promise<{ slug: string }> }) {
  const published = findSpecies("de", (await params).slug);
  if (!published) notFound();
  const { entry } = published;
  return (
    <ContentFrame
      language="de"
      alternatePath={speciesPath("en", entry)}
      crumbs={[{ name: "Your Card Binder", path: homePath("de") }, { name: "Pokémon-Binder", path: speciesIndexPath("de") }, { name: entry.names.de, path: speciesPath("de", entry) }]}
    >
      <SpeciesArticle published={published} language="de" all={publishedSpecies()} />
    </ContentFrame>
  );
}
