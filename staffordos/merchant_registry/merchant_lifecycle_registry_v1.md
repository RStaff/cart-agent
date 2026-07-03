# Merchant Lifecycle Registry

Generated: 2026-07-03T04:16:23.842Z

## Summary

- Records: 6
- Lead-linked records: 4
- Opportunity-linked records: 1
- Delivery-linked records: 1
- Active merchant: cart-agent-dev.myshopify.com

## ShopiFixer Panel Fields

- audit.score
- audit.top_issue
- audit.recommendation
- offer.send_allowed
- payment.readiness
- fulfillment.execution_status
- fulfillment.proof_status
- lifecycle_lane.audit_complete
- lifecycle_lane.conversion_brief_generated
- lifecycle_lane.offer_sent
- lifecycle_lane.payment_received
- lifecycle_lane.fulfillment_started
- lifecycle_lane.proof_complete
- lifecycle_lane.completed

## Records

| Merchant | Current stage | Next action | Readiness | Lead | Opportunity | Delivery | Action |
| --- | --- | --- | ---: | --- | --- | --- | --- |
| cart-agent-dev.myshopify.com | offer_sent | Collect a verified Stripe payment for the authorized $950 Fix Sprint. | 93 | unavailable | opp_cart-agent-dev.myshopify.com | delivery_cart-agent-dev.myshopify.com_shopifixer | action_cart-agent-dev.myshopify.com_followup_offer |
| elkeyecoffee.com | lead | Send first ShopiFixer audit outreach message. | 21 | unavailable | unavailable | unavailable | unavailable |
| fitgearpro.myshopify.com | lead | Send first ShopiFixer audit outreach message. | 21 | lead_fitgearpro_myshopify_com | unavailable | unavailable | unavailable |
| homegoodsco.myshopify.com | lead | Send first ShopiFixer audit outreach message. | 21 | lead_homegoodsco_myshopify_com | unavailable | unavailable | unavailable |
| step5-test-store.myshopify.com | lead | Prepare the ShopiFixer audit path and next merchant follow-up. | 15 | lead_step5_test_store_myshopify_com | unavailable | unavailable | unavailable |
| store1.myshopify.com | lead | Prepare the ShopiFixer audit path and next merchant follow-up. | 15 | lead_store1_myshopify_com | unavailable | unavailable | unavailable |

## Unavailable Fields

### cart-agent-dev.myshopify.com
- lead_id: No matching lead could be proven for this merchant.
- lead_status: No lead row exists for this merchant.
- payment_amount: No payment is verified yet.
- payment_received_at: No verified payment receipt timestamp exists yet.

### elkeyecoffee.com
- lead_id: No matching lead could be proven for this merchant.
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

