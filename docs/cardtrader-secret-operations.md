# CardTrader-Secret sicher betreiben

Stand: 4. Oktober 2026

## Aktueller Status

- Das GitHub-Actions-Secret `CARDTRADER_API_TOKEN` ist im Repository `ThorfinnThor/cardfolio` registriert.
- Der Secret-Wert wurde von Cardfolio weder gelesen noch ausgegeben.
- Der Token wird ausschließlich vom manuell startbaren Workflow `cardtrader-discovery.yml` verwendet. Das bloße Anlegen des Secrets löst weiterhin keinen CardTrader-Aufruf aus.
- Katalog, Bilder, Preise, Wishlist und Commerce bleiben über getrennte Feature-Flags deaktiviert.

### CardTrader-Begriffe für Cardfolio

- Ein **Blueprint** beschreibt das exakte kaufbare Kartenmodell, zum Beispiel Spiel, Set,
  Kartennummer, Sprache und Variante. Cardfolio darf für einen späteren Export nur einen
  eindeutig bestätigten Blueprint referenzieren.
- Ein **Product** ist dagegen ein konkretes Verkäuferangebot zu einem Blueprint, also mit
  Verkäufer, Menge, Preis und weiteren Angebotsdaten. Ein Product ist nicht die Karten-
  Identität und darf nicht als Ersatz für ein Blueprint-Mapping gespeichert werden.

## GitHub Actions

Der Token darf ausschließlich über `${{ secrets.CARDTRADER_API_TOKEN }}` an den Discovery-Schritt übergeben werden. Er darf nicht als Repository-Variable, Workflow-Input, Kommandozeilenargument oder Teil eines Artifacts verwendet werden.

Der erste Workflow ist nur manuell über `workflow_dispatch` startbar. Er darf ausschließlich die dokumentierten read-only Katalogendpunkte aufrufen:

- `/info` zur Authentifizierungsprüfung; `shared_secret` muss vor jeder Ausgabe entfernt werden.
- `/games`
- `/categories`
- `/expansions`
- `/blueprints/export`

Nicht erlaubt sind im ersten Workflow:

- `/marketplace/products`
- Wishlist-Schreibzugriffe
- `/cart`, `/cart/add` oder `/purchase`
- Ausgabe des vollständigen HTTP-Headers, der Prozessumgebung oder der rohen `/info`-Antwort
- Upload eines unbereinigten Discovery-Snapshots

### Manuell starten

1. In GitHub **Actions → CardTrader read-only discovery → Run workflow** öffnen.
2. Für den ersten Lauf `3` Expansionen ausgewählt lassen.
3. Nach erfolgreichem Lauf die Step Summary prüfen.
4. Nur die beiden sieben Tage verfügbaren Artifacts `discovery-summary.json` und
   `mapping-audit.json` herunterladen. Der rohe Snapshot bleibt ausschließlich auf dem
   kurzlebigen GitHub-Runner und wird nicht hochgeladen.
5. `0` für den vollständigen Katalog erst nach einem erfolgreichen kleinen Lauf verwenden.

Der Workflow hat nur `contents: read`, führt keinen Commit und keinen Push aus und kann
deshalb weder Katalogdateien noch Anwendungscode verändern. Bild-URLs werden im rohen,
nicht hochgeladenen Snapshot lediglich gezählt; sie werden weder gerendert noch als
Cardfolio-Bildquelle freigeschaltet.

### Verständliche Fehlerzustände

| Meldung | Bedeutung | Nächste Aktion |
|---|---|---|
| `CardTrader-Token fehlt` | Der lokale Lauf oder Workflow hat kein Secret erhalten. | Secret-Namen exakt prüfen; Token nicht in den Quelltext eintragen. |
| `Token fehlt, ist ungültig oder abgelaufen` | CardTrader antwortete mit HTTP 401/403. | Token in CardTrader rotieren und als `CARDTRADER_API_TOKEN` aktualisieren. |
| `CardTrader begrenzt die Anfragen` | HTTP 429; der Rate-Limit-Schutz wurde erreicht. | Warten und den read-only Audit später erneut starten; nicht parallel wiederholen. |
| `Anfrage fehlgeschlagen` oder Netzwerk-/Abbruchfehler | Dienst, Verbindung oder Lauf wurde unterbrochen. | Lauf als unvollständig behandeln und Snapshot nicht freigeben. |
| `review-required`/mehrdeutiger Blueprint | Mehrere CardTrader-Blueprints passen zur TCGdex-Identität. | Manuell anhand Sprache, Set, Kartennummer und Variante prüfen. |

Keiner dieser Fehler darf den Token, den Authorization-Header, eine rohe `/info`-Antwort
oder `shared_secret` enthalten. Ein Fehler ist kein Grund, Bilder, Preise oder Wishlists
automatisch freizuschalten.

## Lokaler Test

Für einen lokalen Lauf wird der Token nur für die aktuelle Shell bereitgestellt. Er gehört nicht in `.env.local`, weil das Projekt für diesen einmaligen Audit keine persistente lokale Secret-Datei benötigt.

```bash
read -s CARDTRADER_API_TOKEN
export CARDTRADER_API_TOKEN
npm run cardtrader:discover -- --max-expansions 3 --out .cardtrader/discovery.json
unset CARDTRADER_API_TOKEN
```

Die Eingabe von `read -s` bleibt unsichtbar. `.cardtrader/` ist git-ignoriert. Der lokale Snapshot darf nicht weitergegeben werden, bevor sein Inhalt geprüft wurde.

## Rotation und Widerruf

Der Token wird sofort ersetzt, wenn er in einem Screenshot, Chat, Terminalprotokoll, Artifact oder Commit sichtbar war. Vorgehen:

1. Den bisherigen Token in CardTrader widerrufen beziehungsweise neu erzeugen.
2. In GitHub unter **Settings → Secrets and variables → Actions** den Wert von `CARDTRADER_API_TOKEN` aktualisieren.
3. Lokale Shells mit `unset CARDTRADER_API_TOKEN` bereinigen.
4. Workflow-Logs und Artifacts prüfen; ein bloßes Löschen des GitHub-Secrets entfernt bereits erzeugte Logs oder Artifacts nicht.
5. Erst nach einem erfolgreichen Authentifizierungstest weiterarbeiten.

Ein produktiver Token sollte später getrennt vom Testtoken rotierbar bleiben. Seine Einführung benötigt eine eigene dokumentierte Freigabe; das heutige Secret gilt nur für den kontrollierten Discovery-Lauf.
