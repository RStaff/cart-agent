# StaffordOS Command Center UX Scope v1

## Purpose

The StaffordOS Command Center is the front door for Ross’s operating system across personal life, family, career, legal, health, Stafford Media, ShopiFixer, Abando, internal dev work, and future products.

The page must answer one question first:

What should Ross do next?

It must not become a dumping ground for every panel, table, or artifact.

## Current UX Integrity Verdict

Source: staffordos/ux_audit/output/operator_command_center_ux_integrity_v1.json

Current verdict:
- UX: not sufficient
- UX score: 37
- Architecture score: 78

Primary issues:
1. Old artifact command center appears before current business/unit truth.
2. Multiple sections ask versions of “what should Ross do next?”
3. Unit prioritization is happening inside the UI component.
4. Lead queue is embedded directly, making the page too long.
5. Navigation is owned by nested components instead of a single shell.

## UX North Star

The Command Center should behave like an operator cockpit, not a report page.

User experience should be:
1. Ross opens Command Center.
2. System shows one primary action.
3. System explains why that action matters.
4. System shows what domain/product it belongs to.
5. System shows proof/confidence/risk.
6. Ross can act, inspect, or route.
7. Supporting panels stay below or collapsed.

## Required Page Structure

### 1. Operator Shell

One consistent page shell owns title, subtitle, navigation, page status, and source-of-truth badges.

Nested components should not each own the global navigation.

### 2. Primary Action Block

This is the top block.

It must be driven by a canonical snapshot, not by UI-local logic.

Required fields:
- action_id
- action_label
- action_type
- domain_id
- product_id
- linked_units
- owner
- priority_score
- urgency
- confidence
- evidence
- risk
- next_step
- source_snapshots
- generated_at

Example shape:
{
  "action_label": "Follow up on real ShopiFixer offer and close payment",
  "domain_id": "shopifixer",
  "action_type": "close",
  "owner": "ross",
  "priority_score": 83,
  "confidence": 0.78,
  "next_step": "Send follow-up or manually close payment."
}

### 3. Ask / Chat Interface

The Command Center must support the future ChatGPT-like operator interface.

It should allow Ross to ask:
- What should I do next?
- What is blocked?
- What matters today?
- What is happening with ShopiFixer?
- What is happening with Abando?
- What do I need to remember about family/career/legal/business?

This should be visually near the top, but not above the primary action.

### 4. Active Work Summary

Show units of work as cards, not tables.

Group by:
- Do now
- Waiting on Ross
- Waiting on client
- Waiting on system
- Background/system work

Do not show every unit with equal weight.

### 5. Revenue / Close Summary

Show:
- Stafford revenue captured
- Merchant value proven
- Revenue gap
- active close action
- follow-up message if present

This should support the primary action, not compete with it.

### 6. Lead Summary

Command Center should show only a summary:
- total leads
- outreach ready
- sent
- engaged
- blocked
- top bottleneck
- link to Lead Command

The full LeadQueue table belongs on /operator/leads, not the Command Center.

### 7. System / Legacy Artifact Section

Old RossCommandCenterSurface artifacts should not dominate the page.

They should be collapsed or clearly labeled:
- Legacy Build Artifact
- System Truth
- Execution Session Pack
- Diagnostic Only

They should not compete with the current primary action.

## Data Source Policy

The UI must not invent business logic.

Allowed canonical sources:
- staffordos/clients/operator_dashboard_snapshot_v1.json
- staffordos/snapshots/unit_work_snapshot_v1.json
- staffordos/clients/client_registry_v1.json
- staffordos/leads/lead_registry_v1.json
- staffordos/ux_audit/output/operator_command_center_ux_integrity_v1.json
- staffordos/domains/domain_registry_v1.json
- staffordos/gates/confidence_gate_v1.json
- staffordos/events/outcome_event_log_v1.json

New required source:
- staffordos/snapshots/primary_action_snapshot_v1.json

## Implementation Rule

Do not patch UI until this sequence is followed:
1. PM agent reviews scope.
2. Architect agent maps data flow.
3. Primary action snapshot builder is created.
4. UI consumes primary action snapshot.
5. UX integrity validator re-runs.
6. Only then adjust visual layout.

## Definition of Done

The Command Center UX is sufficient when:
- There is exactly one top-level answer to “What should Ross do next?”
- That answer comes from canonical truth, not UI-local sorting.
- Legacy command artifacts are not the first thing shown.
- Leads are summarized, not embedded as a full table.
- Unit work is grouped by execution state.
- Business/product/personal domains can be added without redesign.
- UX integrity score improves from 37 to at least 70.
