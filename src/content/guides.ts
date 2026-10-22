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
    updated: "2026-10-21",
    related: ["personalized-gift", "birthday-gift", "christmas-gift", "binder-size", "condition", "marketplaces"],
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
          heading: "Wie Your Card Binder dabei hilft",
          blocks: [
            { type: "p", text: "Your Card Binder stellt zu einem Pokémon neun passende Karten zusammen und zeigt dir die Seite, bevor du etwas kaufst. Danach bereitet es die Liste mit Karte, Set, Nummer, Sprache, Ausführung und Mindestzustand für Cardmarket oder TCGplayer vor." },
            { type: "p", text: "Gekauft wird auf dem Marktplatz, nicht bei Your Card Binder. Den Endpreis inklusive Versand bestätigst du dort selbst. Es braucht kein Konto, und die Binder bleiben lokal in deinem Browser gespeichert." },
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
          heading: "How Your Card Binder helps",
          blocks: [
            { type: "p", text: "Your Card Binder assembles nine matching cards for a Pokémon and shows you the page before you buy anything. It then prepares the list with card, set, number, language, finish and minimum condition for Cardmarket or TCGplayer." },
            { type: "p", text: "You buy on the marketplace, not at Your Card Binder. You confirm the final price including shipping there yourself. No account is needed, and the binders stay stored locally in your browser." },
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
      metaTitle: "Pokémon-Kartenzustand erklärt: Near Mint bis Played",
      description: "Marktplätze bewerten den Zustand von Karten mit festen Stufen. Was sie bedeuten, wie Cardmarket und TCGplayer sie benennen und welcher Mindestzustand sich für ein Geschenk eignet.",
      intro: "Auf Marktplätzen steht bei jeder Karte eine Zustandsstufe wie „Near Mint“ oder „Played“. Verkäufer vergeben sie selbst, deshalb lohnt es sich, die Stufen zu kennen und den Mindestzustand beim Einkauf zu setzen.",
      sections: [
        {
          heading: "Die Stufen im Überblick",
          blocks: [
            { type: "table", caption: "Mindestzustand in Your Card Binder und die passenden Stufen bei Cardmarket und TCGplayer", head: ["Your Card Binder-Auswahl", "Cardmarket", "TCGplayer", "Gemeint ist"], rows: [
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
            { type: "p", text: "Von „Beliebig“ rät Your Card Binder für Geschenke ab, weil auch beschädigte Karten dabei sein können. Wie du den Mindestzustand auf Cardmarket für die ganze Liste setzt, steht in der bebilderten Anleitung." },
          ],
        },
      ],
    },
    en: {
      slug: "pokemon-card-condition",
      title: "Pokémon card condition: what Near Mint, Excellent and Played mean",
      metaTitle: "Pokémon card condition: Near Mint to Played",
      description: "Marketplaces grade card condition in fixed steps. What they mean, how Cardmarket and TCGplayer name them, and which minimum condition suits a gift.",
      intro: "On marketplaces every card carries a condition grade such as “Near Mint” or “Played”. Sellers assign it themselves, so it pays to know the grades and to set a minimum condition when you buy.",
      sections: [
        {
          heading: "The grades at a glance",
          blocks: [
            { type: "table", caption: "Minimum condition in Your Card Binder and the matching grades at Cardmarket and TCGplayer", head: ["Your Card Binder choice", "Cardmarket", "TCGplayer", "Meaning"], rows: [
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
            { type: "p", text: "Your Card Binder advises against “Any” for gifts because damaged cards may be included. How to set the minimum condition on Cardmarket for the whole list is shown in the illustrated guide." },
          ],
        },
      ],
    },
  },
  {
    id: "marketplaces",
    updated: "2026-10-22",
    related: ["cardmarket-vs-cardtrader", "tcgplayer-howto", "condition", "language-and-finish"],
    de: {
      slug: "cardmarket-oder-tcgplayer",
      title: "Cardmarket oder TCGplayer: Wo kaufst du deine Pokémon-Karten?",
      metaTitle: "Cardmarket oder TCGplayer: Pokémon-Karten kaufen",
      description: "Cardmarket und TCGplayer sind Marktplätze für Sammelkarten. Was sie unterscheidet, worauf du bei Versand und Gesamtpreis achtest und wo Your Card Binder die Liste übergibt.",
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
              ["Übergabe aus Your Card Binder", "Deckliste für die Wants-Liste", "Text für die Mass-Entry-Funktion"],
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
          heading: "Was Your Card Binder übergibt",
          blocks: [
            { type: "p", text: "Your Card Binder erzeugt die Liste im Format des Marktplatzes. Bei Cardmarket ist das die Deckliste für die Wants-Liste, bei TCGplayer der Text für die Mass-Entry-Funktion. Dort legst du Mindestzustand und Sprache fest und bestätigst den Kauf selbst." },
            { type: "p", text: "Your Card Binder steht mit keinem der Marktplätze in einer geschäftlichen Verbindung. Eine Schritt-für-Schritt-Anleitung für Cardmarket mit Abbildungen findest du in der Kaufanleitung." },
          ],
        },
      ],
    },
    en: {
      slug: "cardmarket-or-tcgplayer",
      title: "Cardmarket or TCGplayer: where should you buy your Pokémon cards?",
      metaTitle: "Cardmarket or TCGplayer: buying Pokémon cards",
      description: "Cardmarket and TCGplayer are marketplaces for trading cards. What sets them apart, what to check for shipping and total price, and where Your Card Binder hands over the list.",
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
              ["Hand-over from Your Card Binder", "Deck list for the wants list", "Text for the mass-entry function"],
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
          heading: "What Your Card Binder hands over",
          blocks: [
            { type: "p", text: "Your Card Binder creates the list in the marketplace's format. For Cardmarket that is the deck list for the wants list; for TCGplayer it is the text for the mass-entry function. There you set the minimum condition and language and confirm the purchase yourself." },
            { type: "p", text: "Your Card Binder has no business relationship with either marketplace. A step-by-step guide with pictures for Cardmarket is in the buying guide." },
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
            { type: "p", text: "Nicht jede Karte existiert in jeder Ausführung. Manche gibt es nur als Holo, andere in mehreren Varianten. Die Katalogdaten sind nicht bei jeder Karte vollständig; Your Card Binder fragt das Finish deshalb ab, wenn es nicht eindeutig bekannt ist." },
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
            { type: "p", text: "Your Card Binder fragt Finish und Edition ab und gibt sie in die Liste, die du an den Marktplatz übergibst. Karten, bei denen sich das nicht eindeutig klären lässt, bleiben sichtbar und werden nicht geraten." },
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
            { type: "p", text: "Not every card exists in every finish. Some exist only as holo, others in several variants. The catalogue data is not complete for every card, so Your Card Binder asks for the finish when it is not clearly known." },
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
            { type: "p", text: "Your Card Binder asks for finish and edition and puts them into the list you hand to the marketplace. Cards where this cannot be settled clearly stay visible and are not guessed." },
          ],
        },
      ],
    },
  },
  {
    id: "personalized-gift",
    updated: "2026-10-21",
    related: ["gift", "birthday-gift", "binder-size"],
    de: {
      slug: "personalisiertes-pokemon-geschenk",
      title: "Personalisiertes Pokémon-Geschenk: Ein Binder, der zur Person passt",
      metaTitle: "Personalisiertes Pokémon-Geschenk: Ideen und Umsetzung",
      description: "Persönlich wird ein Pokémon-Geschenk durch die Auswahl der Karten, nicht durch Aufdrucke. So stellst du einen Binder für eine bestimmte Person zusammen.",
      intro: "Offizielle Pokémon-Karten lassen sich nicht individuell bedrucken, und selbst gemachte „Karten“ sind weder echt noch wertvoll. Persönlich wird ein Geschenk deshalb auf anderem Weg: durch die Auswahl. Ein Binder, der erkennbar für genau diese Person zusammengestellt wurde, wirkt mehr als jedes Standardgeschenk.",
      sections: [
        {
          heading: "Was „personalisiert“ bei Sammelkarten bedeutet",
          blocks: [
            { type: "p", text: "Das Persönliche steckt in drei Entscheidungen: welches Pokémon oder Motiv, welche Karten davon und wie sie zusammen aussehen. Wer Glurak liebt, freut sich über eine Seite voller Glurak-Karten aus verschiedenen Jahren. Wer eher die Bilder mag, bekommt Karten, deren Motive zusammenpassen, etwa Meer, Wald oder Schnee." },
            { type: "p", text: "Wichtig ist, dass die Person sich wiedererkennt. Ein Binder voller Karten, die dich als Schenkenden interessieren, ist ein Geschenk an dich selbst." },
          ],
        },
        {
          heading: "Fünf Fragen, bevor du Karten auswählst",
          blocks: [
            { type: "ul", items: [
              "Welches Pokémon steht für die Person? Oft ist es das erste, das sie je gemocht hat, nicht das aktuell stärkste.",
              "Mag sie ältere Karten mit klassischen Zeichnungen oder moderne Karten mit großen, ganzseitigen Bildern?",
              "Soll der Text auf Deutsch oder Englisch sein? Das hängt davon ab, was sie kennt und was es für das Pokémon gibt.",
              "Wird der Binder zum Anschauen genutzt oder zum Spielen und Tauschen?",
              "Wie viele Karten sind sinnvoll: eine Seite mit neun Karten oder mehrere Seiten?",
            ] },
          ],
        },
        {
          heading: "So setzt du es mit Your Card Binder um",
          blocks: [
            { type: "p", text: "Du wählst ein Lieblings-Pokémon oder ein Motiv, den Zeitraum der Karten und die Sprache. Your Card Binder schlägt passende Karten vor und zeigt sie als Binder-Seite. Jede Karte lässt sich austauschen, entfernen oder durch eine andere ersetzen, bis das Ergebnis zur Person passt." },
            { type: "p", text: "Erst danach geht es ans Besorgen: Your Card Binder bereitet die Liste für den Marktplatz deiner Wahl vor, und du entscheidest dort über Verkäufer, Zustand und Preis." },
          ],
        },
        {
          heading: "Die Übergabe persönlich machen",
          blocks: [
            { type: "ul", items: [
              "Schreibe auf eine Karte oder einen Zettel, warum du genau dieses Pokémon gewählt hast.",
              "Lege die erste Seite so, dass die Lieblingskarte beim Aufschlagen sofort zu sehen ist.",
              "Lass bewusst ein paar Taschen frei, damit die Sammlung weiterwachsen kann.",
              "Notiere, wo du die Karten gekauft hast, falls später etwas nachgekauft werden soll.",
            ] },
          ],
        },
        {
          heading: "Was du besser lässt",
          blocks: [
            { type: "p", text: "Kaufe keine „personalisierten Pokémon-Karten“ von Anbietern, die behaupten, Karten mit Namen oder Foto zu bedrucken. Das sind keine offiziellen Karten, sie haben keinen Sammlerwert und können Markenrechte verletzen. Dein Geschenk bleibt persönlich, wenn echte Karten gezielt ausgewählt sind." },
            { type: "p", text: "Your Card Binder ist ein unabhängiges Projekt und nicht mit Nintendo, Creatures, GAME FREAK oder The Pokémon Company verbunden." },
          ],
        },
      ],
    },
    en: {
      slug: "personalised-pokemon-gift",
      title: "Personalised Pokémon gift: a binder that fits the person",
      metaTitle: "Personalised Pokémon gift: ideas and how to do it",
      description: "A Pokémon gift gets personal through the choice of cards, not through printing. How to put together a binder for one specific person.",
      intro: "Official Pokémon cards cannot be printed individually, and home-made “cards” are neither genuine nor valuable. A gift becomes personal another way: through selection. A binder that is visibly put together for exactly this person says more than any standard present.",
      sections: [
        {
          heading: "What “personalised” means for trading cards",
          blocks: [
            { type: "p", text: "The personal part sits in three decisions: which Pokémon or motif, which cards of it, and how they look together. Someone who loves Charizard enjoys a page of Charizard cards from different years. Someone who prefers the pictures gets cards whose motifs match, such as sea, forest or snow." },
            { type: "p", text: "What matters is that the person recognises themselves. A binder full of cards that interest you as the giver is a gift to yourself." },
          ],
        },
        {
          heading: "Five questions before you choose cards",
          blocks: [
            { type: "ul", items: [
              "Which Pokémon stands for the person? Often it is the first one they ever liked, not the strongest right now.",
              "Do they like older cards with classic drawings or modern cards with large, full-page pictures?",
              "Should the text be German or English? That depends on what they know and what exists for the Pokémon.",
              "Will the binder be used for looking at cards, or for playing and trading?",
              "How many cards make sense: one page of nine, or several pages?",
            ] },
          ],
        },
        {
          heading: "How to do it with Your Card Binder",
          blocks: [
            { type: "p", text: "You pick a favourite Pokémon or a motif, the period of the cards and the language. Your Card Binder suggests matching cards and shows them as a binder page. Every card can be swapped, removed or replaced until the result fits the person." },
            { type: "p", text: "Only then comes the buying: Your Card Binder prepares the list for the marketplace you choose, and you decide there about sellers, condition and price." },
          ],
        },
        {
          heading: "Make the handover personal",
          blocks: [
            { type: "ul", items: [
              "Write on a card or note why you chose exactly this Pokémon.",
              "Arrange the first page so the favourite card is visible as soon as the binder is opened.",
              "Leave a few pockets empty on purpose so the collection can keep growing.",
              "Note where you bought the cards in case you want to add to them later.",
            ] },
          ],
        },
        {
          heading: "What to avoid",
          blocks: [
            { type: "p", text: "Do not buy “personalised Pokémon cards” from sellers who claim to print names or photos on cards. These are not official cards, they have no collector value and may infringe trademarks. Your gift stays personal when genuine cards are chosen with care." },
            { type: "p", text: "Your Card Binder is an independent project and is not affiliated with Nintendo, Creatures, GAME FREAK or The Pokémon Company." },
          ],
        },
      ],
    },
  },
  {
    id: "birthday-gift",
    updated: "2026-10-21",
    related: ["personalized-gift", "gift", "condition"],
    de: {
      slug: "pokemon-geburtstagsgeschenk",
      title: "Pokémon-Geschenk zum Geburtstag: Ideen für Kinder, Jugendliche und Erwachsene",
      metaTitle: "Pokémon-Geburtstagsgeschenk: Ideen nach Alter",
      description: "Ein Pokémon-Binder passt zu Kindern, Jugendlichen und erwachsenen Fans. Ideen nach Alter, ein Zeitplan für die Lieferung und Wege, die Zahl der Karten zu wählen.",
      intro: "Zum Geburtstag soll das Geschenk pünktlich da sein und trotzdem nicht nach Last-Minute aussehen. Bei Sammelkarten kommt die Besonderheit dazu, dass sie meist von mehreren Verkäufern geliefert werden. Mit einem festen Plan klappt beides.",
      sections: [
        {
          heading: "Je nach Alter anders",
          blocks: [
            { type: "table", caption: "Welcher Binder zu welchem Alter passt", head: ["Alter", "Was gut ankommt", "Worauf du achtest"], rows: [
              ["Kinder", "Eine Seite mit dem Lieblings-Pokémon, gut erkennbare Bilder", "Karten in Schutzhüllen, nichts Empfindliches ohne Binder"],
              ["Jugendliche", "Mehrere Seiten, gemischte Pokémon, moderne Illustrationskarten", "Sprache und Edition passend zu dem, was sie sammeln"],
              ["Erwachsene Fans", "Karten aus der eigenen Kindheit, alte Sets", "Zustand und Seltenheit realistisch einschätzen"],
            ] },
            { type: "p", text: "Die Tabelle ist eine Orientierung. Entscheidend bleibt, was die Person selbst mag." },
          ],
        },
        {
          heading: "Ein Zeitplan für die Lieferung",
          blocks: [
            { type: "ul", items: [
              "Etwa drei bis vier Wochen vorher: Pokémon, Zeitraum und Sprache festlegen und die Karten auswählen.",
              "Etwa zwei Wochen vorher: bestellen. Karten von mehreren Verkäufern kommen nicht gleichzeitig an.",
              "Einige Tage vorher: Eingang prüfen, Zustand ansehen, Karten in den Binder einsortieren.",
              "Fehlt eine Karte, bleibt dir Zeit für einen Ersatz.",
            ] },
          ],
        },
        {
          heading: "Wie viele Karten es sein sollen",
          blocks: [
            { type: "p", text: "Eine Seite mit neun Karten ist ein guter Anfang und lässt sich in einem Rutsch besorgen. Wer ein größeres Geschenk plant, kann das Alter als Anhaltspunkt nehmen und für jedes Lebensjahr eine Karte wählen. Bei hohen Zahlen lohnt sich ein Binder mit mehr Seiten, den du nach und nach füllst." },
            { type: "p", text: "Lege vor der Suche fest, wie viel du für das gesamte Geschenk ausgeben möchtest. Rechne Versand dazu: Bei mehreren Verkäufern entstehen mehrere Sendungen." },
          ],
        },
        {
          heading: "Ideen, die sich erzählen lassen",
          blocks: [
            { type: "ul", items: [
              "Das Pokémon, dessen Nummer im Pokédex dem Geburtstag oder dem Alter entspricht.",
              "Karten aus dem Jahr der Geburt, soweit es passende Pokémon dazu gibt.",
              "Das Pokémon, das die Person als Erstes gespielt oder gesehen hat.",
              "Ein Starter der Region, in der sie am liebsten spielt.",
            ] },
          ],
        },
        {
          heading: "Von der Idee zur Liste",
          blocks: [
            { type: "p", text: "In Your Card Binder wählst du das Pokémon, schaust dir die Vorschläge an und tauschst Karten aus. Danach bereitet Your Card Binder die Kaufliste für Cardmarket, CardTrader oder TCGplayer vor. Bestellt wird erst beim Marktplatz, und dort prüfst du Zustand, Versand und Gesamtpreis." },
          ],
        },
      ],
    },
    en: {
      slug: "pokemon-birthday-gift",
      title: "Pokémon gift for a birthday: ideas for kids, teens and adults",
      metaTitle: "Pokémon birthday gift: ideas by age",
      description: "A Pokémon binder suits kids, teens and adult fans. Ideas by age, a delivery timeline and ways to decide how many cards to give.",
      intro: "A birthday gift should arrive on time without looking last-minute. Trading cards add one more thing: they usually come from several sellers. A fixed plan takes care of both.",
      sections: [
        {
          heading: "Different for each age",
          blocks: [
            { type: "table", caption: "Which binder suits which age", head: ["Age", "What goes down well", "What to watch"], rows: [
              ["Kids", "One page of the favourite Pokémon, easily recognisable pictures", "Cards in sleeves, nothing delicate without a binder"],
              ["Teens", "Several pages, mixed Pokémon, modern illustration cards", "Language and edition matching what they collect"],
              ["Adult fans", "Cards from their own childhood, older sets", "Judge condition and rarity realistically"],
            ] },
            { type: "p", text: "The table is a rough guide. What counts is what the person likes." },
          ],
        },
        {
          heading: "A delivery timeline",
          blocks: [
            { type: "ul", items: [
              "About three to four weeks ahead: decide on Pokémon, period and language, and choose the cards.",
              "About two weeks ahead: order. Cards from several sellers do not arrive at the same time.",
              "A few days ahead: check what has arrived, look at the condition, sort the cards into the binder.",
              "If a card is missing, there is still time for a replacement.",
            ] },
          ],
        },
        {
          heading: "How many cards to give",
          blocks: [
            { type: "p", text: "One page of nine cards is a good start and can be sourced in one go. For a bigger gift you can use the age as a guide and pick one card for every year of life. For high numbers, a binder with more pages that you fill gradually is worth it." },
            { type: "p", text: "Before searching, decide how much you want to spend on the whole gift. Add shipping: with several sellers you get several parcels." },
          ],
        },
        {
          heading: "Ideas you can tell a story with",
          blocks: [
            { type: "ul", items: [
              "The Pokémon whose Pokédex number matches the birthday or the age.",
              "Cards from the year of birth, where matching Pokémon exist.",
              "The Pokémon the person played or saw first.",
              "A starter from the region they like to play in most.",
            ] },
          ],
        },
        {
          heading: "From idea to list",
          blocks: [
            { type: "p", text: "In Your Card Binder you pick the Pokémon, look at the suggestions and swap cards. Then Your Card Binder prepares the shopping list for Cardmarket, CardTrader or TCGplayer. You only order at the marketplace, and there you check condition, shipping and total price." },
          ],
        },
      ],
    },
  },
  {
    id: "christmas-gift",
    updated: "2026-10-21",
    related: ["birthday-gift", "marketplaces", "gift"],
    de: {
      slug: "pokemon-weihnachtsgeschenk",
      title: "Pokémon-Weihnachtsgeschenk: Früh planen, Karten richtig besorgen",
      metaTitle: "Pokémon-Weihnachtsgeschenk: Planung und Ideen",
      description: "Pokémon-Karten zu Weihnachten zu verschenken braucht etwas Vorlauf. Ein Zeitplan, Ideen wie ein Karten-Adventskalender und was du bei Lieferzeiten beachtest.",
      intro: "Vor Weihnachten sind Postwege länger und beliebte Karten schneller vergriffen. Ein Pokémon-Binder ist trotzdem ein dankbares Geschenk, wenn du früh genug anfängst und die Lieferung einplanst.",
      sections: [
        {
          heading: "Warum der Zeitplan hier wichtiger ist",
          blocks: [
            { type: "p", text: "Sammelkarten kaufst du bei Marktplätzen von vielen Einzelverkäufern. Jeder verschickt selbst, manche aus dem Ausland. In der Vorweihnachtszeit kann das länger dauern als gewohnt. Plane deshalb mehr Puffer ein als bei einem Geschenk aus dem Laden." },
          ],
        },
        {
          heading: "Ein Plan bis Heiligabend",
          blocks: [
            { type: "ul", items: [
              "Spätestens Ende November: Pokémon oder Motiv festlegen und die Karten auswählen.",
              "Anfang Dezember: bestellen, am besten bei wenigen Verkäufern, damit weniger Sendungen unterwegs sind.",
              "Vor dem Fest: Eingang prüfen, Zustand ansehen, Karten sortieren und einpacken.",
              "Fehlt etwas, kannst du bei einem anderen Verkäufer nachbestellen oder die Karte durch eine ähnliche ersetzen.",
            ] },
          ],
        },
        {
          heading: "Idee: Der Karten-Adventskalender",
          blocks: [
            { type: "p", text: "24 Karten für 24 Tage: Jeden Tag bis Heiligabend wird eine Karte ausgepackt oder in den Binder gesteckt. Drei Seiten mit neun Taschen bieten Platz für 27 Karten, also für den Kalender und drei Überraschungen am Fest." },
            { type: "p", text: "So setzt du es um: Wähle ein Lieblings-Pokémon oder ein Motiv und lass dir mehr Karten vorschlagen, als du brauchst. Behalte die schönsten für den Heiligabend." },
          ],
        },
        {
          heading: "Wo du kaufst",
          blocks: [
            { type: "p", text: "In Europa sind Cardmarket und CardTrader die naheliegenden Marktplätze. Bei beiden kannst du dir die Verkäufer ansehen und wählen, wer wie schnell liefert. Prüfe den voraussichtlichen Liefertermin und die Bewertung des Verkäufers vor der Bestellung." },
            { type: "p", text: "Your Card Binder kann bei Käufen über CardTrader-Links eine Provision erhalten. Dein Preis bleibt gleich." },
          ],
        },
        {
          heading: "Verpacken und übergeben",
          blocks: [
            { type: "ul", items: [
              "Binder in Geschenkpapier, die Lieblingskarte obenauf als Hinweis.",
              "Eine kurze Karte dazu, warum du dieses Pokémon gewählt hast.",
              "Freie Taschen lassen, damit unter dem Baum noch etwas nachkommen kann.",
            ] },
          ],
        },
      ],
    },
    en: {
      slug: "pokemon-christmas-gift",
      title: "Pokémon Christmas gift: plan early, source the cards properly",
      metaTitle: "Pokémon Christmas gift: planning and ideas",
      description: "Giving Pokémon cards at Christmas needs some lead time. A timeline, ideas such as a card advent calendar and what to keep in mind about delivery times.",
      intro: "Before Christmas, postal routes are longer and popular cards sell out faster. A Pokémon binder is still a welcome gift if you start early enough and plan for delivery.",
      sections: [
        {
          heading: "Why the timeline matters more here",
          blocks: [
            { type: "p", text: "You buy trading cards on marketplaces from many individual sellers. Each ships on their own, some from abroad. In the weeks before Christmas this can take longer than usual. So allow more buffer than for a gift from a shop." },
          ],
        },
        {
          heading: "A plan until Christmas Eve",
          blocks: [
            { type: "ul", items: [
              "By the end of November at the latest: decide on the Pokémon or motif and choose the cards.",
              "Early December: order, preferably from few sellers so fewer parcels are on the way.",
              "Before the holiday: check what has arrived, look at the condition, sort and wrap the cards.",
              "If something is missing, reorder from another seller or replace the card with a similar one.",
            ] },
          ],
        },
        {
          heading: "Idea: the card advent calendar",
          blocks: [
            { type: "p", text: "24 cards for 24 days: every day until Christmas Eve one card is unwrapped or slipped into the binder. Three pages of nine pockets leave room for 27 cards, so for the calendar plus three surprises on the day." },
            { type: "p", text: "How to do it: choose a favourite Pokémon or motif and have more cards suggested than you need. Keep the nicest ones for Christmas Eve." },
          ],
        },
        {
          heading: "Where to buy",
          blocks: [
            { type: "p", text: "In Europe, Cardmarket and CardTrader are the obvious marketplaces. On both you can look at the sellers and choose who delivers how fast. Check the expected delivery date and the seller's rating before ordering." },
            { type: "p", text: "Your Card Binder may receive a commission on purchases made through CardTrader links. Your price stays the same." },
          ],
        },
        {
          heading: "Wrapping and handing over",
          blocks: [
            { type: "ul", items: [
              "Wrap the binder, with the favourite card on top as a hint.",
              "Add a short note on why you chose this Pokémon.",
              "Leave pockets free so something can still be added under the tree.",
            ] },
          ],
        },
      ],
    },
  },
  {
    id: "start-collection",
    updated: "2026-10-21",
    related: ["condition", "binder-size", "gift"],
    de: {
      slug: "pokemon-sammlung-starten",
      title: "Eine Pokémon-Sammlung starten: So fängst du an, ohne dich zu verzetteln",
      metaTitle: "Pokémon-Sammlung starten: Einstieg in 5 Schritten",
      description: "Der Start einer Pokémon-Sammlung gelingt mit einem klaren Fokus. Fünf Schritte vom ersten Pokémon über den Binder bis zum Zustand der Karten.",
      intro: "Wer ohne Plan Karten kauft, hat schnell einen Karton voller Doppelter und keinen roten Faden. Ein Fokus macht eine Sammlung übersichtlich, günstiger und zu etwas, das dir gehört. So fängst du an.",
      sections: [
        {
          heading: "Schritt 1: Einen Fokus wählen",
          blocks: [
            { type: "p", text: "Fast alle langjährigen Sammlungen beginnen mit einer einfachen Grenze: ein Lieblings-Pokémon, ein Set, ein Typ oder eine Region. Ein Pokémon eignet sich für den Anfang am besten, weil es viele Karten aus unterschiedlichen Jahren gibt und die Sammlung ein Gesicht bekommt." },
          ],
        },
        {
          heading: "Schritt 2: Ein Budget festlegen",
          blocks: [
            { type: "p", text: "Setze eine Summe pro Monat oder für den Start fest und halte sie ein. Karten gibt es in sehr unterschiedlichen Preisbereichen. Du brauchst am Anfang keine teuren Karten, um eine Sammlung zu haben, die gut aussieht." },
          ],
        },
        {
          heading: "Schritt 3: Mit einem Binder beginnen",
          blocks: [
            { type: "ul", items: [
              "Ein Binder mit neun Taschen pro Seite ist der übliche Standard.",
              "Karten in Hüllen oder direkt in Binder-Taschen schützen sie vor Kratzern.",
              "Lass Platz: Wer 90 Karten besitzt, braucht keinen Binder für 900.",
            ] },
            { type: "p", text: "Wie viele Taschen welche Größe hat, erklärt der Ratgeber zu Binder-Größen." },
          ],
        },
        {
          heading: "Schritt 4: Auf den Zustand achten",
          blocks: [
            { type: "p", text: "Marktplätze bewerten Karten in festen Stufen von Near Mint bis Played. Für eine Sammlung zum Anschauen ist ein guter Zustand angenehm, muss aber nicht immer Near Mint sein. Lege vorab fest, was du akzeptierst, und stelle den Mindestzustand beim Kauf ein." },
          ],
        },
        {
          heading: "Schritt 5: Die Liste führen und kaufen",
          blocks: [
            { type: "p", text: "Halte fest, welche Karten du hast und welche fehlen. In Your Card Binder legst du dafür einen Wunsch-Binder an: Du siehst, welche Plätze frei sind, und bekommst die fehlenden Karten als Kaufliste für Cardmarket, CardTrader oder TCGplayer. Freie Plätze zählen dabei nicht als fehlende Karte, bis du dich für eine entscheidest." },
            { type: "p", text: "Eine Sammlung ist nie fertig, und das ist der Reiz. Fang klein an und lass sie wachsen." },
          ],
        },
      ],
    },
    en: {
      slug: "start-a-pokemon-collection",
      title: "Starting a Pokémon collection: how to begin without scattering",
      metaTitle: "Starting a Pokémon collection: five steps",
      description: "Starting a Pokémon collection works best with a clear focus. Five steps from the first Pokémon through the binder to the condition of the cards.",
      intro: "Buying cards without a plan quickly leaves you with a box of duplicates and no common thread. A focus keeps a collection tidy, cheaper and yours. Here is how to begin.",
      sections: [
        {
          heading: "Step 1: choose a focus",
          blocks: [
            { type: "p", text: "Almost every long-running collection begins with a simple boundary: a favourite Pokémon, one set, one type or one region. One Pokémon suits a start best, because there are many cards from different years and the collection gets a face." },
          ],
        },
        {
          heading: "Step 2: set a budget",
          blocks: [
            { type: "p", text: "Fix an amount per month, or for the start, and stick to it. Cards come in very different price ranges. You do not need expensive cards at first to have a collection that looks good." },
          ],
        },
        {
          heading: "Step 3: begin with a binder",
          blocks: [
            { type: "ul", items: [
              "A binder with nine pockets per page is the usual standard.",
              "Sleeves, or the binder pockets themselves, protect cards from scratches.",
              "Leave room: someone with 90 cards does not need a binder for 900.",
            ] },
            { type: "p", text: "The guide to binder sizes explains how many pockets each size has." },
          ],
        },
        {
          heading: "Step 4: pay attention to condition",
          blocks: [
            { type: "p", text: "Marketplaces grade cards in fixed steps from Near Mint to Played. For a collection to look at, a good condition is pleasant but does not always have to be Near Mint. Decide in advance what you accept and set the minimum condition when you buy." },
          ],
        },
        {
          heading: "Step 5: keep the list and buy",
          blocks: [
            { type: "p", text: "Keep track of which cards you have and which are missing. In Your Card Binder you create a wish binder for that: you see which places are free and get the missing cards as a shopping list for Cardmarket, CardTrader or TCGplayer. A free place does not count as a missing card until you decide on one." },
            { type: "p", text: "A collection is never finished, and that is its charm. Start small and let it grow." },
          ],
        },
      ],
    },
  },
  {
    id: "first-binder-kids",
    updated: "2026-10-21",
    related: ["start-collection", "birthday-gift", "condition"],
    de: {
      slug: "pokemon-karten-fuer-kinder",
      title: "Der Start einer Leidenschaft: Pokémon-Karten für Kinder und Einsteiger",
      metaTitle: "Pokémon-Karten für Kinder: Der erste Binder",
      description: "Ein erster Binder macht aus losen Karten eine Sammlung. Was Kinder und Einsteiger brauchen, wie Eltern beim Kauf helfen und woran sie echte Karten erkennen.",
      intro: "Für viele Kinder beginnt es mit einer Handvoll Karten vom Schulhof. Ein erster Binder macht daraus eine Sammlung und zeigt: Diese Karten sind etwas wert, auch wenn sie nicht teuer sind. Mit wenig Aufwand wird aus dem Interesse ein Hobby.",
      sections: [
        {
          heading: "Mit dem Lieblings-Pokémon beginnen",
          blocks: [
            { type: "p", text: "Kinder haben fast immer ein Pokémon, das sie über alle anderen stellen. Eine Seite nur mit diesem Pokémon ist leicht zu verstehen und macht stolz. Neun Karten reichen für den Anfang." },
          ],
        },
        {
          heading: "Was du für den ersten Binder brauchst",
          blocks: [
            { type: "ul", items: [
              "Einen Binder mit neun Taschen pro Seite, der sich leicht aufschlagen lässt.",
              "Die Karten selbst, gern aus verschiedenen Sets mit unterschiedlichen Bildern.",
              "Ein Plätzchen, an dem der Binder liegt, ohne dass er gequetscht oder nass wird.",
            ] },
          ],
        },
        {
          heading: "Eltern und Schenkende: So gehst du vor",
          blocks: [
            { type: "p", text: "Setze vorab ein Budget und lass das Kind mitentscheiden, welche Karten dazukommen. Ein Kind, das aussucht, kümmert sich später besser um seine Sammlung. Kaufe bei bekannten Marktplätzen wie Cardmarket oder CardTrader und achte auf Bewertungen der Verkäufer." },
            { type: "p", text: "Your Card Binder zeigt dir die Binder-Seite vorab und bereitet die Kaufliste vor. Gekauft wird erst beim Marktplatz, und dort kannst du Versand und Gesamtpreis in Ruhe prüfen." },
          ],
        },
        {
          heading: "Echt oder gefälscht?",
          blocks: [
            { type: "p", text: "Gefälschte Karten gibt es vor allem bei auffällig günstigen Angeboten und bei Verkäufern ohne Bewertungen. Marktplätze mit Verkäuferbewertungen und Beschreibung von Set, Nummer und Zustand sind der sicherere Weg. Wenn dir eine Karte ungewöhnlich glatt, dünn oder in den Farben falsch vorkommt, sprich den Verkäufer an." },
          ],
        },
        {
          heading: "Sorgsam umgehen lernen",
          blocks: [
            { type: "ul", items: [
              "Karten nur mit sauberen, trockenen Händen anfassen.",
              "Nicht in die Hosentasche stecken, sondern in den Binder.",
              "Den Binder aufrecht und nicht übervoll lagern.",
            ] },
            { type: "p", text: "So lernen Kinder spielerisch, mit Sachen sorgsam umzugehen, und die Sammlung bleibt über Jahre schön." },
          ],
        },
      ],
    },
    en: {
      slug: "pokemon-cards-for-kids",
      title: "The start of a passion: Pokémon cards for kids and beginners",
      metaTitle: "Pokémon cards for kids: the first binder",
      description: "A first binder turns loose cards into a collection. What kids and beginners need, how parents can help with buying and how to recognise genuine cards.",
      intro: "For many kids it starts with a handful of cards from the schoolyard. A first binder turns them into a collection and shows: these cards matter, even if they are not expensive. With little effort, an interest becomes a hobby.",
      sections: [
        {
          heading: "Start with the favourite Pokémon",
          blocks: [
            { type: "p", text: "Kids almost always have one Pokémon they put above all others. A page with just this Pokémon is easy to understand and makes them proud. Nine cards are enough to start." },
          ],
        },
        {
          heading: "What you need for a first binder",
          blocks: [
            { type: "ul", items: [
              "A binder with nine pockets per page that opens easily.",
              "The cards themselves, ideally from different sets with different pictures.",
              "A spot where the binder lies without being squashed or getting wet.",
            ] },
          ],
        },
        {
          heading: "Parents and givers: how to go about it",
          blocks: [
            { type: "p", text: "Set a budget beforehand and let the child help decide which cards come next. A child who chooses looks after the collection better later. Buy from known marketplaces such as Cardmarket or CardTrader and look at the sellers' ratings." },
            { type: "p", text: "Your Card Binder shows you the binder page in advance and prepares the shopping list. You only buy at the marketplace, where you can check shipping and total price in peace." },
          ],
        },
        {
          heading: "Genuine or fake?",
          blocks: [
            { type: "p", text: "Fake cards turn up mostly with strikingly cheap offers and sellers without ratings. Marketplaces with seller ratings and a description of set, number and condition are the safer route. If a card feels unusually smooth, thin or wrong in colour, talk to the seller." },
          ],
        },
        {
          heading: "Learning to handle things with care",
          blocks: [
            { type: "ul", items: [
              "Touch cards only with clean, dry hands.",
              "Do not put them in a trouser pocket; put them in the binder.",
              "Store the binder upright and not overfilled.",
            ] },
            { type: "p", text: "That way kids learn playfully to handle things with care, and the collection stays nice for years." },
          ],
        },
      ],
    },
  },
  {
    id: "cardmarket-vs-cardtrader",
    updated: "2026-10-21",
    related: ["marketplaces", "condition", "language-and-finish"],
    de: {
      slug: "cardmarket-oder-cardtrader",
      title: "Cardmarket oder CardTrader: Welcher Marktplatz passt zu deinen Pokémon-Karten?",
      metaTitle: "Cardmarket oder CardTrader: Pokémon-Karten kaufen",
      description: "Cardmarket und CardTrader sind europäische Marktplätze für Sammelkarten. Was sie unterscheidet, wann welcher passt und worauf du beim Versand achtest.",
      intro: "Beide Plattformen verbinden Käufer mit vielen Einzelverkäufern, und beide eignen sich für Pokémon-Karten in Europa. Im Alltag unterscheiden sie sich vor allem darin, wie du eine Bestellung zusammenstellst und wie der Versand gebündelt wird.",
      sections: [
        {
          heading: "Was beide gemeinsam haben",
          blocks: [
            { type: "ul", items: [
              "Du kaufst von einzelnen Verkäufern, nicht von einem Shop.",
              "Jede Karte hat Zustand, Sprache und oft eine Ausführung wie Holo oder Reverse Holo.",
              "Preis und Versand hängen vom Verkäufer ab.",
              "Du prüfst Gesamtpreis und Versand erst vor dem Bezahlen endgültig.",
            ] },
          ],
        },
        {
          heading: "Wo sie sich unterscheiden",
          blocks: [
            { type: "table", caption: "Kurzvergleich aus Sicht eines Käufers in Europa", head: ["", "Cardmarket", "CardTrader"], rows: [
              ["Bestellung zusammenstellen", "Wants-Liste anlegen, dann den Shopping Wizard Verkäufer vorschlagen lassen", "Liste im Shop Optimizer anlegen, der Verkäufer nach Preis, Zahl der Verkäufer oder Tempo auswählt"],
              ["Versand", "Wird pro Verkäufer berechnet", "Mit CardTrader Zero können Karten mehrerer Verkäufer in einer Sendung ankommen"],
              ["Übergabe aus Your Card Binder", "Deckliste zum Einfügen in die Wants-Liste", "Links zu jeder Karte und der Shop Optimizer"],
              ["Wichtig vor dem Kauf", "Mindestzustand und Sprache nach dem Import einstellen", "Sprache und Mindestzustand im Shop Optimizer prüfen"],
            ] },
            { type: "p", text: "Die Angaben sind eine Orientierung und können sich ändern. Prüfe die aktuellen Bedingungen immer auf der Seite des Marktplatzes." },
          ],
        },
        {
          heading: "Wann welcher Marktplatz passt",
          blocks: [
            { type: "p", text: "Wer viele Karten auf einmal besorgt und eine bewährte Liste importieren möchte, kommt bei Cardmarket schnell zum Ziel. Wer Wert darauf legt, dass Karten verschiedener Verkäufer in einer Sendung ankommen, schaut sich CardTrader an. Welcher Weg günstiger ist, hängt vom Versand und von den Verkäufern ab, und beides siehst du erst bei der Bestellung." },
            { type: "p", text: "Ein Preisvergleich vorab ist deshalb nur eine Momentaufnahme. Wenn dir der Endpreis wichtig ist, stelle dieselbe Liste bei beiden zusammen und vergleiche die Summe einschließlich Versand." },
          ],
        },
        {
          heading: "Worauf du bei beiden achtest",
          blocks: [
            { type: "ul", items: [
              "Sprache der Karte: Deutsch und Englisch sind unterschiedliche Karten.",
              "Ausführung: Holo, Reverse Holo und Normal haben verschiedene Preise.",
              "Zustand: Lege den Mindestzustand fest, bevor du Verkäufer wählst.",
              "Verkäufer: Bewertung und Lieferzeit ansehen.",
            ] },
          ],
        },
        {
          heading: "Was Your Card Binder dabei macht",
          blocks: [
            { type: "p", text: "Your Card Binder bereitet die Liste für beide Marktplätze vor und führt dich in vier Schritten durch den Ablauf. Bestellt, bezahlt und gekauft wird nur beim Marktplatz selbst." },
            { type: "p", text: "Your Card Binder kann bei Käufen über CardTrader-Links eine Provision erhalten. Dein Preis bleibt gleich. Your Card Binder steht mit keinem der Marktplätze in einer geschäftlichen Verbindung außer diesem Partnerprogramm." },
          ],
        },
      ],
    },
    en: {
      slug: "cardmarket-or-cardtrader",
      title: "Cardmarket or CardTrader: which marketplace suits your Pokémon cards?",
      metaTitle: "Cardmarket or CardTrader: buying Pokémon cards",
      description: "Cardmarket and CardTrader are European marketplaces for trading cards. What sets them apart, when each one fits and what to watch for with shipping.",
      intro: "Both platforms connect buyers with many individual sellers, and both suit Pokémon cards in Europe. In daily use they differ mostly in how you put an order together and how shipping is bundled.",
      sections: [
        {
          heading: "What both have in common",
          blocks: [
            { type: "ul", items: [
              "You buy from individual sellers, not from one shop.",
              "Every card has a condition, a language and often a finish such as holo or reverse holo.",
              "Price and shipping depend on the seller.",
              "You only check total price and shipping for good before paying.",
            ] },
          ],
        },
        {
          heading: "Where they differ",
          blocks: [
            { type: "table", caption: "Quick comparison from a buyer's view in Europe", head: ["", "Cardmarket", "CardTrader"], rows: [
              ["Putting an order together", "Create a wants list, then let the Shopping Wizard propose sellers", "Create a list in the Shop Optimizer, which picks sellers by price, number of sellers or speed"],
              ["Shipping", "Calculated per seller", "With CardTrader Zero, cards from several sellers can arrive in one parcel"],
              ["Handover from Your Card Binder", "Deck list to paste into the wants list", "Links for every card and the Shop Optimizer"],
              ["Important before buying", "Set minimum condition and language after the import", "Check language and minimum condition in the Shop Optimizer"],
            ] },
            { type: "p", text: "The details are a rough guide and can change. Always check the current terms on the marketplace itself." },
          ],
        },
        {
          heading: "When which marketplace fits",
          blocks: [
            { type: "p", text: "If you source many cards at once and want to import a ready list, Cardmarket gets you there quickly. If it matters to you that cards from different sellers arrive in one parcel, look at CardTrader. Which route is cheaper depends on shipping and sellers, and you only see both when you order." },
            { type: "p", text: "A price comparison in advance is therefore only a snapshot. If the final price matters to you, put the same list together on both and compare the total including shipping." },
          ],
        },
        {
          heading: "What to watch on both",
          blocks: [
            { type: "ul", items: [
              "Card language: German and English are different cards.",
              "Finish: holo, reverse holo and normal have different prices.",
              "Condition: set the minimum condition before choosing sellers.",
              "Sellers: look at rating and delivery time.",
            ] },
          ],
        },
        {
          heading: "What Your Card Binder does here",
          blocks: [
            { type: "p", text: "Your Card Binder prepares the list for both marketplaces and guides you through the process in four steps. You order, pay and buy only at the marketplace itself." },
            { type: "p", text: "Your Card Binder may receive a commission on purchases made through CardTrader links. Your price stays the same. Your Card Binder has no business relationship with either marketplace apart from this partner programme." },
          ],
        },
      ],
    },
  },
  {
    id: "tcgplayer-howto",
    updated: "2026-10-22",
    related: ["marketplaces", "condition", "language-and-finish"],
    de: {
      slug: "tcgplayer-pokemon-karten-kaufen",
      title: "Pokémon-Karten bei TCGplayer kaufen: Schritt für Schritt mit Mass Entry",
      metaTitle: "Pokémon-Karten bei TCGplayer kaufen: Anleitung",
      description: "So kommt deine Kartenliste von Your Card Binder zu TCGplayer: Mass Entry öffnen, Printing und Zustand wählen, Add to Cart und was du bei Versand nach Deutschland prüfst.",
      intro: "TCGplayer ist ein Marktplatz mit dem Schwerpunkt USA, dessen Oberfläche englisch ist. Mit der Funktion Mass Entry fügst du eine ganze Kartenliste auf einmal ein, statt jede Karte einzeln zu suchen. Diese Anleitung zeigt die vier Schritte und die Begriffe, die dich dort erwarten.",
      sections: [
        {
          heading: "Das solltest du vorab wissen",
          blocks: [
            { type: "ul", items: [
              "Die Oberfläche ist englisch, die Preise stehen in US-Dollar.",
              "Bei einem Standort in Deutschland zeigt TCGplayer nur Verkäufer an, die dorthin liefern, und weist auf internationale Versandpartner hin, die Bestellungen gebündelt und mit Sendungsverfolgung liefern.",
              "TCGplayer führt die Karten vor allem in englischer Sprache. Für deutsche Karten ist Cardmarket meist die bessere Wahl.",
              "Your Card Binder legt nichts in deinen Warenkorb und kauft nichts. Das passiert erst bei TCGplayer, wenn du es selbst auslöst.",
            ] },
          ],
        },
        {
          heading: "Schritt 1: Liste kopieren und Mass Entry öffnen",
          blocks: [
            { type: "p", text: "In Your Card Binder wählst du bei der Frage nach dem Marktplatz TCGplayer. Der große Button kopiert alle vorbereiteten Karten und öffnet Mass Entry. Passt die Liste in die Adresse, steht sie dort schon vorausgefüllt im Feld „Items“, sonst fügst du sie mit Strg+V beziehungsweise ⌘V ein." },
            { type: "p", text: "Jede Zeile hat das Format „Anzahl Name [Set-Code] Nummer“, zum Beispiel „1 Charizard [BS] 004/102“. Your Card Binder schreibt nur Zeilen, deren Zuordnung geprüft ist; Karten ohne sichere Zuordnung bleiben draußen und werden aufgelistet." },
          ],
        },
        {
          heading: "Schritt 2: Die Liste in Mass Entry prüfen",
          blocks: [
            { type: "ul", items: [
              "Bei „Select Product Line“ muss „Pokemon“ stehen.",
              "Im Feld „Items“ sollte jede Karte als eigene Zeile stehen.",
              "Mit „Show Set/Series Codes“ siehst du die Kürzel der Sets, falls eine Zeile nicht erkannt wird.",
            ] },
            { type: "p", text: "Mass Entry übernimmt Name, Set und Nummer. Alles Weitere stellst du im nächsten Schritt ein." },
          ],
        },
        {
          heading: "Schritt 3: Printing und Condition einstellen",
          blocks: [
            { type: "p", text: "Im Bereich „Item Options“ legst du für die ganze Liste fest, welche Ausführung und welcher Zustand infrage kommen. Mehrere Haken sind möglich." },
            { type: "table", caption: "Optionen bei TCGplayer und was sie bedeuten", head: ["Bereich", "Option bei TCGplayer", "Bedeutung"], rows: [
              ["Printing", "Normal, Holofoil, Reverse Holofoil", "Moderne Sets: Karte ohne Glanz, mit Glanz im Bild oder mit Glanz im Rest der Karte"],
              ["Printing", "1st Edition, 1st Edition Holofoil, Unlimited, Unlimited Holofoil", "Frühe Sets: die 1. Edition ist oft deutlich teurer als Unlimited"],
              ["Condition", "Near Mint", "Wie neu"],
              ["Condition", "Lightly Played, Moderately Played", "Leichte bis mittlere Gebrauchsspuren"],
              ["Condition", "Heavily Played, Damaged", "Starke Spuren oder Schäden; für Geschenke nicht empfohlen"],
            ] },
            { type: "p", text: "Your Card Binder zeigt dir im Ablauf, welche Printing- und Zustandsangaben du für deine Karten gewählt hast. TCGplayer kennt keine Stufe „Excellent“; Near Mint plus Lightly Played kommt ihr am nächsten." },
          ],
        },
        {
          heading: "Schritt 4: Add to Cart und das Ergebnis prüfen",
          blocks: [
            { type: "p", text: "TCGplayer beschreibt die Funktion so: Du sagst, wie du die Karten haben möchtest, und TCGplayer sucht die günstigsten passenden Angebote im Marktplatz. Mit „Add to Cart“ werden sie in den Warenkorb gelegt." },
            { type: "ul", items: [
              "Prüfe, ob zu jeder Zeile ein Angebot gefunden wurde.",
              "Kontrolliere Kartenname, Set, vollständige Nummer, Sprache, Printing und Zustand.",
              "Sieh dir Versandkosten und Lieferart an, bevor du bezahlst. Bei mehreren Verkäufern entstehen mehrere Sendungen oder Versandkosten.",
              "Bezahlt wird bei TCGplayer. Preise und Versand bestätigst du dort.",
            ] },
          ],
        },
        {
          heading: "Wenn eine Karte nicht gefunden wird",
          blocks: [
            { type: "p", text: "Prüfe die Zeile auf Tippfehler und den Set-Code. Bei Karten, die Your Card Binder nicht sicher zuordnen konnte, findest du unter „Falls etwas nicht klappt“ einen Text zum Kopieren und, wo bekannt, direkte Produktseiten bei TCGplayer. Dort wählst du das passende Angebot selbst aus." },
          ],
        },
      ],
    },
    en: {
      slug: "buy-pokemon-cards-on-tcgplayer",
      title: "Buying Pokémon cards on TCGplayer: step by step with Mass Entry",
      metaTitle: "Buying Pokémon cards on TCGplayer: guide",
      description: "How your card list from Your Card Binder gets to TCGplayer: open Mass Entry, choose printing and condition, Add to Cart, and what to check for shipping to Germany.",
      intro: "TCGplayer is a marketplace focused on the USA, and its interface is in English. With the Mass Entry function you paste a whole card list at once instead of searching for each card. This guide shows the four steps and the terms you will meet there.",
      sections: [
        {
          heading: "What to know in advance",
          blocks: [
            { type: "ul", items: [
              "The interface is in English and prices are in US dollars.",
              "With a location in Germany, TCGplayer only shows sellers that ship there and points to international shipping partners that deliver orders consolidated and tracked.",
              "TCGplayer lists cards mostly in English. For German cards, Cardmarket is usually the better choice.",
              "Your Card Binder puts nothing in your cart and buys nothing. That only happens at TCGplayer when you trigger it yourself.",
            ] },
          ],
        },
        {
          heading: "Step 1: copy the list and open Mass Entry",
          blocks: [
            { type: "p", text: "In Your Card Binder you choose TCGplayer when asked for the marketplace. The big button copies all prepared cards and opens Mass Entry. If the list fits into the address, it is already filled in the “Items” field; otherwise paste it with Ctrl+V or ⌘V." },
            { type: "p", text: "Each line has the format “quantity name [set code] number”, for example “1 Charizard [BS] 004/102”. Your Card Binder only writes lines whose match has been verified; cards without a reliable match stay out and are listed." },
          ],
        },
        {
          heading: "Step 2: check the list in Mass Entry",
          blocks: [
            { type: "ul", items: [
              "“Select Product Line” must say “Pokemon”.",
              "The “Items” field should show each card as its own line.",
              "“Show Set/Series Codes” lists the set abbreviations if a line is not recognised.",
            ] },
            { type: "p", text: "Mass Entry takes over name, set and number. You set everything else in the next step." },
          ],
        },
        {
          heading: "Step 3: set printing and condition",
          blocks: [
            { type: "p", text: "In the “Item Options” area you decide for the whole list which finish and which condition qualify. Several ticks are possible." },
            { type: "table", caption: "Options at TCGplayer and what they mean", head: ["Area", "Option at TCGplayer", "Meaning"], rows: [
              ["Printing", "Normal, Holofoil, Reverse Holofoil", "Modern sets: card without shine, with shine in the picture or with shine on the rest of the card"],
              ["Printing", "1st Edition, 1st Edition Holofoil, Unlimited, Unlimited Holofoil", "Early sets: the 1st edition is often much more expensive than Unlimited"],
              ["Condition", "Near Mint", "Like new"],
              ["Condition", "Lightly Played, Moderately Played", "Light to moderate wear"],
              ["Condition", "Heavily Played, Damaged", "Heavy wear or damage; not recommended for gifts"],
            ] },
            { type: "p", text: "Your Card Binder shows in the guide which printing and condition you chose for your cards. TCGplayer has no “Excellent” grade; Near Mint plus Lightly Played comes closest." },
          ],
        },
        {
          heading: "Step 4: Add to Cart and check the result",
          blocks: [
            { type: "p", text: "TCGplayer describes the function like this: you say how you want the cards, and TCGplayer finds the best matching prices across the marketplace. “Add to Cart” puts them into the cart." },
            { type: "ul", items: [
              "Check that an offer was found for every line.",
              "Check card name, set, full number, language, printing and condition.",
              "Look at shipping costs and delivery type before you pay. With several sellers there are several parcels or shipping costs.",
              "You pay at TCGplayer. You confirm prices and shipping there.",
            ] },
          ],
        },
        {
          heading: "If a card is not found",
          blocks: [
            { type: "p", text: "Check the line for typos and the set code. For cards Your Card Binder could not match reliably, you find a text to copy under “Falls etwas nicht klappt” and, where known, direct product pages at TCGplayer. There you choose the matching offer yourself." },
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
