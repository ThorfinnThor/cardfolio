import { LandingSections } from "@/components/content/Articles";
import { ContentFrame } from "@/components/content/ContentFrame";
import { homeMetadata } from "@/content/page-meta";
import { publishedSpecies } from "@/content/pokemon-stats";

export const metadata = homeMetadata("en");

export default function EnglishHome() {
  return (
    <ContentFrame language="en" alternatePath="/">
      <LandingSections language="en" species={publishedSpecies()} withIntro />
    </ContentFrame>
  );
}
