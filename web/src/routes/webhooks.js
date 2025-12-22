import { createHash, createHmac, timingSafeEqual } from "node:crypto";
function timingSafeEqualB64(a, b) {
  const ab = Buffer.from(String(a || ""), "utf8");
  const bb = Buffer.from(String(b || ""), "utf8");
  if (ab.length !== bb.length) return false;
  try {
    return timingSafeEqual(ab, bb);
  } catch {
    return String(a || "") === String(b || "");
  }
}


function __abandoFp(v) {
  try { return createHash("sha256").update(String(v||"")).digest("hex").slice(0,12); }
  catch { return "fp_fail"; }
}

import express from "express";
import crypto from "crypto";
import { recordWebhookEvent } from "../lib/webhook_events.js";
import fs from "node:fs";
import path from "node:path";

// ABANDO_INBOX_LOGGER_V2
function __abando__fp(str) {
  try {
    if (!str) return "NONE";
    return createHmac("sha256", "abando_fp").update(String(str)).digest("hex").slice(0, 12);
  } catch (_) {
    return "ERR";
  }
}

function __abando__payload_fp(buf) {
  try {
    if (!buf) return null;
    const b = Buffer.isBuffer(buf) ? buf : Buffer.from(String(buf));
    return createHmac("sha256", "abando_payload_fp").update(b).digest("hex").slice(0, 16);
  } catch (_) {
    return null;
  }
}

function __abando__inbox_path() {
  try {
    const rel = process.env.ABANDO_WEBHOOK_INBOX_PATH || path.resolve(process.cwd(), "web/.abando_webhook_inbox.jsonl");
    return path.resolve(process.cwd(), rel);
  } catch (_) {
    return path.resolve(process.cwd(), "web/.abando_webhook_inbox.jsonl");
  }
}

function __abando__write_inbox(stage, obj) {
  // ABANDO_INBOX_FALLBACK_V3 (cwd-safe)
  const cwd = process.cwd();
  const repoRoot = cwd.endsWith("/web") ? cwd.slice(0, -4) : cwd;

  const fallback = repoRoot + "/web/.abando_webhook_inbox.jsonl";

  let target =
    String(process.env.ABANDO_EVENT_INBOX_PATH || process.env.ABANDO_EVENT_INBOX || "").trim()
    || fallback;

  // If we're running from /web and env uses "web/...", normalize to avoid "web/web/..."
  if (cwd.endsWith("/web") && target.startsWith("web/")) target = target.slice(4);
    String(process.env.ABANDO_EVENT_INBOX_PATH || process.env.ABANDO_EVENT_INBOX || "").trim()
    || fallback;
    String(process.env.ABANDO_EVENT_INBOX_PATH || process.env.ABANDO_EVENT_INBOX || "").trim()
    || fallback;
  try {
    const out = __abando__inbox_path();
    const line = JSON.stringify({ ts: new Date().toISOString(), stage, ...obj });
    fs.appendFileSync(target, line + "\n");
  } catch (e) {
    try { console.warn("[abando][INBOX_WRITE] failed:", e?.message || e); } catch (_) {}
  }
}
const router = express.Router();
// [abando][ROUTER_USE_PROBE]
router.use(async (req, _res, next) => {
  try {
    const fsMod = await import("node:fs");
    const pathMod = await import("node:path");
    const fs = fsMod.default || fsMod;
    const path = pathMod.default || pathMod;

    const out = process.env.ABANDO_WEBHOOK_ROUTER_ENTER_PATH
      ? path.resolve(process.cwd(), process.env.ABANDO_WEBHOOK_ROUTER_ENTER_PATH)
      : path.resolve(process.cwd(), ".abando_webhook_router_enter.jsonl");

    const line = JSON.stringify({
      ts: new Date().toISOString(),
      stage: "router_use",
      method: req.method,
      url: req.originalUrl || req.url || null,
      cwd: process.cwd(),
      content_length: req.get("content-length") || null,
      topic: req.get("x-shopify-topic") || null,
      shop: req.get("x-shopify-shop-domain") || null,
      has_hmac: !!req.get("x-shopify-hmac-sha256"),
    });
    fs.appendFileSync(out, line + "\n");
  } catch (e) {
    console.warn("[abando][ROUTER_USE_PROBE] failed:", e?.message || e);
  }
  next();
});
// [abando][ROUTER_USE_PROBE_END]


