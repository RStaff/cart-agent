#!/usr/bin/env bash
set -euo pipefail

echo "📦 Staging billing-related changes for commit..."

git add \
  web/src/routes/billing_create.js \
  web/src/index.js \
  scripts/kill_web_port_3000.sh \
  scripts/test_billing_stub_e2e.sh \
  scripts/smoke_billing_stub_plans.sh \
  scripts/install_billing_route.sh \
  scripts/mount_billing_route.sh \
  scripts/patch_billing_create_stub.sh \
  scripts/force_billing_stub_always_ok.sh \
  scripts/fix_billing_stub_syntax.sh

echo
echo "🔎 Current status:"
git status
