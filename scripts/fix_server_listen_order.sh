#!/usr/bin/env bash
set -euo pipefail

ROOT="$HOME/projects/cart-agent"
SERVER="$ROOT/api/server.js"
TMP="$SERVER.tmp"

echo "🔧 Fixing express server route order in: $SERVER"

if [[ ! -f "$SERVER" ]]; then
  echo "❌ server.js not found."
  exit 1
fi

# Extract everything BEFORE app.listen
awk '
/app\.listen/ {
  listenLine = NR
}
{
  lines[NR] = $0
}
END {
  if (!listenLine) {
    print "⚠️ No app.listen found."
    for (i=1; i<=NR; i++) print lines[i]
    exit
  }

  print "🪓 Removing app.listen from line " listenLine

  # Print everything except the listen block
  for (i=1; i<=NR; i++) {
    if (i == listenLine) continue
    print lines[i]
  }

  print ""
  print "// --- Moved to bottom by fix_server_listen_order.sh ---"
  print "const PORT = process.env.PORT ? Number(process.env.PORT) : 10000;"
  print "app.listen(PORT, '0.0.0.0', () => {"
  print "  console.log(\`API listening on http://0.0.0.0:\${PORT}\`);"
  print "});"
}
' "$SERVER" > "$TMP"

mv "$TMP" "$SERVER"

cd "$ROOT"
git add api/server.js || true
git commit -m "Fix ordering: move app.listen() to bottom" || echo "(no changes)"

echo "✅ fix_server_listen_order.sh complete."
