# ShopiFixer ProofRunWorkbench Verification

## Architecture Grade
B

## Does the Reusable Component Eliminate Duplication?
Yes, but only partially.

It eliminates duplication in:
- workbench shell layout
- merchant/store provenance display
- save/success banner pattern
- form submit pattern
- artifact path handling
- stage selection mechanics

## Are before_evidence and scoped_fix using the Same Workbench Shell?
Yes.

Both stages render through `ProofRunWorkbench` and differ only by stage config, field set, and writer helper.

## What Would Need to Change to Add after_evidence?
1. Extend `proofRunStageConfigs.ts` with an `after_evidence` config.
2. Add a `writeShopifixerAfterEvidence` helper.
3. Add a server action in `page.tsx`.
4. Render a second `ProofRunWorkbench` instance with `stage="after_evidence"`.

## What Would Need to Change to Add proof_package?
1. Extend `proofRunStageConfigs.ts` with a `proof_package` config.
2. Add a proof-package writer/helper.
3. Add a server action in `page.tsx`.
4. Render a proof-package workbench action or composition-only flow.

## What Would Need to Change to Add completion?
1. Extend `proofRunStageConfigs.ts` with a `completion` config.
2. Add completion-summary handling.
3. Add a server action in `page.tsx`.
4. Add governed writeback only if future truth policy allows it.

## Effort Estimates
- after_evidence: small
- proof_package: small_to_medium
- completion: medium

## Duplication Remaining
- stage-specific field definitions
- stage-specific writer helpers
- server action wiring in the page component
- per-stage saved-state redirects

## Recommendation
Continue. The reusable shell is real and worth extending.

## Next Implementation
Add the `after_evidence` stage to the same `ProofRunWorkbench` shell, then add `proof_package` and `completion` sequentially.
