# STAFFORDOS_OPERATOR_SURFACE_INVENTORY_V1

Historical status:
- Historical inventory record preserved for repository traceability.
- Technical content is preserved unchanged.
- Continuity-route statements are partially superseded where applicable by `STAFFORDOS_CANONICAL_CONTINUITY_ROUTE_AUDIT_V1.md`.

Scope: inventory only. No code changes. No redesign. No recommendations beyond gap identification.

Status legend:
- `LIVE`: real route, active, and connected to production data or actions.
- `FUNCTIONAL`: works as a real screen or redirect, but is read-only or narrower in scope.
- `PARTIAL`: mixed real + placeholder, projection-heavy, or incomplete.
- `PLACEHOLDER`: manual/demo/stubbed surface.
- `DEAD`: legacy artifact or non-active surface.

## Part 1. Route Inventory

### 1A. Core StaffordOS operator workspace

| URL | Source file | Page / component | Purpose | Status | Data source(s) | Actions available | Dependencies |
|---|---|---|---|---|---|---|---|
| `/` -> `/operator` | `staffordos/ui/operator-frontend/app/page.tsx` | redirect page | Entrypoint to operator workspace | FUNCTIONAL | Router | Redirect only | Next app routing |
| `/operator` | `staffordos/ui/operator-frontend/app/operator/page.tsx` | `OperatorHomeV1` / executive home | Executive home for operator decisioning and triage | LIVE | `primary_action_snapshot_v1.json`, `revenue_truth_v1.json`, `client_registry_v1.json`, `operator_dashboard_snapshot_v1.json`, `merchant_lifecycle_registry_v1.json`, `unit_work_snapshot_v1.json`, `shopifixer_fulfillment_truth_v1.json`, `ceo_truth_snapshot_v1.json`, execution log, decision engine report | Navigate to other operator surfaces; inspect revenue, blockers, relationship attention, decision engine comparisons | `OperatorHomeV1`, `OperatorNav`, multiple JSON snapshots, load helpers |
| `/operator/command-center` | `staffordos/ui/operator-frontend/app/operator/command-center/page.tsx` | command center page | Manual execution workspace for audit / proof / completion work | PARTIAL | `primary_action_snapshot_v1.json`, `preflight report`, `command center QA`, `unit_work_snapshot_v1.json`, `shopifixer_command_center_v1.json` | Capture before/after evidence, scoped fix, proof package, completion | server actions, load helpers, workflow snapshots |
| `/operator/cockpit` | `staffordos/ui/operator-frontend/app/operator/cockpit/page.tsx` | CEO truth cockpit | CEO-level truth and decision surface | PARTIAL | `/api/operator/ceo-truth-snapshot` | Execute primary action, inspect decision state | `ExecutePrimaryActionButton`, CEO truth snapshot API |
| `/operator/leads` | `staffordos/ui/operator-frontend/app/operator/leads/page.tsx` | lead command view | Lead pipeline, progress, outreach management | FUNCTIONAL | `/api/operator/lead-registry` | Move to outreach, mark sent, mark engaged | `LeadActions`, lead registry API |
| `/operator/campaigns` | `staffordos/ui/operator-frontend/app/operator/campaigns/page.tsx` | campaigns / relationship graph | Relationship graph and campaign summary | FUNCTIONAL | campaign resolver report | Read-only inspection of campaign structure | campaign resolver helpers |
| `/operator/revenue-command` | `staffordos/ui/operator-frontend/app/operator/revenue-command/page.tsx` | revenue command | Revenue pipeline summary and blockers | PARTIAL | `lead_registry_v1.json`, `revenue_truth_v1.json`, `operator_dashboard_snapshot_v1.json` | Read-only decision support | projection snapshots |
| `/operator/products` | `staffordos/ui/operator-frontend/app/operator/products/page.tsx` | products summary | Product-focused operator summary | PARTIAL | operator/product summaries, dashboard data | Read-only comparison and summary | product summary loaders |
| `/operator/system-map` | `staffordos/ui/operator-frontend/app/operator/system-map/page.tsx` | system map | System topology, manifests, blocker action panel | PARTIAL | `/api/operator/system-map`, system map manifest API | Trigger proof/recovery run | `SystemMapManifestPanel`, `PrimaryBlockerActionPanel` |
| `/operator/execution-log` | `staffordos/ui/operator-frontend/app/operator/execution-log/page.tsx` | execution log | Execution/outcome history and agent performance | PARTIAL | `loadExecutionLog()`, outcome logs | Inspect historical execution and suggestions | execution log loader |
| `/operator/relationship/[id]` | `staffordos/ui/operator-frontend/app/operator/relationship/[id]/page.tsx` | relationship 360 | Merchant / relationship detail view | PARTIAL | `revenue_truth_v1.json`, `client_registry_v1.json`, `merchant_lifecycle_registry_v1.json`, `shopifixer_fulfillment_truth_v1.json`, execution logs, decision engine | Read-only review of relationship state | relationship loaders |
| `/operator/capacity` | `staffordos/ui/operator-frontend/app/operator/capacity/page.tsx` | capacity page | Capacity board | PLACEHOLDER | manual internal placeholder entries | Manual internal edits only | none durable |
| `/operator/analytics` | `staffordos/ui/operator-frontend/app/operator/analytics/page.tsx` | analytics page | Analytics placeholder | PLACEHOLDER | none / no summary endpoint connected | Read-only placeholder | none durable |
| `/operator/slice-truth` | `staffordos/ui/operator-frontend/app/operator/slice-truth/page.tsx` | slice-truth page | Disabled truth slice reader | FUNCTIONAL | slice-truth snapshot data | Read-only; controls disabled | slice-truth loader |
| `/operator/send-console` | `web/src/index.js` | static send console | Send workflow console for operators | FUNCTIONAL | static HTML / send console assets | Send-console actions in static UI | Express route, static asset |

