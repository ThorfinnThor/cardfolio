# Smart Search and Gift Builder — Sol/Luna implementation plan

Date: 2026-10-01

This plan turns the remaining D-05 Smart Search work and D-06 Gift Builder V1 into eight sequential model-specific steps. Work stays local-first, uses the existing `CardRef`/binder core, remains a static Next.js export and does not add a required runtime server, private image storage or a second card model.

## Working protocol

- Execute exactly one step at a time, then stop so the user can switch models.
- At the beginning of every step, inspect `git status`, the current branch, the previous commit and this plan.
- Preserve unrelated user changes. Do not merge a pull request or deploy unless the user explicitly authorizes that external action.
- Every step ends with: changed files, architectural decisions, tests run, skipped checks, known limitations and the next required model.
- Sol owns domain contracts, persistence, data pipelines, pricing, marketplace adapters and release/security gates.
- Luna owns productive UI, interaction design, responsive behavior, accessibility and browser-facing states. Luna does not redefine Sol's released contracts.
- Do not introduce CLIP, embeddings, a vector database or a paid semantic-search provider. The approved D-05 implementation is the local static tag/caption index.

## Step 1 — Sol: Smart Search technical completion

**Model:** Sol (`gpt-6-sol`), reasoning high

**Goal:** Make the existing local artwork search reproducible, replaceable and safely gated without changing its product behavior.

**Scope:**

- Add a `smartSearch` feature flag and ensure the normal catalog search works when it is disabled.
- Define a provider-neutral `SmartSearchAdapter`, `SmartSearchQuery` and `SmartSearchHit`; implement only a local static-index adapter.
- Keep TCGdex IDs as the only card identity and keep images external.
- Add a reproducible build pipeline from reviewed semantic source data to the compact public JSON index.
- Add a scheduled-data audit that detects new physical cards and reports an untagged backlog. It must not publish automatically inferred tags without review.
- Extend the fixed evaluation set to at least 50 predeclared queries and compare the local artwork search with the normal lexical search.
- Add explicit timeout/abort behavior for loading the index.
- Extend `docs/reuse-audit.md` for the `pokemon-card-explorer` reference without copying its scraped data or assets.
- Document index version, generation command, coverage, payload size and benchmark result.

**Acceptance:**

- Feature-off build and normal search pass.
- Index can be rebuilt byte-for-byte from committed reviewed source data.
- New untagged catalog cards are detected, not silently ignored or automatically labeled.
- At least 50 fixed queries run in an automated evaluation.
- No runtime API, secret, image copy or new server is introduced.

**Handoff:** Stop and tell the user to switch to Luna for Step 2.

## Step 2 — Luna: Smart Search product completion

**Model:** Luna (`gpt-6-luna`), reasoning high

**Goal:** Make Smart Search discoverable, accessible and recoverable in the productive Design-3/Synthese-2 interface.

**Scope:**

- Render Smart Search only when Sol's feature flag is enabled; normal name/number search remains the default.
- Keep the wording explicit that tags are automatically inferred and can be wrong.
- Add loading, timeout, malformed-index, no-result and disabled states.
- Add a direct `Mit Name/Nummer suchen` fallback that preserves a useful query where possible.
- Add a card-language choice for insertion. Reuse the English visual index, then hydrate the same TCGdex ID in DE or EN; show an English fallback when the requested localized card is unavailable.
- Verify keyboard order, focus return, screenreader labels, touch targets and 375/768/1024/1440 px layouts.
- Add component and browser tests for feature-off, error fallback, language choice and successful card review.
- Prepare PR #4 for final review. Do not merge or deploy without explicit user authorization.

**Acceptance:**

- Smart Search is visible in the prepared build and absent when the flag is off.
- A failed artwork index never blocks normal search or binder editing.
- DE/EN selection never changes a card silently and still requires variant review.
- No horizontal overflow or inaccessible control at the required viewports.

**Handoff:** Report the PR/CI state and tell the user to switch to Sol for Step 3. If merge/deployment is desired, request the user's explicit authorization at this boundary.

## Step 3 — Sol: Selection-to-page domain

**Model:** Sol (`gpt-6-sol`), reasoning high

**Goal:** Create the shared non-UI engine that turns a reviewed multi-card selection into a normal binder page. Smart Search and Gift Builder must both use it.

