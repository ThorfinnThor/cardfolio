# Cardfolio UI/UX + CardTrader — Luna/Sol-Implementierungsplan

Stand: 2026-10-04

Dieser Plan überprüft `cardfolio-ui-ux-todo.md` gegen den aktuellen Stand des Repositories und ergänzt CardTrader als dritten Marketplace-Anbieter. Die To-do-Datei ist eine Anforderungssammlung, keine Anweisung, vorhandene Funktionen neu zu bauen.

## Produktziel

Cardfolio soll auch für Menschen funktionieren, die Pokémon-Karten nicht kennen. Besonders Eltern sollen ohne Vorwissen eine Binderseite planen können, ohne Setcodes, Druckvarianten oder Marketplace-Begriffe verstehen zu müssen.

Die Standardstrecke lautet deshalb:

1. **Was möchtest du erstellen?** Leer starten, mit einem Set starten oder Geschenk erstellen.
2. **Welche Karten möchtest du?** Bilder und verständliche Namen zuerst; Fachfilter nur bei Bedarf.
3. **Wohin kommen sie?** Binder, Seite und Platz bleiben sichtbar.
4. **Ist es die richtige Ausgabe?** Cardfolio erklärt Finish, Edition und Druckvariante in Alltagssprache und zeigt nur tatsächlich mögliche Werte.
5. **Plan speichern.** Jede Änderung wird bestätigt und kann unmittelbar rückgängig gemacht werden.
6. **Fehlende Karten besorgen.** Erst hier wird zwischen Cardmarket, TCGplayer und CardTrader gewählt.

Es wird **kein besonderer „Eltern-Modus“** angelegt. Der normale Ablauf ist einfach; Expertenoptionen werden schrittweise eingeblendet. So entsteht nur eine Oberfläche, die für Einsteiger und erfahrene Sammler funktioniert.

## Verbindliche UX-Grundsätze

- Pro Ansicht gibt es eine erkennbare Hauptaktion.
- Einsteigerbegriffe stehen vor Fachbegriffen: zum Beispiel „Glänzend (Holo)“ und eine kurze Erklärung für „Set“.
- Häufige, sichere Entscheidungen werden vorausgewählt; fachlich unsichere Varianten werden nie stillschweigend geraten.
- Erweiterte Filter, Marketplace-Zuordnung und Sondervarianten erscheinen erst bei Bedarf.
- Kartenbild, Kartenname, Set und Kartennummer sind vor dem Einplanen sichtbar.
- „Ausgewählt“, „eingeplant“, „fehlt“ und „vorhanden“ bleiben getrennte Zustände.
- Keine Sortierung der Suchtreffer verändert eine gestaltete Binderseite.
- Jeder leere, ladende oder fehlerhafte Zustand bietet eine verständliche nächste Aktion.
- Marketplace-Preise sind Momentaufnahmen, keine Wert- oder Verfügbarkeitsgarantie.

## Review der 25 UI/UX-Punkte

| Nr. | Stand | Ergebnis des Repository-Reviews |
|---:|---|---|
| 1 | Erfüllt | Ein leerer Slot öffnet den Browser sofort im Entdecken-Modus; der paginierte TCGdex-Katalog liefert Startkarten auch ohne Suchtext. |
| 2 | Erfüllt | Bindername, Seitentitel und Slot stehen während der Kartenauswahl gemeinsam im Zielhinweis. |
| 3 | Teilweise | Eine reproduzierbare Katalog-Startauswahl und Lade-Skeletons sind vorhanden; zuletzt gesehene Karten und ein kuratierter Set-Kontext folgen im Set-Browser-Schritt. |
| 4 | Teilweise | Suche/Filter bleiben beim Prüfen und Zurückkehren erhalten, inklusive Scrollanker. Ein eigener „nächster freier Slot“-Durchlauf folgt in Punkt 16. |
| 5 | Weitgehend vorhanden | Die Detailprüfung verlangt gültige Varianten. Sie muss in den schnelleren Ablauf integriert und einfacher erklärt werden. |
| 6 | Erfüllt | Einsetzen nutzt die reversible Page-Selection-Persistenz; die Erfolgsmeldung nennt die Karte und bietet bis zur nächsten Mutation „Rückgängig“. |
| 7 | Teilweise | Binderkarte und Suchtreffer zeigen „Fehlt“, „Vorhanden“ und „Bereits eingeplant“. Der vollständige Status-Workflow für Mehrfachauswahl folgt später. |
| 8 | Erfüllt | Kartenkacheln zeigen Bild, Setname, Kartennummer, Sprache und Status; die Detailprüfung bleibt der nächste Schritt vor dem Einsetzen. |
| 9 | Erfüllt | Setkacheln zeigen Logo/Symbol mit Sprachfallback und verständlichem Textfallback; fehlende Providerassets bleiben sichtbar als „Kein Setbild“. |
| 10 | Erfüllt | Karten und Sets sind getrennte Katalogtabs; Serien-/Setfilter, Suchfeld, entfernbare Filterchips und gemeinsamer Reset sind vorhanden. |
| 11 | Erfüllt | `Relevanz`, `Set → Nummer`, `Kartennummer` und `Erscheinungsdatum` sind sichtbar; natürliche Sammlernummernsortierung deckt Präfixe, Suffixe und Secret Rares ab. |
| 12 | Erfüllt | Sortierung arbeitet auf einer Ergebniskopie; ein Regressionstest hält Binderplätze unverändert. |
| 13 | Erfüllt | Der lokalisierte Set-Index wird in einer eigenen Setansicht durchsucht; „Set öffnen“ setzt den Kartenfilter und die Kartennummernsortierung. |
| 14 | Erfüllt | Normale Katalogtreffer und Motivtreffer können in derselben Auswahlleiste gesammelt und anschließend gemeinsam im Page-Selection-Review geprüft werden. |
| 15 | Domain erfüllt | Startslot, aktuelle Seite versus fortlaufender Bereich und die Entscheidung „abbrechen oder Seiten hinzufügen“ sind atomar modelliert. Die Vorschau folgt in Schritt 7. |
| 16 | Erfüllt | Der Review zeigt „Ab nächstem freien Platz fortlaufend“; bei Bedarf werden weitere Seiten nur über die explizite Overflow-Regel ergänzt. |
| 17 | Erfüllt | Der geführte Set-Start lädt das gewählte Set, zeigt Umfang, Seiten, Sprache und Variantenstrategie vor dem Anlegen und verwendet den gemeinsamen Set-Binder-Plan. |
| 18 | Erfüllt | Die Fehlkartenansicht gruppiert sichtbar nach Set und Sprache; die Binderreihenfolge bleibt unverändert. |
| 19 | Vorhanden | „Motiv im Artwork“ ist ein eigener Sucheinstieg. Benennung, Abdeckungshinweis und Platzierung werden im UX-Schritt nachgeschärft. |
| 20 | Erfüllt | Der Einstieg bietet „Meine Sammlung planen“, „Mit einem Set starten“ und „Geschenk erstellen“; der Set-Wizard und Gift Builder bleiben klar getrennt. |
| 21 | Erfüllt | Karten- und Settreffer nutzen sichtbare Thumbnails/Logos sowie robuste Sprach- und Textfallbacks. |
| 22 | Erfüllt | Filter sind getrennt von der Sortierung; aktive Filterchips, Reset und konkrete Nulltreffer-Aktionen sind sichtbar. |
| 23 | Teilweise | Karten-/Setraster und Mobil-Einspaltigkeit sind umgesetzt; die vollständige Viewport-/Tastaturabnahme bleibt Schritt 11. |
| 24 | Teilweise | Escape und Fokus-Rückgabe sind vorhanden. Fokusfalle, vollständige Tastaturstrecke und Screenreader-Abnahme fehlen. |
| 25 | Teilweise | Karten behalten React-Query-Nachladen, Retry, Skeletons und Scrollanker; Settreffer sind lokal deterministisch und brauchen keinen Netzwerkladezustand. Die vollständige Cache-Wiederaufnahme folgt noch. |

