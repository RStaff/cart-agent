# Payment Propagation Verification v1

## 1. Executive Summary

A verified Stripe `checkout.session.completed` event does **not** propagate all the way through the StaffordOS business-core stack.

What is proven:

- ShopiFixer CTA can initiate the public checkout flow.
- Public checkout creates a Stripe Checkout Session and binds packet metadata.
- The Stripe webhook verifies the signature.
- The webhook updates packet state to `payment_received`.

What is not proven:

- No runtime path from the Stripe webhook updates `client_registry_v1.json`.
- No runtime path from the Stripe webhook updates `revenue_truth_v1.json`.
- The operator dashboard snapshot is not automatically mutated by the payment event.
- The CEO cockpit reads client and dashboard summaries, but not packet truth directly.

### Direct answers

- `web/src/routes/stripeWebhook.esm.js` mutates `client_registry_v1.json` **not at all**.
- Payment truth stops at the packet layer, specifically the packet table mutated by `bindPacketPayment(...)`.

## 2. Verified Payment Propagation Path

Verified path:

`ShopiFixer page -> /__public-checkout -> Stripe Checkout Session -> verified Stripe webhook -> packet.payment_received`

That is the end of the verified payment propagation path in the inspected code.

## 3. Hop-by-Hop Trace

| Hop | File / Function | Trigger | Reads | Writes | Link Identifier(s) | Status | Evidence | Exact Gap |
|---|---|---|---|---|---|---|---|---|
| 1. ShopiFixer page -> /__public-checkout | `abando-frontend/app/shopifixer/page.tsx` `startCheckout()` | User clicks `Get the $950 Fix Sprint` | Store domain input; env vars for checkout base | Local event log in `localStorage`; POST request body | `store_domain`, `plan` | PROVEN | Page code posts to `/__public-checkout` with `plan: "scale"` and `store_domain`. | No payment proof yet; this only starts checkout. |
| 2. /__public-checkout -> Stripe Checkout Session | `web/src/checkout-public.js` POST `/__public-checkout` | Incoming checkout POST | Request body, env prices, `STRIPE_*` secret | Creates packet, creates Stripe session, binds packet `payment_pending` | `packet_id`, `store_domain`, `session.id` | PROVEN | Code creates packet and Stripe session, then calls `bindPacketPayment(...)`. | None at this hop. |
| 3. Stripe Checkout Session -> packet metadata | `web/src/checkout-public.js` `stripe.checkout.sessions.create(...)` | Session creation | Packet object | Stripe session metadata and client reference id | `client_reference_id`, `metadata.packet_id`, `metadata.store_domain` | PROVEN | Session payload explicitly sets these fields. | None at this hop. |
| 4. Stripe checkout.session.completed received | `web/src/routes/stripeWebhook.esm.js` `installStripeWebhook()` | Stripe webhook delivery | Raw body, `stripe-signature`, `STRIPE_WEBHOOK_SECRET` | None until verified | event id, signature, raw body | PROVEN | Route exists and is mounted before JSON parsing. | No proof of end-to-end propagation beyond packet. |
| 5. Webhook signature verification | `stripe.webhooks.constructEvent(...)` in `stripeWebhook.esm.js` | Webhook receipt | Raw request body, signature, webhook secret | None before verification succeeds | webhook event id | PROVEN | Code rejects missing secret and invalid signature. | None at this hop. |
| 6. Webhook -> packet `payment_received` | `bindPacketPayment(...)` in `stripeWebhook.esm.js` / `web/src/lib/packetRepository.js` | Verified `checkout.session.completed` | `session.metadata.packet_id`, `session.client_reference_id`, `session.metadata.store_domain`, `session.id`, existing packet | Packet row in DB updated to `payment_received` | `packet_id`, `store_domain`, `payment_reference` | PROVEN | Code gets packet, checks store match, then binds `payment_received`. | Downstream systems are not updated here. |
| 7. Webhook -> Client Registry payment status | No write path found | Verified payment event | Packet data only | None | None | BROKEN | `stripeWebhook.esm.js` does not import or call `upsertClient()` or any client registry writer. | Client Registry never receives the payment event. |
| 8. Webhook -> Revenue Truth | No write path found for Stripe payment | Verified payment event | Packet data only | None | None | BROKEN | Revenue truth is written by other Abando/outreach paths, not by Stripe webhook code. | Stripe payment does not update `revenue_truth_v1.json`. |
| 9. Webhook or registry change -> Operator Dashboard Snapshot | `staffordos/clients/build_operator_dashboard_snapshot_v1.mjs` | Manual rebuild after client registry change | `client_registry_v1.json` | `operator_dashboard_snapshot_v1.json` | `client_id`, `merchant_shop` | PARTIALLY_PROVEN | Snapshot builder exists and reads client registry. | No runtime wiring from Stripe payment to dashboard rebuild. |
| 10. Dashboard Snapshot / Registry -> CEO Cockpit API | `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts` | HTTP GET to CEO snapshot | Lead registry, client registry, dashboard snapshot, send ledger proof status | JSON response only | `client_id`, `merchant_shop`, canonical lifecycle fields | PROVEN | Route aggregates existing read-only truth files. | It still does not read packet truth directly. |
| 11. CEO Cockpit API -> Command Center display | `staffordos/ui/operator-frontend/lib/operator/loadPrimaryActionSnapshot.ts` and `app/operator/command-center/page.tsx` | Page render / fetch | CEO snapshot response | UI render only | `client_id`, `merchant_shop`, next-best-action fields | PROVEN | Command Center fetches CEO snapshot and renders the Ross-facing primary action. | Display is downstream of summaries, not packet truth. |