**Scope:**

- Define a transient page-selection draft using existing `CardRef`/`CardSnapshot` identities; do not create a second persisted card entity.
- Support `new page`, `fill current page` and `new binder` targets.
- Enforce layout capacity and deterministic reading order.
- Require a valid finish before persistence. Default edition to `unlimited` and printing to `shadowed` only when historically valid under existing variant policy.
- Preserve explicit DE/EN identity and reject Pocket/digital cards.
- Provide atomic domain actions compatible with revision-checked binder persistence.
- Add unit tests for 0/1/8/9/10 selections, occupied slots, insufficient capacity, duplicate IDs, language, invalid variants and concurrent-revision failure.

**Acceptance:**

- The engine produces ordinary binder pages and planned cards, not a Smart/Gift-specific page type.
- Invalid or incomplete variants cannot be saved.
- No existing page/card is overwritten without an explicit target decision.

**Handoff:** Stop and tell the user to switch to Luna for Step 4.

## Step 4 — Luna: Smart Search to binder-page UI

**Model:** Luna (`gpt-6-luna`), reasoning high

**Goal:** Let users select artwork-search results and deliberately create or fill a binder page.

**Scope:**

- Add result multi-selection with capacity counter, clear selection and selected-card summary.
- Add `Als Binderseite übernehmen` with target selection: new page, current free slots or new binder.
- Add a compact batch-review flow for language, finish, edition, printing and minimum condition.
- Keep finish mandatory; show `Unlimited` and `Mit Schatten / Standard` defaults only when Sol's variant policy permits them.
- Allow removing/replacing cards before final confirmation.
- Never modify a binder merely by selecting search results.
- Add keyboard/touch behavior and mobile presentation without requiring drag-and-drop.

**Acceptance:**

- A user can turn up to nine reviewed Smart Search hits into an editable 3×3 page.
- Cancel/back preserves the original binder and draft appropriately.
- Every persisted card passes existing variant validation.

**Handoff:** Stop and tell the user to switch to Sol for Step 5.

## Step 5 — Sol: Gift domain, pricing and deterministic selection

**Model:** Sol (`gpt-6-sol`), reasoning high

**Goal:** Implement the complete local-first Gift Builder foundation and a cautious TCGdex-backed budget engine.

**Scope:**

- Define `GiftPreferences`, `GiftProject`, `GiftCardCandidate`, `PriceProvider` and `GiftSelectionEngine` using the D-06 V1 contract.
- Require target count, currency and maximum budget; support an optional budget-tolerance choice.
- Persist Gift Projects locally and include them in validated backup/restore with a documented migration strategy.
- Build a paginated subject/candidate loader with abort, concurrency limit, lazy detail hydration and IndexedDB TTL cache.
- Normalize Cardmarket EUR and TCGplayer USD separately. Prefer documented central market metrics and derive a range only from real provider metrics; never invent a percentage range.
- Store source, timestamp and confidence (`usable`, `approximate`, `unknown`). Never replace missing prices with zero.
- Exclude shipping, tax and seller splitting; do not perform hidden currency conversion.
- Implement deterministic 9/18/36-card selection with budget, target count, duplicate avoidance, set/year diversity and verified vintage/modern metadata.
- Cards with unknown/approximate pricing remain visible but cannot make an automatic `under budget` claim.
- Convert an accepted Gift selection through the Step-3 page-selection engine into a normal binder.

**Acceptance:**

- Unit tests cover EUR/USD separation, unknown/approximate prices, 50/100/200 budgets, tolerance, too few candidates, duplicates, over-budget and incomplete variants.
- Reload and backup restore preserve Gift preferences without sending recipient data to a server.
- The pricing feature remains gated until the written pricing Go/No-Go passes.

**Handoff:** Stop and tell the user to switch to Luna for Step 6.

## Step 6 — Luna: Gift Wizard and editable binder preview

**Model:** Luna (`gpt-6-luna`), reasoning high

**Goal:** Implement the complete D-06 V1 user journey from the second landing-page entry to an editable normal binder.

**Scope:**