### Konsequenz aus dem Review

Nicht neu bauen:

- `CardRef`, `CardSnapshot`, Binder- und Besitzmodell
- bestehende Variantenvalidierung
- `PageSelection` als gemeinsame Einfüge-Domain
- Motivsuche und Gift Builder als separate Einstiege
- bestehende Cardmarket-/TCGplayer-Übergaben

Erweitern:

- Kartenbrowser als wiederverwendbaren Einzel-/Mehrfachauswahl-Workspace
- Sessionzustand, Undo und zielbezogene Statusanzeigen
- Set-Metadaten und Set-Navigation
- providerneutrale Marketplace-Verträge für CardTrader

## CardTrader: sinnvoll nutzbare Daten

CardTrader verwendet eine authentifizierte REST-API v2. Ein `Blueprint` ist die konkrete, handelbare Druckausgabe; ein `Product` ist ein tatsächlich angebotenes Exemplar dieses Blueprints.

| CardTrader-Daten/Funktion | Nutzen in Cardfolio | Einschränkung / Regel |
|---|---|---|
| Games, Kategorien, Expansions | Pokémon-Katalog und Setcodes abgleichen | IDs nicht hardcoden; Pokémon und „Single Cards“ bei jedem Sync anhand der API ermitteln. |
| Blueprint-ID, Name, Version, Expansion | stabile CardTrader-Zuordnung einer konkreten Karte | TCGdex bleibt Cardfolios interne Identität; CardTrader-ID ist nur Provider-Mapping. |
| `card_market_ids`, `tcg_player_id` | vorhandene Provider-Mappings gegenprüfen und Matches sicherer machen | Zuerst Abdeckung und Qualität speziell für Pokémon messen; leere IDs nicht erraten. |
| `editable_properties` / Kategorie-Eigenschaften | erlaubte Sprache, Zustand, Foil/Reverse/First Edition dynamisch prüfen | Nicht die Magic-Beispiele aus der Dokumentation auf Pokémon übertragen; Werte aus der Pokémon-Kategorie lesen. |
| `image_url` | möglicher Bildfallback, wenn TCGdex kein Bild liefert | Nur nach schriftlich geklärter Nutzung/Hotlinking/Caching-Regel; keine Bildkopie ins Repo ohne Erlaubnis. |
| Marketplace-Produkte | Preis, Währung, Menge, Zustand, Sprache, Foil, Grading und Verfügbarkeit pro Blueprint | Die Antwort enthält die günstigsten Angebote und ist leicht gecacht; sie ist kein garantierter Marktwert. |
| Verkäuferdaten / CardTrader Zero | Verfügbarkeit, Land und Zero-Eignung erklären; später Einkaufsschätzung verbessern | Verkäuferprofil und Versand dürfen nicht als Kartenpreis vermischt werden. |
| Shipping Methods | spätere Gesamtkosten-Schätzung je Verkäufer | Erst nach exakter Produktauswahl sinnvoll; nicht Teil der ersten Preisanzeige. |
| Wishlist API | fehlende Karten mit Blueprint-ID, Menge, Sprache, Zustand, Foil/Reverse und First Edition an eine CardTrader-Wunschliste übergeben | Benötigt ein persönliches Bearer-Token des Nutzers. Kein Token im Frontend-Bundle oder in IndexedDB speichern. |
| Cart API | ausgewählte konkrete Angebote in einen CardTrader-Warenkorb legen | Nicht Teil dieses Plans: kein automatischer Kauf und kein `purchase`-Aufruf aus Cardfolio. |

