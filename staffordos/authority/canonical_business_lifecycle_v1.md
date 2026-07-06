# CANONICAL BUSINESS LIFECYCLE V1

## 1. Purpose

Define the canonical end-to-end business lifecycle for Stafford Media Consulting:
how the business actually operates from first marketing touch through
qualification, routing, sales, delivery, payment, proof, customer success,
referral, and possible Abando expansion.

This document is the master lifecycle authority. Vocabulary, fiscal planning,
UI navigation, and AI-agent workflows conform to it — they do not redefine it.

If any other document, prompt, UI, or agent contradicts this file on the
identity, order, ownership, or gating of a lifecycle stage, this file wins and
the other should be corrected.

This is a documentation authority. It describes the lifecycle; it does not
change runtime code, registries, or data.

---

## 2. Canonical business facts

- Stafford Media Consulting is the company.
- StaffordOS is the internal operating and governance system. It is not sold to
  merchants and is not a product.
- ShopiFixer is a governed AI engineering service for Shopify website owners.
  ShopiFixer is not SaaS. It is delivered through StaffordOS plus coding agents
  (e.g. Codex, Claude Code, or future agents). Its commercial packaging is the
  $950 flat-fee Fix Sprint.
- Abando is a separate revenue-recovery SaaS product. It can be sold
  independently and can also be offered as a post-ShopiFixer upsell. It is not a
  bundled continuation of ShopiFixer.
- Actinventory is inactive and name-reserved only. It is not an active product
  and must not be treated as one.

Product identity is owned by `staffordos/authority/product_definitions_v1.md`
(when authored). This lifecycle references product identity; it does not fork it.

---

## 3. Entity spine

One merchant journey currently spans three registries, unified by a relationship
resolver:

- Lead — `staffordos/leads/lead_registry_v1.json`
- Client — `staffordos/clients/client_registry_v1.json`
- Merchant — `staffordos/merchant_registry/merchant_lifecycle_registry_v1.json`
- Relationship (unifying identity) — `staffordos/ui/operator-frontend/lib/operator/relationshipResolver.ts`

Authority rules:

- `merchant_lifecycle_registry_v1.json` is the entity-level lifecycle authority.
  Its per-stage status fields (qualification_status, audit_status, offer_status,
  payment_status, fulfillment_status, proof_package_status,
  before_evidence_status, after_evidence_status, revenue_status, review_status,
  referral_status, and related fields) are the source of truth for where a
  merchant is in the lifecycle.
- `staffordos/commercial/merchant_lifecycle_state_machine_v1.json` is a derived
  current-stage model (a single `current_stage` enum plus allowed transitions).
  It is not a competing lifecycle. It expresses the current stage derived from
  the entity-level authority.
- The three-store spine (Lead / Client / Merchant / Relationship) is a known
  reconciliation concern (see Known Gaps).

Confirmed linear spine (from the state machine allowed transitions):

```
lead_new -> qualified -> drafted -> approved -> send_ready -> contacted ->
replied -> shopifixer_paid -> shopifixer_in_delivery -> shopifixer_completed ->
abando_upsell_ready -> abando_subscribed   (plus closed_lost)
```

---

## 4. Full lifecycle S1–S11

```
S1  Marketing
S2  Lead Generation
S3  Qualification
S4  Product / Service Routing
S5  ShopiFixer Sales Journey
S6  ShopiFixer Delivery Journey
S7  Payment & Revenue           (cross-cutting; gates S5 -> S6)
S8  Customer Success
S9  Referral
S10 Abando Expansion            (branch; also an independent entry point)
S11 Executive / Quarterly Planning   (roll-up over S1-S10)
```

The following sub-sections define each stage. Sections 5–12 of this document are
expressed per stage below so that entry, exit, owner, data, evidence, gates, and
payment handling stay attached to their stage.

### S1 — Marketing

- Definition: How merchants first enter awareness — campaigns, budget, outreach
  source, and attribution.
- Entry criteria: A marketing/outreach motion is planned, or a source begins
  producing prospects.
- Exit criteria: A prospect is captured as a lead record (transition to S2).
- Owner / department: Marketing.
- Required data: `lead.source`, `lead.channel`, `lead.runtime_source`; campaign
  inventory via `campaignResolver`.
