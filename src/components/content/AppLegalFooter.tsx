"use client";

import Link from "next/link";

import { legalPath } from "@/content/routes";
import { useLocale } from "@/i18n/locale";

import { LegalFooter } from "./LegalFooter";
import styles from "./content.module.css";

/**
 * Legal links for the app pages, which follow the visitor's language. The wrapper opts out of the automatic
 * text translation because the footer picks its own language.
 */
export function AppLegalFooter() {
  const { locale } = useLocale();
  return (
    <div lang={locale} data-no-translate className={styles.appFooter}>
      <LegalFooter language={locale} helpLabel={locale === "de" ? "Hilfe und Datenflüsse" : "Help and data flows"} />
    </div>
  );
}

/** Inline links to the legal notice and the privacy policy in the language of the app. */
export function LegalLinksInline() {
  const { locale } = useLocale();
  return (
    <>
      <Link href={legalPath(locale, "imprint")}>Impressum</Link> · <Link href={legalPath(locale, "privacy")}>Datenschutzerklärung</Link>
    </>
  );
}
