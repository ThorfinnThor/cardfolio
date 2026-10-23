/**
 * Answer-first summary, publication date and frequently asked questions for each guide. Kept apart from the
 * long article text: the summary sits at the top of the page, the questions at the end, and the same
 * questions are published as FAQPage structured data. Every fact here repeats what the article already says.
 */
import { MOTIF_GUIDE_EXTRAS } from "./motif-guide-extras";

export interface GuideFaq {
  q: string;
  a: string;
}

export interface GuideExtraText {
  /** Two or three sentences that answer the guide's main question on their own. */
  answer: string;
  faq: readonly GuideFaq[];
}

export interface GuideExtras {
  /** Date the guide first went live. */
  published: string;
  de: GuideExtraText;
  en: GuideExtraText;
}

const BASE_GUIDE_EXTRAS: Readonly<Record<string, GuideExtras>> = {
  gift: {
    published: "2026-10-20",
    de: {
      answer: "Ein Binder mit Karten vom Lieblings-Pokémon ist ein persönliches Geschenk für Menschen, die Karten gern ansehen und sammeln. Starte mit einem Pokémon und neun Karten auf einer Seite, wähle Sprache und Mindestzustand vorab und kaufe die Karten bei einem Marktplatz wie Cardmarket.",
      faq: [
        { q: "Wie viele Karten brauche ich für den Anfang?", a: "Neun Karten füllen eine Seite eines üblichen Binders mit neun Taschen. Eine solche Seite wirkt sofort fertig, und die Person kann später selbst weitersammeln." },
        { q: "Kann ich Karten von mehreren Pokémon in einen Binder legen?", a: "Ja. In Your Card Binder gibst du bis zu vier Pokémon ein, zum Beispiel Pikachu und Glurak, und bekommst eine ausgewogene Seite. Alle Karten lassen sich austauschen, oder du öffnest den Vorschlag als Binder und wählst jede Karte frei." },
        { q: "Eignet sich ein Binder auch für Menschen, die das Kartenspiel spielen?", a: "Weniger. Ein Binder ist für Karten zum Ansehen und Sortieren gedacht. Wer vor allem spielt, braucht Decks mit passenden Kombinationen." },
      ],
    },
    en: {
      answer: "A binder of cards from a favourite Pokémon is a personal gift for people who like to look at and collect cards. Start with one Pokémon and nine cards on a page, decide on language and minimum condition in advance, and buy the cards from a marketplace such as Cardmarket.",
      faq: [
        { q: "How many cards do I need to start?", a: "Nine cards fill one page of a standard nine-pocket binder. Such a page looks finished straight away, and the person can keep collecting later." },
        { q: "Can I put cards from several Pokémon into one binder?", a: "Yes. In Your Card Binder you enter up to four Pokémon, for example Pikachu and Charizard, and get a balanced page. Every card can be swapped, or you can open the proposal as a binder and choose each card freely." },
        { q: "Is a binder suitable for people who play the card game?", a: "Less so. A binder is meant for cards to look at and sort. Players mainly need decks with matching combinations." },
      ],
    },
  },
  "binder-size": {
    published: "2026-10-20",
    de: {
      answer: "Die Zahl der Taschen gibt an, wie viele Karten auf einer Seite Platz haben: üblich sind 4, 9 oder 12. Die 9-Pocket-Seite gilt als Standard. Ein Blatt hat zwei Seiten, 20 Blätter mit je 9 Taschen pro Seite fassen deshalb 360 Karten.",
      faq: [
        { q: "Was bedeutet 9-Pocket?", a: "Jede Seite des Binders hat neun Taschen in drei Reihen zu je drei Karten. Es ist die üblichste Größe für Sammelkarten." },
        { q: "Wie viele Karten passen in einen Binder mit 20 Blättern?", a: "Bei 9 Taschen pro Seite sind es 360 Karten, wenn beide Seiten jedes Blattes genutzt werden. Bei 4 Taschen sind es 160, bei 12 Taschen 480." },
        { q: "Sollte ich den Binder gleich ganz füllen?", a: "Nein. Lass Platz, wenn die Sammlung wachsen soll. Wer 90 Karten besitzt, braucht keinen Binder für 900." },
      ],
    },
    en: {
      answer: "The number of pockets tells you how many cards fit on a page: 4, 9 or 12 are common. The 9-pocket page is the standard. A sheet has two sides, so 20 sheets with 9 pockets per side hold 360 cards.",
      faq: [
        { q: "What does 9-pocket mean?", a: "Each page of the binder has nine pockets in three rows of three cards. It is the most common size for trading cards." },
        { q: "How many cards fit in a binder with 20 sheets?", a: "With 9 pockets per page it is 360 cards if both sides of every sheet are used. With 4 pockets it is 160, with 12 pockets 480." },
        { q: "Should I fill the binder completely right away?", a: "No. Leave room if the collection is meant to grow. Someone with 90 cards does not need a binder for 900." },
      ],
    },
  },
  condition: {
    published: "2026-10-20",
    de: {
      answer: "Marktplätze bewerten den Zustand von Karten in festen Stufen von Near Mint bis Played. Für ein Geschenk ist „Sehr gut“ (Near Mint oder Excellent) meist ein guter Kompromiss. „Wie neu“ bedeutet Near Mint und schränkt die Auswahl ein.",
      faq: [
        { q: "Was bedeutet Near Mint?", a: "Near Mint ist die beste übliche Stufe beim Handel mit Spielkarten: Die Karte sieht praktisch neu aus. Cardmarket und TCGplayer verwenden diese Bezeichnung beide." },
        { q: "Welchen Mindestzustand wähle ich für ein Geschenk?", a: "„Sehr gut“ ist meist ein guter Kompromiss: Kleine Spuren sind erlaubt, die Karten sehen im Binder ordentlich aus, und die Auswahl bleibt groß." },
        { q: "Warum kann dieselbe Karte bei zwei Verkäufern unterschiedlich bewertet sein?", a: "Verkäufer stufen ihre Karten selbst ein, und die Grenzen zwischen zwei Stufen sind nicht scharf. Fotos und Beschreibung helfen bei der Entscheidung." },
      ],
    },
    en: {
      answer: "Marketplaces grade the condition of cards in fixed steps from Near Mint to Played. For a gift, “Very good” (Near Mint or Excellent) is usually a good compromise. “Like new” means Near Mint and narrows the choice.",
      faq: [
        { q: "What does Near Mint mean?", a: "Near Mint is the best common grade when trading playing cards: the card looks practically new. Cardmarket and TCGplayer both use this name." },
        { q: "Which minimum condition should I choose for a gift?", a: "“Very good” is usually a good compromise: small marks are allowed, the cards still look tidy in the binder, and the choice stays large." },
        { q: "Why can the same card be graded differently by two sellers?", a: "Sellers grade their own cards, and the borders between two grades are not sharp. Photos and description help you decide." },
      ],
    },
  },
  marketplaces: {
    published: "2026-10-20",
    de: {
      answer: "Cardmarket und TCGplayer sind Marktplätze, auf denen du bei vielen Einzelverkäufern kaufst. Wer in Deutschland oder Europa kauft, findet bei Cardmarket meist die kürzeren Wege. TCGplayer lohnt sich vor allem bei Kontakten oder Lieferadressen in den USA. Den Endpreis rechnest du immer mit Versand.",
      faq: [
        { q: "Welcher Marktplatz ist für Deutschland besser?", a: "Cardmarket ist ein europäischer Marktplatz mit Verkäufern in vielen Ländern und auch auf Deutsch verfügbar. TCGplayer hat seinen Schwerpunkt bei Verkäufern in den USA." },
        { q: "Kaufe ich bei Cardmarket oder TCGplayer direkt vom Betreiber?", a: "Nein. Beide sind Marktplätze: Du kaufst von einzelnen Verkäufern, und Preis und Versand unterscheiden sich je nach Verkäufer." },
        { q: "Wie spare ich Versandkosten?", a: "Mehrere Karten beim selben Verkäufer sparen oft Versandkosten. Rechne den Endpreis immer einschließlich Versand aus, bevor du dich entscheidest." },
      ],
    },
    en: {
      answer: "Cardmarket and TCGplayer are marketplaces where you buy from many individual sellers. If you buy in Germany or Europe, Cardmarket usually offers the shorter routes. TCGplayer is mainly interesting if you have contacts or delivery addresses in the USA. Always work out the final price including shipping.",
      faq: [
        { q: "Which marketplace is better for Germany?", a: "Cardmarket is a European marketplace with sellers in many countries and is also available in German. TCGplayer focuses on sellers in the USA." },
        { q: "Do I buy directly from the operator on Cardmarket or TCGplayer?", a: "No. Both are marketplaces: you buy from individual sellers, and price and shipping differ by seller." },
        { q: "How do I save on shipping?", a: "Several cards from the same seller often save shipping costs. Always calculate the final price including shipping before you decide." },
      ],
    },
  },
  "language-and-finish": {
    published: "2026-10-20",
    de: {
      answer: "Dieselbe Karte gibt es in mehreren Sprachen und Ausführungen, und auf Marktplätzen sind das getrennte Angebote. Lege Sprache, Finish (Holo, Reverse Holo oder Normal) und bei frühen Sets die Edition vor dem Kauf fest und prüfe, ob das Foto zur beschriebenen Variante passt.",
      faq: [
        { q: "Ist eine deutsche Karte dieselbe Karte wie die englische?", a: "Die Kartennummer bleibt gleich, Name und Text unterscheiden sich. Auf Marktplätzen sind es getrennte Angebote mit eigenen Preisen." },
        { q: "Was ist der Unterschied zwischen Holo und Reverse Holo?", a: "Beim Holo glänzt das Bild der Karte, beim Reverse Holo der Rest der Karte. Nicht jede Karte existiert in beiden Ausführungen." },
        { q: "Muss ich auf 1st Edition und Shadowless achten?", a: "Diese Unterschiede betreffen vor allem die Sets der frühen Jahre. Bei modernen Sets gibt es keine 1st Edition, deshalb kannst du das bei aktuellen Karten in der Regel ignorieren." },
      ],
    },
    en: {
      answer: "The same card exists in several languages and finishes, and on marketplaces these are separate listings. Decide on language, finish (holo, reverse holo or normal) and, for early sets, the edition before you buy, and check that the photo matches the described variant.",
      faq: [
        { q: "Is a German card the same card as the English one?", a: "The card number stays the same, name and text differ. On marketplaces they are separate listings with their own prices." },
        { q: "What is the difference between holo and reverse holo?", a: "With holo, the picture on the card shines; with reverse holo, the rest of the card does. Not every card exists in both finishes." },
        { q: "Do I need to care about 1st edition and shadowless?", a: "These differences mostly concern the sets of the early years. Modern sets have no 1st edition, so you can usually ignore it for current cards." },
      ],
    },
  },
  "personalized-gift": {
    published: "2026-10-21",
    de: {
      answer: "Offizielle Pokémon-Karten lassen sich nicht individuell bedrucken. Persönlich wird ein Geschenk durch die Auswahl: das Pokémon oder Motiv, der Zeitraum der Karten und die Sprache. Ein Binder, der erkennbar für eine Person zusammengestellt wurde, wirkt mehr als Standardware.",
      faq: [
        { q: "Kann ich Pokémon-Karten mit Namen oder Foto bedrucken lassen?", a: "Das ist nicht ratsam. Bedruckte Karten sind keine offiziellen Karten, haben keinen Sammlerwert und können Markenrechte verletzen." },
        { q: "Wie wähle ich das passende Pokémon aus?", a: "Nimm das Pokémon, das für die Person steht. Oft ist es das erste, das sie je gemocht hat, nicht das aktuell stärkste." },
        { q: "Wie mache ich die Übergabe persönlich?", a: "Schreibe auf einen Zettel, warum du dieses Pokémon gewählt hast, lege die Lieblingskarte auf die erste Seite und lass ein paar Taschen frei, damit die Sammlung weiterwachsen kann." },
      ],
    },
    en: {
      answer: "Official Pokémon cards cannot be printed individually. A gift becomes personal through selection: the Pokémon or motif, the period of the cards and the language. A binder visibly put together for one person says more than a standard present.",
      faq: [
        { q: "Can I have Pokémon cards printed with a name or photo?", a: "That is not advisable. Printed cards are not official cards, have no collector value and may infringe trademarks." },
        { q: "How do I choose the right Pokémon?", a: "Take the Pokémon that stands for the person. Often it is the first one they ever liked, not the strongest right now." },
        { q: "How do I make the handover personal?", a: "Write a note on why you chose this Pokémon, put the favourite card on the first page and leave a few pockets free so the collection can keep growing." },
      ],
    },
  },
  "birthday-gift": {
    published: "2026-10-21",
    de: {
      answer: "Plane ein Pokémon-Geschenk zum Geburtstag etwa drei bis vier Wochen vorher und bestelle spätestens zwei Wochen vorher, weil Karten von mehreren Verkäufern nicht gleichzeitig ankommen. Eine Seite mit neun Karten ist ein guter Anfang, und das Alter lässt sich als Kartenzahl nutzen.",
      faq: [
        { q: "Wann bestelle ich die Karten für den Geburtstag?", a: "Etwa zwei Wochen vorher. So bleibt Zeit, den Eingang zu prüfen, Karten einzusortieren und bei Bedarf Ersatz zu bestellen." },
        { q: "Wie viele Karten verschenke ich?", a: "Eine Seite mit neun Karten reicht für den Anfang. Für ein größeres Geschenk kannst du für jedes Lebensjahr eine Karte wählen." },
        { q: "Welche Ideen lassen sich gut erzählen?", a: "Das Pokémon, dessen Pokédex-Nummer zum Geburtstag oder Alter passt, Karten aus dem Geburtsjahr, das erste Pokémon der Person oder ein Starter ihrer Lieblingsregion." },
      ],
    },
    en: {
      answer: "Plan a Pokémon birthday gift about three to four weeks ahead and order at least two weeks before, because cards from several sellers do not arrive at the same time. One page of nine cards is a good start, and the age can serve as the number of cards.",
      faq: [
        { q: "When should I order the cards for the birthday?", a: "About two weeks ahead. That leaves time to check what has arrived, sort the cards in and order a replacement if needed." },
        { q: "How many cards should I give?", a: "One page of nine cards is enough to start. For a bigger gift you can pick one card for every year of life." },
        { q: "Which ideas make a good story?", a: "The Pokémon whose Pokédex number matches the birthday or age, cards from the year of birth, the person's first Pokémon or a starter from their favourite region." },
      ],
    },
  },
  "christmas-gift": {
    published: "2026-10-21",
    de: {
      answer: "Vor Weihnachten sind Postwege länger, deshalb brauchst du mehr Puffer als bei einem Geschenk aus dem Laden: Karten bis Ende November auswählen, Anfang Dezember bestellen. Ein Karten-Adventskalender mit 24 Karten passt auf drei Seiten mit neun Taschen.",
      faq: [
        { q: "Bis wann sollte ich Pokémon-Karten für Weihnachten bestellen?", a: "Wähle die Karten bis Ende November aus und bestelle Anfang Dezember, am besten bei wenigen Verkäufern, damit weniger Sendungen unterwegs sind." },
        { q: "Wie funktioniert ein Karten-Adventskalender?", a: "24 Karten für 24 Tage: Jeden Tag bis Heiligabend wird eine Karte ausgepackt oder in den Binder gesteckt. Drei Seiten mit neun Taschen bieten Platz für 27 Karten, also drei Überraschungen am Fest." },
        { q: "Wo kaufe ich die Karten?", a: "In Europa sind Cardmarket und CardTrader die naheliegenden Marktplätze. Prüfe den voraussichtlichen Liefertermin und die Bewertung des Verkäufers vor der Bestellung." },
      ],
    },
    en: {
      answer: "Before Christmas postal routes are longer, so allow more buffer than for a gift from a shop: choose the cards by the end of November and order in early December. A card advent calendar with 24 cards fits on three pages of nine pockets.",
      faq: [
        { q: "By when should I order Pokémon cards for Christmas?", a: "Choose the cards by the end of November and order in early December, preferably from few sellers so fewer parcels are on the way." },
        { q: "How does a card advent calendar work?", a: "24 cards for 24 days: every day until Christmas Eve one card is unwrapped or slipped into the binder. Three pages of nine pockets leave room for 27 cards, so three surprises on the day." },
        { q: "Where do I buy the cards?", a: "In Europe, Cardmarket and CardTrader are the obvious marketplaces. Check the expected delivery date and the seller's rating before ordering." },
      ],
    },
  },
  "start-collection": {
    published: "2026-10-21",
    de: {
      answer: "Eine Pokémon-Sammlung gelingt mit einem klaren Fokus: ein Lieblings-Pokémon, ein Budget, ein Binder mit neun Taschen pro Seite und ein festgelegter Mindestzustand. Halte fest, welche Karten fehlen, und lass die Sammlung langsam wachsen.",
      faq: [
        { q: "Womit fange ich eine Pokémon-Sammlung an?", a: "Mit einer einfachen Grenze, zum Beispiel einem Lieblings-Pokémon. Es gibt viele Karten aus unterschiedlichen Jahren, und die Sammlung bekommt ein Gesicht." },
        { q: "Brauche ich teure Karten?", a: "Nein. Am Anfang reichen günstige Karten, um eine Sammlung zu haben, die gut aussieht. Setze dir ein Budget und halte es ein." },
        { q: "Welchen Zustand sollen die Karten haben?", a: "Für eine Sammlung zum Anschauen ist ein guter Zustand angenehm, muss aber nicht immer Near Mint sein. Lege vorab fest, was du akzeptierst, und stelle den Mindestzustand beim Kauf ein." },
      ],
    },
    en: {
      answer: "A Pokémon collection works best with a clear focus: one favourite Pokémon, a budget, a binder with nine pockets per page and a fixed minimum condition. Keep track of which cards are missing and let the collection grow slowly.",
      faq: [
        { q: "How do I start a Pokémon collection?", a: "With a simple boundary, for example one favourite Pokémon. There are many cards from different years, and the collection gets a face." },
        { q: "Do I need expensive cards?", a: "No. At first, inexpensive cards are enough to have a collection that looks good. Set a budget and stick to it." },
        { q: "What condition should the cards have?", a: "For a collection to look at, a good condition is pleasant but does not always have to be Near Mint. Decide in advance what you accept and set the minimum condition when you buy." },
      ],
    },
  },
  "first-binder-kids": {
    published: "2026-10-21",
    de: {
      answer: "Ein erster Binder macht aus losen Karten eine Sammlung. Beginne mit einer Seite für das Lieblings-Pokémon des Kindes, lass es bei der Auswahl mitentscheiden und kaufe bei bekannten Marktplätzen mit Verkäuferbewertungen.",
      faq: [
        { q: "Was braucht ein Kind für den ersten Binder?", a: "Einen Binder mit neun Taschen pro Seite, der sich leicht aufschlagen lässt, die Karten selbst und einen Platz, an dem er nicht gequetscht oder nass wird." },
        { q: "Woran erkenne ich gefälschte Karten?", a: "Fälschungen tauchen vor allem bei auffällig günstigen Angeboten und Verkäufern ohne Bewertungen auf. Wenn sich eine Karte ungewöhnlich glatt oder dünn anfühlt oder die Farben falsch wirken, sprich den Verkäufer an." },
        { q: "Wie lernt ein Kind, sorgsam mit Karten umzugehen?", a: "Karten nur mit sauberen, trockenen Händen anfassen, nicht in die Hosentasche stecken und den Binder aufrecht und nicht übervoll lagern." },
      ],
    },
    en: {
      answer: "A first binder turns loose cards into a collection. Begin with one page for the child's favourite Pokémon, let them help choose and buy from known marketplaces with seller ratings.",
      faq: [
        { q: "What does a child need for the first binder?", a: "A binder with nine pockets per page that opens easily, the cards themselves and a spot where it will not be squashed or get wet." },
        { q: "How do I recognise fake cards?", a: "Fakes turn up mostly with strikingly cheap offers and sellers without ratings. If a card feels unusually smooth or thin or the colours look wrong, talk to the seller." },
        { q: "How does a child learn to handle cards with care?", a: "Touch cards only with clean, dry hands, do not put them in a trouser pocket and store the binder upright and not overfilled." },
      ],
    },
  },
  "cardmarket-vs-cardtrader": {
    published: "2026-10-21",
    de: {
      answer: "Cardmarket und CardTrader sind europäische Marktplätze mit vielen Einzelverkäufern. Bei Cardmarket legst du eine Wants-Liste an und lässt den Shopping Wizard Verkäufer vorschlagen. Bei CardTrader wählt der Shop Optimizer Verkäufer nach Preis, Zahl der Verkäufer oder Tempo, und mit CardTrader Zero können Karten mehrerer Verkäufer in einer Sendung ankommen.",
      faq: [
        { q: "Welcher Marktplatz ist günstiger, Cardmarket oder CardTrader?", a: "Das hängt vom Versand und von den Verkäufern ab, und beides siehst du erst bei der Bestellung. Stelle dieselbe Liste bei beiden zusammen und vergleiche die Summe einschließlich Versand." },
        { q: "Was ist CardTrader Zero?", a: "Mit CardTrader Zero können Karten mehrerer Verkäufer in einer Sendung ankommen. Nicht jedes Angebot ist dafür geeignet; das prüfst du bei CardTrader." },
        { q: "Was übergibt Your Card Binder an den Marktplatz?", a: "Für Cardmarket eine Deckliste zum Einfügen in die Wants-Liste, für CardTrader Links zu jeder Karte und den Shop Optimizer. Bestellt und bezahlt wird nur beim Marktplatz selbst." },
      ],
    },
    en: {
      answer: "Cardmarket and CardTrader are European marketplaces with many individual sellers. On Cardmarket you create a wants list and let the Shopping Wizard propose sellers. On CardTrader the Shop Optimizer picks sellers by price, number of sellers or speed, and with CardTrader Zero cards from several sellers can arrive in one parcel.",
      faq: [
        { q: "Which marketplace is cheaper, Cardmarket or CardTrader?", a: "It depends on shipping and sellers, and you only see both when you order. Put the same list together on both and compare the total including shipping." },
        { q: "What is CardTrader Zero?", a: "With CardTrader Zero, cards from several sellers can arrive in one parcel. Not every listing qualifies; you check that at CardTrader." },
        { q: "What does Your Card Binder hand over to the marketplace?", a: "For Cardmarket a deck list to paste into the wants list, for CardTrader links for every card and the Shop Optimizer. You order and pay only at the marketplace itself." },
      ],
    },
  },
  "tcgplayer-howto": {
    published: "2026-10-22",
    de: {
      answer: "Bei TCGplayer fügst du deine Kartenliste mit der Funktion Mass Entry auf einmal ein. Your Card Binder öffnet sie vorausgefüllt, du wählst bei „Item Options“ Printing und Condition und klickst auf „Add to Cart“. Die Oberfläche ist englisch, bezahlt wird bei TCGplayer.",
      faq: [
        { q: "Liefert TCGplayer nach Deutschland?", a: "Bei einem Standort in Deutschland zeigt TCGplayer nur Verkäufer an, die dorthin liefern, und verweist auf internationale Versandpartner mit gebündelter Lieferung und Sendungsverfolgung. Versandkosten siehst du vor dem Bezahlen." },
        { q: "Was ist Mass Entry?", a: "Mass Entry ist TCGplayers Funktion, mit der du eine ganze Kartenliste auf einmal einfügst. Pro Zeile stehen Anzahl, Name, Set-Code und Nummer, zum Beispiel „1 Charizard [BS] 004/102“." },
        { q: "Welchen Zustand wähle ich bei TCGplayer?", a: "TCGplayer kennt Near Mint, Lightly Played, Moderately Played, Heavily Played und Damaged. Für ein Geschenk passt meist Near Mint, optional zusammen mit Lightly Played." },
      ],
    },
    en: {
      answer: "At TCGplayer you paste your card list all at once with the Mass Entry function. Your Card Binder opens it pre-filled, you choose Printing and Condition under “Item Options” and click “Add to Cart”. The interface is in English, and you pay at TCGplayer.",
      faq: [
        { q: "Does TCGplayer ship to Germany?", a: "With a location in Germany, TCGplayer only shows sellers that ship there and points to international shipping partners with consolidated, tracked delivery. You see shipping costs before you pay." },
        { q: "What is Mass Entry?", a: "Mass Entry is TCGplayer's function for pasting a whole card list at once. Each line holds quantity, name, set code and number, for example “1 Charizard [BS] 004/102”." },
        { q: "Which condition do I choose at TCGplayer?", a: "TCGplayer has Near Mint, Lightly Played, Moderately Played, Heavily Played and Damaged. For a gift, Near Mint usually fits, optionally together with Lightly Played." },
      ],
    },
  },
};

export const GUIDE_EXTRAS: Readonly<Record<string, GuideExtras>> = { ...BASE_GUIDE_EXTRAS, ...MOTIF_GUIDE_EXTRAS };

/** The extras of a guide; every guide has them (a test enforces it). */
export function guideExtras(id: string): GuideExtras {
  const extras = GUIDE_EXTRAS[id];
  if (!extras) throw new Error(`Missing guide extras for "${id}".`);
  return extras;
}
