# Cardfolio

Local-first Pokémon wish-binder prototype. Binder data and referenced card metadata are stored in the current browser with IndexedDB. The application has no account system and no server-side user database.

Marketplace price indications are disabled because the current provider data does not yet prove language-, edition- and variant-safe matching. See `docs/pricing-gate.md`.

The public-release gate is currently closed pending human data/image-rights review, operator/privacy details and the project-license decision. The source repository is public, but no project license has been granted; public visibility must not be interpreted as open-source permission. GitHub CI and the Cloudflare technical-preview origin have been verified. See `docs/public-release-readiness.md`.

## Local development

Requirements: Node.js 24.15 or newer within the Node 24 line and npm 11 or a compatible npm release. `.nvmrc` pins the verified Node 24.19.0 toolchain.

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run release:check
```

The production build is a static export in `out/`. Browser E2E requires Playwright Chromium:

```bash
npx playwright install chromium
npm run test:e2e
```

## Public data updates

`npm run data:sync` fetches and validates only public English and German TCGdex set metadata. It never reads browser data or downloads card images. The scheduled GitHub workflow commits a change only when the validated data differs.

## Deployment

Cloudflare Pages owns builds and deployments for the connected public GitHub repository:

- Production branch: `main`
- Build command: `npm run build`
- Output directory: `out`
- Node version: `24.19.0`

Technical preview: `https://cardfolio-780.pages.dev/`

See `docs/cloudflare-pages.md` for the exact integration and target-origin verification state. This preview is not an approved public production launch.

## Release and third-party records

- `THIRD_PARTY_NOTICES.md`: dependency, scaffold and external-data review record.
- `docs/privacy-and-data-flow.md`: actual local/browser/network data flows and operator follow-ups.
- `docs/release-record-template.md`: evidence required for an exact public build.
