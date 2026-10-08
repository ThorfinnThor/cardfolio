# Cardfolio release record

Complete this file for the exact commit before each public release. Do not replace unknown values with assumptions.

| Field | Value |
|---|---|
| Version | `TBD` |
| Git commit (full SHA) | `TBD` |
| Build date/time (UTC) | `TBD` |
| Production origin | `TBD` |
| Cloudflare Pages project | `TBD` |
| Database schema | IndexedDB `cardfolio`, version 2; binder schema 1; backup format 2 (imports format 1) |
| Browsers and versions tested | `TBD` |
| Mobile viewport/device tested | `TBD` |
| CI run URL | `TBD` |
| Cloudflare deployment URL | `TBD` |
| Rights/privacy approval reference | `TBD` |

## Active feature flags

- `designPreview`: false
- `pricing`: false
- `giftBuilderPricing`: false
- `giftPriceEstimates`: true by default; can be disabled with `NEXT_PUBLIC_FEATURE_GIFT_PRICE_ESTIMATES=false`
- `giftBudgetGuarantee`: false
- `artworkReview`: false in production unless explicitly enabled
- `smartSearch`: true by default; can be disabled with `NEXT_PUBLIC_FEATURE_SMART_SEARCH=false`
- `tcgplayerTextExport`: true
- `tcgplayerPrefill`: false
- `cardmarketImport`: true
- `cardtraderCatalog`: false
- `cardtraderImages`: false
- `cardtraderPrices`: false
- `cardtraderWishlist`: false
- `cardtraderCommerce`: false
- `publicSharing`: false

## Required target-host results

- [ ] `/` and `/help/` return the expected static HTML.
- [ ] Direct navigation and reload work on both routes.
- [ ] CSP and every security header from `public/_headers` are present on HTML responses.
- [ ] Next.js hydration completes without CSP or console errors.
- [ ] TCGdex English and German search/detail calls succeed.
- [ ] Direct TCGdex card images load; a missing image shows the local fallback.
- [ ] Create, save, reload, conflict handling and JSON export/import pass on the production origin.
- [ ] 375 px layout has no horizontal overflow and keyboard focus remains visible.
- [ ] Preview-origin data is treated as separate from production-origin data.
- [ ] No card image bytes, user backups or private binder data appear in the deployed asset inventory.
- [ ] `npm run release:evidence` records bundle/data sizes and reports zero bundled raster images.

## Known limitations

Record current limitations and user-facing mitigations here. At minimum review local-only data loss risk, origin binding, provider data gaps, disabled pricing, TCGplayer whitelist scope, manual Cardmarket matching and absence of public sharing/cloud sync.

## Approval

| Role | Name | Date | Decision |
|---|---|---|---|
| Product/operator | `TBD` | `TBD` | `TBD` |
| Rights/privacy reviewer | `TBD` | `TBD` | `TBD` |
| Technical release reviewer | `TBD` | `TBD` | `TBD` |
