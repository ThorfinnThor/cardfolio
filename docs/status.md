# Implementation status

## 2026-09-27 — Foundation package

Implemented:

- CF-01 local runtime and direct TCGdex shell smoke test.
- CF-02 bounded reuse decision: fresh implementation, no copied source/assets.
- CF-03 Next.js static-export scaffold, feature flags, Vitest and Playwright configuration.
- CF-04 domain types, immutable binder actions, statistics, missing-item grouping and validation.
- CF-05 IndexedDB stores, revision checks and atomic transactions.
- CF-06 validated JSON backup export/import-as-new path.
- CF-10 TCGdex search/detail adapter with pagination, cancellation, timeout, bounded retries and Pocket classification from set series.
- GitHub CI, scheduled public set-data update and Cloudflare Pages setup documentation.
- Neutral integration UI for binder creation, search, placement, ownership and backup. It is not a final design.

## 2026-09-27 — CF-08 productive Binder overview

Implemented:

- Design 3 Binder overview with local-storage status, collection metrics and responsive binder cards.
- Create flow with validated binder names and a clear local-only storage explanation.
- Confirmed delete dialog wired to the revision-checked IndexedDB repository.
- Empty state and backup import/export actions kept in the same local-first shell.

## 2026-09-27 — CF-09 productive 3×3 binder page

Implemented:

- Persistent 3×3 page grid backed by the selected IndexedDB binder page.
- Previous/next page controls and a revision-checked “+ Seite” action.
- Accessible, keyboard-focusable empty slots with clear placement affordance.
- External card image references rendered with `object-fit: contain`; no image bytes are stored.
- Design 3 styling for page controls, occupied slots, empty slots and mobile layout.

## 2026-09-27 — CF-11 productive card search and placement

Implemented:

- Search drawer with explicit target-slot context and close action.
- TCGdex search results with a concrete “In Slot einsetzen” action.
- Detail fetch and physical-card guard before placement; Pocket/digital cards are rejected.
- Successful placement stores the normalized card snapshot and closes the drawer.
- Search is also available without a preselected slot and falls back to the next free slot.

## 2026-09-27 — CF-07 design preview package

Implemented:

- Shared frozen preview fixture with 2 pages, 18 slots, 16 planned cards, 12 owned cards, 4 missing cards and 2 empty slots.
- `/design-preview/?variant=2` Clean Binder shell with separate KPI cards and overview panel.
- `/design-preview/?variant=3` Collector Workspace shell with continuous KPI strip and persistent context panel.
- Shared binder grid, page navigation, selected-card context, search/no-result, missing-card and image-error states.
- Responsive layouts for desktop, tablet icon rail and mobile drawer-style composition without duplicated editor logic.
- Component tests covering the fixture counts and both design compositions.

Verification completed:

- Typecheck: passed.
- ESLint: passed.
- Vitest: 5 files and 13 tests passed.
- Static Next.js build: passed; `out/_headers` present.
- Browser static-preview flow: passed for create, reload, live search, card placement, external image and ownership persistence.
- Mobile 375 px: passed after correcting the hidden import-field overflow.

Open follow-ups:

- Test German provider data, 404, timeout and missing-image UI in a real browser.
- Configure GitHub remote and Cloudflare Pages externally.
- Run the configured Playwright suite on GitHub Actions after the repository remote is connected; local headless Chromium launch is blocked by the macOS shell sandbox.

Design decision: Design 3 — Collector Workspace was explicitly selected and recorded in `docs/decisions.md` and `src/config/product.ts`.

## 2026-09-27 — CF-12 productive card interactions

Implemented:

- Touch-safe and keyboard-reachable ownership, move and remove actions on occupied slots.
- Explicit move mode with free-slot placement and occupied-slot swapping.
- Confirmed card removal dialog; local persistence remains revision-checked through IndexedDB.
- Move/search mode is mutually exclusive so a selected source cannot be lost silently.

