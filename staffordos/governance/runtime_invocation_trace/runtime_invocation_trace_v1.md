# Runtime Invocation Trace v1

## Executive Summary

The active runtime path in StaffordOS reaches `staffordos/revenue/revenue_agent_v1.mjs` and `staffordos/clients/build_operator_dashboard_snapshot_v1.mjs`, but it does **not** reach `staffordos/clients/next_action_engine_v1.mjs` or `staffordos/clients/close_engine_v1.mjs`.

The proven live chain is:

`web/src/index.js` -> `installStripeWebhook()` -> `web/src/routes/stripeWebhook.esm.js` -> `recordStripePaymentPropagation()` -> `staffordos/revenue/revenue_agent_v1.mjs` -> `recordVerifiedStripePayment()` -> `staffordos/clients/client_registry_v1.json` -> `buildOperatorDashboardSnapshot()` -> `staffordos/clients/operator_dashboard_snapshot_v1.json`

`staffordos/operator_daemon/persistent_operator_v1.mjs` is also active and calls `staffordos/agents/system_truth_sync_agent_v1.mjs`, which shells into `node staffordos/agents/run_agent_v1.mjs revenue_agent_v1`, so `revenue_agent_v1` is not just a static reference.

The fulfillment lifecycle engines (`next_action_engine_v1.mjs`, `close_engine_v1.mjs`) remain referenceable code, but there is no proven live entrypoint invoking them.

## Runtime Invocation Matrix

| Target file | Invoker | Invocation type | Execution trigger | Active today | Classification | Evidence |
|---|---|---:|---|---|---|---|
| `staffordos/revenue/revenue_agent_v1.mjs` | `web/src/routes/stripeWebhook.esm.js` | Direct import + function call | Verified Stripe `checkout.session.completed` event | Yes | PROVEN | `stripeWebhook.esm.js:4`, `stripeWebhook.esm.js:80-85`, `revenue_agent_v1.mjs:196-225` |
| `staffordos/revenue/revenue_agent_v1.mjs` | `staffordos/agents/system_truth_sync_agent_v1.mjs` via `run_agent_v1.mjs` | CLI-driven indirect execution | Persistent operator runtime sync loop | Yes | PROVEN | `system_truth_sync_agent_v1.mjs:24-25`, `persistent_operator_v1.mjs:86-90`, `run_agent_v1.mjs:96-118` |
| `staffordos/clients/build_operator_dashboard_snapshot_v1.mjs` | `staffordos/revenue/revenue_agent_v1.mjs` | Direct function call | Verified Stripe payment propagation | Yes | PROVEN | `revenue_agent_v1.mjs:4-5`, `revenue_agent_v1.mjs:214-219` |
| `staffordos/clients/build_operator_dashboard_snapshot_v1.mjs` | `staffordos/clients/promote_leads_to_clients_v1.mjs` | Dynamic import / side-effect run | Manual promotion runner execution | Not proven active | PARTIALLY_PROVEN | `promote_leads_to_clients_v1.mjs:307`, `build_operator_dashboard_snapshot_v1.mjs:163-170` |
| `staffordos/clients/promote_leads_to_clients_v1.mjs` | None found in active runtime entrypoints | Standalone CLI/script | Manual execution only | Not proven active | UNPROVEN | No mapping in `package.json`, `task_command_resolver_v1.mjs`, or `persistent_operator_v1.mjs` |
| `staffordos/clients/next_action_engine_v1.mjs` | None found in active runtime entrypoints | Standalone CLI/script | No active runtime trigger proven | No | DEAD_CODE | `persistent_operator_v1.mjs`, `task_command_resolver_v1.mjs`, and repo-wide search found no live caller |
| `staffordos/clients/close_engine_v1.mjs` | None found in active runtime entrypoints | Standalone CLI/script | No active runtime trigger proven | No | DEAD_CODE | Repo-wide search found only self-contained code and audit references |

## Active Runtime Entrypoints

1. `web/src/index.js`
   - Mounts the Stripe webhook route.
   - Directly enables the verified payment propagation path.

2. `staffordos/operator_daemon/persistent_operator_v1.mjs`
   - Runs the runtime loop.
   - Calls `staffordos/agents/system_truth_sync_agent_v1.mjs` during each loop.

