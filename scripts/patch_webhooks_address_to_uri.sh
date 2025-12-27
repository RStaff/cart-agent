#!/usr/bin/env bash
set -euo pipefail

START_DIR="$(pwd)"

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

BK="$TOML.bak_$(date +%s)"
cp "$TOML" "$BK"
echo "🧾 Backup created: $BK"
echo "📄 Patching: $TOML"

# Replace 'address =' with 'uri =' only within [[webhooks.subscriptions]] blocks
perl -0777 -i -pe '
  my @parts = split(/(\n\[\[webhooks\.subscriptions\]\]\n)/, $_);
  my $out = "";
  for (my $i=0; $i<@parts; $i++) {
    if ($parts[$i] eq "\n[[webhooks.subscriptions]]\n") {
      $out .= $parts[$i];
      my $blk = $parts[++$i] // "";
      $blk =~ s/^\s*address\s*=\s*/uri = /mg;
      $out .= $blk;
    } else {
      $out .= $parts[$i];
    }
  }
  $_ = $out;
' "$TOML"

echo
echo "🔍 Confirming webhook subscriptions now use 'uri':"
grep -nE '^\s*\[\[webhooks\.subscriptions\]\]|\b(address|uri)\s*=' "$TOML" | tail -n 80 || true

echo
echo "✅ Required fields present?"
for i in 0 1 2; do
  : # Shopify CLI validates, but we sanity check presence
done

if grep -qE '^\s*address\s*=' "$TOML"; then
  echo "❌ Still found 'address =' in $TOML (unexpected)."
  exit 1
fi

if ! grep -qE '^\s*uri\s*=' "$TOML"; then
  echo "❌ No 'uri =' lines found in $TOML (unexpected)."
  exit 1
fi

echo "✅ Patch complete."
echo
echo "🎯 Next (copy/paste):"
echo "  shopify app deploy"
