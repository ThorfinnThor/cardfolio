/*
 * English texts for strings that come from domain, data and config code (validation and status messages,
 * condition and variant descriptions, marketplace hints …). Strings that end up inside exported files
 * (TXT / CSV / Cardmarket or TCGplayer list text) are deliberately not translated.
 */

const conditionWords: Record<string, string> = {
  "Wie neu": "Like new",
  "Sehr gut": "Very good",
  Gebraucht: "Used",
  "Deutlich gebraucht": "Clearly used",
  Beliebig: "Any",
};

/* Variant validation messages: also embedded in "Variantenangaben prüfen: …". */
const variantIssues: Record<string, string> = {
  "Finish, Edition und Druckvariante müssen vollständig festgelegt werden.": "Finish, edition and printing must all be set.",
  "Die nicht gestempelte englische Base-Set-Machamp-Ausgabe benötigt eine eigene Bezeichnung, z. B. „Trainer Deck A“.": "The unstamped English Base Set Machamp printing needs a custom label, e.g. “Trainer Deck A”.",
  "Bei „Andere“ ist eine eigene Variantenbezeichnung erforderlich.": "A custom variant label is required for “Other”.",
  "Das englische Base-Set-Machamp ist in der First Edition nur als Holo bestätigt.": "The English Base Set Machamp is only confirmed as Holo in the First Edition.",
  "Die nicht gestempelte Trainer-Deck-A-Ausgabe von Machamp ist nur als Non-Holo bestätigt.": "The unstamped Trainer Deck A printing of Machamp is only confirmed as Non-Holo.",
  "Non-Holo / Normal ist für diese Karte im Katalog nicht bestätigt.": "Non-Holo / Normal is not confirmed for this card in the catalogue.",
  "Holo ist für diese Karte im Katalog nicht bestätigt.": "Holo is not confirmed for this card in the catalogue.",
  "Reverse Holo ist für diese Karte im Katalog nicht bestätigt.": "Reverse Holo is not confirmed for this card in the catalogue.",
  "First Edition ist für diese Karte im Katalog nicht bestätigt.": "First Edition is not confirmed for this card in the catalogue.",
  "Shadowless ist nur für bestätigte englische Base-Set-Ausgaben auswählbar.": "Shadowless can only be selected for confirmed English Base Set printings.",
  "Englische Base-Set-Karten der First Edition müssen als Shadowless erfasst werden.": "English Base Set First Edition cards must be recorded as Shadowless.",
  "Das englische Base-Set-Machamp ist als Shadowless-Ausgabe nur mit First-Edition-Stempel bestätigt.": "The English Base Set Machamp is only confirmed as a Shadowless printing with the First Edition stamp.",
  "Diese Kombination aus Edition und Druckvariante ist für die Karte nicht bestätigt.": "This combination of edition and printing is not confirmed for the card.",};

