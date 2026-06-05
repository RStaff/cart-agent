# Lifecycle Promotion Authority Audit v1

## 1. Executive Summary

StaffordOS has two different lifecycle authorities in play:

1. **Canonical lifecycle authority**  
   Defined by the canonical lifecycle docs, product routing authority, client promotion authority, fulfillment authority, and revenue success gate.

2. **Implemented lifecycle authority**  
   Enforced by the current runtime code, especially:
   - `staffordos/clients/client_registry_v1.mjs`
   - `staffordos/clients/upgrade_client_registry_operating_model_v1.mjs`
   - `staffordos/clients/next_action_engine_v1.mjs`
   - `staffordos/ui/operator-frontend/lib/operator/lifecycleTerminology.ts`

The highest-risk mismatch is that the implemented engine promotes a client to `revenue_active` when `merchant_revenue_recovered > 0`, even though the governed ShopiFixer lifecycle does not authorize that as a completion or fulfillment state for a merchant who has not been paid, fulfilled, or proven through ShopiFixer.

For `cart-agent-dev.myshopify.com`, governed truth says the merchant should **not** be `revenue_active`.  
It should still be treated as an unmet ShopiFixer conversion/fulfillment opportunity, best represented today as **`proposal_sent`** until a verified ShopiFixer payment and fulfillment loop exists.

## 2. Canonical Lifecycle Authority

- Canonical lifecycle artifact:
  - `staffordos/authority/output/staffordos_canonical_lifecycle_v1.md`

- Lifecycle stage meaning / mapping artifact:
  - `staffordos/ui/operator-frontend/lib/operator/lifecycleTerminology.ts`

- Promotion criteria artifacts:
  - `staffordos/authority/output/client_promotion_authority_v1.md`
  - `staffordos/authority/output/product_routing_authority_v1.md`
  - `staffordos/authority/output/shopifixer_audit_authority_v1.md`
  - `staffordos/authority/output/shopifixer_fulfillment_authority_v1.md`
  - `staffordos/authority/output/revenue_success_gate_v1.md`

## 3. Actual Implemented Lifecycle Authority

Implemented runtime stage sources:

- `staffordos/clients/next_action_engine_v1.mjs`
- `staffordos/clients/upgrade_client_registry_operating_model_v1.mjs`
- `staffordos/clients/client_registry_v1.mjs`
- `staffordos/ui/operator-frontend/lib/operator/lifecycleTerminology.ts`

### What next_action_engine_v1.mjs currently implements

It currently implements these lifecycle promotions:

- `lead` -> `lead`
- `auditStatus not_started` -> `audit_requested`
- `auditStatus completed && paymentStatus !== paid` -> `proposal_sent`
- `paymentStatus paid && fixStatus not_started` -> `deal_won`
- `fixStatus completed && !abandoInstalled` -> `fix_completed`
- `abandoInstalled && checkoutEvents === 0` -> `abando_installed`
- `abandoInstalled && checkoutEvents > 0 && recoveryActions === 0` -> `abando_installed`
- `merchantRevenueRecovered > 0` -> `revenue_active`

### What the operating model upgrade currently implements

- `status === proof_client` -> `revenue_active`
- `deal.payment_status === paid` -> `deal_won`
- `shopifixer.audit_status === completed` -> `audit_completed`
- fallback -> `lead`

## 4. Authority / Implementation Comparison

| Question | Authority answer | Implemented answer | Classification |
|---|---|---|---|
| What artifact defines the canonical lifecycle? | `staffordos_canonical_lifecycle_v1.md` | same | **PROVEN_AUTHORIZED** |
| What artifact defines stage meanings? | canonical lifecycle + UI terminology mapping | `lifecycleTerminology.ts` | **PARTIALLY_DEFINED** |
| What artifact defines promotion criteria? | client promotion, product routing, audit, fulfillment, revenue success | implemented engine + operating model + registry mutation code | **PARTIALLY_DEFINED** |
| What defines `revenue_active`? | no canonical ShopiFixer authority defines it | `next_action_engine_v1.mjs`, `upgrade_client_registry_operating_model_v1.mjs`, `lifecycleTerminology.ts` | **PROVEN_UNAUTHORIZED** for ShopiFixer lifecycle |
| What defines `deal_won`? | payment / lifecycle transition authority | payment propagation and client registry write path | **PROVEN_AUTHORIZED** |
| What defines `fix_in_progress`? | fulfillment authority | no runtime promotion branch found in `next_action_engine_v1.mjs` | **BROKEN** |
| What defines `fix_completed`? | fulfillment authority / after-state evidence | `next_action_engine_v1.mjs` branch exists, but no proven live fulfillment loop | **PARTIALLY_DEFINED** |
| What defines `abando_installed`? | Abando route authority / product routing context | `next_action_engine_v1.mjs` and operating model | **PARTIALLY_DEFINED** |
| What defines `proposal_sent`? | client promotion authority and canonical conversion phase | `next_action_engine_v1.mjs` and client registry | **PROVEN_AUTHORIZED** |
| What defines `audit_completed`? | audit authority / client registry operating model | `upgrade_client_registry_operating_model_v1.mjs` | **PROVEN_AUTHORIZED** for the audit stage, but not the full fulfillment loop |

