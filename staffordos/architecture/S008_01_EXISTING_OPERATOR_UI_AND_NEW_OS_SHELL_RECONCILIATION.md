# S008.01 Existing Operator UI and New OS Shell Reconciliation

## Classification

RECONCILIATION_READY

## Mission Boundary

This mission inspected the existing StaffordOS operator frontend and the S008.00 `/os` foundation shell. It did not implement application behavior, modify routes, modify components, modify authentication, modify Stripe, modify ShopiFixer production behavior, deploy, commit, or push.

The only files created by this mission are:

- `staffordos/architecture/S008_01_EXISTING_OPERATOR_UI_AND_NEW_OS_SHELL_RECONCILIATION.md`
- `staffordos/architecture/S008_01_EXISTING_OPERATOR_UI_AND_NEW_OS_SHELL_RECONCILIATION.json`

## Existing Route Inventory

| Route | File | Current surface | Data/action authority | Initial classification |
| --- | --- | --- | --- | --- |
| `/` | `staffordos/ui/operator-frontend/app/page.tsx` | Redirects to `/operator` | `redirect("/operator")` | RETAIN_AS_CANONICAL until migration |
| `/operator` | `staffordos/ui/operator-frontend/app/operator/page.tsx` | Operator Home / morning surface | Reads primary action, validation, campaign, lead, CEO truth, daemon, heartbeat, dashboard artifacts | MOVE_UNDER_OS -> Home |
| `/operator/command-center` | `staffordos/ui/operator-frontend/app/operator/command-center/page.tsx` | Fulfillment-oriented command center | Loads primary action, preflight, QA, unit work, ShopiFixer command center; includes ShopiFixer evidence/proof/completion server actions | KEEP_AS_CAPABILITY_LENS -> Work/Fulfillment first |
| `/operator/revenue-command` | `staffordos/ui/operator-frontend/app/operator/revenue-command/page.tsx` | Revenue Queue | Reads lead registry, revenue truth, dashboard snapshot | MOVE_UNDER_OS -> Pipeline |
| `/operator/leads` | `staffordos/ui/operator-frontend/app/operator/leads/page.tsx` | Lead Command | Reads real lead registry; `LeadActions` posts lead lifecycle actions | MOVE_UNDER_OS -> Pipeline |
| `/operator/campaigns` | `staffordos/ui/operator-frontend/app/operator/campaigns/page.tsx` | Campaign Command | Uses `getCampaignResolverReport()` over campaign and relationship truth | MOVE_UNDER_OS -> Pipeline |
| `/operator/cockpit` | `staffordos/ui/operator-frontend/app/operator/cockpit/page.tsx` | CEO Truth Snapshot | Client fetches `/api/operator/ceo-truth-snapshot`; can show primary action execution CTA | MERGE_WITH_EXISTING_OS_SECTION -> Command |
| `/operator/execution-log` | `staffordos/ui/operator-frontend/app/operator/execution-log/page.tsx` | Execution Log | Reads execution events, outcome events, agent performance, rule suggestions | MOVE_UNDER_OS -> Knowledge/System |
| `/operator/system-map` | `staffordos/ui/operator-frontend/app/operator/system-map/page.tsx` | True System Map | Reads system map sources; embeds manifest panel and Abando proof action panel | MOVE_UNDER_OS -> System/Governance |
| `/operator/products` | `staffordos/ui/operator-frontend/app/operator/products/page.tsx` | Product Overview | Fetches Abando summary API when configured; other products are placeholders | MOVE_UNDER_OS -> System |
| `/operator/analytics` | `staffordos/ui/operator-frontend/app/operator/analytics/page.tsx` | Operator Analytics placeholders | No connected analytics summary APIs | DEPRECATE_LATER after Business Health design |
| `/operator/capacity` | `staffordos/ui/operator-frontend/app/operator/capacity/page.tsx` | Service Capacity Board | Static manual placeholder data | NEEDS_MORE_EVIDENCE |
| `/operator/slice-truth` | `staffordos/ui/operator-frontend/app/operator/slice-truth/page.tsx` | Slice Truth / Operator Lock | Reads slice truth and lock JSON; buttons disabled | MOVE_UNDER_OS -> Governance/System |
| `/operator/shopifixer-pilot` | `staffordos/ui/operator-frontend/app/operator/shopifixer-pilot/page.tsx` | ShopiFixer pilot proof workspace | Deep ShopiFixer artifact parsing and evidence/proof/completion writers | KEEP_AS_CAPABILITY_LENS -> Work/Delivery |
| `/operator/relationship/[id]` | `staffordos/ui/operator-frontend/app/operator/relationship/[id]/page.tsx` | Relationship 360 | Reads relationship, action, decision, revenue, fulfillment, execution, outcome, and packet authority data | KEEP_AS_CAPABILITY_LENS -> Pipeline/Knowledge |
| `/os` | `staffordos/ui/operator-frontend/app/os/page.tsx` | S008 framework Home placeholder | Static section metadata only | MERGE_WITH_EXISTING_OS_SECTION |
| `/os/command` | `staffordos/ui/operator-frontend/app/os/command/page.tsx` | S008 framework Command placeholder | Static section metadata only | MERGE_WITH_EXISTING_OS_SECTION |
| `/os/work` | `staffordos/ui/operator-frontend/app/os/work/page.tsx` | S008 framework Work placeholder | Static section metadata only | MERGE_WITH_EXISTING_OS_SECTION |
| `/os/pipeline` | `staffordos/ui/operator-frontend/app/os/pipeline/page.tsx` | S008 framework Pipeline placeholder | Static section metadata only | MERGE_WITH_EXISTING_OS_SECTION |
| `/os/knowledge` | `staffordos/ui/operator-frontend/app/os/knowledge/page.tsx` | S008 framework Knowledge placeholder | Static section metadata only | MERGE_WITH_EXISTING_OS_SECTION |
| `/os/governance` | `staffordos/ui/operator-frontend/app/os/governance/page.tsx` | S008 framework Governance placeholder | Static section metadata only | MERGE_WITH_EXISTING_OS_SECTION |
| `/os/system` | `staffordos/ui/operator-frontend/app/os/system/page.tsx` | S008 framework System placeholder | Static section metadata only | MERGE_WITH_EXISTING_OS_SECTION |