### Preisstrategie

CardTrader kann die Preisabdeckung verbessern, aber nicht automatisch einen „genaueren Kartenwert“ garantieren. Cardfolio berechnet nur dann eine Schätzung, wenn Blueprint, Sprache, Finish/Edition und Zustand ausreichend genau zugeordnet sind.

Für jede Schätzung werden gespeichert und angezeigt:

- Provider und Abrufzeit
- Währung
- gefilterte Angebotsanzahl
- günstigstes plausibles Angebot
- Median der vergleichbaren Angebote
- beobachtete Spanne nach Entfernung offensichtlicher, dokumentierter Ausreißer
- Konfidenz: `hoch`, `eingeschränkt` oder `unbekannt`

Versand, Steuer, Verkäuferaufteilung und spätere Preisänderungen bleiben getrennt. Bei zu wenigen vergleichbaren Angeboten wird „Preis unbekannt“ gezeigt – niemals `0 €`.

### Bildstrategie

1. TCGdex-Bild in gewünschter Sprache.
2. TCGdex-Bild derselben Karte auf Englisch, sichtbar als Sprachfallback.
3. CardTrader-Blueprint-Bild nur bei eindeutigem Mapping und freigegebener Nutzung.
4. Textfallback mit Set, Nummer und „Bild derzeit nicht verfügbar“.

CardTrader-Bilder werden nicht als Trainings-, Export- oder Cover-Assets verwendet. Ihre Lizenz- und Cachingbedingungen müssen vor Aktivierung schriftlich geklärt werden.

### CardTrader-Übergabeformat

Das zuverlässigste CardTrader-Format ist kein erfundener TXT-String, sondern ein offizielles Wishlist-API-Payload mit `deck_items_attributes`. Pro Position sollen mindestens verwendet werden:

- `blueprint_id`
- `quantity`
- `collector_number`
- `language`
- `condition`
- `foil`
- `reverse`
- `first_edition`

Ohne verbundene CardTrader-Sitzung erzeugt Cardfolio nur eine überprüfbare Vorschau und eine Cardfolio-neutrale JSON/CSV-Datei. Sie darf nicht als „direkt importierbar“ bezeichnet werden, solange CardTrader dafür kein offizielles Käufer-Importformat dokumentiert. Mit Verbindung wird nach ausdrücklicher Bestätigung eine neue, standardmäßig private Wishlist über `POST /wishlists` angelegt. Kauf und Warenkorb bleiben getrennte, spätere Entscheidungen.

### Architektur und Sicherheit

- Neue Verträge: `MarketplaceCatalogAdapter`, `MarketplacePriceAdapter`, `MarketplaceWishlistAdapter`.
- Feature Flags getrennt halten: `cardtraderCatalog`, `cardtraderPrices`, `cardtraderWishlist`; `cardtraderCommerce` bleibt `false`.
- Der statische Browser erhält niemals den Projekt-/Synchronisations-Token.
- Öffentliche Katalog- und Mapping-Artefakte werden – nur nach Rechtefreigabe – in GitHub Actions erzeugt, validiert und von Cloudflare statisch ausgeliefert.
- Preis-Snapshots benötigen TTL, Herkunft, Währung und Stale-Anzeige. Keine private Nutzer- oder Verkäuferhistorie wird ins Repository geschrieben.
- Eine persönliche Wishlist-Verbindung benötigt ein separates Auth-Konzept. Ein vom Nutzer kopierter Token darf höchstens im Arbeitsspeicher der aktuellen Sitzung liegen; bevorzugt wird eine von CardTrader freigegebene serverseitige Verbindung.
- Keine Scrapes, keine undokumentierten URLs, kein automatischer `cart/purchase`-Aufruf.
- Vor produktiver Nutzung von Markt-/Preis- und Bilddaten wird CardTrader schriftlich um Freigabe für diesen konkreten Drittanbieter-Fall gebeten.

## Arbeitsprotokoll für jeden Schritt

- Genau einen Schritt bearbeiten, testen, dokumentieren und commitfähig hinterlassen; danach stoppen.
- Zu Beginn: `git status`, Branch, letzter Commit und diesen Plan lesen.
- Vorhandene Nutzerdaten, fremde Änderungen und Provider-Mappings erhalten.
- Am Ende berichten: geänderte Dateien, Entscheidungen, Tests, ausgelassene Prüfungen, offene Risiken, nächstes Modell.
- Kein Merge, Deployment, Kauf, Warenkorb oder externe Wishlist ohne die dafür ausdrücklich verlangte Freigabe.
- Luna ändert keine freigegebenen Domainverträge eigenmächtig; Sol baut UI nicht parallel neu.

## Fortschritt

- [x] Schritt 1 — Einsteigerstrecke und Kartenbrowser-Spezifikation (`docs/ui-ux-card-browser-spec.md`)
- [x] Schritt 2 — Browser-Session, Undo und Status-Domain
- [x] Schritt 3 — Schnelles Hinzufügen aus einem leeren Slot
- [x] Schritt 4 — Set-Daten, Assets, Suche und Sortierung
- [x] Schritt 5 — Visueller Karten- und Set-Browser
- [x] Schritt 6 — Mehrfachauswahl, Set-Binder und Fehlkarten-Gruppierung
- [x] Schritt 7 — Geführte Binder-Erstellung und Mehrfach-UX
- [x] Schritt 8 — CardTrader Discovery, Mapping und Rechte-Gate; produktive Daten bleiben NO-GO
- [x] Schritt 9 — CardTrader-UX vorbereitet und hinter deaktivierten Flags geschützt
- [ ] Schritt 10 — Extern blockiert: keine Freigabe und kein vertrauenswürdiges Karten-/Variantenmapping
- [ ] Schritt 11 — Technische Fokusarbeit erledigt; menschliche Viewport-, Screenreader- und Einsteigerabnahme offen
- [x] Schritt 12 — Technischer Release-Kandidat dokumentiert; öffentliche Produktion bleibt NO-GO

