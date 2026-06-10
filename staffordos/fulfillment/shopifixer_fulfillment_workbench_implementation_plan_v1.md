# ShopiFixer Fulfillment Workbench Implementation Plan

## Verdict
YES

## Exact Placement
Place the workbench inside `staffordos/ui/operator-frontend/components/operator/OperatorHomeV1.tsx`, in the existing ShopiFixer Command Center panel:

`<section className="panel operatorHomeDetails" style={{ marginTop: 18 }}>`

That section already renders the active merchant summary and can be extended in place.

## Reusable Components
- `OperatorHomeV1`
- `OperatorNav`
- existing ShopiFixer summary pills
- existing ShopiFixer action-card layout
- existing `operatorHomeActionFooter`
- existing `operatorHomeNextStep`

## Cards to Extend
1. ShopiFixer Command Center summary card
   - Extend it with a read-only fulfillment workbench subsection.

2. `operatorHomeActionCard`
   - Reuse the current card shell for fulfillment status and lane information.

## Available Data Fields
The registry and fulfillment truth already provide the fields needed for the read-only panel:

- Merchant
- Client ID
- Current Stage
- Next Required Action
- Payment Status
- Fulfillment Status
- Execution Status
- Proof Status
- Lifecycle Lane
- Readiness Score

## Truth Sources
- `staffordos/merchant_registry/merchant_lifecycle_registry_v1.json`
- `staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json`
- `staffordos/clients/client_registry_v1.json`

## Read-Only Panel Design
The panel should render:

- Merchant
- Current Stage
- Next Required Action
- Payment Status
- Fulfillment Status
- Execution Status
- Proof Status
- Lifecycle Lane
- Readiness Score

No buttons. No write actions. No new route. No new truth file.

## Smallest Implementation
Render a dedicated fulfillment workbench subsection inside the existing ShopiFixer Command Center panel, backed by the precomputed merchant lifecycle registry and the fulfillment truth record.

## Final Verdict
The first fulfillment workbench can be implemented using existing truth and the existing command-center structure.
