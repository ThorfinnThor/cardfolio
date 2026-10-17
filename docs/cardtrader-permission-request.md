# Request to CardTrader for market data (price) access – draft, not sent

**Status:** draft. Nothing has been sent and no CardTrader price endpoint has been called by Cardfolio.
Before sending, check this sentence: the catalogue discovery workflow already calls the CardTrader API
with our token (read-only, catalogue only, see `docs/cardtrader-release-gate.md`). Say so honestly if asked.

**Subject:** Request for market data (price) API access – Cardfolio

Hello CardTrader team,

I run Cardfolio (https://cardfolio-780.pages.dev), a free, local-first web app that helps people plan a
Pokémon card binder and then buy the cards at a marketplace. We would like to show an estimated price for
each card and a total, using CardTrader price data.

We understand that your terms require an individual request for market data (prices and availability). We
therefore ask for written permission to:

1. read price data for Pokémon singles via your API, and
2. show it to users as a clearly labelled estimate, with "Data from CardTrader" and a link to the card on CardTrader.

How we would use it: prices are shown only as estimates. The app does not sell anything and does not call
cart or purchase endpoints. The API token stays on the server side and is never sent to the browser. We would
query prices in small batches or with a scheduled job, not once per page view, and we will follow any rate
limit, caching rule or attribution you require.

Could you tell us whether this is possible, which conditions apply, and whether a commercial agreement is
needed? We have not called any price endpoint so far.

Thank you and best regards,
[name, contact, company]

## If the answer is yes

The adapter and the disabled feature flag `cardtraderPrices` already exist. Open points are in
`docs/decisions.md` (2026-10-04): a reviewed mapping from TCGdex cards to CardTrader blueprints, and where the
token lives (server side or a scheduled job writing static data, because the site is a static export).
