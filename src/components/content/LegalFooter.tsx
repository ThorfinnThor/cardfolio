import Link from "next/link";

import { CookieSettingsButton } from "@/components/consent/CookieSettingsButton";
import type { PageLanguage } from "@/config/site";
import { legalPath } from "@/content/routes";

import styles from "./content.module.css";

const LABELS = {
  de: { imprint: "Impressum", privacy: "Datenschutz", help: "Hilfe und Datenflüsse", cookies: "Cookie-Einstellungen", nav: "Rechtliches" },
  en: { imprint: "Legal notice", privacy: "Privacy policy", help: "Help (German)", cookies: "Cookie settings", nav: "Legal" },
} as const;

/** Links the legal notice and privacy policy from every public page, as the provider information must be reachable at all times. */
export function LegalFooter({ language, helpLabel }: { language: PageLanguage; helpLabel?: string }) {
  const label = { ...LABELS[language], ...(helpLabel ? { help: helpLabel } : {}) };
  return (
    <footer className={styles.footer}>
      <nav aria-label={label.nav} className={styles.footerNav}>
        <Link href={legalPath(language, "imprint")}>{label.imprint}</Link>
        <Link href={legalPath(language, "privacy")}>{label.privacy}</Link>
        <Link href="/help/">{label.help}</Link>
        <CookieSettingsButton label={label.cookies} className={styles.footerButton} />
      </nav>
    </footer>
  );
}
