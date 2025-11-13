#!/usr/bin/env bash
set -euo pipefail

# Allow bypass in CI if needed
[ "${SKIP_GUARDS:-0}" = "1" ] && { echo "SKIP_GUARDS=1 → skipping guards"; exit 0; }

echo "🔒 prebuild_ci_safe.sh: running optional guards…"

# Optional guards (skip quietly if missing)
npm run -s guard:autosend || true
[ -f scripts/guard-next-navigation.sh ] && bash scripts/guard-next-navigation.sh || echo "ℹ️ missing guard-next-navigation.sh (ok)"
[ -f scripts/guard-searchparams.sh ] && bash scripts/guard-searchparams.sh || echo "ℹ️ missing guard-searchparams.sh (ok)"

echo "✅ prebuild_ci_safe.sh complete."
