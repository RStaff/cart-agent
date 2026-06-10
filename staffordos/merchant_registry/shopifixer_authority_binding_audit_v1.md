# ShopiFixer Authority Binding Audit v1

Verdict: NO

The ShopiFixer Command Center cannot yet switch its primary read authority from `staffordos/shopifixer/shopifixer_command_center_v1.json` to `staffordos/merchant_registry/merchant_lifecycle_registry_v1.json` without losing fields that the current panel renders.

## What the panel currently renders

The existing `OperatorHomeV1` ShopiFixer panel renders:

- `merchant.store`
- `merchant.client_id`
- `audit.score`
- `audit.top_issue`
- `audit.recommendation`
- `offer.offer_status`
- `offer.offer_price`
- `offer.send_allowed`
- `payment.payment_status`
- `payment.readiness`
- `fulfillment.fulfillment_status`
- `fulfillment.execution_status`
- `fulfillment.proof_status`
- `overall.current_stage`
- `overall.next_required_action`
- `overall.readiness_score`

## What the candidate registry already has

`merchant_lifecycle_registry_v1.json` already carries:

- `client_id`
- `merchant_shop`
- `store_domain`
- `offer_status`
- `offer_price`
- `payment_status`
- `fulfillment_status`
- `current_stage`
- `next_required_action`
- `readiness_score`

## What is still missing

The candidate registry does not yet expose the following fields the panel depends on:

- `audit.score`
- `audit.top_issue`
- `audit.recommendation`
- `offer.send_allowed`
- `payment.readiness`
- `fulfillment.execution_status`

Two rendered fields are only mappable, not present in the same shape:

- `merchant.store` can be mapped from `merchant_shop` or `store_domain`
- `fulfillment.proof_status` can be mapped from `proof_package_status`

## Conclusion

The lifecycle registry is a strong merchant lifecycle read model, but it is not yet a drop-in replacement for the specialized ShopiFixer command-center read model.

The smallest remaining repair is to extend the lifecycle registry with the missing ShopiFixer panel fields, or keep `shopifixer_command_center_v1.json` as the ShopiFixer-specific read authority until that extension exists.
