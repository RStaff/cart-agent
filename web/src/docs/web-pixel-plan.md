# Abando Web Pixel Listener Plan

This plan defines the first standardized Web Pixel ingestion path for Abando in the canonical merchant app.

## Target Shopify standard events

- `checkout_started`
- `checkout_completed`

## Listener location

Recommended future code location:

- `cart-agent/web/src/pixels/abandoCheckoutPixel.js`

Recommended registration/config path:

- Shopify Web Pixel app extension or app-level pixel registration owned by `cart-agent/web`

## Event mapping

### `checkout_started`

Map to:

- `POST /signal/checkout-start`

Expected payload:

```json
{
  "shopDomain": "example-store.myshopify.com",
  "cartToken": "gid-or-token-if-available",
  "path": "/checkouts/current",
  "ts": "2026-03-16T18:00:00.000Z",
  "reason": "checkout_started"
}
```

Behavior:

- emit once per checkout start
- include checkout/cart token if provided by the Shopify event payload
- treat as the canonical standardized checkout entry signal

### `checkout_completed`

Map to:

- future conversion/recovery completion tracking
- do not map to `checkout-risk`

Expected payload:

```json
{
  "shopDomain": "example-store.myshopify.com",
  "cartToken": "gid-or-token-if-available",
  "path": "/checkouts/completed",
  "ts": "2026-03-16T18:04:12.000Z",
  "reason": "checkout_completed",
  "orderId": "shopify-order-id-if-available"
}
```

Behavior:

- treat as a success/completion event
- use later for recovery attribution suppression and success measurement

## Payload contract

Minimum payload shape for both events:

```json
{
  "shopDomain": "example-store.myshopify.com",
  "cartToken": "optional-token-or-null",
  "path": "/checkouts/current",
  "ts": "ISO timestamp",
  "reason": "event name or risk reason"
}
```

## Routing plan

### Current step

- `POST /signal/checkout-start`
- `POST /signal/checkout-risk`

### Future standardized mapping

- pixel `checkout_started` -> `/signal/checkout-start`
- pixel `checkout_completed` -> future completion endpoint or completion field on the existing signal pipeline

## Shopify requirements

- Web Pixel capability enabled in the Shopify app setup
- App configuration updated to register the pixel extension
- OAuth scopes reviewed for any event permissions Shopify requires for pixel delivery
- deployment note: pixel code should be versioned with the canonical merchant app, not in `staffordos`

## Recovery tracking note

`checkout_completed` should later suppress false-positive abandonment logic by closing the loop on checkout sessions that already converted.

## Implementation sequence

1. keep storefront detector in `/abando.js` as the lightweight fallback
2. add Web Pixel extension listener for `checkout_started`
3. add Web Pixel extension listener for `checkout_completed`
4. map both into the same signal ingestion ownership inside `cart-agent/web`
5. only then bridge signals into downstream intelligence layers
