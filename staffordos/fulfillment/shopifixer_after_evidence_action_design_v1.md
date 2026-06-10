# ShopiFixer After Evidence Action Design

## Summary
This is the smallest safe operator action after the scoped fix and before proof package assembly.
It documents the post-fix state and proves the effect of the fix.

## Recommended Artifact Path
`staffordos/proof_runs/internal_shopifixer_dry_run_v1/after_evidence.md`

## Active Merchant Proof Run Path
`staffordos/proof_runs/internal_shopifixer_dry_run_v1/`

## Required Fields
- `store`
- `date`
- `affected_page_or_artifact`
- `after_screenshot`
- `after_notes`
- `remaining_limitations`
- `observed_improvement`
- `merchant-facing_summary`

## Optional Fields
- `merchant_name`
- `store_url`
- `before_reference`
- `fix_scope_reference`
- `supporting_links`
- `captured_by`
- `proof_package_location`

## Relationship to Before Evidence
After evidence depends on before evidence and uses it as the baseline for comparison.

## Relationship to Scoped Fix
After evidence depends on the scoped fix record and proves the scoped change had an effect.

## Relationship to Proof Package Generation
After evidence precedes proof package generation and supplies the merchant-facing summary and evidence comparison.

## Operator Workflow Sequence
1. Capture Before Evidence
2. Record Scoped Fix
3. Capture After Evidence
4. Assemble Proof Package
5. Mark Completion

## Proof Requirements
- Before evidence exists
- Scoped fix exists
- After screenshot or equivalent evidence exists
- After notes explain the observed improvement
- Remaining limitations are explicit
- Merchant-facing summary is proof-ready

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
- merchant reply
- merchant approval
- fulfillment completion

## Final Answer
- Recommended artifact path: `staffordos/proof_runs/internal_shopifixer_dry_run_v1/after_evidence.md`
- Required fields: `store`, `date`, `affected_page_or_artifact`, `after_screenshot`, `after_notes`, `remaining_limitations`, `observed_improvement`, `merchant-facing_summary`
- Safety boundaries: do not touch client registry, revenue truth, payment truth, fulfillment truth, merchant lifecycle registry, checkout, or Stripe
- Next implementation step: add a small writer for the after-evidence artifact that can reference the before evidence and scoped fix artifacts without touching governed truth
