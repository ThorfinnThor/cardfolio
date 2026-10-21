"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type AppLocale = "de" | "en";

import { DISCLAIMER } from "@/content/disclaimer";

import { fixedLocaleForPath } from "./fixed-locale";

const LOCALE_STORAGE_KEY = "cardfolio-locale";

const translations: Record<string, string> = {
  "Wunschbinder · lokal": "Wish binders · local",
  "Meine Binder": "My binders",
  "Karten kaufen": "Buy cards",
  "Karte suchen": "Search cards",
  "Karte auswählen": "Choose a card",
  "Karte hinzufügen": "Add card",
  "Karte einsetzen": "Add card",
  "Karte entfernen": "Remove card",
  "Karte austauschen": "Replace card",
  "Binder umbenennen": "Rename binder",
  "Binder bearbeiten": "Edit binder",
  "Binder löschen": "Delete binder",
  "Binder duplizieren": "Duplicate binder",
  "Binder erstellen": "Create binder",
  "Binder auswählen": "Choose binder",
  "Binder bestellen": "Order binder",
  "Binder kaufen": "Buy binder",
  "Diesen Binder bestellen": "Order this binder",
  "Passenden Binder bestellen": "Order a matching binder",
  "Der Binder für deine Karten": "The binder for your cards",
  "Physischen Binder kaufen": "Buy the physical binder",
  "Backup exportieren": "Export backup",
  "Kauf-Anleitung": "Buying guide",
  "Auf dieser Seite": "On this page",
  "Anleitung": "Guide",
  "Anleitung mit Bildern": "Illustrated guide",
  "Hilfe": "Help",
  "Einstellungen": "Settings",
  "Ich sammle selbst": "I collect cards myself",
  "Lokal gespeichert": "Saved locally",
  "Hauptnavigation": "Main navigation",
  "Übersicht": "Overview",
  "Zurück": "Back",
  "Weiter": "Continue",
  "Abbrechen": "Cancel",
  "Schließen": "Close",
  "Löschen": "Delete",
  "Auswählen": "Choose",
  "Ausgewählt": "Selected",
  "Ändern": "Change",
  "Bearbeiten": "Edit",
  "Prüfen": "Review",
  "Details": "Details",
  "Speichern": "Save",
  "Rückgängig": "Undo",
  "Erneut versuchen": "Try again",
  "Aktuellen Stand laden": "Load current version",
  "Alle Filter zurücksetzen": "Reset all filters",
  "Suche löschen": "Clear search",
  "Weitere Filter": "More filters",
  "Kartensprache": "Card language",
  "Deutsch": "German",
  "Englisch": "English",
  "Alle": "All",
  "Serie": "Series",
  "Set": "Set",
  "Alle Serien": "All series",
  "Alle Sets": "All sets",
  "Sortierung": "Sort order",
  "Relevanz": "Relevance",
  "Neueste zuerst": "Newest first",
  "Älteste zuerst": "Oldest first",
  "Name / Nummer": "Name / number",
  "Motiv im Artwork": "Artwork theme",
  "Bildmotiv": "Artwork theme",
  "Nach Bildmotiv": "By artwork theme",
  "Komplettes Set": "Complete set",
  "Selbst gestalten": "Design your own",
  "Als Geschenk": "As a gift",
  "Empfohlen": "Recommended",
  "empfohlen": "recommended",
  "Karten entdecken": "Discover cards",
  "Ergebnisse": "Results",
  "Keine Ergebnisse": "No results",
  "Kein Bild": "No image",
  "Freier Platz": "Empty slot",
  "Freie Plätze": "Empty slots",
  "Seite hinzufügen": "Add page",
  "Seite duplizieren": "Duplicate page",
  "Seite löschen": "Delete page",
  "Seite verschieben": "Move page",
  "Seitentitel": "Page title",
  "Seitennotiz": "Page note",
  "Seitenansicht": "Page view",
  "Vorhanden": "Owned",
  "Fehlend": "Missing",
  "Fehlende Karten": "Missing cards",
  "Geplant": "Planned",
  "Ausgewählte Karten": "Selected cards",
  "Geschätzter Kartenwert": "Estimated card value",
  "Geschätzte Preisspanne": "Estimated price range",
  "Preis unbekannt": "Price unavailable",
  "Ohne Preis": "Without price",
  "Preise sind Schätzungen ohne Versand und Steuern. Das Budget ist keine Kaufzusage.": "Prices are estimates excluding shipping and taxes. The budget is not a purchase commitment.",
  "Bestellwunsch für alle Karten": "Purchase preference for all cards",
  "Zustand für alle": "Condition for all cards",
  "Gewünschter Kartenzustand": "Preferred card condition",
  "Was bedeutet der Kartenzustand?": "What do card conditions mean?",
  "Zustand wählen": "Choose condition",
  "Anbieter wählen": "Choose marketplace",
  "Liste öffnen": "Open list",
  "Kartenliste öffnen": "Open card list",
  "Vorbereitete Kartenliste öffnen": "Open prepared card list",
  "Karten jetzt kaufen": "Buy cards now",
  "Wo möchtest du die Karten kaufen?": "Where would you like to buy the cards?",
  "Wo wohnst du?": "Where do you live?",
  "Europa & UK": "Europe & UK",
  "USA & Kanada": "USA & Canada",
  "Andere Region": "Other region",
  "Cardmarket empfohlen": "Cardmarket recommended",
  "TCGplayer empfohlen": "TCGplayer recommended",
  "Versand prüfen": "Check shipping",
  "Zustand und Ausführung sind vorbereitet. Wähle einen Kartenanbieter und folge dort der gemeinsamen Einkaufsliste.": "Condition and printing are prepared. Choose a marketplace and follow the combined shopping list there.",
  "Wähle zuerst deine Region. Your Card Binder empfiehlt dir danach den passenden Marktplatz – ohne deinen Standort abzufragen.": "Choose your region first. Your Card Binder will then recommend a suitable marketplace without requesting your location.",
  "Unsere Empfehlung für Geschenke:": "Our gift recommendation:",
  "Sehr gut – kleine Spuren okay (empfohlen)": "Very good – minor wear is okay (recommended)",
  "Wie neu – möglichst ohne sichtbare Spuren": "Like new – ideally no visible wear",
  "Gebraucht – deutliche Spuren okay": "Used – visible wear is okay",
  "Sehr gut": "Very good",
  "Wie neu": "Like new",
  "Gebraucht": "Used",
  "kleine Spuren sind okay, ohne unnötig nur die teuersten Angebote zuzulassen.": "minor wear is acceptable without limiting the search to only the most expensive listings.",
  "Bestellbereit": "Ready to order",
  "Bestellangaben ändern": "Change order details",
  "Aktion erforderlich": "Action required",
  "Jetzt Ausführung prüfen": "Review printing now",
  "Bitte prüfen": "Please review",
  "Ausführung": "Printing",
  "Ausführung und Zustand wählen": "Choose printing and condition",
  "Sprache": "Language",
  "Druckvariante": "Printing",
  "Zustand": "Condition",
  "Edition": "Edition",
  "Mit Schatten / Standard": "Shadowed / standard",
  "Ohne Schatten": "Shadowless",
  "Unlimitiert / Standard": "Unlimited / standard",
  "Erste Edition": "First edition",
  "Non-Holo / Normal": "Non-holo / normal",
  "Reverse Holo": "Reverse holo",
  "Normal": "Normal",
  "Holo": "Holo",
  "Wünsche": "Preferences",
  "Karten auswählen": "Choose cards",
  "Bestellung prüfen": "Review order",
  "Karten & Binder": "Cards & binder",
  "Deine erste Binder-Seite": "Your first binder page",
  "So könnte sie aussehen. Du kannst Karten austauschen und danach alle mit einem Klick für die Bestellung vorbereiten.": "Here is what it could look like. You can replace cards, then prepare all of them for ordering with one click.",
  "Empfehlung übernehmen und weiter": "Use recommendation and continue",
  "Das fehlt noch vor dem nächsten Schritt": "One step before you continue",
  "Ausführung und Zustand sind vorbereitet. Wenn alles passt, gehst du direkt zur Bestellprüfung. Änderungen bleiben an jeder Karte möglich.": "Printing and condition are prepared. If everything looks right, continue to the order review. You can still change any card.",
  "Für alle Karten ist eine passende Standardausführung vorausgewählt.": "A suitable standard printing has been preselected for every card.",
  "Ein Geschenk, das persönlich wird": "A gift made personal",
  "Ein Binder voller Karten vom Lieblings-Pokémon.": "A binder filled with cards of their favourite Pokémon.",
  "Such das Pokémon aus. Wir stellen neun passende Karten zu einer Binder-Seite zusammen und zeigen dir, wo du sie kaufst.": "Choose the Pokémon. We create a nine-card binder page and show you where to buy the cards.",
  "So entsteht dein Geschenk-Binder": "How your gift binder comes together",
  "Ein Pokémon-Binder als persönliches Geschenk.": "A personal Pokémon card binder as a gift.",
  "Wähle ein Lieblings-Pokémon oder Bildmotiv. Wir schlagen passende Karten vor und führen dich bis zur Einkaufsliste.": "Choose a favourite Pokémon or an artwork theme. We suggest matching cards and guide you all the way to the shopping list.",
  "Geschenk-Binder gestalten": "Create a gift binder",
  "Ohne Konto starten · Karten später austauschen · lokal gespeichert": "Start without an account · replace cards later · saved locally",
  "Pokémon oder Motiv wählen": "Choose a Pokémon or theme",
  "Karten und Seite ansehen": "Review cards and page",
  "Binder und Karten besorgen": "Buy binder and cards",
  "So kann eine fertige Binder-Seite aussehen.": "Here is what a finished binder page can look like.",
  "Wähle ein Beispiel. Im nächsten Schritt kannst du Sprache, Kartenanzahl und Budget noch ändern.": "Choose an example. In the next step, you can adjust the language, number of cards and budget.",
  "Eine Glurak-Binder-Seite": "A Charizard binder page",
  "Ein Glurak-Binder": "A Charizard binder",
  "Ein Pikachu-Binder": "A Pikachu binder",
  "Ein Evoli-Binder": "An Eevee binder",
  "Kräftig & feurig": "Bold & fiery",
  "Fröhlich & ikonisch": "Cheerful & iconic",
  "Sanft & verspielt": "Gentle & playful",
  "Mit Glurak starten": "Start with Charizard",
  "Mit Pikachu starten": "Start with Pikachu",
  "Mit Evoli starten": "Start with Eevee",
  "Ein Binder rund um Glurak – von klassischen Motiven bis zu modernen Karten.": "A binder devoted to Charizard, from classic artwork to modern cards.",
  "Neun unterschiedliche Pikachu-Karten als sofort verständliches Geschenk.": "Nine different Pikachu cards in a gift that makes immediate sense.",
  "Eine abwechslungsreiche Evoli-Seite mit hellen, ruhigen und nostalgischen Artworks.": "A varied Eevee page with bright, calm and nostalgic artwork.",
  "Gekauft wird beim Marktplatz. Wir bereiten die Liste vor.": "You buy on the marketplace. We prepare the list.",
  "Your Card Binder bereitet Karte, Set, Nummer, Sprache, Ausführung und Zustand vor. Cardmarket oder TCGplayer zeigen dir anschließend passende Angebote. Den Endpreis inklusive Versand bestätigst du erst dort.": "Your Card Binder prepares the card, set, number, language, printing and condition. Cardmarket or TCGplayer then show matching listings. You confirm the final price including shipping there.",
  "Zustand vorher festlegen": "Set the condition in advance",
  "Der gewählte Mindestzustand bleibt bei jeder Karte sichtbar.": "The selected minimum condition remains visible for every card.",
  "Die richtige Karte bestellen": "Order the correct card",
  "Set, Nummer und Ausführung führen direkt zur passenden Karte.": "The set, number and printing help you find the correct card.",
  "Your Card Binder verkauft oder authentifiziert keine Karten. Verfügbarkeit, Endpreis, Käuferschutz und Echtheit prüfst du beim gewählten Marktplatz.": "Your Card Binder does not sell or authenticate cards. Check availability, final price, buyer protection and authenticity on your chosen marketplace.",
  "Vorhandenen Binder aus Backup laden": "Load an existing binder from a backup",
  "Alles bleibt in deinem Browser – kein Konto, keine Cloud.": "Everything stays in your browser – no account and no cloud.",
  "Zur Geschenk-Startseite": "Go to gift home",
  "Your Card Binder – zur Geschenk-Startseite": "Your Card Binder – go to gift home",
  "Anleitung: Karten bei Cardmarket kaufen (öffnet in neuem Tab)": "Guide: buying cards on Cardmarket (opens in a new tab)",
  "Binderverwaltung öffnen": "Open binder manager",
  "Zum dunklen Modus wechseln": "Switch to dark mode",
  "Zum hellen Modus wechseln": "Switch to light mode",
  "Nacht-Modus": "Dark mode",
  "Tag-Modus": "Light mode",
  "Günstige Angebote finden": "Find competitive offers",
  "Preise und Versand beim Marktplatz transparent prüfen.": "Compare prices and shipping transparently on the marketplace.",
  "Kartenzustand verstehen": "Understand card condition",
  "Originale Karten gezielt auswählen": "Choose authentic cards with confidence",
  "Was mag die beschenkte Person?": "What does the recipient like?",
  "Dein Geschenk-Binder beginnt hier": "Your gift binder starts here",
  "Sag uns, was die Person mag. Wir zeigen dir sofort einen fertigen Vorschlag.": "Tell us what they like. We’ll show you a complete suggestion right away.",
  "Geschenk-Gestaltung schließen": "Close gift builder",
  "Schritte zum Geschenk-Binder": "Gift binder steps",
  "Motiv wählen": "Choose a theme",
  "Seite ansehen": "Review the page",
  "Besorgen": "Buy everything",
  "Ein Lieblings-Pokémon": "A favourite Pokémon",
  "Ich kenne mich nicht aus": "I’m not sure",
  "Ein Bildmotiv": "An artwork theme",
  "Lieblings-Pokémon": "Favourite Pokémon",
  "Oder wähle ein beliebtes Pokémon": "Or choose a popular Pokémon",
  "Suche mit dem deutschen Namen, zum Beispiel Glurak.": "Search using the German name, for example Glurak.",
  "Suche mit dem deutschen Namen, zum Beispiel Glurak. Mehrere Pokémon trennst du mit Komma, bis zu vier.": "Search using the German name, for example Glurak. Separate several Pokémon with a comma, up to four.",
  "Suche mit dem englischen Namen, zum Beispiel Charizard.": "Search using the English name, for example Charizard.",
  "Zeigt deutsche Kartennamen.": "Shows German card names.",
  "Zeigt englische Kartennamen.": "Shows English card names.",
  "Kartensprache Zeigt deutsche Kartennamen.": "Card language. Shows German card names.",
  "Kartensprache Zeigt englische Kartennamen.": "Card language. Shows English card names.",
  "Welche Karten?": "Which cards?",
  "Alt und neu gemischt": "A mix of old and new",
  "Eher alte Karten (bis 2009)": "Mostly older cards (up to 2009)",
  "Eher moderne Karten (ab 2010)": "Mostly modern cards (from 2010)",
  "Wie viele Karten?": "How many cards?",
  "Budget für die Karten": "Card budget",
  "Die Karten kosten zusammen etwa so viel, aber nie mehr (ohne Versand).": "The cards should cost around this amount in total, but never more (excluding shipping).",
  "Budget für die Karten Die Karten kosten zusammen etwa so viel, aber nie mehr (ohne Versand).": "Card budget. The cards should cost around this amount in total, but never more (excluding shipping).",
  "Alles bleibt in diesem Browser. Kartenpreise sind unverbindliche Schätzungen ohne Versand und Steuern. Das Budget ist eine Orientierung.": "Everything stays in this browser. Card prices are non-binding estimates excluding shipping and taxes. The budget is a guide.",
  "Kartensprache ändern": "Change card language",
  "Binder-Seite ansehen": "View binder page",
  "Weitere Wünsche für das Geschenk": "More gift preferences",
  "optional": "optional",
  "Für wen?": "Who is it for?",
  "Freund/in": "Friend",
  "Kind": "Child",
  "Partner/in": "Partner",
  "Anlass": "Occasion",
  "Geburtstag": "Birthday",
  "Weihnachten": "Christmas",
  "Andere Gelegenheit": "Other occasion",
  "Name": "Name",
  "Wie sollen wir Karten finden?": "How should we find cards?",
  "Nach Pokémonname": "By Pokémon name",
  "Nach Artwork-Motiv": "By artwork theme",
  "Umfang": "Size",
  "Stil": "Style",
  "Mix": "Mix",
  "Vintage": "Vintage",
  "Modern": "Modern",
  "Kuratiert": "Curated",
  "Maximales Budget": "Maximum budget",
  "Budgettoleranz": "Budget tolerance",
  "Vorschläge erstellen": "Create suggestions",
  "Wünsche ändern": "Change preferences",
  "Alle passenden Karten ansehen": "View all matching cards",
  "Trefferliste schließen": "Close results",
  "Noch 1 Karte auswählen": "Choose 1 more card",
  "Erste offene Karte prüfen": "Review first unresolved card",
  "Ausführung wurde automatisch gewählt": "Printing selected automatically",
  "Der Browser hat den externen Anbieteraufruf blockiert. Erlaube Pop-ups oder öffne den Link nach erneuter Auswahl.": "Your browser blocked the external shop. Allow pop-ups or select the link again.",
  "Zum fertigen Geschenk fehlen noch 2 Käufe": "Two purchases remain to complete the gift",
  "Den physischen Binder bestellen · 2. Die Karten besorgen": "Order the physical binder · 2. Buy the cards",
  "Der digitale Plan ist gespeichert. Kaufe jetzt den passenden leeren Binder und öffne danach die vorbereitete Kartenliste.": "Your digital plan is saved. Order a suitable empty binder, then open the prepared card list.",
  "Passender Binder bestellen": "Order a suitable binder",
  "Dieser Binder passt zum 3×3-Seitenplan.": "This binder matches the 3×3 page layout.",
  "Passt zu deinem Plan": "Matches your plan",
  "9 Karten = 1 Binder-Seite.": "9 cards = 1 binder page.",
  "Wähle einen Anbieter und übernimm die vorbereitete Einkaufsliste.": "Choose a marketplace and use the prepared shopping list.",
  "Aktuellen Preis, Verfügbarkeit und Versand prüfst du im Shop.": "Check the current price, availability and shipping in the shop.",
  "Preis geprüft am": "Price checked on",
  "Platz für bis zu 360 Karten": "Holds up to 360 cards",
  "Bei Amazon bestellen": "Order on Amazon",
  "Werbelink: Your Card Binder kann bei einem Kauf eine Provision erhalten. Dein Preis bleibt gleich.": "Affiliate link: Your Card Binder may earn a commission from your purchase. Your price stays the same.",
  "Drucken / als PDF speichern": "Print / save as PDF",
  "Textzusammenfassung herunterladen": "Download text summary",
  "Grußtext für die lokale Druckansicht": "Message for the local print view",
  "Viel Freude mit deinem Binder!": "Enjoy your binder!",
  "So geht es mit deinem Geschenk weiter": "How to complete your gift",
  "Dein Geschenk-Binder ist geplant.": "Your gift binder is planned.",
  "Nur einmal klicken – nicht jede Karte einzeln suchen": "One click – no need to search for every card",
  "Liste kopiert – Cardmarket öffnen": "List copied – open Cardmarket",
  "Schritt für Schritt": "Step by step",
  "Wir zeigen dir immer nur den nächsten Schritt.": "We show you one step at a time.",
  "Cardmarket öffnet sich in einem neuen Tab. Kehre danach zu Your Card Binder zurück und bestätige den erledigten Schritt.": "Cardmarket opens in a new tab. Return to Your Card Binder afterwards and confirm the completed step.",
  "Karten einfügen": "Paste cards",
  "Zustand setzen": "Set condition",
  "Kauf prüfen": "Review purchase",
  "Kopierte Karten bei Cardmarket einfügen": "Paste the copied cards into Cardmarket",
  "Karten sind eingefügt": "Cards are pasted",
  "Liste erneut kopieren & Cardmarket öffnen": "Copy list again & open Cardmarket",
  "Falls etwas nicht klappt": "If something does not work",
  "Importliste kopieren oder als Datei speichern": "Copy the import list or save it as a file",
  "Einzelne Karten suchen": "Search single cards",
  "Wichtige Hinweise anzeigen": "Show important information",
  "Alle fehlenden Karten als Liste": "All missing cards as a list",
  "Anbieter": "Marketplace",
  "Cardmarket oder CardTrader? Der Unterschied": "Cardmarket or CardTrader? The difference",
  "Alle Karten sind für den Decklistenimport vorbereitet": "All cards are prepared for deck-list import",
  "Mass Entry vorbereiten": "Prepare Mass Entry",
  "Karten sicher öffnen": "Open cards safely",
  "Wishlist-Freigabe ausstehend": "Wishlist access pending",
  "Weitere Exportmöglichkeiten": "More export options",
  "Liste kopieren": "Copy list",
  "Hilfe, Datenflüsse und Hinweise": "Help, data flows and notices",
  "Keine Cloud-Synchronisierung. Sichere wichtige Binder regelmäßig als JSON-Datei.": "No cloud sync. Back up important binders regularly as a JSON file.",
  "Zurück zu Your Card Binder": "Back to Your Card Binder",
  "← Zurück zu Your Card Binder": "← Back to Your Card Binder",
  "Hilfe und Datenflüsse · Your Card Binder": "Help and data flows · Your Card Binder",
  "Karten bei Cardmarket kaufen – Anleitung · Your Card Binder": "Buying cards on Cardmarket – guide · Your Card Binder",
  "Pokémon-Binder verschenken · Your Card Binder": "Gift a Pokémon card binder · Your Card Binder",
  "Hilfe und Transparenz": "Help and transparency",
  "Was Your Card Binder speichert und verbindet": "What Your Card Binder stores and connects to",
  "Your Card Binder ist ein lokaler Wunschbinder. Es gibt kein Konto und keine Cloud-Synchronisierung.": "Your Card Binder is a local wish-binder tool. There is no account and no cloud sync.",
  "Lokale Speicherung und Backup": "Local storage and backup",
  "Binder, Positionen, Besitzstatus und die zuletzt geladenen Kartendaten liegen in IndexedDB dieses Browsers. Andere Geräte, Browserprofile, Domains und Preview-Adressen sehen diese Daten nicht.": "Binders, card positions, ownership status and recently loaded card data are stored in this browser’s IndexedDB. Other devices, browser profiles, domains and preview addresses cannot access this data.",
  "Browserdaten können gelöscht werden. Exportiere wichtige Binder regelmäßig als JSON-Datei. Bei einem Domainwechsel zuerst auf der alten Adresse exportieren und anschließend auf der neuen Adresse importieren.": "Browser data can be deleted. Export important binders as JSON regularly. Before changing domains, export from the old address and import on the new one.",
  "Netzwerkverbindungen": "Network connections",
  "Der Hosting-Anbieter erhält technisch notwendige Verbindungsdaten beim Aufruf der statischen Website.": "The hosting provider receives technically necessary connection data when the static website is opened.",
  "Suche und Kartendetails werden direkt vom Browser bei TCGdex abgerufen.": "Search results and card details are requested directly from TCGdex by your browser.",
  "Suche und Kartendetails werden direkt vom Browser bei": "Search results and card details are requested directly from",
  "abgerufen.": "by your browser.",
  "Kartenbilder werden direkt von assets.tcgdex.net geladen und nicht von Your Card Binder kopiert oder in Backups gespeichert.": "Card images are loaded directly from assets.tcgdex.net and are not copied by Your Card Binder or stored in backups.",
  "Kartenbilder werden direkt von": "Card images are loaded directly from",
  "geladen und nicht von Your Card Binder kopiert oder in Backups gespeichert.": "and are not copied by Your Card Binder or stored in backups.",
  "Marketplace-Seiten werden nur nach einem eigenen Klick geöffnet. Your Card Binder meldet sich dort nicht an und führt keinen Kauf aus.": "Marketplace pages open only after you click. Your Card Binder does not sign in or make a purchase there.",
  "Der aktuelle P0-Build verwendet keine Analyse-, Werbe- oder Chat-Skripte und setzt keine eigenen Login-Cookies.": "The current P0 build uses no analytics, advertising or chat scripts and sets no login cookies of its own.",
  "Grenzen der Daten": "Data limitations",
  "Anleitung zum Kauf": "Buying guide",
  "Marken, Bilder und Anbieter": "Brands, images and providers",
  "Anleitung zum Kauf bei Cardmarket": "Cardmarket buying guide",
  "Ein neues Binder-Projekt": "A new binder project",
  "Geschenk-Binder": "Gift binder",
  "Motiv-Binder": "Theme binder",
  "Set-Binder": "Set binder",
  "Leerer Binder": "Blank binder",
  "Set suchen": "Search sets",
  "Binder mit einem Set erstellen": "Create a binder from a set",
  "Kartensprache und Umfang wählen. Vor dem Speichern siehst du Kartenanzahl, Seiten und offene Varianten.": "Choose card language and size. Before saving, you’ll see the card count, pages and unresolved printings.",
  "Komplettes Set (inkl. Secret Rares)": "Complete set (including secret rares)",
  "Eine Ausgabe pro Karte": "One printing per card",
  "Set prüfen": "Review set",
  "Binder speichern": "Save binder",
  "Fehler beim Laden": "Loading failed",
  "Noch einmal versuchen": "Try again",
  "Noch keine Binder": "No binders yet",
  "Starte mit einem Geschenk, Motiv, Set oder einem leeren Binder.": "Start with a gift, theme, set or blank binder.",
  "Neuen Binder erstellen": "Create a new binder",
  "Kartennamen oder Nummer suchen": "Search by card name or number",
  "Suche nach einer Karte, einem Set oder einem Bildmotiv.": "Search for a card, set or artwork theme.",
  "Entdecke Karten aus dem Katalog. Suche oder filtere weiter, wenn du eine bestimmte Karte suchst.": "Discover cards from the catalogue. Search or use filters when you’re looking for a specific card.",
  "Name oder Nummer, z. B. Glurak": "Name or number, e.g. Charizard",
  "Binderbeschreibung": "Binder description",
  "Worum geht es in diesem Binder?": "What is this binder about?",
  "Automatische lokale Speicherung": "Saved locally automatically",
  "Dein Geschenk wartet": "Your gift is waiting",
  "Dein Geschenk wartet noch auf dich": "Your gift is still waiting for you",
  "Karten fehlen noch.": "cards are still missing.",
  "Weiter zum Einkauf": "Continue to shopping",
  "So könnte deine erste Seite aussehen": "Here is what your first page could look like",
  "Eine Binder-Seite nach Bildmotiv gestalten.": "Create a binder page around an artwork theme.",
  "Wähle zum Beispiel Meer, Wald, Schnee oder Himmel. Your Card Binder stellt daraus eine passende Seite mit Kartenbildern zusammen.": "Choose a theme such as the sea, forest, snow or sky. Your Card Binder creates a matching page from card artwork.",
  "Bildmotiv auswählen": "Choose an artwork theme",
  "Wähle ein Set, die Kartensprache und ob Secret Rares dazugehören. Your Card Binder plant Seiten und freie Plätze automatisch.": "Choose a set, card language and whether to include secret rares. Your Card Binder plans pages and empty slots automatically.",
  "Mit einem Set starten": "Start with a set",
  "Freier Binder": "Blank binder",
  "Binder selbst gestalten.": "Design your own binder.",
  "Starte leer und suche danach jede Karte selbst aus. Seiten, Reihenfolge und Karten lassen sich jederzeit ändern.": "Start with a blank binder and choose every card yourself. You can change pages, order and cards at any time.",
  "Wie soll dein Binder heißen?": "What should your binder be called?",
  "Binder anlegen": "Create binder",
  "Deine Sammlung": "Your collection",
  "Hier kannst du weitergestalten": "Continue designing here",
  "Eigene Reihenfolge · mit den Pfeilen anpassen": "Custom order · adjust with the arrows",
  "So könnte sie aussehen. Tippe eine Karte an, um sie genauer zu sehen, oder tausche sie aus.": "Here is what it could look like. Select a card to inspect or replace it.",
  "Dein Geschenk-Binder ist fertig geplant": "Your gift binder is planned",
  "Jetzt fehlen nur noch der Binder und die Karten. Beides bestellst du in zwei Schritten bei Shops.": "Only the binder and cards remain. You order them from shops in two steps.",
  "Versand und Steuern sind nicht enthalten.": "Shipping and taxes are not included.",
  "Karten und physischer Binder sind getrennte Käufe.": "Cards and the physical binder are separate purchases.",
  "Bestellangaben vollständig · Zustand:": "Order details complete · condition:",
  "Die Bestellangaben sind bereits sinnvoll vorausgewählt. Passe sie an, wenn du eine andere Ausführung möchtest.": "Sensible order details are already selected. Change them if you prefer another printing.",
  "Artwork lokal prüfen": "Review artwork locally",
  "Kein Problem – diese Pokémon kennt fast jeder. Du kannst später jede einzelne Karte austauschen.": "No problem – these Pokémon are widely recognised. You can replace every card later.",
  "Wähle ein Motiv für die Seite": "Choose a theme for the page",
  "Zum Beispiel Meer, Wald oder Schnee. Wir zeigen Karten, auf denen das Motiv im Bild zu sehen ist.": "For example the sea, forest or snow. We show cards where the theme appears in the artwork.",
  "Motivseiten nutzen derzeit englische Kartenbilder. Du kannst später jede Karte austauschen.": "Theme pages currently use English card images. You can replace every card later.",
  "Karten werden gesucht…": "Searching for cards…",
  "Die Preisprüfung ist derzeit noch deaktiviert. Karten können trotzdem ausgewählt und als normaler Binder gespeichert werden; es gibt keine Budgetzusage.": "Price checks are currently unavailable. Cards can still be selected and saved as a regular binder; the budget is not guaranteed.",
  "Schätzwert – den endgültigen Preis siehst du beim Kartenanbieter.": "Estimate – you’ll see the final price on the marketplace.",
  "Zustand für alle Karten": "Condition for all cards",
  "Auch englische Karten suchen": "Include English cards",
  "+ Karte hinzufügen": "+ Add card",
  "Die Zielanzahl ist erreicht. Entferne zuerst oben eine Karte, um hier eine andere hinzuzufügen.": "The target card count is reached. Remove a card above before adding another one.",
  "Wird gespeichert…": "Saving…",
  "Alle Geschenkangaben bleiben lokal in diesem Browser.": "All gift preferences stay locally in this browser.",
  "Die Bildschirmansicht zeigt verfügbare Katalogbilder. Druckansicht und Textdatei enthalten nur Kartenangaben und keine Pokémon-Kartenbilder oder Logos. Persönliche Fotos werden nicht hochgeladen.": "The on-screen view shows available catalogue images. The print view and text file contain card details only, with no Pokémon card images or logos. Personal photos are not uploaded.",
  "Region wählen": "Choose region",
  "Wir empfehlen den passenden Anbieter": "We recommend a suitable marketplace",
  "Alle Karten gemeinsam vorbereiten": "Prepare all cards together",
  "Preis und Versand beim Anbieter prüfen": "Check price and shipping on the marketplace",
  "Kopieren wurde vom Browser nicht erlaubt. Nutze stattdessen TXT oder CSV.": "Your browser did not allow copying. Use TXT or CSV instead.",
  "Für Geschenke vorbereitet": "Prepared for gifts",
  "Die Auswahl gilt für alle Karten. Einzelne Ausnahmen kannst du weiter unten ändern.": "This selection applies to every card. You can change individual exceptions below.",
  "Andere Region · Versand prüfen": "Other region · check shipping",
  "Du kaufst bei Cardmarket.": "You buy on Cardmarket.",
  "Es ist der größte Marktplatz für Pokémon-Karten in Europa.": "It is Europe’s largest marketplace for Pokémon cards.",
  "Ein Klick genügt. Wir empfehlen den passenden Marktplatz, ohne deinen Standort abzufragen.": "One click is enough. We recommend a suitable marketplace without requesting your location.",
  "Die passende Einkaufshilfe steht direkt unter diesem Abschnitt.": "The matching buying guide appears directly below this section.",
  "Anderen Anbieter wählen": "Choose another marketplace",
  "Anbieter selbst wählen": "Choose marketplace yourself",
  "Verfügbarkeit und Versand unterscheiden sich je nach Region.": "Availability and shipping differ by region.",
  "Für USA & Kanada · Mass Entry vorbereiten": "For USA & Canada · prepare Mass Entry",
  "Für Europa & UK · Kartenliste vorbereiten": "For Europe & UK · prepare card list",
  "Vor der Übergabe prüfen": "Review before handoff",
  "Prüfe Kartenname, Set, vollständige Nummer, Sprache, Printing und Zustand.": "Review card name, set, full number, language, printing and condition.",
  "Erst anschließend lässt du TCGplayer externe Angebote in den Warenkorb legen.": "Only then should you let TCGplayer add external listings to the cart.",
  "Karten gemeinsam übertragen": "Transfer cards together",
  "Die Liste ist vorbereitet. Folge jetzt der Anleitung.": "The list is ready. Follow the guide now.",
  "Anleitung · 4 Schritte": "Guide · 4 steps",
  "Cardmarket-Anleitung": "Cardmarket guide",
  "Erledige nur die groß angezeigte Aufgabe. Danach kommst du zu Your Card Binder zurück und klickst auf „Weiter“.": "Complete only the large task shown. Then return to Your Card Binder and select “Continue”.",
  "Fortschritt der Cardmarket-Anleitung": "Cardmarket guide progress",
  "Liste kopieren und Cardmarket öffnen": "Copy list and open Cardmarket",
  "Der große Button kopiert alle vorbereiteten Karten. Du musst keine Karte einzeln suchen.": "The large button copies every prepared card. You do not need to search for cards individually.",
  "Der Kauf wird nicht automatisch ausgelöst.": "No purchase is made automatically.",
  "Mindestzustand für alle Karten einstellen": "Set the minimum condition for all cards",
  "Cardmarket zeigt nach dem Import zunächst ≥ PO": "Cardmarket initially shows ≥ PO after import",
  "Das bedeutet „Poor oder besser“. Ändere es jetzt einmal gesammelt auf den in Your Card Binder gewählten Zustand.": "This means “Poor or better”. Change it once for all cards to the condition selected in Your Card Binder.",
  "Die Karten haben unterschiedliche Zustandswünsche.": "The cards have different condition preferences.",
  "Stelle sie bei Cardmarket gruppenweise gemäß den Your Card Binder-Angaben ein.": "Set them in groups on Cardmarket according to the Your Card Binder details.",
  "Alle Karten markieren": "Select all cards",
  "Zustand ist eingestellt": "Condition is set",
  "Ergebnis prüfen und gemeinsam kaufen": "Review the result and buy together",
  "Kontrolliere Endpreis, Versand, Sprache und Kartenausführung.": "Check the final price, shipping, language and printing.",
  "Cardmarket öffnen und Shopping Wizard starten": "Open Cardmarket and start the Shopping Wizard",
  "Preise, Versand und die endgültige Kartenauswahl bestätigst du erst bei Cardmarket.": "You confirm prices, shipping and the final card selection on Cardmarket.",
  "Die sicheren Suchlinks bleiben verfügbar.": "Safe search links remain available.",
  "Cardmarket-Importtext · exakt eine Karte pro Zeile": "Cardmarket import text · exactly one card per line",
  "Keine fehlenden Karten": "No missing cards",
  "Leere Slots und vorhandene Karten werden nicht als Bedarf gezählt.": "Empty slots and owned cards are not counted as needed.",
  "Name, Set oder Nummer": "Name, set or number",
  "Für Tabellen oder ein eigenes Backup der gefilterten Liste.": "For spreadsheets or your own backup of the filtered list.",
  "Keine Treffer für diesen Filter": "No results for this filter",
  "Passe den Suchbegriff an oder lösche den Filter.": "Adjust the search term or clear the filter.",
  "Zustand & Sprache": "Condition & language",
  "Verkäufer wählen": "Choose sellers",
  "Mit Bildern erklärt ansehen": "View illustrated guide",
  "So bekommst du die Karten": "How to buy the cards",
  "Erledige immer nur die große Aufgabe. Danach kommst du hierher zurück.": "Complete only the large task shown, then return here.",
  "Fortschritt der Kaufanleitung": "Buying guide progress",
  "Einkaufsliste kopieren und Cardmarket öffnen": "Copy shopping list and open Cardmarket",
  "Der große Button kopiert alle Karten und öffnet Cardmarket. Du musst keine Karte einzeln suchen.": "The large button copies all cards and opens Cardmarket. You do not need to search for cards individually.",
  "Das solltest du vorab wissen": "What you should know first",
  "Die Karten bei Cardmarket einfügen": "Paste the cards into Cardmarket",
  "Zustand und Sprache einstellen": "Set condition and language",
  "Das bedeutet „Poor oder besser“ – also auch stark abgenutzte Karten. Stelle es jetzt einmal für alle Karten gemeinsam um.": "This means “Poor or better”, including heavily worn cards. Change it once for all cards.",
  "Near Mint ist am schönsten, aber deutlich teurer. Excellent sieht auf dem Foto meist fast wie neu aus und ist unser Kompromiss.": "Near Mint looks best but costs considerably more. Excellent usually looks almost new in the photo and is our recommended balance.",
  "Verkäufer finden und kaufen": "Find sellers and buy",
  "Prüfe vor dem Bezahlen Endpreis, Versand, Sprache und Zustand.": "Before paying, check final price, shipping, language and condition.",
  "Hilfe von Cardmarket zum Shopping Wizard": "Cardmarket help for the Shopping Wizard",
  "Reverse Holo – übrige Karte glänzt": "Reverse holo – the rest of the card shines",
  "Gewünschter Zustand": "Preferred condition",
  "Ausführung der Karte": "Card printing",
  "Normal glänzt nicht. Bei Holo glänzt das Bild, bei Reverse Holo der übrige Kartenbereich.": "Normal cards do not shine. On holo cards the artwork shines; on reverse holo cards the rest of the card shines.",
  "z. B. Grundset oder Base Set": "e.g. Base Set",
  "Nur reguläre Nummern (ohne Secret Rares)": "Regular numbers only (no secret rares)",
  "Alle bestätigten Finishes": "All confirmed finishes",
  "Varianten später prüfen": "Review printings later",
  "Karten werden beim Anlegen automatisch eingeplant.": "Cards are planned automatically when the binder is created.",
  "Karten bei Cardmarket kaufen – Schritt für Schritt": "Buying cards on Cardmarket – step by step",
  "So kommst du von der fertigen Liste in Your Card Binder zu den Karten im Warenkorb. Your Card Binder verkauft nichts: Gekauft wird bei Cardmarket, einem Marktplatz, auf dem viele Verkäufer ihre Karten anbieten. Cardmarket wird vor allem in Europa genutzt. In den USA ist TCGplayer der übliche Marktplatz.": "This guide takes you from your finished Your Card Binder list to the cards in your cart. Your Card Binder sells nothing: purchases are made on Cardmarket, a marketplace where many sellers list their cards. Cardmarket is mainly used in Europe; TCGplayer is the common marketplace in the USA.",
  "Schritte dieser Anleitung": "Steps in this guide",
  "Hinweis zu den Bildern": "Note about the images",
  "Zu den Bildern:": "About the images:",
  "Die Abbildungen sind Screenshots der Cardmarket-Seite vom Oktober 2026, der Benutzername ist unkenntlich gemacht. Die gelben Rahmen mit Zahlen zeigen, wohin du klickst. Cardmarket kann Aussehen und Knopfnamen ändern. Wenn etwas anders heißt, such nach dem ähnlichsten Begriff.": "The images are screenshots of Cardmarket from October 2026; the username has been obscured. Numbered yellow frames show where to click. Cardmarket may change its design and button labels, so look for the closest matching term if something is different.",
  "Konto anlegen oder anmelden": "Create an account or sign in",
  "Liste in Your Card Binder kopieren": "Copy the list in Your Card Binder",
  "Wants-Liste anlegen und Karten einfügen": "Create a wants list and add cards",
  "Prüfen, ob alle Karten angekommen sind": "Check that every card was added",
  "Den Kartenzustand für alle Karten einstellen": "Set the condition for every card",
  "Die Kartensprache einstellen": "Set the card language",
  "Verkäufer finden mit dem Shopping Wizard": "Find sellers with the Shopping Wizard",
  "Warenkorb prüfen und bezahlen": "Review the cart and pay",
  "Das Konto brauchst du für den Einkaufsassistenten („Shopping Wizard“), der dir später die passenden Verkäufer zusammenstellt. Er funktioniert laut Cardmarket-Hilfe nur, wenn du angemeldet bist.": "You need the account for the Shopping Wizard, which later combines suitable sellers. According to Cardmarket help, it works only when you are signed in.",
  "Die Zwischenablage ist der Ort, aus dem du gleich mit Strg+V (Windows) oder ⌘V (Mac) einfügst. Kopiere bis dahin nichts anderes.": "The clipboard holds the list you will paste with Ctrl+V (Windows) or ⌘V (Mac). Do not copy anything else in the meantime.",
  "Liste anlegen": "Create a list",
  "Gut zu wissen:": "Good to know:",
  "Welcher Zustand ist der richtige?": "Which condition is right?",
  "Die Zustände bei Cardmarket": "Cardmarket conditions",
  "Kürzel": "Code",
  "Bedeutung": "Meaning",
  "Welchen Wert du bei Cardmarket einstellst": "Which value to set on Cardmarket",
  "In Your Card Binder gewählt": "Selected in Your Card Binder",
  "Bei „Mindest-Zustand“ einstellen": "Set as the minimum condition",
  "Makellos, wie frisch aus der Packung. Selten und am teuersten.": "Flawless, as if fresh from the pack. Rare and most expensive.",
  "Praktisch neu, höchstens winzige Spuren. Am schönsten, aber deutlich teurer.": "Virtually new with at most tiny marks. Looks best, but costs considerably more.",
  "Auf den ersten Blick kaum Spuren, höchstens leicht abgestoßene Ecken oder Ränder.": "Hardly any wear at first glance; corners or edges may be lightly worn.",
  "Sichtbar benutzt: abgenutzte Ecken und Kanten, leichte Kratzer.": "Visibly used: worn corners and edges, light scratches.",
  "Deutlich benutzt, kleine Knicke und Kratzer sind möglich.": "Clearly used; small creases and scratches are possible.",
  "Stark benutzt. Als Geschenk nicht empfohlen.": "Heavily used. Not recommended as a gift.",
  "Stark beschädigt. Nur nehmen, wenn der Zustand wirklich egal ist.": "Heavily damaged. Choose only if condition truly does not matter.",
  "1. Wants-Liste wählen": "1. Choose a wants list",
  "2. Auswahl treffen": "2. Choose sellers",
  "3. Strategie wählen": "3. Choose a strategy",
  "4. Ergebnis ansehen": "4. Review the result",
  "„Verkäufer mit den meisten Karten“": "“Sellers with the most cards”",
  "Im Warenkorb ist jeder Verkäufer ein eigener Block mit eigenem Versand.": "Each seller has a separate section and shipping charge in the cart.",
  "Bezahlt wird bei Cardmarket. Your Card Binder hat keinen Zugriff auf dein Konto und löst keinen Kauf aus.": "Payment happens on Cardmarket. Your Card Binder has no access to your account and does not make purchases.",
  "Den Binder bestellst du getrennt bei einem Shop. Die Empfehlung findest du in Your Card Binder auf der Seite „Besorgen“.": "Order the binder separately from a shop. You’ll find the recommendation on Your Card Binder’s buying page.",
  "Wants-Seite bei Cardmarket öffnen": "Open the Cardmarket wants page",
  "TCGdex ist eine externe, gemeinschaftlich gepflegte Datenquelle. Karten, Varianten, Übersetzungen und Bilder können fehlen oder fehlerhaft sein. Preisangaben sind deaktiviert.": "TCGdex is an external, community-maintained data source. Cards, printings, translations and images may be missing or incorrect. Price information is disabled.",
  "Die Motivsuche durchsucht 19.635 englische physische Karten anhand automatisch erkannter Artwork-Merkmale und kurzer Beschreibungen. Diese Angaben wurden nicht vom Kartenhersteller bestätigt und können falsch oder unvollständig sein. Die Motivsuche zeigt deshalb ihre Herkunft sichtbar an und ersetzt nicht die Prüfung der konkreten Karte. Pokémon-TCG-Pocket-Karten sind nicht enthalten.": "Artwork search scans 19,635 English physical cards using automatically detected visual features and short descriptions. This information is not confirmed by the card manufacturer and may be incorrect or incomplete. Artwork search therefore shows its source and does not replace reviewing the specific card. Pokémon TCG Pocket cards are not included.",
  "Finish, Edition und Druckvariante sind Pflichtangaben. Wenn TCGdex belastbare Finish-Signale liefert, zeigt Your Card Binder nur die bestätigten Holo-, Non-Holo- und Reverse-Optionen. Fehlen sie, bleibt das Finish zur manuellen Prüfung offen. First Edition wird nur für die regulären historischen Sets von Base Set bis Neo Destiny angeboten, ausgenommen Base Set 2. Die geprüfte First-Edition-Ausnahme Ivy Pikachu (Wizards Promo 1) ist kartenspezifisch hinterlegt. Beim englischen Base Set setzt First Edition automatisch Shadowless voraus; nur Machamp 8/102 existiert als First Edition zusätzlich mit Schatten. Dessen nicht gestempelte Trainer-Deck-A-Ausgabe muss als Non-Holo mit eigener Bezeichnung erfasst werden. Shadowless ist ansonsten ausschließlich beim englischen Base Set auswählbar. „Unlimited / Standard“ und „Mit Schatten / Standard“ bleiben die Voreinstellungen, und „Andere“ benötigt eine eigene Bezeichnung.": "Finish, edition and printing are required details. When TCGdex provides reliable finish signals, Your Card Binder shows only confirmed holo, non-holo and reverse options. Otherwise, finish remains open for manual review. First Edition is offered only for regular historical sets from Base Set through Neo Destiny, excluding Base Set 2. The verified First Edition exception Ivy Pikachu (Wizards Promo 1) is recorded specifically for that card. For the English Base Set, First Edition automatically requires Shadowless; only Machamp 8/102 also exists as a shadowed First Edition. Its unstamped Trainer Deck A printing must be recorded as non-holo with a custom label. Shadowless is otherwise available only for the English Base Set. “Unlimited / Standard” and “Shadowed / Standard” remain the defaults, while “Other” requires a custom label.",
  "Die TCGplayer-Übergabe verwendet wöchentlich synchronisierte offizielle Set-Codes, Produktnamen und vollständige Kartennummern. Karten ohne eindeutiges TCGplayer-Produkt, ohne Mass-Entry-Set-Code oder mit widersprüchlichen Variantenangaben bleiben sichtbar und werden nicht spekulativ übertragen. Vor „Add to Cart“ müssen die empfohlenen Printing- und Zustandsfilter aktiviert werden; Holofoil, 1st Edition Holofoil und Unlimited Holofoil sind getrennte Optionen. Die Cardmarket-Deckliste folgt dem offiziellen Pokémon-Format aus Menge, vollständigem Namen, Fähigkeiten und Attacken. Da dieses Format Set, Nummer, Sprache, Finish und Edition nicht festlegt, müssen diese Angaben vor einem Kauf auf Cardmarket kontrolliert werden.": "The TCGplayer handoff uses official set codes, product names and full card numbers synchronised weekly. Cards without a unique TCGplayer product, without a Mass Entry set code or with conflicting printing details remain visible and are not transferred speculatively. Before selecting “Add to Cart”, enable the recommended printing and condition filters; Holofoil, 1st Edition Holofoil and Unlimited Holofoil are separate options. The Cardmarket deck list follows the official Pokémon format of quantity, full name, abilities and attacks. Because this format does not specify set, number, language, finish or edition, review those details on Cardmarket before buying.",
  "Wie du von der fertigen Liste zu den Karten bei Cardmarket kommst, steht Schritt für Schritt mit Abbildungen in der": "The illustrated step-by-step route from your finished list to the cards on Cardmarket is explained in the",
  "Your Card Binder ist ein unabhängiger Arbeitstitel und kein offizielles Produkt von Nintendo, The Pokémon Company, TCGdex, TCGplayer oder Cardmarket. Marken und Kartenabbildungen gehören ihren jeweiligen Rechteinhabern.": "Your Card Binder is an independent working title and is not an official product of Nintendo, The Pokémon Company, TCGdex, TCGplayer or Cardmarket. Trademarks and card images belong to their respective owners.",
  "Die Betreiber- und Datenschutzangaben für den konkreten öffentlichen Host werden vor einer öffentlichen Freigabe ergänzt und geprüft. Diese Seite ist keine Zusage vollständiger Rechtskonformität.": "Operator and privacy information for the final public host will be added and reviewed before public release. This page is not a guarantee of complete legal compliance.",
  "Karten": "Cards",
  "geschätzter Wert": "estimated value",
  "ändern": "change",
  "Tippe eine Karte an, um sie zu sehen. Ziehe sie auf eine andere Karte, um beide zu tauschen. Auf dem Handy: Karte kurz gedrückt halten, dann ziehen.": "Tap a card to view it. Drag it onto another card to swap the two. On a phone: press and hold a card, then drag.",
  "Deutlich gebraucht": "Clearly used",
  "Beliebig": "Any",
  "Fast keine sichtbaren Gebrauchsspuren. Meist teurer und besonders für Sammler geeignet.": "Almost no visible signs of wear. Usually more expensive and especially suited to collectors.",
  "Kleine Rand- oder Oberflächenspuren sind okay. Gute Balance aus Geschenkqualität, Preis und Verfügbarkeit.": "Small marks on the edges or surface are fine. A good balance of gift quality, price and availability.",
  "Sichtbare Kratzer oder Kantenabnutzung sind möglich, die Karte bleibt aber gut nutzbar.": "Visible scratches or edge wear are possible, but the card remains perfectly usable.",
  "Deutliche Kratzer, Kantenabnutzung oder kleine Knicke sind möglich. Für Geschenke meist nicht empfohlen.": "Clear scratches, edge wear or small creases are possible. Usually not recommended for gifts.",
  "Auch stark gebrauchte oder beschädigte Karten können angeboten werden. Nur wählen, wenn der Zustand wirklich egal ist.": "Heavily used or damaged cards may be offered as well. Choose only if condition really does not matter.",
  "Cardmarket: Near Mint oder Excellent · TCGplayer: Near Mint oder Lightly Played": "Cardmarket: Near Mint or Excellent · TCGplayer: Near Mint or Lightly Played",
  "Cardmarket: bis Light Played · TCGplayer: bis Lightly Played": "Cardmarket: up to Light Played · TCGplayer: up to Lightly Played",
  "Cardmarket: bis Played · TCGplayer: bis Heavily Played": "Cardmarket: up to Played · TCGplayer: up to Heavily Played",
  "Alle Zustände; beschädigte Karten können enthalten sein": "All conditions; damaged cards may be included",
  "„Sehr gut“ – kleine Spuren sind okay, ohne unnötig nur die teuersten Angebote zuzulassen.": "“Very good” – minor wear is acceptable without limiting the search to only the most expensive listings.",
  "Der Zustand beschreibt sichtbare Abnutzung. Er ist unabhängig von Sprache, Holo-Ausführung und Edition.": "Condition describes visible wear. It is independent of language, holo finish and edition.",
  "Prüfe bei wertvollen Karten immer die Angebotsfotos und die Zustandsbeschreibung des Verkäufers. „Zustand egal“ kann beschädigte Karten einschließen.": "With valuable cards, always check the listing photos and the seller's condition description. “Any condition” can include damaged cards.",
  "Erklärung der Kartenzustände": "Explanation of card conditions",
  "Zum Beispiel Pikachu oder Pikachu, Glurak": "For example Pikachu or Pikachu, Charizard",
  "Geschenk-Binder wurde lokal angelegt. Prüfe die Zusammenfassung oder öffne den Binder.": "Gift binder created locally. Review the summary or open the binder.",
  "Binder auswählen und bestellen": "Choose and order a binder",
  "Wähle einen passenden 9-Pocket-Binder.": "Choose a matching 9-pocket binder.",
  "Alle passen zu deinem Plan": "All of them fit your plan",
  "Die Kartenpreise sind Schätzwerte; Versand und Steuern sind nicht enthalten.": "Card prices are estimates; shipping and taxes are not included.",
  "(optional, nur in diesem Browser)": "(optional, only in this browser)",
  "Nächste Schritte: Binder bestellen und Karten kaufen": "Next steps: order the binder and buy the cards",
  "Karten besorgen": "Get the cards",
  "Your Card Binder ist außerdem kein offizielles Produkt von TCGdex.": "Your Card Binder is also not an official TCGdex product.",
  "Betreiberangaben und Datenschutz:": "Provider details and privacy:",
  "Impressum": "Legal notice",
  "Datenschutzerklärung": "Privacy policy",
  "Your Card Binder: Meine Binder": "Your Card Binder: My binders",
  "Bild: CardTrader": "Image: CardTrader",
  "Fehlt bei TCGdex ein Bild oder ein Preis, ergänzt Your Card Binder ihn aus Daten von CardTrader (cardtrader.com). Solche Bilder sind als „Bild: CardTrader“ gekennzeichnet, solche Preise als „günstigstes Angebot“ bei CardTrader. Die Preise sind Momentaufnahmen aus einer wöchentlich erzeugten Datei und ohne Gewähr. Ein einzelnes sehr teures oder sehr günstiges Angebot kann den Wert verzerren.": "Where TCGdex lacks an image or a price, Your Card Binder fills it in with data from CardTrader (cardtrader.com). Such images are marked “Image: CardTrader”, and such prices are labelled as the cheapest listing at CardTrader. Prices are snapshots from a file generated weekly and come without guarantee. A single very expensive or very cheap listing can distort the value.",
  "CardTrader (günstigstes Angebot)": "CardTrader (cheapest listing)",
  "Kauf-Anleitung (öffnet in neuem Tab)": "Buying guide (opens in a new tab)",
  "Direkte Produktseiten": "Direct product pages",
  "Die Produkt-IDs stammen von CardTrader und führen direkt auf die Cardmarket-Produktseite. Prüfe dort Set, Nummer und Sprache, bevor du kaufst.": "The product ids come from CardTrader and lead straight to the Cardmarket product page. Check set, number and language there before you buy.",
  "· ID laut CardTrader": "· id from CardTrader",
  "Marktplatz": "Marketplace",
  "Shop Optimizer öffnen": "Open Shop Optimizer",
  "Shop Optimizer · Karten mehrerer Verkäufer": "Shop Optimizer · cards from several sellers",
  "So kaufst du bei CardTrader": "How to buy at CardTrader",
  "Öffne den Shop Optimizer. Dort legst du eine Liste an und wählst später, wie die Verkäufer ausgesucht werden.": "Open the Shop Optimizer. There you create a list and later choose how the sellers are picked.",
  "Füge deine Karten hinzu. Unten findest du zu jeder Karte die Seite bei CardTrader mit Set, Nummer und allen Angeboten.": "Add your cards. Below you find the CardTrader page of every card with set, number and all offers.",
  "Seiten bei CardTrader": "Pages at CardTrader",
  "Du möchtest Karten frei mischen, zum Beispiel von mehreren Pokémon oder aus bestimmten Sets?": "Want to mix cards freely, for example from several Pokémon or from specific sets?",
  "Als Binder öffnen und Karten frei wählen": "Open as a binder and choose cards freely",
  "TCGplayer-Anleitung": "TCGplayer guide",
  "Karten laden": "Load cards",
  "Printing & Zustand": "Printing & condition",
  "Fortschritt der TCGplayer-Anleitung": "Progress of the TCGplayer guide",
  "Liste kopieren und TCGplayer öffnen": "Copy the list and open TCGplayer",
  "Karten in Mass Entry laden": "Load the cards into Mass Entry",
  "Lass TCGplayer die Karten suchen. Dabei werden Karte, Set und Nummer übernommen.": "Let TCGplayer search for the cards. Card, set and number are taken over.",
  "Liste erneut kopieren & TCGplayer öffnen": "Copy the list again & open TCGplayer",
  "Karten sind geladen": "Cards are loaded",
  "Printing und Zustand einstellen": "Set printing and condition",
  "Mass Entry übernimmt nur Karte, Set und Nummer": "Mass Entry only takes over card, set and number",
  "Printing und Zustand stellst du bei TCGplayer selbst mit den Filtern ein. Holofoil, 1st Edition Holofoil und Unlimited Holofoil sind getrennte Optionen.": "You set printing and condition yourself at TCGplayer with the filters. Holofoil, 1st Edition Holofoil and Unlimited Holofoil are separate options.",
  "Printing laut deiner Auswahl": "Printing as you chose",
  "Zustand laut deiner Auswahl": "Condition as you chose",
  "Filter sind eingestellt": "Filters are set",
  "Ergebnis prüfen und in den Warenkorb legen": "Check the result and add to the cart",
  "Kontrolliere Kartenname, Set, vollständige Nummer, Sprache, Printing und Zustand.": "Check card name, set, full number, language, printing and condition.",
  "Erst danach lässt du TCGplayer die Angebote in den Warenkorb legen und bezahlst dort.": "Only then let TCGplayer add the offers to the cart and pay there.",
  "Your Card Binder legt nichts in deinen Warenkorb. Preise, Versand und die endgültige Kartenauswahl bestätigst du erst bei TCGplayer.": "Your Card Binder puts nothing into your cart. You confirm prices, shipping and the final card selection only at TCGplayer.",
  "Mass-Entry-Text kopieren oder als Datei speichern": "Copy the Mass Entry text or save it as a file",
  "CardTrader-Anleitung": "CardTrader guide",
  "Karten prüfen": "Check cards",
  "Karten hinzufügen": "Add cards",
  "Shop Optimizer": "Shop Optimizer",
  "Diese Karten kommen auf deine Liste": "These cards go on your list",
  "Karten bei CardTrader hinzufügen": "Add the cards at CardTrader",
  "Für Fortgeschrittene: Liste automatisch anlegen": "For advanced users: create the list automatically",
  "CardTrader-Token": "CardTrader token",
  "So erhältst du es": "How to get it",
  "Das Token bleibt nur in diesem Fenster. Es wird nicht gespeichert, nicht in Sicherungen übernommen und nicht an uns gesendet.": "The token stays in this window only. It is not stored, not included in backups and not sent to us.",
  "Es wird nichts gekauft und nichts in einen Warenkorb gelegt.": "Nothing is bought and nothing is put into a cart.",
  "Wird angelegt …": "Creating …",
  "Shop Optimizer öffnen und Verkäufer wählen": "Open the Shop Optimizer and choose sellers",
  "Ich bin im Shop Optimizer fertig": "I am done in the Shop Optimizer",
  "Ergebnis prüfen und bei CardTrader bezahlen": "Check the result and pay at CardTrader",
  "Bezahle bei CardTrader. Erst dort wird gekauft.": "Pay at CardTrader. Only there is anything bought.",
  "Kontrolliere Gesamtpreis, Versand, Sprache, Kartenausführung und Zustand.": "Check the total price, shipping, language, card version and condition.",
  "Fortschritt der CardTrader-Anleitung": "Progress of the CardTrader guide",
  "Lege im Shop Optimizer eine Liste an und füge deine Karten hinzu (Seiten aus Schritt 1).": "Create a list in the Shop Optimizer and add your cards (pages from step 1).",
  "Öffne im nächsten Schritt den Shop Optimizer und füge deine Karten dort hinzu. Die Seiten aus Schritt 1 zeigen dir zu jeder Karte Set, Nummer und alle Angebote.": "In the next step, open the Shop Optimizer and add your cards there. The pages from step 1 show set, number and all offers for each card.",
  "Keine der Karten ist sicher einer CardTrader-Karte zugeordnet. Suche sie bei CardTrader selbst oder nutze einen anderen Anbieter.": "None of the cards is reliably matched to a CardTrader card. Search for them at CardTrader yourself or use another marketplace.",
  "Your Card Binder legt nichts in deinen Warenkorb und kauft nichts. Preise, Versand und die endgültige Kartenauswahl bestätigst du erst bei CardTrader.": "Your Card Binder puts nothing into your cart and buys nothing. You confirm prices, shipping and the final card selection only at CardTrader.",
  "Das sieht nicht wie ein CardTrader-Token aus. Kopiere es vollständig und ohne Leerzeichen aus deinem Konto.": "This does not look like a CardTrader token. Copy it completely and without spaces from your account.",
  "CardTrader hat das Token abgelehnt. Prüfe, ob es vollständig und noch gültig ist.": "CardTrader rejected the token. Check that it is complete and still valid.",
  "CardTrader bittet gerade um eine Pause. Versuche es in einer Minute erneut.": "CardTrader is asking for a pause. Try again in a minute.",
  "CardTrader hat die Liste nicht angenommen. Du kannst ohne Wunschliste weitermachen.": "CardTrader did not accept the list. You can continue without a wishlist.",
  "Die Verbindung zu CardTrader ist fehlgeschlagen. Du kannst es erneut versuchen oder ohne Wunschliste weitermachen.": "The connection to CardTrader failed. You can try again or continue without a wishlist.",
  "Wird geladen …": "Loading …",
  "Bei CardTrader ansehen": "View at CardTrader",
  "Keine sichere Zuordnung": "No safe match",
  "Richtwert: ab ca.": "Estimate: from approx.",
  "Your Card Binder legt nichts in deinen Warenkorb und kauft nichts. Prüfe Set, Kartennummer, Sprache, Finish, Edition und Zustand vor dem Kauf.": "Your Card Binder puts nothing in your cart and buys nothing. Check set, card number, language, finish, edition and condition before you buy.",
  "Cardmarket und CardTrader im Vergleich": "Cardmarket and CardTrader compared",
  "Größter Marktplatz für Pokémon-Karten in Europa.": "The largest marketplace for Pokémon cards in Europe.",
  "Du fügst die ganze Liste auf einmal ein, und der Shopping Wizard stellt die Bestellung zusammen.": "You paste the whole list at once, and the Shopping Wizard puts the order together.",
  "Versand wird pro Verkäufer berechnet.": "Shipping is charged per seller.",
  "Mit CardTrader Zero können Karten mehrerer Verkäufer in einer Sendung ankommen.": "With CardTrader Zero, cards from several sellers can arrive in one shipment.",
  "Der Shop Optimizer wählt Verkäufer nach Preis, Anzahl der Verkäufer oder Tempo.": "The Shop Optimizer picks sellers by price, number of sellers or speed.",
  "Du legst deine Liste dort selbst an; Your Card Binder zeigt zu jeder Karte die passende Seite.": "You build your list there yourself; Your Card Binder shows the matching page for every card.",
  "Welcher Weg günstiger ist, hängt vom Versand und von den Verkäufern ab. Beides siehst du erst vor dem Kauf, deshalb vergleichen wir keine Endpreise vorab.": "Which way is cheaper depends on shipping and sellers. You only see both before you buy, so we do not compare final prices in advance.",
};

