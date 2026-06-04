# cart-agent-dev.myshopify.com Paid Loop Execution Checklist v1

Repository truth basis:

- `staffordos/authority/output/staffordos_canonical_lifecycle_v1.md`
- `staffordos/clients/client_registry_v1.json`
- `staffordos/clients/operator_dashboard_snapshot_v1.json`
- `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts`
- `web/src/checkout-public.js`
- `web/src/routes/packetAuthority.esm.js`
- `web/src/routes/stripeWebhook.esm.js`
- `staffordos/operator_design/commercial_convergence_review_v1.md`
- `staffordos/clients/promote_leads_to_clients_v1.mjs`

## 1. Current State

Current merchant record:

- Merchant: `cart-agent-dev.myshopify.com`
- Client registry lifecycle stage: `proposal_sent`
- Client registry payment status: `not_billable`
- Client registry Stafford revenue earned: `0`
- Client registry merchant revenue recovered: `100`
- Dashboard primary focus: this merchant
- Dashboard reason: merchant value has been proven but Stafford revenue has not been captured
- Required current action: follow up on the real ShopiFixer offer and close payment

Canonical lifecycle position:

- Current commercial position maps to the canonical conversion path after `Proposed Fix`
- The next canonical commercial step is `Checkout Link`, then `Payment`
- The payment authority path only marks success when the verified Stripe event moves the packet to `payment_received`

## 2. Required Next Lifecycle State

Required next runtime payment state:

- `payment_received`

Required canonical lifecycle progression to get there:

1. `Proposed Fix`
2. `Checkout Link`
3. `Payment`
4. packet status `payment_received`

This is not a new lifecycle. It is the existing canonical authority path.

## 3. Required Artifacts

The following artifacts must exist or be updated for the loop to complete:

- A real ShopiFixer checkout session created by `web/src/checkout-public.js`
- A packet record in the packet store created by `web/src/routes/packetAuthority.esm.js`
- A packet binding that carries:
  - `packet_id`
  - `store_domain`
  - `payment_reference`
- A verified Stripe webhook delivery handled by `web/src/routes/stripeWebhook.esm.js`
- The client registry record for `cart-agent-dev.myshopify.com` reflecting successful payment capture
- The dashboard snapshot recalculated from the updated client registry
- The CEO snapshot recalculated from the updated dashboard and client registry

## 4. Required Records

The loop is not complete unless the repository truth records all of the following:

- Client record for `cart-agent-dev.myshopify.com`
  - `deal.payment_status` updated from `not_billable` to a paid state used by the runtime
  - `revenue.shopifixer_collected` set to `true` or an equivalent paid signal
  - `business.stafford_revenue_earned` incremented above `0`
  - `lifecycle.stage` no longer representing unpaid proposal state in the operator reads

- Packet record
  - `status` transitions from `payment_pending` to `payment_received`
  - `payment_reference` is bound to the Stripe checkout session

- Dashboard record
  - `revenue_gaps` no longer shows this merchant as unpaid
  - `total_stafford_revenue` increases
  - `active_revenue_clients` increases if this becomes the first paid client

- CEO snapshot record
  - `paid_clients` increases
  - `unpaid_clients` decreases
  - `next_best_action` no longer points at this merchant as an unpaid close

## 5. Required Proof Events

These are the proof events that matter for the payment close:

1. Stripe Checkout Session is created for the merchant.
2. The checkout session is tied to the correct packet via `packet_id` metadata or `client_reference_id`.
3. Stripe delivers `checkout.session.completed`.
4. The webhook is verified with the Stripe signature and `STRIPE_WEBHOOK_SECRET`.
5. The webhook handler confirms the packet exists and the store domain matches.
6. The packet is updated to `payment_received`.

What does not count as proof:

- the `payment-return` redirect by itself
- an unverified webhook payload
- a local or manual status change without the signed Stripe event
- a send-ledger proof record from outreach

## 6. Required Revenue Events

The revenue capture path is:

1. The merchant reaches checkout from the ShopiFixer offer
2. Stripe records the payment
3. The verified webhook updates the packet to `payment_received`
4. Stafford revenue is recorded in the client registry
5. The dashboard and CEO snapshot reflect the paid state

Minimum revenue truth that must appear:

- `business.stafford_revenue_earned > 0`
- `revenue.shopifixer_collected === true` or the runtime equivalent paid signal
- the dashboard revenue gap for this merchant is cleared

## 7. Required Operator Actions

Ross-facing actions required to close the loop:

1. Follow up on the real ShopiFixer offer for `cart-agent-dev.myshopify.com`
2. Send or confirm the payment link if it is not already active
3. Ensure the checkout session is tied to the correct merchant and packet
4. Confirm the paid event arrives through the signed Stripe webhook path
5. Confirm the client registry reflects paid revenue
6. Confirm the dashboard and CEO snapshot stop treating this merchant as the unpaid priority

## 8. How StaffordOS Should Record Successful Completion

Successful completion should be recorded by existing StaffordOS truth sources, not by a new system:

- Packet authority:
  - packet status becomes `payment_received`
  - payment reference remains attached to the packet

- Client Registry:
  - merchant record reflects paid Stafford revenue
  - `shopifixer_collected` or equivalent paid signal is true
  - `business.stafford_revenue_earned` is updated

- Dashboard Snapshot:
  - the revenue gap for this merchant is removed or reduced to zero
  - summary counts increase for paid revenue

- CEO Snapshot:
  - next best action moves away from unpaid close work for this merchant
  - paid client counts increase

## Completion Checklist

- [ ] Real ShopiFixer checkout session exists
- [ ] Packet exists for the merchant
- [ ] Packet is bound to the checkout session
- [ ] Stripe webhook `checkout.session.completed` is received
- [ ] Webhook signature is verified
- [ ] Packet status updates to `payment_received`
- [ ] Client registry records paid Stafford revenue
- [ ] Dashboard snapshot clears the merchant revenue gap
- [ ] CEO snapshot reflects the paid state
- [ ] Ross no longer sees this merchant as an unpaid close in the primary action