## Existing API Route Inventory

Read-oriented routes:

- `staffordos/ui/operator-frontend/app/api/operator/ceo-truth-snapshot/route.ts`
- `staffordos/ui/operator-frontend/app/api/operator/dashboard-snapshot/route.ts`
- `staffordos/ui/operator-frontend/app/api/operator/ross-command-center/route.ts`
- `staffordos/ui/operator-frontend/app/api/operator/client-registry/route.ts`
- `staffordos/ui/operator-frontend/app/api/operator/system-map/route.ts`
- `staffordos/ui/operator-frontend/app/api/operator/system-truth/route.ts`
- `staffordos/ui/operator-frontend/app/api/leads/queue/route.ts`
- `staffordos/ui/operator-frontend/app/api/operator/lead-registry/route.ts`
- `staffordos/ui/operator-frontend/app/api/operator/send-proof/route.ts`
- `staffordos/ui/operator-frontend/app/api/operator/followups/route.ts`
- `staffordos/ui/operator-frontend/app/api/operator/discovery-status/route.ts`
- `staffordos/ui/operator-frontend/app/api/system-map/manifest/route.ts`

Write or execution-capable routes:

- `staffordos/ui/operator-frontend/app/api/operator/execute-primary-action/route.ts`
- `staffordos/ui/operator-frontend/app/api/operator/lead-registry/action/route.ts`
- `staffordos/ui/operator-frontend/app/api/operator/workday/start/route.ts`
- `staffordos/ui/operator-frontend/app/api/operator/workday/stop/route.ts`
- `staffordos/ui/operator-frontend/app/api/operator/cron-status/route.ts`
- `staffordos/ui/operator-frontend/app/api/proof/abando-recovery/run/route.ts`

