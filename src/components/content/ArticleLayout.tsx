import type { ReactNode } from "react";

import type { PageLanguage } from "@/config/site";
import { LANDING } from "@/content/landing";
import { TOOL_START_PATH } from "@/content/routes";

import styles from "./content.module.css";
import { ToolLink } from "./ToolLink";

export interface TocItem {
  id: string;
  label: string;
}

export function sectionId(index: number): string {
  return `abschnitt-${index + 1}`;
}

const LABELS = {
  de: { toc: "Auf dieser Seite", ctaText: "Neun passende Karten als Binder-Seite ansehen und die Kaufliste vorbereiten lassen. Ohne Konto." },
  en: { toc: "On this page", ctaText: "See nine matching cards as a binder page and have the shopping list prepared. No account needed." },
} as const;

/**
 * Article body on the left, a sticky sidebar on the right (table of contents and, optionally, the way into
 * the tool). On narrow screens the sidebar drops below the text and the table of contents is hidden.
 */
export function ArticleLayout({ language, toc, withCta = true, children }: {
  language: PageLanguage;
  toc: readonly TocItem[];
  withCta?: boolean;
  children: ReactNode;
}) {
  const label = LABELS[language];
  return (
    <div className={styles.articleGrid}>
      <div className={styles.articleMain}>{children}</div>
      <aside className={styles.articleAside}>
        <nav className={styles.toc} aria-label={label.toc}>
          <h2>{label.toc}</h2>
          <ol>{toc.map((item) => <li key={item.id}><a href={`#${item.id}`}>{item.label}</a></li>)}</ol>
        </nav>
        {withCta ? (
          <div className={styles.asideCta}>
            <p>{label.ctaText}</p>
            <ToolLink href={TOOL_START_PATH} language={language} className={styles.cta}>{LANDING[language].cta}</ToolLink>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
