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

Current Source Authority Status:
S2F source-authority blocker: none

Current Limitation:
Live payment validation still requires separate S2H controlled real payment
authority.

---

## Billing Authority

Owner:
web/src/routes/billing.js

Current Status:
Non-canonical for ShopiFixer packet payments

Required Action:
Retain as legacy/subscription billing authority. Do not use for ShopiFixer
packet `payment_received` transitions.

---

Registry Status:
RECONCILED_V2

Previous Authority:
S2F_STRIPE_AUTHORITY_UNIFICATION

Replacement Authority:
S2H_CONTROLLED_REAL_PAYMENT_VALIDATION

Reason:
Repository source authority now shows the canonical Stripe webhook requires
`STRIPE_WEBHOOK_SECRET`, verifies signatures with `stripe.webhooks.constructEvent`,
and is mounted before global JSON parsing. The persisted payment source
validation output reports `status: passed` and `current_blocker: null`.

Still Requires Separate Authority:
- controlled real payment validation
- paid packet lifecycle execution
- merchant execution workflow
- Shopify mutation for a paid packet
- proof package creation for a paid packet