These write or execute routes are existing operating authorities. Reconciliation must not clone, wrap, or re-expose them casually under `/os`.

## Existing Component Inventory

Existing operator shell and navigation:

- `staffordos/ui/operator-frontend/components/operator/OperatorShell.tsx`
- `staffordos/ui/operator-frontend/components/operator/OperatorNav.tsx`
- `staffordos/ui/operator-frontend/components/operator/OperatorSectionPage.tsx`

Existing decision/action/workflow components:

- `staffordos/ui/operator-frontend/components/operator/PrimaryActionPanel.tsx`
- `staffordos/ui/operator-frontend/components/operator/ActionFirstDashboard.tsx`
- `staffordos/ui/operator-frontend/components/operator/OperatorHomeV1.tsx`
- `staffordos/ui/operator-frontend/components/operator/RossCommandCenterSurface.tsx`
- `staffordos/ui/operator-frontend/components/operator/ExecutePrimaryActionButton.tsx`
- `staffordos/ui/operator-frontend/components/operator/WorkdayControlPanel.tsx`
- `staffordos/ui/operator-frontend/components/operator/LeadQueue.tsx`
- `staffordos/ui/operator-frontend/components/operator/ProofRunWorkbench.tsx`
- `staffordos/ui/operator-frontend/components/operator/ShopifixerPilotWorkspace.tsx`

Existing product and placeholder components:

- `staffordos/ui/operator-frontend/components/operator/AbandoProductSummaryCard.tsx`
- `staffordos/ui/operator-frontend/components/operator/ProductSummaryPlaceholderCard.tsx`
- `staffordos/ui/operator-frontend/components/operator/AnalyticsPlaceholderCard.tsx`
- `staffordos/ui/operator-frontend/components/operator/UnitWorkSnapshotPanel.tsx`

Existing system-map components:

- `staffordos/ui/operator-frontend/components/system-map/SystemMapManifestPanel.tsx`
- `staffordos/ui/operator-frontend/components/system-map/PrimaryBlockerActionPanel.tsx`

S008.00 components:

- `staffordos/ui/operator-frontend/components/staffordos/StaffordOsShell.tsx`
- `staffordos/ui/operator-frontend/components/staffordos/WorkspacePage.tsx`
- `staffordos/ui/operator-frontend/components/staffordos/NextActionCard.tsx`

## Shared Layouts and Styling

Existing `/operator` layout:

- `staffordos/ui/operator-frontend/app/operator/layout.tsx`
- Wraps children in `OperatorShell`
- Reads validation, campaign, attribution, and execution status from repository artifacts

New `/os` layout:

- `staffordos/ui/operator-frontend/app/os/layout.tsx`
- Wraps children in `StaffordOsShell`
- Does not read data or expose actions

Styling:

- `staffordos/ui/operator-frontend/app/globals.css` contains the base styles, existing `operatorShell*`, page-specific operator styles, and the isolated S008.00 `staffordOs*` shell block.
- Several existing pages still use inline styles directly, notably Lead Command, Cockpit, Slice Truth, and some dashboard/card helpers.

## Mock, Static, Real, and Integration Data

Real repository artifact loaders and sources include:

- `staffordos/ui/operator-frontend/lib/operator/loadPrimaryActionSnapshot.ts`
- `staffordos/ui/operator-frontend/lib/operator/loadPreflightReport.ts`
- `staffordos/ui/operator-frontend/lib/operator/loadCommandCenterQaReport.ts`
- `staffordos/ui/operator-frontend/lib/operator/loadExecutionLog.ts`
- `staffordos/ui/operator-frontend/lib/leads/loadOperatorLeads.ts`
- `staffordos/ui/operator-frontend/lib/operator/campaignResolver.ts`
- `staffordos/ui/operator-frontend/lib/operator/relationshipResolver.ts`
- `staffordos/ui/operator-frontend/lib/operator/decisionEngineResolver.ts`
- `staffordos/ui/operator-frontend/lib/operator/loadShopifixerCommandCenter.ts`
- `staffordos/ui/operator-frontend/lib/rossOperatorArtifacts.ts`

