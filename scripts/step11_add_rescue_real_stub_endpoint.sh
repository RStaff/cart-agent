#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

FILE="web/src/index.js"
cp "$FILE" "$FILE.bak_$(date +%s)" || true

node - <<'NODE'
const fs = require("fs");

const file = "web/src/index.js";
let s = fs.readFileSync(file, "utf8");

if (s.includes("/api/rescue/real")) {
  console.log("ℹ️ /api/rescue/real already present; skipping.");
  process.exit(0);
}

// Insert near other /api routes (safe: append near end before export/listen if possible)
const insert = `
/**
 * REAL rescue metrics (stub for now)
 * Returns a stable 200 so the UI can link it.
 */
app.get("/api/rescue/real", async (req, res) => {
  const shop = String(req.query.shop || "").trim() || "unknown";
  // In real mode, this will be backed by webhook-ingested events + DB.
  return res.json({
    kind: "real",
    shop,
    status: "not_ready",
    message: "Real metrics require webhook events + storage. Using stub response for now.",
    next: [
      "Install webhooks",
      "Persist events (abandoned checkout / order create)",
      "Compute recoveries + revenue",
    ],
  });
});
`;

// Try to place it after the preview route if it exists; else append before server listen.
if (s.includes('app.get("/api/rescue/preview"')) {
  s = s.replace(/(app\.get\(\"\/api\/rescue\/preview\"[\s\S]*?\n\}\);\n)/, `$1\n${insert}\n`);
} else if (s.includes("[server] listening")) {
  s = s + "\n" + insert + "\n";
} else {
  s = s + "\n" + insert + "\n";
}

fs.writeFileSync(file, s);
console.log("✅ Added /api/rescue/real stub route in", file);
NODE

echo "NEXT:"
echo "  restart: lsof -ti tcp:3000 | xargs -r kill -9; lsof -ti tcp:3001 | xargs -r kill -9"
echo "  then:    ./scripts/dev.sh example.myshopify.com"
echo "  verify:  curl -s 'http://localhost:3001/api/rescue/real?shop=example.myshopify.com' | jq ."
