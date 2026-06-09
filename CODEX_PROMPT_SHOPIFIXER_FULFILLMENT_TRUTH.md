You are working in:

/Users/rossstafford/projects/cart-agent

MISSION

Create the canonical ShopiFixer Fulfillment Truth read model.

This is NOT a UI task.

AUTHORITY

Use:
- SHOPIFIXER_FULFILLMENT_SCHEMA_DRAFT.md
- staffordos/authority/output/shopifixer_fulfillment_authority_v1.md
- staffordos/authority/output/shopifixer_fulfillment_packet_template_v1.md
- staffordos/governance/shopifixer_fulfillment_truth_audit/shopifixer_fulfillment_truth_audit_v1.md

OBJECTIVE

Create the first canonical fulfillment truth source for ShopiFixer so StaffordOS can track:

payment
→ fix scope
→ before evidence
→ execution
→ after evidence
→ proof package
→ completion
→ review/referral/case study readiness

CREATE ONLY:

- staffordos/fulfillment/build_shopifixer_fulfillment_truth_v1.mjs
- staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json

READ FROM:

- staffordos/units/delivery_units_v1.json
- staffordos/clients/client_registry_v1.json
- staffordos/snapshots/unit_work_snapshot_v1.json

DO NOT MODIFY:

- client_registry_v1.json
- lead_registry_v1.json
- revenue_truth_v1.json
- checkout
- Stripe
- Abando
- ShopiFixer public UI
- lifecycle authority
- CEO cockpit

RULES

- Do not invent business outcomes.
- Mark unknown fields as unavailable.
- Preserve source_files and field_sources.
- Treat existing delivery unit status as source truth.
- Treat client registry payment/audit/fix values as source truth.
- Produce summary counts for:
  - waiting_for_payment
  - paid
  - in_progress
  - awaiting_proof
  - awaiting_client_approval
  - completed
  - case_study_candidate
  - referral_candidate

VALIDATION

Run:

node staffordos/fulfillment/build_shopifixer_fulfillment_truth_v1.mjs

jq . staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json >/dev/null

git diff --stat

git status --short

FINAL RESPONSE

Report:
- files created
- source inputs used
- fulfillment items created
- unavailable fields
- business truth untouched
- do not commit
