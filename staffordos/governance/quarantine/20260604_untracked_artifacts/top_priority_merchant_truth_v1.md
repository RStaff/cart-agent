# Top Priority Merchant Truth v1

Repository truth used:

- `staffordos/clients/operator_dashboard_snapshot_v1.json`
- `staffordos/clients/client_registry_v1.json`
- `staffordos/leads/lead_registry_v1.json`
- `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts`
- `staffordos/ui/operator-frontend/lib/operator/loadPrimaryActionSnapshot.ts`
- `staffordos/ui/operator-frontend/app/operator/revenue-command/page.tsx`

## 1. Merchant

`cart-agent-dev.myshopify.com`

## 2. Current lifecycle stage

`proposal_sent`

Evidence:

- `staffordos/clients/client_registry_v1.json`
  - `lifecycle.stage = "proposal_sent"`
  - `next_action.instructions = "Follow up on real ShopiFixer offer and close payment."`
- `staffordos/clients/operator_dashboard_snapshot_v1.json`
  - `priority_clients[0].lifecycle_stage = "proposal_sent"`
  - `primary_focus.client_id = "cart-agent-dev.myshopify.com"`

Note:

- `decision_trace.lifecycle_stage = "revenue_active"` appears in the client registry as an internal engine evaluation.
- The current commercial target shown in runtime truth is still the `proposal_sent` client record with a follow-up-to-close-payment action.

## 3. Product route

`ShopiFixer`

Evidence:

- `staffordos/clients/client_registry_v1.json`
  - `selected_product = "shopifixer"`
  - `routing_reason = "Shopify conversion, checkout, audit, or dev issue"`
- `staffordos/clients/operator_dashboard_snapshot_v1.json`
  - `primary_focus.action = "Convert recovered merchant value into paid plan or case-study close."`
  - `next_action.instructions = "Follow up on real ShopiFixer offer and close payment."`

## 4. Why this merchant is highest priority

This is the only merchant in current dashboard truth with a non-zero recovered merchant value and a non-zero revenue gap, and it is ranked first by priority score.

Evidence:

- `staffordos/clients/operator_dashboard_snapshot_v1.json`
  - `primary_focus.reason = "Merchant value has been proven but Stafford revenue has not been captured."`
  - `primary_focus.priority_total = 83`
  - `revenue_gaps[0].gap = 100`
  - `top_metrics.total_merchant_revenue_recovered = 100`
  - `top_metrics.total_stafford_revenue = 0`
- `staffordos/clients/client_registry_v1.json`
  - `abando.merchant_revenue_recovered = 100`
  - `business.stafford_revenue_earned = 0`
  - `priority_score.total = 83`

## 5. What action is required next

`Follow up on real ShopiFixer offer and close payment.`

Evidence:

- `staffordos/clients/client_registry_v1.json`
  - `next_action.instructions = "Follow up on real ShopiFixer offer and close payment."`
  - `next_action.owner = "ross"`
- `staffordos/clients/operator_dashboard_snapshot_v1.json`
  - same next action appears in `primary_focus.next_action.instructions`
- `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts`
  - the next-best-action path selects the highest-priority revenue gap merchant and surfaces that action to the Command Center

## 6. What proof is missing

Missing proof is the closed commercial payment proof for Stafford revenue.

What is present:

- merchant value recovered: `100`
- ShopiFixer offer sent
- proof client exists

What is missing:

- Stafford revenue captured on this merchant
- verified paid conversion
- `payment_received` / paid-close proof in the commercial loop

Evidence:

- `staffordos/clients/client_registry_v1.json`
  - `deal.payment_status = "not_billable"`
  - `business.stafford_revenue_earned = 0`
- `staffordos/clients/operator_dashboard_snapshot_v1.json`
  - `stafford_revenue = 0`
  - `merchant_revenue_recovered = 100`
  - `gap = 100`

## 7. What event would close the loop

The closing event is a verified payment event that marks the ShopiFixer offer as paid and moves the merchant from proposal/follow-up into payment receipt.

Most direct runtime closure:

- a verified `checkout.session.completed` Stripe webhook event
- resulting packet/payment state update to `payment_received`
- Stafford revenue recorded on the client record

Why this is the loop-closing event:

- the merchant already has proof of recovered value
- the current action is explicitly to close payment
- the remaining gap is commercial capture, not discovery

## Summary

Current top-priority merchant: `cart-agent-dev.myshopify.com`

Current lifecycle stage: `proposal_sent`

Product route: `ShopiFixer`

Why top priority: highest priority score, only non-zero revenue gap, and proven merchant value with zero Stafford revenue captured

Next action: follow up and close payment

Missing proof: verified paid conversion / Stafford revenue capture

Loop-closing event: signed Stripe payment completion leading to `payment_received`
