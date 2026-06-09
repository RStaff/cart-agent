# ShopiFixer Fulfillment Truth Schema Draft

Purpose:
Create the canonical StaffordOS fulfillment truth object for one $950 ShopiFixer Fix Sprint.

Authority:
- staffordos/authority/output/shopifixer_fulfillment_authority_v1.md
- staffordos/authority/output/shopifixer_fulfillment_packet_template_v1.md
- staffordos/governance/shopifixer_fulfillment_truth_audit/shopifixer_fulfillment_truth_audit_v1.md

Core promise:
One focused Shopify friction issue is identified, scoped, fixed, documented, and proven with before/after evidence.

Canonical object fields:

Identity:
- fulfillment_id
- packet_id
- client_id
- store_domain
- merchant_name
- opportunity_ref
- delivery_unit_ref

Payment:
- payment_status
- payment_verified_source
- paid_at
- amount
- currency

Lifecycle:
- fulfillment_status
- execution_status
- proof_status
- completion_status
- client_approval_status
- review_status
- referral_status
- case_study_status

Intake:
- store_url
- affected_page_url
- observed_friction
- why_it_matters
- expected_improvement_category

Fix Scope:
- scoped_fix
- in_scope
- out_of_scope
- merchant_approval_needed

Before State:
- before_evidence_status
- before_screenshot
- before_notes
- risk_or_limitation

Execution:
- fix_started_at
- change_made
- location_changed
- implementation_notes
- fix_completed_at

After State:
- after_evidence_status
- after_screenshot
- after_notes
- remaining_limitations

Proof Package:
- proof_package_status
- proof_package_location
- merchant_facing_summary
- recommended_next_watch_item

Completion:
- scoped_issue_addressed
- before_evidence_captured
- after_evidence_captured
- merchant_proof_package_ready
- execution_complete
- proof_complete
- completion_complete
- completed_at

Growth:
- review_requested
- review_received
- referral_requested
- referral_received
- case_study_authorized

Source Trace:
- source_files
- unavailable_fields
- field_sources
- updated_at

First implementation should:
- read delivery_units_v1.json
- read client_registry_v1.json
- read unit_work_snapshot_v1.json
- create staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json
- mark unknown fields as unavailable
- not modify client, lead, revenue, checkout, Stripe, Abando, or lifecycle authority
