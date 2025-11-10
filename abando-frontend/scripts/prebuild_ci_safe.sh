#!/usr/bin/env bash
set -euo pipefail
if [[ "${SKIP_GUARDS:-0}" == "1" ]]; then
  echo "⏭️  SKIP_GUARDS=1 → skipping guard-next-navigation / guard-searchparams / guard:autosend"
  exit 0
fi
scripts/guard-next-navigation.sh
scripts/guard-searchparams.sh
sh -c 'npm run guard:autosend && true'
