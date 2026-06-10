# ShopiFixer Before Evidence Workbench Plan

## Goal
Capture Before Evidence from inside `/operator/command-center` using the existing fulfillment workbench.

## Exact UI Control
A single compact inline form with one submit control labeled `Capture Before Evidence`, embedded in the existing ShopiFixer fulfillment workbench card.

If the form does not fit inline, a small in-place expander or modal is acceptable, but no new route should be introduced.

## Exact Fields the Operator Enters
- affected page or artifact
- issue
- why it matters
- screenshot path or link
- notes

## System-Prefilled Fields
- store from the active merchant lifecycle record
- date from the current date
- merchant identity from `merchant_lifecycle_registry_v1.json`

## Invocation Path
`OperatorHomeV1.tsx` renders the control and submits the form.

`page.tsx` or a small operator helper invokes the existing writer:

`node staffordos/proof_runs/internal_shopifixer_dry_run_v1/write_before_evidence_v1.mjs --store <store> --date <date> --affected <affected_page_or_artifact> --issue <issue> --why <why_it_matters> --screenshot <screenshot_path_or_link> --notes <notes>`

The output remains:

`staffordos/proof_runs/internal_shopifixer_dry_run_v1/before_evidence.md`

## Success State
The UI should show:
- `Before evidence saved`
- the proof-run markdown was rewritten successfully
- the Before Evidence step is complete in the local fulfillment workbench only

## Lifecycle Progression Without Truth Writeback
Do not modify `merchant_lifecycle_registry_v1.json` or `shopifixer_fulfillment_truth_v1.json` yet.

Represent progress as a local workbench step indicator based on the updated proof-run artifact and writer success response.

## Files to Change
- `staffordos/ui/operator-frontend/components/operator/OperatorHomeV1.tsx`
- `staffordos/ui/operator-frontend/app/operator/command-center/page.tsx`
- `staffordos/ui/operator-frontend/lib/operator/writeShopifixerBeforeEvidence.ts`

## Safety Boundaries
Do not touch:
- `staffordos/clients/client_registry_v1.json`
- `staffordos/revenue/revenue_truth_v1.json`
- payment truth
- fulfillment truth
- `merchant_lifecycle_registry_v1.json`
- checkout
- Stripe

Do not create:
- new routes
- new truth files
- payment logic
- fulfillment logic

## Readiness Impact
This changes ShopiFixer from proof-run design support to the first operator-triggered fulfillment step being executable from `/operator/command-center`, without changing governed truth.

## Final Answer
- Exact UI control: single compact inline form with one submit control labeled `Capture Before Evidence`
- Exact files to modify: `OperatorHomeV1.tsx`, `page.tsx`, and `lib/operator/writeShopifixerBeforeEvidence.ts`
- Expected operator flow: open command-center, expand workbench, fill fields, submit, confirm artifact rewrite, mark local step complete
- Readiness impact: improves execution readiness without changing lifecycle truth
