#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
MIGRATION_ID=20260816000000_careeros_p0_foundation
MIGRATION_FILE="$ROOT_DIR/prisma/migrations/${MIGRATION_ID}/migration.sql"
MIGRATION_CHECKSUM=$(shasum -a 256 "$MIGRATION_FILE" | cut -d ' ' -f1)

if [[ ! -f "$MIGRATION_FILE" ]]; then
  printf '%s\n' "CareerOS migration file is missing: $MIGRATION_FILE" >&2
  exit 1
fi

RUNNER_SQL=$(mktemp)
trap 'rm -f "$RUNNER_SQL"' EXIT
cat >"$RUNNER_SQL" <<'SQL'
\set ON_ERROR_STOP on
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('careeros-p0-foundation'));
CREATE TABLE IF NOT EXISTS "CareerOSMigration" (
  "id" TEXT PRIMARY KEY,
  "checksum" TEXT NOT NULL,
  "appliedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = current_schema()
    AND table_name = 'CareerOSMigration'
    AND column_name = 'checksum'
) AS checksum_column \gset
\if :checksum_column
\else
  \echo 'CareerOSMigration exists without checksum; refusing to infer migration state.' >&2
  SELECT 1 / 0;
\endif
SELECT EXISTS (
  SELECT 1 FROM "CareerOSMigration" WHERE "id" = :'migration_id'
) AS already_applied \gset
\if :already_applied
  SELECT "checksum" = :'migration_checksum' AS checksum_matches
  FROM "CareerOSMigration" WHERE "id" = :'migration_id' \gset
  \if :checksum_matches
    \echo 'CareerOS migration already applied with matching checksum.'
  \else
    \echo 'CareerOS migration checksum mismatch; refusing to continue.' >&2
    SELECT 1 / 0;
  \endif
\else
  SELECT EXISTS (
    SELECT 1
    FROM pg_class
    WHERE relnamespace = current_schema()::regnamespace
      AND relkind = 'r'
      AND relname = ANY (ARRAY[
        'CareerUser', 'CareerTenant', 'CareerTenantMembership', 'CareerProfile',
        'CareerSource', 'CareerFactCandidate', 'CareerFactReviewDecision',
        'CareerFact', 'CareerSession', 'CareerOnboardingState',
        'CareerAuditEvent', 'CareerInvite', 'CareerRateLimitBucket'
      ])
  ) AS preexisting_tables \gset
  \if :preexisting_tables
    \echo 'CareerOS tables exist without a matching migration ledger; refusing to infer state.' >&2
    SELECT 1 / 0;
  \endif
  \i :migration_file
  INSERT INTO "CareerOSMigration" ("id", "checksum")
  VALUES (:'migration_id', :'migration_checksum');
\endif
COMMIT;
SQL

psql "$DATABASE_URL" \
  -v migration_id="$MIGRATION_ID" \
  -v migration_checksum="$MIGRATION_CHECKSUM" \
  -v migration_file="$MIGRATION_FILE" \
  -f "$RUNNER_SQL"
