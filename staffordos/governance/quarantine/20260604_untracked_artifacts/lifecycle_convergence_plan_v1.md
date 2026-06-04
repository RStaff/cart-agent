# Lifecycle Convergence Plan v1

Canonical authority:

- `staffordos/authority/output/staffordos_canonical_lifecycle_v1.md`

This plan does not redesign the lifecycle. It maps the current StaffordOS vocabulary to the canonical merchant lifecycle authority.

## A. System-by-system convergence map

### 1. Lead Registry

- Current terminology
  - `lead_registry_v1`
  - `lifecycle_stage`
  - `status.current_stage`
  - `contact_needed`, `message_ready`, `pending_approval`, `approved`, `ledgered`, `dry_run_ready`, `sent`, `engaged`, `qualified`, `customer`, `stopped`
  - `next_action`, `queued`, `sent`, `replied`, `outreach_ready`

- Canonical terminology
  - `Real Store`
  - `Qualified Target`
  - `Contact Discovery`
  - `Contact Research`
  - `Outreach Draft`
  - `Approved Outreach`
  - `Conversation`

- Gap
  - The lead registry is still organized around send mechanics and lead-state machine vocabulary.
  - It collapses multiple canonical acquisition stages into `contact_needed` / `sent` / `engaged`.
  - `customer` extends beyond the lead lifecycle and leaks into client lifecycle territory.

- Required mapping
  - Map acquisition labels to canonical acquisition phases in display and priority logic.
  - Treat `qualified` as the handoff point into Client Registry, not as a terminal lead state.
  - Treat `customer` as out of scope for Lead Registry and hand off to Client Registry / merchant lifecycle.

- Impact
  - High. Lead terminology drives outreach readiness, send queues, and revenue-command prioritization.

### 2. Client Registry

- Current terminology
  - `lead`, `audit_requested`, `audit_completed`, `proposal_sent`, `deal_won`, `fix_in_progress`, `fix_completed`, `abando_installed`, `revenue_active`, `paused`, `lost`
  - `payment_status`, `audit_status`, `fix_status`, `abando_installed`, `blocker_detection`, `next_action`

- Canonical terminology
  - `Qualified`
  - `Product Routed`
  - `Client Registry`
  - `Audit`
  - `Conversation`
  - `Payment`
  - `Packet`
  - `Fulfillment`
  - `Proof`
  - `Merchant Success`

- Gap
  - The registry uses sales/operator labels instead of the canonical merchant lifecycle bands.
  - It does not explicitly express `Packet`, `Proof`, or `Merchant Success` as stage terms.
  - `paused` and `lost` are operational outcomes, but they are not canonical lifecycle stages.

- Required mapping
  - Map `lead` to the canonical handoff from Lead Registry into `Qualified` / `Product Routed`.
  - Map `audit_requested` / `audit_completed` to canonical `Audit` / `Conversation` progress.
  - Map `deal_won` to `Payment`, `fix_in_progress` to `Fulfillment`, `fix_completed` to `Proof` readiness, and `revenue_active` to `Merchant Success`.
  - Preserve current data fields, but surface canonical stage labels in operator views.

- Impact
  - High. This is the operational registry that powers the dashboard and next actions.

### 3. Promotion Runner

- Current terminology
  - `promote_leads_to_clients_v1`
  - `qualified`, `selected_product`, `routing_reason`
  - `status: "qualified"`
  - `lifecycle.stage: "lead"`
  - `created_clients`, `updated_clients`

- Canonical terminology
  - `Lead`
  - `Qualified`
  - `Product Routed`
  - `Client Registry`

- Gap
  - The runner promotes qualified leads into Client Registry, but it still writes `lead` as the lifecycle stage.
  - It mixes business handoff language with internal route labels.

- Required mapping
  - Promote using canonical handoff labels at the interface layer.
  - Keep `selected_product` and `routing_reason`, but surface the stage as the canonical promotion step.
  - Make the handoff into Client Registry explicit in the runner report and downstream snapshots.

- Impact
  - High. This is the crossing point between acquisition and the merchant lifecycle.

### 4. Dashboard Snapshot

- Current terminology
  - `primary_focus`
  - `revenue_gaps`
  - `priority_clients`
  - `blocked_clients`
  - `next_actions`
  - `active_revenue_clients`
  - `merchant_revenue_recovered`
  - `stafford_revenue`

- Canonical terminology
  - `Revenue`
  - `Fulfillment`
  - `Merchant Success`
  - `System Health`
  - `Audit`
  - `Payment`
  - `Proof`

