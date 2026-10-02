# Gift commerce, partner and rights release gates

Date: 2026-10-01

Status: **GO with manual review for card-marketplace handoffs; NO-GO for affiliate links and personalized-binder offers.**

This is an engineering release gate, not legal advice. It records the evidence Cardfolio currently relies on and the checks that must be repeated before any commercial activation.

## Current decisions

| Area | Status | Decision |
| --- | --- | --- |
| TCGplayer Mass Entry | Conditional GO | User-initiated text/prefill handoff only. Cardfolio does not promise inventory, price, seller, cart success or ownership. |
| Cardmarket Wants | Conditional GO | User-initiated review handoff only. Set, language, finish, edition, printing and condition remain manual checks. |
| TCGplayer affiliate links | NO-GO | No approved Cardfolio partner account/code is configured. Partner status and unavoidable disclosure are required first. |
| Cardmarket affiliate/deep integration | NO-GO | No current official affiliate agreement or approved Cardfolio API access is on file. Only documented public Wants/search pages are linked. |
| Personalized binder partner | NO-GO | No provider has passed product compatibility, personalization, price, privacy, affiliate and stale-link review. The repository catalog is centrally disabled. |
| Gift card-price estimates | Conditional GO | TCGdex provider metrics may be shown as dated, unverbindliche estimates with unknown/approximate counts. No budget, stock, seller or checkout claim is made. |
| Gift budget guarantee / price-led presets | NO-GO | `FEATURES.giftBudgetGuarantee` and legacy `FEATURES.giftBuilderPricing` remain false; see `gift-pricing-go-no-go.md`. |
| Printable Gift Summary | Contract ready | Text-only local document. It may contain the user's local greeting and card identity, but no Pokémon art/logo or personal-photo upload. |

## Official evidence reviewed

- [TCGplayer Mass Entry](https://help.tcgplayer.com/hc/en-us/articles/360055768913-Getting-Started-With-Mass-Entry) documents quantity, card name, set code and card number. The existing verified exporter remains the only TCGplayer path.
- [TCGplayer Partner Guidelines](https://help.tcgplayer.com/hc/en-us/articles/31411199594391-TCGplayer-Partner-Guidelines) require affiliate relationships to be disclosed clearly and prohibit misuse. Cardfolio has no approved partner code, so affiliate mode remains off.
- [TCGplayer pricing/API information](https://help.tcgplayer.com/hc/en-us/articles/201577976-How-can-I-get-access-to-your-card-pricing-data) directs applications to partner APIs and says current commission rates require direct contact. Cardfolio therefore does not claim API or commission rights.
- [Cardmarket Pokémon Wants format](https://help.cardmarket.com/en/how-to-add-a-pkmn-decklist-to-wants) confirms that Pokémon entries need full name plus abilities and attacks and can still require version review.
- [Cardmarket General Terms](https://www.cardmarket.com/en/Policies/GeneralTermsAndConditions) describe API access as access granted on request. No Cardfolio access approval is recorded.
- [Pokémon Terms of Use](https://www.pokemon.com/uk/legal/terms-of-use) identify artwork, screenshots, graphics and logos as protected content and do not grant Cardfolio commercial print rights.
- [TCGdex cards-database license](https://github.com/tcgdex/cards-database/blob/master/LICENSE) is MIT for the repository software/data contribution. Engineering inference: it is not treated as a sublicense for third-party Pokémon card artwork. Remote artwork remains display-only and is excluded from cover/print output.

## Technical controls

- Marketplace completion calls the existing TCGplayer/Cardmarket exporters through a pure Gift wrapper with `ownershipEffect: "none"`.
- `BinderAffiliateAdapter` receives only reviewed repository configuration. Components must never hardcode partner or affiliate URLs.
- The runtime partner catalog is `public/data/partners/binder-partners.v1.json`. It has a catalog-level switch, per-offer switches, verification/review dates, evidence URLs and optional static affiliate query fields.
- Only HTTPS destinations are accepted. Stale, disabled or invalid offers do not produce an external URL.
- Affiliate offers without a visible disclosure are invalid.
- Missing binder prices remain absent. Card price estimates and binder price are separate fields and separate purchases.
- URL construction accepts only an offer ID and static reviewed parameters. Recipient name, occasion, greeting, Pokémon preference, photos and other Gift text cannot enter partner URLs.
- Print Summary is a local text contract with the fixed policies `text-only-no-pokemon-art-or-logos` and `generated-locally-no-upload`.

## Activation checklist

Before changing the partner catalog to `enabled: true`, record all of the following in a reviewed commit:

1. Legal operator identity and privacy/affiliate disclosures are complete.
2. The provider agreement explicitly permits the intended link and any commission tracking.
3. The exact destination and personalization capability are verified from an official provider page.
4. Binder dimensions/page compatibility and whether sleeves/pages are included are verified.
5. Binder price currency, qualifier (`fixed` or `from`) and source date are current, or price remains unknown.
6. Photo upload is false unless the user leaves Cardfolio and the provider alone receives the file under its own privacy terms.
7. `reviewAfter` is in the future and CI/release checks pass.
8. UI shows external-navigation and affiliate disclosures before the click.

Until this checklist passes, Step 8 must render a disabled/no-offer state while keeping Gift creation, local Print Summary and card marketplace handoffs usable.
