#!/usr/bin/env bash
set -euo pipefail
# Fail if useStripeStatus appears on lines that also include "if", "=>", or "function("
violations=$(grep -Rn --include='*.tsx' 'useStripeStatus(' src | grep -E 'if|\=\>|\bfunction\s*\(' || true)
if [[ -n "${violations}" ]]; then
  echo "❌ useStripeStatus called in a likely non-top-level context:"
  echo "${violations}"
  exit 1
fi
echo "✓ useStripeStatus guard OK"
