import type { PageLanguage } from "@/config/site";

export type GuideBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: readonly string[] }
  | { type: "table"; caption: string; head: readonly string[]; rows: readonly (readonly string[])[] };

export interface GuideSection {
  heading: string;
  blocks: readonly GuideBlock[];
}

export interface GuideText {
  slug: string;
  title: string;
  /** Title tag and Open Graph title. */
  metaTitle: string;
  description: string;
  intro: string;
  sections: readonly GuideSection[];
}

export interface Guide {
  id: string;
  /** Date of the last substantive edit, shown on the page and in structured data. */
  updated: string;
  de: GuideText;
  en: GuideText;
  /** Ids of guides worth reading next. */
  related: readonly string[];
}

export const GUIDES: readonly Guide[] = [
  {
    id: "gift",
    updated: "2026-10-20",
    related: ["binder-size", "condition", "marketplaces"],
    de: {
      slug: "pokemon-karten-verschenken",
      title: "Pokémon-Karten verschenken: So gelingt ein Geschenk, das passt",
      metaTitle: "Pokémon-Karten verschenken: Ideen und Checkliste",
      description: "Ein Binder mit den Lieblingskarten ist ein persönliches Geschenk. Worauf es bei Auswahl, Sprache, Zustand und Binder ankommt, und wie du die Karten besorgst.",
      intro: "Ein Binder voller Karten vom Lieblings-Pokémon ist ein Geschenk, das sich nicht nach Standardware anfühlt. Damit es trifft, brauchst du vorab ein paar Antworten: Wer bekommt es, was sammelt die Person, und wie viel Aufwand willst du beim Besorgen der Karten haben?",
      sections: [
        {
          heading: "Zuerst: Sammeln oder spielen?",
          blocks: [
            { type: "p", text: "Pokémon-Karten werden für zwei sehr verschiedene Zwecke genutzt. Wer das Kartenspiel spielt, braucht Decks mit passenden Kombinationen; ein Binder spielt dabei keine Rolle. Wer sammelt, möchte Karten ansehen, sortieren und zeigen. Dieser Ratgeber richtet sich an den zweiten Fall." },
            { type: "p", text: "Wenn du unsicher bist, frag nach oder schau dir an, ob die Person Karten bereits sortiert aufbewahrt. Ein Binder ist ein Geschenk für Menschen, die Karten gern betrachten, nicht für jemanden, der vor allem Turniere spielt." },
          ],
        },
        {
          heading: "Ein Pokémon, ein Binder",
          blocks: [
            { type: "p", text: "Der einfachste Einstieg ist ein einzelnes Lieblings-Pokémon. Neun Karten füllen eine Seite eines üblichen Binders mit neun Taschen. Eine solche Seite wirkt sofort fertig, und die Person kann später selbst weitersammeln." },
            { type: "p", text: "Wähle Karten mit unterschiedlichen Motiven statt neun fast gleicher Drucke. Viele Pokémon wurden in zahlreichen Sets abgedruckt, oft mit sehr ähnlichem Bild. Die Seite wirkt abwechslungsreicher, wenn sich Hintergründe, Farben und Posen unterscheiden." },
          ],
        },
        {
          heading: "Was du vor dem Kauf festlegst",
          blocks: [
            { type: "ul", items: [
              "Sprache der Karten: Deutsche Karten sind für Kinder oft verständlicher, englische Karten haben meist die größere Auswahl.",
              "Mindestzustand: Für ein Geschenk reicht meist „Sehr gut“. Mehr dazu im Ratgeber zum Kartenzustand.",
              "Ausführung: Holo, Reverse Holo oder Non-Holo sehen unterschiedlich aus. Eine Seite wirkt einheitlicher, wenn die Ausführungen zusammenpassen.",
              "Anzahl: Eine Seite sind neun Karten. Mehr Seiten sind möglich, brauchen aber mehr Zeit beim Besorgen.",
              "Zeitpunkt: Bestell früh genug. Karten kommen von verschiedenen Verkäufern und treffen deshalb nicht immer gleichzeitig ein.",
            ] },
          ],
        },
        {
          heading: "Wie Cardfolio dabei hilft",
          blocks: [
            { type: "p", text: "Cardfolio stellt zu einem Pokémon neun passende Karten zusammen und zeigt dir die Seite, bevor du etwas kaufst. Danach bereitet es die Liste mit Karte, Set, Nummer, Sprache, Ausführung und Mindestzustand für Cardmarket oder TCGplayer vor." },
            { type: "p", text: "Gekauft wird auf dem Marktplatz, nicht bei Cardfolio. Den Endpreis inklusive Versand bestätigst du dort selbst. Es braucht kein Konto, und die Binder bleiben lokal in deinem Browser gespeichert." },
          ],
        },
      ],
    },
    en: {
      slug: "gift-pokemon-cards",
      title: "Giving Pokémon cards as a gift: how to get it right",
      metaTitle: "Giving Pokémon cards as a gift: ideas and checklist",
      description: "A binder with someone's favourite cards is a personal gift. What matters for the choice, language, condition and binder, and how to get the cards.",
      intro: "A binder full of cards from someone's favourite Pokémon is a gift that does not feel like off-the-shelf merchandise. To land well you need a few answers first: who receives it, what does the person collect, and how much effort do you want to put into sourcing the cards?",
      sections: [
        {
          heading: "First: collecting or playing?",
          blocks: [
            { type: "p", text: "Pokémon cards serve two very different purposes. People who play the card game need decks with matching combinations; a binder plays no role there. People who collect want to look at cards, sort them and show them. This guide is for the second case." },
            { type: "p", text: "If you are unsure, ask, or check whether the person already keeps their cards sorted. A binder is a gift for people who enjoy looking at cards, not for someone who mainly plays tournaments." },
          ],
        },
        {
          heading: "One Pokémon, one binder",
          blocks: [
            { type: "p", text: "The easiest start is a single favourite Pokémon. Nine cards fill one page of a typical nine-pocket binder. Such a page looks finished straight away, and the person can keep collecting on their own later." },
            { type: "p", text: "Choose cards with different artwork instead of nine nearly identical printings. Many Pokémon were printed in numerous sets, often with a very similar picture. The page looks more varied when backgrounds, colours and poses differ." },
          ],
        },
        {
          heading: "What to decide before buying",
          blocks: [
            { type: "ul", items: [
              "Card language: German cards are often easier for children to read; English cards usually offer the larger selection.",
              "Minimum condition: for a gift, “Very good” is usually enough. More in the guide to card condition.",
              "Finish: holo, reverse holo and non-holo look different. A page looks more uniform when the finishes match.",
              "Quantity: one page is nine cards. More pages are possible but take more time to source.",
              "Timing: order early enough. Cards come from different sellers and do not always arrive together.",
            ] },
          ],
        },
        {
          heading: "How Cardfolio helps",
          blocks: [
            { type: "p", text: "Cardfolio assembles nine matching cards for a Pokémon and shows you the page before you buy anything. It then prepares the list with card, set, number, language, finish and minimum condition for Cardmarket or TCGplayer." },
            { type: "p", text: "You buy on the marketplace, not at Cardfolio. You confirm the final price including shipping there yourself. No account is needed, and the binders stay stored locally in your browser." },
          ],
        },
      ],
    },
  },
  {
    id: "binder-size",
    updated: "2026-10-20",
    related: ["gift", "language-and-finish"],
    de: {
      slug: "binder-groesse-taschen",
      title: "Pokémon-Binder: Welche Größe und wie viele Taschen?",
      metaTitle: "Pokémon-Binder: 4, 9 oder 12 Taschen? Größen erklärt",
      description: "Ein Binder-Blatt hat zwei Seiten, und Taschen werden pro Seite gezählt. So rechnest du aus, wie viele Karten in einen Binder passen und welche Größe zu deiner Sammlung passt.",
      intro: "Beim Kauf eines Binders steht meist eine Zahl wie „9-Pocket“ oder „360 Karten“ im Titel. Was das bedeutet und wie du daraus die richtige Größe ableitest, ist weniger offensichtlich, als es wirkt.",
      sections: [
        {
          heading: "Taschen, Seiten und Blätter",
          blocks: [
            { type: "p", text: "Die Zahl der Taschen gibt an, wie viele Karten auf einer Seite Platz haben. Üblich sind Seiten mit 4 Taschen (2 × 2), 9 Taschen (3 × 3) und 12 Taschen (4 × 3). Die 9-Pocket-Seite gilt als Standard für Sammelkarten." },
            { type: "p", text: "Viele Binder zählen Blätter, nicht Seiten. Ein Blatt hat eine Vorder- und eine Rückseite, bietet also zwei Seiten. Ein Binder mit 20 Blättern zu je 9 Taschen pro Seite fasst deshalb 360 Karten, wenn beide Seiten genutzt werden." },
          ],
        },
        {
          heading: "So viele Karten passen",
          blocks: [
            { type: "table", caption: "Kapazität eines Binders nach Taschen pro Seite und Anzahl der Blätter, beide Seiten bestückt", head: ["Taschen pro Seite", "1 Blatt", "3 Blätter", "6 Blätter", "12 Blätter"], rows: [
              ["4 (2 × 2)", "8", "24", "48", "96"],
              ["9 (3 × 3)", "18", "54", "108", "216"],
              ["12 (4 × 3)", "24", "72", "144", "288"],
            ] },
            { type: "p", text: "Die Tabelle zeigt, wie viele Karten in den Binder passen, nicht wie viele du hineinlegen solltest. Lass etwas Platz, wenn die Sammlung wachsen soll." },
          ],
        },
        {
          heading: "Welche Größe passt zu welchem Zweck?",
          blocks: [
            { type: "ul", items: [
              "Ein einzelnes Lieblings-Pokémon: Eine Seite mit 9 Taschen reicht für den Start. Plane ein paar Blätter mehr ein, damit die Sammlung wachsen kann.",
              "Mehrere Pokémon oder ganze Sets: Ein Binder mit vielen Blättern spart Platz im Regal. Prüfe, wie viele Karten das Set hat, bevor du die Größe wählst.",
              "Geschenk für Kinder: Seiten mit 9 Taschen sind leicht zu handhaben. Die Karten sitzen sicher, und nichts rutscht heraus, wenn der Binder offen liegt.",
              "Größere Sammlungen: 12-Pocket-Seiten fassen mehr pro Seite, die Taschen sind dafür schmaler. Prüfe, ob deine Karten, falls sie in Hüllen stecken, noch hineinpassen.",
            ] },
          ],
        },
        {
          heading: "Typische Fehler",
          blocks: [
            { type: "ul", items: [
              "Nur auf die Kartenzahl im Titel achten: Prüfe, ob sich die Angabe auf beide Seiten bezieht.",
              "Karten in Hüllen mit Taschen mischen: Eine Karte in Hülle braucht oft mehr Platz, deshalb hat ein Binder mit Hüllen meist eine geringere Kapazität.",
              "Ringbinder zu voll packen: Ein überfüllter Binder verbiegt Karten an den Ringen. Lass ihn lieber etwas lockerer.",
            ] },
          ],
        },
      ],
    },
    en: {
      slug: "binder-pocket-sizes",
      title: "Pokémon binders: which size and how many pockets?",
      metaTitle: "Pokémon binders: 4, 9 or 12 pockets explained",
      description: "A binder sheet has two sides, and pockets are counted per page. How to work out how many cards fit in a binder and which size suits your collection.",
      intro: "When you buy a binder the title usually contains a number such as “9-pocket” or “360 cards”. What that means, and how to derive the right size from it, is less obvious than it seems.",
      sections: [
        {
          heading: "Pockets, pages and sheets",
          blocks: [
            { type: "p", text: "The number of pockets tells you how many cards fit on one page. Common are pages with 4 pockets (2 × 2), 9 pockets (3 × 3) and 12 pockets (4 × 3). The 9-pocket page is considered the standard for trading cards." },
            { type: "p", text: "Many binders count sheets, not pages. A sheet has a front and a back, so it offers two pages. A binder with 20 sheets and 9 pockets per page therefore holds 360 cards when both sides are used." },
          ],
        },
        {
          heading: "How many cards fit",
          blocks: [
            { type: "table", caption: "Binder capacity by pockets per page and number of sheets, both sides filled", head: ["Pockets per page", "1 sheet", "3 sheets", "6 sheets", "12 sheets"], rows: [
              ["4 (2 × 2)", "8", "24", "48", "96"],
              ["9 (3 × 3)", "18", "54", "108", "216"],
              ["12 (4 × 3)", "24", "72", "144", "288"],
            ] },
            { type: "p", text: "The table shows how many cards fit in the binder, not how many you should put in. Leave some room if the collection is meant to grow." },
          ],
        },
        {
          heading: "Which size suits which purpose?",
          blocks: [
            { type: "ul", items: [
              "A single favourite Pokémon: one 9-pocket page is enough to start. Plan a few extra sheets so the collection can grow.",
              "Several Pokémon or whole sets: a binder with many sheets saves shelf space. Check how many cards the set has before choosing the size.",
              "A gift for children: 9-pocket pages are easy to handle. Cards sit securely and nothing slips out when the binder lies open.",
              "Larger collections: 12-pocket pages hold more per page, but the pockets are narrower. Check whether your cards, if sleeved, still fit.",
            ] },
          ],
        },
        {
          heading: "Common mistakes",
          blocks: [
            { type: "ul", items: [
              "Looking only at the card count in the title: check whether the figure refers to both sides.",
              "Mixing sleeved cards with pockets: a sleeved card often needs more room, so a binder used with sleeves usually has a lower capacity.",
              "Overfilling a ring binder: an overstuffed binder bends cards at the rings. Leave it a little looser.",
            ] },
          ],
        },
      ],
    },
  },
  {
    id: "condition",
    updated: "2026-10-20",
    related: ["marketplaces", "gift"],
    de: {
      slug: "pokemon-kartenzustand",
      title: "Kartenzustand bei Pokémon-Karten: Was Near Mint, Excellent und Played bedeuten",
      metaTitle: "Pokémon-Kartenzustand erklärt: Near Mint, Excellent, Played",
      description: "Marktplätze bewerten den Zustand von Karten mit festen Stufen. Was sie bedeuten, wie Cardmarket und TCGplayer sie benennen und welcher Mindestzustand sich für ein Geschenk eignet.",
      intro: "Auf Marktplätzen steht bei jeder Karte eine Zustandsstufe wie „Near Mint“ oder „Played“. Verkäufer vergeben sie selbst, deshalb lohnt es sich, die Stufen zu kennen und den Mindestzustand beim Einkauf zu setzen.",
      sections: [
        {
          heading: "Die Stufen im Überblick",
          blocks: [
            { type: "table", caption: "Mindestzustand in Cardfolio und die passenden Stufen bei Cardmarket und TCGplayer", head: ["Cardfolio-Auswahl", "Cardmarket", "TCGplayer", "Gemeint ist"], rows: [
              ["Wie neu", "Near Mint", "Near Mint", "Fast keine sichtbaren Gebrauchsspuren."],
              ["Sehr gut", "Near Mint oder Excellent", "Near Mint oder Lightly Played", "Kleine Rand- oder Oberflächenspuren."],
              ["Gebraucht", "bis Light Played", "bis Lightly Played", "Sichtbare Kratzer oder Kantenabnutzung."],
              ["Deutlich gebraucht", "bis Played", "bis Heavily Played", "Deutliche Spuren, kleine Knicke möglich."],
              ["Beliebig", "alle Stufen", "alle Stufen", "Auch beschädigte Karten können angeboten werden."],
            ] },
            { type: "p", text: "Die Zuordnung ist eine Orientierung. Die Marktplätze verwenden unterschiedliche Skalen, und die Grenzen zwischen zwei Stufen sind nicht scharf." },
          ],
        },
        {
          heading: "Worauf Verkäufer achten",
          blocks: [
            { type: "ul", items: [
              "Ecken: Weiße Stellen oder Abrundungen an den Ecken senken den Zustand zuerst.",
              "Kanten: Abgeriebene Ränder fallen besonders auf der dunklen Rückseite auf.",
              "Oberfläche: Kratzer, Druckstellen oder Glanzverlust, bei Holo-Karten vor allem im glänzenden Bereich.",
              "Knicke: Ein Knick senkt den Zustand deutlich. Die Zentrierung des Drucks spielt für die Zustandsangabe auf Marktplätzen meist eine kleinere Rolle.",
            ] },
            { type: "p", text: "Da Verkäufer ihre Karten selbst einstufen, kann dieselbe Karte bei zwei Anbietern unterschiedlich bewertet sein. Fotos und Beschreibung lohnen einen Blick, wenn du einzelne Karten sehr genau auswählst." },
          ],
        },
        {
          heading: "Welcher Mindestzustand für ein Geschenk?",
          blocks: [
            { type: "p", text: "Für ein Geschenk ist „Sehr gut“ meist ein guter Kompromiss: Kleine Spuren sind erlaubt, die Karten sehen im Binder trotzdem ordentlich aus, und die Auswahl bleibt groß. Wer ein besonders hochwertiges Geschenk machen möchte, wählt „Wie neu“ und akzeptiert dafür eine kleinere Auswahl." },
            { type: "p", text: "Von „Beliebig“ rät Cardfolio für Geschenke ab, weil auch beschädigte Karten dabei sein können. Wie du den Mindestzustand auf Cardmarket für die ganze Liste setzt, steht in der bebilderten Anleitung." },
          ],
        },
      ],
    },
    en: {
      slug: "pokemon-card-condition",
      title: "Pokémon card condition: what Near Mint, Excellent and Played mean",
      metaTitle: "Pokémon card condition explained: Near Mint, Excellent, Played",
      description: "Marketplaces grade card condition in fixed steps. What they mean, how Cardmarket and TCGplayer name them, and which minimum condition suits a gift.",
      intro: "On marketplaces every card carries a condition grade such as “Near Mint” or “Played”. Sellers assign it themselves, so it pays to know the grades and to set a minimum condition when you buy.",
      sections: [
        {
          heading: "The grades at a glance",
          blocks: [
            { type: "table", caption: "Minimum condition in Cardfolio and the matching grades at Cardmarket and TCGplayer", head: ["Cardfolio choice", "Cardmarket", "TCGplayer", "Meaning"], rows: [
              ["Like new", "Near Mint", "Near Mint", "Almost no visible signs of wear."],
              ["Very good", "Near Mint or Excellent", "Near Mint or Lightly Played", "Small marks on edges or surface."],
              ["Used", "up to Light Played", "up to Lightly Played", "Visible scratches or edge wear."],
              ["Clearly used", "up to Played", "up to Heavily Played", "Clear signs of wear, small creases possible."],
              ["Any", "all grades", "all grades", "Damaged cards can be offered as well."],
            ] },
            { type: "p", text: "The mapping is a guide. The marketplaces use different scales, and the borders between two grades are not sharp." },
          ],
        },
        {
          heading: "What sellers look at",
          blocks: [
            { type: "ul", items: [
              "Corners: white spots or rounding at the corners lower the grade first.",
              "Edges: worn edges stand out especially on the dark card back.",
              "Surface: scratches, dents or loss of shine, on holo cards mainly in the shiny area.",
              "Creases: a crease lowers the grade clearly. How well the print is centred usually plays a smaller role in marketplace grades.",
            ] },
            { type: "p", text: "Because sellers grade their own cards, the same card can be rated differently by two sellers. Photos and description are worth a look when you pick single cards very carefully." },
          ],
        },
        {
          heading: "Which minimum condition for a gift?",
          blocks: [
            { type: "p", text: "For a gift, “Very good” is usually a good compromise: small marks are allowed, the cards still look tidy in the binder, and the choice stays large. If you want a particularly high-quality gift, choose “Like new” and accept a smaller selection." },
            { type: "p", text: "Cardfolio advises against “Any” for gifts because damaged cards may be included. How to set the minimum condition on Cardmarket for the whole list is shown in the illustrated guide." },
          ],
        },
      ],
    },
  },
  {
    id: "marketplaces",
    updated: "2026-10-20",
    related: ["condition", "language-and-finish"],
    de: {
      slug: "cardmarket-oder-tcgplayer",
      title: "Cardmarket oder TCGplayer: Wo kaufst du deine Pokémon-Karten?",
      metaTitle: "Cardmarket oder TCGplayer: Pokémon-Karten kaufen",
      description: "Cardmarket und TCGplayer sind Marktplätze für Sammelkarten. Was sie unterscheidet, worauf du bei Versand und Gesamtpreis achtest und wo Cardfolio die Liste übergibt.",
      intro: "Beide Anbieter sind Marktplätze: Du kaufst nicht beim Betreiber, sondern bei einzelnen Verkäufern. Das hat Folgen für Versand, Zustand und Gesamtpreis, die du vor dem Kauf kennen solltest.",
      sections: [
        {
          heading: "Was beide gemeinsam haben",
          blocks: [
            { type: "ul", items: [
              "Du kaufst von vielen Einzelverkäufern, nicht von einem Shop.",
              "Jede Karte hat Zustand, Sprache und oft eine Ausführung wie Holo oder Reverse Holo.",
              "Versand und Preis unterscheiden sich je nach Verkäufer.",
              "Mehrere Karten beim selben Verkäufer sparen oft Versandkosten.",
            ] },
          ],
        },
        {
          heading: "Wo sie sich unterscheiden",
          blocks: [
            { type: "table", caption: "Kurzvergleich der beiden Marktplätze aus Sicht eines Käufers in Deutschland", head: ["", "Cardmarket", "TCGplayer"], rows: [
              ["Schwerpunkt", "Europäischer Marktplatz mit Verkäufern in vielen Ländern", "Marktplatz mit Schwerpunkt auf Verkäufern in den USA"],
              ["Sprache der Oberfläche", "Auch auf Deutsch verfügbar", "Englisch"],
              ["Übergabe aus Cardfolio", "Deckliste für die Wants-Liste", "Text für die Mass-Entry-Funktion"],
              ["Wichtig vor dem Kauf", "Mindestzustand und Sprache der Karten prüfen", "Prüfen, ob der Verkäufer in dein Land liefert"],
            ] },
            { type: "p", text: "Die Angaben sind eine Orientierung und können sich ändern. Prüfe die aktuellen Bedingungen immer auf der Seite des Marktplatzes." },
          ],
        },
        {
          heading: "Was das für dich bedeutet",
          blocks: [
            { type: "p", text: "Wer in Deutschland oder Europa kauft, findet bei Cardmarket meist die kürzeren Wege: Verkäufer sind oft in der Nähe, und die Lieferzeiten bleiben überschaubar. TCGplayer ist vor allem interessant, wenn du ohnehin Kontakte oder Lieferadressen in den USA hast oder gezielt dort nach einer Karte suchst." },
            { type: "p", text: "Egal wo du kaufst: Rechne den Endpreis immer einschließlich Versand aus. Eine Karte, die einzeln günstig wirkt, kann durch Versandkosten pro Verkäufer teurer werden als eine etwas teurere bei einem Verkäufer, bei dem du mehrere Karten bündeln kannst." },
          ],
        },
        {
          heading: "Was Cardfolio übergibt",
          blocks: [
            { type: "p", text: "Cardfolio erzeugt die Liste im Format des Marktplatzes. Bei Cardmarket ist das die Deckliste für die Wants-Liste, bei TCGplayer der Text für die Mass-Entry-Funktion. Dort legst du Mindestzustand und Sprache fest und bestätigst den Kauf selbst." },
            { type: "p", text: "Cardfolio steht mit keinem der Marktplätze in einer geschäftlichen Verbindung. Eine Schritt-für-Schritt-Anleitung für Cardmarket mit Abbildungen findest du in der Kaufanleitung." },
          ],
        },
      ],
    },
    en: {
      slug: "cardmarket-or-tcgplayer",
      title: "Cardmarket or TCGplayer: where should you buy your Pokémon cards?",
      metaTitle: "Cardmarket or TCGplayer: buying Pokémon cards",
      description: "Cardmarket and TCGplayer are marketplaces for trading cards. What sets them apart, what to check for shipping and total price, and where Cardfolio hands over the list.",
      intro: "Both are marketplaces: you do not buy from the operator but from individual sellers. That affects shipping, condition and total price, and you should understand how before you buy.",
      sections: [
        {
          heading: "What both have in common",
          blocks: [
            { type: "ul", items: [
              "You buy from many individual sellers, not from one shop.",
              "Every card has a condition, a language and often a finish such as holo or reverse holo.",
              "Shipping and price differ by seller.",
              "Several cards from the same seller often save shipping costs.",
            ] },
          ],
        },
        {
          heading: "Where they differ",
          blocks: [
            { type: "table", caption: "Short comparison of the two marketplaces from the point of view of a buyer in Europe", head: ["", "Cardmarket", "TCGplayer"], rows: [
              ["Focus", "European marketplace with sellers in many countries", "Marketplace focused on sellers in the USA"],
              ["Interface language", "Available in several languages, including English", "English"],
              ["Hand-over from Cardfolio", "Deck list for the wants list", "Text for the mass-entry function"],
              ["Check before buying", "Minimum condition and card language", "Whether the seller ships to your country"],
            ] },
            { type: "p", text: "These notes are a guide and can change. Always check the current terms on the marketplace itself." },
          ],
        },
        {
          heading: "What that means for you",
          blocks: [
            { type: "p", text: "If you buy in Europe, Cardmarket usually offers the shorter routes: sellers are often nearby and delivery times stay manageable. TCGplayer is mainly interesting if you already have contacts or delivery addresses in the USA, or are looking for one specific card there." },
            { type: "p", text: "Wherever you buy, always work out the final price including shipping. A card that looks cheap on its own can end up costing more through per-seller shipping than a slightly dearer one from a seller where you can combine several cards." },
          ],
        },
        {
          heading: "What Cardfolio hands over",
          blocks: [
            { type: "p", text: "Cardfolio creates the list in the marketplace's format. For Cardmarket that is the deck list for the wants list; for TCGplayer it is the text for the mass-entry function. There you set the minimum condition and language and confirm the purchase yourself." },
            { type: "p", text: "Cardfolio has no business relationship with either marketplace. A step-by-step guide with pictures for Cardmarket is in the buying guide." },
          ],
        },
      ],
    },
  },
  {
    id: "language-and-finish",
    updated: "2026-10-20",
    related: ["condition", "marketplaces"],
    de: {
      slug: "kartensprache-und-ausfuehrung",
      title: "Pokémon-Karten: Sprache, Holo, Reverse Holo und Edition erklärt",
      metaTitle: "Pokémon-Karten: Sprache, Holo, Reverse Holo, Edition",
      description: "Dieselbe Kartennummer gibt es in mehreren Sprachen und Ausführungen. Was Holo, Reverse Holo, 1st Edition und Shadowless bedeuten und warum sie beim Kauf wichtig sind.",
      intro: "Eine Karte ist mehr als Name und Nummer. Sprache, Finish und Edition entscheiden, welche Karte du am Ende in der Hand hältst, und sie beeinflussen auch den Preis.",
      sections: [
        {
          heading: "Sprache",
          blocks: [
            { type: "p", text: "Dieselbe Karte wird in mehreren Sprachen gedruckt, etwa auf Deutsch, Englisch oder Japanisch. Die Kartennummer bleibt gleich, Name und Text unterscheiden sich. Auf Marktplätzen sind das getrennte Angebote." },
            { type: "p", text: "Für Kinder sind deutsche Karten leichter zu lesen. Sammler greifen oft zu englischen Karten, weil das Angebot größer ist. Wichtig ist, dass Binder und Liste dieselbe Sprache nennen, sonst kommt am Ende eine andere Karte an als gedacht." },
          ],
        },
        {
          heading: "Finish: Holo, Reverse Holo, Non-Holo",
          blocks: [
            { type: "ul", items: [
              "Holo: Das Bild der Karte glänzt, der Rest bleibt matt.",
              "Reverse Holo: Der Glanz liegt umgekehrt auf Rahmen und Hintergrund, das Bild bleibt matt.",
              "Non-Holo: Die Karte hat keinen Glanzeffekt.",
            ] },
            { type: "p", text: "Nicht jede Karte existiert in jeder Ausführung. Manche gibt es nur als Holo, andere in mehreren Varianten. Die Katalogdaten sind nicht bei jeder Karte vollständig; Cardfolio fragt das Finish deshalb ab, wenn es nicht eindeutig bekannt ist." },
          ],
        },
        {
          heading: "Edition und Druckvariante",
          blocks: [
            { type: "ul", items: [
              "1st Edition: Frühe Sets wurden zuerst mit einem Stempel „1st Edition“ gedruckt, später ohne. Die Stempelversion ist deutlich seltener.",
              "Unlimited: Die reguläre Auflage ohne Stempel.",
              "Shadowless: Eine frühe Variante des englischen Base Sets ohne den Schatten am Bildrahmen.",
            ] },
            { type: "p", text: "Diese Unterschiede betreffen vor allem die Sets der frühen Jahre. Bei modernen Sets gibt es keine 1st Edition. Wer ein Geschenk aus aktuellen Karten zusammenstellt, muss sich um Edition und Shadowless in der Regel nicht kümmern." },
          ],
        },
        {
          heading: "Was das für den Einkauf heißt",
          blocks: [
            { type: "p", text: "Setze Sprache und Finish bei der Bestellung bewusst. Beides steht auf dem Angebot, aber nicht immer an derselben Stelle. Prüfe vor dem Kauf, ob das Foto zur beschriebenen Variante passt." },
            { type: "p", text: "Cardfolio fragt Finish und Edition ab und gibt sie in die Liste, die du an den Marktplatz übergibst. Karten, bei denen sich das nicht eindeutig klären lässt, bleiben sichtbar und werden nicht geraten." },
          ],
        },
      ],
    },
    en: {
      slug: "card-language-and-finish",
      title: "Pokémon cards: language, holo, reverse holo and edition explained",
      metaTitle: "Pokémon cards: language, holo, reverse holo, edition",
      description: "The same card number exists in several languages and finishes. What holo, reverse holo, 1st Edition and Shadowless mean and why they matter when you buy.",
      intro: "A card is more than a name and a number. Language, finish and edition decide which card you end up holding, and they also affect the price.",
      sections: [
        {
          heading: "Language",
          blocks: [
            { type: "p", text: "The same card is printed in several languages such as German, English or Japanese. The card number stays the same while name and text differ. On marketplaces these are separate listings." },
            { type: "p", text: "German cards are easier for children to read. Collectors often go for English cards because the selection is larger. What matters is that binder and list name the same language, otherwise a different card arrives than you expected." },
          ],
        },
        {
          heading: "Finish: holo, reverse holo, non-holo",
          blocks: [
            { type: "ul", items: [
              "Holo: the picture on the card shines, the rest stays matte.",
              "Reverse holo: the shine is the other way round, on frame and background, while the picture stays matte.",
              "Non-holo: the card has no shine effect.",
            ] },
            { type: "p", text: "Not every card exists in every finish. Some exist only as holo, others in several variants. The catalogue data is not complete for every card, so Cardfolio asks for the finish when it is not clearly known." },
          ],
        },
        {
          heading: "Edition and print variant",
          blocks: [
            { type: "ul", items: [
              "1st Edition: early sets were first printed with a “1st Edition” stamp and later without. The stamped version is considerably rarer.",
              "Unlimited: the regular print run without the stamp.",
              "Shadowless: an early variant of the English Base Set without the shadow on the picture frame.",
            ] },
            { type: "p", text: "These differences mostly concern the sets of the early years. Modern sets have no 1st Edition. Anyone assembling a gift from current cards usually does not need to worry about edition and Shadowless." },
          ],
        },
        {
          heading: "What this means when you buy",
          blocks: [
            { type: "p", text: "Set language and finish deliberately when you order. Both are shown on the listing, though not always in the same place. Check before buying that the photo matches the variant described." },
            { type: "p", text: "Cardfolio asks for finish and edition and puts them into the list you hand to the marketplace. Cards where this cannot be settled clearly stay visible and are not guessed." },
          ],
        },
      ],
    },
  },
];

export function guideById(id: string): Guide | undefined {
  return GUIDES.find((guide) => guide.id === id);
}

export function guideBySlug(language: PageLanguage, slug: string): Guide | undefined {
  return GUIDES.find((guide) => guide[language].slug === slug);
}
