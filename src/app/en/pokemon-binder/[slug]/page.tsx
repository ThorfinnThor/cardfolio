import { notFound } from "next/navigation";

import { SpeciesArticle } from "@/components/content/Articles";
import { ContentFrame } from "@/components/content/ContentFrame";
import { findSpecies, speciesMetadata, speciesParams } from "@/content/page-meta";
import { publishedSpecies } from "@/content/pokemon-stats";
import { homePath, speciesIndexPath, speciesPath } from "@/content/routes";

export const dynamicParams = false;

export function generateStaticParams() {
  return speciesParams("en");
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const published = findSpecies("en", (await params).slug);
  return published ? speciesMetadata("en", published) : {};
}

export default async function SpeciesPage({ params }: { params: Promise<{ slug: string }> }) {
  const published = findSpecies("en", (await params).slug);
  if (!published) notFound();
  const { entry } = published;
  return (
    <ContentFrame
      language="en"
      alternatePath={speciesPath("de", entry)}
      crumbs={[{ name: "Cardfolio", path: homePath("en") }, { name: "Pokémon binders", path: speciesIndexPath("en") }, { name: entry.names.en, path: speciesPath("en", entry) }]}
    >
      <SpeciesArticle published={published} language="en" all={publishedSpecies()} />
    </ContentFrame>
  );
}
