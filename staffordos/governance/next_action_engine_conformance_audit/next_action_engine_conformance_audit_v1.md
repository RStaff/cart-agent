# Next Action Engine Lifecycle Conformance Audit v1

## Executive Summary

`staffordos/clients/next_action_engine_v1.mjs` implements 10 decision branches in `computeNextAction()`: 8 branches that assign a lifecycle stage and 2 branches that preserve the current stage / provide a fallback action.

The engine is **not lifecycle-authoritative today** for ShopiFixer because:

- it contains an unauthorized override from `merchantRevenueRecovered > 0` to `revenue_active`
- it has no branch for the fulfillment transition `fix_in_progress`
- several branches are implementation-level labels rather than canonical lifecycle stages

The highest-risk branch is the Abando-derived `revenue_active` promotion. It can override the merchant lifecycle from any prior state and is not authorized by the canonical ShopiFixer lifecycle.

## Authority Sources Used

- `staffordos/authority/output/staffordos_canonical_lifecycle_v1.md`
- `staffordos/authority/output/client_registry_canonical_lifecycle_gap_v1.md`
- `staffordos/authority/output/client_promotion_authority_v1.md`
- `staffordos/authority/output/product_routing_authority_v1.md`
- `staffordos/authority/output/shopifixer_fulfillment_authority_v1.md`
- `staffordos/authority/output/revenue_success_gate_v1.md`
- `staffordos/authority/output/staffordos_business_core_definition_of_done_v1.md`
- `staffordos/clients/upgrade_client_registry_operating_model_v1.mjs`
- `staffordos/ui/operator-frontend/lib/operator/lifecycleTerminology.ts`

## Conformance Matrix

| Implemented transition / branch | Exact condition | Source location | Resulting lifecycle stage | Authority source | Classification |
| --- | --- | --- | --- | --- | --- |
| Stage-preservation guard | `redHealth.length > 0` | `staffordos/clients/next_action_engine_v1.mjs:131-143` | Preserve current `stage` | No stage authority; operational health guard only | **BROKEN** |
| Abando revenue override | `merchantRevenueRecovered > 0` | `staffordos/clients/next_action_engine_v1.mjs:146-158` | `revenue_active` | `upgrade_client_registry_operating_model_v1.mjs` + UI label mapping only; not in canonical lifecycle | **PROVEN_UNAUTHORIZED** |
| Lead initialization | `stage === "lead"` | `staffordos/clients/next_action_engine_v1.mjs:161-173` | `lead` | Canonical lifecycle Lead; client promotion authority | **PROVEN_AUTHORIZED** |
| Audit request | `auditStatus === "not_started" && stage !== "proof_client"` | `staffordos/clients/next_action_engine_v1.mjs:176-188` | `audit_requested` | Client promotion authority and product routing authority imply audit, but exact stage label is implementation-specific | **PARTIALLY_DEFINED** |
| Proposal / close path | `auditStatus === "completed" && paymentStatus !== "paid"` | `staffordos/clients/next_action_engine_v1.mjs:191-203` | `proposal_sent` | Client promotion authority, product routing authority, ShopiFixer audit authority | **PROVEN_AUTHORIZED** |
| Payment-to-deal promotion | `paymentStatus === "paid" && fixStatus === "not_started"` | `staffordos/clients/next_action_engine_v1.mjs:206-218` | `deal_won` | Payment lifecycle authority, business-core done definition, client registry operating model | **PROVEN_AUTHORIZED** |
| Fulfillment completion marker | `fixStatus === "completed" && !abandoInstalled` | `staffordos/clients/next_action_engine_v1.mjs:221-234` | `fix_completed` | ShopiFixer fulfillment authority and operating model, but exact label is implementation-level | **PARTIALLY_DEFINED** |
| Abando installed, pre-checkout | `abandoInstalled && checkoutEvents === 0` | `staffordos/clients/next_action_engine_v1.mjs:236-249` | `abando_installed` | Product routing authority for Abando, client registry operating model | **PARTIALLY_DEFINED** |
| Abando installed, checkout observed | `abandoInstalled && checkoutEvents > 0 && recoveryActions === 0` | `staffordos/clients/next_action_engine_v1.mjs:251-264` | `abando_installed` | Product routing authority for Abando, client registry operating model | **PARTIALLY_DEFINED** |
| Fallback follow-up | default branch | `staffordos/clients/next_action_engine_v1.mjs:266-277` | Preserve current `stage` | No lifecycle authority; fallback action only | **BROKEN** |

## Canonical Versus Implemented Lifecycle

### Canonical post-payment / fulfillment path

Canonical ShopiFixer authority supports:

1. Audit requested / audit completed
2. Proposed Fix
3. Payment
4. Packet
5. Scope
6. Merchant Approval
7. Implementation
8. QA
9. After-State Evidence
10. Proof Package
11. Merchant Review
12. Testimonial
13. Referral
14. Next Sprint

### Implemented engine path

The engine currently implements:

- `lead`
- `audit_requested`
- `proposal_sent`
- `deal_won`
- `fix_completed`
- `abando_installed`
- `revenue_active`

It does **not** implement:

- `fix_in_progress`
- explicit `QA`
- explicit `proof package`
- explicit review/referral progression

## Counts

- Total decision branches in `computeNextAction()`: 10
- Branches that assign a lifecycle stage: 8
- Stage-preserving / fallback branches: 2

## Final Assessment

`next_action_engine_v1.mjs` is a useful decision engine, but it is not a canonical lifecycle authority for ShopiFixer today.

The engine should not be allowed to promote `revenue_active` from Abando recovery alone.

The canonical ShopiFixer lifecycle should continue through fulfillment, proof, review, and referral before any merchant-success / repeat-revenue interpretation is applied.

## Highest-Risk Transition

`merchantRevenueRecovered > 0 -> revenue_active`

This is the only implemented stage promotion that is explicitly unauthorized by the canonical lifecycle authority.

## Smallest Governance-Approved Repair

Constrain or remove the `merchantRevenueRecovered > 0 -> revenue_active` branch so Abando recovery data cannot override the governed ShopiFixer lifecycle.