3. `staffordos/agents/system_truth_sync_agent_v1.mjs`
   - Shells into `node staffordos/agents/run_agent_v1.mjs revenue_agent_v1`.
   - Reaches `staffordos/revenue/revenue_agent_v1.mjs` through the agent runner.

4. `web/src/routes/stripeWebhook.esm.js`
   - Receives verified Stripe webhook events.
   - Calls the StaffordOS payment propagation orchestrator.

## Manual-Only Entrypoints

- `staffordos/clients/promote_leads_to_clients_v1.mjs`
  - Standalone promotion script.
  - No active runtime caller was found.

- `staffordos/clients/build_operator_dashboard_snapshot_v1.mjs`
  - Direct-run capable script.
  - Also called from active runtime through `revenue_agent_v1.mjs`.

- `staffordos/clients/next_action_engine_v1.mjs`
  - Direct-run capable script.
  - No live caller found.

- `staffordos/clients/close_engine_v1.mjs`
  - Direct-run capable script.
  - No live caller found.

## Scheduled Entrypoints

No scheduled invocation of `next_action_engine_v1.mjs`, `close_engine_v1.mjs`, `promote_leads_to_clients_v1.mjs`, `build_operator_dashboard_snapshot_v1.mjs`, or `revenue_agent_v1.mjs` was proven from the inspected runtime paths.

## Webhook Entrypoints

- `web/src/index.js` -> `installStripeWebhook(app)`
- `web/src/routes/stripeWebhook.esm.js`
  - Verifies Stripe signature.
  - On `checkout.session.completed`, calls `bindPacketPayment(...)` and `recordStripePaymentPropagation(...)`.
  - That makes `revenue_agent_v1.mjs` part of the live payment propagation chain.

## API Entrypoints

- `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts`
- `staffordos/ui/operator-frontend/app/api/operator/client-registry/route.ts`

These are live read paths for cockpit surfaces, but they are not writers for the five target modules.

## Dead Code Candidates

1. `staffordos/clients/next_action_engine_v1.mjs`
   - Code exists and mutates the registry.
   - No active runtime caller found.
   - Runtime automation for `deal_won -> fix_in_progress -> fix_completed` is therefore disconnected.

2. `staffordos/clients/close_engine_v1.mjs`
   - Code exists and mutates the registry.
   - No active runtime caller found.

## Lifecycle Engine Invocation Status

- `next_action_engine_v1.mjs`: **DISCONNECTED**
- `close_engine_v1.mjs`: **DISCONNECTED**
- `promote_leads_to_clients_v1.mjs`: **MANUAL-ONLY / UNPROVEN as active runtime**
- `build_operator_dashboard_snapshot_v1.mjs`: **PROVEN through revenue propagation; manual-only direct-run also exists**
- `revenue_agent_v1.mjs`: **PROVEN**

## Fulfillment Engine Invocation Status

The fulfillment engines are not running through a proven live runtime caller.

`next_action_engine_v1.mjs` contains the fulfillment stage logic in code, but no active runtime path invokes it. That means the `deal_won -> fix_in_progress -> fix_completed` boundary remains unautomated in live runtime.

## Direct Answers

- Does anything invoke `next_action_engine_v1.mjs` today? **No proven active runtime invocation found.**
- Does anything invoke `close_engine_v1.mjs` today? **No proven active runtime invocation found.**
- Is lifecycle automation active? **Only for the verified payment/revenue path, not for fulfillment transitions.**
- Is fulfillment automation active? **No.**
- What is the first missing runtime invocation in the `Deal Won -> Fix In Progress` chain? **A live runtime caller that resolves to `node staffordos/clients/next_action_engine_v1.mjs`.**

## Single Highest-Risk Invocation Gap

`next_action_engine_v1.mjs` can mutate `client_registry_v1.json` and contains the `deal_won -> fix_in_progress -> fix_completed` logic, but no active runtime entrypoint invokes it.

## Single Highest-Value Runtime Repair Candidate

Make the fulfillment transition engine reachable from an active runtime entrypoint.

## Explicit Warning If Lifecycle Automation Is Not Actually Running

Fulfillment automation is not actually running through a proven live caller. The code exists, but the live invocation chain stops before the fulfillment engines.

