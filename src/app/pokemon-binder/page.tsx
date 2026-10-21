import { SpeciesIndex } from "@/components/content/Articles";
import { ContentFrame } from "@/components/content/ContentFrame";
import { speciesIndexMetadata } from "@/content/page-meta";
import { publishedSpecies } from "@/content/pokemon-stats";
import { homePath, speciesIndexPath } from "@/content/routes";

export const metadata = speciesIndexMetadata("de");

export default function SpeciesIndexPage() {
  return (
    <ContentFrame language="de" alternatePath={speciesIndexPath("en")} crumbs={[{ name: "Your Card Binder", path: homePath("de") }, { name: "Pokémon-Binder", path: speciesIndexPath("de") }]}>
      <SpeciesIndex all={publishedSpecies()} language="de" />
    </ContentFrame>
  );
}
