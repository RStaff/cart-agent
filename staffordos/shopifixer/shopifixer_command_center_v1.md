# ShopiFixer Command Center

## Merchant

- Store: `cart-agent-dev.myshopify.com`
- Client ID: `cart-agent-dev.myshopify.com`

## Audit

- Score: `64`
- Top issue: `Slow mobile checkout handoff`
- Recommendation: `Tighten the mobile checkout path and remove unnecessary handoff friction.`

## Offer

- Offer status: `offer_sent`
- Offer price: `$950`
- Send allowed: `true`

## Payment

- Payment status: `waiting_for_payment`
- Readiness: `READY_FOR_REAL_PAYMENT`

## Fulfillment

- Fulfillment status: `waiting_for_payment`
- Execution status: `not_started`
- Proof status: `not_started`

## Lifecycle

- Offer generated: `true`
- Offer sent: `true`
- Payment received: `false`
- Fulfillment started: `false`
- Proof complete: `false`
- Completed: `false`

## Overall

- Current stage: `offer_sent`
- Next required action: `Collect a verified Stripe payment for the authorized $950 Fix Sprint.`
- Readiness score: `93`

## Sources

- `staffordos/audit/audit_result_surface.json`
- `staffordos/shopifixer/shopifixer_conversion_brief_v1.json`
- `staffordos/clients/shopifixer_offer_latest.json`
- `staffordos/shopifixer/shopifixer_send_authority_v1.json`
- `staffordos/shopifixer/shopifixer_offer_outcome_authority_v1.json`
- `staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json`
- `staffordos/shopifixer/shopifixer_runtime_payment_verification_v1.json`