## 5. Direct Answers

### 1. What artifact defines the canonical lifecycle?

`staffordos/authority/output/staffordos_canonical_lifecycle_v1.md`

### 2. What artifact defines lifecycle stage meanings?

The implemented stage meaning map lives in:

- `staffordos/ui/operator-frontend/lib/operator/lifecycleTerminology.ts`

The canonical stage meanings are grounded in:

- `staffordos/authority/output/staffordos_canonical_lifecycle_v1.md`

### 3. What artifact defines promotion criteria?

The promotion criteria are split across:

- `staffordos/authority/output/client_promotion_authority_v1.md`
- `staffordos/authority/output/product_routing_authority_v1.md`
- `staffordos/authority/output/shopifixer_audit_authority_v1.md`
- `staffordos/authority/output/shopifixer_fulfillment_authority_v1.md`
- `staffordos/authority/output/revenue_success_gate_v1.md`

### 4. What artifact defines `revenue_active`?

No canonical ShopiFixer authority artifact defines `revenue_active`.

It is implemented in:

- `staffordos/clients/next_action_engine_v1.mjs`
- `staffordos/clients/upgrade_client_registry_operating_model_v1.mjs`
- `staffordos/ui/operator-frontend/lib/operator/lifecycleTerminology.ts`

### 5. What artifact defines `deal_won`?

- Canonical lifecycle and payment readiness authorities:
  - `staffordos/authority/output/staffordos_canonical_lifecycle_v1.md`
  - `staffordos/authority/output/s2g_packet_binding_readiness_v1.md`
  - `staffordos/authority/output/s2h_real_payment_readiness_snapshot_v1.md`
  - `staffordos/governance/lifecycle_transition_verification/lifecycle_transition_verification_v1.md`

### 6. What artifact defines `fix_in_progress`?

- Canonical lifecycle:
  - `staffordos/authority/output/staffordos_canonical_lifecycle_v1.md`
- Fulfillment authority:
  - `staffordos/authority/output/shopifixer_fulfillment_authority_v1.md`

There is no proven live runtime writer that moves a paid client into `fix_in_progress`.

### 7. What artifact defines `fix_completed`?

- Canonical lifecycle:
  - `staffordos/authority/output/staffordos_canonical_lifecycle_v1.md`
- Fulfillment authority:
  - `staffordos/authority/output/shopifixer_fulfillment_authority_v1.md`

Runtime code has a `fix_completed` branch, but no proven live fulfillment loop carries a paid merchant there.

### 8. What artifact defines `abando_installed`?

- Implemented lifecycle / product-route logic:
  - `staffordos/clients/next_action_engine_v1.mjs`
  - `staffordos/clients/upgrade_client_registry_operating_model_v1.mjs`
- Product routing context:
  - `staffordos/authority/output/product_routing_authority_v1.md`

### 9. What artifact defines `proposal_sent`?

- Canonical lifecycle:
  - `staffordos/authority/output/staffordos_canonical_lifecycle_v1.md`
- Client promotion authority:
  - `staffordos/authority/output/client_promotion_authority_v1.md`
- Implemented runtime:
  - `staffordos/clients/next_action_engine_v1.mjs`

### 10. What artifact defines `audit_completed`?

- Canonical lifecycle / client promotion gap guidance:
  - `staffordos/authority/output/client_registry_canonical_lifecycle_gap_v1.md`
- Implemented runtime:
  - `staffordos/clients/upgrade_client_registry_operating_model_v1.mjs`

## 6. Current Implemented Conditions in next_action_engine_v1.mjs

The current implementation uses these conditions:

