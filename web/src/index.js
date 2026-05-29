import crypto from "node:crypto";
import { recordShopifyOrderAttribution } from "./lib/abandoOrderAttribution.js";
import { recordRevenueProof } from "./lib/abandoRevenueRegister.js";
import { recordReturnAttribution } from "./lib/abandoReturnAttribution.js";
import express from "express";
import cors from "cors";
import fs from "node:fs";
import dotenv from "dotenv";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

import { analyzeStore } from "./lib/storeAnalyzer.js";
import {
  getEmailReadiness,
  sendRecoveryEmail,
} from "./lib/emailSender.js";
import { installGuidedAuditRoute } from "./routes/guidedAudit.esm.js";
import { installSmcAlign } from "./smc-align.js";
import { upsertShopifixerLead } from "./lib/shopifixerLeadRegistry.js";
import { trackShopifixerLifecycle } from "./lib/shopifixerLifecycleTracker.js";
import checkoutPublic from "./checkout-public.js";
import { installPacketAuthority } from "./routes/packetAuthority.esm.js";
import { installStripeWebhook } from "./routes/stripeWebhook.esm.js";
import { installPlayground } from "./routes/playground.esm.js";
import { installAskAbandoRoute } from "./routes/askAbando.esm.js";
import { installRecoveryLedgerRoute } from './routes/recoveryLedger.esm.js';
import { installRecoveryLiveTestRoute } from "./routes/recoveryLiveTest.esm.js";
import { installShopify } from "./routes/installShopify.esm.js";
import { installAuthShopify } from "./routes/authShopify.esm.js";
import { installCheckoutSignals } from "./routes/checkoutSignals.esm.js";
import { installCheckoutEventProof } from "./routes/checkoutEventProof.esm.js";
import { installMerchantSummary } from "./routes/merchantSummary.esm.js";
import { installRecoveryTrigger } from "./routes/recoveryTrigger.esm.js";
import { installRecoveryExecution } from "./routes/recoveryExecution.esm.js";
import { installSendOffer } from "./routes/sendOffer.esm.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..");
const fixAuditLeadsPath = join(repoRoot, ".tmp", "fix_audit_leads.json");
const fixAuditPayloadsPath = join(repoRoot, ".tmp", "fix_audit_payloads.json");

for (const envPath of [
  resolve(repoRoot, ".env"),
  resolve(repoRoot, "web", ".env"),
  resolve(repoRoot, "staffordos", "dev", ".env.abando.local"),
]) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
}

function normalizeStoreInput(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .split("?")[0]
    .split("#")[0]
    .trim()
    .toLowerCase();
}

