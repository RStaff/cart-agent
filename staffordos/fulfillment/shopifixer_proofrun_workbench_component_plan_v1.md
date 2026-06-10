# ShopiFixer ProofRunWorkbench Component Plan

## Verdict
Reusable component.

## Reusable Component Location
`staffordos/ui/operator-frontend/components/operator/ProofRunWorkbench.tsx`

## Stage Order
1. `before_evidence`
2. `scoped_fix`
3. `after_evidence`
4. `proof_package`
5. `completion`

## Exact Props
- `stage`
- `merchant.store`
- `merchant.client_id`
- `proofRunPath`
- `defaultDate`
- `saved`
- `onSubmit`
- `onSuccessRedirect`
- `stageConfig`

## Shared Form Structure
- workbench card shell
- merchant/store header
- stage title and description
- compact inline field grid
- shared provenance banner
- shared save/success banner
- single submit button
- local progress indicator

## Stage-Specific Field Definitions
### `before_evidence`
- affected_page_or_artifact
- issue
- why_it_matters
- screenshot
- notes

### `scoped_fix`
- scoped_fix
- in_scope
- out_of_scope
- merchant_approval_needed
- change_made
- location_changed
- implementation_notes
- success_criteria

### `after_evidence`
- affected_page_or_artifact
- after_screenshot
- after_notes
- remaining_limitations
- observed_improvement
- merchant_facing_summary

### `proof_package`
- compose from `before_evidence.md`, `fix_scope.md`, and `after_evidence.md`

### `completion`
- completion_summary
- proof_package_location
- remaining_limitations

## Shared Success State
- artifact saved
- writer returned success
- local stage marked complete
- return to `/operator/command-center` with saved state

## Shared Provenance Display
- active merchant store
- active merchant client id
- proof-run directory
- current stage
- output artifact path

## Migration Path From Existing Before-Evidence Form
1. Extract the existing before-evidence inline form from `OperatorHomeV1` into `ProofRunWorkbench`.
2. Keep the existing proof-run writer and artifact path unchanged.
3. Replace the one-off form with a stage-config-driven `before_evidence` instance.
4. Add the remaining stage configs after the shared component lands.

## Files That Will Change
- `staffordos/ui/operator-frontend/components/operator/ProofRunWorkbench.tsx`
- `staffordos/ui/operator-frontend/components/operator/OperatorHomeV1.tsx`
- `staffordos/ui/operator-frontend/app/operator/command-center/page.tsx`
- `staffordos/ui/operator-frontend/lib/operator/writeShopifixerBeforeEvidence.ts`
- `staffordos/ui/operator-frontend/lib/operator/proofRunStageConfigs.ts`

## Expected Code Reduction
- 68%

## Shared Validation
- store is present
- required stage fields are non-empty
- writer target stays fixed to a proof-run artifact
- governed truth files are untouched
- success state is derived from writer success

## Exact Next Implementation Step
Create `ProofRunWorkbench` and wire the current before-evidence UI to it, then add stage configs for scoped fix, after evidence, proof package, and completion.
