# STAFFORDOS_OPERATOR_GAP_CLOSURE_PLAN_V1

Historical status:
- Historical planning record preserved for repository traceability.
- Technical content is preserved unchanged.
- Continuity-route statements are partially superseded where applicable by `STAFFORDOS_CANONICAL_CONTINUITY_ROUTE_AUDIT_V1.md`.

Source documents used:
- `STAFFORDOS_OPERATOR_SURFACE_INVENTORY_V1.md`
- `STAFFORDOS_OPERATOR_DAILY_WORKFLOW_V1.md`
- `SHOPIFIXER_FIRST_CUSTOMER_OPERATIONS_RUNBOOK_V1.md`
- `SHOPIFIXER_FIRST_CUSTOMER_EVIDENCE_PACKAGE_TEMPLATE_V1.md`
- `SHOPIFIXER_PRODUCTION_PILOT_DECISION_RECORD_V1.md`

Scope: implementation planning only. No code, UI, or infrastructure changes are made by this document.

## 1. Workflow Gap Matrix

### Step 1. Login / Executive Home
- **Existing screen or route:** `/operator`
- **Current capability:** Executive home aggregates revenue, blockers, relationship attention, paid work, and decision-engine comparison.
- **Missing capability:** Single durable operator home that joins live packet authority, payment state, fulfillment state, and continuity state.
- **Severity:** High
- **Business impact:** Ross still has to jump to other screens and reconcile state manually at the start of the day.
- **Estimated implementation effort:** Medium
- **Dependencies:** live packet authority, continuity page, projections from revenue/client/lifecycle/fulfillment
- **Acceptance criteria:** `/operator` shows a unified daily priority view that includes active paid packet state and continuity status for the current merchant.

### Step 2. Command Center
- **Existing screen or route:** `/operator/command-center`
- **Current capability:** Evidence capture and completion workflow exists.
- **Missing capability:** End-to-end workboard tied to live packet authority and delivery progression; command center still depends on workflow snapshots.
- **Severity:** High
- **Business impact:** Operator execution can start, but the handoff from paid packet to delivery work is still split across multiple surfaces.
- **Estimated implementation effort:** Medium
- **Dependencies:** primary action snapshot, unit work snapshot, fulfillment truth, packet authority
- **Acceptance criteria:** command center can show the paid packet, required evidence, and current continuity state in one place.

### Step 3. Lead Review
- **Existing screen or route:** `/operator/leads`
- **Current capability:** Lead pipeline view with outreach actions.
- **Missing capability:** Unified lead-to-packet progression context and direct link to downstream checkout/payment state.
- **Severity:** Medium
- **Business impact:** Outreach is actionable, but the operator still must reconcile lead state with paid packet state elsewhere.
- **Estimated implementation effort:** Low
- **Dependencies:** lead registry, client registry, packet authority
- **Acceptance criteria:** lead rows clearly show whether a lead is already in audit, checkout, or payment state.

### Step 4. Campaign / Relationship Context
- **Existing screen or route:** `/operator/campaigns`
- **Current capability:** Relationship graph and campaign summary.
- **Missing capability:** Decision-ready relationship summary with explicit next action, stage, and packet/payment linkage.
- **Severity:** Medium
- **Business impact:** Relationship context exists, but it is not yet sufficient to drive the full daily operator sequence without extra synthesis.
- **Estimated implementation effort:** Low
- **Dependencies:** campaign resolver report, relationship data, lifecycle truth
- **Acceptance criteria:** relationship context includes current lifecycle stage, active packet state, and next best action.

### Step 5. Executive Decision Check
- **Existing screen or route:** `/operator/cockpit`
- **Current capability:** CEO truth snapshot and primary action execution.
- **Missing capability:** Direct action gating from live merchant continuity and packet state.
- **Severity:** High
- **Business impact:** Ross can review high-level truth, but must still verify live customer continuity elsewhere before acting.
- **Estimated implementation effort:** Medium
- **Dependencies:** CEO truth snapshot, primary action snapshot, packet authority
- **Acceptance criteria:** cockpit shows when a merchant is already paid and what action follows that state.

