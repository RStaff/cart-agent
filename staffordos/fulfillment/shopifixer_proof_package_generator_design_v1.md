# ShopiFixer Proof Package Generator Design

## Summary
This generator composes the merchant-facing proof package from the existing proof-run artifacts.
It is read-only with respect to governed business truth and writes only to the proof-run proof package artifact.

## Recommended Output Path
`staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.md`

## Required Input Artifacts
- `staffordos/proof_runs/internal_shopifixer_dry_run_v1/before_evidence.md`
- `staffordos/proof_runs/internal_shopifixer_dry_run_v1/fix_scope.md`
- `staffordos/proof_runs/internal_shopifixer_dry_run_v1/after_evidence.md`

## Required Sections
1. Problem Found
2. Why It Mattered
3. What Was Changed
4. Before Evidence
5. After Evidence
6. Proof Summary
7. Recommended Next Watch Item
8. Completion Status

## Safety Boundaries
This generator must not touch:
- `staffordos/clients/client_registry_v1.json`
- `staffordos/revenue/revenue_truth_v1.json`
- payment truth
- fulfillment truth
- `merchant_lifecycle_registry_v1.json`
- checkout
- Stripe

It must not simulate:
- payment
- fulfillment completion
- merchant reply
- merchant approval

## Completion Limits
- Only summarize proof-run evidence that already exists.
- Do not claim payment or completion unless independently proven in truth files.
- Do not claim a full merchant proof package if before evidence, fix scope, and after evidence are not all present.
- Do not invent merchant-facing outcomes.

## What the Generator Must Not Claim
- A real merchant paid
- Fulfillment is complete
- Review or referral has occurred
- Case study authorization exists
- Payment truth changed
- Client registry changed
- Revenue truth changed

## Final Answer
- Recommended output path: `staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.md`
- Required input artifacts: before evidence, fix scope, after evidence
- Required sections: Problem Found, Why It Mattered, What Was Changed, Before Evidence, After Evidence, Proof Summary, Recommended Next Watch Item, Completion Status
- Safety boundaries: no client registry, revenue truth, payment truth, fulfillment truth, merchant lifecycle registry, checkout, or Stripe changes
- Next implementation step: build a small proof-package writer that composes the existing proof-run artifacts into `merchant_proof_package.md`
