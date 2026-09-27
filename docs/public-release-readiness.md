# CF-21 public-release readiness

Assessment date: 2026-09-27. Scope: private GitHub repository, local static export and deployed Cloudflare Pages technical preview. This is not an approval for public production launch.

## Decision

**Public launch is blocked.** The technical release controls are prepared, but human/provider decisions and a real target-host verification are still missing. The application remains an internal/local prototype until every blocked gate below is closed.

## Launch gates

| Gate | Status | Evidence | Remaining action |
|---|---|---|---|
| Design choice | Passed | Design 3 is recorded in `docs/decisions.md`, fixed in `src/config/product.ts` and used by the productive UI. | None for P0. |
| Software licenses | Conditional — explicitly deferred | Fresh implementation decision, direct dependency inventory and complete installed-tree license summary are in `THIRD_PARTY_NOTICES.md`; runtime licenses are checked automatically. The owner directed that the private repository's own license remain open for now. | Choose a project license before describing the source as open source or allowing reuse. Re-run the inventory whenever dependencies or copied assets change. |
| Data/image use | **Blocked — human review** | API/data/image flows and the separation between database licensing and artwork rights are documented. Images remain external references. | Review TCGdex provider terms and the concrete public/non-commercial/commercial image and trademark use. Obtain advice/permission or replace public card imagery with neutral placeholders. Confirm the product name. |
| Privacy/provider details | **Blocked — explicitly deferred operator input** | `docs/privacy-and-data-flow.md` and `/help/` describe actual storage and network flows without claiming there are no third-party connections. The owner stated that operator details will follow later. | Supply operator identity/contact/country/production domain, review Cloudflare logging/retention, and approve the required privacy/provider/imprint texts. |
| Local data security | Passed for repository scope | Backup roundtrip, invalid import, save error, revision conflict, origin warning and external image-host validation are implemented/tested. | Keep a real old-schema backup fixture before any schema migration. |
| Hosting | Passed for technical preview | `https://cardfolio-780.pages.dev/` is connected to private `main`. The immutable deployment for application commit `a5ad85f4a997d8f806af27bf25b2b35abe8bd313` succeeded, and routes, headers, hydration, live provider flows, persistence, import, conflict handling, image fallback, assets, 375 px layout and keyboard focus were checked. | Keep the preview labeled non-production. Repeat the checklist for the final custom/production origin and manually retain one downloaded JSON backup artifact before public launch. |
| GitHub verification | **Blocked — account billing** | CI exposed and helped correct E2E timing/selector defects. The post-fix run `36324400200` was refused before runner allocation because GitHub reports failed account payments or an insufficient spending limit. Local typecheck, lint, 44 unit/component tests, build and release checks pass. | Resolve the GitHub account billing/spending-limit state and rerun CI before treating the exact remote commit as verified. |
| Purchase presentation | Passed | Prices and automatic prefill remain disabled. TCGplayer includes only tested printing mappings; Cardmarket is labeled as a manual review handoff. | Repeat checks when mappings or marketplace behavior change. |

## Technical security evidence

- `public/_headers` provides CSP, clickjacking, MIME-sniffing, referrer, browser-feature and opener controls for static Pages responses.
- CSP allows scripts/styles from the app itself, inline Next.js hydration/styles, TCGdex API connections and TCGdex images only. It does not allow remote scripts, frames, objects, media or workers.
- GitHub workflow actions are pinned to full verified commit SHAs. CI is read-only; only the scheduled public-data job has `contents: write`.
- The scheduled job stages only `public/data/catalog`, then a normal Git push triggers the separate Cloudflare Pages Git build.
- Both workflows have timeouts and run typecheck, lint, tests, build and `release:check` before deployment-triggering data is pushed.
- `npm audit` reported zero known vulnerabilities for production and all dependencies on 2026-09-27. The local Node trust store could not validate the environment's npm proxy certificate, so the read-only audit request was repeated with npm TLS verification disabled; package installation and lockfile content were not changed by that workaround. CI must repeat the audit in its normal trusted environment before release.
- No `dangerouslySetInnerHTML`, application cookies, analytics, remote scripts, required secrets or server-side user store were found in the reviewed source.

## CSP and target-host verification

The CSP intentionally retains `'unsafe-inline'` for `script-src` because the current static Next.js export emits inline bootstrap/hydration scripts. `style-src 'unsafe-inline'` is needed for framework/component inline styling, including drag positioning. These allowances do not permit scripts or styles from arbitrary remote hosts.

`_headers` is copied to `out/` and is supported for Cloudflare Pages static responses. It does not protect Pages Functions; this project intentionally has none. The headers are not considered fully verified until response headers and hydration are inspected on the real Pages origin.

## Exact close-out sequence

1. Resolve the GitHub billing/spending-limit blocker and rerun CI for the exact `main` commit.
2. Retain a downloaded JSON backup from the technical preview and rerun the remaining automated suite after GitHub CI is available.
3. Human closes the data/image/trademark and operator/privacy gates.
4. Owner chooses the repository license and final production origin.
5. Complete a release record from `docs/release-record-template.md` with the exact production commit and results.
6. Only then change this decision from blocked to approved public production.
