# StaffordOS Runtime Writer Trace v1

## 1. End-to-end payment propagation graph

Verified Stripe payment path:

`ShopiFixer page -> /__public-checkout -> Stripe Checkout Session -> Stripe webhook -> packet.payment_received`

That path is real and code-backed.

The propagation stops there.

Existing downstream runtime path from lead truth:

`lead_registry_v1.json -> promote_leads_to_clients_v1.mjs -> client_registry_v1.json -> build_operator_dashboard_snapshot_v1.mjs -> operator_dashboard_snapshot_v1.json -> ceo-snapshot API -> Command Center`

That path exists, but it is a lead/client summary path, not a packet-payment propagation path.

## 2. Packet truth destinations

Packet truth is written and read by packet authority code only:

- `web/src/lib/packetRepository.js`
- `web/src/checkout-public.js`
- `web/src/routes/stripeWebhook.esm.js`
- `web/src/routes/packetAuthority.esm.js`

Packet state reaches:

- packet table rows
- packet API responses
- packet lifecycle reads

Packet truth does **not** currently write client registry, revenue truth, dashboard snapshot, or CEO snapshot.

## 3. Client registry write map

### Direct writers

1. `staffordos/clients/client_registry_v1.mjs`
   - Function: `upsertClient()`
   - Input source: caller-provided client fields
   - Output target: `staffordos/clients/client_registry_v1.json`
   - Runtime trigger: direct client promotion / seed / registry update
   - Status: active
   - Proof: reads and writes the registry file directly.

2. `staffordos/clients/promote_leads_to_clients_v1.mjs`
   - Function: main promotion runner
   - Input source: `staffordos/leads/lead_registry_v1.json`, routing policy, offer rules
   - Output target: `staffordos/clients/client_registry_v1.json`
   - Runtime trigger: promotion run
   - Status: active
   - Proof: calls `upsertClient()` for qualified leads.

3. `staffordos/clients/seed_client_from_abando_proof_v1.mjs`
   - Function: seed script main body
   - Input source: hardcoded `cart-agent-dev.myshopify.com` proof context
   - Output target: `staffordos/clients/client_registry_v1.json`
   - Runtime trigger: seed execution
   - Status: active
   - Proof: imports `upsertClient()` and writes a proof client.

4. `staffordos/clients/next_action_engine_v1.mjs`
   - Function: `run()`
   - Input source: `staffordos/clients/client_registry_v1.json`
   - Output target: same registry file
   - Runtime trigger: engine execution
   - Status: active
   - Proof: rewrites lifecycle, next action, priority, blocker detection, decision trace.

5. `staffordos/clients/close_engine_v1.mjs`
   - Function: `run()`
   - Input source: `staffordos/clients/client_registry_v1.json`
   - Output target: same registry file
   - Runtime trigger: engine execution
   - Status: active
   - Proof: mutates `client.close_engine` for proposal_sent clients.

### Packet payment does not write client registry

- `web/src/routes/stripeWebhook.esm.js` does not import client registry writers.
- No inspected runtime code writes `client_registry_v1.json` from verified Stripe payment.

## 4. Revenue truth write map

### Direct writers

1. `staffordos/revenue/revenue_agent_v1.mjs`
   - Function: top-level script body
   - Input source: outreach queue, approval queue, send ledger, outcomes
   - Output target: `staffordos/revenue/revenue_truth_v1.json` and `.md`
   - Runtime trigger: revenue agent run
   - Status: active
   - Proof: writes computed funnel counts and bottleneck from local outreach/revenue files.

2. `web/src/lib/abandoRevenueRegister.js`
   - Function: `recordRevenueProof({ repoRoot, attribution })`
   - Input source: Abando return attribution
   - Output target: `staffordos/system_inventory/output/execution_proof_register_v1.json`
   - Runtime trigger: Abando return attribution route
   - Status: active
   - Proof: writes `latest_abando_revenue_proof` into execution proof register.

