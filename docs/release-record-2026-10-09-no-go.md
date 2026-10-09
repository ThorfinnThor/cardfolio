# Cardfolio release record — technical candidate / NO-GO

This record assesses commit `28c2a6e354fd74b9d6fd94adb98df30b2f739d7b`. The commit containing this record is documentation-only and is not a production-release commit.

## Decision

**Public production: NO-GO.** The tested local-first application is a technical candidate, but required human, rights, operator and final-origin evidence is not complete. No deployment, provider write, purchase, Wishlist creation or CardTrader data activation is authorized by this record.

| Field | Value |
|---|---|
| Version | Technical candidate; no public version assigned |
| Assessed Git commit | `28c2a6e354fd74b9d6fd94adb98df30b2f739d7b` |
| Build date/time (UTC) | 2026-10-09, GitHub Actions run below |
| Production origin | Not selected or approved |
| Technical preview origin | `https://cardfolio-780.pages.dev/`; not reverified for this exact commit |
| Cloudflare Pages project | Not recorded in repository evidence |
| Database schema | IndexedDB `cardfolio`, version 2; binder schema 1; backup format 2 (imports format 1) |
| Browsers and versions tested | Playwright 1.63 bundled Chromium on GitHub Ubuntu runner; exact Chromium build not recorded |
| Automated target viewports | 375×812, 768×1024, 1024×768, 1440×900 |
| CI run URL | [37907027835](https://github.com/ThorfinnThor/cardfolio/actions/runs/37907027835) |
| Cloudflare deployment URL for exact commit | Not verified |
| Rights/privacy approval reference | Not supplied |

## Automated result

- Typecheck and lint passed.
- 44 test files with 248 unit/component tests passed.
- Static export, release gates and reproducible release evidence passed.
- 22 Chromium E2E tests passed without a flaky retry.
- The target-viewport test found no horizontal page overflow and confirmed a visible first keyboard target with focus indication.
- Static export contains zero raster card-image files.
- CardTrader catalog, image, price, Wishlist and commerce flags remain `false`; `CARDTRADER_API_TOKEN` is referenced only as a GitHub Actions secret in the authenticated discovery workflow.

## Active feature flags

- `designPreview`: false
- `pricing`: false
- `giftBuilderPricing`: false
- `giftPriceEstimates`: true by default; display-only, no budget guarantee
- `giftBudgetGuarantee`: false
- `artworkReview`: false in production unless explicitly enabled
- `smartSearch`: true by default; English artwork index
- `tcgplayerTextExport`: true
- `tcgplayerPrefill`: false
- `cardmarketImport`: true; manual-review handoff
- `cardtraderCatalog`: false
- `cardtraderImages`: false
- `cardtraderPrices`: false
- `cardtraderWishlist`: false
- `cardtraderCommerce`: false
- `publicSharing`: false

## Open release gates

- [ ] Complete the five beginner tasks with at least three people without active TCG knowledge and record observations.
- [ ] Complete keyboard and screenreader review on the intended production UI.
- [ ] Verify 375/768/1024/1440 layouts manually, including fixed actions and error states.
- [ ] Decide and document artwork, trademark, TCGdex and marketplace-provider rights for public/commercial operation.
- [ ] Supply operator identity, contact, country, final domain and approved privacy/imprint/provider texts.
- [ ] Choose the repository license.
- [ ] Select and verify the final production origin, headers, hydration and external image/API requests.
- [ ] Complete the production release record for the exact intended release commit.
- [ ] Obtain explicit product/operator, rights/privacy and technical release approvals.

## Known limitations

- Binder data remains local to the browser origin; there is no account or cloud sync. Users must export backups themselves.
- Changing origin can make existing local data appear missing until a backup is imported.
- TCGdex and marketplace metadata can be incomplete or wrong. Unresolved mappings are excluded instead of guessed.
- Gift price estimates are informational and do not include a guaranteed purchasable variant, shipping or taxes.
- TCGplayer output is restricted to verified mappings. Cardmarket output is a manual checking aid.
- CardTrader set/locale mapping is not a trusted card/variant mapping. Productive CardTrader data and writes remain disabled.
- Card imagery remains external TCGdex references; technical non-bundling does not establish artwork or trademark rights.

## Rollback

- Keep each provider capability behind its own flag; do not enable CardTrader data types together.
- Smart Search and gift estimates can be disabled independently through their documented environment switches.
- Preserve a real backup before every IndexedDB schema migration.
- If a production regression is discovered, restore the last verified application commit through the normal Git/Cloudflare Pages rollback process; do not modify user IndexedDB data remotely.

## Approval

| Role | Name | Date | Decision |
|---|---|---|---|
| Product/operator | Not supplied | 2026-10-09 | **NO-GO / open** |
| Rights/privacy reviewer | Not supplied | 2026-10-09 | **NO-GO / open** |
| Technical release reviewer | Automated evidence only | 2026-10-09 | Technical candidate; public production **NO-GO** |