- Required evidence: None formalized today.
- Human approval gate: Ross approves campaigns and budgets (budget store does not
  exist yet).
- AI-agent responsibility gate: Agents may generate outreach drafts; agents may
  not send unapproved outreach.
- Payment / revenue handling: None.
- Note: Marketing attribution is DESIGNED BUT NOT FULLY IMPLEMENTED. `lead.source`
  is a data-origin tag (observed values include `staffordos`, `manual_backfill`,
  `.tmp/send_console_data.json`), not marketing attribution. There is no
  `campaign_id` or UTM on leads, and synthesized campaigns are not linked back to
  the leads they produced. This stage is the weakest-backed in the repository.

### S2 — Lead Generation

- Definition: A prospect becomes a structured lead with captured data and
  preserved attribution.
- Entry criteria: A prospect is identified from a source.
- Exit criteria: A lead record exists with identity plus a routing hint, ready to
  qualify.
- Owner / department: Revenue.
- Required data (real): `lead_id, name, domain, product, product_surface, source,
  lifecycle_stage, status, score, contact{email, confidence}, engagement{sent,
  replied}, routing{primary, secondary}, refs, payment_status, created_at`.
- Required evidence: `staffordos/leads/lead_events_v1.json`; send activity in
  `staffordos/leads/send_ledger_v1.json`.
- Human approval gate: Outreach requires approval
  (`pending_approval -> approved`).
- AI-agent responsibility gate: Agents draft and queue; the execute action
  appends governed events to `staffordos/events/operator_action_events_v1.json`.
- Payment / revenue handling: None.
- Note: Campaign attribution is not preserved from lead back to campaign (see S1).

### S3 — Qualification

- Definition: StaffordOS and Ross decide whether the lead is worth pursuing.
- Entry criteria: The lead has enough identity/contact signal to assess.
- Exit criteria: `qualification_status = qualified` (with reason and source), or
  `closed_lost` / no action.
- Owner / department: Revenue. Ross is the approval authority.
- Required data (real): merchant lifecycle `qualification_status,
  qualification_reason, qualification_source, qualification_updated_at`;
  `lead.score`; client `lifecycle.stage`.
- Required evidence: Qualification reason string; client `decision_trace`.
- Human approval gate: Ross confirms qualified. This is a canonical human
  authority gate.
- AI-agent responsibility gate: Agents may score and recommend; agents may not
  self-mark a lead qualified for pursuit without Ross.
- Payment / revenue handling: None.

### S4 — Product / Service Routing

- Definition: Route the qualified lead to ShopiFixer, Abando, no action, or a
  future offering — based on observed evidence, never defaulted.
- Entry criteria: Lead qualified.
- Exit criteria: A route is selected (`ShopiFixer` | `Abando` | `no action`).
- Owner / department: Revenue (routing authority) with Ross confirmation.
- Required data (real): `lead.routing{primary, secondary}` (observed:
  `primary: shopifixer, secondary: abando_recovery`);
  `staffordos/commercial/offer_routing_rules_v1.json`.
- Required evidence: Observed problem signals per the routing authority (visible
  UX / product-page / cart / checkout friction routes to ShopiFixer).
- Human approval gate: Ross confirms the route on non-obvious cases.
- AI-agent responsibility gate: The router proposes; it must not default to a
  product. Routing is evidence-based
  (`staffordos/authority/output/product_routing_authority_v1.md`:
  "Do not default to a product. Route based on evidence.").
- Payment / revenue handling: None.
- Note: Actinventory is not a routing target. It is inactive / name-reserved.

### S5 — ShopiFixer Sales Journey

- Definition: Audit request, audit running, audit complete, recommendations,
  merchant review, offer/proposal, and payment intent. The audit is the sales
  asset; the $950 Fix Sprint is the product.
- Entry criteria: Lead routed to ShopiFixer.
- Exit criteria: Offer accepted and payment initiated (enters the S7 gate).
- Owner / department: Revenue. Ross approves the offer.
- Required data (real): merchant `audit_status, offer_status, offer_price
  ($950), payment_amount, payment_currency`; client `deal{type, value,
  payment_status}`, `close_engine`.