/* The trademark notice is defined once in German and English; reuse it so the help page translates too. */
Object.assign(translations, {
  [DISCLAIMER.de.heading]: DISCLAIMER.en.heading,
  [DISCLAIMER.de.lines[0]!]: DISCLAIMER.en.lines[0]!,
  [DISCLAIMER.de.lines[1]!]: DISCLAIMER.en.lines[1]!,
});

const patterns: Array<[RegExp, (...matches: string[]) => string]> = [
  [/^(\d+) Angebote?(?: · Verkäufer aus (.+))?$/, (count, countries) => `${count} ${count === "1" ? "offer" : "offers"}${countries ? ` · sellers from ${countries}` : ""}`],
  [/^(\d+) Karten? kopieren & TCGplayer öffnen$/, (count) => `Copy ${count} ${count === "1" ? "card" : "cards"} & open TCGplayer`],
  [/^(.+) · (\d+) Karten?$/, (label, count) => `${label} · ${count} ${count === "1" ? "card" : "cards"}`],
  [/^Einzelne Karten suchen \((\d+)\)$/, (count) => `Search single cards (${count})`],
  [/^Alle fehlenden Karten als Liste \((\d+)\)$/, (count) => `All missing cards as a list (${count})`],
  [/^(\d+) Karten bei CardTrader kaufen$/, (count) => `Buy ${count} cards at CardTrader`],
  [/^1 Karte bei CardTrader kaufen$/, () => "Buy 1 card at CardTrader"],
  [/^(\d+) Positionen · gekauft wird erst bei CardTrader$/, (count) => `${count} items · you only buy at CardTrader`],
  [/^(\d+) von (\d+) zugeordnet$/, (linked, total) => `${linked} of ${total} matched`],
  [/^Bei CardTrader ansehen: (.+)$/, (name) => `View at CardTrader: ${name}`],
  [/^Stelle Sprache und Mindestzustand(?: \((.+)\))? ein, prüfe Gesamtpreis und Versand und zahle erst dort\.$/, (condition) => `Set language and minimum condition${condition ? ` (${condition})` : ""}, check the total price and shipping, and pay only there.`],
  [/^für (\d+) von (\d+) Karten \(günstigste Einzelangebote bei CardTrader im gewählten Zustand, ohne Versand\)\. Der Endpreis hängt von den Verkäufern ab\.$/, (priced, total) => `for ${priced} of ${total} cards (cheapest single listings at CardTrader in the chosen condition, excluding shipping). The final price depends on the sellers.`],
  [/^(.+) · ab ca\. (.+)$/, (rest, price) => `${rest} · from approx. ${price}`],
  [/^Platz (\d+) von (\d+) · Seite (\d+)$/, (position, total, page) => `Position ${position} of ${total} · Page ${page}`],
  [/^Geschenk · (.+)$/, (subject) => `Gift · ${subject}`],
  [/^Alle passenden Karten ansehen \((\d+)\)$/, (count) => `View all matching cards (${count})`],
  [/^Alle (\d+) Karten ansehen$/, (count) => `View all ${count} cards`],
  [/^(.+): Details ansehen$/, (name) => `${name}: view details`],
  [/^(\d+) Karten = (\d+) Binder-Seite\.$/, (cards, pages) => `${cards} cards = ${pages} binder page.`],
  [/^(\d+) Karten = (\d+) Binder-Seiten\.$/, (cards, pages) => `${cards} cards = ${pages} binder pages.`],
  [/^(?:(\d+)-Pocket · )?Platz für bis zu (\d+) Karten$/, (pockets, cards) => `${pockets ? `${pockets}-pocket · ` : ""}Holds up to ${cards} cards`],
  [/^für (\d+) von (\d+) Karten$/, (priced, total) => `for ${priced} of ${total} cards`],
  [/^mind\. (.+)$/, (value) => `at least ${value}`],
  [/^(\d+) Karten$/, (count) => `${count} cards`],
  [/^(\d+) Karte$/, (count) => `${count} card`],
  [/^(\d+) Seiten$/, (count) => `${count} pages`],
  [/^(\d+) Seite$/, (count) => `${count} page`],
  [/^Seite (\d+)$/, (page) => `Page ${page}`],
  [/^Freier Platz (\d+)$/, (slot) => `Empty slot ${slot}`],
  [/^(\d+) Positionen$/, (count) => `${count} entries`],
  [/^(\d+) Position$/, (count) => `${count} entry`],
  [/^(\d+) Exemplare$/, (count) => `${count} copies`],
  [/^(\d+) Exemplar$/, (count) => `${count} copy`],
  [/^(\d+) von (\d+) Karten$/, (current, total) => `${current} of ${total} cards`],
  [/^Noch (\d+) Karten auswählen$/, (count) => `Choose ${count} more cards`],
  [/^Karten kaufen \((\d+)\)$/, (count) => `Buy cards (${count})`],
  [/^Fehlende Karten \((\d+)\)$/, (count) => `Missing cards (${count})`],
  [/^Für „(.+)“ gibt es (\d+) Karten auf Deutsch\.$/, (name, count) => `There are ${count} German cards for “${name}”.`],
  [/^Für „(.+)“ gibt es (\d+) Karten auf Englisch\.$/, (name, count) => `There are ${count} English cards for “${name}”.`],
  [/^(\d+) Karten brauchen (\d+) Seiten\.$/, (cards, pages) => `${cards} cards need ${pages} pages.`],
  [/^(\d+) Seite · (\d+) Karten$/, (pages, cards) => `${pages} page · ${cards} cards`],
  [/^(\d+) Seiten · (\d+) Karten$/, (pages, cards) => `${pages} pages · ${cards} cards`],
  [/^Preis geprüft am (.+)$/, (date) => `Price checked on ${date}`],
  [/^aktuell: (.+)$/, (value) => `current: ${value}`],
  [/^Schritt (\d+) von (\d+)$/, (step, total) => `Step ${step} of ${total}`],
  [/^Schritt (\d+)$/, (step) => `Step ${step}`],
  [/^Teil (\d+) von (\d+) · (\d+) Positionen$/, (part, total, entries) => `Part ${part} of ${total} · ${entries} entries`],
];

