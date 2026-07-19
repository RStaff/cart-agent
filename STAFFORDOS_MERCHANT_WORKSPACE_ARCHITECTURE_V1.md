# STAFFORDOS_MERCHANT_WORKSPACE_ARCHITECTURE_V1

Scope: architecture only. No code, UI, or route changes are made by this document.

## 1. Design Goal

The Merchant Workspace is the post-payment operating surface for a single merchant.

It begins immediately after verified payment and continues until the customer becomes a recurring Stafford Media Consulting client.

The current canonical entry point is:
- `/fix-status`

This document treats `/fix-status` as the shell of the Merchant Workspace.

## 2. Workspace Lifecycle

### Phase 1. Verified Payment
Entry condition:
- packet authority shows `payment_received`

What the workspace must establish:
- the merchant is paid
- the request is open
- the merchant name, store domain, packet id, session id, and reservation id are visible

### Phase 2. Active Fix Request
The merchant sees that the fix request is open and the work is in progress.

What the workspace must establish:
- the fix is being handled
- the merchant can see continuity and progress
- Ross can see the same state from the operator side

### Phase 3. Evidence / Proof
The workspace accumulates before/after evidence and proof artifacts.

What the workspace must establish:
- proof package exists or is pending
- delivery status is visible
- the customer can be notified with confidence

### Phase 4. Delivery
The deliverable is complete or nearly complete.

What the workspace must establish:
- work is complete in fulfillment truth
- completion is visible in the workspace
- any customer-facing handoff is recorded

### Phase 5. Follow-Up / Retention
The customer is moved from one-time fix to recurring client relationship.

What the workspace must establish:
- follow-up tasks are visible
- next actions are clear
- upsell and recurring-client progression is explicit

### Phase 6. Recurring Client
The customer is no longer just a one-time fix.

What the workspace must establish:
- client registry reflects recurring client state
- revenue truth reflects ongoing relationship value
- lifecycle truth reflects stable ongoing account state

## 3. Primary Navigation

The workspace should be organized around the merchant journey and the operator’s need to understand it.

Primary navigation sections:
- Overview
- Request
- Timeline
- Evidence
- Delivery
- Communication
- Billing
- Upsells
- History
- Operator View

### Navigation intent
- Overview answers: what is this merchant’s current state?
- Request answers: what is the fix and where does it stand?
- Timeline answers: what happened and what comes next?
- Evidence answers: what proof exists?
- Delivery answers: what has been completed?
- Communication answers: what has been sent to the merchant?
- Billing answers: what is paid and what revenue state exists?
- Upsells answers: what recurring or expanded work should be offered?
- History answers: what is the account record?
- Operator View answers: what does Ross need to know next?

## 4. Core Workspace Sections

### 4A. Overview
Purpose:
- present the merchant’s current post-payment state at a glance

Content:
- merchant name
- store domain
- packet id
- reservation id
- session id
- payment status
- current fix stage

### 4B. Request
Purpose:
- show the active fix request and its current open/in-progress state

Content:
- request status
- next required action
- current blocker
- owner / responsible party

### 4C. Timeline
Purpose:
- show the merchant journey from payment to recurring-client state

Content:
- verified payment
- request opened
- work started
- evidence captured
- proof packaged
- delivery completed
- follow-up started
- recurring client established

### 4D. Evidence
Purpose:
- preserve proof of delivery and the work performed

Content:
- before evidence
- after evidence
- screenshots
- notes
- proof package location
- timestamps

### 4E. Delivery
Purpose:
- confirm that the fix is being or has been delivered

Content:
- fulfillment status
- completion status
- remaining items
- handoff status

### 4F. Communication
Purpose:
- track customer-facing messages and notifications

Content:
- payment confirmation
- progress update
- completion notice
- follow-up message
- notification timestamps

### 4G. Billing
Purpose:
- keep payment and revenue state visible

Content:
- payment status
- payment reference
- Stripe session id
- revenue propagation state
- client value / recurring potential

### 4H. Upsells
Purpose:
- present recurring-client and expansion opportunities

Content:
- follow-up offers
- recurring maintenance
- additional services
- referral opportunities

### 4I. History
Purpose:
- preserve the full merchant record

Content:
- prior fixes
- prior payments
- prior communications
- lifecycle transitions
- evidence archive

### 4J. Operator View
Purpose:
- let Ross see the same merchant state StaffordOS sees

Content:
- live packet authority
- lifecycle state
- fulfillment state
- revenue state
- open blocker
- next action

## 5. Widgets

The Merchant Workspace should be built from widgets that answer specific operational questions.

