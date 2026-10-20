import Link from "next/link";
import type { ReactNode } from "react";

import { SITE_NAME, absoluteUrl, type PageLanguage } from "@/config/site";
import { DISCLAIMER } from "@/content/disclaimer";
import { guideIndexPath, homePath, otherLanguage, speciesIndexPath } from "@/content/routes";

import styles from "./content.module.css";
import { JsonLd } from "./JsonLd";
import { LegalFooter } from "./LegalFooter";

export interface Crumb {
  name: string;
  path: string;
}

const NAV = {
  de: { guides: "Ratgeber", species: "Pokémon-Binder", help: "Hilfe", crumbs: "Brotkrumen-Navigation", help_path: "/help/", other: "English version" },
  en: { guides: "Guides", species: "Pokémon binders", help: "Help (German)", crumbs: "Breadcrumbs", help_path: "/help/", other: "Deutsche Version" },
} as const;

export function TrademarkNotice({ language }: { language: PageLanguage }) {
  const text = DISCLAIMER[language];
  return (
    <aside className={styles.disclaimer} aria-labelledby={`disclaimer-${language}`}>
      <h2 id={`disclaimer-${language}`}>{text.heading}</h2>
      {text.lines.map((line) => <p key={line}>{line}</p>)}
    </aside>
  );
}

/**
 * Shared shell of the single-language content pages. The text is fixed, so the wrapper opts out of the
 * app's automatic translation and declares its own language.
 */
export function ContentFrame({ language, alternatePath, crumbs, children }: {
  language: PageLanguage;
  /** The same page in the other language, if one exists. */
  alternatePath?: string;
  crumbs?: readonly Crumb[];
  children: ReactNode;
}) {
  const nav = NAV[language];
  const other = otherLanguage(language);
  return (
    <div lang={language} data-no-translate>
      <main className={styles.page}>
        <div className={styles.topline}>
          <Link className={styles.brand} href={homePath(language)}>{SITE_NAME}</Link>
          <nav className={styles.nav} aria-label={language === "de" ? "Hauptnavigation" : "Main navigation"}>
            <Link href={guideIndexPath(language)}>{nav.guides}</Link>
            <Link href={speciesIndexPath(language)}>{nav.species}</Link>
            <Link href={nav.help_path}>{nav.help}</Link>
            <Link className={styles.lang} href={alternatePath ?? homePath(other)} hrefLang={other} lang={other}>{other.toUpperCase()}</Link>
          </nav>
        </div>
        {crumbs && crumbs.length > 0 ? (
          <>
            <nav className={styles.crumbs} aria-label={nav.crumbs}>
              <ol>
                {crumbs.map((crumb, index) => (
                  <li key={crumb.path}>{index === crumbs.length - 1 ? <span aria-current="page">{crumb.name}</span> : <Link href={crumb.path}>{crumb.name}</Link>}</li>
                ))}
              </ol>
            </nav>
            <JsonLd data={{
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: crumbs.map((crumb, index) => ({ "@type": "ListItem", position: index + 1, name: crumb.name, item: absoluteUrl(crumb.path) })),
            }} />
          </>
        ) : null}
        {children}
        <TrademarkNotice language={language} />
        <LegalFooter language={language} />
      </main>
    </div>
  );
}