/* Words that appear inside variant summaries such as "Holo · 1. Edition · Offen: Druckvariante". */
const variantParts: Record<string, string> = {
  Holo: "Holo",
  "Reverse Holo": "Reverse Holo",
  Shadowless: "Shadowless",
  Unlimited: "Unlimited",
  "First Edition": "First Edition",
  "1. Edition": "1st Edition",
  "Besondere Ausführung": "Special printing",
  "Ausführung noch offen": "Printing not chosen yet",
  "Mit Schatten / Standard": "Shadowed / standard",
  "Unlimited / Standard": "Unlimited / standard",
  "Non-Holo / Normal": "Non-holo / normal",
  Andere: "Other",
  "Nicht festgelegt": "Not set",
};
const openWords: Record<string, string> = { Druckvariante: "Printing" };
const variantPartPattern = [
  ...Object.keys(variantParts).map((key) => key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
  "Offen: [^·]+",
].join("|");

const translateVariantPart = (part: string): string => {
  if (part.startsWith("Offen: ")) {
    return `Open: ${part.slice("Offen: ".length).split(", ").map((word) => openWords[word] ?? word).join(", ")}`;
  }
  return variantParts[part] ?? part;
};

const conditionWord = (value: string): string => conditionWords[value] ?? value;
const translateIssue = (value: string): string => variantIssues[value] ?? value;
const translateJoined = (value: string, separator: string, joiner: string): string =>
  value.split(separator).map((part) => variantParts[part] ?? part).join(joiner);

export const translations: Record<string, string> = {
  ...variantIssues,
  "Diese Karte ist noch nicht eindeutig gegen den offiziellen Cardmarket-Produktkatalog geprüft und wurde sicherheitshalber nicht importiert.": "This card has not yet been clearly matched against the official Cardmarket product catalogue and was not imported, to be safe.",
  "Kartentyp, Fähigkeiten und Attacken müssen zuerst aus dem Katalog aktualisiert werden.": "Card type, abilities and attacks must first be refreshed from the catalogue.",
  "Cardmarket benötigt bei Pokémon mindestens eine Fähigkeit oder Attacke zur eindeutigen Suche.": "For Pokémon, Cardmarket needs at least one ability or attack for an unambiguous search.",
  "Kein sicheres Cardmarket-Importformat verfügbar.": "No safe Cardmarket import format available.",
  "Offizielles Pokémon-Decklistenformat: Menge, vollständiger Kartenname, Fähigkeiten und Attacken – eine Karte pro Zeile.": "Official Pokémon deck list format: quantity, full card name, abilities and attacks – one card per line.",
  "Der Importtext enthält ausschließlich Kartenidentitäten, die mit dem offiziellen Cardmarket-Produktkatalog abgeglichen wurden.": "The import text only contains card identities that were matched against the official Cardmarket product catalogue.",
  "Das Decklistenformat legt Set, Kartennummer, Sprache und Druckvariante nicht fest.": "The deck list format does not specify set, card number, language or printing.",
  "Der in Your Card Binder gewählte Zustand wird gespeichert, aber vom Decklistenformat nicht übertragen. Wähle ihn nach dem Import in Cardmarket aus.": "The condition chosen in Your Card Binder is saved but not transferred by the deck list format. Choose it in Cardmarket after the import.",
  "Vor dem Kauf jede Position anhand von Set, Kartennummer, Sprache, Finish, Edition, Druckvariante und Zustand prüfen.": "Before buying, check each entry against set, card number, language, finish, edition, printing and condition.",
  "Schlafend": "Sleeping",
  "Fliegend": "Flying",
  "Schwimmend": "Swimming",
  "Keine gültige, geprüfte Produktzuordnung vorhanden.": "No valid, verified product match available.",
  "Eindeutige, manuell oder über eine direkte Anbieter-ID verifizierte Produktzuordnung.": "Unique product match, verified manually or via a direct provider ID.",
  "Mehrere gleich spezifische verifizierte Produkte; manuelle Auswahl erforderlich.": "Several equally specific verified products; manual selection required.",
  "Produktkandidat vorhanden, aber noch nicht für eine Bestellung verifiziert.": "Product candidate available, but not yet verified for an order.",
  "Die Produktzuordnung wurde geprüft und fehlt weiterhin.": "The product match was checked and is still missing.",
  "Mehrere Produktkandidaten; manuelle Prüfung erforderlich.": "Several product candidates; manual review required.",
  "Gebraucht – sichtbare Spuren okay": "Used – visible wear is okay",
  "Deutliche Gebrauchsspuren okay": "Heavy wear is okay",
  "Zustand egal": "Condition doesn't matter",
  "Wasseroberfläche": "Water surface",
  "Unter Wasser": "Underwater",
  "Wiese / Feld": "Meadow / field",
  "Berge / Felsen": "Mountains / rocks",
  "Schnee / Eis": "Snow / ice",
  "Innenraum": "Indoors",
  "Gebäude / Ruinen": "Buildings / ruins",
  "Himmel / Wolken": "Sky / clouds",
  "Sonnenauf- / -untergang": "Sunrise / sunset",
  "Feuer / Lava": "Fire / lava",
  "Essen sichtbar": "Food visible",
  "Mensch / Trainer": "Person / trainer",
  "Mehrere Pokémon": "Several Pokémon",
  "Alle Karten des Set-Binders müssen zum gewählten Set und zur gewählten Kartensprache gehören.": "All cards of the set binder must belong to the chosen set and card language.",
  "Das gewählte Binderformat wird nicht unterstützt.": "The chosen binder format is not supported.",
  "Set-ID und Setname sind erforderlich.": "Set ID and set name are required.",
  "Die Kartenanzahlen des Sets sind widersprüchlich.": "The set's card counts are contradictory.",
  "Holofoil, 1st Edition Holofoil oder Unlimited Holofoil": "Holofoil, 1st Edition Holofoil or Unlimited Holofoil",
  "Normal, 1st Edition oder Unlimited": "Normal, 1st Edition or Unlimited",
  "1st Edition oder 1st Edition Holofoil": "1st Edition or 1st Edition Holofoil",
  "Unlimited oder Unlimited Holofoil": "Unlimited or Unlimited Holofoil",
  "Alle passenden Printing-Optionen": "All matching printing options",
  "Near Mint und Lightly Played (TCGplayer kennt keinen Zustand Excellent)": "Near Mint and Lightly Played (TCGplayer has no Excellent condition)",
  "Near Mint und Lightly Played": "Near Mint and Lightly Played",
  "Near Mint, Lightly Played, Moderately Played und Heavily Played": "Near Mint, Lightly Played, Moderately Played and Heavily Played",
  "alle Zustände einschließlich Damaged": "all conditions including Damaged",
  "Die physische Ausgabe ist nicht bestätigt.": "The physical printing is not confirmed.",
  "Name oder Kartennummer ist nicht sicher als einzelne Mass-Entry-Zeile darstellbar.": "Name or card number cannot be safely represented as a single Mass Entry line.",
  "Für dieses TCGdex-Set ist noch kein geprüfter TCGplayer-Set-Code hinterlegt.": "No verified TCGplayer set code is stored for this TCGdex set yet.",
  "Der geprüfte TCGplayer-Name oder die Kartennummer ist nicht sicher als einzelne Mass-Entry-Zeile darstellbar.": "The verified TCGplayer name or card number cannot be safely represented as a single Mass Entry line.",
  "TCGplayer-Name, Set-Code und Kartennummer sind für Mass Entry geprüft.": "TCGplayer name, set code and card number are verified for Mass Entry.",
  "Mehrere TCGplayer-Produkte passen zu dieser Karte. Finish, Edition oder eigene Variantenbezeichnung reichen noch nicht für eine eindeutige Auswahl.": "Several TCGplayer products match this card. Finish, edition or a custom printing label are not enough for a unique choice yet.",
  "Für diese Karte wurde im aktuellen TCGplayer-Katalog kein eindeutiges Produkt mit passender Kartennummer gefunden.": "No unique product with a matching card number was found for this card in the current TCGplayer catalogue.",
  "Der TCGplayer-Produktname oder die Kartennummer ist nicht sicher als einzelne Mass-Entry-Zeile darstellbar.": "The TCGplayer product name or card number cannot be safely represented as a single Mass Entry line.",
  "Produktname, Set-Code und Kartennummer stammen aus dem aktuellen TCGplayer-Katalog.": "Product name, set code and card number come from the current TCGplayer catalogue.",
  "Druckart, Sprache, Zustand und Finish in TCGplayer Mass Entry vor dem Warenkorb prüfen.": "Check printing, language, condition and finish in TCGplayer Mass Entry before adding to the cart.",
  "Die Liste ist für eine vorausgefüllte URL zu lang. Kopiere den Mass-Entry-Text und füge ihn bei TCGplayer ein.": "The list is too long for a prefilled URL. Copy the Mass Entry text and paste it into TCGplayer.",
  "Nicht festgelegt": "Not set",
  "Version nicht festgelegt": "Version not set",
  "Der Katalog enthält für diese Karte keine belastbaren Variantenangaben; Finish bitte anhand der Karte prüfen.": "The catalogue has no reliable variant information for this card; please check the finish against the card itself.",
  "Machamp: First Edition existiert als Holo mit und ohne Schatten; die nicht gestempelte Non-Holo-Ausgabe ist die Trainer-Deck-A-Sonderausgabe.": "Machamp: First Edition exists as a Holo with and without shadow; the unstamped Non-Holo printing is the Trainer Deck A special version.",
  "Das Finish ist nicht belastbar hinterlegt; Edition und Druckvariante sind anhand des Sets begrenzt.": "The finish is not reliably recorded; edition and printing are limited based on the set.",
  "Der Katalog meldet keine besondere Variante.": "The catalogue reports no special variant.",
  "Diese CardTrader-Karte gehört zu keinem geprüften Set.": "This CardTrader card does not belong to any reviewed set.",
  "Die Reihenfolge der semantischen Tags stimmt nicht mit Version 1 überein.": "The order of the semantic tags does not match version 1.",
  "Cardmarket-Decklistenprüfung hat ein ungültiges Format.": "The Cardmarket deck-list check has an invalid format.",
  "Cardmarket-Decklistenprüfung enthält widersprüchliche Summen.": "The Cardmarket deck-list check contains contradictory totals.",
  "Cardmarket-Produktzuordnungen haben ein ungültiges Format.": "The Cardmarket product matches have an invalid format.",
  "Cardmarket-Mapping-Audit stimmt nicht mit den Zuordnungen überein.": "The Cardmarket mapping audit does not match the matches.",
  "TCGplayer-Zuordnungen haben ein ungültiges Format.": "The TCGplayer matches have an invalid format.",
  "Partner-ID oder Anzeigename fehlt.": "Partner ID or display name is missing.",
  "Prüfdatum ist ungültig.": "Review date is invalid.",
  "Externe Ziele müssen HTTPS verwenden.": "External destinations must use HTTPS.",
  "Aktivierter Partner hat keine Ziel-URL.": "An enabled partner has no destination URL.",
  "Aktivierter Partner hat keine Prüfquellen.": "An enabled partner has no review sources.",
  "Prüfquellen müssen HTTPS verwenden.": "Review sources must use HTTPS.",
  "Affiliate-Angebote benötigen eine sichtbare Kennzeichnung.": "Affiliate offers require a visible disclosure.",
  "Personalisierte Angebote müssen Personalisierung ausdrücklich unterstützen.": "Personalised offers must explicitly support personalisation.",
  "Die Binder-Kapazität ist ungültig.": "The binder capacity is invalid.",
  "Das Binder-Seitenformat ist ungültig.": "The binder page format is invalid.",
  "Preis oder Preisstand ist ungültig.": "Price or price date is invalid.",
  "Binder-Partner sind zentral deaktiviert.": "Binder partners are disabled centrally.",
  "Dieses Angebot ist deaktiviert.": "This offer is disabled.",
  "Die Anbieterprüfung ist abgelaufen und muss erneuert werden.": "The provider review has expired and must be renewed.",
  "Binder-Partner-Konfiguration hat ein ungültiges Format.": "The binder partner configuration has an invalid format.",
  "Binder-Partner-Eintrag hat ein ungültiges Format.": "The binder partner entry has an invalid format.",
  "Besondere Ausführung": "Special printing",
  "Ausführung noch offen": "Printing not chosen yet",
  "Zeitpunkt unbekannt": "Date unknown",};

export const patterns: Array<[RegExp, (...matches: string[]) => string]> = [
  /* binder-actions */
  [/^Die Menge muss zwischen 1 und (\d+) liegen\.$/, (max) => `The quantity must be between 1 and ${max}.`],

  /* cardmarket-handoff */
  [/^Variantenangaben prüfen: (.+)$/, (issue) => `Check the printing details: ${translateIssue(issue)}`],
  [/^(.+) · Nr\. (.+) · ([A-Za-z]{2,}) · Zustand: ([^·]+?)( · ID laut CardTrader)?$/, (set, number, language, condition, source) => `${set} · No. ${number} · ${language} · Condition: ${conditionWord(condition)}${source ? " · ID from CardTrader" : ""}`],
  [/^(\d+) Position\(en\) fehlen die für das offizielle Cardmarket-Format benötigten Katalogdaten und wurden nicht in den Importtext aufgenommen\.$/, (count) => `${count} ${count === "1" ? "entry is" : "entries are"} missing the catalogue data required for the official Cardmarket format and ${count === "1" ? "was" : "were"} not included in the import text.`],
  [/^Cardmarket erlaubt höchstens (\d+) Einträge pro Wants-Liste\. Die (\d+) Positionen wurden deshalb in (\d+) Teile aufgeteilt\.$/, (max, total, parts) => `Cardmarket allows at most ${max} entries per Wants list. The ${total} entries were therefore split into ${parts} parts.`],

  /* missing-items-export, placeholders */
  [/^(\d+) Position\(en\) enthalten keine vollständige oder katalogbestätigte Variantenangabe\.$/, (count) => `${count} ${count === "1" ? "entry does" : "entries do"} not contain complete or catalogue-confirmed printing details.`],
  [/^(\d+) Position\(en\) sind nicht als physische Ausgabe bestätigt\.$/, (count) => `${count} ${count === "1" ? "entry is" : "entries are"} not confirmed as a physical printing.`],
  [/^Seite (\d+) · Platz (\d+)$/, (page, slot) => `Page ${page} · Slot ${slot}`],

  /* set-binder-plan */
  [/^Doppelte Karte im Set-Plan: (.+)\.$/, (key) => `Duplicate card in the set plan: ${key}.`],
  [/^Dieser Plan benötigt (\d+) Seiten; erlaubt sind höchstens (\d+)\.$/, (pages, max) => `This plan needs ${pages} pages; at most ${max} are allowed.`],
  [/^Der Katalog liefert (\d+) von erwarteten (\d+) Karten für diesen Umfang\.$/, (found, expected) => `The catalogue provides ${found} of ${expected} expected cards for this scope.`],
  [/^(\d+) Ausgabe\(n\) müssen nach dem Anlegen geprüft werden\.$/, (count) => `${count} ${count === "1" ? "printing needs" : "printings need"} to be checked after the binder is created.`],

  /* tcgplayer-export */
  [/^Manuell abgleichen: (.+)$/, (label) => `Match manually: ${label}`],
  [/^(\d+) Position(?:en)? (?:hat|haben) keinen geprüften TCGplayer-Set-Code und (?:wird|werden) nicht in die TCGplayer-Liste übernommen\.$/, (count) => `${count} ${count === "1" ? "entry has" : "entries have"} no verified TCGplayer set code and ${count === "1" ? "is" : "are"} not included in the TCGplayer list.`],
  [/^(\d+) Position(?:en)? (?:hat|haben) keine eindeutige TCGplayer-Produktzuordnung und (?:wird|werden) nicht in die TCGplayer-Liste übernommen\.$/, (count) => `${count} ${count === "1" ? "entry has" : "entries have"} no unique TCGplayer product match and ${count === "1" ? "is" : "are"} not included in the TCGplayer list.`],
  [/^(\d+) Position(?:en)? (?:ist|sind) nicht sicher zuordenbar und (?:wird|werden) nicht in die TCGplayer-Liste übernommen\.$/, (count) => `${count} ${count === "1" ? "entry cannot" : "entries cannot"} be matched safely and ${count === "1" ? "is" : "are"} not included in the TCGplayer list.`],

  /* variant-selection */
  [/^Das Finish ist nicht belastbar hinterlegt; anhand des Sets sind zusätzlich (.+) möglich\.$/, (options) => `The finish is not reliably recorded; based on the set, ${translateJoined(options, " und ", " and ")} ${options.includes(" und ") ? "are" : "is"} also possible.`],
  [/^Katalog bestätigt: (.+)\.$/, (values) => `Catalogue confirms: ${translateJoined(values, ", ", ", ")}.`],

  /* data loaders */
  [/^Diese CardTrader-Karte gehört zu keinem geprüften Set\.$/, () => "This CardTrader card does not belong to any reviewed set."],
  [/^Kartenlisten konnten nicht geladen werden \(HTTP (\d+)\)\.$/, (status) => `Card lists could not be loaded (HTTP ${status}).`],
  [/^Motivindex konnte nicht geladen werden \(HTTP (\d+)\)\.$/, (status) => `The theme index could not be loaded (HTTP ${status}).`],
  [/^Motivprüfungen konnten nicht geladen werden \(HTTP (\d+)\)\.$/, (status) => `The theme checks could not be loaded (HTTP ${status}).`],
  [/^Cardmarket-Decklistenprüfung konnte nicht geladen werden \(HTTP (\d+)\)\.$/, (status) => `The Cardmarket deck-list check could not be loaded (HTTP ${status}).`],
  [/^Cardmarket-Produktzuordnungen konnten nicht geladen werden \(HTTP (\d+)\)\.$/, (status) => `Cardmarket product matches could not be loaded (HTTP ${status}).`],
  [/^TCGplayer-Zuordnungen konnten nicht geladen werden \(HTTP (\d+)\)\.$/, (status) => `TCGplayer matches could not be loaded (HTTP ${status}).`],
  [/^Binder-Partner konnten nicht geladen werden \(HTTP (\d+)\)\.$/, (status) => `Binder partners could not be loaded (HTTP ${status}).`],

  /* TCGplayer product links */
  [/^(.+) · Nr\. (.+) · TCGplayer zeigt die englische Karte$/, (set, number) => `${set} · No. ${number} · TCGplayer shows the English card`],

  /* aria labels */
  [/^Habe ich: (.+)$/, (name) => `Owned: ${name}`],
  [/^(.+), Slot (\d+)$/, (name, slot) => `${name}, slot ${slot}`],

  /* variant summaries joined with " · " (only when at least one part is known) */
  [new RegExp(`^(?=(?:.+ · )?(?:${variantPartPattern})(?: · |$))(.+)$`), (value) => value.split(" · ").map(translateVariantPart).join(" · ")],
];
