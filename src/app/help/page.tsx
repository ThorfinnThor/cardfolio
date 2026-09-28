import type { Metadata } from "next";
import Link from "next/link";

import styles from "./help.module.css";

export const metadata: Metadata = {
  title: "Hilfe und Datenflüsse · Cardfolio",
  description: "Speicherung, Backups, externe Anbieter und Grenzen von Cardfolio.",
};

export default function HelpPage() {
  return (
    <main className={styles.page}>
      <Link className={styles.back} href="/">← Zurück zu Cardfolio</Link>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Hilfe und Transparenz</p>
        <h1>Was Cardfolio speichert und verbindet</h1>
        <p>Cardfolio ist ein lokaler Wunschbinder. Es gibt kein Konto und keine Cloud-Synchronisierung.</p>
      </header>

      <section className={styles.section}>
        <h2>Lokale Speicherung und Backup</h2>
        <p>Binder, Positionen, Besitzstatus und die zuletzt geladenen Kartendaten liegen in IndexedDB dieses Browsers. Andere Geräte, Browserprofile, Domains und Preview-Adressen sehen diese Daten nicht.</p>
        <p>Browserdaten können gelöscht werden. Exportiere wichtige Binder regelmäßig als JSON-Datei. Bei einem Domainwechsel zuerst auf der alten Adresse exportieren und anschließend auf der neuen Adresse importieren.</p>
      </section>

      <section className={styles.section}>
        <h2>Netzwerkverbindungen</h2>
        <ul>
          <li>Der Hosting-Anbieter erhält technisch notwendige Verbindungsdaten beim Aufruf der statischen Website.</li>
          <li>Suche und Kartendetails werden direkt vom Browser bei <a href="https://tcgdex.dev/" target="_blank" rel="noreferrer">TCGdex</a> abgerufen.</li>
          <li>Kartenbilder werden direkt von <code>assets.tcgdex.net</code> geladen und nicht von Cardfolio kopiert oder in Backups gespeichert.</li>
          <li>Marketplace-Seiten werden nur nach einem eigenen Klick geöffnet. Cardfolio meldet sich dort nicht an und führt keinen Kauf aus.</li>
        </ul>
        <p>Der aktuelle P0-Build verwendet keine Analyse-, Werbe- oder Chat-Skripte und setzt keine eigenen Login-Cookies.</p>
      </section>

      <section className={styles.section}>
        <h2>Grenzen der Daten</h2>
        <p>TCGdex ist eine externe, gemeinschaftlich gepflegte Datenquelle. Karten, Varianten, Übersetzungen und Bilder können fehlen oder fehlerhaft sein. Preisangaben sind deaktiviert.</p>
        <p>TCGplayer-Ausgaben existieren nur für einzeln getestete Drucke und enthalten die vollständige dort angezeigte Kartennummer. Vor „Add to Cart“ müssen die empfohlenen Printing- und Zustandsfilter aktiviert werden; Holofoil, 1st Edition Holofoil und Unlimited Holofoil sind getrennte Optionen. Die Cardmarket-Deckliste folgt dem offiziellen Pokémon-Format aus Menge, vollständigem Namen, Fähigkeiten und Attacken. Da dieses Format Set, Nummer, Sprache, Finish und Edition nicht festlegt, müssen diese Angaben vor einem Kauf auf Cardmarket kontrolliert werden.</p>
      </section>

      <section className={styles.section}>
        <h2>Marken, Bilder und Anbieter</h2>
        <p>Cardfolio ist ein unabhängiger Arbeitstitel und kein offizielles Produkt von Nintendo, The Pokémon Company, TCGdex, TCGplayer oder Cardmarket. Marken und Kartenabbildungen gehören ihren jeweiligen Rechteinhabern.</p>
        <p>Die Betreiber- und Datenschutzangaben für den konkreten öffentlichen Host werden vor einer öffentlichen Freigabe ergänzt und geprüft. Diese Seite ist keine Zusage vollständiger Rechtskonformität.</p>
      </section>
    </main>
  );
}