function normalizeEmail(value = "") {
  const email = String(value || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function isTruthyFlag(value) {
  if (value === true) return true;
  return ["true", "1", "yes"].includes(String(value || "").trim().toLowerCase());
}

function shouldSuppressFixAuditEmail(req) {
  return (
    isTruthyFlag(req.get("X-ShopiFixer-Validation-Mode")) ||
    isTruthyFlag(req.body?.suppress_email) ||
    isTruthyFlag(req.body?.suppressEmail) ||
    isTruthyFlag(req.body?.validation_mode) ||
    isTruthyFlag(req.body?.validationMode)
  );
}

async function readFixAuditLeads() {
  try {
    const raw = await readFile(fixAuditLeadsPath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function saveFixAuditLeads(records) {
  await mkdir(join(repoRoot, ".tmp"), { recursive: true });
  await writeFile(fixAuditLeadsPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

async function createFixAuditLead({ storeUrl, email, analysis }) {
  const records = await readFixAuditLeads();
  const record = {
    leadId: `fix_lead_${Date.now()}`,
    storeUrl: normalizeStoreInput(storeUrl),
    email: normalizeEmail(email),
    source: "fix_page",
    analysis,
    createdAt: new Date().toISOString(),
  };
  records.push(record);
  await saveFixAuditLeads(records);
  return record;
}

async function readFixAuditPayloads() {
  try {
    const raw = await readFile(fixAuditPayloadsPath, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return { byStore: {}, lastPayload: null };
    }
    return {
      byStore: parsed.byStore && typeof parsed.byStore === "object" ? parsed.byStore : {},
      lastPayload: parsed.lastPayload || null,
    };
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return { byStore: {}, lastPayload: null };
    }
    throw error;
  }
}

async function saveFixAuditPayloads(registry) {
  await mkdir(join(repoRoot, ".tmp"), { recursive: true });
  await writeFile(fixAuditPayloadsPath, `${JSON.stringify(registry, null, 2)}\n`, "utf8");
}

async function saveCanonicalPayload(payload) {
  const registry = await readFixAuditPayloads();
  registry.byStore[payload.store_domain] = payload;
  registry.lastPayload = payload;
  await saveFixAuditPayloads(registry);
}

function summarizeFixAuditIssues(issues) {
  if (!Array.isArray(issues)) return [];
  return issues
    .filter((issue) => issue && typeof issue === "object")
    .slice(0, 3)
    .map((issue) => ({
      title: String(issue.title || "").trim(),
      detail: String(issue.detail || "").trim(),
      severity: String(issue.severity || "").trim(),
    }))
    .filter((issue) => issue.title);
}

function buildCanonicalPayload({ storeUrl, analysis }) {
  const normalizedStore = normalizeStoreInput(storeUrl);
  const issues = summarizeFixAuditIssues(analysis?.issues);
  const payload = {
    store_domain: normalizedStore,
    audit_score: Number(analysis?.opportunityScore),
    estimated_revenue_loss: String(analysis?.estimatedLoss?.display || "").trim(),
    top_issue: String(issues[0]?.title || "").trim(),
    recommended_action: String(analysis?.benchmark?.recommendation || "").trim(),
    issues: issues.map((issue) => issue.title),
    generated_at: new Date().toISOString(),
  };

  assertCanonicalPayload(payload);
  return payload;
}

function assertCanonicalPayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("INVALID_AUDIT_PAYLOAD");
  }

  if (typeof payload.store_domain !== "string" || payload.store_domain.trim() === "") {
    throw new Error("INVALID_AUDIT_PAYLOAD");
  }

  if (typeof payload.audit_score !== "number" || Number.isNaN(payload.audit_score)) {
    throw new Error("INVALID_AUDIT_PAYLOAD");
  }

  if (typeof payload.estimated_revenue_loss !== "string" || payload.estimated_revenue_loss.trim() === "") {
    throw new Error("INVALID_AUDIT_PAYLOAD");
  }

  if (typeof payload.top_issue !== "string" || payload.top_issue.trim() === "") {
    throw new Error("INVALID_AUDIT_PAYLOAD");
  }

  if (typeof payload.recommended_action !== "string" || payload.recommended_action.trim() === "") {
    throw new Error("INVALID_AUDIT_PAYLOAD");
  }

  if (!Array.isArray(payload.issues) || payload.issues.some((issue) => typeof issue !== "string" || issue.trim() === "")) {
    throw new Error("INVALID_AUDIT_PAYLOAD");
  }

  if (typeof payload.generated_at !== "string" || payload.generated_at.trim() === "") {
    throw new Error("INVALID_AUDIT_PAYLOAD");
  }

  return payload;
}

const app = express();
installSmcAlign(app);

app.disable("x-powered-by");
app.use(cors());

app.post("/api/shopify/webhooks/orders-paid", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const secret = process.env.SHOPIFY_API_SECRET || process.env.SHOPIFY_SHARED_SECRET || "";
    if (!secret) {
      return res.status(503).json({
        ok: false,
        error: "missing_shopify_webhook_secret"
      });
    }

    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(String(req.body || ""));
    const receivedHmac = String(req.get("x-shopify-hmac-sha256") || "").trim();

    const digest = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("base64");

    const valid =
      receivedHmac.length === digest.length &&
      crypto.timingSafeEqual(Buffer.from(receivedHmac), Buffer.from(digest));

    if (!valid) {
      return res.status(401).json({
        ok: false,
        error: "invalid_shopify_hmac"
      });
    }

    const order = JSON.parse(rawBody.toString("utf8"));
    const attribution = recordShopifyOrderAttribution({
      repoRoot,
      order: {
        ...order,
        proof_type: "real_shopify_hmac_order_webhook_attribution",
        source: "/api/shopify/webhooks/orders-paid",
        shop: req.get("x-shopify-shop-domain") || order.shop || order.shop_domain
      }
    });

    return res.status(200).json({
      ok: true,
      status: "REAL_SHOPIFY_HMAC_ORDER_REVENUE_ATTRIBUTED",
      attribution
    });
  } catch (error) {
    console.error("[abando:real-shopify-hmac-order-webhook] failed", error);
    return res.status(500).json({
      ok: false,
      error: "real_shopify_hmac_order_webhook_failed",
      detail: error instanceof Error ? error.message : String(error)
    });
  }
});

app.use(express.json({ limit: "1mb" }));

// Execute public checkout installer (source-of-truth)
checkoutPublic(app);
installPacketAuthority(app);
installStripeWebhook(app);


// Public checkout money path — mounted only after source-of-truth audit.





// ===== ABANDO RECOVERY / PLAYGROUND ROUTES =====
// Source of truth: web/src/routes/playground.esm.js
installShopify(app);
installAuthShopify(app);
installCheckoutEventProof(app);
installMerchantSummary(app);
installRecoveryTrigger(app);
installRecoveryExecution(app);
installSendOffer(app);
installCheckoutSignals(app);
installPlayground(app);

// Ask Abando API route
installAskAbandoRoute(app);
installRecoveryLiveTestRoute(app, { repoRoot });
installRecoveryLedgerRoute(app);

app.get("/", (_req, res) => {
  res.status(200).json({ ok: true, service: "cart-agent-api", route: "/" });
});

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "cart-agent-api" });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "cart-agent-api" });
});

