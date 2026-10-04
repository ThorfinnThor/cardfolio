# Kartenbrowser und Einsteigerstrecke — UI-Spezifikation

Stand: 2026-10-03  
Bezug: Schritt 1 aus `docs/ui-ux-cardtrader-model-plan.md`

Diese Spezifikation übersetzt die UI/UX-To-do-Liste in einen konkreten Ablauf für Menschen ohne Pokémon-Kartenwissen. Sie beschreibt zuerst Verhalten und Sprache. Die technische Umsetzung folgt in einem separaten Sol-Schritt.

## Leitidee

Cardfolio soll sich wie ein geführter Ausfüllvorgang anfühlen: eine sichtbare nächste Aktion, eine verständliche Vorschau und eine sichere Bestätigung. Ein Nutzer muss weder Setcodes noch Marketplace-Formate kennen.

Es gibt keinen getrennten „Eltern-Modus“. Der Standard ist bereits ruhig und einfach; seltene Fachoptionen werden erst eingeblendet, wenn sie für genau diese Karte relevant sind.

## Haupteinstieg: „Binder erstellen“

Auf der Binderübersicht gibt es eine primäre Aktion **Binder erstellen**. Nach dem Klick werden drei Wege als Karten mit einer kurzen Erklärung angeboten:

1. **Leer starten**  
   „Du möchtest selbst entscheiden, welche Karten auf die Seiten kommen.“
2. **Mit einem Set starten**  
   „Wähle eine Erweiterung und plane ihre Karten nach Nummern ein.“
3. **Geschenk erstellen**  
   „Lass dir passende Karten nach Pokémon, Motiv und Budget vorschlagen.“

„Leer starten“ ist der Standardfokus. „Geschenk erstellen“ bleibt ein eigener, sekundärer Weg und mischt sich nicht in den normalen Bindereditor.

### Pflichtangaben beim leeren Binder

- Bindername, mit Beispiel „Meine Lieblingskarten“
- Format mit verständlicher Beschreibung, zum Beispiel „3 × 3 Karten pro Seite“

Seiten und Karten werden danach hinzugefügt. Es gibt keine zusätzliche Entscheidung vor dem ersten leeren Binder.

### Pflichtangaben beim Set-Binder

- Sprache: Deutsch, English oder beide
- Set
- Umfang: „Alle Karten“, „Nur Hauptset“ oder ein späterer, klar benannter eigener Umfang
- Variantenregel: „Varianten später prüfen“ oder eine konkret bestätigte Auswahl

Vor dem Speichern zeigt eine Vorschau die Kartenanzahl, Seitenanzahl und die Zahl der Karten, die noch geprüft werden müssen. Ungeklärte Varianten werden nicht als vollständig bestimmt gespeichert.

## Einzelkarte: vom leeren Slot bis zum Einfügen

### Zustand A — Leerer Slot

Auslöser: Klick auf **Karte einsetzen**.

Sofort:

- Kartenbrowser öffnet sich.
- Der Fokus landet im Suchfeld.
- Im Kopf steht die Zielangabe: **„Karte hinzufügen · [Bindername] · [Seitentitel] · Slot [Nummer]“**.
- Darunter steht eine knappe Erklärung: „Die Karte wird nur eingeplant. Besitz markierst du später separat.“
- Ohne Suchbegriff werden eine kleine Entdecken-Auswahl oder der aktuelle Set-Kontext geladen; niemals eine leere Fläche ohne Erklärung.

Wenn kein Zielslot übergeben wurde, wird „nächster freier Slot“ angezeigt. Sobald ein konkreter Slot gewählt wird, bleibt dieser sichtbar und wird nicht stillschweigend ersetzt.

### Zustand B — Browser ohne Suchbegriff

Die primären Bedienelemente sind:

- Name oder Kartennummer suchen
- Kartensprache: **Alle**, **Deutsch**, **English**
- Set suchen/auswählen
- Sortieren: **Relevanz**, **Set → Kartennummer**, **Kartennummer**

Die Startauswahl ist beschriftet, zum Beispiel **„Entdecken · zuletzt angesehen“** oder **„Karten aus Base Set“**. Ein automatisch übernommener Filter wird als entfernbarer Chip angezeigt.

### Zustand C — Trefferliste

Jeder Treffer folgt derselben Hierarchie:

1. Kartenbild
2. Kartenname
3. Setname und Kartennummer
4. Sprache
5. kleine Varianten-/Statusinformation, falls bereits bekannt
6. **Prüfen**

Im normalen Katalog werden Karten als visuelle Kacheln angezeigt. Ein fehlendes Bild ersetzt nur das Bildfeld; Name, Set und Nummer bleiben nutzbar.