## Schritt 1 — Luna: Einsteigerstrecke und Kartenbrowser-Spezifikation

**Modell:** Luna (`gpt-6-luna`), Reasoning high

**Ziel:** Den einfachsten durchgängigen Ablauf für Eltern und andere Einsteiger festlegen, bevor Komponenten umgebaut werden.

**Aufgaben:**

- Die drei Einstiege „Leer starten“, „Mit Set starten“ und „Geschenk erstellen“ als eine klare Informationsarchitektur ausarbeiten.
- Den Einzelkarten-Ablauf von leerem Slot bis bestätigter Variante als klickbaren/implementierbaren UI-Zustandsplan dokumentieren.
- Alltagstexte und kurze Hilfen für Set, Holo, Reverse Holo, First Edition, Unlimited und Zustand definieren.
- Progressive Disclosure festlegen: Suche, Sprache, Set und Sortierung sichtbar; Spezialfilter und Detailwissen eingeklappt.
- Zustände `ausgewählt`, `eingeplant`, `fehlt`, `vorhanden` visuell und textlich trennen.
- Desktop- und Mobil-Wireframes sowie Fokusreihenfolge für den Kartenbrowser festlegen.
- Fünf kurze Usability-Aufgaben für Personen ohne Pokémon-Kartenwissen definieren.

**Abnahme:** Jede Strecke hat genau eine erkennbare nächste Aktion; keine Aufgabe verlangt Setcode- oder Variantenwissen ohne Erklärung; bestehende Funktionen sind den geplanten Komponenten zugeordnet.

**Danach:** Zu Sol wechseln.

## Schritt 2 — Sol: Browser-Session, Undo und Status-Domain

**Modell:** Sol (`gpt-6-sol`), Reasoning high

**Ziel:** Die technische Grundlage für schnelles, sicheres Einfügen schaffen, ohne Binderzustände zu vermischen.

**Aufgaben:**

- Einen transienten `CardBrowserSession`-Vertrag für Ziel, Modus, Query, Filter, Sortierung, Scrollanker und Auswahl definieren.
- Einzel- und Mehrfachauswahl auf dem bestehenden `PageSelection`-Kern aufbauen.
- Reversible Binder-Mutationen für Einfügen und Mehrfacheinfügen ergänzen; Undo gilt exakt für die letzte bestätigte Aktion und respektiert Revisionen anderer Tabs.
- Selektions-, Planungs- und Besitzstatus aus aktueller Session und Binder ableiten.
- Regeln für bewusste Duplikate und „Weiteres Exemplar hinzufügen“ festlegen.
- Unit-Tests für belegte Ziele, zwischenzeitliche Revision, Undo, Duplikate, Besitzstatus und ungültige Varianten ergänzen.

**Abnahme:** Ein Insert ist atomar, überschreibt keinen belegten Slot, markiert nichts als vorhanden und kann unmittelbar sicher rückgängig gemacht werden.

**Danach:** Zu Luna wechseln.

## Schritt 3 — Luna: Schnelles Hinzufügen aus einem leeren Slot

**Modell:** Luna (`gpt-6-luna`), Reasoning high

**Ziel:** Punkte 1–7 der To-do-Liste produktiv fertigstellen.

**Aufgaben:**

- Kartenbrowser sofort öffnen und Skeleton-/Startkarten statt einer leeren Suchfläche zeigen.
- Binder, Seite und Slot dauerhaft im Kopf anzeigen.
- Zuletzt angesehen beziehungsweise Set-Kontext als klar beschriftete, reproduzierbare Startauswahl verwenden.
- Suche, aktive Filter, Ergebnisse und Scrollanker beim Wechsel zum nächsten freien Slot erhalten.
- Variantenprüfung nur bei Bedarf als verständlichen Zwischenschritt zeigen.
- Nach Einfügen Slot hervorheben, Erfolg mit Ziel nennen und „Rückgängig“ anbieten.
- Statusbadges sowie „Weiteres Exemplar hinzufügen“ umsetzen.
- Component-/Browser-Tests für Erfolg, Fehler, Undo, Duplikat und Fokus-Rückgabe ergänzen.

**Umsetzung:** Der leere Slot öffnet den Katalog ohne Suchzwang, zeigt Lade-Skeletons und Bild-Fallbacks, hält Binder/Seite/Slot sichtbar, bewahrt Filter und Scrollanker beim Prüfen und Zurückkehren und persistiert das Einsetzen über den reversiblen Page-Selection-Dienst. Eine Statusmeldung mit Ziel und „Rückgängig“ folgt direkt nach dem Speichern; bereits eingeplante bzw. vorhandene Karten werden in den Treffern markiert.

**Abnahme:** Der Einzelkarten-Ablauf ist umgesetzt und durch Lint, Typecheck und 202 Unit-Tests abgesichert. Ein dedizierter Browser-E2E-Test bleibt als Teil der späteren visuellen Abnahme offen.

**Danach:** Zu Sol wechseln.

## Schritt 4 — Sol: Set-Daten, Assets, Suche und Sortierung

**Modell:** Sol (`gpt-6-sol`), Reasoning high

**Ziel:** Eine belastbare Set-Grundlage für Browser, Set-Binder und Fehlkarten schaffen.

**Aufgaben:**