- Add equal landing choices: `Meine Sammlung planen` and `Geschenk erstellen`.
- Implement the wizard for recipient kind, optional local-only name, occasion, favorite Pokémon/theme, DE/EN language, budget, tolerance, 9/18/36 cards and mixed/vintage/modern/curated style.
- Show candidate loading and `alle passenden Karten ansehen` without confusing name matches with artwork appearances.
- Present individual estimates, source/timestamp, source-derived range, unknown counts, estimated total range and excluded shipping/tax.
- Show deterministic reason tags rather than invented AI explanations.
- Allow replace/remove/add before acceptance.
- Reuse Step 4 variant review and Step 3 page creation.
- Produce a normal editable binder after confirmation; do not introduce a second editor.
- Cover price unknown, candidate pool too small, budget impossible and API offline states.

**Acceptance:**

- The reference flow `Pikachu + 100 EUR + 9 cards` produces an editable proposal without a guaranteed-price claim.
- Recipient name and notes are visibly described as local-only.
- The flow remains usable without drag-and-drop on 375 px and by keyboard.

**Handoff:** Stop and tell the user to switch to Sol for Step 7.

## Step 7 — Sol: Marketplace, binder partners and release controls

**Model:** Sol (`gpt-6-sol`), reasoning high

**Goal:** Connect Gift Binder completion to existing card handoffs and a safe, replaceable physical-binder partner layer.

**Scope:**

- Reuse existing TCGplayer/Cardmarket completion adapters; opening a provider never marks a card purchased or owned.
- Define and implement `BinderAffiliateAdapter` plus a small reviewed repository configuration with verification date and enable/disable state.
- Audit current provider, affiliate, deep-link and personalization terms before enabling any offer. Do not hardcode affiliate URLs in UI components and do not scrape product pages.
- Keep `Karten besorgen` and `Binder personalisieren` as separate purchases with separate price disclosures.
- Define the local Print Summary data contract; do not export Pokémon art/logos as physical cover assets and do not upload personal photos to Cardfolio.
- Complete privacy, rights, affiliate-disclosure, external-navigation, stale-offer and pricing Go/No-Go documentation.
- Add integration tests for disabled/stale offers, URL construction, missing prices and marketplace handoff reuse.

**Acceptance:**

- Affiliate/provider offers can be disabled without a code release or broken Gift flow.
- No price, commission, exact-match or personalization capability is claimed without current evidence.
- No private Gift text or media leaves the local-first repository through Cardfolio.

**Handoff:** Stop and tell the user to switch to Luna for Step 8.

## Step 8 — Luna: Summary, print UX and final product verification

**Model:** Luna (`gpt-6-luna`), reasoning high

**Goal:** Finish the user-facing Gift summary and prove the complete Smart Search/Gift experience at release quality.

**Scope:**

- Build Gift Summary with estimated card value/range, unknown-price count, separate binder cost label and explicit shipping/tax exclusion.
- Add the two distinct CTAs `Karten besorgen` and `Binder personalisieren` with provider and affiliate disclosure.
- Add a client-only printable/downloadable gift summary and optional greeting. Do not reuse card artwork as a physical cover asset.
- Add disabled/stale partner, blocked external link and no-offer states.
- Run responsive and accessibility checks at 375/768/1024/1440 px, including focus, keyboard, screenreader labels, reduced motion and touch targets.
- Add end-to-end tests for: Smart Search to page, Gift creation, unknown pricing, impossible budget, reload, backup restore, card completion, disabled partner and print summary.
- Run typecheck, lint, unit/component tests, static build, release checks and available browser tests.
- Produce the final Go/No-Go report from Sol's technical gates and Luna's product verification. Do not merge or deploy without explicit user authorization.

**Acceptance:**

- No dead end exists in Smart Search, Gift Wizard, completion or partner flows.
- All persisted output is an ordinary binder compatible with existing backup and marketplace functions.
- The final report lists exact commit, flags, test results, price coverage, known limitations and blocked legal/operator inputs.

**Handoff:** Stop and ask the user whether the reviewed changes should be merged and deployed.

## Explicitly excluded from these eight steps

- CLIP, runtime embeddings, vector databases or an external semantic-search service.
- A Cardfolio checkout, automatic purchases or automatic ownership changes.
- Guaranteed card prices, shipping optimization or silent EUR/USD conversion.
- A separate Gift application, server database or account requirement.
- Server-side recipient data, greeting text, personal-photo uploads or private media analytics.
- Pokémon card art or logos exported as physical binder-cover designs without a separate rights clearance.