3. `web/src/index.js`
   - Function: `/api/recovery/return` route
   - Input source: `shop`, `experienceId`, `revenue`
   - Output target: `recordRevenueProof(...)` proof register
   - Runtime trigger: recovery return request
   - Status: active
   - Proof: calls `recordRevenueProof({ repoRoot, attribution })`.

### Revenue truth is not written by Stripe payment

- `web/src/routes/stripeWebhook.esm.js` does not write `revenue_truth_v1.json`.
- `paymentAgreementRepository.js` writes `paymentAgreements.json`, but that is internal agreement state, not live Stripe payment truth.

## 5. Dashboard truth write map

### Direct writer

1. `staffordos/clients/build_operator_dashboard_snapshot_v1.mjs`
   - Function: top-level snapshot builder
   - Input source: `staffordos/clients/client_registry_v1.json`
   - Output target: `staffordos/clients/operator_dashboard_snapshot_v1.json`
   - Runtime trigger: promotion runner import or manual execution
   - Status: active
   - Proof: reads client registry and writes dashboard snapshot.

### Dashboard is read-only downstream

- `staffordos/ui/operator-frontend/lib/operator/loadDashboardSnapshot.ts` reads the snapshot only.
- `staffordos/ui/operator-frontend/lib/operator/loadPrimaryActionSnapshot.ts` reads the CEO snapshot and dashboard snapshot only.

## 6. CEO cockpit truth write map

### Direct writer

1. `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts`
   - Function: `GET`
   - Input source: lead registry, client registry, dashboard snapshot, send ledger
   - Output target: HTTP JSON response only
   - Runtime trigger: request to `/api/operator/ceo-snapshot`
   - Status: active
   - Proof: code aggregates read-only truth files and returns next-best-action.

### CEO cockpit display

- `staffordos/ui/operator-frontend/lib/operator/loadPrimaryActionSnapshot.ts`
  - Reads CEO snapshot and local truth files.
  - Generates Ross-facing primary action state.
- `staffordos/ui/operator-frontend/app/operator/command-center/page.tsx`
  - Renders the cockpit surface.

### CEO cockpit does not ingest packet payment truth directly

- No inspected runtime code reads packet rows directly in the CEO snapshot route.
- The cockpit is downstream of client/dashboard summaries.

## 7. Existing propagation mechanisms

There is one real propagation mechanism in the repo:

`lead_registry_v1.json -> promote_leads_to_clients_v1.mjs -> client_registry_v1.json -> build_operator_dashboard_snapshot_v1.mjs -> operator_dashboard_snapshot_v1.json -> ceo-snapshot -> Command Center`

That mechanism is active and proven for lead/client summary propagation.

There is also a separate packet/payment path:

`checkout-public.js -> stripeWebhook.esm.js -> packet table`

That mechanism is active and proven for packet payment truth.

They are not connected to each other.

## 8. Missing propagation mechanisms

Missing:

- packet payment truth -> client registry payment status
- packet payment truth -> revenue truth
- packet payment truth -> dashboard snapshot
- packet payment truth -> CEO cockpit truth
- packet payment truth -> command center primary action

## 9. Exact terminal truth boundary

The terminal truth boundary for verified Stripe payment is the packet table updated by `bindPacketPayment(...)`.

After that boundary:

- no inspected runtime writer updates client registry from Stripe payment
- no inspected runtime writer updates revenue truth from Stripe payment
- no inspected runtime writer rebuilds the dashboard from Stripe payment
- no inspected runtime writer pushes payment truth into the CEO cockpit

## 10. Single highest-value integration repair

The highest-value integration gap is the missing writer that turns verified packet payment into client registry truth.

Without that, the payment event cannot become operator truth, revenue truth, or cockpit truth.

## 11. Whether new implementation work should remain blocked

Yes.

The packet boundary is still terminal for verified Stripe payment.
Until a runtime writer proves propagation beyond the packet table, new product work should remain blocked.
