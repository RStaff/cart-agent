#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
FILE="$ROOT/web/src/index.js"

echo "🔧 Patch web-backend: add /api/webhooks/gdpr (GET/HEAD ok, POST verify)"
echo "📄 Target: $FILE"

test -f "$FILE" || { echo "❌ Missing file: $FILE"; exit 1; }

cp "$FILE" "$FILE.bak_$(date +%s)"
echo "🧾 Backup created."

# Ensure crypto import exists (CommonJS)
if ! grep -qE '^\s*const\s+crypto\s*=\s*require\("crypto"\)\s*;' "$FILE"; then
  # Insert after first require(...) line
  perl -0777 -i -pe 's/^(const\s+\w+\s*=\s*require\([^\n]+\);\s*\n)/$1const crypto = require("crypto");\n/m' "$FILE"
  echo "➕ Added crypto require"
fi

# Add GDPR webhook block once
if grep -qE 'Abando GDPR webhook endpoint' "$FILE"; then
  echo "✅ GDPR block already present. Skipping insert."
else
  cat >> "$FILE" <<'PATCH'

/**
 * === Abando GDPR webhook endpoint (Shopify compliance topics) ===
 * Shopify will POST customers/data_request, customers/redact, shop/redact here.
 * We also answer GET/HEAD for tunnel reachability tests.
 */
app.get("/api/webhooks/gdpr", (_req, res) => res.status(200).send("ok"));
app.head("/api/webhooks/gdpr", (_req, res) => res.status(200).end());

app.post(
  "/api/webhooks/gdpr",
  require("express").raw({ type: "*/*" }),
  (req, res) => {
    try {
      const secret = process.env.SHOPIFY_API_SECRET || "";
      if (!secret) return res.status(500).send("SHOPIFY_API_SECRET missing");

      const hmacHeader =
        req.get("x-shopify-hmac-sha256") || req.get("X-Shopify-Hmac-Sha256") || "";
      const body = req.body instanceof Buffer ? req.body : Buffer.from(req.body || "");

      const digest = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("base64");

      const a = Buffer.from(digest);
      const b = Buffer.from(hmacHeader);

      const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
      if (!ok) return res.status(401).send("Invalid HMAC");

      // Acknowledge immediately. (You can add real deletion/redaction logic later.)
      return res.status(200).send("ok");
    } catch (e) {
      console.error("[GDPR webhook] error:", e);
      return res.status(500).send("error");
    }
  }
);
PATCH
  echo "➕ Appended GDPR endpoint block"
fi

echo
echo "🔍 Confirm inserted routes:"
grep -nE 'Abando GDPR webhook endpoint|/api/webhooks/gdpr' "$FILE" | tail -n 40 || true

echo
echo "✅ Patch complete."
echo "🎯 Next:"
echo "  1) Stop and restart: shopify app dev"
echo "  2) curl -I https://oxide-intellectual-mpg-walking.trycloudflare.com/api/webhooks/gdpr"
