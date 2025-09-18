#!/usr/bin/env bash
set -euo pipefail
ATTEMPTS=${ATTEMPTS:-20}
SLEEP=${SLEEP:-5}

echo "[migrate] waiting for DB: $DATABASE_URL"
for i in $(seq 1 "$ATTEMPTS"); do
  if npx prisma migrate deploy --schema=prisma/schema.prisma; then
    echo "[migrate] success"
    exit 0
  fi
  echo "[migrate] attempt $i failed; retrying in ${SLEEP}s…"
  sleep "$SLEEP"
done

echo "[migrate] giving up after $ATTEMPTS attempts"
exit 1
