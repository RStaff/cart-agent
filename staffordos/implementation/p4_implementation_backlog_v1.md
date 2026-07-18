# StaffordOS P4 Implementation Backlog V1

Mission: STAFFORDOS_P4.1_IMPLEMENTATION_BACKLOG_V1
Status: implementation backlog only
Implementation status: not implemented
Commit status: do not commit

## Source Basis

This backlog is derived only from repository truth, especially:

- `staffordos/implementation/p4_capability_certification_v1.md`
- `staffordos/authority/canonical_business_lifecycle_v1.md`
- `staffordos/authority/canonical_department_architecture_v1.md`
- `staffordos/authority/canonical_money_model_v1.md`
- `staffordos/authority/canonical_vocabulary_v1.md`
- `staffordos/authority/fiscal_operating_model_v1.md`
- `staffordos/operations/marketing_operating_architecture_v1.md`
- `staffordos/operations/campaign_operating_architecture_v1.md`
- `staffordos/operations/attribution_traceability_architecture_v1.md`
- runtime lead, campaign, payment, revenue, dashboard, and validator surfaces

This is an executable work queue, not a new architecture.

## Backlog Ordering Rules

Items are ordered by:

1. Highest business value
2. Lowest architectural risk
3. Maximum reuse
4. Fastest path to a working StaffordOS

## Sprint 1

### I001 - Stable Campaign Attribution on Leads

- Capability: Campaign Attribution
- Business value: Unlocks end-to-end traceability from campaign to revenue.
- Technical value: Adds the smallest missing attribution head to the existing
  lead registry.
- Dependencies: Lead registry writer, campaign model, lead intake path.
- Estimated size: M
- Risk: High
- Validation required: Lead records retain current truth; new attribution fields
  preserve provenance; no regression in lead loading or promotion.
- Rollback strategy: Remove or ignore the new attribution fields and preserve the
  current lead registry shape.
- Definition of Done: Canonical lead records can carry a stable campaign link and
  attribution provenance without breaking current lead management.
- Recommended commit scope: Lead registry writer + lead schema contract + intake
  stamping only.

### I002 - Canonical Campaign Registry

- Capability: Campaign Registry
- Business value: Gives StaffordOS a governed campaign object instead of
  synthesized type slugs.
- Technical value: Creates the stable object all future campaign work depends on.
- Dependencies: Campaign model, lead attribution, operating architecture.
- Estimated size: M
- Risk: High
- Validation required: Campaign IDs are stable and per-campaign; current campaign
  projections still load; no UI breakage.
- Rollback strategy: Fall back to synthesized projection while preserving new
  registry data.
- Definition of Done: Campaigns exist as stored canonical records with stable
  per-campaign identity.
- Recommended commit scope: New campaign storage shape + loader + minimal
  projection bridge.

### I003 - UTM Capture and Attribution Provenance

- Capability: Marketing / Attribution
- Business value: Makes future campaign source analysis possible.
- Technical value: Preserves source, medium, campaign, and content/term
  provenance on the same lead path.
- Dependencies: Stable campaign attribution on leads.
- Estimated size: M
- Risk: Medium
- Validation required: UTM fields are optional where absent, required where
  captured, and never overwrite canonical lead truth.
- Rollback strategy: Ignore UTM fields and continue with source-only lead truth.
- Definition of Done: Lead records can retain UTM provenance without changing
  current routing or qualification behavior.
- Recommended commit scope: Lead ingestion/write path + display/projection
  support only.

### I004 - Stripe Payment Truth Propagation

- Capability: Payment Processing / Revenue Authority
- Business value: Ensures verified payment is reflected in downstream truth.
- Technical value: Closes the current packet-to-client/revenue propagation gap.
- Dependencies: Stripe webhook authority, client registry, revenue truth,
  dashboard snapshots.
- Estimated size: M
- Risk: High
- Validation required: Verified payment updates propagate to all governed runtime
  truth surfaces without changing payment authority.
- Rollback strategy: Preserve webhook capture; revert downstream propagation only.
- Definition of Done: A verified payment is visible in client, revenue, and
  executive truth surfaces from the source of record.
- Recommended commit scope: Downstream propagation only; no payment authority
  changes.