- Providerneutrale Set-Metadaten für ID, lokalisierte Namen, Serie, Veröffentlichungsdatum, Kartenzahl, Symbol und Logo definieren.
- TCGdex-Setdaten in der vorhandenen GitHub-Action synchronisieren und fehlende/ungültige Assets reporten.
- Numerische Kartensortierung inklusive Präfixen, Suffixen und Secret-Rare-Nummern implementieren.
- Sortieroptionen `Relevanz`, `Set → Nummer`, `Nummer`, `Erscheinungsdatum` als reine Ergebnissortierung anbieten.
- Suchbaren Set-Index und APIs für Karten/Set-Tabs bereitstellen.
- Regressionstest: keine Ergebnissortierung verändert Binderplätze.

**Umsetzung:** Der providerneutrale Setvertrag enthält lokalisierte Namen, Serie, Veröffentlichungsdatum, Kartenzahl sowie optionale Logo-/Symbol-Assets. Der statische Index ist lokalisierbar durchsuchbar. Die wöchentliche GitHub Action synchronisiert und auditiert diese Daten; ein eigener Asset-Bericht unterscheidet fehlende von ungültigen Referenzen. Alle 205 englischen und 144 deutschen physischen Sets besitzen ein Veröffentlichungsdatum. TCGdex liefert aktuell 146/205 englische Logos und 163/205 englische Symbole sowie 38/144 deutsche Logos und 122/144 deutsche Symbole; fehlende Assets bleiben zulässige Textfallbacks. Die Ergebnisansicht bietet vier reine Sortierungen mit natürlicher Kartennummernordnung.

**Abnahme:** Setdaten sind aktuell, durchsuchbar und reproduzierbar sortiert. Der Asset-Audit meldet null ungültige Sets. Lint, Typecheck, 208 Unit-Tests, Katalog-Audit und der Webpack-Produktionsbuild sind erfolgreich. Der normale Turbopack-Build kann in der lokalen Sandbox keinen Hilfsprozess-Port öffnen; dies ist eine Umgebungsbeschränkung, kein Anwendungsfehler.

**Danach:** Zu Luna wechseln.

## Schritt 5 — Luna: Visueller Karten- und Set-Browser

**Modell:** Luna (`gpt-6-luna`), Reasoning high

**Ziel:** Punkte 8–13 sowie die betroffenen Teile von 21, 22 und 25 umsetzen.

**Aufgaben:**

- Kartenkacheln mit Bild, Name, kleinem Set-Symbol, Setname, Nummer, Sprache, Variante, Status und klarer Aktion gestalten.
- Tabs „Karten“ und „Sets“ bauen; Setkarten zeigen Logo, Name, Serie und Erscheinungsdatum.
- Durchsuchbare Set-Auswahl, entfernbare Filterchips und „Alle Filter zurücksetzen“ umsetzen.
- Sortierung getrennt von Filtern darstellen.
- Nulltreffer mit konkreten Reparaturaktionen behandeln.
- Kartenraster mit stabilen Skeletons, kleinen Vorschaubildern und größerem Detailbild umsetzen.
- Lange Namen, fehlende Symbole/Logos und Bildfehler responsiv testen.

**Abnahme:** Der Weg „Set suchen → Set öffnen → nach Nummer sortierte Karte auswählen“ funktioniert ohne Kartennamenkenntnis.

**Umsetzung:** Der Katalog bietet getrennte Tabs für Karten und Sets. Karten erscheinen als responsive Bildkacheln mit Name, Set, Nummer, Sprache, Besitz-/Planungsstatus und „Prüfen“. Sets sind lokal nach ID, lokalisierten Namen und Serie durchsuchbar; Logo/Symbol werden über einen Sprachfallback geladen. „Set öffnen“ übernimmt Serie und Set in die Kartenfilter und stellt die Sortierung auf Kartennummer. Filterchips und konkrete Rücksetz-Aktionen helfen bei Nulltreffern.

**Abnahme:** Lint, Typecheck, 208 Unit-Tests und der Webpack-Produktionsbuild sind erfolgreich. Die externe Bildstrategie nutzt bewusst den bestehenden CDN-Fallback und bleibt durch Textfallback fehlertolerant.

**Danach:** Zu Sol wechseln.

## Schritt 6 — Sol: Mehrfachauswahl, Set-Binder und Fehlkarten-Gruppierung

**Modell:** Sol (`gpt-6-sol`), Reasoning high

**Ziel:** Die Domain für Punkte 14–18 fertigstellen.

**Aufgaben:**

- `PageSelection` um expliziten Startslot, aktuelle Seite versus fortlaufenden Bereich und Platzmangel-Entscheidung erweitern.
- „Nächster freier Slot“-Regel implementieren, ohne geplante Karten als frei zu behandeln.
- Set-Binder-Plan mit Sprache, Sammelumfang, Variantenstrategie, Kartenanzahl und benötigten Seiten definieren.
- Ungeklärte Varianten als prüfpflichtig statt als vollständig speichern.
- Fehlkarten nach Set gruppieren und innerhalb eines Sets fachlich korrekt sortieren.
- Unit-Tests für volle Seiten, Seitenübergang, belegte Slots, 1/8/9/10/18/36 Karten, Setumfang und Varianten ergänzen.

**Abnahme:** Mehrfachplatzierung ist deterministisch und überschreibt nichts; Set-Binder-Vorschau und Fehlkartenzahlen benutzen denselben bestätigten Sammelumfang.