## 4. Direct Answer: Does `stripeWebhook.esm.js` mutate `client_registry_v1.json`?

No.

The inspected webhook code only:

- verifies the Stripe signature,
- looks up the packet,
- checks store-domain consistency,
- calls `bindPacketPayment(...)` to update the packet row.

It does not import `upsertClient()`, does not write `client_registry_v1.json`, and does not call the dashboard builder or revenue truth writer.

## 5. Direct Answer: Where does payment truth stop?

Payment truth stops at the packet layer:

- `bindPacketPayment(...)` updates the `packets` table in `web/src/lib/packetRepository.js`.
- There is no inspected runtime path that carries that verified payment into Client Registry, Revenue Truth, Operator Dashboard Snapshot, or the CEO Cockpit as live mutation truth.

## 6. Proven Hops

- Hop 1: ShopiFixer page -> `/__public-checkout`
- Hop 2: `/__public-checkout` -> Stripe Checkout Session
- Hop 3: Stripe Checkout Session -> `client_reference_id` / `metadata.packet_id`
- Hop 4: Stripe `checkout.session.completed` received
- Hop 5: Webhook signature verification
- Hop 6: Webhook -> packet `payment_received`
- Hop 10: Dashboard Snapshot / Registry -> CEO Cockpit API
- Hop 11: CEO Cockpit API -> Command Center display

## 7. Partially Proven Hops

- Hop 9: Webhook or registry change -> Operator Dashboard Snapshot

## 8. Unproven / Broken Hops

- Hop 7: Webhook -> Client Registry payment status
- Hop 8: Webhook -> Revenue Truth

## 9. Revenue-Blocking Gap

The revenue-blocking gap is the missing propagation of verified Stripe payment into merchant truth:

- Client Registry remains unpaid / uncollected.
- Revenue Truth remains detached from Stripe payment.
- Dashboard Snapshot and CEO Cockpit continue to summarize client state rather than absorb live payment truth.

## 10. CEO Cockpit Blind Spot

The CEO Cockpit can see:

- leads,
- client registry,
- dashboard snapshot,
- send-ledger proof status.

It cannot directly see:

- packet payment state,
- verified Stripe event identity,
- packet-to-client payment propagation,
- payment-to-proof completion.

## 11. Evidence Table

| Evidence | What it proves |
|---|---|
| `abando-frontend/app/shopifixer/page.tsx` | Public ShopiFixer CTA routes to `/__public-checkout` with `store_domain` and `plan: "scale"`. |
| `web/src/checkout-public.js` | Checkout creates packet and Stripe session with packet binding metadata. |
| `web/src/routes/stripeWebhook.esm.js` | Stripe webhook verifies signature and updates packet status to `payment_received`. |
| `web/src/lib/packetRepository.js` | Packet binding writes to the packet table only. |
| `staffordos/clients/build_operator_dashboard_snapshot_v1.mjs` | Dashboard snapshot is a derived read from client registry, not webhook-driven mutation truth. |
| `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts` | CEO cockpit is a read aggregation from client, lead, dashboard, and send-ledger data, not packet truth. |
| `staffordos/clients/client_registry_v1.json` | Primary merchant is still `proposal_sent`, `audit_status: not_started`, `stafford_revenue_earned: 0`. |
| `staffordos/revenue/revenue_truth_v1.json` and `paymentAgreementRepository.js` | Revenue truth is separate from Stripe webhook payment truth. |

## 12. Next Verifiable Question

Does any runtime writer update `client_registry_v1.json` after a verified Stripe `checkout.session.completed` event, or is the packet table the terminal write point?

## 13. Explicit Warning If Implementation Is Not Safe

Implementation is not safe for new product work yet.

Reason:

- Verified payment does not propagate into client, revenue, dashboard, or CEO truth.
- The end-to-end commercial loop is still broken at the packet boundary.
