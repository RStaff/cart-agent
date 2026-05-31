# S2G VERIFIED EVENT TEST PLAN V1

## Phase

S2G_VERIFIED_STRIPE_EVENT_VALIDATION

## Goal

Verify a Stripe-signed `checkout.session.completed` event can transition a canonical Packet:

payment_pending -> payment_received

## Already Proven

- Canonical webhook route exists.
- Canonical webhook rejects unsigned fake events.
- Render service health is OK.
- Provider drift was identified and corrected.
- STRIPE_WEBHOOK_SECRET is active.

## Required Test Shape

1. Create a fresh checkout session through canonical checkout endpoint.
2. Confirm fresh packet is `payment_pending`.
3. Trigger a Stripe-signed `checkout.session.completed` event for that session.
4. Confirm webhook updates the same packet to `payment_received`.
5. Confirm no duplicate Packet authority is created.

## Do Not Do

- Do not test a real merchant payment yet.
- Do not mutate Shopify.
- Do not start execution work.
- Do not use payment-return as payment proof.
- Do not bypass Stripe signature verification.

## Success Criteria

- Packet starts as `payment_pending`.
- Stripe-signed event is delivered to `/stripe/webhook`.
- Packet ends as `payment_received`.
- Payment reference remains Stripe session id.
- Operator packet endpoint shows updated state.

## Failure Criteria

- Webhook is not delivered.
- Signature verification fails for real Stripe event.
- Packet remains `payment_pending`.
- Wrong packet is updated.
- Duplicate packet is created.
