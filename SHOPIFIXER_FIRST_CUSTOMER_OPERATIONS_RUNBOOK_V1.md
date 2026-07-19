# SHOPIFIXER_FIRST_CUSTOMER_OPERATIONS_RUNBOOK_V1

## 1. Executive Summary

### Purpose
This runbook defines the operational procedure for processing the first real paying ShopiFixer customer in production.

### Scope
This document covers the live customer path from first visit through payment, packet creation, continuity rendering, and delivery confirmation.

### Operator Responsibilities
- Verify production endpoints before opening the offer to a customer.
- Confirm the checkout path creates a packet and records payment authority.
- Confirm the continuity page renders the paid packet correctly.
- Capture evidence for each step.
- Escalate any failure that prevents a paid customer from seeing a valid continuity state.

### Success Criteria
- Customer reaches the ShopiFixer offer and pricing pages.
- Customer completes checkout successfully.
- Packet authority records the purchase with `status=payment_received`.
- `/payment-return` redirects to `/fix-status`.
- `/fix-status` renders the paid continuity state:
  - `Intake pending`
  - `Your fix request is open.`
  - Store domain
  - `Review: Payment received`
- Customer receives confirmation and the evidence package is preserved.

### Escalation Criteria
Escalate immediately if any of the following occur:
- Checkout cannot be created.
- Stripe reports payment success but packet authority does not show `payment_received`.
- `/payment-return` fails or returns the wrong route.
- `/fix-status` shows `Request unavailable` or `We need to link your request.`
- Webhook processing fails or packet state regresses.

## 2. Pre-Sale Checklist

Before taking a live customer, verify all production surfaces.

### Website Reachability
Verify:
- `https://www.staffordmedia.ai/shopifixer`
- `https://www.staffordmedia.ai/pricing`

Check:
- Page loads with HTTP 200.
- ShopiFixer content is visible.
- No 404 or redirect to an unrelated page.

Suggested commands:
```bash
curl -i https://www.staffordmedia.ai/shopifixer
curl -i "https://www.staffordmedia.ai/pricing?store=<REDACTED_CUSTOMER_DOMAIN>"
```

### Checkout Service Health
Verify:
- `https://pay.abando.ai/__public-checkout/_status`

Check:
- Service returns healthy status.
- Checkout path is available for packet creation.

Suggested command:
```bash
curl -i https://pay.abando.ai/__public-checkout/_status
```

### Packet Authority Health
Verify:
- `https://pay.abando.ai/api/packets/{packet_id}` for a known packet after a test checkout or the verified packet during operations.

Check:
- Packet authority responds.
- Packet state is readable.

Suggested command:
```bash
curl -sS "https://pay.abando.ai/api/packets/<REDACTED_PACKET_ID>" | jq
```

## 3. Purchase Checklist

Capture these fields at checkout time:
- Customer name
- Store domain
- Timestamp
- Stripe session id
- Payment reference

Verify:
- Payment is completed in Stripe.
- Payment reference is recorded in packet authority.

Operational record to capture:
- Customer name: from the checkout form or invoice contact
- Store domain: the merchant domain used in checkout
- Timestamp: checkout completion timestamp in UTC
- Stripe session id: returned by checkout flow
- Payment reference: packet `payment_reference`

Verification steps:
1. Complete checkout.
2. Confirm Stripe marks the session as paid.
3. Confirm packet authority records the payment reference.

## 4. Packet Authority Validation

After payment, verify the packet record immediately.

### Required checks
- Packet exists
- `packet_id` exists
- `reservation_id` exists
- `status=payment_received`

### Evidence capture
Record:
- `packet_id`
- `reservation_id`
- `store_domain`
- `payment_reference`
- `status`
- `created_at`
- `updated_at`

Suggested command:
```bash
curl -sS "https://pay.abando.ai/api/packets/<REDACTED_PACKET_ID>" | jq
```

Expected status:
- `payment_received`

## 5. Continuity Page Validation

