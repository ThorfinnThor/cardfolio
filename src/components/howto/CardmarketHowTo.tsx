"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { CARDMARKET_POKEMON_WANTS_URL, CARDMARKET_SHOPPING_WIZARD_HELP_URL } from "@/domain/cardmarket-handoff";
import { cardmarketMinimumCondition, conditionProfiles } from "@/domain/purchase-preferences";
import { LanguageMenu } from "@/components/foundation/LanguageMenu";
import { useLocale } from "@/i18n/locale";

import styles from "./howto.module.css";

const CARDMARKET_HOME_URL = "https://www.cardmarket.com/de/Pokemon";

function External({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
}

const SHOTS = {
  "wants-liste-anlegen": [1400, 412],
  "deck-liste-knopf": [1400, 301],
  "liste-einfuegen": [1400, 674],
  "wants-uebersicht": [1400, 517],
  "alle-markieren": [1400, 517],
  "zustand-waehlen": [1400, 571],
  "zustand-uebernehmen": [1400, 571],
  "zustand-gesetzt": [1400, 571],
  "sprache-waehlen": [1400, 517],
  "wizard-liste": [1400, 481],
  "wizard-auswahl": [1400, 589],
  "wizard-strategie": [1400, 589],
  "wizard-ergebnis": [1400, 674],
  warenkorb: [1139, 669],
} as const;

type ShotName = keyof typeof SHOTS;

/** A real screenshot of the Cardmarket page; the user name is blurred and the numbered frames match the caption. */
function Shot({ name, alt, caption }: { name: ShotName; alt: string; caption: string }) {
  const { locale } = useLocale();
  const [width, height] = SHOTS[name];
  return (
    <figure className={styles.figure}>
      <a href={`/howto/cardmarket/${name}.webp`} target="_blank" rel="noopener noreferrer" aria-label={locale === "en" ? "Open full-size image" : "Bild in voller Größe öffnen"}>
        {/* eslint-disable-next-line @next/next/no-img-element -- a static export without the image optimiser */}
        <img className={styles.shot} src={`/howto/cardmarket/${name}.webp`} width={width} height={height} alt={alt} loading="lazy" decoding="async" />
      </a>
      <figcaption>{caption} <span className={styles.zoomHint}>{locale === "en" ? "Select to enlarge." : "Antippen zum Vergrößern."}</span></figcaption>
    </figure>
  );
}

const STEPS = [
  { id: "schritt-1", title: "Konto anlegen oder anmelden" },
  { id: "schritt-2", title: "Liste in Your Card Binder kopieren" },
  { id: "schritt-3", title: "Wants-Liste anlegen und Karten einfügen" },
  { id: "schritt-4", title: "Prüfen, ob alle Karten angekommen sind" },
  { id: "schritt-5", title: "Den Kartenzustand für alle Karten einstellen" },
  { id: "schritt-6", title: "Die Kartensprache einstellen" },
  { id: "schritt-7", title: "Verkäufer finden mit dem Shopping Wizard" },
  { id: "schritt-8", title: "Warenkorb prüfen und bezahlen" },
] as const;

const CONDITIONS = [
  { code: "MT", name: "Mint", text: "Makellos, wie frisch aus der Packung. Selten und am teuersten." },
  { code: "NM", name: "Near Mint", text: "Praktisch neu, höchstens winzige Spuren. Am schönsten, aber deutlich teurer." },
  { code: "EX", name: "Excellent", text: "Auf den ersten Blick kaum Spuren, höchstens leicht abgestoßene Ecken oder Ränder.", pick: true },
  { code: "GD", name: "Good", text: "Sichtbar benutzt: abgenutzte Ecken und Kanten, leichte Kratzer." },
  { code: "LP", name: "Light Played", text: "Deutlich benutzt, kleine Knicke und Kratzer sind möglich." },
  { code: "PL", name: "Played", text: "Stark benutzt. Als Geschenk nicht empfohlen." },
  { code: "PO", name: "Poor", text: "Stark beschädigt. Nur nehmen, wenn der Zustand wirklich egal ist." },
] as const;

const STEPS_EN = [
  { id: "schritt-1", title: "Create an account or sign in" },
  { id: "schritt-2", title: "Copy the list in Your Card Binder" },
  { id: "schritt-3", title: "Create a wants list and add cards" },
  { id: "schritt-4", title: "Check that every card was added" },
  { id: "schritt-5", title: "Set the condition for every card" },
  { id: "schritt-6", title: "Set the card language" },
  { id: "schritt-7", title: "Find sellers with the Shopping Wizard" },
  { id: "schritt-8", title: "Review the cart and pay" },
] as const;

const CONDITIONS_EN = [
  { code: "MT", name: "Mint", text: "Flawless, as if fresh from the pack. Rare and usually most expensive." },
  { code: "NM", name: "Near Mint", text: "Virtually new, with at most tiny signs of wear." },
  { code: "EX", name: "Excellent", text: "Hardly any wear at first glance; corners or edges may be lightly worn.", pick: true },
  { code: "GD", name: "Good", text: "Visibly used, with worn corners, edges or light scratches." },
  { code: "LP", name: "Light Played", text: "Clearly used; small creases and scratches are possible." },
  { code: "PL", name: "Played", text: "Heavily used. Not recommended for a gift." },
  { code: "PO", name: "Poor", text: "Heavily damaged. Choose only if condition does not matter." },
] as const;

function CardmarketHowToEnglish() {
  return (
    <main className={styles.page}>
      <div className={styles.topline}>
        <Link className={styles.back} href="/app/">← Back to Your Card Binder</Link>
        <LanguageMenu />
      </div>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Buying guide</p>
        <h1>Buying cards on Cardmarket – step by step</h1>
        <p>Follow these steps to move your prepared Your Card Binder list into a Cardmarket cart. Your Card Binder does not sell cards. Cardmarket is mainly used in Europe; TCGplayer is the common marketplace in the USA.</p>
      </header>

      <nav className={styles.toc} aria-label="Steps in this guide">
        <ol>{STEPS_EN.map((step) => <li key={step.id}><a href={`#${step.id}`}>{step.title}</a></li>)}</ol>
      </nav>

      <aside className={styles.note} aria-label="Note about the images">
        <strong>About the images:</strong> The screenshots show Cardmarket in October 2026. Numbered yellow frames mark where to click. Cardmarket may change labels or layout, so look for the closest matching option if something differs.
      </aside>

      <section className={styles.step} id="schritt-1" aria-labelledby="schritt-1-title">
        <h2 id="schritt-1-title"><span>1</span> Create an account or sign in</h2>
        <p>Open <External href={CARDMARKET_HOME_URL}>Cardmarket</External> and sign in. If you do not have an account, create one there.</p>
        <p>You need an account for the Shopping Wizard, which combines suitable sellers later in the process.</p>
      </section>

      <section className={styles.step} id="schritt-2" aria-labelledby="schritt-2-title">
        <h2 id="schritt-2-title"><span>2</span> Copy the list in Your Card Binder</h2>
        <p>In Your Card Binder, select the large <b>“Copy cards &amp; open Cardmarket”</b> button. It copies the prepared list and opens Cardmarket’s Wants section in a new tab.</p>
        <p>Do not copy anything else before pasting the list with <b>Ctrl+V</b> on Windows or <b>⌘V</b> on Mac.</p>
      </section>

      <section className={styles.step} id="schritt-3" aria-labelledby="schritt-3-title">
        <h2 id="schritt-3-title"><span>3</span> Create a wants list and add cards</h2>
        <p>A wants list is Cardmarket’s wish list. Cardmarket allows up to 150 cards per list.</p>
        <h3 className={styles.sub}>Create the list</h3>
        <p>On the Wants page, enter a name under <b>“New Wants List”</b> and select <b>“Add List”</b>. Use letters and numbers only, with no spaces.</p>
        <Shot name="wants-liste-anlegen" alt="Cardmarket Wants page with the new-list field and Add List button highlighted." caption="Enter a name and add the new list (1)." />
        <h3 className={styles.sub}>Add the cards</h3>
        <p>Open the empty list and select <b>“Add Deck List”</b>.</p>
        <Shot name="deck-liste-knopf" alt="An empty wants list with the Add Deck List button highlighted." caption="The Add Deck List button (1) opens the input area." />
        <ol className={styles.numbered}>
          <li>Select the large text area and paste with <b>Ctrl+V</b> or <b>⌘V</b>.</li>
          <li>Select the green <b>“Add to [your list name]”</b> button.</li>
        </ol>
        <Shot name="liste-einfuegen" alt="The deck-list input, add button and Cardmarket result message." caption="Paste into the text area (1), then select the green button (2). Cardmarket confirms which cards were added below." />
        <p className={styles.tip}><b>Good to know:</b> Cardmarket may display a translated Pokémon name. That is expected when the set and attacks match.</p>
      </section>

      <section className={styles.step} id="schritt-4" aria-labelledby="schritt-4-title">
        <h2 id="schritt-4-title"><span>4</span> Check that every card was added</h2>
        <p>Open your list and compare the number above the table with the number in Your Card Binder. For example, a nine-card binder should show nine cards.</p>
        <Shot name="wants-uebersicht" alt="Cardmarket wants list showing the number of cards above the table." caption="The count above the table (1) shows how many cards were added. Each card initially shows condition ≥ PO." />
        <p>If Cardmarket did not recognise a card, return to Your Card Binder and use its individual search link.</p>
      </section>

      <section className={styles.step} id="schritt-5" aria-labelledby="schritt-5-title">
        <h2 id="schritt-5-title"><span>5</span> Set the condition for every card</h2>
        <p>Cardmarket initially shows <b>≥ PO</b>, meaning Poor or better. Use the bulk change to set the condition once for all cards.</p>
        <ol className={styles.numbered}>
          <li>Select the checkbox in the table header to mark every card.</li>
          <li>Expand <b>“Bulk Editing”</b>.</li>
        </ol>
        <Shot name="alle-markieren" alt="Cardmarket wants list with the select-all checkbox and bulk-editing bar highlighted." caption="Select all cards (1), then expand bulk editing (2)." />
        <ol className={styles.numbered} style={{ counterReset: "howto 2" }}>
          <li>Set <b>“Minimum condition”</b> to the Your Card Binder recommendation. We normally recommend <b>EX</b>.</li>
          <li>Select <b>“Change selected”</b>, not the red delete button.</li>
        </ol>
        <Shot name="zustand-waehlen" alt="The minimum-condition menu with EX selected." caption="Choose the minimum condition (1). EX is selected in this example." />
        <Shot name="zustand-uebernehmen" alt="Selected cards, condition EX and the Change selected button." caption="With all cards selected and condition EX set, select Change selected (3)." />
        <Shot name="zustand-gesetzt" alt="Cardmarket confirmation and EX condition on every card." caption="The green message confirms the change. Every card now shows ≥ EX." />

        <h3 className={styles.sub}>Which condition is right?</h3>
        <p>Better condition usually costs more. Near Mint looks best, while Excellent normally allows many more listings and is our recommended balance for a gift.</p>
        <table className={styles.conditionTable}>
          <caption>Cardmarket conditions</caption>
          <thead><tr><th scope="col">Code</th><th scope="col">Meaning</th></tr></thead>
          <tbody>{CONDITIONS_EN.map((condition) => <tr key={condition.code} data-pick={"pick" in condition ? "true" : undefined}><th scope="row">{condition.code} · {condition.name}{"pick" in condition ? " (recommended)" : ""}</th><td className={styles.plain}>{condition.text}</td></tr>)}</tbody>
        </table>
        <p>“≥ EX” means Excellent or better. For valuable cards, still review the listing photos and seller description.</p>
      </section>

      <section className={styles.step} id="schritt-6" aria-labelledby="schritt-6-title">
        <h2 id="schritt-6-title"><span>6</span> Set the card language</h2>
        <p>Without a language filter, Cardmarket can return cards in any language. Set the language in the same bulk-editing panel.</p>
        <ol className={styles.numbered}>
          <li>Select all cards and expand bulk editing again.</li>
          <li>Choose the required language under <b>“Languages”</b>.</li>
          <li>Select <b>“Change selected”</b>.</li>
        </ol>
        <Shot name="sprache-waehlen" alt="Bulk editing with the language selector and condition EX." caption="The selected language appears as a flag (1). Minimum condition remains EX." />
        <p className={styles.tip}><b>Tip:</b> Set condition and language together, then apply the change once.</p>
      </section>

      <section className={styles.step} id="schritt-7" aria-labelledby="schritt-7-title">
        <h2 id="schritt-7-title"><span>7</span> Find sellers with the Shopping Wizard</h2>
        <p>Every seller charges shipping separately. The Shopping Wizard helps combine your cards into sensible orders.</p>
        <h3 className={styles.sub}>1. Choose your wants list</h3>
        <p>Open <b>“Shopping Wizard”</b>, choose your list and select <b>“Next”</b>.</p>
        <Shot name="wizard-liste" alt="Shopping Wizard with the wants list and Next button highlighted." caption="Choose your list and select Next (1)." />
        <h3 className={styles.sub}>2. Choose sellers</h3>
        <p>For seller location, selecting all of Europe usually provides more listings. International shipping may take longer and cost more.</p>
        <Shot name="wizard-auswahl" alt="Shopping Wizard seller-location options and Next button." caption="Choose the seller region (1), then select Next (2)." />
        <h3 className={styles.sub}>3. Choose a strategy</h3>
        <p><b>“Reduce price”</b> favours lower card prices across more sellers. <b>“Reduce shipments”</b> favours fewer sellers and often saves shipping on inexpensive cards.</p>
        <Shot name="wizard-strategie" alt="The Reduce price and Reduce shipments strategies." caption="Choose Reduce price (1) or Reduce shipments (2)." />
        <h3 className={styles.sub}>4. Review the result</h3>
        <p>Review item value, shipping cost, total and number of sellers before adding the results to the cart.</p>
        <Shot name="wizard-ergebnis" alt="Shopping Wizard result showing item value, shipping, total and Add to cart." caption="Review the summary (1), then add the results to the cart (2)." />
        <p className={styles.tip}><b>Remember:</b> Shipping can cost more than inexpensive cards. If the total is too high, reduce the number of cards or choose fewer sellers.</p>
        <p>Read the <External href={CARDMARKET_SHOPPING_WIZARD_HELP_URL}>Cardmarket Shopping Wizard help</External> for the marketplace’s current rules.</p>
      </section>

      <section className={styles.step} id="schritt-8" aria-labelledby="schritt-8-title">
        <h2 id="schritt-8-title"><span>8</span> Review the cart and pay</h2>
        <p>Each seller is a separate order with separate shipping.</p>
        <Shot name="warenkorb" alt="A seller section in the cart showing shipping, card condition and language." caption="Review the seller total, shipping method, card condition and language." />
        <ul>
          <li>Check the <b>final total including shipping</b>.</li>
          <li>Review <b>language</b>, <b>condition</b> and <b>printing</b> for every listing.</li>
          <li>For valuable cards, consider tracked shipping.</li>
          <li>Payment happens on Cardmarket. Your Card Binder has no access to your account and makes no purchase.</li>
        </ul>
        <p>Order the physical binder separately using the recommendation in Your Card Binder.</p>
      </section>

      <footer className={styles.footer}>
        <p>Cardmarket information checked in October 2026. Labels and flows may change. Your Card Binder is independent and is not affiliated with Cardmarket.</p>
        <p><External href={CARDMARKET_POKEMON_WANTS_URL}>Open the Cardmarket Wants page</External></p>
      </footer>
    </main>
  );
}

export function CardmarketHowTo() {
  const { locale } = useLocale();
  if (locale === "en") return <CardmarketHowToEnglish />;
  return (
    <main className={styles.page}>
      <div className={styles.topline}>
        <Link className={styles.back} href="/app/">← Zurück zu Your Card Binder</Link>
        <LanguageMenu />
      </div>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Anleitung</p>
        <h1>Karten bei Cardmarket kaufen – Schritt für Schritt</h1>
        <p>So kommst du von der fertigen Liste in Your Card Binder zu den Karten im Warenkorb. Your Card Binder verkauft nichts: Gekauft wird bei Cardmarket, einem Marktplatz, auf dem viele Verkäufer ihre Karten anbieten. Cardmarket wird vor allem in Europa genutzt. In den USA ist TCGplayer der übliche Marktplatz.</p>
      </header>

      <nav className={styles.toc} aria-label="Schritte dieser Anleitung">
        <ol>
          {STEPS.map((step) => <li key={step.id}><a href={`#${step.id}`}>{step.title}</a></li>)}
        </ol>
      </nav>

      <aside className={styles.note} aria-label="Hinweis zu den Bildern">
        <strong>Zu den Bildern:</strong> Die Abbildungen sind Screenshots der Cardmarket-Seite vom Oktober 2026, der Benutzername ist unkenntlich gemacht. Die gelben Rahmen mit Zahlen zeigen, wohin du klickst. Cardmarket kann Aussehen und Knopfnamen ändern. Wenn etwas anders heißt, such nach dem ähnlichsten Begriff.
      </aside>

      <section className={styles.step} id="schritt-1" aria-labelledby="schritt-1-title">
        <h2 id="schritt-1-title"><span>1</span> Konto anlegen oder anmelden</h2>
        <p>Öffne <External href={CARDMARKET_HOME_URL}>Cardmarket</External> und melde dich an. Hast du noch kein Konto, legst du dort kostenlos eines an.</p>
        <p>Das Konto brauchst du für den Einkaufsassistenten („Shopping Wizard“), der dir später die passenden Verkäufer zusammenstellt. Er funktioniert laut Cardmarket-Hilfe nur, wenn du angemeldet bist.</p>
      </section>

      <section className={styles.step} id="schritt-2" aria-labelledby="schritt-2-title">
        <h2 id="schritt-2-title"><span>2</span> Liste in Your Card Binder kopieren</h2>
        <p>In Your Card Binder klickst du auf den großen Knopf <b>„… Karten kopieren &amp; Cardmarket öffnen“</b>. Er legt deine Kartenliste in die Zwischenablage und öffnet die Wants-Seite von Cardmarket in einem neuen Tab.</p>
        <p>Die Zwischenablage ist der Ort, aus dem du gleich mit <b>Strg+V</b> (Windows) oder <b>⌘V</b> (Mac) einfügst. Kopiere bis dahin nichts anderes.</p>
      </section>

      <section className={styles.step} id="schritt-3" aria-labelledby="schritt-3-title">
        <h2 id="schritt-3-title"><span>3</span> Wants-Liste anlegen und Karten einfügen</h2>
        <p>Eine <b>Wants-Liste</b> ist Cardmarkets Wunschliste. Cardmarket erlaubt höchstens 150 Karten pro Liste.</p>
        <h3 className={styles.sub}>Liste anlegen</h3>
        <p>Auf der Seite „Wants“ tippst du bei <b>„Neue Wantsliste“</b> einen Namen ein und klickst auf <b>„Liste hinzufügen“</b>. Erlaubt sind nur Buchstaben und Ziffern, höchstens 30 Zeichen und <b>keine Leerzeichen</b>, zum Beispiel <b>GeschenkEvoli</b>.</p>
        <Shot name="wants-liste-anlegen" alt="Die Seite Wants bei Cardmarket mit dem Feld Neue Wantsliste und dem grünen Knopf Liste hinzufügen, beide gelb umrahmt." caption="Name eintippen und auf „Liste hinzufügen“ klicken (1). Im Beispiel heißt die Liste „CardfolioTutorial“." />
        <h3 className={styles.sub}>Karten einfügen</h3>
        <p>Danach öffnet sich die leere Liste. Klicke auf <b>„Deck-Liste hinzufügen“</b>.</p>
        <Shot name="deck-liste-knopf" alt="Die leere Wants-Liste mit dem gelb umrahmten Knopf Deck-Liste hinzufügen." caption="Der Knopf „Deck-Liste hinzufügen“ (1) öffnet das Feld zum Einfügen." />
        <ol className={styles.numbered}>
          <li>Klicke in das große Textfeld und füge die Liste ein (<b>Strg+V</b> oder <b>⌘V</b>).</li>
          <li>Klicke auf den grünen Knopf darunter. Er heißt <b>„Zu [Name deiner Liste] hinzufügen“</b>.</li>
        </ol>
        <Shot name="liste-einfuegen" alt="Das Einfügefeld mit neun Karten, darunter der grüne Knopf zum Hinzufügen und eine grüne Meldung, welche Karten hinzugefügt wurden." caption="Das Einfügefeld (1) und der grüne Knopf (2). Darunter bestätigt Cardmarket in einem grünen Kasten, was hinzugefügt wurde (die Meldung kann auf Englisch erscheinen)." />
        <p className={styles.tip}><b>Gut zu wissen:</b> Cardmarket zeigt die Karten mit dem deutschen Namen, auch wenn in deiner Liste der englische steht (im Beispiel wird aus „Blaziken“ die Karte „Lohgock“). Das ist richtig, solange Set und Attacken passen.</p>
      </section>

      <section className={styles.step} id="schritt-4" aria-labelledby="schritt-4-title">
        <h2 id="schritt-4-title"><span>4</span> Prüfen, ob alle Karten angekommen sind</h2>
        <p>Klicke oben auf den Namen deiner Liste („Wants“ → Liste). Über der Tabelle steht, wie viele Karten in der Liste sind, zum Beispiel <b>„9 Wants – 9 Karten“</b>. Die Zahl sollte zu deiner Your Card Binder-Liste passen.</p>
        <Shot name="wants-uebersicht" alt="Die Wants-Liste mit der Überschrift 9 Wants – 9 Karten, gelb umrahmt, und der Tabelle darunter." caption="Die Zeile „9 Wants – 9 Karten“ (1) zeigt, wie viele Karten angekommen sind. In der Spalte „Zustand“ steht bei jeder Karte zunächst „≥ PO“ (rot)." />
        <p>Fehlt eine Karte, hat Cardmarket sie nicht erkannt. In Your Card Binder findest du unter „Anderer Wohnort oder Anbieter?“ → „Einzelsuchen“ einen Suchlink für genau diese Karte.</p>
      </section>

      <section className={styles.step} id="schritt-5" aria-labelledby="schritt-5-title">
        <h2 id="schritt-5-title"><span>5</span> Den Kartenzustand für alle Karten einstellen</h2>
        <p>Das ist der Schritt, den die meisten vergessen. Nach dem Einfügen steht bei jeder Karte <b>„≥ PO“</b>. Das heißt „Poor oder besser“: Cardmarket würde dir auch stark abgenutzte Karten anbieten. Mit der <b>Massenveränderung</b> stellst du den gewünschten Zustand einmal für alle Karten gleichzeitig ein.</p>
        <ol className={styles.numbered}>
          <li>Setze ein Häkchen in das Kästchen in der Titelzeile der Tabelle. Damit sind alle Karten markiert.</li>
          <li>Klappe <b>„Massenveränderung“</b> auf.</li>
        </ol>
        <Shot name="alle-markieren" alt="Die Wants-Liste mit gelb umrahmtem Kästchen in der Titelzeile und der blauen Leiste Massenveränderung." caption="(1) Das Kästchen in der Titelzeile markiert alle Karten. (2) „Massenveränderung“ aufklappen." />
        <ol className={styles.numbered} style={{ counterReset: "howto 2" }}>
          <li>Öffne die Auswahl bei <b>„Mindest-Zustand“</b> und wähle den Wert aus der Tabelle weiter unten. Wir empfehlen <b>EX</b>.</li>
        </ol>
        <Shot name="zustand-waehlen" alt="Die geöffnete Auswahl Mindest-Zustand mit den Werten MT, NM, EX, GD, LP, PL und PO." caption="Die Auswahl „Mindest-Zustand“ (1) mit allen Werten. Hier ist „EX“ ausgewählt." />
        <ol className={styles.numbered} style={{ counterReset: "howto 3" }}>
          <li>Klicke auf <b>„Ausgewählte ändern“</b>. Klicke <b>nicht</b> auf den roten Knopf „Ausgewählte löschen“.</li>
        </ol>
        <Shot name="zustand-uebernehmen" alt="Alle Karten sind markiert, bei Mindest-Zustand steht EX, der Knopf Ausgewählte ändern ist gelb umrahmt." caption="Alle Karten sind markiert (1), „Mindest-Zustand“ steht auf „EX“ (2). Jetzt auf „Ausgewählte ändern“ klicken (3)." />
        <Shot name="zustand-gesetzt" alt="Eine grüne Meldung bestätigt die Änderung, in der Spalte Zustand steht bei allen Karten EX." caption="Cardmarket bestätigt „Deine Änderungen wurden erfolgreich übernommen.“ (1). In der Spalte „Zustand“ steht jetzt „≥ EX“ statt „≥ PO“." />

        <h3 className={styles.sub}>Welcher Zustand ist der richtige?</h3>
        <p>Je besser der Zustand, desto teurer die Karte. <b>Near Mint</b> ist am schönsten, aber deutlich teurer. Wie groß der Unterschied ist, hängt von der Karte ab: Bei begehrten Karten ist er groß, bei Karten für ein paar Cent kaum der Rede wert. <b>Excellent</b> sieht auf dem Angebotsfoto meist fast wie neu aus und lässt viel mehr Angebote zu. Darum ist es unser Kompromiss für ein Geschenk.</p>
        <table className={styles.conditionTable}>
          <caption>Die Zustände bei Cardmarket</caption>
          <thead>
            <tr><th scope="col">Kürzel</th><th scope="col">Bedeutung</th></tr>
          </thead>
          <tbody>
            {CONDITIONS.map((condition) => (
              <tr key={condition.code} data-pick={"pick" in condition ? "true" : undefined}>
                <th scope="row">{condition.code} · {condition.name}{"pick" in condition ? " (empfohlen)" : ""}</th>
                <td className={styles.plain}>{condition.text}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <table className={styles.conditionTable}>
          <caption>Welchen Wert du bei Cardmarket einstellst</caption>
          <thead>
            <tr><th scope="col">In Your Card Binder gewählt</th><th scope="col">Bei „Mindest-Zustand“ einstellen</th></tr>
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
        <p>„≥ EX“ heißt „Excellent oder besser“: Mint, Near Mint und Excellent sind erlaubt. Prüfe bei wertvollen Karten trotzdem die Angebotsfotos und die Beschreibung des Verkäufers.</p>
      </section>

      <section className={styles.step} id="schritt-6" aria-labelledby="schritt-6-title">
        <h2 id="schritt-6-title"><span>6</span> Die Kartensprache einstellen</h2>
        <p>Ohne Angabe bietet Cardmarket die Karten in jeder Sprache an. Für ein Geschenk willst du meist eine bestimmte, zum Beispiel <b>Deutsch</b>. Das stellst du in derselben Massenveränderung ein.</p>
        <ol className={styles.numbered}>
          <li>Alle Karten markieren und „Massenveränderung“ aufklappen, wie in Schritt 5.</li>
          <li>Bei <b>„Sprachen“</b> die gewünschte Sprache wählen. Sie erscheint als Flagge.</li>
          <li>Auf <b>„Ausgewählte ändern“</b> klicken.</li>
        </ol>
        <Shot name="sprache-waehlen" alt="Die Massenveränderung mit gelb umrahmtem Feld Sprachen, in dem die deutsche Flagge gewählt ist, und Mindest-Zustand EX." caption="Bei „Sprachen“ (1) ist hier die deutsche Flagge gewählt. Daneben steht „Mindest-Zustand“ auf „EX“." />
        <p className={styles.tip}><b>Tipp:</b> Zustand und Sprache kannst du in einem Durchgang setzen: erst beide Felder ausfüllen, dann einmal „Ausgewählte ändern“. Passt die Sprache nicht zu dem, was du in Your Card Binder gewählt hast, findest du weniger oder andere Angebote.</p>
      </section>

      <section className={styles.step} id="schritt-7" aria-labelledby="schritt-7-title">
        <h2 id="schritt-7-title"><span>7</span> Verkäufer finden mit dem Shopping Wizard</h2>
        <p>Jede Karte wird von einem anderen Verkäufer angeboten, und <b>jede Sendung kostet Versand</b>. Bei sehr günstigen Karten kann der Versand mehr kosten als die Karten. Deshalb hilft dir der Shopping Wizard beim Zusammenstellen.</p>

        <h3 className={styles.sub}>1. Wants-Liste wählen</h3>
        <p>Klicke oben rechts auf der Wants-Seite auf <b>„Shopping Wizard“</b>. Wähle deine Liste und klicke auf <b>„Nächste“</b>.</p>
        <Shot name="wizard-liste" alt="Der erste Schritt des Shopping Wizards: Auswahl der Wants-Liste und der Knopf Nächste, gelb umrahmt." caption="Deine Liste (hier „CardfolioTutorial (9)“) auswählen und auf „Nächste“ klicken (1)." />

        <h3 className={styles.sub}>2. Auswahl treffen</h3>
        <p>Hier legst du fest, von wem du kaufen möchtest. Wir empfehlen bei <b>„Standort des Verkäufers“</b> ganz <b>Europa</b> zu wählen, nicht nur Deutschland. Dann sind mehr Verkäufer dabei und die Karten manchmal etwas günstiger. Dafür kann der Versand aus dem Ausland ein paar Tage länger dauern und etwas mehr kosten. Die anderen Filter (Verkäuferstatus, Bewertung, Versandzeit) kannst du zunächst so lassen.</p>
        <Shot name="wizard-auswahl" alt="Der zweite Schritt des Shopping Wizards mit dem gelb umrahmten Feld Standort des Verkäufers (Europa und Deutschland) und dem Knopf Nächste." caption="„Standort des Verkäufers“ (1): hier sind „Europa“ und „Deutschland“ gewählt. Danach auf „Nächste“ klicken (2)." />

        <h3 className={styles.sub}>3. Strategie wählen</h3>
        <p>Der Wizard fragt, worauf er achten soll:</p>
        <ul>
          <li><b>„Preis reduzieren“</b> legt den Fokus auf den Kartenpreis. Das gibt mehr Bestellungen bei verschiedenen Verkäufern, dafür sind die Karten einzeln günstiger.</li>
          <li><b>„Bestellungen reduzieren“</b> legt den Fokus auf wenige Bestellungen. Die Karten sind etwas teurer, du sparst aber Versandkosten.</li>
        </ul>
        <p>Bei vielen günstigen Karten ist meist „Bestellungen reduzieren“ sinnvoll, weil der Versand sonst den größten Teil der Kosten ausmacht. Klicke danach auf <b>„Wizard ausführen“</b>.</p>
        <Shot name="wizard-strategie" alt="Der dritte Schritt des Shopping Wizards mit den zwei Strategien Preis reduzieren und Bestellungen reduzieren." caption="Die zwei Strategien: „Preis reduzieren“ (1) und „Bestellungen reduzieren“ (2)." />

        <h3 className={styles.sub}>4. Ergebnis ansehen</h3>
        <p>Der Wizard zeigt dir oben die Zusammenfassung: Kartenwert („Artikelwert“), „Versandkosten“, „Gesamtsumme“ und die Zahl der „Bestellungen“ (also der Verkäufer). Darunter steht pro Verkäufer, was du dort bekommst.</p>
        <Shot name="wizard-ergebnis" alt="Die Ergebnisübersicht des Shopping Wizards mit Artikelwert, Versandkosten, Gesamtsumme und dem grünen Knopf In den Warenkorb." caption="Die Zusammenfassung (1) mit dem Gesamtpreis, darunter der grüne Knopf „In den Warenkorb“ (2). Die Verkäufernamen sind hier unkenntlich gemacht." />
        <p className={styles.tip}><b>Ein echtes Beispiel:</b> Bei einem Test mit neun Karten betrug der Kartenwert 10,47 € und der Versand 15,82 €, zusammen 26,29 € bei sechs Bestellungen. Der Versand kostete also mehr als die Karten. Das ist bei sehr günstigen Karten normal. Wirkt es dir zu teuer, wähle weniger, dafür bessere Karten.</p>
        <ul>
          <li>Der Knopf <b>„In den Warenkorb“</b> legt alle gefundenen Angebote auf einmal hinein. Fehlt er bei dir oder klappt er nicht, lege die Angebote einzeln in den Warenkorb. Laut Cardmarket-Hilfe gilt für neue Konten eine Einschränkung.</li>
          <li>Der Wizard durchsucht nicht alle Angebote. Wirkt das Ergebnis zu teuer, schau selbst nach.</li>
          <li>Du kannst den Wizard laut Cardmarket zehnmal pro Tag benutzen.</li>
        </ul>
        <p>Mehr dazu in der <External href={CARDMARKET_SHOPPING_WIZARD_HELP_URL}>Cardmarket-Hilfe zum Shopping Wizard</External> (auf Englisch).</p>
        <h3 className={styles.sub}>„Verkäufer mit den meisten Karten“</h3>
        <p>Ein weiteres Werkzeug neben dem Wizard. Es zeigt dir Verkäufer, die möglichst viele deiner Karten selbst anbieten. Bei einem Verkäufer mit vielen Karten zahlst du den Versand nur einmal. Probiere es aus, wenn der Wizard zu teuer wirkt.</p>
      </section>

      <section className={styles.step} id="schritt-8" aria-labelledby="schritt-8-title">
        <h2 id="schritt-8-title"><span>8</span> Warenkorb prüfen und bezahlen</h2>
        <p>Im Warenkorb ist jeder Verkäufer ein eigener Block mit eigenem Versand.</p>
        <Shot name="warenkorb" alt="Der Warenkorb mit dem Block eines Verkäufers: Zusammenfassung, Versandmethode, und darunter die Karte mit Zustand EX und deutscher Flagge." caption="Ein Verkäufer im Warenkorb: links die Zusammenfassung mit Versandkosten und Gesamtsumme, in der Mitte die Versandmethode, unten die Karte mit Zustand (EX) und Sprache (Flagge)." />
        <ul>
          <li>Prüfe den <b>Endpreis inklusive Versand</b>. Er kann höher sein als der Schätzwert in Your Card Binder, denn Your Card Binder zeigt nur Kartenpreise ohne Versand.</li>
          <li>Prüfe bei jedem Angebot <b>Sprache</b> (Flagge), <b>Zustand</b> (zum Beispiel EX) und die <b>Ausführung</b> (zum Beispiel Holo). Das Einfügen der Liste legt Set, Sprache und Ausführung nicht fest.</li>
          <li>Bei der <b>Versandmethode</b> steht bei günstigen Briefen „Versand ohne Sendungsverfolgung“. Geht der Brief verloren, gibt es dafür keinen Nachweis. Bei wertvolleren Karten wähle eine Versandart mit Sendungsverfolgung („Weitere Versandoptionen“).</li>
          <li>Bezahlt wird bei Cardmarket. Your Card Binder hat keinen Zugriff auf dein Konto und löst keinen Kauf aus.</li>
        </ul>
        <p>Den Binder bestellst du getrennt bei einem Shop. Die Empfehlung findest du in Your Card Binder auf der Seite „Besorgen“.</p>
      </section>

      <footer className={styles.footer}>
        <p>Stand der Cardmarket-Angaben: Oktober 2026. Die Abläufe und Namen stammen aus Cardmarkets Hilfe und eigenen Tests der Wants-Seite und können sich ändern. Your Card Binder ist ein unabhängiges Projekt und nicht mit Cardmarket verbunden. Cardmarket ist eine Marke der Sammelkartenmarkt GmbH &amp; Co. KG.</p>
        <p><External href={CARDMARKET_POKEMON_WANTS_URL}>Wants-Seite bei Cardmarket öffnen</External></p>
      </footer>
    </main>
  );
}