Verification completed:

- Typecheck, ESLint, Vitest (5 files, 13 tests) and static Next.js build passed.

Next planned package: CF-13, Sol missing-item derivation and export workflow.

## 2026-09-27 — CF-13 generic missing-card exports

Implemented:

- Neutral text and CSV exporters driven exclusively by `deriveMissingItems` output.
- Stable columns for quantity, card, set, collector number, language, finish, edition, condition and review guidance.
- UTF-8 CSV with optional BOM, RFC-style quote escaping and spreadsheet-formula neutralization.
- Leading-zero collector numbers are protected from spreadsheet coercion.
- Incomplete variant or physical-printing metadata stays explicit and produces warnings instead of inferred values.
- Export result metadata reports warnings, exclusions and review-required positions for later marketplace adapters.

Verification completed:

- Typecheck, ESLint, Vitest (6 files, 17 tests) and static Next.js build passed.
- Tests cover grouped quantities, owned-card exclusion, variant separation, special characters, formula injection, leading zeros, BOM behavior and unknown metadata.

Next planned package: CF-14, Luna missing-card view and backup/export controls.

## 2026-09-27 — CF-14 missing-card view and backup report

Implemented:

- Design 3 Fehlkartenansicht for the active local binder with quantity summary and search filter across name, set and collector number.
- Copy-to-clipboard action with a clear permission fallback; TXT and UTF-8 CSV downloads remain available when clipboard access is blocked.
- Per-position language, finish, edition, condition and manual-review status remain visible in the list.
- Successful JSON backup imports now show a local import report with binder, planned-card and card-snapshot counts plus imported names.

Verification completed:

- Typecheck, ESLint, Vitest (7 files, 19 tests) and static Next.js build passed.
- Static browser smoke test opened the Fehlkartenansicht, filtered by `pikachu`, copied the list successfully and reported no console errors or warnings.

Next planned package: CF-15, final Design-3 consistency pass across search, dialogs, errors and mobile.

## 2026-09-27 — CF-15 Design-3 consistency pass

Implemented:

- Productive root tokens now use the selected Design 3 Petrol palette; Design 2 remains isolated to the comparison preview.
- Search drawer, no-result state, error state, notices, confirmation dialogs and import reports share the same Design 3 surface/border/action language.
- The productive route declares `data-design="design-3"` so automated checks can verify the fixed product choice.
- Responsive rules keep the 3×3 binder, stack export/actions on narrow screens and use the mobile search-drawer/dialog treatment.

Verification completed:

- Typecheck, ESLint, Vitest (7 files, 19 tests), static Next.js build and `git diff --check` passed.
- Static browser smoke test verified the Design 3 token values, search drawer, no-result message, remove dialog cancellation, `scrollWidth=1280` without overflow and no console warnings/errors.

Next planned package: CF-16, Sol end-to-end, multi-tab conflict, storage-error and static-preview verification.

## 2026-09-27 — CF-16 end-to-end and conflict hardening

Implemented:

- Four controlled Playwright scenarios cover the complete binder flow with swap, ownership, reload, missing list, JSON export/import, multi-tab conflict, unavailable IndexedDB and 375-pixel drawer behavior.
- GitHub CI installs Playwright Chromium and runs the E2E suite after typecheck, lint, unit tests and the static build.
- The static-preview server no longer downloads a runtime package; it serves `out/` with the runner's Python HTTP server.
- `BroadcastChannel` announces local binder revisions while repository revision checks remain authoritative.
- Conflicts never overwrite the other tab: the stale tab shows a persistent warning and reloads only after an explicit action.
- Generic storage errors expose “Erneut versuchen” and “Backup exportieren”; backup export errors are handled visibly.
- Escape closes the search drawer, whose search field receives focus when opened.
- The persistence test now models two repository clients writing the same binder revision.

Verification completed:

