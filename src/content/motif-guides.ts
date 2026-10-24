import type { Guide } from "./guides";

/**
 * Pages about the picture themes and special card groups of the gift builder. Every page is written for its own
 * subject: its own question, its own sections and its own facts (counts and years come from the catalogue data,
 * checked on 2026-10-23). `live: false` keeps a page out of the routes, sitemap, hub and llms.txt until it is
 * released in a later wave; a test checks that no two pages share a pattern or large passages of text.
 */
export const MOTIF_GUIDES: readonly Guide[] = [
  {
    id: "motif-illustration",
    updated: "2026-10-23",
    photoIds: ["me02-125", "me02.5-272", "sv01-247"],
    related: ["motif-shiny", "condition", "gift"],
    themeId: "illustration",
    de: {
      slug: "pokemon-illustration-rare-karten",
      title: "Illustration Rare: Pokémon-Karten, die wie kleine Gemälde aussehen",
      metaTitle: "Illustration Rare und Special Illustration Rare erklärt",
      description: "Was eine Illustration Rare ist, woran du sie erkennst, aus welchen Sets sie stammen und worauf du beim Verschenken achtest. Mit Zahlen aus dem Kartenkatalog.",
      intro: "Bei einer Illustration Rare sitzt das Bild nicht in einem Rahmen, sondern füllt die ganze Karte und erzählt eine kleine Szene: ein Pokémon beim Fischen, in einer Küche, in einer Stadt bei Regen. Solche Karten sind der Grund, warum viele Erwachsene wieder mit dem Sammeln anfangen. Hier steht, was die beiden Stufen unterscheidet, wie viele es gibt und was du als Schenkender wissen solltest.",
      sections: [
        {
          heading: "Woran du eine Illustration Rare erkennst",
          blocks: [
            { type: "ul", items: [
              "Das Artwork reicht bis an die Kartenränder. Name, Lebenspunkte und Angriffe liegen über dem Bild, statt in einer Textbox darunter zu stehen.",
              "Das Pokémon ist Teil einer Umgebung und nicht vor einem Effekt-Hintergrund freigestellt.",
              "Der Katalog führt zwei Stufen: „Illustration rare“ und die höhere „Special illustration rare“.",
            ] },
            { type: "p", text: "Der Unterschied zwischen den Stufen liegt vor allem in der Seltenheit und im Aufwand der Zeichnung. Special Illustration Rares zeigen oft ein Pokémon mit Trainerfigur oder eine besonders ausgearbeitete Szene und sind deutlich seltener in einer Packung zu finden." },
          ],
        },
        {
          heading: "Die Zahlen aus dem Katalog",
          blocks: [
            { type: "table", caption: "Illustration-Karten im Kartenkatalog (ohne TCG-Pocket-Karten, Stand 23.10.2026)", head: ["Stufe", "Karten", "Aus welchen Serien"], rows: [
              ["Illustration rare", "511", "Karmesin & Purpur, Mega Evolution und 30th Celebration"],
              ["Special illustration rare", "232", "dieselben Serien, meist 5 bis 15 pro Set"],
            ] },
            { type: "p", text: "Alle diese Karten sind ab 2023 erschienen, die Art gibt es also erst seit wenigen Jahren. In der Auswahl, die Your Card Binder für das Motiv bereithält (150 Karten, die seltensten zuerst), stammen die meisten aus Prismatic Evolutions (23), Ascended Heroes (16) und 30th Celebration (10)." },
          ],
        },
        {
          heading: "Warum sie sich als Geschenk eignen",
          blocks: [
            { type: "ul", items: [
              "Sie wirken auf einer Binder-Seite wie ein Bilderrahmen: Auch wer keine Regeln kennt, sieht sofort, dass jede Karte ein eigenes Bild hat.",
              "Die Szenen sind freundlich und erzählen etwas. Das macht sie auch für Kinder zugänglich.",
              "Neun Illustration Rares ergeben eine Seite ohne Wiederholung, weil jede Karte ein anderes Pokémon und eine andere Szene zeigt.",
            ] },
          ],
        },
        {
          heading: "Was du vor dem Kauf prüfst",
          blocks: [
            { type: "p", text: "Special Illustration Rares können einzeln sehr teuer sein, Illustration Rares sind meist deutlich günstiger. Eine ausgewogene Seite mischt beide Stufen und setzt die teuren Karten bewusst." },
            { type: "p", text: "Randlose Karten zeigen Abnutzung an Ecken und Kanten besonders schnell. Für diese Karten lohnt sich mindestens der Zustand „Sehr gut“ oder „Wie neu“, mehr dazu im Ratgeber zum Kartenzustand." },
            { type: "p", text: "In Your Card Binder wählst du das Motiv „Illustrations-Karten“, siehst die Karten als Seite mit geschätztem Preis und kannst einzelne Karten tauschen. Anders als Bildmotive wie Strand oder Nacht richtet sich diese Auswahl nach der Seltenheit der Karte, nicht nach dem Bildinhalt." },
          ],
        },
      ],
    },
    en: {
      slug: "pokemon-illustration-rare-cards",
      title: "Illustration Rare: Pokémon cards that look like small paintings",
      metaTitle: "Illustration Rare and Special Illustration Rare",
      description: "What an Illustration Rare is, how to recognise one, which sets they come from and what to check before you give one as a gift. With numbers from the card catalogue.",
      intro: "On an Illustration Rare the picture does not sit inside a frame. It fills the whole card and tells a small story: a Pokémon fishing, in a kitchen, in a city in the rain. These cards are why many adults start collecting again. This page explains how the two levels differ, how many exist and what a gift giver should know.",
      sections: [
        {
          heading: "How to recognise an Illustration Rare",
          blocks: [
            { type: "ul", items: [
              "The artwork runs to the card edges. Name, hit points and attacks sit over the picture instead of in a text box below it.",
              "The Pokémon is part of a setting and is not cut out against an effect background.",
              "The catalogue lists two levels: “Illustration rare” and the higher “Special illustration rare”.",
            ] },
            { type: "p", text: "The two levels differ mostly in rarity and in how elaborate the drawing is. Special Illustration Rares often show a Pokémon with a trainer figure or an especially detailed scene, and they are much harder to find in a pack." },
          ],
        },
        {
          heading: "The numbers from the catalogue",
          blocks: [
            { type: "table", caption: "Illustration cards in the card catalogue (without TCG Pocket cards, as of 23 Oct 2026)", head: ["Level", "Cards", "From which series"], rows: [
              ["Illustration rare", "511", "Scarlet & Violet, Mega Evolution and 30th Celebration"],
              ["Special illustration rare", "232", "the same series, mostly 5 to 15 per set"],
            ] },
            { type: "p", text: "All of these cards were released from 2023 onwards, so the style is only a few years old. In the selection Your Card Binder offers for this theme (150 cards, the rarest first), most come from Prismatic Evolutions (23), Ascended Heroes (16) and 30th Celebration (10)." },
          ],
        },
        {
          heading: "Why they work as a gift",
          blocks: [
            { type: "ul", items: [
              "On a binder page they look like picture frames: even someone who knows no rules sees that every card has its own image.",
              "The scenes are friendly and tell something, which makes them easy for children too.",
              "Nine Illustration Rares make a page without repetition, because each card shows a different Pokémon and scene.",
            ] },
          ],
        },
        {
          heading: "What to check before you buy",
          blocks: [
            { type: "p", text: "Special Illustration Rares can be very expensive one by one, while Illustration Rares are usually much cheaper. A balanced page mixes both levels and places the expensive cards deliberately." },
            { type: "p", text: "Borderless cards show wear on corners and edges quickly. For these cards at least “Very good” or “Near mint” condition is worth it; the condition guide has more." },
            { type: "p", text: "In Your Card Binder you choose the theme “Illustration cards”, see the cards as a page with an estimated price and can swap single cards. Unlike picture themes such as beach or night, this selection follows the rarity of the card, not what the picture shows." },
          ],
        },
      ],
    },
  },
  {
    id: "motif-beach",
    updated: "2026-10-23",
    photoIds: ["30th-043", "sm11-52", "sv08-090"],
    related: ["motif-sleeping", "gift", "binder-size"],
    themeId: "beach",
    live: false,
    de: {
      slug: "pokemon-karten-am-strand",
      title: "Pokémon am Strand: Karten mit Sand, Wellen und Sonne",
      metaTitle: "Pokémon-Karten mit Strandmotiv: Auswahl und Idee",
      description: "Welche Pokémon-Karten wirklich am Strand spielen, welche Pokémon dort immer wieder auftauchen und warum die Auswahl klein ist. Mit Zahlen aus dem Kartenkatalog.",
      intro: "Strandkarten sind selten. Von Tausenden Karten zeigen nur wenige ein Pokémon, das erkennbar im Sand liegt, am Wasser spielt oder in einer Küstenszene sitzt. Wir haben die Kandidaten einzeln angesehen und nur die behalten, bei denen der Strand das Bild bestimmt und nicht nur ein blauer Hintergrund ist.",
      sections: [
        {
          heading: "Wie klein die Auswahl wirklich ist",
          blocks: [
            { type: "p", text: "Im Katalog bleiben 29 Karten mit klarem Strandmotiv übrig, verteilt auf 20 verschiedene Pokémon. Das reicht für zwei Binder-Seiten, aber nicht für vier. Andere Motive wie Meer oder Nacht haben mehr als doppelt so viele Karten, deshalb schlägt Your Card Binder für den Strand höchstens 18 vor." },
            { type: "p", text: "Der Grund ist einfach: Viele Wasser-Pokémon werden vor einem Farbverlauf oder in der Tiefe gezeigt. Ein Strand verlangt Sand, Küstenlinie oder Strandgegenstände im Bild." },
          ],
        },
        {
          heading: "Die Pokémon, die immer wiederkehren",
          blocks: [
            { type: "ul", items: [
              "Sandygast und Palossand: zusammen acht Karten, mehr als jedes andere Pokémon. Sandygast sieht aus wie eine Sandburg und gehört fast zwangsläufig an den Strand.",
              "Krabby: drei Karten, die älteste davon aus dem Set Fossil von 1999.",
              "Schiggy: zwei Karten, unter anderem aus Plasma Storm (2013).",
              "Einzelne Karten mit Pikachu (30th Celebration, 2026), Pyukumuku, Shuckle, Hypno, Piplup und Dwebble.",
            ] },
            { type: "p", text: "Wer ein Geschenk für jemanden sucht, der Sandygast mag, bekommt damit eine eigene Seite, ohne dass sich Bilder wiederholen." },
          ],
        },
        {
          heading: "Aus welcher Zeit die Karten stammen",
          blocks: [
            { type: "table", caption: "Strandkarten nach Jahrzehnt (Stand 23.10.2026)", head: ["Jahrzehnt", "Karten"], rows: [
              ["1990er", "1"], ["2000er", "1"], ["2010er", "17"], ["2020er", "10"],
            ] },
            { type: "p", text: "Knapp 60 Prozent stammen aus den 2010er-Jahren. Kein Set liefert mehr als vier Karten; Sonne & Mond führt mit vier, dahinter folgen Cosmic Eclipse, Fusion Strike, Primal Clash und 151 mit je zwei. Die Serie Sonne & Mond spielt auf einer tropischen Inselgruppe, das passt zum Schwerpunkt." },
          ],
        },
        {
          heading: "Passende Anlässe",
          blocks: [
            { type: "p", text: "Ein Strand-Binder passt zu Sommergeburtstagen, zum Urlaubsbeginn oder als Erinnerung an eine Reise. Weil jede Karte ein sommerliches Bild hat, wirkt die Seite auch ohne Vorwissen über Pokémon freundlich." },
            { type: "p", text: "Ist die Auswahl dir zu klein, mische sie mit dem Motiv „Meer & Wasser“ oder wähle die Pokémon selbst. Im Tool öffnest du das Motiv „Am Strand“, siehst die Karten als Seite und tauschst einzelne aus." },
          ],
        },
      ],
    },
    en: {
      slug: "pokemon-cards-on-the-beach",
      title: "Pokémon on the beach: cards with sand, waves and sun",
      metaTitle: "Pokémon cards with a beach scene: selection",
      description: "Which Pokémon cards really are set on the beach, which Pokémon keep coming back there and why the selection is small. With numbers from the card catalogue.",
      intro: "Beach cards are rare. Out of thousands of cards, only a few show a Pokémon that is clearly lying in the sand, playing at the water or sitting in a coastal scene. We looked at the candidates one by one and kept only those where the beach shapes the picture and is not just a blue background.",
      sections: [
        {
          heading: "How small the selection really is",
          blocks: [
            { type: "p", text: "The catalogue leaves 29 cards with a clear beach scene, spread over 20 different Pokémon. That is enough for two binder pages, not for four. Other themes such as sea or night have more than twice as many, so Your Card Binder suggests at most 18 for the beach." },
            { type: "p", text: "The reason is simple: many Water Pokémon are shown against a colour gradient or in the deep. A beach needs sand, a shoreline or beach objects in the picture." },
          ],
        },
        {
          heading: "The Pokémon that keep returning",
          blocks: [
            { type: "ul", items: [
              "Sandygast and Palossand: eight cards together, more than any other Pokémon. Sandygast looks like a sandcastle and belongs on a beach almost by definition.",
              "Krabby: three cards, the oldest from the Fossil set of 1999.",
              "Squirtle: two cards, among them one from Plasma Storm (2013).",
              "Single cards with Pikachu (30th Celebration, 2026), Pyukumuku, Shuckle, Hypno, Piplup and Dwebble.",
            ] },
            { type: "p", text: "If you are buying for someone who likes Sandygast, this gives them a page of their own without repeated pictures." },
          ],
        },
        {
          heading: "Which era the cards come from",
          blocks: [
            { type: "table", caption: "Beach cards by decade (as of 23 Oct 2026)", head: ["Decade", "Cards"], rows: [
              ["1990s", "1"], ["2000s", "1"], ["2010s", "17"], ["2020s", "10"],
            ] },
            { type: "p", text: "Just under 60 percent date from the 2010s. No set contributes more than four cards; Sun & Moon leads with four, followed by Cosmic Eclipse, Fusion Strike, Primal Clash and 151 with two each. The Sun & Moon series is set on a tropical island chain, which fits the focus." },
          ],
        },
        {
          heading: "Fitting occasions",
          blocks: [
            { type: "p", text: "A beach binder suits summer birthdays, the start of a holiday or as a memento of a trip. Since every card has a summery picture, the page looks friendly even if the recipient knows nothing about Pokémon." },
            { type: "p", text: "If the selection feels too small, mix it with the “Sea & water” theme or choose the Pokémon yourself. In the tool you open the theme “On the beach”, see the cards as a page and swap single ones." },
          ],
        },
      ],
    },
  },
  {
    id: "motif-night",
    updated: "2026-10-23",
    photoIds: ["30th-154", "gym2-29", "sm12-83"],
    related: ["motif-sleeping", "condition", "gift"],
    themeId: "night",
    de: {
      slug: "pokemon-karten-nacht-motiv",
      title: "Pokémon bei Nacht: Karten mit Mond, Sternen und dunklen Szenen",
      metaTitle: "Pokémon-Karten mit Nachtmotiv: Auswahl und Pflege",
      description: "58 Pokémon-Karten, deren Bild nachts spielt: welche Pokémon dazugehören, aus welchen Jahren sie stammen und wie du dunkle Karten beim Verschenken schützt.",
      intro: "Nachtkarten sind die ruhigste Seite im Binder: dunkle Himmel, Mondlicht, Laternen, leuchtende Augen. Sie sehen nebeneinander besonders geschlossen aus, weil die Farben ähnlich sind. Dieser Text zeigt, was in der Auswahl steckt und worauf du bei so dunklen Karten achtest.",
      sections: [
        {
          heading: "Nacht im Bild ist nicht Finsternis-Typ",
          blocks: [
            { type: "p", text: "Das Motiv „Nacht“ richtet sich nach dem, was auf der Karte zu sehen ist: Dunkelheit, Mond, Sterne, Lichter in der Nacht. Der Typ eines Pokémon spielt keine Rolle. Deshalb stehen hier neben düsteren Pokémon wie Gengar auch freundliche wie Clefairy." },
            { type: "p", text: "Wer stattdessen alle Pokémon vom Typ Finsternis sammeln möchte, wählt im Tool die Karten nach Typ. Das ergibt eine andere Seite, mit anderen Bildern." },
          ],
        },
        {
          heading: "Karten nach Jahrzehnt",
          blocks: [
            { type: "table", caption: "Nachtkarten nach Jahrzehnt (58 Karten, Stand 23.10.2026)", head: ["Jahrzehnt", "Karten"], rows: [
              ["1990er", "4"], ["2000er", "22"], ["2010er", "17"], ["2020er", "15"],
            ] },
            { type: "p", text: "Auffällig sind die 2000er: Mit 22 Karten stellen sie fast 40 Prozent der Auswahl. Die älteste Karte ist Tragosso aus Jungle (1999), die neueste Mega Darkrai ex aus Pitch Black (2026). Wer eine Seite mit klassischem Look möchte, findet im Jahrzehnt dazwischen die meisten Karten." },
          ],
        },
        {
          heading: "Wiederkehrende Pokémon",
          blocks: [
            { type: "ul", items: [
              "Nachtara: drei Karten, mehr als jedes andere Pokémon. Seine leuchtenden Ringe machen es zum Inbegriff des Nacht-Pokémon.",
              "Gengar, Tragosso, Kramurx, Clefairy und Duskull: je zwei Karten.",
              "Insgesamt 48 verschiedene Pokémon auf 58 Karten, es gibt also kaum Wiederholungen.",
            ] },
          ],
        },
        {
          heading: "Dunkle Karten richtig schützen",
          blocks: [
            { type: "p", text: "Auf dunklen Karten fallen weiße Abnutzungsstellen an Ecken und Kanten sofort auf. Wähle deshalb beim Kauf einen guten Zustand und lege die Karten in Taschen mit glatter Oberfläche." },
            { type: "p", text: "Auch das Licht spielt eine Rolle: Direktes Sonnenlicht lässt Farben mit der Zeit verblassen. Ein Binder gehört ins Regal, nicht auf die Fensterbank. Zum Zustand gibt es einen eigenen Ratgeber." },
          ],
        },
      ],
    },
    en: {
      slug: "pokemon-cards-night-theme",
      title: "Pokémon at night: cards with moon, stars and dark scenes",
      metaTitle: "Pokémon cards with a night scene: selection and care",
      description: "58 Pokémon cards whose picture is set at night: which Pokémon belong, which years they come from and how to protect dark cards when you give them as a gift.",
      intro: "Night cards are the calmest page in a binder: dark skies, moonlight, lanterns, glowing eyes. Side by side they look especially unified because the colours are close. This page shows what is in the selection and what to watch for with such dark cards.",
      sections: [
        {
          heading: "Night in the picture is not the Darkness type",
          blocks: [
            { type: "p", text: "The “Night” theme follows what is visible on the card: darkness, moon, stars, lights in the night. The type of the Pokémon does not matter. That is why friendly Pokémon such as Clefairy sit next to gloomy ones such as Gengar." },
            { type: "p", text: "If you would rather collect every Pokémon of the Darkness type, choose cards by type in the tool. That gives a different page with different pictures." },
          ],
        },
        {
          heading: "Cards by decade",
          blocks: [
            { type: "table", caption: "Night cards by decade (58 cards, as of 23 Oct 2026)", head: ["Decade", "Cards"], rows: [
              ["1990s", "4"], ["2000s", "22"], ["2010s", "17"], ["2020s", "15"],
            ] },
            { type: "p", text: "The 2000s stand out: with 22 cards they make up almost 40 percent of the selection. The oldest card is Cubone from Jungle (1999), the newest Mega Darkrai ex from Pitch Black (2026). For a page with a classic look, most cards sit in the decade in between." },
          ],
        },
        {
          heading: "Pokémon that come back",
          blocks: [
            { type: "ul", items: [
              "Umbreon: three cards, more than any other Pokémon. Its glowing rings make it the classic night Pokémon.",
              "Gengar, Cubone, Murkrow, Clefairy and Duskull: two cards each.",
              "In total 48 different Pokémon on 58 cards, so there is hardly any repetition.",
            ] },
          ],
        },
        {
          heading: "Protecting dark cards",
          blocks: [
            { type: "p", text: "On dark cards, white wear on corners and edges shows immediately. So choose a good condition when buying and use sleeves or pockets with a smooth surface." },
            { type: "p", text: "Light matters too: direct sunlight makes colours fade over time. A binder belongs on a shelf, not on a windowsill. There is a separate guide on condition." },
          ],
        },
      ],
    },
  },
  {
    id: "motif-snow",
    updated: "2026-10-23",
    photoIds: ["30th-132", "dp3-87", "sm8-61"],
    related: ["christmas-gift", "gift", "binder-size"],
    themeId: "snow",
    de: {
      slug: "pokemon-karten-schnee-eis",
      title: "Pokémon im Schnee: Winterkarten für den Binder",
      metaTitle: "Pokémon-Karten mit Schnee- und Eismotiv",
      description: "52 Pokémon-Karten mit Schnee, Eis und Winterlandschaft: die Sets mit den meisten Karten, die häufigsten Pokémon und wann sich der Binder als Geschenk lohnt.",
      intro: "Schnee ist ein dankbares Bildmotiv: weiße Flächen, kalte Farben, oft ein kleines Pokémon mitten in einer großen Landschaft. In der Auswahl von Your Card Binder stecken 52 Karten, und sie verteilen sich auf mehr Sets, als man erwartet. Hier die Übersicht.",
      sections: [
        {
          heading: "Die Sets mit den meisten Schneekarten",
          blocks: [
            { type: "table", caption: "Schneekarten nach Set (Stand 23.10.2026, nur die fünf größten)", head: ["Set", "Karten", "Erschienen"], rows: [
              ["Mysterious Treasures", "5", "2007"],
              ["Rebel Clash", "4", "2020"],
              ["Plasma Freeze", "3", "2013"],
              ["Forbidden Light", "3", "2018"],
              ["Lost Thunder", "3", "2018"],
            ] },
            { type: "p", text: "Die Karten reichen von 2005 bis 2026. Das jüngste Beispiel ist Arktos aus 30th Celebration. Weil die Karten über viele Sets verstreut sind, sieht eine Seite nie nach nur einer Serie aus." },
          ],
        },
        {
          heading: "Die Pokémon der Auswahl",
          blocks: [
            { type: "table", caption: "Pokémon mit mindestens drei Schneekarten", head: ["Pokémon", "Karten"], rows: [
              ["Botogel", "4"], ["Shnebedeck", "3"], ["Rexblisar", "3"], ["Flampivian", "3"],
            ] },
            { type: "p", text: "Botogel führt mit vier Karten. Dahinter stehen Shnebedeck und Rexblisar, die im Spiel in verschneiten Gebieten leben, und Flampivian, das mit drei Karten ebenfalls häufig ist. Insgesamt sind es 37 verschiedene Pokémon auf 52 Karten." },
          ],
        },
        {
          heading: "Wann sich der Binder als Geschenk anbietet",
          blocks: [
            { type: "p", text: "Der naheliegende Termin ist Weihnachten, aber auch Winter-Geburtstage und der Nikolaustag passen. Karten kommen von verschiedenen Verkäufern, rechne deshalb mit ein bis zwei Wochen und bestelle bis Anfang Dezember." },
            { type: "p", text: "Wer die Karten lieber stückweise verschenken möchte, legt neun Karten in den Binder und lässt die übrigen Taschen leer. Dann kann die Person später selbst weitersammeln, zum Beispiel mit weiteren Wintermotiven." },
          ],
        },
      ],
    },
    en: {
      slug: "pokemon-cards-snow-ice",
      title: "Pokémon in the snow: winter cards for your binder",
      metaTitle: "Pokémon cards with a snow and ice scene as a winter gift",
      description: "52 Pokémon cards with snow, ice and winter landscapes: the sets with the most cards, the most frequent Pokémon and when the binder makes a good gift.",
      intro: "Snow is a rewarding picture theme: white space, cold colours, often a small Pokémon in the middle of a large landscape. The selection in Your Card Binder holds 52 cards, spread over more sets than you would expect. Here is the overview.",
      sections: [
        {
          heading: "The sets with the most snow cards",
          blocks: [
            { type: "table", caption: "Snow cards by set (as of 23 Oct 2026, the five largest only)", head: ["Set", "Cards", "Released"], rows: [
              ["Mysterious Treasures", "5", "2007"],
              ["Rebel Clash", "4", "2020"],
              ["Plasma Freeze", "3", "2013"],
              ["Forbidden Light", "3", "2018"],
              ["Lost Thunder", "3", "2018"],
            ] },
            { type: "p", text: "The cards range from 2005 to 2026. The newest example is Articuno from 30th Celebration. Because the cards are scattered across many sets, a page never looks like it came from a single series." },
          ],
        },
        {
          heading: "The Pokémon in the selection",
          blocks: [
            { type: "table", caption: "Pokémon with at least three snow cards", head: ["Pokémon", "Cards"], rows: [
              ["Delibird", "4"], ["Snover", "3"], ["Abomasnow", "3"], ["Darmanitan", "3"],
            ] },
            { type: "p", text: "Delibird leads with four cards. Behind it come Snover and Abomasnow, which live in snowy areas in the games, and Darmanitan, which also has three. There are 37 different Pokémon on 52 cards." },
          ],
        },
        {
          heading: "When the binder makes a good gift",
          blocks: [
            { type: "p", text: "The obvious date is Christmas, but winter birthdays and St Nicholas Day fit as well. Cards come from different sellers, so allow one to two weeks and order by early December." },
            { type: "p", text: "If you would rather give the cards bit by bit, put nine cards in the binder and leave the other pockets empty. The person can keep collecting later, for example with more winter pictures." },
          ],
        },
      ],
    },
  },
  {
    id: "motif-friends",
    updated: "2026-10-23",
    photoIds: ["30th-044", "neo1-3", "sm12-157"],
    related: ["personalized-gift", "gift", "birthday-gift"],
    themeId: "friends",
    live: false,
    de: {
      slug: "pokemon-karten-freunde",
      title: "Pokémon-Freunde: Karten, auf denen sie zu zweit oder in Gruppen auftreten",
      metaTitle: "Pokémon-Karten mit Freunden und Duos: TAG TEAM und mehr",
      description: "82 Karten, auf denen mehrere Pokémon zusammen zu sehen sind: wie TAG TEAM-Karten funktionieren, welche Duos es gibt und für wen sich ein Freunde-Binder eignet.",
      intro: "Die meisten Karten zeigen ein Pokémon allein. Hier geht es um die Ausnahmen: Karten, auf denen sich zwei oder mehr Pokémon ein Bild teilen. Daraus lässt sich ein Binder für zwei Menschen bauen, die zusammengehören.",
      sections: [
        {
          heading: "Was als Freunde-Karte zählt",
          blocks: [
            { type: "p", text: "Aufgenommen wurden Karten, auf denen mehrere Pokémon gemeinsam im Mittelpunkt stehen: zwei in einer Szene, eine Gruppe oder ein Pokémon mit seiner Familie. Ein einzelnes Pokémon, das nur andere im Hintergrund hat, gehört nicht dazu. Die Auswahl umfasst 82 Karten mit 58 verschiedenen Bildern." },
          ],
        },
        {
          heading: "TAG TEAM: zwei Pokémon auf einer Karte",
          blocks: [
            { type: "p", text: "Der größte Block der Auswahl stammt aus den TAG TEAM-Karten von 2019. Bei ihnen stehen zwei Pokémon gemeinsam auf der Karte, und das Paar hat einen gemeinsamen Namen. Zwei Sets liefern allein 32 der 82 Karten: Cosmic Eclipse mit 17 und Unified Minds mit 15." },
            { type: "ul", items: [
              "Zobiris & Despotar (Sableye & Tyranitar): drei Karten",
              "Schlapor & Pummeluff (Lopunny & Jigglypuff): drei Karten",
              "Turtok & Plinfa (Blastoise & Piplup): drei Karten",
              "Knakrack & Giratina (Garchomp & Giratina): zwei Karten",
            ] },
            { type: "p", text: "Dass die Paare oft aus ungleichen Partnern bestehen, macht den Reiz aus. Ein Duo wie Schlapor und Pummeluff passt zu zwei Menschen, die sich gerade wegen ihrer Unterschiede gut verstehen." },
          ],
        },
        {
          heading: "Gruppen und Familien",
          blocks: [
            { type: "p", text: "Neben den Paaren gibt es Pokémon, die von Natur aus mehrere sind: Owei, das aus mehreren Eiern besteht, kommt mit vier Karten vor, Famieps mit drei. Auch Pikachu gibt es zweimal in der Auswahl, darunter eine Karte aus 30th Celebration (2026)." },
          ],
        },
        {
          heading: "Wem du den Binder schenken kannst",
          blocks: [
            { type: "ul", items: [
              "Paaren, die gemeinsam Karten sammeln, als Binder mit je einer Hälfte der Seite.",
              "Geschwistern: eine Seite pro Kind, damit keine Karte doppelt vorkommt.",
              "Freundinnen und Freunden, die schon als Kinder getauscht haben.",
            ] },
            { type: "p", text: "Fast 40 Prozent der Auswahl stammen aus nur zwei Sets. Wenn dir die TAG TEAM-Optik nicht gefällt, tausche einzelne Karten im Tool aus, bevor du bestellst." },
          ],
        },
      ],
    },
    en: {
      slug: "pokemon-cards-friends",
      title: "Pokémon friends: cards where they appear in pairs or groups",
      metaTitle: "Pokémon cards with friends and duos: TAG TEAM and more",
      description: "82 cards that show several Pokémon together: how TAG TEAM cards work, which duos exist and who a friends binder suits.",
      intro: "Most cards show a Pokémon alone. This page is about the exceptions: cards where two or more Pokémon share one picture. From them you can build a binder for two people who belong together.",
      sections: [
        {
          heading: "What counts as a friends card",
          blocks: [
            { type: "p", text: "Cards were included where several Pokémon are the centre of the picture together: two in one scene, a group, or a Pokémon with its family. A single Pokémon with others only in the background does not belong. The selection holds 82 cards with 58 different pictures." },
          ],
        },
        {
          heading: "TAG TEAM: two Pokémon on one card",
          blocks: [
            { type: "p", text: "The largest block of the selection comes from the TAG TEAM cards of 2019. On them two Pokémon stand together on the card, and the pair has a shared name. Two sets alone supply 32 of the 82 cards: Cosmic Eclipse with 17 and Unified Minds with 15." },
            { type: "ul", items: [
              "Sableye & Tyranitar: three cards",
              "Lopunny & Jigglypuff: three cards",
              "Blastoise & Piplup: three cards",
              "Garchomp & Giratina: two cards",
            ] },
            { type: "p", text: "That the pairs often consist of unlike partners is part of the charm. A duo such as Lopunny and Jigglypuff suits two people who get along precisely because they are different." },
          ],
        },
        {
          heading: "Groups and families",
          blocks: [
            { type: "p", text: "Besides the pairs there are Pokémon that come as several by nature: Exeggcute, which consists of several eggs, appears on four cards, Maushold on three. Pikachu also appears twice in the selection, including a card from 30th Celebration (2026)." },
          ],
        },
        {
          heading: "Who you can give the binder to",
          blocks: [
            { type: "ul", items: [
              "Couples who collect cards together, as a binder with one half of the page each.",
              "Siblings: one page per child so that no card appears twice.",
              "Friends who traded cards as children.",
            ] },
            { type: "p", text: "Almost 40 percent of the selection comes from just two sets. If you do not like the TAG TEAM look, swap single cards in the tool before you order." },
          ],
        },
      ],
    },
  },
  {
    id: "motif-sleeping",
    updated: "2026-10-23",
    photoIds: ["30th-043", "sm10-135", "swsh11-143"],
    related: ["motif-night", "gift", "birthday-gift"],
    themeId: "sleeping",
    live: false,
    de: {
      slug: "schlafende-pokemon-karten",
      title: "Schlafende Pokémon: Karten zum Runterkommen",
      metaTitle: "Schlafende Pokémon auf Karten: Relaxo, Somnivora und Co.",
      description: "48 Karten mit schlafenden Pokémon, davon 13 mit Relaxo: die Chronik von 1999 bis 2026, die Nebenrollen und die Frage, wem man so einen Binder schenkt.",
      intro: "Ein schlafendes Pokémon braucht keine Pose und keinen Effekt. Es liegt da, und das Bild ist fertig. In der Auswahl stecken 48 Karten, und gut ein Viertel davon gehört einem einzigen Pokémon.",
      sections: [
        {
          heading: "Relaxo hat ein Abo auf diese Auswahl",
          blocks: [
            { type: "p", text: "13 der 48 Karten zeigen Relaxo. Relaxo ist im Spiel für seinen Dauerschlaf bekannt, die Karten sind also naheliegend. Sie ziehen sich durch 27 Jahre:" },
            { type: "ul", items: [
              "1999: Relaxo als Promo-Karte aus den Wizards Black Star Promos, die älteste Karte der Auswahl.",
              "2000: Rockets Relaxo aus Gym Heroes.",
              "2003: Relaxo aus Skyridge.",
              "2026: gleich zwei neue, aus 30th Celebration und Perfect Order.",
            ] },
          ],
        },
        {
          heading: "Die Nebenrollen",
          blocks: [
            { type: "table", caption: "Schlafende Pokémon außer Relaxo (mindestens zwei Karten)", head: ["Pokémon", "Karten"], rows: [
              ["Somnivora (Musharna)", "6"], ["Bummelz (Slakoth)", "2"], ["Koalelu (Komala)", "2"], ["Brimova (Hatenna)", "2"],
            ] },
            { type: "p", text: "Dazu kommen Einzelkarten, etwa mit Pikachu, Raichu, Dedenne und Kangama. Insgesamt sind es 28 verschiedene Pokémon." },
          ],
        },
        {
          heading: "Fast alles stammt aus der Zeit nach 2010",
          blocks: [
            { type: "p", text: "Nur vier Karten stammen aus den Jahren vor 2010. 24 sind aus den 2010ern, 20 aus den 2020ern. Die Seite sieht deshalb meist klar und modern aus." },
          ],
        },
        {
          heading: "Für wen sich so ein Binder eignet",
          blocks: [
            { type: "p", text: "Für Menschen, die eher ruhige Hobbys mögen: Schlafmützen, Langschläfer, Eltern, die abends endlich zur Ruhe kommen. Mit Relaxo gibt es außerdem eine Anspielung, die viele Spieler sofort verstehen." },
            { type: "p", text: "Im Tool wählst du das Motiv „Schlafende Pokémon“. Relaxo ist so häufig, dass er auf einer Seite mehrfach vorkommen kann; tausche Karten im Tool aus, wenn du mehr Abwechslung willst. Willst du nur Relaxo, gibst du den Namen direkt ein." },
          ],
        },
      ],
    },
    en: {
      slug: "sleeping-pokemon-cards",
      title: "Sleeping Pokémon: cards to unwind with",
      metaTitle: "Sleeping Pokémon on cards: Snorlax, Musharna and more",
      description: "48 cards with sleeping Pokémon, 13 of them Snorlax: the timeline from 1999 to 2026, the supporting cast and who gets such a binder as a gift.",
      intro: "A sleeping Pokémon needs no pose and no effect. It lies there, and the picture is done. The selection holds 48 cards, and a good quarter of them belongs to a single Pokémon.",
      sections: [
        {
          heading: "Snorlax has a standing booking on this selection",
          blocks: [
            { type: "p", text: "13 of the 48 cards show Snorlax. Snorlax is known in the games for its constant sleeping, so the cards are an obvious fit. They span 27 years:" },
            { type: "ul", items: [
              "1999: Snorlax as a promo from the Wizards Black Star Promos, the oldest card in the selection.",
              "2000: Rocket's Snorlax from Gym Heroes.",
              "2003: Snorlax from Skyridge.",
              "2026: two new ones, from 30th Celebration and Perfect Order.",
            ] },
          ],
        },
        {
          heading: "The supporting cast",
          blocks: [
            { type: "table", caption: "Sleeping Pokémon other than Snorlax (at least two cards)", head: ["Pokémon", "Cards"], rows: [
              ["Musharna", "6"], ["Slakoth", "2"], ["Komala", "2"], ["Hatenna", "2"],
            ] },
            { type: "p", text: "There are also single cards with Pikachu, Raichu, Dedenne and Kangaskhan. In total there are 28 different Pokémon." },
          ],
        },
        {
          heading: "Almost everything dates from after 2010",
          blocks: [
            { type: "p", text: "Only four cards date from before 2010. 24 are from the 2010s, 20 from the 2020s. The page therefore usually looks clean and modern." },
          ],
        },
        {
          heading: "Who such a binder suits",
          blocks: [
            { type: "p", text: "People who prefer quiet hobbies: sleepyheads, late risers, parents who finally relax in the evening. With Snorlax there is also a nod that many players understand at once." },
            { type: "p", text: "In the tool you choose the theme “Sleeping Pokémon”. Snorlax is so frequent that it can appear several times on one page; swap cards in the tool if you want more variety. If you only want Snorlax, enter the name directly." },
          ],
        },
      ],
    },
  },
  {
    id: "motif-shiny",
    updated: "2026-10-23",
    photoIds: ["sv04.5-212", "sv04.5-093", "sv04.5-153"],
    related: ["motif-illustration", "condition", "marketplaces"],
    themeId: "shiny",
    live: false,
    de: {
      slug: "shiny-pokemon-karten",
      title: "Shiny-Pokémon-Karten: drei Sets, in denen die Sonderfarben stecken",
      metaTitle: "Shiny-Pokémon-Karten: Sets, Zahlen und worauf du achtest",
      description: "Shiny-Karten zeigen Pokémon in ihrer seltenen Sonderfarbe. Welche drei Sets sie enthalten, wie viele es im Katalog gibt und was du vor dem Kauf wissen solltest.",
      intro: "Ein Shiny ist ein Pokémon in einer anderen, seltenen Farbe als gewöhnlich, ein Glurak etwa in Schwarz statt Orange. Auf Karten gibt es diese Varianten nur in wenigen Sets. Das macht den Überblick kurz und die Karten gut verfolgbar.",
      sections: [
        {
          heading: "Die drei Quellen im Überblick",
          blocks: [
            { type: "table", caption: "Shiny-Karten im Katalog (Stand 23.10.2026)", head: ["Set", "Erschienen", "Shiny-Karten"], rows: [
              ["Hidden Fates, Shiny Vault", "August 2019", "86"],
              ["Shining Fates, Shiny Vault", "Februar 2021", "104, dazu 9 Shiny V und 7 Shiny VMAX"],
              ["Paldean Fates", "Januar 2024", "120, dazu 12 Shiny Ultra Rare"],
            ] },
            { type: "p", text: "Im Katalog führen nur diese drei Sets die Seltenheitsstufen für Shiny-Karten. Das macht das Sammelgebiet übersichtlich." },
          ],
        },
        {
          heading: "Was Your Card Binder daraus auswählt",
          blocks: [
            { type: "p", text: "Das Motiv „Shiny-Karten“ umfasst 150 Karten mit höchstens zwei Karten pro Pokémon, damit eine Seite nicht aus Wiederholungen besteht. Derzeit stammen 103 davon aus Paldean Fates und 47 aus dem Hidden Fates Shiny Vault. Es sind 140 verschiedene Pokémon." },
            { type: "p", text: "Anders als Bildmotive wie Strand oder Nacht richtet sich diese Auswahl nicht nach dem Bildinhalt, sondern nach der Seltenheitsstufe der Karte im Katalog." },
          ],
        },
        {
          heading: "Worauf du vor dem Kauf achtest",
          blocks: [
            { type: "ul", items: [
              "Die Kartennummern der Shiny Vaults liegen außerhalb der normalen Nummerierung des Hauptsets. Prüfe deshalb Set und Nummer, bevor du bestellst.",
              "Shiny-Karten sind oft Teil eines Sets mit gewöhnlichen Karten desselben Pokémon. Achte auf die Seltenheit, nicht nur auf den Namen.",
              "Die Preise schwanken stark, besonders bei den Ultra- und VMAX-Karten. Your Card Binder zeigt nur Schätzungen, den Endpreis bestätigst du beim Marktplatz.",
            ] },
          ],
        },
        {
          heading: "Wem du so eine Seite schenkst",
          blocks: [
            { type: "p", text: "Das passt zu Menschen, die in den Spielen Shiny-Pokémon jagen. Sie erkennen die Farben sofort und freuen sich über ein Bild, das sie sonst nur vom Bildschirm kennen." },
          ],
        },
      ],
    },
    en: {
      slug: "shiny-pokemon-cards",
      title: "Shiny Pokémon cards: three sets that hold the alternate colours",
      metaTitle: "Shiny Pokémon cards: sets, numbers and what to check",
      description: "Shiny cards show Pokémon in their rare alternate colour. Which three sets contain them, how many exist in the catalogue and what to know before buying.",
      intro: "A shiny is a Pokémon in a different, rare colour from the usual one, such as a black Charizard instead of an orange one. On cards these variants exist in only a few sets. That keeps the overview short and the cards easy to track.",
      sections: [
        {
          heading: "The three sources at a glance",
          blocks: [
            { type: "table", caption: "Shiny cards in the catalogue (as of 23 Oct 2026)", head: ["Set", "Released", "Shiny cards"], rows: [
              ["Hidden Fates, Shiny Vault", "August 2019", "86"],
              ["Shining Fates, Shiny Vault", "February 2021", "104, plus 9 Shiny V and 7 Shiny VMAX"],
              ["Paldean Fates", "January 2024", "120, plus 12 Shiny Ultra Rare"],
            ] },
            { type: "p", text: "In the catalogue only these three sets carry the rarity levels for shiny cards. That makes the collecting area manageable." },
          ],
        },
        {
          heading: "What Your Card Binder selects from it",
          blocks: [
            { type: "p", text: "The theme “Shiny cards” holds 150 cards with at most two per Pokémon, so a page does not consist of repeats. Currently 103 of them come from Paldean Fates and 47 from the Hidden Fates Shiny Vault. There are 140 different Pokémon." },
            { type: "p", text: "Unlike picture themes such as beach or night, this selection does not follow the picture content but the rarity level of the card in the catalogue." },
          ],
        },
        {
          heading: "What to look at when ordering",
          blocks: [
            { type: "ul", items: [
              "The card numbers of the Shiny Vaults lie outside the normal numbering of the main set. Check set and number before you order.",
              "Shiny cards are often part of a set that also holds ordinary cards of the same Pokémon. Look at the rarity, not just the name.",
              "Prices swing a lot, especially for the Ultra and VMAX cards. Your Card Binder shows estimates only; you confirm the final price at the marketplace.",
            ] },
          ],
        },
        {
          heading: "Who gets such a page",
          blocks: [
            { type: "p", text: "It suits people who hunt shiny Pokémon in the games. They recognise the colours at once and enjoy a picture they otherwise only know from the screen." },
          ],
        },
      ],
    },
  },
  {
    id: "motif-mega",
    updated: "2026-10-23",
    photoIds: ["me05-114", "me02.5-290", "me01-158"],
    related: ["motif-illustration", "motif-shiny", "marketplaces"],
    themeId: "mega",
    live: false,
    de: {
      slug: "mega-pokemon-karten",
      title: "Mega-Pokémon-Karten: die Rückkehr der Mega-Entwicklung 2025/26",
      metaTitle: "Mega-Pokémon-Karten: Serien und Zahlen",
      description: "Seit September 2025 gibt es wieder Mega-Karten. Welche Serien dazugehören, was Mega Hyper Rare und Mega Attack Rare bedeuten und was von den älteren M-EX-Karten bleibt.",
      intro: "Mega-Entwicklungen waren lange Sache der Vergangenheit. Im September 2025 kamen sie mit der Serie Mega Evolution zurück, und seither ist fast jedes neue Set voll davon. Wer Mega-Karten verschenken will, muss deshalb vor allem unterscheiden, welche Generation gemeint ist.",
      sections: [
        {
          heading: "Die Serien seit 2025",
          blocks: [
            { type: "table", caption: "Mega-Karten in der Auswahl nach Set (die fünf größten, Stand 23.10.2026)", head: ["Set", "Erschienen", "Karten"], rows: [
              ["Ascended Heroes", "Januar 2026", "22"],
              ["Mega Evolution", "September 2025", "20"],
              ["Pitch Black", "Juli 2026", "10"],
              ["Phantasmal Flames", "November 2025", "10"],
              ["Chaos Rising", "Mai 2026", "9"],
            ] },
            { type: "p", text: "Insgesamt umfasst die Auswahl 83 Karten mit 43 verschiedenen Pokémon, darunter Greninja, Darkrai, Starmie und Zeraora. Die Karten heißen „Mega … ex“, zum Beispiel Mega Darkrai ex." },
          ],
        },
        {
          heading: "Zwei neue Seltenheitsstufen",
          blocks: [
            { type: "p", text: "Der Katalog führt acht Karten der Stufe „Mega Hyper Rare“. Diese Stufe gibt es in allen sechs Sets, mit ein bis zwei Karten pro Set. Dazu kommen sieben „Mega Attack Rare“, die es nur in Ascended Heroes gibt." },
          ],
        },
        {
          heading: "Die ältere Generation: M-EX und TAG TEAM",
          blocks: [
            { type: "p", text: "Schon einmal gab es Mega-Karten: als „M … EX“ in der Zeit der XY-Sets, davon 89 im Katalog. Sie sind kein Teil dieser Auswahl, denn ihre Namen und ihre Gestaltung unterscheiden sich von den heutigen Karten." },
            { type: "p", text: "Aus der Zwischenzeit sind vier Karten übrig: die „Mega … & … GX“ der TAG TEAM-Reihe von 2019, etwa Mega Zobiris & Despotar GX aus Unified Minds." },
          ],
        },
        {
          heading: "Was das fürs Verschenken heißt",
          blocks: [
            { type: "ul", items: [
              "Die Karten sind neu und meist leicht zu bekommen, wenn auch die seltensten teuer sind.",
              "Eine Seite aus nur einem Set wirkt am einheitlichsten. Mischst du Serien, passen Farben und Rahmen nicht immer zusammen.",
              "Wer ältere Mega-Karten sucht, wählt im Tool die Pokémon einzeln und prüft die Sets.",
            ] },
          ],
        },
      ],
    },
    en: {
      slug: "mega-pokemon-cards",
      title: "Mega Pokémon cards: the return of Mega Evolution in 2025/26",
      metaTitle: "Mega Pokémon cards: series and numbers",
      description: "Mega cards are back since September 2025. Which series belong, what Mega Hyper Rare and Mega Attack Rare mean and what is left of the older M-EX cards.",
      intro: "Mega Evolutions were a thing of the past for a long time. In September 2025 they came back with the Mega Evolution series, and since then almost every new set is full of them. Anyone who wants to give Mega cards must therefore first tell which generation is meant.",
      sections: [
        {
          heading: "The series since 2025",
          blocks: [
            { type: "table", caption: "Mega cards in the selection by set (the five largest, as of 23 Oct 2026)", head: ["Set", "Released", "Cards"], rows: [
              ["Ascended Heroes", "January 2026", "22"],
              ["Mega Evolution", "September 2025", "20"],
              ["Pitch Black", "July 2026", "10"],
              ["Phantasmal Flames", "November 2025", "10"],
              ["Chaos Rising", "May 2026", "9"],
            ] },
            { type: "p", text: "In total the selection holds 83 cards with 43 different Pokémon, including Greninja, Darkrai, Starmie and Zeraora. The cards are called “Mega … ex”, for example Mega Darkrai ex." },
          ],
        },
        {
          heading: "Two new rarity levels",
          blocks: [
            { type: "p", text: "The catalogue lists eight cards of the level “Mega Hyper Rare”. This level exists in all six sets, with one or two cards per set. In addition there are seven “Mega Attack Rare”, which exist only in Ascended Heroes." },
          ],
        },
        {
          heading: "The older generation: M-EX and TAG TEAM",
          blocks: [
            { type: "p", text: "Mega cards existed once before: as “M … EX” in the time of the XY sets, 89 of them in the catalogue. They are not part of this selection, because their names and design differ from today's cards." },
            { type: "p", text: "From the time in between four cards remain: the “Mega … & … GX” cards of the TAG TEAM line from 2019, such as Mega Sableye & Tyranitar GX from Unified Minds." },
          ],
        },
        {
          heading: "What this means for a gift",
          blocks: [
            { type: "ul", items: [
              "The cards are new and mostly easy to get, although the rarest are expensive.",
              "A page from a single set looks the most uniform. If you mix series, colours and frames do not always match.",
              "If you want older Mega cards, choose the Pokémon one by one in the tool and check the sets.",
            ] },
          ],
        },
      ],
    },
  },
  {
    id: "motif-classics",
    updated: "2026-10-23",
    photoIds: ["base1-1", "base4-4", "neo1-7"],
    related: ["condition", "marketplaces", "gift"],
    themeId: "classics",
    live: false,
    de: {
      slug: "klassische-pokemon-holo-karten",
      title: "Klassische Pokémon-Holokarten von 1999 bis 2002",
      metaTitle: "Klassische Pokémon-Holokarten von 1999 bis 2002",
      description: "Die glitzernden Holokarten der Anfangszeit: aus welchen Sets sie stammen, wie die Auswahl entsteht und worauf du bei so alten Karten achtest.",
      intro: "Wer in den späten Neunzigern Pokémon-Karten gesammelt hat, erinnert sich an die Holos: Karten, deren Bild glitzerte. Der Binder mit Klassikern spricht diese Erinnerung an. Hier steht, was er enthält und was bei Karten dieses Alters zu beachten ist.",
      sections: [
        {
          heading: "Was zur Auswahl gehört",
          blocks: [
            { type: "p", text: "Aufgenommen sind Pokémon-Karten aus den frühen Sets (Base Set, Jungle, Fossil, Base Set 2, die Gym-Sets und die vier Neo-Sets), die nur als Holo gedruckt wurden. Trainer- und Energiekarten sind ausgeschlossen. Es sind 150 Karten mit 111 verschiedenen Pokémon und höchstens zwei Karten pro Pokémon." },
          ],
        },
        {
          heading: "Die größten Sets in der Auswahl",
          blocks: [
            { type: "table", caption: "Klassische Holos nach Set (die fünf größten)", head: ["Set", "Erschienen", "Karten"], rows: [
              ["Neo Genesis", "2000", "18"],
              ["Base Set 2", "2000", "17"],
              ["Base Set", "1999", "16"],
              ["Jungle", "1999", "16"],
              ["Neo Discovery", "2001", "16"],
            ] },
            { type: "p", text: "47 Karten stammen aus dem Jahr 1999, 103 aus den Jahren 2000 bis 2002. Die jüngsten Karten sind die dunklen Pokémon aus Neo Destiny, etwa Dark Crobat und Dark Espeon." },
          ],
        },
        {
          heading: "Worauf du bei so alten Karten achtest",
          blocks: [
            { type: "ul", items: [
              "Zustand: Karten dieses Alters haben oft Gebrauchsspuren. Prüfe die Fotos der Verkäufer und halte dich an die Zustandsangaben, siehe den Ratgeber zum Kartenzustand.",
              "Ausgabe: Manche Sets gab es als Erstausgabe und als spätere Auflage. Beides sieht ähnlich aus, ist aber nicht dasselbe und wird anders bewertet.",
              "Sprache: Deutsche und englische Karten dieser Zeit sind getrennte Drucke. Leg die Sprache vor dem Kauf fest.",
              "Preis: Einzelne Karten, etwa Glurak aus dem Base Set, können sehr teuer sein. Lege vorher ein Budget fest.",
            ] },
          ],
        },
        {
          heading: "Ein Geschenk für Sammler von damals",
          blocks: [
            { type: "p", text: "Der Binder lässt sich gut mit einer persönlichen Notiz verschenken: Welche dieser Karten hatten wir damals auf dem Schulhof? Weil die Auswahl 111 Pokémon umfasst, findest du fast immer das Lieblings-Pokémon der Kindheit." },
          ],
        },
      ],
    },
    en: {
      slug: "classic-pokemon-holo-cards",
      title: "Classic Pokémon holo cards from 1999 to 2002",
      metaTitle: "Classic Pokémon holo cards from 1999 to 2002",
      description: "The glittering holo cards of the early days: which sets they come from, how the selection is made and what to watch for with cards this old.",
      intro: "Anyone who collected Pokémon cards in the late nineties remembers the holos: cards whose picture sparkled. A binder of classics speaks to that memory. This page explains what it contains and what to keep in mind with cards of this age.",
      sections: [
        {
          heading: "What belongs in the selection",
          blocks: [
            { type: "p", text: "It includes Pokémon cards from the early sets (Base Set, Jungle, Fossil, Base Set 2, the Gym sets and the four Neo sets) that were printed only as holo. Trainer and Energy cards are excluded. There are 150 cards with 111 different Pokémon and at most two cards per Pokémon." },
          ],
        },
        {
          heading: "The largest sets in the selection",
          blocks: [
            { type: "table", caption: "Classic holos by set (the five largest)", head: ["Set", "Released", "Cards"], rows: [
              ["Neo Genesis", "2000", "18"],
              ["Base Set 2", "2000", "17"],
              ["Base Set", "1999", "16"],
              ["Jungle", "1999", "16"],
              ["Neo Discovery", "2001", "16"],
            ] },
            { type: "p", text: "47 cards date from 1999 and 103 from 2000 to 2002. The newest cards are the dark Pokémon from Neo Destiny, such as Dark Crobat and Dark Espeon." },
          ],
        },
        {
          heading: "What to watch for with cards this old",
          blocks: [
            { type: "ul", items: [
              "Condition: cards of this age often show signs of use. Check the sellers' photos and stick to the stated condition; see the condition guide.",
              "Edition: some sets exist as a first edition and as a later print run. They look alike but are not the same and are valued differently.",
              "Language: German and English cards of this time are separate print runs. Decide on the language before you buy.",
              "Price: single cards, for example Charizard from Base Set, can be very expensive. Set a budget beforehand.",
            ] },
          ],
        },
        {
          heading: "A gift for collectors from back then",
          blocks: [
            { type: "p", text: "The binder works well with a personal note: which of these cards did we have in the schoolyard? Because the selection covers 111 Pokémon, you will almost always find the favourite from childhood." },
          ],
        },
      ],
    },
  },
  {
    id: "motif-fire-type",
    updated: "2026-10-23",
    photoIds: ["me02-125", "sv03.5-169", "swsh3-191"],
    related: ["motif-night", "gift", "personalized-gift"],
    themeId: "type-fire",
    live: false,
    de: {
      slug: "feuer-pokemon-karten",
      title: "Feuer-Pokémon-Karten: Auswahl nach Typ statt nach Bild",
      metaTitle: "Feuer-Pokémon-Karten: Auswahl nach Typ",
      description: "119 Karten von Pokémon des Typs Feuer, die seltensten zuerst: welche Sets, welche Pokémon und wie sich diese Auswahl vom Bildmotiv „Feuer & Lava“ unterscheidet.",
      intro: "Feuer-Pokémon sind der beliebteste Einstieg in einen Typ-Binder. Your Card Binder bietet dafür zwei verschiedene Auswahlen an, die leicht verwechselt werden. Diese Seite erklärt den Unterschied und zeigt, was in der Typ-Auswahl steckt.",
      sections: [
        {
          heading: "Zwei Auswahlen, zwei Fragen",
          blocks: [
            { type: "table", caption: "Feuer-Pokémon und Feuer & Lava im Vergleich", head: ["", "Feuer-Pokémon", "Feuer & Lava"], rows: [
              ["Frage", "Welche Pokémon sind vom Typ Feuer?", "Wo brennt es im Bild?"],
              ["Karten", "119", "45"],
              ["Gewählt nach", "dem Typ auf der Karte und der Seltenheit", "dem Bildinhalt"],
              ["Passt für", "Fans von Glurak, Reshiram und Co.", "alle, die Flammen und Vulkane mögen"],
            ] },
            { type: "p", text: "Ein Feuer-Pokémon kann auf einer Wiese sitzen und gehört trotzdem in die Typ-Auswahl. Ein Wasser-Pokémon vor einem Vulkan gehört dagegen in „Feuer & Lava“." },
          ],
        },
        {
          heading: "Wie die Typ-Auswahl entsteht",
          blocks: [
            { type: "p", text: "Der Katalog liefert alle Karten mit dem Typ Feuer. Daraus wählt Your Card Binder die seltensten zuerst und lässt höchstens drei Karten pro Pokémon zu. So sieht eine Seite abwechslungsreich aus, auch wenn Glurak sehr oft gedruckt wurde. Es sind 70 verschiedene Pokémon." },
            { type: "p", text: "Die meisten Karten kommen aus White Flare (10), Destined Rivals (7) und Paldea Evolved (7). Die Karten reichen von 2011 bis 2026." },
          ],
        },
        {
          heading: "Die Pokémon, die dreimal vorkommen",
          blocks: [
            { type: "p", text: "Mit drei Karten sind unter anderem Glurak, Reshiram, Volcanion, Ho-Oh, Flambirex, Hundemon, Ramoth, Tortunator und Lohgock dabei. Das ergibt eine Mischung aus Starter-Entwicklungen, Legendären und Pokémon der neueren Generationen." },
          ],
        },
        {
          heading: "Wann du welche Auswahl nimmst",
          blocks: [
            { type: "ul", items: [
              "Du kennst das Lieblings-Pokémon: gib den Namen direkt ein, die Typ-Auswahl brauchst du dann nicht.",
              "Die Person mag den Typ, aber kein bestimmtes Pokémon: nimm Feuer-Pokémon.",
              "Die Person mag Flammen als Bild: nimm Feuer & Lava.",
            ] },
          ],
        },
      ],
    },
    en: {
      slug: "fire-type-pokemon-cards",
      title: "Fire-type Pokémon cards: a selection by type, not by picture",
      metaTitle: "Fire-type Pokémon cards: selection by type",
      description: "119 cards of Fire-type Pokémon, the rarest first: which sets, which Pokémon and how this selection differs from the “Fire & lava” picture theme.",
      intro: "Fire Pokémon are the most popular entry into a type binder. Your Card Binder offers two different selections for it that are easily confused. This page explains the difference and shows what is in the type selection.",
      sections: [
        {
          heading: "Two selections, two questions",
          blocks: [
            { type: "table", caption: "Fire Pokémon and Fire & lava compared", head: ["", "Fire Pokémon", "Fire & lava"], rows: [
              ["Question", "Which Pokémon are Fire type?", "Where is something burning in the picture?"],
              ["Cards", "119", "45"],
              ["Chosen by", "the type on the card and rarity", "what the picture shows"],
              ["Suits", "fans of Charizard, Reshiram and co.", "anyone who likes flames and volcanoes"],
            ] },
            { type: "p", text: "A Fire Pokémon can sit on a meadow and still belongs in the type selection. A Water Pokémon in front of a volcano belongs in “Fire & lava” instead." },
          ],
        },
        {
          heading: "How the type selection is made",
          blocks: [
            { type: "p", text: "The catalogue supplies every card with the Fire type. Your Card Binder picks the rarest first and allows at most three cards per Pokémon. That way a page looks varied even though Charizard has been printed very often. There are 70 different Pokémon." },
            { type: "p", text: "Most cards come from White Flare (10), Destined Rivals (7) and Paldea Evolved (7). The cards range from 2011 to 2026." },
          ],
        },
        {
          heading: "The Pokémon that appear three times",
          blocks: [
            { type: "p", text: "With three cards each, Charizard, Reshiram, Volcanion, Ho-Oh, Emboar, Houndoom, Volcarona, Turtonator and Blaziken are among them. That gives a mix of starter evolutions, legendaries and Pokémon of newer generations." },
          ],
        },
        {
          heading: "When to choose which selection",
          blocks: [
            { type: "ul", items: [
              "You know the favourite Pokémon: enter the name directly, you do not need the type selection.",
              "The person likes the type but no particular Pokémon: choose Fire Pokémon.",
              "The person likes flames as a picture: choose Fire & lava.",
            ] },
          ],
        },
      ],
    },
  },
];
