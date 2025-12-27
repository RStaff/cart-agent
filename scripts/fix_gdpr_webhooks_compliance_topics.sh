#!/usr/bin/env bash
set -euo pipefail

echo "🔧 Fix GDPR webhooks → compliance_topics (Shopify CLI compatible)"

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

# --- Read application_url to build the GDPR endpoint ---
APP_URL="$(perl -ne 'if(/^\s*application_url\s*=\s*"([^"]+)"/){print $1; exit}' "$TOML" || true)"
if [[ -z "${APP_URL:-}" ]]; then
  echo "❌ application_url not found in $TOML"
  exit 1
fi

GDPR_URI="${APP_URL%/}/api/webhooks/gdpr"
echo "✅ application_url: $APP_URL"
echo "✅ GDPR uri:       $GDPR_URI"

# --- Backup ---
BAK="${TOML}.bak_$(date +%s)"
cp "$TOML" "$BAK"
echo "🧾 Backup: $BAK"

TMP="$(mktemp)"

# --- Remove:
# 1) any legacy [[webhooks]] blocks
# 2) any existing GDPR webhook subscriptions (topic/topics/compliance_topics for the 3 GDPR topics)
awk '
function starts_with(s, p){ return index(s,p)==1 }

BEGIN{
  in_legacy_webhooks=0
  in_sub=0
  sub_buf=""
  sub_has_gdpr=0
}

# detect legacy blocks
/^\s*\[\[webhooks\]\]\s*$/ { in_legacy_webhooks=1; next }
in_legacy_webhooks {
  # end legacy block when next header begins
  if ($0 ~ /^\s*\[/) { in_legacy_webhooks=0 }
  else { next }
}

# start a subscription block
/^\s*\[\[webhooks\.subscriptions\]\]\s*$/ {
  if(in_sub){
    if(!sub_has_gdpr) printf "%s", sub_buf
  }
  in_sub=1
  sub_buf=$0 "\n"
  sub_has_gdpr=0
  next
}

# inside subscription block: buffer lines, mark GDPR if found
in_sub {
  sub_buf = sub_buf $0 "\n"
  if($0 ~ /customers\/data_request|customers\/redact|shop\/redact/){ sub_has_gdpr=1 }
  # end subscription block when we hit a new header or new subscription
  if($0 ~ /^\s*\[\[webhooks\.subscriptions\]\]\s*$/ || $0 ~ /^\s*\[[^[]/){
    # (handled by start rule above or by header rule below)
  }
  next
}

# flush any pending subscription buffer when header begins (but only if non-GDPR)
/^\s*\[[^[]/ {
  if(in_sub){
    if(!sub_has_gdpr) printf "%s", sub_buf
    in_sub=0
    sub_buf=""
    sub_has_gdpr=0
  }
  print
  next
}

{ print }

END{
  if(in_sub){
    if(!sub_has_gdpr) printf "%s", sub_buf
  }
}
' "$TOML" > "$TMP"

# --- Ensure [webhooks] section exists (it should) ---
if ! grep -qE '^\s*\[webhooks\]\s*$' "$TMP"; then
  echo "❌ No [webhooks] section found in TOML after cleanup. Aborting."
  exit 1
fi

# --- Insert a single compliance_topics subscription right after [webhooks] api_version line (or after [webhooks] if api_version missing) ---
perl -0777 -pe '
  my $uri = $ENV{GDPR_URI};
  my $block = "\n[[webhooks.subscriptions]]\n" .
              "uri = \"$uri\"\n" .
              "compliance_topics = [\"customers/data_request\", \"customers/redact\", \"shop/redact\"]\n" .
              "format = \"json\"\n";

  # If a compliance_topics block already exists (anywhere), do nothing
  if ($_ =~ /^\s*\[\[webhooks\.subscriptions\]\]\s*.*?^\s*compliance_topics\s*=\s*\[.*?(customers\/data_request|customers\/redact|shop\/redact).*?\]/ms) {
    $_;
  } else {
    # Prefer insertion right after api_version line
    if ($_ =~ /^\s*\[webhooks\]\s*\n(?:.*\n)*?^\s*api_version\s*=\s*".*?"\s*\n/ms) {
      $_ =~ s/^(\s*\[webhooks\]\s*\n(?:.*\n)*?^\s*api_version\s*=\s*".*?"\s*\n)/$1$block/m;
      $_;
    } else {
      # Fallback: insert right after [webhooks]
      $_ =~ s/^(\s*\[webhooks\]\s*\n)/$1$block/m;
      $_;
    }
  }
' "$TMP" > "$TOML"

rm -f "$TMP"

echo
echo "🔍 Confirming GDPR subscription:"
grep -nE '^\s*\[\[webhooks\.subscriptions\]\]|\b(uri|topics|compliance_topics)\s*=' "$TOML" | tail -n 120

echo
echo "✅ Sanity checks:"
grep -qE '^\s*uri\s*=\s*"'$GDPR_URI'"' "$TOML" && echo "  ✅ uri is correct" || { echo "  ❌ uri missing/wrong"; exit 1; }
grep -qE '^\s*compliance_topics\s*=\s*\[.*customers/data_request.*customers/redact.*shop/redact.*\]' "$TOML" && echo "  ✅ compliance_topics present" || { echo "  ❌ compliance_topics missing"; exit 1; }

echo
echo "🎯 Next (copy/paste):"
echo "  cd \"$REPO_ROOT\""
echo "  shopify app deploy"
