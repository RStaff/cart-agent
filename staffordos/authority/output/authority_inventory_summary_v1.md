# AUTHORITY INVENTORY SUMMARY V1

## Inventory Counts

Route files: 35
Lib files: 31

## Current Critical Authority Owners

Checkout Authority:
web/src/checkout-public.js

Packet Authority:
web/src/routes/packetAuthority.esm.js

Stripe Webhook Authority:
web/src/routes/stripeWebhook.esm.js

Stripe Verification Logic:
web/src/routes/billing.js

## Current Critical Conflict

Stripe Webhook Authority is mounted and can mark `payment_received`.
Stripe Verification Logic exists separately in `billing.js`.

This means verification authority and runtime payment lifecycle authority are split.

## Current Blocking Gate

S2F_STRIPE_AUTHORITY_UNIFICATION

## Required Resolution

Move Stripe signature verification into the canonical mounted Stripe webhook path and ensure raw body parsing happens before global JSON parsing.

## Blocked Until Resolution

- Real payment validation
- Paid packet execution
- Merchant execution workflow
