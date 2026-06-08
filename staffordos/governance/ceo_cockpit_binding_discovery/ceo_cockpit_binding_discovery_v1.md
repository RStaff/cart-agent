# CEO Cockpit Binding Discovery v1

## Objective
Connect the existing StaffordOS CEO Truth Snapshot to the operator cockpit without creating a second truth source.

## Existing UI routes

### `/operator/cockpit`
- File: `staffordos/ui/operator-frontend/app/operator/cockpit/page.tsx`
- Current owner: operator frontend
- Current behavior: stale control-plane panel with workday start/stop and cron/discovery status buttons
- Current data source: control endpoints only
- Status: stale for CEO truth; should become the CEO Truth Snapshot cockpit

### `/operator/command-center`
- File: `staffordos/ui/operator-frontend/app/operator/command-center/page.tsx`
- Current owner: operator frontend
- Current behavior: Ross operator action surface based on primary action, preflight, QA, and unit work
- Current data source: existing operator control-plane read models
- Status: leave unchanged; not the CEO truth cockpit

## Existing API routes

### `/api/operator/ceo-snapshot`
- File: `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts`
- Current behavior: aggregates lead registry, client registry, dashboard snapshot, and proof status into a partial CEO summary
- Status: stale for the new authoritative CEO Truth Snapshot

### `/api/operator/dashboard-snapshot`
- File: `staffordos/ui/operator-frontend/app/api/operator/dashboard-snapshot/route.ts`
- Current behavior: exposes `staffordos/clients/operator_dashboard_snapshot_v1.json`
- Status: supporting read model, not the CEO truth snapshot

### `/api/operator/ross-command-center`
- File: `staffordos/ui/operator-frontend/app/api/operator/ross-command-center/route.ts`
- Current behavior: exposes Ross operator artifacts
- Status: unrelated to the CEO Truth Snapshot

## Existing operator data providers
- `loadPrimaryActionSnapshot.ts`
- `loadDashboardSnapshot.ts`
- `loadPreflightReport.ts`
- `loadCommandCenterQaReport.ts`
- `loadUnitWorkSnapshot.ts`

These are supporting operator read models. None of them currently expose `staffordos/cockpit/ceo_truth_snapshot_v1.json`.

## Recommendation
- UI route to consume the CEO Truth Snapshot: `/operator/cockpit`
- API endpoint to expose the CEO Truth Snapshot: `/api/operator/ceo-truth-snapshot`
- Existing stale route: `/operator/cockpit`
- Existing stale aggregate endpoint: `/api/operator/ceo-snapshot`

## Binding decision
Keep `command-center` unchanged. Convert `cockpit` into the canonical read-only CEO Truth Snapshot view and back it with a dedicated read-only API route.
