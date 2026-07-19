# STAFFORDOS_OPERATOR_DAILY_WORKFLOW_V1

Historical status:
- Historical planning record preserved for repository traceability.
- Technical content is preserved unchanged.
- Continuity-route statements are partially superseded where applicable by `STAFFORDOS_CANONICAL_CONTINUITY_ROUTE_AUDIT_V1.md`.

This workflow is derived from `STAFFORDOS_OPERATOR_SURFACE_INVENTORY_V1.md` and uses only existing StaffordOS surfaces.

## 1. Workday Definition

### Start
- **08:00 Login**

### End
- **End-of-day review**

### Operating assumption
- StaffordOS is the only application Ross uses during the workday.
- The workflow is operator-led and uses existing surfaces only.
- Where a needed capability is missing, that is called out as a gap rather than invented.

## 2. Canonical Daily Sequence

1. `/operator`
2. `/operator/command-center`
3. `/operator/leads`
4. `/operator/campaigns`
5. `/operator/cockpit`
6. `/operator/revenue-command`
7. `/run-audit` and `/audit-result`
8. `/shopifixer` and `/pricing`
9. `/payment-return` and `/shopifixer/status`
10. `/operator/system-map`
11. `/operator/execution-log`
12. `/operator/relationship/[id]`
13. `/merchant`
14. `/briefing`
15. `/director`
16. End-of-day review in `/operator`

### Practical note
- Some of these routes are operator surfaces.
- Some are supporting merchant/pilot surfaces that Ross must inspect during the first-customer pilot.
- The workflow is intentionally linear, but Ross will move back and forth between surfaces when a customer is active.

## 3. Step-by-Step Workflow

### Step 1. Login / Executive Home
- **Route:** `/operator`
- **Purpose:** establish the day’s priorities and see the top-level commercial state.
- **Decision made:** what to work first: leads, blockers, revenue, or active merchant continuity.
- **Data authority:** generated projection, with snapshots from revenue, client registry, lifecycle, fulfillment, execution logs, and decision engine.
- **Expected actions:** review top blockers, relationship attention, paid work, and decision-engine comparison; navigate to the next screen.
- **Exit criteria:** top priority is selected and Ross knows which active workstream owns the morning.

### Step 2. Command Center
- **Route:** `/operator/command-center`
- **Purpose:** execute evidence capture and completion work.
- **Decision made:** whether a merchant case is ready for before/after evidence, scoped fix, proof package, or completion.
- **Data authority:** generated projection plus workflow snapshots and filesystem-backed command-center state.
- **Expected actions:** capture before evidence, after evidence, scoped fix, proof package, and completion details.
- **Exit criteria:** the current merchant/work item has a recorded execution state and any available proof artifacts.

### Step 3. Lead Review
- **Route:** `/operator/leads`
- **Purpose:** identify which merchants need outreach or progression.
- **Decision made:** move a lead to outreach, mark sent, or mark engaged.
- **Data authority:** generated projection + lead registry API.
- **Expected actions:** inspect lead pipeline, open lead detail, apply lead actions.
- **Exit criteria:** each relevant lead has a next action assigned or a follow-up status updated.

### Step 4. Campaign / Relationship Context
- **Route:** `/operator/campaigns`
- **Purpose:** review relationship structure and campaign context before outreach.
- **Decision made:** which campaign or relationship should be acted on next.
- **Data authority:** generated relationship/campaign resolver report.
- **Expected actions:** inspect campaign graph and relationship context.
- **Exit criteria:** Ross knows which merchant relationship needs outreach or follow-up.

### Step 5. Executive Decision Check
- **Route:** `/operator/cockpit`
- **Purpose:** review CEO-level truth and primary action state.
- **Decision made:** whether the current state supports the next action or requires intervention.
- **Data authority:** generated truth snapshot via `/api/operator/ceo-truth-snapshot`.
- **Expected actions:** inspect decision status, execute primary action if appropriate.
- **Exit criteria:** current decision state is understood and primary action is either executed or deferred.

### Step 6. Revenue Review
- **Route:** `/operator/revenue-command`
- **Purpose:** review revenue pipeline and blockers.
- **Decision made:** whether revenue work is active, blocked, or waiting on outreach/payment.
- **Data authority:** generated projection from lead registry, revenue truth, and dashboard snapshots.
- **Expected actions:** inspect blockers and pipeline status.
- **Exit criteria:** Ross can say whether revenue work can move forward or needs another upstream action.

### Step 7. Qualification / Audit
- **Routes:** `/run-audit` then `/audit-result`
- **Purpose:** evaluate a merchant and record the audit result.
- **Decision made:** whether the merchant qualifies for the ShopiFixer flow.
- **Data authority:** public audit data and audit artifacts.
- **Expected actions:** run the audit, inspect result, determine if the merchant should enter the checkout path.
- **Exit criteria:** audit result is captured and the merchant is either qualified or rejected.

### Step 8. Customer Entry / Checkout
- **Routes:** `/shopifixer` then `/pricing`
- **Purpose:** confirm the customer entry point and pricing path the merchant sees.
- **Decision made:** whether the merchant can proceed to checkout.
- **Data authority:** public checkout state, query params, and checkout API.
- **Expected actions:** verify the page loads, confirm store context, and proceed to checkout.
- **Exit criteria:** checkout initiation is ready and the merchant has an active packet path.

### Step 9. Payment Return / Continuity
- **Routes:** `/payment-return` then `/shopifixer/status`
- **Purpose:** validate payment completion and continuity handoff.
- **Decision made:** whether the packet is paid and continuity is visible.
- **Data authority:** live packet authority plus continuity projections.
- **Expected actions:** verify redirect, confirm packet hydration, confirm paid state, and inspect continuity screen.
- **Exit criteria:** `payment_received` is visible and the merchant continuity page is showing the correct open state.

