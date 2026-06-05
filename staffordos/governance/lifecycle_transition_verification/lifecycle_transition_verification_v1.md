# Lifecycle Transition Verification v1

## Executive Summary

The verified Stripe payment path can persist a client from `proposal_sent` to `deal_won` without manual registry editing.

The actual persisted transition happens in `staffordos/clients/client_registry_v1.mjs` through `recordVerifiedStripePayment(...)`, which is called by `staffordos/revenue/revenue_agent_v1.mjs` from the verified webhook propagation path.

`staffordos/clients/next_action_engine_v1.mjs` is also a writer, but it is not currently proven to be executed by a live runtime process in this repository. The code exists and mutates `client_registry_v1.json`, but no active caller was found in the current runtime chain.

## 1. What file writes `deal.payment_status = "paid"`

### Result

`staffordos/clients/client_registry_v1.mjs`

### Evidence

- `recordVerifiedStripePayment(...)` calls `upsertClient(...)`.
- `upsertClient(...)` persists `deal.payment_status: "paid"` when invoked by the Stripe propagation path.

### Classification

- `staffordos/clients/client_registry_v1.mjs`: **PROVEN**

## 2. What runtime process executes `next_action_engine_v1.mjs`

### Result

No current live runtime process was found that executes `staffordos/clients/next_action_engine_v1.mjs`.

### Evidence

- The file is a standalone script that ends with `run();`.
- Repository search found references in governance inventories and router binding plans.
- No active runtime caller was found in the current execution chain.

### Classification

- `staffordos/clients/next_action_engine_v1.mjs` execution wiring: **BROKEN**

## 3. Whether `next_action_engine_v1.mjs` mutates `client_registry_v1.json` or only computes state

### Result

It mutates `client_registry_v1.json`.

### Evidence

- Reads `staffordos/clients/client_registry_v1.json`.
- Rewrites every client record in memory.
- Writes the full registry back with `writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2) + "\n")`.

### Classification

- **PROVEN**

## 4. Whether any runtime writer persists `lifecycle.stage = "deal_won"`

### Result

Yes.

### Evidence

- `staffordos/clients/client_registry_v1.mjs` sets:
  - `lifecycle.stage: "deal_won"`
  - `deal.payment_status: "paid"`
  - `next_action.type: "fix"`
- That mutation is reached through the verified Stripe payment propagation path.
- `staffordos/clients/next_action_engine_v1.mjs` also contains a `deal_won` transition branch, but it is not the only writer.

### Classification

- `staffordos/clients/client_registry_v1.mjs`: **PROVEN**
- `staffordos/clients/next_action_engine_v1.mjs`: **PROVEN as code, BROKEN as runtime wiring**

## 5. Whether a verified Stripe payment can currently produce a persisted `deal_won` client record without manual intervention

### Result

Yes, by the verified webhook propagation path.

### Exact writer chain

1. `web/src/routes/stripeWebhook.esm.js`
2. `web/src/lib/packetRepository.js` via `bindPacketPayment(...)`
3. `staffordos/revenue/revenue_agent_v1.mjs` via `recordStripePaymentPropagation(...)`
4. `staffordos/clients/client_registry_v1.mjs` via `recordVerifiedStripePayment(...)`
5. `staffordos/clients/build_operator_dashboard_snapshot_v1.mjs`

### First runtime location where `proposal_sent` becomes `deal_won`

`staffordos/clients/client_registry_v1.mjs` inside `recordVerifiedStripePayment(...)`, which is reached from `staffordos/revenue/revenue_agent_v1.mjs`.

### First runtime location where truth stops

No stop was proven in the verified payment chain. The chain continues into client registry, revenue truth, and dashboard snapshot writes.

The separate `next_action_engine_v1.mjs` path does not appear to be wired into a live runtime caller, so that path is currently the boundary where a potential alternate transition flow stops.

### Classification

- Verified Stripe payment can produce persisted `deal_won`: **PROVEN**

## Exact reader chain

### Packet/payment readers

- `web/src/routes/stripeWebhook.esm.js` reads Stripe event data and packet records.
- `staffordos/revenue/revenue_agent_v1.mjs` reads packet/session data from the webhook handoff.

### Client readers

- `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts`
- `staffordos/ui/operator-frontend/app/api/operator/client-registry/route.ts`

### Runtime status

These readers are aligned with the persisted client state and dashboard snapshot after the webhook propagation path runs.

## Lifecycle authority owner

The lifecycle authority owner for the `proposal_sent -> deal_won` payment transition is:

- `staffordos/clients/client_registry_v1.mjs`
- orchestrated by `staffordos/revenue/revenue_agent_v1.mjs`

The webhook remains the ingress verifier only.

## Exact runtime path required

For a real Stripe payment to move the merchant from `proposal_sent` to `deal_won`, the current runtime path is:

1. Verified Stripe `checkout.session.completed`
2. `web/src/routes/stripeWebhook.esm.js`
3. `bindPacketPayment(...)`
4. `recordStripePaymentPropagation(...)`
5. `recordVerifiedStripePayment(...)`
6. `upsertClient(...)`
7. `deal.payment_status = "paid"`
8. `lifecycle.stage = "deal_won"`

## Single highest-risk remaining gap

The standalone decision engine `staffordos/clients/next_action_engine_v1.mjs` mutates the client registry, but no live runtime caller was found for it. That means there is an alternate lifecycle-writer path in code that is not proven to be operational.

## Single next verifiable question

Does any active runtime entrypoint in this repository invoke `staffordos/clients/next_action_engine_v1.mjs`, or is it only a standalone script and inventory reference?

## Final verdict

Can a real Stripe payment currently produce a persisted `deal_won` lifecycle state?

YES