- Gap
  - The snapshot is operationally useful, but its top-level grouping is still derived from internal client scoring and revenue-gap language.
  - It does not consistently name the canonical lifecycle phase behind the action.

- Required mapping
  - Make the primary focus action name the canonical phase and the merchant together.
  - Reframe `revenue_gaps` into canonical business gaps: conversion gap, fulfillment gap, proof gap, merchant-success gap.
  - Keep counts and priority scoring, but present them through canonical phase labels.

- Impact
  - High. This snapshot is the working summary that drives operator focus.

### 5. CEO Snapshot

- Current terminology
  - `loaded`, `missing`, `malformed`
  - `primary_action`
  - `proof_or_revenue_gaps`
  - `audits_needed`
  - `next_best_action`
  - `lifecycle_stage`
  - `payment_status`
  - `blocked`

- Canonical terminology
  - `Merchant Acquisition`
  - `Merchant Conversion`
  - `Merchant Fulfillment`
  - `Merchant Success`
  - `Operator Control`

- Gap
  - The source loading states are system states, not merchant states, and they should stay hidden from Ross-facing views.
  - The business summary is close to canonical, but it still surfaces internal terms such as `proof_or_revenue_gaps`.

- Required mapping
  - Keep source-load states internal only.
  - Map the business summary to canonical lifecycle phases and suppress implementation jargon in the operator-facing payload.
  - Prefer merchant- and action-based labels over registry/load-state labels.

- Impact
  - High. This is the data source behind the Command Center.

### 6. Command Center

- Current terminology
  - `Action`
  - `Merchant`
  - `Product`
  - `Why now`
  - `Next step`
  - `Confidence`
  - `Supporting context`

- Canonical terminology
  - `Merchant`
  - `Acquisition`
  - `Conversion`
  - `Fulfillment`
  - `Proof`
  - `Merchant Success`

- Gap
  - The visible card is already Ross-facing, but the supporting context can still inherit system vocabulary from upstream snapshots.
  - The page should stay business-first and not leak source names or registry jargon.

- Required mapping
  - Keep the existing Ross-facing labels.
  - Ensure upstream payloads translate lifecycle labels into business language before they reach the page.
  - Hide all system diagnostics and source-specific state labels from the default view.

- Impact
  - High. This is the operator’s daily decision surface.

### 7. Revenue Command

- Current terminology
  - `Lead Registry Command`
  - `Current Bottleneck`
  - `Lifecycle Counts`
  - `Contact needed`
  - `Send initial outreach`
  - `Approved`
  - `Dry-run ready`
  - `Sent`
  - `Engaged`
  - `Send Proof`

- Canonical terminology
  - `Merchant Acquisition`
  - `Merchant Conversion`
  - `Merchant Fulfillment`
  - `Merchant Success`
  - `Proof Package`

- Gap
  - The page still reads like a lead-state machine control view rather than a merchant lifecycle control view.
  - `Send Proof` is useful, but it is narrower than canonical proof package language.

- Required mapping
  - Rename or relabel lifecycle counts into canonical phase groups.
  - Present proof work as part of proof-package completion, not just send-proof logging.
  - Keep the routing and bottleneck logic, but translate it to merchant lifecycle language.

- Impact
  - High. This view is a high-frequency operator control surface.

### 8. Leads Page

- Current terminology
  - `Lead Command`
  - `Stage`
  - `Next Action`
  - `Status`
  - `Contact Ready`
  - `Outreach Ready`
  - `Sent`
  - `Engaged`
  - `Blocked`

- Canonical terminology
  - `Real Store`
  - `Qualified Target`
  - `Contact Discovery`
  - `Contact Research`
  - `Outreach Draft`
  - `Approved Outreach`
  - `Conversation`

- Gap
  - The page exposes a lead-state machine vocabulary instead of the canonical acquisition lifecycle.
  - It does not tell Ross where the lead is in the merchant journey.

- Required mapping
  - Translate row-level stages to canonical acquisition terms.
  - Keep the underlying queue and readiness flags, but do not make them the visible lifecycle language.

- Impact
  - Medium-high. This page influences outreach execution and lead prioritization.

### 9. Client Pages

- Current terminology
  - `client_registry_v1`
  - `client_id`
  - `merchant_shop`
  - `payment_status`
  - `audit_status`
  - `fix_status`
  - `abando_installed`
  - `blocker_detection`
  - `next_action`

- Canonical terminology
  - `Client Registry`
  - `Audit`
  - `Payment`
  - `Packet`
  - `Fulfillment`
  - `Proof`
  - `Merchant Success`