app.get("/api/runtime-proof", (_req, res) => {
  const emailReadiness = getEmailReadiness();
  res.status(200).json({
    ok: true,
    service: "cart-agent-api",
    email: {
      ready: emailReadiness.ready,
      missing: emailReadiness.missing,
      sender: emailReadiness.sender || null,
    },
  });
});

app.get("/api/debug-last-payload", async (req, res) => {
  try {
    const registry = await readFixAuditPayloads();
    const store = normalizeStoreInput(req.query?.store || "");
    const payload = store ? registry.byStore[store] || null : registry.lastPayload;

    if (!payload) {
      return res.status(404).json({ ok: false, error: "payload_not_found" });
    }

    return res.status(200).json({ ok: true, payload });
  } catch (error) {
    console.error("[debug-last-payload] error:", error);
    return res.status(500).json({ ok: false, error: "debug_payload_failed" });
  }
});

app.get("/api/fix-audit", async (req, res) => {
  try {
    const storeUrl = normalizeStoreInput(req.query?.store || "");
    if (!storeUrl) {
      return res.status(400).json({ ok: false, error: "invalid_fix_audit_store" });
    }

    const registry = await readFixAuditPayloads();
    const payload = registry.byStore[storeUrl] || null;

    if (!payload) {
      return res.status(404).json({ ok: false, error: "audit_payload_not_found" });
    }

    return res.status(200).json({ ok: true, payload });
  } catch (error) {
    console.error("[fix-audit:get] error:", error);
    return res.status(500).json({ ok: false, error: "fix_audit_failed" });
  }
});



app.get("/api/shopifixer/track-redirect", async (req, res) => {
  try {
    const store = normalizeStoreInput(req.query.store);
    const eventType = String(req.query.eventType || "").trim();

    const result = trackShopifixerLifecycle({
      repoRoot,
      store,
      eventType,
      metadata: { source: "email_click" }
    });

    // redirect mapping
    let redirectPath = "/";

    if (eventType === "audit_result_viewed") {
      redirectPath = `/audit-result?store=${store}`;
    } else if (eventType === "pricing_viewed") {
      redirectPath = `/pricing?store=${store}`;
    }

    return res.redirect(302, redirectPath);
  } catch (error) {
    console.error("[track-redirect] error:", error);
    return res.redirect(302, "/");
  }
});

app.post("/api/shopifixer/track", async (req, res) => {
  try {
    const store = normalizeStoreInput(req.body?.store || req.body?.storeUrl || req.body?.domain);
    const eventType = String(req.body?.eventType || req.body?.event || "").trim();

    const result = trackShopifixerLifecycle({
      repoRoot,
      store,
      eventType,
      metadata: req.body?.metadata || {}
    });

    return res.status(result.ok ? 200 : 400).json(result);
  } catch (error) {
    console.error("[shopifixer:track] error:", error);
    return res.status(500).json({ ok: false, error: "shopifixer_track_failed" });
  }
});

