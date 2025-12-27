#!/usr/bin/env bash
set -euo pipefail

echo "🧽 Remove empty [[webhooks.subscriptions]] blocks (Shopify CLI fix)"

# Find shopify.app.toml walking up
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

echo "📄 TOML: $TOML"
BAK="${TOML}.bak_$(date +%s)"
cp "$TOML" "$BAK"
echo "🧾 Backup: $BAK"

# Remove subscription blocks that contain no uri/topic/compliance_topics
perl -0777 -i -pe '
  my @lines = split /\n/, $_;
  my @out;
  my $i = 0;

  while ($i <= $#lines) {
    my $line = $lines[$i];

    if ($line =~ /^\s*\[\[webhooks\.subscriptions\]\]\s*$/) {
      my $j = $i + 1;
      my @block = ($line);

      # collect block body
      while ($j <= $#lines && $lines[$j] !~ /^\s*\[\[.*\]\]\s*$/ && $lines[$j] !~ /^\s*\[.*\]\s*$/) {
        push @block, $lines[$j];
        $j++;
      }

      my $block_text = join("\n", @block);

      # keep only if it has at least one meaningful key
      if ($block_text !~ /\b(uri|topic|topics|compliance_topics)\s*=/) {
        # DROP this empty block
        $i = $j;
        next;
      }

      push @out, @block;
      $i = $j;
      next;
    }

    push @out, $line;
    $i++;
  }

  $_ = join("\n", @out) . "\n";
' "$TOML"

echo
echo "🔍 Showing webhook subscriptions (tail):"
grep -nE '^\s*\[\[webhooks\.subscriptions\]\]|\b(uri|topic|topics|compliance_topics|format)\s*=' "$TOML" | tail -n 120 || true

echo
echo "✅ Sanity: no empty subscription headers remain?"
# If any subscription header is immediately followed by another header (or EOF) without a key line, fail.
perl -0777 -ne '
  my $s = $_;
  while ($s =~ m/(\n\s*\[\[webhooks\.subscriptions\]\]\s*\n)(.*?)(\n\s*(\[\[|\[)|\z)/sg) {
    my $body = $2;
    if ($body !~ /\b(uri|topic|topics|compliance_topics)\s*=/) { print "FAIL\n"; exit 1; }
  }
  print "OK\n";
' "$TOML" | grep -q "OK" && echo "  ✅ OK" || { echo "  ❌ Still found an empty subscription block"; exit 1; }

echo
echo "🎯 Next (copy/paste):"
echo "  shopify app deploy"