- red system health -> blocked monitor
- `merchantRevenueRecovered > 0` -> `revenue_active`
- `stage === "lead"` -> `lead`
- `auditStatus === "not_started"` -> `audit_requested`
- `auditStatus === "completed" && paymentStatus !== "paid"` -> `proposal_sent`
- `paymentStatus === "paid" && fixStatus === "not_started"` -> `deal_won`
- `fixStatus === "completed" && !abandoInstalled` -> `fix_completed`
- `abandoInstalled && checkoutEvents === 0` -> `abando_installed`
- `abandoInstalled && checkoutEvents > 0 && recoveryActions === 0` -> `abando_installed`
- otherwise -> followup

Notably absent:

- no branch that writes `fix_in_progress`

## 7. Supported vs Unsupported Implemented Promotions

### Supported by authority

- `audit_requested` as an internal pre-audit step: **PARTIALLY_DEFINED**
- `proposal_sent`: **PROVEN_AUTHORIZED**
- `deal_won`: **PROVEN_AUTHORIZED**
- `audit_completed`: **PROVEN_AUTHORIZED**

### Unsupported by authority

- `revenue_active` from `merchantRevenueRecovered > 0`: **PROVEN_UNAUTHORIZED**
- any ShopiFixer interpretation that treats `revenue_active` as the end state for the paid loop: **PROVEN_UNAUTHORIZED**

### Missing / broken

- `fix_in_progress`: **BROKEN**
- a proven live bridge from `deal_won` into fulfillment, proof, QA, review, referral: **BROKEN**

## 8. cart-agent-dev.myshopify.com: Governed Truth

Current runtime truth for `cart-agent-dev.myshopify.com`:

- `deal.payment_status = not_billable`
- `revenue.shopifixer_collected = false`
- `business.stafford_revenue_earned = 0`
- `shopifixer.fix_status = not_started`
- `abando.merchant_revenue_recovered = 100`
- `lifecycle.stage = revenue_active`

Governed ShopiFixer truth says this should **not** be `revenue_active`.

The best governed stage today is:

- `proposal_sent`

Reason:

- the merchant is not paid
- the ShopiFixer fix has not started
- there is no proof package
- revenue_active is being driven by Abando recovery revenue, which is not the canonical ShopiFixer lifecycle condition

## 9. Gap Register

1. `merchantRevenueRecovered > 0 -> revenue_active`
   - Status: **PROVEN_UNAUTHORIZED**
   - Risk: Abando recovery data can leapfrog a merchant into a merchant-success-looking state without ShopiFixer payment or fulfillment.

2. Missing `deal_won -> fix_in_progress`
   - Status: **BROKEN**
   - Risk: paid merchants cannot enter fulfillment execution through the live engine.

3. `fix_status === "completed" -> fix_completed`
   - Status: **PARTIALLY_DEFINED**
   - Risk: can imply after-state evidence without a proven ShopiFixer proof loop.

4. `abando_installed` branch
   - Status: **PARTIALLY_DEFINED**
   - Risk: product-route-specific state is mixed into the merchant lifecycle engine.

5. `audit_requested`
   - Status: **PARTIALLY_DEFINED**
   - Risk: implemented as a runtime stage, but not clearly canonical in the merchant lifecycle authority.

## 10. Final Answers

- **What is the canonical lifecycle authority?**  
  `staffordos/authority/output/staffordos_canonical_lifecycle_v1.md`

- **What is the implemented lifecycle authority?**  
  A hybrid of:
  - `staffordos/clients/next_action_engine_v1.mjs`
  - `staffordos/clients/upgrade_client_registry_operating_model_v1.mjs`
  - `staffordos/clients/client_registry_v1.mjs`
  - `staffordos/ui/operator-frontend/lib/operator/lifecycleTerminology.ts`

- **What is the highest-risk promotion mismatch?**  
  Promoting `cart-agent-dev.myshopify.com` to `revenue_active` based on `merchantRevenueRecovered > 0` when the ShopiFixer payment and fulfillment state is still not started.

- **Is revenue_active promotion currently authorized?**  
  **No**

- **What lifecycle stage should `cart-agent-dev.myshopify.com` be in today?**  
  **proposal_sent**

- **What is the single next governance-approved repair?**  
  Remove or constrain the `merchantRevenueRecovered > 0 -> revenue_active` promotion so Abando recovery truth does not override the governed ShopiFixer lifecycle, and keep the merchant in the correct conversion/fulfillment lane until verified paid fulfillment exists.