### I005 - Evidence and Proof Propagation

- Capability: Evidence Generation / ShopiFixer Delivery
- Business value: Makes paid delivery defensible and reviewable.
- Technical value: Links evidence, proof package, and delivery truth to the
  merchant lifecycle.
- Dependencies: Payment truth propagation, delivery artifacts, merchant
  lifecycle.
- Estimated size: M
- Risk: Medium
- Validation required: Evidence state survives the paid-loop path; proof package
  states remain source-backed.
- Rollback strategy: Keep existing evidence artifacts and remove only new
  propagation links if needed.
- Definition of Done: Delivery evidence and proof package status are surfaced as
  governed truth after payment.
- Recommended commit scope: Evidence linkage and proof propagation only.

## Sprint 2

### I006 - Campaign Spend Storage

- Capability: Campaign Budget / Spend
- Business value: Enables true campaign ROI.
- Technical value: Adds the cost-side truth required by campaign reporting.
- Dependencies: Campaign registry, campaign attribution.
- Estimated size: M
- Risk: Medium
- Validation required: Spend is separate from budget, optional until present,
  and never treated as revenue.
- Rollback strategy: Ignore spend storage and preserve campaign truth.
- Definition of Done: Actual campaign spend can be stored and projected without
  affecting money authority.
- Recommended commit scope: New spend store or spend fields only.

### I007 - Campaign Budget Storage

- Capability: Fiscal Planning / Marketing
- Business value: Makes campaign governance explicit and reviewable.
- Technical value: Separates approved budget from actual spend.
- Dependencies: Campaign registry, fiscal model.
- Estimated size: M
- Risk: Medium
- Validation required: Budget and spend remain distinct; approvals are preserved.
- Rollback strategy: Preserve campaign objects and remove budget fields if needed.
- Definition of Done: Campaigns have governed approved budget metadata.
- Recommended commit scope: Budget fields plus approval metadata only.

### I008 - Campaign ROI Calculation

- Capability: ROI
- Business value: Lets StaffordOS compare campaign spend to captured Stafford
  Revenue.
- Technical value: Introduces a single governed ROI formula over authority data.
- Dependencies: Campaign attribution, campaign registry, spend storage, payment
  truth propagation, revenue authority.
- Estimated size: M
- Risk: High
- Validation required: ROI uses captured Stafford Revenue only; Merchant Value
  and Pipeline Value remain excluded.
- Rollback strategy: Disable ROI display and keep budget/spend/revenue separate.
- Definition of Done: Campaign ROI is computed only from authoritative captured
  revenue and actual spend.
- Recommended commit scope: Calculation + read-only reporting only.

### I009 - Founder Truth Binding

- Capability: Executive Operating System / Founder Dashboard
- Business value: Gives Ross one governed daily command surface.
- Technical value: Binds founder queue, payment, proof, lead, campaign, and
  revenue truth into one ranked operating view.
- Dependencies: Payment truth propagation, evidence propagation, lead/campaign
  truth, dashboard loaders.
- Estimated size: L
- Risk: Medium
- Validation required: Founder queue surfaces the highest-value action, highest
  risk, blocked work, approvals, and pending payments from source-backed data.
- Rollback strategy: Keep existing dashboard surfaces and disable the unified
  queue view.
- Definition of Done: Ross can operate the day from one source-backed founder
  queue.
- Recommended commit scope: Queue loader + executive surface binding only.

### I010 - Campaign / Lead / Revenue Drill-Through

- Capability: Reporting / Executive Dashboard / Operator Dashboard
- Business value: Makes the business spine inspectable end to end.
- Technical value: Reuses existing resolvers and snapshots to show the chain
  instead of isolated summaries.
- Dependencies: Campaign attribution, relationship resolver, revenue truth,
  dashboard loaders.
- Estimated size: M
- Risk: Medium
- Validation required: Drill-through shows the same IDs across surfaces and does
  not invent new authority.
- Rollback strategy: Keep current summary surfaces if drill-through regresses.
- Definition of Done: Ross can move from campaign to lead to relationship to
  revenue in governed projections.
- Recommended commit scope: Reporting/read model only.

