# Fulfillment Execution Authority Discovery v1

## 1. Executive Summary

There is **no proven live fulfillment execution authority** in StaffordOS today.

The best existing runtime candidate for initiating fulfillment after `lifecycle.stage = deal_won` is `staffordos/revenue/revenue_agent_v1.mjs`, because it is already a live commercial orchestrator:

- invoked by the verified Stripe webhook path
- invoked by the runtime sync agent
- writes client registry truth
- rebuilds revenue truth
- rebuilds the operator dashboard snapshot

However, it is still **not** a proven fulfillment engine. It owns payment propagation and commercial truth propagation, not the full `deal_won -> fix_in_progress -> QA -> proof package -> fix_completed -> review/referral readiness` chain.

The live runtime entries that are actually executing today are the webhook/revenue path and the daemon/sync loop around it. The packet execution / fulfillment code exists, but it is not yet wired as a proven live runtime owner.

## 2. Active Runtime Entry Points

| File | Runtime classification | Evidence | Active today |
|---|---|---|---|
| `web/src/index.js` | `ACTIVE_RUNTIME_OWNER` | mounts `installStripeWebhook(app)` | Yes, as the live web server bootstrap |
| `web/src/routes/stripeWebhook.esm.js` | `PACKET_ORCHESTRATOR` / `ACTIVE_RUNTIME_OWNER` for payment | verified Stripe webhook path; calls `recordStripePaymentPropagation(...)` | Yes, on Stripe event delivery |
| `staffordos/operator_daemon/persistent_operator_v1.mjs` | `DAEMON` | recent heartbeat artifact exists; runs loop and runtime sync stages | Yes, recent execution proven |
| `staffordos/operator_daemon/task_command_resolver_v1.mjs` | `SCHEDULER` | selected by persistent operator to resolve a task command | Yes, as a live helper in the daemon path |
| `staffordos/agents/system_truth_sync_agent_v1.mjs` | `ACTIVE_RUNTIME_WORKER` | shells into `node staffordos/agents/run_agent_v1.mjs revenue_agent_v1` | Yes, via persistent operator runtime sync |
| `staffordos/agents/run_agent_v1.mjs` | `QUEUE_PROCESSOR` / agent runner | spawns registered agents, logs execution | Yes, invoked by system truth sync |
| `staffordos/revenue/revenue_agent_v1.mjs` | `ACTIVE_RUNTIME_OWNER` / `REGISTRY_WRITER` | called by webhook path and runtime sync path; writes client registry, revenue truth, dashboard snapshot | Yes |
| `staffordos/clients/build_operator_dashboard_snapshot_v1.mjs` | `REGISTRY_WRITER` | called by revenue propagation; writes operator dashboard snapshot | Yes, through revenue_agent |
| `staffordos/clients/client_registry_v1.mjs` | `REGISTRY_WRITER` | owns registry persistence and verified payment writeback | Yes, through revenue propagation |
| `staffordos/clients/next_action_engine_v1.mjs` | `DEAD_CODE` | standalone executable, but no proven active runtime caller | No proven active caller |
| `staffordos/clients/close_engine_v1.mjs` | `DEAD_CODE` | standalone executable, but no proven active runtime caller | No proven active caller |

## 3. Runtime Ownership Matrix

| Component | Classification | Runtime evidence | Ownership fit |
|---|---|---|---|
| `staffordos/revenue/revenue_agent_v1.mjs` | `ACTIVE_RUNTIME_OWNER`, `REGISTRY_WRITER` | verified webhook path and runtime sync path both invoke it | Best current commercial owner; closest active component to fulfillment handoff |
| `staffordos/operator_daemon/persistent_operator_v1.mjs` | `DAEMON`, `ACTIVE_RUNTIME_WORKER` | heartbeat artifact and loop stages exist | Good top-level runtime control, but too generic for fulfillment ownership |
| `staffordos/agents/system_truth_sync_agent_v1.mjs` | `ACTIVE_RUNTIME_WORKER` | called by persistent operator; invokes revenue agent | Good bridge into revenue truth, but indirect for fulfillment ownership |
| `staffordos/operator_daemon/task_command_resolver_v1.mjs` | `SCHEDULER` | live in daemon path | Routing only, not fulfillment ownership |
| `staffordos/agents/run_agent_v1.mjs` | `QUEUE_PROCESSOR` | live agent launcher and log writer | Execution wrapper only |
| `staffordos/optimization/processOpportunity.js` | `PACKET_ORCHESTRATOR` | packet creation code exists | Not a live runtime owner in current chain |
| `staffordos/optimization/operatorReviewQueue.js` | `PACKET_ORCHESTRATOR` / queue utility | packet review/update logic exists | Not a live runtime owner in current chain |
| `staffordos/clients/next_action_engine_v1.mjs` | `DEAD_CODE` candidate / `REGISTRY_WRITER` | lifecycle logic exists, but no live caller | Not canonical fulfillment authority |
| `staffordos/clients/close_engine_v1.mjs` | `DEAD_CODE` candidate / `REGISTRY_WRITER` | follow-up logic exists, but no live caller | Not canonical fulfillment authority |
| `staffordos/units/lock_schema_foundation_v1.mjs` | `SUPPORTING_UTILITY` | delivery/issue/action units modeled | Authority-supporting model only |
| `CEO Cockpit / dashboard readers` | `UI_READER` | read client registry and dashboard snapshot | Read-only surface |