- Typecheck, ESLint, Vitest (7 files, 19 tests), static Next.js build and `git diff --check` passed.
- Playwright discovered all 4 E2E cases. Its local Chromium process cannot start inside the macOS command sandbox because the OS denies the Mach rendezvous port before test execution; GitHub Actions is configured to execute the same suite on Ubuntu.
- Static browser verification passed for multi-tab conflict notification, explicit current-revision reload, drawer focus, Escape handling and `innerWidth=scrollWidth=375`.
- A controlled two-card JSON backup was imported in a clean local origin; the report showed 1 binder, 2 planned cards and 2 snapshots, with ownership and missing counts restored correctly.

Next planned package: CF-17, Sol TCGplayer text export and matching test set.

## 2026-09-27 — CF-17 TCGplayer text export and matching test set

Implemented:

- TCGplayer Mass Entry exporter with explicit `verified-printing`, `candidate` and `unresolved` states.
- Small documented set-code whitelist for eight English TCGdex sets; TCGdex IDs are never treated as TCGplayer codes automatically.
- Separate card-level whitelist for three printings actually exercised in the official parser: Base Set Bulbasaur, Paldea Evolved Sprigatito and Paldea Evolved Magikarp illustration rare.
- Exact TCGplayer product names and full collector-number forms are stored only for those tested printings.
- Unmapped sets, untested printings, non-English names, non-physical cards and unsafe multiline fields stay visible but are excluded from the specific Mass Entry block.
- Design 3 marketplace panel with filtered preview, copy action, TXT download, explicit external Mass Entry link and a visible review list for every exclusion.
- `tcgplayerTextExport` enabled; URL prefill remains disabled.

Verification completed:

- Typecheck, ESLint, Vitest (8 files, 27 tests), static Next.js build and `git diff --check` passed.
- Official TCGplayer Mass Entry showed the documented general line structure and the live Pokémon set-code list used by the whitelist.
- Real parser test: `Bulbasaur [BS] 44` was recognized only with the full displayed collector number; modern Paldea cards required TCGplayer's exact product title including the collector-number suffix.
- `Sprigatito - 012/193 [PAL] 012/193` and `Magikarp - 203/193 [PAL] 203/193` both resolved and reached the anonymous cart. No checkout or account action was performed.
- Static browser UI showed one verified line and one excluded candidate, copied only the verified line, disabled the specific export for a candidate-only filter and reported no console issues or framework overlay.
- Mobile verification reported `innerWidth=375` and `scrollWidth=375`.

Next planned package: CF-18, Sol Cardmarket handoff and edition warning.

## 2026-09-27 — CF-18 Cardmarket handoff and edition warning

Implemented:

- Cardmarket handoff as an explicitly non-exact review list; no card is presented as an automatically verified product match.
- Every line preserves quantity, original name, set, collector number, language, finish, edition and minimum condition for manual comparison.
- Lists are split after 150 positions, not after 150 copies, matching Cardmarket's documented Wants-list entry limit.
- Permanent warnings explain that Cardmarket may resolve another printing or illustration and that every edition must be checked before purchase.
- Because Cardfolio does not reliably store Pokémon attacks and abilities, the output is labeled as a review list rather than a compatible decklist import.
- Design 3 panel with part selection, copy, TXT download, official help link and user-initiated Pokémon Singles search.

Verification completed:

- Typecheck, ESLint, Vitest (9 files, 32 tests), static Next.js build and `git diff --check` passed.
- Tests cover the 150/1 split, position-versus-quantity counting, German names, preserved variant preferences and safe single-line normalization.
- The production static page rendered the Cardmarket panel with the three warnings, complete original printing metadata and no framework error overlay.
- The E2E scenario now covers the review warning, preview content and TXT filename. Local execution still cannot start Playwright Chromium because macOS denies its Mach rendezvous port before test code runs; GitHub Actions remains the execution environment for this suite.

Next planned package: CF-19, Sol price-estimate data gate and optional Luna presentation pass.

