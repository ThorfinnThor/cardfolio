import type { Metadata } from "next";

import { ContentFrame } from "@/components/content/ContentFrame";
import { LegalArticle } from "@/components/content/LegalArticle";
import { legalById } from "@/content/legal";
import { homePath, legalPath } from "@/content/routes";

const text = legalById("imprint").en;

/* Legal pages stay reachable from every page but are not meant to rank, so they are noindex and not in the sitemap. */
export const metadata: Metadata = {
  title: text.metaTitle,
  description: text.description,
  robots: { index: false, follow: true },
  alternates: { canonical: legalPath("en", "imprint") },
};

export default function LegalPage() {
  return (
    <ContentFrame language="en" alternatePath={legalPath("de", "imprint")} crumbs={[{ name: "Your Card Binder", path: homePath("en") }, { name: text.title, path: legalPath("en", "imprint") }]}>
      <LegalArticle text={text} language="en" />
    </ContentFrame>
  );
}
