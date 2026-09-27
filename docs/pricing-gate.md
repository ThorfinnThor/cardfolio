# Pricing gate

Status on 2026-09-27: **closed**. `FEATURES.pricing` remains `false`.

## What was verified

Official TCGdex documentation describes embedded Cardmarket EUR and TCGplayer USD pricing, provider update timestamps and variant-specific fields. Current live responses were inspected for:

- `en/swsh3-136` — Furret, normal and reverse
- `en/base1-44` — Bulbasaur, normal and first-edition-capable
- `en/sv02-203` — Magikarp illustration rare, holo
- `de/base1-44` — Bisasam

The live shape uses ISO strings for `updated` and currency strings for `unit`. TCGplayer used `normal`, `holofoil` and `reverse-holofoil`. This differs from parts of the reference tables and older examples, so the implementation accepts only the observed string/ISO form.

## Why the product gate stays closed

- English Bulbasaur exposed `normal` pricing although the card metadata also allows First Edition. The response did not provide a separate `1st-edition` price, so the user's edition cannot be priced safely.
- German Bisasam returned the same Cardmarket and TCGplayer product IDs and values as English Bulbasaur. The raw response therefore does not prove language-specific coverage.
- Cardmarket returned holo trend fields for Bulbasaur although `variants.holo` was false.
- The holo Magikarp response returned a non-zero general trend but `trend-holo: 0`; substituting the general field would silently price the wrong variant.
- Provider prices do not encode the user's selected condition and exclude shipping and fees.

These findings prevent the required printing, language, variant and edition gate from passing. No price, `0 €`, total or value KPI is shown in the product.

## Implemented preparation

`src/data/pricing/tcgdex-pricing.ts` normalizes only:

- Cardmarket `trend` for explicit normal or `trend-holo` for explicit holo, always as a candidate.
- TCGplayer `marketPrice` for an explicit documented variant key; non-English cards are rejected.
- ISO source timestamps and exact `EUR`/`USD` currency codes.
- Positive, finite, cent-exact values converted to integer minor units.

It never substitutes generic prices for First Edition, derives Reverse from holo data, replaces a source timestamp with the fetch time, converts currencies or turns missing data into zero.

## Reopening the gate

Before enabling `FEATURES.pricing`, Cardfolio needs a verified mapping for the intended card language, printing, finish and edition. A UI pass must then show source, metric, currency, source timestamp, coverage and candidate status, while keeping EUR and USD totals separate.

Sources:

- <https://tcgdex.dev/reference/card>
- <https://tcgdex.dev/markets-prices>
- <https://tcgdex.dev/faq>
