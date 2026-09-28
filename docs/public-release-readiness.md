# CF-21 public-release readiness

Assessment date: 2026-09-27. Scope: public GitHub repository, local static export and deployed Cloudflare Pages technical preview. This is not an approval for public production launch.

## Decision

**Public production launch is blocked.** The technical release controls and target-host verification pass, but the human/provider decisions below remain open. The Pages address remains a technical preview until every blocked gate is closed.

## Launch gates

| Gate | Status | Evidence | Remaining action |
|---|---|---|---|
| Design choice | Passed | Design 3 is recorded in `docs/decisions.md`, fixed in `src/config/product.ts` and used by the productive UI. | None for P0. |
| Software licenses | Conditional — explicitly deferred | Fresh implementation decision, direct dependency inventory and complete installed-tree license summary are in `THIRD_PARTY_NOTICES.md`; runtime licenses are checked automatically. The public repository deliberately has no project license yet, so its source is visible without granting reuse rights. | Choose a project license before describing the source as open source or allowing reuse. Re-run the inventory whenever dependencies or copied assets change. |
| Data/image use | **Blocked — human review** | API/data/image flows and the separation between database licensing and artwork rights are documented. Images remain external references. | Review TCGdex provider terms and the concrete public/non-commercial/commercial image and trademark use. Obtain advice/permission or replace public card imagery with neutral placeholders. Confirm the product name. |
| Privacy/provider details | **Blocked — explicitly deferred operator input** | `docs/privacy-and-data-flow.md` and `/help/` describe actual storage and network flows without claiming there are no third-party connections. The owner stated that operator details will follow later. | Supply operator identity/contact/country/production domain, review Cloudflare logging/retention, and approve the required privacy/provider/imprint texts. |
| Local data security | Passed for repository scope | Backup roundtrip, invalid import, save error, revision conflict, origin warning and external image-host validation are implemented/tested. | Keep a real old-schema backup fixture before any schema migration. |
| Hosting | Passed for technical preview | `https://cardfolio-780.pages.dev/` is connected to public `main`. The immutable deployment for application commit `33b801f17783c16d6ef19cbd463a7303a7eba041` succeeded, and routes, headers, hydration, live provider flows including complete search numbers, persistence, printing variants, JSON export/import, conflict handling, German-to-English image fallback, assets, 375 px layout and keyboard focus were checked. | Keep the preview labeled non-production and repeat the checklist for the final custom/production origin. |
| GitHub verification | Passed | The existing public CI and public-data workflows verify type safety, lint, unit/component tests, static build, release gates and Chromium scenarios. The scheduled data job is now also required to account for every physical TCGdex set in the official TCGplayer Mass Entry catalog or an explicit unavailable-set list. | Keep CI required for human pushes and inspect the next scheduled marketplace-metadata refresh before release. |
| Purchase presentation | Passed | Prices remain disabled. TCGplayer uses synchronized official set/product identities and visibly excludes unresolved records; Cardmarket is labeled as a manual review handoff. Finish, edition and printing are mandatory before insertion/export. | Repeat checks when mappings or marketplace behavior change. |

## Technical security evidence

- `public/_headers` provides CSP, clickjacking, MIME-sniffing, referrer, browser-feature and opener controls for static Pages responses.
- CSP allows scripts/styles from the app itself, inline Next.js hydration/styles, TCGdex API connections and TCGdex images only. It does not allow remote scripts, frames, objects, media or workers.
- GitHub workflow actions are pinned to full verified commit SHAs. CI is read-only; only the scheduled public-data job has `contents: write`.
- The scheduled job stages only `public/data/catalog`, then a normal Git push triggers the separate Cloudflare Pages Git build.
- Both workflows have timeouts and run typecheck, lint, tests, build and `release:check` before deployment-triggering data is pushed.
- `npm audit` reported zero known vulnerabilities for production and all dependencies on 2026-09-27. GitHub CI repeated the audit in its normal trusted environment and passed.
- No `dangerouslySetInnerHTML`, application cookies, analytics, remote scripts, required secrets or server-side user store were found in the reviewed source.

## CSP and target-host verification

The CSP intentionally retains `'unsafe-inline'` for `script-src` because the current static Next.js export emits inline bootstrap/hydration scripts. `style-src 'unsafe-inline'` is needed for framework/component inline styling, including drag positioning. These allowances do not permit scripts or styles from arbitrary remote hosts.

`_headers` is copied to `out/` and is supported for Cloudflare Pages static responses. It does not protect Pages Functions; this project intentionally has none. Response headers and hydration have been inspected on the real Pages preview origin and pass.

## Exact close-out sequence

1. Human closes the data/image/trademark and operator/privacy gates.
2. Owner chooses the repository license and final production origin.
3. Complete a release record from `docs/release-record-template.md` with the exact production commit and results.
4. Rerun CI and the target-origin checklist for that exact production commit.
5. Only then change this decision from blocked to approved public production.
