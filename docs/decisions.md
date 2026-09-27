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
- The external TCGplayer link is user initiated. Cardfolio does not claim a purchase, price, seller match or successful cart state.

## 2026-09-27 — Cardmarket remains a review handoff

- `cardmarketImport` enables the warning-heavy handoff panel, not an exact-product or session integration.
- Cardmarket's documented Pokémon decklist matching needs abilities and attacks in addition to the name; Cardfolio currently lacks a verified source for those fields.
- Cardfolio therefore exports a neutral reference list and never labels it as import-ready or exact.
- Every position retains the user's original printing preferences and requires a visible edition/illustration check before purchase.
- Parts contain at most 150 grouped positions, matching the documented Wants-list limit. A quantity greater than one remains one position.
- Links are user initiated and point only to the generic Pokémon Singles page and official help; no scraping, login, cart or checkout automation is performed.

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
- There is no configured Git remote or target host in this checkout, so hosting headers and hydration are not marked as production-verified.
- A public release is prohibited until the blocked gates in `docs/public-release-readiness.md` are closed and an exact `docs/release-record-template.md` is completed.

## 2026-09-27 — Private GitHub repository; operator and project license deferred

- The user directed that the GitHub repository remain private for now.
- The repository's own license is intentionally left undecided. Absence of a license must not be described as open-source permission.
- Legal operator/provider details will be supplied later. Placeholder identity or contact data must not be invented.
- These deferred decisions do not block private CI, scheduled public catalog updates or a technical Cloudflare preview, but they continue to block a public production launch.
