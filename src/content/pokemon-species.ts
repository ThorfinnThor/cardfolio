import type { PageLanguage } from "@/config/site";

/**
 * Hand-written entries for the Pokémon pages. A page exists only for a Pokémon listed here AND meeting the
 * data thresholds in `pokemon-stats.ts`. The list is deliberately short: every page has to say something the
 * others do not, so pages are added one at a time with their own text, never generated in bulk.
 */
export interface SpeciesEntry {
  slug: string;
  names: Record<PageLanguage, string>;
  /** Name as printed on English cards; the catalogue match uses it as a whole word. */
  cardName: string;
  dexNumber: number;
  types: Record<PageLanguage, string>;
  /** Evolution line or family, as plain facts. */
  family: Record<PageLanguage, string>;
  /** Two short paragraphs about the Pokémon itself and why people collect it. */
  about: Record<PageLanguage, readonly [string, string]>;
  /** One sentence on what to watch for when collecting this Pokémon. */
  collectingNote: Record<PageLanguage, string>;
  related: readonly string[];
}

export const SPECIES: readonly SpeciesEntry[] = [
  {
    slug: "pikachu",
    names: { de: "Pikachu", en: "Pikachu" },
    cardName: "Pikachu",
    dexNumber: 25,
    types: { de: "Elektro", en: "Electric" },
    family: { de: "Pichu → Pikachu → Raichu", en: "Pichu → Pikachu → Raichu" },
    about: {
      de: [
        "Pikachu hat Nummer 25 im Pokédex und ist das bekannteste Gesicht der Reihe. Das macht es zu einer sicheren Wahl für Geschenke: Auch wer sonst wenig mit Pokémon zu tun hat, erkennt es sofort.",
        "Weil Pikachu in fast jeder Erweiterung und in vielen Promo-Aktionen vorkommt, ist die Auswahl riesig. Das ist ein Vorteil beim Zusammenstellen einer abwechslungsreichen Seite, verlangt aber ein paar Entscheidungen, damit am Ende nicht neun fast gleiche Karten im Binder stecken.",
      ],
      en: [
        "Pikachu is number 25 in the Pokédex and the best-known face of the franchise. That makes it a safe choice for a gift: even people who rarely deal with Pokémon recognise it at once.",
        "Pikachu appears in almost every expansion and in many promotional releases, so the choice is huge. That helps when you build a varied page, but it takes a few decisions so that the binder does not end up with nine nearly identical cards.",
      ],
    },
    collectingNote: {
      de: "Bei Pikachu lohnt es sich, nach Artwork statt nach Set zu wählen, weil viele Drucke fast gleich aussehen.",
      en: "With Pikachu it pays to choose by artwork rather than by set, because many printings look almost the same.",
    },
    related: ["evoli", "glurak", "mew"],
  },
  {
    slug: "glurak",
    names: { de: "Glurak", en: "Charizard" },
    cardName: "Charizard",
    dexNumber: 6,
    types: { de: "Feuer / Flug", en: "Fire / Flying" },
    family: { de: "Glumanda → Glutexo → Glurak", en: "Charmander → Charmeleon → Charizard" },
    about: {
      de: [
        "Glurak ist Nummer 6 im Pokédex und eine der gefragtesten Figuren im Kartenspiel. Die Holo-Karte aus dem englischen Base Set (4/102) ist unter Sammlern ein Begriff, sie zeigt aber auch, warum ein Glurak-Binder anspruchsvoller sein kann als erwartet.",
        "Karten aus den frühen Sets sind selten günstig. Wer verschenkt, kombiniert deshalb meist moderne Karten mit schönem Artwork und lässt die ganz alten Drucke bewusst weg oder plant dafür ein eigenes Budget ein.",
      ],
      en: [
        "Charizard is number 6 in the Pokédex and one of the most sought-after figures in the card game. The holo card from the English Base Set (4/102) is well known among collectors, but it also shows why a Charizard binder can be more demanding than expected.",
        "Cards from the early sets are rarely cheap. Anyone buying a gift therefore usually combines modern cards with attractive artwork and either leaves the oldest printings out on purpose or plans a separate budget for them.",
      ],
    },
    collectingNote: {
      de: "Prüfe bei älteren Glurak-Karten immer Edition und Finish, denn dieselbe Nummer gibt es in mehreren Ausführungen.",
      en: "With older Charizard cards always check edition and finish, because the same number exists in several versions.",
    },
    related: ["pikachu", "rayquaza", "garados"],
  },
  {
    slug: "evoli",
    names: { de: "Evoli", en: "Eevee" },
    cardName: "Eevee",
    dexNumber: 133,
    types: { de: "Normal", en: "Normal" },
    family: {
      de: "Evoli mit acht Entwicklungen: Aquana, Blitza, Flamara, Psiana, Nachtara, Folipurba, Glaziola und Feelinara",
      en: "Eevee with eight evolutions: Vaporeon, Jolteon, Flareon, Espeon, Umbreon, Leafeon, Glaceon and Sylveon",
    },
    about: {
      de: [
        "Evoli ist Nummer 133 im Pokédex und für seine vielen Entwicklungen bekannt. Genau das macht einen Evoli-Binder reizvoll: Neben Evoli selbst lässt sich die Sammlung später um die acht Entwicklungen erweitern.",
        "Evoli-Karten sind meist freundlich und farbenfroh gestaltet. Für ein Geschenk an Kinder oder an Menschen, die es gern ruhig und niedlich mögen, ist das eine naheliegende Wahl.",
      ],
      en: [
        "Eevee is number 133 in the Pokédex and is known for its many evolutions. That is what makes an Eevee binder appealing: besides Eevee itself, the collection can later grow to include the eight evolutions.",
        "Eevee cards are mostly friendly and colourful. For a gift to children, or to people who like things calm and cute, that is an obvious choice.",
      ],
    },
    collectingNote: {
      de: "Die Entwicklungen zählen in Your Card Binder als eigene Pokémon; ein Evoli-Binder enthält also nur Karten, auf denen Evoli selbst im Namen steht.",
      en: "The evolutions count as separate Pokémon in Your Card Binder, so an Eevee binder only contains cards with Eevee itself in the name.",
    },
    related: ["pikachu", "mew", "relaxo"],
  },
  {
    slug: "mew",
    names: { de: "Mew", en: "Mew" },
    cardName: "Mew",
    dexNumber: 151,
    types: { de: "Psycho", en: "Psychic" },
    family: { de: "Keine Entwicklung", en: "No evolution" },
    about: {
      de: [
        "Mew trägt die Nummer 151 und schließt damit die erste Generation ab. Es ist ein Mythisches Pokémon und gilt als Ursprung von Mewtu, das aus seinem Erbgut entstanden sein soll.",
        "Mew-Karten haben oft ein verspieltes, schwebendes Motiv. Weil es keine Entwicklungsstufen gibt, ist die Auswahl klar abgegrenzt, und ein Mew-Binder lässt sich gut mit einem Mewtu-Binder ergänzen.",
      ],
      en: [
        "Mew carries number 151 and closes out the first generation. It is a Mythical Pokémon and is said to be the origin of Mewtwo, which was created from its genes.",
        "Mew cards often show a playful, floating pose. Since there are no evolution stages, the selection is clearly defined, and a Mew binder pairs well with a Mewtwo binder.",
      ],
    },
    collectingNote: {
      de: "Achte auf den Namen: „Mew“ und „Mewtu“ sind verschiedene Pokémon und stehen in Your Card Binder nicht im selben Binder.",
      en: "Watch the name: “Mew” and “Mewtwo” are different Pokémon and do not share a binder in Your Card Binder.",
    },
    related: ["mewtu", "evoli", "pikachu"],
  },
  {
    slug: "mewtu",
    names: { de: "Mewtu", en: "Mewtwo" },
    cardName: "Mewtwo",
    dexNumber: 150,
    types: { de: "Psycho", en: "Psychic" },
    family: { de: "Keine Entwicklung (Mega-Formen X und Y)", en: "No evolution (Mega forms X and Y)" },
    about: {
      de: [
        "Mewtu ist Nummer 150 im Pokédex und ein Legendäres Pokémon. Es ist vom Aussehen her klar erkennbar und seit den ersten Spielen ein Dauerbrenner unter Sammlern.",
        "Wegen der Mega-Entwicklungen und der vielen Spezial-Drucke findest du Mewtu in sehr unterschiedlichen Stilen, von dunklen, düsteren Motiven bis zu leuchtend farbigen.",
      ],
      en: [
        "Mewtwo is number 150 in the Pokédex and a Legendary Pokémon. It is clearly recognisable and has been a perennial favourite among collectors since the first games.",
        "Because of the Mega forms and the many special printings, you find Mewtwo in very different styles, from dark and moody artwork to brightly coloured designs.",
      ],
    },
    collectingNote: {
      de: "Mega-Formen und Karten mit mehreren Pokémon erscheinen im selben Binder, sobald „Mewtu“ im Kartennamen steht.",
      en: "Mega forms and cards showing several Pokémon appear in the same binder as soon as “Mewtwo” is in the card name.",
    },
    related: ["mew", "gengar", "lucario"],
  },
  {
    slug: "gengar",
    names: { de: "Gengar", en: "Gengar" },
    cardName: "Gengar",
    dexNumber: 94,
    types: { de: "Geist / Gift", en: "Ghost / Poison" },
    family: { de: "Nebulak → Alpollo → Gengar", en: "Gastly → Haunter → Gengar" },
    about: {
      de: [
        "Gengar ist Nummer 94 im Pokédex und ein Geist-Pokémon mit schelmischem Grinsen. Es ist bei Sammlern beliebt, die dunklere, verspielt gruselige Motive mögen.",
        "Etliche Gengar-Karten spielen mit Nacht, Schatten und Mondlicht. Das ergibt Binderseiten mit einem stimmigen Gesamtbild, die sich deutlich von bunten Pikachu- oder Evoli-Seiten unterscheiden.",
      ],
      en: [
        "Gengar is number 94 in the Pokédex and a Ghost Pokémon with a mischievous grin. It is popular with collectors who like darker, playfully spooky artwork.",
        "Quite a few Gengar cards play with night, shadows and moonlight. That makes for binder pages with a coherent overall look, clearly different from bright Pikachu or Eevee pages.",
      ],
    },
    collectingNote: {
      de: "Karten von Nebulak und Alpollo gehören nicht zu einem Gengar-Binder, auch wenn sie zur selben Entwicklungsreihe zählen.",
      en: "Gastly and Haunter cards do not belong in a Gengar binder, even though they are part of the same evolution line.",
    },
    related: ["mewtu", "relaxo", "lucario"],
  },
  {
    slug: "lucario",
    names: { de: "Lucario", en: "Lucario" },
    cardName: "Lucario",
    dexNumber: 448,
    types: { de: "Kampf / Stahl", en: "Fighting / Steel" },
    family: { de: "Riolu → Lucario (Mega-Form vorhanden)", en: "Riolu → Lucario (Mega form exists)" },
    about: {
      de: [
        "Lucario stammt aus der vierten Generation und hat die Pokédex-Nummer 448. Es ist ein Kampf-/Stahl-Pokémon und bei vielen Fans wegen seiner Rolle in Spielen und Anime beliebt.",
        "Lucario-Karten wirken oft dynamisch und kontrastreich. Verglichen mit den Klassikern der ersten Generation ist die Auswahl überschaubarer, sodass sich eine Seite schneller füllen lässt.",
      ],
      en: [
        "Lucario comes from the fourth generation and has Pokédex number 448. It is a Fighting / Steel Pokémon and is popular with many fans because of its role in the games and the anime.",
        "Lucario cards often look dynamic and high in contrast. Compared with the first-generation classics, the choice is smaller, so a page fills up more quickly.",
      ],
    },
    collectingNote: {
      de: "Riolu-Karten sind eigene Pokémon und zählen nicht zum Lucario-Binder.",
      en: "Riolu cards are separate Pokémon and do not count towards the Lucario binder.",
    },
    related: ["mewtu", "gengar", "rayquaza"],
  },
  {
    slug: "relaxo",
    names: { de: "Relaxo", en: "Snorlax" },
    cardName: "Snorlax",
    dexNumber: 143,
    types: { de: "Normal", en: "Normal" },
    family: { de: "Mampfaxo → Relaxo", en: "Munchlax → Snorlax" },
    about: {
      de: [
        "Relaxo hat die Nummer 143 und ist vor allem für seinen Schlaf bekannt. Auf Karten zeigt es sich häufig schlafend oder essend, was zu gemütlichen, humorvollen Motiven führt.",
        "Ein Relaxo-Binder passt zu Menschen, die es lieber entspannt als actionreich mögen. Viele der Karten sind ruhig komponiert und eignen sich gut für eine geschlossene Seite.",
      ],
      en: [
        "Snorlax has number 143 and is best known for its sleeping. On cards it often appears asleep or eating, which leads to cosy, humorous artwork.",
        "A Snorlax binder suits people who prefer relaxed to action-packed. Many of the cards are calmly composed and work well together on one page.",
      ],
    },
    collectingNote: {
      de: "Mampfaxo ist ein eigenes Pokémon; im Relaxo-Binder erscheinen nur Karten mit „Relaxo“ im Namen.",
      en: "Munchlax is a separate Pokémon; only cards with “Snorlax” in the name appear in the Snorlax binder.",
    },
    related: ["evoli", "gengar", "pikachu"],
  },
  {
    slug: "rayquaza",
    names: { de: "Rayquaza", en: "Rayquaza" },
    cardName: "Rayquaza",
    dexNumber: 384,
    types: { de: "Drache / Flug", en: "Dragon / Flying" },
    family: { de: "Keine Entwicklung (Mega-Form vorhanden)", en: "No evolution (Mega form exists)" },
    about: {
      de: [
        "Rayquaza ist Nummer 384 im Pokédex, ein Legendäres Pokémon der dritten Generation und lebt der Überlieferung nach in der Ozonschicht. Seine lange, schlangenartige Gestalt füllt Kartenmotive oft vollständig aus.",
        "Rayquaza-Karten zeigen häufig Himmel, Wolken und Wetter. Das ergibt Seiten mit einem ruhigen blau-grünen Gesamtbild, die besonders gut zu einem Sammler passen, der Drachen mag.",
      ],
      en: [
        "Rayquaza is number 384 in the Pokédex, a Legendary Pokémon of the third generation, said to live in the ozone layer. Its long, serpentine shape often fills the whole card artwork.",
        "Rayquaza cards frequently show sky, clouds and weather. That gives pages a calm blue-green overall look that suits a collector who likes dragons.",
      ],
    },
    collectingNote: {
      de: "Mega-Rayquaza und Rayquaza-ex-Karten tragen den Namen im Titel und erscheinen daher im selben Binder.",
      en: "Mega Rayquaza and Rayquaza ex cards carry the name in the title and therefore appear in the same binder.",
    },
    related: ["glurak", "garados", "lucario"],
  },
  {
    slug: "garados",
    names: { de: "Garados", en: "Gyarados" },
    cardName: "Gyarados",
    dexNumber: 130,
    types: { de: "Wasser / Flug", en: "Water / Flying" },
    family: { de: "Karpador → Garados (Mega-Form vorhanden)", en: "Magikarp → Gyarados (Mega form exists)" },
    about: {
      de: [
        "Garados ist Nummer 130 im Pokédex und die Entwicklung von Karpador. Der Wechsel vom unscheinbaren Karpador zum mächtigen Garados ist einer der bekanntesten Momente der Reihe.",
        "Garados-Karten zeigen häufig Meer, Wellen und Gewitterhimmel. Ein Garados-Binder hat dadurch oft ein einheitlich blaues Erscheinungsbild.",
      ],
      en: [
        "Gyarados is number 130 in the Pokédex and the evolution of Magikarp. The change from the unremarkable Magikarp to the mighty Gyarados is one of the best-known moments in the franchise.",
        "Gyarados cards often show the sea, waves and stormy skies. A Gyarados binder therefore tends to have a uniformly blue look.",
      ],
    },
    collectingNote: {
      de: "Karpador-Karten gehören nicht zum Garados-Binder, obwohl beide oft gemeinsam gesammelt werden.",
      en: "Magikarp cards do not belong in the Gyarados binder, although the two are often collected together.",
    },
    related: ["glurak", "rayquaza", "relaxo"],
  },
];

export function speciesBySlug(slug: string): SpeciesEntry | undefined {
  return SPECIES.find((entry) => entry.slug === slug);
}