### Step 6. Revenue Review
- **Existing screen or route:** `/operator/revenue-command`
- **Current capability:** Revenue pipeline and blocker summary.
- **Missing capability:** Durable payment-state linkage and direct continuity visibility for active ShopiFixer packets.
- **Severity:** High
- **Business impact:** Revenue work can be seen, but paid-customer continuity still requires manual cross-checking.
- **Estimated implementation effort:** Medium
- **Dependencies:** revenue truth, lead registry, packet authority
- **Acceptance criteria:** revenue command shows paid-packet status and the next operational step for live merchants.

### Step 7. Qualification / Audit
- **Existing screen or route:** `/run-audit`, `/audit-result`
- **Current capability:** Public audit can be run and inspected.
- **Missing capability:** Operator-facing audit queue and a durable link from audit result to packet creation and payment readiness.
- **Severity:** Medium
- **Business impact:** Qualification exists, but operator must inspect it indirectly through public routes and result pages.
- **Estimated implementation effort:** Low
- **Dependencies:** audit data, merchant summary state
- **Acceptance criteria:** audit result clearly transitions the merchant into the checkout-ready state visible in StaffordOS.

### Step 8. Customer Entry / Checkout
- **Existing screen or route:** `/shopifixer`, `/pricing`
- **Current capability:** Merchant entry point and pricing path are live.
- **Missing capability:** Operator view of entry conversion and the link from checkout intent to packet creation.
- **Severity:** High
- **Business impact:** Checkout works, but Ross cannot fully manage the merchant path from inside StaffordOS alone.
- **Estimated implementation effort:** Medium
- **Dependencies:** public checkout endpoint, packet authority, pricing redirect
- **Acceptance criteria:** operator can see the current checkout state and whether a merchant has an active packet path without leaving StaffordOS.

### Step 9. Payment Return / Continuity
- **Existing screen or route:** `/payment-return`, `/shopifixer/status`
- **Current capability:** Payment return redirects correctly and continuity page exists.
- **Missing capability:** A single authoritative continuity view that never falls back to request-unavailable for a paid packet.
- **Severity:** Critical
- **Business impact:** This is the first-customer continuity point; if it fails, the customer experience breaks immediately after payment.
- **Estimated implementation effort:** Medium
- **Dependencies:** packet authority, continuity hydration, payment-return redirect, fulfillment truth
- **Acceptance criteria:** paid packet renders `Intake pending`, `Your fix request is open.`, store domain, and `Review: Payment received`.

### Step 10. System Health / Topology
- **Existing screen or route:** `/operator/system-map`
- **Current capability:** System topology and blocker actions are visible.
- **Missing capability:** Single operator page that combines system health with live merchant impact and job/webhook status.
- **Severity:** Medium
- **Business impact:** System issues can be detected, but their effect on the live customer flow is not instantly obvious.
- **Estimated implementation effort:** Medium
- **Dependencies:** system-map API, manifest panel, blocker action panel
- **Acceptance criteria:** system map shows whether a live merchant path is blocked by a system issue.

### Step 11. Execution Review
- **Existing screen or route:** `/operator/execution-log`
- **Current capability:** Historical execution and outcome review.
- **Missing capability:** Clear actionability for the current day’s merchant work and live packet continuity.
- **Severity:** Medium
- **Business impact:** Execution history helps, but does not itself drive today’s live merchant flow.
- **Estimated implementation effort:** Low
- **Dependencies:** execution log loader, outcome logs
- **Acceptance criteria:** execution log highlights current live merchant failures and next actions.

### Step 12. Merchant Detail
- **Existing screen or route:** `/operator/relationship/[id]`
- **Current capability:** Merchant 360 view across several projections.
- **Missing capability:** Live packet authority and continuity status integrated into the relationship view.
- **Severity:** High
- **Business impact:** Merchant decisioning remains split between relationship state and live payment state.
- **Estimated implementation effort:** Medium
- **Dependencies:** revenue truth, client registry, lifecycle truth, fulfillment truth, execution logs
- **Acceptance criteria:** relationship view shows current paid packet, stage, continuity state, and next action in one screen.

