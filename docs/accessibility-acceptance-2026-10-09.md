# Accessibility- und Eltern-Usability-Abnahme

Diese Checkliste ergänzt die automatisierte Release-Prüfung. Sie ist eine menschliche Abnahme und darf nicht durch grüne Unit- oder E2E-Tests ersetzt werden.

## Automatisch in CI

`e2e/responsive-a11y.spec.ts` prüft für 375, 768, 1024 und 1440 Pixel:

- keine horizontale Dokument- oder Body-Überbreite;
- sichtbares erstes Tastaturziel innerhalb des Viewports;
- sichtbare Fokuskennzeichnung.

Die bestehenden E2E-Fälle prüfen zusätzlich Dialog-Fokusfalle, Escape, Fokus-Rückgabe, Suche, Kartenprüfung, Undo, Reload und Fehlermeldungen. Der lokale Chromium-Lauf kann auf macOS durch die Betriebssystem-Sandbox blockiert sein; CI bleibt dann die autoritative Browserausführung.

## Manuelle Abnahme

Durchführung mit mindestens drei Personen ohne aktives Pokémon-TCG-Fachwissen. Pro Aufgabe nur beobachten; keine Hinweise geben, außer die Person ist vollständig blockiert.

| Aufgabe | Erfolgsbedingung | Beobachtung / Problem |
|---|---|---|
| Leeren Binder anlegen | Name eingeben, Binder erstellen, erste Seite erkennen | |
| Eine Karte einsetzen | leeren Slot öffnen, Karte über Namen oder Nummer finden, Variante prüfen, einsetzen | |
| Ein Set planen | „Mit einem Set starten“ finden, Sprache/Umfang verstehen, Vorschau bestätigen | |
| Geschenk-Binder erstellen | Motiv wählen, Vorschläge verstehen, ohne Preisversprechen speichern | |
| Fehlkarte bearbeiten | fehlende Karte finden, Variante/Zustand setzen, zu einer Übergabe wechseln | |

## Bedien- und Fehlerszenarien

- Alle Aufgaben ausschließlich mit Tastatur wiederholen: sichtbarer Fokus, kein Fokusverlust, Escape schließt Dialoge, Fokus kehrt zum Auslöser zurück.
- Screenreader: Überschriften, Dialogtitel, Formlabels, Statusmeldungen, Fehlermeldungen und Buttons sinnvoll vorlesen lassen.
- `prefers-reduced-motion` aktivieren und prüfen, dass keine wichtige Information nur durch Bewegung vermittelt wird.
- Bildfehler, Offline-/Timeout-Suche, Nulltreffer, veraltete Preisdaten und deaktivierte CardTrader-Funktionen prüfen.
- Bei 375 Pixeln darf keine Hauptaktion außerhalb des sichtbaren Inhalts oder unter der fixierten Aktionsleiste verborgen sein.

## Freigabeentscheidung

- [ ] Alle fünf Aufgaben werden ohne externe Erklärung abgeschlossen.
- [ ] Keine wiederkehrende Verwechslung von „geplant“, „vorhanden“ und „fehlt“.
- [ ] Keine Fokusfalle oder ausschließlich farbliche Statusinformation.
- [ ] Begriffe für Finish, Edition, Zustand, Preis-Schätzung und Marketplace-Übergabe werden verstanden.
- [ ] Beobachtungen und Korrekturen sind als Issues oder Commit dokumentiert.

Bis alle Punkte erfüllt sind, bleibt der öffentliche Produktionsstart NO-GO.
