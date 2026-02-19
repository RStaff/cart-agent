# Shopify Review Response Pack

Copy/paste template for reviewer communications.

## Reviewer quick summary

- App: `cart-agent` (embedded)
- Primary app URL: `https://pay.abando.ai/embedded`
- Auth diagnostics route: `https://pay.abando.ai/embedded/diagnostics?debug=1`
- Shopify context endpoint: `https://pay.abando.ai/api/shopify/context`
- GDPR endpoint: `https://pay.abando.ai/api/webhooks/gdpr`

## How to validate embedded auth

1. Open app in Shopify admin:
   - `admin.shopify.com/store/cart-agent-dev/apps/cart-agent-1/embedded`
2. Open diagnostics route:
   - `.../embedded/diagnostics?debug=1`
3. Click `Run Auth Check`.
4. Expected result:
   - `status: 200`
   - `body.ok: true`
   - returns `shop` and decoded `session` fields.

## Data/privacy notes

- App does not require protected customer data approval (as submitted).
- GDPR compliance webhook endpoint is configured and reachable:
  - `/api/webhooks/gdpr`

## If reviewer asks for credentials/demo access

Provide:

- Test store URL and collaborator access email.
- Steps to reproduce core flow:
  - Install app
  - Open embedded dashboard
  - Validate diagnostics route
- Any temporary testing codes (if applicable).

## If reviewer reports an issue

Use this response format:

1. **Issue received:** `<reviewer message>`
2. **Root cause:** `<brief cause>`
3. **Fix applied:** `<exact change>`
4. **Verification:** `<steps + expected result>`
5. **Deployment:** `<commit sha + environment>`