Static or placeholder surfaces include:

- `/operator/analytics`
- `/operator/capacity`
- Portions of `/operator/products`
- All `/os/*` pages from S008.00

External API dependencies observed:

- Packet authority URLs in `loadShopifixerCommandCenter.ts` and `/operator/relationship/[id]`
- Abando summary API in `/operator/products`
- `CEOSNAPSHOT_URL` in `loadPrimaryActionSnapshot.ts`

No `middleware.*` file was found in `staffordos/ui/operator-frontend`, and no trusted operator authentication boundary is visible in this frontend route layer. Existing routes therefore should not gain broader reach during UI reconciliation.

## New `/os` Foundation Inventory

S008.00 created a clean framework:

- `app/os/layout.tsx`: mounts `StaffordOsShell`.
- `app/os/page.tsx`: Home placeholder.
- `app/os/command/page.tsx`: Command placeholder.
- `app/os/work/page.tsx`: Work placeholder.
- `app/os/pipeline/page.tsx`: Pipeline placeholder.
- `app/os/knowledge/page.tsx`: Knowledge placeholder.
- `app/os/governance/page.tsx`: Governance placeholder.
- `app/os/system/page.tsx`: System placeholder.
- `components/staffordos/StaffordOsShell.tsx`: left nav, top command bar, global search placeholder, notifications placeholder.
- `components/staffordos/WorkspacePage.tsx`: generic placeholder section body.
- `components/staffordos/NextActionCard.tsx`: reusable static decision card fields.
- `lib/staffordos/workspaces.ts`: canonical top-level section registry.
- `app/globals.css`: isolated `staffordOs*` responsive styling block.

Reusable:

- The canonical top-level taxonomy in `workspaces.ts`.
- The responsive shell frame in `StaffordOsShell`.
- The Next Action field schema from `NextActionCard`.

Overlapping or duplicative:

- `StaffordOsShell` duplicates `OperatorShell` shell/navigation/search/notification concepts.
- `STAFFORDOS_SECTIONS` duplicates and reframes `SIDEBAR_ITEMS`, `QUICK_ACTIONS`, and `CONTROL_PLANE_ROUTES`.
- `NextActionCard` duplicates existing primary-action card concepts in `OperatorHomeV1`, `PrimaryActionPanel`, `ActionFirstDashboard`, and the command center surfaces.
- `/os/*` placeholder workspace pages duplicate route real estate without using existing data-backed operator pages.

## Capability Mapping

| Existing surface | Canonical StaffordOS section | Reconciliation decision | Rationale |
| --- | --- | --- | --- |
| Operator Home / Morning surface | Home | MOVE_UNDER_OS | Already provides global next action, proof badges, workday state, campaign/lead/revenue/health summary. |
| Executive / Command Center | Command + Work | KEEP_AS_CAPABILITY_LENS | Existing page is partly executive but heavily fulfillment/ShopiFixer proof oriented. It should be a capability lens until separated. |
| CEO Truth Snapshot / Cockpit | Command | MERGE_WITH_EXISTING_OS_SECTION | Strong evidence source for business truth and top actions. |
| Revenue Command | Pipeline | MOVE_UNDER_OS | Models money-moving queue across proposal/payment/opportunity. |
| Lead Command | Pipeline | MOVE_UNDER_OS | Real lead lifecycle and safe dry-run send proof actions. |
| Campaign Command | Pipeline | MOVE_UNDER_OS | Real campaign registry and relationship coverage. |
| Relationship 360 | Pipeline + Knowledge | KEEP_AS_CAPABILITY_LENS | Cross-cuts lead/client/merchant/fulfillment/outcome evidence. |
| Execution Log | Knowledge + System | MOVE_UNDER_OS | Durable execution/outcome/agent/rule evidence. |
| System Map | System + Governance | MOVE_UNDER_OS | Existing truth inventory and source map should anchor System. |
| Slice Truth | Governance + System | MOVE_UNDER_OS | Operator lock and slice verification belong in Governance/System. |
| Products | System | MOVE_UNDER_OS | Product catalog/control-plane summary. |
| Analytics | Knowledge | DEPRECATE_LATER | Placeholder surface likely superseded by Business Health/Knowledge once real metrics exist. |
| Capacity | Work | NEEDS_MORE_EVIDENCE | Useful concept but currently static manual placeholders. |
| ShopiFixer Pilot | Work + Delivery | KEEP_AS_CAPABILITY_LENS | Product-specific proof/control workspace with writers; not safe for first migration. |
| S008 `/os` placeholders | Home/Command/Work/Pipeline/Knowledge/Governance/System | MERGE_WITH_EXISTING_OS_SECTION | Useful taxonomy, not useful as duplicate empty pages. |

