#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${1:-apps/website}"      # allow override: ./wrap-client-pages.sh apps/website
ROOT_APP="$APP_DIR/app"           # Next App Router root
TS="$(date +%Y%m%d-%H%M%S)"

say(){ printf '%s\n' "$*"; }

# Heuristics: which files are "client-y" and must be moved into Client.tsx
is_clienty() {
  # $1 = file
  # By design: client directives OR common client hooks in the page body
  grep -qE '^[[:space:]]*"use client";' "$1" && return 0
  grep -qE '\buse(SearchParams|State|Effect|Reducer|Ref|Memo|Callback|Context)\s*\(' "$1" && return 0
  return 1
}

# Extract server-only exports to keep in wrapper (not valid in Client comp)
extract_server_exports() {
  # stdin = original file; stdout = server exports block
  # We capture common Next server exports
  awk '
    /^\s*export\s+const\s+(dynamic|revalidate|fetchCache|preferredRegion|runtime)\b/ {print; next}
    /^\s*export\s+(const\s+metadata\b|{?\s*metadata\s*}?\s+from\b)/ {print; next}
    /^\s*export\s+{[^}]*\bmetadata\b[^}]*}\s*;/ {print; next}
  ' | sed '/^$/d'
}

# Remove those server-only exports from client chunk
strip_server_exports_from_client() {
  # stdin = original file; stdout = code without server-only exports and without top-level "export default function Page"
  awk '
    /^\s*export\s+const\s+(dynamic|revalidate|fetchCache|preferredRegion|runtime)\b/ {next}
    /^\s*export\s+(const\s+metadata\b|{?\s*metadata\s*}?\s+from\b)/ {next}
    /^\s*export\s+{[^}]*\bmetadata\b[^}]*}\s*;/ {next}
    {print}
  ' \
  | sed -E 's/^\s*export\s+default\s+function\s+Page\s*\(/function Page(/' \
  | sed -E 's/^\s*export\s+default\s*\(/(function Page(/' # rare anonymous default forms
}

wrap_one_page() {
  local page="$1"
  local dir; dir="$(dirname "$page")"
  local client="$dir/Client.tsx"

  # Skip if already a thin wrapper that imports ./Client
  if grep -qE 'from\s+["'\'']\./Client["'\'']' "$page"; then
    say "ℹ️  Already wrapped: $page"
    return 0
  fi

  if ! is_clienty "$page"; then
    say "… not client-y, skipping: $page"
    return 0
  fi

  say "→ Wrapping: $page"
  cp "$page" "$page.bak.$TS"

  # Read server-only exports and client body
  server_exports="$(extract_server_exports < "$page" || true)"
  client_body="$(strip_server_exports_from_client < "$page")"

  # Ensure "use client" at very top of new client file
  if ! printf "%s" "$client_body" | grep -q '^[[:space:]]*"use client";'; then
    client_body='"use client";\n'"$client_body"
  fi

  # Write Client.tsx (idempotent backup if existed)
  [ -f "$client" ] && cp "$client" "$client.bak.$TS"
  printf "%b" "$client_body" > "$client"

  # Create minimal server wrapper page.tsx preserving server-only exports
  {
    printf "/** Server wrapper — generated %s */\n" "$TS"
    printf "import Client from \"./Client\";\n\n"
    # Keep server exports if any
    if [ -n "${server_exports// }" ]; then
      printf "%s\n\n" "$server_exports"
    fi
    cat <<'TSX'
export default function Page(_props: { searchParams?: Record<string, string | string[]> }) {
  return <Client />;
}
TSX
  } > "$page"

  say "✅ Wrapped to $client (backup: $(basename "$page").bak.$TS)"
}

main() {
  if [ ! -d "$ROOT_APP" ]; then
    say "❌ Not a Next.js App Router app: missing $ROOT_APP"; exit 1
  fi

  mapfile -t pages < <(find "$ROOT_APP" -type f -name 'page.tsx' | sort)
  if [ "${#pages[@]}" -eq 0 ]; then
    say "ℹ️  No page.tsx files found under $ROOT_APP"; exit 0
  fi

  # Wrap all client-y pages
  for p in "${pages[@]}"; do
    wrap_one_page "$p"
  done

  # Build from workspace (monorepo-aware)
  say "→ Clean build (workspace)"
  ( cd "$APP_DIR" && rm -rf .next && npm run build )
  say "✅ Build finished"
}

main "$@"
