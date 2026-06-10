# ShopiFixer Capture Before Evidence Action Design

## Summary
This is the first read/write operator action for the ShopiFixer fulfillment workbench.
It belongs in the proof-run layer only and is safe to use before full automation exists.

## Recommended Artifact Path
`staffordos/proof_runs/internal_shopifixer_dry_run_v1/before_evidence.md`

## Active Merchant Proof Run Path
`staffordos/proof_runs/internal_shopifixer_dry_run_v1/`

## What the Operator Must Capture
1. Merchant identity
2. Affected page or artifact
3. Before screenshot or equivalent visual evidence
4. Observed friction
5. Why it matters
6. Date of capture

## Required Fields
- `store`
- `date`
- `affected_page_or_artifact`
- `issue`
- `why_it_matters`
- `screenshot`
- `notes`

## Optional Fields
- `merchant_name`
- `store_url`
- `observed_friction`
- `expected_improvement_category`
- `supporting_links`
- `captured_by`

## Where the Data Should Be Written
Write only to the dedicated proof-run evidence artifact:

`staffordos/proof_runs/internal_shopifixer_dry_run_v1/before_evidence.md`

## Safety Boundaries
This action must not touch:
- `staffordos/clients/client_registry_v1.json`
- `staffordos/revenue/revenue_truth_v1.json`
- payment truth
- fulfillment truth
- `merchant_lifecycle_registry_v1.json`
- `shopifixer_command_center_v1.json`
- checkout
- Stripe

This action must not simulate:
- payment
- fulfillment completion
- merchant approval
- merchant reply

## What the UI Should Eventually Display
- Before screenshot preview
- Affected page URL
- Observed friction
- Why it matters
- Capture timestamp
- Merchant identity
- Proof-run path

## Source Truth Used
- `staffordos/fulfillment/shopifixer_fulfillment_workspace_design_v1.json`
- `staffordos/proof_runs/internal_shopifixer_dry_run_v1/before_evidence.md`
- `staffordos/merchant_registry/merchant_lifecycle_registry_v1.json`
- `staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json`

## Final Answer
- Data to capture: merchant identity, affected page or artifact, before screenshot or equivalent visual evidence, observed friction, why it matters, date of capture
- Write location: `staffordos/proof_runs/internal_shopifixer_dry_run_v1/before_evidence.md`
- Active merchant proof run path: `staffordos/proof_runs/internal_shopifixer_dry_run_v1/`
- Required fields: `store`, `date`, `affected_page_or_artifact`, `issue`, `why_it_matters`, `screenshot`, `notes`
- Optional fields: `merchant_name`, `store_url`, `observed_friction`, `expected_improvement_category`, `supporting_links`, `captured_by`
- UI eventual display: before screenshot preview, affected page URL, observed friction, why it matters, capture timestamp, merchant identity, proof-run path
- Do not touch: client registry, revenue truth, payment truth, fulfillment truth, merchant lifecycle registry, ShopiFixer command center, checkout, Stripe
