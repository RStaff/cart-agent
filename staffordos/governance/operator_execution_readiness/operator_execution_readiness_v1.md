# Operator Execution Readiness v1

## Purpose
Assess which actions currently displayed in the StaffordOS CEO cockpit are informational, actionable, executable, or fully automatable, using only existing runtime truth and existing execution routes.

## Inputs analyzed
- `staffordos/cockpit/ceo_truth_snapshot_v1.json`
- `staffordos/snapshots/primary_action_snapshot_v1.json`
- `staffordos/leads/lead_registry_v1.json`
- `staffordos/clients/client_registry_v1.json`
- `staffordos/ui/operator-frontend/app/operator/cockpit/page.tsx`
- `staffordos/ui/operator-frontend/app/operator/command-center/page.tsx`
- `staffordos/ui/operator-frontend/app/api/operator/execute-primary-action/route.ts`
- `staffordos/ui/operator-frontend/app/api/operator/lead-registry/action/route.ts`
- `staffordos/ui/operator-frontend/app/api/operator/client-registry/route.ts`
- `staffordos/ui/operator-frontend/app/api/operator/followups/route.ts`
- `staffordos/ui/operator-frontend/components/operator/ExecutePrimaryActionButton.tsx`

## Cockpit actions and readiness

| Rank | Cockpit action | Exact target | Exact artifact | Exact execution path | Can launch from StaffordOS today? | Blocker | Classification |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Follow up on real ShopiFixer offer and close payment. | `opp_cart-agent-dev.myshopify.com` / ShopiFixer proposal | `staffordos/snapshots/primary_action_snapshot_v1.json` and `staffordos/cockpit/ceo_truth_snapshot_v1.json` | Existing `/api/operator/execute-primary-action` route, which logs the action and invokes `run_agent_loop.mjs` | Yes, through the existing operator action route / command center flow | Cockpit page itself has no launch control yet; execution is human-gated and does not perform external send/payment automatically | **EXECUTABLE** |
| 2 | Wait for reply or track next click | `step5-test-store.myshopify.com` lead | `staffordos/leads/lead_registry_v1.json` and `staffordos/cockpit/ceo_truth_snapshot_v1.json` | No dedicated launch route for the passive wait/track step; `followups` is read-only and `lead-registry/action` only handles lead state transitions | No | It is a recommendation/state label, not a runnable command | **VIEW_ONLY** |
| 3 | Follow up on real ShopiFixer offer and close payment. | `opp_cart-agent-dev.myshopify.com` / ShopiFixer opportunity | `staffordos/snapshots/unit_work_snapshot_v1.json` and `staffordos/cockpit/ceo_truth_snapshot_v1.json` | Existing `/api/operator/execute-primary-action` route via the primary action snapshot | Yes, same launcher as rank 1 | Same blocker as rank 1; the cockpit does not yet expose an execution control | **EXECUTABLE** |
| 4 | Convert recovered merchant value into paid plan or case-study close. | `cart-agent-dev.myshopify.com` | `staffordos/clients/operator_dashboard_snapshot_v1.json` and `staffordos/cockpit/ceo_truth_snapshot_v1.json` | No direct dedicated execution route for this derived dashboard action | No | This is a derived recommendation; no direct launcher exists for this exact action | **ACTIONABLE** |
| 5 | Run ShopiFixer audit and write findings to client record. | `cart-agent-dev.myshopify.com` | `staffordos/clients/client_registry_v1.json` and `staffordos/cockpit/ceo_truth_snapshot_v1.json` | No direct launch route; client registry API is read-only and the action is only represented as `next_action` truth | No | The cockpit can identify the audit target, but there is no runtime path that executes this exact client audit action from the cockpit | **ACTIONABLE** |

## Informational versus executable
- Informational actions: 3 of 5 displayed actions
- Executable actions: 2 of 5 displayed actions
- Fully automatable actions: 0 of 5 displayed actions

## Highest-value launchable action
The single highest-value launchable action is:
- `Follow up on real ShopiFixer offer and close payment.`

This is the direct revenue-close path already backed by the primary action snapshot and an existing operator execution route.

## Minimum implementation slice
The smallest implementation slice that turns the cockpit from a truth dashboard into an operating surface is:
- add an execution control to `/operator/cockpit` for the primary action
- reuse the existing `ExecutePrimaryActionButton` and `/api/operator/execute-primary-action` route
- keep the cockpit read-only for the rest of the snapshot

## Exact files that would need to change
Minimal file set:
- `staffordos/ui/operator-frontend/app/operator/cockpit/page.tsx`

Optional reuse, no change required:
- `staffordos/ui/operator-frontend/components/operator/ExecutePrimaryActionButton.tsx`
- `staffordos/ui/operator-frontend/app/api/operator/execute-primary-action/route.ts`

If the cockpit must expose non-primary actions as launchable later, additional action-specific launch routes would be required, but that is outside the minimum slice.

## Guidance
- Keep the cockpit bound to `ceo_truth_snapshot_v1.json` for truth.
- Use the existing primary-action execution route for the one launchable revenue action.
- Leave non-launchable actions visible as guidance only until dedicated execution paths exist.
