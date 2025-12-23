#!/usr/bin/env bash
set -euo pipefail

FILE="scripts/386_send_signed_webhook_clean.sh"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }
cp "$FILE" "$FILE.bak_$(date +%s)"

perl -0777 -i -pe '
  # Insert sanitizer helper if missing
  if ($_ !~ /sanitize_tunnel\(\)/s) {
    $_ =~ s/(discover_tunnel\(\)\s*\{\s*[\s\S]*?\n\})/$1\n\nsanitize_tunnel() {\n  # strip CR, ANSI escapes, and any non-printable characters\n  perl -pe '\''s\/\\r\/\/g; s\/\\x1b\\[[0-9;]*[A-Za-z]\/\/g; s\/[^[:print:]]\/\/g; s\/\\s+\$\/\/; s\/^\\s+\/\/;'\''\n}\n/s;
  }

  # Ensure TUNNEL assignment is sanitized
  $_ =~ s/TUNNEL="\$\((?:discover_tunnel|discover_tunnel "\$\{1:-\.shopify_dev\.log\}")\)"/TUNNEL="\$(discover_tunnel | sanitize_tunnel)"/s
    unless $_ =~ /discover_tunnel\s*\|\s*sanitize_tunnel/s;

  # If it uses LOG arg form, sanitize that too
  $_ =~ s/TUNNEL="\$\((discover_tunnel\s+"\$\{1:-\.shopify_dev\.log\}")\)"/TUNNEL="\$($1 | sanitize_tunnel)"/s
    unless $_ =~ /discover_tunnel\s+"\$\{1:-\.shopify_dev\.log\}"\s*\|\s*sanitize_tunnel/s;

' "$FILE"

chmod +x "$FILE"
echo "✅ Hardened $FILE: strips ANSI/control chars from discovered TUNNEL."
