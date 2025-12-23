#!/usr/bin/env bash
set -euo pipefail
FILE="web/src/index.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }
cp "$FILE" "$FILE.bak_$(date +%s)"

node - <<'NODE'
import fs from "node:fs";

const file = "web/src/index.js";
let s = fs.readFileSync(file, "utf8");

if (s.includes("ABANDO_DEBUG_ENV_ROUTE_BEGIN")) {
  console.log("ℹ️ Debug env route already present.");
  process.exit(0);
}

const marker = 'app.use("/api/webhooks", webhooksRouter);';
const idx = s.indexOf(marker);
if (idx === -1) {
  console.error("❌ Could not find webhook mount line in web/src/index.js");
  process.exit(2);
}

const block = `
// ABANDO_DEBUG_ENV_ROUTE_BEGIN
app.get("/__abando/debug-env", async (_req, res) => {
  try {
    const { createHash } = await import("node:crypto");
    const secret = String(process.env.SHOPIFY_API_SECRET || process.env.SHOPIFY_API_SECRET_KEY || "");
    const fp = secret ? createHash("sha256").update(secret, "utf8").digest("hex").slice(0, 12) : "(empty)";
    res.json({
      cwd: process.cwd(),
      node_env: process.env.NODE_ENV || null,
      has_SHOPIFY_API_SECRET: !!process.env.SHOPIFY_API_SECRET,
      has_SHOPIFY_API_SECRET_KEY: !!process.env.SHOPIFY_API_SECRET_KEY,
      secret_fp: fp,
      ABANDO_EVENT_INBOX: process.env.ABANDO_EVENT_INBOX || "",
      ABANDO_EVENT_INBOX_PATH: process.env.ABANDO_EVENT_INBOX_PATH || "",
    });
  } catch (e) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});
// ABANDO_DEBUG_ENV_ROUTE_END
`;

s = s.slice(0, idx) + block + "\n" + s.slice(idx);
fs.writeFileSync(file, s, "utf8");
console.log("✅ Added /__abando/debug-env route to web/src/index.js");
NODE

echo "✅ Patched. Now restart will happen via nodemon."
