# CEO COCKPIT BINDING PLAN V1

## Purpose

Audit the existing operator frontend and define the minimum binding plan to turn the current control plane into the CEO cockpit.

No UI changes were made for this plan.

## Scope

Current target cockpit sections:

- Revenue
- Acquisition
- Conversion
- Fulfillment
- Merchant Success
- Executive Control

Do not introduce new registries. Bind existing APIs, loaders, registries, packet routes, audit files, proof files, and authority artifacts first.

## Existing API Coverage

| Need | Existing API or Loader | Source | Coverage | Notes |
| --- | --- | --- | --- | --- |
| Revenue pipeline | app/api/operator/dashboard-snapshot/route.ts | staffordos/clients/operator_dashboard_snapshot_v1.json | PARTIAL | Provides revenue_summary, top_metrics, revenue_gaps, priority_clients, blocked_clients, and next_actions. It is snapshot-based, not a live pipeline API. |
| Revenue pipeline | app/api/operator/lead-registry/route.ts | staffordos/leads/lead_registry_v1.json and related lead files | PARTIAL | Supports lead lifecycle and conversion-adjacent pipeline, not paid revenue truth. |
| Revenue pipeline | web/src/routes/packetAuthority.esm.js | packets table through web backend | PARTIAL | Provides paid packet state through /api/operator/packets, but this is not currently exposed by the Next operator frontend. |
| Leads | app/api/operator/lead-registry/route.ts | staffordos/leads/lead_registry_v1.json, lead_events_v1.json, send_ledger_v1.json, .tmp/send_queue.json, .tmp/send_ready.json, .tmp/send_console_data.json | COMPLETE | Best current operator business API. Provides summary, normalized leads, stages, next actions, sent/replied flags, event count, and source paths. |
| Leads | app/api/leads/queue/route.ts | staffordos/leads/lead_registry_v1.json, .tmp/send_console_data.json, .tmp/send_ready.json | PARTIAL | Returns the first available lead queue source. Useful fallback, but less canonical than /api/operator/lead-registry. |
| Leads | app/api/operator/lead-registry/action/route.ts | staffordos/leads/lead_registry_v1.json, lead_events_v1.json, send_ledger_v1.json, send_execution_log_v1.json | PARTIAL | Mutates lead lifecycle and records dry-run send proof. Useful for Lead Command, but not a CEO snapshot source. |
| Client registry | app/api/operator/dashboard-snapshot/route.ts | staffordos/clients/operator_dashboard_snapshot_v1.json | PARTIAL | Indirect client registry view only. No direct /api/operator/client-registry route exists in the operator frontend. |
| Client registry | lib/operator/loadDashboardSnapshot.ts | staffordos/clients/operator_dashboard_snapshot_v1.json | PARTIAL | Reads the snapshot from clients, not the full staffordos/clients/client_registry_v1.json. |
| Packets | web/src/routes/packetAuthority.esm.js | packets table | PARTIAL | Existing backend routes: /api/operator/packets, /api/operator/packets/:packetId, /api/packets/prepare, /api/packets/:packetId/execution, /payment-return. Missing a Next operator frontend adapter. |
| Audits | web/src/index.js /api/fix-audit GET and POST | canonical fix-audit payload storage and ShopiFixer lead writeback | PARTIAL | Existing backend audit creation/retrieval. Not surfaced in operator frontend cockpit pages. |
| Audits | web/src/routes/guidedAudit.esm.js /api/guided-audit | staffordos/scorecards/guidedAuditEngine.js | PARTIAL | Existing guided audit retrieval by slug/domain. Not bound into operator frontend. |
| Audits | audit files | staffordos/audits/shopifixer_audit_standard_v1.md, staffordos/audits/no_kings_audit_v1.md, staffordos/audits/no_kings_audit_v2_execution_plan.md, staffordos/audits/no_kings/evidence_manifest_v1.md | PARTIAL | Standards and No Kings plan exist. No operator API summarizes audit readiness or evidence status. |
| Proof status | app/api/operator/send-proof/route.ts | staffordos/leads/send_ledger_v1.json | PARTIAL | Good for outreach/send proof. Does not represent ShopiFixer fulfillment proof packages. |
| Proof status | app/api/operator/system-truth/route.ts | staffordos/leads/lead_registry_v1.json and send_ledger_v1.json | PARTIAL | Provides proofs_total and top_blocker from lead/send files only. |
| Proof status | app/api/proof/abando-recovery/run/route.ts | web/src/jobs/worker.js and staffordos/system_inventory/output/proof_runs | PARTIAL | Abando-specific runtime proof runner. Not the ShopiFixer proof status needed for this cockpit phase. |
| Proof status | web/src/routes/packetAuthority.esm.js | packets table | PARTIAL | Packet rows include proof_status and completion_status. Needs operator frontend adapter and cockpit section binding. |
| Next actions | app/api/operator/system-truth/route.ts | lead registry and send ledger | PARTIAL | Provides top_blocker and first 10 lead next_actions. Narrow but useful. |
| Next actions | app/api/operator/dashboard-snapshot/route.ts | operator_dashboard_snapshot_v1.json | PARTIAL | Provides primary_focus and client next_actions. Good for revenue focus but snapshot can become stale. |
| Next actions | app/api/operator/followups/route.ts | staffordos/leads/follow_up_queue_v1.json | PARTIAL | Provides follow-up queue if present. |
| Next actions | app/api/operator/ross-command-center/route.ts | external ross_operator artifacts | PARTIAL | Provides active decision, current truth, exact next command, and readiness from an external artifact root. Useful context, not canonical business-core state. |
| Next actions | lib/operator/loadPrimaryActionSnapshot.ts and lib/operator/loadUnitWorkSnapshot.ts | staffordos/snapshots/primary_action_snapshot_v1.json and unit_work_snapshot_v1.json | PARTIAL | Used by command-center page. Includes broader StaffordOS unit work, not only current business core. |

