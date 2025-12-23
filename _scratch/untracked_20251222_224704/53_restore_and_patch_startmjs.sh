#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
FILE="web/start.mjs"

test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

echo "🔧 Restoring + patching $FILE"
echo "Root: $ROOT"

# Find newest backup
BK="$(ls -t web/start.mjs.bak_* 2>/dev/null | head -n 1 || true)"
if [ -z "${BK:-}" ]; then
  echo "❌ No backup found (web/start.mjs.bak_*)"
  echo "   List: ls -la web/start.mjs.bak_*"
  exit 1
fi

echo "✅ Found backup: $BK"
cp "$BK" "$FILE"
echo "✅ Restored $FILE from $BK"

# Patch using node (safer than perl)
node - <<'NODE'
const fs = require("fs");

const file = "web/start.mjs";
let s = fs.readFileSync(file, "utf8");

// Ensure keep-alive helper exists
if (!s.includes("function __abandoKeepAlive")) {
  s = s.replace(
    /(const\s+PORT\s*=.*?\n)/,
    `$1\n// [ABANDO] keep process alive when we intentionally do not (re)bind\nfunction __abandoKeepAlive() {\n  setInterval(() => {}, 1 << 30);\n}\n\n`
  );
}

// Replace server error handler if present; otherwise insert one.
// Goal: EADDRINUSE => log + keep process alive (NO exit, NO throw)
const handler =
`server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error('[start] EADDRINUSE: port already in use; treating as already-running (no crash)');
    __abandoKeepAlive();
    return;
  }
  console.error('[start] server error:', err);
  process.exit(1);
});
`;

// Try to replace any existing server.on('error', ...) block
const re = /server\.on\(\s*['"]error['"]\s*,[\s\S]*?\);\s*/m;
if (re.test(s)) {
  s = s.replace(re, handler + "\n");
} else {
  // Insert after server creation if we can find it, else append near top
  if (s.includes("const server")) {
    s = s.replace(/(const\s+server\s*=.*?\n)/, `$1\n${handler}\n`);
  } else {
    s = handler + "\n" + s;
  }
}

// Remove any accidental process.exit(0) that may have been inserted previously
s = s.replace(/process\.exit\(\s*0\s*\);\s*/g, "__abandoKeepAlive();\n");

// Write back
fs.writeFileSync(file, s, "utf8");

console.log("✅ Patched web/start.mjs");
NODE

echo
echo "--- start.mjs quick check ---"
grep -nE "__abandoKeepAlive|EADDRINUSE|server\.on\('error'|server\.listen" "$FILE" || true

echo
echo "NEXT:"
echo "  1) lsof -ti tcp:3000 | xargs -r kill -9; lsof -ti tcp:3001 | xargs -r kill -9"
echo "  2) ./scripts/dev.sh cart-agent-dev.myshopify.com"
echo "  3) curl -fsS 'http://localhost:3000/api/billing/status?shop=cart-agent-dev.myshopify.com' | cat"
