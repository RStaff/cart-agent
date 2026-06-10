# ShopiFixer UI Binding Audit

## Exact Route

`/operator/command-center`

## Exact Component

- Navigation pill/tab component: `OperatorNav`
- Current command-center page component: `OperatorHomeV1`
- Page file: `staffordos/ui/operator-frontend/app/operator/command-center/page.tsx`

## Current Data Sources

The existing StaffordOS command-center page already reads:

- `staffordos/snapshots/primary_action_snapshot_v1.json`
- `staffordos/preflight/preflight_report_v1.json`
- `staffordos/preflight/command_center_qa_report_v1.json`
- `staffordos/snapshots/unit_work_snapshot_v1.json`

## ShopiFixer Read Model

`staffordos/shopifixer/shopifixer_command_center_v1.json` can be used as the ShopiFixer read model.

It already contains the exact fields needed for a one-screen lifecycle view:

- merchant
- audit
- offer
- payment
- fulfillment
- lifecycle
- overall

## Smallest UI Change Required

Add a read-only ShopiFixer summary panel to the existing `/operator/command-center` page and feed it from `staffordos/shopifixer/shopifixer_command_center_v1.json`.

Keep the current command-center shell, `OperatorNav`, and existing operator route.

Likely implementation shape:

1. Add a small loader for `shopifixer_command_center_v1.json`.
2. Pass that payload into `OperatorHomeV1` or a child component.
3. Render the requested fields:
   - merchant
   - audit score
   - offer status
   - payment status
   - fulfillment status
   - current stage
   - next action
   - readiness score

## Can It Render Without Additional Truth Artifacts?

Yes.

The command center read model already exists as a synthesized truth object, so no new authority files are needed. The only remaining work is UI wiring to read and display it.

## Summary

- Exact route: `/operator/command-center`
- Exact navigation component: `OperatorNav`
- Exact command-center component: `OperatorHomeV1`
- Exact ShopiFixer data source: `staffordos/shopifixer/shopifixer_command_center_v1.json`
- Smallest change: add a read-only ShopiFixer panel to the existing command-center page
- Additional truth artifacts needed: `no`
