# STAFFORDOS AUTHORITY REGISTRY V1

## Checkout Authority

Owner:
web/src/checkout-public.js

Responsibilities:
- Create Stripe checkout session
- Create canonical packet
- Bind packet to Stripe session

Not Allowed:
- Mark payment_received

---

## Packet Authority

Owner:
web/src/routes/packetAuthority.esm.js

Responsibilities:
- Bind Stripe session to packet
- Preserve payment lifecycle boundaries

Not Allowed:
- Grant payment_received without Stripe verification

---

## Stripe Webhook Authority

Owner:
web/src/routes/stripeWebhook.esm.js

Responsibilities:
- Receive Stripe events
- Verify Stripe signatures
- Transition payment lifecycle

Required:
- STRIPE_WEBHOOK_SECRET
- stripe.webhooks.constructEvent()
- express.raw()

Only Allowed State Transition:
payment_pending -> payment_received

---

## Billing Authority

Owner:
web/src/routes/billing.js

Current Status:
Contains verification logic

Required Action:
Merge verification authority into canonical Stripe webhook authority

---

Registry Status:
SEED_V1
