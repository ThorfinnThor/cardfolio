import { GuideIndex } from "@/components/content/Articles";
import { ContentFrame } from "@/components/content/ContentFrame";
import { guideIndexMetadata } from "@/content/page-meta";
import { guideIndexPath, homePath } from "@/content/routes";

export const metadata = guideIndexMetadata("en");

export default function GuidesPage() {
  return (
    <ContentFrame language="en" alternatePath={guideIndexPath("de")} crumbs={[{ name: "Cardfolio", path: homePath("en") }, { name: "Guides", path: guideIndexPath("en") }]}>
      <GuideIndex language="en" />
    </ContentFrame>
  );
}
