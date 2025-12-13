#!/usr/bin/env bash
set -euo pipefail

echo "🔍 Searching for billing routes..."

grep -RIl "subscription" web | tee /tmp/billing_candidates.txt
grep -RIl "appSubscriptionCreate" web | tee -a /tmp/billing_candidates.txt

echo
echo "📄 Possible billing files:"
cat /tmp/billing_candidates.txt
