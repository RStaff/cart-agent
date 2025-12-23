#!/usr/bin/env bash
set -euo pipefail

FILE="web/start.mjs"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

BK="$FILE.bak_$(date +%Y%m%d_%H%M%S)"
cp "$FILE" "$BK"
echo "✅ Backup: $BK"

# 1) Ensure we have a harmless "keep-alive" helper (only insert once)
if ! grep -q "function __abandoKeepAlive" "$FILE"; then
  perl -0777 -i -pe 's|(const PORT\s*=.*?\n)|$1\n// [ABANDO] keep process alive when we intentionally do not (re)bind\nfunction __abandoKeepAlive() {\n  setInterval(() => {}, 1 << 30);\n}\n\n|s' "$FILE"
fi

# 2) Guard: if a global server already exists & is listening, do NOT try to listen again
# Insert right before server.listen(...) call (best-effort).
if ! grep -q "__ABANDO_SINGLETON_GUARD__" "$FILE"; then
  perl -i -pe '
    if (!$done && /server\.listen\(/) {
      print "// __ABANDO_SINGLETON_GUARD__\n";
      print "if (globalThis.__server && globalThis.__server.listening) {\n";
      print "  console.log(\"[start] server already listening; skipping re-listen\");\n";
      print "  __abandoKeepAlive();\n";
      print "  return;\n";
      print "}\n\n";
      $done=1;
    }
    print;
  ' "$FILE" > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"
fi

# 3) Make EADDRINUSE non-fatal (exit 0 instead of crashing nodemon)
# Replace any existing EADDRINUSE handler to exit(0) and keep-alive.
perl -0777 -i -pe '
  s/server\.on\(\x27error\x27,\s*\(err\)\s*=>\s*\{.*?\}\);\n/
server.on(\x27error\x27, (err) => {\n  if (err && err.code === \x27EADDRINUSE\x27) {\n    console.error(\x22[start] EADDRINUSE: port already in use; treating as already-running (no crash)\x22);\n    // Exit cleanly so nodemon does not mark as a crash loop.\n    process.exit(0);\n  }\n  console.error(\x22[start] server error:\x22, err);\n  process.exit(1);\n});\n/sms
' "$FILE" || true

echo
echo "✅ Patched: $FILE"
echo
echo "--- start.mjs key lines ---"
grep -nE "__ABANDO_SINGLETON_GUARD__|__abandoKeepAlive|EADDRINUSE|server\.listen|server\.on\('error'" "$FILE" || true

echo
echo "NEXT:"
echo "  1) lsof -ti tcp:3000 | xargs -r kill -9; lsof -ti tcp:3001 | xargs -r kill -9"
echo "  2) ./scripts/dev.sh cart-agent-dev.myshopify.com"
echo "  3) tail -n 120 .dev_express.log"
