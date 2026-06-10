# ShopiFixer Scoped Fix Record Action Design

## Summary
This is the smallest safe operator action between before evidence and after evidence.
It records the exact fix performed, its boundaries, and the changed location.

## Recommended Artifact Path
`staffordos/proof_runs/internal_shopifixer_dry_run_v1/fix_scope.md`

## Active Merchant Proof Run Path
`staffordos/proof_runs/internal_shopifixer_dry_run_v1/`

## Required Fields
- `store`
- `scoped_fix`
- `in_scope`
- `out_of_scope`
- `merchant_approval_needed`
- `change_made`
- `location_changed`
- `implementation_notes`
- `success_criteria`

## Optional Fields
- `packet_id`
- `affected_page_or_artifact`
- `before_reference`
- `after_reference`
- `supporting_links`
- `captured_by`
- `fix_started_at`
- `fix_completed_at`

## Relationship to Before Evidence
The fix record depends on before evidence existing first. It should use the problem statement, affected artifact, and reason it matters from the before evidence as its input.

## Relationship to After Evidence
The fix record must exist before after evidence. After evidence should reference the fix record and prove the actual result of the scoped change.

## Operator Workflow Sequence
1. Capture Before Evidence
2. Record Scoped Fix
3. Capture After Evidence
4. Assemble Proof Package
5. Mark Completion

## Proof Requirements
- Before evidence exists
- Fix scope names the exact change
- In-scope and out-of-scope boundaries are explicit
- Implementation notes name the changed location
- After evidence can reference the fix record

## Safety Boundaries
This action must not touch:
- `staffordos/clients/client_registry_v1.json`
- `staffordos/revenue/revenue_truth_v1.json`
- payment truth
- fulfillment truth
- `merchant_lifecycle_registry_v1.json`
- checkout
- Stripe

This action must not simulate:
- payment
- merchant approval
- fulfillment completion

## Final Answer
- Recommended artifact path: `staffordos/proof_runs/internal_shopifixer_dry_run_v1/fix_scope.md`
- Required fields: `store`, `scoped_fix`, `in_scope`, `out_of_scope`, `merchant_approval_needed`, `change_made`, `location_changed`, `implementation_notes`, `success_criteria`
- Safety boundaries: do not touch client registry, revenue truth, payment truth, fulfillment truth, merchant lifecycle registry, checkout, or Stripe
- Next implementation step: add a small writer for the fix scope artifact that can be fed from the before-evidence record and later referenced by after evidence
