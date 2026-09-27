# Integration verification

## TCGdex smoke test — 2026-09-27

Environment: local macOS shell, direct HTTPS requests, no API key or cookies.

- `GET /v2/en/cards?name=pikachu&pagination:page=1&pagination:itemsPerPage=3`: HTTP 200; compact card results observed.
- `GET /v2/en/cards/swsh3-136`: HTTP 200; ID, name, local number, set and external image base URL observed.
- `GET /v2/en/sets/swsh3`: HTTP 200; `serie.id=swsh` observed.
- `GET /v2/en/series/tcgp`: HTTP 200; Pocket set IDs observed.
- Response headers for detail request included `access-control-allow-origin: *`.

## Static browser preview — 2026-09-27

Environment: production `out/` served locally on port 4173 and exercised in the Codex in-app Chromium browser.

- Initial page rendered meaningful content without an error overlay or console warnings/errors.
- Created `Smoke-Test Binder`; IndexedDB retained it after a hard reload.
- Live browser search for `pikachu` returned 12 visible results from TCGdex.
- Selected `basep-1`; detail and set requests normalized the card as physical.
- Direct external image loaded from `https://assets.tcgdex.net/en/base/basep/1/high.webp`.
- Ownership toggled to present and remained present after reload.
- At a 375×812 viewport the first pass exposed a 27 px overflow from the hidden file input. The selector was corrected and the repeated measurement reported `scrollWidth=375`, with no horizontal overflow.
- Browser console warnings/errors: none.

The Playwright CLI test is configured but could not launch its separate headless Chromium inside the local shell sandbox because macOS denied its Mach port. The equivalent flow above passed in the provided browser. CI should execute the Playwright test on a GitHub-hosted runner after Chromium installation is enabled there.

Still required: German browser query, controlled 404/timeout UI states, backup file chooser roundtrip, and a deployed Cloudflare preview check.

## CF-07 design previews — 2026-09-27

Environment: production `out/` served locally on port 4173 and exercised in the Codex in-app browser.

- Design 2 rendered the shared demo fixture with the Clean Binder composition, KPI cards, binder grid and overview panel.
- Design 3 rendered the same fixture with the Collector Workspace composition, KPI strip and persistent context panel.
- Variant navigation, selected-card context, missing-card state and image-error state were exercised in the browser.
- At a 375×812 viewport both variants reported `scrollWidth=375` and `innerWidth=375`; the Collector context remained present below the binder.
- Browser console errors and warnings: none.

## CF-11 search and placement — 2026-09-27

Environment: production `out/` served locally on port 4173 and exercised in the Codex in-app browser.

- Clicking an empty slot opened the search drawer with the target shown as “Seite 1, Slot 1”.
- A live `pikachu` TCGdex query returned visible results with “In Slot einsetzen” actions.
- The first result fetched its detail, persisted the card in the selected slot and closed the drawer; the binder then showed `Pikachu` in Slot 1.
- At a 375×812 viewport the route reported `scrollWidth=375`; the browser console had no errors or warnings.

## CF-09 3×3 binder page — 2026-09-27

Environment: production `out/` served locally on port 4173 and exercised in the Codex in-app browser.

- The selected local binder rendered nine stable, keyboard-focusable empty slots.
- “+ Seite” persisted a second page, selected it, and exposed previous/next controls with the correct `2 / 2` state.
- At a 375×812 viewport the page reported `scrollWidth=375` and `innerWidth=375`; nine empty-slot buttons remained available.
- Browser console errors and warnings: none.

## CF-08 Binder overview — 2026-09-27

Environment: production `out/` served locally on port 4173 and exercised in the Codex in-app browser.

- Productive home route rendered the Design 3 Collector Workspace Binder overview with local-storage status and collection metrics.
- Existing local binder data remained visible; creating `CF08 Smoke Binder` produced a second local binder, selected it, and showed its empty 3×3 progress state.
- The binder delete action opened a confirmation dialog with an explicit warning about local deletion. The dialog was closed with “Abbrechen”; deletion was not confirmed by automation.
- Browser console errors and warnings: none.

## CF-12 card interactions — 2026-09-27

Environment: production `out/` served locally on port 4173 and exercised in the Codex in-app Chromium browser.

- Occupied slots expose touch-safe ownership, move and remove actions.
- Move mode visibly marks the source; selecting an empty target moves the card and persists the revision-checked update.
- The immutable domain test covers selecting an occupied target and swapping the two planned cards without changing their card snapshots.
- Remove opens an explicit confirmation dialog; the smoke run cancelled the dialog, so no destructive deletion was automated.
- Browser console errors and warnings: none.