### Step 10. System Health / Topology
- **Route:** `/operator/system-map`
- **Purpose:** inspect system topology, blockers, and recovery actions.
- **Decision made:** whether a system blocker needs proof/recovery handling.
- **Data authority:** generated system-map API and manifests.
- **Expected actions:** inspect manifests, trigger proof/recovery run if needed.
- **Exit criteria:** operator knows whether any system issue blocks the day’s work.

### Step 11. Execution Review
- **Route:** `/operator/execution-log`
- **Purpose:** review what executed, what failed, and what the model suggests next.
- **Decision made:** whether follow-up action is required.
- **Data authority:** execution log projection.
- **Expected actions:** inspect execution history and outcome scores.
- **Exit criteria:** the day’s execution state is visible and any anomalies are recognized.

### Step 12. Merchant Detail
- **Route:** `/operator/relationship/[id]`
- **Purpose:** inspect one merchant’s full relationship state.
- **Decision made:** whether the merchant should move to follow-up, proposal, delivery, or case study handling.
- **Data authority:** generated projections from revenue, client, lifecycle, fulfillment, and execution data.
- **Expected actions:** review merchant facts, history, and action context.
- **Exit criteria:** Ross can state the merchant’s current lifecycle position and next action.

### Step 13. Merchant Continuity
- **Route:** `/merchant`
- **Purpose:** review merchant recovery or summary state.
- **Decision made:** whether the merchant is healthy, needs follow-up, or is ready for the next action.
- **Data authority:** generated merchant summary projection.
- **Expected actions:** inspect summary state.
- **Exit criteria:** merchant health is understood and reflected in the active operator plan.

### Step 14. Briefing
- **Route:** `/briefing`
- **Purpose:** summarize the day’s active work and operational posture.
- **Decision made:** what matters most for the next block of work.
- **Data authority:** briefing JSON / generated summary.
- **Expected actions:** read and reconcile the day’s operational summary.
- **Exit criteria:** Ross has a current summary of the system state.

### Step 15. Director
- **Route:** `/director`
- **Purpose:** inspect broader governance and system activity.
- **Decision made:** whether any governance, approvals, or signals need attention.
- **Data authority:** StaffordOS runtime JSON and generated projections.
- **Expected actions:** inspect director panels and queue/state information.
- **Exit criteria:** governance and signal state are understood before day close.

### Step 16. End-of-Day Review
- **Route:** `/operator`
- **Purpose:** close the loop on the day’s active workstreams.
- **Decision made:** what remains open for tomorrow and what is complete.
- **Data authority:** same as operator home, plus the day’s updated projections and logs.
- **Expected actions:** verify closures, note carryover, and confirm any active merchant or lead state.
- **Exit criteria:** Ross leaves with a clear handoff list and no ambiguity on open work.

## 4. Where AI Assists

AI helps most in the following places:
- lead prioritization
- merchant scoring
- outreach drafting
- proposal drafting
- risk detection
- blocker detection
- next-best-action selection
- execution-log interpretation
- revenue-command interpretation
- relationship summary synthesis

AI does not remove the need for operator judgment on:
- qualification
- sending outreach
- approving the next action
- checking payment continuity
- deciding whether a merchant is ready for delivery

## 5. Where the Workflow Breaks Today

Using the inventory only, the workflow breaks at these points:

### Missing or incomplete lifecycle screens
- meeting
- proposal
- referral
- case study

### Missing consolidated operator state
- there is no single screen that joins:
  - packet authority
  - payment state
  - fulfillment state
  - continuity state

### Projection-heavy dependencies
- operator home, revenue command, relationship detail, system map, and command center still depend on generated projections and snapshots.

### Placeholder surfaces
- capacity
- analytics
- beta ops

### Split merchant journey
- customer-facing continuity is outside the operator workspace and remains a separate inspection path.

## 6. Ideal Navigation Tree Using Existing Routes

```text
/operator
  /operator/command-center
  /operator/leads
  /operator/campaigns
  /operator/cockpit
  /operator/revenue-command
  /operator/system-map
  /operator/execution-log
  /operator/relationship/[id]
  /operator/products
  /operator/slice-truth
  /briefing
  /director
  /run-audit
    /audit-result
  /shopifixer
    /pricing
    /payment-return
    /shopifixer/status
  /merchant
  /dashboard
    /embedded/dashboard
  /embedded
    /embedded/review
  /control
  /install/shopify
```

Notes:
- `/pricing` is a redirect into the ShopiFixer flow.
- `/free-audit` is an alias to `/run-audit`.
- `/shopifixer/status` is the merchant continuity surface, not an internal operator surface.
- `/payment-return` is a handoff route, not a working screen.

## 7. Executive Summary

### Can StaffordOS realistically replace terminal commands and spreadsheets for operating Stafford Media Consulting today?
- **Not fully.**
- It can replace a meaningful amount of day-to-day inspection and execution.
- It cannot yet replace terminal commands and spreadsheets for the entire ShopiFixer lifecycle because the current surface set is fragmented and several lifecycle stages are missing or incomplete.

### Smallest number of missing operator capabilities required
From the inventory, the minimum missing capabilities are:
1. a dedicated meeting screen
2. a dedicated proposal screen
3. a dedicated referral screen
4. a dedicated case-study screen
5. a single consolidated live operator view for packet, payment, fulfillment, and continuity state

### Bottom line
- StaffordOS is operationally useful today.
- It is not yet the sole application Ross can use all day without falling back to terminal-style inspection or spreadsheet-style synthesis for the full lifecycle.
