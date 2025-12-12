#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="$ROOT/web/src/index.js"

if [ ! -f "$TARGET" ]; then
  echo "❌ Not found: $TARGET"
  exit 1
fi

echo "🧩 Patching $TARGET (proxy-only attach)..."

# Backup
cp "$TARGET" "$TARGET.bak_$(date +%s)"

node <<'NODE'
const fs = require("fs");

const target = "web/src/index.js";
let code = fs.readFileSync(target, "utf8");

const needle = "const app = express();";
const insert =
`${needle}

// ---- UI PROXY (MUST COME FIRST) ----
const { attachUiProxy } = await import("./ui-proxy.mjs");
attachUiProxy(app);
// ---- END UI PROXY ----
`;

if (!code.includes(needle)) {
  console.error("❌ Could not find: " + needle);
  process.exit(1);
}

if (code.includes("attachUiProxy(app)")) {
  console.log("✅ Proxy attach already present. No changes made.");
  process.exit(0);
}

// Replace only the first occurrence
code = code.replace(needle, insert);

fs.writeFileSync(target, code, "utf8");
console.log("✅ Patch applied successfully.");
NODE

echo "✅ Done."