## CF-13 generic missing-card exports — 2026-09-27

Environment: pure domain tests plus the production static build.

- Three identical planned copies with one owned copy derive to an export quantity of two.
- Empty slots and owned entries never enter the missing-item result.
- Finish, edition, language and condition remain distinct export fields; unspecified values stay explicit.
- CSV tests cover quotes, commas, line breaks, UTF-8 BOM, leading-zero collector numbers and formula-like cells.
- Typecheck, ESLint, 17 Vitest tests and the static Next.js build passed.

## CF-14 missing-card view and backup report — 2026-09-27

Environment: production `out/` served locally on port 4173 and exercised in the Codex in-app Chromium browser.

- “Fehlkarten ansehen” opened the active binder's missing-card list with quantity, language, variant, condition and manual-review status.
- Filtering with `pikachu` kept the matching position and hid non-matching positions.
- Clipboard copy succeeded in the provided browser; TXT and CSV actions remained visible as file-export fallbacks.
- Browser layout reported `scrollWidth=1280` and `innerWidth=1280`; console errors and warnings: none.
- Import-report rendering is covered by the production component path; a real file chooser roundtrip remains an open manual/browser check.

## CF-15 Design-3 consistency — 2026-09-27

Environment: production `out/` served locally on port 4173 and exercised in the Codex in-app Chromium browser.

- Productive route exposed `data-design="design-3"`, with `--accent=#155363` and `--background=#fbfcfd`.
- Empty-slot search opened the Design 3 drawer with target context; the no-result query rendered a clear German empty state.
- Card-removal confirmation used the Design 3 dialog treatment and was cancelled; no destructive action was confirmed.
- The route reported `scrollWidth=1280` and `innerWidth=1280`; browser console errors and warnings: none.
- Narrow-screen behavior remains covered by the responsive CSS rules and previous 375-pixel smoke checks; a separate resizable-browser run is still pending.

## CF-16 E2E, multi-tab and static restore — 2026-09-27

Environment: production `out/` served by `python3 -m http.server`, Codex in-app Chromium for executable browser checks, Vitest/fake IndexedDB for repository conflicts, and Playwright configuration for GitHub Actions.

- Two tabs opened the same local binder. Adding a page in the first tab produced a persistent conflict message in the second tab without overwriting its stale revision.
- “Aktuellen Stand laden” reloaded the authoritative revision and changed the second tab from `1 / 1` to `1 / 2`.
- Opening an empty slot focused the search field; Escape closed the modal drawer.
- A 375×812 viewport reported `innerWidth=375` and `scrollWidth=375`.
- A controlled backup imported into an empty origin as `CF16 Restore Fixture (Import)`. The visible import report restored 1 binder, 2 planned cards and 2 card snapshots; the result showed 1 owned and 1 missing card.
- The repository conflict test uses independent repository clients and confirms that the stale revision throws `RevisionConflictError`.
- The Playwright suite contains four scenarios: full binder/backup roundtrip with controlled TCGdex fixtures, multi-tab reload, unavailable IndexedDB, and mobile focus/Escape behavior.
- Local Playwright test execution reaches the static server, but macOS blocks the separate headless Chromium process at the Mach rendezvous port before the first test instruction. GitHub Actions installs Chromium on Ubuntu and runs `npm run test:e2e`; the later CF-22 record documents the connected remote, test fixes and current account-level runner blocker.

## CF-17 TCGplayer text export — 2026-09-27

Environment: official TCGplayer Mass Entry web UI, current TCGplayer Pokémon set-code list, controlled domain/component tests and production `out/` in the Codex in-app Chromium browser.

