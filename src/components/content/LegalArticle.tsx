import type { PageLanguage } from "@/config/site";
import { LEGAL_UPDATED } from "@/config/operator";
import type { LegalText } from "@/content/legal";

import { ArticleLayout, sectionId } from "./ArticleLayout";
import { Block } from "./Articles";
import styles from "./content.module.css";

function formatDate(language: PageLanguage, iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString(language === "de" ? "de-DE" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

export function LegalArticle({ text, language }: { text: LegalText; language: PageLanguage }) {
  return (
    <>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{language === "de" ? "Rechtliches" : "Legal"}</p>
        <h1>{text.title}</h1>
        <p className={styles.lead}>{text.intro}</p>
        <p className={styles.meta}>{language === "de" ? "Stand" : "Last updated"}: <time dateTime={LEGAL_UPDATED}>{formatDate(language, LEGAL_UPDATED)}</time></p>
      </header>
      <ArticleLayout language={language} withCta={false} toc={text.sections.map((section, index) => ({ id: sectionId(index), label: section.heading }))}>
        {text.sections.map((section, index) => (
          <section key={section.heading} id={sectionId(index)} className={styles.section}>
            <h2>{section.heading}</h2>
            {section.blocks.map((block, blockIndex) => <Block key={blockIndex} block={block} />)}
          </section>
        ))}
      </ArticleLayout>
    </>
  );
}
