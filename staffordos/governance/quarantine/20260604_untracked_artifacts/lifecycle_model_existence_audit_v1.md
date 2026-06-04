# Lifecycle Model Existence Audit v1

## 1. Conclusion

Yes. StaffordOS already contains a canonical merchant lifecycle definition.

The clearest authoritative source is:

- `staffordos/authority/output/staffordos_canonical_lifecycle_v1.md`

That document defines the end-to-end merchant lifecycle in business language and is the best single source of truth for the merchant journey.

## 2. Canonical lifecycle location and stages

### Authoritative file

`staffordos/authority/output/staffordos_canonical_lifecycle_v1.md`

### Stages defined there

The document defines four main lifecycle bands:

1. Merchant Acquisition
   - Real Store
   - Qualified Target
   - Contact Discovery
   - Contact Research
   - Outreach Draft
   - Approved Outreach
   - Conversation

2. Merchant Conversion
   - Conversation
   - Audit
   - Issue Evidence
   - Proposed Fix
   - Checkout Link
   - Payment
   - Packet Created

3. Merchant Fulfillment
   - Packet
   - Scope
   - Merchant Approval
   - Implementation
   - QA
   - After-State Evidence
   - Proof Package

4. Merchant Success
   - Proof Package
   - Merchant Review
   - Testimonial
   - Referral
   - Next Sprint

It also defines an Operator Control layer for revenue, fulfillment, merchant success, and system health.

## 3. Screens and systems that already depend on lifecycle state

The lifecycle is not just a document. Multiple active surfaces already consume lifecycle-derived state:

- `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts`
- `staffordos/ui/operator-frontend/app/operator/command-center/page.tsx`
- `staffordos/ui/operator-frontend/components/operator/OperatorHomeV1.tsx`
- `staffordos/ui/operator-frontend/app/operator/cockpit/page.tsx`
- `staffordos/ui/operator-frontend/app/operator/leads/page.tsx`
- `staffordos/ui/operator-frontend/components/operator/LeadQueue.tsx`
- `staffordos/ui/operator-frontend/app/operator/revenue-command/page.tsx`
- `staffordos/ui/operator-frontend/app/api/operator/client-registry/route.ts`
- `staffordos/ui/operator-frontend/app/api/operator/lead-registry/action/route.ts`
- `staffordos/clients/build_operator_dashboard_snapshot_v1.mjs`
- `staffordos/clients/next_action_engine_v1.mjs`
- `staffordos/clients/close_engine_v1.mjs`
- `staffordos/decision/resolve_primary_action_v1.mjs`

On the web side, payment and packet surfaces also depend on lifecycle-like state:

- `web/src/routes/packetAuthority.esm.js`
- `web/src/routes/stripeWebhook.esm.js`
- `web/src/lib/packetRepository.js`
- `web/src/lib/shopifixerLeadRegistry.js`
- `web/src/lib/shopifixerLifecycleTracker.js`

## 4. Multiple lifecycle definitions and conflicts

There are multiple lifecycle artifacts, but they are layered rather than completely unrelated.

### A. Canonical merchant lifecycle narrative

- `staffordos/authority/output/staffordos_canonical_lifecycle_v1.md`

This is the best overall merchant lifecycle definition because it is written as the business journey, not as implementation detail.

### B. Operational state machine

- `staffordos/commercial/merchant_lifecycle_state_machine_v1.json`

This file contains operational states such as:

- `lead_new`
- `qualified`
- `drafted`
- `approved`
- `send_ready`
- `contacted`
- `replied`
- `shopifixer_paid`
- `shopifixer_in_delivery`
- `shopifixer_completed`
- `abando_upsell_ready`
- `abando_subscribed`
- `closed_lost`

This is a narrower machine-readable artifact and does not fully match the prose lifecycle vocabulary. It is useful, but it is not the best canonical merchant lifecycle explanation on its own.

### C. Client registry operating model

- `staffordos/clients/client_registry_v1.mjs`
- `staffordos/clients/next_action_engine_v1.mjs`
- `staffordos/clients/upgrade_client_registry_operating_model_v1.mjs`

These files use a more operator-friendly stage vocabulary such as:

- `lead`
- `audit_requested`
- `audit_completed`
- `proposal_sent`
- `deal_won`
- `fix_in_progress`
- `fix_completed`
- `abando_installed`
- `revenue_active`
- `paused`
- `lost`

This is the current implementation vocabulary for operator execution. It overlaps with the canonical lifecycle, but it is not the same artifact.

### D. Lead lifecycle

- `staffordos/leads/lead_state_machine_v1.json`

This is a subordinate acquisition lifecycle. It covers lead qualification and outreach progression, not the full merchant lifecycle.

### Conflict summary

The conflict is not that StaffordOS lacks a lifecycle. The conflict is that StaffordOS has multiple lifecycle vocabularies at different layers:

- business narrative
- lead acquisition machine
- client operating model
- payment/packet flow

That means the system is not fully vocabulary-unified, but the canonical merchant lifecycle already exists.

## 5. What should be treated as authoritative

### Merchant lifecycle authority

Treat `staffordos/authority/output/staffordos_canonical_lifecycle_v1.md` as the authoritative merchant lifecycle definition.

### Operational authority

Treat the client registry operating model and next-action engine as the authoritative implementation layer for operator execution:

- `staffordos/clients/client_registry_v1.mjs`
- `staffordos/clients/next_action_engine_v1.mjs`

### Sub-lifecycle authority

Treat `staffordos/leads/lead_state_machine_v1.json` as the acquisition sub-lifecycle, not as the top-level merchant lifecycle.

## 6. Closest existing artifacts if someone tries to rebuild

If someone were to look for the nearest existing material instead of rebuilding, these are the closest artifacts:

- `staffordos/authority/output/staffordos_canonical_lifecycle_v1.md`
- `staffordos/commercial/merchant_lifecycle_state_machine_v1.json`
- `staffordos/authority/output/client_promotion_authority_v1.md`
- `staffordos/authority/output/client_registry_canonical_lifecycle_gap_v1.md`
- `staffordos/clients/upgrade_client_registry_operating_model_v1.mjs`
- `staffordos/clients/next_action_engine_v1.mjs`
- `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts`

These are enough to reuse and consolidate the existing lifecycle model without inventing a new one.

## 7. Recommendation

A. Reuse  
B. Consolidate  
C. Build

**Recommended: B. Consolidate**

Reason: a canonical lifecycle already exists, but the repository still carries multiple overlapping lifecycle vocabularies. The correct move is to consolidate execution and UI surfaces onto the existing canonical merchant lifecycle, not to build a new one.
