# Privacy and data-flow record

This document records the P0 implementation facts. It is not a legal opinion and does not replace the operator's privacy notice or provider review.

## Data-flow inventory

| Flow | Data | Destination | Persistence |
|---|---|---|---|
| Static site request | IP address and normal HTTP metadata | Configured Cloudflare Pages project | Depends on the operator's Cloudflare configuration and applicable logs |
| Card search and detail | Search term, selected language and requested TCGdex card/set IDs | `api.tcgdex.net` directly from the browser | Card snapshots used by a binder are retained in local IndexedDB |
| Card image | Image path and normal HTTP metadata | `assets.tcgdex.net` directly from the browser | Image bytes are not written to IndexedDB, GitHub, the static export or a Cardfolio-controlled cache |
| Local binder | Binder name, page/slot structure, ownership and preferences | Browser IndexedDB for the current origin | Until the user/browser clears it or storage is evicted |
| JSON backup | Selected local binders and referenced card snapshots | User-selected local download/file | Controlled by the user; no automatic upload |
| Marketplace handoff | Only the link navigation initiated by the user | TCGplayer or Cardmarket | Governed by the destination; Cardfolio sends no authenticated request |
| Scheduled catalog sync | Public English/German TCGdex set metadata | GitHub repository | Validated files under `public/data/catalog` only |

There is no Cardfolio account, authentication cookie, server-side user database, Supabase project, R2 bucket, analytics script, advertising script or required application secret in P0. GitHub Actions cannot access browser IndexedDB or backup files.

## Origin and backup warning

IndexedDB is scoped to the browser origin. A `pages.dev` production address, every preview address and a later custom domain are separate storage locations. Before changing the production origin, users must export on the old origin and import on the new origin. Preview deployments must not be presented as permanent storage for real collections.

A copy in the same browser profile is not an independent backup. Losing the device/profile, clearing site data or storage eviction can remove local binders.

## Input and output controls

- API responses, image URLs and JSON backups are schema validated.
- Imported files are limited to 5 MiB, 50 binders, 40 pages per binder, 20,000 card entries and 20,000 card snapshots.
- External images require HTTPS and the exact `assets.tcgdex.net` hostname.
- User and provider strings are rendered as React text; the source tree contains no `dangerouslySetInnerHTML` use.
- CSV cells are neutralized against spreadsheet-formula execution.
- CSP limits connections and images to the two required TCGdex hosts. There are no remote scripts.
- Application logs contain public scheduled-set counts only; binder content is not logged intentionally.

## Operator actions required before a public launch

1. Record the legal operator name, contact path, country and production domain.
2. Review which Cloudflare request/security logs are enabled, their purpose, access and retention.
3. Produce and review the privacy notice and any required provider/imprint text for that concrete operating model.
4. Verify whether a consent mechanism is required. The current build has no analytics or advertising and does not add one implicitly.
5. Repeat this inventory before adding telemetry, error reporting, accounts, sharing, server storage or new third-party embeds.
