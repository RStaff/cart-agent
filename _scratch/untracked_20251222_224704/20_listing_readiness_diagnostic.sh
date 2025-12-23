#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

echo "=== Abando Listing Readiness Diagnostic ==="
echo "Repo: $ROOT"
echo "Branch: $(git branch --show-current 2>/dev/null || echo '?')"
echo "Commit: $(git rev-parse --short HEAD 2>/dev/null || echo '?')"
echo "Date: $(date)"
echo

echo "== 1) Shopify CLI App Config (shopify.app.toml) =="
if [ -f shopify.app.toml ]; then
  nl -ba shopify.app.toml | sed -n '1,220p'
else
  echo "❌ shopify.app.toml not found at repo root"
fi
echo

echo "== 2) Scopes (what Shopify reviewers care about) =="
if [ -f shopify.app.toml ]; then
  echo "--- access_scopes.scopes ---"
  grep -nE '^\s*scopes\s*=' shopify.app.toml || true
else
  echo "ℹ️ No shopify.app.toml"
fi
echo

echo "== 3) Current App URLs (prod targets we need set in Partners dashboard) =="
echo "--- Frontend (www.abando.ai) ---"
curl -sI https://www.abando.ai/ | egrep -i '^(HTTP/|location:|server:|x-vercel-id:|x-vercel-cache:)' || true
echo
echo "--- Frontend (/demo/playground) ---"
curl -sI https://www.abando.ai/demo/playground | egrep -i '^(HTTP/|location:|server:|x-vercel-id:|x-vercel-cache:)' || true
echo

echo "== 4) Backend presence checks (install/auth/billing/webhooks) =="
if [ -d web ]; then
  echo "--- web/ exists ---"
  ls -la web | sed -n '1,120p'
else
  echo "❌ web/ folder not found (expected Shopify backend lives here)"
fi
echo

echo "== 5) Search backend for must-have routes/keywords =="
if command -v rg >/dev/null 2>&1; then
  rg -n "auth/callback|/auth|validateAuthenticatedSession|authenticate|webhook|/webhooks|billing|APP_SUBSCRIPTIONS|recurring|usage|plans|appSubscription" web 2>/dev/null || true
else
  echo "ripgrep (rg) not installed. Install with: brew install ripgrep"
fi
echo

echo "== 6) Env var expectation (do we have real Shopify secrets wired?) =="
echo "--- Checking for required variables referenced in repo ---"
REQ_VARS=(SHOPIFY_API_KEY SHOPIFY_API_SECRET SHOPIFY_SCOPES SHOPIFY_APP_URL)
for v in "${REQ_VARS[@]}"; do
  if [ -n "${!v:-}" ]; then
    echo "✅ $v is set in current shell"
  else
    echo "⚠️ $v NOT set in current shell"
  fi
done
echo
echo "--- Grep for billing mode toggles ---"
rg -n "BILLING_MODE|NEXT_PUBLIC_BILLING_MODE|stub|real|shopify" . 2>/dev/null || true
echo

echo "== 7) Frontend compliance pages (required for App Store review) =="
FRONT="abando-frontend"
if [ -d "$FRONT" ]; then
  echo "--- Checking common pages in $FRONT/app ---"
  ls -la "$FRONT/app" | sed -n '1,200p' || true
  echo
  echo "--- Search for privacy/terms/support pages ---"
  rg -n "privacy|terms|support|contact|data deletion|gdpr|ccpa" "$FRONT/app" "$FRONT/src" 2>/dev/null || true
else
  echo "⚠️ $FRONT not found"
fi
echo

echo "== 8) Shopify webhooks config (shopify.app.toml) =="
if [ -f shopify.app.toml ]; then
  grep -nE '^\[webhooks\]|\bapi_version\b' -n shopify.app.toml || true
else
  echo "ℹ️ No shopify.app.toml"
fi
echo

echo "== 9) Git status (what changed / what’s uncommitted) =="
git status --porcelain || true
echo

echo "=== End Diagnostic ==="
