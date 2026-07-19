# STAFFORDOS_WAVE1_EXECUTION_PLAN_V1

Source documents used:
- `STAFFORDOS_OPERATOR_SURFACE_INVENTORY_V1.md`
- `STAFFORDOS_OPERATOR_DAILY_WORKFLOW_V1.md`
- `STAFFORDOS_OPERATOR_GAP_CLOSURE_PLAN_V1.md`

Scope: execution planning only. No code, UI, or implementation changes are made by this document.

## 1. Wave 1 Backlog Execution Order

### Item 1. Continuity screen that never shows request-unavailable for paid packets
- **Implementation order:** first
- **Existing route(s):** `/shopifixer/status`
- **Existing source files:** `abando-frontend/app/shopifixer/status/page.tsx`, packet authority support files in `web/src/routes/packetAuthority.esm.js`, `web/src/lib/packetRepository.js`
- **Existing data authority:** live packet authority + continuity projections
- **Required source-of-truth change:** continuity page must treat live packet authority as the primary paid-packet source and must not fall back to request-unavailable for a paid packet
- **UI components affected:** continuity page labels, packet state display, review state display
- **APIs affected:** `GET /api/packets/:packet_id`
- **Dependencies:** packet authority, continuity hydration, payment-return redirect
- **Estimated implementation time:** medium
- **Testing strategy:** validate paid packet render, verify store and reservation context, verify no request-unavailable copy for `payment_received`
- **Rollback strategy:** revert the continuity hydration change and restore current fallback behavior
- **Acceptance criteria:** paid packet renders `Intake pending`, `Your fix request is open.`, store domain, and `Review: Payment received`

### Item 2. Unified operator home with live paid packet state
- **Implementation order:** second
- **Existing route(s):** `/operator`
- **Existing source files:** `staffordos/ui/operator-frontend/app/operator/page.tsx`, `staffordos/ui/operator-frontend/lib/operator/loadDashboardSnapshot.ts`, `staffordos/ui/operator-frontend/lib/operator/loadPrimaryActionSnapshot.ts`, `staffordos/ui/operator-frontend/lib/operator/loadExecutionLog.ts`
- **Existing data authority:** generated projections plus live packet continuity state
- **Required source-of-truth change:** operator home must join live packet authority and continuity state into the daily priority view
- **UI components affected:** home summary cards, blocker panels, paid work panels, relationship attention panels
- **APIs affected:** operator snapshot APIs, packet authority API, continuity state sources
- **Dependencies:** continuity screen, packet authority, dashboard/primary action snapshots
- **Estimated implementation time:** medium
- **Testing strategy:** validate home shows paid packet and continuity status; confirm navigation remains intact
- **Rollback strategy:** revert home panel changes and restore projection-only rendering
- **Acceptance criteria:** `/operator` shows active packet, payment status, continuity status, and next action

### Item 3. Merchant 360 with live packet authority
- **Implementation order:** third
- **Existing route(s):** `/operator/relationship/[id]`
- **Existing source files:** `staffordos/ui/operator-frontend/app/operator/relationship/[id]/page.tsx`
- **Existing data authority:** revenue truth, client registry, lifecycle truth, fulfillment truth, execution logs, decision engine
- **Required source-of-truth change:** join the relationship view with live packet/payment state and current continuity state
- **UI components affected:** merchant summary, stage indicators, action panel, evidence/continuity sections
- **APIs affected:** packet authority API, continuity page state sources
- **Dependencies:** continuity screen, operator home, packet authority
- **Estimated implementation time:** medium
- **Testing strategy:** load a paid merchant relation and verify packet id, reservation id, and payment state render consistently
- **Rollback strategy:** remove packet continuity join and revert to current projection-only relationship rendering
- **Acceptance criteria:** relationship page includes live packet id, reservation id, payment status, and next action

### Item 4. Operator-visible checkout linkage
- **Implementation order:** fourth
- **Existing route(s):** `/shopifixer`, `/pricing`
- **Existing source files:** `abando-frontend/app/shopifixer/page.tsx`, `web/src/routes/pricing.esm.js`
- **Existing data authority:** public checkout API, packet authority
- **Required source-of-truth change:** expose active packet status and stage in the operator-visible merchant path
- **UI components affected:** checkout call-to-action, status indicators, merchant entry context
- **APIs affected:** public checkout endpoint, packet authority API
- **Dependencies:** packet authority, continuity screen
- **Estimated implementation time:** medium
- **Testing strategy:** verify merchant checkout path remains unchanged while operator can identify active packet state
- **Rollback strategy:** restore current merchant-facing checkout flow without operator linkage
- **Acceptance criteria:** operator can determine whether a merchant has an active packet path without leaving StaffordOS

