# Merchant Lifecycle Registry

Generated: 2026-06-10T13:36:35.662Z

## Summary

- Records: 5
- Lead-linked records: 4
- Opportunity-linked records: 1
- Delivery-linked records: 1

## ShopiFixer Panel Fields

- audit.score
- audit.top_issue
- audit.recommendation
- offer.send_allowed
- payment.readiness
- fulfillment.execution_status
- fulfillment.proof_status

## Records

| Merchant | Current stage | Next action | Readiness | Lead | Opportunity | Delivery | Action |
| --- | --- | --- | ---: | --- | --- | --- | --- |
| cart-agent-dev.myshopify.com | offer_sent | Collect a verified Stripe payment for the authorized $950 Fix Sprint. | 93 | unavailable | opp_cart-agent-dev.myshopify.com | delivery_cart-agent-dev.myshopify.com_shopifixer | action_cart-agent-dev.myshopify.com_followup_offer |
| fitgearpro.myshopify.com | engaged | Qualify reply and prepare offer | 25 | lead_fitgearpro_myshopify_com | unavailable | unavailable | unavailable |
| homegoodsco.myshopify.com | engaged | Qualify reply and prepare offer | 25 | lead_homegoodsco_myshopify_com | unavailable | unavailable | unavailable |
| step5-test-store.myshopify.com | followup_sent | Wait for reply or track next click | 35 | lead_step5_test_store_myshopify_com | unavailable | unavailable | unavailable |
| store1.myshopify.com | engaged | Qualify reply and prepare offer | 25 | lead_store1_myshopify_com | unavailable | unavailable | unavailable |

## Unavailable Fields

### cart-agent-dev.myshopify.com
- lead_id: No matching lead could be proven for this merchant.
- lead_status: No lead row exists for this merchant.
- payment_amount: No payment is verified yet.
- payment_received_at: No verified payment receipt timestamp exists yet.

### fitgearpro.myshopify.com
- opportunity_id: No matching opportunity unit could be proven for this merchant.
- delivery_id: No matching delivery unit could be proven for this merchant.
- action_id: No matching action unit could be proven for this merchant.
- audit.score: No ShopiFixer audit score is available for this merchant.
- audit.top_issue: No ShopiFixer audit issue statement is available for this merchant.
- audit.recommendation: No ShopiFixer audit recommendation is available for this merchant.
- offer.send_allowed: No ShopiFixer send authority is available for this merchant.
- payment.readiness: No runtime payment readiness verdict is available for this merchant.
- fulfillment.execution_status: No fulfillment execution status is available for this merchant.
- fulfillment.proof_status: No fulfillment proof status is available for this merchant.
- payment_amount: No payment is verified yet.
- payment_received_at: No verified payment receipt timestamp exists yet.

### homegoodsco.myshopify.com
- opportunity_id: No matching opportunity unit could be proven for this merchant.
- delivery_id: No matching delivery unit could be proven for this merchant.
- action_id: No matching action unit could be proven for this merchant.
- audit.score: No ShopiFixer audit score is available for this merchant.
- audit.top_issue: No ShopiFixer audit issue statement is available for this merchant.
- audit.recommendation: No ShopiFixer audit recommendation is available for this merchant.
- offer.send_allowed: No ShopiFixer send authority is available for this merchant.
- payment.readiness: No runtime payment readiness verdict is available for this merchant.
- fulfillment.execution_status: No fulfillment execution status is available for this merchant.
- fulfillment.proof_status: No fulfillment proof status is available for this merchant.
- payment_amount: No payment is verified yet.
- payment_received_at: No verified payment receipt timestamp exists yet.

### step5-test-store.myshopify.com
- opportunity_id: No matching opportunity unit could be proven for this merchant.
- delivery_id: No matching delivery unit could be proven for this merchant.
- action_id: No matching action unit could be proven for this merchant.
- audit.score: No ShopiFixer audit score is available for this merchant.
- audit.top_issue: No ShopiFixer audit issue statement is available for this merchant.
- audit.recommendation: No ShopiFixer audit recommendation is available for this merchant.
- offer.send_allowed: No ShopiFixer send authority is available for this merchant.
- payment.readiness: No runtime payment readiness verdict is available for this merchant.
- fulfillment.execution_status: No fulfillment execution status is available for this merchant.
- fulfillment.proof_status: No fulfillment proof status is available for this merchant.
- payment_amount: No payment is verified yet.
- payment_received_at: No verified payment receipt timestamp exists yet.

### store1.myshopify.com
- opportunity_id: No matching opportunity unit could be proven for this merchant.
- delivery_id: No matching delivery unit could be proven for this merchant.
- action_id: No matching action unit could be proven for this merchant.
- audit.score: No ShopiFixer audit score is available for this merchant.
- audit.top_issue: No ShopiFixer audit issue statement is available for this merchant.
- audit.recommendation: No ShopiFixer audit recommendation is available for this merchant.
- offer.send_allowed: No ShopiFixer send authority is available for this merchant.
- payment.readiness: No runtime payment readiness verdict is available for this merchant.
- fulfillment.execution_status: No fulfillment execution status is available for this merchant.
- fulfillment.proof_status: No fulfillment proof status is available for this merchant.
- payment_amount: No payment is verified yet.
- payment_received_at: No verified payment receipt timestamp exists yet.

## Source Files

- `staffordos/clients/client_registry_v1.json`
- `staffordos/leads/lead_registry_v1.json`
- `staffordos/units/opportunity_units_v1.json`
- `staffordos/units/delivery_units_v1.json`
- `staffordos/units/action_units_v1.json`
- `staffordos/revenue/revenue_truth_v1.json`
- `staffordos/audit/audit_result_surface.json`
- `staffordos/shopifixer/shopifixer_send_authority_v1.json`
- `staffordos/shopifixer/shopifixer_runtime_payment_verification_v1.json`
- `staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json`
- `staffordos/shopifixer/shopifixer_command_center_v1.json`