**Umsetzung:** `PageSelection` unterstützt neben einer einzelnen Seite jetzt einen expliziten Startslot und fortlaufende Bereiche über vorhandene Seiten. Belegte Slots werden immer übersprungen; neue Seiten entstehen nur mit der expliziten Overflow-Regel `add-pages`, ansonsten schlägt die gesamte Mutation atomar fehl. Unvollständige Varianten dürfen ausschließlich in Set-Builder-Flows als `variantReview: required` gespeichert werden; abgeschlossene, fachlich ungültige Kombinationen bleiben blockiert. Der neue Set-Binder-Plan berechnet Umfang, bekannte Finish-Varianten, Prüfbedarf und Seitenanzahl. Fehlkarten werden unabhängig von der Binderanordnung nach Set/Sprache gruppiert und natürlich nach Sammlernummer sortiert.

**Abnahme:** Die Grenzfälle 1/8/9/10/18/36 Karten, volle Seiten, Seitenübergänge, belegte Plätze, Katalogabdeckung, bekannte/ungeklärte Varianten und Fehlkartensortierung sind durch Unit-Tests abgesichert. Lint, Typecheck und 226 Tests sind erfolgreich.

**Danach:** Zu Luna wechseln.

## Schritt 7 — Luna: Geführte Binder-Erstellung und Mehrfach-UX

**Modell:** Luna (`gpt-6-luna`), Reasoning high

**Ziel:** Punkte 14–20 als einfache, einsteigerfreundliche Oberfläche abschließen.

**Aufgaben:**

- „Binder erstellen“ als geführten Einstieg mit „Leer“, „Set“ und sekundär „Geschenk“ umsetzen.
- Set-Binder-Vorschau in verständlicher Sprache zeigen: Karten, Seiten, Sprache, Umfang und noch zu prüfende Ausgaben.
- Normalen Katalog und Motivsuche in denselben Mehrfachauswahl-Rahmen integrieren.
- Fixierte Auswahlleiste mit Anzahl, Kapazität, Entfernen und „Karten einplanen“ bauen.
- Ziel-/Befüllungsregel vor Bestätigung visualisieren.
- Optionalen „Nächsten freien Platz füllen“-Modus klar ein-/ausschaltbar machen.
- Fehlkartenübersicht nach Sets gestalten, ohne die Binderanordnung zu verändern.

**Abnahme:** Eine Person ohne Fachwissen kann einen leeren Binder, einen Set-Binder oder einen Geschenk-Binder anlegen und versteht vor dem Speichern das Ergebnis.

**Umsetzung:** Der Binder-Einstieg bietet neben dem freien Start jetzt „Mit einem Set starten“. Der Set-Wizard lädt die vollständigen Karten eines ausgewählten TCGdex-Sets in der gewählten Sprache, lässt offiziellen Nummernumfang oder kompletten Katalog sowie eine bestätigte Finish-Strategie wählen und zeigt Kartenprobe, Seitenzahl, Abdeckung und Prüfhinweise vor dem Anlegen. Der normale Katalog unterstützt eine Auswahl von bis zu neun Karten mit fixer Auswahlleiste; die Auswahl wird über denselben Review wie die Motivsuche geprüft. Der Review bietet zusätzlich die fortlaufende Befüllung ab dem nächsten freien Slot mit ausdrücklichem Seiten-Overflow. Fehlkarten werden nach Set und Sprache gruppiert.

**Abnahme:** Lint, Typecheck, 39 Testdateien mit 226 Tests und der Webpack-Produktionsbuild sind erfolgreich. Die Browser-E2E-Abnahme sowie die Ladezeit sehr großer Sets bleiben für den visuellen QA-Schritt offen.

**Danach:** Zu Sol wechseln.

## Schritt 8 — Sol: CardTrader Discovery, Mapping und Rechte-Gate

**Modell:** Sol (`gpt-6-sol`), Reasoning high

**Ziel:** CardTrader technisch und rechtlich belastbar vorbereiten, bevor Daten produktiv angezeigt werden.

**Aufgaben:**

- Offizielle API mit einem dafür vorgesehenen Testkonto/token gegen Pokémon-Games, Kategorien, Expansions, Blueprints und Wishlist-Felder prüfen.
- Für alle aktuell unterstützten TCGdex-Sets die Mapping-Abdeckung messen: direkte Fremd-IDs zuerst, danach Set/Nummer/Name-Kandidaten, unsichere Matches in Review-Datei.
- Pokémon-spezifische `editable_properties` und Zustandswerte erfassen.
- Stichprobe für `image_url`, Sprachbezug, Bildauflösung und fehlende Bilder erstellen.
- Stichprobe für Marketplace-Angebote, Cacheverhalten, Währungen und Variantenfilter erstellen.
- CardTrader schriftlich um Produktionsfreigabe für Katalog-Mapping, Bildfallback und aggregierte Preis-/Verfügbarkeitsanzeige bitten; Ergebnis dokumentieren.
- Providerneutrale Adapter und Zod-Schemas implementieren, aber alle CardTrader-UI-Flags zunächst aus lassen.

**Abnahme:** Es gibt einen reproduzierbaren Abdeckungsbericht, keine unsichere automatische Zuordnung, keine Secrets im Client/Repo und eine dokumentierte Go/No-Go-Entscheidung je Datenart.