## Existing Operator Page Classification

| Page | Classification | Evidence | CEO Cockpit Use |
| --- | --- | --- | --- |
| /operator | PARTIAL | app/operator/page.tsx renders OperatorConsole. OperatorConsole calls /api/operator/query, but no local route exists under app/api/operator/query. Prompts include personal-life examples, which are future scope for this phase. | Do not use as CEO cockpit. Keep separate from business-core cockpit. |
| /operator/command-center | PARTIAL | Loads primary_action_snapshot, preflight, QA, and unit_work snapshots through local loaders. Real control-plane data, but broad StaffordOS/dev scope. | Reuse only the "what should Ross do next" pattern and gate/status ideas. Do not let it replace business cockpit sections. |
| /operator/cockpit | PARTIAL | Current page only calls workday start/stop, cron status, and discovery status. It is a functional control plane, not the CEO cockpit. | This is the target route to transform. |
| /operator/revenue-command | PARTIAL | Fetches /api/operator/lead-registry and /api/operator/send-proof. Shows lead lifecycle, product routing, send proof, priority leads, and bottleneck fallback. | Reuse for Acquisition, early Conversion, and send proof. Needs real revenue/client/payment/packet data before it is complete. |
| /operator/leads | COMPLETE | Fetches /api/operator/lead-registry. Shows real lead summary, real lead table, lifecycle stage, next action, score, contact status, and LeadActions. | Reuse as Acquisition source and drill-down. |
| /operator/capacity | PLACEHOLDER | Uses hardcoded serviceUnits and activeJobs with "Placeholder Merchant" records and says data source is manual placeholder entries. | Replace with packet/client capacity truth before using in cockpit. |
| /operator/analytics | PLACEHOLDER | Page explicitly says no connected summary APIs are present and renders placeholder cards. | Do not use for CEO cockpit. |
| /operator/products | PARTIAL | Attempts Abando summary API. Shopifixer and Actinventory cards are explicit placeholders. | Not useful for ShopiFixer cockpit until a ShopiFixer summary source exists. |
| /operator/system-map | PARTIAL | Fetches /api/operator/system-map and manifest. Real read-only map exists, but primary blocker text is Abando-specific and not aligned with current ShopiFixer readiness phase. | Use source inventory/status patterns only. |
| /operator/slice-truth | PARTIAL | Reads system_map_slice_truth_v1.json and operator_lock_state.json. Buttons are intentionally disabled/read-only. | Executive control context only, not core business cockpit. |
| /operator/execution-log | COMPLETE | Reads operator action events, outcome log, scores, agent performance, rule suggestions, and loop D report from local artifacts. | Useful for Executive Control audit trail. Not a merchant lifecycle view. |

## Current CEO Cockpit Gaps

### Revenue

Existing support:

- /api/operator/dashboard-snapshot
- staffordos/clients/operator_dashboard_snapshot_v1.json
- web backend packet APIs

Gap:

- No single cockpit source combines revenue summary, client registry, payment status, packet state, and close next action.
- No direct operator frontend client registry API.
- No operator frontend packet adapter.

Minimum binding:

- Add a read-only CEO cockpit snapshot that includes revenue_summary, active revenue clients, revenue gaps, proposal_sent clients, payment_pending packets, payment_received packets, blocked revenue, and next close action.

### Acquisition

Existing support:

- /api/operator/lead-registry
- /api/leads/queue
- /api/operator/followups
- /operator/leads

Gap:

- Lead Command is strong, but cockpit needs an executive summary: new leads, contact needed, outreach ready, sent, engaged, blocked, and product routing.

Minimum binding:

- Reuse /api/operator/lead-registry as the canonical acquisition source.
- Show source paths and do not duplicate lead registry logic in the UI.

### Conversion

Existing support:

- /api/operator/dashboard-snapshot for proposal/client next actions.
- /api/operator/lead-registry for engaged/followup_sent leads and payment fields.
- web backend /api/fix-audit and /api/guided-audit.
- audit artifacts under staffordos/audits.

Gap:

- No operator frontend API summarizes audits created, audits pending, proposals sent, payment links, payment pending, or conversion blockers.
- No audit evidence/readiness API.

Minimum binding:

- Derive conversion from client registry, lead registry, audit workspaces, and packet/payment data.
- Add a read-only audit summary source before rendering audit readiness as more than PARTIAL.

### Fulfillment

Existing support:

- web backend packet APIs.
- packetRepository fields: status, execution_status, proof_status, completion_status.
- fulfillment authority docs.

Gap:

- No operator frontend packet adapter.
- Capacity page is placeholder data.
- No cockpit section for active packets, waiting merchant, QA queue, proof queue, or fulfillment blockers.

Minimum binding:

- Bind /api/operator/packets from the web backend into the operator frontend through an adapter or direct configured backend fetch.
- Derive fulfillment queues from packet execution_status, proof_status, completion_status, and store domain.

### Merchant Success

Existing support:

- Fulfillment/proof authority docs define required proof, review, testimonial, and referral concepts.
- send ledger can show outreach proof, not merchant success proof.

Gap:

- No current operator API for reviews requested, reviews received, testimonial status, referral opportunities, or next sprint opportunities.
- No ShopiFixer proof package status API.

Minimum binding:

- Start with honest MISSING state in the cockpit.
- Add read-only proof package scanner only after a proof package folder convention exists for paid ShopiFixer work.

### Executive Control

Existing support:

- /operator/cockpit control buttons.
- /api/operator/system-truth.
- /api/operator/dashboard-snapshot.
- /api/operator/system-map.
- /operator/execution-log.
- /operator/command-center snapshots.

Gap:

- No unified executive control view that combines revenue, acquisition, conversion, fulfillment, merchant success, capacity, blockers, system health, and next best action.
- Current cockpit output is raw JSON from button clicks.

Minimum binding:

- Use the cockpit route as the CEO surface.
- Keep start/stop/cron/discovery controls secondary.
- Bind top blocker and next best action from the composed CEO snapshot, not from one narrow subsystem.

## Minimum Implementation Changes Required

These are future changes. They were not made in this audit.

### 1. Create One Read-Only CEO Cockpit Snapshot API

Proposed route:

- staffordos/ui/operator-frontend/app/api/operator/ceo-cockpit/route.ts

Proposed loader:

- staffordos/ui/operator-frontend/lib/operator/loadCeoCockpitSnapshot.ts

Inputs:

- loadOperatorLeads from staffordos/ui/operator-frontend/lib/leads/loadOperatorLeads.ts
- loadDashboardSnapshot from staffordos/ui/operator-frontend/lib/operator/loadDashboardSnapshot.ts
- staffordos/clients/client_registry_v1.json
- staffordos/leads/send_ledger_v1.json
- web backend /api/operator/packets or a configured STAFFORDOS_BACKEND_API_BASE equivalent
- audit file existence under staffordos/audits
- proof package file existence once ShopiFixer proof packages exist

Output shape:

- generated_at
- source_policy
- sections.revenue
- sections.acquisition
- sections.conversion
- sections.fulfillment
- sections.merchant_success
- sections.executive_control
- sources
- blockers
- next_best_action