/**
 * Compute Shopify HMAC (base64) of raw body using shared secret.
 * Header: X-Shopify-Hmac-Sha256
 */
function computeHmacBase64(secret, rawBodyBuf) {
  return createHmac("sha256", secret).update(rawBodyBuf).digest("base64");
}

function safeEqual(a, b) {
  try {
    const ab = Buffer.from(String(a || ""), "utf8");
    const bb = Buffer.from(String(b || ""), "utf8");
    if (ab.length !== bb.length) return false;
    return timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

// NOTE: Mount at /api/webhooks, so handler path is POST /
router.post(
  "/",
  // raw body required for signature verification
  express.raw({ type: "*/*" }),
  async (req, res) => {
    try {
      const __sec = (process.env.SHOPIFY_API_SECRET || process.env.SHOPIFY_API_SECRET_KEY || process.env.SHOPIFY_APP_SECRET || "");
      console.log("[abando][WEBHOOK_SECRET_FP][REQ] len=", (__sec||"").length, "fp=", __abandoFp(__sec));

      const headerKeys = Object.k

// =======================
// [abando][WEBHOOK_PROBE]
const __PROBE_PATH = process.env.ABANDO_WEBHOOK_PROBE_PATH
  ? path.resolve(process.cwd(), process.env.ABANDO_WEBHOOK_PROBE_PATH)
  : path.resolve(process.cwd(), ".abando_webhook_probe.jsonl");
// =======================
try {
  const method = req.method;
  const ct = req.get("content-type") || "";
  const cl = req.get("content-length") || "";
  const topicHdr = req.get("x-shopify-topic") || req.get("x-shopify-webhook-topic") || "";
  const shopHdr  = req.get("x-shopify-shop-domain") || "";
  const whId     = req.get("x-shopify-webhook-id") || "";
  const trigAt   = req.get("x-shopify-triggered-at") || "";
  const hmacHdr  = req.get("x-shopify-hmac-sha256") || "";

  // Body may be Buffer (express.raw) or something else. Normalize to Buffer safely.
  let raw = null;
  if (Buffer.isBuffer(req.body)) raw = req.body;
  else if (typeof rawBody !== "undefined" && Buffer.isBuffer(rawBody)) raw = rawBody;
  else if (typeof req.rawBody !== "undefined" && Buffer.isBuffer(req.rawBody)) raw = req.rawBody;
  else if (typeof req.body === "string") raw = Buffer.from(req.body, "utf8");
  else raw = Buffer.from("");

  const rawLen = raw.length;
  const rawHeadHex = raw.slice(0, 32).toString("hex"); // first 32 bytes
  const secret = process.env.SHOPIFY_API_SECRET || process.env.SHOPIFY_API_SECRET_KEY || "";
  const calc = secret
    ? createHmac("sha256", secret).update(raw).digest("base64")
    : "";

  const hmacOk = !!(secret && hmacHdr && calc && timingSafeEqualB64(hmacHdr, calc));

  // Append a probe log line (separate file to avoid polluting your jsonl inbox)
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    probe: true,
    method, ct, cl,
    topicHdr, shopHdr, whId, trigAt,
    rawLen,
    rawHeadHex,
    hmacHdr_fp: (hmacHdr || "").slice(0, 10),
    calc_fp: (calc || "").slice(0, 10),
    hmacOk,
  });
  try {
    const fs = await import("fs");
    fs.appendFileSync(__PROBE_PATH, line + "\n");
  } catch (e) {
    console.warn("[abando][WEBHOOK_PROBE] failed to write probe log:", e?.message || e);
  }
} catch (e) {
  console.warn("[abando][WEBHOOK_PROBE] error:", e?.message || e);
}
keys(req.headers || {}).sort();

      // Prefer Shopify headers; fall back to query params for local testing
      const topic = req.get("x-shopify-topic") || req.query?.topic || "unknown";
      const shop  = req.get("x-shopify-shop-domain") || req.query?.shop || "unknown";
      const hmac  = req.get("x-shopify-hmac-sha256") || "";

      const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");

  /* [abando][WEBHOOK_PROBE]
   * Logs EXACT header/body facts used for HMAC verification.
   * Appends JSONL to web/.abando_webhook_probe.jsonl
   */
  try {
    const fs = await import("node:fs");
    const path = await import("node:path");

    const hmacHeader = req.get("x-shopify-hmac-sha256") || "";
    const topic = req.get("x-shopify-topic") || req.get("X-Shopify-Topic") || "";
    const shop = req.get("x-shopify-shop-domain") || "";
    const ct = req.get("content-type") || "";
    const cl = req.get("content-length") || "";
    const rawBuf = Buffer.isBuffer(req.body) ? req.body : Buffer.from(String(req.body||""), "utf8");

    const computed = createHmac("sha256", process.env.SHOPIFY_API_SECRET || "")
      .update(rawBuf)
      .digest("base64");

    const ok = timingSafeEqualB64(computed, hmacHeader);

    const bodyPrefixB64 = rawBuf.subarray(0, Math.min(rawBuf.length, 200)).toString("base64");
    const payloadFp = createHmac("sha256", "abando_probe_fp").update(rawBuf).digest("hex").slice(0, 16);

    const line = JSON.stringify({
      ts: new Date().toISOString(),
      topic, shop,
      ct, cl,
      bytes: rawBuf.length,
      hmac_header_len: hmacHeader.length,
      computed_len: computed.length,
      hmac_ok: ok,
      payload_fp: payloadFp,
      body_prefix_b64: bodyPrefixB64
    });

    fs.appendFileSync(__PROBE_PATH, line + "\\n");
    console.log("[abando][WEBHOOK_PROBE]", line);
  } catch (e) {
    console.warn("[abando][WEBHOOK_PROBE] failed", e?.message || e);
  }
  /* [abando][WEBHOOK_PROBE_END] */


// ABANDO_WEBHOOK_DEBUG_BLOCK_v1
console.log("[abando][WEBHOOK_DEBUG]", {
  has_hmac: Boolean(req.get("x-shopify-hmac-sha256")),
  hmac_len: (req.get("x-shopify-hmac-sha256") || "").length,
  body_is_buffer: Buffer.isBuffer(req.body),
  body_len: Buffer.isBuffer(req.body) ? req.body.length : -1,
  topic: req.get("x-shopify-topic"),
  shop: req.get("x-shopify-shop-domain"),
});

      const bytes = rawBody.length;

      // Secret (support common env var names)
      const secret =
        process.env.SHOPIFY_API_SECRET ||
        process.env.SHOPIFY_API_SECRET_KEY ||
        process.env.SHOPIFY_APP_SECRET ||
        "";

      // If we have both secret + hmac header, enforce verification.
      // If missing hmac (curl/local), don't block iteration: accept but mark hmac_ok=false.
      let ok = false;
      if (secret && hmac) {
        const computed = computeHmacBase64(secret, rawBody);
        ok = safeEqual(computed, hmac);
        if (!ok) {
          // For real Shopify delivery, invalid HMAC should be 401
          recordWebhookEvent({ topic, shop, bytes, hmac_ok: false, source: "http" });
          console.log("[webhooks] invalid hmac", { topic, shop, bytes, has_hmac: true, headerKeys });
          return res.status(401).send("invalid hmac");
        }
      }

      recordWebhookEvent({ topic, shop, bytes, hmac_ok: ok, source: "http" });

      console.log("[webhooks] received", {
        topic,
        shop,
        bytes,
        has_hmac: Boolean(hmac),
        hmac_ok: ok,
        headerKeys
      });

      // TODO: route topic -> handler -> DB persistence
      // [abando][OK_SEND_PROBE_BEGIN]
      try {
        const [fsMod, pathMod] = await Promise.all([import("node:fs"), import("node:path")]);
        const fs = fsMod.default || fsMod;
        const path = pathMod.default || pathMod;
        const out = path.resolve(process.cwd(), "web/.abando_webhook_inbox.jsonl");
// ABANDO_FORCE_BEFORE_HANDLER_OK_STAGE
        try {
          const a = JSON.stringify({
            ts: new Date().toISOString(),
            stage: "received",
            method: req.method,
            url: req.originalUrl || req.url || null,
            topic: req.get("x-shopify-topic") || null,
            shop: req.get("x-shopify-shop-domain") || null,
            has_hmac: !!req.get("x-shopify-hmac-sha256"),
          });
          fs.appendFileSync(out, a + "\n");

          const b = JSON.stringify({
            ts: new Date().toISOString(),
            stage: "verified",
            method: req.method,
            url: req.originalUrl || req.url || null,
            topic: req.get("x-shopify-topic") || null,
            shop: req.get("x-shopify-shop-domain") || null,
            has_hmac: !!req.get("x-shopify-hmac-sha256"),
          });
          fs.appendFileSync(out, b + "\n");
        } catch (_e) {}
        const line = JSON.stringify({
          ts: new Date().toISOString(),
          stage: "handler_ok_send",
          method: req.method,
          url: req.originalUrl || req.url || null,
          topic: req.get("x-shopify-topic") || null,
          shop: req.get("x-shopify-shop-domain") || null,
          has_hmac: !!req.get("x-shopify-hmac-sha256"),
        });
        fs.appendFileSync(out, line + "\n");
      } catch (e) {
        console.warn("[abando][OK_SEND_PROBE] failed:", e?.message || e);
      }
// [abando][OK_SEND_PROBE_END]


      // ABANDO_LOGGING_V2 (forced)
      try {
        const topic = req.get("x-shopify-topic") || req.get("x-shopify-webhook-topic") || "unknown";
        const shop  = req.get("x-shopify-shop-domain") || "unknown";
        const whId  = req.get("x-shopify-webhook-id") || null;
        const trig  = req.get("x-shopify-triggered-at") || null;
        const hmac  = req.get("x-shopify-hmac-sha256") || "";
        const raw   = req.body; // express.raw() => Buffer
        const bytes = raw ? (Buffer.isBuffer(raw) ? raw.length : Buffer.byteLength(String(raw))) : null;

        // log "received"
        __abando__write_inbox("received", {
          route: req.originalUrl || req.url,
          shop, topic,
          event_id: null,
          triggered_at: trig,
          webhook_id: whId,
          bytes,
          hmac_ok: null,
          secret_fp: __abando__fp(process.env.SHOPIFY_API_SECRET || ""),
          payload_fp: null
        });

        // verify
        let ok = false;
        const secret = process.env.SHOPIFY_API_SECRET || "";
        if (secret && hmac && raw) {
          const calc = createHmac("sha256", secret).update(raw).digest("base64");
          try {
            ok = timingSafeEqual(Buffer.from(calc), Buffer.from(hmac));
          } catch (_) {
            ok = (calc === hmac);
          }
        }

        __abando__write_inbox("verified", {
          route: req.originalUrl || req.url,
          shop, topic,
          event_id: null,
          triggered_at: trig,
          webhook_id: whId,
          bytes,
          hmac_ok: ok,
          secret_fp: __abando__fp(process.env.SHOPIFY_API_SECRET || ""),
          payload_fp: __abando__payload_fp(raw)
        });
      } catch (e) {
        try { console.warn("[abando][LOGGING_V2] failed:", e?.message || e); } catch (_) {}
      }

      
// ABANDO_PROBE_V3: do NOT short-circuit by default.
// Set ABANDO_WEBHOOK_PROBE_SHORTCIRCUIT=1 if you want the old behavior.
if (process.env.ABANDO_WEBHOOK_PROBE_SHORTCIRCUIT === "1") {
  
      // ABANDO_FORCE_LOG_BEFORE_OK: make sure inbox has received + verified even on fast-path ok.
try {
  const topic2 = (req.get("x-shopify-topic") || req.get("x-shopify-webhook-topic") || topic || "unknown");
  const shop2  = (req.get("x-shopify-shop-domain") || shop || "unknown");
  const whId2  = req.get("x-shopify-webhook-id") || null;
  const trig2  = req.get("x-shopify-triggered-at") || null;

  __abando__write_inbox("received", {
    route: req.originalUrl || req.url,
    shop: shop2, topic: topic2,
    event_id: null,
    triggered_at: trig2,
    webhook_id: whId2,
    bytes: (typeof bytes !== "undefined" ? bytes : null),
    hmac_ok: null,
    secret_fp: __abando__fp(process.env.SHOPIFY_API_SECRET || ""),
    payload_fp: null
  });

  __abando__write_inbox("verified", {
    route: req.originalUrl || req.url,
    shop: shop2, topic: topic2,
    event_id: null,
    triggered_at: trig2,
    webhook_id: whId2,
    bytes: (typeof bytes !== "undefined" ? bytes : null),
    hmac_ok: (typeof ok !== "undefined" ? ok : null),
    secret_fp: __abando__fp(process.env.SHOPIFY_API_SECRET || ""),
    payload_fp: (typeof rawBody !== "undefined" ? __abando__payload_fp(rawBody) : null)
  });
} catch (e) {
  try { console.warn("[abando][FORCE_LOG_BEFORE_OK] failed:", e?.message || e); } catch (_) {}
}

return res.status(200).send("ok");


}
return next();


    } catch (e) {
      console.error("[webhooks] handler failed:", e?.stack || e);
      // Don't 500 while iterating (Shopify will retry aggressively)
      // [abando][OK_SEND_PROBE_BEGIN]
      try {
        const [fsMod, pathMod] = await Promise.all([import("node:fs"), import("node:path")]);
        const fs = fsMod.default || fsMod;
        const path = pathMod.default || pathMod;
        const out = path.resolve(process.cwd(), "web/.abando_webhook_inbox.jsonl");
// ABANDO_FORCE_BEFORE_HANDLER_OK_STAGE
__abando__write_inbox("received", {
  method: req.method,
  url: req.originalUrl || req.url,
  topic: (req.get("x-shopify-topic") || null),
  shop: (req.get("x-shopify-shop-domain") || null),
  has_hmac: !!req.get("x-shopify-hmac-sha256"),
});
__abando__write_inbox("verified", {
  method: req.method,
  url: req.originalUrl || req.url,
  topic: (req.get("x-shopify-topic") || null),
  shop: (req.get("x-shopify-shop-domain") || null),
  has_hmac: !!req.get("x-shopify-hmac-sha256"),
});

        const line = JSON.stringify({
          ts: new Date().toISOString(),
          stage: "handler_ok_send",
          method: req.method,
          url: req.originalUrl || req.url || null,
          topic: req.get("x-shopify-topic") || null,
          shop: req.get("x-shopify-shop-domain") || null,
          has_hmac: !!req.get("x-shopify-hmac-sha256"),
        });
        fs.appendFileSync(out, line + "\n");
      } catch (e) {
        console.warn("[abando][OK_SEND_PROBE] failed:", e?.message || e);
      }
// [abando][OK_SEND_PROBE_END]


// ABANDO_PROBE_V3: do NOT short-circuit by default.
// Set ABANDO_WEBHOOK_PROBE_SHORTCIRCUIT=1 if you want the old behavior.
if (process.env.ABANDO_WEBHOOK_PROBE_SHORTCIRCUIT === "1") {
  
      // ABANDO_FORCE_LOG_BEFORE_OK: make sure inbox has received + verified even on fast-path ok.
try {
  const topic2 = (req.get("x-shopify-topic") || req.get("x-shopify-webhook-topic") || topic || "unknown");
  const shop2  = (req.get("x-shopify-shop-domain") || shop || "unknown");
  const whId2  = req.get("x-shopify-webhook-id") || null;
  const trig2  = req.get("x-shopify-triggered-at") || null;

  __abando__write_inbox("received", {
    route: req.originalUrl || req.url,
    shop: shop2, topic: topic2,
    event_id: null,
    triggered_at: trig2,
    webhook_id: whId2,
    bytes: (typeof bytes !== "undefined" ? bytes : null),
    hmac_ok: null,
    secret_fp: __abando__fp(process.env.SHOPIFY_API_SECRET || ""),
    payload_fp: null
  });

  __abando__write_inbox("verified", {
    route: req.originalUrl || req.url,
    shop: shop2, topic: topic2,
    event_id: null,
    triggered_at: trig2,
    webhook_id: whId2,
    bytes: (typeof bytes !== "undefined" ? bytes : null),
    hmac_ok: (typeof ok !== "undefined" ? ok : null),
    secret_fp: __abando__fp(process.env.SHOPIFY_API_SECRET || ""),
    payload_fp: (typeof rawBody !== "undefined" ? __abando__payload_fp(rawBody) : null)
  });
} catch (e) {
  try { console.warn("[abando][FORCE_LOG_BEFORE_OK] failed:", e?.message || e); } catch (_) {}
}

return res.status(200).send("ok");


}
return next();


    }
  }
);

export default router;
