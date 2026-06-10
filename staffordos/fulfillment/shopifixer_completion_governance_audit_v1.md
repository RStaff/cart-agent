# ShopiFixer Completion Governance Audit

## Exact authority
The governing truth for completion is `staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json`.
The proof gate is the merchant proof package at `staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.md`.
`staffordos/merchant_registry/merchant_lifecycle_registry_v1.json` is the derived read model, not the write authority.

## What may be updated
Only the fulfillment truth file may be updated for the completion transition.
The smallest safe writeback is to mark the active fulfillment item complete, record the completion timestamp, and point at the proof package location.

## What must never be updated
Do not mutate client registry truth, revenue truth, checkout, Stripe, or the merchant lifecycle registry directly as part of completion.
Those are either source truth in another domain or a derived read model.

## Allowed lifecycle changes
Completion may advance the fulfillment item from proof-ready / in-progress into completion markers:
- `proof_package_status`
- `proof_status`
- `execution_status`
- `completion_status`
- `completed_at`
- optional review / referral / case-study readiness flags only if they are independently proven

## Required proof before completion
Completion is only allowed after the proof chain exists:
- `before_evidence.md`
- `fix_scope.md`
- `after_evidence.md`
- `merchant_proof_package.md`

The proof package must match the same merchant and the same fulfillment item.

## Completion evidence to record
Record:
- completion timestamp
- proof package location
- completion status
- execution complete marker
- proof complete marker

## Reversibility
Completion should not be auto-reversed.
If a reversal is required, it must be an explicit administrative correction with audit trail.

## Smallest safe completion writeback
The minimum governed writeback is:
1. Set the active fulfillment item's `proof_package_status` to complete.
2. Set `proof_status`, `execution_status`, and `completion_status` to complete.
3. Set `proof_complete`, `execution_complete`, and `completion_complete` to true.
4. Set `completed_at`.
5. Set `proof_package_location` to the proof package path.

## Readiness score after implementation
91/100

## Final answer
- Exact authority: `staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json`
- Exact write target: the active item in `staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json`
- Exact required proof: a populated merchant proof package composed from before evidence, scoped fix, and after evidence
- Readiness score after implementation: `91/100`
