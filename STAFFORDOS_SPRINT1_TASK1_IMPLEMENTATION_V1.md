# STAFFORDOS_SPRINT1_TASK1_IMPLEMENTATION_V1

Task source: Wave 1 backlog item 1 from `STAFFORDOS_WAVE1_EXECUTION_PLAN_V1.md`.

This is an implementation readiness document only. No production code is changed here.

## 1. Task Title

**Continuity screen that never shows request-unavailable for paid packets**

## 2. Why This Is Sprint 1 Task 1

This is the first task in Wave 1 because it protects the first paying customer’s post-payment experience.

It is the root dependency for the rest of the Wave 1 plan:
- operator home
- merchant 360
- checkout linkage
- end-of-day consolidation

If continuity is wrong, the rest of the workflow is built on an unreliable state.

## 3. Business Value

- Prevents the paid merchant from seeing invalid continuity copy.
- Preserves the first-customer production path after checkout.
- Establishes a trusted paid-packet state for every downstream operator screen.
- Reduces support and recovery work during the pilot.

## 4. Existing Routes Involved

- `/shopifixer/status`
- `/payment-return`
- `/api/packets/:packet_id`

## 5. Existing Source Files Involved

Based on the planning documents, the task touches:
- `abando-frontend/app/shopifixer/status/page.tsx`
- `web/src/routes/packetAuthority.esm.js`
- `web/src/lib/packetRepository.js`

## 6. Data Authorities Involved

- Live packet authority
- Continuity projections

Primary authoritative source for this task:
- live packet authority via `GET /api/packets/:packet_id`

Secondary source:
- current continuity projections for fallback and presentation

## 7. APIs Involved

- `GET /api/packets/:packet_id`

The continuity page must read the live paid packet from this API and preserve store / reservation / payment state context.

## 8. UI Components Involved

- continuity page labels
- packet state display
- review state display
- store display
- request/status strip

## 9. Files That Will Require Modification

From the planning documents, the likely modification set is:
- `abando-frontend/app/shopifixer/status/page.tsx`

If continuity depends on packet authority normalization or packet API shape, the supporting packet files may also need coordinated changes:
- `web/src/routes/packetAuthority.esm.js`
- `web/src/lib/packetRepository.js`

## 10. Files That Should NOT Be Modified

To keep Sprint 1 isolated, do not modify:
- `/operator` screens
- lead registry screens
- revenue command screens
- relationship screens
- system-map screens
- execution-log screens
- briefing/director screens
- merchant-facing entry pages other than continuity-related files

## 11. Risks

- Packet authority and continuity projections may diverge.
- Fallback logic may continue to surface invalid request-unavailable copy.
- Regression in payment-return behavior could break the post-payment handoff.
- The page may still depend on stale local truth rather than live packet authority.

## 12. Test Plan

### Functional checks
- Open the continuity URL for the verified packet.
- Confirm the page uses the live packet authority.
- Confirm paid packet renders the open fix state.
- Confirm store domain is preserved.
- Confirm reservation context is preserved.
- Confirm review state reads as payment received.
- Confirm request-unavailable copy does not appear for the paid packet.

### Regression checks
- Confirm `/payment-return` still redirects correctly.
- Confirm a non-paid or missing packet still falls back safely.
- Confirm the page still fails closed when no valid continuity context exists.

### Evidence checks
- Capture screenshot or page readout for the paid packet.
- Record packet id, reservation id, session id, and timestamp.

## 13. Rollback Plan

If the continuity screen regresses:
- revert the continuity hydration change
- restore the previous fallback behavior
- confirm `/payment-return` still redirects and packet authority remains stable

Rollback should leave the rest of the operator surfaces untouched.

## 14. Acceptance Criteria

For a paid packet with:
- `status = payment_received`
- reservation id present

the continuity page must render:
- `Intake pending`
- `Your fix request is open.`
- store domain
- `Review: Payment received`

and must not render:
- `Request unavailable`
- `We need to link your request.`

The page must still render safely for missing or unverified packets.

## 15. Estimated Implementation Time

- **Medium**

This is a focused continuity-state repair, but it affects the core customer path and must be validated against the live packet authority.

## 16. Single-Session Implementation Checklist

Use this checklist in order during one development session.

1. Open the current continuity route source file and confirm the paid-packet render path.
2. Identify where the page reads packet context and where it falls back to request-unavailable copy.
3. Confirm the live packet API shape used by the continuity page.
4. Trace the condition that decides whether the paid packet is treated as open or missing.
5. Update the continuity state logic so a paid packet is treated as authoritative.
6. Keep fallback behavior for missing or unverified packets intact.
7. Verify the request/status strip uses the paid continuity state.
8. Verify the review label still resolves to payment received for the paid packet.
9. Check that store and reservation context remain visible.
10. Run the build.
11. Confirm `/payment-return` still points to `/fix-status`.
12. Verify the paid packet continuity render with the known packet id.
13. Capture evidence of the corrected page state.
14. Prepare rollback notes before merging or deploying.

## 17. Summary

Sprint 1 Task 1 is the first continuity fix. It is the smallest work item with the largest customer impact because it determines whether the first paid merchant sees a valid post-payment state.