### 1B. Supporting merchant / pilot surfaces

| URL | Source file | Page / component | Purpose | Status | Data source(s) | Actions available | Dependencies |
|---|---|---|---|---|---|---|---|
| `/shopifixer` | `abando-frontend/app/shopifixer/page.tsx` | ShopiFixer page | Merchant entry point for audit / checkout | LIVE | query params, public checkout API | Start My Fix, audit simulator | public checkout endpoint, audit landing assets |
| `/shopifixer/status` | `abando-frontend/app/shopifixer/status/page.tsx` | continuity status page | Merchant post-payment continuity view | PARTIAL | packet API, merchant lifecycle truth, fulfillment truth, revenue truth, proof package | View continuity state | packet authority, local truth projections |
| `/pricing` | `web/src/routes/pricing.esm.js` | redirect | Entry alias into ShopiFixer flow | FUNCTIONAL | router redirect | redirect only | `/shopifixer` |
| `/dashboard` | `abando-frontend/app/dashboard/page.tsx` | dashboard page | Dashboard workspace / host-aware redirect | PARTIAL | embedded dashboard, dashboard state | Navigate to embedded dashboard | host/query logic |
| `/embedded/dashboard` | `abando-frontend/app/embedded/dashboard/page.tsx` | embedded dashboard | Embedded dashboard surface | FUNCTIONAL | dashboard data | Dashboard interaction | embedded host context |
| `/embedded` | `abando-frontend/app/embedded/page.tsx` | embedded entry | Embedded workspace entry | FUNCTIONAL | embedded app state | navigation only | embedded layout |
| `/embedded/review` | `abando-frontend/app/embedded/review/page.tsx` | embedded review | Review/demo surface | PARTIAL | review content | read-only review | embedded layout |
| `/control` | `abando-frontend/app/control/page.tsx` | control page | Control-room summary | PARTIAL | `staffordos/control_panel/abando_control_snapshot.json` | read-only control overview | control snapshot JSON |
| `/director` | `abando-frontend/app/director/page.tsx` | director console | Large ops console | PARTIAL | director snapshot, task queue, approvals, signals | inspect / govern | multiple StaffordOS JSON artifacts |
| `/briefing` | `abando-frontend/app/briefing/page.tsx` | briefing page | Daily briefing / ops summary | FUNCTIONAL | briefing JSON | read-only briefing | briefing snapshot |
| `/run-audit` | `abando-frontend/app/run-audit/page.tsx` | audit page | Public audit / qualification entry | FUNCTIONAL | public audit data | start audit | audit flow data |
| `/free-audit` | `abando-frontend/app/free-audit/page.tsx` | redirect page | Alias for audit route | FUNCTIONAL | router redirect | redirect only | `/run-audit` |
| `/audit-result` | `abando-frontend/app/audit-result/page.tsx` | audit result page | Audit result display | FUNCTIONAL | audit result data | review result | audit artifacts |
| `/merchant` | `abando-frontend/app/merchant/page.tsx` | merchant page | Merchant recovery / summary | PARTIAL | merchant summary state | read-only summary | dashboard / recovery data |
| `/experience` | `abando-frontend/app/experience/page.tsx` | experience page | Experience / recovered path demo | FUNCTIONAL | experience flow state | navigation and review | experience state |
| `/experience/returned` | `abando-frontend/app/experience/returned/page.tsx` | returned experience | Returned-state view | FUNCTIONAL | returned experience state | read-only state | experience state |
| `/ops/beta` | `abando-frontend/app/ops/beta/page.tsx` | beta ops page | Beta ops surface | PLACEHOLDER | seeded demo data | read-only demo | beta seed data |
| `/install/shopify` | `abando-frontend/app/install/shopify/page.tsx` | install page | Shopify install guidance / onboarding | FUNCTIONAL | install state | onboarding navigation | install flow state |