Statusbegriffe:

- **Ausgewählt** — nur für die aktuelle, noch nicht gespeicherte Auswahl
- **Bereits eingeplant** — diese Karte/Variante liegt bereits in diesem Binder
- **Vorhanden** — die Karte ist im Binder als physisch vorhanden markiert
- **Fehlt** — die Karte ist eingeplant, aber noch nicht vorhanden

Mehrere Status dürfen gleichzeitig erscheinen, zum Beispiel „Bereits eingeplant · Fehlt“. Eine bewusste zweite Kopie verwendet die Aktion **Weiteres Exemplar hinzufügen**.

### Zustand D — Kartendetails / „Prüfen“

Vor dem Speichern stehen sichtbar:

- großes Kartenbild oder Bildfallback
- Kartenname
- Setname
- Kartennummer im Format `Nummer/Gesamtzahl`, wenn bekannt
- Sprache
- Finish
- Edition
- Druckvariante
- Mindestzustand für spätere Marketplace-Übergaben

Die Varianten werden in dieser Reihenfolge erklärt:

- **Finish:** „Normal“, „Holo (glänzend)“ oder „Reverse Holo“
- **Edition:** „Unlimited (Standarddruck)“ oder „First Edition (1. Auflage)“
- **Druckvariante:** „Mit Schatten / Standard“ oder eine ausdrücklich benannte Alternative
- **Zustand:** „Beliebig“, „Near Mint“, „Excellent“ usw., abhängig vom jeweiligen Anbieter

Für neue physische Karten gelten, sofern die Karte diese Werte unterstützt, die sicheren Standardwerte **Unlimited** und **Mit Schatten / Standard**. Finish bleibt verpflichtend und wird nicht geraten. Bei alten oder mehrdeutigen Karten erscheint **Variante prüfen**, bevor „Einplanen“ aktiviert wird.

Hilfetexte werden direkt unter der Auswahl eingeblendet, nicht als vorausgesetztes Vorwissen. Beispiel: „Unlimited bedeutet: keine 1. Auflage. Wenn du das nicht weißt, kannst du die Karte später prüfen.“

Die Hauptaktion heißt **In diesen Slot einplanen**. Nicht „Kaufen“, nicht „Besitzen“.

### Zustand E — Bestätigung

Nach erfolgreichem Einfügen:

- der Zielslot erhält einen kurzen Fokus-/Statushinweis,
- die Meldung lautet beispielsweise **„Pikachu wurde in Seite 1, Slot 3 eingeplant.“**,
- direkt daneben erscheint **Rückgängig**,
- der Browser schließt sich im Einzelkartenmodus,
- im Modus „Nächsten freien Platz füllen“ bleibt er geöffnet und zeigt das neue Ziel.

Bei einem Fehler bleibt der Browser offen; es darf keine Erfolgsmeldung erscheinen.

## Mehrfachauswahl

Mehrfachauswahl ist ein eigener Modus, nicht die versteckte Nebenwirkung des normalen Slot-Klicks.

- Einstieg: **Mehrere Karten hinzufügen**.
- Auswahl wird mit Nummer und sichtbarer Markierung angezeigt.
- Eine feste Aktionsleiste zeigt „0 Karten ausgewählt“, Kapazität und die Hauptaktion **X Karten einplanen**.
- Vor Bestätigung wird das Ziel erklärt: „Aktuelle Seite ab Slot 4“ oder „Fortlaufend ab Slot 4“.
- Belegte oder bereits eingeplante Slots werden nicht als frei behandelt.
- Bei Platzmangel wird eine Entscheidung verlangt: Auswahl verkleinern, neue Seite anlegen oder abbrechen.

Die Prüfung von Sprache, Finish, Edition, Druckvariante und Zustand erfolgt gesammelt, aber pro Karte nachvollziehbar. Abbrechen verändert den Binder nicht.

## Motivsuche und Geschenk-Binder

Die Motivsuche trägt die sichtbare Bezeichnung **Nach Motiv im Bild suchen**. Direkt darunter steht:

„Die Motive sind automatisch aus Artwork-Daten abgeleitet und können unvollständig oder falsch sein. Karten ohne passendes Bild werden nicht zuverlässig erkannt.“

Der Geschenk-Binder nutzt dieselbe Auswahl- und Prüfstrecke wie ein normaler Binder. Er erhält keinen zweiten Karteneditor. Vorschläge ohne Bild werden nach Bildtreffern eingeordnet und als „Bild fehlt“ gekennzeichnet.

## Filter und leere Ergebnisse

Direkt sichtbar:

- Suchfeld
- Sprache
- Set
- Sortierung

