# Execution Authority Map v1

Read-only governance audit companion to [`staffordos/governance/execution_authority_map_v1.json`](./execution_authority_map_v1.json).

Generated: 2026-06-13

## Scope

This map inventories executable StaffordOS paths that can:
- send email
- send SMS
- create Stripe checkout sessions
- process Stripe webhooks
- mutate client state
- mutate lead state
- mutate fulfillment state
- mutate revenue truth
- mutate outcome truth
- mutate execution truth
- trigger recovery actions
- trigger operator actions

## Canonical authority summary

- Canonical send authority: `email.shopifixer.send_offer` for ShopiFixer revenue sends; recovery email/SMS authorities remain separate channels.
- Canonical payment authority: `payment.stripe_webhook_receipt` for verified receipt, with `payment.public_checkout_session` as initiation and `packet.payment_return` as binding.
- Canonical fulfillment authority: `fulfillment.rebuild_truth`
- Canonical revenue authority: `revenue.record_stripe_payment_propagation`
- Canonical proof authority: the append-only StaffordOS execution/outcome truth boundary. In executable-path terms the closest current writer is `operator.execute_primary_action`, but it is only partially governed and also patches projections, so it is not the final v2 proof authority.

## Inventory

| authority_id | file | function | route | execution_type | governance_status |
|---|---|---|---|---|---|
| `email.shopifixer.send_offer` | `web/src/routes/sendOffer.esm.js` | `installSendOffer` | `/api/shopifixer/send-offer` | `send_email` | `PARTIALLY_GOVERNED` |
| `email.abando.recovery_send` | `web/src/lib/abandoRecoverySender.js` | `sendAbandoRecoveryEmail` | `/api/recovery-actions/send-live-test` | `send_email` | `PARTIALLY_GOVERNED` |
| `sms.abando.recovery_send` | `web/src/lib/smsSender.js` | `sendRecoverySMS` | `/api/recovery-actions/send-live-test` | `send_sms` | `PARTIALLY_GOVERNED` |
| `email.recovery.audit_send` | `web/src/lib/emailSender.js` | `sendRecoveryEmail` | `/api/recovery-actions/send-live-test` | `send_email` | `PARTIALLY_GOVERNED` |
| `recovery.live_test_route` | `web/src/routes/recoveryLiveTest.esm.js` | `installRecoveryLiveTestRoute` | `/api/recovery-actions/send-live-test` | `recovery_live_test` | `PARTIALLY_GOVERNED` |
| `payment.public_checkout_session` | `web/src/checkout-public.js` | `installPublicCheckout` | `/__public-checkout` | `create_stripe_checkout_session` | `PARTIALLY_GOVERNED` |
| `payment.stripe_webhook_receipt` | `web/src/routes/stripeWebhook.esm.js` | `installStripeWebhook` | `/stripe/webhook` | `process_stripe_webhook` | `GOVERNED` |
| `revenue.record_stripe_payment_propagation` | `staffordos/revenue/revenue_agent_v1.mjs` | `recordStripePaymentPropagation` | `/stripe/webhook` | `mutate_revenue_truth` | `GOVERNED` |
| `client.record_verified_stripe_payment` | `staffordos/clients/client_registry_v1.mjs` | `recordVerifiedStripePayment` | `/stripe/webhook` | `mutate_client_state` | `GOVERNED` |
| `revenue.rebuild_truth` | `staffordos/revenue/revenue_agent_v1.mjs` | `rebuildRevenueTruth` | `direct or webhook fan-out` | `rebuild_revenue_truth` | `GOVERNED` |
| `fulfillment.rebuild_truth` | `staffordos/fulfillment/build_shopifixer_fulfillment_truth_v1.mjs` | `rebuildShopifixerFulfillmentTruth` | `/stripe/webhook` | `mutate_fulfillment_truth` | `GOVERNED` |
| `lead.operator_action` | `staffordos/ui/operator-frontend/app/api/operator/lead-registry/action/route.ts` | `POST` | `/api/operator/lead-registry/action` | `mutate_lead_state_with_dry_run_proof` | `GOVERNED` |
| `recovery.trigger_action` | `web/src/routes/recoveryTrigger.esm.js` | `installRecoveryTrigger` | `/api/recovery/trigger` | `create_recovery_action` | `PARTIALLY_GOVERNED` |
| `order.webhook_paid` | `web/src/routes/orderWebhook.esm.js` | `installOrderWebhook / processOrdersPaidPayload` | `/api/webhooks/orders/paid` | `process_order_webhook_and_trigger_recovery` | `PARTIALLY_GOVERNED` |
| `order.webhook_create` | `web/src/routes/orderWebhook.esm.js` | `installOrderWebhook / processOrdersCreatePayload` | `/api/webhooks/orders/create` | `process_order_webhook_and_trigger_recovery` | `PARTIALLY_GOVERNED` |
| `checkout.signal.start` | `web/src/routes/checkoutSignals.esm.js` | `installCheckoutSignals / POST /signal/checkout-start` | `/signal/checkout-start` | `capture_checkout_start_and_persist_event` | `PARTIALLY_GOVERNED` |
| `checkout.signal.risk` | `web/src/routes/checkoutSignals.esm.js` | `processCheckoutRiskPayload / POST /signal/checkout-risk` | `/signal/checkout-risk` | `capture_risk_signal_enqueue_audit_and_recovery_job` | `PARTIALLY_GOVERNED` |
| `checkout.signal.decision_log` | `web/src/routes/checkoutSignals.esm.js` | `POST /signal/decision-log` | `/signal/decision-log` | `log_manual_decision` | `PARTIALLY_GOVERNED` |
| `checkout.signal.decision_outcome` | `web/src/routes/checkoutSignals.esm.js` | `POST /signal/decision-outcome` | `/signal/decision-outcome` | `update_decision_outcome` | `PARTIALLY_GOVERNED` |
| `packet.prepare` | `web/src/routes/packetAuthority.esm.js` | `installPacketAuthority / POST /api/packets/prepare` | `/api/packets/prepare` | `create_packet` | `PARTIALLY_GOVERNED` |
| `packet.execution_update` | `web/src/routes/packetAuthority.esm.js` | `installPacketAuthority / POST /api/packets/:packetId/execution` | `/api/packets/:packetId/execution` | `mutate_packet_lifecycle` | `PARTIALLY_GOVERNED` |
| `packet.payment_return` | `web/src/routes/packetAuthority.esm.js` | `GET /payment-return` | `/payment-return` | `bind_payment_to_packet` | `GOVERNED` |
| `operator.execute_primary_action` | `staffordos/ui/operator-frontend/app/api/operator/execute-primary-action/route.ts` | `POST` | `/api/operator/execute-primary-action` | `trigger_operator_actions_and_loop_d` | `PARTIALLY_GOVERNED` |
| `operator.read_only_proof` | `staffordos/ui/operator-frontend/app/api/operator/send-proof/route.ts` | `GET` | `/api/operator/send-proof` | `read_only_proof_lookup` | `READ_ONLY` |
| `operator.read_only_followups` | `staffordos/ui/operator-frontend/app/api/operator/followups/route.ts` | `GET` | `/api/operator/followups` | `read_only_queue_lookup` | `READ_ONLY` |
| `operator.read_only_client_registry` | `staffordos/ui/operator-frontend/app/api/operator/client-registry/route.ts` | `GET` | `/api/operator/client-registry` | `read_only_registry_lookup` | `READ_ONLY` |
| `operator.read_only_ceo_truth` | `staffordos/ui/operator-frontend/app/api/operator/ceo-truth-snapshot/route.ts` | `GET` | `/api/operator/ceo-truth-snapshot` | `read_only_snapshot_lookup` | `READ_ONLY` |
| `operator.read_only_command_center` | `staffordos/ui/operator-frontend/app/api/operator/ross-command-center/route.ts` | `GET` | `/api/operator/ross-command-center` | `read_only_command_snapshot` | `READ_ONLY` |

