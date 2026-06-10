# ShopiFixer Workbench Architecture Audit

## Verdict
REUSABLE_COMPONENT

## Exact Recommendation
Implement one reusable proof-run workbench component with stage-specific field sets and a shared writer contract.

## Shared Fields
All five actions share the same core metadata:
- store
- date
- artifact path
- text notes
- merchant identity
- proof-run path

## Shared Validation
The same validation rules apply across the stages:
1. store is present
2. artifact path stays inside the internal ShopiFixer proof-run directory
3. stage-specific required fields are non-empty
4. writer output is confined to a single markdown artifact
5. governed truth files are untouched

## Shared Lifecycle Behavior
- Each action captures one stage of the same proof run.
- Each action advances local workbench progress only.
- None of the actions should update merchant lifecycle truth yet.
- Each action feeds the next proof artifact in the chain.

## Shared UI Structure
- Same workbench card
- Same compact inline form shell
- Same submit pattern
- Same success banner pattern
- Same merchant/store prefill
- Same proof-run provenance display

## Shared Success States
- artifact saved
- local step marked complete
- proof-run file updated
- return to the same command-center panel with saved state

## Stage-Specific Field Sets
### Capture Before Evidence
Required:
- affected_page_or_artifact
- issue
- why_it_matters
- screenshot
- notes

Optional:
- merchant_name
- store_url
- observed_friction
- expected_improvement_category
- supporting_links
- captured_by

### Record Scoped Fix
Required:
- scoped_fix
- in_scope
- out_of_scope
- merchant_approval_needed
- change_made
- location_changed
- implementation_notes
- success_criteria

Optional:
- packet_id
- affected_page_or_artifact
- before_reference
- after_reference
- supporting_links
- captured_by
- fix_started_at
- fix_completed_at

### Capture After Evidence
Required:
- affected_page_or_artifact
- after_screenshot
- after_notes
- remaining_limitations
- observed_improvement
- merchant_facing_summary

Optional:
- merchant_name
- store_url
- before_reference
- fix_scope_reference
- supporting_links
- captured_by
- proof_package_location

### Generate Proof Package
Required:
- before_evidence
- fix_scope
- after_evidence

Optional:
- proof_package_location
- merchant_context_notes

### Mark Completion
Required:
- completion_summary
- proof_package_location
- remaining_limitations

Optional:
- review_status
- referral_status
- case_study_status

## Expected Code Duplication Reduction
Estimated reduction: 68%

Reason: the form shell, proof-run provenance, submit pattern, save banner, and path handling can be shared; only stage-specific fields and markdown composition vary.

## Next Implementation After Audit
Build one reusable proof-run workbench component in `OperatorHomeV1` and parameterize it for before evidence, scoped fix, after evidence, proof package, and completion.
