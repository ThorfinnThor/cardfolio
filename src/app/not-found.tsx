import type { Metadata } from "next";
import Link from "next/link";

import { ContentFrame } from "@/components/content/ContentFrame";
import styles from "@/components/content/content.module.css";
import { guideIndexPath, homePath, speciesIndexPath } from "@/content/routes";

export const metadata: Metadata = {
  title: "Seite nicht gefunden · Cardfolio",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <ContentFrame language="de">
      <header className={styles.header}>
        <p className={styles.eyebrow}>Fehler 404</p>
        <h1>Diese Seite gibt es nicht</h1>
        <p className={styles.lead}>Der Link ist veraltet oder enthält einen Tippfehler. Von hier aus kommst du weiter:</p>
      </header>
      <section className={styles.section}>
        <ul>
          <li><Link href={homePath("de")}>Zur Startseite und zum Binder-Werkzeug</Link></li>
          <li><Link href={guideIndexPath("de")}>Ratgeber zu Binder, Zustand und Kauf</Link></li>
          <li><Link href={speciesIndexPath("de")}>Pokémon-Binder nach Lieblingsfigur</Link></li>
        </ul>
      </section>
    </ContentFrame>
  );
}