## Sprint 3

### I011 - Proposal Identifier and Workflow Closure

- Capability: Proposal Workflow
- Business value: Gives sales a durable offer record.
- Technical value: Removes proposal identity ambiguity from the merchant path.
- Dependencies: Merchant lifecycle, sales authority, offer/proposal logic.
- Estimated size: S
- Risk: Medium
- Validation required: Proposal identity is stable and does not change payment
  authority or revenue truth.
- Rollback strategy: Fall back to offer-status-only behavior.
- Definition of Done: Proposals can be referenced as governed entities in the
  sales workflow.
- Recommended commit scope: Proposal ID and persistence only.

### I012 - Customer Success Review and Follow-Up Closure

- Capability: Customer Success
- Business value: Makes retention, review, and referral operational.
- Technical value: Closes the post-delivery loop with explicit follow-up truth.
- Dependencies: Evidence propagation, revenue authority, merchant lifecycle.
- Estimated size: M
- Risk: Medium
- Validation required: Review and follow-up states are explicit and source-backed.
- Rollback strategy: Preserve existing outcome fields and disable new follow-up
  propagation if needed.
- Definition of Done: Customer success outcomes and follow-up states are governed
  and reviewable.
- Recommended commit scope: Outcome state propagation only.

### I013 - Abando Subscription / Renewal Identity

- Capability: Abando
- Business value: Unlocks recurring revenue and lifetime value tracking.
- Technical value: Completes the expansion tail with subscription and renewal
  identity.
- Dependencies: Customer success review, revenue authority, merchant lifecycle.
- Estimated size: M
- Risk: Medium
- Validation required: Subscription and renewal states exist without colliding
  with merchant or revenue truth.
- Rollback strategy: Keep Abando as a field-only tail and disable new identity
  writes.
- Definition of Done: Abando expansion has explicit subscription and renewal
  identity.
- Recommended commit scope: Abando identity and state closure only.

### I014 - Fiscal Persistence for Annual and Quarterly Planning

- Capability: Fiscal Planning
- Business value: Makes the annual and quarterly operating model persistent.
- Technical value: Removes the greenfield gap in annual/quarter truth.
- Dependencies: Fiscal operating model, executive planning, campaign model.
- Estimated size: L
- Risk: Medium
- Validation required: Annual and quarterly records are stored and read without
  breaking current planning surfaces.
- Rollback strategy: Preserve existing planning docs and ignore new stores if
  needed.
- Definition of Done: Annual goals and quarterly objectives have governed
  storage.
- Recommended commit scope: Fiscal store and minimal loader only.

### I015 - Validator Coverage for Spine Truth

- Capability: Runtime Validation
- Business value: Reduces authority drift and false claims.
- Technical value: Ensures key business paths are checked against source truth.
- Dependencies: Lead, campaign, payment, revenue, evidence, and dashboard paths.
- Estimated size: M
- Risk: Medium
- Validation required: Each validator reads from the source-of-record data it
  claims to protect.
- Rollback strategy: Disable new validators and keep existing ones.
- Definition of Done: The most important business spine paths have explicit
  validation coverage.
- Recommended commit scope: Validator map and a small set of high-value checks.

## Sprint 4

### I016 - Observability and Truth Reconciliation

- Capability: Observability
- Business value: Makes drift visible before it becomes a business error.
- Technical value: Reconciles loaders, snapshots, runtime files, and validators.
- Dependencies: Dashboard surfaces, runtime logs, validator coverage.
- Estimated size: M
- Risk: Medium
- Validation required: Observability surfaces reconcile to source truth and do
  not create duplicate authorities.
- Rollback strategy: Retain current logging/snapshot behavior if new observability
  regresses.
- Definition of Done: StaffordOS can explain what changed, what is true, and what
  is still blocked.
- Recommended commit scope: Reconciliation reports and source binding only.

### I017 - Self-Healing and Drift Repair Routing

- Capability: Self-Healing
- Business value: Reduces manual cleanup and repeated authority drift.
- Technical value: Automates safe detection and routing of routine repairs.
- Dependencies: Observability, validators, agent governance.
- Estimated size: L
- Risk: High
- Validation required: Repair suggestions stay bounded, reversible, and approval
  gated.
