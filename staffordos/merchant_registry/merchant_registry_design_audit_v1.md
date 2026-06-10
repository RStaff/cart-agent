# Merchant Registry Design Audit

## Verified Finding

StaffordOS does **not** currently have one canonical merchant truth object capable of carrying a merchant cleanly through:

Lead -> Audit -> Offer -> Payment -> Fulfillment -> Proof Package -> Revenue -> Case Study

The system has strong partial truths, but they are split across multiple registries and read models.

## Current Inventory

### Leads

- `staffordos/leads/lead_registry_v1.json`
- `staffordos/leads/lead_state_machine_v1.json`
- `staffordos/leads/lead_events_v1.json`

### Opportunities

- `staffordos/units/opportunity_units_v1.json`

### Deliveries

- `staffordos/units/delivery_units_v1.json`
- `staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json`

### Actions

- `staffordos/units/action_units_v1.json`

### Outcomes

- `staffordos/events/outcome_event_log_v1.json`
- `staffordos/events/outcome_scores_v1.json`
- `staffordos/events/operator_action_events_v1.json`
- `staffordos/leads/outcomes.json`

### Revenue

- `staffordos/revenue/revenue_truth_v1.json`
- `staffordos/revenue/revenue_agent_v1.mjs`
- `web/src/routes/stripeWebhook.esm.js`
- `web/src/checkout-public.js`
- `web/src/routes/packetAuthority.esm.js`
- `web/src/lib/packetRepository.js`

### ShopiFixer

- `staffordos/audit/audit_result_surface.json`
- `staffordos/shopifixer/shopifixer_conversion_brief_v1.json`
- `staffordos/clients/shopifixer_offer_latest.json`
- `staffordos/shopifixer/shopifixer_send_authority_v1.json`
- `staffordos/shopifixer/shopifixer_offer_outcome_authority_v1.json`
- `staffordos/shopifixer/shopifixer_runtime_payment_verification_v1.json`
- `staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json`
- `staffordos/shopifixer/shopifixer_command_center_v1.json`

## Canonical Merchant Object

There is no verified canonical merchant object today.

The closest existing object is `staffordos/clients/client_registry_v1.json`, but it is still only a client registry, not a full merchant lifecycle object.

The main competing artifact is `staffordos/commercial/merchant_registry_v1.json`, but it is a stale seeded commercial mapping file, not live canonical truth.

## Current Maturity

`41/100`

The score is low because the system has:

- lead truth
- client truth
- opportunity truth
- delivery truth
- revenue truth
- ShopiFixer authorities

but does not yet unify them into one merchant object for runtime use.

## Exact Blocker To Operational Revenue

There is no single merchant record that can carry the same merchant identity and stage across:

- lead qualification
- audit
- offer generation
- payment verification
- fulfillment start
- proof package completion
- revenue attribution
- case-study/referral readiness

That means the operator still has to reconcile multiple artifacts to understand one merchant's true state.

## Duplicate Or Competing Truth Sources

- `staffordos/commercial/merchant_registry_v1.json` is a stale seed.
- `staffordos/revenue/revenue_truth_v1.json` is partial/legacy support.
- `staffordos/clients/operator_dashboard_snapshot_v1.json` is a derived summary, not the merchant object itself.

## Minimum Viable Canonical Merchant Schema

The canonical merchant object needs fields for:

- identity: `merchant_id`, `client_id`, `merchant_shop`, `store_domain`, `lead_id`, `opportunity_id`
- lifecycle: `lead_status`, `audit_status`, `offer_status`, `payment_status`, `fulfillment_status`, `proof_package_status`, `revenue_status`, `case_study_status`
- proof and delivery: `execution_status`, `proof_status`, `completion_status`, `before_evidence_status`, `after_evidence_status`
- business results: `payment_amount`, `payment_currency`, `lifetime_value`, `review_status`, `referral_status`
- operator visibility: `current_stage`, `next_required_action`, `readiness_score`, `source_files`, `field_sources`

## Consumers That Need The Canonical Merchant Object

- Lead Command
- Revenue Command
- Command Center
- Capacity Board
- ShopiFixer lifecycle
- Execution Log

## Recommended Next Implementation

Promote `client_registry_v1.json` into the canonical merchant lifecycle anchor, then materialize a single merchant registry read model from the existing lead, opportunity, delivery, action, revenue, and ShopiFixer sources.

Do not create a second merchant registry that competes with live truth.
