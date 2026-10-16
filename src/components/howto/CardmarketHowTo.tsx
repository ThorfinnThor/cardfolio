import Link from "next/link";
import type { ReactNode } from "react";

import { CARDMARKET_POKEMON_WANTS_URL, CARDMARKET_SHOPPING_WIZARD_HELP_URL } from "@/domain/cardmarket-handoff";
import { cardmarketMinimumCondition, conditionProfiles } from "@/domain/purchase-preferences";

import { MockMassChange, MockPaste, MockToolbar, MockWantsTable } from "./CardmarketMocks";
import styles from "./howto.module.css";

const CARDMARKET_HOME_URL = "https://www.cardmarket.com/de/Pokemon";

function External({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
}

function Figure({ children, caption }: { children: ReactNode; caption: string }) {
  return (
    <figure className={styles.figure}>
      {children}
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

const STEPS = [
  { id: "schritt-1", title: "Konto anlegen oder anmelden" },
  { id: "schritt-2", title: "Liste in Cardfolio kopieren" },
  { id: "schritt-3", title: "Karten in eine Wants-Liste einfügen" },
  { id: "schritt-4", title: "Prüfen, ob alle Karten angekommen sind" },
  { id: "schritt-5", title: "Den Kartenzustand für alle Karten einstellen" },
  { id: "schritt-6", title: "Verkäufer finden" },
  { id: "schritt-7", title: "Warenkorb prüfen und bezahlen" },
] as const;

export function CardmarketHowTo() {
  return (
    <main className={styles.page}>
      <Link className={styles.back} href="/">← Zurück zu Cardfolio</Link>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Anleitung</p>
        <h1>Karten bei Cardmarket kaufen – Schritt für Schritt</h1>
        <p>So kommst du von der fertigen Liste in Cardfolio zu den Karten im Warenkorb. Cardfolio verkauft nichts: Gekauft wird bei Cardmarket, einem Marktplatz, auf dem viele Verkäufer ihre Karten anbieten.</p>
      </header>

      <nav className={styles.toc} aria-label="Schritte dieser Anleitung">
        <ol>
          {STEPS.map((step) => <li key={step.id}><a href={`#${step.id}`}>{step.title}</a></li>)}
        </ol>
      </nav>

      <aside className={styles.note} aria-label="Hinweis zu den Bildern">
        <strong>Zu den Bildern:</strong> Die Abbildungen sind vereinfachte, selbst gezeichnete Ansichten der Cardmarket-Seite, keine Screenshots. Knopfnamen und Aussehen können bei Cardmarket leicht abweichen. Wenn etwas anders heißt, such nach dem ähnlichsten Begriff.
      </aside>

      <section className={styles.step} id="schritt-1" aria-labelledby="schritt-1-title">
        <h2 id="schritt-1-title"><span>1</span> Konto anlegen oder anmelden</h2>
        <p>Öffne <External href={CARDMARKET_HOME_URL}>Cardmarket</External> und melde dich an. Hast du noch kein Konto, legst du dort eines an.</p>
        <p>Das Konto brauchst du für den Einkaufsassistenten („Shopping Wizard“), der dir später die passenden Verkäufer zusammenstellt. Er funktioniert laut Cardmarket-Hilfe nur, wenn du angemeldet bist.</p>
      </section>

      <section className={styles.step} id="schritt-2" aria-labelledby="schritt-2-title">
        <h2 id="schritt-2-title"><span>2</span> Liste in Cardfolio kopieren</h2>
        <p>In Cardfolio klickst du auf den großen Knopf <b>„… Karten kopieren &amp; Cardmarket öffnen“</b>. Er legt deine Kartenliste in die Zwischenablage und öffnet die Wants-Seite von Cardmarket in einem neuen Tab.</p>
        <p>Die Zwischenablage ist der Ort, aus dem du im nächsten Schritt mit <b>Strg+V</b> (Windows) oder <b>⌘V</b> (Mac) einfügst. Kopiere bis dahin nichts anderes.</p>
      </section>

      <section className={styles.step} id="schritt-3" aria-labelledby="schritt-3-title">
        <h2 id="schritt-3-title"><span>3</span> Karten in eine Wants-Liste einfügen</h2>
        <p>Eine <b>Wants-Liste</b> ist Cardmarkets Wunschliste. Lege eine neue an und gib ihr einen Namen, zum Beispiel „Geschenk Evoli“. Cardmarket erlaubt höchstens 150 Karten pro Liste.</p>
        <Figure caption="Oben auf der Seite der Wants-Liste: Der Knopf „Deck-Liste hinzufügen“ (1) öffnet das Feld zum Einfügen. Rechts daneben stehen „Verkäufer mit den meisten Karten“ und „Shopping Wizard“, die du erst in Schritt 6 brauchst.">
          <MockToolbar highlight="deck" />
        </Figure>
        <ol className={styles.numbered}>
          <li>Klicke auf <b>„Deck-Liste hinzufügen“</b>.</li>
          <li>Klicke in das große Textfeld und füge die Liste ein (<b>Strg+V</b> oder <b>⌘V</b>).</li>
          <li>Klicke auf <b>„Hinzufügen“</b>.</li>
        </ol>
        <Figure caption="Das Einfügefeld (1) und der grüne Knopf „Hinzufügen“ (2). Danach zeigt Cardmarket pro Karte eine Meldung: ein grünes Häkchen heißt „hinzugefügt“, ein rotes Kreuz heißt „nicht hinzugefügt“.">
          <MockPaste />
        </Figure>
      </section>

      <section className={styles.step} id="schritt-4" aria-labelledby="schritt-4-title">
        <h2 id="schritt-4-title"><span>4</span> Prüfen, ob alle Karten angekommen sind</h2>
        <p>Über der Tabelle steht, wie viele Karten in der Liste sind, zum Beispiel <b>„9 Wants – 9 Karten“</b>. Die Zahl sollte zu deiner Cardfolio-Liste passen.</p>
        <Figure caption="Die Zeile „9 Wants – 9 Karten“ (1) zeigt, wie viele Karten angekommen sind. In der Spalte „Zustand“ steht nach dem Einfügen bei jeder Karte „≥ PO“ (rot).">
          <MockWantsTable condition="PO" showCount />
        </Figure>
        <p>Fehlt eine Karte oder zeigt ein rotes Kreuz an, hat Cardmarket sie nicht erkannt. In Cardfolio findest du unter „Anderer Wohnort oder Anbieter?“ → „Einzelsuchen“ einen Suchlink für genau diese Karte.</p>
      </section>

      <section className={styles.step} id="schritt-5" aria-labelledby="schritt-5-title">
        <h2 id="schritt-5-title"><span>5</span> Den Kartenzustand für alle Karten einstellen</h2>
        <p>Das ist der Schritt, den die meisten vergessen. Nach dem Einfügen steht bei jeder Karte <b>„≥ PO“</b>. Das heißt „Poor oder besser“: Cardmarket würde dir auch stark abgenutzte Karten anbieten. Mit der <b>Massenveränderung</b> stellst du den gewünschten Zustand einmal für alle Karten gleichzeitig ein.</p>
        <Figure caption="Schritt für Schritt: (1) Das Kästchen in der Titelzeile der Tabelle markiert alle Karten. (2) „Massenveränderung“ aufklappen. (3) Bei „Mindest-Zustand“ den Zustand wählen, hier „EX“. (4) „Ausgewählte ändern“ klicken.">
          <MockWantsTable condition="PO" markSelectAll />
          <MockMassChange value="EX" />
        </Figure>
        <ol className={styles.numbered}>
          <li>Setze ein Häkchen in das Kästchen in der Titelzeile der Tabelle. Damit sind alle Karten markiert.</li>
          <li>Klappe <b>„Massenveränderung“</b> auf.</li>
          <li>Wähle bei <b>„Mindest-Zustand“</b> den Wert aus der Tabelle unten.</li>
          <li>Klicke auf <b>„Ausgewählte ändern“</b>. Klicke <b>nicht</b> auf den roten Knopf „Ausgewählte löschen“.</li>
        </ol>
        <Figure caption="Danach steht in der Spalte „Zustand“ bei allen Karten der neue Wert, hier „≥ EX“ (blau) statt „≥ PO“.">
          <MockWantsTable condition="EX" />
        </Figure>
        <table className={styles.conditionTable}>
          <caption>Welchen Wert du bei Cardmarket einstellst</caption>
          <thead>
            <tr><th scope="col">In Cardfolio gewählt</th><th scope="col">Bei „Mindest-Zustand“ einstellen</th></tr>
          </thead>
          <tbody>
            {conditionProfiles.map((profile) => {
              const target = cardmarketMinimumCondition(profile.value);
              return (
                <tr key={profile.value}>
                  <th scope="row">{profile.shortLabel}{profile.value === "excellent" ? " (empfohlen)" : ""}</th>
                  <td>≥ {target.code} · {target.label}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p>Die Kürzel stehen für Near Mint (NM, wie neu), Excellent (EX, sehr gut), Light Played (LP), Played (PL) und Poor (PO, schlecht). Für ein Geschenk empfehlen wir <b>EX</b>: kleine Spuren sind okay, sehr abgenutzte Karten kommen nicht infrage.</p>
      </section>

      <section className={styles.step} id="schritt-6" aria-labelledby="schritt-6-title">
        <h2 id="schritt-6-title"><span>6</span> Verkäufer finden</h2>
        <p>Jede Karte wird von einem anderen Verkäufer angeboten, und <b>jede Sendung kostet Versand</b>. Bei sehr günstigen Karten kann der Versand einen großen Teil der Kosten ausmachen. Deshalb hilft Cardmarket beim Zusammenstellen.</p>
        <Figure caption="Rechts oben auf der Wants-Seite: „Verkäufer mit den meisten Karten“ (2) und „Shopping Wizard“ (1).">
          <MockToolbar highlight="wizard" />
        </Figure>
        <h3>Der Shopping Wizard</h3>
        <ol className={styles.numbered}>
          <li>Klicke auf <b>„Shopping Wizard“</b> und wähle deine Wants-Liste.</li>
          <li>Wähle eine Strategie. <b>„Reduce Shipments“</b> sucht möglichst wenige Verkäufer. Das spart meist Versand, kann die Karten selbst aber teurer machen. <b>„Reduce Price“</b> sucht den niedrigsten Gesamtpreis, auch bei mehr Sendungen. Bei vielen günstigen Karten ist „Reduce Shipments“ meist sinnvoll.</li>
          <li>Klicke auf <b>„Run Wizard“</b>.</li>
        </ol>
        <ul>
          <li><b>Neu bei Cardmarket?</b> „Add All to Cart“ funktioniert laut Cardmarket erst nach sechs abgeschlossenen Käufen. Lege die gefundenen Angebote dann einzeln in den Warenkorb.</li>
          <li>Der Wizard durchsucht nicht alle Angebote. Wirkt das Ergebnis zu teuer, schau selbst nach.</li>
          <li>Du kannst den Wizard laut Cardmarket zehnmal pro Tag benutzen.</li>
        </ul>
        <h3>„Verkäufer mit den meisten Karten“</h3>
        <p>Ein weiteres Cardmarket-Werkzeug zum Kaufen ganzer Listen. Der Name sagt es: Es zeigt dir Verkäufer, die möglichst viele deiner Karten selbst anbieten. Wenn du bei einem Verkäufer viele Karten bekommst, zahlst du den Versand nur einmal. Probiere es aus, wenn der Wizard zu teuer wirkt.</p>
        <p>Mehr dazu in der <External href={CARDMARKET_SHOPPING_WIZARD_HELP_URL}>Cardmarket-Hilfe zum Shopping Wizard</External> (auf Englisch).</p>
      </section>

      <section className={styles.step} id="schritt-7" aria-labelledby="schritt-7-title">
        <h2 id="schritt-7-title"><span>7</span> Warenkorb prüfen und bezahlen</h2>
        <ul>
          <li>Prüfe den <b>Endpreis inklusive Versand</b>. Er kann höher sein als der Schätzwert in Cardfolio, denn Cardfolio zeigt nur Kartenpreise ohne Versand.</li>
          <li>Prüfe bei jedem Angebot <b>Sprache</b>, <b>Zustand</b> und die <b>Ausführung</b> (zum Beispiel Holo). Das Einfügen der Liste legt Set, Sprache und Ausführung nicht fest.</li>
          <li>Bezahlt wird bei Cardmarket. Cardfolio hat keinen Zugriff auf dein Konto und löst keinen Kauf aus.</li>
        </ul>
        <p>Den Binder bestellst du getrennt bei einem Shop. Die Empfehlung findest du in Cardfolio auf der Seite „Besorgen“.</p>
      </section>

      <footer className={styles.footer}>
        <p>Stand der Cardmarket-Angaben: Oktober 2026. Die Abläufe und Namen stammen aus Cardmarkets Hilfe und der Wants-Seite und können sich ändern. Cardfolio ist ein unabhängiges Projekt und nicht mit Cardmarket verbunden.</p>
        <p><External href={CARDMARKET_POKEMON_WANTS_URL}>Wants-Seite bei Cardmarket öffnen</External></p>
      </footer>
    </main>
  );
}
