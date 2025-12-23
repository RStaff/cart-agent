#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"

# Candidate files (same as before, logs only)
files=()
for f in ".shopify_dev.log" ".shopify_dev.log."* ".shopify-cli.log" ".shopify-cli.log."*; do
  [[ -f "$ROOT/$f" ]] && files+=("$ROOT/$f")
done
[[ -d "$ROOT/.shopify" ]] && while IFS= read -r p; do files+=("$p"); done < <(find "$ROOT/.shopify" -type f 2>/dev/null || true)
while IFS= read -r p; do files+=("$p"); done < <(find "$ROOT" -maxdepth 4 -type f -name "*.log" ! -path "*/scripts/*" 2>/dev/null || true)

# Extract all trycloudflare URLs (unique, keep order)
urls="$(
  for f in "${files[@]:-}"; do
    perl -ne 'while(m{https://[a-z0-9-]+\.trycloudflare\.com}g){ print "$&\n" }' "$f" 2>/dev/null || true
  done | awk '!seen[$0]++'
)"

if [[ -z "$urls" ]]; then
  echo "❌ No trycloudflare URLs found in logs." >&2
  exit 2
fi

# Pick first URL whose host resolves
while IFS= read -r u; do
  host="${u#https://}"; host="${host%%/*}"
  if command -v dig >/dev/null 2>&1; then
    ok="$(dig +time=1 +tries=1 +short "$host" | head -n 1 || true)"
  else
    ok="$(python3 - <<PY 2>/dev/null || true
import socket,sys
h=sys.argv[1]
try:
  socket.gethostbyname(h); print("ok")
except: pass
PY
"$host")"
  fi
  if [[ -n "${ok:-}" ]]; then
    echo "export TUNNEL=\"$u\""
    echo "echo \"TUNNEL=$u\""
    exit 0
  fi
done <<< "$urls"

echo "❌ Found trycloudflare URLs, but none resolve anymore (all stale)." >&2
echo "✅ Next step: restart Shopify dev to generate a fresh tunnel + fresh log." >&2
exit 3
