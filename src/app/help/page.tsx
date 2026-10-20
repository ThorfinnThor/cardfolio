import type { Metadata } from "next";
import Link from "next/link";

import { AppLegalFooter } from "@/components/content/LegalFooter";
import { LanguageMenu } from "@/components/foundation/LanguageMenu";

import { pageUrlMetadata } from "@/config/site";
import { DISCLAIMER } from "@/content/disclaimer";

import styles from "./help.module.css";

const TITLE = "Hilfe und Datenflüsse · Cardfolio";
const DESCRIPTION = "Speicherung, Backups, externe Anbieter und Grenzen von Cardfolio.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  ...pageUrlMetadata("/help/", TITLE, DESCRIPTION),
};

export default function HelpPage() {
  return (
    <main className={styles.page}>
      <div className={styles.topline}>
        <Link className={styles.back} href="/">← Zurück zu Cardfolio</Link>
        <LanguageMenu />
      </div>
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
        <p>Die Motivsuche durchsucht 19.635 englische physische Karten anhand automatisch erkannter Artwork-Merkmale und kurzer Beschreibungen. Diese Angaben wurden nicht vom Kartenhersteller bestätigt und können falsch oder unvollständig sein. Die Motivsuche zeigt deshalb ihre Herkunft sichtbar an und ersetzt nicht die Prüfung der konkreten Karte. Pokémon-TCG-Pocket-Karten sind nicht enthalten.</p>
        <p>Finish, Edition und Druckvariante sind Pflichtangaben. Wenn TCGdex belastbare Finish-Signale liefert, zeigt Cardfolio nur die bestätigten Holo-, Non-Holo- und Reverse-Optionen. Fehlen sie, bleibt das Finish zur manuellen Prüfung offen. First Edition wird nur für die regulären historischen Sets von Base Set bis Neo Destiny angeboten, ausgenommen Base Set 2. Die geprüfte First-Edition-Ausnahme Ivy Pikachu (Wizards Promo 1) ist kartenspezifisch hinterlegt. Beim englischen Base Set setzt First Edition automatisch Shadowless voraus; nur Machamp 8/102 existiert als First Edition zusätzlich mit Schatten. Dessen nicht gestempelte Trainer-Deck-A-Ausgabe muss als Non-Holo mit eigener Bezeichnung erfasst werden. Shadowless ist ansonsten ausschließlich beim englischen Base Set auswählbar. „Unlimited / Standard“ und „Mit Schatten / Standard“ bleiben die Voreinstellungen, und „Andere“ benötigt eine eigene Bezeichnung.</p>
        <p>Die TCGplayer-Übergabe verwendet wöchentlich synchronisierte offizielle Set-Codes, Produktnamen und vollständige Kartennummern. Karten ohne eindeutiges TCGplayer-Produkt, ohne Mass-Entry-Set-Code oder mit widersprüchlichen Variantenangaben bleiben sichtbar und werden nicht spekulativ übertragen. Vor „Add to Cart“ müssen die empfohlenen Printing- und Zustandsfilter aktiviert werden; Holofoil, 1st Edition Holofoil und Unlimited Holofoil sind getrennte Optionen. Die Cardmarket-Deckliste folgt dem offiziellen Pokémon-Format aus Menge, vollständigem Namen, Fähigkeiten und Attacken. Da dieses Format Set, Nummer, Sprache, Finish und Edition nicht festlegt, müssen diese Angaben vor einem Kauf auf Cardmarket kontrolliert werden.</p>
      </section>

      <section className={styles.section}>
        <h2>Anleitung zum Kauf</h2>
        <p>Wie du von der fertigen Liste zu den Karten bei Cardmarket kommst, steht Schritt für Schritt mit Abbildungen in der <Link href="/anleitung/cardmarket/">Anleitung zum Kauf bei Cardmarket</Link>.</p>
      </section>

      <section className={styles.section}>
        <h2>Marken, Bilder und Anbieter</h2>
        <p><strong>{DISCLAIMER.de.heading}.</strong> {DISCLAIMER.de.lines[0]}</p>
        <p>{DISCLAIMER.de.lines[1]} Cardfolio ist außerdem kein offizielles Produkt von TCGdex.</p>
        <p>Wer Cardfolio betreibt, steht im <Link href="/impressum/">Impressum</Link>. Welche Daten verarbeitet werden, beschreibt die <Link href="/datenschutz/">Datenschutzerklärung</Link>.</p>
      </section>
      <AppLegalFooter />
    </main>
  );
}
