#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL_BASE:?DATABASE_URL_BASE must name the disposable PostgreSQL instance without a database suffix}"

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
RUNNER="$ROOT_DIR/scripts/migrate-careeros-v1.sh"
TEST_ROOT=$(mktemp -d)
BASE_URL="${DATABASE_URL_BASE%/}"
ADMIN_URL="$BASE_URL/postgres"
PREFIX="careeros_runner_${RANDOM}_$$"
DBS=()
cleanup() {
  for db in "${DBS[@]}"; do dropdb --if-exists --maintenance-db="$ADMIN_URL" "$db" >/dev/null 2>&1 || true; done
  rm -rf "$TEST_ROOT"
}
trap cleanup EXIT
new_db() { local db="${PREFIX}_$1"; createdb --maintenance-db="$ADMIN_URL" "$db"; DBS+=("$db"); printf '%s' "$db"; }
url_for() { printf '%s/%s' "$BASE_URL" "$1"; }

db=$(new_db repeat)
DATABASE_URL="$(url_for "$db")" "$RUNNER"
DATABASE_URL="$(url_for "$db")" "$RUNNER"
test "$(psql "$(url_for "$db")" -Atqc 'select count(*) from "CareerOSMigration"')" = 1

cp -R "$ROOT_DIR" "$TEST_ROOT/careeros-beta"
printf '\n-- checksum test change --\n' >> "$TEST_ROOT/careeros-beta/prisma/migrations/20260816000000_careeros_p0_foundation/migration.sql"
if DATABASE_URL="$(url_for "$db")" "$TEST_ROOT/careeros-beta/scripts/migrate-careeros-v1.sh" >/dev/null 2>&1; then
  echo 'changed migration was accepted' >&2
  exit 1
fi

db=$(new_db rollback)
cp -R "$ROOT_DIR" "$TEST_ROOT/invalid-beta"
printf '\nTHIS IS INVALID SQL;\n' >> "$TEST_ROOT/invalid-beta/prisma/migrations/20260816000000_careeros_p0_foundation/migration.sql"
if DATABASE_URL="$(url_for "$db")" "$TEST_ROOT/invalid-beta/scripts/migrate-careeros-v1.sh" >/dev/null 2>&1; then
  echo 'invalid migration was accepted' >&2
  exit 1
fi
test "$(psql "$(url_for "$db")" -Atqc "select count(*) from pg_class where relname in ('CareerOSMigration','CareerUser')")" = 0

db=$(new_db preexisting)
psql "$(url_for "$db")" -v ON_ERROR_STOP=1 -c 'create table "CareerUser" ("id" text primary key)' >/dev/null
if DATABASE_URL="$(url_for "$db")" "$RUNNER" >/dev/null 2>&1; then
  echo 'pre-existing table was accepted' >&2
  exit 1
fi

db=$(new_db concurrent)
DATABASE_URL="$(url_for "$db")" "$RUNNER" & first=$!
DATABASE_URL="$(url_for "$db")" "$RUNNER" & second=$!
wait "$first"
wait "$second"
test "$(psql "$(url_for "$db")" -Atqc 'select count(*) from "CareerOSMigration"')" = 1
echo 'CareerOS migration runner disposable tests passed.'
