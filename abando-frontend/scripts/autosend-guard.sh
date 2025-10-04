#!/usr/bin/env sh
set -eu
# If AUTOSEND_MODE=auto in prod, insist on CRON_SECRET
if [ "${NODE_ENV:-}" = "production" ] && [ "${AUTOSEND_MODE:-manual}" = "auto" ]; then
  if [ -z "${CRON_SECRET:-}" ]; then
    echo "❌ AUTOSEND_MODE=auto but CRON_SECRET is missing in prod env."
    exit 1
  fi
fi
echo "✅ autosend guard OK."
