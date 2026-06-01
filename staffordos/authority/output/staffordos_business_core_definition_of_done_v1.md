# STAFFORDOS BUSINESS CORE DEFINITION OF DONE V1

## Scope

This defines DONE for the current StaffordOS business core only.

Current scope:

- Stafford Media revenue operation
- ShopiFixer $950 flat-fee Fix Sprint
- Merchant lifecycle from acquisition through referral
- CEO Cockpit truth binding
- Integrity checks that protect revenue, fulfillment quality, and claims

Future scope:

- Personal-life StaffordOS
- New agent orchestration
- New registries unless existing registries are proven insufficient
- Abando proof work except where needed to preserve product routing context

## Source Files

- staffordos/authority/output/staffordos_canonical_lifecycle_v1.md
- staffordos/authority/output/staffordos_cockpit_requirements_v1.md
- staffordos/authority/output/product_routing_authority_v1.md
- staffordos/authority/output/capacity_authority_v1.md
- staffordos/authority/output/client_promotion_authority_v1.md
- staffordos/authority/output/shopifixer_audit_authority_v1.md
- staffordos/authority/output/shopifixer_fulfillment_authority_v1.md
- staffordos/authority/output/s2g_packet_binding_readiness_v1.md
- staffordos/authority/output/s2h_real_payment_readiness_snapshot_v1.md
- staffordos/clients/client_registry_v1.json
- staffordos/leads/lead_registry_v1.json
- staffordos/audits/shopifixer_audit_standard_v1.md

## Business Core Done State

StaffordOS Business Core is DONE for this phase when Ross can answer, from the CEO Cockpit without terminal archaeology:

1. Which merchants should be contacted next?
2. Which merchants are close to paying?
3. Which paid packets need fulfillment?
4. Which completed merchants can create reviews, referrals, or the next sprint?
5. What is blocked, what is risky, and what is the next best action?

The system is not DONE because files exist. It is DONE when those files produce an operator-grade business loop.

## Acquisition

DONE means:

- Real merchant leads are recorded in staffordos/leads/lead_registry_v1.json.
- Each lead has merchant identity, domain, source, lifecycle stage, contact state, selected or pending product route, and next action.
- The operator can distinguish new leads, contact-needed leads, outreach-ready leads, sent leads, and engaged leads.
- The CEO Cockpit surfaces acquisition counts and the next acquisition action from real files.
- Outreach volume is capped until conversion and fulfillment proof are ready.

Not done:

- Generic lead lists without lifecycle state.
- Lead counts that do not map to a next action.
- Outreach recommendations that are not backed by registry records.

## Qualification

DONE means:

- A lead is marked qualified only when there is a visible merchant problem, plausible buyer fit, reachable contact path, and a reason the offer is worth discussing.
- Disqualified merchants are kept out of active pursuit.
- Qualification result is visible in StaffordOS through lead or client lifecycle state.
- The qualification record supports product routing rather than defaulting to ShopiFixer.

Not done:

- Treating every scraped store as qualified.
- Moving merchants into sales motion without contact confidence or a visible problem.

## Product Routing

DONE means:

- Product routing follows staffordos/authority/output/product_routing_authority_v1.md.
- ShopiFixer is selected when visible UX, product, cart, checkout, trust, or navigation friction can be fixed in one sprint.
- Abando is selected only when checkout recovery is the evidenced problem and the merchant is ready for ongoing recovery.
- Consulting is selected only when the problem is broader than one sprint.
- Disqualification is used when no meaningful route exists.
- Every active merchant has selected product, routing rationale, and anti-cross-sell boundary.

Not done:

- Defaulting every merchant to a product without evidence.
- Cross-selling Abando before the merchant problem supports it.

## Audit

DONE means:

- A ShopiFixer audit meets staffordos/audits/shopifixer_audit_standard_v1.md and staffordos/authority/output/shopifixer_audit_authority_v1.md.
- The audit includes executive summary, scorecard, 3-5 findings, selected sprint recommendation, before-state evidence, proposed fix, expected impact category, proof plan, and sprint deliverables.
- Evidence is visible, merchant-specific, and stored in the audit workspace.
- The audit answers what is wrong, why it matters, why this issue was selected, what will change, and how success will be proven.
- The audit does not guarantee conversion lift or revenue recovery.

Not done:

- Written opinion without screenshot evidence.
- Large consulting report that slows payment.
- Claims that the audit does not prove.

## Conversion

DONE means:

- A qualified merchant can move from audit to proposal to $950 ShopiFixer buying decision.
- Client promotion follows staffordos/authority/output/client_promotion_authority_v1.md.
- The merchant-facing value proposition is visible: one focused issue identified, fixed, QA'd, and proven with before/after evidence.
- Payment link state, proposal state, and next action are recorded in StaffordOS.
- CEO Cockpit shows merchants close to payment and why they are close.

