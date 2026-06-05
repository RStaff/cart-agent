# Lifecycle Promotion Gap Register v1

## Gap 1. `revenue_active` is promoted from merchant recovery revenue

- Status: **PROVEN_UNAUTHORIZED**
- Evidence: `next_action_engine_v1.mjs` promotes `revenue_active` when `merchantRevenueRecovered > 0`.
- Why this is risky: Abando recovery truth can override the ShopiFixer lifecycle even when payment and fulfillment are not started.

## Gap 2. `fix_in_progress` is not written by the live next-action engine

- Status: **BROKEN**
- Evidence: the current `next_action_engine_v1.mjs` has no `fix_in_progress` promotion branch.
- Why this is risky: a paid merchant cannot enter the fulfillment lane through the current live engine.

## Gap 3. `fix_completed` is implemented without a proven fulfillment proof chain

- Status: **PARTIALLY_DEFINED**
- Evidence: the engine has a `fix_completed` branch, but there is no proven live fulfillment path through proof, QA, review, and referral.
- Why this is risky: after-state evidence can be implied without a proof package.

## Gap 4. `abando_installed` is mixed into the merchant lifecycle engine

- Status: **PARTIALLY_DEFINED**
- Evidence: the engine and operating model both carry Abando-specific states.
- Why this is risky: product-route state can leak into the canonical merchant lifecycle.

## Gap 5. `audit_requested` exists in implementation but not as a canonical stage

- Status: **PARTIALLY_DEFINED**
- Evidence: the engine promotes `audit_requested`, but the canonical lifecycle doc uses broader conversion phases.
- Why this is risky: intermediate states can become treated as canonical truth without a clear authority definition.

## Gap 6. `cart-agent-dev.myshopify.com` is promoted to `revenue_active` despite zero ShopiFixer payment

- Status: **PROVEN_UNAUTHORIZED**
- Evidence: current registry truth shows `payment_status = not_billable`, `stafford_revenue_earned = 0`, `shopifixer.fix_status = not_started`.
- Why this is risky: the record looks like merchant success while ShopiFixer has not been paid or fulfilled.

## Gap 7. Proof / review / referral remain missing from the live promoted record

- Status: **BROKEN**
- Evidence: no live ShopiFixer proof package or review/referral writeback exists for the merchant.
- Why this is risky: the lifecycle jumps to a success-looking state without the compounding evidence chain.
