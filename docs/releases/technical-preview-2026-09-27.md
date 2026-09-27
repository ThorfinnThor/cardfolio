# Cardfolio technical-preview record — 2026-09-27

This record describes a technical preview, not an approved public production release.

| Field | Value |
|---|---|
| Version | `0.1.0-technical-preview.20260927` |
| Verified application commit | `a5ad85f4a997d8f806af27bf25b2b35abe8bd313` |
| Build time | 2026-09-27 14:24 UTC |
| Preview origin | `https://cardfolio-780.pages.dev/` |
| Cloudflare Pages project | `cardfolio` |
| Database schema | IndexedDB `cardfolio`, version 1; binder schema 1; backup format 1 |
| Browser tested | Codex in-app Chromium; exact browser version unavailable |
| Mobile viewport tested | 375×812 CSS pixels |
| GitHub CI | Passed: run `36327453467`, including all five Playwright scenarios |
| Immutable deployment | `https://6cbb4716.cardfolio-780.pages.dev/` |
| Rights/privacy approval | Pending; operator details, project license and data/image/trademark review intentionally remain open |

## Active feature flags

- `designPreview`: false
- `pricing`: false
- `tcgplayerTextExport`: true
- `tcgplayerPrefill`: false
- `cardmarketImport`: true
- `cardtraderCommerce`: false
- `publicSharing`: false

## Target-host results

- [x] `/` and `/help/` return the expected static HTML.
- [x] Direct navigation and reload work on both routes.
- [x] CSP and every required security header from `public/_headers` are present on HTML responses.
- [x] Next.js hydration completes without CSP or console errors.
- [x] TCGdex English and German search/detail data were exercised.
- [x] A valid direct TCGdex image loads and a missing image shows the accessible local fallback.
- [x] Create, save, reload, controlled JSON import and multi-tab conflict handling pass on the preview origin.
- [x] A real Blob-exported JSON backup was retained and validated as format 1 with one controlled test binder and one card snapshot.
- [x] The 375 px layout has no horizontal overflow and keyboard focus remains visible.
- [x] Preview-origin data is treated as separate local data.
- [x] The 37-file deployment inventory contains no card-image bytes, user backups or binder data.

## Known limitations

- Binder data is local to this exact browser origin and can be lost with browser storage; users need independent JSON backups.
- TCGdex data, translations, variants and images can be incomplete or unavailable.
- Pricing remains disabled because language-, edition- and variant-safe matching is not proven.
- TCGplayer output is limited to individually tested printing mappings; Cardmarket remains a manual review handoff.
- There is no account, cloud synchronization or public sharing.
- GitHub CI and the manually dispatched scheduled-data workflow both pass. The latter refreshed English/German TCGdex set metadata in commit `336b95f5c3e4f7425cf39c05e1b7481507871f76`.
- Operator/privacy text, the project license and rights approval are pending; therefore this preview must not be treated as an approved public launch.

## Approval state

| Role | Decision |
|---|---|
| Product/operator | Pending operator details |
| Rights/privacy reviewer | Pending |
| Technical preview verification | Pass; human rights/privacy/operator/license gates remain separate and open |
