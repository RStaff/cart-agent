# Stafford Media Blueprint Payment Authority Checkpoint v1

Status: local Step 3 implementation patch; not promoted or deployed.

## Verified authority

- Base and live API revision at implementation start: `da5967d52dec6f958b9d9979affaed69c11712b7`.
- Offer: `STAFFORDMEDIA_AUTOMATION_OPPORTUNITY_ASSESSMENT_V1`.
- Live Payment Link: `plink_1UJacwJyylmUTExqQDaNV1dB` (active).
- Product: `prod_VKF6B7HLG2L0tQ`.
- Price: `price_1UJacYJyylmUTExqBGErXBxb`; USD 750.00; one-time; fixed quantity 1.
- Webhook: `POST https://cart-agent-api.onrender.com/stripe/webhook`.
- `checkout.session.completed` is subscribed.
- `checkout.session.async_payment_succeeded` is not subscribed.
- Render service `cart-agent-api` uses root directory `web` and predeploy command `npm run db:migrate:deploy`; `web/package.json` maps that command to `prisma migrate deploy --schema=prisma/schema.prisma`.

## Patch boundary

The patch adds durable PostgreSQL engagement and payment-event records, exact server-side offer verification, replay protection, and an isolated Blueprint branch in the existing signed raw-body webhook. Buyer evidence is retained, while client and inquiry association remain pending Ross review. It does not perform onboarding, email, delivery, client merging, portal work, implementation-credit application, or implementation execution.

Review hardening additionally requires expanded PaymentIntent, Charge, and balance-transaction evidence. The durable engagement records the balance-transaction timestamp as `paidAt`; the payment receipt separately records Stripe's event timestamp and the server receipt timestamp. Invalid-signature traffic is rate-limited, while successfully signed Stripe deliveries bypass that quota and continue through the existing handler.

## Unresolved promotion blockers

1. Resolve or disposition the PR checks and merge through the normal GitHub path. The alignment validator currently also matches `web/src/routes/automationInquiries.review.test.js`, which is present unchanged on the base revision; that workflow defect is outside this Step 3 patch.
2. Apply the additive migration before routing Blueprint events to the new code.
3. Deploy and verify the API revision and signed-event behavior.
4. Only after the API deploy, add `checkout.session.async_payment_succeeded` to the existing Stripe destination without removing any existing subscription.
5. Run a controlled Stripe-signed non-customer fixture or provider test event; no real payment is required for automated tests.

Steps 4–6 must extend the same durable engagement authority with appropriately restricted operator and client projections; they must not create a parallel CRM or payment store.

## Local verification evidence

- Prisma 6.16 schema validation and client generation passed.
- All 30 migrations, including the additive Blueprint migration, applied successfully to a disposable PostgreSQL database.
- After review hardening, Prisma 6.16 schema validation and generation passed; all 30 migrations applied to a fresh disposable PostgreSQL database; targeted authority, webhook, and PostgreSQL tests passed 14 of 14.
- Tests cover server-verified settlement evidence and distinct provider/receipt timestamps, asynchronous success, no-inquiry purchase, sequential and concurrent replay, retryable provider/database failures, invalid signatures before processing, exact offer rejection, and ShopiFixer bypass.
- No live payment, customer record, email, onboarding, delivery, or Stripe configuration was used or changed.
- Local dependency installation reported pre-existing audit findings; this patch changes no dependency manifest or lockfile.