### 1C. Support APIs and backend surfaces used by the operator workspace

| URL | Source file | Page / component | Purpose | Status | Data source(s) | Actions available | Dependencies |
|---|---|---|---|---|---|---|---|
| `/api/operator/ceo-snapshot` | `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts` | route handler | CEO snapshot JSON | FUNCTIONAL | generated projection | read-only API | CEO snapshot generation |
| `/api/operator/ceo-truth-snapshot` | `staffordos/ui/operator-frontend/app/api/operator/ceo-truth-snapshot/route.ts` | route handler | CEO truth snapshot JSON | FUNCTIONAL | generated truth snapshot | read-only API | truth snapshot generator |
| `/api/operator/client-registry` | `staffordos/ui/operator-frontend/app/api/operator/client-registry/route.ts` | route handler | client registry JSON | FUNCTIONAL | `client_registry_v1.json` | read-only API | filesystem projection |
| `/api/operator/dashboard-snapshot` | `staffordos/ui/operator-frontend/app/api/operator/dashboard-snapshot/route.ts` | route handler | dashboard snapshot JSON | FUNCTIONAL | generated projection | read-only API | snapshot loader |
| `/api/operator/discovery-status` | `staffordos/ui/operator-frontend/app/api/operator/discovery-status/route.ts` | route handler | discovery status | FUNCTIONAL | discovery state JSON | read-only API | discovery snapshot |
| `/api/operator/execute-primary-action` | `staffordos/ui/operator-frontend/app/api/operator/execute-primary-action/route.ts` | route handler | primary operator action runner | LIVE | work queue / action snapshot | execute action | primary action snapshot, action executor |
| `/api/operator/followups` | `staffordos/ui/operator-frontend/app/api/operator/followups/route.ts` | route handler | follow-up queue | FUNCTIONAL | follow-up queue data | read-only API | follow-up queue |
| `/api/operator/lead-registry` | `staffordos/ui/operator-frontend/app/api/operator/lead-registry/route.ts` | route handler | lead registry | FUNCTIONAL | `lead_registry_v1.json` | read-only API | lead registry filesystem projection |
| `/api/operator/lead-registry/action` | `staffordos/ui/operator-frontend/app/api/operator/lead-registry/action/route.ts` | route handler | lead actions | LIVE | lead registry / action log | move to outreach, mark sent, mark engaged | lead action processor |
| `/api/operator/ross-command-center` | `staffordos/ui/operator-frontend/app/api/operator/ross-command-center/route.ts` | route handler | command-center snapshot | FUNCTIONAL | command center snapshot | read-only API | command center snapshot |
| `/api/operator/send-proof` | `staffordos/ui/operator-frontend/app/api/operator/send-proof/route.ts` | route handler | send proof | FUNCTIONAL | send proof log | read-only API | send-proof snapshot |
| `/api/operator/system-map` | `staffordos/ui/operator-frontend/app/api/operator/system-map/route.ts` | route handler | system map data | FUNCTIONAL | system map snapshot | read-only API | system map generator |
| `/api/operator/system-truth` | `staffordos/ui/operator-frontend/app/api/operator/system-truth/route.ts` | route handler | system truth | FUNCTIONAL | generated truth | read-only API | truth loader |
| `/api/operator/cron-status` | `staffordos/ui/operator-frontend/app/api/operator/cron-status/route.ts` | route handler | cron/job status | FUNCTIONAL | cron status data | read-only API | job status snapshot |
| `/api/operator/workday/start` | `staffordos/ui/operator-frontend/app/api/operator/workday/start/route.ts` | route handler | start workday | LIVE | workday state | mutate workday state | workday state store |
| `/api/operator/workday/stop` | `staffordos/ui/operator-frontend/app/api/operator/workday/stop/route.ts` | route handler | stop workday | LIVE | workday state | mutate workday state | workday state store |
| `/api/system-map/manifest` | `staffordos/ui/operator-frontend/app/api/system-map/manifest/route.ts` | route handler | system map manifest | FUNCTIONAL | manifest JSON | read-only API | manifest loader |
| `/api/proof/abando-recovery/run` | `staffordos/ui/operator-frontend/app/api/proof/abando-recovery/run/route.ts` | route handler | recovery proof run | LIVE | proof run execution | run proof action | proof runner |
| `/api/leads/queue` | `staffordos/ui/operator-frontend/app/api/leads/queue/route.ts` | route handler | lead queue | FUNCTIONAL | lead queue data | read-only API | lead queue snapshot |
| `/api/packets/:packetId` | `web/src/routes/packetAuthority.esm.js` | route handler | live packet authority read | LIVE | Postgres `packets` | read packet state | packet repository |
| `/api/operator/packets` | `web/src/routes/packetAuthority.esm.js` | route handler | packet list | LIVE | Postgres `packets` | read packet list | packet repository |
| `/api/operator/packets/:packetId` | `web/src/routes/packetAuthority.esm.js` | route handler | packet detail | LIVE | Postgres `packets` | read packet detail | packet repository |
| `/payment-return` | `web/src/routes/packetAuthority.esm.js` | route handler | payment return / redirect | LIVE | packet authority, live packet lookup | redirect to continuity screen | packet repo, merchant workspace origin |
| `/__public-checkout/_status` | `web/src/routes/publicPages.esm.js` | route handler | public checkout status | FUNCTIONAL | public checkout state | read status | checkout public pages |
| `/buy` | `web/src/routes/publicPages.esm.js` | route handler | public buy page | FUNCTIONAL | public checkout state | initiate buy path | public checkout pages |
| `/success` | `web/src/routes/publicPages.esm.js` | route handler | post-checkout success | FUNCTIONAL | checkout state | success display | checkout pages |
| `/cancel` | `web/src/routes/publicPages.esm.js` | route handler | checkout cancel page | FUNCTIONAL | checkout state | cancel display | checkout pages |

