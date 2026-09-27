# Cardfolio

Local-first Pokémon wish-binder prototype. Binder data and referenced card metadata are stored in the current browser with IndexedDB. The application has no account system and no server-side user database.

Marketplace price indications are disabled because the current provider data does not yet prove language-, edition- and variant-safe matching. See `docs/pricing-gate.md`.

The public-release gate is currently closed pending human data/image-rights review, operator/privacy details, a GitHub remote and verification on the real Cloudflare Pages origin. See `docs/public-release-readiness.md`.

## Local development

Requirements: Node.js 24 and npm 11 or a compatible npm release.

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

Cloudflare Pages is connected to the GitHub repository and owns builds and deployments:

- Production branch: `main`
- Build command: `npm run build`
- Output directory: `out`
- Node version: `24`

See `docs/cloudflare-pages.md` before connecting the remote project. A public deployment is intentionally not created by this repository setup.

## Release and third-party records

- `THIRD_PARTY_NOTICES.md`: dependency, scaffold and external-data review record.
- `docs/privacy-and-data-flow.md`: actual local/browser/network data flows and operator follow-ups.
- `docs/release-record-template.md`: evidence required for an exact public build.
