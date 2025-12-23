#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/routes/webhooks.js"
BACKUP="${FILE}.bak_rewrite_$(date +%s)"

echo "🧼 Rewriting $FILE (clean single-source webhook handler)..."
cp "$FILE" "$BACKUP" 2>/dev/null || true
echo "📦 Backup: $BACKUP"

cat <<'JS' > "$FILE"
import express from "express";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const router = express.Router();

/**
 * Canonical inbox target:
 *   <repoRoot>/web/.abando_webhook_inbox.jsonl
 *
 * Override policy:
 *   - ABANDO_EVENT_INBOX_PATH is honored ONLY if it is an absolute path.
 *   - Relative paths are ignored to prevent cwd drift (/ vs /web).
 */
function abandoRepoRoot() {
  const cwd = process.cwd();
  // If running from .../web, repoRoot is parent dir
  if (cwd.endsWith(path.sep + "web")) return cwd.slice(0, -4);
  return cwd;
}

function abandoInboxTarget() {
  const repoRoot = abandoRepoRoot();
  const canonical = path.resolve(repoRoot, "web", ".abando_webhook_inbox.jsonl");

  const raw = String(process.env.ABANDO_EVENT_INBOX_PATH || "").trim();
  if (raw && path.isAbsolute(raw)) return raw;

  return canonical;
}

function abandoInboxEnabled() {
  return String(process.env.ABANDO_EVENT_INBOX || "") === "1";
}

function sha256fp(s) {
  try {
    return crypto.createHash("sha256").update(String(s || ""), "utf8").digest("hex").slice(0, 12);
  } catch {
    return null;
  }
}

function payloadFp(buf) {
  try {
    return crypto.createHash("sha256").update(buf).digest("hex").slice(0, 12);
  } catch {
    return null;
  }
}

function writeInbox(stage, obj) {
  if (!abandoInboxEnabled()) return;

  const target = abandoInboxTarget();
  try {
    fs.mkdirSync(path.dirname(target), { recursive: true });
  } catch {}

  const base = (obj && typeof obj === "object") ? obj : { value: obj };
  const line = JSON.stringify({ ts: new Date().toISOString(), stage, ...base }) + "\n";

  try {
    fs.appendFileSync(target, line, "utf8");
  } catch {}
}

function timingSafeEqB64(a, b) {
  try {
    const ab = Buffer.from(String(a || ""), "utf8");
    const bb = Buffer.from(String(b || ""), "utf8");
    if (ab.length !== bb.length) return false;
    return crypto.timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

// Shopify sends JSON; we must verify HMAC against *raw* bytes.
router.post(
  "/",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const strict = String(process.env.ABANDO_HMAC_STRICT || "1") === "1";

    const topic = req.get("x-shopify-topic") || null;
    const shop = req.get("x-shopify-shop-domain") || null;
    const webhookId = req.get("x-shopify-webhook-id") || null;
    const triggeredAt = req.get("x-shopify-triggered-at") || null;

    const hmacHeader = req.get("x-shopify-hmac-sha256") || "";
    const secret = String(
      process.env.SHOPIFY_API_SECRET ||
      process.env.SHOPIFY_API_SECRET_KEY ||
      ""
    );

    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");
    const computed = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("base64");

    const ok = timingSafeEqB64(hmacHeader, computed);

    // Always emit received (even on strict fail)
    writeInbox("received", {
      method: req.method,
      url: req.originalUrl || req.url || null,
      topic,
      shop,
      webhook_id: webhookId,
      triggered_at: triggeredAt,
      bytes: rawBody.length || 0,
      has_hmac: !!hmacHeader,
      secret_fp: sha256fp(secret),
      payload_fp: payloadFp(rawBody),
    });

    if (!ok) {
      writeInbox("hmac_failed", {
        method: req.method,
        url: req.originalUrl || req.url || null,
        topic,
        shop,
        webhook_id: webhookId,
        strict,
      });

      if (strict) {
        // Shopify will retry on non-200; strict mode is for correctness.
        return res.status(401).type("text/plain").send("invalid hmac");
      }
      // Non-strict: continue as if verified (dev convenience).
    }

    // Verified stage (only if ok OR strict disabled)
    writeInbox("verified", {
      method: req.method,
      url: req.originalUrl || req.url || null,
      topic,
      shop,
      webhook_id: webhookId,
      triggered_at: triggeredAt,
      bytes: rawBody.length || 0,
      has_hmac: !!hmacHeader,
      hmac_ok: ok,
      strict,
    });

    // Canonical OK send marker
    writeInbox("handler_ok_send", {
      method: req.method,
      url: req.originalUrl || req.url || null,
      topic,
      shop,
      webhook_id: webhookId,
      has_hmac: !!hmacHeader,
    });

    return res.status(200).type("text/plain").send("ok");
  }
);

export default router;
JS

echo "🔎 node --check..."
node --check "$FILE"
echo "✅ node --check passed."

echo "🔁 Nudge restart..."
touch "$FILE" 2>/dev/null || true

echo "✅ Rewrite complete."
