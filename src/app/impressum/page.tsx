import type { Metadata } from "next";

import { ContentFrame } from "@/components/content/ContentFrame";
import { LegalArticle } from "@/components/content/LegalArticle";
import { legalById } from "@/content/legal";
import { homePath, legalPath } from "@/content/routes";

const text = legalById("imprint").de;

/* Legal pages stay reachable from every page but are not meant to rank, so they are noindex and not in the sitemap. */
export const metadata: Metadata = {
  title: text.metaTitle,
  description: text.description,
  robots: { index: false, follow: true },
  alternates: { canonical: legalPath("de", "imprint") },
};

export default function LegalPage() {
  return (
    <ContentFrame language="de" alternatePath={legalPath("en", "imprint")} crumbs={[{ name: "Your Card Binder", path: homePath("de") }, { name: text.title, path: legalPath("de", "imprint") }]}>
      <LegalArticle text={text} language="de" />
    </ContentFrame>
  );
}