**Umsetzungsstand 08.10.2026:** Adapter, Zod-Schemas, konservative Mappinglogik, lokale Discovery-/Audit-Skripte, getrennte deaktivierte Flags und Rechte-Gate sind umgesetzt. Der authentifizierte Read-only-Vollaudit und die sichere Property-Auswertung sind abgeschlossen. Alle 349 sprachspezifischen Setdatensätze sind geprüft und klassifiziert: 338 sind manuell verifiziert, 11 mit belegter Begründung ausgeschlossen; es bleiben 0 direkt zu prüfende, 0 mehrdeutige und 0 unklassifizierte Fälle. Der Fremd-ID-Vollaudit erfasste 21.948 Pokémon-Singles-Blueprints in den 188 verifizierten CardTrader-Expansionen: 21.780 besitzen mindestens eine katalogweit eindeutige Cardmarket- oder TCGplayer-ID, 168 keine der beiden; kollidierende oder ungültige Fremd-ID-Werte wurden nicht gefunden. Das belegt nur die CardTrader-seitige Eindeutigkeit. Der aktuelle dokumentierte TCGdex-Kartenvertrag liefert noch keine passende direkte Varianten-ID und TCGdex warnt vor bekannten Marketplace-Fehlzuordnungen. Deshalb bleibt das Kartenmapping ebenso wie Bilder, Preise und Wishlist geschlossen. Die gelesenen Blueprint-Daten melden zwar durchgehend Bild-URLs, belegen aber weder Sprache noch Nutzungsrecht. Markt-/Variantenstichprobe, eine direkte Quell-ID oder manuell geprüfte Kartenzuordnung und die schriftliche CardTrader-Freigabe bleiben externe Blocker; Preise, Providerbilder, Wishlist und Commerce wurden deshalb nicht freigeschaltet. Details: `docs/cardtrader-release-gate.md`.

**Danach:** Zu Luna wechseln.

## Schritt 9 — Luna: CardTrader UX für normale Nutzer

**Modell:** Luna (`gpt-6-luna`), Reasoning high

**Ziel:** CardTrader als verständliche Option integrieren, ohne Nutzer mit drei Marketplace-Blöcken zu überladen.

**Aufgaben:**

- In „Fehlende Karten“ einen einzigen Provider-Switch für Cardmarket, TCGplayer und CardTrader verwenden.
- CardTrader-Vorschau mit Trefferstatus, Ausgabe, Sprache, Finish, Zustand und Menge gestalten.
- Preis als Spanne plus Zeitpunkt/Konfidenz zeigen; Versand und Steuer ausdrücklich trennen.
- Unbekannten Preis, veraltete Daten, mehrere mögliche Blueprints und fehlende Freigabe verständlich darstellen.
- „CardTrader-Wunschliste erstellen“ von „Angebote ansehen“ und jeder Warenkorbaktion trennen.
- Verbindung/Token als fortgeschrittenen Schritt erklären; keine Token-Persistenz anbieten.
- Bildfallback sprachlich kennzeichnen, damit ein englisches/Providerbild nicht als deutsche Kartenausgabe missverstanden wird.

**Abnahme:** Pro Provider wird nur ein Panel gezeigt; Nutzer verstehen, was sicher zugeordnet ist, was geschätzt wird und was Cardfolio nicht automatisch kauft.

**Umsetzungsstand 04.10.2026:** Der Provider-Switch unterstützt CardTrader hinter `FEATURES.cardtraderCatalog` (aktuell `false`). Die vorbereitete Ansicht zeigt Status, Ausgabevorschau, Sprache, Finish, Edition, Zustand, Menge, Bildquelle, Preis-/Zeit-/Konfidenzstatus sowie getrennte, deaktivierte Angebote-/Wishlist-Aktionen. Token werden im Panel weder abgefragt noch gespeichert. Aktivierung bleibt bis zum externen CardTrader-Gate aus Schritt 8 blockiert.

**Danach:** Zu Sol wechseln.

## Schritt 10 — Sol: CardTrader Sync, Preise, Bilder und Wishlist-Übergabe

**Modell:** Sol (`gpt-6-sol`), Reasoning high

**Ziel:** Die freigegebenen CardTrader-Funktionen produktiv, testbar und abschaltbar implementieren.

**Aufgaben:**

- GitHub-Action für Katalog-/Mapping-Sync mit Secret, Rate-Limit, Retry, Validierung, Diffbericht und manueller Review ergänzen.
- Nur freigegebene, minimale statische Mappingdaten an Cloudflare ausliefern.
- Preisadapter mit exakter Variantenfilterung, Währungstrennung, TTL, Stichprobengröße, Median/Spanne und Stale-Status implementieren.
- CardTrader-Bild als dritte Fallbackstufe nur bei Freigabe und eindeutigem Blueprint aktivieren.
- Wishlist-Payload anhand `blueprint_id` und bestätigter Varianten erzeugen und mit Contract-Tests absichern.
- Verbundene Wishlist-Erstellung hinter separatem Flag und expliziter Bestätigung implementieren; Teilfehler pro Position zurückmelden.
- Neutrale JSON/CSV-Prüfdatei für nicht verbundene Nutzer anbieten, ohne falsches Importversprechen.
- Niemals `cart/purchase` aufrufen; `cardtraderCommerce` bleibt deaktiviert.

**Abnahme:** Exakte Karten können verlustfrei in eine private Wishlist übergeben werden; unklare Karten bleiben in Cardfolio zur Prüfung; Preise/Bilder verschwinden sauber, wenn Flag, Freigabe oder Daten fehlen.

**Danach:** Zu Luna wechseln.

## Schritt 11 — Luna: Responsive, Accessibility und Eltern-Usability

**Modell:** Luna (`gpt-6-luna`), Reasoning high

**Ziel:** Die gesamte neue Strecke auf Verständlichkeit statt nur technische Funktion prüfen.

**Aufgaben:**

- Kartenbrowser auf 375/768/1024/1440 px gezielt gestalten und prüfen.
- Modal-Fokusfalle, Escape, Fokus-Rückgabe, sichtbaren Fokus, Screenreader-Texte und reduzierte Bewegung verifizieren.
- Alle Kernstrecken ohne Drag-and-drop bedienbar machen.
- Fünf Einsteigeraufgaben aus Schritt 1 mit mindestens drei Personen ohne aktives TCG-Wissen testen; Beobachtungen statt Selbsteinschätzung dokumentieren.
- Begriffe und Reihenfolge anhand der Tests korrigieren, ohne Domainregeln zu lockern.
- Nulltreffer, Offline, Bildfehler, veralteter Preis, CardTrader nicht verbunden und Teil-Wishlist testen.

