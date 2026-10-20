import { GuideIndex } from "@/components/content/Articles";
import { ContentFrame } from "@/components/content/ContentFrame";
import { guideIndexMetadata } from "@/content/page-meta";
import { guideIndexPath, homePath } from "@/content/routes";

export const metadata = guideIndexMetadata("de");

export default function GuidesPage() {
  return (
    <ContentFrame language="de" alternatePath={guideIndexPath("en")} crumbs={[{ name: "Cardfolio", path: homePath("de") }, { name: "Ratgeber", path: guideIndexPath("de") }]}>
      <GuideIndex language="de" />
    </ContentFrame>
  );
}