### 1D. No active routes found

No active Next routes under `/admin/*` or `/staffordos/*` were discovered in the inspected source trees.

## Part 2. Lifecycle Mapping

| Lifecycle stage | Existing screen(s) | Missing screen(s) | Duplicate screen(s) | Obsolete screen(s) |
|---|---|---|---|---|
| DISCOVER | `/run-audit`, `/free-audit`, `/shopifixer`, `/pricing`, `/embedded/review` | Dedicated operator discovery queue | `/run-audit` and `/free-audit` | None confirmed |
| QUALIFY | `/operator/leads`, `/operator/cockpit`, `/operator/command-center` | Dedicated qualification review screen with live scorecard | `cockpit` + `command-center` overlap on readiness | None confirmed |
| AUDIT | `/run-audit`, `/audit-result`, `/operator/system-map` | Single canonical audit result workspace | `/run-audit` and `/audit-result` both expose audit progression | None confirmed |
| OUTREACH | `/operator/leads`, `/operator/campaigns`, `/operator/send-console` | Unified outreach console with delivery proof in one view | `lead registry` + `campaigns` partly overlap | None confirmed |
| MEETING | `briefing`, `director` (adjacent only) | Dedicated meeting / call / notes screen | None | None confirmed |
| PROPOSAL | `briefing`, `director`, `operator/cockpit` (adjacent only) | Dedicated proposal review / approval screen | `briefing` + `director` partly overlap on decision context | None confirmed |
| CHECKOUT | `/shopifixer`, `/pricing`, `/__public-checkout/_status` | Operator checkout observation screen | `/shopifixer` and `/pricing` are entry aliases | None confirmed |
| PAYMENT | `/payment-return`, `/api/packets/:packetId`, `/shopifixer/status` | Direct operator payment validation screen in operator workspace | `payment-return` and packet API overlap on state handoff | None confirmed |
| FULFILLMENT | `/operator/command-center`, `/shopifixer/status`, `/merchant` | Dedicated fulfillment queue / workboard inside operator home | `command-center` + `shopifixer/status` overlap on execution state | None confirmed |
| DELIVERY | `/shopifixer/status`, `/experience/returned`, `/merchant` | Delivery completion confirmation screen in operator workspace | `merchant` + `experience/returned` partly overlap on end-state display | None confirmed |
| FOLLOW-UP | `/operator/leads`, `/operator/campaigns`, `/merchant` | Follow-up owner queue with due dates | `leads` + `campaigns` partly overlap | None confirmed |
| CASE STUDY | `/briefing`, `/director` | Dedicated case study publishing / review screen | None | None confirmed |
| REFERRAL | none identified | Dedicated referral surface | None | None confirmed |