### Item 5. End-of-day operator consolidation
- **Implementation order:** fifth
- **Existing route(s):** `/operator`
- **Existing source files:** `staffordos/ui/operator-frontend/app/operator/page.tsx`, supporting operator snapshot loaders
- **Existing data authority:** same as operator home plus updated logs and packet state
- **Required source-of-truth change:** operator home must summarize completed work, open merchants, and evidence state at close
- **UI components affected:** day summary sections, open-work panels, completion indicators
- **APIs affected:** operator snapshot APIs, packet authority API, execution log API
- **Dependencies:** unified operator home, execution log, continuity screen
- **Estimated implementation time:** medium
- **Testing strategy:** validate end-of-day summary with a paid packet and a completed evidence trail
- **Rollback strategy:** revert end-of-day summary additions to current home baseline
- **Acceptance criteria:** operator home shows completed work, open merchants, and next-day priorities

## 2. Sprint Plan

### Sprint 1
- **Objective:** make paid-packet continuity authoritative and operator-visible.
- **Deliverables:**
  - continuity page no longer renders request-unavailable for paid packets
  - continuity page renders paid state using live packet authority
  - packet/status/reservation/store context is preserved
- **Definition of Done:**
  - first customer continuity screen renders the expected paid state
  - no regression in payment-return flow
- **Risks:**
  - packet authority and continuity state mismatch
  - stale fallback behavior remains in the render path
- **Blocking dependencies:**
  - packet authority API
  - live payment-return redirect

### Sprint 2
- **Objective:** make `/operator` the primary live operating surface.
- **Deliverables:**
  - operator home includes live packet and continuity state
  - operator home highlights current paid merchant and top blocker
- **Definition of Done:**
  - Ross can open `/operator` and identify the active customer state without leaving StaffordOS
- **Risks:**
  - operator home becomes overloaded with snapshot data
  - live packet data may be visually inconsistent with projections
- **Blocking dependencies:**
  - continuity screen from Sprint 1
  - operator snapshot loaders

### Sprint 3
- **Objective:** connect merchant detail and checkout linkage to live packet state.
- **Deliverables:**
  - relationship page shows live packet/payment state
  - merchant checkout linkage is visible in operator workflow
- **Definition of Done:**
  - a merchant can be tracked from entry through paid packet in one operator path
- **Risks:**
  - relationship view remains projection-heavy
  - merchant linkage may duplicate data shown elsewhere
- **Blocking dependencies:**
  - Sprint 1 continuity state
  - Sprint 2 operator home

### Sprint 4
- **Objective:** close the daily operating loop with end-of-day consolidation.
- **Deliverables:**
  - operator home summarizes completed work and carryover
  - live merchant state is visible at close of day
- **Definition of Done:**
  - Ross can finish the day from StaffordOS without ad hoc terminal checks for the active merchant
- **Risks:**
  - the summary may still depend on multiple snapshots
  - work completion state may lag packet authority
- **Blocking dependencies:**
  - Sprints 1-3
  - execution logs
  - packet authority

## 3. Dependency Graph

```text
Item 1: Continuity screen
  -> Item 2: Unified operator home
  -> Item 3: Merchant 360 with live packet authority
  -> Item 4: Operator-visible checkout linkage
  -> Item 5: End-of-day operator consolidation

Item 2: Unified operator home
  -> Item 5: End-of-day operator consolidation

Item 3: Merchant 360 with live packet authority
  -> Item 5: End-of-day operator consolidation

Item 4: Operator-visible checkout linkage
  -> Item 5: End-of-day operator consolidation
```

Interpretation:
- Item 1 is the root dependency for the first-customer pilot.
- Items 2-4 depend on Item 1 because they all need a reliable paid-packet continuity base.
- Item 5 depends on the combined state produced by Items 1-4.

## 4. Highest-Value First Feature

**Single highest-value feature to build first:** the continuity screen that never shows request-unavailable for paid packets.

Reason:
- it directly protects the first paying customer experience
- it resolves the most critical live production failure mode
- it establishes the authoritative paid-packet continuity state needed by the rest of Wave 1

## 5. Feature That Removes the Most Operator Friction

**Single feature that removes the most operator friction:** unified operator home with live paid packet state.

Reason:
- it removes the repeated cross-checking between operator home, packet authority, and continuity screens
- it becomes the daily starting point for Ross
- it reduces manual reconciliation across the first-customer workflow

## 6. First Feature That Lets Ross Operate Stafford Media Consulting Entirely from StaffordOS Instead of Terminals

**First feature required for that outcome:** unified operator home with live paid packet state, after continuity is fixed.

Why:
- the continuity fix makes the customer flow trustworthy
- the unified operator home makes StaffordOS the central place to inspect active work
- together they remove the need to jump to terminal commands for the first customer path

## 7. Execution Summary

Wave 1 should be executed in this order:
1. continuity screen
2. unified operator home
3. merchant 360
4. operator-visible checkout linkage
5. end-of-day consolidation

This order keeps the first customer safe first, then collapses daily operational friction around the same authoritative state.
