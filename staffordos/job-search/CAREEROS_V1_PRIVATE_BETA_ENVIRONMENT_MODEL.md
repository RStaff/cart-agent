# CareerOS Private-Beta Environment Model

## Local development

Synthetic data only. Local adapters and developer credentials are permitted only here. No customer data.

## Private beta

One isolated CareerOS application, one isolated managed PostgreSQL authority, provider-managed secrets, approved HTTPS origin, invite-only access, text-only intake, backups, and synthetic pre-invite acceptance. Customer data must never flow back to local development.

## Future public production

Separate review of recovery, email verification, public abuse controls, binary storage, support access, observability, and capacity. Do not infer public readiness from private-beta approval.

A separate staging environment is not required for the first five users if the private-beta target has an isolated database and synthetic preflight procedure; it becomes advisable before broader use.