### Step 13. Merchant Continuity
- **Existing screen or route:** `/merchant`
- **Current capability:** Merchant recovery/summary page.
- **Missing capability:** Operator-facing merchant continuity summary with live packet authority and delivery readiness.
- **Severity:** Medium
- **Business impact:** Merchant health is visible, but not as a primary operator control surface.
- **Estimated implementation effort:** Low
- **Dependencies:** dashboard / recovery data
- **Acceptance criteria:** merchant summary clearly indicates whether the account is paid, open, or blocked.

### Step 14. Briefing
- **Existing screen or route:** `/briefing`
- **Current capability:** Daily operational summary.
- **Missing capability:** Actionable linkage to live merchant packets and fulfillment state.
- **Severity:** Low
- **Business impact:** Briefing improves awareness, but does not replace direct operational screens.
- **Estimated implementation effort:** Low
- **Dependencies:** briefing JSON
- **Acceptance criteria:** briefing includes the current paid merchant and the top open blocker.

### Step 15. Director
- **Existing screen or route:** `/director`
- **Current capability:** Governance and signal overview.
- **Missing capability:** Direct live-merchant continuity command surface.
- **Severity:** Medium
- **Business impact:** Governance is available, but the operator still needs synthesis to act on the first customer path.
- **Estimated implementation effort:** Low
- **Dependencies:** runtime JSON / generated projections
- **Acceptance criteria:** director clearly flags current customer-impacting state and escalations.

### Step 16. End-of-Day Review
- **Existing screen or route:** `/operator`
- **Current capability:** Executive home can be revisited at close.
- **Missing capability:** End-of-day consolidation of completed work, open merchant state, and evidence capture.
- **Severity:** High
- **Business impact:** Ross cannot close the day with a single authoritative summary without checking multiple screens.
- **Estimated implementation effort:** Medium
- **Dependencies:** operator home, execution log, packet authority, continuity page, evidence package artifacts
- **Acceptance criteria:** end-of-day review shows all active merchants, completed actions, open risks, and next-day priorities.

## 2. Wave Prioritization

### Wave 1 — Minimum capabilities for StaffordOS-only operations

1. Unified operator home with live packet/payment/continuity state
2. Continuity page that never falls back to request-unavailable for a paid packet
3. Merchant detail screen with live packet authority joined to relationship state
4. Operator-visible checkout/payment linkage for active merchant flows
5. End-of-day operational consolidation on the operator home

### Wave 2 — Efficiency improvements

1. Lead rows showing audit/checkout/payment state
2. Revenue command tied directly to live paid-packet state
3. System map showing merchant impact of blockers
4. Execution log highlighting live customer failures
5. Briefing and director showing stronger current-day actionability

### Wave 3 — Automation and AI enhancements

1. Lead prioritization assistance
2. Merchant scoring assistance
3. Outreach drafting assistance
4. Proposal drafting assistance
5. Risk / blocker detection assistance
6. Next-best-action assistance

## 3. Top 10 Implementation Backlog

### 1. Unified operator home with live paid packet state
- **Existing route:** `/operator`
- **Required change:** surface live packet authority, payment status, and continuity state in one home view.
- **Business value:** removes the need to cross-check multiple screens for the first customer.
- **User story:** As Ross, I can open StaffordOS and immediately see which merchant is paid, open, blocked, or ready for the next action.
- **Acceptance criteria:** home view shows active packet, payment status, continuity status, and next action.

### 2. Continuity screen that never shows request-unavailable for paid packets
- **Existing route:** `/shopifixer/status`
- **Required change:** make continuity state authoritative for paid packets and show open state instead of fallback copy.
- **Business value:** protects the first customer’s post-payment experience.
- **User story:** As Ross, I can verify the merchant sees a valid paid continuity screen after payment.
- **Acceptance criteria:** paid packet renders `Intake pending`, `Your fix request is open.`, store domain, and `Review: Payment received`.