## 2026-09-27 — CF-19 price-estimate data gate

Implemented:

- Internal `PriceEstimate` contract with integer minor units, explicit provider, currency, metric, source timestamp, variant key and match quality.
- Strict TCGdex pricing normalizer for the live-confirmed Cardmarket and TCGplayer response shapes.
- Explicit rejection paths for invalid timestamps/currencies, missing variants, zero/negative/non-finite/fractional-cent amounts and unsupported edition/finish combinations.
- Candidate-only Cardmarket estimates, no Cardmarket Reverse inference, and no TCGplayer pricing for non-English card identity.
- A written evidence record in `docs/pricing-gate.md`.

Gate decision:

- `pricing` remains disabled. Live data did not prove language-, edition- and variant-safe coverage, so no price UI, KPI or total was added.
- The Luna timestamp/coverage presentation pass is intentionally deferred until the data gate can be reopened.

Verification completed:

- Four current live TCGdex card responses were inspected across English/German, vintage/modern and normal/reverse/holo cases.
- Typecheck, ESLint and Vitest (10 files, 39 tests) passed.

Next planned package: CF-20, Sol + Luna desktop drag-and-drop and additional binder layouts, while retaining tap/keyboard controls.

## 2026-09-27 — CF-20 layouts and optional desktop drag-and-drop

Implemented:

- Supported binder formats are now 2×2, 3×3 and 3×4.
- Format changes show a confirmation preview with planned-card count, moved positions and resulting page count before any write.
- Reflow preserves every planned entry ID, ownership state, variant, purchase preference and existing page note; the source binder remains immutable.
- Existing pages are never removed merely because a larger layout could fit the cards on fewer pages.
- Mouse drag-and-drop uses the stable `@dnd-kit/core`/`@dnd-kit/utilities` family and the same revision-checked move/swap action as the existing controls.
- Touch and keyboard users retain the explicit “Verschieben” and “Hierher verschieben” buttons; the drag handle is hidden on narrow screens.
- The controlled E2E suite now contains a fifth scenario for confirmation, lossless reflow, mouse swap and the retained button alternative.

Verification completed:

- Typecheck, ESLint, Vitest (11 files, 44 tests), static Next.js build and `git diff --check` passed.
- Domain tests cover 2×2 overflow pages, 3×4 expansion, identity/ownership/variant/note preservation, moved-position previews and unsupported layouts.
- Component tests verify that mouse drag does not replace the occupied- and empty-target buttons.
- Static browser verification changed a real local binder from 3×3 to 3×4, retained its card, persisted the format across reload and moved the card using the non-drag button path.
- The local browser controller does not expose a reliable pointer-drag gesture. The Playwright mouse scenario is committed for GitHub Actions; local Playwright Chromium remains blocked by the documented macOS Mach-port restriction.

Next planned package: CF-21, Sol + human rights, privacy, security and public-release gate review.

## 2026-09-27 — CF-21 rights, privacy, security and release gates

Implemented:

- Public help/data-flow route covering local IndexedDB storage, origin binding, independent JSON backups, external TCGdex requests/images, marketplace handoffs and product limitations.
- Repository data-flow record and release-gate matrix with explicit passed, conditional and blocked states; no legal-compliance claim is made.
- Dependency and scaffold provenance record. All direct runtime packages declare reviewed permissive licenses; the complete installed tree was summarized separately from data/image rights.
- Production design preview disabled; unused Create Next App public SVG assets removed and the default favicon replaced by an original Cardfolio icon.
- Cloudflare Pages CSP and security headers expanded to the actual static app hosts and capabilities.
- GitHub Actions pinned to full verified commit SHAs, bounded by timeouts and extended with audit, typecheck, lint, build and automated release checks.
- Repeatable `release:check` for static output, help route, header policy, disabled risky features, GitHub/Cloudflare separation and runtime licenses.
- Target-host checklist and exact release-record template for version, commit, build date, origin, schema, browsers, flags, limitations and approvals.

