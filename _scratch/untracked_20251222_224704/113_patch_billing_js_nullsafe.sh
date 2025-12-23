#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/routes/billing.js"
test -f "$FILE" || { echo "❌ Missing: $FILE"; exit 1; }

stamp="$(date +%s)"
cp "$FILE" "$FILE.bak_${stamp}"
echo "✅ Backup: $FILE.bak_${stamp}"

# Patch strategy:
# - Ensure the billing state object is never null by normalizing:
#     const b = (await getBillingState(...)) || { active:false, plan:null, ... }
# - Ensure entitlementsForPlan is called with a safe plan value (b.plan may be null)
# - Avoid touching other logic.

perl -0777 -i -pe '
  # 1) Normalize the result of getBillingState(...) if assigned to const b =
  s/const\s+b\s*=\s*await\s+getBillingState\(([^)]*)\)\s*;/const b = (await getBillingState($1)) || { active: false, plan: null, shop: String($1 || \"\") }; /g;

  # 2) If code uses "let b =" instead of const
  s/let\s+b\s*=\s*await\s+getBillingState\(([^)]*)\)\s*;/let b = (await getBillingState($1)) || { active: false, plan: null, shop: String($1 || \"\") }; /g;

  # 3) Make entitlementsForPlan robust when called like entitlementsForPlan(b.plan, b.active)
  s/entitlementsForPlan\(\s*b\.plan\s*,\s*b\.active\s*\)/entitlementsForPlan(b && b.plan)/g;

  # 4) Make entitlementsForPlan robust when called like entitlementsForPlan(b.plan)
  s/entitlementsForPlan\(\s*b\.plan\s*\)/entitlementsForPlan(b && b.plan)/g;
' "$FILE"

echo "🔍 Sanity check:"
node --check "$FILE"
echo "✅ billing.js parses"

echo
echo "🔁 Restart dev stack"
lsof -ti tcp:3000 | xargs -r kill -9 || true
lsof -ti tcp:3001 | xargs -r kill -9 || true
./scripts/dev.sh cart-agent-dev.myshopify.com

echo
echo "✅ Status:"
lsof -nP -iTCP:3000 -sTCP:LISTEN || true