### 3. Merchant 360 with live packet authority
- **Existing route:** `/operator/relationship/[id]`
- **Required change:** join relationship view with live packet/payment state and current continuity state.
- **Business value:** gives Ross one merchant record instead of multiple projections.
- **User story:** As Ross, I can inspect any merchant and see current payment and delivery state without leaving StaffordOS.
- **Acceptance criteria:** relationship page includes live packet id, reservation id, payment status, and next action.

### 4. Operator-visible checkout linkage
- **Existing route:** `/shopifixer`, `/pricing`
- **Required change:** expose whether a merchant has an active packet and what stage they are in.
- **Business value:** improves control over active buyers and removes guesswork during checkout.
- **User story:** As Ross, I can tell whether a merchant has entered checkout and whether payment authority exists.
- **Acceptance criteria:** operator can identify active checkout state from StaffordOS without terminal commands.

### 5. End-of-day operator consolidation
- **Existing route:** `/operator`
- **Required change:** make end-of-day review summarize all live merchants, open work, and evidence state.
- **Business value:** reduces end-of-day manual reconciliation.
- **User story:** As Ross, I can close the day from one screen with no ambiguity on open work.
- **Acceptance criteria:** operator home shows completed work, open merchants, and next-day priorities.

### 6. Lead rows with lifecycle stage
- **Existing route:** `/operator/leads`
- **Required change:** show audit, checkout, and payment stage on each lead row.
- **Business value:** improves prioritization and outreach sequencing.
- **User story:** As Ross, I can see whether a lead is already qualified, in audit, or already paid.
- **Acceptance criteria:** each lead row shows stage and downstream state.

### 7. Revenue command tied to live paid packets
- **Existing route:** `/operator/revenue-command`
- **Required change:** highlight current paid packets and their live operational state.
- **Business value:** revenue work becomes actionable rather than purely descriptive.
- **User story:** As Ross, I can see which revenue items are already paid and where execution stands.
- **Acceptance criteria:** revenue command page links paid packet state to current action.

### 8. System map with customer impact
- **Existing route:** `/operator/system-map`
- **Required change:** show whether a blocker affects a live merchant path.
- **Business value:** helps Ross prioritize incidents that affect customers.
- **User story:** As Ross, I can tell whether a system issue is blocking the first customer.
- **Acceptance criteria:** system map shows active customer impact for each blocker.

### 9. Execution log with live merchant failures
- **Existing route:** `/operator/execution-log`
- **Required change:** promote current live customer failures to the top of the log.
- **Business value:** shortens the time to detect and fix broken live paths.
- **User story:** As Ross, I can see live failures and recent recovery actions on one page.
- **Acceptance criteria:** execution log surfaces active customer-impacting incidents first.

### 10. Briefing/director actionability
- **Existing route:** `/briefing`, `/director`
- **Required change:** connect briefing and director summaries to live merchant status and top blockers.
- **Business value:** governance and awareness become operationally useful.
- **User story:** As Ross, I can open briefing or director and immediately see what needs attention today.
- **Acceptance criteria:** briefing/director include current merchant, blocker, and next action.

## 4. Recommendation

**After completing Wave 1, can StaffordOS realistically replace terminals, spreadsheets, and ad hoc scripts for daily business operations?**

**Not fully.**

Wave 1 would make StaffordOS usable as the primary daily operating surface for the first ShopiFixer customer and most operator tasks, but it would still leave a few gaps:
- lead stage visibility would still be projection-heavy
- revenue command would still need extra synthesis
- system map would still be partially detached from live merchant impact
- briefing/director would still be summary surfaces rather than true execution surfaces

### What remains after Wave 1
- better prioritization across leads and revenue
- stronger system-impact visibility
- more actionable briefing/director surfaces
- AI assistance for ranking, drafting, and next-best-action

### Bottom line
Wave 1 gets StaffordOS close to replacing terminals and spreadsheets for the first-customer operating loop, but not fully across the whole business. The remaining gap is mostly efficiency and synthesis, not customer readiness.
