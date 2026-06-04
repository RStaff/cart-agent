# Integration Gap Register v1

## Top Integration Gaps

1. Packet-to-client propagation gap
   - Webhook payment state stops at packet JSON mutation.
   - Client registry, revenue truth, dashboard snapshot, and CEO cockpit do not receive a verified payment event directly.

2. Primary merchant routing gap
   - `cart-agent-dev.myshopify.com` is the primary focus, but the runtime client record still lacks a clean `selected_product`.

3. Proof propagation gap
   - The repo has proof and fulfillment authority, but not a verified paid packet that produces the full proof package chain.

4. CEO cockpit visibility gap
   - The cockpit reads summaries and send-ledger proof status, but not packet truth directly.

5. Revenue truth fragmentation gap
   - Revenue remains zero in the runtime truth surfaces even though payment and routing authority exist.

6. Template-like packet gap
   - Existing packet files include planning and template artifacts that are not merchant-payment bound.

## Risk Summary

- If ignored, the merchant loop can look complete while payment, fulfillment, and proof remain unverified.
- If deleted, the repo loses the only structured evidence trail for the business core loop.

## Authority Conflicts Observed

- CEO snapshot proof source is indirect relative to the canonical proof package authority.
- Client registry payment and proof fields are not automatically synchronized from Stripe webhook truth.
- Operator dashboard summary logic is not the same thing as packet/payment authority.
- Manual payment agreement artifacts are not the same thing as live Stripe truth.

## CEO Cockpit Blind Spots

- No direct packet payment status.
- No direct verified Stripe event status.
- No merchant-facing proof package state.
- No execution / QA completion state.
- No review / referral state.
- No clean revenue-captured state tied to the primary merchant.

## Safety Conclusion

Implementation is not safe for new product work yet. The payment -> execution -> proof chain is still missing a verified end-to-end merchant loop.
