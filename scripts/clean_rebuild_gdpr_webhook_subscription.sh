#!/usr/bin/env bash
set -euo pipefail

echo "🧹 Clean + rebuild GDPR webhook subscription (Shopify CLI compatible)"

# --- Find shopify.app.toml walking up ---
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

# Remove ALL existing GDPR compliance subscription blocks (including corrupted ones),
# and also strip any corrupted lines containing the GDPR topics with trailing junk.
perl -0777 -i -pe '
  # Split into lines for simpler cleanup
  my @lines = split /\n/, $_;

  my @out;
  my $i = 0;

  while ($i <= $#lines) {
    my $line = $lines[$i];

    # Detect start of a webhook subscription block
    if ($line =~ /^\s*\[\[webhooks\.subscriptions\]\]\s*$/) {
      my $j = $i + 1;
      my @block = ($line);

      # Collect until next block header ([[...]] or [...]) or EOF
      while ($j <= $#lines && $lines[$j] !~ /^\s*\[\[.*\]\]\s*$/ && $lines[$j] !~ /^\s*\[.*\]\s*$/) {
        push @block, $lines[$j];
        $j++;
      }

      my $block_text = join("\n", @block);

      # If this block is a GDPR compliance block (has any of the GDPR topics), DROP it.
      if ($block_text =~ /customers\/data_request|customers\/redact|shop\/redact/) {
        $i = $j;
        next;
      }

      # Otherwise keep the block unchanged
      push @out, @block;
      $i = $j;
      next;
    }

    # Drop any stray corrupted GDPR topic lines outside blocks
    if ($line =~ /(customers\/data_request|customers\/redact|shop\/redact).*""\s*$/) {
      $i++;
      next;
    }

    push @out, $line;
    $i++;
  }

  $_ = join("\n", @out) . "\n";
' "$TOML"

# Append ONE clean GDPR compliance subscription block at end of file
cat >> "$TOML" <<TOML_APPEND

[[webhooks.subscriptions]]
uri = "$GDPR_URI"
format = "json"
compliance_topics = ["customers/data_request", "customers/redact", "shop/redact"]
TOML_APPEND

echo
echo "🔍 Confirming GDPR subscription blocks now:"
grep -nE '^\s*\[\[webhooks\.subscriptions\]\]|\b(uri|compliance_topics|topic|address|format)\s*=' "$TOML" | tail -n 120 || true

echo
echo "✅ Final checks:"
grep -qE '^\s*uri\s*=\s*"'$GDPR_URI'"\s*$' "$TOML" && echo "  ✅ uri set correctly" || { echo "  ❌ uri still not correct"; exit 1; }
grep -qE '^\s*compliance_topics\s*=\s*\[.*customers/data_request.*customers/redact.*shop/redact.*\]\s*$' "$TOML" && echo "  ✅ compliance_topics OK" || { echo "  ❌ compliance_topics missing/broken"; exit 1; }

# Ensure there is no empty uri left
if grep -qE '^\s*uri\s*=\s*""\s*$' "$TOML"; then
  echo "  ❌ Found empty uri still present"
  exit 1
fi
echo "  ✅ no empty uri remains"

echo
echo "🎯 Next (copy/paste):"
echo "  cd \"$REPO_ROOT\""
echo "  shopify app deploy"
