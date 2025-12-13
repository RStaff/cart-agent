#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="$ROOT/web/src/index.js"

echo "🔍 Target: $TARGET"

# --- Step 0: restore a clean index.js (git first, else newest backup) ---
if command -v git >/dev/null 2>&1 && git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "🧼 Restoring web/src/index.js from git (source of truth)..."
  git -C "$ROOT" restore --staged --worktree -- "$TARGET" 2>/dev/null || true
  # If pathspec fails because git expects relative paths:
  git -C "$ROOT" restore --staged --worktree -- "web/src/index.js" 2>/dev/null || true
else
  echo "⚠️ Git not available; trying to restore from latest backup..."
  BAK="$(ls -1t "$TARGET".bak_* 2>/dev/null | head -n 1 || true)"
  if [[ -n "${BAK:-}" ]]; then
    cp "$BAK" "$TARGET"
    echo "✅ Restored from: $BAK"
  else
    echo "❌ No git + no backups found. Cannot safely restore $TARGET."
    exit 1
  fi
fi

# Quick syntax check (won't catch ESM import issues, but catches broken tokens)
echo "🧪 Sanity check parse (best-effort)..."
node --check "$TARGET" >/dev/null 2>&1 || {
  echo "❌ Still not parseable. Showing lines 70-110 to locate the break:"
  nl -ba "$TARGET" | sed -n '70,110p'
  exit 1
}

# --- Step 1: ensure proxy dep installed ---
echo "📦 Ensuring http-proxy-middleware in web/ ..."
pushd "$ROOT/web" >/dev/null
npm i http-proxy-middleware --save >/dev/null
popd >/dev/null

# --- Step 2: apply patch via a dedicated Node patcher (no heredoc quoting pitfalls) ---
PATCHER="$ROOT/scripts/_patch_proxy_ui.cjs"
cat <<'NODE' > "$PATCHER"
const fs = require("fs");

const target = process.argv[2];
let code = fs.readFileSync(target, "utf8");

// Remove any prior proxy block to make idempotent
code = code.replace(/\n\/\/ ✅ ABANDO_UI_PROXY[\s\S]*?\n(?=\n)/g, "");

// Ensure import exists
if (!code.includes('from "http-proxy-middleware"')) {
  const importRe = /^import .*?;\s*$/gm;
  let last = null, m;
  while ((m = importRe.exec(code))) last = { idx: m.index, len: m[0].length };
  if (!last) throw new Error("No import lines found; cannot place proxy import.");

  const insertAt = last.idx + last.len;
  code = code.slice(0, insertAt) +
    '\nimport { createProxyMiddleware } from "http-proxy-middleware";' +
    code.slice(insertAt);
}

// Insert after app init
const appInitRe = /(const\s+app\s*=\s*express\(\)\s*;?)/;
if (!appInitRe.test(code)) throw new Error("Could not find `const app = express()` to insert routes after.");

const insert =
`\n\n// ✅ ABANDO_UI_PROXY
// Serve the Next.js UI (running on :3001) THROUGH the Shopify backend origin (:3000)
// so embedded iframes + auth stay same-origin in dev.
app.get("/", (_req, res) => res.redirect(307, "/demo/playground"));

// Proxy UI routes
app.use("/demo", createProxyMiddleware({
  target: "http://localhost:3001",
  changeOrigin: true,
  ws: true,
  logLevel: "warn",
}));

app.use("/embedded", createProxyMiddleware({
  target: "http://localhost:3001",
  changeOrigin: true,
  ws: true,
  logLevel: "warn",
}));
`;

code = code.replace(appInitRe, `$1${insert}`);

fs.writeFileSync(target, code, "utf8");
console.log("✅ Proxy patch applied:", target);
NODE

node "$PATCHER" "$TARGET"
rm -f "$PATCHER"

echo "✅ Done."
echo "Next: run your stack:"
echo "  ./scripts/dev_stack_abando.sh"
