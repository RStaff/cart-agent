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

## Unresolved promotion blockers

1. Review and merge the local patch through the normal GitHub path.
2. Apply the additive migration before routing Blueprint events to the new code.
3. Deploy and verify the API revision and signed-event behavior.
4. Only after the API deploy, add `checkout.session.async_payment_succeeded` to the existing Stripe destination without removing any existing subscription.
5. Run a controlled Stripe-signed non-customer fixture or provider test event; no real payment is required for automated tests.

Steps 4–6 must extend the same durable engagement authority with appropriately restricted operator and client projections; they must not create a parallel CRM or payment store.

## Local verification evidence

- Prisma 6.16 schema validation and client generation passed.
- All 30 migrations, including the additive Blueprint migration, applied successfully to a disposable PostgreSQL database.
- Targeted authority, webhook, and PostgreSQL tests passed: 11 of 11; the changed webhook failure-path tests then passed 2 of 2.
- No live payment, customer record, email, onboarding, delivery, or Stripe configuration was used or changed.
- Local dependency installation reported pre-existing audit findings; this patch changes no dependency manifest or lockfile.