Gate decision:

- Public release remains blocked. A human must decide the repository license and approve the concrete data/image/trademark/name use plus operator/privacy texts.
- Hosting remains blocked until the GitHub remote and Cloudflare Pages project exist and the production-origin checklist passes.
- At the CF-21 review point, no repository had been pushed and no Cloudflare project or deployment existed. See CF-22 below for the later private-repository and prepared-integration state.

Next planned package: CF-22, human release-input collection plus GitHub/Cloudflare connection and target-host verification after explicit authorization.

## 2026-09-27 — CF-22 private GitHub and Cloudflare preparation

Completed:

- Created the private repository `ThorfinnThor/cardfolio`, configured `origin` and pushed `main`.
- First GitHub CI execution reached all verification stages and exposed ambiguous E2E selectors; the affected selectors and asynchronous placement/drag waits were corrected in commits `670453b` and `d329377`.
- Repeated local verification passed: typecheck, ESLint, 44 Vitest tests, static build, release checker and `git diff --check`.
- Selected the private repository in Cloudflare Pages and prepared the build form with production branch `main`, the **Next.js (Static HTML Export)** preset, `npm run build`, output directory `out` and `NODE_VERSION=24`.
- Recorded that operator details and the project license remain intentionally undecided. The repository stays private.

External blockers and pending action:

- GitHub run `36324400200` was rejected before a runner started because the account reports a failed payment or exhausted spending limit. This is an account-level billing setting, not an application or workflow failure.
- Cloudflare **Save and Deploy** has not been clicked. The first `pages.dev` deployment and target-origin verification require the final deployment confirmation.
- Public production release remains blocked by the separate data/image/trademark and operator/privacy gates.

## 2026-09-27 — CF-23 Cloudflare technical preview and target-host verification

Completed:

- Created the Cloudflare Pages project `cardfolio` with automatic deployments from private GitHub `main`.
- Deployed and verified `https://cardfolio-780.pages.dev/`; application commit `a5ad85f4a997d8f806af27bf25b2b35abe8bd313` has immutable deployment `https://6cbb4716.cardfolio-780.pages.dev/` with Cloudflare status `success`.
- Verified direct navigation and reloads for `/` and `/help/`, production security headers, Design 3 hydration, English live search/detail, German detail/set data, external images, IndexedDB persistence, JSON import, multi-tab conflict detection/reload, 375 px layout and visible keyboard focus without browser warnings/errors.
- The live test exposed a missing productive image-error state. `BinderGrid` now replaces failed remote images with an accessible “Bild nicht verfügbar” fallback; its component test raises the suite to 45 tests, and the correction was redeployed successfully.
- Deployment inventory contains 37 static files, including the app, help route, icon, Next.js assets and public catalog metadata; no card-image bytes, user backups or binder data are deployed.
- Pinned `.nvmrc` and Cloudflare `NODE_VERSION` to 24.19.0 to meet the current test dependency engine floor.
- Retained and validated the live Blob backup download: backup format 1 with one controlled test binder and one card snapshot.

Remaining external/human gates:

- GitHub-hosted CI cannot start until the account billing/spending-limit issue is resolved.
- Operator/privacy, project-license and data/image/trademark approvals remain intentionally open and continue to block public production approval.

## 2026-09-27 — CF-24 public GitHub verification and scheduled-data proof

Completed:

- Repository visibility changed from private to public. No project license was added; the repository remains visible-source rather than declared open source.
- CI run `36327453467` passed `npm ci`, trusted `npm audit`, typecheck, lint, 45 unit/component tests, static build, release checks, Chromium installation and all five Playwright scenarios for commit `0ce703c7c07e3f756669b1c04aa6f42ceca5a5a8`.
- The E2E corrections wait for the completed ownership write, use an exact missing-card label, preserve the provider's collector number and drag from source grip to target grip so dnd-kit collision geometry is deterministic.
- Manually dispatched workflow run `36327563806` passed data synchronization, audit, typecheck, lint, tests, build and release checks, then committed refreshed English/German TCGdex set metadata as `336b95f5c3e4f7425cf39c05e1b7481507871f76`.

