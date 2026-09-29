# Architecture decisions

## 2026-09-27 — Local-first static application

- Next.js App Router with `output: "export"` and `trailingSlash: true`.
- Binder URLs will use `/binder/?id=<uuid>` rather than a runtime-generated dynamic route.
- Binder and user data remain in IndexedDB for the current browser and origin.
- TCGdex is called directly from the browser. There is no API key and no default backend proxy.
- Card image values are validated HTTPS references to `assets.tcgdex.net`; image bytes are not stored or proxied.
- Superseded on 2026-09-27 by the explicit Design 3 selection below.

## 2026-09-27 — Product design selected

- The user explicitly selected **Design 3 — Collector Workspace** after reviewing the two CF-07 previews.
- `PRODUCT_DESIGN` is fixed to `"design-3"`.
- Productive UI work must use the Design 3 Petrol palette, continuous KPI strip and persistent context panel.
- Design 2 remains available only as a comparison preview; it must not be mixed into the productive application.
- Search, dialogs, empty/error states and mobile layouts must follow Design 3 consistently.

## 2026-09-27 — GitHub data and Cloudflare delivery

- GitHub is the source repository.
- CI verifies typecheck, lint, unit tests, and static build.
- A separate scheduled GitHub Action updates validated public set metadata. It cannot access local binder data.
- Cloudflare Pages Git integration performs application builds and deployments after repository changes.
- GitHub Actions does not deploy the application, avoiding two competing release paths.
- The first scheduled dataset contains set metadata only, not the complete card catalog or any image files.

## 2026-09-27 — TCGplayer text gate uses printing-level evidence

- `tcgplayerTextExport` is enabled only for the tested text/copy workflow; `tcgplayerPrefill` remains disabled.
- A verified TCGplayer set code is necessary but not sufficient for `verified-printing`.
- The specific Mass Entry block requires an exact, manually tested card-level mapping because modern Pokémon product titles can include collector-number suffixes not present in the TCGdex card name.
- All other cards remain in the neutral missing-card list and appear as `candidate` or `unresolved`; they are never silently translated or guessed.
- Pokémon Mass Entry requires the full displayed collector number, including leading zeroes and set total. A local-only number such as `17` is not substituted for `017/111`.
- Mapped-set candidates without a tested printing are excluded from Mass Entry. TCGplayer can reject the whole batch when one line cannot be fulfilled, so a speculative line must not block verified cards.
- TCGplayer Printing options are separate filters: `Holofoil`, `1st Edition Holofoil` and `Unlimited Holofoil` are not interchangeable. Cardfolio shows the compatible filter labels but never claims that matching inventory exists.
- TCGplayer lists Base Set (Shadowless) under its own `[BSS]` set code. A Shadowless selection is excluded from the regular `[BS]` handoff until that exact variant mapping is separately parser-tested.
- The external TCGplayer link is user initiated. Cardfolio does not claim a purchase, price, seller match or successful cart state.

## 2026-09-27 — Cardmarket remains a review handoff

- `cardmarketImport` enables the warning-heavy handoff panel, not an exact-product or session integration.
- Cardmarket's documented Pokémon decklist matching needs abilities and attacks in addition to the name; Cardfolio currently lacks a verified source for those fields.
- Cardfolio therefore exports a neutral reference list and never labels it as import-ready or exact.
- Every position retains the user's original printing preferences and requires a visible edition/illustration check before purchase.
- Parts contain at most 150 grouped positions, matching the documented Wants-list limit. A quantity greater than one remains one position.
- Links are user initiated and point only to the generic Pokémon Singles page and official help; no scraping, login, cart or checkout automation is performed.

## 2026-09-28 — Cardmarket decklist text follows the documented Pokémon grammar

- The earlier pipe-separated reference list is not an accepted Cardmarket Pokémon decklist and is no longer presented as import text.
- Card snapshots now retain TCGdex ability and attack names. Legacy local snapshots are refreshed from TCGdex when the collector selects Cardmarket.
- Import lines contain only `amountx full name abilities attacks`, one card per line. Trainer and Energy cards use their full name; Pokémon without the required catalog details are visibly excluded.
- Set, collector number, language, finish, edition, printing and condition remain separate review metadata because Cardmarket's decklist grammar cannot encode them.
- Copy and TXT actions contain only accepted decklist fields. Per-card searches remain a separate manual verification aid.