- Rollback strategy: Turn off repair routing and keep alerts only.
- Definition of Done: Safe drift repair suggestions exist without autonomous
  authority escalation.
- Recommended commit scope: Detection + suggestion routing only.

### I018 - Engineering Workflow Truth Binding

- Capability: Engineering Workflow
- Business value: Keeps product and operational engineering aligned to governed
  business truth.
- Technical value: Ties execution artifacts and approvals to source records.
- Dependencies: Validators, observability, packet/payment truth, founder queue.
- Estimated size: M
- Risk: Medium
- Validation required: Engineering tasks retain validated scope, provenance, and
  rollback references.
- Rollback strategy: Keep current execution paths and detach new truth bindings.
- Definition of Done: Engineering execution references governed business truth.
- Recommended commit scope: Workflow truth binding only.

### I019 - Reporting Separation of Estimate vs Actual

- Capability: Reporting
- Business value: Prevents revenue confusion and inflated business claims.
- Technical value: Enforces clear separation between estimate, merchant value,
  and captured revenue in reports.
- Dependencies: Money model, dashboard loaders, revenue authority.
- Estimated size: S
- Risk: Low-Medium
- Validation required: No report labels Pipeline Value or Merchant Value as
  Stafford Revenue.
- Rollback strategy: Preserve current reports and disable the new formatting.
- Definition of Done: Reporting always distinguishes estimate, merchant value,
  and captured revenue.
- Recommended commit scope: Report formatting and labels only.

## Top 10 Implementation Tasks

1. I001 - Stable Campaign Attribution on Leads
2. I002 - Canonical Campaign Registry
3. I003 - UTM Capture and Attribution Provenance
4. I004 - Stripe Payment Truth Propagation
5. I005 - Evidence and Proof Propagation
6. I006 - Campaign Spend Storage
7. I007 - Campaign Budget Storage
8. I008 - Campaign ROI Calculation
9. I009 - Founder Truth Binding
10. I014 - Fiscal Persistence for Annual and Quarterly Planning

## NEXT IMPLEMENTATION MISSION

I001 - Stable Campaign Attribution on Leads

Reason:

- Lowest-risk foundation for the campaign stack.
- Unblocks campaign registry, UTM capture, ROI, and downstream traceability.
- Aligns with the operational gap plan and the P4 capability certification.

## Sprint Summary

### Sprint 1

Foundation tasks that unlock attribution and payment truth:

- I001 Stable Campaign Attribution on Leads
- I002 Canonical Campaign Registry
- I003 UTM Capture and Attribution Provenance
- I004 Stripe Payment Truth Propagation
- I005 Evidence and Proof Propagation

### Sprint 2

Financial and executive truth tasks:

- I006 Campaign Spend Storage
- I007 Campaign Budget Storage
- I008 Campaign ROI Calculation
- I009 Founder Truth Binding
- I010 Campaign / Lead / Revenue Drill-Through

### Sprint 3

Commercial and planning completion tasks:

- I011 Proposal Identifier and Workflow Closure
- I012 Customer Success Review and Follow-Up Closure
- I013 Abando Subscription / Renewal Identity
- I014 Fiscal Persistence for Annual and Quarterly Planning
- I015 Validator Coverage for Spine Truth

### Sprint 4

Trust, resilience, and workflow hardening tasks:

- I016 Observability and Truth Reconciliation
- I017 Self-Healing and Drift Repair Routing
- I018 Engineering Workflow Truth Binding
- I019 Reporting Separation of Estimate vs Actual

## Implementation Guidance

- Start with the smallest campaign attribution change that does not disturb
  current lead registry behavior.
- Keep payment authority in the Stripe webhook path.
- Keep Stafford Revenue source of record in `client_registry_v1.json`.
- Keep Pipeline Value labeled as estimate.
- Keep Merchant Value separate from revenue.
- Do not build new dashboards before the underlying truth is bound.
- Do not treat any projection as a new authority.

## Certification

Recommendation: CONDITIONAL GO.

The backlog is ready for execution only if Sprint 1 is implemented in order and
validated before moving to spend, ROI, or new founder surfaces.
