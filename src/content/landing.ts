import type { PageLanguage } from "@/config/site";

export interface LandingCopy {
  metaTitle: string;
  metaDescription: string;
  whatHeading: string;
  whatText: readonly string[];
  stepsHeading: string;
  steps: ReadonlyArray<{ title: string; text: string }>;
  knowHeading: string;
  know: readonly string[];
  speciesHeading: string;
  speciesText: string;
  guidesHeading: string;
  guidesText: string;
  faqHeading: string;
  faq: ReadonlyArray<{ q: string; a: string }>;
  cta: string;
  appLink: string;
  guideLabel: string;
  cardsLabel: string;
  buyingGuideLabel: string;
  buyingGuideText: string;
}

export const LANDING: Record<PageLanguage, LandingCopy> = {
  de: {
    metaTitle: "Cardfolio · Pokémon-Binder als Geschenk zusammenstellen",
    metaDescription: "Wähle ein Lieblings-Pokémon, sieh dir neun passende Karten als Binder-Seite an und lass dir die Kaufliste für Cardmarket oder TCGplayer vorbereiten. Ohne Konto.",
    whatHeading: "Was Cardfolio macht",
    whatText: [
      "Cardfolio hilft dir, einen Binder mit Pokémon-Sammelkarten zusammenzustellen, vor allem als Geschenk. Du wählst ein Lieblings-Pokémon oder ein Motiv, siehst neun passende Karten als fertige Binder-Seite und tauschst einzelne Karten aus, bis die Seite gefällt.",
      "Anschließend bereitet Cardfolio die Kaufliste vor: Karte, Set, Nummer, Sprache, Ausführung und Mindestzustand. Du übergibst sie an Cardmarket oder TCGplayer und kaufst dort selbst.",
    ],
    stepsHeading: "So funktioniert es",
    steps: [
      { title: "Pokémon oder Motiv wählen", text: "Such ein Pokémon aus oder beschreibe ein Motiv wie Wald, Nacht oder Meer." },
      { title: "Karten und Seite ansehen", text: "Cardfolio zeigt neun Karten als Binder-Seite. Karten, die nicht gefallen, tauschst du aus." },
      { title: "Binder und Karten besorgen", text: "Du erhältst die Liste für den Marktplatz und eine Empfehlung für einen passenden Binder." },
    ],
    knowHeading: "Gut zu wissen",
    know: [
      "Kein Konto nötig. Deine Binder werden lokal in deinem Browser gespeichert; ein Backup exportierst du als Datei.",
      "Cardfolio verkauft keine Karten. Den Endpreis inklusive Versand bestätigst du erst auf dem Marktplatz.",
      "Preise in Cardfolio sind unverbindliche Schätzungen ohne Versand und Steuern. Verbindlich ist nur der Preis auf dem Marktplatz.",
      "Bei einigen Binder-Angeboten kann ein Werbelink enthalten sein. Dann steht direkt am Angebot ein Hinweis, und dein Preis bleibt gleich. Als Amazon-Partner verdiene ich an qualifizierten Verkäufen.",
    ],
    speciesHeading: "Pokémon-Binder nach Lieblingsfigur",
    speciesText: "Für diese Pokémon haben wir aus dem Katalog zusammengestellt, wie viele Karten es gibt, aus welchen Jahren sie stammen und welche Motive häufig vorkommen.",
    guidesHeading: "Ratgeber",
    guidesText: "Kurze Anleitungen zu den Entscheidungen, die beim Zusammenstellen und Kaufen anfallen.",
    faqHeading: "Häufige Fragen",
    faq: [
      { q: "Was kostet Cardfolio?", a: "Cardfolio selbst kostet nichts. Die Karten kaufst du beim Marktplatz zu dessen Preisen." },
      { q: "Kann ich Karten direkt bei Cardfolio kaufen?", a: "Nein. Cardfolio bereitet die Liste vor, der Kauf findet bei Cardmarket oder TCGplayer statt." },
      { q: "Brauche ich ein Konto?", a: "Nein. Binder, Positionen und der Besitzstand liegen in der IndexedDB deines Browsers. Andere Geräte und Browser sehen sie nicht, deshalb solltest du ein Backup exportieren." },
      { q: "Woher kommen die Kartendaten?", a: "Von TCGdex, einer gemeinschaftlich gepflegten Datenquelle. Kartenbilder lädt dein Browser direkt von dort. Einzelne Karten, Varianten oder Bilder können fehlen oder fehlerhaft sein." },
      { q: "Sind alle Pokémon-Karten enthalten?", a: "Es sind physische Karten enthalten, die TCGdex führt. Karten aus Pokémon TCG Pocket sind nicht dabei." },
      { q: "Ist Cardfolio ein offizielles Produkt?", a: "Nein. Cardfolio ist ein unabhängiges Projekt und nicht mit Nintendo, Creatures, GAME FREAK oder The Pokémon Company verbunden." },
    ],
    cta: "Geschenk-Binder gestalten",
    appLink: "Zum Binder-Werkzeug",
    guideLabel: "Ratgeber lesen",
    cardsLabel: "Karten im Katalog",
    buyingGuideLabel: "Kauf-Anleitung für Cardmarket",
    buyingGuideText: "Schritt für Schritt mit Abbildungen: von der Cardfolio-Liste zum Warenkorb.",
  },
  en: {
    metaTitle: "Cardfolio · Put together a Pokémon binder as a gift",
    metaDescription: "Pick a favourite Pokémon, see nine matching cards as a binder page and get the shopping list prepared for Cardmarket or TCGplayer. No account needed.",
    whatHeading: "What Cardfolio does",
    whatText: [
      "Cardfolio helps you put together a binder of Pokémon trading cards, mainly as a gift. You choose a favourite Pokémon or a theme, see nine matching cards as a finished binder page, and swap single cards until the page looks right.",
      "Cardfolio then prepares the shopping list: card, set, number, language, finish and minimum condition. You hand it to Cardmarket or TCGplayer and buy there yourself.",
    ],
    stepsHeading: "How it works",
    steps: [
      { title: "Choose a Pokémon or theme", text: "Pick a Pokémon or describe a theme such as forest, night or sea." },
      { title: "Look at the cards and the page", text: "Cardfolio shows nine cards as a binder page. You swap out any card you do not like." },
      { title: "Get the binder and the cards", text: "You receive the list for the marketplace and a recommendation for a matching binder." },
    ],
    knowHeading: "Good to know",
    know: [
      "No account needed. Your binders are stored locally in your browser; you export a backup as a file.",
      "Cardfolio does not sell cards. You confirm the final price including shipping on the marketplace.",
      "Prices in Cardfolio are non-binding estimates excluding shipping and taxes. Only the price on the marketplace is binding.",
      "Some binder offers may contain an affiliate link. If so, a notice sits directly on the offer, and your price stays the same. As an Amazon Associate I earn from qualifying purchases.",
    ],
    speciesHeading: "Pokémon binders by favourite figure",
    speciesText: "For these Pokémon we have compiled from the catalogue how many cards exist, which years they come from and which artwork themes are common.",
    guidesHeading: "Guides",
    guidesText: "Short guides to the decisions that come up when assembling and buying.",
    faqHeading: "Frequently asked questions",
    faq: [
      { q: "What does Cardfolio cost?", a: "Cardfolio itself is free. You buy the cards from the marketplace at its prices." },
      { q: "Can I buy cards directly at Cardfolio?", a: "No. Cardfolio prepares the list; the purchase takes place at Cardmarket or TCGplayer." },
      { q: "Do I need an account?", a: "No. Binders, positions and ownership status live in your browser's IndexedDB. Other devices and browsers cannot see them, so you should export a backup." },
      { q: "Where does the card data come from?", a: "From TCGdex, a community-maintained data source. Your browser loads card images directly from there. Single cards, variants or images may be missing or wrong." },
      { q: "Are all Pokémon cards included?", a: "Physical cards that TCGdex lists are included. Cards from Pokémon TCG Pocket are not." },
      { q: "Is Cardfolio an official product?", a: "No. Cardfolio is an independent project and is not affiliated with Nintendo, Creatures, GAME FREAK or The Pokémon Company." },
    ],
    cta: "Design a gift binder",
    appLink: "Open the binder tool",
    guideLabel: "Read the guide",
    cardsLabel: "cards in the catalogue",
    buyingGuideLabel: "Buying guide for Cardmarket",
    buyingGuideText: "Step by step with pictures: from the Cardfolio list to the cart. Available in German.",
  },
};
