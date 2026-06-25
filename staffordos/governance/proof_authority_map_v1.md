# Proof Authority Map v1

Read-only companion to [`staffordos/governance/proof_authority_map_v1.json`](./proof_authority_map_v1.json).

Generated: 2026-06-13

## Summary

StaffordOS does not currently have a single canonical proof store. Proof evidence is split across:
- operator action logs
- lead send ledgers
- proof-run markdown artifacts
- Abando live-test proof outputs
- execution/outcome truth targets

That split is why Revenue Execution Bridge v2 should not patch snapshots, should not self-call HTTP, and should only write proof into a single reservation-aware append-only store.

## Canonical StaffordOS proof authority

`proof_authority_v1` should be:
- append-only
- reservation-aware
- idempotent
- relationship-bound
- action-bound
- campaign-aware
- free of snapshot patching
- free of projections
- free of UI writes

### Canonical event types
- `reservation_created`
- `reservation_confirmed`
- `send_attempted`
- `send_succeeded`
- `send_failed`
- `payment_received`
- `fulfillment_started`
- `fulfillment_completed`

### Intended shape
```json
{
  "reservation_id": "",
  "action_id": "",
  "relationship_id": "",
  "campaign_id": "",
  "action_type": "",
  "event_type": "",
  "artifact_hash": "",
  "decision_engine_hash": "",
  "timestamp": "",
  "status": "",
  "proof": {}
}
```

## Current proof-writing locations

### 1. Operator execution log and outcome log
- File: `staffordos/ui/operator-frontend/app/api/operator/execute-primary-action/route.ts`
- Current behavior:
  - appends `operator_action_events_v1.json`
  - appends `outcome_event_log_v1.json`
  - patches `primary_action_snapshot_v1.json`
  - patches `ceo_truth_snapshot_v1.json`
- Governance status: `PARTIALLY_GOVERNED`
- Why it is not canonical:
  - it mixes proof capture with presentation snapshot patching
  - it truncates history
  - it is not reservation aware

### 2. Lead send proof path
- File: `staffordos/ui/operator-frontend/app/api/operator/lead-registry/action/route.ts`
- Current behavior:
  - mutates lead registry
  - writes `send_ledger_v1.json`
  - writes `send_execution_log_v1.json`
  - writes `lead_events_v1.json`
- Governance status: `GOVERNED` for lead mutation, `PARTIALLY_GOVERNED` for proof capture
- Why it is not canonical:
  - send proof is still tied to lead-state mutation
  - dry-run proof is recorded as if it were execution history

### 3. ShopiFixer proof-run markdown artifacts
- Writers:
  - `writeShopifixerBeforeEvidence`
  - `writeShopifixerScopedFix`
  - `writeShopifixerAfterEvidence`
  - `writeShopifixerProofPackage`
- Output files:
  - `staffordos/proof_runs/internal_shopifixer_dry_run_v1/before_evidence.md`
  - `staffordos/proof_runs/internal_shopifixer_dry_run_v1/fix_scope.md`
  - `staffordos/proof_runs/internal_shopifixer_dry_run_v1/after_evidence.md`
  - `staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.md`
- Governance status: `PARTIALLY_GOVERNED`
- Why it is not canonical:
  - these are presentation artifacts, not proof events
  - they are overwritten, not append-only

### 4. ShopiFixer completion writer
- File: `staffordos/ui/operator-frontend/lib/operator/writeShopifixerCompletion.ts`
- Current behavior:
  - writes fulfillment truth
  - triggers lifecycle rebuild
- Governance status: `PARTIALLY_GOVERNED`
- Why it is not canonical:
  - proof completion is mixed with truth mutation
  - no proof reservation or idempotency boundary exists

### 5. Abando live-test proof artifacts
- File: `web/src/routes/recoveryLiveTest.esm.js`
- Current behavior:
  - writes `staffordos/system_inventory/output/proof_runs/latest_abando_live_test_proof.json`
  - calls `recordAbandoRealSendProof`
- Governance status: `PARTIALLY_GOVERNED`
- Why it is not canonical:
  - proof is split across a live-test artifact and a proof register
  - it is outside the StaffordOS canonical execution/outcome truth boundary

### 6. Abando proof register and proof log
- File: `web/src/lib/staffordosProofRegister.js`
- Current behavior:
  - writes `execution_proof_register_v1.json`
  - writes `abando_real_send_proof_log_v1.json`
- Governance status: `PARTIALLY_GOVERNED`
- Why it is not canonical:
  - it is a separate proof island
  - it is not relationship/action/campaign reservation-aware

### 7. Canonical proof target files
- Files:
  - `staffordos/execution/execution_log_v1.json`
  - `staffordos/execution/outcome_events_v1.json`
- Current repo state:
  - they are read by resolvers and validators
  - no active writer was found in the current tree
- Governance status: `READ_ONLY` in the current codebase
- Design status: `canonical targets`
- Replacement plan:
  - derive these from `proof_authority_v1`
  - stop writing proof into UI snapshots, dry-run ledgers, or presentation artifacts

## Replacement plan

1. Introduce one append-only proof store.
2. Emit reservation events before any external side effect.
3. Confirm by reservation id only.
4. Append proof events only after real send/payment/fulfillment transitions.
5. Derive execution/outcome/revenue/fulfillment views from the proof store.
6. Retire snapshot patching from proof capture.

## If StaffordOS had exactly one proof store

Every authority would write into the same proof authority stream:

- Send authority:
  - `reservation_created`
  - `send_attempted`
  - `send_succeeded`
  - `send_failed`
- Payment authority:
  - `payment_received`
- Fulfillment authority:
  - `fulfillment_started`
  - `fulfillment_completed`
- Operator authority:
  - `reservation_created`
  - `reservation_confirmed`
- Campaign authority:
  - proof events would carry `campaign_id` so campaign membership is preserved

Every resolver would read that same proof store first, then derive:
- execution truth
- outcome truth
- relationship 360
- campaign rollups
- revenue truth
- fulfillment truth
- action candidates
- decision engine outputs

The key constraint is that the proof store would be the evidence layer, not a presentation layer. No resolver should read a patched snapshot as if it were proof.