- Required evidence: Audit findings;
  `staffordos/authority/output/shopifixer_store_inspection_checklist_v1.md`.
- Human approval gate: Ross approves the offer/proposal.
- AI-agent responsibility gate: Coding/audit agents run the audit and draft
  recommendations; agents may not send an unapproved offer.
- Payment / revenue handling: `offer_price` is set; `deal.payment_status` reflects
  pending/not-billable state. No Stafford revenue is recognized yet.

### S6 — ShopiFixer Delivery Journey

- Definition: Engineering packet, AI coding-agent assignment, governed execution,
  code changes, QA, validation, rollback, before/after evidence, and merchant
  proof package.
- Entry criteria: Verified `payment_received` (see S7). Delivery work must not
  begin before payment is captured.
- Exit criteria: `fulfillment_status = completed` and
  `proof_package_status = complete`.
- Owner / department: Engineering / Fulfillment. Agents execute; Ross approves
  scope and proof.
- Required data (real): `fulfillment_status, execution_status, proof_status,
  before_evidence_status, after_evidence_status, proof_package_status`;
  `lifecycle_lane{audit_complete, conversion_brief_generated, offer_sent,
  payment_received, fulfillment_started, proof_complete, completed}`.
- Required evidence (real):
  `staffordos/proof_runs/internal_shopifixer_dry_run_v1/` (before_evidence,
  scoped_fix, after_evidence, proof_package, completion);
  `staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json`.
- Human approval gate: Ross approves the execution scope and the proof package.
  Human judgment is required before irreversible changes.
- AI-agent responsibility gate: Codex / Claude Code (or future agents) execute
  approved fixes, run QA, and capture before/after evidence. The execute action
  writes governed events to `staffordos/events/*`.
- Payment / revenue handling: Payment is already captured. Revenue is recognized
  on completion per the revenue rules (Section: S7 and Governance).

### S7 — Payment & Revenue (cross-cutting gate)

- Definition: Strict separation of merchant value, Stafford revenue, payment
  pending, payment captured, and revenue gap. Gates S5 into S6.
- Entry criteria: Offer accepted (S5).
- Exit criteria: `payment_status = payment_received` (verified), which unlocks S6;
  or the deal is lost.
- Owner / department: Revenue. The payment-capture authority is the Stripe webhook
  authority (a system authority, not a human).
- Required data (real): `payment_status, payment_amount, payment_currency`; client
  `revenue{shopifixer_one_time, shopifixer_collected, abando_recurring_mrr,
  abando_percentage, total_lifetime_value}`; `stafford_revenue_earned` versus
  `abando.merchant_revenue_recovered`; `revenue_gaps[].gap`.
- Required evidence: Stripe `checkout.session.completed` event; packet binding.
- Human approval gate: None. Operators may not mark payment received.
- AI-agent responsibility gate: Agents and operators are forbidden from
  transitioning `payment_pending -> payment_received`. Payment received can only
  be marked by the Stripe webhook authority
  (`web/src/routes/stripeWebhook.esm.js`) with a valid Stripe signature, per
  `staffordos/authority/payment_lifecycle_registry_v1.md`.
- Payment / revenue handling (canonical): Merchant value is not Stafford revenue.
  Merchant-recovered value (including Abando recovered value) belongs to the
  merchant and is not Stafford revenue until Stafford is actually paid. Revenue
  gap = merchant value − Stafford revenue.

### S8 — Customer Success

- Definition: Merchant acceptance, review, satisfaction, follow-up, support, and
  outcome tracking.
- Entry criteria: Delivery complete and proof delivered.
- Exit criteria: An outcome is recorded (accepted / at-risk); may branch to S9 or
  S10.
- Owner / department: Revenue / Success, with Ross.
- Required data (real): merchant `review_status, case_study_status,
  revenue_status`; `customer_outcomes[]` (outcome_state, why,
  suggested_next_action, revenue_impact).
- Required evidence: Merchant proof-package acceptance; outcome events in
  `staffordos/events/outcome_event_log_v1.json`.
- Human approval gate: Ross reviews the outcome and requests a testimonial.
- AI-agent responsibility gate: Agents summarize outcomes; agents may not
  fabricate satisfaction or outcomes.
