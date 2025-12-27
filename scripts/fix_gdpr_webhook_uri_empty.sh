#!/usr/bin/env bash
set -euo pipefail

echo "🔧 Fix GDPR webhook uri (empty → application_url/api/webhooks/gdpr)"

# --- Find shopify.app.toml by walking up ---
START_DIR="$(pwd)"
TOML=""
dir="$START_DIR"
for _ in {1..8}; do
  if [[ -f "$dir/shopify.app.toml" ]]; then
    TOML="$dir/shopify.app.toml"
    break
  fi
  dir="$(cd "$dir/.." && pwd)"
done

if [[ -z "${TOML:-}" ]]; then
  echo "❌ Could not find shopify.app.toml walking up from: $START_DIR"
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "$TOML")" && pwd)"
echo "📄 TOML: $TOML"
echo "🏠 Root: $REPO_ROOT"

APP_URL="$(perl -ne 'if(/^\s*application_url\s*=\s*"([^"]+)"/){print $1; exit}' "$TOML" || true)"
if [[ -z "${APP_URL:-}" ]]; then
  echo "❌ application_url not found in $TOML"
  exit 1
fi

GDPR_URI="${APP_URL%/}/api/webhooks/gdpr"
echo "✅ application_url: $APP_URL"
echo "✅ GDPR uri:       $GDPR_URI"

BAK="${TOML}.bak_$(date +%s)"
cp "$TOML" "$BAK"
echo "🧾 Backup: $BAK"

# Patch the FIRST subscription block that contains compliance_topics with the 3 GDPR topics.
# - If uri is empty, set it.
# - If uri exists but wrong, set it.
# - Ensure format="json" exists in that same block.
perl -0777 -i -pe '
  my $uri = $ENV{GDPR_URI};

  # Find the GDPR compliance subscription block
  if ($_ =~ m/(\[\[webhooks\.subscriptions\]\]\s*\n(?:(?!\[\[webhooks\.subscriptions\]\]).)*?\ncompliance_topics\s*=\s*\[[^\]]*customers\/data_request[^\]]*customers\/redact[^\]]*shop\/redact[^\]]*\][\s\S]*?)(?=\n\[\[webhooks\.subscriptions\]\]|\n\[[^\[]|$)/m) {
    my $block = $1;

    # Normalize/overwrite uri line (whether empty or present)
    if ($block =~ m/^\s*uri\s*=/m) {
      $block =~ s/^\s*uri\s*=\s*".*?"\s*$/uri = "$uri"/m;
    } else {
      $block =~ s/^(\[\[webhooks\.subscriptions\]\]\s*\n)/$1uri = "$uri"\n/m;
    }

    # Ensure format is present
    if ($block !~ m/^\s*format\s*=/m) {
      $block =~ s/^(uri\s*=\s*".*?"\s*\n)/$1format = "json"\n/m;
      # if uri line somehow not first, add format right after header
      if ($block !~ m/^\s*format\s*=/m) {
        $block =~ s/^(\[\[webhooks\.subscriptions\]\]\s*\n)/$1format = "json"\n/m;
      }
    }

    # Replace in file (only first match)
    $_ =~ s/\Q$1\E/$block/;
  }

  $_;
' "$TOML"

echo
echo "🔍 Confirming GDPR subscription (showing uri/compliance_topics/format):"
grep -nE '^\s*\[\[webhooks\.subscriptions\]\]|\b(uri|compliance_topics|format)\s*=' "$TOML" | sed -n '1,120p' || true

echo
echo "✅ Final checks:"
grep -qE '^\s*uri\s*=\s*"'$GDPR_URI'"\s*$' "$TOML" && echo "  ✅ uri set correctly" || { echo "  ❌ uri still not correct"; exit 1; }
grep -qE '^\s*compliance_topics\s*=\s*\[.*customers/data_request.*customers/redact.*shop/redact.*\]' "$TOML" && echo "  ✅ compliance_topics OK" || { echo "  ❌ compliance_topics missing"; exit 1; }
grep -qE '^\s*format\s*=\s*"json"\s*$' "$TOML" && echo "  ✅ format=json present (at least once)" || echo "  ⚠️ format=json not found (Shopify may still accept, but we recommend it)"

echo
echo "🎯 Next (copy/paste):"
echo "  cd \"$REPO_ROOT\""
echo "  shopify app deploy"