## Workflow Coverage

| Workflow stage | Existing UI support | Data support | Status |
| --- | --- | --- | --- |
| Awareness | Campaign Command, Lead Command | Campaign registry, lead registry, attribution report | Partial real support |
| Outreach | Lead Command, send proof API | Lead registry, send ledger, send execution log | Real dry-run/operator proof support |
| Lead | Lead Command | `staffordos/leads/lead_registry_v1.json` | Real support |
| Qualification | Relationship 360, Revenue Command | Relationship resolver, decision engine, engagement stages | Partial real support |
| Opportunity | Revenue Queue, Campaign Command | Revenue truth, dashboard snapshot, campaign resolver | Partial real support |
| Proposal | Revenue Queue, Relationship 360 | Lead/client/relationship stages such as `proposal_sent` and payment waiting | Partial support |
| Agreement | Relationship 360, ShopiFixer pilot context | Client/merchant lifecycle and packet authority where available | Weak/implicit support |
| Payment | Revenue Queue, Relationship 360, ShopiFixer pilot | Packet authority reads, revenue truth, fulfillment truth | Partial support; no Stripe changes in operator frontend reconciliation |
| Fulfillment | Command Center, ShopiFixer Pilot | ShopiFixer command center, fulfillment truth, proof-run artifacts | Real but product-specific support |
| Proof | ShopiFixer Pilot, Execution Log, System Map | Proof packages, seals, evidence manifests, execution/outcome logs | Real support |
| Customer Success | Relationship 360, Execution Log | Outcome events and relationship outcome facets | Partial support |
| Expansion | Campaign Command | Campaign type includes referral/expansion concepts | Partial support |
| Referral | Campaign Command | Referral expansion campaign type exists; no dedicated workflow route | Placeholder/weak support |

## Overlap and Duplication Findings

1. There are currently two StaffordOS shells: `OperatorShell` for `/operator` and `StaffordOsShell` for `/os`.
2. There are three navigation models: `SIDEBAR_ITEMS` and `QUICK_ACTIONS` in `OperatorShell`, `CONTROL_PLANE_ROUTES` in `OperatorNav`, and `STAFFORDOS_SECTIONS` in `workspaces.ts`.
3. The new `NextActionCard` field model is correct, but existing pages already have richer primary-action components tied to real snapshots and evidence.
4. `/os/command` overlaps with `/operator/command-center`, `/operator/cockpit`, and parts of `/operator`.
5. `/os/pipeline` overlaps with `/operator/revenue-command`, `/operator/leads`, `/operator/campaigns`, and `/operator/relationship/[id]`.
6. `/os/work` overlaps with `/operator/command-center`, `/operator/shopifixer-pilot`, `/operator/capacity`, and Workday control on `/operator`.
7. `/os/system` overlaps with `/operator/system-map`, `/operator/products`, `/operator/execution-log`, and route/API health status.
8. `/os/governance` overlaps with `/operator/slice-truth`, System Map policy/source inventory, validation badges, and ShopiFixer proof authority.
9. Terminology conflicts exist: `Executive` vs `Command`, `Revenue Command` vs `Pipeline`, `Lead Command` vs `Pipeline`, `Command Center` vs Fulfillment/Delivery, and `Analytics` vs future Business Health/Knowledge.

