#!/usr/bin/env bash
# Cart Agent — Render start (minimal, hardened)
set -Eeuo pipefail

log() { printf '[%(%FT%TZ)T] %s\n' -1 "$*"; }
die() { log "FATAL: $*"; exit 1; }

# Go to /web
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
cd "${WEB_DIR}" || die "Cannot cd to ${WEB_DIR}"

: "${DATABASE_URL:?DATABASE_URL is required (Render → Environment)}"
: "${PORT:=10000}"

SCHEMA="prisma/schema.prisma"

log "node: $(node -v)"
log "cwd: ${PWD}  |  using PORT=${PORT}"

# Apply migrations (idempotent)
log "prisma migrate deploy…"
npx prisma migrate deploy --schema="${SCHEMA}"

# Ensure client is generated
log "prisma generate…"
npx prisma generate --schema="${SCHEMA}" >/dev/null

# (Optional) seed a default shop if SEED_SHOP_KEY is set
if [[ -n "${SEED_SHOP_KEY:-}" ]]; then
  log "seeding shop '${SEED_SHOP_KEY}' (non-fatal)…"
  node scripts/seed-shop.js "${SEED_SHOP_KEY}" || log "seed skipped/failed"
fi

log "starting web on PORT=${PORT}…"
exec node src/index.js
