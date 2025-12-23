#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(pwd)"
FILE="web/src/db/billingState.js"

if [ ! -d "web/src" ]; then
  echo "❌ Not in repo root (missing web/src). cd to cart-agent repo root and re-run."
  exit 1
fi

if [ ! -f "$FILE" ]; then
  echo "❌ Missing: $FILE"
  exit 1
fi

stamp="$(date +%s)"
cp "$FILE" "$FILE.bak_${stamp}"
echo "✅ Backup: $FILE.bak_${stamp}"

cat <<'JS' > "$FILE"
/**
 * Billing state helpers (DEV SAFE)
 * - Never throw
 * - Never crash the server
 * - Provides required named exports used by routes
 */

export async function getBillingState(_shop) {
  // Treat as "free/unbilled" in dev if DB is unavailable
  return null;
}

export function entitlementsForPlan(plan) {
  const p = String(plan || "").toLowerCase();

  // Adjust later once your tier model is finalized
  if (p === "pro" || p === "paid" || p === "premium") {
    return ["rescue", "ai_copy", "analytics", "priority_support"];
  }

  if (p === "starter" || p === "basic") {
    return ["rescue", "ai_copy"];
  }

  // Default/free
  return [];
}

export async function activateBilling(_shop, _plan) {
  // Stubbed for dev — real billing later
  return {
    ok: false,
    stub: true,
    message: "Billing activation stub (DB not required in dev)",
  };
}
JS

echo "🔍 Sanity check:"
node --check "$FILE"
echo "✅ billingState.js parses"

echo
echo "🔁 Restart dev stack"
lsof -ti tcp:3000 | xargs -r kill -9 || true
lsof -ti tcp:3001 | xargs -r kill -9 || true

./scripts/dev.sh cart-agent-dev.myshopify.com

echo
echo "✅ If Express binds, you should see :3000 listening."
lsof -nP -iTCP:3000 -sTCP:LISTEN || true
