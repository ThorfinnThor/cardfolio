# Gift Builder pricing Go/No-Go

Date: 2026-10-02

Status: **GO for clearly labelled, display-only TCGdex market estimates; NO-GO for budget guarantees or price-led purchase claims.** `FEATURES.giftPriceEstimates` is enabled, while `FEATURES.giftBudgetGuarantee` and the legacy `FEATURES.giftBuilderPricing` remain `false`.

## Implemented safety rules

- Cardmarket EUR and TCGplayer USD are normalized independently; there is no currency conversion.
- EUR prefers documented `trend`, then `avg30`, then `avg`. USD prefers the matching variant's `marketPrice`, then `midPrice`.
- A displayed range exists only when two or more real provider metrics are present. No percentage range is invented.
- Zero, missing, non-finite and fractional-cent values become `unknown`, never zero-price cards.
- Every quote retains provider, fetch time, provider update time, metric and confidence.
- Approximate or unknown quotes may be shown, but cannot support an automatic “under budget” claim.
- Shipping, tax, seller splitting and checkout price are excluded.
- Candidate discovery loads briefs page by page, caps an automatic pool at 80, hydrates only the supplied visible/shortlisted cards, uses four detail requests by default (hard maximum eight) and caches details for 24 hours by default.
- `vintage` means a verified set release year before 2010; `modern` starts at 2010. Cards without verified release metadata are not silently assigned to either style.

## What remains closed

The application may display available provider metrics as estimates, including their real source-derived range, source, date and confidence. These estimates do not reorder a Gift proposal as a guaranteed budget solution and cannot produce an “under budget” claim. Missing values remain unknown.

A measured Pikachu plus two-other-Pokémon benchmark covering price availability, cache hit rate, request count and time to first results is still required before any budget guarantee or price-led preset. The current TCGdex printing/price mapping caveat also needs a fresh review immediately before commercial activation.

The 2026-10-01 Step-7 provider review confirms that TCGplayer directs applications using pricing data to its partner APIs and requires direct contact for commission terms. Cardfolio has no recorded partner/API approval. TCGdex's MIT repository license is not treated as a grant to commercially reuse third-party marketplace data or Pokémon artwork. These are additional reasons to keep affiliate use, guaranteed prices and commercial price-led claims disabled; see `gift-commerce-release-gates.md`.

## Go criteria

Enable `giftBudgetGuarantee` only after all of these are recorded against an exact commit:

1. A reproducible nine-card Pikachu EUR proposal is fully `usable` and within its declared budget.
2. Unknown and approximate prices are obvious in the UI and never produce a guaranteed-price statement.
3. Network/load benchmarks confirm a bounded 40–80-card pool, limited concurrency and effective TTL caching.
4. Provider terms and source timestamps are current.
5. Responsive, keyboard and screenreader verification passes.

Until then, estimates remain informational only and public price-led Gift presets stay unavailable.
