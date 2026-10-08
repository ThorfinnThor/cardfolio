# Cardfolio technical release candidate — 2026-10-08

This record assesses application commit `0f92ecadfed801f1939f92adf5b0257ad8ab26c1`. The documentation commit containing this record is a follow-up only. It is not a public-production approval and does not authorize deployment, provider writes, commerce, or use of CardTrader data.

## Decision

**Technical candidate: GO for the local-first core and the existing technical preview. Public production: NO-GO.**

The browser-to-storage-to-static-export paths are green in CI. Public production remains blocked by the human accessibility/usability check, final production-origin verification, operator/privacy details, project-license choice, and explicit rights/provider decisions. All CardTrader catalog, image, price, Wishlist, and commerce feature flags remain off.

## Verified baseline

- Branch: `main`
- Application commit: `0f92ecadfed801f1939f92adf5b0257ad8ab26c1`
- CI: [run 37753882717](https://github.com/ThorfinnThor/cardfolio/actions/runs/37753882717)
- Result: typecheck, lint, 44 test files with 248 unit/component tests, static build, release checks, release evidence, and 21 Chromium E2E tests passed without a flaky retry.
- Local Playwright is not authoritative on this host because macOS blocked Chromium's `MachPortRendezvous` sandbox startup. The clean Ubuntu CI run is the browser-test evidence.

## Release evidence

| Evidence | Result at the application commit |
|---|---|
| Static export | 58 files, 8.82 MiB |
| JavaScript | 14 files, 1.12 MiB raw / 323.7 KiB gzip in CI |
| CSS | 4 files, 125.6 KiB raw / 21.8 KiB gzip |
| Public data | 7.32 MiB |
| Bundled raster card images | 0 |
| Semantic index | 2.16 MiB raw / 407.9 KiB gzip in CI; 19,635 of 19,669 cards indexed; 50 evaluation queries |
| Set catalog | 205 English and 144 German sets |
| TCGplayer mapping | 21,241 mapped cards; 49 unresolved and excluded |
| CardTrader set/locale mapping | 338 verified; 11 explicitly excluded; productive flags off |

Gzip output can vary slightly by platform metadata. The table records the authoritative CI output rather than the local macOS value.

## Go/No-Go by capability

| Capability | Decision | Evidence and boundary |
|---|---|---|
| Binder creation, editing, reload, undo | **GO** | Single insert, atomic multi-insert, continuous free-slot placement, reload, and undo are covered by browser and unit tests. A stale React-state race in selection review was fixed before this baseline. |
| Backup, restore, and revision conflict | **GO** | Export/import, restore, invalid input, and cross-revision conflict paths are tested. Data remains local to the browser origin. |
| Set binder and missing-card planning | **GO** | Guided set creation, verified variants, page calculation, placement, and grouped missing-card output are tested. |
| Smart Search | **GO, English artwork index only** | Reproducible index, 50-query evaluation set, explicit timeout/load-error fallbacks, and browser insertion path are present. Gift themes use the curated motif labels rather than unrestricted semantic inference. |
| Gift binder | **GO without a price guarantee** | The local guided flow works and prioritizes valid image-bearing results. Any displayed estimate is informational and may not match a purchasable variant. |
| TCGplayer handoff | **GO only for verified mappings** | 21,241 card mappings are available. The 49 unresolved records are excluded instead of guessed. No purchase confirmation is claimed. |
| Cardmarket handoff | **GO as a manual-review list** | Output is intentionally a checking aid. Cardfolio does not promise exact automatic Cardmarket matching. |
| CardTrader catalog, images, prices, Wishlist | **NO-GO** | Set-level mapping is not a trusted card/variant mapping. Written use permission, direct or manually verified card identities, variant/property samples, and image-language/rights evidence are still missing. |
| CardTrader commerce | **NO-GO** | Not implemented or authorized; the commerce flag remains permanently separate and off. |
| Price guarantees or budget promises | **NO-GO** | Gift estimates are display-only. No source currently supports an exact, fresh, variant-correct purchase total including shipping and taxes. |
| Card artwork for public/commercial production | **NO-GO pending human rights review** | Card images stay external TCGdex references and zero raster card images are bundled. Technical absence of copied bytes does not establish artwork/trademark rights. |
| Public production launch | **NO-GO** | Human viewport/screenreader/usability evidence, operator/privacy details, project license, final origin, and rights/provider approvals remain open. |

## Failure-boundary evidence

- Revision conflicts and backup restoration are exercised in unit and browser coverage.
- Smart Search has explicit unavailable, timeout, and normal-search fallback paths.
- CardTrader's read-only adapter has rate-limit handling, but productive CardTrader data is deliberately not exposed.
- Marketplace tests reject unresolved or wrong mappings instead of silently exporting them.
- Stale or unavailable price data is labeled rather than converted into a purchase promise.
- A partial CardTrader Wishlist write is **not claimed as tested** because Wishlist access is blocked and disabled.

## Rollback and containment

- Provider capabilities remain separate feature flags; all CardTrader data and write flags are off.
- Smart Search and gift price estimates can be disabled independently through their documented environment flags.
- Revert `0f92ecadfed801f1939f92adf5b0257ad8ab26c1` only if the verified-variant E2E fixture itself must be removed; the product-state race fix is the preceding commit `d93b64e`.
- Before any IndexedDB schema change, preserve and test a real backup from the current schema.
- Do not enable a provider flag, change Cloudflare production state, or write to an external Wishlist until its own gate has written approval and exact-contract tests.

## Required close-out before public production

1. Run and record 375/768/1024/1440 px checks, keyboard and screenreader checks, and the five beginner tasks with at least three people without active TCG knowledge.
2. Decide and document card-image/trademark/provider rights, including whether external TCGdex artwork may be shown commercially.
3. Supply operator identity/contact/country and approve privacy, provider, and imprint texts.
4. Choose the repository license and the final production origin.
5. Complete `docs/release-record-template.md` for the exact intended production commit and verify the real Cloudflare origin.
6. Obtain explicit deployment approval. This record alone is not that approval.
