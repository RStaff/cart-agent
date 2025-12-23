#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/index.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }
cp "$FILE" "$FILE.bak_$(date +%s)"

node - <<'NODE'
const fs = require("node:fs");

const file = "web/src/index.js";
let s = fs.readFileSync(file, "utf8");

if (s.includes("ABANDO_DEV_SIGN_ENDPOINT_BEGIN")) {
  console.log("ℹ️ Sign endpoint already present; no changes made.");
  process.exit(0);
}

const block = `
// ABANDO_DEV_SIGN_ENDPOINT_BEGIN
app.post("/__abando/sign", express.json({ limit: "2mb" }), async (req, res) => {
  try {
    if ((process.env.NODE_ENV || "").toLowerCase() !== "development") {
      return res.status(404).json({ error: "not_found" });
    }

    const token = String(process.env.ABANDO_DEV_SIGN_TOKEN || "");
    const got = String(req.get("x-abando-dev-token") || "");
    if (!token || got !== token) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const crypto = await import("node:crypto");
    const secret = String(process.env.SHOPIFY_API_SECRET || process.env.SHOPIFY_API_SECRET_KEY || "");
    if (!secret) return res.status(500).json({ error: "missing_shopify_secret" });

    const payload = req.body && typeof req.body.payload === "string" ? req.body.payload : "";
    const hmac_b64 = crypto.createHmac("sha256", secret).update(Buffer.from(payload, "utf8")).digest("base64");

    return res.json({ hmac_b64 });
  } catch (e) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
});
// ABANDO_DEV_SIGN_ENDPOINT_END
`;

const anchor = 'app.use(cookieParser());';
const idx = s.indexOf(anchor);
if (idx === -1) {
  console.error("❌ Could not find anchor 'app.use(cookieParser());' in web/src/index.js");
  process.exit(2);
}

s = s.slice(0, idx + anchor.length) + "\n" + block + "\n" + s.slice(idx + anchor.length);
fs.writeFileSync(file, s, "utf8");
console.log("✅ Added dev sign endpoint to web/src/index.js");
NODE

echo "✅ Patched. Now trigger nodemon restart via touch."