- The official UI confirmed the general structure `quantity, item name, set/series code, item number` and exposed current Pokémon codes including `BS`, `JU`, `FO`, `SWSH01`, `SWSH04`, `SVI`, `PAL` and `OBF`.
- Plain local numbers were not sufficient in the real Pokémon parser. `Bulbasaur [BS] 44` was rejected as entered, while the full displayed number `Bulbasaur [BS] 044/102` was recognized.
- `Magikarp [PAL] 203/193` and `Sprigatito [PAL] 012/193` were rejected because their TCGplayer product titles contain collector-number suffixes.
- Exact titles `Sprigatito - 012/193 [PAL] 012/193` and `Magikarp - 203/193 [PAL] 203/193` both resolved and opened the anonymous cart with the expected Paldea Evolved products. No sign-in, checkout or purchase occurred.
- Because set-level mapping alone did not prove card-level parser compatibility, the production exporter requires both a verified set mapping and a tested printing mapping.
- Browser fixture result: Base Set Bulbasaur appeared as `1 Bulbasaur [BS] 044/102`; a Wizards Black Star Promo remained visibly excluded as a candidate. Copy wrote only the verified line.
- Filtering to the candidate produced `0 geprüft · 1 manuell prüfen`, an empty preview and disabled copy/TXT controls.
- Browser console warnings/errors: none. Framework error overlay: absent. At 375×812, `scrollWidth=375`.

## CF-18 Cardmarket handoff — 2026-09-27

Environment: current official Cardmarket help pages, controlled domain/component tests and production `out/` in the Codex in-app Chromium browser.

- Cardmarket documents a maximum of 150 entries per Wants list. A 151-position fixture therefore produces two review-list parts with 150 and 1 positions; quantities do not consume additional entry slots.
- Cardmarket's Pokémon decklist help says a Pokémon name alone is insufficient and requires full name plus abilities and attacks. Cardfolio does not store the latter two reliably, so it does not claim that its reference text is an accepted decklist import.
- The handoff always warns that another version or expansion may be selected and keeps the original set, number, language, finish, edition and condition visible for manual comparison.
- The UI uses a generic Pokémon Singles link and the official Cardmarket decklist-help link; it does not construct undocumented query parameters, scrape products, automate a session or claim an exact purchase match.
- Browser fixture result: the existing missing Pikachu rendered as `1x Pikachu | Wizards Black Star Promos | Nr. 1 | EN | Nicht angegeben | Nicht angegeben | Beliebig` beneath all three review warnings.
- The static page rendered meaningful content without a framework error overlay. The local Playwright rerun was blocked before all four test bodies by the already documented macOS Mach-port restriction, not by an application assertion.

## CF-19 TCGdex pricing gate — 2026-09-27

Environment: current official TCGdex reference/integration documentation plus direct HTTPS responses from `api.tcgdex.net`.

- `en/swsh3-136` returned Cardmarket EUR and TCGplayer USD data with ISO provider timestamps. TCGplayer exposed `normal` and `reverse-holofoil`; normal market price was 0.25 USD and reverse market price 0.45 USD at inspection time.
- `en/base1-44` reported First Edition availability but only a generic TCGplayer `normal` price. Cardmarket also returned holo fields although the card metadata reported `holo=false`.
- `en/sv02-203` reported a holo-only printing. Cardmarket's general trend was non-zero while `trend-holo` was zero; the parser rejects zero and never substitutes the general trend for an explicit holo request.
- `de/base1-44` returned the same marketplace product IDs and values as the English card response. This does not prove language-specific pricing, and TCGplayer is rejected for non-English identity.
- Tests confirm exact cent normalization, separate EUR/USD sources, required source timestamps, candidate quality, explicit reverse-key handling and rejection of ambiguous First Edition data.
- No network response is persisted in Binder backups and no scheduled pricing dataset was added to GitHub Actions.
- Result: the parser preparation is valid, but the product gate remains closed and the user sees no price or synthetic zero.

## CF-20 binder layouts and drag enhancement — 2026-09-27

Environment: production `out/` served by `python3 -m http.server`, Codex in-app Chromium, domain/component tests and the Playwright scenario configured for GitHub Actions.

- The existing two-page binder showed 3×3 as the selected format. Choosing 3×4 opened a modal before mutation.
- The preview reported 1 planned card, 1 moved position, 2 pages before and 2 pages after, plus the explicit statement that no card would be deleted.
- Confirming saved 3×4 through the revision-checked IndexedDB repository. The card moved from Slot 2 to Slot 1 in reading order and all 12 slots rendered.
- A full reload restored the selected 3×4 format, two pages and the same Pikachu entry.
- The explicit “Verschieben” button still entered move mode. Choosing the empty Slot 2 moved the card and produced the saved-state message without using drag.
- The mouse-only grip is visible on desktop and hidden at the existing mobile breakpoint; the button alternative remains keyboard/touch reachable.
- The new E2E scenario changes 3×3 to 2×2, checks that two cards survive, drives the dnd-kit MouseSensor with pointer coordinates, confirms the swap and verifies that the move button is still present.
- Local Playwright execution is still prevented before test code by macOS denying Chromium's Mach rendezvous port. GitHub CI installs Chromium on Ubuntu and runs the five-scenario suite.

