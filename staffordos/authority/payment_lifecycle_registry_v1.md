# PAYMENT LIFECYCLE REGISTRY V1

## Current Lifecycle

1. Merchant visits pricing page.
2. Checkout Authority creates Stripe Checkout Session.
3. Checkout Authority creates canonical Packet.
4. Packet starts as payment_pending.
5. Payment return may bind session identity but must not grant paid status.
6. Stripe Webhook Authority is the only authority allowed to mark payment_received.
7. Payment execution may begin only after verified payment_received.

## Allowed State Transitions

payment_pending -> payment_received
Allowed only by:
web/src/routes/stripeWebhook.esm.js

Required proof:
- Valid Stripe signature
- Verified checkout.session.completed event
- Existing packet_id
- Matching store_domain
- Existing packet record

## Forbidden Transitions

payment_pending -> payment_received from:
- /payment-return
- /api/packets/prepare
- checkout creation
- operator manual action
- unverified webhook JSON
- any route without Stripe signature verification

## Current Blocker

None for S2F source authority.

## Current Next Phase

S2H_CONTROLLED_REAL_PAYMENT_VALIDATION

## Current Limits

- Controlled real payment validation requires separate explicit authority.
- Paid packet execution remains blocked until a verified Stripe webhook event
  transitions a packet to `payment_received`.
- Merchant execution and proof package creation remain blocked until paid packet
  authority and separate execution authority exist.
