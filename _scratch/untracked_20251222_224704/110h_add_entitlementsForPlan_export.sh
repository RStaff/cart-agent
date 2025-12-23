#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/db/billingState.js"
test -f "$FILE" || { echo "❌ Missing: $FILE"; exit 1; }

stamp="$(date +%s)"
cp "$FILE" "$FILE.bak_${stamp}"
echo "✅ Backup: $FILE.bak_${stamp}"

# If already present, do nothing
if grep -qE 'export function entitlementsForPlan\(' "$FILE"; then
  echo "✅ entitlementsForPlan already exists (no changes)."
  node --check "$FILE"
  exit 0
fi

# Append a safe export that won't touch DB and won't throw.
cat >> "$FILE" <<'JS'

/**
 * billing.js expects this named export.
 * Keep it conservative: return an array of strings (entitlement keys).
 * (Caller can treat it like: entitlements.includes("x") )
 */
export function entitlementsForPlan(plan) {
  const p = String(plan || "").toLowerCase();

  // Adjust these names later once your real tier model is finalized.
  if (p === "pro" || p === "paid" || p === "premium") {
    return ["rescue", "ai_copy", "analytics", "priority_support"];
  }

  if (p === "starter" || p === "basic") {
    return ["rescue", "ai_copy"];
  }

  // Default/free
  return [];
}
JS

echo "🔍 Sanity check:"
node --check "$FILE"
echo "✅ Patched: added entitlementsForPlan export (parses)"
