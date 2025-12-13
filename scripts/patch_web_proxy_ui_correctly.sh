#!/usr/bin/env bash
set -euo pipefail

TARGET="web/src/index.js"
echo "🧩 Patching UI proxy into: $TARGET"

if [ ! -f "$TARGET" ]; then
  echo "❌ Not found: $TARGET"
  exit 1
fi

cp "$TARGET" "$TARGET.bak_$(date +%s)"

python3 - <<'PY'
import re, pathlib

p = pathlib.Path("web/src/index.js")
code = p.read_text(encoding="utf-8")

# 1) Remove any prior Abando proxy/redirect blocks we inserted before
code = re.sub(r"\n// ✅ ABANDO_UI_PROXY_START\n.*?\n// ✅ ABANDO_UI_PROXY_END\n", "\n", code, flags=re.S)

# 2) Ensure http-proxy-middleware import exists (ESM-safe)
# We'll add a default import and alias createProxyMiddleware from it.
if "http-proxy-middleware" not in code:
    # insert after first import line (or at top)
    m = re.search(r"(^import .*?$)", code, flags=re.M)
    ins = 'import hpm from "http-proxy-middleware";\nconst { createProxyMiddleware } = hpm;\n'
    if m:
        # place after the first import block line
        idx = m.end()
        code = code[:idx] + "\n" + ins + code[idx:]
    else:
        code = ins + "\n" + code

# If it's already imported as named, normalize to the ESM-safe pattern
code = re.sub(
    r'import\s+\{\s*createProxyMiddleware\s*\}\s+from\s+"http-proxy-middleware";\s*',
    'import hpm from "http-proxy-middleware";\nconst { createProxyMiddleware } = hpm;\n',
    code
)

# 3) Build the proxy block (must be BEFORE Shopify auth/catchalls)
proxy_block = """
// ✅ ABANDO_UI_PROXY_START
// Port 3000 = Shopify backend (Express)
// Port 3001 = Next.js UI
// We proxy UI routes through :3000 so Shopify iframe stays same-origin.

const __abandoUiProxy = createProxyMiddleware({
  target: "http://localhost:3001",
  changeOrigin: true,
  ws: true,
  logLevel: "silent",
});

// Root goes to demo playground (relative, same-origin)
app.get("/", (_req, res) => res.redirect(307, "/demo/playground"));

// Proxy UI routes + Next assets through :3000
app.use("/demo", __abandoUiProxy);
app.use("/embedded", __abandoUiProxy);
app.use("/_next", __abandoUiProxy);
app.use("/favicon.ico", __abandoUiProxy);
app.use("/robots.txt", __abandoUiProxy);
// ✅ ABANDO_UI_PROXY_END
""".strip("\n") + "\n"

# 4) Insert proxy block immediately after app initialization
# match: const app = express(); OR const app = express()
m = re.search(r"(const\s+app\s*=\s*express\(\)\s*;?)", code)
if not m:
    raise SystemExit("❌ Could not find `const app = express()` in web/src/index.js")

insert_at = m.end()
code = code[:insert_at] + "\n" + proxy_block + code[insert_at:]

p.write_text(code, encoding="utf-8")
print("✅ Patch applied to web/src/index.js")
PY

echo "✅ Done."
echo ""
echo "Next: ensure dependency exists (safe to re-run):"
echo "  cd web && npm i http-proxy-middleware"
echo ""
echo "Then run your dev stack:"
echo "  cd .. && ./scripts/dev_stack_abando.sh"
