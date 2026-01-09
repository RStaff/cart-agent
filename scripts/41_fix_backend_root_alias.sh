#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/index.js"
TS="$(date +%Y%m%d_%H%M%S)"

cp "$FILE" "$FILE.bak_$TS"
echo "🧷 Backup created: $FILE.bak_$TS"

perl -0777 -i -pe '
s@// ABANDO_DEV_PROXY_START@// ABANDO_DEV_PROXY_START
app.get("/", (req, res) => {
  req.url = "/embedded";
  app.handle(req, res);
});
@ if $. == 1
' "$FILE"

echo "✅ Backend root now serves /embedded directly (no redirect)"