## 2026-09-27 — Pricing gate remains closed after CF-19

- TCGdex price payloads can be normalized into the internal `PriceEstimate` contract only when source timestamp, currency, positive cent-exact value and explicit variant key are present.
- Normalized data is not equivalent to a verified product price. Cardmarket remains `candidate`; TCGplayer requires English identity and an independently verified printing mapping.
- Live samples did not safely distinguish German from English marketplace products, First Edition from generic normal, or all Cardmarket finish variants.
- No price UI or aggregate was added. `FEATURES.pricing` remains `false`, and missing/ambiguous data is never displayed as `0 €`.
- Price data remains request-time external data; it is not added to the local backup schema or scheduled GitHub datasets.

## 2026-09-27 — Layout changes reflow without deleting pages or cards

- Product-supported layouts are limited to 2×2, 3×3 and 3×4. Arbitrary row/column combinations remain rejected by the domain action.
- A format change reflows planned entries in page/slot reading order and requires an explicit preview confirmation.
- Planned entry IDs, ownership, variant and purchase preferences are copied unchanged. Existing page IDs and notes are preserved by index.
- Resulting page count is never lower than the current page count, preventing a layout expansion from silently deleting pages or their notes. Shrinking capacity may append pages.
- Desktop drag-and-drop is an optional mouse enhancement using the stable `@dnd-kit/core` family. It calls the same `moveOrSwapCard` action and repository revision check as the established button flow.
- Drag handles are not the accessibility path. “Verschieben” and target buttons remain the supported touch/keyboard alternative and stay visible independently of drag.

## 2026-09-27 — Public release remains blocked after CF-21

- Design 3, local data security and the current purchase presentation pass their repository-scope gates.
- The productive static build disables `/design-preview/`; comparison components remain in source only for controlled development and tests.
- Cloudflare Pages Git integration remains the sole deployment path. GitHub Actions verifies and updates validated public set metadata but never deploys or accesses binder data.
- Public card imagery, Pokémon marks, the Cardfolio name and the concrete provider operating model require human review. API availability and a database software license are not treated as blanket artwork permission.
- Operator identity, required provider/privacy text, Cloudflare log settings and the final production origin are unknown. No claim of legal compliance is made.
- At the CF-21 review point there was no configured Git remote or target host. CF-22 subsequently added the private GitHub remote and prepared Cloudflare Pages, but hosting headers and hydration remain unverified until the first deployment exists.
- A public release is prohibited until the blocked gates in `docs/public-release-readiness.md` are closed and an exact `docs/release-record-template.md` is completed.

## 2026-09-27 — Private GitHub repository; operator and project license deferred

- The user directed that the GitHub repository remain private for now.
- The repository's own license is intentionally left undecided. Absence of a license must not be described as open-source permission.
- Legal operator/provider details will be supplied later. Placeholder identity or contact data must not be invented.
- These deferred decisions do not block private CI, scheduled public catalog updates or a technical Cloudflare preview, but they continue to block a public production launch.

## 2026-09-27 — Repository made public without a project license

- The owner subsequently changed `https://github.com/ThorfinnThor/cardfolio` from private to public.
- This supersedes only the earlier visibility decision. The project-license decision and operator details remain intentionally deferred.
- Public source visibility is not described as open-source permission; without an explicit project license, no reuse grant is implied.
- Public visibility restored GitHub-hosted runner allocation. CI run `36327453467` passed the complete pipeline, including all five Playwright scenarios.
- The public-data workflow remains the only GitHub Action with `contents: write`; it validated and committed the first live refresh as `336b95f5c3e4f7425cf39c05e1b7481507871f76`.

## 2026-09-27 — Card language and marketplace views are explicit choices

- Card language is a search control independent of the German interface language. `Alle` is a balanced bilingual view; `Deutsch` and `English` query and display only the selected catalog.
- Marketplace handoffs use progressive disclosure. TCGplayer and Cardmarket may both be enabled, but their detailed controls are never shown simultaneously.
- Neither choice changes a stored card's language or variant, and neither marketplace view implies an exact product match beyond its documented verification status.

## 2026-09-28 — Page labels and binder order remain backward compatible