app.post("/api/fix-audit", async (req, res) => {
  try {
    const storeUrl = normalizeStoreInput(req.body?.storeUrl);
    const email = normalizeEmail(req.body?.email);
    const emailSuppressed = shouldSuppressFixAuditEmail(req);

    if (!storeUrl || !email) {
      return res.status(400).json({ ok: false, error: "invalid_fix_audit_input" });
    }

    const analysis = await analyzeStore(storeUrl);
    const lead = await createFixAuditLead({ storeUrl, email, analysis });
    const registryResult = upsertShopifixerLead({
      repoRoot,
      storeUrl,
      email,
      analysis
    });
    const payload = buildCanonicalPayload({ storeUrl, analysis });
    await saveCanonicalPayload(payload);

    let emailResult = null;

    if (emailSuppressed) {
      console.info("[SHOPIFIXER EMAIL] suppressed by validation mode", {
        storeUrl,
        source: req.body?.source || "unknown",
      });
    } else {
      const emailReadiness = getEmailReadiness();
      console.log("[SHOPIFIXER EMAIL] attempt", {
        storeUrl,
        email,
        smtpReady: emailReadiness.ready,
        smtpEnvPresent: emailReadiness.missing.length === 0,
      });

      emailResult = await sendRecoveryEmail({
        to: email,
        payload,
      });

      if (emailResult?.success) {
        console.log("[SHOPIFIXER EMAIL] sent", {
          messageId: emailResult?.messageId || null,
        });
      } else {
        console.error("[SHOPIFIXER EMAIL ERROR]", {
          error: String(emailResult?.error || "unknown_email_error"),
        });
      }
    }

    return res.status(200).json({
      ok: true,
      leadId: lead.leadId,
      registryLeadId: registryResult.leadId,
      analysis,
      payload,
      emailAttempted: !emailSuppressed,
      emailSent: emailSuppressed ? false : Boolean(emailResult?.success),
      emailSuppressed,
      emailError: emailSuppressed ? "" : emailResult?.success ? "" : String(emailResult?.error || ""),
    });
  } catch (error) {
    console.error("[fix-audit] error:", error);
    return res.status(500).json({ ok: false, error: "fix_audit_failed" });
  }
});

const port = Number(process.env.PORT || 8081);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`invalid_port:${process.env.PORT || ""}`);
}

app.get("/operator/send-console", (req, res) => {
  res.sendFile(resolve(repoRoot, "staffordos/ui/send-console/index.html"));
});

installGuidedAuditRoute(app);



app.listen(port, () => {
  console.log(`[server] listening on :${port}`);
});

export default app;

app.get('/__build-check', (req, res) => {
  res.json({
    status: 'ok',
    marker: 'build-check-v1',
    time: new Date().toISOString()
  });
});



app.get("/api/recovery/return", async (req, res) => {
  try {
    const shop = String(req.query.shop || "").trim();
    const experienceId = String(req.query.eid || req.query.experienceId || "").trim();
    const revenue = Number(req.query.revenue || 100);

    if (!shop || !experienceId) {
      return res.status(400).json({
        ok: false,
        error: "missing_shop_or_experience_id"
      });
    }

    const attribution = await recordReturnAttribution({
      repoRoot,
      payload: { experienceId, shop, revenue }
    });

    recordRevenueProof({ repoRoot, attribution });

    return res.status(200).json({
      ok: true,
      status: "REVENUE_ATTRIBUTED",
      attribution
    });
  } catch (error) {
    console.error("[abando:return-attribution] failed", error);
    return res.status(500).json({
      ok: false,
      error: "return_attribution_failed",
      detail: error instanceof Error ? error.message : String(error)
    });
  }
});


app.post("/api/shopify/order-paid/attribution-test", async (req, res) => {
  try {
    const attribution = recordShopifyOrderAttribution({
      repoRoot,
      order: req.body || {}
    });

    return res.status(200).json({
      ok: true,
      status: "ORDER_REVENUE_ATTRIBUTED",
      attribution
    });
  } catch (error) {
    console.error("[abando:order-attribution] failed", error);
    return res.status(500).json({
      ok: false,
      error: "order_attribution_failed",
      detail: error instanceof Error ? error.message : String(error)
    });
  }
});