function translateCore(value: string): string {
  const exact = translations[value];
  if (exact) return exact;
  for (const [pattern, format] of patterns) {
    const match = value.match(pattern);
    if (match) return format(...match.slice(1));
  }
  return value;
}

export function translateGermanText(value: string): string {
  if (!value.trim()) return value;
  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";
  const core = value.slice(leading.length, value.length - trailing.length).replace(/\s+/g, " ");
  return `${leading}${translateCore(core)}${trailing}`;
}

export function detectLocale(languages: readonly string[] | undefined): AppLocale {
  const preferred = languages?.find(Boolean)?.toLowerCase();
  return preferred?.startsWith("de") ? "de" : "en";
}

type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
};

const LocaleContext = createContext<LocaleContextValue>({ locale: "de", setLocale: () => undefined });

const textState = new WeakMap<Text, { source: string; translated: string }>();
const attributeState = new WeakMap<Element, Map<string, { source: string; translated: string }>>();
const translatedAttributes = ["aria-label", "aria-description", "placeholder", "title", "alt"] as const;
let titleState: { source: string; translated: string } | undefined;

function shouldSkip(node: Node): boolean {
  const element = node instanceof Element ? node : node.parentElement;
  return Boolean(element?.closest("script, style, code, pre, [data-no-translate], [contenteditable='true']"));
}