- Optional page titles extend backup version 1 without making existing binders or backups invalid. An absent or blank title continues to render as `Seite <n>`.
- Page moves reorder complete page objects, so page IDs, notes, slot positions, ownership and variants stay together.
- Binder duplication creates fresh binder, page and planned-entry IDs while retaining descriptions, page titles, notes, cards and preferences.
- Manual binder order is stored as an ID list in the existing IndexedDB `settings` store. It does not change binder revisions or the user-facing `updatedAt` date.
- Creation, deletion, duplication and manual ordering publish a lightweight order-change message so another open tab can refresh its binder list without treating the active binder as conflicted.

## 2026-09-28 — Physical catalog search uses a synchronized allowlist

- Direct TCGdex card search can return physical Pokémon cards and Pokémon TCG Pocket cards together.
- Search results are now accepted only when their derived set ID exists in Cardfolio's weekly synchronized physical-set catalog. Pocket and otherwise unverified sets are removed before the user can select a result.
- A newly released physical set may therefore wait for the next successful catalog sync before it appears. This is preferable to presenting a digital card as a valid physical-binder candidate.
- The detail-level digital-card check remains as defense in depth for stale local data or a provider classification change.
- TCGplayer cards that lack a verified mapping remain in the Cardfolio missing list. The UI now says they are not copied into the TCGplayer list instead of suggesting that the cards themselves were removed.

## 2026-09-28 — TCGplayer identity coverage is synchronized, not hand-maintained

- The weekly public-data workflow reads TCGplayer's current Pokémon Mass Entry set-code catalog and current product search catalog in addition to TCGdex's physical-set catalog.
- Every physical TCGdex set must resolve to an official TCGplayer set code or an explicit documented unavailable-set record; an unaccounted set fails the synchronization job.
- Card mappings retain TCGplayer's exact product name, complete displayed collector number and set code. Matching uses the collector number first and a conservative unique-name fallback for subsets whose provider numbers differ.
- Product mappings are loaded only when the collector opens the TCGplayer handoff, keeping the initial local-first workspace independent from the marketplace payload.
- Finish, edition and printing are required before a binder card can be inserted or updated. `Mit Schatten / Standard` is the default printing; Shadowless must be selected deliberately and uses TCGplayer's separate `[BSS]` set.
- The remaining absence of a provider record is shown as a provider limitation, not silently converted into a speculative Mass Entry line.

## 2026-09-29 — Visual layer "Synthese 2" selected

- The user selected **Synthese 2** as the productive visual direction: Holo structure calmed by roughly 20–30 %, Kabinett binder covers and materiality, Slab-compact status displays.
- This is a UI-only change. Contracts, persistence, domain logic, dependencies and the lockfile are unchanged; the Design 3 information architecture (KPI strip, persistent context panel, search drawer) is kept.
- Light ("Tag") and dark ("Nacht") mode share one token set in `src/app/globals.css`. The default follows the system setting; the manual choice is a UI preference stored in `localStorage` (`cardfolio-theme`) and is not part of binder data or backups.
- Brass is the single brand accent. Green (vorhanden) and coral (fehlt) are status-only and always paired with text or a symbol. Glows are limited to holo cards on hover, completion, the three-fold gold pulse after marking a card as owned and the selected card; `prefers-reduced-motion` disables motion.
- Binder cover colours are derived from the binder ID and CF numbers from the shelf position, so no new persisted fields are required.
- Fonts (Unbounded, Figtree, JetBrains Mono; SIL OFL 1.1) are self-hosted via `next/font/local`, satisfying `font-src 'self'`. Textures are local SVG files under `public/textures/`.

## 2026-09-29 — TCGdex variant fallback is not a catalog confirmation

- TCGdex answers every card without curated variant data with `normal: true` and all other variants `false`. Complete sets (for example Team Up, Cosmic Eclipse, Hidden Fates, Evolutions, 151 commons) carry no variant data, so this shape is indistinguishable from "unknown".
- Cardfolio previously displayed it as "Katalog bestätigt: Non-Holo / Normal", preselected Non-Holo and blocked Holo and Reverse Holo, e.g. for the holo-only Celebi & Bisaflor GX (Team Up 159/181).
- The exact fallback shape is now treated as missing variant data in the adapter and when reading stored snapshots. All finishes stay selectable and the finish is not preselected. No schema or backup change is needed.
- Trade-off: a card whose curated data genuinely says only Non-Holo (no Reverse, no First Edition) also shows as unconfirmed. That costs one manual choice but never blocks a real printing.
