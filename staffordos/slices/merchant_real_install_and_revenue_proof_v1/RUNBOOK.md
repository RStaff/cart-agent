# Merchant Real Install + Revenue Proof v1

## Goal
Prove the full Abando commercial loop on a real Shopify merchant.

## Chain
1. Select real merchant/store.
2. Confirm Abando install.
3. Trigger real abandoned checkout.
4. Confirm event enters backend.
5. Send real recovery.
6. Click recovery link.
7. Complete order.
8. Receive `orders/paid` webhook.
9. Verify Shopify HMAC.
10. Attribute revenue.
11. Record proof summary.

## Hard rule
No synthetic proof may be labeled as real merchant proof.

## Current blocker
Select the real merchant/store.
