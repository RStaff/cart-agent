# S2H CONTROLLED PAYMENT PACKET V1

## Objective

Prove one real ShopiFixer one-time payment can move one packet from:

payment_pending -> payment_received

through verified Stripe webhook delivery.

## Test Rules

- One checkout only.
- One packet only.
- One payment only.
- No merchant execution after payment until packet state is verified.
- No Shopify mutation.
- No fulfillment.
- No proof package yet.

## Before Payment

1. Confirm no active Abando subscriptions.
2. Confirm checkout page shows $950 flat fee.
3. Create fresh checkout session.
4. Record packet_id.
5. Record session_id.
6. Confirm packet status is payment_pending.

## After Payment

1. Check Stripe payment succeeded.
2. Check webhook delivery succeeded.
3. Check packet status is payment_received.
4. Confirm execution_status remains not_started.
5. Confirm proof_status remains not_started.
6. Confirm completion_status remains not_started.

## Pass Criteria

- payment_pending becomes payment_received
- payment_reference remains Stripe session id
- no duplicate packet created
- no execution begins automatically

## Fail Criteria

- payment succeeds but packet remains pending
- webhook fails
- wrong packet updates
- duplicate packet appears
- execution starts automatically
