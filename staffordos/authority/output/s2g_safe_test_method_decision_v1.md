# S2G SAFE TEST METHOD DECISION V1

## Current Evidence

Stripe CLI is available:
stripe version 1.31.0

Canonical checkout endpoint creates live Checkout Sessions:
cs_live_...

Fresh packet created:
packet_no-kings-athletics-myshopify-com_c428c9ec22

Fresh packet status:
payment_pending

## Critical Constraint

Because the current checkout endpoint uses live Stripe keys and creates `cs_live_` sessions, S2G must not attempt to complete this session unless real live payment validation is explicitly authorized.

## Safe S2G Requirement

Use a Stripe-signed event that does not require a real merchant payment.

Potential paths:

1. Stripe Dashboard "Send test event" to the live webhook endpoint.
2. Stripe CLI trigger/listen workflow if it can target the deployed endpoint with correct signing.
3. Temporary controlled test-mode endpoint/config only if separately authorized.

## Not Allowed

- Do not pay the live Checkout Session.
- Do not mark packet paid manually.
- Do not use payment-return as payment proof.
- Do not fabricate webhook signatures.
- Do not run merchant execution.

## S2G Status

Ready to choose signed-event validation method.
