# ShopiFixer Loop Connection Work Package v1

Repository truth basis:

- `staffordos/operator_design/shopifixer_back_half_execution_truth_v1.md`
- `staffordos/operator_design/shopifixer_process_alignment_verification_v1.md`
- `staffordos/operator_design/shopifixer_commercial_truth_authority_v1.md`
- `staffordos/authority/output/shopifixer_fulfillment_authority_v1.md`
- `staffordos/authority/output/shopifixer_audit_authority_v1.md`
- `staffordos/authority/output/shopifixer_first_sales_motion_v1.md`
- `staffordos/authority/output/shopifixer_sales_execution_v1.md`
- `staffordos/authority/output/staffordos_canonical_lifecycle_v1.md`
- `staffordos/commercial/merchant_lifecycle_state_machine_v1.json`
- `staffordos/authority/output/product_routing_authority_v1.md`
- `web/src/public/index.html`
- `web/src/routes/pricing.esm.js`
- `web/src/routes/runAudit.esm.js`
- `web/src/routes/scorecard.esm.js`
- `abando-frontend/app/shopifixer/page.tsx`
- `web/src/checkout-public.js`
- `web/src/routes/packetAuthority.esm.js`
- `web/src/routes/stripeWebhook.esm.js`
- `web/src/lib/packetRepository.js`
- `staffordos/proof_loop/merchant_proof_loop_completion_pack_v1.js`
- `staffordos/proof_loop/run_merchant_proof_loop_completion_pack.js`
- `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts`
- `staffordos/ui/operator-frontend/app/api/operator/send-proof/route.ts`
- `staffordos/ui/operator-frontend/lib/operator/lifecycleTerminology.ts`

Canonical truth:

- Product: `ShopiFixer Fix Sprint`
- Price: `$950 flat fee`
- The public front half is aligned.
- The back half exists, but is not yet connected into one public ShopiFixer purchase loop.

## A. Existing Connected Components

### 1. Current public endpoint of the ShopiFixer journey

The current public ShopiFixer journey begins at:

- `/shopifixer`

Supporting public entry points already aligned to ShopiFixer intent:

- `/`
- `/pricing`
- `/run-audit`
- `/scorecard/:domain`

The public journey now represents:

- problem awareness
- audit entry
- scorecard/result
- ShopiFixer positioning
- proof expectation
- `$950` visibility

### 2. Existing payment entry point

The existing payment machinery is already in repo truth:

- `POST /__public-checkout`
  - creates Stripe Checkout sessions
  - creates a packet
  - binds `packet_id` into `client_reference_id`
  - stores `status: payment_pending`

- `GET /payment-return`
  - binds the payment return context back to the existing packet
  - is not payment proof

- `POST /stripe/webhook`
  - verifies Stripe signature
  - updates the packet to `payment_received` on verified `checkout.session.completed`

### 3. Existing fulfillment entry point

The existing fulfillment entry point is the packet update route:

- `POST /api/packets/:packetId/execution`

This route can update:

- `status`
- `execution_status`
- `proof_status`
- `completion_status`

The fulfillment authority says real fulfillment starts only after:

- `status: payment_received`
- `execution_status: not_started`
- `proof_status: not_started`
- `completion_status: not_started`

### 4. Existing proof entry point

The proof machinery already exists as operator truth and a runner:

- `staffordos/proof_loop/merchant_proof_loop_completion_pack_v1.js`
- `staffordos/proof_loop/run_merchant_proof_loop_completion_pack.js`

Operational read surface:

- `staffordos/ui/operator-frontend/app/api/operator/send-proof/route.ts`
  - reads proof send ledger data
  - exposes proof counts and latest proof records

### 5. Existing referral entry point

Referral is defined in authority and surfaced in operator truth, but there is no live merchant-facing referral action route yet.

Current defined referral truth exists in:

- `staffordos/authority/output/staffordos_canonical_lifecycle_v1.md`
- `staffordos/authority/output/staffordos_business_core_definition_of_done_v1.md`
- `staffordos/authority/output/revenue_success_gate_v1.md`
- `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts`

The CEO snapshot already exposes:

- `reviews_requested: 0`
- `reviews_received: 0`
- `referral_opportunities: 0`

That is truth exposure, not operational referral execution.

## B. Missing Connections

The missing work is not new architecture.
It is the connection between the aligned public ShopiFixer path and the existing back-half machinery.

Missing connections:

1. The public ShopiFixer path does not yet end in a visible purchase action that clearly means:
   - buy the canonical `$950 ShopiFixer Fix Sprint`

2. The current public pages do not yet bind the ShopiFixer decision to the existing packet-aware checkout entry in a merchant-obvious way.

3. The current public ShopiFixer pages do not expose the packet lifecycle transition from:
   - `payment_pending`
   - to `payment_received`

4. The current public flow does not visibly hand the merchant from payment into:
   - packet execution
   - proof generation
   - completion
   - review/referral

5. Referral is defined but not yet connected to any completed ShopiFixer merchant proof loop.

6. The generated merchant offer artifact still outputs a dynamic one-time fix price, which does not match the canonical fixed-fee authority and weakens the handoff.

## C. Exact Files

Files that must participate in the connection:

### Public conversion path

