# Cardmarket product identity contract

## Purpose

Your Card Binder must distinguish a catalog candidate from an order-ready Cardmarket
product. Text matching, a matching set name or a working search URL do not prove
that the intended printing, language and variant were selected.

The provider-neutral contract lives in
`src/domain/marketplace-product-identity.ts`. It can later be used for
Cardmarket, CardTrader and TCGplayer without changing the stored binder model.

## Status meanings

- `verified`: exactly one reviewed provider product is known for the selected
  card and scope. Only this state may unlock an order-ready direct product or
  Wishlist/Wants action.
- `probable`: a plausible candidate exists, but it must not be presented as an
  exact product or used for an automatic marketplace write.
- `missing`: no valid mapping exists, or a manual review explicitly confirmed
  that no product mapping is currently available.

Mappings include the stable TCGdex card ID, provider, card name, language and
variant scope, provider product/metaproduct IDs or product URL, source kind,
evidence URL, `checkedAt` and (only for verified rows) `verifiedAt`.

## Verification rules

1. A unique direct provider ID or a manual comparison with the provider product
   page may become `verified`.
2. Set/number/name similarity and legacy export overrides stay `probable`.
3. A verified row needs an exact provider ID or provider-hosted product URL and
   a verification timestamp.
4. Invalid rows are ignored by the resolver instead of weakening the result.
5. Multiple equally specific verified rows are treated as `probable` because
   the intended product is ambiguous.
6. `any` scope values must be intentional. A more specific valid row wins over
   a generic one.

## Migration from the current handoff

The existing Cardmarket decklist remains a manual-review fallback. The
`pl1:99 -> Lv.12` compatibility override fixes Cardmarket's text parser, but it
is not itself a verified product mapping.

The next implementation step should add a versioned mapping payload and loader:

1. migrate manually reviewed exceptions such as Platinum Torchic into that
   payload with source evidence;
2. resolve every missing-card position through the new contract;
3. show direct product actions only for `verified` results;
4. keep `probable` and `missing` entries in the visible review queue;
5. retain the decklist and search URL as advanced fallbacks until official API
   permission and an authenticated Wants workflow exist.

The first reviewed payload is
`public/data/marketplace/cardmarket-product-mappings.v1.json`. Its audit is
deliberately scoped to the reviewed cards only; it is not a claim that the full
TCGdex catalog has been mapped. The loader rejects tampered or inconsistent
counts before the data can be used.

No mapping status changes automatically because a URL responds, a price exists
or a text parser accepts a line.
