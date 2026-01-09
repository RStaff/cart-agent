#!/usr/bin/env bash
set -euo pipefail

# --- Colors ---
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[1;33m"
CYAN="\033[0;36m"
RESET="\033[0m"

# --- Helpers ---
log()      { echo -e "${CYAN}ℹ${RESET} $1"; }
success()  { echo -e "${GREEN}✅${RESET} $1"; }
warn()     { echo -e "${YELLOW}⚠${RESET} $1"; }
error()    { echo -e "${RED}❌${RESET} $1"; }

# --- Kill dev server if running ---
"$(dirname "$0")/dev-kill.sh"

# --- DB URL ---
DBURL=$(sed -n 's/^DATABASE_URL="\{0,1\}\([^"]*\)"\{0,1\}$/\1/p' .env)
if [ -z "${DBURL:-}" ]; then
  error "DATABASE_URL not found in .env"
  exit 1
fi

# --- Reset schema ---
log "Resetting schema 'public' on ${DBURL%%\?*}"
psql "$DBURL" -v ON_ERROR_STOP=1 <<'SQL'
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO public;
SQL

# --- Re-apply migrations ---
log "Applying migrations..."
npx prisma migrate deploy --schema=prisma/schema.prisma

# --- Regenerate client ---
log "Generating Prisma client..."
npx prisma generate --schema=prisma/schema.prisma

# --- Final Banner ---
echo -e "${GREEN}"
echo "====================================================="
echo " ✅ Dev environment reset complete!"
echo " 🚀 Server running at http://localhost:3000"
echo "====================================================="
echo -e "${RESET}"

# --- Start server ---
npm run dev

