#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"

# Gather candidate log files (not scripts)
files=()

# common explicit logs
for f in ".shopify_dev.log" ".shopify_dev.log."* ".shopify-cli.log" ".shopify-cli.log."*; do
  [[ -f "$ROOT/$f" ]] && files+=("$ROOT/$f")
done

# anything under .shopify (often where CLI writes)
if [[ -d "$ROOT/.shopify" ]]; then
  while IFS= read -r p; do files+=("$p"); done < <(find "$ROOT/.shopify" -type f 2>/dev/null || true)
fi

# any *.log within 3 levels EXCEPT scripts/
while IFS= read -r p; do files+=("$p"); done < <(
  find "$ROOT" -maxdepth 3 -type f -name "*.log" ! -path "*/scripts/*" 2>/dev/null || true
)

# de-dupe
uniq=()
seen=""
for f in "${files[@]:-}"; do
  [[ -f "$f" ]] || continue
  if [[ "$seen" != *"|$f|"* ]]; then
    uniq+=("$f")
    seen="${seen}|$f|"
  fi
done

extract_last() {
  local f="$1"
  perl -ne '
    while (m{https://[a-z0-9-]+\.trycloudflare\.com}g) { $last=$& }
    END { print $last||"" }
  ' "$f" 2>/dev/null || true
}

best=""
best_file=""
for f in "${uniq[@]:-}"; do
  url="$(extract_last "$f")"
  if [[ -n "$url" ]]; then
    best="$url"
    best_file="$f"
  fi
done

if [[ -z "$best" ]]; then
  echo "❌ No trycloudflare tunnel found in log files." >&2
  echo "If Shopify CLI is running, you may need to restart it so it writes fresh logs." >&2
  exit 2
fi

echo "export TUNNEL=\"$best\""
echo "echo \"TUNNEL=$best\""
echo "echo \"FOUND_IN=$best_file\""
