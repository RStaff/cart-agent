# ShopiFixer Checkout Connection Results v1

## Files changed

- `abando-frontend/app/shopifixer/page.tsx`

## Routes changed

- No new routes were added.
- The public ShopiFixer purchase action now posts to the existing packet-aware checkout route:
  - `POST /__public-checkout`
- The existing downstream payment routes remain the same:
  - `GET /payment-return`
  - `POST /stripe/webhook`

## CTA changes

- Added a primary merchant-facing purchase CTA:
  - `Get the $950 Fix Sprint`
- Added a merchant store domain input so checkout can carry the correct store context into the existing packet flow.
- Kept the audit CTA in place:
  - `Run ShopiFixer Audit`
- Kept pricing and install links available as secondary actions.

## Metadata passed

The ShopiFixer page now submits the following to the existing checkout endpoint:

- `plan: "scale"`
- `store_domain: <merchant store domain>`

Downstream checkout behavior already provided by repository truth:

- creates a packet
- sets `status: payment_pending`
- binds `client_reference_id` to `packet_id`
- stores Stripe metadata:
  - `packet_id`
  - `store_domain`

## Lifecycle effects

The new CTA now enters the existing payment and packet lifecycle instead of stopping at an audit-only page.

Expected lifecycle flow after the handoff:

1. ShopiFixer CTA opens Stripe Checkout through the packet-aware public checkout.
2. Packet is created in `payment_pending`.
3. Stripe Checkout session is linked to the packet.
4. Verified Stripe webhook can move the packet to `payment_received`.
5. Existing packet execution, proof, completion, and referral machinery can proceed downstream.

## Validation performed

- `npm run build -- --webpack` completed successfully in `abando-frontend/`.
- The production build still includes the `/shopifixer` surface.
- Static code verification confirms the new CTA posts to the existing `POST /__public-checkout` path with packet-relevant metadata.
- Existing webhook handling remains intact in repository truth and was not modified.

## Notes

- No live payment was executed.
- No pricing was changed.
- No new checkout, payment, or lifecycle system was introduced.
