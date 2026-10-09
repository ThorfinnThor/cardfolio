# CardTrader Discovery und Release-Gate

Stand: 9. Oktober 2026

## Ergebnis

CardTrader ist in Cardfolio **noch nicht produktiv freigegeben**. Die providerneutrale Katalogschnittstelle, Laufzeitschemas, konservative Mappinglogik und reproduzierbare Audit-Werkzeuge sind vorbereitet. Alle UI-Flags bleiben aus.

Das GitHub-Actions-Secret `CARDTRADER_API_TOKEN` wurde am 4. Oktober 2026 unter dem korrekten Namen registriert; sein Wert wurde nicht gelesen oder ausgegeben. Die vollständigen authentifizierten Read-only-Läufe [37412387905](https://github.com/ThorfinnThor/cardfolio/actions/runs/37412387905), [37524478301](https://github.com/ThorfinnThor/cardfolio/actions/runs/37524478301), [37589460298](https://github.com/ThorfinnThor/cardfolio/actions/runs/37589460298), der Kartenname-Audit [37592043338](https://github.com/ThorfinnThor/cardfolio/actions/runs/37592043338), der Zwischenlauf [37592887597](https://github.com/ThorfinnThor/cardfolio/actions/runs/37592887597), der Mehrdeutigkeits-Audit [37595141688](https://github.com/ThorfinnThor/cardfolio/actions/runs/37595141688), der Alias-Audit [37598481498](https://github.com/ThorfinnThor/cardfolio/actions/runs/37598481498), dessen Kontrolllauf [37599346206](https://github.com/ThorfinnThor/cardfolio/actions/runs/37599346206) und der abschließende Vollaudit [37600327615](https://github.com/ThorfinnThor/cardfolio/actions/runs/37600327615) wurden am 6./7. Oktober erfolgreich abgeschlossen. Der Kartenname-Audit verglich alle 44 verbliebenen englischen Mengendifferenzen. Zunächst wurden 28 exakt benannte Expansionen mit vollständiger normalisierter TCGdex-Namensabdeckung bestätigt. Weitere 14 exakte Kandidaten wurden anschließend mit mindestens 94 % TCGdex-Namensabdeckung bestätigt; bei Legendary Treasures war stattdessen die CardTrader-Namensmenge vollständig in TCGdex enthalten. Die letzten exakten Fälle wurden über die offiziellen CardTrader-Seiten für [DP Black Star Promos](https://www.cardtrader.com/en/games/pokemon/expansions/dp-black-star-promos/blueprints_search) und [POP Series 7](https://www.cardtrader.com/en-US/games/pokemon/expansions/pop-series-7/categories) bestätigt. Die Holon-Phantoms-Mehrdeutigkeit wurde zugunsten von [EX Holon Phantoms](https://www.cardtrader.com/en/games/pokemon/expansions/ex-holon-phantoms/categories) aufgelöst. Der Alias-Audit verglich anschließend bis zu drei Namensvorschläge je noch nicht zugeordnetem englischem Set anhand aggregierter Kartenname-Überschneidungen. Weitere offizielle CardTrader-Seiten bestätigten [Radiant Collection Legendary Treasure](https://www.cardtrader.com/en-US/games/pokemon/expansions/radiant-collection-legendary-treasure/categories), die [Lycanroc-Hälfte](https://www.cardtrader.com/en/games/pokemon/expansions/sun-moon-trainer-kit-lycanroc-alolan-raichu-lycanroc/categories/pokemon-singles/blueprints_search) und die [Alolan-Raichu-Hälfte](https://www.cardtrader.com/en-US/games/pokemon/expansions/sun-moon-trainer-kit-lycanroc-alolan-raichu-alolan-raichu/categories/pokemon-singles/blueprints_search?embedded=10) des Sun-&-Moon-Trainer-Kits sowie die [Suicune-Hälfte](https://www.cardtrader.com/en/games/pokemon/expansions/xy-trainer-kit-pikachu-libre-suicune-suicune/categories/pokemon-dice/blueprints_search) des XY-Trainer-Kits. Insgesamt sind nun 194 englische Expansionen und 141 deutsche Gegenstücke bestätigt. Der Audit zeigte außerdem, dass `collector_number` in den Blueprint-Daten nicht als durchgängige individuelle Kartennummer vorliegt: Im gesamten Katalog war nur ein Blueprint mit einem konfigurierten Standardwert vorhanden. Eine schriftliche Produktionsfreigabe von CardTrader liegt weiterhin nicht vor. Preise, Verfügbarkeit, Providerbilder und verbundene Wishlists bleiben deshalb No-Go.

Der Vollaudit [37741208480](https://github.com/ThorfinnThor/cardfolio/actions/runs/37741208480) bestätigte anschließend die manuell ausgewählten Provider-Namen [Futsal Promos](https://www.cardtrader.com/en/games/pokemon/expansions/futsal-promos/categories/pokemon-singles/blueprints_search) und [Platinum Arceus](https://www.cardtrader.com/en/games/pokemon/expansions/platinum-arceus/categories/pokemon-singles/blueprints). Futsal stimmt in allen fünf eindeutigen Kartennamen überein; Platinum Arceus enthält wie das TCGdex-Set exakt 111 Einzelkarten-Blueprints. Der abschließende Vollaudit [37742020790](https://github.com/ThorfinnThor/cardfolio/actions/runs/37742020790) bestätigt 338 verifizierte und 11 begründet vom Expansion-Export ausgeschlossene Datensätze. Es bleiben 0 direkt zu prüfende, 0 mehrdeutige und 0 unklassifizierte Datensätze.

Der anschließende Fremd-ID-Vollaudit [37746589168](https://github.com/ThorfinnThor/cardfolio/actions/runs/37746589168) wertete ausschließlich sichere Aggregatwerte aus. Er prüfte alle 69.874 Blueprints der Kategorie `Pokémon Singles` sowie separat die 21.948 Blueprints in den 188 CardTrader-Expansionen, die durch die 338 verifizierten sprachspezifischen Set-Zuordnungen abgedeckt werden. Im verifizierten Umfang besitzen 21.780 Blueprints mindestens eine innerhalb des gesamten gelesenen Pokémon-Singles-Katalogs eindeutige Cardmarket- oder TCGplayer-ID; 168 besitzen keine der beiden IDs. Es wurden keine mehrfach für verschiedene Blueprints verwendeten Fremd-ID-Werte und keine ungültigen Identifier festgestellt. Das veröffentlichte Artifact enthält nur diese Summen, niemals die Fremd-IDs oder Blueprint-Zeilen selbst.

### Aktueller Abdeckungsbericht

| Messwert | Ergebnis |
|---|---:|
| Englische TCGdex-Setdatensätze | 205 |
| Deutsche TCGdex-Setdatensätze | 144 |
| Zu prüfende sprachspezifische Setdatensätze | 349 |
| CardTrader-Pokémon-Expansionen | 856 |
| Gelesene Blueprints | 75.652 |
| Blueprints der Kategorie `Pokémon Singles` | 69.874 |
| Blueprints mit `image_url` | 75.652 |
| Blueprints ohne `image_url` | 0 |
| Manuell verifizierte sprachspezifische CardTrader-Zuordnungen | 338 |
| Automatisch freigegebene Namenskandidaten | 0 |
| Manuell zu prüfende Namenskandidaten | 0 |
| Mehrdeutige Namenskandidaten | 0 |
| Begründet vom Expansion-Export ausgeschlossene Setdatensätze | 11 |
| Nicht klassifizierte Setdatensätze | 0 |
| `Pokémon Singles` in 188 verifizierten CardTrader-Expansionen | 21.948 |
| Davon mit mindestens einer katalogweit eindeutigen Fremd-ID | 21.780 |
| Davon ohne Cardmarket- und TCGplayer-ID | 168 |
| Mehrfach für verschiedene Blueprints verwendete Fremd-ID-Werte | 0 |

Damit beträgt die **manuell bestätigte sprachspezifische Expansion-Abdeckung 338/349 (96,8 %)**. Alle 349 Datensätze sind geprüft und klassifiziert; die elf Ausschlüsse werden ausdrücklich nicht als CardTrader-Abdeckung gezählt. Die Zuordnungen belegen die Expansion, nicht die Identität jedes einzelnen Blueprints oder einer konkreten Kartenvariante. Es bleiben keine direkten, sprachübergreifend exakten oder mehrdeutigen Namenskandidaten. CardTrader-Codes werden wegen belegter Kollisionen mit TCGdex-Set-IDs nicht als Zuordnungssignal verwendet.

Dass alle 75.652 gelesenen Blueprints eine Bild-URL melden, ist nur ein technischer
Verfügbarkeitswert. Es ist weder eine Nutzungsfreigabe noch ein Nachweis für Sprache,
Auflösung oder dauerhaft erreichbare Dateien. Die Bildfunktion bleibt deshalb aus.

Auch die hohe Fremd-ID-Abdeckung ist noch kein Karten-Mapping. Der aktuell
dokumentierte [TCGdex-Card-Vertrag](https://tcgdex.dev/es/reference/card) enthält keine
entsprechenden direkten Cardmarket-/TCGplayer-Produkt-IDs pro konkreter Variante.
TCGdex weist in seiner [FAQ](https://tcgdex.dev/fr/faq) außerdem auf bekannte falsche
Marketplace-Zuordnungen hin und beschreibt `variants_detailed` mit expliziten
Provider-IDs als noch in Entwicklung. Eine TCGdex-Preiszeile, ein Kartenname oder eine
ähnliche Set-/Kartennummer darf deshalb nicht als Ersatz für eine direkte, überprüfte
Quell-ID verwendet werden.

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
| Blueprint-Fremd-IDs | **No-Go** | Quellseitige direkte Varianten-ID oder manuell überprüftes Kartenmapping sowie dokumentierte Erlaubnis zur Speicherung minimaler Mappingdaten |
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
enthält nur `discovery-summary.json`, `mapping-audit.json`, `mapping-review.md` und
`blueprint-id-audit.json`; Token, Authorization-Header,
`shared_secret`, Kontokennungen, rohe Blueprints und Bild-URLs sind ausgeschlossen.

Der Mapping-Audit vergleicht alle derzeit synchronisierten deutschen und englischen TCGdex-Sets mit CardTrader-Expansions. Für deutsche Sets wird zusätzlich der englische Name derselben TCGdex-Set-ID als Vergleichsname verwendet. Ein exakter Namenskandidat bleibt `review-required`. Abweichende, anhand offizieller CardTrader-Seiten ausgewählte Namen werden getrennt in `data/marketplace/cardtrader-set-candidates.json` dokumentiert und im authentifizierten Audit exakt aufgelöst; auch sie bleiben `review-required`. Erst eine manuelle Aufnahme in `data/marketplace/cardtrader-set-review.json` macht einen Kandidaten `verified`. Sets, die wegen fehlender Providerdaten, einer anderen Produktkategorie oder eines nötigen Karten-Mappings nicht sicher auf genau eine Expansion abgebildet werden können, stehen mit Begründung und Evidenz in `data/marketplace/cardtrader-set-exclusions.json`; sie bleiben im Bericht sichtbar und zählen nie als verifiziert. Mehrdeutige oder fehlende Treffer werden nie automatisch gewählt. Das Artifact `mapping-review.md` enthält eine abhakbare Prüfwarteschlange mit CardTrader-ID, Code und Namen sowie höchstens drei klar als unverbindlich markierten Ähnlichkeitsvorschlägen. Für englische, nicht zugeordnete Sets vergleicht der Vollaudit zusätzlich die Kartennamen dieser Vorschläge; auch vollständige Überschneidung ist nur Evidenz und keine automatische Freigabe. Der Audit vergleicht außerdem Gesamtzahlen, eindeutige Blueprint-Namen und das Vorhandensein eines konfigurierten `collector_number`-Standardwerts. Rohlisten mit Kartennamen, Roh-Blueprints und tatsächliche Kartennummernwerte werden nicht veröffentlicht. `collector_number` ist **keine tatsächliche Kartennummernabdeckung**: Die Blueprint-Daten stellten im vollständigen Lauf nur einen solchen Standardwert bereit. Der zusätzliche Fremd-ID-Audit veröffentlicht ausschließlich Summen zu Vorhandensein, Gültigkeit und Eindeutigkeit der `card_market_ids` und `tcg_player_id`. Er darf eine automatische Mapping-Kandidatur nur dann feststellen, wenn eine Quell-ID genau einen Blueprint im geprüften Umfang auflöst; ohne passende Quell-ID findet keine automatische Verknüpfung statt.

## Noch ausstehende Prüfungen

Der Kataloglauf bestätigt unter anderem die Property-Namen `condition`,
`pokemon_language`, `pokemon_reverse`, `first_edition`, `collector_number`,
`pokemon_rarity` und `pokemon_species`. Noch offen bleiben:

1. Die elf dokumentierten Ausschlüsse bei neuen Katalogläufen erneut prüfen; insbesondere die 30th Classic Collection aktivieren, sobald CardTrader verwertbare Singles-Blueprints liefert.
2. Eine separat geprüfte Quelle für Holo/Non-Holo/Shadowless identifizieren oder eine manuelle Variantentabelle entwerfen.
3. Auf das angekündigte TCGdex-Feld `variants_detailed` warten oder eine andere zulässige direkte Quell-ID bzw. eine manuell überprüfte Karten-Mappingtabelle bereitstellen; danach den Fremd-ID-Audit erneut als Karten-Mapping-Audit ausführen.
4. Bild-Host, Sprache, Auflösung und Rechtefreigabe getrennt prüfen.
5. Nur nach Markt-API-Freigabe: Währungen, Filtertreue für Sprache/Finish/Zustand, Caching und Angebotsstichprobe.
6. Nur nach Wishlist-Freigabe: private Test-Wishlist mit bestätigten Blueprints und kontrolliertem Teilfehlerfall.

## Schriftliche Freigabeanfrage und blockierendes To-do

Status: **versandfertig, noch nicht versendet**. Bis eine eindeutige schriftliche Antwort
vorliegt, bleiben `cardtraderCatalog`, `cardtraderImages`, `cardtraderPrices`,
`cardtraderWishlist` und `cardtraderCommerce` deaktiviert. Die sichtbare
CardTrader-Vorschau ist keine Datenfreigabe und führt keine Providerabfrage aus.

### Versandfertige E-Mail

**Subject:** API permission request for Cardfolio Pokémon binder planning

> Hello CardTrader API / Partnerships Team,
>
> my name is Schayan and I am developing Cardfolio, a local-first web application that helps Pokémon collectors — including parents and beginners — plan physical card binders and prepare missing-card lists. A current preview is available at https://cardfolio-780.pages.dev.
>
> Cardfolio does not sell cards and does not perform purchases. We will not scrape the CardTrader website and we do not intend to call cart or purchase endpoints. API credentials are kept server-side as a GitHub Actions secret and are never exposed in the browser, repository, local backups or exported binder files.
>
> We would like your written permission and technical guidance for the following capabilities. Please confirm each item separately, because we will keep every capability disabled unless it is explicitly approved:
>
> 1. **Catalog mapping:** Read CardTrader expansions and blueprints and store a minimal reviewed mapping between our TCGdex card identities and CardTrader expansion/blueprint IDs.
> 2. **Marketplace prices and availability:** Read `/marketplace/products` for an exact blueprint and filter by language, condition and available variant properties. Cardfolio would display only dated, non-binding aggregate information such as the lowest matching offer, a typical offer range and the number of matching offers. Shipping, taxes and fees would be shown as excluded. We would not present these values as guaranteed market prices.
> 3. **Blueprint images:** Display a CardTrader blueprint image only as a clearly labelled fallback when our primary catalog has no image. We would reference the provider URL rather than redistribute an image archive.
> 4. **Private Wishlist:** In a later phase, create a private Wishlist only after the user connects their own CardTrader account and explicitly confirms the exact blueprint, quantity, language, condition and variant. Tokens would not be stored in browser backups or exported files.
>
> Could you please confirm:
>
> - which of these four uses are permitted for a public application and for future commercial operation;
> - whether a separate market-API or partnership approval is required for price and availability data;
> - any required attribution, links or CardTrader branding;
> - permitted caching duration, refresh frequency and retention of aggregate price data;
> - whether blueprint image URLs may be rendered as described and whether additional image-rights restrictions apply;
> - the applicable rate limits and recommended request pattern for `/marketplace/products`;
> - whether storing the minimal expansion/blueprint-ID mapping is permitted;
> - and whether you require a separate production API token or application registration.
>
> We are happy to provide screenshots, a more detailed data-flow description or a limited test plan. Until we receive your written confirmation, CardTrader catalog data, images, prices and Wishlist actions will remain disabled in Cardfolio.
>
> Thank you for your guidance.
>
> Best regards<br>
> Schayan<br>
> Cardfolio

### Nachverfolgung

- [ ] Anfrage über einen offiziellen CardTrader-Support-/API-Kanal versenden.
- [ ] Versanddatum und verwendeten Kontaktkanal hier dokumentieren.
- [ ] Vollständige Antwort mit Datum und Ansprechpartner ablegen oder verlinken.
- [ ] Freigabe für Katalog, Preise, Bilder und Wishlist **jeweils getrennt** als Go/No-Go bewerten.
- [ ] Bei unklarer oder nur mündlicher Antwort nachfragen; sie gilt bis dahin als No-Go.
- [ ] Erst nach Preisfreigabe einen gedrosselten Read-only-Test für `/marketplace/products` durchführen.
- [ ] Filtertreue, Währung, TTL, Ausreißer, leere Angebote und Stale-Status testen.
- [ ] Erst danach `cardtraderPrices` in einem separaten Commit aktivieren; die übrigen Flags unverändert lassen.

Eine Erlaubnis für eine Datenart öffnet keine andere automatisch. Insbesondere bleiben
Wishlist-Schreibzugriffe und Providerbilder deaktiviert, wenn CardTrader ausschließlich
die Preisnutzung freigibt.
