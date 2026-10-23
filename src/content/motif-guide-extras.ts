import type { GuideExtras } from "./guide-extras";

/**
 * Answer-first summary and questions for the motif pages. Same rule as the other guides: every fact repeats
 * what the article says, with the counts of the catalogue as of 2026-10-23.
 */
export const MOTIF_GUIDE_EXTRAS: Readonly<Record<string, GuideExtras>> = {
  "motif-illustration": {
    published: "2026-10-23",
    de: {
      answer: "Illustration Rares sind Pokémon-Karten, deren Bild die ganze Karte füllt und eine kleine Szene zeigt. Der Katalog enthält 511 davon und 232 der höheren Stufe Special Illustration Rare, alle seit 2023. Für ein Geschenk mischst du beide Stufen und wählst mindestens einen guten Zustand.",
      faq: [
        { q: "Was unterscheidet Illustration Rare und Special Illustration Rare?", a: "Beide haben ein randloses Bild, die Special Illustration Rare ist seltener und oft aufwendiger gezeichnet, etwa mit Trainerfigur." },
        { q: "Seit wann gibt es diese Karten?", a: "Alle Karten dieser Stufen im Katalog sind ab 2023 erschienen, beginnend mit den Karmesin-&-Purpur-Sets." },
        { q: "Sind sie teuer?", a: "Special Illustration Rares können einzeln sehr teuer sein, Illustration Rares sind meist deutlich günstiger. Your Card Binder zeigt Schätzungen, den Endpreis bestätigst du beim Marktplatz." },
      ],
    },
    en: {
      answer: "Illustration Rares are Pokémon cards whose picture fills the whole card and shows a small scene. The catalogue holds 511 of them and 232 of the higher Special Illustration Rare level, all from 2023 onwards. For a gift, mix both levels and choose at least a good condition.",
      faq: [
        { q: "What is the difference between Illustration Rare and Special Illustration Rare?", a: "Both have a borderless picture; the Special Illustration Rare is rarer and often more elaborately drawn, for example with a trainer figure." },
        { q: "Since when do these cards exist?", a: "All cards of these levels in the catalogue were released from 2023 onwards, starting with the Scarlet & Violet sets." },
        { q: "Are they expensive?", a: "Special Illustration Rares can be very expensive one by one, while Illustration Rares are usually much cheaper. Your Card Binder shows estimates; you confirm the final price at the marketplace." },
      ],
    },
  },
  "motif-beach": {
    published: "2026-10-23",
    de: {
      answer: "Im Katalog gibt es nur 29 Pokémon-Karten mit klarem Strandmotiv, verteilt auf 20 Pokémon. Sandygast und Palossand kommen mit acht Karten am häufigsten vor. Das reicht für zwei Binder-Seiten.",
      faq: [
        { q: "Warum gibt es so wenige Strandkarten?", a: "Viele Wasser-Pokémon werden vor einem Farbverlauf oder unter Wasser gezeigt. Ein Strandmotiv braucht Sand, Küste oder Strandgegenstände im Bild." },
        { q: "Welche Pokémon sind am Strand besonders häufig?", a: "Sandygast und Palossand mit zusammen acht Karten, danach Krabby mit drei und Schiggy mit zwei." },
        { q: "Kann ich Strand mit einem anderen Motiv mischen?", a: "Ja, zum Beispiel mit Meer & Wasser. Im Tool tauschst du einzelne Karten aus oder wählst die Pokémon selbst." },
      ],
    },
    en: {
      answer: "The catalogue holds only 29 Pokémon cards with a clear beach scene, spread over 20 Pokémon. Sandygast and Palossand appear most often, with eight cards. That is enough for two binder pages.",
      faq: [
        { q: "Why are there so few beach cards?", a: "Many Water Pokémon are shown against a colour gradient or underwater. A beach scene needs sand, coast or beach objects in the picture." },
        { q: "Which Pokémon are especially frequent on the beach?", a: "Sandygast and Palossand with eight cards together, followed by Krabby with three and Squirtle with two." },
        { q: "Can I mix beach with another theme?", a: "Yes, for example with Sea & water. In the tool you swap single cards or choose the Pokémon yourself." },
      ],
    },
  },
  "motif-night": {
    published: "2026-10-23",
    de: {
      answer: "Die Auswahl „Nacht“ enthält 58 Pokémon-Karten, deren Bild nachts spielt, mit 48 verschiedenen Pokémon. Nachtara kommt mit drei Karten am häufigsten vor. Weil dunkle Karten Abnutzung stark zeigen, lohnt sich ein guter Zustand.",
      faq: [
        { q: "Sind das nur Pokémon vom Typ Finsternis?", a: "Nein. Das Motiv richtet sich nach dem Bild, nicht nach dem Typ. Wer alle Finsternis-Pokémon möchte, wählt im Tool die Auswahl nach Typ." },
        { q: "Aus welchen Jahren stammen die Karten?", a: "Aus allen Jahrzehnten, mit dem Schwerpunkt auf den 2000er-Jahren: 4 Karten aus den 1990ern, 22 aus den 2000ern, 17 aus den 2010ern und 15 aus den 2020ern." },
        { q: "Wie bewahre ich dunkle Karten auf?", a: "In glatten Taschen im Binder, im Regal und nicht in direktem Sonnenlicht, das Farben mit der Zeit verblassen lässt." },
      ],
    },
    en: {
      answer: "The “Night” selection holds 58 Pokémon cards whose picture is set at night, with 48 different Pokémon. Umbreon appears most often, with three cards. Because dark cards show wear strongly, a good condition is worth it.",
      faq: [
        { q: "Are these only Darkness-type Pokémon?", a: "No. The theme follows the picture, not the type. If you want every Darkness Pokémon, choose the selection by type in the tool." },
        { q: "Which years do the cards come from?", a: "From all decades, with a focus on the 2000s: 4 cards from the 1990s, 22 from the 2000s, 17 from the 2010s and 15 from the 2020s." },
        { q: "How do I store dark cards?", a: "In smooth pockets in a binder, on a shelf and not in direct sunlight, which makes colours fade over time." },
      ],
    },
  },
  "motif-snow": {
    published: "2026-10-23",
    de: {
      answer: "Die Auswahl „Schnee & Eis“ hat 52 Pokémon-Karten aus den Jahren 2005 bis 2026 mit 37 verschiedenen Pokémon. Botogel führt mit vier Karten. Als Weihnachtsgeschenk solltest du bis Anfang Dezember bestellen.",
      faq: [
        { q: "Welche Sets haben die meisten Schneekarten?", a: "Mysterious Treasures mit fünf, Rebel Clash mit vier und Plasma Freeze, Forbidden Light und Lost Thunder mit je drei." },
        { q: "Sind alle Pokémon vom Typ Wasser oder Eis?", a: "Nein. Das Motiv richtet sich nach dem Bild. Es gibt Schnee-Szenen mit Pokémon verschiedener Typen." },
        { q: "Wie viel Zeit brauche ich für die Bestellung?", a: "Karten kommen von verschiedenen Verkäufern. Rechne mit ein bis zwei Wochen." },
      ],
    },
    en: {
      answer: "The “Snow & ice” selection has 52 Pokémon cards from 2005 to 2026 with 37 different Pokémon. Delibird leads with four cards. For a Christmas gift, order by early December.",
      faq: [
        { q: "Which sets have the most snow cards?", a: "Mysterious Treasures with five, Rebel Clash with four, and Plasma Freeze, Forbidden Light and Lost Thunder with three each." },
        { q: "Are all of them Water or Ice Pokémon?", a: "No. The theme follows the picture. There are snow scenes with Pokémon of different types." },
        { q: "How much time do I need for the order?", a: "Cards come from different sellers. Allow one to two weeks." },
      ],
    },
  },
  "motif-friends": {
    published: "2026-10-23",
    de: {
      answer: "Die Auswahl „Pokémon-Freunde“ enthält 82 Karten, auf denen mehrere Pokémon gemeinsam im Mittelpunkt stehen. 32 davon stammen aus den TAG-TEAM-Sets Cosmic Eclipse und Unified Minds. Sie eignet sich für Geschenke an zwei Menschen, die zusammengehören.",
      faq: [
        { q: "Was ist eine TAG-TEAM-Karte?", a: "Eine Karte von 2019, auf der zwei Pokémon gemeinsam stehen und das Paar einen gemeinsamen Namen trägt, etwa Blastoise & Piplup." },
        { q: "Gibt es auch Gruppen statt Paare?", a: "Ja, zum Beispiel Exeggcute mit vier und Maushold mit drei Karten in der Auswahl." },
        { q: "Kann ich die TAG-TEAM-Optik vermeiden?", a: "Ja, im Tool lassen sich einzelne Karten tauschen, bevor du bestellst." },
      ],
    },
    en: {
      answer: "The “Pokémon friends” selection holds 82 cards where several Pokémon are the centre of the picture together. 32 of them come from the TAG TEAM sets Cosmic Eclipse and Unified Minds. It suits gifts for two people who belong together.",
      faq: [
        { q: "What is a TAG TEAM card?", a: "A card from 2019 where two Pokémon stand together and the pair has a shared name, such as Blastoise & Piplup." },
        { q: "Are there groups as well as pairs?", a: "Yes, for example Exeggcute with four and Maushold with three cards in the selection." },
        { q: "Can I avoid the TAG TEAM look?", a: "Yes, in the tool you can swap single cards before you order." },
      ],
    },
  },
  "motif-sleeping": {
    published: "2026-10-23",
    de: {
      answer: "Die Auswahl „Schlafende Pokémon“ besteht aus 48 Karten mit 28 verschiedenen Pokémon. 13 davon zeigen Relaxo, sechs Somnivora. Die Karten stammen fast alle aus der Zeit nach 2010.",
      faq: [
        { q: "Warum so viele Relaxo-Karten?", a: "Relaxo ist im Spiel für seinen Dauerschlaf bekannt und wurde über viele Jahre immer wieder schlafend gezeichnet, von 1999 bis 2026." },
        { q: "Gibt es auch Auswahl jenseits von Relaxo?", a: "Ja, 28 verschiedene Pokémon, etwa Somnivora, Bummelz, Koalelu und Brimova." },
        { q: "Für wen eignet sich der Binder?", a: "Für Menschen, die ruhige Hobbys mögen. Wer nur Relaxo möchte, gibt den Namen direkt im Tool ein." },
      ],
    },
    en: {
      answer: "The “Sleeping Pokémon” selection consists of 48 cards with 28 different Pokémon. 13 of them show Snorlax and six Musharna. Almost all of the cards date from after 2010.",
      faq: [
        { q: "Why so many Snorlax cards?", a: "Snorlax is known in the games for constant sleeping and has been drawn asleep again and again, from 1999 to 2026." },
        { q: "Is there a choice beyond Snorlax?", a: "Yes, 28 different Pokémon, such as Musharna, Slakoth, Komala and Hatenna." },
        { q: "Who does the binder suit?", a: "People who like quiet hobbies. If you only want Snorlax, enter the name directly in the tool." },
      ],
    },
  },
  "motif-shiny": {
    published: "2026-10-23",
    de: {
      answer: "Shiny-Karten zeigen Pokémon in ihrer seltenen Sonderfarbe. Im Katalog tragen nur drei Sets diese Stufen: Hidden Fates Shiny Vault (2019), Shining Fates Shiny Vault (2021) und Paldean Fates (2024). Die Auswahl umfasst 150 Karten.",
      faq: [
        { q: "Was ist ein Shiny?", a: "Ein Pokémon in einer anderen, seltenen Farbe als gewöhnlich, zum Beispiel ein schwarzes statt ein orangenes Glurak." },
        { q: "Wie viele Shiny-Karten gibt es im Katalog?", a: "310 der Stufe Shiny rare, dazu 9 Shiny V, 7 Shiny VMAX und 12 Shiny Ultra Rare." },
        { q: "Worauf achte ich beim Bestellen?", a: "Prüfe Set und Kartennummer. Die Nummern der Shiny Vaults liegen außerhalb der Hauptnummerierung." },
      ],
    },
    en: {
      answer: "Shiny cards show Pokémon in their rare alternate colour. In the catalogue only three sets carry these levels: Hidden Fates Shiny Vault (2019), Shining Fates Shiny Vault (2021) and Paldean Fates (2024). The selection holds 150 cards.",
      faq: [
        { q: "What is a shiny?", a: "A Pokémon in a different, rare colour from the usual one, for example a black instead of an orange Charizard." },
        { q: "How many shiny cards are in the catalogue?", a: "310 of the level Shiny rare, plus 9 Shiny V, 7 Shiny VMAX and 12 Shiny Ultra Rare." },
        { q: "What should I check when ordering?", a: "Check set and card number. The numbers of the Shiny Vaults lie outside the main numbering." },
      ],
    },
  },
  "motif-mega": {
    published: "2026-10-23",
    de: {
      answer: "Seit der Serie Mega Evolution im September 2025 gibt es wieder Mega-Karten. Die Auswahl umfasst 83 Karten mit 43 Pokémon, die meisten aus Ascended Heroes (22) und Mega Evolution (20). Die älteren M-EX-Karten gehören nicht dazu.",
      faq: [
        { q: "Was ist Mega Hyper Rare?", a: "Eine Seltenheitsstufe der neuen Mega-Karten. Der Katalog führt acht davon, verteilt auf alle sechs Sets." },
        { q: "Gibt es noch die alten Mega-Karten?", a: "Ja, als „M … EX“ aus der XY-Zeit, 89 im Katalog. Sie gehören nicht zur Auswahl; wer sie sucht, wählt die Pokémon einzeln." },
        { q: "Was ist Mega Attack Rare?", a: "Eine Stufe, die es nur in Ascended Heroes gibt, mit sieben Karten." },
      ],
    },
    en: {
      answer: "Since the Mega Evolution series in September 2025, Mega cards are back. The selection holds 83 cards with 43 Pokémon, most from Ascended Heroes (22) and Mega Evolution (20). The older M-EX cards are not part of it.",
      faq: [
        { q: "What is Mega Hyper Rare?", a: "A rarity level of the new Mega cards. The catalogue lists eight, spread over all six sets." },
        { q: "Do the old Mega cards still exist?", a: "Yes, as “M … EX” from the XY era, 89 in the catalogue. They are not part of the selection; to find them, choose the Pokémon one by one." },
        { q: "What is Mega Attack Rare?", a: "A level that exists only in Ascended Heroes, with seven cards." },
      ],
    },
  },
  "motif-classics": {
    published: "2026-10-23",
    de: {
      answer: "Die Auswahl „Klassische Holos“ enthält 150 Pokémon-Karten aus den frühen Sets von 1999 bis 2002, die nur als Holo gedruckt wurden, mit 111 verschiedenen Pokémon. Bei so alten Karten zählen Zustand, Ausgabe und Sprache besonders.",
      faq: [
        { q: "Aus welchen Sets stammen die Karten?", a: "Vor allem aus Neo Genesis (18), Base Set 2 (17), Base Set, Jungle und Neo Discovery (je 16)." },
        { q: "Sind Trainer- und Energiekarten dabei?", a: "Nein. Trainer- und Energiekarten sind ausgeschlossen, die Auswahl enthält nur Pokémon-Karten." },
        { q: "Was kostet so ein Binder?", a: "Das hängt stark von den Karten ab. Einzelne Karten wie Glurak aus dem Base Set können sehr teuer sein; lege vorher ein Budget fest." },
      ],
    },
    en: {
      answer: "The “Classic holos” selection holds 150 Pokémon cards from the early sets of 1999 to 2002 that were printed only as holo, with 111 different Pokémon. With cards this old, condition, edition and language matter most.",
      faq: [
        { q: "Which sets do the cards come from?", a: "Mostly Neo Genesis (18), Base Set 2 (17), Base Set, Jungle and Neo Discovery (16 each)." },
        { q: "Are Trainer and Energy cards included?", a: "No. Trainer and Energy cards are excluded; the selection holds only Pokémon cards." },
        { q: "What does such a binder cost?", a: "That depends heavily on the cards. Single cards such as Charizard from Base Set can be very expensive; set a budget beforehand." },
      ],
    },
  },
  "motif-fire-type": {
    published: "2026-10-23",
    de: {
      answer: "Die Auswahl „Feuer-Pokémon“ enthält 119 Karten von Pokémon des Typs Feuer, die seltensten zuerst, mit 70 verschiedenen Pokémon. Sie unterscheidet sich vom Bildmotiv „Feuer & Lava“, das nach dem Bildinhalt auswählt und 45 Karten hat.",
      faq: [
        { q: "Was ist der Unterschied zu „Feuer & Lava“?", a: "Feuer-Pokémon wählt nach dem Typ auf der Karte, Feuer & Lava nach dem, was im Bild zu sehen ist: Flammen, Vulkane, Glut." },
        { q: "Wie viele Karten pro Pokémon?", a: "Höchstens drei, damit eine Seite abwechslungsreich bleibt." },
        { q: "Aus welchen Jahren stammen die Karten?", a: "Von 2011 bis 2026, die meisten aus White Flare (10), Destined Rivals und Paldea Evolved (je 7)." },
      ],
    },
    en: {
      answer: "The “Fire Pokémon” selection holds 119 cards of Fire-type Pokémon, the rarest first, with 70 different Pokémon. It differs from the picture theme “Fire & lava”, which selects by what the picture shows and has 45 cards.",
      faq: [
        { q: "What is the difference from “Fire & lava”?", a: "Fire Pokémon selects by the type on the card, Fire & lava by what is visible in the picture: flames, volcanoes, embers." },
        { q: "How many cards per Pokémon?", a: "At most three, so that a page stays varied." },
        { q: "Which years do the cards come from?", a: "From 2011 to 2026, most from White Flare (10), Destined Rivals and Paldea Evolved (7 each)." },
      ],
    },
  },
};
