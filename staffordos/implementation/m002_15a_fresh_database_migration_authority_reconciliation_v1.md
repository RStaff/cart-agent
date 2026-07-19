# M002.15A Fresh Database Migration Authority Reconciliation

Document Type:
Mission 002 migration authority evidence

Mission:
M002.15A_FRESH_DATABASE_MIGRATION_AUTHORITY_RECONCILIATION

Repository Commit Under Review:
51f16e35ab2c58aab88a7fdbc1b23cc110e5b2ce

## Purpose

This document records the repository-backed root cause, repair, and validation
for the fresh database migration failure that blocked M002.15 test
infrastructure provisioning.

No production database was connected to, migrated, baselined, resolved, or
modified during this mission.

## Root Cause

The active migration chain referenced `"DecisionLog"` before any active
migration created that relation.

The failing migration was:

- `web/prisma/migrations/20260529222000_add_canonical_packets/migration.sql`

The failing statements were:

- `ALTER TABLE "DecisionLog" ADD COLUMN IF NOT EXISTS "packetId" TEXT;`
- `CREATE INDEX IF NOT EXISTS "DecisionLog_packetId_decisionTimestamp_idx" ON "DecisionLog"("packetId", "decisionTimestamp");`

Fresh PostgreSQL migration from an empty database failed deterministically with:

- Prisma error: `P3018`
- PostgreSQL error code: `42P01`
- PostgreSQL error: `relation "DecisionLog" does not exist`

## Dependency Graph

Active ordered migration dependency:

1. `20260310154047_add_jobs_and_system_events`
   - Creates `"public"."Job"`.
   - Creates `"public"."SystemEvent"`.
2. `20260401000000_add_decision_log`
   - Creates `"public"."DecisionLog"`.
   - Creates the `DecisionLog` indexes represented by
     `web/prisma/schema.prisma`.
3. `20260529222000_add_canonical_packets`
   - Creates `"packets"`.
   - Adds packet linkage columns and indexes to `"Job"`, `"SystemEvent"`, and
     `"DecisionLog"`.
4. `20260601000000_add_packet_reservation_id`
   - Adds nullable `"reservation_id"` support to `"public"."packets"`.

`packets` does not depend on `DecisionLog` to exist. The dependency is created
only by the packet-linkage statements that add `packetId` to governance and
event relations.

## Schema Authority

`web/prisma/schema.prisma` is the canonical Prisma schema authority for:

- `DecisionLog`
- `Job`
- `SystemEvent`
- `Packet`

`web/src/lib/packetRepository.js` is a runtime fallback for packet persistence.
It already creates `packets` and adds `reservation_id` lazily at runtime.
That fallback is compatibility behavior, not sufficient migration authority for
a fresh database because Render pre-deploy migration must pass before the test
backend can start.

## Selected Repair

The selected repair is forward-only and migration-owned:

- Add `web/prisma/migrations/20260401000000_add_decision_log/migration.sql`.
- Add `web/prisma/migrations/20260601000000_add_packet_reservation_id/migration.sql`.
- Add `reservationId String? @map("reservation_id")` to the Prisma `Packet`
  model.

Published migration files were not edited, deleted, squashed, or reordered.

The `DecisionLog` migration is ordered before
`20260529222000_add_canonical_packets` so a fresh database reaches the packet
migration with the required relation present. The reservation migration is
ordered after the packet table exists.

## Fresh Database Validation

Disposable local PostgreSQL validation database:

- `m00215a_fresh2`
- host: `127.0.0.1`
- port: `55432`
- production credentials: not used

Validation command:

```bash
npm run db:migrate:deploy
```

Result:

- 17 migrations found.
- All 17 migrations applied successfully from zero.
- `DecisionLog`, `Job`, `SystemEvent`, and `packets` exist.
- `packets.reservation_id` exists.
- Required `DecisionLog` and `packets` indexes exist.
- No unvalidated constraints were found.
- `npx prisma validate --schema=prisma/schema.prisma` passed.
- `npx prisma generate --schema=prisma/schema.prisma` passed.
- Local backend startup against the disposable database passed.
- `GET /health` returned HTTP 200.

## Upgrade Path Validation

Disposable local upgrade-path database:

- `m00215a_upgrade2`
- host: `127.0.0.1`
- port: `55432`
- production credentials: not used

Simulation sequence:

1. Applied the original pre-packet migration subset through
   `20260310154047_add_jobs_and_system_events`.
2. Created `DecisionLog` outside Prisma migration history to model the
   historical condition required for the original packet migration to pass.
3. Applied the original `20260529222000_add_canonical_packets` migration from a
   temporary copy of the pre-repair Prisma directory.
4. Applied the repaired repository migration chain.

Result:

- Prisma applied pending `20260401000000_add_decision_log` after the historical
  packet migration without duplicate relation failure.
- Prisma applied pending `20260601000000_add_packet_reservation_id` without
  duplicate column failure.
- Migration history contains all 17 migrations as finished.
- `packets.reservation_id` exists.
- Required indexes exist.
- No unvalidated constraints were found.

## Production Non-Impact

This mission did not:

- connect to production `cart-agent-db`;
- run migrations against production;
- use `prisma migrate resolve`;
- modify Render services;
- create a Render database;
- change environment variables;
- configure Stripe;
- execute checkout;
- create packets;
- deploy.

Production status was verified through read-only authority only:

- `cart-agent-api` latest deploy remains
  `51f16e35ab2c58aab88a7fdbc1b23cc110e5b2ce`.
- `https://cart-agent-api.onrender.com/health` returned healthy.
- no `cart-agent-api-test` service exists.
- the failed `cart-agent-test-db` database from M002.15 is deleted.

## Retry Prerequisites For M002.15

M002.15 may be retried only after this migration repair is committed and the
test provisioning mission pins the repaired commit.

The retry must still preserve the M002.15 boundaries:

- no production database reuse;
- no production Render mutation;
- no Stripe configuration during infrastructure provisioning;
- no checkout;
- no packet creation outside the isolated test environment.

## Authority Statement

The repository migration chain is authorized to create `DecisionLog` before
canonical packet linkage and to make `packets.reservation_id` migration-owned.
This document does not authorize production migration execution, Render
provisioning, Stripe configuration, checkout, Shopify mutation, or Mission 002
merchant execution.
