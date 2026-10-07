# CardTrader Discovery und Release-Gate

Stand: 7. Oktober 2026

## Ergebnis

CardTrader ist in Cardfolio **noch nicht produktiv freigegeben**. Die providerneutrale Katalogschnittstelle, Laufzeitschemas, konservative Mappinglogik und reproduzierbare Audit-Werkzeuge sind vorbereitet. Alle UI-Flags bleiben aus.

Das GitHub-Actions-Secret `CARDTRADER_API_TOKEN` wurde am 4. Oktober 2026 unter dem korrekten Namen registriert; sein Wert wurde nicht gelesen oder ausgegeben. Die vollständigen authentifizierten Read-only-Läufe [37412387905](https://github.com/ThorfinnThor/cardfolio/actions/runs/37412387905), [37524478301](https://github.com/ThorfinnThor/cardfolio/actions/runs/37524478301), [37589460298](https://github.com/ThorfinnThor/cardfolio/actions/runs/37589460298), der Kartenname-Audit [37592043338](https://github.com/ThorfinnThor/cardfolio/actions/runs/37592043338), der Zwischenlauf [37592887597](https://github.com/ThorfinnThor/cardfolio/actions/runs/37592887597) und der abschließende Audit [37594414652](https://github.com/ThorfinnThor/cardfolio/actions/runs/37594414652) wurden am 6./7. Oktober erfolgreich abgeschlossen. Der Kartenname-Audit verglich alle 44 verbliebenen englischen Mengendifferenzen. Zunächst wurden 28 exakt benannte Expansionen mit vollständiger normalisierter TCGdex-Namensabdeckung bestätigt. Weitere 14 exakte Kandidaten wurden anschließend mit mindestens 94 % TCGdex-Namensabdeckung bestätigt; bei Legendary Treasures war stattdessen die CardTrader-Namensmenge vollständig in TCGdex enthalten. Die letzten Fälle wurden über die offiziellen CardTrader-Seiten für [DP Black Star Promos](https://www.cardtrader.com/en/games/pokemon/expansions/dp-black-star-promos/blueprints_search) und [POP Series 7](https://www.cardtrader.com/en-US/games/pokemon/expansions/pop-series-7/categories) bestätigt; CardTrader beschreibt POP Series 7 ausdrücklich als 17-Karten-Checkliste trotz 23 Singles-Blueprints. Die Holon-Phantoms-Mehrdeutigkeit wurde zugunsten von [EX Holon Phantoms](https://www.cardtrader.com/en/games/pokemon/expansions/ex-holon-phantoms/categories) aufgelöst: CardTrader nennt 110 Setkarten und 111 Singles, passend zu TCGdex 110 offiziell / 111 gesamt; der zweite Kandidat enthält nur 53 Singles. Damit sind 165 englische Expansionen und 121 deutsche Gegenstücke bestätigt. Der Folgeaudit zeigte außerdem, dass `collector_number` in den Blueprint-Daten nicht als durchgängige individuelle Kartennummer vorliegt: Im gesamten Katalog war nur ein Blueprint mit einem konfigurierten Standardwert vorhanden. Eine schriftliche Produktionsfreigabe von CardTrader liegt weiterhin nicht vor. Preise, Verfügbarkeit, Providerbilder und verbundene Wishlists bleiben deshalb No-Go.

### Aktueller Abdeckungsbericht

| Messwert | Ergebnis |
|---|---:|
| Englische TCGdex-Setdatensätze | 205 |
| Deutsche TCGdex-Setdatensätze | 144 |
| Zu prüfende sprachspezifische Setdatensätze | 349 |
| CardTrader-Pokémon-Expansionen | 856 |
| Gelesene Blueprints | 75.652 |
| Blueprints mit `image_url` | 75.652 |
| Blueprints ohne `image_url` | 0 |
| Manuell verifizierte sprachspezifische CardTrader-Zuordnungen | 286 |
| Automatisch freigegebene Namenskandidaten | 0 |
| Manuell zu prüfende Namenskandidaten | 0 |
| Mehrdeutige Namenskandidaten | 0 |
| Nicht zugeordnete Setdatensätze | 63 |
| Nicht zugeordnet, aber mit unverbindlichem Vorschlag | 59 |
| Nicht zugeordnet und ohne Vorschlag | 4 |

Damit beträgt die **manuell bestätigte sprachspezifische Expansion-Abdeckung 286/349 (81,9 %)**. Die Zuordnungen belegen die Expansion, nicht die Identität jedes einzelnen Blueprints oder einer konkreten Kartenvariante. Es bleiben keine direkten, sprachübergreifend exakten oder mehrdeutigen Namenskandidaten. Von den 63 nicht zugeordneten Datensätzen besitzen 59 lediglich unverbindliche Ähnlichkeitsvorschläge; vier haben keinen Vorschlag. CardTrader-Codes werden wegen belegter Kollisionen mit TCGdex-Set-IDs nicht als Zuordnungssignal verwendet.

Dass alle 75.652 gelesenen Blueprints eine Bild-URL melden, ist nur ein technischer
Verfügbarkeitswert. Es ist weder eine Nutzungsfreigabe noch ein Nachweis für Sprache,
Auflösung oder dauerhaft erreichbare Dateien. Die Bildfunktion bleibt deshalb aus.

## Offiziell verifizierter API-Vertrag

Quelle ist ausschließlich die [offizielle API-Referenz](https://www.cardtrader.com/en-EU/docs/api/full/reference):

- Basis-URL: `https://api.cardtrader.com/api/v2`; jede Anfrage benötigt einen Bearer-Token.
- `GET /info` prüft die Authentifizierung. Die Antwort kann `shared_secret` enthalten; Cardfolio protokolliert oder speichert dieses Feld nie.
- `GET /games`, `GET /categories?game_id=…`, `GET /expansions` und `GET /blueprints/export?expansion_id=…` bilden den read-only Katalogpfad.
- Blueprints können `image_url`, `editable_properties`, `card_market_ids` und `tcg_player_id` enthalten.
- `GET /marketplace/products` liefert bis zu 25 günstige Angebote je Blueprint, ist laut Referenz leicht gecacht und kann von späteren Warenkorbwerten abweichen.
- Die Referenz nennt für den Marketplace an einer Stelle 1 Anfrage/Sekunde und unmittelbar danach 10 Anfragen/Sekunde. Cardfolio würde bis zur Klärung höchstens 1 Anfrage/Sekunde verwenden.
- Wishlist-Positionen unterstützen unter anderem `blueprint_id`, Menge, Sprache, Zustand, Foil, Reverse und First Edition. Der Freitextimport kann unbekannte Zeilen laut Dokumentation still ignorieren; Cardfolio bereitet deshalb ausschließlich explizite, bestätigte `blueprint_id`-Positionen vor.
- Der read-only Adapter enthält absichtlich keine Methoden für `/cart`, `/cart/add` oder `/purchase`.

Die Pokémon-spezifischen Eigenschaftsnamen und zulässigen Zustände werden **nicht** aus den Magic-Beispielen der Dokumentation abgeleitet. Sie wurden aus einem authentifizierten Pokémon-Kategorie-/Blueprint-Snapshot übernommen und anschließend sicher redigiert zusammengefasst.

### Verifizierte Einzelkarten-Properties

Der Vollaudit verwendet ausschließlich die CardTrader-Kategorie `Pokémon Singles` (Kategorie-ID `73`). Zubehör, Booster, Tins, Complete Sets und `Pokémon Oversized` werden nicht als Einzelkartenvarianten verwendet.

| Property | Beobachtete Werte | Cardfolio-Verwendung |
|---|---|---|
| `pokemon_language` | `de`, `en`, `es`, `fr`, `id`, `it`, `jp`, `kr`, `nl`, `pl`, `pt`, `ru`, `sv`, `th`, `zh-CN`, `zh-TW` | Sprachfilter und Exportfeld |
| `condition` | `Mint`, `Near Mint`, `Slightly Played`, `Moderately Played`, `Played`, `Poor` | Zustandsauswahl; Default `Near Mint` |
| `first_edition` | `false`, `true` | Editionsauswahl |
| `pokemon_reverse` | `false`, `true` | Reverse-Auswahl |
| `altered` | `false`, `true` | Nur anzeigen, wenn der Nutzer eine veränderte Karte ausdrücklich auswählt |
| `signed` | `false`, `true` | Nur anzeigen, wenn Signatur erfasst werden soll |
| `tournament_legal` | `false`, `true` | Kein Sammlungsvariant-Default; separates optionales Merkmal |

CardTrader liefert in `Pokémon Singles` kein eigenes Property für `holo`, `non-holo` oder `shadowless`. Diese Werte werden daher nicht aus CardTrader erfunden oder stillschweigend gemappt. Eine spätere Holo-/Non-Holo-/Shadowless-Zuordnung braucht eine separat geprüfte Variantendatenquelle oder eine manuelle, nachvollziehbare Mappingtabelle. `collector_number`, `pokemon_rarity`, `pokemon_attack` und `pokemon_species` sind in der Kategorie vorhanden, aber nicht als vollständige allgemeine Auswahlwerte definiert.

### Blueprint und Product nicht verwechseln

Ein **Blueprint** ist das exakte kaufbare Kartenmodell und damit die stabile Identität für
Mapping und Wishlist-Export. Ein **Product** ist nur ein konkretes Verkäuferangebot mit
Menge und Preis. Preise und Verfügbarkeit dürfen deshalb erst nach einer eindeutigen
Blueprint-Zuordnung und einer separat freigegebenen Markt-API-Stichprobe berücksichtigt
werden.

Die Laufzeitübersetzung ist ebenfalls festgelegt: 401/403 bedeutet fehlenden, ungültigen
oder abgelaufenen Token; 429 bedeutet Rate-Limit und verlangt einen späteren, gedrosselten
Retry. Keine dieser Antworten darf geheime Headerdaten oder `shared_secret` in Logs oder
Artifacts schreiben.

## Rechte- und Produkt-Gates

Die [CardTrader-Nutzungsbedingungen](https://static.cardtrader.com/en/pages/terms-of-service) schützen unter anderem Preise und Artikeldaten, untersagen Website-Scraping und erklären, dass Markt-APIs mit Website-Daten, Verfügbarkeit und Preisen auf Anfrage bereitgestellt werden. CardTrader will solche Fälle einzeln prüfen.

| Daten/Funktion | Status | Voraussetzung für Go |
|---|---|---|
| Katalog-Mapping | **No-Go** | Testtoken-Audit, schriftliche Bestätigung für den geplanten öffentlichen Cardfolio-Einsatz und manuell geprüfte Set-Zuordnungen |
| Blueprint-Fremd-IDs | **No-Go** | Eindeutige ID-Stichprobe und dokumentierte Erlaubnis zur Speicherung minimaler Mappingdaten |
| Providerbilder als Fallback | **No-Go** | Schriftliche Erlaubnis von CardTrader und separate Klärung der Rechte des jeweiligen Bildinhabers; HTTPS-/Sprach-/Missing-Image-Audit |
| Aggregierte Preise/Verfügbarkeit | **No-Go** | Markt-API-Freigabe, Variantenfilter-Stichprobe, TTL, Währungstrennung und verständlicher Stale-Status |
| Private Wishlist | **No-Go** | Testkonto-Lauf, explizite Nutzerbestätigung, kein Token im Browser/Backup und Teilfehlerbehandlung |
| Warenkorb/Kauf | **dauerhaft ausgeschlossen** | Cardfolio ruft diese Endpunkte nicht auf; `cardtraderCommerce` bleibt `false` |

Die Flags `cardtraderCatalog`, `cardtraderImages`, `cardtraderPrices`, `cardtraderWishlist` und `cardtraderCommerce` sind fest deaktiviert. Eine Erlaubnis für einen Datentyp öffnet keinen anderen automatisch.

## Reproduzierbarer Discovery- und Mappinglauf

Voraussetzungen: eigenes CardTrader-Testkonto, eigens dafür erzeugter Token und bestätigter zulässiger Testumfang. Der Token wird nur als Prozessvariable gesetzt, nie in `.env`, Browsercode, Backup, Git oder Ausgabedatei.

```bash
CARDTRADER_API_TOKEN='…' npm run cardtrader:discover -- --out .cardtrader/discovery.json
npm run cardtrader:audit -- --snapshot .cardtrader/discovery.json --out .cardtrader/mapping-audit.json
```

Für einen kleinen, billigen Probelauf kann `--max-expansions 3` verwendet werden. `.cardtrader/` ist git-ignoriert. Der Discovery-Snapshot entfernt `shared_secret` und enthält keine Wishlist-Inhalte. Marketplace, Cart und Purchase werden nicht aufgerufen.

In GitHub steht dafür `CardTrader read-only discovery` als ausschließlich manueller
Workflow bereit. Er erhält das Secret nur im Discovery-Schritt, besitzt lediglich
`contents: read` und lädt nicht den Rohsnapshot hoch. Das sieben Tage aufbewahrte Artifact
enthält nur `discovery-summary.json` und `mapping-audit.json`; Token, Authorization-Header,
`shared_secret`, Kontokennungen, rohe Blueprints und Bild-URLs sind ausgeschlossen.

Der Mapping-Audit vergleicht alle derzeit synchronisierten deutschen und englischen TCGdex-Sets mit CardTrader-Expansions. Für deutsche Sets wird zusätzlich der englische Name derselben TCGdex-Set-ID als Vergleichsname verwendet. Ein exakter Namenskandidat bleibt `review-required`. Erst eine manuelle Aufnahme in `data/marketplace/cardtrader-set-review.json` macht ihn `verified`. Mehrdeutige oder fehlende Treffer werden nie automatisch gewählt. Das Artifact `mapping-review.md` enthält eine abhakbare Prüfwarteschlange mit CardTrader-ID, Code und Namen sowie höchstens drei klar als unverbindlich markierten Ähnlichkeitsvorschlägen. Der Audit vergleicht außerdem Gesamtzahlen, eindeutige Blueprint-Namen, die aggregierte Überschneidung englischer Kartennamen und das Vorhandensein eines konfigurierten `collector_number`-Standardwerts. Rohlisten mit Kartennamen, Roh-Blueprints und tatsächliche Kartennummernwerte werden nicht veröffentlicht. `collector_number` ist **keine tatsächliche Kartennummernabdeckung**: Die Blueprint-Daten stellten im vollständigen Lauf nur einen solchen Standardwert bereit.

## Noch ausstehende Prüfungen

Der Kataloglauf bestätigt unter anderem die Property-Namen `condition`,
`pokemon_language`, `pokemon_reverse`, `first_edition`, `collector_number`,
`pokemon_rarity` und `pokemon_species`. Noch offen bleiben:

1. Nachvollziehbare Aliasregeln für 63 nicht zugeordnete Sets entwickeln und jeden Alias weiterhin manuell bestätigen.
2. Eine separat geprüfte Quelle für Holo/Non-Holo/Shadowless identifizieren oder eine manuelle Variantentabelle entwerfen.
3. Blueprint-Stichprobe für direkte Cardmarket-/TCGplayer-IDs.
4. Bild-Host, Sprache, Auflösung und Rechtefreigabe getrennt prüfen.
5. Nur nach Markt-API-Freigabe: Währungen, Filtertreue für Sprache/Finish/Zustand, Caching und Angebotsstichprobe.
6. Nur nach Wishlist-Freigabe: private Test-Wishlist mit bestätigten Blueprints und kontrolliertem Teilfehlerfall.

## Entwurf für die schriftliche Anfrage

Dieser Text ist vorbereitet, aber **nicht versendet**, weil noch keine Betreiberadresse und kein autorisiertes CardTrader-Testkonto hinterlegt sind.

> Subject: Production API permission for Cardfolio Pokémon binder planning
>
> Hello CardTrader team,  
> Cardfolio is a client-side Pokémon binder planning application. It does not sell cards and will not call cart or purchase endpoints. We would like written confirmation for the following separate uses: (1) mapping our TCGdex card identities to CardTrader expansion/blueprint IDs, storing only the minimal reviewed mapping; (2) showing a CardTrader blueprint image only as a clearly labelled fallback; (3) showing dated aggregate price/availability ranges derived from exact language/finish/condition filters; and (4) creating a private wishlist only after the user explicitly confirms every exact blueprint and connects their own token.  
> Please confirm which uses are permitted, any attribution/caching/retention requirements, whether provider image URLs may be rendered in a public commercial application, and the rate limits/approval needed for marketplace data. We will not scrape the website and will not expose or persist user tokens in the browser or repository.

Eine Antwort wird wörtlich mit Datum, Ansprechpartner und Umfang in diesem Dokument ergänzt; eine unklare Antwort gilt nicht als Freigabe.
