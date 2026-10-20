import { notFound } from "next/navigation";

import { GuideArticle } from "@/components/content/Articles";
import { ContentFrame } from "@/components/content/ContentFrame";
import { findGuide, guideMetadata, guideParams } from "@/content/page-meta";
import { guideIndexPath, guidePath, homePath } from "@/content/routes";

export const dynamicParams = false;

export function generateStaticParams() {
  return guideParams("en");
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const guide = findGuide("en", (await params).slug);
  return guide ? guideMetadata("en", guide) : {};
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const guide = findGuide("en", (await params).slug);
  if (!guide) notFound();
  return (
    <ContentFrame
      language="en"
      alternatePath={guidePath("de", guide)}
      crumbs={[{ name: "Cardfolio", path: homePath("en") }, { name: "Guides", path: guideIndexPath("en") }, { name: guide.en.metaTitle, path: guidePath("en", guide) }]}
    >
      <GuideArticle guide={guide} language="en" />
    </ContentFrame>
  );
}