Open:
- `https://www.staffordmedia.ai/fix-status?packet_id=<REDACTED_PACKET_ID>&session_id=<REDACTED_CHECKOUT_SESSION>&store=<REDACTED_CUSTOMER_DOMAIN>&reservation_id=<REDACTED_RESERVATION_ID>`

Verify the page displays:
- `Intake pending`
- `Your fix request is open.`
- Store domain: `<REDACTED_CUSTOMER_DOMAIN>`
- `Review: Payment received`

Capture:
- Screenshot
- URL
- Timestamp

If the page shows `Request unavailable` or `We need to link your request.`, stop and escalate.

## 6. Delivery Checklist

After the continuity page renders correctly:
- Confirm the audit or delivery action is recorded.
- Confirm the customer receives the post-payment confirmation.
- Record the completion timestamp in UTC.

Operational evidence should include:
- checkout completion
- webhook processing
- payment-return redirect
- continuity page render
- customer notification

## 7. Incident Response Playbook

### A. Payment completed but packet missing
Symptoms:
- Stripe shows paid
- Packet API returns no matching packet

Diagnosis:
- Checkout created payment outside packet authority linkage

Verification:
- Check Stripe session id
- Check packet creation logs

Escalation:
- Stop the customer flow
- Preserve Stripe and packet evidence

Recovery:
- Reconcile the payment reference to packet authority before proceeding

### B. Packet exists but status != payment_received
Symptoms:
- Packet exists
- Packet status is not paid

Diagnosis:
- Webhook did not finalize packet state or regressed

Verification:
- Query the packet by `packet_id`
- Check webhook logs

Escalation:
- Stop the flow
- Preserve packet and webhook evidence

Recovery:
- Restore packet authority before continuing any merchant continuity step

### C. payment-return redirect failure
Symptoms:
- Payment succeeds
- Customer does not land on `/fix-status`

Diagnosis:
- Return route failed or redirected to the wrong location

Verification:
- Inspect `/payment-return` response headers
- Confirm `Location` header points to `/fix-status`

Escalation:
- Treat as a production continuity incident

Recovery:
- Fix the redirect target before taking another customer

### D. Continuity page shows Request unavailable
Symptoms:
- Continuity page loads
- Copy shows `Request unavailable`
- Or `We need to link your request.`

Diagnosis:
- Packet continuity context did not hydrate correctly

Verification:
- Confirm `packet_id`, `session_id`, `store`, and `reservation_id`
- Confirm packet API returns `payment_received`

Escalation:
- Stop the customer experience

Recovery:
- Restore continuity hydration before resuming sales

### E. Webhook failure
Symptoms:
- Stripe shows paid
- Packet status does not advance

Diagnosis:
- Webhook delivery, signature verification, or packet update failed

Verification:
- Check webhook logs
- Check packet API

Escalation:
- Stop sales until packet authority is correct

Recovery:
- Reprocess the verified event only after root cause is understood

## 8. Evidence Package Template

### Customer Information
- Customer name:
- Store domain:
- Timestamp:

### Checkout Evidence
- Stripe session id:
- Payment reference:
- Stripe payment status:
- Checkout URL:

### Packet Evidence
- Packet id:
- Reservation id:
- Packet status:
- Packet updated_at:

### Continuity Evidence
- Continuity URL:
- Page title:
- Visible labels:
- Screenshot path:

### Delivery Evidence
- Customer notified:
- Delivery timestamp:
- Operator notes:

## 9. GO / NO-GO Criteria

### GO
All of the following must be true:
- ShopiFixer pages are reachable.
- Checkout service is healthy.
- A payment creates a packet.
- Packet authority shows `payment_received`.
- `/payment-return` redirects to `/fix-status`.
- `/fix-status` renders the paid continuity state.
- Evidence is captured for checkout, packet, continuity, and delivery.

### NO-GO
Any of the following is true:
- Checkout cannot be completed.
- Packet authority does not show `payment_received`.
- `/payment-return` does not reach `/fix-status`.
- `/fix-status` shows `Request unavailable`.
- The operator cannot capture evidence for the transaction.
