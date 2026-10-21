import { SpeciesIndex } from "@/components/content/Articles";
import { ContentFrame } from "@/components/content/ContentFrame";
import { speciesIndexMetadata } from "@/content/page-meta";
import { publishedSpecies } from "@/content/pokemon-stats";
import { homePath, speciesIndexPath } from "@/content/routes";

export const metadata = speciesIndexMetadata("en");

export default function SpeciesIndexPage() {
  return (
    <ContentFrame language="en" alternatePath={speciesIndexPath("de")} crumbs={[{ name: "Your Card Binder", path: homePath("en") }, { name: "Pokémon binders", path: speciesIndexPath("en") }]}>
      <SpeciesIndex all={publishedSpecies()} language="en" />
    </ContentFrame>
  );
}
