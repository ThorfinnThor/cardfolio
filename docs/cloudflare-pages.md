# Cloudflare Pages setup

Cardfolio uses a static Next.js export and Cloudflare Pages Git integration. Do not create a Direct Upload project for this repository.

## Current integration state — 2026-09-27

- Private source repository: `https://github.com/ThorfinnThor/cardfolio`
- Production branch: `main`
- The existing Cloudflare GitHub connection can see and select the private repository.
- The Pages setup form is prepared with **Next.js (Static HTML Export)**, build command `npm run build`, output directory `out` and `NODE_VERSION=24`.
- **Save and Deploy has not been submitted.** There is no verified `pages.dev` result yet.
- GitHub Actions cannot currently allocate a runner because the GitHub account reports a billing/spending-limit problem. Resolve that account setting and rerun CI independently of Cloudflare deployment.

## Connect after the GitHub repository exists

1. Push the local `main` branch to the intended GitHub repository.
2. In Cloudflare, create a Pages application and select **Import an existing Git repository**.
3. Select the Cardfolio repository and use the **Next.js (Static HTML Export)** preset.
4. Configure production branch `main`, build command `npm run build`, and output directory `out`.
5. Set the build environment Node version to `24` if Cloudflare does not derive it from `.nvmrc`.
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
