<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Your Card Binder project rules

- Read the implementation plan and `docs/decisions.md` before changing architecture.
- P0 is local-first: no Supabase, R2, authentication, server-side user database, or private user data in GitHub.
- Card images stay external references: `assets.tcgdex.net` first and, as a clearly labelled fallback only when TCGdex has no working image, `cardtrader.com` blueprint images (CardTrader permission of 2026-10-20). Do not download, mirror, proxy, commit, or cache image bytes from either host.
- CardTrader data (`public/data/cardtrader/`) is written only by `.github/workflows/cardtrader-sync.yml` from read-only API endpoints. The sync token never reaches the browser, a backup or the repository. `cardtraderSupplements` adds only the reviewed supplement cards (provider `cardtrader`, a few sets); `cardtraderCatalog` (CardTrader as a marketplace choice with plain links and the owner's referral code) is on.
- `cardtraderWishlist` (owner's statement of CardTrader's permission, 2026-10-21; see `docs/decisions.md`) lets a visitor create one private wishlist in their own CardTrader account from the browser (`POST https://api.cardtrader.com/api/v2/wishlists`). The token is the visitor's own, lives only in component state, and is never stored, logged, put into a URL, a backup or the repository. The call happens only after an explicit click that states what is sent. Cart and purchase endpoints are never called and `cardtraderCommerce` stays off without a new written permission.
- The application is a static Next.js export. Do not introduce Server Actions, dynamic route handlers, cookies of our own, or a required runtime server. The only cookies are Google Analytics' (`_ga*`), set only after the visitor's opt-in in the consent banner; nothing of Google's is requested before (the release gate checks that no HTML references it). Advertising features and Google signals stay off.
- Keep domain and repository logic independent of React. A blank slot is not a missing card.
- Card identity includes provider ID, language, variant, edition, and purchase preference where relevant.
- Validate API, imported backup, and scheduled public-data inputs. Do not invent prices, product IDs, set codes, or purchase confirmations.
- GitHub Actions may update validated public catalog metadata only. Binder and user data never enter workflows or the repository.
- Cloudflare Pages performs production builds and deployments through its Git integration. Do not add a competing deployment workflow.
- Design 2 and Design 3 remain separate and undecided until the user chooses one.
- Do not change contracts, persistence, dependencies, or the lockfile from a UI-only task without integration review.
- Run relevant tests and report skipped checks. Do not deploy, purchase, or modify external accounts without an explicit request.