## 4. Fulfillment Ownership Candidates

### Rank 1: `staffordos/revenue/revenue_agent_v1.mjs`

- **Authority support:** strongest among active runtime code because it already owns verified Stripe payment propagation into client registry, revenue truth, and dashboard snapshot
- **Runtime evidence:** invoked by `web/src/routes/stripeWebhook.esm.js` and by `system_truth_sync_agent_v1.mjs`
- **Ownership fit:** highest among active runtime components because it is already the live commercial truth orchestrator
- **Governance risk:** medium; the agent already spans multiple governed truth updates, so extending responsibility must stay narrow
- **Implementation risk:** medium; it is active, but it is not currently a fulfillment engine

### Rank 2: `staffordos/operator_daemon/persistent_operator_v1.mjs`

- **Authority support:** strong operator-control authority
- **Runtime evidence:** recent heartbeat and loop stages prove it executes
- **Ownership fit:** moderate; it is the top-level daemon, but it is not business-event specific
- **Governance risk:** medium-high; broad loop owner can become mixed-scope easily
- **Implementation risk:** medium; it can orchestrate more, but it is too generic to be the first fulfillment owner

### Rank 3: `staffordos/agents/system_truth_sync_agent_v1.mjs`

- **Authority support:** moderate; system truth sync is part of runtime truth maintenance
- **Runtime evidence:** persistent operator invokes it, and it invokes revenue_agent
- **Ownership fit:** moderate-low; it is a sync bridge, not a fulfillment authority
- **Governance risk:** medium; easy to conflate truth sync with business execution
- **Implementation risk:** medium; small reach, but indirect for fulfillment

## 5. Candidate Ranking

1. `staffordos/revenue/revenue_agent_v1.mjs`
2. `staffordos/operator_daemon/persistent_operator_v1.mjs`
3. `staffordos/agents/system_truth_sync_agent_v1.mjs`

## 6. Direct Answer: Canonical Fulfillment Authority

There is **no canonical fulfillment authority already proven** in the current runtime.

If the repo must choose the best existing runtime candidate, it is:

`staffordos/revenue/revenue_agent_v1.mjs`

That is the least-wrong existing active runtime owner for initiating the first fulfillment hop after `deal_won`, but it is still not proven as the full fulfillment authority.

## 7. Direct Answer: Smallest Governed Repair

The smallest governed repair is to attach fulfillment initiation to the **already-active commercial propagation path** rooted at `staffordos/revenue/revenue_agent_v1.mjs`, because it is the first live runtime component that already sees verified payment truth, updates the client registry, and refreshes revenue/dashboard truth.

This is smaller and safer than inventing a new orchestrator.

## 8. Governance Risks

- Treating `next_action_engine_v1.mjs` as canonical fulfillment authority would overstate runtime truth.
- Treating packet templates or unit models as active fulfillment runtime would confuse data models with execution authority.
- Treating the daemon loop as fulfillment owner would widen scope beyond business truth.
- Creating a new orchestrator before using the existing active commercial orchestrator would violate the current governance preference for reuse.

## 9. Explicit Warning If Fulfillment Execution Is Still Unsafe

Fulfillment execution is still **unsafe to claim as active**.

The repo proves payment propagation and deal won persistence, but it does **not** yet prove a live runtime owner for the full fulfillment chain.

