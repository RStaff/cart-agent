# S2G PROVIDER CHECKLIST V1

## Required Before Verified Event Validation

1. Render cart-agent-api has `STRIPE_WEBHOOK_SECRET`.
2. Stripe webhook endpoint points to:
   https://cart-agent-api.onrender.com/stripe/webhook
   or canonical production domain equivalent.
3. Stripe webhook endpoint listens for:
   checkout.session.completed
4. Render deploy includes commit:
   c66f5ee3 or later
5. Payment authority source validator passes.

## Do Not Run Yet

- Real merchant payment
- Paid packet execution
- Shopify mutation
- Outreach/send-preview