## Recommended Route Strategy

Recommended strategy: A. `/os` becomes the canonical shell and existing `/operator` surfaces migrate beneath it incrementally.

Lowest-risk interpretation:

1. Keep `/operator` as the runtime canonical route family for now because `/` currently redirects to `/operator` and existing `/operator` pages contain real data and actions.
2. Treat `/os` as the canonical information architecture and shell taxonomy.
3. First connect `/os` to existing `/operator` surfaces using links or read-only wrappers only.
4. Move or embed one existing surface at a time after each surface's data and side-effect authority is understood.
5. Keep all write-capable routes, ShopiFixer proof writers, Workday actions, lead lifecycle actions, and primary-action execution routes untouched during navigation consolidation.
6. Only add redirects from `/operator/*` to `/os/*` after the corresponding `/os/*` page has parity and its side-effect boundaries are proven.

Do not choose strategy B as the long-term architecture. Absorbing S008.00 back into `/operator` would preserve immediate runtime behavior, but it would keep the product named "operator console" as the parent concept rather than StaffordOS as the operating system.

## Migration Sequence

1. Create one canonical capability map from OS sections to existing route targets. No business logic changes.
2. Render capability links inside `/os` placeholders so `/os` becomes an index into real existing surfaces.
3. Consolidate navigation definitions so `OperatorShell`, `OperatorNav`, and `StaffordOsShell` do not drift.
4. Move the read-only surfaces first: System Map, Execution Log, Slice Truth, Campaign Command, Revenue Command.
5. Move action-capable surfaces later: Lead actions, Workday control, primary-action execution.
6. Keep ShopiFixer Pilot last because it has the deepest product-specific write/proof behavior.
7. Redirect only after parity and route tests.

## Migration Risks

- Accidentally making placeholder `/os` screens compete with real `/operator` pages.
- Losing side-effect boundaries by wrapping write-capable routes too early.
- Duplicating primary-action rendering instead of adapting existing evidence-backed components.
- Breaking deep links such as `/operator/relationship/[id]` or `/operator/shopifixer-pilot?phase=...`.
- Blurring product workspace boundaries, especially ShopiFixer proof/completion flows.
- Creating a false sense of authentication coverage. No frontend middleware was found in this app.
- Confusing operators with `Executive`, `Command`, `Command Center`, and `Fulfillment` labels.

## Exact Next Narrow Implementation Slice

Recommended next mission:

S008_02_OS_CAPABILITY_LINK_MAP

Objective:

Add a single read-only capability map that connects each `/os` top-level section to the existing `/operator` surfaces without moving routes, duplicating business logic, or changing actions.

Allowed implementation scope for that future mission:

- Add a central `staffordos/ui/operator-frontend/lib/staffordos/capabilities.ts` map.
- Add a small reusable `CapabilityLinkPanel` component.
- Render section-specific links on `/os` workspace pages.
- Keep all links pointing to existing `/operator` pages.
- Do not import existing data loaders into `/os`.
- Do not move or duplicate API routes.
- Do not touch authentication, Stripe, ShopiFixer production behavior, deployment, or environment variables.

Rollback:

- Delete `capabilities.ts`.
- Delete `CapabilityLinkPanel`.
- Remove the panel from `WorkspacePage`.

This slice is small, reversible, and prevents `/os` from becoming a disconnected parallel interface.

## Final Decision

RECONCILIATION_READY

The repository has enough evidence to reconcile the shells safely. The canonical product direction should be `/os`, but the current operating truth lives in `/operator`. The correct next step is not a route migration. It is a read-only capability map that makes `/os` an index into the existing operator surfaces while preserving every existing authority boundary.
