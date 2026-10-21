import { notFound } from "next/navigation";

import { GuideArticle } from "@/components/content/Articles";
import { ContentFrame } from "@/components/content/ContentFrame";
import { findGuide, guideMetadata, guideParams } from "@/content/page-meta";
import { guideIndexPath, guidePath, homePath } from "@/content/routes";

export const dynamicParams = false;

export function generateStaticParams() {
  return guideParams("de");
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const guide = findGuide("de", (await params).slug);
  return guide ? guideMetadata("de", guide) : {};
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const guide = findGuide("de", (await params).slug);
  if (!guide) notFound();
  return (
    <ContentFrame
      language="de"
      alternatePath={guidePath("en", guide)}
      crumbs={[{ name: "Your Card Binder", path: homePath("de") }, { name: "Ratgeber", path: guideIndexPath("de") }, { name: guide.de.metaTitle, path: guidePath("de", guide) }]}
    >
      <GuideArticle guide={guide} language="de" />
    </ContentFrame>
  );
}
