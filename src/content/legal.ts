import type { PageLanguage } from "@/config/site";
import { OPERATOR } from "@/config/operator";

import { DISCLAIMER } from "./disclaimer";
import type { GuideSection } from "./guides";

export interface LegalText {
  slug: string;
  title: string;
  metaTitle: string;
  description: string;
  intro: string;
  sections: readonly GuideSection[];
}

export interface LegalDocument {
  id: "imprint" | "privacy";
  de: LegalText;
  en: LegalText;
}

const ADDRESS = `${OPERATOR.street}, ${OPERATOR.postalCode} ${OPERATOR.city}`;
const AMAZON_DE = "Als Amazon-Partner verdiene ich an qualifizierten Verkäufen.";
const AMAZON_EN = "As an Amazon Associate I earn from qualifying purchases.";

/** Local storage entries the app writes. The privacy policy lists them; a test keeps both in step. */
export const BROWSER_STORAGE_KEYS = ["cardfolio-theme", "cardfolio-locale", "cardfolio-gift-summary", "cardfolio-binder-sync"] as const;

export const LEGAL: readonly LegalDocument[] = [
  {
    id: "imprint",
    de: {
      slug: "impressum",
      title: "Impressum",
      metaTitle: "Impressum · Your Card Binder",
      description: "Anbieterkennzeichnung und rechtliche Hinweise zu Your Card Binder.",
      intro: "Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG).",
      sections: [
        {
          heading: "Diensteanbieter",
          blocks: [
            { type: "ul", items: [
              `${OPERATOR.businessName}, ${OPERATOR.legalForm.de}`,
              `Inhaber: ${OPERATOR.owner}`,
              ADDRESS,
              OPERATOR.country.de,
            ] },
          ],
        },
        {
          heading: "Kontakt",
          blocks: [{ type: "p", text: `E-Mail: ${OPERATOR.email}` }],
        },
        {
          heading: "Verantwortlich für den Inhalt",
          blocks: [{ type: "p", text: `Verantwortlich für journalistisch-redaktionelle Inhalte nach § 18 Abs. 2 Medienstaatsvertrag (MStV): ${OPERATOR.owner}, ${ADDRESS}, ${OPERATOR.country.de}.` }],
        },
        {
          heading: "Unabhängigkeit und Marken",
          blocks: [
            { type: "p", text: DISCLAIMER.de.lines[0]! },
            { type: "p", text: DISCLAIMER.de.lines[1]! },
          ],
        },
        {
          heading: "Partnerprogramme",
          blocks: [
            { type: "p", text: AMAZON_DE },
            { type: "p", text: "Einige Empfehlungen für Binder enthalten Partnerlinks, sogenannte Werbelinks. Kommt über einen solchen Link ein Kauf zustande, kann Your Card Binder eine Provision erhalten. Dein Preis bleibt gleich. Der Hinweis steht zusätzlich direkt am jeweiligen Angebot." },
            { type: "p", text: "Links zu CardTrader enthalten einen Partnercode. Wer CardTrader über einen solchen Link öffnet, wird dort 48 Stunden lang als von Your Card Binder vermittelt erfasst, und Your Card Binder erhält 1 % des Kartenpreises ohne Versand. Dein Preis bleibt gleich. Der Hinweis steht direkt an den Links." },
          ],
        },
        {
          heading: "Haftung für Inhalte",
          blocks: [
            { type: "p", text: "Als Diensteanbieter bin ich für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Ich bin jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben unberührt. Eine Haftung ist erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden entsprechender Rechtsverletzungen entferne ich diese Inhalte umgehend." },
            { type: "p", text: "Karten-, Set- und Variantendaten stammen aus der gemeinschaftlich gepflegten Quelle TCGdex und können Lücken oder Fehler enthalten. Preisangaben in Your Card Binder sind unverbindliche Schätzungen ohne Versand und Steuern. Verbindlich sind allein die Angaben auf dem jeweiligen Marktplatz oder im jeweiligen Shop." },
          ],
        },
        {
          heading: "Haftung für Links",
          blocks: [{ type: "p", text: "Das Angebot enthält Links zu externen Websites Dritter, etwa zu Cardmarket, TCGplayer, Amazon, TCGdex und CardTrader, auf deren Inhalte ich keinen Einfluss habe. Für diese fremden Inhalte kann ich keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber verantwortlich. Zum Zeitpunkt der Verlinkung waren keine Rechtsverstöße erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen entferne ich derartige Links umgehend." }],
        },
        {
          heading: "Urheberrecht und Rechte Dritter",
          blocks: [
            { type: "p", text: "Die von mir erstellten Texte, Gestaltungen und die Software dieser Website unterliegen dem deutschen Urheberrecht. Pokémon-Kartenabbildungen werden nicht von Your Card Binder gespeichert oder kopiert, sondern direkt vom Browser von assets.tcgdex.net oder, ersatzweise, cardtrader.com geladen. Sie sowie Kartennamen und Pokémon-Figuren gehören den jeweiligen Rechteinhabern." },
            { type: "p", text: "Solltest du eine Rechtsverletzung auf dieser Website bemerken, schreib bitte an die oben genannte E-Mail-Adresse. Ich prüfe den Hinweis zeitnah und entferne den Inhalt, wenn er berechtigt ist." },
          ],
        },
        {
          heading: "Datenschutz",
          blocks: [{ type: "p", text: "Informationen zur Verarbeitung personenbezogener Daten findest du in der Datenschutzerklärung." }],
        },
      ],
    },
    en: {
      slug: "legal-notice",
      title: "Legal notice",
      metaTitle: "Legal notice · Your Card Binder",
      description: "Provider information and legal notes for Your Card Binder.",
      intro: "Provider information under Section 5 of the German Digital Services Act (DDG).",
      sections: [
        {
          heading: "Service provider",
          blocks: [
            { type: "ul", items: [
              `${OPERATOR.businessName}, ${OPERATOR.legalForm.en}`,
              `Owner: ${OPERATOR.owner}`,
              ADDRESS,
              OPERATOR.country.en,
            ] },
          ],
        },
        {
          heading: "Contact",
          blocks: [{ type: "p", text: `Email: ${OPERATOR.email}` }],
        },
        {
          heading: "Responsible for the content",
          blocks: [{ type: "p", text: `Responsible for journalistic-editorial content under Section 18(2) of the German Interstate Media Treaty (MStV): ${OPERATOR.owner}, ${ADDRESS}, ${OPERATOR.country.en}.` }],
        },
        {
          heading: "Independence and trademarks",
          blocks: [
            { type: "p", text: DISCLAIMER.en.lines[0]! },
            { type: "p", text: DISCLAIMER.en.lines[1]! },
          ],
        },
        {
          heading: "Affiliate programmes",
          blocks: [
            { type: "p", text: AMAZON_EN },
            { type: "p", text: "Some binder recommendations contain affiliate links. If a purchase is made through such a link, Your Card Binder may receive a commission. Your price stays the same. The notice also appears directly on the offer." },
            { type: "p", text: "Links to CardTrader carry a partner code. Anyone who opens CardTrader through such a link is recorded there for 48 hours as referred by Your Card Binder, and Your Card Binder receives 1% of the card price, excluding shipping. Your price stays the same. The notice appears directly at the links." },
          ],
        },
        {
          heading: "Liability for content",
          blocks: [
            { type: "p", text: "As a service provider I am responsible for my own content on these pages under the general laws. I am not obliged to monitor transmitted or stored third-party information or to investigate circumstances that indicate unlawful activity. Obligations to remove or block the use of information under the general laws remain unaffected. Liability is only possible from the point in time at which I become aware of a specific infringement. Once I learn of such infringements I will remove the content without delay." },
            { type: "p", text: "Card, set and variant data come from the community-maintained source TCGdex and may contain gaps or errors. Prices in Your Card Binder are non-binding estimates excluding shipping and taxes. Only the information on the respective marketplace or shop is binding." },
          ],
        },
        {
          heading: "Liability for links",
          blocks: [{ type: "p", text: "The site contains links to external third-party websites, for example Cardmarket, TCGplayer, Amazon, TCGdex and CardTrader, over whose content I have no influence. I cannot accept any liability for this third-party content. The respective provider or operator is always responsible for the content of the linked pages. No infringements were apparent when the links were set. Permanent monitoring of the linked pages is not reasonable without concrete indications of an infringement. Once I learn of infringements I will remove such links without delay." }],
        },
        {
          heading: "Copyright and third-party rights",
          blocks: [
            { type: "p", text: "The texts, designs and software of this website created by me are subject to German copyright law. Pokémon card images are not stored or copied by Your Card Binder; the browser loads them directly from assets.tcgdex.net or, as a fallback, cardtrader.com. They, card names and Pokémon characters belong to their respective owners." },
            { type: "p", text: "If you notice an infringement on this website, please write to the email address above. I will review the notice promptly and remove the content if the complaint is justified." },
          ],
        },
        {
          heading: "Privacy",
          blocks: [{ type: "p", text: "Information on how personal data is processed can be found in the privacy policy." }],
        },
      ],
    },
  },
  {
    id: "privacy",
    de: {
      slug: "datenschutz",
      title: "Datenschutzerklärung",
      metaTitle: "Datenschutzerklärung · Your Card Binder",
      description: "Welche Daten beim Besuch von Your Card Binder verarbeitet werden, wo sie gespeichert sind und welche Rechte du hast.",
      intro: "Diese Erklärung beschreibt, welche personenbezogenen Daten beim Besuch von Your Card Binder verarbeitet werden, wozu, auf welcher Rechtsgrundlage und welche Rechte du hast. Sie beschreibt den tatsächlichen Stand der Website: Your Card Binder hat kein Konto und setzt ohne deine Einwilligung keine Cookies. Nur wenn du zustimmst, wird Google Analytics geladen. Werbedienste nutzt Your Card Binder nicht.",
      sections: [
        {
          heading: "1. Das Wichtigste in Kürze",
          blocks: [
            { type: "ul", items: [
              "Es gibt kein Benutzerkonto, keine Anmeldung und keine Datenbank mit Nutzerdaten auf einem Server von Your Card Binder.",
              "Deine Binder, Karten und Einstellungen liegen ausschließlich in deinem Browser und werden nicht an Your Card Binder übertragen.",
              "Ohne deine Einwilligung setzt Your Card Binder keine Cookies und lädt keine Analyse-, Tracking-, Werbe- oder Chat-Skripte. Nur wenn du im Banner zustimmst, wird Google Analytics geladen (Abschnitt 8).",
              "Beim Aufruf der Seite verarbeitet der Hosting-Anbieter Cloudflare technisch notwendige Verbindungsdaten.",
              "Kartendaten und Kartenbilder lädt dein Browser direkt von TCGdex, ersatzweise Bilder von CardTrader; dabei erhält der jeweilige Anbieter deine IP-Adresse.",
              "Erst wenn du auf einen Link zu Cardmarket, TCGplayer oder Amazon klickst, verlässt du Your Card Binder und der jeweilige Anbieter verarbeitet Daten nach eigener Erklärung.",
            ] },
          ],
        },
        {
          heading: "2. Verantwortlicher",
          blocks: [
            { type: "p", text: `${OPERATOR.businessName}, ${OPERATOR.legalForm.de}, Inhaber ${OPERATOR.owner}, ${ADDRESS}, ${OPERATOR.country.de}. E-Mail: ${OPERATOR.email}.` },
            { type: "p", text: "Ein Datenschutzbeauftragter ist nicht benannt, da dies nach Art. 37 DSGVO und § 38 BDSG nicht erforderlich ist." },
          ],
        },
        {
          heading: "3. Hosting und Server-Protokolle (Cloudflare)",
          blocks: [
            { type: "p", text: "Your Card Binder ist eine statische Website. Sie wird über Cloudflare Pages ausgeliefert, und die Domain yourcardbinder.com wird über Cloudflare verwaltet. Beim Aufruf einer Seite verarbeitet Cloudflare technisch notwendige Verbindungsdaten: IP-Adresse, Datum und Uhrzeit, aufgerufene Adresse, Referrer, Browser- und Systeminformationen und technische Routing-Daten. Dazu können auch Sicherheitsdaten zur Abwehr missbräuchlicher Zugriffe gehören." },
            { type: "p", text: "Zweck ist, die Website sicher, stabil und schnell auszuliefern und vor Missbrauch zu schützen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Das berechtigte Interesse liegt im sicheren und zuverlässigen Betrieb der Website." },
            { type: "p", text: "Cloudflare verarbeitet diese Daten als Auftragsverarbeiter. Empfänger kann neben Cloudflare Germany GmbH auch die Cloudflare-Unternehmensgruppe sein. Bei Übermittlungen in die USA stützt sich Cloudflare nach eigenen Angaben auf die Zertifizierung unter dem EU-US Data Privacy Framework und, soweit erforderlich, auf EU-Standardvertragsklauseln. Die Speicherdauer der Protokolle richtet sich nach den Einstellungen und Richtlinien von Cloudflare. Your Card Binder führt keine eigenen Protokolle und wertet diese Daten nicht aus." },
            { type: "p", text: "Die Antworten der Website enthalten außerdem einen technischen Header zur Netzwerkfehler-Berichterstattung (Network Error Logging). Browser, die ihn unterstützen, können bei Verbindungsfehlern einen anonymen Fehlerbericht an Cloudflare senden. Erfolgreiche Aufrufe werden damit nicht gemeldet." },
          ],
        },
        {
          heading: "4. Speicherung in deinem Browser",
          blocks: [
            { type: "p", text: "Your Card Binder speichert Informationen auf deinem Gerät, damit die von dir gewünschte Funktion arbeitet. Es sind keine Cookies, sondern Browser-Speicher. Sie werden nicht an Your Card Binder gesendet. Die Speicherung ist für die ausdrücklich gewünschte Funktion unbedingt erforderlich (§ 25 Abs. 2 Nr. 2 TDDDG), deshalb ist keine Einwilligung nötig. Die Verarbeitung der Inhalte findet nur in deinem Browser statt." },
            { type: "table", caption: "Daten, die Your Card Binder in deinem Browser ablegt", head: ["Speicher", "Inhalt", "Zweck und Dauer"], rows: [
              ["IndexedDB „cardfolio“", "Deine Binder mit Namen, Seiten und Plätzen, ausgewählte Karten, Besitzstatus, Kaufeinstellungen (Sprache, Mindestzustand, Region), Geschenk-Projekte und zuletzt geladene Kartendaten", "Damit deine Binder beim nächsten Besuch wieder da sind. Bis du sie löschst, die Website-Daten im Browser entfernst oder der Browser den Speicher aufräumt."],
              ["localStorage „cardfolio-theme“", "Helle oder dunkle Darstellung", "Merkt deine Wahl. Bis du die Website-Daten löschst."],
              ["localStorage „cardfolio-locale“", "Gewählte Sprache (Deutsch oder Englisch)", "Merkt deine Wahl. Bis du die Website-Daten löschst."],
              ["localStorage „cardfolio-analytics-consent“", "Deine Wahl zu Google Analytics (erlaubt oder abgelehnt) und der Zeitpunkt der Wahl", "Damit das Banner nicht bei jedem Besuch erscheint. Zwölf Monate, danach wird erneut gefragt. Unbedingt erforderlich, um deine Wahl umzusetzen (§ 25 Abs. 2 Nr. 2 TDDDG)."],
              ["sessionStorage „cardfolio-gift-summary“", "Der fertige Geschenk-Vorschlag mit ausgewählten Karten, Einstellungen und, falls eingegeben, deiner Widmung", "Damit der Vorschlag beim Wechsel zum Einkauf und zurück erhalten bleibt. Nur für diesen Browser-Tab, höchstens sechs Stunden, und bis der Tab geschlossen wird."],
              ["BroadcastChannel „cardfolio-binder-sync“", "Nur ein Hinweis, dass sich ein Binder geändert hat", "Gleicht mehrere offene Tabs derselben Website ab. Wird nicht gespeichert und verlässt den Browser nicht."],
            ] },
            { type: "p", text: "Die Namen, Notizen und Widmungen, die du in Your Card Binder eingibst, bleiben in deinem Browser. Gib bitte keine Informationen ein, die du nicht auf deinem Gerät speichern willst. Du kannst die Daten jederzeit in den Browser-Einstellungen unter „Website-Daten“ löschen oder einzelne Binder in Your Card Binder löschen." },
          ],
        },
        {
          heading: "5. Backups und Exporte",
          blocks: [{ type: "p", text: "Wenn du ein Backup exportierst oder eine Kaufliste kopierst oder herunterlädst, entsteht eine Datei oder ein Text auf deinem Gerät. Your Card Binder lädt diese nicht hoch. Ein Backup enthält deine Binder und die dazugehörigen Kartendaten, aber keine Bilder. Du entscheidest, wo du es speicherst und mit wem du es teilst. Eine Datei, die du importierst, wird nur im Browser gelesen und geprüft." }],
        },
        {
          heading: "6. Kartendaten und Kartenbilder (TCGdex)",
          blocks: [
            { type: "p", text: "Für die Kartensuche und die Kartendetails fragt dein Browser die Daten direkt bei der Schnittstelle api.tcgdex.net ab. Übermittelt werden dabei dein Suchbegriff, die gewählte Kartensprache und die angeforderten Karten- oder Set-Kennungen. Die Kartenbilder lädt dein Browser direkt von assets.tcgdex.net. Your Card Binder kopiert, speichert oder bündelt die Bilder nicht. Das gilt auch für die neun Beispielkarten im Kopf der Startseite: Sie werden beim Aufruf direkt von assets.tcgdex.net geladen." },
            { type: "p", text: "Hat TCGdex für eine Karte kein Bild, lädt dein Browser das Bild ersatzweise direkt von cardtrader.com (CardTrader) und kennzeichnet es als „Bild: CardTrader“. Auch CardTrader erhält dabei technisch notwendige Daten wie deine IP-Adresse; auf die dortige Verarbeitung habe ich keinen Einfluss. Preisangaben, die nicht von TCGdex stammen, kommen aus einer Datei, die Your Card Binder wöchentlich aus der CardTrader-Schnittstelle erzeugt und von der eigenen Domain ausliefert. Dein Browser kontaktiert CardTrader dafür nicht." },
            { type: "p", text: "Wie bei jeder Verbindung erhält TCGdex dabei technisch notwendige Daten, insbesondere deine IP-Adresse, Datum und Uhrzeit, den Browsertyp und die angeforderte Adresse. Die Verbindung ist erforderlich, damit die von dir verlangten Karten und Bilder angezeigt werden können (Art. 6 Abs. 1 lit. b und f DSGVO). TCGdex ist ein eigenständig betriebenes, gemeinschaftlich gepflegtes Projekt. Auf die dortige Verarbeitung, den Standort der Server und die Speicherdauer habe ich keinen Einfluss. Informationen findest du bei TCGdex unter tcgdex.dev." },
            { type: "p", text: "Die Motivsuche („Smart Search“) arbeitet vollständig in deinem Browser. Der dafür nötige Suchindex wird von Your Card Binder wie die übrigen Dateien der Website ausgeliefert. Dein Suchtext wird nicht an Dritte übermittelt. Für die gefundenen Karten ruft dein Browser anschließend, wie oben beschrieben, die Kartendaten bei TCGdex ab." },
          ],
        },
        {
          heading: "7. Externe Links zu Marktplätzen und Shops",
          blocks: [
            { type: "p", text: "Your Card Binder bereitet Kauflisten für Cardmarket und TCGplayer vor und verlinkt Binder bei Amazon. Diese Anbieter werden erst geöffnet, wenn du selbst einen Link anklickst oder eine Liste dort einfügst. Your Card Binder meldet sich dort nicht für dich an und schließt keinen Kauf ab. Beim Klick wird nach der Referrer-Richtlinie der Website nur der Ursprung (yourcardbinder.com), nicht die genaue Seite übermittelt. Danach gilt die Datenschutzerklärung des jeweiligen Anbieters, bei Cardmarket und TCGplayer ebenso wie bei Amazon." },
            { type: "p", text: "Einige Binder-Empfehlungen führen über Partnerlinks zu Amazon (amazon.de). Sie tragen eine Partnerkennung, über die Amazon einen Kauf Your Card Binder zuordnen kann. Amazon kann nach dem Klick auf amazon.de eigene Cookies setzen und Daten nach der eigenen Datenschutzerklärung verarbeiten (Amazon EU S.à r.l., 38 avenue John F. Kennedy, L-1855 Luxemburg). Your Card Binder sieht nur die von Amazon bereitgestellten Partnerberichte über Klicks und qualifizierte Käufe, keine Namen oder Adressen. Der Preis für dich bleibt gleich. Dieser Hinweis steht auch direkt am Angebot." },
            { type: "p", text: "Links zu CardTrader (cardtrader.com, Gray Fox SRL, Italien) tragen den Partnercode von Your Card Binder. Öffnest du CardTrader über einen solchen Link, erfasst CardTrader dich für 48 Stunden als von Your Card Binder vermittelt und zahlt Your Card Binder 1 % des Preises der Karten ohne Versand. Your Card Binder erhält dabei keine Angaben über dich, nur die Abrechnung der Vermittlung. Danach gilt die Datenschutzerklärung von CardTrader. Dein Preis bleibt gleich." },
            { type: "p", text: "Optionale Wunschliste bei CardTrader: Wenn du in der CardTrader-Anleitung ein persönliches API-Token einträgst und auf „Wunschliste anlegen“ klickst, sendet dein Browser das Token und die Liste (Listenname, Kartenseiten, Mengen, Sprache) direkt an api.cardtrader.com. Das Token bleibt nur im Arbeitsspeicher deines Browsers; es wird nicht gespeichert und nicht an Your Card Binder übermittelt. Es wird nichts gekauft. Die weitere Verarbeitung bei CardTrader richtet sich nach deren Datenschutzerklärung." },
            { type: "p", text: AMAZON_DE },
          ],
        },
        {
          heading: "8. Cookies und Webanalyse mit Google Analytics (nur mit deiner Einwilligung)",
          blocks: [
            { type: "p", text: "Wenn du es erlaubst, nutzt Your Card Binder Google Analytics 4, einen Webanalysedienst der Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland (Muttergesellschaft: Google LLC, USA). Ohne deine Erlaubnis wird Google Analytics nicht geladen: Es wird keine Verbindung zu Google aufgebaut und es werden keine Google-Cookies gesetzt." },
            { type: "p", text: "Zweck ist die statistische Auswertung der Nutzung, also welche Seiten aufgerufen werden, auf welchem Weg Besucher kommen und welche Geräte, Browser und Länder genutzt werden, um Inhalte und Funktionen zu verbessern. Dabei setzt Google Analytics die Cookies „_ga“ und „_ga_R8KEXRSCBR“ (Speicherdauer bis zu zwei Jahre) mit einer zufälligen Kennung und überträgt Seitenaufrufe, Herkunft sowie Geräte- und Browserangaben an Google. Deine IP-Adresse wird dabei technisch an Google übertragen; Google Analytics 4 speichert sie nach Angaben von Google nicht. Werbefunktionen, Google Signals und personalisierte Werbung sind ausgeschaltet. Daten auf Ebene einzelner Nutzer und Ereignisse werden bei Google Analytics nach spätestens 14 Monaten gelöscht." },
            { type: "p", text: "Rechtsgrundlage ist deine Einwilligung (Art. 6 Abs. 1 lit. a DSGVO, § 25 Abs. 1 TDDDG). Du entscheidest im Banner beim ersten Besuch, ablehnen ist genauso einfach wie erlauben. Du kannst deine Entscheidung jederzeit mit Wirkung für die Zukunft ändern: Öffne „Cookie-Einstellungen“ im Seitenfuß und wähle „Ablehnen“. Dann stoppt die Messung, und die Google-Analytics-Cookies dieser Website werden gelöscht. Deine Wahl wird in deinem Browser gespeichert und nach zwölf Monaten erneut abgefragt." },
            { type: "p", text: "Google kann Daten in die USA übermitteln (siehe Abschnitt 10). Your Card Binder verwendet darüber hinaus keine Werbenetzwerke, keine Social-Media-Plugins, keine eingebetteten Videos oder Karten und keine Schriftarten von Drittanbietern. Die Schriftarten werden von der eigenen Domain geladen. Es findet kein Profiling und keine automatisierte Entscheidungsfindung im Sinne von Art. 22 DSGVO statt." },
          ],
        },
        {
          heading: "9. Kontakt per E-Mail",
          blocks: [{ type: "p", text: "Wenn du mir schreibst, verarbeite ich deine Absenderadresse, deine Nachricht und freiwillige Angaben, um zu antworten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, wenn es um einen Vertrag oder vorvertragliche Fragen geht, sonst Art. 6 Abs. 1 lit. f DSGVO. Ich lösche die Daten, sobald sie für den Zweck nicht mehr erforderlich sind und keine gesetzlichen Aufbewahrungspflichten bestehen." }],
        },
        {
          heading: "10. Empfänger und Übermittlung in Drittländer",
          blocks: [
            { type: "p", text: "Empfänger der Verbindungsdaten sind Cloudflare (Hosting), TCGdex (Kartendaten und Bilder), CardTrader (ersatzweise Bilder), Google (Webanalyse, nur wenn du zustimmst) und, nach deinem Klick, der jeweilige Marktplatz oder Shop. Eine Übermittlung in Staaten außerhalb der EU und des EWR kann dabei nicht ausgeschlossen werden, zum Beispiel an Cloudflare in den USA oder an Marktplätze mit Sitz außerhalb der EU. Cloudflare und Google stützen sich nach eigenen Angaben auf das EU-US Data Privacy Framework und Standardvertragsklauseln. Bei den übrigen Anbietern gelten deren eigene Garantien." },
            { type: "p", text: "Der Quellcode und die öffentlichen Katalogdaten von Your Card Binder liegen in einem öffentlichen GitHub-Repository. Beim Besuch von Your Card Binder findet keine Verbindung zu GitHub statt, und deine Binder gelangen nicht dorthin." },
          ],
        },
        {
          heading: "11. Deine Rechte",
          blocks: [
            { type: "p", text: "Du hast nach der DSGVO folgende Rechte gegenüber dem Verantwortlichen:" },
            { type: "ul", items: [
              "Auskunft über die zu dir verarbeiteten Daten (Art. 15 DSGVO)",
              "Berichtigung unrichtiger Daten (Art. 16 DSGVO)",
              "Löschung (Art. 17 DSGVO)",
              "Einschränkung der Verarbeitung (Art. 18 DSGVO)",
              "Datenübertragbarkeit (Art. 20 DSGVO)",
              "Widerspruch gegen Verarbeitungen auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO aus Gründen, die sich aus deiner besonderen Situation ergeben (Art. 21 DSGVO)",
              "Widerruf einer erteilten Einwilligung mit Wirkung für die Zukunft (Art. 7 Abs. 3 DSGVO). Your Card Binder verarbeitet derzeit nichts auf Grundlage einer Einwilligung.",
            ] },
            { type: "p", text: `Zur Ausübung schreib an ${OPERATOR.email}. Die Daten in deinem Browser kannst du selbst jederzeit einsehen, exportieren und löschen, weil Your Card Binder sie nicht erhält. Daten, die bei Cloudflare, TCGdex oder den Marktplätzen anfallen, betreffen deren eigene Verantwortung; wende dich dazu an den jeweiligen Anbieter.` },
          ],
        },
        {
          heading: "12. Beschwerderecht",
          blocks: [{ type: "p", text: "Du hast das Recht, dich bei einer Datenschutzaufsichtsbehörde zu beschweren. Für den Verantwortlichen ist das die Berliner Beauftragte für Datenschutz und Informationsfreiheit, Alt-Moabit 59–61, 10555 Berlin (datenschutz-berlin.de). Du kannst dich auch an die Aufsichtsbehörde an deinem Wohnort wenden." }],
        },
        {
          heading: "13. Sicherheit und Änderungen",
          blocks: [
            { type: "p", text: "Die Website wird ausschließlich verschlüsselt über HTTPS ausgeliefert. Sie setzt eine strikte Content Security Policy ein, die Verbindungen und Bilder auf die eigene Domain, die beiden TCGdex-Adressen und für Bilder cardtrader.com begrenzt, und lädt keine Skripte von Fremdservern." },
            { type: "p", text: "Ändert sich die Website, zum Beispiel durch ein Konto, Statistik oder neue eingebettete Dienste, passe ich diese Erklärung vorher an. Stand: 20. Oktober 2026." },
          ],
        },
      ],
    },
    en: {
      slug: "privacy",
      title: "Privacy policy",
      metaTitle: "Privacy policy · Your Card Binder",
      description: "Which data is processed when you visit Your Card Binder, where it is stored and which rights you have.",
      intro: "This policy describes which personal data is processed when you visit Your Card Binder, why, on which legal basis, and which rights you have. It describes the actual state of the website: Your Card Binder has no account and sets no cookies without your consent. Google Analytics is loaded only if you agree. Your Card Binder uses no advertising services.",
      sections: [
        {
          heading: "1. The short version",
          blocks: [
            { type: "ul", items: [
              "There is no user account, no login and no database of user data on a Your Card Binder server.",
              "Your binders, cards and settings live only in your browser and are not transmitted to Your Card Binder.",
              "Without your consent Your Card Binder sets no cookies and loads no analytics, tracking, advertising or chat scripts. Google Analytics is loaded only if you agree in the banner (Section 8).",
              "When you open the site, the hosting provider Cloudflare processes technically necessary connection data.",
              "Your browser loads card data and card images directly from TCGdex, and some images from CardTrader instead; the respective provider receives your IP address in the process.",
              "Only when you click a link to Cardmarket, TCGplayer or Amazon do you leave Your Card Binder, and that provider processes data under its own policy.",
            ] },
          ],
        },
        {
          heading: "2. Controller",
          blocks: [
            { type: "p", text: `${OPERATOR.businessName}, ${OPERATOR.legalForm.en}, owner ${OPERATOR.owner}, ${ADDRESS}, ${OPERATOR.country.en}. Email: ${OPERATOR.email}.` },
            { type: "p", text: "No data protection officer has been appointed, as none is required under Art. 37 GDPR and Section 38 of the German Federal Data Protection Act." },
          ],
        },
        {
          heading: "3. Hosting and server logs (Cloudflare)",
          blocks: [
            { type: "p", text: "Your Card Binder is a static website. It is delivered through Cloudflare Pages, and the domain yourcardbinder.com is managed through Cloudflare. When you open a page, Cloudflare processes technically necessary connection data: IP address, date and time, requested address, referrer, browser and system information and technical routing data. This can include security data used to defend against abusive access." },
            { type: "p", text: "The purpose is to deliver the website securely, reliably and quickly and to protect it from abuse. The legal basis is Art. 6(1)(f) GDPR. The legitimate interest is the secure and reliable operation of the website." },
            { type: "p", text: "Cloudflare processes this data as a processor. Recipients may include Cloudflare Germany GmbH and other Cloudflare group companies. For transfers to the United States, Cloudflare states that it relies on certification under the EU–US Data Privacy Framework and, where necessary, EU Standard Contractual Clauses. The retention of the logs follows Cloudflare's settings and policies. Your Card Binder keeps no logs of its own and does not evaluate this data." },
            { type: "p", text: "The site's responses also carry a technical header for network error reporting (Network Error Logging). Browsers that support it may send an anonymous error report to Cloudflare when a connection fails. Successful visits are not reported this way." },
          ],
        },
        {
          heading: "4. Storage in your browser",
          blocks: [
            { type: "p", text: "Your Card Binder stores information on your device so that the function you asked for works. These are not cookies but browser storage. They are not sent to Your Card Binder. Storing them is strictly necessary for the function you expressly requested (Section 25(2) no. 2 of the German TDDDG), so no consent is needed. The content is processed only in your browser." },
            { type: "table", caption: "Data Your Card Binder keeps in your browser", head: ["Storage", "Content", "Purpose and duration"], rows: [
              ["IndexedDB “cardfolio”", "Your binders with names, pages and slots, selected cards, ownership status, purchase settings (language, minimum condition, region), gift projects and recently loaded card data", "So your binders are still there on your next visit. Until you delete them, clear the site data in your browser or the browser clears the storage."],
              ["localStorage “cardfolio-theme”", "Light or dark display", "Remembers your choice. Until you clear site data."],
              ["localStorage “cardfolio-locale”", "Selected language (German or English)", "Remembers your choice. Until you clear site data."],
              ["localStorage “cardfolio-analytics-consent”", "Your choice about Google Analytics (allowed or declined) and when you made it", "So the banner does not appear on every visit. Twelve months, then you are asked again. Strictly necessary to apply your choice (Section 25(2) no. 2 of the German TDDDG)."],
              ["sessionStorage “cardfolio-gift-summary”", "The finished gift proposal with selected cards, settings and, if entered, your greeting", "Keeps the proposal when you switch to the purchase view and back. This browser tab only, at most six hours, and until the tab is closed."],
              ["BroadcastChannel “cardfolio-binder-sync”", "Only a note that a binder has changed", "Keeps several open tabs of the same site in step. Not stored and does not leave the browser."],
            ] },
            { type: "p", text: "The names, notes and greetings you enter in Your Card Binder stay in your browser. Please do not enter information you do not want to store on your device. You can delete the data at any time in your browser settings under “site data”, or delete single binders in Your Card Binder." },
          ],
        },
        {
          heading: "5. Backups and exports",
          blocks: [{ type: "p", text: "When you export a backup or copy or download a shopping list, a file or text is created on your device. Your Card Binder does not upload it. A backup contains your binders and the related card data but no images. You decide where to store it and with whom to share it. A file you import is only read and checked in your browser." }],
        },
        {
          heading: "6. Card data and card images (TCGdex)",
          blocks: [
            { type: "p", text: "For card search and card details, your browser queries the interface api.tcgdex.net directly. This transmits your search term, the chosen card language and the requested card or set identifiers. Your browser loads the card images directly from assets.tcgdex.net. Your Card Binder does not copy, store or bundle the images. This also applies to the nine example cards at the top of the home page: they are loaded directly from assets.tcgdex.net when you open it." },
            { type: "p", text: "If TCGdex has no image for a card, your browser loads the image from cardtrader.com (CardTrader) instead and marks it “Bild: CardTrader”. CardTrader likewise receives technically necessary data such as your IP address; I have no influence on the processing there. Prices that do not come from TCGdex are taken from a file Your Card Binder generates weekly from the CardTrader interface and serves from its own domain. Your browser does not contact CardTrader for that." },
            { type: "p", text: "As with any connection, TCGdex receives technically necessary data, in particular your IP address, date and time, browser type and the requested address. The connection is necessary to show the cards and images you asked for (Art. 6(1)(b) and (f) GDPR). TCGdex is an independently operated, community-maintained project. I have no influence on the processing there, the location of the servers or the retention period. Information is available from TCGdex at tcgdex.dev." },
            { type: "p", text: "The artwork search (“Smart Search”) runs entirely in your browser. The search index it needs is delivered by Your Card Binder like the other files of the site. Your search text is not transmitted to third parties. For the cards found, your browser then retrieves the card data from TCGdex as described above." },
          ],
        },
        {
          heading: "7. External links to marketplaces and shops",
          blocks: [
            { type: "p", text: "Your Card Binder prepares shopping lists for Cardmarket and TCGplayer and links binders on Amazon. These providers are only opened when you click a link yourself or paste a list there. Your Card Binder does not log in for you there and does not complete a purchase. When you click, the site's referrer policy sends only the origin (yourcardbinder.com), not the exact page. After that the privacy policy of the respective provider applies, for Cardmarket and TCGplayer as well as for Amazon." },
            { type: "p", text: "Some binder recommendations lead to Amazon (amazon.de) through affiliate links. They carry a partner identifier with which Amazon can attribute a purchase to Your Card Binder. After the click Amazon may set its own cookies on amazon.de and process data under its own privacy notice (Amazon EU S.à r.l., 38 avenue John F. Kennedy, L-1855 Luxembourg). Your Card Binder only sees the partner reports provided by Amazon about clicks and qualifying purchases, not names or addresses. Your price stays the same. This notice also appears directly on the offer." },
            { type: "p", text: "Links to CardTrader (cardtrader.com, Gray Fox SRL, Italy) carry Your Card Binder's partner code. If you open CardTrader through such a link, CardTrader records you for 48 hours as referred by Your Card Binder and pays Your Card Binder 1% of the price of the cards, excluding shipping. Your Card Binder receives no information about you in the process, only the settlement of the referral. After that CardTrader's privacy policy applies. Your price stays the same." },
            { type: "p", text: "Optional CardTrader wishlist: If you enter a personal API token in the CardTrader guide and click “Wunschliste anlegen” (create wishlist), your browser sends the token and the list (list name, card pages, quantities, language) directly to api.cardtrader.com. The token stays only in your browser’s memory; it is not stored and not sent to Your Card Binder. Nothing is purchased. Further processing at CardTrader is governed by CardTrader’s privacy notice." },
            { type: "p", text: AMAZON_EN },
          ],
        },
        {
          heading: "8. Cookies and web analytics with Google Analytics (only with your consent)",
          blocks: [
            { type: "p", text: "If you allow it, Your Card Binder uses Google Analytics 4, a web analytics service of Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ireland (parent company: Google LLC, USA). Without your permission Google Analytics is not loaded: no connection to Google is made and no Google cookies are set." },
            { type: "p", text: "The purpose is statistical analysis of usage, that is which pages are viewed, how visitors arrive and which devices, browsers and countries are used, in order to improve content and features. Google Analytics sets the cookies “_ga” and “_ga_R8KEXRSCBR” (lifetime up to two years) with a random identifier and transmits page views, origin and device and browser details to Google. Your IP address is technically transmitted to Google; according to Google, Google Analytics 4 does not store it. Advertising features, Google signals and personalised advertising are switched off. Data at the level of individual users and events is deleted at Google Analytics after 14 months at the latest." },
            { type: "p", text: "The legal basis is your consent (Art. 6(1)(a) GDPR, Section 25(1) of the German TDDDG). You decide in the banner on your first visit; declining is as easy as allowing. You can change your decision at any time with effect for the future: open “Cookie settings” in the footer and choose “Decline”. Measuring then stops and this website's Google Analytics cookies are deleted. Your choice is stored in your browser and asked again after twelve months." },
            { type: "p", text: "Google may transfer data to the USA (see Section 10). Your Card Binder otherwise uses no advertising networks, social media plugins, embedded videos or maps, or third-party fonts. Fonts are loaded from the site's own domain. There is no profiling and no automated decision-making within the meaning of Art. 22 GDPR." },
          ],
        },
        {
          heading: "9. Contact by email",
          blocks: [{ type: "p", text: "If you write to me, I process your sender address, your message and any voluntary details in order to reply. The legal basis is Art. 6(1)(b) GDPR where a contract or pre-contractual questions are concerned, otherwise Art. 6(1)(f) GDPR. I delete the data once it is no longer needed for the purpose and no statutory retention duties apply." }],
        },
        {
          heading: "10. Recipients and transfers to third countries",
          blocks: [
            { type: "p", text: "Recipients of connection data are Cloudflare (hosting), TCGdex (card data and images), CardTrader (images as a fallback), Google (web analytics, only if you agree) and, after your click, the respective marketplace or shop. A transfer to countries outside the EU and the EEA cannot be ruled out, for example to Cloudflare in the USA or to marketplaces based outside the EU. Cloudflare and Google state that they rely on the EU–US Data Privacy Framework and Standard Contractual Clauses. For the other providers their own safeguards apply." },
            { type: "p", text: "Your Card Binder's source code and public catalogue data are kept in a public GitHub repository. Visiting Your Card Binder makes no connection to GitHub, and your binders do not get there." },
          ],
        },
        {
          heading: "11. Your rights",
          blocks: [
            { type: "p", text: "Under the GDPR you have the following rights against the controller:" },
            { type: "ul", items: [
              "Access to the data processed about you (Art. 15 GDPR)",
              "Rectification of inaccurate data (Art. 16 GDPR)",
              "Erasure (Art. 17 GDPR)",
              "Restriction of processing (Art. 18 GDPR)",
              "Data portability (Art. 20 GDPR)",
              "Objection to processing based on Art. 6(1)(f) GDPR on grounds relating to your particular situation (Art. 21 GDPR)",
              "Withdrawal of consent with effect for the future (Art. 7(3) GDPR). Your Card Binder currently processes nothing on the basis of consent.",
            ] },
            { type: "p", text: `To exercise them, write to ${OPERATOR.email}. You can view, export and delete the data in your browser yourself at any time, because Your Card Binder does not receive it. Data arising at Cloudflare, TCGdex or the marketplaces falls under their own responsibility; please contact the respective provider about it.` },
          ],
        },
        {
          heading: "12. Right to lodge a complaint",
          blocks: [{ type: "p", text: "You have the right to lodge a complaint with a data protection supervisory authority. For the controller this is the Berlin Commissioner for Data Protection and Freedom of Information, Alt-Moabit 59–61, 10555 Berlin (datenschutz-berlin.de). You can also contact the supervisory authority where you live." }],
        },
        {
          heading: "13. Security and changes",
          blocks: [
            { type: "p", text: "The website is delivered only encrypted over HTTPS. It uses a strict Content Security Policy that limits connections and images to its own domain, the two TCGdex addresses and, for images, cardtrader.com, and it loads no scripts from third-party servers." },
            { type: "p", text: "If the website changes, for example through an account, statistics or new embedded services, I will update this policy beforehand. Last updated: 20 October 2026." },
          ],
        },
      ],
    },
  },
];

export function legalById(id: LegalDocument["id"]): LegalDocument {
  return LEGAL.find((document) => document.id === id)!;
}

export function legalSlug(language: PageLanguage, id: LegalDocument["id"]): string {
  return legalById(id)[language].slug;
}
