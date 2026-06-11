# ShopiFixer Live Path Verification Checklist

## Goal
Verify the full conversion flow from the public ShopiFixer offer and checkout through Stripe webhook, payment truth, fulfillment truth, merchant lifecycle registry refresh, command center workbench actions, proof package, completion, and the final completed state in the command center.

## 1. Preflight checks
- Confirm the operator frontend builds locally.
- Confirm the public ShopiFixer page renders the $950 Fix Sprint CTA.
- Confirm the proof-run workbench stages are present in `/operator/command-center`.
- Confirm the proof package and completion helpers exist.
- Confirm the target merchant has truth in the client/fulfillment path.

## 2. Required environment variables
- `NEXT_PUBLIC_ABANDO_API_BASE` or `NEXT_PUBLIC_ABANDO_BACKEND_ORIGIN`
- `STRIPE_LIVE_SECRET_KEY` or `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `CANONICAL_PAYMENT_RETURN_URL` or `CHECKOUT_SUCCESS_URL`
- `CHECKOUT_CANCEL_URL`
- `PRICE_SCALE` or `STRIPE_PRICE_SCALE` or `STRIPE_PRICE_SCALE_LIVE`

## 3. Required local/dev servers
- The service that serves `/__public-checkout`
- The service that receives Stripe webhook traffic
- `staffordos/ui/operator-frontend`

## 4. Stripe webhook verification
- Trigger a real `checkout.session.completed` event.
- Verify the webhook signature is accepted.
- Verify packet payment binding updates to `payment_received`.
- Verify `client_registry_v1.json` receives paid deal truth.
- Verify `revenue_truth_v1.json` records propagated payment truth.

## 5. Checkout trigger
- Open the public ShopiFixer page.
- Enter the target Shopify store domain.
- Click the `$950 Fix Sprint` CTA.
- Confirm the checkout session URL is returned.
- Confirm the Stripe Checkout page opens.

## 6. Expected files changed
- `staffordos/clients/client_registry_v1.json`
- `staffordos/revenue/revenue_truth_v1.json`
- `staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json`
- `staffordos/merchant_registry/merchant_lifecycle_registry_v1.json`
- `staffordos/merchant_registry/merchant_lifecycle_registry_v1.md`

## 7. Files that must not change
- Checkout route definitions
- Stripe account configuration
- Public pricing copy
- Merchant registry source inputs other than the generated read model
- Manual business truth outside the live payment and fulfillment flow

## 8. Command center checks
- Merchant is visible in the ShopiFixer panel.
- Lifecycle lane shows `payment_received` after verified payment.
- Current stage updates from `offer_sent` to `payment_received` or later.
- Next required action updates after payment.
- Proof workbench remains visible and bound to the active merchant.

## 9. Workbench action checks
- Capture Before Evidence writes only to `before_evidence.md`.
- Record Scoped Fix writes only to `fix_scope.md`.
- Capture After Evidence writes only to `after_evidence.md`.
- Generate Proof Package writes only to `merchant_proof_package.md`.
- Mark Completion updates only the active fulfillment item in fulfillment truth, then triggers the registry rebuild.

## 10. Completion checks
- Merchant proof package exists and is non-empty.
- Completion helper verifies the matched fulfillment item.
- Completion helper verifies payment status is `payment_received` or `paid`.
- Completion helper updates only the matched fulfillment item.
- Merchant lifecycle registry rebuild runs successfully after completion.
- Command center reflects the completed state on reload.

## 11. Rollback / recovery notes
- If completion fails, do not edit client registry or revenue truth manually.
- If a proof artifact is malformed, regenerate it from the previous stage artifact.
- If the webhook fails, replay the Stripe event only after signature and packet binding are confirmed.
- If the lifecycle registry is stale, rerun the merchant lifecycle builder from fulfillment truth.

## 12. Final pass/fail criteria
Pass means:
- public offer and checkout work end to end
- Stripe webhook records payment and updates truth
- fulfillment truth reaches `payment_received`
- merchant lifecycle registry refreshes successfully
- command center shows the paid and active fulfillment state
- all proof workbench stages complete successfully
- completion writes back governed fulfillment truth and refreshes the registry
- command center shows the completed state after refresh

Fail means:
- any step requires manual file editing
- any step requires direct mutation of client registry or revenue truth outside the live flow
- completion cannot update fulfillment truth and refresh the registry
- command center does not reflect the completed state after completion