## Part 3. System Layer

| Route / screen | Functionality | Completeness |
|---|---|---|
| `/operator/system-map` | Shows system topology, manifests, and blocker action panel | PARTIAL |
| `/operator/execution-log` | Shows execution history, outcome scores, and agent performance | PARTIAL |
| `/operator/cockpit` | CEO truth snapshot and primary action execution | PARTIAL |
| `/api/operator/system-map` | System map JSON source for the UI | FUNCTIONAL |
| `/api/operator/system-truth` | System truth JSON source | FUNCTIONAL |
| `/api/operator/cron-status` | Job/cron status API | FUNCTIONAL |
| `/api/operator/workday/start` / `/stop` | Workday state mutation | LIVE |
| `/api/proof/abando-recovery/run` | Recovery proof execution | LIVE |
| `/api/operator/execute-primary-action` | Executes the primary operator action | LIVE |
| `/api/operator/send-proof` | Proof send status / evidence | FUNCTIONAL |
| `/api/operator/lead-registry` | Lead registry read model | FUNCTIONAL |
| `/api/operator/client-registry` | Client registry read model | FUNCTIONAL |
| `/api/operator/dashboard-snapshot` | Dashboard projection | FUNCTIONAL |

System layer verdict: visible and usable, but split across several snapshots and read models. Live operational control exists, but not as a single authoritative system console.

## Part 4. Decision Layer

| Screen | Decision role | Source quality |
|---|---|---|
| `/operator` | Executive triage and prioritization | Strongest aggregate view, but projection-heavy |
| `/operator/cockpit` | CEO truth comparison and primary action | Useful but still snapshot-based |
| `/operator/revenue-command` | Revenue prioritization / blocker review | Projection-heavy |
| `/operator/leads` | Lead scoring / outreach sequencing | Functional decision workspace |
| `/operator/campaigns` | Relationship graph / outreach context | Read-only decision support |
| `/operator/relationship/[id]` | Merchant health and relationship history | Good per-merchant decision view |
| `/briefing` | Daily decision context | Useful but summary-only |
| `/director` | Governance and decision overview | Broad but fragmented |

Decision layer gaps:
- no single operator screen joins packet authority, payment state, fulfillment state, and continuity state in one place
- no dedicated meeting/proposal decision screen
- no canonical referral or case-study decision screen

## Part 5. Execution Layer

| Screen / route | Work performed | Completeness |
|---|---|---|
| `/operator/command-center` | Captures before/after evidence, scoped fix, proof package, completion | PARTIAL |
| `/operator/leads` | Moves leads to outreach, marks sent, marks engaged | FUNCTIONAL |
| `/operator/send-console` | Send workflow console | FUNCTIONAL |
| `/api/operator/execute-primary-action` | Executes primary action | LIVE |
| `/api/operator/lead-registry/action` | Mutates lead state | LIVE |
| `/api/proof/abando-recovery/run` | Runs recovery proof | LIVE |
| `/operator/system-map` | Triggers blocker action / proof run | PARTIAL |
| `/shopifixer/status` | Merchant continuity display after payment | PARTIAL |

Execution layer gaps:
- fulfillment work is split between command center, merchant continuity, and snapshot-driven views
- there is no single durable workboard for end-to-end ShopiFixer delivery

## Part 6. Command Center Evaluation

Current widgets / sections:
- primary action snapshot
- preflight report
- command center QA report
- unit work snapshot
- ShopiFixer command center snapshot
- evidence capture forms
- proof package capture
- completion capture
- blocker / status panels

Broken widgets / weak points:
- widget set depends heavily on projection files and generated snapshots
- some paths are still read-only or proof-oriented rather than operational
- the surface is not clearly the operator home for the full ShopiFixer lifecycle

Placeholder widgets:
- capacity page is explicitly placeholder-based
- analytics page is explicitly placeholder-based
- some system-map content is seeded / illustrative rather than durable

Missing widgets:
- live packet authority summary
- live payment-return continuity status
- direct continuity render status
- explicit first-customer evidence capture summary
- one-screen merchant journey completion status

