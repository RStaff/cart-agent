#!/usr/bin/env bash
set -euo pipefail

FILE="scripts/386_send_signed_webhook_clean.sh"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }
cp "$FILE" "$FILE.bak_$(date +%s)"

perl -0777 -i -pe '
  my $s = $_;

  # Replace any manual TUNNEL assignment with auto-discovery
  # We look for a line like: TUNNEL="..."; or export TUNNEL=...; or TUNNEL=...;
  $s =~ s/^\s*(export\s+)?TUNNEL=.*?\n//mg;

  # Inject helper near top (after shebang + set -euo)
  if ($s !~ /AUTO_TUNNEL_DISCOVERY_BEGIN/s) {
    $s =~ s/(set -euo pipefail\s*\n)/
$1
# AUTO_TUNNEL_DISCOVERY_BEGIN
discover_tunnel() {
  local log_file="\${1:-.shopify_dev.log}"
  local tunnel=""

  # 1) Primary: the tee log in repo (same terminal you run shopify app dev)
  if [[ -f "\$log_file" ]]; then
    tunnel="\$(perl -ne '\''if(/Using URL:\\s*(https:\\/\\/\\S+)/){ \$u=\$1 } END{ print \$u||"" }'\'' "\$log_file" 2>/dev/null || true)"
  fi

  # 2) Fallback: Shopify CLI logs
  if [[ -z "\$tunnel" ]]; then
    tunnel="\$(rg -h -o '\''https:\\/\\/[a-z0-9-]+\\.trycloudflare\\.com'\'' ~/.shopify/logs/*.log 2>/dev/null | tail -n 1 || true)"
  fi

  # 3) Sanity: must look like a trycloudflare URL
  if [[ -z "\$tunnel" || "\$tunnel" != https:\\/\\/*trycloudflare.com* ]]; then
    echo "❌ Could not discover active Cloudflare tunnel." >&2
    echo "   Expected a line like: 'Using URL: https://....trycloudflare.com' in .shopify_dev.log" >&2
    echo "   Fix: run 'shopify app dev' (interactive) and tee output: shopify app dev 2>&1 | tee .shopify_dev.log" >&2
    exit 22
  fi

  echo "\$tunnel"
}
# AUTO_TUNNEL_DISCOVERY_END

/s;

    # Now, ensure script uses the discovered tunnel
    # If script already sets TUNNEL later, it was removed above; we insert a single source of truth.
    if ($s !~ /\bTUNNEL="\$\(\s*discover_tunnel/s) {
      $s =~ s/(\nTOPIC=|\nSHOP=|\nPAYLOAD=)/\nTUNNEL="\$(discover_tunnel "\${1:-.shopify_dev.log}")"\n$1/s;
    }
  }

  $_ = $s;
' "$FILE"

chmod +x "$FILE"
echo "✅ Patched $FILE to auto-discover TUNNEL from .shopify_dev.log (fallback: ~/.shopify/logs)."
echo "   Usage unchanged:"
echo "   ./scripts/386_send_signed_webhook_clean.sh .shopify_dev.log checkouts/update cart-agent-dev.myshopify.com '{}'"
