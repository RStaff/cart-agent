# Client Registry Promotion Audit

## Verdict

`NO`

`staffordos/clients/client_registry_v1.json` cannot safely become the canonical merchant lifecycle authority yet.

## Why Not

The client registry is real and useful, but it is still only one layer in a split truth model.

It already contains:

- `client_id`
- `merchant_shop`
- `contact.email`
- `deal.*`
- `shopifixer.*`
- `abando.*`
- `business.*`
- `lifecycle.*`
- `next_action.*`
- `notes`
- `decision_trace`
- `priority_score`
- `blocker_detection`
- `close_engine`

It is still missing first-class merchant lifecycle references for:

- `lead_id`
- `opportunity_id`
- `delivery_id`
- `action_id`
- `offer_status`
- `payment_received_at`
- `fulfillment_status`
- `proof_package_status`
- `review_status`
- `referral_status`
- `case_study_status`
- `current_stage`
- `next_required_action`
- `readiness_score`

## Conflicting And Duplicate Ownership

- Merchant identity is split across lead registry, client registry, opportunity units, delivery units, and the stale commercial merchant registry.
- ShopiFixer lifecycle is already split across the client registry, offer outcome authority, fulfillment truth, and command center read model.
- Revenue truth still exists separately from merchant-level payment truth.

## Exact Blocker

There is no single merchant record that can trace one merchant from lead to audit to offer to payment to fulfillment to proof package to revenue to case study.

## Smallest Viable Authority Object

The smallest viable authority object is a **canonical merchant lifecycle object** anchored on `client_registry_v1.json`, but only after it gains:

- merchant identity linkage to lead/opportunity/delivery/action ids
- lifecycle fields for offer, payment, fulfillment, proof, review, referral, and case study
- explicit current stage and next required action
- readiness score
- source tracing fields

## Conclusion

Do not promote the current `client_registry_v1.json` as-is.

Promote the client registry only after the merchant lifecycle fields above are added and the split truth layers are consolidated behind one merchant object.
