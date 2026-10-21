# Your Card Binder pre-release audit — 2026-10-12

This record assesses the current uncommitted worktree based on `57b572d`. It is not a release approval and must not be reused as evidence for a later commit without rerunning the checks.

## Decision

- **Local commit candidate: GO.** The implementation is internally consistent and the local technical gates pass.
- **Push to `main`: WAIT FOR OWNER REQUEST.** A push starts GitHub CI and the connected Cloudflare Pages deployment, so it is an external release action.
- **Public production/commercial launch: NO-GO.** Human beginner testing, rights/privacy/operator approval and verification of the exact deployed commit are still open.

## Verified locally

- 48 Vitest files with 277 tests pass.
- TypeScript, ESLint, static Next.js export, release checks and `git diff --check` pass.
- The local static build shows the Gift summary with card artwork, price estimates, the two ordered purchase actions and the reviewed standard-binder offer.
- The card-purchase transition opens all nine missing positions and the TCGplayer/Cardmarket provider choices.
- The production binder catalog test allows only the exact reviewed Vault X product URL, without query parameters, affiliate tracking or Gift/user data, and blocks it after the review deadline.
- The locally available 705 px browser view has no horizontal document overflow.

## CI verification after a push

`.github/workflows/ci.yml` runs the full chain on Ubuntu:

1. dependency install and production dependency audit;
2. reproducible semantic-index check;
3. typecheck, lint and unit/component tests;
4. static production build and release gates;
5. release evidence generation;
6. Playwright Chromium installation and every E2E scenario.

The updated Gift E2E scenario covers both post-summary routes: the complete missing-card marketplace view and the exact parameter-free binder product URL. The local macOS host cannot launch Playwright Chromium because of an operating-system Mach-port restriction, so the first CI run for the eventual commit is mandatory evidence.

## Open gates

- Complete the five beginner tasks with at least three people without active Pokémon-TCG knowledge.
- Manually verify 375, 768, 1024 and 1440 px, keyboard focus and a screenreader on the intended production UI.
- Record operator identity, final domain and approved privacy/imprint/provider text.
- Close the artwork, trademark, TCGdex and marketplace-provider rights review before commercial operation.
- Recheck the Vault X offer after 2026-10-26 or let the automatic stale gate keep it unavailable.
- Complete a release record for the exact committed SHA and its successful GitHub CI and Cloudflare deployment.

## Safe next action

When the owner explicitly requests it, create one local commit containing this reviewed worktree. Push only as a separate explicit action, then inspect the GitHub CI result and the resulting Cloudflare preview before making any production claim.