## Governance notes

- `GOVERNED` means the path has a stable authority boundary and writes only to its expected canonical store.
- `PARTIALLY_GOVERNED` means the path is real and active, but still depends on live environment state, can double-send, or writes beyond the ideal canonical proof boundary.
- `UNGOVERNED` is reserved for paths that would perform side effects without any meaningful authority gate. No current active path in this map was classified that way.
- `READ_ONLY` means the route is an inspection surface only.

## Proof boundaries

Canonical StaffordOS proof should stay in append-only execution/outcome truth. The current bridge-related and operator execution paths are split across:
- `staffordos/execution/execution_log_v1.json`
- `staffordos/execution/outcome_events_v1.json`
- `staffordos/events/operator_action_events_v1.json`
- `staffordos/events/outcome_event_log_v1.json`

Any future Revenue Execution Bridge v2 should write proof only to the canonical StaffordOS execution/outcome truth boundary and should not patch presentation snapshots.

## Revenue Execution Bridge v2 call policy

If Revenue Execution Bridge v2 existed today, it should call:
- `email.shopifixer.send_offer` for the live ShopiFixer email send
- the canonical proof boundary for append-only execution/outcome recording

It should never call:
- `payment.stripe_webhook_receipt`
- `revenue.record_stripe_payment_propagation`
- `client.record_verified_stripe_payment`
- `fulfillment.rebuild_truth`
- `revenue.rebuild_truth`
- `operator.execute_primary_action`
- `recovery.trigger_action`
- `checkout.signal.*`
- `packet.prepare`
- `packet.execution_update`
- `packet.payment_return`
- any projection patcher or snapshot writer

