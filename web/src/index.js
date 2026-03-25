
// ABANDO EXECUTION ENGINE
// MUST NOT BE CONTROLLED BY STAFFORDOS
// ONLY EXPOSE READ-ONLY SUMMARY APIs

// ABANDO_SHOPIFY_HMAC_FIX_V1
import crypto from "crypto";
// /ABANDO_SHOPIFY_HMAC_FIX_V1

// web/src/index.js — clean ESM server with Shopify OAuth + DB save
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dns from "node:dns/promises";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { randomBytes, createHmac } from "node:crypto";
import { PrismaClient, Prisma } from "@prisma/client";
import applyAbandoDevProxy from "./abandoDevProxy.js";
import { getDashboardSummary } from "./lib/dashboardSummary.js";
import { generateRecoveryMessage, parseRecoveryToken } from "./lib/recoveryMessageEngine.js";
import { isEmailSenderConfigured, sendRecoveryEmail } from "./lib/emailSender.js";
import { isSmsSenderConfigured, sendRecoverySMS } from "./lib/smsSender.js";
import { analyzeStore } from "./lib/storeAnalyzer.js";
import { getStaffordosUrl } from "./lib/staffordosUrl.js";
import { internalOnly } from "./middleware/internalOnly.js";
import { installCheckoutSignals } from "./routes/checkoutSignals.esm.js";
import { ensureScriptTagInstalled, installShopify } from "./routes/installShopify.esm.js";
import { installOrderWebhook } from "./routes/orderWebhook.esm.js";
import { installInternalTestRoutes } from "./routes/internalTest.esm.js";
import {
  installInviteRoutes,
  markInviteInstallCompleted,
  markInviteInstallStarted,
  markInviteSessionReached,
  normalizeInviteId,
} from "./routes/invites.esm.js";
import { installAskAbandoRoute } from "./routes/askAbando.esm.js";
import { installGuidedAuditRoute } from "./routes/guidedAudit.esm.js";
import { installPricingRoute } from "./routes/pricing.esm.js";
import { installRevenueLeakageEntryRoute } from "./routes/revenueLeakageEntry.esm.js";
import { installRunAuditRoute } from "./routes/runAudit.esm.js";
import { installScorecardRoute } from "./routes/scorecard.esm.js";
import { installSnippet } from "./routes/snippet.esm.js";
import { createJob, getJobByIdempotencyKey } from "./jobs/repository.js";
import { appendSystemEvent } from "./system-events.js";
import {
  createOpportunity,
  getOpportunityById,
  listOpportunities,
} from "../../opportunities/opportunity_registry/index.js";
import {
  createSignal,
  listSignals,
  listSignalsByMerchant,
} from "../../signals/signal_registry/index.js";
import {
  getCandidateOpportunityById,
  listCandidateOpportunities,
  runPatternToOpportunityBridge,
} from "../../candidate_opportunities/index.js";
import {
  getTopOpportunities,
  listOpportunityScores,
  scoreOpportunities,
} from "../../opportunity_scoring/index.js";
import {
  getSliceById,
  listSlices,
  runSliceGenerator,
} from "../../slices/index.js";
import {
  getNextBuildQueueItem,
  listBuildQueue,
  runBuildQueue,
} from "../../build_queue/index.js";
import {
  getExecutionPacketById,
  getNextExecutionPacket,
  listExecutionPackets,
  runExecutionPacketGenerator,
} from "../../execution_packets/index.js";
import {
  getNextPacket,
  listPacketExecutions,
  submitPacketExecution,
} from "../../packet_executor/index.js";
import {
  getFeedbackByPacket,
  getFeedbackBySlice,
  listFeedback,
  recordFeedback,
} from "../../feedback_registry/index.js";
import {
  buildSystemSnapshot,
  getLatestSystemSnapshot,
} from "../../system_state/index.js";
import {
  getLatestOperatorDecision,
  listOperatorDecisions,
  runOperatorBrain,
} from "../../operator_brain/index.js";
import {
  getLatestExecutionGateDecision,
  listExecutionGateDecisions,
  runExecutionGate,
} from "../../execution_gate/index.js";
import {
  getLatestPacketValidation,
  getPacketValidationByPacketId,
  listPacketValidations,
  runPacketValidator,
} from "../../packet_validator/index.js";
import {
  getLatestInterpretedSignals,
  listInterpretedSignals,
  runSignalInterpreter,
} from "../../signal_interpreter/index.js";
import {
  formatCheckoutBenchmark,
  generateCheckoutBenchmark,
  generateCheckoutBenchmarkReport,
  getLatestCheckoutBenchmarkReport,
} from "../../checkout_benchmark_intelligence/index.js";
import { diagnoseIssue } from "../../scripts/fix/diagnose_issue.mjs";
import {
  buildDiagnosisExplanation,
  createFixIntakeSubmission,
} from "../../staffordos/fix/intake_store.mjs";
import { stripe } from "./clients/stripe.js";
import {
  createFixCheckoutSession,
  markFixCheckoutSessionCompleted,
} from "./lib/fixCheckout.js";
import { renderAbandoStatus } from "./components/abandoStatusCard.js";




function verifyShopifyWebhookHmac(req) {
  const hmacHeader = req.get("X-Shopify-Hmac-Sha256") || "";
  const secret =
    process.env.SHOPIFY_API_SECRET ||
    process.env.SHOPIFY_API_SECRET_KEY ||
    process.env.SHOPIFY_SECRET ||
    "";

  if (!secret || !hmacHeader) return false;

  const body = req.body;
  if (!Buffer.isBuffer(body)) return false;

  const digest = crypto.createHmac("sha256", secret).update(body).digest("base64");

  const a = Buffer.from(digest, "utf8");
  const b = Buffer.from(hmacHeader, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
function verifyShopifyHmac(reqOrQuery, secret) {
  // Shopify OAuth callback HMAC verification (hex)
  // Accepts either:
  //  - Express req (preferred; uses raw querystring via req.originalUrl)
  //  - A plain query object (fallback; uses RFC3986 encoding)
  try {
    if (!secret) return false;

    // Preferred path: we were passed an Express req
    const looksLikeReq =
      reqOrQuery &&
      typeof reqOrQuery === "object" &&
      (typeof reqOrQuery.originalUrl === "string" || typeof reqOrQuery.url === "string");

    let hmac = "";
    let message = "";

    if (looksLikeReq) {
      const req = reqOrQuery;
      const host = req.headers?.host || "localhost";
      const url = new URL(req.originalUrl || req.url || "/", `https://${host}`);

      const params = new URLSearchParams(url.searchParams);
      hmac = String(params.get("hmac") || "");
      params.delete("hmac");
      params.delete("signature");

      const entries = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b));
      message = entries
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&");
    } else {
      // Fallback path: we were passed a plain query object
      const query = (reqOrQuery && typeof reqOrQuery === "object") ? reqOrQuery : {};
      const { hmac: qHmac, signature, ...params } = query || {};
      hmac = String(qHmac || "");

      const keys = Object.keys(params).sort();
      message = keys
        .map((k) => {
          const v = params[k];
          if (Array.isArray(v)) {
            return v.map((vv) => `${encodeURIComponent(k)}=${encodeURIComponent(String(vv))}`).join("&");
          }
          return `${encodeURIComponent(k)}=${encodeURIComponent(String(v ?? ""))}`;
        })
        .filter(Boolean)
        .join("&");
    }

    const digest = crypto.createHmac("sha256", secret).update(message).digest("hex");

    const a = Buffer.from(digest, "utf8");
    const b = Buffer.from(hmac, "utf8");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// ABANDO_SHOP_NORMALIZE_V1
function normalizeShop(raw) {
  if (!raw) return "";
  let v = String(raw).trim().toLowerCase();

  // strip protocol
  v = v.replace(/^https?:\/\//, "");

  // strip path/query/hash
  v = v.split("/")[0].split("?")[0].split("#")[0];

  // if user passed "shopname" only, add suffix
  if (v && !v.includes(".")) v = `${v}.myshopify.com`;

  // allow only *.myshopify.com
  if (!v.endsWith(".myshopify.com")) return "";

  // basic hostname sanity
  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(v)) return "";

  return v;
}
// /ABANDO_SHOP_NORMALIZE_V1


const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const publicDir = join(__dirname, "public");
const repoRoot = join(__dirname, "..", "..");
const devSessionStatePath = join(repoRoot, ".tmp", "dev-session.json");
const fixAuditLeadsPath = join(repoRoot, ".tmp", "fix_audit_leads.json");

app.set("trust proxy", 1);

app.use((req, res, next) => {
  res.removeHeader("X-Frame-Options");
  res.setHeader(
    "Content-Security-Policy",
    "frame-ancestors https://admin.shopify.com https://*.myshopify.com;",
  );
  next();
});

app.use((req, _res, next) => {
  console.log("[debug:req]", {
    method: req.method,
    url: req.originalUrl || req.url,
    host: req.headers.host,
    xfHost: req.headers["x-forwarded-host"],
    xfProto: req.headers["x-forwarded-proto"],
    cfRay: req.headers["cf-ray"] || null,
  });
  next();
});

function sendRootHtml(req, res) {
  const appOrigin = resolveRequestOrigin(req);
  const preview = generateRecoveryMessage({
    shop: "demo-shop.myshopify.com",
    eventData: {
      event_type: "checkout_started",
    },
    timestamp: "2026-03-23T17:32:00.000Z",
    baseUrl: appOrigin,
  });
  const year = new Date().getFullYear();

  return res.status(200).type("html").send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Abando — Recover abandoned checkout revenue automatically.</title>
    <meta
      name="description"
      content="See the recovery flow, find gaps in your store, and watch customers come back with Abando."
    />
    <style>
      :root {
        color-scheme: dark;
        --bg: #020617;
        --card: rgba(15, 23, 42, 0.88);
        --line: rgba(148, 163, 184, 0.16);
        --text: #f8fafc;
        --muted: #94a3b8;
        --accent: #cbd5e1;
        --accent-2: #e2e8f0;
        --soft: rgba(2, 6, 23, 0.52);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at top, rgba(30, 41, 59, 0.22), transparent 32%),
          var(--bg);
        color: var(--text);
      }
      a { color: inherit; }
      .shell {
        max-width: 960px;
        margin: 0 auto;
        padding: 28px 20px 72px;
      }
      .nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }
      .brand {
        font-size: 1.1rem;
        font-weight: 800;
        letter-spacing: -0.02em;
      }
      .nav-links {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
      .pill {
        display: inline-flex;
        align-items: center;
        padding: 8px 12px;
        border-radius: 999px;
        border: 1px solid var(--line);
        background: rgba(15, 23, 42, 0.7);
        color: var(--muted);
        font-size: 13px;
        font-weight: 600;
        text-decoration: none;
      }
      .hero,
      .section-card {
        margin-top: 34px;
        background: var(--card);
        border: 1px solid var(--line);
        border-radius: 28px;
        box-shadow: 0 28px 80px rgba(2, 6, 23, 0.42);
        padding: 34px 30px;
      }
      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--accent);
      }
      h1 {
        margin: 14px 0 12px;
        font-size: clamp(2.5rem, 6vw, 4.5rem);
        line-height: 0.98;
        letter-spacing: -0.05em;
      }
      .lead {
        margin: 0;
        max-width: 42ch;
        color: var(--muted);
        font-size: 1.08rem;
        line-height: 1.7;
      }
      .hero-actions,
      .cta-row {
        margin-top: 22px;
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
      .button,
      .button-secondary,
      .loom-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 48px;
        padding: 0 18px;
        border-radius: 14px;
        text-decoration: none;
        font-weight: 700;
      }
      .button {
        background: linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 100%);
        color: #020617;
      }
      .button-secondary {
        border: 1px solid var(--line);
        background: rgba(15, 23, 42, 0.7);
        color: var(--text);
      }
      .loom-link {
        margin-top: 18px;
        border: 1px solid var(--line);
        background: var(--soft);
        color: var(--text);
        text-decoration: none;
        font-weight: 700;
      }
      .section-grid {
        display: grid;
        gap: 20px;
        margin-top: 20px;
      }
      .section-card h2 {
        margin: 0 0 10px;
        font-size: 1.8rem;
        letter-spacing: -0.03em;
      }
      .section-card p {
        margin: 0;
        color: var(--muted);
        line-height: 1.7;
      }
      .loom-preview {
        margin: 12px 0 0;
        background: var(--soft);
        border: 1px solid var(--line);
        border-radius: 18px;
        padding: 18px;
      }
      .loom-preview strong {
        display: block;
        margin-bottom: 8px;
        font-size: 1rem;
      }
      .loom-preview p {
        margin: 0;
        color: var(--muted);
        line-height: 1.6;
      }
      footer {
        margin-top: 28px;
        color: #64748b;
        font-size: 13px;
      }
    </style>
  </head>
  <body>
    <main class="shell">
      <nav class="nav">
        <div class="brand">Abando</div>
        <div class="nav-links">
          <a class="pill" href="/audit">Run free recovery audit</a>
          <a class="pill" href="/experience?shop=mvp-demo-proof.myshopify.com&eid=marketing-proof">See the recovery flow live</a>
        </div>
      </nav>

      <section class="hero">
        <div class="eyebrow">Shopify checkout recovery app</div>
        <h1>Recover abandoned checkout revenue automatically.</h1>
        <p class="lead">
          See the recovery flow, find gaps in your store, and watch customers come back.
        </p>
        <div class="hero-actions">
          <a class="button" href="/audit">Run free recovery audit</a>
          <a class="button-secondary" href="/experience?shop=mvp-demo-proof.myshopify.com&eid=marketing-proof">See the recovery flow live</a>
        </div>
      </section>

      <section class="section-grid">
        <section class="section-card">
          <h2>See Abando recover revenue in real time</h2>
          <p>
            Watch the live proof loop: recovery sent, clicked, and tracked.
          </p>
          <div class="loom-preview">
            <strong>Live proof loop</strong>
            <p>Recovery sent, customer returned, and the result tracked cleanly through the public Abando experience flow.</p>
          </div>
          <a class="loom-link" href="https://www.loom.com/share/ca7cfee379ec4d2e816df6068b872d60" target="_blank" rel="noopener">Watch the Loom</a>
        </section>

        <section class="section-card">
          <h2>Take the next step</h2>
          <p>
            Start with the audit if you want a simple directional read on likely recovery gaps. Open the live recovery flow if you want to see the exact product path a merchant would verify.
          </p>
          <div class="cta-row">
            <a class="button" href="/audit">Run free recovery audit</a>
            <a class="button-secondary" href="/experience?shop=mvp-demo-proof.myshopify.com&eid=marketing-proof">See the recovery flow live</a>
          </div>
        </section>
      </section>

      <footer>
        Abando · © ${year} · Public proof flow: recovery sent, clicked, and tracked.
      </footer>
    </main>
  </body>
</html>`);
}

async function readDevSessionState() {
  try {
    const raw = await readFile(devSessionStatePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function readRuntimeProofCase() {
  try {
    const raw = await readFile(join(repoRoot, ".tmp", "runtime_proof_case.json"), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function normalizeEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

function isValidEmail(value = "") {
  const normalized = normalizeEmail(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

function normalizePhone(value = "") {
  const digits = String(value || "").replace(/\D+/g, "");
  if (!digits) return "";
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (String(value || "").trim().startsWith("+")) {
    return `+${digits}`;
  }
  return "";
}

function getMissingEmailEnvVars() {
  const required = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "FROM_EMAIL"];
  return required.filter((name) => !String(process.env[name] || "").trim());
}

function getMissingSmsEnvVars() {
  const required = ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM"];
  const missing = required.filter((name) => !String(process.env[name] || "").trim());
  if (missing.length === required.length && String(process.env.TWILIO_FROM_NUMBER || "").trim()) {
    return required.filter((name) => {
      if (name === "TWILIO_FROM") return false;
      return !String(process.env[name] || "").trim();
    });
  }
  return missing;
}

function summarizeSendResult(sendResult) {
  const channels = Array.isArray(sendResult?.successfulChannels) ? sendResult.successfulChannels : [];
  const failedChannels = Array.isArray(sendResult?.failedChannels) ? sendResult.failedChannels : [];
  const providerStatuses = Array.isArray(sendResult?.providerStatuses) ? sendResult.providerStatuses : [];
  const missingEnvVars = Array.isArray(sendResult?.missingEnvVars) ? sendResult.missingEnvVars : [];
  const success = channels.length > 0;
  const message = success ? "sent" : (failedChannels.length > 0 ? "failed" : "not_configured");

  return {
    success,
    channels,
    failedChannels,
    providerStatuses,
    missingEnvVars,
    message,
  };
}

function normalizeExperienceId(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "";
  return normalized.replace(/[^a-z0-9_-]/g, "").slice(0, 80);
}

function buildExperienceReturnLink({ req, shop, experienceId, channel }) {
  const params = new URLSearchParams({
    shop,
    eid: experienceId,
    channel,
  });
  return `${resolveRequestOrigin(req)}/api/recovery/return?${params.toString()}`;
}

function buildExperienceRecoveryMessage({ req, shop, eventData, timestamp, experienceId }) {
  const baseMessage = generateRecoveryMessage({
    shop,
    eventData,
    timestamp,
    baseUrl: resolveRequestOrigin(req),
  });
  const emailReturnLink = buildExperienceReturnLink({
    req,
    shop,
    experienceId,
    channel: "email",
  });
  const smsReturnLink = buildExperienceReturnLink({
    req,
    shop,
    experienceId,
    channel: "sms",
  });

  return {
    ...baseMessage,
    emailReturnLink,
    smsReturnLink,
    returnLink: emailReturnLink,
    emailSubject: "Complete your order",
    emailBody: [
      "You left something behind.",
      "",
      "Complete your order using the secure link below.",
      emailReturnLink,
      "",
      "If you already returned, you can ignore this message.",
      "",
      "This is the exact recovery email your customer would receive.",
    ].join("\n"),
    smsText: `You can return to checkout here: ${smsReturnLink}`,
  };
}

async function listExperienceSendEvents(shop, experienceId) {
  if (!shop || !experienceId) return [];

  const events = await prisma.systemEvent.findMany({
    where: {
      shopDomain: shop,
      eventType: "abando.experience_send.v1",
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return events.filter((event) => {
    const payload = event?.payload;
    return payload
      && typeof payload === "object"
      && normalizeExperienceId(payload.experienceId) === experienceId;
  });
}

async function persistExperienceSendRecords({ shop, experienceId, sendResult }) {
  if (!shop || !experienceId) return [];

  const sentAt = sendResult.sentAt || new Date().toISOString();
  const records = [];

  for (const channel of sendResult.successfulChannels) {
    const target = channel === "email" ? sendResult.emailRecipient : sendResult.smsRecipient;
    const providerId = channel === "email" ? sendResult.messageId : sendResult.smsSid;
    const event = await prisma.systemEvent.create({
      data: {
        shopDomain: shop,
        eventType: "abando.experience_send.v1",
        visibility: "merchant",
        payload: {
          experienceId,
          shop,
          channel,
          target,
          status: "sent",
          sentAt,
          returned: false,
          returnedAt: null,
          providerId,
        },
      },
    });
    records.push(event);
  }

  return records;
}

async function getExperienceStatus(shop, experienceId) {
  const emailConfigured = isEmailSenderConfigured();
  const smsConfigured = isSmsSenderConfigured();
  const events = await listExperienceSendEvents(shop, experienceId);
  const payloads = events
    .map((event) => (event?.payload && typeof event.payload === "object" ? event.payload : null))
    .filter(Boolean);
  const channels = [...new Set(payloads.map((payload) => String(payload.channel || "")).filter(Boolean))];
  const targets = [...new Set(payloads.map((payload) => String(payload.target || "")).filter(Boolean))];
  const returnedPayloads = payloads.filter((payload) => payload.returned === true);
  const lastReturnedAt = returnedPayloads
    .map((payload) => String(payload.returnedAt || ""))
    .filter(Boolean)
    .sort()
    .at(-1) || null;
  const firstPayload = payloads[0] || null;

  return {
    configured: {
      email: emailConfigured,
      sms: smsConfigured,
    },
    send: {
      status: firstPayload ? String(firstPayload.status || "sent") : null,
      channel: channels.length > 1 ? channels.join("+") : channels[0] || null,
      target: targets.length > 1 ? targets.join(", ") : targets[0] || null,
      sentAt: firstPayload ? String(firstPayload.sentAt || "") || null : null,
    },
    return: {
      returned: returnedPayloads.length > 0,
      returnedAt: lastReturnedAt,
    },
  };
}

async function executeRecoverySend({
  shop,
  email,
  phone,
  recoveryMessage,
  actionId = null,
  testMode = false,
  logDeliveryAttempt,
}) {
  const emailRecipient = normalizeEmail(email);
  const smsRecipient = normalizePhone(phone);
  const emailConfigured = isEmailSenderConfigured();
  const smsConfigured = isSmsSenderConfigured();
  const successfulChannels = [];
  const failedChannels = [];
  const delivery = [];
  const missingEnvVars = [
    ...(emailConfigured ? [] : getMissingEmailEnvVars()),
    ...(smsConfigured ? [] : getMissingSmsEnvVars()),
  ];
  const providerStatuses = [
    ...(emailConfigured ? [] : ["email_not_configured"]),
    ...(smsConfigured ? [] : ["sms_not_configured"]),
  ];
  let messageId = null;
  let smsSid = null;
  let sendError = null;

  async function record(channel, outcome, detail = {}) {
    const entry = {
      channel,
      outcome,
      at: new Date().toISOString(),
      ...detail,
    };
    delivery.push(entry);
    console.log("[recovery-delivery]", {
      shop,
      actionId,
      testMode,
      channel,
      outcome,
      detail,
    });
    if (typeof logDeliveryAttempt === "function") {
      await logDeliveryAttempt(channel, outcome, detail);
    }
  }

  if (emailConfigured && emailRecipient) {
    const result = await sendRecoveryEmail({
      to: emailRecipient,
      subject: recoveryMessage.emailSubject,
      html: `<p>${escapeHtml(recoveryMessage.emailBody).replace(/\\n/g, "<br/>")}</p>`,
      text: recoveryMessage.emailBody,
    });
    if (result.success) {
      messageId = result.messageId || null;
      successfulChannels.push("email");
      await record("email", "sent", { to: emailRecipient, messageId });
    } else {
      const error = result.error || "email_send_failed";
      failedChannels.push("email");
      sendError = sendError || error;
      await record("email", "failed", { to: emailRecipient, error });
    }
  } else {
    await record("email", emailRecipient ? "skipped_not_configured" : "skipped_missing_recipient", {
      to: emailRecipient || null,
    });
  }

  if (smsConfigured && smsRecipient) {
    const result = await sendRecoverySMS({
      to: smsRecipient,
      message: recoveryMessage.smsText,
    });
    if (result.success) {
      smsSid = result.sid || null;
      successfulChannels.push("sms");
      await record("sms", "sent", { to: smsRecipient, sid: smsSid });
    } else {
      const error = result.error || result.reason || "sms_send_failed";
      failedChannels.push("sms");
      sendError = sendError || error;
      await record("sms", "failed", { to: smsRecipient, error });
    }
  } else {
    await record("sms", smsRecipient ? "skipped_not_configured" : "skipped_missing_recipient", {
      to: smsRecipient || null,
    });
  }

  const status = successfulChannels.includes("email") && successfulChannels.includes("sms")
    ? "sent_email_and_sms"
    : successfulChannels.includes("email")
      ? "sent_email"
      : successfulChannels.includes("sms")
        ? "sent_sms"
        : failedChannels.length > 0
          ? "failed"
          : "created";

  return {
    emailRecipient,
    smsRecipient,
    emailConfigured,
    smsConfigured,
    successfulChannels,
    failedChannels,
    delivery,
    missingEnvVars: [...new Set(missingEnvVars)],
    providerStatuses,
    status,
    messageId,
    smsSid,
    sendError,
    sentAt: successfulChannels.length > 0 ? new Date().toISOString() : null,
  };
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

async function getTunnelLooksStale(host) {
  if (!host) return true;

  try {
    await dns.lookup(host);
    return false;
  } catch {
    return true;
  }
}

function getConfiguredPublicBaseUrl() {
  return String(
    process.env.ABANDO_PUBLIC_APP_ORIGIN ||
    process.env.NEXT_PUBLIC_ABANDO_PUBLIC_APP_ORIGIN ||
    process.env.APP_URL ||
    "",
  ).trim().replace(/\/+$/, "");
}

function isLocalHostLike(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return false;

  try {
    const url = raw.includes("://") ? new URL(raw) : new URL(`http://${raw}`);
    const hostname = String(url.hostname || "").trim().toLowerCase();
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return raw.includes("localhost") || raw.includes("127.0.0.1");
  }
}



