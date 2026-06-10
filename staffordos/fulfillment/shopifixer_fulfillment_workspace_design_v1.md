# ShopiFixer Fulfillment Workspace Design v1

Verdict: fulfillment workbench

## Recommended placement

The minimum viable workspace should live **inside `/operator/command-center`** as a dedicated fulfillment workbench section or slide-over anchored to the active paid merchant.

That keeps Ross in one place and avoids a separate route or new app surface.

## Minimum viable workflow

1. Payment Received
2. Before Evidence
3. Scoped Fix
4. After Evidence
5. Proof Package
6. Completion

## Why this placement

The command center is already the operator entry point. The paid-merchant fulfillment flow should be exposed there as a dedicated workbench, not as a detached route.

## Minimum UI needed

- merchant selector bound to the active paid merchant
- vertical fulfillment lane with stage states
- current stage and next action banner
- evidence upload or preview cards
- fulfillment truth detail panel
- proof package summary card
- completion status card

## Required truth sources

- `staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json`
- `staffordos/merchant_registry/merchant_lifecycle_registry_v1.json`
- `staffordos/clients/client_registry_v1.json`
- `staffordos/units/delivery_units_v1.json`
- `staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.md`

## Required operator inputs

- payment verification context
- before screenshot
- affected page URL
- observed friction
- scoped fix notes
- after screenshot
- merchant-facing proof summary
- review/referral/case-study completion choice

## Required proof artifacts

- payment receipt truth
- before evidence
- scoped fix record
- after evidence
- merchant-facing proof package
- completion timestamp

## Single highest ROI implementation

Add a paid-merchant fulfillment workbench panel inside `/operator/command-center` that binds the active fulfillment truth item to evidence capture, scoped-fix status, proof packaging, and completion controls.

That is the smallest change that turns the current disconnected truth into an operator workflow.
