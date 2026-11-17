import { nested } from "./nested";

const finishState: Record<string, string> = {
  "Stern antippen: Holo oder normal?": "Tap the star: Holo or normal?",
};

/* Texts found by comparing everything the app renders with the dictionary. */
export const translations: Record<string, string> = {
  "Hast du schon einen Binder?": "Do you already have a binder?",
  "Nein, ich brauche einen": "No, I need one",
  "Ja, ich habe schon einen": "Yes, I already have one",
  "Meintest du": "Did you mean",
  "oder": "or",
  "Ergänzung": "Supplement",
  "Hilfe und Datenflüsse": "Help and data flows",
  "Hilfe und Datenflüsse · Your Card Binder": "Help and data flows · Your Card Binder",
};

export const patterns: Array<[RegExp, (...matches: string[]) => string]> = [
  [/^Geführtes (.+)$/, (set) => `Guided ${set}`],
  [/^(.+) · (habe ich|fehlt noch)$/, (finish, state) => `${finishState[finish] ?? nested(finish)} · ${state === "habe ich" ? "owned" : "still missing"}`],
  [/^(✓ Vorhanden|✕ Fehlt) · (.+)$/, (state, language) => `${state === "✓ Vorhanden" ? "✓ Owned" : "✕ Missing"} · ${language}`],
  [/^Mindestzustand: (.+)$/, (condition) => `Minimum condition: ${nested(condition)}`],
  [/^Stelle Sprache und Mindestzustand \((.+)\) ein\.$/, (condition) => `Set the language and minimum condition (${nested(condition)}).`],
  [/^Printing: (.+) · Zustand: (.+?)( \(TCGplayer kennt keinen Zustand Excellent\))?$/, (printing, condition, note) => `Printing: ${printing} · Condition: ${condition.replace(/ und /g, " and ")}${note ? " (TCGplayer has no Excellent condition)" : ""}`],
  [/^auf (\d+) Seiten?$/, (pages) => `on ${pages} ${pages === "1" ? "page" : "pages"}`],
  [/^Die geschätzten (.+) liegen über deinem Budget von (.+)\. Auch die günstigste vollständige Auswahl liegt derzeit darüber\. Du kannst Wünsche oder Karten ändern\.$/, (total, budget) => `The estimated ${total} are above your budget of ${budget}. Even the cheapest complete selection is currently above it. You can change your wishes or cards.`],
  [/^(.+) · Seite (\d+) · Platz (\d+)$/, (binder, page, slot) => `${binder} · Page ${page} · Slot ${slot}`],
  [/^Serie: (.+) · Veröffentlicht: (.+) · (\d+) Karten insgesamt \((\d+) regulär \+ (\d+) Secret Rares\)$/, (series, date, total, regular, secret) => `Series: ${series} · Released: ${date} · ${total} cards in total (${regular} regular + ${secret} Secret Rares)`],
  [/^Serie: (.+) · Veröffentlicht: (.+) · (\d+) Karten?$/, (series, date, count) => `Series: ${series} · Released: ${date} · ${count} ${count === "1" ? "card" : "cards"}`],
  [/^(\d+) Position(?:en)? · gekauft wird erst beim Anbieter$/, (count) => `${count} ${count === "1" ? "entry" : "entries"} · you only buy at the provider`],
  [/^(\d+) Seiten? · zuletzt geändert (.+)$/, (pages, date) => `${pages} ${pages === "1" ? "page" : "pages"} · last changed ${date}`],
  [/^(\d+) Karten? werden in Lesereihenfolge neu verteilt\. Dabei ändern (\d+) Karten? ihre Position\. Die Seitenzahl ändert sich von (\d+) auf (\d+)\. Keine Karte wird gelöscht\.$/, (planned, moved, before, after) => `${planned} ${planned === "1" ? "card is" : "cards are"} redistributed in reading order. ${moved} ${moved === "1" ? "card changes" : "cards change"} position. The number of pages changes from ${before} to ${after}. No card is deleted.`],
  [/^ ?Liste „(.+)“ mit (.+) \((.+)\), jeweils mit Menge und Sprache\.$/, (name, pages, cards) => ` List “${name}” with ${nested(pages)} (${nested(cards)}), each with quantity and language.`],
];

/** Tried after every other pattern. */
export const fallbackPatterns: Array<[RegExp, (...matches: string[]) => string]> = [
  // Several parts joined with " · ": translate each part that has an entry.
  [/^(.+ · .+)$/, (joined) => {
    const parts = joined.split(" · ");
    const translated = parts.map((part) => nested(part));
    return translated.every((part, index) => part === parts[index]) ? joined : translated.join(" · ");
  }],
];