- `web/src/public/index.html`
- `web/src/routes/pricing.esm.js`
- `web/src/routes/runAudit.esm.js`
- `web/src/routes/scorecard.esm.js`
- `abando-frontend/app/shopifixer/page.tsx`

### Payment and packet path

- `web/src/checkout-public.js`
- `web/src/routes/packetAuthority.esm.js`
- `web/src/routes/stripeWebhook.esm.js`
- `web/src/lib/packetRepository.js`

### Fulfillment and proof path

- `staffordos/proof_loop/merchant_proof_loop_completion_pack_v1.js`
- `staffordos/proof_loop/run_merchant_proof_loop_completion_pack.js`
- `staffordos/ui/operator-frontend/app/api/operator/send-proof/route.ts`

### Operator truth and lifecycle surfaces

- `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts`
- `staffordos/ui/operator-frontend/lib/operator/lifecycleTerminology.ts`
- `staffordos/authority/output/staffordos_canonical_lifecycle_v1.md`
- `staffordos/commercial/merchant_lifecycle_state_machine_v1.json`
- `staffordos/authority/output/product_routing_authority_v1.md`
- `staffordos/authority/output/client_promotion_authority_v1.md`

### Offer artifact that should not drift

- `staffordos/clients/generate_shopifixer_offer_v1.mjs`
- `staffordos/clients/send_shopifixer_offer_v1.mjs`
- `staffordos/clients/shopifixer_offer_latest.json`

## D. Exact Routes

Routes already in repo that must be connected in sequence:

### Public ShopiFixer conversion routes

- `GET /`
- `GET /pricing`
- `GET /run-audit`
- `GET /scorecard/:domain`
- `GET /shopifixer`

### Existing payment routes

- `POST /__public-checkout`
- `GET /payment-return`
- `POST /stripe/webhook`

### Existing packet/fulfillment routes

- `POST /api/packets/prepare`
- `GET /api/packets/:packetId`
- `GET /api/operator/packets`
- `GET /api/operator/packets/:packetId`
- `POST /api/packets/:packetId/execution`

### Existing operator proof routes

- `GET /api/operator/send-proof`
- `GET /api/operator/ceo-snapshot`

## E. Exact Implementation Sequence

1. Make the public ShopiFixer decision path end in a payment CTA that clearly means:
   - buy the canonical `$950 Fix Sprint`

2. Route that CTA into the existing packet-aware checkout path rather than a generic or Abando-first offer path.

3. Ensure the checkout request carries or resolves the right merchant identity and packet binding context:
   - `store_domain`
   - `packet_id`
   - `payment_reference`

4. Ensure the post-payment return flow binds back to the same packet and does not masquerade as proof.

5. Ensure the existing verified Stripe webhook remains the only authority that moves a packet to:
   - `payment_received`

6. After payment, expose the packet state to the operator surfaces so Ross can see:
   - payment status
   - execution status
   - proof status
   - completion status

7. Wire the fulfillment step to the existing packet execution route so the paid packet can move through:
   - scope
   - implementation
   - QA
   - proof ready
   - complete

8. Use the proof runner and proof send surface to create a merchant-facing proof package and record it in operator truth.

9. Only after proof and completion should review/referral fields become actionable truth.

10. Keep Abando as the secondary post-fix route, not the primary conversion destination.

## F. Validation Steps

Validate the connection in this order:

1. Public ShopiFixer page shows the canonical `$950` offer and a clear buy action.
2. The buy action creates a packet-bound checkout session.
3. The payment-return route binds the checkout to the same packet.
4. A real Stripe-signed `checkout.session.completed` event updates the packet to `payment_received`.
5. The packet can then be advanced through execution, proof, and completion statuses.
6. The proof loop runner can produce merchant-facing proof pack output.
7. The CEO snapshot reflects the updated packet/payment/proof/completion truth.
8. Review/referral remains defined only after proof-complete merchant success.

## G. Highest ROI First Change

The highest ROI first change is:

**Connect the public ShopiFixer CTA to the existing packet-aware Stripe checkout path with the canonical `$950` offer and packet binding metadata.**

Why this first:

- payment code already exists
- packet code already exists
- verified webhook logic already exists
- fulfillment and proof machinery already exist
- the public path currently stops before the merchant reaches that machinery

That one connection turns the aligned public flow into a real purchase path instead of a front-half-only presentation.

## Lifecycle Transitions Involved

Canonical lifecycle transitions that must be respected:

- `Lead`
- `Qualification`
- `Product Routing`
- `Audit`
- `Conversation`
- `Payment`
- `Packet`
- `Fulfillment`
- `Proof`
- `Merchant Success`
- `Review`
- `Referral`
- `Repeat Revenue`

Packet lifecycle transitions that matter for the connection:

- `payment_pending`
- `payment_received`
- `execution_status: not_started -> in_progress -> qa -> proof_ready -> complete`
- `proof_status`
- `completion_status`

Merchant lifecycle machine states that already exist in repo:

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

## Bottom Line

The missing work is a single coherent connection, not a new system.

The public ShopiFixer path must hand the merchant into the existing packet-aware payment path, then into fulfillment, proof, completion, and only then review/referral.

Everything needed for the back half already exists in the repository.
The work package is to connect it cleanly.