Remaining human gates:

- Operator/privacy details will be supplied later.
- The project license remains undecided.
- Data/image/trademark/name review remains required before public production approval.

## 2026-09-27 — CF-25 bilingual card-name search

Completed:

- Reproduced the screenshot report against the live provider: German TCGdex returned `Glurak`, while the hardcoded English request returned no matches.
- Card search now queries German and English TCGdex catalogs in parallel, presents German matches first and labels every result with `DE` or `EN`.
- Partial provider failure remains visible without discarding results from the other language.
- Added a sixth Playwright scenario that searches for `Glurak`, verifies the `DE` result label and inserts the German card fixture.
- CI run `36335917139` passed audit, typecheck, lint, 45 unit/component tests, build, release checks and all six browser scenarios for commit `432bbcd2bb5b4e79e744b89785f2047a72c25822`.
- Cloudflare deployment `95ee4a6d` succeeded. The production alias returned the visible live result `Glurak · DE · Nr. 001` with no browser-console warnings or errors.

## 2026-09-27 — CF-26 exact collector-number search

Completed:

- Reproduced `Charizard 04/102`: TCGdex accepts only the local numerator as `localId=4`; the complete value `04/102` returns no provider match, while the provider's fuzzy number filter also returns values such as `14`, `40` and `74`.
- Search now parses `Name 04/102`, number-only `04/102` and `Name #004`, normalizes leading numeric zeroes, then verifies both the exact local number and official set total against card details.
- Search results and newly fetched binder snapshots retain and display the full printed number when the provider exposes the official set total, for example `4/102`.
- Added focused parser/adapter tests and a seventh Playwright scenario covering exact result filtering, insertion and persisted full-number display.
- GitHub CI run `36336618305` passed audit, typecheck, lint, 49 unit/component tests, build, release checks and all seven browser scenarios for commit `30561f1bef5575cbce6ee214f8b6ab1eab99243e`.
- Cloudflare deployment `5ba85d1a-cd4b-4b66-b624-3f725f50af0b` succeeded. The production alias returned exactly one visible result for `Charizard 04/102`: `Charizard · EN · Nr. 4/102`.

## 2026-09-27 — CF-27 images, complete numbers and printing variants

Completed:

- German cards without localized artwork now request the English TCGdex card image for the same card ID. If neither language has artwork, the honest placeholder remains; stored cards expose `Kartendaten aktualisieren` so they need not be removed and re-added.
- Every search result now combines the synchronized German/English set counts with a targeted card-detail fallback when a new set is not yet present in the weekly snapshot. The live `Glurak` list displayed full numbers including `001/30`, `1/15`, `3/70`, `4/100`, `4/82` and `4/102`.
- Card snapshots retain TCGdex availability flags for Normal, Holo, Reverse Holo and First Edition.
- Binder entries now store Finish, Edition and a separate printing choice: Shadowless, With Shadow/Standard or unspecified. Shadowless is explicitly manual because TCGdex does not expose it as a structured variant.
- Selected variants are visible on binder cards, included in missing-card grouping, generic exports and Cardmarket review lists. Partial legacy selections visibly identify the open field.
- CI run `36338067792` passed audit, typecheck, lint, 53 unit/component tests, build, release checks and all seven Playwright scenarios for commit `33b801f17783c16d6ef19cbd463a7303a7eba041`.
- Cloudflare deployment `fd3f7b29-10a5-44f9-b286-abc47493c4d9` succeeded; the production alias passed the full-number and variant-dialog live checks without changing binder content.

## 2026-09-27 — CF-28 language filter, marketplace disclosure and Design 3 audit

Completed:

- Card search now exposes `Alle`, `Deutsch` and `English` as an explicit card-language filter before the query field.
- `Alle` interleaves German and English matches instead of allowing the first language to consume the twelve visible result rows. A same-name card such as Pikachu therefore remains distinguishable by its visible `DE` or `EN` label.
- Disabled language queries are not sent to TCGdex when the user selects one language.
- The missing-card view initially shows only a compact marketplace choice. TCGplayer and Cardmarket details are mutually exclusive and appear only after the user selects that provider.
- Added a component regression for exclusive marketplace disclosure and an eighth Playwright scenario for same-name bilingual results and language switching.

Verification completed:

- Typecheck, ESLint, 54 unit/component tests, static Next.js build, release checks and `git diff --check` passed locally.

Design audit:

- The productive UI uses the Design 3 palette, KPI strip and some responsive behavior, but it is not yet a faithful implementation of the selected reference.
- In particular, the reference's application shell, dense binder presentation and persistent right context panel with mutually exclusive details/search/purchase modes are still missing from the productive route.
- Earlier status wording that called the productive overview and page “Design 3” described partial styling, not complete visual acceptance. Full Design 3 alignment remains open and must receive its own implementation and viewport review.

## 2026-09-27 — CF-29 faithful Design 3 workspace

Completed:

- Rebuilt the productive route around the selected Design 3 application shell: fixed desktop navigation, compact breadcrumb/search header, continuous KPI strip, dark binder surface and a persistent right context panel.
- Card search, page summary and selected-card details now occupy the same mutually exclusive context area. Repeated ownership, variant, move and remove controls were removed from every binder tile and consolidated in the selected-card panel.
- Binder cards expose the name, complete collector number, current variant and ownership state at a glance. German catalog entries that use an English fallback image are marked `Bild auf Englisch` in both the binder and detail panel.
- Added responsive Design 3 behavior: the desktop sidebar collapses, primary binder actions remain reachable in a sticky mobile action bar, and search/card details become focused bottom sheets.
- Updated component and browser scenarios for the new interaction model, including card selection before ownership, variant and move actions.

Verification completed:

- Typecheck, ESLint, 54 unit/component tests, static Next.js build, release checks and `git diff --check` passed locally.
- Interactive browser verification covered binder creation, bilingual Pikachu search, the German-only filter, insertion with a complete collector number, English-image disclosure, selected-card actions and a 375 × 812 mobile viewport. No browser-console warnings or errors were emitted.

## 2026-09-27 — CF-30 pre-insertion card and variant review

Completed:

- Selecting a search result no longer writes it directly into the binder. The Design 3 context panel first opens a review step with artwork, localized name, set, language and complete collector number.
- Finish, edition, printing and an optional custom variant label can be chosen before insertion. The chosen variant is stored atomically with the new binder entry instead of requiring an immediate follow-up edit.
- When TCGdex reports exactly one finish, that finish is preselected. Edition and printing remain explicitly unspecified unless the collector chooses them; Shadowless stays clearly marked as a manual classification.
- German cards using English artwork disclose `Bild auf Englisch` in the review step. Missing and failed images retain an honest fallback.
- Escape returns from review to the preserved search results before a second Escape closes search. Loading, provider failure and double-submit states are handled without occupying the target slot.
- Updated browser coverage proves that the slot remains empty during review, the selected variant persists on insertion and the two-step Escape behavior works at 375 × 812.

## 2026-09-27 — CF-31 catalog browsing, pagination and exact TCGplayer identities

Completed:

