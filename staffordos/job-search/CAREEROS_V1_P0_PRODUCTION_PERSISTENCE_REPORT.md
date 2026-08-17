# CareerOS P0 Production Persistence and Identity Report

CareerOS now has a contained Prisma schema/migration and a PostgreSQL repository adapter covering accounts, tenants, memberships, profiles, sources, candidate facts, review decisions, confirmed CareerFacts, sessions, onboarding, and audit events.

The runtime selects the local adapter only outside production. Production mode requires `DATABASE_URL` and resolves database-backed sessions using token digests. The migration is additive and isolated from the shared ShopiFixer/Abando schema.

The additive migration and core PostgreSQL lifecycle were validated against an isolated temporary PostgreSQL database using synthetic identities/data: account, profile, source, candidate, confirmation, export, revocation, deletion, and cross-tenant denial all passed. Real external customer data is still not accepted: deployment migration, production identity recovery/verification, external rate limiting, secure binary storage, and operational environment validation remain required.
