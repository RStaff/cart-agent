# CLIENT REGISTRY CANONICAL LIFECYCLE GAP V1

## Purpose

Align the existing Client Registry with the current StaffordOS canonical lifecycle.

This is not a rebuild.

This is convergence.

---

## Current Verified Client Registry Backbone

The existing client record already contains:

- client_id
- merchant_shop
- contact
- deal.payment_status
- shopifixer.audit_status
- shopifixer.fix_status
- abando install/recovery data
- lifecycle.stage
- next_action
- revenue
- problem_profile
- system_health
- priority_score
- blocker_detection
- close_engine

## Current Verified Lifecycle Engine Stages

Existing stages found in next_action_engine_v1:

- lead
- audit_requested
- proposal_sent
- deal_won
- fix_completed
- abando_installed
- revenue_active

---

## Canonical StaffordOS Lifecycle

Lead
  ->
Qualification
  ->
Product Routing
  ->
Audit
  ->
Conversation
  ->
Payment
  ->
Packet
  ->
Fulfillment
  ->
Proof
  ->
Merchant Success
  ->
Review
  ->
Referral
  ->
Repeat Revenue

---

## Gap Analysis

### Already Represented

Lead:
current lifecycle.stage = lead

Audit:
shopifixer.audit_status + lifecycle.stage = audit_requested

Conversation / Proposal:
lifecycle.stage = proposal_sent

Payment:
deal.payment_status exists

Fulfillment:
shopifixer.fix_status exists

Revenue:
revenue object exists

Next Action:
next_action object exists

System Health:
system_health exists

Blockers:
blocker_detection exists

---

### Missing Or Underrepresented

Qualification:
needs explicit qualification_status or qualification object

Product Routing:
needs selected_product and routing_reason

Packet:
needs packet_id and packet_status

Proof:
needs proof_status and proof_package_ref

Merchant Success:
needs merchant_success_status

Review:
needs review_status and review_request_status

Referral:
needs referral_status and referral_opportunity

Repeat Revenue:
needs next_offer_status or repeat_revenue_status

---

## Recommended Direction

Make staffordos/clients/client_registry_v1.json the canonical merchant lifecycle object.

Do not create a separate merchant registry unless unavoidable.

Lead Registry remains acquisition truth.

Client Registry becomes merchant lifecycle truth.

---

## Required Client Object Additions

Add, when ready:

- selected_product
- routing_reason
- qualification_status
- packet_id
- packet_status
- proof_status
- proof_package_ref
- merchant_success_status
- review_status
- referral_status
- repeat_revenue_status

---

## Cockpit Implication

The StaffordOS cockpit should read primarily from Client Registry for merchant lifecycle control.

The Leads page can remain focused on acquisition.

The Cockpit should show:

- acquisition summary
- conversion state
- payment state
- packet state
- fulfillment state
- proof state
- review/referral state
- next best action

---

## Anti-Drift Rule

Do not build a new operating system.

Converge existing lead, client, packet, audit, proof, and revenue truth into one merchant lifecycle view.