- Added language-aware series and set filters backed by the scheduled TCGdex metadata snapshot. Selecting a set starts browsing without requiring a card name; Pokémon TCG Pocket sets are excluded from the physical-card catalog.
- Search now displays verified set names and complete collector numbers in every result, loads 40 results per language page and exposes an explicit `Mehr laden` action instead of silently truncating the list after twelve rows.
- The weekly GitHub Actions data sync now records series metadata for English and German sets and removes Pocket sets before publishing the static catalog files.
- Existing locally stored card snapshots are completed in memory from the synchronized metadata. The binder, missing-card list, generic exports and Cardmarket review list therefore show complete numbers such as `17/111` and `2/132` whenever the set total is known.
- Replaced the blanket German-card rejection in the TCGplayer handoff with exact card-level verification. German `Tornupto · Neo Genesis · 17/111` maps only to the verified `Typhlosion (17) [N1] 017/111` identity; English `Blaine's Charizard · Gym Challenge · 2/132` maps to `Blaine's Charizard [G2] 002/132`. No general name translation was introduced.
- Split export warnings between a missing set code, a known set without a verified printing and an unresolved identity so the reason shown to the collector matches the actual gate.

Verification completed:

- Typecheck, ESLint, 60 unit/component tests, static Next.js build, release checks and `git diff --check` passed locally.
- The ten Playwright scenarios are syntactically discoverable. Local Chromium launch is blocked before test execution by the host macOS Mach-port sandbox; the same suite remains part of Linux GitHub CI.
- Visible browser verification against the local static build loaded Neo Genesis without a search term, displayed results `1/111` through `40/111`, loaded the next 40 results, found German `Tornupto 17/111`, inserted it with its variant review and produced the exact TCGplayer line `1 Typhlosion (17) [N1] 017/111`.

## 2026-09-28 — Cardmarket official Pokémon decklist format

Completed:

- Replaced the non-importable pipe-separated Cardmarket reference text with the documented `amountx full name abilities attacks` grammar.
- TCGdex ability and attack names are stored in validated local card snapshots and backups. Existing snapshots are refreshed automatically when Cardmarket is selected.
- Import text and variant review are now separate: Cardmarket receives only accepted decklist tokens, while set, number, language and printing preferences remain visible in Cardfolio.
- Cards lacking the required catalog identity fields are excluded visibly instead of producing a line that Cardmarket will reject.
- Restored TCGplayer's full displayed collector numbers after live parser verification, such as `[G2] 002/132` and `[N1] 017/111`; local-only numbers are rejected by the Pokémon Mass Entry parser.

Verification completed:

- Typecheck, ESLint, 65 unit/component tests, static Next.js build, release checks and `git diff --check` passed locally; all eleven Playwright scenarios are syntactically discoverable for Linux CI.
- A browser test against the local production build refreshed existing Tornupto and Pikachu snapshots from the live TCGdex API and produced exactly `1x Tornupto Feueraufladung Flammenexplosion` and `1x Pikachu Growl Thundershock` on separate lines.

## 2026-09-28 — TCGplayer live-cart regression and filter guidance

Completed:

- Repeated the Mass Entry check against the current live TCGplayer UI and current Pokémon set-code list.
- The shortened lines `[N1] 17` and `[G2] 2` were rejected as not found. The full lines `[N1] 017/111` and `[G2] 002/132` were both resolved by the parser.
- A single `1 Typhlosion (17) [N1] 017/111` line reached the anonymous cart as Neo Genesis, Moderately Played, Unlimited Holofoil. No checkout or payment was initiated.
- Blaine's Charizard resolved but reported insufficient quantity under the selected Printing/Condition filters, proving that inventory/filter failure is distinct from an invalid line.
- Cardfolio now lists the exact TCGplayer Printing and condition filters implied by each stored variant and condition preference. Unverified mapped-set candidates are excluded so one unsafe line cannot block the verified batch.
- Shadowless selections are excluded from the standard Base Set handoff because TCGplayer uses the separate `[BSS]` set code; this variant remains blocked until separately parser-tested.

Verification completed:

- Typecheck, ESLint, 66 unit/component tests, static Next.js build, release checks and `git diff --check` passed locally.
- The local production UI showed the exact full-number Typhlosion line, the compatible Holofoil options, the Near Mint condition and no browser-console warnings or errors.