// ABANDO_EMBEDDED_ROOT_GUARD_V1
// If Shopify loads the app in an iframe (embedded=1 or shop=...), make sure "/" routes to an embedded-safe UI,
// not the public marketing landing page.
app.use((req, res, next) => {
  try {
    const host = req.headers.host || "localhost";
    const url = new URL(req.originalUrl || req.url || "/", `https://${host}`);

    const isEmbedded =
      url.searchParams.get("embedded") === "1" ||
      url.searchParams.has("shop") ||
      (req.headers["sec-fetch-dest"] === "iframe");

    // Shopify iframe-loads "/" during embedded navigation. Route it to an existing embedded-safe page.
    // IMPORTANT: use "/dashboard/" to avoid Express/static adding a 301 that can drop query params.
    if (isEmbedded && (req.path === "/" || req.path === "")) {
      const qs = url.search || "";
      req.url = "/dashboard/" + qs;

      // Optional debug (enable by setting ABANDO_DEBUG_EMBED=1 in env)
      if (process.env.ABANDO_DEBUG_EMBED === "1") {
        console.log("[ABANDO_EMBEDDED_ROOT_GUARD_V1] rewrite / -> /dashboard/", qs);
      }
    }
  } catch (e) {
    // no-op
  }
  next();
});
// /ABANDO_EMBEDDED_ROOT_GUARD_V1
// --- Abando Embedded Checks probe (minimal, intentional) ---
app.get("/api/embedded-check", (req, res) => {
  try {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");

    const auth = req.get("authorization") || "";
    const hasBearer = /^Bearer\\s+\\S+/.test(auth);

    console.log("[abando] /api/embedded-check", { hasBearer, ua: req.get("user-agent") });

    res.status(200).json({
      ok: true,
      hasBearer,
      ts: Date.now(),
    });
  } catch (e) {
    console.error("[abando] /api/embedded-check error", e);
    res.status(500).json({ ok: false });
  }
});
// --- end probe ---



/* ABANDO_GDPR_WEBHOOK_ROUTE */
/**
 * Shopify GDPR webhooks:
 * - 405 for non-POST (GET/HEAD probes)
 * - 401 for missing/invalid HMAC on POST
 * - 200 only for valid POST
 */
app.all("/api/webhooks/gdpr", (req, res, next) => {
  res.set("X-Abando-GDPR-Guard", "1"); // prove THIS handler is active
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
  return next();
});

app.post("/api/webhooks/gdpr", express.raw({ type: "*/*" }), (req, res) => {
  try {
    const secret =
      process.env.SHOPIFY_API_SECRET ||
      process.env.SHOPIFY_API_SECRET_KEY ||
      process.env.SHOPIFY_SECRET ||
      "";

    const hmacHeader = (req.get("X-Shopify-Hmac-Sha256") || "").trim();
    if (!secret || !hmacHeader) return res.status(401).send("Unauthorized");

    const body = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || "");
    const digest = crypto.createHmac("sha256", secret).update(body).digest("base64");

    const a = Buffer.from(digest, "utf8");
    const b = Buffer.from(hmacHeader, "utf8");
    if (a.length != b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(401).send("Unauthorized");
    }

    return res.status(200).send("ok");
  } catch (_e) {
    return res.status(401).send("Unauthorized");
  }
});
/* END_ABANDO_GDPR_WEBHOOK_ROUTE */

installOrderWebhook(app);


applyAbandoDevProxy(app);



// --- Embedded entrypoint alias (Shopify Application URL) ---
function getEmbeddedContext(req) {
  const normalizedShop = normalizeShop(req.query.shop) || normalizeShop(extractShopFromIdToken(req.query.id_token));
  const host = typeof req.query.host === "string" ? req.query.host.trim() : "";
  const embeddedFlag = String(req.query.embedded || "").trim().toLowerCase();
  const embedded = embeddedFlag === "1"
    || embeddedFlag === "true"
    || Boolean(host)
    || Boolean(req.query.id_token);

  return {
    shop: normalizedShop,
    host,
    embedded,
    hasHost: Boolean(host),
    hasShop: Boolean(normalizedShop),
  };
}

function buildEmbeddedQueryString(req, { forceEmbedded = false } = {}) {
  const context = getEmbeddedContext(req);
  const params = new URLSearchParams();
  const inviteId = normalizeInviteId(req.query.invite);

  if (context.shop) params.set("shop", context.shop);
  if (context.host) params.set("host", context.host);
  if (forceEmbedded || context.embedded) params.set("embedded", "1");
  if (inviteId) params.set("invite", inviteId);

  const encoded = params.toString();
  return encoded ? `?${encoded}` : "";
}

function redirectToDashboardWithQuery(req, res) {
  return res.redirect(307, `/dashboard/${buildEmbeddedQueryString(req, { forceEmbedded: false })}`);
}

function resolveRequestOrigin(req) {
  const originHeader = String(req.get("origin") || "").trim();
  const publicBaseUrl = getConfiguredPublicBaseUrl();
  if (originHeader && !isLocalHostLike(originHeader)) {
    return originHeader.replace(/\/+$/, "");
  }

  const proto = String(req.get("x-forwarded-proto") || req.protocol || "http")
    .split(",")[0]
    .trim() || "http";
  const host = String(req.get("x-forwarded-host") || req.get("host") || "")
    .split(",")[0]
    .trim();

  if (host && isLocalHostLike(host) && publicBaseUrl) {
    return publicBaseUrl;
  }

  if (originHeader && isLocalHostLike(originHeader) && publicBaseUrl) {
    return publicBaseUrl;
  }

  if (!host) {
    return "http://127.0.0.1:8081";
  }

  return `${proto}://${host}`.replace(/\/+$/, "");
}
app.get("/app", redirectToDashboardWithQuery);
app.get("/app\/", redirectToDashboardWithQuery);
app.get("/app\/.*", redirectToDashboardWithQuery);

app.use(cookieParser());
app.use(cors());
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ ok: false, error: "stripe_not_configured" });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.get("stripe-signature") || "",
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    console.error("[fix-checkout:webhook] signature verification failed:", error instanceof Error ? error.message : String(error));
    return res.status(400).json({ ok: false, error: "invalid_webhook_signature" });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const result = await markFixCheckoutSessionCompleted(event.data?.object || {});
      return res.json({ ok: true, received: true, result });
    }

    return res.json({ ok: true, received: true, ignored: event.type });
  } catch (error) {
    console.error("[fix-checkout:webhook] handling failed:", error instanceof Error ? error.message : String(error));
    return res.status(500).json({ ok: false, error: "webhook_failed" });
  }
});
app.use(express.json());

// --- Abando deploy fingerprint (v1) ---
// --- ABANDO_VERSION_DYNAMIC_V1 ---
app.get("/api/version", (_req, res) => {
  const git = process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || process.env.VERCEL_GIT_COMMIT_SHA || "unknown";
  const built = process.env.BUILT_AT_UTC || new Date().toISOString();
  res.json({ ok: true, service: "cart-agent", git, built_at_utc: built });
});

// Dashboard architecture note:
// - Canonical embedded dashboard path: server-rendered `/dashboard` + `getDashboardSummary`.
// - Canonical JSON surface: `/api/dashboard/summary`.
// - Dashboard summary source-of-truth: `web/src/lib/dashboardSummary.js`.
// - Dev tunnel session source-of-truth: `.tmp/dev-session.json`, written by `scripts/dev/start_shopify_dev_stable.sh`.

function resolveDashboardShopFromRequest(req) {
  return getEmbeddedContext(req).shop;
}

function buildAbandoMerchantSummaryResponse(summary, { notes = [] } = {}) {
  const checkoutEventCount = Number(summary?.checkoutEventCount || summary?.checkoutEventsCount || 0);
  const status = summary?.connectionStatus === "connected"
    ? checkoutEventCount >= 1
      ? "recovery_ready"
      : "listening"
    : "not_connected";
  const recoveryStatus = ["created", "sent", "failed"].includes(summary?.recoveryActionStatus)
    ? summary.recoveryActionStatus
    : "none";
  const lastEventSeen = ["checkout_started", "checkout_risk", "test_event"].includes(summary?.latestEventType)
    ? summary.latestEventType
    : "none";

  return {
    ok: true,
    product: "abando",
    status,
    recoveryStatus,
    eventCount: checkoutEventCount,
    lastEventSeen,
    lastEventAt: summary?.latestEventTimestamp || summary?.lastCheckoutEventAt || null,
    lastRecoveryActionAt: summary?.lastRecoveryActionAt || null,
    lastRecoveryActionType: summary?.lastRecoveryActionType || null,
    notes: Array.isArray(notes) ? notes : [],
  };
}

async function resolveMerchantSummaryShop(req) {
  const requestedShop = normalizeShop(req.query.shop);
  if (requestedShop) {
    return { shop: requestedShop, notes: [] };
  }

  const shops = await prisma.shop.findMany({
    orderBy: { createdAt: "desc" },
    take: 2,
    select: { key: true },
  });

  if (shops.length === 1 && shops[0]?.key) {
    return { shop: shops[0].key, notes: [] };
  }

  if (shops.length > 1) {
    return {
      shop: null,
      notes: ["Multiple shops exist; provide ?shop=<shop-domain> for a merchant summary."],
    };
  }

  return { shop: null, notes: ["No Abando data connected yet."] };
}

app.get("/api/dashboard/summary", async (req, res) => {
  const shop = resolveDashboardShopFromRequest(req);

  if (!shop) {
    return res.status(400).json({ ok: false, error: "missing_shop_context" });
  }

  try {
    const summary = await getDashboardSummary(prisma, shop);

    if (!summary) {
      return res.status(404).json({ ok: false, error: "shop_not_found", shop });
    }

    return res.status(200).json({ ok: true, summary });
  } catch (error) {
    console.error("[dashboard] summary api failed", {
      shop,
      error: error instanceof Error ? error.message : String(error),
    });

    return res.status(500).json({ ok: false, error: "dashboard_summary_failed" });
  }
});

app.get("/api/abando/merchant-summary", async (req, res) => {
  try {
    const { shop, notes } = await resolveMerchantSummaryShop(req);

    if (!shop) {
      return res.status(200).json(buildAbandoMerchantSummaryResponse(null, { notes }));
    }

    const summary = await getDashboardSummary(prisma, shop);

    if (!summary) {
      return res.status(200).json(buildAbandoMerchantSummaryResponse(null, { notes }));
    }

    return res.status(200).json(buildAbandoMerchantSummaryResponse(summary, { notes }));
  } catch (error) {
    console.error("[abando] merchant summary failed", {
      shop: normalizeShop(req.query.shop),
      error: error instanceof Error ? error.message : String(error),
    });

    return res.status(500).json({ ok: false, error: "merchant_summary_failed" });
  }
});

app.get("/api/dev/session-status", async (_req, res) => {
  try {
    const state = await readDevSessionState();
    const port = process.env.PORT ? Number(process.env.PORT) : 8081;
    const localServerUrl = `http://127.0.0.1:${port}`;
    const activeTunnelUrl =
      typeof state?.activeTunnelUrl === "string" && state.activeTunnelUrl.length > 0
        ? state.activeTunnelUrl
        : null;
    const activeTunnelHost =
      typeof state?.activeTunnelHost === "string" && state.activeTunnelHost.length > 0
        ? state.activeTunnelHost
        : null;
    const dashboardUrl = activeTunnelUrl
      ? `${activeTunnelUrl}/dashboard?embedded=1&shop=cart-agent-dev.myshopify.com&host=test-host`
      : null;
    const summaryUrl = activeTunnelUrl
      ? `${activeTunnelUrl}/api/dashboard/summary?shop=cart-agent-dev.myshopify.com`
      : null;
    const tunnelLooksStale = await getTunnelLooksStale(activeTunnelHost);

    return res.status(200).json({
      ok: true,
      activeTunnelUrl,
      activeTunnelHost,
      localServerUrl,
      dashboardUrl,
      summaryUrl,
      previewUrl: state?.previewUrl || null,
      detectedAt: state?.detectedAt || null,
      tunnelLooksStale,
      tunnelMode: state?.tunnelMode || null,
      missingPrerequisites: Array.isArray(state?.missingPrerequisites) ? state.missingPrerequisites : [],
    });
  } catch (error) {
    console.error("[dev-session] status failed", error);
    return res.status(500).json({ ok: false, error: "dev_session_status_failed" });
  }
});
// --- end fingerprint ---


// --- Abando V1 request logging ---
// Marker: ABANDO_LOG_V1
// Toggle: ABANDO_LOG_V1=0 disables. Default ON.
// Optional: ABANDO_LOG_SKIP_REGEX overrides skip filter.
app.use((req, res, next) => {
  try {
    const enabled = process.env.ABANDO_LOG_V1 !== "0";
    if (!enabled) return next();

    const skipRe = process.env.ABANDO_LOG_SKIP_REGEX
      ? new RegExp(process.env.ABANDO_LOG_SKIP_REGEX)
      : /^(?:\/_next\b|\/favicon\.ico$|\/robots\.txt$|\/__nextjs|\/sockjs-node\b|.*\.(?:map|png|jpg|jpeg|gif|svg|ico|css|js)$)/i;

    const url = req.originalUrl || req.url || "";
    if (skipRe.test(url)) return next();

    const start = process.hrtime.bigint();

    const inboundRid = req.headers["x-request-id"];
    const rid =
      (Array.isArray(inboundRid) ? inboundRid[0] : inboundRid) ||
      `abando-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    res.setHeader("x-request-id", rid);

    const host = req.headers.host || "";
    const xfHost = req.headers["x-forwarded-host"] || "";
    const xfFor = req.headers["x-forwarded-for"] || "";
    const referer = req.headers.referer || "";
    const ua = req.headers["user-agent"] || "";
    const secFetchDest = req.headers["sec-fetch-dest"] || "";

    const isTunnel =
      String(host).includes("trycloudflare.com") ||
      String(xfHost).includes("trycloudflare.com");

    const q = req.query || {};
    const shop = q.shop || "";
    const embedded = q.embedded || "";

    const auth = req.headers.authorization || "";
    const hasBearer = typeof auth === "string" && auth.toLowerCase().startsWith("bearer ");
    const cookieHeader = req.headers.cookie || "";
    const hasSessionCookie =
      typeof cookieHeader === "string" && /(session|shopify|_secure)/i.test(cookieHeader);

    res.on("finish", () => {
      try {
        const end = process.hrtime.bigint();
        const ms = Number(end - start) / 1e6;

        const line = {
          tag: "abando.v1",
          rid,
          t: new Date().toISOString(),
          method: req.method,
          path: url,
          status: res.statusCode,
          ms: Math.round(ms * 10) / 10,

          host,
          xfHost: Array.isArray(xfHost) ? xfHost[0] : xfHost,
          xfFor: Array.isArray(xfFor) ? xfFor[0] : xfFor,
          referer,
          secFetchDest,
          isTunnel,

          shop,
          embedded,
          hasBearer,
          hasSessionCookie,

          ua: typeof ua === "string" ? ua.slice(0, 140) : ""
        };

        console.log(JSON.stringify(line));
      } catch (e) {
        console.log("[abando.v1] log error", String(e));
      }
    });

    return next();
  } catch (e) {
    console.log("[abando.v1] middleware error", String(e));
    return next();
  }
});


// Static + simple pages

// ABANDO_DASHBOARD_NOREDIRECT_V1
// Serve a minimal merchant dashboard directly to avoid /dashboard -> /dashboard/ 301 dropping embedded/shop query params.
app.get("/dashboard", async (req, res) => {
  const embeddedContext = getEmbeddedContext(req);
  const shop = embeddedContext.shop;
  const inviteId = normalizeInviteId(req.query.invite);

  if (inviteId) {
    await markInviteSessionReached(inviteId, {
      shopDomain: shop,
      sessionSurface: embeddedContext.embedded ? "shopify_admin_session" : "merchant_workspace",
    });
  }

  const dashboardState = await getSafeDashboardState(shop);

  return res.status(200).type("html").send(
    renderMerchantDashboardPage({
      ...dashboardState,
      embeddedContext,
      appOrigin: `${req.protocol}://${req.get("host")}`,
    }),
  );
});
app.get("/dashboard/", async (req, res) => {
  const embeddedContext = getEmbeddedContext(req);
  const shop = embeddedContext.shop;
  const inviteId = normalizeInviteId(req.query.invite);

  if (inviteId) {
    await markInviteSessionReached(inviteId, {
      shopDomain: shop,
      sessionSurface: embeddedContext.embedded ? "shopify_admin_session" : "merchant_workspace",
    });
  }

  const dashboardState = await getSafeDashboardState(shop);

  return res.status(200).type("html").send(
    renderMerchantDashboardPage({
      ...dashboardState,
      embeddedContext,
      appOrigin: `${req.protocol}://${req.get("host")}`,
    }),
  );
});
// /ABANDO_DASHBOARD_NOREDIRECT_V1

installScorecardRoute(app);
installAskAbandoRoute(app);
installGuidedAuditRoute(app);
installPricingRoute(app);
installRunAuditRoute(app);
installRevenueLeakageEntryRoute(app);
installShopify(app, { getShopRecord });
installInviteRoutes(app);
installSnippet(app);
installCheckoutSignals(app);
installInternalTestRoutes(app);

app.options("/api/checkout-events", (_req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  return res.status(204).end();
});