- Payment / revenue handling: Revenue is recognized as captured; recurring revenue
  arises only through Abando (S10).

### S9 — Referral

- Definition: When a referral is requested and how referrals are tracked and
  connected back to the customer/campaign.
- Entry criteria: A positive customer-success outcome.
- Exit criteria: A referral is captured as a new lead (loops back to S2 with
  referral attribution).
- Owner / department: Revenue, with Ross.
- Required data: merchant `referral_status`.
- Required evidence: None today.
- Human approval gate: Ross requests the referral.
- AI-agent responsibility gate: Agents may draft referral asks.
- Payment / revenue handling: None direct.
- Note: Referral is FIELD-ONLY / NOT OPERATIONALLY IMPLEMENTED. `referral_status`
  exists on the merchant record and is currently `not_started` for all records.
  There is no referral tracking store and no referral-to-new-lead attribution.

### S10 — Abando Expansion

- Definition: When Abando can be offered after ShopiFixer, how it remains a
  separate product, how it can also sell independently, and how ShopiFixer
  evidence can create an Abando upsell opportunity.
- Entry criteria: `shopifixer_completed` (upsell path), or an independent Abando
  lead (direct entry).
- Exit criteria: `abando_subscribed`, or the upsell is declined.
- Owner / department: Revenue. Abando is a separate product engine.
- Required data (real): state machine `abando_upsell_ready -> abando_subscribed`;
  client `abando{...}`, `revenue.abando_recurring_mrr, abando_percentage`.
- Required evidence: The ShopiFixer proof package (as upsell rationale); Abando
  recovery/attribution data (observed source `existing_abando_attribution`).
- Human approval gate: Ross approves the upsell offer.
- AI-agent responsibility gate: Agents may prepare the upsell; agents must keep
  Abando separate from ShopiFixer, not present it as a bundled continuation.
- Payment / revenue handling: Abando revenue is recurring MRR. Abando
  merchant-recovered value is not Stafford revenue until billed.

### S11 — Executive / Quarterly Planning (roll-up)

- Definition: Aggregates S1–S10 into fiscal year, quarter, department, campaign,
  revenue target, ROI, and lessons learned.
- Entry criteria: Continuous; reviewed each quarter.
- Exit criteria: The quarter is closed with actuals versus targets plus lessons
  learned.
- Owner / department: Executive (Ross).
- Required data (real): `staffordos/cockpit/ceo_truth_snapshot_v1.json`,
  `staffordos/revenue/revenue_truth_v1.json`, dashboard `top_metrics`.
- Required evidence: CEO Cockpit truth binding; blocker traces.
- Human approval gate: Ross sets objectives, budgets, and targets.
- AI-agent responsibility gate: Agents summarize; agents do not set targets and do
  not count merchant value as revenue.
- Payment / revenue handling: Rolls up Stafford revenue only (never merchant
  value) into targets and ROI.
- Note: The fiscal layer is not yet implemented. The fiscal year is confirmed as a
  calendar year (FY2027 = Jan 1 – Dec 31 2027; Q1 Jan–Mar, Q2 Apr–Jun, Q3
  Jul–Sep, Q4 Oct–Dec). The fiscal plan document is authored separately.

---

## 13. Repository mappings (summary)

| Stage | Primary authority file(s) | Backing strength |
| --- | --- | --- |
| S1 Marketing | `campaignResolver.ts`, `lead.source` | Weak (no campaign_id / UTM) |
| S2 Lead Generation | `lead_registry_v1.json`, `send_ledger_v1.json`, `lead_events_v1.json` | Strong |
| S3 Qualification | merchant `qualification_*`, `client.lifecycle` | Strong |
| S4 Routing | `product_routing_authority_v1.md`, `offer_routing_rules_v1.json`, `lead.routing` | Good |
| S5 Sales | merchant `audit`/`offer`, `shopifixer_commercial_definition_v1.md`, `client.deal` | Strong |
| S6 Delivery | `shopifixer_fulfillment_truth_v1.json`, `proof_runs/`, `lifecycle_lane`, execute route | Strong |
| S7 Payment & Revenue | `payment_lifecycle_registry_v1.md`, `revenue_truth_v1.json`, `client.revenue` | Strong (gated) |
| S8 Customer Success | merchant `review_status`, `deriveCustomerOutcome`, `outcome_event_log_v1.json` | Good |
| S9 Referral | merchant `referral_status` (field only) | Field-only, untracked |
| S10 Abando Expansion | state machine abando states, `client.abando` | Good |
| S11 Executive / Quarterly | `ceo_truth_snapshot_v1.json`, `revenue_truth_v1.json`; fiscal greenfield | Roll-up exists; fiscal absent |