Unter **Weitere Filter**:

- Finish
- Edition
- Druckvariante
- Kartentyp, Seltenheit und Illustrator, sobald diese fachlich verlässlich unterstützt werden

Aktive Filter werden als Chips dargestellt. Ein einzelner Chip kann entfernt werden; **Alle Filter zurücksetzen** setzt Suchtext, Sprache, Set und Spezialfilter gemeinsam zurück.

Nulltreffer erklären die Ursache und bieten eine passende Aktion:

- „Set-Filter entfernen“
- „Andere Sprache versuchen“
- „Zur normalen Namenssuche wechseln“
- „Suchbegriff löschen“

Ein Ladefehler lautet nicht „Keine Karten gefunden“. Er bietet **Erneut versuchen** und behält die Auswahl/Filter.

## Desktop und Mobil

### Desktop ab 1024 px

- Dialog mit sichtbarer Zielzeile
- Suchfeld und primäre Filter oben
- Kartenraster mit drei bis vier Spalten
- Detailansicht rechts oder als fokussierter Dialog
- Mehrfachauswahl-Aktionsleiste am unteren Dialogrand

### Mobil bis 767 px

- Vollbild-Kartenbrowser
- Zielzeile bleibt oben sichtbar
- Filter öffnen als eigener, fokussierter Abschnitt
- ein- bis zweispaltiges Kartenraster, abhängig von der Breite
- Hauptaktion bleibt am unteren Rand erreichbar, ohne Inhalte zu verdecken

### Tablet 768–1023 px

- zweispaltiges Raster
- Filter in einem ein-/ausklappbaren Abschnitt
- Detailansicht als Vollbreiten-Unteransicht

## Tastatur und Fokus

- Beim Öffnen: Fokus im Suchfeld.
- Tab bleibt innerhalb des Browsers, solange er offen ist.
- Escape schließt zuerst Detailansicht, danach den Browser.
- Nach dem Schließen geht der Fokus auf den auslösenden Slot zurück.
- Nach dem Einfügen geht der Fokus auf den aktualisierten Slot oder die Rückgängig-Aktion.
- Status und Auswahl werden mit Text und `aria-pressed`/`aria-live`, nicht nur mit Farbe, kommuniziert.
- Alle Kartenaktionen funktionieren ohne Drag-and-drop.

## Fünf Usability-Aufgaben für Personen ohne TCG-Vorwissen

Diese Aufgaben werden in Schritt 11 wiederholt. Es wird beobachtet, wo Nutzer stoppen oder Begriffe falsch verstehen.

1. „Erstelle einen Binder für deine Lieblingskarten und setze eine Karte in den ersten freien Platz.“
2. „Finde eine deutsche Pikachu-Karte aus einem Set und plane sie ein, ohne etwas zu kaufen.“
3. „Wähle drei Karten aus einem Set aus und lege sie auf einer neuen Binderseite ab.“
4. „Du hast versehentlich die falsche Karte eingesetzt. Mache die letzte Änderung rückgängig.“
5. „Finde eine Karte mit Schnee oder Eis im Bild und prüfe, ob die Variante für eine spätere Einkaufsliste vollständig ist.“

Erfolg bedeutet: Aufgabe ohne zusätzliche Erklärung abschließbar, Zielplatz korrekt, Besitzstatus nicht versehentlich gesetzt und keine andere Binderkarte verändert.

## Abnahmekriterien für Schritt 1

- Die drei Binder-Einstiege und ihr unterschiedlicher Zweck sind eindeutig beschrieben.
- Der leere Slot, die Suche, die Detailprüfung und die Bestätigung haben klar getrennte Zustände.
- Jeder Zustand besitzt eine Hauptaktion und einen verständlichen Fehler-/Abbruchweg.
- Sprache, Set, Nummer, Finish, Edition, Druckvariante und Zustand sind vor dem Speichern auffindbar.
- `Ausgewählt`, `eingeplant`, `vorhanden` und `fehlt` sind keine Synonyme.
- Die Strecke ist für Desktop, Mobil und Tastatur beschrieben.
- Die Usability-Aufgaben sind so formuliert, dass eine nicht spezialisierte Person sie ausführen kann.

## Bewusst noch nicht entschieden

- CardTrader-Token- und Konto-Verbindung; das folgt nach dem technischen Discovery-/Rechte-Gate.
- konkrete CardTrader-Preisformel; Preise werden erst nach Varianten-Mapping und Datenfreigabe geplant.
- automatische Umordnung bestehender Binderseiten.
- Upload persönlicher Fotos oder Verwendung von Pokémon-Artwork als Binder-Cover.

