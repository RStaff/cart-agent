# ShopiFixer Payment Completion Bridge Plan V1

## Findings

- An in-repo Stripe webhook exists at `web/src/routes/stripeWebhook.esm.js`.
- An in-repo public checkout route exists at `web/src/checkout-public.js`.
- The ShopiFixer page posts to `/__public-checkout`.
- The Stripe webhook already verifies `checkout.session.completed` and already calls `recordStripePaymentPropagation`.
- The remaining gap is fulfillment truth propagation after payment.

## Exact Payment Completion Path

1. `abando-frontend/app/shopifixer/page.tsx` posts to `/__public-checkout`.
2. `web/src/checkout-public.js` creates the Stripe Checkout session and binds packet payment pending state.
3. Stripe emits `checkout.session.completed`.
4. `web/src/routes/stripeWebhook.esm.js` verifies the webhook signature and calls `recordStripePaymentPropagation`.
5. `staffordos/clients/client_registry_v1.mjs` can mark the client paid.
6. `staffordos/revenue/revenue_agent_v1.mjs` can propagate the payment truth.
7. `staffordos/fulfillment/build_shopifixer_fulfillment_truth_v1.mjs` can represent the paid sprint as `payment_received`, but it is currently only an offline builder.

## Merchant Identity Fields Available at Payment Completion

- `packet_id`
- `store_domain`
- `client_reference_id`
- `session.id`
- `amount_total`
- `currency`
- `customer_details.email` when Stripe provides it

## Smallest Safe Repair

Keep the existing Stripe webhook and payment writers. Add a tiny runtime helper that maps the paid client record into fulfillment truth, then invoke that helper from `web/src/routes/stripeWebhook.esm.js` after `recordStripePaymentPropagation` succeeds.

## Exact Files to Change

- `web/src/routes/stripeWebhook.esm.js`
- `staffordos/fulfillment/build_shopifixer_fulfillment_truth_v1.mjs`

## Why This Is Smallest

- No new authorities.
- No payment simulation.
- No fake payment records.
- No checkout rewrite.
- No Stripe rewrite.
- No client registry rewrite.
- No revenue truth rewrite beyond the existing payment propagation path.

## Status

- `in_repo_webhook_exists`: true
- `in_repo_public_checkout_exists`: true
- `business_truth_untouched`: true
- `payment_simulated`: false

## Note

The checkout and webhook are already present in the repo. The open question is only the fulfillment truth handoff after payment.
