import Link from "next/link";

import type { PageLanguage } from "@/config/site";
import { legalPath } from "@/content/routes";

import styles from "./content.module.css";

const LABELS = {
  de: { imprint: "Impressum", privacy: "Datenschutz", help: "Hilfe und Datenflüsse", nav: "Rechtliches" },
  en: { imprint: "Legal notice", privacy: "Privacy policy", help: "Help (German)", nav: "Legal" },
} as const;

/** Links the legal notice and privacy policy from every public page, as the provider information must be reachable at all times. */
export function LegalFooter({ language }: { language: PageLanguage }) {
  const label = LABELS[language];
  return (
    <footer className={styles.footer}>
      <nav aria-label={label.nav} className={styles.footerNav}>
        <Link href={legalPath(language, "imprint")}>{label.imprint}</Link>
        <Link href={legalPath(language, "privacy")}>{label.privacy}</Link>
        <Link href="/help/">{label.help}</Link>
      </nav>
    </footer>
  );
}

/** The same links for the German app pages, which sit outside `ContentFrame`. */
export function AppLegalFooter() {
  return (
    <div lang="de" data-no-translate className={styles.appFooter}>
      <LegalFooter language="de" />
    </div>
  );
}
