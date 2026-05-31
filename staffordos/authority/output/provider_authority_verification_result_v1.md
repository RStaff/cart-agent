# PROVIDER AUTHORITY VERIFICATION RESULT V1

## Status

PROVIDER DRIFT CONFIRMED

## Canonical Service

cart-agent-api

## Canonical URLs

- https://cart-agent-api.onrender.com
- https://api.abando.ai
- https://pay.abando.ai

## Evidence

cart-agent-api /health:
200 OK
{"ok":true,"service":"cart-agent-api"}

cart-agent-backend /health:
404

cart-agent-api /stripe/webhook without Stripe signature:
500
{"ok":false,"error":"missing_stripe_webhook_secret"}

cart-agent-backend /stripe/webhook:
404

## Conclusion

Stripe webhook destination must not point to:

https://cart-agent-backend.onrender.com/stripe/webhook

It must point to the canonical service route:

https://cart-agent-api.onrender.com/stripe/webhook

or:

https://pay.abando.ai/stripe/webhook

## S2G Status

Blocked until Stripe webhook destination and Render STRIPE_WEBHOOK_SECRET are aligned.
