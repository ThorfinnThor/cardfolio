"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { LanguageMenu } from "@/components/foundation/LanguageMenu";
import { useLocale } from "@/i18n/locale";

import styles from "./howto.module.css";

const MASS_ENTRY_URL = "https://www.tcgplayer.com/massentry";

function External({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
}

const SHOTS = {
  "liste-einfuegen": [800, 608],
  optionen: [800, 608],
  "add-to-cart": [800, 608],
} as const;

type ShotName = keyof typeof SHOTS;

/** A real screenshot of TCGplayer's Mass Entry page; the numbered yellow frames match the caption. */
function Shot({ name, alt, caption }: { name: ShotName; alt: string; caption: string }) {
  const { locale } = useLocale();
  const [width, height] = SHOTS[name];
  return (
    <figure className={styles.figure}>
      <a href={`/howto/tcgplayer/${name}.webp`} target="_blank" rel="noopener noreferrer" aria-label={locale === "en" ? "Open full-size image" : "Bild in voller Größe öffnen"}>
        {/* eslint-disable-next-line @next/next/no-img-element -- a static export without the image optimiser */}
        <img className={styles.shot} src={`/howto/tcgplayer/${name}.webp`} width={width} height={height} alt={alt} loading="lazy" decoding="async" />
      </a>
      <figcaption>{caption} <span className={styles.zoomHint}>{locale === "en" ? "Select to enlarge." : "Antippen zum Vergrößern."}</span></figcaption>
    </figure>
  );
}

const STEPS = [
  { id: "schritt-1", title: "Konto anlegen oder anmelden" },
  { id: "schritt-2", title: "Liste in Your Card Binder kopieren" },
  { id: "schritt-3", title: "Prüfen, ob die Liste in Mass Entry angekommen ist" },
  { id: "schritt-4", title: "Printing und Zustand einstellen" },
  { id: "schritt-5", title: "Add to Cart und Warenkorb prüfen" },
] as const;

const STEPS_EN = [
  { id: "schritt-1", title: "Create an account or sign in" },
  { id: "schritt-2", title: "Copy the list in Your Card Binder" },
  { id: "schritt-3", title: "Check that the list arrived in Mass Entry" },
  { id: "schritt-4", title: "Set printing and condition" },
  { id: "schritt-5", title: "Add to Cart and review the cart" },
] as const;

function Toc({ steps, label }: { steps: readonly { id: string; title: string }[]; label: string }) {
  return (
    <nav className={styles.toc} aria-label={label}>
      <ol>{steps.map((step) => <li key={step.id}><a href={`#${step.id}`}>{step.title}</a></li>)}</ol>
    </nav>
  );
}

function TcgplayerHowToEnglish() {
  return (
    <main className={styles.page}>
      <div className={styles.topline}>
        <Link className={styles.back} href="/app/">← Back to Your Card Binder</Link>
        <LanguageMenu />
      </div>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Buying guide</p>
        <h1>Buying cards on TCGplayer with Mass Entry</h1>
        <p>TCGplayer is a marketplace mainly for the USA with an English interface and prices in US dollars. Mass Entry takes a whole card list at once. Your Card Binder does not sell cards and never places an order.</p>
      </header>

      <Toc steps={STEPS_EN} label="Steps in this guide" />

      <aside className={styles.note} aria-label="Note about the images">
        <strong>About the images:</strong> The screenshots show TCGplayer in October 2026 (desktop view, personal details removed). Numbered yellow frames mark what the text refers to. TCGplayer may change labels or layout.
      </aside>

      <section className={styles.step} id="schritt-1" aria-labelledby="schritt-1-title">
        <h2 id="schritt-1-title"><span>1</span> Create an account or sign in</h2>
        <p>Open <External href="https://www.tcgplayer.com/">TCGplayer</External> and sign in. If you do not have an account, create one there. TCGplayer may ask you to confirm your email address first.</p>
      </section>

      <section className={styles.step} id="schritt-2" aria-labelledby="schritt-2-title">
        <h2 id="schritt-2-title"><span>2</span> Copy the list in Your Card Binder</h2>
        <p>In Your Card Binder, open your missing cards, choose TCGplayer and select <b>“Copy cards &amp; open TCGplayer”</b>. The list is copied and Mass Entry opens with the Pokémon product line selected.</p>
      </section>

      <section className={styles.step} id="schritt-3" aria-labelledby="schritt-3-title">
        <h2 id="schritt-3-title"><span>3</span> Check that the list arrived in Mass Entry</h2>
        <p>The lines appear under <b>“Items”</b>. Each line has the form <code>1 Card name [set code] number</code>, for example <code>1 Charizard [BS] 004/102</code>. If the box is empty, paste the copied list into it.</p>
        <Shot name="liste-einfuegen" alt="TCGplayer Mass Entry with the Pokémon product line selected and three cards in the Items box." caption="Mass Entry with your list in the Items box (1)." />
        <p className={styles.tip}><b>Tip:</b> “Show Set/Series Codes” lists the codes TCGplayer understands, in case a line is not recognised.</p>
      </section>

      <section className={styles.step} id="schritt-4" aria-labelledby="schritt-4-title">
        <h2 id="schritt-4-title"><span>4</span> Set printing and condition</h2>
        <p>Select <b>“Options”</b>. TCGplayer then shows <b>“Item Options”</b>. In our test every printing was ticked, and Near Mint, Lightly Played and Moderately Played were ticked as conditions.</p>
        <Shot name="optionen" alt="The Item Options dialog with the printing choices (1) and the condition choices (2)." caption="Printing (1) and condition (2) as TCGplayer proposed them." />
        <ul>
          <li><b>Printing:</b> tick only what matches your card. For a normal card choose <b>Normal</b>; for a holo card <b>Holofoil</b>; for a first edition <b>1st Edition</b> or <b>1st Edition Holofoil</b>. Leave the others off, otherwise TCGplayer may pick a different print.</li>
          <li><b>Condition:</b> Near Mint and Lightly Played are a good choice for a gift. Heavily Played and Damaged stay off unless condition does not matter.</li>
        </ul>
      </section>

      <section className={styles.step} id="schritt-5" aria-labelledby="schritt-5-title">
        <h2 id="schritt-5-title"><span>5</span> Add to Cart and review the cart</h2>
        <p>With <b>“Add to Cart”</b> TCGplayer looks for the best prices across its marketplace and puts the offers into your cart. Nothing is bought yet: you pay in the cart.</p>
        <Shot name="add-to-cart" alt="The buttons Options (1) and Add to Cart (2) below the Items box." caption="Options (1) opens the printing and condition choices, Add to Cart (2) fills the cart." />
        <ul>
          <li>With a delivery address in Germany, TCGplayer shows only sellers that ship there or offers international shipping partners. Check shipping and the <b>final total in US dollars</b> before paying.</li>
          <li>Check for every card the <b>printing</b>, <b>condition</b> and <b>language</b>. TCGplayer shows the English card even for German cards.</li>
          <li>Payment happens on TCGplayer. Your Card Binder has no access to your account.</li>
        </ul>
        <p className={styles.tip}><b>Note:</b> The cart screens are not shown here because we did not place any order. The text follows TCGplayer’s own wording.</p>
      </section>

      <footer className={styles.footer}>
        <p>TCGplayer information checked in October 2026. Labels and flows may change. Your Card Binder is independent and is not affiliated with TCGplayer.</p>
        <p><External href={MASS_ENTRY_URL}>Open TCGplayer Mass Entry</External></p>
      </footer>
    </main>
  );
}

export function TcgplayerHowTo() {
  const { locale } = useLocale();
  if (locale === "en") return <TcgplayerHowToEnglish />;
  return (
    <main className={styles.page}>
      <div className={styles.topline}>
        <Link className={styles.back} href="/app/">← Zurück zu Your Card Binder</Link>
        <LanguageMenu />
      </div>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Einkaufsanleitung</p>
        <h1>Karten bei TCGplayer kaufen mit Mass Entry</h1>
        <p>TCGplayer ist ein Marktplatz mit Schwerpunkt USA, die Oberfläche ist englisch und die Preise stehen in US-Dollar. Mit Mass Entry fügst du eine ganze Kartenliste auf einmal ein. Your Card Binder verkauft keine Karten und löst nie eine Bestellung aus.</p>
      </header>

      <Toc steps={STEPS} label="Schritte dieser Anleitung" />

      <aside className={styles.note} aria-label="Hinweis zu den Bildern">
        <strong>Zu den Bildern:</strong> Die Screenshots zeigen TCGplayer im Oktober 2026 (Desktop-Ansicht, persönliche Angaben entfernt). Nummerierte gelbe Rahmen markieren, worauf sich der Text bezieht. TCGplayer kann Namen oder Aufbau ändern.
      </aside>

      <section className={styles.step} id="schritt-1" aria-labelledby="schritt-1-title">
        <h2 id="schritt-1-title"><span>1</span> Konto anlegen oder anmelden</h2>
        <p>Öffne <External href="https://www.tcgplayer.com/">TCGplayer</External> und melde dich an. Hast du noch kein Konto, lege dort eines an. TCGplayer bittet dich unter Umständen zuerst, deine E-Mail-Adresse zu bestätigen.</p>
      </section>

      <section className={styles.step} id="schritt-2" aria-labelledby="schritt-2-title">
        <h2 id="schritt-2-title"><span>2</span> Liste in Your Card Binder kopieren</h2>
        <p>Öffne in Your Card Binder deine fehlenden Karten, wähle TCGplayer und klicke auf <b>„Karten kopieren &amp; TCGplayer öffnen“</b>. Die Liste wird kopiert und Mass Entry öffnet sich mit dem Produkt „Pokemon“.</p>
      </section>

      <section className={styles.step} id="schritt-3" aria-labelledby="schritt-3-title">
        <h2 id="schritt-3-title"><span>3</span> Prüfen, ob die Liste in Mass Entry angekommen ist</h2>
        <p>Die Zeilen stehen unter <b>„Items“</b>. Jede Zeile hat die Form <code>1 Kartenname [Set-Kürzel] Nummer</code>, zum Beispiel <code>1 Charizard [BS] 004/102</code>. Ist das Feld leer, füge die kopierte Liste dort ein.</p>
        <Shot name="liste-einfuegen" alt="TCGplayer Mass Entry mit gewähltem Produkt Pokemon und drei Karten im Feld Items." caption="Mass Entry mit deiner Liste im Feld Items (1)." />
        <p className={styles.tip}><b>Tipp:</b> Unter „Show Set/Series Codes“ siehst du die Kürzel, die TCGplayer versteht, falls eine Zeile nicht erkannt wird.</p>
      </section>

      <section className={styles.step} id="schritt-4" aria-labelledby="schritt-4-title">
        <h2 id="schritt-4-title"><span>4</span> Printing und Zustand einstellen</h2>
        <p>Klicke auf <b>„Options“</b>. TCGplayer zeigt dann <b>„Item Options“</b>. Bei unserem Test waren alle Printings angehakt, beim Zustand Near Mint, Lightly Played und Moderately Played.</p>
        <Shot name="optionen" alt="Der Dialog Item Options mit den Printing-Auswahlen (1) und den Zustandsauswahlen (2)." caption="Printing (1) und Zustand (2), wie TCGplayer sie vorgeschlagen hat." />
        <ul>
          <li><b>Printing:</b> hake nur an, was zu deiner Karte passt. Für eine normale Karte <b>Normal</b>, für eine Holo-Karte <b>Holofoil</b>, für eine erste Auflage <b>1st Edition</b> oder <b>1st Edition Holofoil</b>. Lass die anderen aus, sonst nimmt TCGplayer womöglich einen anderen Druck.</li>
          <li><b>Zustand:</b> Near Mint und Lightly Played sind für ein Geschenk eine gute Wahl. Heavily Played und Damaged bleiben aus, außer der Zustand ist dir egal.</li>
        </ul>
      </section>

      <section className={styles.step} id="schritt-5" aria-labelledby="schritt-5-title">
        <h2 id="schritt-5-title"><span>5</span> Add to Cart und Warenkorb prüfen</h2>
        <p>Mit <b>„Add to Cart“</b> sucht TCGplayer die besten Preise auf dem Marktplatz und legt die Angebote in deinen Warenkorb. Gekauft ist damit noch nichts: Bezahlt wird im Warenkorb.</p>
        <Shot name="add-to-cart" alt="Die Knöpfe Options (1) und Add to Cart (2) unter dem Feld Items." caption="Options (1) öffnet die Auswahl für Printing und Zustand, Add to Cart (2) füllt den Warenkorb." />
        <ul>
          <li>Bei einer Lieferadresse in Deutschland zeigt TCGplayer nur Verkäufer, die dorthin liefern, oder bietet internationale Versandpartner an. Prüfe den Versand und den <b>Endpreis in US-Dollar</b>, bevor du bezahlst.</li>
          <li>Prüfe bei jeder Karte <b>Printing</b>, <b>Zustand</b> und <b>Sprache</b>. TCGplayer zeigt auch für deutsche Karten die englische Karte.</li>
          <li>Bezahlt wird bei TCGplayer. Your Card Binder hat keinen Zugriff auf dein Konto.</li>
        </ul>
        <p className={styles.tip}><b>Hinweis:</b> Die Warenkorb-Seiten zeigen wir hier nicht, weil wir keine Bestellung ausgelöst haben. Der Text folgt TCGplayers eigener Beschreibung.</p>
      </section>

      <footer className={styles.footer}>
        <p>Stand der TCGplayer-Angaben: Oktober 2026. Abläufe und Namen können sich ändern. Your Card Binder ist unabhängig und nicht mit TCGplayer verbunden.</p>
        <p><External href={MASS_ENTRY_URL}>TCGplayer Mass Entry öffnen</External></p>
      </footer>
    </main>
  );
}
