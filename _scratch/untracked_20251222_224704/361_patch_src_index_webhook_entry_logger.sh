#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/index.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }
cp "$FILE" "$FILE.bak_$(date +%s)"

node - <<'NODE'
import fs from "node:fs";

const file = "web/src/index.js";
let s = fs.readFileSync(file, "utf8");

if (!s.includes("ABANDO_WEBHOOK_ENTRY_LOGGER_BEGIN")) {
  const marker = 'app.use("/api/webhooks", webhooksRouter);';

  const idx = s.indexOf(marker);
  if (idx === -1) {
    console.error("❌ Could not find webhook mount line in web/src/index.js");
    process.exit(2);
  }

  const block = `
// ABANDO_WEBHOOK_ENTRY_LOGGER_BEGIN
app.use("/api/webhooks", (req, _res, next) => {
  try {
    // keep it dependency-free + ESM-safe
    import("node:crypto").then(({ createHash }) => {
      const secret = String(process.env.SHOPIFY_API_SECRET || process.env.SHOPIFY_API_SECRET_KEY || "");
      const fp = createHash("sha256").update(secret, "utf8").digest("hex").slice(0, 12);
      console.log("[abando][WEBHOOK_ENTRY]", req.method, req.originalUrl || req.url, {
        has_topic: !!req.get("x-shopify-topic"),
        has_shop: !!req.get("x-shopify-shop-domain"),
        has_hmac: !!req.get("x-shopify-hmac-sha256"),
        secret_fp: fp,
      });
    }).catch(() => {});
  } catch (_e) {}
  next();
});
// ABANDO_WEBHOOK_ENTRY_LOGGER_END
`;

  s = s.slice(0, idx) + block + "\n" + s.slice(idx);
  fs.writeFileSync(file, s, "utf8");
  console.log("✅ Patched web/src/index.js with webhook entry logger.");
} else {
  console.log("ℹ️ Logger already present; no changes made.");
}
NODE
