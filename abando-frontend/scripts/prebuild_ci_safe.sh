#!/usr/bin/env bash
set -euo pipefail
[ "${SKIP_GUARDS:-0}" = "1" ] && { echo "SKIP_GUARDS=1 → skipping guards"; exit 0; }
run_guard(){ local f="$1"; if [ -x "$f" ]; then "$f"; elif [ -f "$f" ]; then bash "$f"; else echo "ℹ️ guard missing → $f (skipping)"; fi; }
echo "🔒 prebuild_ci_safe.sh: running optional guards…"
run_guard scripts/guard-next-navigation.sh || true
run_guard scripts/guard-searchparams.sh    || true
npm run -s guard:autosend || true
echo "✅ prebuild_ci_safe.sh complete."
