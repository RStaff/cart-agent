#!/usr/bin/env bash
set -euo pipefail

# Find the most recent trycloudflare tunnel URL by scanning likely Shopify log locations.
# Outputs: export TUNNEL=...
# Also prints where it was found.

ROOT="$(pwd)"

candidates=()

# Common names in repo
for f in ".shopify_dev.log" ".shopify_dev.log."* ".shopify-cli.log" ".shopify-cli.log."*; do
  [[ -f "$ROOT/$f" ]] && candidates+=("$ROOT/$f")
done

# Shopify folder in repo
if [[ -d "$ROOT/.shopify" ]]; then
  while IFS= read -r p; do candidates+=("$p"); done < <(find "$ROOT/.shopify" -maxdepth 3 -type f 2>/dev/null || true)
fi

# Anything log-ish near repo root (bounded)
while IFS= read -r p; do candidates+=("$p"); done < <(
  find "$ROOT" -maxdepth 3 -type f \( -name "*shopify*log*" -o -name "*.log" \) 2>/dev/null | head -n 200 || true
)

# De-dupe
uniq_candidates=()
seen=""
for f in "${candidates[@]:-}"; do
  [[ -f "$f" ]] || continue
  if [[ "$seen" != *"|$f|"* ]]; then
    uniq_candidates+=("$f")
    seen="${seen}|$f|"
  fi
done

# Helper: extract LAST trycloudflare url from a file
extract_last() {
  local f="$1"
  perl -ne '
    while (m{https://[a-z0-9-]+\.trycloudflare\.com}g) { $last=$& }
    END { print $last||"" }
  ' "$f" 2>/dev/null || true
}

best_url=""
best_file=""

for f in "${uniq_candidates[@]:-}"; do
  url="$(extract_last "$f")"
  if [[ -n "$url" ]]; then
    best_url="$url"
    best_file="$f"
  fi
done

if [[ -z "$best_url" ]]; then
  echo "❌ Could not find any https://*.trycloudflare.com tunnel URL in repo logs." >&2
  echo "Tip: your Shopify CLI may not be writing to .shopify_dev.log right now." >&2
  echo "We can still proceed by checking localhost port directly if needed." >&2
  exit 2
fi

echo "export TUNNEL=\"$best_url\""
echo "echo \"TUNNEL=$best_url\""
echo "echo \"FOUND_IN=$best_file\""
