# S2G PREP V1

## Phase

S2G_VERIFIED_STRIPE_EVENT_VALIDATION

## Goal

Verify that Stripe-signed `checkout.session.completed` can move a canonical Packet from:

payment_pending -> payment_received

## Requirement

This must be done with a verified Stripe event, not by directly calling `/payment-return`.

## Blocked Until Confirmed

- `STRIPE_WEBHOOK_SECRET` exists in Render for cart-agent-api.
- Stripe webhook endpoint points to canonical route:
  `/stripe/webhook`
- Webhook event type includes:
  `checkout.session.completed`

## Do Not Do Yet

- No real merchant payment.
- No paid packet execution.
- No Shopify mutation.
- No outreach/send-preview.
- No Abando work.