Can it realistically be the operator home screen?
- Yes, partially.
- It is the closest execution surface in the current operator UI.
- It is not yet a complete home screen for the full ShopiFixer lifecycle because it still relies on multiple snapshots and lacks a direct live payment/continuity consolidation view.

## Part 7. Data Authority

| Screen / route | Source of truth class |
|---|---|
| `/operator` | Generated projection |
| `/operator/command-center` | Generated projection + filesystem |
| `/operator/cockpit` | Generated projection |
| `/operator/leads` | Generated projection + API |
| `/operator/campaigns` | Generated projection |
| `/operator/revenue-command` | Generated projection |
| `/operator/products` | Generated projection |
| `/operator/system-map` | Generated projection + API |
| `/operator/execution-log` | Generated projection |
| `/operator/relationship/[id]` | Generated projection |
| `/operator/capacity` | Static JSON / placeholder |
| `/operator/analytics` | Placeholder / unknown |
| `/operator/slice-truth` | Generated projection |
| `/operator/send-console` | Filesystem static HTML |
| `/shopifixer` | API + generated/public state |
| `/shopifixer/status` | API + StaffordOS runtime JSON + filesystem |
| `/pricing` | Router redirect |
| `/dashboard` | Generated projection |
| `/embedded/dashboard` | Generated projection |
| `/embedded` | Static / generated UI |
| `/embedded/review` | Generated projection |
| `/control` | StaffordOS runtime JSON |
| `/director` | StaffordOS runtime JSON / generated projection |
| `/briefing` | Generated projection |
| `/run-audit` | API + generated projection |
| `/audit-result` | Generated projection |
| `/merchant` | Generated projection |
| `/experience` | Generated projection |
| `/experience/returned` | Generated projection |
| `/ops/beta` | Static JSON / placeholder |
| `/install/shopify` | Generated projection |
| `/api/operator/*` | Generated projection / API |
| `/api/packets/:packetId` | Live Postgres |
| `/payment-return` | Live Postgres + API |
| `/__public-checkout/_status` | API + live state |

Flagged projection-heavy screens where durable authority already exists:
- `/operator/leads`
- `/operator/cockpit`
- `/operator/revenue-command`
- `/operator/relationship/[id]`
- `/operator/system-map`
- `/operator/execution-log`
- `/shopifixer/status`
- `/merchant`

These screens are useful, but they are not direct durable authorities.

## Part 8. Gap Analysis

Blockers to running the complete ShopiFixer lifecycle entirely inside StaffordOS:
- no single operator surface for packet authority + payment + fulfillment + continuity
- meeting/proposal/referral/case-study stages lack dedicated operator screens
- some critical screens are still projection-only or placeholder-only
- command center is operational, but not a complete home screen for all lifecycle stages
- merchant continuity exists as a separate surface rather than as part of the operator workspace
- system health, jobs, and webhook status are fragmented across several APIs and snapshots

## Part 9. Executive Summary

1. Existing operator surfaces
- `/operator`
- `/operator/command-center`
- `/operator/cockpit`
- `/operator/leads`
- `/operator/campaigns`
- `/operator/revenue-command`
- `/operator/products`
- `/operator/system-map`
- `/operator/execution-log`
- `/operator/relationship/[id]`
- supporting APIs under `/api/operator/*`

2. Missing operator surfaces
- dedicated meeting screen
- dedicated proposal screen
- dedicated referral screen
- dedicated case-study screen
- single consolidated live-ops view for packet/payment/fulfillment/continuity

3. Duplicate surfaces
- `/run-audit` and `/free-audit`
- `/pricing` and `/shopifixer` as entry aliases
- `/dashboard` and `/embedded/dashboard`
- `/operator/cockpit` and `/operator/command-center` overlap on executive decisioning

4. Dead surfaces
- no clearly dead active Next routes found
- legacy static dashboard artifact exists in `web/src/public/dashboard/index.html`
- placeholder pages remain in active route space (`/operator/capacity`, `/operator/analytics`, `/ops/beta`)

5. Operational readiness score
- **6.5 / 10**
- Strongest area: operator execution and lead control
- Weakest area: unified continuity and full lifecycle coverage

6. Exact next implementation priority
- The current operator home lacks a single durable view that joins live packet authority, payment state, fulfillment state, and continuity state.
- That is the highest-impact gap blocking full StaffordOS operation of the first ShopiFixer customer from one operator surface.
