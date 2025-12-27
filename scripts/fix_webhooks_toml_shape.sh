#!/usr/bin/env bash
set -euo pipefail

START_DIR="$(pwd)"

# Find shopify.app.toml by walking upward
find_toml_up() {
  local d="$START_DIR"
  while true; do
    if [[ -f "$d/shopify.app.toml" ]]; then
      echo "$d/shopify.app.toml"
      return 0
    fi
    [[ "$d" == "/" ]] && return 1
    d="$(cd "$d/.." && pwd)"
  done
}

TOML="$(find_toml_up || true)"
if [[ -z "${TOML:-}" ]]; then
  echo "❌ Could not find shopify.app.toml from: $START_DIR"
  exit 1
fi

APP_URL="$(perl -ne 'if(/^\s*application_url\s*=\s*"([^"]+)"/){print $1; exit}' "$TOML" || true)"
if [[ -z "${APP_URL:-}" ]]; then
  echo "❌ Could not find application_url in $TOML"
  exit 1
fi
APP_URL="${APP_URL%/}"
GDPR_ENDPOINT="${APP_URL}/api/webhooks/gdpr"

echo "🔧 Fixing webhook TOML shape..."
echo "📄 TOML: $TOML"
echo "✅ application_url: $APP_URL"
echo "✅ GDPR endpoint:   $GDPR_ENDPOINT"

BK="$TOML.bak_$(date +%s)"
cp "$TOML" "$BK"
echo "🧾 Backup created: $BK"

# 1) Remove the old-style [[webhooks]] blocks we appended (topic + address + format)
perl -0777 -i -pe '
  s/\n\[\[webhooks\]\]\n[^\n]*topic\s*=\s*"customers\/data_request"[^\n]*\n[^\n]*address\s*=\s*"[^"]*"[^\n]*\n[^\n]*format\s*=\s*"json"[^\n]*\n//g;
  s/\n\[\[webhooks\]\]\n[^\n]*topic\s*=\s*"customers\/redact"[^\n]*\n[^\n]*address\s*=\s*"[^"]*"[^\n]*\n[^\n]*format\s*=\s*"json"[^\n]*\n//g;
  s/\n\[\[webhooks\]\]\n[^\n]*topic\s*=\s*"shop\/redact"[^\n]*\n[^\n]*address\s*=\s*"[^"]*"[^\n]*\n[^\n]*format\s*=\s*"json"[^\n]*\n//g;
' "$TOML"

# If TOML has an explicit scalar key like webhooks = "...", that's incompatible—fail loudly.
if grep -qE '^\s*webhooks\s*=' "$TOML"; then
  echo "❌ Found a scalar 'webhooks = ...' in $TOML. That conflicts with webhook tables."
  echo "   Paste the output of: nl -ba shopify.app.toml | sed -n '1,120p'"
  exit 1
fi

ensure_subscription () {
  local topic="$1"
  if grep -qE 'topic\s*=\s*"'$topic'"' "$TOML"; then
    echo "✅ Already present: $topic"
  else
    cat << TOML_APPEND >> "$TOML"

[[webhooks.subscriptions]]
topic = "$topic"
address = "$GDPR_ENDPOINT"
format = "json"
TOML_APPEND
    echo "➕ Added: $topic"
  fi
}

# 2) Ensure [webhooks] exists (Shopify CLI expects it in many templates)
if grep -qE '^\s*\[webhooks\]\s*$' "$TOML"; then
  echo "✅ [webhooks] table exists"
else
  cat << 'TOML_WEBHOOKS' >> "$TOML"

[webhooks]
TOML_WEBHOOKS
  echo "➕ Added [webhooks] table"
fi

# 3) Add mandatory subscriptions in correct schema
ensure_subscription "customers/data_request"
ensure_subscription "customers/redact"
ensure_subscription "shop/redact"

echo
echo "🔍 Confirming final webhook blocks (last 120 lines):"
tail -n 120 "$TOML" | sed -n '1,120p'

echo
echo "✅ Mandatory topics present?"
for t in customers/data_request customers/redact shop/redact; do
  grep -qE 'topic\s*=\s*"'$t'"' "$TOML" && echo "  ✅ $t" || { echo "  ❌ $t (missing)"; exit 1; }
done

echo
echo "🎯 Next (copy/paste):"
echo "  shopify app deploy"