### Required widgets
- Payment Status
- Request Status
- Merchant Identity
- Packet Authority
- Reservation Status
- Continuity Summary
- Work In Progress
- Evidence Package
- Delivery Status
- Communication Log
- Revenue Summary
- Upsell Suggestions
- History / Timeline
- Operator Notes

### Widget purpose summary
- Payment Status: is the customer paid?
- Request Status: is the request open?
- Merchant Identity: who is this?
- Packet Authority: what packet is the source of truth?
- Reservation Status: what reservation anchors this work?
- Continuity Summary: what should the customer see now?
- Work In Progress: what is actively being done?
- Evidence Package: what proof exists?
- Delivery Status: what remains before completion?
- Communication Log: what has the customer been told?
- Revenue Summary: what revenue state exists?
- Upsell Suggestions: what recurring business should be offered?
- History / Timeline: what happened so far?
- Operator Notes: what does Ross need to know?

## 6. Timeline

The workspace timeline should always show the same core progression:

1. Verified payment
2. Packet authority updated
3. Merchant continuity opened
4. Request recognized
5. Work started
6. Evidence captured
7. Proof packaged
8. Delivery completed
9. Customer notified
10. Follow-up initiated
11. Recurring client established

This timeline is the backbone of the Merchant Workspace.

## 7. Deliverables

The Merchant Workspace should make the following deliverables visible:

- continuity confirmation
- fix request acknowledgement
- proof package
- completion confirmation
- customer notification
- follow-up / recurring-client handoff

Each deliverable should be timestamped and tied to the packet and reservation.

## 8. Evidence

Evidence is the record that the work occurred and was delivered.

Required evidence types:
- payment proof
- packet authority snapshot
- continuity screenshot
- before/after evidence
- proof package
- completion record
- customer notification record

Evidence should remain linked to:
- packet_id
- reservation_id
- Stripe session id
- store domain

## 9. Communication

Communication should be visible in the workspace as a first-class record.

Required communication states:
- payment confirmation sent
- work started update sent
- proof / delivery update sent
- completion notice sent
- follow-up / recurring-client offer sent

The workspace should show what the customer has already seen and what Ross should say next.

## 10. AI Recommendations

AI should assist the Merchant Workspace by recommending:
- next best action
- blocker detection
- proof readiness
- delivery readiness
- customer follow-up timing
- upsell opportunity timing
- recurring-client conversion opportunity

AI should not be the authority for payment or completion.
It should only interpret the existing truth and suggest the next action.

## 11. Upsell Opportunities

The Merchant Workspace should surface upsell opportunities after the fix is underway or complete.

Examples of upsell opportunities:
- recurring maintenance
- monthly support
- performance tuning
- additional audit / cleanup work
- referral invitation
- case study invitation

These opportunities should appear only after the workspace establishes trust and delivery progress.

## 12. Integration With StaffordOS Authorities

### Packet Authority
Role:
- primary source for payment and packet identity

Integration:
- `/fix-status` must read packet authority as the authoritative paid state
- packet id, reservation id, payment reference, and status anchor the workspace

### Client Registry
Role:
- source of client identity and relationship state

Integration:
- once delivery starts or completes, the workspace should reflect whether the merchant is now a recurring client

### Revenue
Role:
- source of payment propagation and relationship value

Integration:
- revenue truth should show the paid transaction and any follow-on recurring value

### Fulfillment
Role:
- source of work state, proof readiness, and completion

Integration:
- the workspace should reflect fulfillment progress and completion state

### Lifecycle
Role:
- source of merchant stage and transition history

Integration:
- the workspace should show the current lifecycle stage and the path to recurring client

### Operator Dashboard
Role:
- operator-level summary and prioritization

Integration:
- the Merchant Workspace should feed into operator dashboards and also be accessible from them

## 13. Canonical Route Position

Can `/fix-status` evolve into the permanent Merchant Workspace without introducing another customer-facing route?

**Yes.**

Why:
- it already exists as the post-payment entry point
- it already receives packet, session, store, and reservation context
- it is already the canonical handoff target from payment-return
- it can act as the shell for a richer merchant workspace without adding another customer-facing route

The key reason is that the workspace is conceptually the same user journey after payment:
- same customer
- same packet
- same merchant state
- same continuity thread

The page can grow into a full workspace by deepening sections and widgets inside the same route rather than fragmenting the customer experience across another route.

## 14. Bottom Line

`/fix-status` should become the permanent Merchant Workspace shell.

It should remain the single customer-facing post-payment route because:
- it matches the payment-return contract
- it already carries the correct merchant context
- it avoids introducing another redirect target or another post-payment page
- it can present the entire post-payment lifecycle from payment to recurring-client state

If StaffordOS later needs a second route, it should be for operator-only inspection, not for the customer-facing merchant workspace.
