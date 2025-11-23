#!/usr/bin/env bash
set -euo pipefail

PAGES=(
  "https://app.abando.ai/"
  "https://app.abando.ai/embedded"
  "https://app.abando.ai/demo/playground"
  "https://app.abando.ai/onboarding"
  "https://app.abando.ai/pricing"
  "https://app.abando.ai/support"
  "https://app.abando.ai/legal/terms"
  "https://app.abando.ai/legal/privacy"
  "https://app.abando.ai/legal/dpa"
)

for url in "${PAGES[@]}"; do
  echo "▶ Opening: $url"
  open "$url"
done

echo "✅ All key Abando pages opened for screenshots + verification."
