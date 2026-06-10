# Merchant Registry Field Lineage v1

Verdict: YES

The missing ShopiFixer panel fields can be sourced from existing truth and materialized into `merchant_lifecycle_registry_v1.json`.

## Investigated fields

### `audit.score`
- Classification: `source_available`
- Source: `staffordos/audit/audit_result_surface.json#audit_score`
- Materialization: copy directly into the merchant lifecycle record

### `audit.top_issue`
- Classification: `source_available`
- Source: `staffordos/audit/audit_result_surface.json#top_issue`
- Materialization: copy directly into the merchant lifecycle record

### `audit.recommendation`
- Classification: `source_available`
- Source: `staffordos/audit/audit_result_surface.json#fix_recommendation`
- Materialization: copy directly into the merchant lifecycle record

### `offer.send_allowed`
- Classification: `source_available`
- Source: `staffordos/shopifixer/shopifixer_send_authority_v1.json#send_allowed`
- Materialization: copy directly into the merchant lifecycle record

### `payment.readiness`
- Classification: `derivable`
- Source: `staffordos/shopifixer/shopifixer_runtime_payment_verification_v1.json#final_verdict`
- Materialization: derive from `READY_FOR_REAL_PAYMENT`

### `fulfillment.execution_status`
- Classification: `source_available`
- Source: `staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json#items[0].execution_status`
- Materialization: copy directly into the merchant lifecycle record

## Verdict on replacement

Yes. From a field-lineage perspective, the merchant lifecycle registry can fully replace `shopifixer_command_center_v1.json` once these fields are materialized.

The basis is straightforward:

- the registry already has the merchant identity and core lifecycle fields
- every missing ShopiFixer panel field has either a direct source or a verified derivation path
- no new truth source is required

## Verified materialization paths

- `audit.score` -> `staffordos/audit/audit_result_surface.json#audit_score`
- `audit.top_issue` -> `staffordos/audit/audit_result_surface.json#top_issue`
- `audit.recommendation` -> `staffordos/audit/audit_result_surface.json#fix_recommendation`
- `offer.send_allowed` -> `staffordos/shopifixer/shopifixer_send_authority_v1.json#send_allowed`
- `payment.readiness` -> `staffordos/shopifixer/shopifixer_runtime_payment_verification_v1.json#final_verdict`
- `fulfillment.execution_status` -> `staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json#items[0].execution_status`

## Lineage classification

- Source available: `audit.score`, `audit.top_issue`, `audit.recommendation`, `offer.send_allowed`, `fulfillment.execution_status`
- Derivable: `payment.readiness`
- Unavailable: none
