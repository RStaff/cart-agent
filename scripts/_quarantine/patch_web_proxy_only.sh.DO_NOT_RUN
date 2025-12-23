#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB="$ROOT/web"
TARGET="$WEB/src/index.js"
PROXY_MOD="$WEB/src/abando_ui_proxy.mjs"

echo "🔧 Abando proxy-only patch"
echo "ROOT: $ROOT"
echo "WEB : $WEB"
echo "FILE: $TARGET"
echo ""

if [ ! -f "$TARGET" ]; then
  echo "❌ Not found: $TARGET"
  exit 1
fi

echo "📦 Ensuring http-proxy-middleware is installed in web/ ..."
(
  cd "$WEB"
  if npm ls http-proxy-middleware >/dev/null 2>&1; then
    echo "✅ http-proxy-middleware already installed"
  else
    echo "➕ Installing http-proxy-middleware..."
    npm i http-proxy-middleware
  fi
)

echo "🧩 Writing proxy module: $PROXY_MOD"
cat > "$PROXY_MOD" <<'MOD'
import { createProxyMiddleware } from "http-proxy-middleware";

/**
 * Proxy ONLY the UI routes to Next.js (default :3001).
 * This keeps Shopify's embedded iframe origin on :3000 while serving UI from :3001.
 */
export function attachAbandoUiProxy(app) {
  const target = process.env.ABANDO_UI_ORIGIN || "http://localhost:3001";

  // Proxy UI-only paths. Do NOT proxy /api or Shopify auth routes.
  const uiPaths = ["/embedded", "/demo"];

  app.use(
    uiPaths,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      ws: true,
      xfwd: true,
      // keep the path as-is (Next expects /embedded and /demo/...)
      // default behavior already preserves path
      logLevel: process.env.ABANDO_PROXY_LOG_LEVEL || "silent",
      onProxyReq(proxyReq) {
        // Some dev setups benefit from forcing Host header to the target.
        // (Safe in dev; remove later if you dislike it.)
        proxyReq.setHeader("host", target.replace(/^https?:\/\//, ""));
      },
    })
  );

  // Helpful console line
  // eslint-disable-next-line no-console
  console.log(`[ABANDO_UI_PROXY] UI -> ${target} for ${uiPaths.join(", ")}`);
}
MOD

echo "🧠 Patching $TARGET (inject/replace ABANDO_UI_PROXY block)..."

node <<'NODE'
import fs from "fs";

const target = process.env.TARGET;
if (!target) throw new Error("TARGET env var missing");

let code = fs.readFileSync(target, "utf8");

// Backup
const backup = `${target}.bak_${Date.now()}`;
fs.writeFileSync(backup, code, "utf8");

// Remove any previous ABANDO_UI_PROXY block (old/broken patches)
code = code.replace(
  /\/\/\s*---\s*ABANDO_UI_PROXY[\s\S]*?\/\/\s*---\s*\/ABANDO_UI_PROXY\s*---\s*\n?/g,
  ""
);

// Proxy-only block (no template strings; safe for patching)
const block =
`// --- ABANDO_UI_PROXY (proxy-only) ---
if (process.env.ABANDO_UI_PROXY !== "0") {
  const mod = await import("./abando_ui_proxy.mjs");
  mod.attachAbandoUiProxy(app);
}
// --- /ABANDO_UI_PROXY ---
`;

// Insert block immediately after app creation.
// Try common patterns first; fall back to first `express()` app assignment.
let inserted = false;

// Pattern 1: const app = express();
code = code.replace(/(\bconst\s+app\s*=\s*express\(\)\s*;\s*\n)/, (m, g1) => {
  inserted = true;
  return g1 + block + "\n";
});

// Pattern 2: const app = express();
if (!inserted) {
  code = code.replace(/(\bconst\s+app\s*=\s*express\(\)\s*\n)/, (m, g1) => {
    inserted = true;
    return g1 + block + "\n";
  });
}

// Pattern 3: const app = express().use(...);  or let app = express();
if (!inserted) {
  code = code.replace(/(\b(?:const|let|var)\s+app\s*=\s*express\([^\)]*\)\s*;?\s*\n)/, (m, g1) => {
    inserted = true;
    return g1 + block + "\n";
  });
}

if (!inserted) {
  throw new Error(
    "Could not find where the Express app is created (no `const app = express()` match). " +
    "Paste `sed -n '1,140p web/src/index.js'` and we’ll patch with the right anchor."
  );
}

fs.writeFileSync(target, code, "utf8");
console.log("✅ Patch applied.");
console.log("🗄️ Backup:", backup);
NODE
TARGET="$TARGET" node -e "process.exit(0)" >/dev/null 2>&1 || true

echo ""
echo "✅ Proxy-only patch complete."
echo ""
echo "Next:"
echo "  1) STOP everything running on 3000/3001"
echo "  2) Start your stack: ./scripts/dev_stack_abando.sh"
echo ""
echo "Sanity checks (expected):"
echo "  curl -sI http://localhost:3000/embedded | head -n 12   # should be 200 (Next.js via proxy)"
echo "  curl -sI http://localhost:3000/demo/playground | head -n 12  # should be 200 (Next.js via proxy)"
echo "  curl -sI http://localhost:3001/demo/playground | head -n 12  # should be 200 (direct UI)"
