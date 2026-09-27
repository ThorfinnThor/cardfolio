# Cloudflare Pages setup

Cardfolio uses a static Next.js export and Cloudflare Pages Git integration. Do not create a Direct Upload project for this repository.

## Current integration state — 2026-09-27

- Public source repository: `https://github.com/ThorfinnThor/cardfolio`
- Production branch: `main`
- Project: `cardfolio`
- Technical-preview origin: `https://cardfolio-780.pages.dev/`
- Automatic deployments from the public repository are enabled.
- Build settings use **Next.js (Static HTML Export)**, `npm run build`, output directory `out` and `NODE_VERSION=24.19.0`.
- Verified application deployment: `https://5ba85d1a.cardfolio-780.pages.dev/`, commit `30561f1bef5575cbce6ee214f8b6ab1eab99243e`, Cloudflare status `success`.
- The target-origin checks are recorded in `docs/releases/technical-preview-2026-09-27.md`.
- GitHub CI run `36336618305` passed the complete remote suite for commit `30561f1bef5575cbce6ee214f8b6ab1eab99243e`, including all seven Playwright scenarios and the exact full-number search regression.
- Manually dispatched public-data run `36327563806` passed and committed refreshed English/German TCGdex set metadata as `336b95f5c3e4f7425cf39c05e1b7481507871f76`.

## Connect after the GitHub repository exists

1. Push the local `main` branch to the intended GitHub repository.
2. In Cloudflare, create a Pages application and select **Import an existing Git repository**.
3. Select the Cardfolio repository and use the **Next.js (Static HTML Export)** preset.
4. Configure production branch `main`, build command `npm run build`, and output directory `out`.
5. Set the build environment Node version to `24.19.0` if Cloudflare does not derive it from `.nvmrc`.
6. Keep preview deployments enabled for pull requests.
7. Verify that `public/_headers` is present in the deployed output.

Cloudflare automatically builds and deploys connected commits. The GitHub workflows intentionally contain no Wrangler or Cloudflare deployment step.

## Scheduled data behavior

The weekly `sync-public-data.yml` workflow validates English and German TCGdex set metadata, runs tests and a production build, and commits changed artifacts to `main`. That commit triggers the normal Cloudflare build. If branch protection blocks bot pushes, replace the final commit step with an approved pull-request workflow; do not bypass repository protection.

## Required production-origin check

Do not treat a successful local build as hosting approval. Record the exact results in `docs/release-record-template.md` after the Git integration exists.

1. Open `/` and `/help/` directly and reload both paths.
2. Confirm the HTML response includes the CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` and `Cross-Origin-Opener-Policy` values from `public/_headers`.
3. Confirm the browser reports no CSP, hydration, mixed-content or application console errors.
4. Exercise English and German TCGdex search/detail requests and a direct external card image.
5. Create and reload a binder on the production origin, then export/import a JSON backup.
6. Verify the 375 px layout and keyboard focus path.
7. Inspect the deployed file list: no card-image bytes, user backups or binder data may be present.

Cloudflare Pages applies `_headers` to static assets but not to Pages Functions. Cardfolio intentionally has no Functions or `_worker.js`. Keep it that way unless the architecture and privacy review are reopened.

## Origin changes

IndexedDB is origin-bound. A `pages.dev` address, each branch preview address and a custom domain do not share binder data. Before replacing a production origin, publish a visible migration window: users export on the old origin and import on the new one. Never describe a preview deployment as durable storage for a real collection.

For a custom domain, decide and verify HSTS at the Cloudflare zone level only after HTTPS and subdomain behavior are known. It is intentionally not asserted by the repository-level `_headers` file before that decision.
