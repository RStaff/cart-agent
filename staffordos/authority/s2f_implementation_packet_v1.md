# S2F IMPLEMENTATION PACKET V1

## Phase

S2F_STRIPE_AUTHORITY_UNIFICATION

## Goal

Unify Stripe payment authority so only verified Stripe webhook events can transition a Packet from `payment_pending` to `payment_received`.

## Files to Modify

1. `web/src/routes/stripeWebhook.esm.js`
2. `web/src/index.js`

## Files to Preserve

- `web/src/checkout-public.js`
- `web/src/routes/packetAuthority.esm.js`
- `web/src/lib/packetRepository.js`
- `web/prisma/schema.prisma`

## Current Failing Validator

Run:

    node staffordos/authority/validate_payment_authority_source_v1.mjs

Current failures:

- `stripe_webhook_missing_signature_verification`
- `stripe_webhook_missing_webhook_secret_requirement`
- `stripe_webhook_mounted_after_express_json`

## Required Behavior

- `/stripe/webhook` must use raw request body.
- `/stripe/webhook` must verify Stripe signature using `STRIPE_WEBHOOK_SECRET`.
- Missing `STRIPE_WEBHOOK_SECRET` must block lifecycle mutation.
- Only verified `checkout.session.completed` may set `payment_received`.
- Packet existence check must remain.
- Store-domain mismatch check must remain.
- Unknown Stripe events must not mutate packet lifecycle.

## Forbidden Behavior

- No real payment test.
- No Stripe product change.
- No Stripe price change.
- No Packet schema change.
- No StaffordOS UI work.
- No outreach/send-preview work.
- No Abando work.

## Acceptance Criteria

These must pass:

    node --check web/src/routes/stripeWebhook.esm.js
    node --check web/src/index.js
    node staffordos/authority/validate_authority_registry_v1.mjs
    node staffordos/authority/validate_payment_authority_source_v1.mjs

## Next Phase After Pass

S2G_VERIFIED_STRIPE_EVENT_VALIDATION