**Abnahme:** Die definierten Einsteigeraufgaben sind ohne externe Erklärung abschließbar; es gibt keine Fokusfalle, verdeckte Hauptaktion oder rein farbliche Statusinformation.

**Umsetzungsstand 09.10.2026:** Die gemeinsame Modal-Schicht hält den Tastaturfokus jetzt in allen echten Bestätigungs- und Auswahlfenstern, unterstützt zyklisches Tabben und schließt per Escape über die jeweils sichtbare Abbrechen-Aktion. Die Suchleiste behält ihre bestehende mobile Fokus-Rückgabe. Ein neuer Browser-Test prüft die vier Ziel-Viewports (375/768/1024/1440 px), horizontale Überbreite, sichtbares erstes Tastaturziel und Fokuskennzeichnung. Die lokale macOS-Sandbox konnte Chromium beim gezielten Playwright-Lauf wegen einer Betriebssystem-Berechtigung (`MachPortRendezvous … Permission denied`) nicht starten, daher bleibt die Browserabnahme CI-pflichtig. Screenreader-Prüfung und der Einsteigertest mit mindestens drei Personen bleiben als menschliche Abnahme offen; die konkrete Checkliste steht in `docs/accessibility-acceptance-2026-10-09.md`.

**Danach:** Zu Sol wechseln.

## Schritt 12 — Sol: End-to-End-Abnahme und Release-Gates

**Modell:** Sol (`gpt-6-sol`), Reasoning high

**Ziel:** Datenqualität, Sicherheit und vollständige Abläufe vor einer Freigabe beweisen.

**Aufgaben:**

- E2E-Tests für Einzelkarte, Undo, nächste freie Position, Mehrfachauswahl, Set-Binder, Motivsuche, Geschenk-Binder und alle drei Provider-Übergaben ergänzen.
- Tests für Revisionskonflikt, Backup/Restore, Offline, Rate Limit, abgelaufenen Preis, falsches Mapping und Teilfehler ausführen.
- `typecheck`, `lint`, Unit-/Component-Tests, statischen Build, Release-Checks und Browser-Tests ausführen.
- Bundle-/Datenvolumen, Suchlatenz, Kartenbrowser-Ladezeit und mobile Stabilität messen.
- Datenschutz-, Secret-, Lizenz-, Bild-, Preis- und CardTrader-Freigabegates dokumentieren.
- Feature-Flags und Rollbackpfad festlegen; CardTrader-Datenarten nur einzeln aktivieren.
- Finale Go/No-Go-Tabelle mit Commit, Datenstand, Mapping-/Preisabdeckung und bekannten Grenzen erstellen.

**Abnahme:** Kein P0/P1-Fehler, keine Secrets oder nicht freigegebenen Daten im Client, alle Kernstrecken grün und jede externe Behauptung mit Datenstand/Quelle versehen.

**Umsetzungsstand 08.10.2026:** Für den Anwendungscommit `0f92ecadfed801f1939f92adf5b0257ad8ab26c1` bestehen Typecheck, Lint, 44 Testdateien mit 248 Unit-/Component-Tests, statischer Build, Release-Checks, reproduzierbare Release-Evidence und 21 Chromium-E2E-Tests ohne Flaky Retry. Die E2E-Strecke umfasst Einzelkarte, Reload, Undo, atomare Mehrfachauswahl, fortlaufende Befüllung, Set-Binder, Smart-Search-Einfügen, Backup/Restore sowie Marketplace-Handoffs. Bundle, öffentliche Daten, semantischer Index, Katalog- und Mappingabdeckung werden maschinenlesbar im CI-Lauf protokolliert; es werden null Raster-Kartenbilder ausgeliefert. Die technische Go/No-Go-Tabelle, Rollbackgrenzen und verbleibenden menschlichen beziehungsweise externen Blocker stehen in `docs/technical-release-candidate-2026-10-08.md`. CardTrader-Datenarten bleiben einzeln deaktiviert. Öffentliche Produktion und Deployment sind nicht freigegeben.

**Danach:** Zu Luna wechseln und die noch offene menschliche Abnahme aus Schritt 11 durchführen. Erst nach Schließen aller übrigen NO-GO-Gates darf Sol einen finalen Produktions-Release-Record vorbereiten und um ausdrückliche Deployment-Freigabe bitten.

## Empfohlene Priorität

1. Schritte 1–5: Einzelkarten-Erlebnis und Set-Navigation – höchster unmittelbarer Nutzwert.
2. Schritte 6–7: größere Seiten und komplette Set-Binder.
3. Schritte 8–10: CardTrader kontrolliert ergänzen; Katalog/Mappings vor Preisen, Preise vor Wishlist-Verbindung.
4. Schritte 11–12: Gesamtabnahme und gestufte Freigabe.

## Nicht Teil dieses Plans

- automatischer Kauf oder CardTrader-`purchase`
- garantierte Marktwerte oder garantierte Lieferbarkeit
- heimliche Speicherung persönlicher CardTrader-Tokens
- Scraping von CardTrader-, Cardmarket- oder TCGplayer-Seiten
- automatische Neuordnung bestehender Binderseiten
- Übernahme des vollständigen PkmnBindr-Designs
- Pokémon-Bilder oder Logos als exportierte Cover-Assets ohne eigene Rechtefreigabe

## Offizielle CardTrader-Quellen

- API-Referenz: https://www.cardtrader.com/en/docs/api/full/reference
- Terms of Service: https://static.cardtrader.com/en/pages/terms-of-service