app.post("/api/checkout-events", async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  try {
    const payload = Array.isArray(req.body) ? req.body : [req.body];
    const events = payload.map(normalizeCheckoutEventPayload);

    for (const event of events) {
      const shopRecord = await prisma.shop.findUnique({
        where: { key: event.shop },
        select: { key: true },
      });

      if (!shopRecord && event.source !== "seeded_dev" && event.source !== "manual_dev") {
        return res.status(404).json({ ok: false, error: "unknown_shop" });
      }
    }

    await prisma.$transaction(
      events.map((event) =>
        prisma.systemEvent.create({
          data: {
            shopDomain: event.shop,
            eventType: "abando.checkout_event.v1",
            visibility: "merchant",
            payload: event,
          },
        })),
    );

    return res.json({
      ok: true,
      saved: events.length,
      lastEventType: events[events.length - 1]?.event_type || null,
      lastEventTimestamp: events[events.length - 1]?.occurredAt || null,
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.post("/api/recovery-actions/create", async (req, res) => {
  try {
    const shop = normalizeShop(String(req.body?.shop || "").trim().toLowerCase());
    if (!shop) {
      return res.status(400).json({ ok: false, error: "missing_shop" });
    }

    const shopRecord = await prisma.shop.findUnique({
      where: { key: shop },
      select: { key: true },
    });

    if (!shopRecord) {
      return res.status(404).json({ ok: false, error: "unknown_shop" });
    }

    const latestCheckoutEvent = await prisma.systemEvent.findFirst({
      where: {
        shopDomain: shop,
        eventType: "abando.checkout_event.v1",
      },
      orderBy: { createdAt: "desc" },
    });

    const checkoutEventCount = await prisma.systemEvent.count({
      where: {
        shopDomain: shop,
        eventType: "abando.checkout_event.v1",
      },
    });

    if (checkoutEventCount < 1) {
      return res.status(409).json({ ok: false, error: "recovery_not_ready" });
    }

    const latestRecoveryAction = await prisma.systemEvent.findFirst({
      where: {
        shopDomain: shop,
        eventType: "abando.recovery_action.v1",
      },
      orderBy: { createdAt: "desc" },
    });

    const latestEventPayload = latestCheckoutEvent?.payload && typeof latestCheckoutEvent.payload === "object"
      ? latestCheckoutEvent.payload
      : null;
    const latestRecoveryPayload = latestRecoveryAction?.payload && typeof latestRecoveryAction.payload === "object"
      ? latestRecoveryAction.payload
      : null;
    const latestEventAt =
      latestEventPayload?.occurredAt ||
      latestEventPayload?.timestamp ||
      latestCheckoutEvent?.createdAt?.toISOString?.() ||
      null;

    const requestedEmail = normalizeEmail(req.body?.email);
    const requestedPhone = normalizePhone(req.body?.phone);
    const recoveryMessage = generateRecoveryMessage({
      shop,
      eventData: latestEventPayload || {},
      timestamp: latestEventAt || new Date().toISOString(),
      baseUrl: resolveRequestOrigin(req),
    });
    const emailRecipient =
      requestedEmail ||
      normalizeEmail(latestEventPayload?.customerEmail) ||
      normalizeEmail(latestEventPayload?.email);
    const smsRecipient =
      requestedPhone ||
      normalizePhone(latestEventPayload?.customerPhone) ||
      normalizePhone(latestEventPayload?.phone);

    const emailConfigured = isEmailSenderConfigured();
    const smsConfigured = isSmsSenderConfigured();

    if (
      latestRecoveryPayload
      && typeof latestRecoveryPayload.basedOnEventAt === "string"
      && latestEventAt
      && latestRecoveryPayload.basedOnEventAt === latestEventAt
      && ["created", "sent"].includes(String(latestRecoveryPayload.status || ""))
    ) {
      return res.json({
        ok: true,
        recoveryActionStatus: String(latestRecoveryPayload.status),
        lastRecoveryActionAt:
          typeof latestRecoveryPayload.createdAt === "string"
            ? latestRecoveryPayload.createdAt
            : latestRecoveryAction?.createdAt?.toISOString?.() || null,
        lastRecoveryActionType:
          typeof latestRecoveryPayload.action_type === "string"
            ? latestRecoveryPayload.action_type
            : "recovery_email",
        recoveryActionId: latestRecoveryAction.id,
        sentAt: typeof latestRecoveryPayload.sentAt === "string" ? latestRecoveryPayload.sentAt : null,
        channels: Array.isArray(latestRecoveryPayload.channels) ? latestRecoveryPayload.channels : [],
        delivery: Array.isArray(latestRecoveryPayload.delivery) ? latestRecoveryPayload.delivery : [],
        reused: true,
      });
    }

    const createdAt = new Date().toISOString();
    const delivery = [];
    const actionType = smsConfigured && smsRecipient && !emailRecipient
      ? "recovery_sms"
      : emailRecipient
        ? "recovery_email"
        : "recovery_email";

    const action = await prisma.systemEvent.create({
      data: {
        shopDomain: shop,
        eventType: "abando.recovery_action.v1",
        visibility: "merchant",
        payload: {
          status: "created",
          action_type: actionType,
          createdAt,
          source: "merchant_dashboard",
          basedOnEventAt: latestEventAt,
          delivery,
        },
      },
    });

    async function logDeliveryAttempt(channel, outcome, detail = {}) {
      const entry = {
        channel,
        outcome,
        at: new Date().toISOString(),
        ...detail,
      };
      delivery.push(entry);
      console.log("[recovery-delivery]", {
        shop,
        recoveryActionId: action.id,
        channel,
        outcome,
        detail,
      });
      await prisma.systemEvent.create({
        data: {
          shopDomain: shop,
          eventType: "abando.recovery_delivery.v1",
          visibility: "merchant",
          relatedJobId: action.id,
          payload: entry,
        },
      });
    }

    const sendResult = await executeRecoverySend({
      shop,
      email: emailRecipient,
      phone: smsRecipient,
      recoveryMessage,
      actionId: action.id,
      testMode: false,
      logDeliveryAttempt,
    });

    const finalStatus = sendResult.successfulChannels.length > 0 ? "sent" : "created";
    const finalActionType =
      sendResult.successfulChannels.includes("email") ? "recovery_email" :
      sendResult.successfulChannels.includes("sms") ? "recovery_sms" :
      actionType;
    const sendNotConfigured = !sendResult.emailConfigured;

    await prisma.systemEvent.update({
      where: { id: action.id },
      data: {
        payload: {
          status: finalStatus,
          action_type: finalActionType,
          createdAt,
          source: "merchant_dashboard",
          basedOnEventAt: latestEventAt,
          delivery: sendResult.delivery,
          lastError: sendResult.sendError,
          emailConfigured: sendResult.emailConfigured,
          smsConfigured: sendResult.smsConfigured,
          sendNotConfigured,
          channel: sendResult.successfulChannels[0] || null,
          channels: sendResult.successfulChannels,
          messageId: sendResult.messageId,
          smsSid: sendResult.smsSid,
          sentAt: sendResult.sentAt,
          attemptedRealSend: sendResult.successfulChannels.length > 0 || sendResult.failedChannels.length > 0,
        },
      },
    });

    return res.json({
      ok: true,
      recoveryActionStatus: finalStatus,
      lastRecoveryActionAt: createdAt,
      lastRecoveryActionType: finalActionType,
      recoveryActionId: action.id,
      sentAt: sendResult.sentAt,
      channels: sendResult.successfulChannels,
      messageId: sendResult.messageId,
      smsSid: sendResult.smsSid,
      delivery: sendResult.delivery,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.post("/api/recovery-actions/send-test", async (req, res) => {
  try {
    const shop = normalizeShop(String(req.body?.shop || "").trim().toLowerCase());
    if (!shop) {
      return res.status(400).json({ ok: false, error: "missing_shop" });
    }

    const shopRecord = await prisma.shop.findUnique({
      where: { key: shop },
      select: { key: true },
    });

    if (!shopRecord) {
      return res.status(404).json({ ok: false, error: "unknown_shop" });
    }

    const latestCheckoutEvent = await prisma.systemEvent.findFirst({
      where: {
        shopDomain: shop,
        eventType: "abando.checkout_event.v1",
      },
      orderBy: { createdAt: "desc" },
    });

    const checkoutEventCount = await prisma.systemEvent.count({
      where: {
        shopDomain: shop,
        eventType: "abando.checkout_event.v1",
      },
    });

    if (checkoutEventCount < 1) {
      return res.status(409).json({ ok: false, error: "recovery_not_ready" });
    }

    const latestEventPayload = latestCheckoutEvent?.payload && typeof latestCheckoutEvent.payload === "object"
      ? latestCheckoutEvent.payload
      : null;
    const latestEventAt =
      latestEventPayload?.occurredAt ||
      latestEventPayload?.timestamp ||
      latestCheckoutEvent?.createdAt?.toISOString?.() ||
      new Date().toISOString();
    const email = "rossstafford1@gmail.com";
    const phone = normalizePhone("+16172703075");
    const recoveryMessage = generateRecoveryMessage({
      shop,
      eventData: latestEventPayload || {},
      timestamp: latestEventAt,
      baseUrl: resolveRequestOrigin(req),
    });

    const sendResult = await executeRecoverySend({
      shop,
      email,
      phone,
      recoveryMessage,
      actionId: null,
      testMode: true,
      logDeliveryAttempt: null,
    });

    const timestamp = new Date().toISOString();
    await prisma.systemEvent.create({
      data: {
        shopDomain: shop,
        eventType: "abando.recovery_send_test.v1",
        visibility: "merchant",
        payload: {
          shop,
          email,
          phone,
          successfulChannels: sendResult.successfulChannels,
          failedChannels: sendResult.failedChannels,
          missingEnvVars: sendResult.missingEnvVars,
          providerStatuses: sendResult.providerStatuses,
          timestamp,
          testMode: true,
          status: sendResult.status,
          messageId: sendResult.messageId,
          smsSid: sendResult.smsSid,
          delivery: sendResult.delivery,
        },
      },
    });

    return res.json({
      ok: true,
      shop,
      email,
      phone,
      status: sendResult.status,
      successfulChannels: sendResult.successfulChannels,
      failedChannels: sendResult.failedChannels,
      missingEnvVars: sendResult.missingEnvVars,
      providerStatuses: sendResult.providerStatuses,
      messageId: sendResult.messageId,
      smsSid: sendResult.smsSid,
      timestamp,
      testMode: true,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.post("/api/recovery-actions/send-live-test", async (req, res) => {
  try {
    const shop = normalizeShop(String(req.body?.shop || "").trim().toLowerCase());
    if (!shop) {
      return res.status(400).json({ success: false, error: "missing_shop" });
    }

    const experienceId = normalizeExperienceId(req.body?.experienceId);
    const email = normalizeEmail(req.body?.email);
    const rawPhone = String(req.body?.phone || "");
    const phone = normalizePhone(rawPhone);

    if (!email && !rawPhone.trim()) {
      return res.status(400).json({ success: false, error: "email_or_phone_required" });
    }

    if (email && !isValidEmail(email)) {
      return res.status(400).json({ success: false, error: "invalid_email" });
    }

    if (rawPhone.trim() && !phone) {
      return res.status(400).json({ success: false, error: "invalid_phone" });
    }

    const shopRecord = await prisma.shop.findUnique({
      where: { key: shop },
      select: { key: true },
    });

    if (!shopRecord) {
      return res.status(404).json({ success: false, error: "unknown_shop" });
    }

    const latestCheckoutEvent = await prisma.systemEvent.findFirst({
      where: {
        shopDomain: shop,
        eventType: "abando.checkout_event.v1",
      },
      orderBy: { createdAt: "desc" },
    });

    const checkoutEventCount = await prisma.systemEvent.count({
      where: {
        shopDomain: shop,
        eventType: "abando.checkout_event.v1",
      },
    });

    if (checkoutEventCount < 1) {
      return res.status(409).json({ success: false, error: "recovery_not_ready" });
    }

    const latestEventPayload = latestCheckoutEvent?.payload && typeof latestCheckoutEvent.payload === "object"
      ? latestCheckoutEvent.payload
      : null;
    const latestEventAt =
      latestEventPayload?.occurredAt ||
      latestEventPayload?.timestamp ||
      latestCheckoutEvent?.createdAt?.toISOString?.() ||
      new Date().toISOString();

    const recoveryMessage = experienceId
      ? buildExperienceRecoveryMessage({
          req,
          shop,
          eventData: latestEventPayload || {},
          timestamp: latestEventAt,
          experienceId,
        })
      : generateRecoveryMessage({
          shop,
          eventData: latestEventPayload || {},
          timestamp: latestEventAt,
          baseUrl: resolveRequestOrigin(req),
        });

    const sendResult = await executeRecoverySend({
      shop,
      email,
      phone,
      recoveryMessage,
      actionId: null,
      testMode: true,
      logDeliveryAttempt: null,
    });

    const timestamp = new Date().toISOString();
    const summary = summarizeSendResult(sendResult);
    await persistExperienceSendRecords({
      shop,
      experienceId,
      sendResult,
    });

    await prisma.systemEvent.create({
      data: {
        shopDomain: shop,
        eventType: "abando.live_test_send.v1",
        visibility: "merchant",
        payload: {
          shop,
          experienceId: experienceId || null,
          email: email || null,
          phone: phone || null,
          channels: summary.channels,
          successfulChannels: sendResult.successfulChannels,
          failedChannels: sendResult.failedChannels,
          providerStatuses: sendResult.providerStatuses,
          missingEnvVars: sendResult.missingEnvVars,
          timestamp,
          testMode: true,
          status: sendResult.status,
          message: summary.message,
          messageId: sendResult.messageId,
          smsSid: sendResult.smsSid,
        },
      },
    });

    return res.json({
      success: summary.success,
      channels: summary.channels,
      message: summary.message,
      experienceId: experienceId || null,
      providerStatuses: summary.providerStatuses,
      missingEnvVars: summary.missingEnvVars,
      messageId: sendResult.messageId,
      smsSid: sendResult.smsSid,
      timestamp,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.get("/api/recovery-actions/email-readiness", (_req, res) => {
  const configured = isEmailSenderConfigured();
  const missingEnvVars = configured ? [] : getMissingEmailEnvVars();

  return res.json({
    ok: true,
    email: {
      configured,
      missingEnvVars,
    },
  });
});

app.get("/api/experience/status", async (req, res) => {
  try {
    const shop = normalizeShop(String(req.query?.shop || "").trim().toLowerCase());
    const experienceId = normalizeExperienceId(req.query?.eid);

    if (!shop) {
      return res.status(400).json({ ok: false, error: "missing_shop" });
    }

    if (!experienceId) {
      return res.status(400).json({ ok: false, error: "missing_experience_id" });
    }

    const status = await getExperienceStatus(shop, experienceId);
    return res.json({
      ok: true,
      ...status,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.post("/api/recovery/return", async (req, res) => {
  try {
    const token = String(req.body?.token || "").trim();
    const parsed = parseRecoveryToken(token);
    const timestamp = new Date().toISOString();

    const event = await prisma.systemEvent.create({
      data: {
        shopDomain: parsed.shop,
        eventType: "abando.customer_return.v1",
        visibility: "merchant",
        payload: {
          shop: parsed.shop,
          timestamp,
          source: "recovery_link",
          token,
        },
      },
    });

    return res.json({
      ok: true,
      eventId: event.id,
      shop: parsed.shop,
      timestamp,
      source: "recovery_link",
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.get("/api/recovery/return", async (req, res) => {
  try {
    const shop = normalizeShop(String(req.query?.shop || "").trim().toLowerCase());
    const experienceId = normalizeExperienceId(req.query?.eid);
    const channel = String(req.query?.channel || "").trim().toLowerCase();

    if (!shop) {
      return res.status(400).type("html").send("<h1>Missing shop</h1>");
    }

    if (!experienceId) {
      return res.status(400).type("html").send("<h1>Missing experience id</h1>");
    }

    if (!["email", "sms"].includes(channel)) {
      return res.status(400).type("html").send("<h1>Invalid channel</h1>");
    }

    const events = await listExperienceSendEvents(shop, experienceId);
    const matchingEvent = events.find((event) => {
      const payload = event?.payload;
      return payload
        && typeof payload === "object"
        && String(payload.channel || "").toLowerCase() === channel;
    });

    if (!matchingEvent) {
      return res.status(404).type("html").send("<h1>Recovery send not found</h1>");
    }

    const payload = matchingEvent.payload && typeof matchingEvent.payload === "object"
      ? matchingEvent.payload
      : {};
    const returnedAt = new Date().toISOString();

    await prisma.systemEvent.update({
      where: { id: matchingEvent.id },
      data: {
        payload: {
          ...payload,
          returned: true,
          returnedAt,
        },
      },
    });

    await prisma.systemEvent.create({
      data: {
        shopDomain: shop,
        eventType: "abando.customer_return.v1",
        visibility: "merchant",
        payload: {
          shop,
          timestamp: returnedAt,
          source: "recovery_link",
          experienceId,
          channel,
        },
      },
    });

    return res.redirect(
      302,
      `/experience/returned?shop=${encodeURIComponent(shop)}&eid=${encodeURIComponent(experienceId)}`,
    );
  } catch (error) {
    return res.status(400).type("html").send(`<h1>${escapeHtml(error instanceof Error ? error.message : String(error))}</h1>`);
  }
});

app.get("/recover/:token", async (req, res) => {
  try {
    const token = String(req.params?.token || "").trim();
    const parsed = parseRecoveryToken(token);
    const timestamp = new Date().toISOString();

    await prisma.systemEvent.create({
      data: {
        shopDomain: parsed.shop,
        eventType: "abando.customer_return.v1",
        visibility: "merchant",
        payload: {
          shop: parsed.shop,
          timestamp,
          source: "recovery_link",
          token,
        },
      },
    });

    return res.redirect(
      302,
      `/checkout-placeholder?shop=${encodeURIComponent(parsed.shop)}&source=recovery_link`,
    );
  } catch (error) {
    return res.status(400).type("html").send("<h1>Invalid recovery link</h1>");
  }
});

app.get("/checkout-placeholder", (req, res) => {
  const shop = normalizeShop(req.query.shop);
  return res.status(200).type("html").send(`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Abando recovery return</title></head>
<body style="font-family: system-ui, sans-serif; background:#020617; color:#e2e8f0; padding:40px;">
  <main style="max-width:720px; margin:0 auto;">
    <h1 style="font-size:32px; margin-bottom:12px;">Customer returned</h1>
    <p style="line-height:1.6;">This is a placeholder checkout surface for the Abando recovery demo.</p>
    <p style="line-height:1.6;">Store: ${escapeHtml(shop || "Unknown store")}</p>
    <p style="line-height:1.6;">No order completion is being faked here.</p>
  </main>
</body>
</html>`);
});

app.get("/experience", async (req, res) => {
  const shop = normalizeShop(String(req.query?.shop || "").trim().toLowerCase());
  const experienceId = normalizeExperienceId(req.query?.eid);
  const experienceStatus = shop && experienceId
    ? await getExperienceStatus(shop, experienceId)
    : {
        configured: {
          email: isEmailSenderConfigured(),
          sms: isSmsSenderConfigured(),
        },
        send: {
          status: null,
          channel: null,
          target: null,
          sentAt: null,
        },
        return: {
          returned: false,
          returnedAt: null,
        },
      };

  return res.status(200).type("html").send(
    renderExperiencePage({
      shop,
      experienceId,
      experienceStatus,
    }),
  );
});

app.get("/experience/returned", async (req, res) => {
  const shop = normalizeShop(String(req.query?.shop || "").trim().toLowerCase());
  const experienceId = normalizeExperienceId(req.query?.eid);
  const experienceStatus = shop && experienceId
    ? await getExperienceStatus(shop, experienceId)
    : {
        configured: {
          email: isEmailSenderConfigured(),
          sms: isSmsSenderConfigured(),
        },
        send: {
          status: null,
          channel: null,
          target: null,
          sentAt: null,
        },
        return: {
          returned: false,
          returnedAt: null,
        },
      };

  return res.status(200).type("html").send(
    renderExperienceReturnedPage({
      shop,
      experienceId,
      experienceStatus,
    }),
  );
});

app.get("/audit", (_req, res) => {
  return res.status(200).type("html").send(renderAuditPage());
});

app.get("/merchant", async (_req, res) => {
  const merchantState = await getMerchantSurfaceState("mvp-demo-proof.myshopify.com");
  return res.status(200).type("html").send(renderMerchantPage(merchantState));
});

app.use(
  [
    "/ops",
    "/api/activate",
    "/api/opportunities",
    "/api/signals",
    "/api/candidate-opportunities",
    "/api/opportunity-scoring",
    "/api/slices",
    "/api/build-queue",
    "/api/execution-packets",
    "/api/packet-executor",
    "/api/feedback",
    "/api/system-state",
    "/api/operator-brain",
    "/api/execution-gate",
    "/api/packet-validator",
    "/api/signal-interpreter",
    "/api/checkout-benchmark",
    "/api/checkout-score",
  ],
  internalOnly,
);

app.use(express.static(publicDir, { redirect: false }));
app.get("/", sendRootHtml);
app.get("/onboarding", (_req, res) => res.sendFile(join(publicDir, "onboarding", "index.html")));

// Health/hello
app.get("/healthz", (_req, res) => res.type("text/plain").send("ok"));
// Ops: identify running service/build (deterministic routing)
const __ABANDO_STARTED_AT = new Date().toISOString();
app.get("/ops/whoami", (_req, res) => res.json({
  ok: true,
  service_id: process.env.RENDER_SERVICE_ID || null,
  service_name: process.env.RENDER_SERVICE_NAME || null,
  git: process.env.RENDER_GIT_COMMIT || process.env.GIT_SHA || null,
  external_url: process.env.RENDER_EXTERNAL_URL || null,
  node_env: process.env.NODE_ENV || null,
  hostname: process.env.HOSTNAME || null,
  started_at: __ABANDO_STARTED_AT,
}));

// Health aliases (Render/monitors often hit /health)
app.get("/health", (_req, res) => res.type("text/plain").send("ok"));
app.get("/api/health", (_req, res) => res.type("text/plain").send("ok"));
app.get("/api/healthz", (_req, res) => res.type("text/plain").send("ok"));
app.get("/headers", (req, res) => {
  return res.json({
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    path: req.path,
    host: req.get("host"),
    hostname: req.hostname,
    protocol: req.protocol,
    secure: req.secure,
    ips: req.ips,
    "headers.host": req.headers.host || null,
    "headers.origin": req.headers.origin || null,
    'headers["x-forwarded-host"]': req.headers["x-forwarded-host"] || null,
    'headers["x-forwarded-proto"]': req.headers["x-forwarded-proto"] || null,
    'headers["cf-ray"]': req.headers["cf-ray"] || null,
    'headers["cf-connecting-ip"]': req.headers["cf-connecting-ip"] || null,
    'headers["user-agent"]': req.headers["user-agent"] || null,
  });
});

app.get("/hello", (_req, res) => res.json({ msg: "Hello from Abando!" }));

// Prisma
const prisma = new PrismaClient();

// Env
const APP_URL            = process.env.APP_URL || "https://pay.abando.ai";
const SHOPIFY_API_KEY    = process.env.SHOPIFY_API_KEY    || "";
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || "";
const SHOPIFY_SCOPES     = process.env.SHOPIFY_SCOPES
  || "read_checkouts,read_orders,write_checkouts,read_script_tags,write_script_tags";

if (String(process.env.NODE_ENV || "").trim().toLowerCase() === "production") {
  getStaffordosUrl();
}

// Helpers

function safeJsonParse(s) { try { return JSON.parse(s); } catch { return null; } }

function b64urlDecode(str) {
  try {
    str = String(str || "").replace(/-/g, "+").replace(/_/g, "/");
    while (str.length % 4) str += "=";
    return Buffer.from(str, "base64").toString("utf8");
  } catch {
    return "";
  }
}

// id_token payload often contains: { dest: "https://{shop}.myshopify.com", iss: "https://{shop}.myshopify.com/admin", ... }
function extractShopFromIdToken(idToken) {
  const t = String(idToken || "");
  const parts = t.split(".");
  if (parts.length < 2) return "";
  const payloadJson = b64urlDecode(parts[1]);
  const payload = safeJsonParse(payloadJson) || {};
  const dest = String(payload.dest || "");
  const iss  = String(payload.iss  || "");

  // Prefer dest hostname
  try {
    if (dest) {
      const u = new URL(dest);
      if (u.hostname) return u.hostname;
    }
  } catch {}

  // Fallback: iss hostname (strip /admin)
  try {
    if (iss) {
      const u = new URL(iss);
      if (u.hostname) return u.hostname;
    }
  } catch {}

  return "";
}
function signParams(params) {
  const keys = Object.keys(params).filter(k => k !== "hmac").sort();
  const message = keys.map(k => `${k}=${params[k]}`).join("&");
  return createHmac("sha256", SHOPIFY_API_SECRET).update(message).digest("hex");
}
async function getShopRecord(domain) {
  return prisma.shop.findUnique({
    where: { key: domain },
  });
}
async function getSafeDashboardState(shop) {
  try {
    const summary = shop ? await getDashboardSummary(prisma, shop) : null;

    if (summary) return summary;

    return {
      shopDomain: shop || "Unknown store",
      connectionStatus: "not_connected",
      listeningStatus: "idle",
      lastCheckoutEventAt: null,
      checkoutEventsCount: 0,
      recoveryStatus: "not_ready",
      recoveryActionStatus: "none",
      lastRecoveryActionAt: null,
      lastRecoveryActionType: null,
      lastCustomerReturnAt: null,
      customerReturned: false,
      installedAt: "Not recorded",
      artifactStatus: "Pending",
      planTier: "free",
      abandoStatus: "Pending",
      merchantRecoveryStatus: "Not active",
      latestEventType: null,
      latestEventTimestamp: null,
      checkoutEventCount: 0,
      cartsTotal: 0,
      cartsRecovered: 0,
      emailsSent: 0,
      realAttributedRevenueCents: 0,
      realAttributedOrderCount: 0,
      decisionsObserved: 0,
      interceptsShown: 0,
      continuedAfterIntercept: 0,
      dismissedAfterIntercept: 0,
      validationDecisionsObserved: 0,
      validationInterceptsShown: 0,
      validationContinuedAfterIntercept: 0,
      validationDismissedAfterIntercept: 0,
    };
  } catch (error) {
    console.error("[dashboard] merchant lookup failed", {
      shop,
      error: error && error.message ? error.message : String(error),
    });

    return {
      shopDomain: shop || "Unknown store",
      connectionStatus: "not_connected",
      listeningStatus: "idle",
      lastCheckoutEventAt: null,
      checkoutEventsCount: 0,
      recoveryStatus: "not_ready",
      recoveryActionStatus: "none",
      lastRecoveryActionAt: null,
      lastRecoveryActionType: null,
      lastCustomerReturnAt: null,
      customerReturned: false,
      installedAt: "Not recorded",
      artifactStatus: "Pending",
      planTier: "free",
      abandoStatus: "Pending",
      merchantRecoveryStatus: "Not active",
      latestEventType: null,
      latestEventTimestamp: null,
      checkoutEventCount: 0,
      cartsTotal: 0,
      cartsRecovered: 0,
      emailsSent: 0,
      realAttributedRevenueCents: 0,
      realAttributedOrderCount: 0,
      decisionsObserved: 0,
      interceptsShown: 0,
      continuedAfterIntercept: 0,
      dismissedAfterIntercept: 0,
      validationDecisionsObserved: 0,
      validationInterceptsShown: 0,
      validationContinuedAfterIntercept: 0,
      validationDismissedAfterIntercept: 0,
    };
  }
}

function formatUsdFromCents(value) {
  const cents = Number(value || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

const CHECKOUT_EVENT_TYPES = new Set([
  "cart_view",
  "checkout_started",
  "payment_started",
  "purchase_completed",
  "checkout_abandon",
  "checkout_return",
]);

const CHECKOUT_STAGE_MAP = {
  cart_view: "cart",
  checkout_started: "checkout",
  payment_started: "payment",
  purchase_completed: "purchase",
  checkout_abandon: "checkout",
  checkout_return: "checkout",
};

const CHECKOUT_EVENT_SOURCES = new Set([
  "live_storefront",
  "live_extension",
  "seeded_dev",
  "manual_dev",
  "pixel",
  "webhook",
  "api",
]);

const CHECKOUT_EVENT_DEVICES = new Set(["mobile", "desktop", "tablet", "unknown"]);

function normalizeCheckoutEventPayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("payload_must_be_object");
  }

  const input = payload;
  const shop = normalizeShop(input.shop);
  const session_id = String(input.session_id || "").trim();
  const timestamp = String(input.timestamp || "").trim();
  const event_type = String(input.event_type || "").trim();
  const stage = String(input.stage || "").trim();
  const source = String(input.source || "").trim();
  const device_type = String(input.device_type || "unknown").trim();

  if (!shop || !session_id || !timestamp || !event_type || !stage || !source) {
    throw new Error("missing_required_fields");
  }
  if (!CHECKOUT_EVENT_TYPES.has(event_type)) {
    throw new Error("invalid_event_type");
  }
  if (!CHECKOUT_EVENT_SOURCES.has(source)) {
    throw new Error("invalid_source");
  }
  if (!CHECKOUT_EVENT_DEVICES.has(device_type)) {
    throw new Error("invalid_device_type");
  }
  if (CHECKOUT_STAGE_MAP[event_type] !== stage) {
    throw new Error("stage_event_type_mismatch");
  }

  const parsedTimestamp = Date.parse(timestamp);
  if (!Number.isFinite(parsedTimestamp)) {
    throw new Error("invalid_timestamp");
  }

  return {
    id: String(input.id || `event_${randomBytes(8).toString("hex")}`),
    shop,
    session_id,
    timestamp: new Date(parsedTimestamp).toISOString(),
    occurredAt: new Date(parsedTimestamp).toISOString(),
    event_type,
    stage,
    source,
    device_type,
    order_id: input.order_id ? String(input.order_id) : null,
    amount: typeof input.amount === "number" ? input.amount : null,
    metadata:
      input.metadata && typeof input.metadata === "object" && !Array.isArray(input.metadata)
        ? input.metadata
        : null,
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderExperiencePage({
  shop,
  experienceId,
  experienceStatus,
}) {
  const hasParams = Boolean(shop && experienceId);
  const initialState = experienceStatus.return.returned
    ? "returned"
    : experienceStatus.send.status === "sent"
      ? "sent"
      : "idle";
  const hasReturned = Boolean(experienceStatus.return.returned);
  const hasSent = experienceStatus.send.status === "sent";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Abando</title>
  <style>
    :root {
      color-scheme: dark;
    }
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      min-height: 100vh;
      background: radial-gradient(circle at top, rgba(30, 41, 59, 0.22), transparent 42%), #020617;
      color: #e5eef8;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      display: grid;
      place-items: center;
      padding: 28px 18px;
    }
    .shell {
      width: 100%;
      max-width: 440px;
    }
    .brand {
      text-align: center;
      color: #cbd5e1;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin-bottom: 18px;
    }
    .panel {
      background: rgba(15, 23, 42, 0.86);
      border: 1px solid rgba(148, 163, 184, 0.16);
      border-radius: 28px;
      padding: 30px 24px 24px;
      box-shadow: 0 28px 80px rgba(2, 6, 23, 0.42);
    }
    h1 {
      margin: 0;
      color: #f8fafc;
      font-size: clamp(34px, 7vw, 44px);
      line-height: 1.02;
      letter-spacing: -0.05em;
      text-align: center;
    }
    .lede {
      margin: 14px 0 0;
      color: #94a3b8;
      font-size: 15px;
      line-height: 1.6;
      text-align: center;
    }
    .operator-action {
      margin-top: 18px;
      display: grid;
      justify-items: center;
      gap: 8px;
    }
    .operator-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 40px;
      padding: 0 14px;
      border-radius: 999px;
      border: 1px solid rgba(148, 163, 184, 0.16);
      background: rgba(15, 23, 42, 0.66);
      color: #cbd5e1;
      font: inherit;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: -0.01em;
      cursor: pointer;
    }
    .operator-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .operator-feedback {
      min-height: 18px;
      color: #94a3b8;
      font-size: 12px;
      line-height: 1.4;
      text-align: center;
      word-break: break-word;
    }
    .proof-strip {
      margin-top: 22px;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
    }
    .automation-line {
      margin-top: 12px;
      color: #94a3b8;
      font-size: 13px;
      line-height: 1.5;
      text-align: center;
    }
    .proof-step {
      min-height: 72px;
      padding: 12px 12px 10px;
      border-radius: 16px;
      border: 1px solid rgba(148, 163, 184, 0.12);
      background: rgba(2, 6, 23, 0.34);
      display: grid;
      gap: 8px;
      align-content: start;
      transition: border-color 140ms ease, background 140ms ease, color 140ms ease;
    }
    .proof-step-marker {
      width: 20px;
      height: 20px;
      border-radius: 999px;
      border: 1px solid rgba(148, 163, 184, 0.22);
      color: #64748b;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      line-height: 1;
    }
    .proof-step-label {
      color: #94a3b8;
      font-size: 12px;
      line-height: 1.45;
      letter-spacing: -0.01em;
    }
    .proof-step.is-active {
      border-color: rgba(226, 232, 240, 0.18);
      background: rgba(15, 23, 42, 0.72);
    }
    .proof-step.is-active .proof-step-marker {
      border-color: rgba(226, 232, 240, 0.22);
      color: #e2e8f0;
      background: rgba(148, 163, 184, 0.08);
    }
    .proof-step.is-active .proof-step-label {
      color: #e2e8f0;
    }
    .proof-step.is-complete .proof-step-marker {
      border-color: rgba(125, 211, 252, 0.18);
      background: rgba(14, 116, 144, 0.24);
      color: #bae6fd;
    }
    .proof-step.is-complete .proof-step-label {
      color: #cbd5e1;
    }
    .label {
      display: block;
      margin-top: 28px;
      margin-bottom: 10px;
      color: #cbd5e1;
      font-size: 14px;
      font-weight: 600;
    }
    .input {
      width: 100%;
      min-height: 52px;
      padding: 0 16px;
      border-radius: 16px;
      border: 1px solid rgba(148, 163, 184, 0.18);
      background: rgba(2, 6, 23, 0.54);
      color: #f8fafc;
      font: inherit;
      outline: none;
      transition: border-color 120ms ease, box-shadow 120ms ease;
    }
    .input::placeholder {
      color: #64748b;
    }
    .input:focus {
      border-color: rgba(125, 211, 252, 0.5);
      box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.08);
    }
    .button {
      width: 100%;
      margin-top: 14px;
      min-height: 52px;
      border: 0;
      border-radius: 16px;
      background: linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 100%);
      color: #020617;
      font: inherit;
      font-weight: 800;
      letter-spacing: -0.01em;
      cursor: pointer;
    }
    .button:disabled {
      opacity: 0.72;
      cursor: wait;
    }
    .status {
      margin-top: 18px;
      padding: 18px 16px;
      border-radius: 20px;
      background: rgba(2, 6, 23, 0.44);
      border: 1px solid rgba(148, 163, 184, 0.12);
      display: none;
    }
    .status.active {
      display: block;
    }
    .status-title {
      color: #f8fafc;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .status-body {
      margin-top: 8px;
      color: #cbd5e1;
      font-size: 15px;
      line-height: 1.55;
    }
    .status-helper {
      margin-top: 10px;
      color: #94a3b8;
      font-size: 13px;
      line-height: 1.5;
    }
    .status.waiting .status-title {
      font-size: 16px;
      color: #cbd5e1;
    }
    .fineprint {
      margin-top: 18px;
      text-align: center;
      color: #64748b;
      font-size: 12px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <main class="shell">
    <div class="brand">Abando</div>
    <section class="panel">
      <h1>See how much revenue you're leaving behind.</h1>
      <p class="lede">Send yourself the exact recovery your customers receive when they abandon checkout.</p>
      <div class="operator-action">
        <button type="button" class="operator-button" id="generateProofLinkButton" ${shop ? "" : "disabled"}>Generate new proof link</button>
        <div class="operator-feedback" data-generate-proof-feedback></div>
      </div>
      <div class="proof-strip" data-proof-strip>
        <div class="proof-step" data-proof-step="1">
          <div class="proof-step-marker" data-proof-marker="1">1</div>
          <div class="proof-step-label">Abandoned checkout detected</div>
        </div>
        <div class="proof-step" data-proof-step="2">
          <div class="proof-step-marker" data-proof-marker="2">2</div>
          <div class="proof-step-label">Recovery sent</div>
        </div>
        <div class="proof-step" data-proof-step="3">
          <div class="proof-step-marker" data-proof-marker="3">3</div>
          <div class="proof-step-label">Customer returned</div>
        </div>
      </div>
      <div class="automation-line">
        This entire flow runs automatically once installed.
      </div>
      ${hasParams ? "" : `<div class="status active"><div class="status-title">Not configured</div><div class="status-body">This experience link is incomplete.</div></div>`}
      <label class="label" for="experienceTarget">Send a real recovery to yourself</label>
      <input id="experienceTarget" class="input" type="text" placeholder="Enter your email or phone" inputmode="email" ${hasParams ? "" : "disabled"} />
      <button type="button" class="button" id="experienceSendButton" ${hasParams ? "" : "disabled"}>Send recovery</button>

      <div class="status ${initialState === "idle" ? "active" : ""}" data-experience-state="idle">
        <div class="status-body">Enter your email or phone to continue.</div>
      </div>

      <div class="status ${hasSent && !hasReturned ? "active" : ""}" data-experience-state="sent">
        <div class="status-title">Recovery sent</div>
        <div class="status-body">Check your email or phone.</div>
        <div class="status-helper">This is one recovered checkout opportunity.</div>
      </div>

      <div class="status waiting ${hasSent && !hasReturned ? "active" : ""}" data-experience-state="waiting">
        <div class="status-title">Waiting for return…</div>
        <div class="status-helper">This is what happens every time a customer abandons checkout.</div>
      </div>

      <div class="status ${hasReturned ? "active" : ""}" data-experience-state="returned">
        <div class="status-title">Customer returned</div>
        <div class="status-body">This is how abandoned checkout revenue comes back.</div>
      </div>

      <div class="status" data-experience-state="failed">
        <div class="status-title">Send failed</div>
        <div class="status-body" data-experience-failed-copy>We could not send the recovery message.</div>
      </div>

      <div class="status" data-experience-state="not_configured">
        <div class="status-title">Email not configured</div>
        <div class="status-body">Outbound delivery is not yet enabled.</div>
      </div>

      <div class="fineprint">This is already recovering money you were about to lose.</div>
    </section>
  </main>
  <script>
    (function () {
      var shop = ${JSON.stringify(shop)};
      var experienceId = ${JSON.stringify(experienceId)};
      var pollTimer = null;

      function setProofStepState(next) {
        var activeStep = 1;
        var completedUntil = 0;

        if (next === "sent") {
          activeStep = 2;
          completedUntil = 1;
        } else if (next === "returned") {
          activeStep = 3;
          completedUntil = 2;
        }

        document.querySelectorAll("[data-proof-step]").forEach(function (node) {
          var step = Number(node.getAttribute("data-proof-step") || "0");
          node.classList.toggle("is-active", step === activeStep);
          node.classList.toggle("is-complete", step <= completedUntil);
        });

        document.querySelectorAll("[data-proof-marker]").forEach(function (node) {
          var step = Number(node.getAttribute("data-proof-marker") || "0");
          node.textContent = step <= completedUntil ? "✓" : String(step);
        });
      }

      function setActiveState(next) {
        document.querySelectorAll("[data-experience-state]").forEach(function (node) {
          var state = node.getAttribute("data-experience-state");
          var isActive = state === next || (next === "sent" && state === "waiting");
          node.classList.toggle("active", isActive);
        });
        setProofStepState(next);
      }

      function updateStatusUi(payload) {
        if (payload.return && payload.return.returned) {
          setActiveState("returned");
          if (pollTimer) {
            window.clearInterval(pollTimer);
            pollTimer = null;
          }
          return;
        }

        if (payload.send && payload.send.status === "sent") {
          setActiveState("sent");
        }
      }

      async function pollStatus() {
        if (!shop || !experienceId) return;
        var response = await fetch("/api/experience/status?shop=" + encodeURIComponent(shop) + "&eid=" + encodeURIComponent(experienceId));
        var data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error((data && data.error) || "experience_status_failed");
        }
        updateStatusUi(data);
      }

      function startPolling() {
        if (pollTimer) window.clearInterval(pollTimer);
        pollTimer = window.setInterval(function () {
          pollStatus().catch(function () {});
        }, 2000);
      }

      var button = document.getElementById("experienceSendButton");
      var targetInput = document.getElementById("experienceTarget");
      var generateProofButton = document.getElementById("generateProofLinkButton");
      var generateProofFeedback = document.querySelector("[data-generate-proof-feedback]");

      if (button) {
        button.addEventListener("click", async function () {
          var target = targetInput ? String(targetInput.value || "").trim() : "";
          var email = target.indexOf("@") !== -1 ? target : "";
          var phone = email ? "" : target;

          button.disabled = true;
          button.textContent = "Sending…";
          try {
            var response = await fetch("/api/recovery-actions/send-live-test", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                shop: shop,
                email: email,
                phone: phone,
                experienceId: experienceId
              })
            });
            var data = await response.json();
            if (!response.ok) {
              throw new Error((data && data.error) || "experience_send_failed");
            }

            if (data.success) {
              setActiveState("sent");
              startPolling();
              await pollStatus();
              return;
            }

            if (data.message === "not_configured") {
              setActiveState("not_configured");
              return;
            }

            var failedCopy = document.querySelector("[data-experience-failed-copy]");
            if (failedCopy) {
              failedCopy.textContent = data.message === "failed" ? "Send failed." : String(data.message || "experience_send_failed");
            }
            setActiveState("failed");
          } catch (error) {
            var failedCopy = document.querySelector("[data-experience-failed-copy]");
            if (failedCopy) {
              failedCopy.textContent = error && error.message ? error.message : "experience_send_failed";
            }
            setActiveState("failed");
          } finally {
            button.disabled = false;
            button.textContent = "Send recovery";
          }
        });
      }

      if (generateProofButton) {
        generateProofButton.addEventListener("click", async function () {
          if (!shop) return;

          var eid = "proof-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
          var url = window.location.origin + "/experience?shop=" + encodeURIComponent(shop) + "&eid=" + encodeURIComponent(eid);

          try {
            if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
              await navigator.clipboard.writeText(url);
              if (generateProofFeedback) {
                generateProofFeedback.textContent = "New proof link copied";
              }
            } else if (generateProofFeedback) {
              generateProofFeedback.textContent = url;
            }
          } catch (_error) {
            if (generateProofFeedback) {
              generateProofFeedback.textContent = url;
            }
          }
        });
      }

      setProofStepState(${JSON.stringify(initialState)});

      if (${JSON.stringify(hasSent && !hasReturned)}) {
        startPolling();
      }
    })();
  </script>
</body>
</html>`;
}

function renderExperienceReturnedPage({
  shop,
  experienceId,
  experienceStatus,
}) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Abando</title>
  <style>
    :root {
      color-scheme: dark;
    }
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      min-height: 100vh;
      background: radial-gradient(circle at top, rgba(30, 41, 59, 0.22), transparent 42%), #020617;
      color: #e5eef8;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      display: grid;
      place-items: center;
      padding: 28px 18px;
    }
    .shell {
      width: 100%;
      max-width: 440px;
    }
    .brand {
      text-align: center;
      color: #cbd5e1;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin-bottom: 18px;
    }
    .panel {
      background: rgba(15, 23, 42, 0.86);
      border: 1px solid rgba(148, 163, 184, 0.16);
      border-radius: 28px;
      padding: 30px 24px 24px;
      box-shadow: 0 28px 80px rgba(2, 6, 23, 0.42);
      text-align: center;
    }
    h1 {
      margin: 0;
      color: #f8fafc;
      font-size: clamp(34px, 7vw, 44px);
      line-height: 1.02;
      letter-spacing: -0.05em;
    }
    p {
      margin: 14px 0 0;
      color: #cbd5e1;
      line-height: 1.6;
      font-size: 15px;
    }
    a {
      display: inline-flex;
      margin-top: 22px;
      padding: 12px 16px;
      border-radius: 16px;
      background: linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 100%);
      color: #020617;
      text-decoration: none;
      font-weight: 800;
    }
  </style>
</head>
<body>
  <main class="shell">
    <div class="brand">Abando</div>
    <section class="panel">
      <h1>Customer returned</h1>
      <p>This is how abandoned checkout revenue comes back.</p>
      <a href="/experience?shop=${encodeURIComponent(shop || "")}&eid=${encodeURIComponent(experienceId || "")}">Back to experience</a>
    </section>
  </main>
</body>
</html>`;
}

function renderAuditPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Abando Audit</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background: radial-gradient(circle at top, rgba(30, 41, 59, 0.22), transparent 42%), #020617;
      color: #e5eef8;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      display: grid;
      place-items: center;
      padding: 28px 18px;
    }
    .shell {
      width: 100%;
      max-width: 460px;
    }
    .brand {
      text-align: center;
      color: #cbd5e1;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin-bottom: 18px;
    }
    .panel {
      background: rgba(15, 23, 42, 0.86);
      border: 1px solid rgba(148, 163, 184, 0.16);
      border-radius: 28px;
      padding: 30px 24px 24px;
      box-shadow: 0 28px 80px rgba(2, 6, 23, 0.42);
    }
    h1 {
      margin: 0;
      color: #f8fafc;
      font-size: clamp(34px, 7vw, 44px);
      line-height: 1.02;
      letter-spacing: -0.05em;
      text-align: center;
    }
    .lede {
      margin: 14px 0 0;
      color: #94a3b8;
      font-size: 15px;
      line-height: 1.6;
      text-align: center;
    }
    .label {
      display: block;
      margin-top: 28px;
      margin-bottom: 10px;
      color: #cbd5e1;
      font-size: 14px;
      font-weight: 600;
    }
    .input {
      width: 100%;
      min-height: 52px;
      padding: 0 16px;
      border-radius: 16px;
      border: 1px solid rgba(148, 163, 184, 0.18);
      background: rgba(2, 6, 23, 0.54);
      color: #f8fafc;
      font: inherit;
      outline: none;
    }
    .input::placeholder {
      color: #64748b;
    }
    .input:focus {
      border-color: rgba(125, 211, 252, 0.5);
      box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.08);
    }
    .button {
      width: 100%;
      margin-top: 14px;
      min-height: 52px;
      border: 0;
      border-radius: 16px;
      background: linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 100%);
      color: #020617;
      font: inherit;
      font-weight: 800;
      letter-spacing: -0.01em;
      cursor: pointer;
    }
    .error {
      display: none;
      margin-top: 12px;
      color: #fca5a5;
      font-size: 13px;
      line-height: 1.5;
      text-align: center;
    }
    .error.active {
      display: block;
    }
    .result {
      display: none;
      margin-top: 20px;
      padding: 18px 16px;
      border-radius: 20px;
      background: rgba(2, 6, 23, 0.44);
      border: 1px solid rgba(148, 163, 184, 0.12);
    }
    .result.active {
      display: block;
    }
    .result-title {
      color: #f8fafc;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .result-copy,
    .result-list,
    .result-note {
      margin-top: 10px;
      color: #cbd5e1;
      font-size: 15px;
      line-height: 1.6;
    }
    .result-list {
      padding-left: 18px;
    }
    .result-list li + li {
      margin-top: 6px;
    }
    .result-label {
      margin-top: 14px;
      color: #94a3b8;
      font-size: 12px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    .result-cta {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-top: 16px;
      min-height: 46px;
      padding: 0 16px;
      border-radius: 14px;
      background: linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 100%);
      color: #020617;
      text-decoration: none;
      font-weight: 800;
    }
    .fineprint {
      margin-top: 18px;
      text-align: center;
      color: #64748b;
      font-size: 12px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <main class="shell">
    <div class="brand">Abando</div>
    <section class="panel">
      <h1>Find revenue recovery gaps in your store</h1>
      <p class="lede">Run a quick audit to see where abandoned checkout revenue may be leaking.</p>
      <label class="label" for="auditShopInput">Enter your Shopify store URL</label>
      <input id="auditShopInput" class="input" type="text" placeholder="Enter your Shopify store URL" inputmode="url" />
      <button type="button" class="button" id="auditSubmitButton">Run free recovery audit</button>
      <div class="error" data-audit-error></div>

      <div class="result" data-audit-result>
        <div class="result-title">Recovery audit complete</div>
        <div class="result-copy">Your store may be losing revenue when checkout is abandoned.</div>

        <div class="result-label">Detected recovery gaps</div>
        <ul class="result-list">
          <li>Recovery email flow not verified</li>
          <li>SMS recovery not enabled</li>
          <li>Return tracking not visible in this audit</li>
          <li>Checkout recovery sequence may be under-optimized</li>
        </ul>

        <div class="result-label">Recommendation</div>
        <div class="result-copy">Abando helps recover abandoned checkout revenue automatically.</div>

        <a href="#" class="result-cta" data-audit-cta>See the recovery flow live</a>
        <div class="result-note">This audit is directional and designed to surface likely recovery gaps.</div>
      </div>

      <div class="fineprint">No private Shopify data is accessed in this audit.</div>
    </section>
  </main>
  <script>
    (function () {
      var input = document.getElementById("auditShopInput");
      var button = document.getElementById("auditSubmitButton");
      var errorNode = document.querySelector("[data-audit-error]");
      var resultNode = document.querySelector("[data-audit-result]");
      var ctaNode = document.querySelector("[data-audit-cta]");

      function normalizeAuditShop(value) {
        var normalized = String(value || "").trim().toLowerCase();
        if (!normalized) return "";
        normalized = normalized.replace(/^https?:\\/\\//, "");
        normalized = normalized.split("/")[0].split("?")[0].split("#")[0].replace(/\\/+$/, "");
        if (normalized && normalized.indexOf(".") === -1) {
          normalized = normalized + ".myshopify.com";
        }
        return normalized;
      }

      if (!button) return;

      button.addEventListener("click", function () {
        var normalizedShop = normalizeAuditShop(input ? input.value : "");

        if (!normalizedShop) {
          if (errorNode) {
            errorNode.textContent = "Enter a Shopify store URL to continue.";
            errorNode.classList.add("active");
          }
          if (resultNode) {
            resultNode.classList.remove("active");
          }
          return;
        }

        if (errorNode) {
          errorNode.textContent = "";
          errorNode.classList.remove("active");
        }

        var eid = "proof-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
        var experienceUrl = window.location.origin + "/experience?shop=" + encodeURIComponent(normalizedShop) + "&eid=" + encodeURIComponent(eid);

        if (ctaNode) {
          ctaNode.setAttribute("href", experienceUrl);
        }
        if (resultNode) {
          resultNode.classList.add("active");
        }
      });
    })();
  </script>
</body>
</html>`;
}

async function getMerchantSurfaceState(shop = "mvp-demo-proof.myshopify.com") {
  const latestSendEvent = await prisma.systemEvent.findFirst({
    where: {
      shopDomain: shop,
      eventType: "abando.experience_send.v1",
    },
    orderBy: { createdAt: "desc" },
  });

  const latestReturnEvent = await prisma.systemEvent.findFirst({
    where: {
      shopDomain: shop,
      eventType: "abando.customer_return.v1",
    },
    orderBy: { createdAt: "desc" },
  });

  const recoveredSessions = await prisma.systemEvent.count({
    where: {
      shopDomain: shop,
      eventType: "abando.customer_return.v1",
    },
  });

  const latestSendPayload = latestSendEvent?.payload && typeof latestSendEvent.payload === "object"
    ? latestSendEvent.payload
    : null;

  return {
    shop,
    lastRecoverySent: latestSendPayload?.channel ? String(latestSendPayload.channel) : null,
    lastRecoveryReturned: Boolean(latestReturnEvent),
    recoveredSessions: Number(recoveredSessions || 0),
  };
}

function renderMerchantPage({
  shop,
  lastRecoverySent,
  lastRecoveryReturned,
  recoveredSessions,
}) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Abando Merchant</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background: radial-gradient(circle at top, rgba(30, 41, 59, 0.22), transparent 42%), #020617;
      color: #e5eef8;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      display: grid;
      place-items: center;
      padding: 28px 18px;
    }
    .shell {
      width: 100%;
      max-width: 520px;
    }
    .brand {
      text-align: center;
      color: #cbd5e1;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin-bottom: 18px;
    }
    .panel {
      background: rgba(15, 23, 42, 0.86);
      border: 1px solid rgba(148, 163, 184, 0.16);
      border-radius: 28px;
      padding: 30px 24px 24px;
      box-shadow: 0 28px 80px rgba(2, 6, 23, 0.42);
    }
    h1 {
      margin: 0;
      color: #f8fafc;
      font-size: clamp(34px, 7vw, 42px);
      line-height: 1.02;
      letter-spacing: -0.05em;
      text-align: center;
    }
    .lede {
      margin: 14px 0 0;
      color: #94a3b8;
      font-size: 15px;
      line-height: 1.6;
      text-align: center;
    }
    .section {
      margin-top: 18px;
      padding: 18px 16px;
      border-radius: 20px;
      background: rgba(2, 6, 23, 0.44);
      border: 1px solid rgba(148, 163, 184, 0.12);
    }
    .section-label {
      color: #94a3b8;
      font-size: 12px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    .section-value {
      margin-top: 10px;
      color: #f8fafc;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.03em;
    }
    .section-copy {
      margin-top: 8px;
      color: #cbd5e1;
      font-size: 15px;
      line-height: 1.6;
    }
    .row {
      margin-top: 12px;
      display: grid;
      gap: 10px;
    }
    .row-line {
      color: #cbd5e1;
      font-size: 15px;
      line-height: 1.5;
    }
    .row-line strong {
      color: #f8fafc;
    }
    .button,
    .link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 48px;
      padding: 0 18px;
      border-radius: 14px;
      text-decoration: none;
      font-weight: 700;
    }
    .button {
      width: 100%;
      margin-top: 14px;
      border: 0;
      background: linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 100%);
      color: #020617;
      font: inherit;
      cursor: pointer;
    }
    .button:disabled {
      opacity: 0.72;
      cursor: wait;
    }
    .button-status {
      margin-top: 10px;
      color: #94a3b8;
      font-size: 13px;
      text-align: center;
      min-height: 18px;
    }
    .link {
      margin-top: 14px;
      border: 1px solid rgba(148, 163, 184, 0.16);
      background: rgba(15, 23, 42, 0.66);
      color: #e5eef8;
    }
  </style>
</head>
<body>
  <main class="shell">
    <div class="brand">Abando</div>
    <section class="panel">
      <h1>Abando is active</h1>
      <p class="lede">Recovery system is running.</p>

      <section class="section">
        <div class="section-label">Last recovery</div>
        <div class="row">
          <div class="row-line"><strong>Sent:</strong> ${escapeHtml(lastRecoverySent || "not yet")}</div>
          <div class="row-line"><strong>Returned:</strong> ${lastRecoveryReturned ? "yes" : "not yet"}</div>
        </div>
      </section>

      <section class="section">
        <div class="section-label">Recovered sessions</div>
        <div class="section-value">Recovered sessions: ${Number(recoveredSessions || 0)}</div>
      </section>

      <section class="section">
        <div class="section-label">Action</div>
        <button type="button" class="button" id="merchantSendTestRecovery">Send test recovery</button>
        <div class="button-status" data-merchant-send-status></div>
      </section>

      <section class="section">
        <div class="section-label">Live recovery flow</div>
        <a class="link" href="/experience?shop=${encodeURIComponent(shop)}&eid=merchant-proof">View live recovery flow</a>
      </section>
    </section>
  </main>
  <script>
    (function () {
      var button = document.getElementById("merchantSendTestRecovery");
      var statusNode = document.querySelector("[data-merchant-send-status]");

      if (!button) return;

      button.addEventListener("click", async function () {
        button.disabled = true;
        button.textContent = "Sending…";
        if (statusNode) statusNode.textContent = "";

        try {
          var response = await fetch("/api/recovery-actions/send-live-test", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              shop: ${JSON.stringify(shop)},
              email: "rossstafford1@gmail.com",
              experienceId: "merchant-test-" + Date.now()
            })
          });
          var data = await response.json();
          if (!response.ok || !data.success) {
            throw new Error((data && (data.error || data.message)) || "send_live_test_failed");
          }
          if (statusNode) statusNode.textContent = "Recovery sent";
        } catch (error) {
          if (statusNode) {
            statusNode.textContent = error && error.message ? error.message : "send_live_test_failed";
          }
        } finally {
          button.disabled = false;
          button.textContent = "Send test recovery";
        }
      });
    })();
  </script>
</body>
</html>`;
}

function buildShopSlug(shopDomain) {
  return String(shopDomain || "")
    .trim()
    .toLowerCase()
    .replace(/\.myshopify\.com$/, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "shopify-store";
}

function buildInviteState({ shopDomain, cartsRecovered, cartsTotal, emailsSent }) {
  const appBase = String(APP_URL || "https://pay.abando.ai").replace(/\/+$/, "");
  const installUrl = `${appBase}/install/shopify`;
  const scorecardUrl = `${appBase}/scorecard/${encodeURIComponent(buildShopSlug(shopDomain))}`;
  const hasValueProof = Number(cartsRecovered || 0) > 0;
  const badge = hasValueProof ? "Invite another store" : "Lightweight merchant invite";
  const headline = hasValueProof
    ? "Invite another store to try Abando"
    : "Share Abando with another Shopify merchant";
  const supportingLine = hasValueProof
    ? `This workspace is already showing ${cartsRecovered} recorded recovery event${Number(cartsRecovered) === 1 ? "" : "s"} for this store. Invite another merchant to connect their Shopify store and start tracking checkout activity.`
    : "Share a simple Abando install path with another Shopify merchant who wants a clearer recovery view.";
  const shareText = hasValueProof
    ? `Abando is already showing checkout activity for ${shopDomain}. If you run a Shopify store, take a look here: ${installUrl}`
    : `If you run a Shopify store, Abando gives you a simple view of checkout activity and recovery readiness. Try it here: ${installUrl}`;

  return {
    badge,
    headline,
    supportingLine,
    shareText,
    installUrl,
    scorecardUrl,
    topReason: hasValueProof
      ? `Decision activity visible: ${cartsRecovered} recovery events recorded`
      : `Decision activity visible: ${cartsTotal} sessions tracked · ${emailsSent} emails sent`,
  };
}

async function saveShopToDB(domain, accessToken, scopes) {
  // The current Shop model does not have dedicated Shopify token/scope columns.
  // Preserve the existing persistence contract by storing the access token in apiKey
  // and the granted scopes in emailFrom until the schema is expanded intentionally.
  await prisma.shop.upsert({
    where: { key: domain },
    create: {
      key: domain,
      name: domain,
      provider: "shopify",
      apiKey: accessToken ?? "",
      emailFrom: scopes ?? "",
    },
    update: {
      name: domain,
      provider: "shopify",
      apiKey: accessToken ?? "",
      emailFrom: scopes ?? "",
    },
  });
}

async function registerMerchantInternally({
  shop,
  installedAt,
  installStatus,
  artifactStatus,
  planTier = "free",
}) {
  const staffordUrl = getStaffordosUrl();
  const payload = {
    shopDomain: shop,
    displayName: shop.replace(/\.myshopify\.com$/, ""),
    planTier,
    status: installStatus,
    installedAt,
    artifactStatus,
    lastSeenAt: installedAt,
    notes: `installStatus:${installStatus}; artifactStatus:${artifactStatus}; installedVia:shopify_oauth_callback`,
  };

  try {
    const response = await fetch(`${staffordUrl}/abando/merchant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error("[staffordos] merchant register failed", {
        shop,
        installStatus,
        artifactStatus,
        status: response.status,
        body,
      });
      return { ok: false, status: response.status };
    }

    const data = await response.json().catch(() => ({}));
    console.log("[staffordos] merchant registered", {
      shop,
      installStatus,
      artifactStatus,
      merchantId: data?.merchant?.id,
    });

    return { ok: true, status: response.status, data };
  } catch (error) {
    console.error("[staffordos] merchant register error", {
      shop,
      installStatus,
      artifactStatus,
      error: error && error.message ? error.message : String(error),
    });
    return { ok: false, status: 0 };
  }
}

function renderMerchantDashboardPage({
  shopDomain,
  appOrigin,
  connectionStatus,
  listeningStatus,
  lastCheckoutEventAt,
  checkoutEventsCount,
  recoveryActionStatus,
  lastRecoveryActionAt,
  lastRecoveryActionType,
  lastRecoverySentAt,
  lastRecoveryChannels,
  sendNotConfigured,
  lastSendStatus,
  lastSendTime,
  lastSendChannels,
  lastSendMissingEnvVars,
  lastSendProviderStatuses,
  lastCustomerReturnAt,
  customerReturned,
  installedAt,
  artifactStatus,
  planTier,
  abandoStatus,
  recoveryStatus,
  merchantRecoveryStatus,
  latestEventType,
  latestEventTimestamp,
  checkoutEventCount,
  cartsTotal,
  cartsRecovered,
  emailsSent,
  realAttributedRevenueCents,
  realAttributedOrderCount,
  decisionsObserved,
  interceptsShown,
  continuedAfterIntercept,
  dismissedAfterIntercept,
  validationDecisionsObserved,
  validationInterceptsShown,
  validationContinuedAfterIntercept,
  validationDismissedAfterIntercept,
  embeddedContext = { embedded: false, hasHost: false, hasShop: false, host: "", shop: "" },
}) {
  const embedded = Boolean(embeddedContext?.embedded);
  const inviteState = buildInviteState({ shopDomain, cartsRecovered, cartsTotal, emailsSent });
  const surfaceBadge = embedded ? "Shopify admin session" : "Merchant workspace";
  const surfaceNote = embedded
    ? "This view is running inside the current Shopify admin session and depends on the active Shopify CLI-managed session."
    : "This view is running in Abando's merchant workspace.";
  const embeddedContextReady = embedded && embeddedContext?.hasHost && embeddedContext?.hasShop;
  const embeddedDegraded = embedded && !embeddedContextReady;
  const embeddedStatusLabel = embeddedDegraded ? "Embedded session needs refresh" : "Embedded session active";
  const embeddedStatusSubvalue = !embedded
    ? ""
    : embeddedDegraded
      ? "Shopify admin context is incomplete right now. Reopen Abando from Shopify Admin Apps for this store, or refresh the current CLI-managed dev session if the tunnel rotated."
      : "Shop and host context are present for this Shopify admin session. This session still depends on the currently live CLI-managed tunnel and is not yet a permanent infrastructure guarantee.";
  const storeStatus = connectionStatus === "connected" ? "Connected" : "Not connected";
  const lastEventSeen = latestEventType || "No event yet";
  const lastEventTime = lastCheckoutEventAt || latestEventTimestamp || "—";
  const recoveryStatusLabel = merchantRecoveryStatus || "Not active";
  const recoveryChannelLabel = Array.isArray(lastRecoveryChannels) && lastRecoveryChannels.length > 0
    ? lastRecoveryChannels.join(" + ")
    : "";
  const recoveryActionLabel = recoveryActionStatus === "created"
    ? (sendNotConfigured ? "Send not configured" : "Recovery action created")
    : recoveryActionStatus === "sent"
      ? recoveryChannelLabel
        ? `Recovery action sent (${recoveryChannelLabel})`
        : "Recovery action sent"
      : recoveryActionStatus === "failed"
        ? "Recovery action failed"
        : "Not active";
  const recoveryStatusSubvalue =
    recoveryStatusLabel === "Recovery ready"
      ? "Checkout signals detected. Recovery path is ready."
      : recoveryStatusLabel === "Listening for checkout activity"
        ? "Abando is connected and waiting for the first checkout signal."
        : recoveryStatusLabel === "Not connected"
          ? "Connect the store before recovery can activate."
          : "Recovery state is waiting on the next store event.";
  const lastRecoveryActionLabel = lastRecoveryActionType
    ? `${lastRecoveryActionType}${lastRecoverySentAt ? ` · ${lastRecoverySentAt}` : lastRecoveryActionAt ? ` · ${lastRecoveryActionAt}` : ""}`
    : "—";
  const revenueLabel = "Verified Revenue";
  const revenueValue = realAttributedOrderCount > 0
    ? formatUsdFromCents(realAttributedRevenueCents)
    : "No verified revenue yet";
  const revenueSubvalue = realAttributedOrderCount > 0
    ? `Based on ${realAttributedOrderCount} real Shopify order match${realAttributedOrderCount === 1 ? "" : "es"}.`
    : "Revenue appears only after a real paid Shopify order is matched back to checkout activity.";
  const hasValidationActivity = validationDecisionsObserved > 0;
  const decisionEngineSubvalue = decisionsObserved > 0
    ? `Observed checkout activity from live storefront sessions. Recovery prompts shown: ${interceptsShown}.`
    : "Live activity appears after storefront sessions begin generating checkout signals.";
  const liveOutcomeSubvalue = decisionsObserved > 0
    ? `Continued after prompt: ${continuedAfterIntercept} · Left checkout: ${dismissedAfterIntercept}`
    : "No live shopper outcomes recorded yet.";
  const validationSubvalue = hasValidationActivity
    ? `Validation activity: ${validationDecisionsObserved} · Shown: ${validationInterceptsShown} · Continued: ${validationContinuedAfterIntercept} · Left: ${validationDismissedAfterIntercept}`
    : "No extra validation activity recorded.";
  const recoveryMessage = generateRecoveryMessage({
    shop: shopDomain,
    eventData: { event_type: latestEventType || "checkout_started" },
    timestamp: lastCheckoutEventAt || new Date().toISOString(),
    baseUrl: appOrigin,
  });
  const recoverySendConfigured = isEmailSenderConfigured();
  const recoveryReturnLabel = customerReturned
    ? `Customer returned${lastCustomerReturnAt ? ` · ${lastCustomerReturnAt}` : ""}`
    : "No customer return yet";
  const lastSendStatusLabel = lastSendStatus === "sent_email_and_sms"
    ? "Email + SMS sent"
    : lastSendStatus === "sent_email"
      ? "Email sent"
      : lastSendStatus === "sent_sms"
        ? "SMS sent"
        : lastSendStatus === "failed"
          ? "Send failed"
          : lastSendStatus === "created"
            ? (Array.isArray(lastSendProviderStatuses) && lastSendProviderStatuses.length > 0
                ? lastSendProviderStatuses.join(", ")
                : "Send not configured")
            : "—";
  const lastSendChannelsLabel = Array.isArray(lastSendChannels) && lastSendChannels.length > 0
    ? lastSendChannels.join(" + ")
    : "—";
  const lastSendSubvalue = Array.isArray(lastSendProviderStatuses) && lastSendProviderStatuses.length > 0
    ? `Providers: ${lastSendProviderStatuses.join(", ")}${Array.isArray(lastSendMissingEnvVars) && lastSendMissingEnvVars.length > 0 ? ` · Missing env: ${lastSendMissingEnvVars.join(", ")}` : ""}`
    : Array.isArray(lastSendMissingEnvVars) && lastSendMissingEnvVars.length > 0
      ? `Missing env: ${lastSendMissingEnvVars.join(", ")}`
    : "Most recent test-mode send attempt for this store.";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Abando Dashboard</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background: linear-gradient(180deg, #020617 0%, #0f172a 100%);
      color: #e2e8f0;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .shell {
      max-width: 880px;
      margin: 0 auto;
      padding: 48px 20px 72px;
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 8px 14px;
      border-radius: 999px;
      border: 1px solid #1e293b;
      background: rgba(15, 23, 42, 0.85);
      color: #7dd3fc;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }
    .panel {
      margin-top: 18px;
      border: 1px solid #1e293b;
      border-radius: 24px;
      background: rgba(15, 23, 42, 0.88);
      box-shadow: 0 24px 90px rgba(2, 6, 23, 0.42);
      padding: 28px;
    }
    h1 {
      margin: 12px 0 10px;
      font-size: clamp(34px, 5vw, 52px);
      letter-spacing: -0.04em;
    }
    .lead {
      margin: 0;
      color: #94a3b8;
      font-size: 18px;
      line-height: 1.6;
    }
    .status {
      display: inline-flex;
      margin-top: 18px;
      padding: 10px 14px;
      border-radius: 999px;
      border: 1px solid rgba(34, 197, 94, 0.24);
      background: rgba(20, 83, 45, 0.32);
      color: #86efac;
      font-weight: 700;
    }
    .surface-note {
      margin-top: 12px;
      color: #94a3b8;
      font-size: 14px;
      line-height: 1.5;
    }
    .grid {
      margin-top: 24px;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }
    .card {
      border: 1px solid #1e293b;
      border-radius: 18px;
      background: rgba(2, 6, 23, 0.56);
      padding: 18px;
    }
    .card.invite {
      grid-column: 1 / -1;
      border-color: rgba(56, 189, 248, 0.26);
      background: linear-gradient(135deg, rgba(8, 47, 73, 0.58), rgba(2, 6, 23, 0.86));
      box-shadow: 0 18px 40px rgba(2, 132, 199, 0.12);
    }
    .label {
      color: #94a3b8;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }
    .value {
      margin-top: 10px;
      color: #f8fafc;
      font-size: 24px;
      font-weight: 800;
      line-height: 1.25;
      word-break: break-word;
    }
    .subvalue {
      margin-top: 8px;
      color: #cbd5e1;
      font-size: 15px;
      line-height: 1.5;
    }
    .invite-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 999px;
      border: 1px solid rgba(125, 211, 252, 0.24);
      background: rgba(12, 74, 110, 0.3);
      color: #bae6fd;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .invite-copy {
      margin-top: 18px;
      display: grid;
      gap: 12px;
    }
    .invite-copy textarea {
      width: 100%;
      min-height: 96px;
      padding: 14px 16px;
      border-radius: 16px;
      border: 1px solid rgba(71, 85, 105, 0.72);
      background: rgba(2, 6, 23, 0.7);
      color: #e2e8f0;
      font: inherit;
      resize: vertical;
    }
    .invite-entry {
      margin-top: 16px;
      display: grid;
      gap: 10px;
    }
    .invite-entry input {
      width: 100%;
      min-height: 48px;
      padding: 12px 14px;
      border-radius: 14px;
      border: 1px solid rgba(71, 85, 105, 0.72);
      background: rgba(2, 6, 23, 0.7);
      color: #e2e8f0;
      font: inherit;
    }
    .invite-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
    }
    .invite-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 12px 16px;
      border-radius: 999px;
      border: 1px solid rgba(125, 211, 252, 0.24);
      background: #38bdf8;
      color: #082f49;
      font: inherit;
      font-weight: 800;
      text-decoration: none;
      cursor: pointer;
    }
    .invite-button.secondary {
      background: rgba(15, 23, 42, 0.6);
      color: #e2e8f0;
    }
    .invite-status {
      min-height: 20px;
      color: #7dd3fc;
      font-size: 14px;
      font-weight: 600;
    }
    .abando-status-card {
      margin-top: 24px;
      border: 1px solid rgba(125, 211, 252, 0.18);
      border-radius: 18px;
      background: rgba(2, 6, 23, 0.56);
      padding: 18px;
    }
    .abando-status-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }
    .abando-status-eyebrow {
      color: #94a3b8;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }
    .abando-status-title {
      margin: 8px 0 0;
      font-size: 28px;
      letter-spacing: -0.03em;
    }
    .abando-status-pill {
      display: inline-flex;
      align-items: center;
      padding: 8px 12px;
      border-radius: 999px;
      border: 1px solid rgba(34, 197, 94, 0.24);
      background: rgba(20, 83, 45, 0.32);
      color: #86efac;
      font-size: 13px;
      font-weight: 700;
      white-space: nowrap;
    }
    .abando-status-description {
      margin: 12px 0 0;
      color: #f8fafc;
      font-size: 16px;
      line-height: 1.5;
    }
    .abando-status-helper {
      margin: 8px 0 0;
      color: #7dd3fc;
      font-size: 14px;
      line-height: 1.5;
      font-weight: 600;
    }
    .abando-status-subtext,
    .abando-status-meta {
      margin: 8px 0 0;
      color: #94a3b8;
      font-size: 14px;
      line-height: 1.5;
    }
    .abando-status-details {
      margin-top: 14px;
      display: grid;
      gap: 8px;
      color: #cbd5e1;
      font-size: 14px;
      line-height: 1.5;
    }
    .abando-status-details b {
      display: inline-block;
      min-width: 140px;
      color: #94a3b8;
      font-weight: 700;
    }
    .abando-status-actions {
      margin-top: 16px;
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
    }
    .abando-trigger-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 12px 16px;
      border-radius: 999px;
      border: 1px solid rgba(125, 211, 252, 0.24);
      background: #38bdf8;
      color: #082f49;
      font: inherit;
      font-weight: 800;
      cursor: pointer;
    }
    .abando-trigger-button:disabled {
      opacity: 0.7;
      cursor: wait;
    }
    .abando-trigger-status {
      min-height: 20px;
      color: #cbd5e1;
      font-size: 14px;
    }
    .recovery-experience {
      margin-top: 18px;
      border: 1px solid rgba(125, 211, 252, 0.18);
      border-radius: 18px;
      background: rgba(2, 6, 23, 0.56);
      padding: 18px;
    }
    .recovery-experience h2 {
      margin: 0 0 10px;
      font-size: 22px;
    }
    .recovery-experience p {
      margin: 8px 0 0;
      color: #cbd5e1;
      line-height: 1.5;
    }
    .recovery-preview-grid {
      margin-top: 16px;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }
    .recovery-preview-card {
      border: 1px solid #1e293b;
      border-radius: 16px;
      background: rgba(15, 23, 42, 0.72);
      padding: 16px;
    }
    .recovery-preview-card pre {
      margin: 10px 0 0;
      white-space: pre-wrap;
      word-break: break-word;
      color: #e2e8f0;
      font: inherit;
    }
    .recovery-preview-card code {
      display: block;
      margin-top: 10px;
      white-space: pre-wrap;
      word-break: break-word;
      color: #7dd3fc;
      font: inherit;
    }
    .recovery-actions {
      margin-top: 16px;
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
    }
    .recovery-live-test {
      margin-top: 16px;
      border: 1px solid #1e293b;
      border-radius: 16px;
      background: rgba(15, 23, 42, 0.72);
      padding: 16px;
    }
    .recovery-live-test-grid {
      margin-top: 12px;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }
    .recovery-live-test input {
      width: 100%;
      min-height: 46px;
      padding: 12px 14px;
      border-radius: 12px;
      border: 1px solid rgba(71, 85, 105, 0.72);
      background: rgba(2, 6, 23, 0.7);
      color: #e2e8f0;
      font: inherit;
    }
    .recovery-live-test-actions {
      margin-top: 12px;
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
    }
    .recovery-live-test-status {
      min-height: 20px;
      color: #cbd5e1;
      font-size: 14px;
    }
    .recovery-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 12px 16px;
      border-radius: 999px;
      border: 1px solid rgba(125, 211, 252, 0.24);
      background: #38bdf8;
      color: #082f49;
      font: inherit;
      font-weight: 800;
      text-decoration: none;
      cursor: pointer;
    }
    .recovery-button.secondary {
      background: rgba(15, 23, 42, 0.6);
      color: #e2e8f0;
    }
    .recovery-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .recovery-status-note {
      min-height: 20px;
      color: #cbd5e1;
      font-size: 14px;
    }
    @media (max-width: 720px) {
      .grid { grid-template-columns: 1fr; }
      .abando-status-header { flex-direction: column; }
      .recovery-preview-grid { grid-template-columns: 1fr; }
      .recovery-live-test-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main class="shell">
    <div class="brand">Abando Shopify Recovery App</div>
    <section class="panel">
      <h1>Abando helps you recover lost checkout revenue.</h1>
      <p class="lead">Connect your store, detect checkout abandonment signals, and activate recovery with a simple merchant view.</p>
      <div class="status">${abandoStatus}</div>
      <div class="surface-note">${surfaceBadge} · ${surfaceNote}</div>
      ${renderAbandoStatus({
        shopDomain,
        connectionStatus,
        listeningStatus,
        lastCheckoutEventAt,
        checkoutEventsCount,
        recoveryStatus,
        recoveryActionStatus,
        lastRecoveryActionAt,
        lastRecoveryActionType,
        lastRecoverySentAt,
        lastRecoveryChannels,
        sendNotConfigured,
        lastSendStatus,
        lastSendTime,
        lastSendChannels,
        lastSendProviderStatuses,
      })}
      <section class="recovery-experience">
        <h2>Recovery Experience</h2>
        <p>Preview the message Abando is prepared to use for recovery, review the return link, and track whether a customer comes back.</p>
        <div class="recovery-preview-grid">
          <div class="recovery-preview-card">
            <div class="label">Channel</div>
            <div class="value">Email</div>
            <div class="subvalue">${escapeHtml(recoveryMessage.emailSubject)}</div>
            <pre>${escapeHtml(recoveryMessage.emailBody)}</pre>
          </div>
          <div class="recovery-preview-card">
            <div class="label">Channel</div>
            <div class="value">SMS</div>
            <div class="subvalue">Return link preview</div>
            <pre>${escapeHtml(recoveryMessage.smsText)}</pre>
            <code data-abando-return-link>${escapeHtml(recoveryMessage.returnLink)}</code>
            <p class="subvalue" data-abando-customer-return>${escapeHtml(recoveryReturnLabel)}</p>
          </div>
        </div>
        <div class="recovery-actions">
          <button type="button" class="recovery-button" disabled>${recoverySendConfigured ? "Send recovery message" : "Send not configured"}</button>
          <button
            type="button"
            class="recovery-button secondary"
            data-abando-send-test-recovery
            data-shop-domain="${escapeHtml(shopDomain)}"
          >
            Send test recovery
          </button>
          <a
            class="recovery-button secondary"
            href="${escapeHtml(recoveryMessage.returnLink)}"
            target="_blank"
            rel="noopener"
            data-abando-simulate-send
          >
            Simulate send
          </a>
          <div class="recovery-status-note">${recoverySendConfigured ? "Real send is available when a recovery action is created with a valid recipient." : "Send not configured. Abando will not mark sent until SMTP is configured and a real send succeeds."}</div>
        </div>
        <div class="recovery-live-test">
          <div class="label">Try Abando Live</div>
          <p>Enter your phone or email to receive a real recovery message instantly.</p>
          <div class="recovery-live-test-grid">
            <input
              type="tel"
              id="abandoLiveTestPhone"
              placeholder="+1 617 270 3075"
              inputmode="tel"
            />
            <input
              type="email"
              id="abandoLiveTestEmail"
              placeholder="you@example.com"
              inputmode="email"
            />
          </div>
          <div class="recovery-live-test-actions">
            <button
              type="button"
              class="recovery-button"
              data-abando-send-live-test
              data-shop-domain="${escapeHtml(shopDomain)}"
            >
              Send me a real recovery message
            </button>
            <div class="recovery-live-test-status" data-abando-live-test-status></div>
          </div>
        </div>
      </section>
      <div class="grid">
        <div class="card">
          <div class="label">Store Status</div>
          <div class="value">${storeStatus}</div>
          <div class="subvalue">${escapeHtml(shopDomain)}</div>
        </div>
        <div class="card">
          <div class="label">Recovery Status</div>
          <div class="value">${recoveryStatusLabel}</div>
          <div class="subvalue">${recoveryStatusSubvalue}</div>
        </div>
        <div class="card">
          <div class="label">Last Event Seen</div>
          <div class="value">${escapeHtml(lastEventSeen)}</div>
          <div class="subvalue">Most recent checkout-related event recorded for this store.</div>
        </div>
        <div class="card">
          <div class="label">Last Event Timestamp</div>
          <div class="value">${escapeHtml(lastEventTime)}</div>
          <div class="subvalue">When the latest checkout event was recorded.</div>
        </div>
        <div class="card">
          <div class="label">Checkout Events Recorded</div>
          <div class="value">${checkoutEventCount ?? 0}</div>
          <div class="subvalue">Normalized checkout/cart signals recorded for this connected store.</div>
        </div>
        <div class="card">
          <div class="label">Recovery Action</div>
          <div class="value">${recoveryActionLabel}</div>
          <div class="subvalue">${recoveryActionStatus === "created" ? (sendNotConfigured ? "A recovery action record exists, but outbound send is not configured." : "A durable recovery action record has been created for this store.") : recoveryActionStatus === "sent" ? `A real recovery action was sent${recoveryChannelLabel ? ` via ${recoveryChannelLabel}` : ""}.` : recoveryActionLabel === "Recovery action failed" ? "The last recovery action failed." : "No recovery action has been created yet."}</div>
        </div>
        <div class="card">
          <div class="label">Last Recovery Action</div>
          <div class="value">${escapeHtml(lastRecoveryActionLabel)}</div>
          <div class="subvalue">Most recent durable recovery action recorded for this store.</div>
        </div>
        <div class="card">
          <div class="label">Last Send Status</div>
          <div class="value" data-abando-last-send-status-card>${escapeHtml(lastSendStatusLabel)}</div>
          <div class="subvalue">${escapeHtml(lastSendSubvalue)}</div>
        </div>
        <div class="card">
          <div class="label">Last Send Time</div>
          <div class="value" data-abando-last-send-time-card>${escapeHtml(lastSendTime || "—")}</div>
          <div class="subvalue">Most recent merchant test send timestamp.</div>
        </div>
        <div class="card">
          <div class="label">Channels Used</div>
          <div class="value" data-abando-last-send-channels-card>${escapeHtml(lastSendChannelsLabel)}</div>
          <div class="subvalue">Successful channels from the latest merchant test send.</div>
        </div>
        <div class="card">
          <div class="label">Getting Started</div>
          <div class="value">${connectionStatus === "connected" ? "Run test event" : "Connect store"}</div>
          <div class="subvalue">${connectionStatus === "connected"
            ? "Use the test event button to verify connection, then create one recovery action after the first signal arrives."
            : "Finish Shopify approval first. After that, Abando starts listening for checkout activity."}</div>
        </div>
        <div class="card">
          <div class="label">Data Clarity</div>
          <div class="value">Merchant-safe status only</div>
          <div class="subvalue">Abando currently shows connection state, checkout event timing, recovery action records, and customer return events. It does not show fake recovery counts or fake revenue.</div>
        </div>
      </div>
    </section>
  </main>
  <script>
    window.triggerAbandoTestEvent = async function triggerAbandoTestEvent(button) {
      var trigger = button || document.querySelector("[data-abando-trigger-test]");
      if (!trigger) return;

      var shop = trigger.getAttribute("data-shop-domain") || "";
      var statusNode = document.querySelector("[data-abando-trigger-status]");
      var titleNode = document.querySelector("[data-abando-status-title]");
      var pillNode = document.querySelector("[data-abando-status-pill]");
      var descriptionNode = document.querySelector("[data-abando-status-description]");
      var subtextNode = document.querySelector("[data-abando-status-subtext]");
      var metaNode = document.querySelector("[data-abando-status-meta]");
      var currentCount = ${JSON.stringify(Number(checkoutEventsCount || 0))};

      if (!shop) return;

      trigger.disabled = true;
      if (statusNode) statusNode.textContent = "Sending test event…";

      try {
        var now = new Date().toISOString();
        var response = await fetch("/api/checkout-events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shop: shop,
            session_id: "abando-test-" + Date.now(),
            timestamp: now,
            event_type: "checkout_started",
            stage: "checkout",
            device_type: "desktop",
            source: "manual_dev",
            metadata: { sender: "abando_status_card" }
          })
        });
        var data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error((data && data.error) || "test_event_failed");
        }

        if (titleNode) titleNode.textContent = "Checkout activity detected";
        if (pillNode) pillNode.textContent = "Checkout activity detected";
        if (descriptionNode) descriptionNode.textContent = "1 or more checkout events observed.";
        if (subtextNode) subtextNode.textContent = "Last event timestamp: " + (data.lastEventTimestamp || now);
        if (metaNode) metaNode.textContent = "Event count: " + String(currentCount + 1);
        if (statusNode) statusNode.textContent = "Checkout activity detected";

        window.setTimeout(function () {
          if (titleNode) titleNode.textContent = "Recovery ready";
          if (pillNode) pillNode.textContent = "Recovery ready";
          if (descriptionNode) descriptionNode.textContent = "Checkout signals detected. Recovery path is ready.";
          if (statusNode) statusNode.textContent = "Recovery ready";
          window.location.reload();
        }, 900);
      } catch (error) {
        if (statusNode) {
          statusNode.textContent = error && error.message ? error.message : "test_event_failed";
        }
      } finally {
        trigger.disabled = false;
      }
    };

    document.addEventListener("click", function (event) {
      var trigger = event.target.closest("[data-abando-trigger-test]");
      if (!trigger) return;
      event.preventDefault();
      window.triggerAbandoTestEvent(trigger);
    });

    window.createAbandoRecoveryAction = async function createAbandoRecoveryAction(button) {
      var trigger = button || document.querySelector("[data-abando-create-recovery]");
      if (!trigger) return;

      var shop = trigger.getAttribute("data-shop-domain") || "";
      var statusNode = document.querySelector("[data-abando-recovery-action-status]");
      var labelNode = document.querySelector("[data-abando-recovery-action-label]");
      var lastNode = document.querySelector("[data-abando-last-recovery-action]");

      if (!shop) return;

      trigger.disabled = true;
      if (statusNode) statusNode.textContent = "Creating recovery action…";

      try {
        var response = await fetch("/api/recovery-actions/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shop: shop })
        });
        var data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error((data && data.error) || "recovery_action_failed");
        }

        var channels = Array.isArray(data.channels) ? data.channels.filter(Boolean) : [];
        var channelLabel = channels.length > 0 ? channels.join(" + ") : "";
        var recoveryLabel =
          data.recoveryActionStatus === "sent"
            ? (channelLabel ? "Recovery action sent (" + channelLabel + ")" : "Recovery action sent")
            : data.recoveryActionStatus === "created" && channels.length === 0 && !data.sentAt
              ? "Send not configured"
              : "Recovery action created";

        if (labelNode) labelNode.textContent = recoveryLabel;
        if (lastNode) {
          lastNode.textContent = (data.lastRecoveryActionType || "recovery_email")
            + (data.sentAt ? " · " + data.sentAt : data.lastRecoveryActionAt ? " · " + data.lastRecoveryActionAt : "");
        }
        if (statusNode) {
          statusNode.textContent = recoveryLabel
            + (data.lastRecoveryActionType ? " · " + data.lastRecoveryActionType : "")
            + (data.sentAt ? " · " + data.sentAt : data.lastRecoveryActionAt ? " · " + data.lastRecoveryActionAt : "");
        }
        window.setTimeout(function () {
          window.location.reload();
        }, 500);
      } catch (error) {
        if (statusNode) {
          statusNode.textContent = error && error.message ? error.message : "recovery_action_failed";
        }
      } finally {
        trigger.disabled = false;
      }
    };

    document.addEventListener("click", function (event) {
      var trigger = event.target.closest("[data-abando-create-recovery]");
      if (!trigger) return;
      event.preventDefault();
      window.createAbandoRecoveryAction(trigger);
    });

    window.sendAbandoTestRecovery = async function sendAbandoTestRecovery(button) {
      var trigger = button || document.querySelector("[data-abando-send-test-recovery]");
      if (!trigger) return;

      var shop = trigger.getAttribute("data-shop-domain") || "";
      var statusNode = document.querySelector("[data-abando-send-test-status]");
      var sendStatusNode = document.querySelector("[data-abando-last-send-status]");
      var sendTimeNode = document.querySelector("[data-abando-last-send-time]");
      var sendChannelsNode = document.querySelector("[data-abando-last-send-channels]");
      var sendStatusCardNode = document.querySelector("[data-abando-last-send-status-card]");
      var sendTimeCardNode = document.querySelector("[data-abando-last-send-time-card]");
      var sendChannelsCardNode = document.querySelector("[data-abando-last-send-channels-card]");

      if (!shop) return;

      trigger.disabled = true;
      if (statusNode) statusNode.textContent = "Sending test recovery…";

      try {
        var response = await fetch("/api/recovery-actions/send-test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shop: shop })
        });
        var data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error((data && data.error) || "send_test_failed");
        }

        var statusLabel =
          data.status === "sent_email_and_sms"
            ? "Email + SMS sent"
            : data.status === "sent_email"
              ? "Email sent"
              : data.status === "sent_sms"
                ? "SMS sent"
                : data.status === "failed"
                  ? "Send failed"
                  : Array.isArray(data.providerStatuses) && data.providerStatuses.length > 0
                    ? data.providerStatuses.join(", ")
                    : "Send not configured";
        var channelsLabel = Array.isArray(data.successfulChannels) && data.successfulChannels.length > 0
          ? data.successfulChannels.join(" + ")
          : "—";
        var detailLabel = statusLabel
          + (Array.isArray(data.providerStatuses) && data.providerStatuses.length > 0
            ? " · Providers: " + data.providerStatuses.join(", ")
            : "")
          + (Array.isArray(data.missingEnvVars) && data.missingEnvVars.length > 0
            ? " · Missing env: " + data.missingEnvVars.join(", ")
            : "");

        if (statusNode) statusNode.textContent = detailLabel;
        if (sendStatusNode) sendStatusNode.textContent = statusLabel;
        if (sendTimeNode) sendTimeNode.textContent = data.timestamp || "—";
        if (sendChannelsNode) sendChannelsNode.textContent = channelsLabel;
        if (sendStatusCardNode) sendStatusCardNode.textContent = statusLabel;
        if (sendTimeCardNode) sendTimeCardNode.textContent = data.timestamp || "—";
        if (sendChannelsCardNode) sendChannelsCardNode.textContent = channelsLabel;
      } catch (error) {
        if (statusNode) {
          statusNode.textContent = error && error.message ? error.message : "send_test_failed";
        }
      } finally {
        trigger.disabled = false;
      }
    };

    document.addEventListener("click", function (event) {
      var trigger = event.target.closest("[data-abando-send-test-recovery]");
      if (!trigger) return;
      event.preventDefault();
      window.sendAbandoTestRecovery(trigger);
    });

    window.sendAbandoLiveTest = async function sendAbandoLiveTest(button) {
      var trigger = button || document.querySelector("[data-abando-send-live-test]");
      if (!trigger) return;

      var shop = trigger.getAttribute("data-shop-domain") || "";
      var phoneInput = document.getElementById("abandoLiveTestPhone");
      var emailInput = document.getElementById("abandoLiveTestEmail");
      var statusNode = document.querySelector("[data-abando-live-test-status]");

      if (!shop) return;

      var payload = {
        shop: shop,
        phone: phoneInput ? phoneInput.value : "",
        email: emailInput ? emailInput.value : ""
      };

      trigger.disabled = true;
      if (statusNode) statusNode.textContent = "Sending live test…";

      try {
        var response = await fetch("/api/recovery-actions/send-live-test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        var data = await response.json();
        if (!response.ok) {
          throw new Error((data && data.error) || "send_live_test_failed");
        }

        var messages = [];
        if (Array.isArray(data.channels) && data.channels.indexOf("sms") !== -1) {
          messages.push("Message sent to your phone");
        } else if (Array.isArray(data.providerStatuses) && data.providerStatuses.indexOf("sms_not_configured") !== -1 && payload.phone) {
          messages.push("SMS not configured");
        }

        if (Array.isArray(data.channels) && data.channels.indexOf("email") !== -1) {
          messages.push("Email sent");
        } else if (Array.isArray(data.providerStatuses) && data.providerStatuses.indexOf("email_not_configured") !== -1 && payload.email) {
          messages.push("Email not configured");
        }

        if (data.message === "failed") {
          messages.push("Send failed");
        }

        if (messages.length === 0) {
          messages.push(data.message === "not_configured" ? "Send not configured" : "Send failed");
        }

        if (Array.isArray(data.missingEnvVars) && data.missingEnvVars.length > 0) {
          messages.push("Missing env: " + data.missingEnvVars.join(", "));
        }

        if (statusNode) statusNode.textContent = messages.join(" · ");
      } catch (error) {
        if (statusNode) {
          statusNode.textContent = error && error.message ? error.message : "send_live_test_failed";
        }
      } finally {
        trigger.disabled = false;
      }
    };

    document.addEventListener("click", function (event) {
      var trigger = event.target.closest("[data-abando-send-live-test]");
      if (!trigger) return;
      event.preventDefault();
      window.sendAbandoLiveTest(trigger);
    });

    (function () {
      var inviteRoot = document.querySelector('[data-abando-invite="true"]');
      if (!inviteRoot) return;

      var createButton = document.getElementById('abandoInviteCreate');
      var copyButton = document.getElementById('abandoInviteCopy');
      var inviteTarget = document.getElementById('abandoInviteTarget');
      var inviteText = document.getElementById('abandoInviteText');
      var inviteStatus = document.getElementById('abandoInviteStatus');
      var installLink = document.getElementById('abandoInviteInstallLink');
      var scorecardLink = document.getElementById('abandoInviteScorecardLink');
      var trackedShown = false;

      function trackInvite(eventName, extra) {
        try {
          fetch('/abando-ping', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(Object.assign({
              event: eventName,
              surface: 'merchant_dashboard',
              shopDomain: ${JSON.stringify(shopDomain)},
              href: window.location.href,
              title: document.title,
              ts: Date.now()
            }, extra || {}))
          }).catch(function () {});
        } catch (_error) {}
      }

      function trackShownOnce() {
        if (trackedShown) return;
        trackedShown = true;
        trackInvite('invite_shown', {
          cartsRecovered: ${JSON.stringify(cartsRecovered)},
          cartsTotal: ${JSON.stringify(cartsTotal)},
          emailsSent: ${JSON.stringify(emailsSent)}
        });
      }

      async function copyInviteText() {
        var text = inviteText ? inviteText.value : '';
        if (!text) return false;

        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
          return true;
        }

        inviteText.focus();
        inviteText.select();
        return document.execCommand('copy');
      }

      async function createInvite() {
        var target = inviteTarget ? inviteTarget.value.trim() : '';
        if (!target) {
          inviteStatus.textContent = 'Enter an invite email or Shopify store domain';
          return;
        }

        inviteStatus.textContent = 'Creating invite…';
        trackInvite('invite_clicked', { action: 'create_invite' });

        try {
          var response = await fetch('/api/invites', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              inviterShopDomain: ${JSON.stringify(shopDomain)},
              target: target,
              validationMode: window.location.search.indexOf('abando_validation=1') >= 0
            })
          });
          var body = await response.json().catch(function () { return {}; });

          if (!response.ok || !body.ok) {
            inviteStatus.textContent = (body && body.error) || 'Invite failed';
            return;
          }

          if (inviteText) {
            inviteText.value = body.shareText || '';
          }
          if (copyButton && body.shareLink) {
            copyButton.setAttribute('data-share-url', body.shareLink);
          }
          if (installLink && body.installTarget) {
            installLink.href = body.installTarget;
          }
          if (scorecardLink) {
            if (body.scorecardTarget) {
              scorecardLink.href = body.scorecardTarget;
              scorecardLink.style.display = '';
            } else {
              scorecardLink.style.display = 'none';
            }
          }

          inviteStatus.textContent = 'Invite link ready';
          trackInvite('invite_created', {
            inviteId: body.inviteId,
            targetEmail: body.targetEmail || '',
            targetStoreDomain: body.targetStoreDomain || '',
            shareLink: body.shareLink || ''
          });
        } catch (_error) {
          inviteStatus.textContent = 'Invite failed';
        }
      }

      trackShownOnce();

      if (createButton) {
        createButton.addEventListener('click', function () {
          createInvite();
        });
      }

      if (copyButton && inviteText) {
        copyButton.addEventListener('click', async function () {
          trackInvite('invite_clicked', { action: 'copy_text' });
          try {
            var copied = await copyInviteText();
            inviteStatus.textContent = copied ? 'Invite copied' : 'Copy failed';
            if (copied) {
              trackInvite('invite_copied', {
                action: 'copy_text',
                installUrl: copyButton.getAttribute('data-share-url') || ''
              });
            }
          } catch (_error) {
            inviteStatus.textContent = 'Copy failed';
          }
        });
      }

      [installLink, scorecardLink].filter(Boolean).forEach(function (link) {
        link.addEventListener('click', function () {
          trackInvite('invite_clicked', {
            action: link.id === 'abandoInviteInstallLink' ? 'open_install_page' : 'open_scorecard',
            target: link.href
          });
        });
      });
    })();
  </script>
</body>
</html>`;
}

function renderTopFrameRedirect(target) {
  return `<!doctype html>
<html>
  <head><meta charset="utf-8"><title>Redirecting…</title></head>
  <body>
    <script>
      try { window.top.location.href = ${JSON.stringify(target)}; }
      catch (e) { window.location.href = ${JSON.stringify(target)}; }
    </script>
    <noscript>
      <a href="${target}">Continue</a>
    </noscript>
  </body>
</html>`;
}

function getRequestBaseUrl(req) {
  const publicBaseUrl = getConfiguredPublicBaseUrl();
  const forwardedHost = String(req.get("x-forwarded-host") || "").split(",")[0].trim();
  const directHost = String(req.get("host") || "").trim();
  const host = forwardedHost || directHost;
  if (!host) {
    return APP_URL;
  }

  if (isLocalHostLike(host) && publicBaseUrl) {
    return publicBaseUrl;
  }

  const forwardedProto = String(req.get("x-forwarded-proto") || "").split(",")[0].trim();
  const protocol = forwardedProto || (host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  return `${protocol}://${host}`;
}

function buildOAuthState(inviteId) {
  const nonce = randomBytes(16).toString("hex");
  const normalizedInviteId = normalizeInviteId(inviteId);
  return normalizedInviteId ? `${nonce}.${normalizedInviteId}` : nonce;
}

function parseOAuthState(state) {
  const raw = String(state || "");
  const [noncePart, ...inviteParts] = raw.split(".");
  const nonce = /^[a-f0-9]{32}$/i.test(String(noncePart || "")) ? String(noncePart) : "";
  const inviteId = inviteParts.length ? normalizeInviteId(inviteParts.join(".")) : "";

  return {
    raw,
    nonce,
    inviteId,
  };
}

function extractInviteIdFromState(state) {
  const parsed = parseOAuthState(state);
  return parsed.inviteId;
}

function extractNonceFromState(state) {
  const parsed = parseOAuthState(state);
  return parsed.nonce;
}

function statesMatchByNonce(storedState, receivedState) {
  const storedNonce = extractNonceFromState(storedState);
  const receivedNonce = extractNonceFromState(receivedState);

  if (!storedNonce || !receivedNonce) {
    return false;
  }

  return storedNonce === receivedNonce;
}

function buildAuthorizeUrl(shop, state, callbackBaseUrl) {
  const redirectUri = encodeURIComponent(`${callbackBaseUrl.replace(/\/+$/, "")}/auth/callback`);
  return `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${encodeURIComponent(SHOPIFY_SCOPES)}&redirect_uri=${redirectUri}&state=${state}&grant_options[]=per-user`;
}

function startShopifyOAuth(req, res) {
  const embeddedContext = getEmbeddedContext(req);
  let shop = embeddedContext.shop;
  const inviteId = normalizeInviteId(req.query.invite);

  if (!shop || !shop.endsWith(".myshopify.com")) {
    return res.status(400).send("Missing/invalid ?shop=your-store.myshopify.com");
  }

  if (!SHOPIFY_API_KEY || !SHOPIFY_API_SECRET || !APP_URL) {
    return res.status(500).send("Shopify OAuth is not configured. Required env: SHOPIFY_API_KEY, SHOPIFY_API_SECRET, APP_URL.");
  }

  const embedded = embeddedContext.embedded;
  const callbackBaseUrl = getRequestBaseUrl(req);
  const state = buildOAuthState(inviteId);
  const parsedState = parseOAuthState(state);
  res.cookie("shopify_state", parsedState.nonce, { httpOnly: true, sameSite: "none", secure: true, path: "/" });
  if (inviteId) {
    res.cookie("abando_invite", inviteId, { httpOnly: true, sameSite: "none", secure: true, path: "/" });
    markInviteInstallStarted(inviteId, {
      shopDomain: shop,
      installPath: embedded ? "embedded_oauth_start" : "direct_oauth_start",
    }).then((record) => {
      console.log("[invite] install started", {
        inviteId,
        shop,
        installPath: embedded ? "embedded_oauth_start" : "direct_oauth_start",
        ok: Boolean(record),
      });
    }).catch((error) => {
      console.error("[invite] install start failed", {
        inviteId,
        shop,
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }
  const authorizeUrl = buildAuthorizeUrl(shop, state, callbackBaseUrl);

  console.log("[shopify] authorize →", authorizeUrl);
  console.log("[invite] oauth start context", {
    shop,
    inviteId: inviteId || null,
    stateNonce: parsedState.nonce,
    embedded,
    callbackBaseUrl,
    hasForwardedHost: Boolean(req.get("x-forwarded-host")),
  });

  if (embedded) {
    return res.status(200).type("text/html").send(renderTopFrameRedirect(authorizeUrl));
  }

  return res.redirect(302, authorizeUrl);
}

async function handleShopifyCallback(req, res) {
  const trace = `${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;
  const embeddedContext = getEmbeddedContext(req);
  const shop = embeddedContext.shop;
  const code = String(req.query.code || "");
  const state = String(req.query.state || "");
  const parsedState = parseOAuthState(state);
  const inviteIdFromState = parsedState.inviteId;
  const inviteId = normalizeInviteId(req.cookies?.abando_invite || req.query.invite || inviteIdFromState);
  const hmac = String(req.query.hmac || "");
  const timestamp = String(req.query.timestamp || "");

  try {
    console.log("[OAUTH] callback start", {
      trace,
      shop,
      receivedState: state || null,
      parsedNonce: parsedState.nonce || null,
      inviteId: inviteId || null,
      parsedInviteId: inviteIdFromState || null,
      inviteCookiePresent: Boolean(req.cookies?.abando_invite),
      inviteQueryPresent: Boolean(req.query.invite),
      inviteStatePresent: Boolean(inviteIdFromState),
      embedded: embeddedContext.embedded,
      host: req.get("host") || "",
      forwardedHost: req.get("x-forwarded-host") || "",
    });

    if (!SHOPIFY_API_KEY || !SHOPIFY_API_SECRET || !APP_URL) {
      return res.status(500).send("Shopify OAuth is not configured. Required env: SHOPIFY_API_KEY, SHOPIFY_API_SECRET, APP_URL.");
    }
    if (!shop) return res.status(400).send("Invalid shop");
    if (!code || !state || !hmac || !timestamp) return res.status(400).send("Missing OAuth params");
    if (!statesMatchByNonce(req.cookies?.shopify_state, state)) {
      console.warn("[OAUTH] state validation failed", {
        trace,
        storedState: String(req.cookies?.shopify_state || ""),
        receivedState: state,
        storedNonce: extractNonceFromState(req.cookies?.shopify_state),
        receivedNonce: parsedState.nonce,
      });
      return res.status(400).send("State mismatch");
    }
    console.log("[OAUTH] state validation ok", {
      trace,
      nonce: parsedState.nonce,
      inviteId: inviteId || null,
    });
    if (!verifyShopifyHmac(req.query, SHOPIFY_API_SECRET)) return res.status(400).send("HMAC verification failed");

    console.log("[OAUTH] token exchange start", {
      trace,
      shop,
      inviteId: inviteId || null,
    });
    const tokenResp = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ client_id: SHOPIFY_API_KEY, client_secret: SHOPIFY_API_SECRET, code })
    });
    if (!tokenResp.ok) {
      const body = await tokenResp.text().catch(() => "");
      console.error("[OAUTH] Token exchange failed", {
        trace,
        status: tokenResp.status,
        body,
      });
      return res.status(500).send("Token exchange failed");
    }
    console.log("[OAUTH] token exchange ok", {
      trace,
      shop,
      status: tokenResp.status,
    });

    const { access_token, scope } = await tokenResp.json();
    console.log("[OAUTH] token parsed", { trace, has_access_token: Boolean(access_token), scope });
    await saveShopToDB(shop, access_token, scope);
    console.log("[OAUTH] saveShopToDB ok", { trace, shop });
    const persistedShop = await getShopRecord(shop);
    const persistedAccessToken = String(persistedShop?.apiKey || "");
    if (!persistedShop || !persistedAccessToken) {
      console.error("[OAUTH] persisted shop record missing token", { trace, shop });
      return res.status(500).send(`OAuth install state error (trace=${trace})`);
    }

    const artifactResult = await ensureScriptTagInstalled({
      shop,
      accessToken: persistedAccessToken,
    });
    const installedAt = new Date().toISOString();
    console.log("[OAUTH] install artifact ensured", {
      trace,
      shop,
      action: artifactResult?.action,
      scriptTagId: artifactResult?.id,
    });
    const merchantRegistration = await registerMerchantInternally({
      shop,
      installedAt,
      installStatus: "healthy",
      artifactStatus: artifactResult?.action || "enabled",
      planTier: "free",
    });
    console.log("[OAUTH] registerMerchantInternally result", {
      trace,
      shop,
      ok: Boolean(merchantRegistration?.ok),
      status: merchantRegistration?.status ?? null,
    });
    if (inviteId) {
      try {
        const inviteCompletion = await markInviteInstallCompleted(inviteId, {
          shopDomain: shop,
          installPath: embeddedContext.embedded ? "embedded_oauth_callback" : "direct_oauth_callback",
        });
        console.log("[invite] install completed", {
          trace,
          inviteId,
          shop,
          installPath: embeddedContext.embedded ? "embedded_oauth_callback" : "direct_oauth_callback",
          ok: Boolean(inviteCompletion),
          installCompletedAt: inviteCompletion?.installCompletedAt || null,
        });
      } catch (error) {
        console.error("[invite] install completion failed", {
          trace,
          inviteId,
          shop,
          installPath: embeddedContext.embedded ? "embedded_oauth_callback" : "direct_oauth_callback",
          error: error instanceof Error ? error.message : String(error),
        });
      }
      res.clearCookie("abando_invite", { path: "/" });
    }

    const redirectQuery = new URLSearchParams();
    redirectQuery.set("shop", shop);
    if (embeddedContext.host) redirectQuery.set("host", embeddedContext.host);
    if (embeddedContext.embedded) redirectQuery.set("embedded", "1");
    if (inviteId) redirectQuery.set("invite", inviteId);
    const redirectTarget = `/dashboard?${redirectQuery.toString()}`;
    console.log("[OAUTH] callback success redirect", {
      trace,
      shop,
      inviteId: inviteId || null,
      redirectTarget,
    });
    return res.redirect(redirectTarget);
  } catch (e) {
    const prismaInfo = {
      trace,
      shop,
      name: e?.name,
      code: e?.code,
      meta: e?.meta,
      clientVersion: e?.clientVersion,
      message: String(e?.message || e),
    };
    console.error("[OAUTH] callback exception", prismaInfo);
    return res.status(500).send(`OAuth callback error (trace=${trace})`);
  }
}


// Shopify routes
// --- Shopify auth aliases (for Embedded/App Bridge expectations) ---
app.get("/auth", (req, res) => startShopifyOAuth(req, res));
app.get("/api/auth", (req, res) => startShopifyOAuth(req, res));
app.get("/api/auth/callback", (req, res) => {
  // Preserve Shopify callback params exactly.
  const i = (req.originalUrl || "").indexOf("?");
  const qs = i >= 0 ? (req.originalUrl || "").slice(i) : "";
  return res.redirect(302, `/auth/callback${qs}`);
});
app.get("/auth/callback", async (req, res) => handleShopifyCallback(req, res));

app.get("/shopify/install", (req, res) => {
  const shop = normalizeShop(req.query.shop);
  if (!shop || !shop.endsWith(".myshopify.com")) return res.status(400).send("Missing/invalid ?shop=your-store.myshopify.com");
  return startShopifyOAuth(req, res);
});

app.get("/shopify/callback", async (req, res) => handleShopifyCallback(req, res));

app.get("/shopify/billing/start", (req, res) => {
  const shop = normalizeShop(req.query.shop);
  if (!shop) return res.status(400).send("Invalid shop");
  return res.redirect(`/shopify/billing/return?shop=${encodeURIComponent(shop)}`);
});
app.get("/shopify/billing/return", async (req, res) => {
  const shop = normalizeShop(req.query.shop);
  const qs = new URLSearchParams();
  if (shop) qs.set("shop", shop);
  qs.set("installed", "1");

  if (shop) {
    await registerMerchantInternally({
      shop,
      installedAt: new Date().toISOString(),
      installStatus: "healthy",
      artifactStatus: "billing_return",
      planTier: "free",
    });
  }

  return res.redirect(`/dashboard?${qs.toString()}`);
});


app.post("/api/activate", internalOnly, async (req, res) => {
  try {
    const shop = normalizeShop(req.body?.shopDomain || req.body?.shop || "");
    const playbook = String(req.body?.playbook || "faq_reassurance").trim();

    if (!shop) {
      return res.status(400).json({ ok: false, error: "invalid_shop" });
    }

    const allowedPlaybooks = new Set([
      "faq_reassurance",
      "shipping_reassurance",
      "discount_save",
      "urgency_nudge",
    ]);

    if (!allowedPlaybooks.has(playbook)) {
      return res.status(400).json({ ok: false, error: "invalid_playbook" });
    }

    const staffordUrl = getStaffordosUrl();
    const nowIso = new Date().toISOString();

    let merchantOk = false;
    let dailyStatOk = false;

    try {
      const merchantPayload = {
        shopDomain: shop,
        displayName: shop.replace(/\.myshopify\.com$/, ""),
        planTier: "free",
        status: "healthy",
        lastSeenAt: nowIso,
        notes: `defaultPlaybook:${playbook}; activationStatus:live`,
      };

      const merchantRes = await fetch(`${staffordUrl}/abando/merchant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(merchantPayload),
      });

      merchantOk = merchantRes.ok;

      if (!merchantRes.ok) {
        const text = await merchantRes.text().catch(() => "");
        console.error("[staffordos] activate merchant upsert failed", {
          shop,
          playbook,
          status: merchantRes.status,
          body: text,
        });
      }
    } catch (e) {
      console.error("[staffordos] activate merchant upsert error", {
        shop,
        playbook,
        error: e && e.message ? e.message : String(e),
      });
    }

    try {
      const yyyyMmDd = new Date().toISOString().slice(0, 10);
      const statPayload = {
        shopDomain: shop,
        date: yyyyMmDd,
        cartsTotal: 0,
        cartsAbandoned: 0,
        cartsRecovered: 0,
        revenueRecoveredCents: 0,
        exportOk: true,
        errorsCount: 0,
        statusFlag: "ok",
      };

      const statRes = await fetch(`${staffordUrl}/abando/daily-stat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(statPayload),
      });

      dailyStatOk = statRes.ok;

      if (!statRes.ok) {
        const text = await statRes.text().catch(() => "");
        console.error("[staffordos] activate daily-stat failed", {
          shop,
          playbook,
          status: statRes.status,
          body: text,
        });
      }
    } catch (e) {
      console.error("[staffordos] activate daily-stat error", {
        shop,
        playbook,
        error: e && e.message ? e.message : String(e),
      });
    }

    
    let recoveryEventOk = false;
    let healthOk = false;

    try {
      const recoveryResp = await fetch(`${staffordUrl}/abando/recovery-events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopDomain: shop,
          cartId: `starter_cart_${Date.now()}`,
          checkoutId: `starter_checkout_${Date.now()}`,
          customerId: `starter_customer_${Date.now()}`,
          orderId: `starter_order_${Date.now()}`,
          cartValueCents: 7200,
          status: "recovered",
          detectedAt: new Date(Date.now()-12*60000).toISOString(),
          messageSentAt: new Date(Date.now()-7*60000).toISOString(),
          recoveredAt: new Date(Date.now()-2*60000).toISOString(),
          recoveredRevenueCents: 7200,
          playbook,
        })
      });

      recoveryEventOk = recoveryResp.ok;
    } catch (e) {
      console.error("[staffordos] activate recovery-event error", e);
    }

    try {
      const healthResp = await fetch(`${staffordUrl}/abando/merchant-health`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopDomain: shop,
          status: "healthy",
          lastWebhookAt: new Date().toISOString(),
          lastRecoveryAt: new Date().toISOString(),
          lastNotificationAt: new Date().toISOString(),
          openIssueCount: 0,
          notes: "Activation completed. Recovery system active."
        })
      });

      healthOk = healthResp.ok;
    } catch (e) {
      console.error("[staffordos] activate merchant-health error", e);
    }

console.log("[abando] activation recorded", {
      shop,
      playbook,
      merchantOk,
      dailyStatOk,
    });

    return res.status(200).json({
      ok: true,
      shop,
      playbook,
      merchantOk,
      dailyStatOk,
      redirectTo: `/abando-dashboard?shop=${encodeURIComponent(shop)}&live=1&playbook=${encodeURIComponent(playbook)}`,
    });
  } catch (e) {
    console.error("[abando] activate error", e);
    return res.status(500).json({ ok: false, error: "activation_failed" });
  }
});

app.get("/api/opportunities", async (_req, res) => {
  try {
    const opportunities = await listOpportunities();
    return res.status(200).json({
      opportunities,
      count: opportunities.length,
    });
  } catch (e) {
    console.error("[opportunities] list failed", e);
    return res.status(500).json({ ok: false, error: "opportunities_list_failed" });
  }
});

app.get("/api/opportunities/:id", async (req, res) => {
  try {
    const opportunity = await getOpportunityById(req.params.id);
    if (!opportunity) {
      return res.status(404).json({ ok: false, error: "opportunity_not_found" });
    }

    return res.status(200).json(opportunity);
  } catch (e) {
    console.error("[opportunities] get failed", e);
    return res.status(500).json({ ok: false, error: "opportunity_get_failed" });
  }
});

app.post("/api/opportunities", async (req, res) => {
  try {
    const created = await createOpportunity(req.body || {});
    return res.status(201).json(created);
  } catch (e) {
    const message = String(e?.message || e);
    if (message.startsWith("validation_error:")) {
      return res.status(400).json({ ok: false, error: message.replace("validation_error:", "") });
    }

    console.error("[opportunities] create failed", e);
    return res.status(500).json({ ok: false, error: "opportunity_create_failed" });
  }
});

app.get("/api/signals", async (_req, res) => {
  try {
    const signals = await listSignals();
    return res.status(200).json({
      signals,
      count: signals.length,
    });
  } catch (e) {
    console.error("[signals] list failed", e);
    return res.status(500).json({ ok: false, error: "signals_list_failed" });
  }
});

app.get("/api/signals/:merchant_id", async (req, res) => {
  try {
    const signals = await listSignalsByMerchant(req.params.merchant_id);
    return res.status(200).json({
      merchant_id: req.params.merchant_id,
      signals,
      count: signals.length,
    });
  } catch (e) {
    console.error("[signals] merchant list failed", e);
    return res.status(500).json({ ok: false, error: "signals_get_failed" });
  }
});

app.post("/api/signals", async (req, res) => {
  try {
    const created = await createSignal(req.body || {});
    return res.status(201).json(created);
  } catch (e) {
    const message = String(e?.message || e);
    if (message.startsWith("validation_error:")) {
      return res.status(400).json({ ok: false, error: message.replace("validation_error:", "") });
    }

    console.error("[signals] create failed", e);
    return res.status(500).json({ ok: false, error: "signal_create_failed" });
  }
});

app.get("/api/candidate-opportunities", async (_req, res) => {
  try {
    const candidates = await listCandidateOpportunities();
    return res.status(200).json({
      candidate_opportunities: candidates,
      count: candidates.length,
    });
  } catch (e) {
    console.error("[candidate-opportunities] list failed", e);
    return res.status(500).json({ ok: false, error: "candidate_opportunities_list_failed" });
  }
});

app.get("/api/candidate-opportunities/:id", async (req, res) => {
  try {
    const candidate = await getCandidateOpportunityById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ ok: false, error: "candidate_opportunity_not_found" });
    }

    return res.status(200).json(candidate);
  } catch (e) {
    console.error("[candidate-opportunities] get failed", e);
    return res.status(500).json({ ok: false, error: "candidate_opportunity_get_failed" });
  }
});

app.post("/api/candidate-opportunities/run", async (_req, res) => {
  try {
    const result = await runPatternToOpportunityBridge();
    return res.status(200).json(result);
  } catch (e) {
    console.error("[candidate-opportunities] run failed", e);
    return res.status(500).json({ ok: false, error: "candidate_opportunity_run_failed" });
  }
});

app.get("/api/opportunity-scoring", async (_req, res) => {
  try {
    const scores = await listOpportunityScores();
    return res.status(200).json({
      opportunity_scores: scores,
      count: scores.length,
      recommended_next_action:
        scores[0]
          ? "Use the highest-ranked opportunity as the next slice-generation input."
          : "Run opportunity scoring after candidate opportunities exist.",
      reasoning_summary:
        scores[0]
          ? "Scores are ranked deterministically by total_score."
          : "No scored opportunities are currently available.",
    });
  } catch (e) {
    console.error("[opportunity-scoring] list failed", e);
    return res.status(500).json({ ok: false, error: "opportunity_scoring_list_failed" });
  }
});

app.post("/api/opportunity-scoring/run", async (_req, res) => {
  try {
    const result = await scoreOpportunities();
    return res.status(200).json(result);
  } catch (e) {
    console.error("[opportunity-scoring] run failed", e);
    return res.status(500).json({ ok: false, error: "opportunity_scoring_run_failed" });
  }
});

app.get("/api/opportunity-scoring/top", async (req, res) => {
  try {
    const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : 3;
    const topOpportunities = await getTopOpportunities(limit);
    return res.status(200).json({
      top_opportunities: topOpportunities,
      count: topOpportunities.length,
      recommended_next_action:
        topOpportunities[0]
          ? `Use ${topOpportunities[0].opportunity_id} as the highest-priority opportunity input.`
          : "Run opportunity scoring after candidate opportunities exist.",
      reasoning_summary:
        topOpportunities[0]
          ? "Top opportunities were selected by deterministic weighted scoring."
          : "No scored opportunities are currently available.",
    });
  } catch (e) {
    console.error("[opportunity-scoring] top failed", e);
    return res.status(500).json({ ok: false, error: "opportunity_scoring_top_failed" });
  }
});

app.get("/api/slices", async (_req, res) => {
  try {
    const slices = await listSlices();
    return res.status(200).json({
      slices,
      count: slices.length,
    });
  } catch (e) {
    console.error("[slices] list failed", e);
    return res.status(500).json({ ok: false, error: "slices_list_failed" });
  }
});

app.get("/api/slices/:id", async (req, res) => {
  try {
    const slice = await getSliceById(req.params.id);
    if (!slice) {
      return res.status(404).json({ ok: false, error: "slice_not_found" });
    }

    return res.status(200).json(slice);
  } catch (e) {
    console.error("[slices] get failed", e);
    return res.status(500).json({ ok: false, error: "slice_get_failed" });
  }
});

app.post("/api/slices/run", async (_req, res) => {
  try {
    const result = await runSliceGenerator();
    return res.status(200).json(result);
  } catch (e) {
    console.error("[slices] run failed", e);
    return res.status(500).json({ ok: false, error: "slice_run_failed" });
  }
});

app.get("/api/build-queue", async (_req, res) => {
  try {
    const queue = await listBuildQueue();
    return res.status(200).json({
      queue,
      count: queue.length,
      recommended_next_action: queue[0]?.recommended_next_action || "Run the build queue after generating slices.",
      reasoning_summary: queue[0]?.reasoning_summary || "No selected slice is available yet.",
    });
  } catch (e) {
    console.error("[build-queue] list failed", e);
    return res.status(500).json({ ok: false, error: "build_queue_list_failed" });
  }
});

app.post("/api/build-queue/run", async (_req, res) => {
  try {
    const result = await runBuildQueue();
    return res.status(200).json(result);
  } catch (e) {
    console.error("[build-queue] run failed", e);
    return res.status(500).json({ ok: false, error: "build_queue_run_failed" });
  }
});

app.get("/api/build-queue/next", async (_req, res) => {
  try {
    const nextItem = await getNextBuildQueueItem();
    if (!nextItem) {
      return res.status(200).json({
        next_item: null,
        recommended_next_action: "Run candidate opportunity generation, slice generation, and then the build queue.",
        reasoning_summary: "No buildable slice is currently selected.",
      });
    }

    return res.status(200).json(nextItem);
  } catch (e) {
    console.error("[build-queue] next failed", e);
    return res.status(500).json({ ok: false, error: "build_queue_next_failed" });
  }
});

app.get("/api/execution-packets", async (_req, res) => {
  try {
    const packets = await listExecutionPackets();
    return res.status(200).json({
      execution_packets: packets,
      count: packets.length,
      recommended_next_action: packets[0]?.recommended_next_action || "Run the execution packet generator after selecting a build queue slice.",
      reasoning_summary: packets[0]?.reasoning_summary || "No execution packet is currently available.",
    });
  } catch (e) {
    console.error("[execution-packets] list failed", e);
    return res.status(500).json({ ok: false, error: "execution_packets_list_failed" });
  }
});

app.get("/api/execution-packets/:id", async (req, res) => {
  try {
    const packet = await getExecutionPacketById(req.params.id);
    if (!packet) {
      return res.status(404).json({ ok: false, error: "execution_packet_not_found" });
    }

    return res.status(200).json(packet);
  } catch (e) {
    console.error("[execution-packets] get failed", e);
    return res.status(500).json({ ok: false, error: "execution_packet_get_failed" });
  }
});

app.post("/api/execution-packets/run", async (_req, res) => {
  try {
    const result = await runExecutionPacketGenerator();
    return res.status(200).json(result);
  } catch (e) {
    const message = String(e?.message || e);
    if (message.startsWith("selected_slice_not_found:")) {
      return res.status(400).json({ ok: false, error: "selected_slice_not_found" });
    }

    console.error("[execution-packets] run failed", e);
    return res.status(500).json({ ok: false, error: "execution_packet_run_failed" });
  }
});

app.get("/api/execution-packets/next", async (_req, res) => {
  try {
    const packet = await getNextExecutionPacket();
    if (!packet) {
      return res.status(200).json({
        execution_packet: null,
        recommended_next_action: "Run the execution packet generator after selecting a slice in the build queue.",
        reasoning_summary: "No execution packet has been generated yet.",
      });
    }

    return res.status(200).json(packet);
  } catch (e) {
    console.error("[execution-packets] next failed", e);
    return res.status(500).json({ ok: false, error: "execution_packet_next_failed" });
  }
});

app.get("/api/packet-executor", async (_req, res) => {
  try {
    const executions = await listPacketExecutions();
    return res.status(200).json({
      packet_executions: executions,
      count: executions.length,
      recommended_next_action: executions[0]?.recommended_next_action || "Run the packet executor after generating an execution packet.",
      reasoning_summary: executions[0]?.reasoning_summary || "No packet execution record is currently available.",
    });
  } catch (e) {
    console.error("[packet-executor] list failed", e);
    return res.status(500).json({ ok: false, error: "packet_executor_list_failed" });
  }
});

app.post("/api/packet-executor/run", async (_req, res) => {
  try {
    const result = await submitPacketExecution();
    return res.status(200).json(result);
  } catch (e) {
    console.error("[packet-executor] run failed", e);
    return res.status(500).json({ ok: false, error: "packet_executor_run_failed" });
  }
});

app.get("/api/packet-executor/next", async (_req, res) => {
  try {
    const packet = await getNextPacket();
    if (!packet) {
      return res.status(200).json({
        execution_packet: null,
        recommended_next_action: "Generate an execution packet before asking the executor for the next packet.",
        reasoning_summary: "No generated execution packet is currently available.",
      });
    }

    return res.status(200).json(packet);
  } catch (e) {
    console.error("[packet-executor] next failed", e);
    return res.status(500).json({ ok: false, error: "packet_executor_next_failed" });
  }
});

app.get("/api/feedback", async (_req, res) => {
  try {
    const feedback = await listFeedback();
    return res.status(200).json({
      feedback_records: feedback,
      count: feedback.length,
    });
  } catch (e) {
    console.error("[feedback] list failed", e);
    return res.status(500).json({ ok: false, error: "feedback_list_failed" });
  }
});

app.get("/api/feedback/packet/:execution_packet_id", async (req, res) => {
  try {
    const feedback = await getFeedbackByPacket(req.params.execution_packet_id);
    return res.status(200).json({
      execution_packet_id: req.params.execution_packet_id,
      feedback_records: feedback,
      count: feedback.length,
    });
  } catch (e) {
    console.error("[feedback] packet lookup failed", e);
    return res.status(500).json({ ok: false, error: "feedback_packet_lookup_failed" });
  }
});

app.get("/api/feedback/slice/:slice_id", async (req, res) => {
  try {
    const feedback = await getFeedbackBySlice(req.params.slice_id);
    return res.status(200).json({
      slice_id: req.params.slice_id,
      feedback_records: feedback,
      count: feedback.length,
    });
  } catch (e) {
    console.error("[feedback] slice lookup failed", e);
    return res.status(500).json({ ok: false, error: "feedback_slice_lookup_failed" });
  }
});

app.post("/api/feedback", async (req, res) => {
  try {
    const record = await recordFeedback(req.body || {});
    return res.status(201).json(record);
  } catch (e) {
    const message = String(e?.message || e);
    if (message.startsWith("validation_error:")) {
      return res.status(400).json({ ok: false, error: message.replace("validation_error:", "") });
    }

    console.error("[feedback] create failed", e);
    return res.status(500).json({ ok: false, error: "feedback_create_failed" });
  }
});

app.get("/api/system-state", async (_req, res) => {
  try {
    const latest = await getLatestSystemSnapshot();
    return res.status(200).json({
      system_snapshot: latest,
      recommended_next_action: latest?.recommended_next_action || "Generate a system snapshot to inspect the current system state.",
      reasoning_summary: latest?.reasoning_summary || "No system snapshot has been generated yet.",
    });
  } catch (e) {
    console.error("[system-state] get failed", e);
    return res.status(500).json({ ok: false, error: "system_state_get_failed" });
  }
});

app.post("/api/system-state/run", async (_req, res) => {
  try {
    const snapshot = await buildSystemSnapshot();
    return res.status(200).json(snapshot);
  } catch (e) {
    console.error("[system-state] run failed", e);
    return res.status(500).json({ ok: false, error: "system_state_run_failed" });
  }
});

app.get("/api/system-state/latest", async (_req, res) => {
  try {
    const snapshot = await getLatestSystemSnapshot();
    if (!snapshot) {
      return res.status(200).json({
        system_snapshot: null,
        recommended_next_action: "Run the system-state snapshot generator to capture the current pipeline state.",
        reasoning_summary: "No system snapshot has been generated yet.",
      });
    }

    return res.status(200).json(snapshot);
  } catch (e) {
    console.error("[system-state] latest failed", e);
    return res.status(500).json({ ok: false, error: "system_state_latest_failed" });
  }
});

app.get("/api/operator-brain", async (_req, res) => {
  try {
    const decisions = await listOperatorDecisions();
    return res.status(200).json({
      operator_decisions: decisions,
      count: decisions.length,
      recommended_next_action:
        decisions[0]?.recommended_next_action ||
        "Run the operator brain after generating a current system snapshot.",
      reasoning_summary:
        decisions[0]?.reasoning_summary || "No operator decision has been generated yet.",
    });
  } catch (e) {
    console.error("[operator-brain] list failed", e);
    return res.status(500).json({ ok: false, error: "operator_brain_list_failed" });
  }
});

app.post("/api/operator-brain/run", async (_req, res) => {
  try {
    const result = await runOperatorBrain();
    return res.status(200).json(result);
  } catch (e) {
    console.error("[operator-brain] run failed", e);
    return res.status(500).json({ ok: false, error: "operator_brain_run_failed" });
  }
});

app.get("/api/operator-brain/latest", async (_req, res) => {
  try {
    const decision = await getLatestOperatorDecision();
    if (!decision) {
      return res.status(200).json({
        operator_decision: null,
        recommended_next_action: "Run the operator brain after generating a current system snapshot.",
        reasoning_summary: "No operator decision has been generated yet.",
      });
    }
    return res.status(200).json(decision);
  } catch (e) {
    console.error("[operator-brain] latest failed", e);
    return res.status(500).json({ ok: false, error: "operator_brain_latest_failed" });
  }
});

app.get("/api/execution-gate", async (_req, res) => {
  try {
    const decisions = await listExecutionGateDecisions();
    return res.status(200).json({
      execution_gate_decisions: decisions,
      count: decisions.length,
      allowed: decisions[0]?.allowed ?? null,
      reason: decisions[0]?.reason || "No execution gate decision has been generated yet.",
      requires_approval: decisions[0]?.requires_approval ?? null,
      risk_level: decisions[0]?.risk_level || null,
      execution_mode: decisions[0]?.execution_mode || null,
    });
  } catch (e) {
    console.error("[execution-gate] list failed", e);
    return res.status(500).json({ ok: false, error: "execution_gate_list_failed" });
  }
});

app.post("/api/execution-gate/run", async (_req, res) => {
  try {
    const result = await runExecutionGate();
    return res.status(200).json(result);
  } catch (e) {
    console.error("[execution-gate] run failed", e);
    return res.status(500).json({ ok: false, error: "execution_gate_run_failed" });
  }
});

app.get("/api/execution-gate/latest", async (_req, res) => {
  try {
    const decision = await getLatestExecutionGateDecision();
    if (!decision) {
      return res.status(200).json({
        execution_gate_decision: null,
        allowed: null,
        reason: "No execution gate decision has been generated yet.",
        requires_approval: null,
        risk_level: null,
        execution_mode: null,
      });
    }
    return res.status(200).json(decision);
  } catch (e) {
    console.error("[execution-gate] latest failed", e);
    return res.status(500).json({ ok: false, error: "execution_gate_latest_failed" });
  }
});

app.get("/api/packet-validator", async (_req, res) => {
  try {
    const validations = await listPacketValidations();
    return res.status(200).json({
      packet_validations: validations,
      count: validations.length,
      valid: validations[0]?.valid ?? null,
      validation_score: validations[0]?.validation_score ?? null,
      reasoning_summary: validations[0]?.reasoning_summary || "No packet validation has been generated yet.",
    });
  } catch (e) {
    console.error("[packet-validator] list failed", e);
    return res.status(500).json({ ok: false, error: "packet_validator_list_failed" });
  }
});

app.get("/api/packet-validator/latest", async (_req, res) => {
  try {
    const validation = await getLatestPacketValidation();
    if (!validation) {
      return res.status(200).json({
        packet_validation: null,
        valid: null,
        validation_score: null,
        reasoning_summary: "No packet validation has been generated yet.",
      });
    }
    return res.status(200).json(validation);
  } catch (e) {
    console.error("[packet-validator] latest failed", e);
    return res.status(500).json({ ok: false, error: "packet_validator_latest_failed" });
  }
});

app.get("/api/packet-validator/:execution_packet_id", async (req, res) => {
  try {
    const validation = await getPacketValidationByPacketId(req.params.execution_packet_id);
    if (!validation) {
      return res.status(404).json({ ok: false, error: "packet_validation_not_found" });
    }
    return res.status(200).json(validation);
  } catch (e) {
    console.error("[packet-validator] get failed", e);
    return res.status(500).json({ ok: false, error: "packet_validator_get_failed" });
  }
});

app.post("/api/packet-validator/run", async (req, res) => {
  try {
    const executionPacketId =
      typeof req.body?.execution_packet_id === "string" ? req.body.execution_packet_id : null;
    const result = await runPacketValidator(executionPacketId);
    return res.status(200).json(result);
  } catch (e) {
    console.error("[packet-validator] run failed", e);
    return res.status(500).json({ ok: false, error: "packet_validator_run_failed" });
  }
});

app.get("/api/signal-interpreter", async (_req, res) => {
  try {
    const interpretedSignals = await listInterpretedSignals();
    return res.status(200).json({
      interpreted_signals: interpretedSignals,
      count: interpretedSignals.length,
    });
  } catch (e) {
    console.error("[signal-interpreter] list failed", e);
    return res.status(500).json({ ok: false, error: "signal_interpreter_list_failed" });
  }
});

app.post("/api/signal-interpreter/run", async (_req, res) => {
  try {
    const result = await runSignalInterpreter();
    return res.status(200).json(result);
  } catch (e) {
    console.error("[signal-interpreter] run failed", e);
    return res.status(500).json({ ok: false, error: "signal_interpreter_run_failed" });
  }
});

app.get("/api/signal-interpreter/latest", async (_req, res) => {
  try {
    const interpretedSignals = await getLatestInterpretedSignals();
    return res.status(200).json({
      interpreted_signals: interpretedSignals,
      count: interpretedSignals.length,
    });
  } catch (e) {
    console.error("[signal-interpreter] latest failed", e);
    return res.status(500).json({ ok: false, error: "signal_interpreter_latest_failed" });
  }
});

app.get("/api/checkout-benchmark", async (req, res) => {
  try {
    const store = typeof req.query.store === "string" ? req.query.store : "";
    if (!store) {
      return res.status(400).json({ ok: false, error: "store_required" });
    }
    return res.status(200).json(await generateCheckoutBenchmark(store));
  } catch (e) {
    console.error("[checkout-benchmark] store query failed", e);
    return res.status(500).json({ ok: false, error: "checkout_benchmark_query_failed" });
  }
});

app.get("/api/checkout-score", async (req, res) => {
  try {
    const store = typeof req.query.store === "string" ? req.query.store : "";
    console.log("[checkout-score] request", { store });

    if (!store) {
      return res.status(400).json({ ok: false, error: "store_required" });
    }

    const report = await generateCheckoutBenchmark(store);
    return res.status(200).json({
      store: report.store,
      checkout_score: report.score ?? report.checkout_score,
      peer_average: report.peer_average,
      percentile: report.percentile,
      tier: report.tier,
      benchmark_badge: report.benchmark_badge,
      detected_signals: report.detected_signals,
      missing_signals: report.missing_signals,
      top_friction: report.top_friction,
      recommendation: report.recommendation,
      estimated_revenue_opportunity:
        report.estimated_revenue_opportunity ?? report.estimated_monthly_revenue_opportunity,
      competitor_comparison: report.competitor_comparison,
    });
  } catch (e) {
    console.error("[checkout-score] failed", e);
    return res.status(500).json({ ok: false, error: "checkout_score_failed" });
  }
});

app.get("/api/checkout-benchmark/report", async (req, res) => {
  try {
    const store = typeof req.query.store === "string" ? req.query.store : "";
    if (!store) {
      return res.status(400).type("text/plain").send("store_required");
    }
    const report = await generateCheckoutBenchmark(store);
    return res.status(200).type("text/plain; charset=utf-8").send(formatCheckoutBenchmark(report));
  } catch (e) {
    console.error("[checkout-benchmark] formatted report failed", e);
    return res.status(500).type("text/plain").send("checkout_benchmark_report_failed");
  }
});

app.get("/api/checkout-benchmark/demo", async (_req, res) => {
  try {
    const merchantId = "demo-merchant";
    const existing = await getLatestCheckoutBenchmarkReport(merchantId);
    if (existing) {
      return res.status(200).json(existing);
    }
    const generated = await generateCheckoutBenchmarkReport(merchantId);
    return res.status(200).json(generated);
  } catch (e) {
    console.error("[checkout-benchmark] demo failed", e);
    return res.status(500).json({ ok: false, error: "checkout_benchmark_demo_failed" });
  }
});

app.get("/api/checkout-benchmark/:merchant_id", async (req, res) => {
  try {
    const merchantId = req.params.merchant_id;
    const existing = await getLatestCheckoutBenchmarkReport(merchantId);
    if (existing) {
      return res.status(200).json(existing);
    }
    const generated = await generateCheckoutBenchmarkReport(merchantId);
    return res.status(200).json(generated);
  } catch (e) {
    console.error("[checkout-benchmark] get failed", e);
    return res.status(500).json({ ok: false, error: "checkout_benchmark_get_failed" });
  }
});

app.post("/api/checkout-benchmark/run", async (req, res) => {
  try {
    const merchantId = typeof req.body?.merchant_id === "string" ? req.body.merchant_id : "";
    if (!merchantId) {
      return res.status(400).json({ ok: false, error: "merchant_id_required" });
    }
    const report = await generateCheckoutBenchmarkReport(merchantId);
    return res.status(200).json(report);
  } catch (e) {
    console.error("[checkout-benchmark] run failed", e);
    return res.status(500).json({ ok: false, error: "checkout_benchmark_run_failed" });
  }
});

app.get("/api/checkout-benchmark/latest/:merchant_id", async (req, res) => {
  try {
    const report = await getLatestCheckoutBenchmarkReport(req.params.merchant_id);
    if (!report) {
      return res.status(404).json({ ok: false, error: "checkout_benchmark_not_found" });
    }
    return res.status(200).json(report);
  } catch (e) {
    console.error("[checkout-benchmark] latest failed", e);
    return res.status(500).json({ ok: false, error: "checkout_benchmark_latest_failed" });
  }
});

app.post("/abando/activation/trigger-test-recovery", async (req, res) => {
  try {
    const shopDomain = normalizeShop(req.body?.shopDomain || req.body?.shop || "");

    if (!shopDomain) {
      return res.status(400).json({ ok: false, error: "invalid_shop" });
    }

    const requestId =
      String(req.get("x-request-id") || "").trim() ||
      `req_${Date.now()}_${randomBytes(6).toString("hex")}`;
    const idempotencyKey = `merchant:test-recovery:${shopDomain}:${requestId}`;

    const existing = await getJobByIdempotencyKey(idempotencyKey);
    if (existing) {
      return res.status(202).json({
        status: "queued",
        jobId: existing.id,
      });
    }

    const job = await createJob({
      type: "trigger-test-recovery",
      shopDomain,
      idempotencyKey,
      payload: {
        shopDomain,
        type: "trigger-test-recovery",
      },
    });

    await appendSystemEvent({
      eventType: "test_recovery_requested",
      shopDomain,
      relatedJobId: job.id,
      payload: {
        shopDomain,
        type: "trigger-test-recovery",
      },
    });

    return res.status(202).json({
      status: "queued",
      jobId: job.id,
    });
  } catch (e) {
    console.error("[abando] trigger-test-recovery enqueue error", e);
    return res.status(500).json({ ok: false, error: "enqueue_failed" });
  }
});

// Start
const PORT = process.env.PORT ? Number(process.env.PORT) : 8081;
app.listen(PORT, () => console.log(`[server] listening on :${PORT}`));
// Public Stripe checkout (no auth)
app.post("/api/billing/checkout", async (req, res) => {
  try {
    const Stripe = (await import("stripe")).default;
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const priceStarter = process.env.STRIPE_PRICE_STARTER;
    const pricePro = process.env.STRIPE_PRICE_PRO;
    if (!stripeKey) return res.status(500).json({ error: "stripe_not_configured" });

    const plan = (req.body && req.body.plan) || "starter";
    const price = plan === "pro" ? (pricePro || "") : (priceStarter || "");
    if (!price) return res.status(500).json({ error: "price_not_configured" });

    const stripe = new Stripe(stripeKey);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      success_url: "https://abando.ai/onboarding/",
      cancel_url: "https://abando.ai/pricing/",
    });
    return res.json({ url: session.url });
  } catch (e) {
    console.error("[public checkout] error:", e);
    return res.status(500).json({ error: "checkout_failed" });
  }
});
app.get("/demo/playground", (_req, res) =>
  res.sendFile(join(__dirname, "public", "demo", "playground", "index.html")));
app.get("/support", (_req, res) =>
  res.sendFile(join(__dirname, "public", "support", "index.html")));
app.post("/api/fix-intake", async (req, res) => {
  try {
    const input = {
      name: String(req.body?.name || "").trim(),
      email: String(req.body?.email || "").trim(),
      githubIssueUrl: String(req.body?.githubIssueUrl || "").trim(),
      repoOrSetupUrl: String(req.body?.repoOrSetupUrl || "").trim(),
      issueText: String(req.body?.issueText || "").trim(),
    };

    if (!input.name || !input.email || !input.issueText) {
      return res.status(400).json({ ok: false, error: "invalid_fix_intake" });
    }

    const submission = await createFixIntakeSubmission(input);
    const diagnosis = submission.diagnosis || (await diagnoseIssue(input.issueText));
    const explanation =
      submission.explanation || buildDiagnosisExplanation(diagnosis);
    const recommendedNextStep =
      submission.recommendedNextStep ||
      (Number(diagnosis?.confidence || 0) >= 0.55 ? "payment" : "manual_review");

    return res.json({
      ok: true,
      submissionId: submission.submissionId,
      diagnosis,
      explanation,
      typicalSymptoms: submission.typicalSymptoms || [],
      whatIWouldFix: submission.whatIWouldFix || [],
      recommendedNextStep,
    });
  } catch (error) {
    console.error("[fix-intake] error:", error);
    return res.status(500).json({ ok: false, error: "fix_intake_failed" });
  }
});
app.post("/api/payments/create-fix-checkout", async (req, res) => {
  try {
    const payload = {
      leadId: String(req.body?.leadId || "").trim(),
      source: String(req.body?.source || "fix_page").trim() || "fix_page",
      email: String(req.body?.email || "").trim(),
      name: String(req.body?.name || "").trim(),
      returnBaseUrl: resolveRequestOrigin(req),
    };

    const result = await createFixCheckoutSession(payload);
    return res.json({
      ok: true,
      checkoutUrl: result.checkoutUrl,
      sessionId: result.sessionId,
      expiresAt: result.expiresAt,
      leadId: result.leadId,
      offerId: result.offerId,
      recoveryUrl: result.recoveryUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message === "stripe_not_configured" ? 503 : 500;
    return res.status(status).json({
      ok: false,
      error: message,
      message: "Could not start Stripe checkout right now.",
    });
  }
});
app.post("/api/fix-audit", async (req, res) => {
  try {
    const storeUrl = normalizeStoreInput(req.body?.storeUrl);
    const email = normalizeEmail(req.body?.email);

    if (!storeUrl || !email) {
      return res.status(400).json({ ok: false, error: "invalid_fix_audit_input" });
    }

    const analysis = await analyzeStore(storeUrl);
    const lead = await createFixAuditLead({
      storeUrl,
      email,
      analysis,
    });

    return res.json({
      ok: true,
      leadId: lead.leadId,
      analysis,
    });
  } catch (error) {
    console.error("[fix-audit] error:", error);
    return res.status(500).json({ ok: false, error: "fix_audit_failed" });
  }
});
app.get("/api/runtime-proof", async (_req, res) => {
  try {
    const proofCase = await readRuntimeProofCase();
    return res.json({ ok: true, proofCase });
  } catch (error) {
    console.error("[runtime-proof] error:", error);
    return res.status(500).json({ ok: false, error: "runtime_proof_unavailable" });
  }
});
app.get("/fix", async (_req, res) => {
  return res.type("html").send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Abando Store Fix Audit</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f8fafc;
        --card: #ffffff;
        --text: #0f172a;
        --muted: #475569;
        --line: #dbe3ef;
        --accent: #0f172a;
        --accent-strong: #020617;
        --success: #0f766e;
        --panel: #f8fafc;
        --warning: #dc6803;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: var(--bg);
        color: var(--text);
      }
      .wrap {
        max-width: 860px;
        margin: 0 auto;
        padding: 40px 20px 64px;
      }
      .card {
        background: var(--card);
        border: 1px solid var(--line);
        border-radius: 24px;
        padding: 32px;
        box-shadow: 0 14px 32px rgba(16, 24, 40, 0.08);
      }
      h1, h2, p, ul, ol { margin: 0; }
      h1 {
        font-size: clamp(2rem, 4vw, 2.8rem);
        line-height: 1.06;
        margin-bottom: 12px;
        letter-spacing: -0.03em;
      }
      h2 {
        font-size: 1rem;
        color: var(--text);
        margin: 0 0 12px;
      }
      p, li {
        color: var(--muted);
        font-size: 1rem;
        line-height: 1.65;
      }
      ul { padding-left: 20px; }
      li + li { margin-top: 10px; }
      .subhead {
        font-size: 1.08rem;
        margin-top: 6px;
      }
      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #0f766e;
      }
      .stack {
        display: grid;
        gap: 16px;
      }
      .panel {
        margin-top: 24px;
        padding: 20px 22px;
        border-radius: 16px;
        background: var(--panel);
        border: 1px solid var(--line);
      }
      .hidden {
        display: none;
      }
      form {
        display: grid;
        gap: 12px;
      }
      .grid {
        display: grid;
        gap: 12px;
        grid-template-columns: 1fr 1fr;
      }
      input, textarea {
        width: 100%;
        border: 1px solid var(--line);
        border-radius: 12px;
        padding: 12px 14px;
        font: inherit;
        color: var(--text);
        background: #fbfcfe;
      }
      textarea {
        min-height: 120px;
        resize: vertical;
      }
      .submit, .cta-link {
        appearance: none;
        border: 0;
        border-radius: 12px;
        padding: 12px 16px;
        background: var(--accent);
        color: white;
        font: inherit;
        font-weight: 600;
        cursor: pointer;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .ghost {
        appearance: none;
        border: 1px solid var(--line);
        border-radius: 12px;
        padding: 12px 16px;
        background: #fff;
        color: var(--text);
        font: inherit;
        font-weight: 600;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .status {
        font-size: 14px;
        color: var(--muted);
      }
      .results {
        margin-top: 22px;
        display: grid;
        gap: 18px;
      }
      .hero-result {
        padding: 20px 22px;
        border-radius: 18px;
        border: 1px solid #cbd5e1;
        background: linear-gradient(180deg, #fff7ed 0%, #ffffff 100%);
      }
      .score-row {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .metric {
        padding: 16px 18px;
        border-radius: 14px;
        background: var(--panel);
        border: 1px solid var(--line);
      }
      .metric-label {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #64748b;
      }
      .metric-value {
        margin-top: 8px;
        font-size: 1.25rem;
        color: var(--text);
        font-weight: 700;
      }
      .issues {
        display: grid;
        gap: 12px;
      }
      .issue {
        padding: 16px 18px;
        border-radius: 14px;
        background: #fcfcfd;
        border: 1px solid var(--line);
      }
      .issue strong {
        display: block;
        color: var(--text);
        margin-bottom: 6px;
      }
      .issue-severity {
        display: inline-flex;
        margin-top: 10px;
        padding: 4px 8px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        background: #fff7ed;
        color: var(--warning);
      }
      .actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
      .kicker {
        color: var(--warning);
        font-weight: 700;
        margin-bottom: 8px;
      }
      .small {
        font-size: 14px;
        color: #64748b;
      }
      @media (max-width: 720px) {
        .grid {
          grid-template-columns: 1fr;
        }
        .score-row {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main class="wrap">
      <section class="card">
        <div class="eyebrow">Abando Fix Audit</div>
        <h1>Find the checkout leaks on your store.</h1>
        <p class="subhead">Enter your store URL and Abando will surface the strongest recovery gaps we can detect right now.</p>

        <section id="stepStore" class="panel stack">
          <div>
            <h2>Start with your store</h2>
            <p>We’ll check for missing recovery signals, weak capture paths, and basic checkout friction.</p>
          </div>
          <form id="storeForm">
            <input id="storeUrlInput" name="storeUrl" placeholder="yourstore.com or your-store.myshopify.com" required />
            <button class="submit" type="submit">Analyze store</button>
          </form>
          <p class="small">This is a lead-generation audit. The estimate is directional and stays grounded in the signals we can actually detect.</p>
        </section>

        <section id="stepLead" class="panel stack hidden">
          <div>
            <h2>Where should we send the audit?</h2>
            <p>Enter your email to unlock the full result. We’ll store the lead locally and show the analysis immediately.</p>
          </div>
          <form id="leadForm">
            <input id="emailInput" name="email" type="email" placeholder="you@store.com" required />
            <button class="submit" type="submit">See full results</button>
          </form>
          <p id="leadStoreEcho" class="small"></p>
        </section>

        <section id="stepResults" class="hidden">
          <div class="status" id="analysisStatus"></div>
          <div class="results">
            <div class="hero-result">
              <div class="kicker">You're losing customers at checkout</div>
              <h2 id="resultsHeadline" style="font-size:1.55rem; margin-bottom:10px;">Abando found recovery friction on this store.</h2>
              <p id="resultsSummary"></p>
            </div>

            <div class="score-row">
              <div class="metric">
                <div class="metric-label">Opportunity score</div>
                <div class="metric-value" id="opportunityScore">—</div>
              </div>
              <div class="metric">
                <div class="metric-label">Estimated loss range</div>
                <div class="metric-value" id="estimatedLoss">—</div>
              </div>
            </div>

            <div class="panel">
              <h2>Key issues</h2>
              <div id="issuesList" class="issues"></div>
            </div>

            <div class="panel stack">
              <div>
                <h2>Opportunity</h2>
                <p id="opportunityCopy"></p>
              </div>
              <div class="actions">
                <a id="abandoDemoLink" class="cta-link" href="/demo/playground">See how to recover these customers</a>
                <button id="analyzeAnotherButton" class="ghost" type="button">Analyze another store</button>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
    <script>
      const storeForm = document.getElementById("storeForm");
      const leadForm = document.getElementById("leadForm");
      const stepStore = document.getElementById("stepStore");
      const stepLead = document.getElementById("stepLead");
      const stepResults = document.getElementById("stepResults");
      const analysisStatus = document.getElementById("analysisStatus");
      const leadStoreEcho = document.getElementById("leadStoreEcho");
      const storeUrlInput = document.getElementById("storeUrlInput");
      const emailInput = document.getElementById("emailInput");
      const issuesList = document.getElementById("issuesList");
      const opportunityScore = document.getElementById("opportunityScore");
      const estimatedLoss = document.getElementById("estimatedLoss");
      const resultsSummary = document.getElementById("resultsSummary");
      const opportunityCopy = document.getElementById("opportunityCopy");
      const abandoDemoLink = document.getElementById("abandoDemoLink");
      const analyzeAnotherButton = document.getElementById("analyzeAnotherButton");
      const resultsHeadline = document.getElementById("resultsHeadline");

      let pendingStoreUrl = "";

      function showStep(step) {
        stepStore.classList.toggle("hidden", step !== "store");
        stepLead.classList.toggle("hidden", step !== "lead");
        stepResults.classList.toggle("hidden", step !== "results");
      }

      function renderIssues(items) {
        issuesList.innerHTML = (Array.isArray(items) ? items : []).map((issue) => {
          const title = String(issue && issue.title || "");
          const detail = String(issue && issue.detail || "");
          const severity = String(issue && issue.severity || "medium");
          return '<div class="issue"><strong>' + title + '</strong><p>' + detail + '</p><span class="issue-severity">' + severity + '</span></div>';
        }).join("");
      }

      function resetFlow() {
        pendingStoreUrl = "";
        storeUrlInput.value = "";
        emailInput.value = "";
        analysisStatus.textContent = "";
        leadStoreEcho.textContent = "";
        showStep("store");
      }

      storeForm.addEventListener("submit", (event) => {
        event.preventDefault();
        pendingStoreUrl = String(storeUrlInput.value || "").trim();
        if (!pendingStoreUrl) {
          return;
        }
        leadStoreEcho.textContent = 'Store: ' + pendingStoreUrl;
        showStep("lead");
      });

      leadForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const email = String(emailInput.value || "").trim();
        if (!pendingStoreUrl || !email) {
          return;
        }

        showStep("results");
        analysisStatus.textContent = "Analyzing...";

        try {
          const response = await fetch("/api/fix-audit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              storeUrl: pendingStoreUrl,
              email,
            }),
          });
          const data = await response.json();

          if (!response.ok || !data.ok || !data.analysis) {
            throw new Error(data && data.error ? data.error : "fix_audit_failed");
          }

          const analysis = data.analysis;
          const issueCount = Array.isArray(analysis.issues) ? analysis.issues.length : 0;
          analysisStatus.textContent = "Analysis complete.";
          resultsHeadline.textContent = pendingStoreUrl;
          resultsSummary.textContent = issueCount > 0
            ? 'We found ' + issueCount + ' recovery gaps that can leak customers before they finish checkout.'
            : 'We found enough checkout friction to justify a closer recovery pass on this store.';
          opportunityScore.textContent = String(analysis.opportunityScore || 0);
          estimatedLoss.textContent = analysis.estimatedLoss && analysis.estimatedLoss.display
            ? analysis.estimatedLoss.display
            : "—";
          renderIssues(analysis.issues || []);
          opportunityCopy.textContent = 'Abando can use these checkout gaps as the starting point for recovery. The next step is to review the recovery demo and see how to bring these shoppers back.';
          abandoDemoLink.href = '/demo/playground?store=' + encodeURIComponent(analysis.storeUrl || pendingStoreUrl);
        } catch (_error) {
          analysisStatus.textContent = "We could not analyze that store right now. Please try another URL.";
          resultsHeadline.textContent = pendingStoreUrl;
          resultsSummary.textContent = "The audit could not complete.";
          opportunityScore.textContent = "—";
          estimatedLoss.textContent = "—";
          issuesList.innerHTML = "";
          opportunityCopy.textContent = "Try a different store URL or come back in a moment.";
        }
      });

      analyzeAnotherButton.addEventListener("click", resetFlow);
    </script>
  </body>
</html>`);
});

// ---- AI demo message generation ----
function buildPrompt(p) {
  const {
    productName = "your item",
    price = "",
    tone = "Friendly",
    channel = "Email",
    offer = "",
    cta = "Complete your order",
    template = "Custom flow",
  } = p || {};

  const priceStr = price ? `$${Number(price).toFixed(2)}` : "";
  const offerStr = offer ? ` Offer: ${offer}.` : "";
  return `You are an AI shopping assistant writing a ${channel} message in a ${tone.toLowerCase()} tone.
Template: ${template}.
Write a concise, conversion-focused message (80-140 words) that helps the shopper finish checkout.

Product: ${productName} ${priceStr}
${offerStr}
CTA: ${cta}

Return ONLY the message body, no greetings like "Hi" unless natural, no markdown.`;
}

// Fallback message if no model is configured
function fallbackMessage(p) {
  const { productName = "your item", cta = "Complete your order", offer = "" } = p || {};
  const offerLine = offer ? ` We’ve added an exclusive ${offer} just for you.` : "";
  return `Quick reminder — your ${productName} is still in your cart. I can answer any questions and help you finish up.${offerLine} When you’re ready, tap the link below to pick up where you left off.\n\n${cta} →`;
}

async function generateWithOpenAI(prompt, params) {
  const key = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;
  if (!key) return { message: fallbackMessage(params), usedAI:false };

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    })
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    console.error("[ai] openai error", resp.status, text);
    return { message: fallbackMessage(params), usedAI:false };
  }
  const data = await resp.json();
  const message = data?.choices?.[0]?.message?.content?.trim() || fallbackMessage(params);
  return { message, usedAI:true };
}

async function handleGenerate(req, res) {
  try {
    const p = req.body || {};
    const prompt = buildPrompt(p);
    const { message, usedAI } = await generateWithOpenAI(prompt, p);
    const subject = (p.channel || "Email").toLowerCase().includes("email")
      ? `Your ${p.productName || "item"} is still in your cart`
      : `Finish your order`;
    return res.json({ ok: true, subject, message, usedAI });
  } catch (e) {
    console.error("[demo] generate error", e);
    return res.status(500).json({ ok:false, error: "generate_failed" });
  }
}

// Accept both paths the UI might call
app.post("/api/demo/generate", handleGenerate);
app.post("/api/generate", handleGenerate);

// --- AI healthcheck route ---
import fetch from "node-fetch"; // ensure node-fetch is installed in your deps

app.get("/api/ai/health", async (req, res) => {
  try {
    const resp = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    });
    if (!resp.ok) throw new Error(`OpenAI responded ${resp.status}`);
    const data = await resp.json();
    res.json({ ok: true, model: process.env.OPENAI_MODEL || "unset", models: data.data.slice(0,3) });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.use((req, res) => {
  console.log("[debug:404]", {
    method: req.method,
    url: req.originalUrl || req.url,
    host: req.headers.host,
    xfHost: req.headers["x-forwarded-host"],
    xfProto: req.headers["x-forwarded-proto"],
    cfRay: req.headers["cf-ray"] || null,
  });
  return res.status(404).type("text/plain").send("Not Found");
});