Rule:

- The API must mark missing data as MISSING. It must not fabricate counts.

### 2. Add Direct Client Registry Read Support

Reason:

- /api/operator/dashboard-snapshot is useful but indirect.
- Client Registry is the merchant lifecycle backbone.

Minimum:

- Either load staffordos/clients/client_registry_v1.json inside the CEO snapshot loader, or add a read-only /api/operator/client-registry route.

Do not:

- Create a second merchant registry.
- Mutate client records from the cockpit in this phase.

### 3. Bind Existing Packet API Into Operator Frontend

Reason:

- Fulfillment and payment readiness require packet truth.
- The existing packet API is in the web backend, not the Next operator frontend.

Minimum:

- Add a configured fetch adapter that calls web backend /api/operator/packets.
- Surface packet counts by status, execution_status, proof_status, and completion_status.
- Treat backend unreachable as PARTIAL/MISSING, not zero.

Do not:

- Reimplement packet storage inside operator frontend.

### 4. Add Audit Readiness Summary

Reason:

- Conversion readiness depends on audit proof.
- No Kings currently has audit plan files but missing captured evidence/proof package.

Minimum:

- Read known audit artifacts for ShopiFixer readiness:
  - staffordos/audits/shopifixer_audit_standard_v1.md
  - staffordos/audits/no_kings_audit_v1.md
  - staffordos/audits/no_kings_audit_v2_execution_plan.md
  - staffordos/audits/no_kings/evidence_manifest_v1.md
  - staffordos/audits/no_kings/no_kings_shopifixer_950_value_gap_v1.md
- Report audit status as draft, evidence_missing, merchant_grade_ready, or proof_complete.

Do not:

- Claim a merchant-grade audit until evidence files exist.

### 5. Add Proof Package Status As A First-Class Field

Reason:

- send-proof tracks outreach proof, not ShopiFixer fulfillment proof.
- Packet proof_status exists but needs proof package artifact backing.

Minimum:

- For each packet/client, show proof_status from packet state.
- If proof_status is complete, require a proof package path before marking Merchant Success as anything above PARTIAL.

Do not:

- Use Abando runtime proof as ShopiFixer merchant proof.

### 6. Transform /operator/cockpit Last

Reason:

- The cockpit page is currently a working control plane.
- The safe path is to build the CEO snapshot first, then render it.

Minimum cockpit sections:

- Revenue: Stafford revenue, merchant value gap, proposal/client close queue, payment pending/received packets.
- Acquisition: lead summary, contact needed, outreach ready, engaged, product routing, next lead action.
- Conversion: audit readiness, proposals sent, checkout/payment state, closest-to-payment merchants.
- Fulfillment: active packets, waiting merchant, in progress, QA, proof queue.
- Merchant Success: proof delivered, review requested, review received, referral opportunity, next sprint opportunity.
- Executive Control: system health, capacity used, blockers, next best action, source freshness.

Do not:

- Use placeholder merchants.
- Merge personal-life prompts into the business cockpit.
- Promote broad Abando proof work into this phase.

## Recommended Binding Order

1. Build /api/operator/ceo-cockpit as a read-only composition API.
2. Add direct client registry read support inside that composition layer.
3. Add packet adapter to existing web backend /api/operator/packets.
4. Add audit readiness scanner for ShopiFixer/No Kings artifacts.
5. Add proof package status scanner once proof package folders exist.
6. Update /operator/cockpit to render the composed CEO snapshot.
7. Keep /operator/leads and /operator/revenue-command as drill-down pages.
8. Keep /operator/capacity, /operator/analytics, and Shopifixer product summary marked placeholder until they are backed by real sources.

## Readiness Verdict

Existing operator frontend readiness for CEO cockpit binding: PARTIAL.

Strong existing pieces:

- Lead Registry API and Lead Command page.
- Dashboard snapshot API for revenue/client snapshot.
- Send proof API for outreach proof.
- System truth API for lead blocker and lead next actions.
- Execution log page.
- Backend packet authority API exists.

Weak or missing pieces:

- No direct client registry API.
- No Next operator frontend packet adapter.
- No cockpit-bound audit readiness API.
- No ShopiFixer fulfillment proof package API.
- Current cockpit page is still a control plane, not a CEO cockpit.

Minimum next code step:

Create a read-only CEO cockpit snapshot API before touching the cockpit UI.