function localizeText(node: Text, locale: AppLocale): void {
  if (shouldSkip(node)) return;
  const current = node.data;
  const previous = textState.get(node);
  if (locale === "de") {
    if (previous && current === previous.translated && current !== previous.source) node.data = previous.source;
    return;
  }
  const source = previous && current === previous.translated ? previous.source : current;
  const translated = translateGermanText(source);
  textState.set(node, { source, translated });
  if (current !== translated) node.data = translated;
}

function localizeAttributes(element: Element, locale: AppLocale): void {
  if (shouldSkip(element)) return;
  let state = attributeState.get(element);
  if (!state) {
    state = new Map();
    attributeState.set(element, state);
  }
  for (const attribute of translatedAttributes) {
    const current = element.getAttribute(attribute);
    if (!current) continue;
    const previous = state.get(attribute);
    if (locale === "de") {
      if (previous && current === previous.translated && current !== previous.source) element.setAttribute(attribute, previous.source);
      continue;
    }
    const source = previous && current === previous.translated ? previous.source : current;
    const translated = translateGermanText(source);
    state.set(attribute, { source, translated });
    if (current !== translated) element.setAttribute(attribute, translated);
  }
}

function localizeSubtree(root: Node, locale: AppLocale): void {
  if (root instanceof Text) {
    localizeText(root, locale);
    return;
  }
  if (!(root instanceof Element || root instanceof DocumentFragment || root instanceof Document)) return;
  if (root instanceof Element) localizeAttributes(root, locale);
  const textWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let textNode = textWalker.nextNode();
  while (textNode) {
    localizeText(textNode as Text, locale);
    textNode = textWalker.nextNode();
  }
  const elementWalker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let elementNode = elementWalker.nextNode();
  while (elementNode) {
    localizeAttributes(elementNode as Element, locale);
    elementNode = elementWalker.nextNode();
  }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, updateLocale] = useState<AppLocale>("de");

  useEffect(() => {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    const initial = stored === "de" || stored === "en"
      ? stored
      : detectLocale(navigator.languages?.length ? navigator.languages : [navigator.language]);
    queueMicrotask(() => updateLocale(initial));
  }, []);

  useEffect(() => {
    const fixed = fixedLocaleForPath(window.location.pathname);
    if (fixed) {
      /* Single-language content page: keep its own language and leave the text untouched. */
      document.documentElement.lang = fixed;
      document.documentElement.dataset.locale = fixed;
      return;
    }
    document.documentElement.lang = locale;
    document.documentElement.dataset.locale = locale;
    if (locale === "de") {
      if (titleState && document.title === titleState.translated) document.title = titleState.source;
    } else {
      const source = titleState && document.title === titleState.translated ? titleState.source : document.title;
      const translated = translateGermanText(source);
      titleState = { source, translated };
      document.title = translated;
    }
    localizeSubtree(document.documentElement, locale);
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "characterData") localizeSubtree(record.target, locale);
        for (const node of record.addedNodes) localizeSubtree(node, locale);
        if (record.type === "attributes" && record.target instanceof Element) localizeAttributes(record.target, locale);
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: [...translatedAttributes] });
    return () => observer.disconnect();
  }, [locale]);

  const setLocale = useCallback((nextLocale: AppLocale) => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    updateLocale(nextLocale);
  }, []);

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}