Not done:

- Sending a checkout link before the audit proves value.
- Claiming merchant readiness without audit evidence or payment state.

## Payment

DONE means:

- ShopiFixer payment is a $950 one-time Checkout session.
- Checkout creation binds packet identity through client_reference_id and metadata.packet_id as documented in staffordos/authority/output/s2g_packet_binding_readiness_v1.md.
- A verified Stripe checkout.session.completed webhook moves the packet from payment_pending to payment_received.
- The payment-return route can bind return context but is not payment proof.
- The CEO Cockpit shows payment pending, payment received, and payment blocked from real packet/client records.

Not done:

- Treating redirect return as proof of payment.
- Starting fulfillment before verified payment_received.

## Packet

DONE means:

- A paid merchant has one canonical packet with store domain, packet id, payment reference, lifecycle status, execution status, proof status, completion status, and scope.
- Packet creation is bound to payment and visible to the operator.
- The packet contains or points to the fix scope, before evidence requirements, QA requirements, after evidence requirements, and proof package path.

Not done:

- Work instructions living only in chat or terminal history.
- Packet identity that is not visible from StaffordOS.

## Fulfillment

DONE means:

- Fulfillment starts only after payment_received as defined in staffordos/authority/output/shopifixer_fulfillment_authority_v1.md.
- Scope is specific, visible, feasible in one sprint, and explainable to a merchant.
- Work progresses through not_started, in_progress, QA, proof_ready, and completed states.
- Capacity follows staffordos/authority/output/capacity_authority_v1.md.
- Ross can see active packets, waiting merchant items, QA queue, and proof queue from the cockpit.

Not done:

- Starting Shopify mutation or implementation before scope, payment, and proof requirements are clear.
- Selling more work than can be fulfilled with proof.

## Proof

DONE means:

- Every completed sprint has before evidence, execution notes, QA evidence, after evidence, and merchant-facing proof package.
- The proof package answers what was found, why it mattered, what changed, what proof shows the change, and what the merchant should watch next.
- Claims are limited to visible changes and expected improvement categories.

Not done:

- Fake proof.
- Proof based only on written assertion.
- Revenue or conversion claims without measured merchant data.

## Review

DONE means:

- After proof package delivery, StaffordOS records review request status, merchant response, testimonial status, satisfaction risk, and follow-up action.
- Negative or blocked feedback becomes a quality signal before more outreach is added.

Not done:

- Treating completion as success before merchant review or acceptance is captured.

## Referral

DONE means:

- Only satisfied, proof-complete merchants enter referral motion.
- StaffordOS records referral opportunity, ask status, referral source, and next action.
- Referral motion does not run ahead of delivery quality.

Not done:

- Asking for referrals before proof and merchant confidence exist.

## CEO Cockpit

DONE means:

- The cockpit is the primary operator surface for acquisition, conversion, fulfillment, merchant success, revenue, capacity, blockers, system health, and next best action.
- It binds existing truth sources instead of introducing a disconnected dashboard.
- Required truth sources include:
  - staffordos/clients/client_registry_v1.json
  - staffordos/leads/lead_registry_v1.json
  - staffordos/clients/operator_dashboard_snapshot_v1.json
  - packet/payment authority routes and packet records
  - audit/proof workspaces
- Every displayed claim includes enough source context for Ross to trust it.

Not done:

- A control page that only runs operational actions.
- A dashboard that hides lifecycle state.
- A UI that cannot tell Ross what to do next.

## Self-Healing And Integrity Checks

DONE means:

- Integrity checks detect missing required fields, stale snapshots, orphaned packets, payment state mismatch, missing audit evidence, missing proof evidence, capacity overrun, and product routing drift.
- Checks fail closed when payment, proof, or merchant claims are unsafe.
- Validators write artifacts that are visible from StaffordOS or linked from the cockpit.
- Existing registries are used unless a specific gap proves they cannot hold the required truth.

Not done:

- Adding new registries before proving the existing Lead Registry and Client Registry are insufficient.
- Silent failures that require terminal archaeology to discover.

## Phase Exit Criteria

This phase is DONE when:

1. CEO Cockpit truth binding covers all required sections at least at PARTIAL with source-backed data.
2. One ShopiFixer audit proves a $950 value proposition with merchant-specific visible evidence.
3. Public buying flow is verified through $950 one-time checkout and signed webhook packet transition.
4. One paid packet can move through fulfillment and proof without manual archaeology.
5. No public claim exceeds the available evidence.
