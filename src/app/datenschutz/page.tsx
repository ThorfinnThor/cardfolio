import type { Metadata } from "next";

import { ContentFrame } from "@/components/content/ContentFrame";
import { LegalArticle } from "@/components/content/LegalArticle";
import { legalById } from "@/content/legal";
import { homePath, legalPath } from "@/content/routes";

const text = legalById("privacy").de;

/* Legal pages stay reachable from every page but are not meant to rank, so they are noindex and not in the sitemap. */
export const metadata: Metadata = {
  title: text.metaTitle,
  description: text.description,
  robots: { index: false, follow: true },
  alternates: { canonical: legalPath("de", "privacy") },
};

export default function LegalPage() {
  return (
    <ContentFrame language="de" alternatePath={legalPath("en", "privacy")} crumbs={[{ name: "Your Card Binder", path: homePath("de") }, { name: text.title, path: legalPath("de", "privacy") }]}>
      <LegalArticle text={text} language="de" />
    </ContentFrame>
  );
}
