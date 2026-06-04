# Payment Authority Review v1

## A. Who should own payment propagation?

`staffordos/revenue/revenue_agent_v1.mjs` should own verified Stripe payment propagation as the StaffordOS propagation orchestrator.

## B. Why?

Because the verified payment event must propagate across multiple StaffordOS-owned truth files:

- `staffordos/clients/client_registry_v1.json`
- `staffordos/revenue/revenue_truth_v1.json`
- `staffordos/clients/operator_dashboard_snapshot_v1.json`

That makes payment propagation a cross-system StaffordOS concern, not a web-route concern and not a single registry concern.

Current implementation already matches that structure:

- `web/src/routes/stripeWebhook.esm.js` verifies the Stripe signature and binds packet payment.
- `staffordos/revenue/revenue_agent_v1.mjs` owns `recordStripePaymentPropagation(...)`.
- `staffordos/clients/client_registry_v1.mjs` owns client registry mutation.
- `staffordos/clients/build_operator_dashboard_snapshot_v1.mjs` owns dashboard snapshot rebuild.

## C. What authority rule supports that ownership?

The governing rule is that the web runtime must stay thin and StaffordOS-owned modules must own governed truth propagation.

Supporting authority:

- `staffordos/authority/output/current_north_star_v1.md`
  - payment -> execution -> proof is the current phase
- `staffordos/authority/output/staffordos_business_core_definition_of_done_v1.md`
  - payment is verified through the packet path
  - CEO Cockpit binds existing truth sources
- `staffordos/authority/output/revenue_success_gate_v1.md`
  - cockpit and revenue truth must be backed by real sources
- `staffordos/authority/output/s2g_packet_binding_readiness_v1.md`
  - checkout binds packet identity through `client_reference_id` and `metadata.packet_id`
  - verified webhook moves packet to `payment_received`

The authority boundary is:

- `web/src/routes/stripeWebhook.esm.js` verifies and dispatches
- StaffordOS modules own the propagation writes

## D. Is the current implementation aligned with StaffordOS governance?

Yes.

The current implementation is aligned because:

- the webhook no longer directly writes `staffordos/revenue/revenue_truth_v1.json`
- the webhook does not own the propagation chain
- a governed StaffordOS module owns the propagation function
- client registry, revenue truth, and dashboard snapshot are written by StaffordOS modules, not the web route

## E. If not, what specific authority violation remains?

None in the current chain.

The prior violation was direct revenue-truth writing from `web/src/routes/stripeWebhook.esm.js`. That violation has been removed.

## File classification

### 1. `web/src/routes/stripeWebhook.esm.js`

- Authority Owner: Stripe webhook ingress only
- Runtime Writer: yes, for packet payment state only
- Runtime Reader: yes, Stripe event/session and packet lookup
- Derived Truth: no
- Source Of Truth: no
- Orchestrator: yes
- Utility: no
- Role in chain: ingress verifier and dispatcher

### 2. `web/src/lib/packetRepository.js`

- Authority Owner: packet lifecycle storage
- Runtime Writer: yes
- Runtime Reader: yes
- Derived Truth: no
- Source Of Truth: yes, for packet records
- Orchestrator: no
- Utility: yes
- Role in chain: packet state writer

### 3. `staffordos/revenue/revenue_agent_v1.mjs`

- Authority Owner: yes, for the propagation orchestration boundary
- Runtime Writer: yes
- Runtime Reader: yes
- Derived Truth: yes, for revenue truth
- Source Of Truth: no
- Orchestrator: yes
- Utility: no
- Role in chain: canonical payment propagation orchestrator

### 4. `staffordos/clients/client_registry_v1.mjs`

- Authority Owner: client registry authority
- Runtime Writer: yes
- Runtime Reader: yes
- Derived Truth: partly, via registry records
- Source Of Truth: yes, for client registry
- Orchestrator: no
- Utility: no
- Role in chain: client record writer

### 5. `staffordos/clients/build_operator_dashboard_snapshot_v1.mjs`

- Authority Owner: dashboard snapshot builder
- Runtime Writer: yes
- Runtime Reader: yes
- Derived Truth: yes
- Source Of Truth: no
- Orchestrator: no
- Utility: yes
- Role in chain: dashboard truth builder

### 6. `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts`

- Authority Owner: operator read surface
- Runtime Writer: no
- Runtime Reader: yes
- Derived Truth: yes
- Source Of Truth: no
- Orchestrator: no
- Utility: no
- Role in chain: cockpit API reader

### 7. `staffordos/ui/operator-frontend/app/api/operator/client-registry/route.ts`

- Authority Owner: operator read surface
- Runtime Writer: no
- Runtime Reader: yes
- Derived Truth: yes
- Source Of Truth: no
- Orchestrator: no
- Utility: no
- Role in chain: client registry API reader

## Current alignment summary

The implementation is governed if `recordStripePaymentPropagation(...)` remains in `staffordos/revenue/revenue_agent_v1.mjs` and the webhook stays thin.

That is the correct ownership boundary for the current StaffordOS phase.