## CF-21 release-gate and help-route verification — 2026-09-27

Environment: clean static Next.js export served locally, Codex in-app Chromium, repository release checker and current official Cloudflare/GitHub/TCGdex documentation.

- The productive static route list contains `/`, `/_not-found` and `/help`; `/design-preview` is absent.
- `/help/` rendered the expected local-storage, backup, network-flow, data-limit and rights/provider sections. Its back link navigated to the productive Cardfolio route.
- Desktop checks reported meaningful content, the expected page titles/headings, no framework error overlay, and no browser console warnings/errors on either route.
- At 375×812, `/help/` reported `innerWidth=375` and `scrollWidth=375`; the back link and primary heading remained present.
- `release:check` passed for the static output, help route, security headers, disabled feature gates, full-SHA GitHub Action pins, GitHub/Cloudflare deployment separation and direct runtime licenses.
- Typecheck, ESLint, Vitest (11 files, 44 tests), static Next.js build and `git diff --check` passed.
- Both production and complete-tree `npm audit` queries reported zero known vulnerabilities at review time. The local environment required a read-only TLS-verification workaround described in `docs/public-release-readiness.md`; CI repeats the normal audit without that workaround.
- Response-header enforcement is not marked as passed: Python serves the files but does not interpret Cloudflare `_headers`. The real Pages origin remains required.

## CF-22 private GitHub integration — 2026-09-27

Environment: private GitHub repository plus the existing local verification environment.

- Created and pushed `main` to `https://github.com/ThorfinnThor/cardfolio`; repository visibility was verified as private.
- GitHub run `36323935646` completed install, audit, typecheck, lint, unit tests, build and release checks, then exposed one ambiguous Playwright selector.
- After the exact-selector fix, run `36324101921` passed three of five E2E scenarios and exposed two deterministic persistence/drag-wait issues rather than product-build failures.
- Commit `d329377` adds persisted-card waits, exact move-target selection and explicit drag activation/drop-state waits. The corresponding local typecheck, lint, 44 tests, build, release check and diff check pass.
- The post-fix GitHub run `36324400200` did not allocate a runner. GitHub reports a failed account payment or insufficient spending limit, so no post-fix remote test result exists yet.
- Cloudflare Pages can see the private repository through the already connected GitHub app. Its setup form is prepared with `main`, **Next.js (Static HTML Export)**, `npm run build`, `out` and `NODE_VERSION=24`; the deployment has not been submitted.

## CF-23 Cloudflare target-host verification — 2026-09-27

Environment: Cloudflare Pages project `cardfolio`, production alias `https://cardfolio-780.pages.dev/`, immutable application deployment `https://6cbb4716.cardfolio-780.pages.dev/`, commit `a5ad85f4a997d8f806af27bf25b2b35abe8bd313`.

- Cloudflare reported a successful 59-second build/deployment from private GitHub `main` with automatic deployments enabled.
- `/` and `/help/` returned HTTP 200, supported direct navigation/reload and hydrated without console errors or warnings.
- Both HTML routes returned the repository CSP plus `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` and `Cross-Origin-Opener-Policy: same-origin`.
- The productive route exposed Design 3 and reached `Lokal gespeichert`. A binder and English Pikachu detail persisted across reload; the external image loaded from `assets.tcgdex.net` at 600×825 pixels.
- Current German TCGdex detail/set requests returned Bisasam and Grundset. Importing a controlled German backup produced the visible 1-binder/1-planned-card/1-snapshot report.
- That fixture intentionally referenced a missing German image. The first deployment exposed a broken image, leading to the productive accessible fallback fix and a new component test. The redeployed page now announces `Bild für Bisasam nicht verfügbar`.
- A second live tab received the revision conflict warning after the first added a page and loaded the authoritative 2-page state only after `Aktuellen Stand laden`.
- At 375×812, both routes reported `scrollWidth=375`; keyboard Tab focus landed on `Backup exportieren` with a visible 3 px outline.
- Cloudflare listed 37 deployed static files. The inventory contains app/help HTML, Next.js assets, the original icon and public catalog metadata, with no card-image bytes, browser backups or binder records.
- JSON import passed. The live Blob export produced a retained 1,655-byte backup; its parsed metadata reported backup format 1, one controlled test binder and one card snapshot.