- Gap
  - Client-facing operator surfaces still emphasize internal status fields over canonical lifecycle bands.
  - Packet and proof progression are not consistently first-class in the client language.

- Required mapping
  - Show canonical lifecycle labels alongside status fields.
  - Keep the current data model, but make the visible stage language follow the canonical lifecycle authority.

- Impact
  - Medium. This affects operator trust and clarity when moving from deal to fulfillment.

### 10. Packet Systems

- Current terminology
  - `packet_id`
  - `payment_pending`
  - `payment_received`
  - `execution_status`
  - `proof_status`
  - `completion_status`
  - `payment-return`
  - `bindPacketPayment`
  - `updatePacketLifecycle`

- Canonical terminology
  - `Packet Created`
  - `Scope`
  - `Merchant Approval`
  - `Implementation`
  - `QA`
  - `After-State Evidence`
  - `Proof Package`

- Gap
  - The packet layer is payment-centric and uses packet execution statuses instead of canonical fulfillment/proof stages.
  - `payment_received` is necessary, but it is only one step in the larger canonical lifecycle.

- Required mapping
  - Keep payment binding as the gate into packet work.
  - Map packet execution, proof, and completion statuses onto canonical fulfillment milestones.
  - Present packet progression as part of fulfillment and proof, not as a separate lifecycle.

- Impact
  - High. This is where payment, delivery, and proof converge.

### 11. Proof Systems

- Current terminology
  - `send-proof`
  - `dry_run_proof_recorded`
  - `live_send_attempted`
  - `REAL_SEND_SUCCEEDED`
  - `proof_count`
  - `execution_proof_register`

- Canonical terminology
  - `Proof Package`
  - `Merchant Review`
  - `Testimonial`
  - `Referral`

- Gap
  - The current proof layer records send and execution proof, but it does not consistently frame the result as a merchant proof package.
  - The system captures proof events more than proof outcomes.

- Required mapping
  - Keep proof events, but aggregate them into canonical proof-package language.
  - Use merchant-review and testimonial language where the operator is looking at business results, not transport mechanics.

- Impact
  - High. Proof is a core business objective, not a logging detail.

## B. Highest-value convergence changes

1. Make `ceo-snapshot` and the Command Center use canonical lifecycle labels everywhere Ross sees stages or reasons.
2. Re-label Client Registry stage output to canonical lifecycle phases, especially `Audit`, `Payment`, `Fulfillment`, `Proof`, and `Merchant Success`.
3. Translate lead stages on the Leads Page and Revenue Command into canonical acquisition language.
4. Map packet statuses into canonical fulfillment/proof progression instead of exposing payment-only status as the main story.
5. Reframe proof output from `send-proof` / execution mechanics into `Proof Package` language.

## C. Lowest-risk convergence changes

1. Presentation-layer label mapping only, without changing storage.
2. Hiding system load states such as `loaded`, `missing`, and `malformed` from Ross-facing UI.
3. Rewording section headers, table labels, and helper text to canonical lifecycle terms.
4. Adding canonical labels as display aliases while preserving existing fields and IDs.
5. Updating report text and summaries before touching any persistence logic.

## D. Changes that should NOT be made

1. Do not create a new lifecycle model.
2. Do not create a new state machine.
3. Do not create a new operating model.
4. Do not create new registries or duplicate merchant tracking.
5. Do not rename canonical data just to satisfy UI text.
6. Do not surface registry, adapter, load-state, or machine-state jargon to Ross.
7. Do not move payment, packet, or proof logic into a parallel system.

## E. Prioritized implementation sequence

1. Add a shared lifecycle-label mapping layer for operator reads only.
   - Apply it first in `ceo-snapshot`, `client-registry`, `loadOperatorLeads`, and the command-center snapshot loader.

2. Update Ross-facing UI surfaces.
   - Command Center
   - Revenue Command
   - Leads Page
   - Client-related operator views

3. Align promotion output.
   - Make the promotion runner and its report speak canonical handoff language.
   - Keep the existing registry write path unchanged.

4. Normalize packet and proof terminology.
   - Map packet execution and proof events to `Packet Created` -> `Fulfillment` -> `Proof Package`.

5. Tighten all residual references.
   - Remove remaining stage labels that are only meaningful to internal machinery.
   - Keep them in the data model if needed, but not in the operator vocabulary.

6. Validate that the Command Center can answer the business questions directly.
   - Who needs attention?
   - Which merchant is closest to paying?
   - Which fulfillment item is due?
   - Which proof package is incomplete?
   - What is blocked?
   - What should Ross do next?
