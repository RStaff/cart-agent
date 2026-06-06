# Operator Action Authority Audit v1

## Executive Summary
StaffordOS can already generate a single canonical primary action from runtime truth.

It can also expose top-ranked lead and conversion candidates in the CEO snapshot.

What it does not yet have is a single canonical top-5 Ross action list that is itself the authority source. Today, top-5 actions are derivable from existing runtime truth, but they are not yet one governed action artifact.

## Existing Decision / Action Engines

### `staffordos/decision/resolve_primary_action_v1.mjs`
- Primary role: compute the canonical single next action for Ross.
- Reads: unit work, dashboard snapshot, client registry, confidence gate, UX integrity findings.
- Writes: `staffordos/snapshots/primary_action_snapshot_v1.json`.
- Status: active and runtime-proven.

### `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts`
- Primary role: aggregate read-only runtime truth into a CEO snapshot.
- Exposes:
  - revenue summary
  - acquisition summary
  - conversion summary
  - fulfillment summary
  - merchant success summary
  - executive control summary
  - `next_best_action`
- Also exposes top-5 candidate lists via:
  - `acquisition.priority_leads`
  - `conversion.closest_to_payment`
- Status: active and runtime-proven as a reader/aggregator, not a writer.

### `staffordos/ui/operator-frontend/lib/operator/loadPrimaryActionSnapshot.ts`
- Primary role: load the CEO snapshot and synthesize a Ross-facing primary action snapshot.
- Status: active reader.

### `staffordos/operator_daemon/persistent_operator_v1.mjs`
- Primary role: persistent operational loop.
- Runs `resolve_primary_action_v1.mjs` and `system_truth_sync_agent_v1.mjs`.
- Status: active orchestrator.

### `staffordos/ui/operator-frontend/app/api/operator/execute-primary-action/route.ts`
- Primary role: log operator action execution and trigger the execution spine.
- Writes action/outcome logs.
- Status: active execution logger, not the canonical recommendation engine.

### `staffordos/revenue/revenue_agent_v1.mjs`
- Primary role: revenue truth propagation and dashboard rebuild after verified payment.
- Status: active runtime writer.

### `staffordos/clients/next_action_engine_v1.mjs`
- Primary role: lifecycle transition engine for client truth.
- It is not the primary operator action recommendation engine.
- Status: active runtime writer after resolver binding, but not the canonical Ross action engine.

## Operator Action Authority Conclusion

StaffordOS can already generate:

- one canonical primary action
- a list of top lead candidates
- a list of closest-to-payment conversion candidates

But it cannot yet claim that it has a single governed "Top 5 Actions Ross Should Take" authority artifact.

The current action authority is therefore **partial**:

- top-1 is authoritative
- top-5 is derivable from runtime truth
- top-5 is not yet a canonical governed artifact

## Action Authority Gap

The missing layer is a single CEO action snapshot that merges:

- `primary_action_snapshot_v1.json`
- `ceo-snapshot`
- `unit_work_snapshot_v1.json`
- `client_registry_v1.json`
- `lead_registry_v1.json`

into one authoritative, ranked action surface.