---

## 14. Known gaps

1. Multiple representations of one lifecycle. The merchant record carries
   per-field statuses and the state machine carries a single `current_stage`
   enum; `lifecycleTerminology.ts` and `translateStage()` add further stage/phase
   names. These must reconcile against this authority (merchant record =
   entity-level authority; state machine = derived current stage).
2. Three-store entity spine. Lead, Client, and Merchant live in separate
   registries unified by the relationship resolver; the identities Lead / Client /
   Merchant / Relationship must be defined and reconciled.
3. Marketing attribution gap (S1). `lead.source` is a data-origin tag; there is no
   `campaign_id` or UTM, and campaigns are not linked to the leads they produce.
   Designed but not fully implemented.
4. Referral untracked (S9). `referral_status` is field-only and currently
   `not_started` for all records; there is no referral store or attribution.
   Field-only / not operationally implemented.
5. Payment gate must stay system-only. Only the Stripe webhook authority may mark
   `payment_received`; operator or agent actions must never grant paid status.
6. Merchant value versus Stafford revenue. These must remain separated at S7, S10,
   and S11.
7. Routing "no action" and future paths are under-specified; Actinventory must
   remain inactive / name-reserved.

---

## 15. Governance rules

1. This document is the master lifecycle authority. On any conflict about stage
   identity, order, ownership, or gating, this file wins and the conflicting
   source is corrected.
2. `merchant_lifecycle_registry_v1.json` is the entity-level lifecycle authority.
   `merchant_lifecycle_state_machine_v1.json` is a derived current-stage model and
   must not be treated as a competing lifecycle.
3. Payment received can only be marked by the Stripe webhook authority. No human,
   operator, or agent may grant paid status by any other path.
4. Merchant value (including Abando recovered value) is never counted as Stafford
   revenue until Stafford is paid.
5. ShopiFixer is a service, not SaaS. Abando is a separate SaaS product, standalone
   or as a post-ShopiFixer upsell. Actinventory is inactive / name-reserved.
6. Human approval gates (Ross) apply at qualification (S3), outreach approval (S2),
   offer/proposal (S5), execution scope and proof package (S6), referral request
   (S9), Abando upsell (S10), and objectives/budgets/targets (S11).
7. AI agents propose, draft, execute approved scope, and summarize; agents do not
   self-approve human gates, do not grant payment, and do not fabricate outcomes
   or revenue.
8. Stages that are designed but not implemented (S1 attribution, S9 referral) must
   be presented as such in any downstream UI or workflow, not as operational.
9. Versioning: this is `_v1`. Breaking changes to a stage's identity, order, or
   gating require `_v2` plus a migration note; do not silently redefine `_v1`.

---

## 16. Implementation order

1. `staffordos/authority/product_definitions_v1.md` — product identity.
2. `staffordos/authority/canonical_business_lifecycle_v1.md` — this document; the
   master lifecycle. Precedes vocabulary and fiscal work because both conform to
   it.
3. `staffordos/authority/canonical_vocabulary_v1.md` — conforms to the stage and
   phase names defined here.
4. `staffordos/authority/fiscal/fiscal_plan_fy2027_v1.*` — rolls S1–S10 up on the
   calendar FY2027 model.
5. Later, separately-validated code missions: reconcile the three entity stores;
   designate the state machine, `lifecycleTerminology.ts`, and `translateStage()`
   as conformers; then close the Marketing-attribution and Referral gaps.

---

## 17. Non-goals

- This is not a UI implementation mission.
- This is not the vocabulary freeze.
- This is not fiscal planning.
- This document changes no runtime code, no registries, and no data.
- It does not create JSON mirrors, fiscal plans, or vocabulary docs.
- It does not introduce new products and does not redefine ShopiFixer as SaaS.
