
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
import fs from "node:fs";
import dns from "node:dns/promises";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { randomBytes, createHmac } from "node:crypto";
import dotenv from "dotenv";
import pkg from "@prisma/client";
import applyAbandoDevProxy from "./abandoDevProxy.js";
import { getDashboardSummary } from "./lib/dashboardSummary.js";
import { generateRecoveryMessage, parseRecoveryToken } from "./lib/recoveryMessageEngine.js";
import {
  getLatestRecoveryAttributionForExperience,
  persistRecoveryAttributionFromOrder,
  persistRecoveryAttributionFromReturn,
  persistRecoveryAttributionFromSend,
  RECOVERY_ATTRIBUTION_EVENT,
} from "./lib/recoveryAttribution.js";
import {
  getEmailReadiness,
  getMissingEmailEnvVars as getEmailSenderMissingEnvVars,
  isEmailSenderConfigured,
  resolveFromEmail,
  sendRecoveryEmail,
} from "./lib/emailSender.js";
import { fetchTwilioMessageStatus, interpretTwilioDeliveryStatus, isSmsSenderConfigured, sendRecoverySMS } from "./lib/smsSender.js";
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
import { installShopifyAppListingRoute } from "./routes/shopifyAppListing.esm.js";
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
  generateMessagePerformanceSummary,
  updateProofLoopById,
} from "../../staffordos/modules/outreach_performance/index.js";
import { assignVariantForLead, getAssignedVariantForLead, getExperimentStatus } from "../../staffordos/modules/outreach_experiments/index.js";

const { PrismaClient, Prisma } = pkg;
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
  BILLING_STATE_EVENT,
  getBillingRuntimeReadiness,
  getLatestMerchantBillingState,
  persistMerchantBillingState,
} from "./lib/merchantBillingState.js";
import {
  getDirectPaymentUrl,
  getStripePriceIds,
  getStripeSecretKey,
  getStripeWebhookSecret,
  hasCollectableBillingConfig,
} from "./lib/stripeConfig.js";
import {
  canonicalizePublicAppUrl,
  getPublicAppBaseUrl,
} from "../../staffordos/shared/public_base_url.js";
import {
  createFixCheckoutSession,
  markFixCheckoutSessionCompleted,
} from "./lib/fixCheckout.js";
import { renderAbandoStatus } from "./components/abandoStatusCard.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..");

for (const envPath of [
  resolve(repoRoot, ".env"),
  resolve(repoRoot, "web", ".env"),
  resolve(repoRoot, "staffordos", "dev", ".env.abando.local"),
]) {
  if (fs.existsSync(envPath)) {
    const result = dotenv.config({ path: envPath, override: false });
    if (!result.error) {
      console.log(`[env] loaded ${envPath}`);
    }
  }
}

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


const app = express();
const publicDir = join(__dirname, "public");
const CANONICAL_APP_NAME = "Abando – Cart Recovery AI";
const SHOPIFY_APP_BRIDGE_URL = "https://cdn.shopify.com/shopifycloud/app-bridge.js";
const SHOPIFY_EMBED_FRAME_ANCESTORS = "https://admin.shopify.com https://*.myshopify.com";
const devSessionStatePath = join(repoRoot, ".tmp", "dev-session.json");
const fixAuditLeadsPath = join(repoRoot, ".tmp", "fix_audit_leads.json");
const leadsTopTargetsPath = join(repoRoot, "staffordos", "leads", "top_targets.json");
const leadsOutcomesPath = join(repoRoot, "staffordos", "leads", "outcomes.json");
const leadsOutreachQueuePath = join(repoRoot, "staffordos", "leads", "outreach_queue.json");
const leadsOutreachTemplatesPath = join(repoRoot, "staffordos", "leads", "outreach_templates.json");
const leadsContactResearchQueuePath = join(repoRoot, "staffordos", "leads", "contact_research_queue.json");
const leadsInstallEventsPath = join(repoRoot, "staffordos", "leads", "install_events.json");
const abandoProofEventsPath = join(repoRoot, "staffordos", "events", "abando_proof_events.json");

app.set("trust proxy", 1);

function applyShopifyEmbeddedAppHeaders(res) {
  res.removeHeader("X-Frame-Options");
  res.setHeader(
    "Content-Security-Policy",
    `frame-ancestors ${SHOPIFY_EMBED_FRAME_ANCESTORS};`,
  );
}

function isEmbeddedAppDocumentRequest(req) {
  const path = String(req.path || "");
  return (
    path === "/dashboard" ||
    path === "/dashboard/" ||
    path === "/app" ||
    path === "/embedded" ||
    path === "/embedded/" ||
    path.startsWith("/embedded/")
  );
}

app.use((req, res, next) => {
  if (isEmbeddedAppDocumentRequest(req)) {
    applyShopifyEmbeddedAppHeaders(res);
  }
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
  const year = new Date().getFullYear();
  const shop = normalizeStoreInput(String(req.query?.shop || "").trim().toLowerCase());
  const proofUrl = toMerchantFacingUrl(shop ? `/proof?shop=${encodeURIComponent(shop)}&flow=demo` : "/proof?flow=demo");
  const installUrl = toMerchantFacingUrl(shop ? `/install/shopify?shop=${encodeURIComponent(shop)}` : "/install/shopify");
  const pricingUrl = toMerchantFacingUrl("/pricing");
  const listingUrl = toMerchantFacingUrl("/shopify-app");
  const privacyUrl = toMerchantFacingUrl("/privacy");

  return res.status(200).type("html").send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Abando — Recover lost Shopify checkout revenue automatically.</title>
    <meta
      name="description"
      content="Abando helps Shopify merchants recover lost checkout revenue with a live proof-first install flow."
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
        margin-top: 26px;
        background: var(--card);
        border: 1px solid var(--line);
        border-radius: 28px;
        box-shadow: 0 28px 80px rgba(2, 6, 23, 0.42);
        padding: 28px 28px;
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
        margin: 12px 0 0;
        font-size: clamp(2.7rem, 6vw, 4.8rem);
        line-height: 0.98;
        letter-spacing: -0.05em;
      }
      .lead {
        margin: 14px 0 0;
        max-width: 38ch;
        color: var(--muted);
        font-size: 1.08rem;
        line-height: 1.6;
      }
      .trust-bar {
        margin-top: 18px;
        display: inline-flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .trust-chip {
        display: inline-flex;
        align-items: center;
        min-height: 36px;
        padding: 0 12px;
        border-radius: 999px;
        border: 1px solid var(--line);
        background: rgba(2, 6, 23, 0.52);
        color: var(--accent-2);
        font-size: 13px;
        font-weight: 700;
      }
      .hero-actions,
      .cta-row {
        margin-top: 18px;
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
        margin-top: 16px;
      }
      .section-card h2 {
        margin: 0 0 8px;
        font-size: 1.8rem;
        letter-spacing: -0.03em;
      }
      .section-card p {
        margin: 0;
        color: var(--muted);
        line-height: 1.65;
      }
      .section-label {
        color: var(--accent);
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        margin-bottom: 10px;
      }
      .step-grid {
        display: grid;
        gap: 12px;
        margin-top: 14px;
      }
      .step {
        display: grid;
        grid-template-columns: 34px 1fr;
        gap: 14px;
        align-items: start;
        padding: 14px 16px;
        border-radius: 18px;
        border: 1px solid var(--line);
        background: var(--soft);
      }
      .step-index {
        width: 34px;
        height: 34px;
        border-radius: 999px;
        display: grid;
        place-items: center;
        background: rgba(226, 232, 240, 0.12);
        color: var(--accent-2);
        font-weight: 800;
      }
      .signal-list,
      .trust-list {
        margin: 14px 0 0;
        padding-left: 18px;
        display: grid;
        gap: 8px;
        color: var(--text);
      }
      .pricing-grid,
      .faq-grid,
      .footer-grid {
        margin-top: 16px;
        display: grid;
        gap: 14px;
      }
      .pricing-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .plan-card,
      .faq-card {
        padding: 18px;
        border-radius: 20px;
        border: 1px solid var(--line);
        background: var(--soft);
      }
      .plan-name {
        color: var(--accent-2);
        font-size: 22px;
        font-weight: 800;
        letter-spacing: -0.03em;
      }
      .plan-copy {
        margin-top: 10px;
        color: var(--muted);
        line-height: 1.6;
      }
      .faq-question {
        color: var(--accent-2);
        font-size: 16px;
        font-weight: 800;
        margin-bottom: 8px;
      }
      .footer-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
      .footer-block {
        padding: 16px;
        border-radius: 18px;
        border: 1px solid var(--line);
        background: rgba(15, 23, 42, 0.56);
      }
      .footer-block strong {
        display: block;
        margin-bottom: 8px;
        color: var(--accent-2);
      }
      .footer-block a {
        display: block;
        color: var(--muted);
        line-height: 1.9;
        text-decoration: none;
      }
      @media (max-width: 860px) {
        .pricing-grid,
        .footer-grid {
          grid-template-columns: 1fr;
        }
      }
      footer {
        margin-top: 24px;
        color: #64748b;
        font-size: 13px;
      }
    </style>
  </head>
  <body>
    <main class="shell">
      <nav class="nav">
        <a class="brand" href="${escapeHtml(homeUrl)}">${renderMerchantLogoMarkup()}</a>
        <div class="nav-links">
          <a class="pill" href="${escapeHtml(pricingUrl)}">Pricing</a>
          <a class="pill" href="${escapeHtml(listingUrl)}">Shopify App</a>
          <a class="pill" href="${escapeHtml(installUrl)}">Install</a>
        </div>
      </nav>

      <section class="hero">
        <div class="eyebrow">SHOPIFY CHECKOUT RECOVERY</div>
        <h1>Recover lost Shopify checkout revenue before it disappears.</h1>
        <p class="lead">Abando catches checkout drop-off, sends the recovery path fast, and lets the merchant verify the return before billing starts.</p>
        <div class="hero-actions">
          <a class="button" href="${escapeHtml(installUrl)}">Install Abando</a>
          <a class="button-secondary" href="${escapeHtml(proofUrl)}">See proof</a>
        </div>
        <div class="trust-bar">
          <div class="trust-chip">2-minute install</div>
          <div class="trust-chip">No checkout redesign required</div>
          <div class="trust-chip">Test it on yourself first</div>
        </div>
      </section>

      <section class="section-grid">
        <section class="section-card">
          <div class="section-label">Why it matters</div>
          <h2>Built for the moment revenue is about to disappear.</h2>
          <p>When a shopper starts checkout and leaves before paying, the recovery window is short. Abando is built for that moment: catch the drop-off, send the recovery, detect the return, and make the result obvious in plain merchant language.</p>
        </section>

        <section class="section-card">
          <div class="section-label">How it works</div>
          <h2>From drop-off to recovered revenue</h2>
          <div class="step-grid">
            <div class="step"><div class="step-index">1</div><div><strong>Checkout drop-off</strong><p>A shopper reaches checkout and leaves before paying.</p></div></div>
            <div class="step"><div class="step-index">2</div><div><strong>Recovery message sent</strong><p>Abando prepares the recovery path while intent is still close to conversion.</p></div></div>
            <div class="step"><div class="step-index">3</div><div><strong>Shopper returns</strong><p>The shopper comes back through the recovery link instead of disappearing for good.</p></div></div>
            <div class="step"><div class="step-index">4</div><div><strong>Revenue recovered</strong><p>The merchant sees the return and knows exactly what happened next.</p></div></div>
          </div>
        </section>

        <section class="section-card">
          <div class="section-label">Proof</div>
          <h2>Show the recovery loop before asking for trust.</h2>
          <p>Abando uses a proof-first journey. A merchant can install, connect the store, send a recovery to themselves, watch the return happen, and understand the product before they start a paid plan.</p>
          <div class="cta-row">
            <a class="button" href="${escapeHtml(proofUrl)}">See proof</a>
            <a class="button-secondary" href="${escapeHtml(installUrl)}">Install on Shopify</a>
          </div>
        </section>

        <section class="section-card">
          <div class="section-label">Pricing preview</div>
          <h2>Simple plans after install and proof</h2>
          <div class="pricing-grid">
            <div class="plan-card">
              <div class="plan-name">Starter</div>
              <p class="plan-copy">For stores that want the install, proof loop, and a clear path into paid recovery. Install first, verify the loop, then start your paid plan.</p>
            </div>
            <div class="plan-card">
              <div class="plan-name">Pro</div>
              <p class="plan-copy">For merchants who want a stronger recovery operation once the proof is complete and the store is ready to scale usage.</p>
            </div>
          </div>
          <div class="cta-row">
            <a class="button" href="${escapeHtml(pricingUrl)}">View pricing</a>
            <a class="button-secondary" href="${escapeHtml(installUrl)}">Install Abando</a>
          </div>
        </section>

        <section class="section-card">
          <div class="section-label">Trust</div>
          <h2>Clear next steps, clear support, no fake claims.</h2>
          <ul class="trust-list">
            <li>Install takes about two minutes.</li>
            <li>After install, the merchant lands in the connected proof experience.</li>
            <li>Billing starts only after the recovery loop has been verified and billing is available.</li>
            <li>Support: <a href="mailto:hello@abando.ai">hello@abando.ai</a></li>
          </ul>
        </section>

        <section class="section-card">
          <div class="section-label">FAQ</div>
          <h2>What merchants ask first</h2>
          <div class="faq-grid">
            <div class="faq-card">
              <div class="faq-question">Does this change my checkout?</div>
              <p>No checkout redesign is required. Abando is built to work around checkout drop-off and the recovery path after it.</p>
            </div>
            <div class="faq-card">
              <div class="faq-question">Can I test it on myself?</div>
              <p>Yes. After install, send a recovery to yourself and watch the loop complete in your own inbox or phone.</p>
            </div>
            <div class="faq-card">
              <div class="faq-question">How long does install take?</div>
              <p>Most merchants can connect the store and land in the proof experience in about two minutes.</p>
            </div>
            <div class="faq-card">
              <div class="faq-question">When do I start paying?</div>
              <p>Install first, verify the recovery loop, then start your paid plan when billing is available for your store.</p>
            </div>
          </div>
        </section>
      </section>

      <footer>
        <div class="footer-grid">
          <div class="footer-block">
            <strong>Product</strong>
            <a href="${escapeHtml(pricingUrl)}">Pricing</a>
            <a href="${escapeHtml(proofUrl)}">Proof</a>
            <a href="${escapeHtml(installUrl)}">Install</a>
          </div>
          <div class="footer-block">
            <strong>App Store</strong>
            <a href="${escapeHtml(listingUrl)}">Shopify App listing</a>
            <a href="${escapeHtml(privacyUrl)}">Privacy</a>
          </div>
          <div class="footer-block">
            <strong>Support</strong>
            <a href="mailto:hello@abando.ai">hello@abando.ai</a>
          </div>
          <div class="footer-block">
            <strong>Abando</strong>
            <a href="${escapeHtml(proofUrl)}">See proof</a>
            <a href="${escapeHtml(pricingUrl)}">How pricing works</a>
          </div>
        </div>
        <div style="margin-top:18px;">Abando · © ${year} · Recover lost Shopify checkout revenue automatically.</div>
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
  return getEmailSenderMissingEnvVars();
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

function logRecoverySendLifecycle(message, detail = {}) {
  console.log(`[recovery-send] ${message}`, detail);
}

function normalizeExperienceId(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "";
  return normalized.replace(/[^a-z0-9_-]/g, "").slice(0, 80);
}

function normalizeRecoveryChannel(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "sms") return "sms";
  if (normalized === "email") return "email";
  return "";
}

function normalizeTonePreset(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  if (["direct", "friendly", "premium", "urgent"].includes(normalized)) {
    return normalized;
  }
  return "direct";
}

function resolveAutomaticRecoveryBaseUrl() {
  return resolveConfiguredAppBaseUrl();
}

function getCheckoutEventOccurredAt(payload) {
  const value = Date.parse(String(payload?.occurredAt || payload?.timestamp || ""));
  return Number.isFinite(value) ? value : 0;
}

function hasPurchaseCompletedAfterEvent(events, sessionId, occurredAtMs) {
  return events.some((payload) =>
    String(payload?.session_id || "") === String(sessionId || "")
    && String(payload?.event_type || "") === "purchase_completed"
    && getCheckoutEventOccurredAt(payload) >= occurredAtMs
  );
}

function buildExperienceReturnLink({ req, shop, experienceId, channel }) {
  const params = new URLSearchParams({
    shop,
    eid: experienceId,
  });
  if (channel) {
    params.set("channel", channel);
  }
  return `${resolveMerchantFacingBaseUrl()}/api/recovery/return?${params.toString()}`;
}

function resolveCheckoutContextFromEventPayload(payload, experienceId = "") {
  const metadata = payload?.metadata && typeof payload.metadata === "object" ? payload.metadata : {};
  const checkoutId = String(
    payload?.checkout_id
    || payload?.checkoutId
    || payload?.checkout_token
    || metadata?.cartToken
    || payload?.session_id
    || "",
  ).trim();
  const checkoutSessionId = String(
    payload?.checkout_session_id
    || payload?.checkoutSessionId
    || payload?.checkout_token
    || payload?.session_id
    || "",
  ).trim();
  const checkoutPath = String(
    payload?.checkoutPath
    || payload?.checkout_path
    || metadata?.path
    || "",
  ).trim();
  const storefrontHost = String(
    payload?.storefrontHost
    || payload?.storefront_host
    || metadata?.storefrontHost
    || metadata?.storefront_host
    || "",
  )
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .split("?")[0]
    .split("#")[0]
    .toLowerCase();
  const customerEmail = normalizeEmail(
    payload?.customerEmail
    || payload?.customer_email
    || payload?.email
    || metadata?.customerEmail
    || metadata?.customer_email
    || metadata?.email
    || "",
  );

  return {
    experienceId: normalizeExperienceId(experienceId),
    checkoutId,
    checkoutSessionId,
    checkoutPath: (checkoutPath.startsWith("/") && (checkoutPath.includes("/checkouts/") || checkoutPath === "/checkout" || checkoutPath.startsWith("/checkout/")))
      ? checkoutPath
      : "",
    storefrontHost,
    customerEmail,
  };
}

function buildShopifyCheckoutResumeUrl({
  shop,
  checkoutId = "",
  checkoutPath = "",
  storefrontHost = "",
}) {
  const host = String(storefrontHost || shop || "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .split("?")[0]
    .split("#")[0]
    .toLowerCase();
  if (!host) return "";

  const path = String(checkoutPath || "").trim();
  if (path.startsWith("/") && (path.includes("/checkouts/") || path === "/checkout" || path.startsWith("/checkout/"))) {
    return `https://${host}${path}`;
  }

  const normalizedCheckoutId = String(checkoutId || "").trim();
  if (!normalizedCheckoutId) return "";
  return `https://${host}/checkouts/${encodeURIComponent(normalizedCheckoutId)}/information`;
}

async function verifyShopifyCheckoutResumeUrl(url = "") {
  const target = String(url || "").trim();
  if (!target) {
    return { ok: false, status: 0, error: "missing_checkout_resume_url" };
  }

  const attempt = async (method) => {
    const response = await fetch(target, {
      method,
      redirect: "follow",
    });
    return {
      ok: response.status >= 200 && response.status < 400,
      status: response.status,
      finalUrl: response.url || target,
    };
  };

  try {
    const headResult = await attempt("HEAD");
    if (headResult.ok || headResult.status !== 405) {
      return headResult;
    }
  } catch (error) {
    // Fall through to GET so storefronts that reject HEAD can still be verified.
  }

  try {
    return await attempt("GET");
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : String(error),
      finalUrl: target,
    };
  }
}

function buildExperienceFlowUrls({ req, shop, experienceId, channel }) {
  if (!shop || !experienceId) {
    return {
      experienceUrl: "",
      returnUrl: "",
      returnedUrl: "",
      proofRecoveredUrl: "",
    };
  }

  const origin = resolveMerchantFacingBaseUrl();
  const experienceParams = new URLSearchParams({
    shop,
    eid: experienceId,
  });
  const proofParams = new URLSearchParams({
    shop,
    flow: "demo",
    state: "recovered",
    eid: experienceId,
  });
  const recoveryProofParams = new URLSearchParams({
    shop,
    eid: experienceId,
  });

  return {
    experienceUrl: `${origin}/experience?${experienceParams.toString()}`,
    returnUrl: buildExperienceReturnLink({
      req,
      shop,
      experienceId,
      channel,
    }),
    returnedUrl: `${origin}/experience/returned?${experienceParams.toString()}`,
    proofRecoveredUrl: `${origin}/proof/recovery?${recoveryProofParams.toString()}`,
  };
}

function buildCanonicalBillingStartPath({ shop, plan = "starter", source = "connected_experience", target = "", experienceId = "" }) {
  const params = new URLSearchParams();
  if (shop) params.set("shop", shop);
  if (source) params.set("src", source);
  if (target || shop) params.set("target", target || shop);
  if (experienceId) params.set("eid", experienceId);
  params.set("plan", String(plan || "starter").trim().toLowerCase() === "pro" ? "pro" : "starter");
  return `/proof/payment?${params.toString()}`;
}

function merchantLogoUrl() {
  return `${resolveMerchantFacingBaseUrl()}/assets/logo.svg`;
}

function renderMerchantLogoMarkup({ href = "" } = {}) {
  const logoImg = `<img src="${escapeHtml(merchantLogoUrl())}" alt="Abando" style="display:block;height:28px;width:auto;" />`;
  return href
    ? `<a href="${escapeHtml(href)}" aria-label="Abando home">${logoImg}</a>`
    : logoImg;
}

function applyTonePresetToExperienceMessage(message, tonePreset) {
  const preset = normalizeTonePreset(tonePreset);
  const returnLink = String(message?.returnLink || "").trim();

  return {
    ...message,
    tonePreset: preset,
    smsText: `You left something behind — complete your checkout: ${returnLink}`,
  };
}

function buildExperienceRecoveryMessage({
  req,
  shop,
  eventData,
  timestamp,
  experienceId,
  tonePreset = "direct",
  channel = "",
}) {
  const baseMessage = generateRecoveryMessage({
    shop,
    eventData,
    timestamp,
    baseUrl: resolveMerchantFacingBaseUrl(),
    experienceId,
  });
  const proofReturnLink = buildExperienceReturnLink({
    req,
    shop,
    experienceId,
    channel,
  });
  const returnLink = proofReturnLink || String(baseMessage.returnLink || "").trim();

  const recoveredCheckoutHtml = [
    '<div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.5;">',
    `  <p style="margin:0 0 18px;"><img src="${escapeHtml(merchantLogoUrl())}" alt="Abando" style="display:block;height:32px;width:auto;" /></p>`,
    "  <p>Hey —</p>",
    "  <p>A shopper who previously abandoned their checkout just came back and completed their purchase.</p>",
    '  <p style="font-size: 18px; font-weight: bold;">Recovered revenue: $52</p>',
    "  <p>This was triggered automatically by Abando.</p>",
    '  <hr style="margin: 20px 0;" />',
    '  <p style="font-size: 14px; color: #666;">',
    "    Timeline:",
    "    <br/>• Checkout started",
    "    <br/>• Drop-off detected",
    "    <br/>• Recovery message sent",
    "    <br/>• Return + purchase completed",
    "  </p>",
    `  <p style="margin-top: 20px;"><a href="${escapeHtml(returnLink)}" style="color: #0f172a; font-weight: 700;">Resume checkout</a></p>`,
    '  <p style="font-size: 14px; color: #999;">— Abando</p>',
    "</div>",
  ].join("\n");

  const experienceMessage = {
    ...baseMessage,
    emailReturnLink: returnLink,
    smsReturnLink: returnLink,
    proofReturnLink,
    returnLink,
    emailSubject: "Recovered checkout — $52 returned",
    emailHtml: recoveredCheckoutHtml,
    emailBody: [
      "Hey —",
      "",
      "A shopper who previously abandoned their checkout just came back and completed their purchase.",
      "",
      "Recovered revenue: $52",
      "",
      "This was triggered automatically by Abando.",
      "",
      "Timeline:",
      "• Checkout started",
      "• Drop-off detected",
      "• Recovery message sent",
      "• Return + purchase completed",
      "",
      "Open the recovery path:",
      returnLink,
    ].join("\n"),
    smsText: `You left something behind — complete your checkout: ${returnLink}`,
  };

  return applyTonePresetToExperienceMessage(experienceMessage, tonePreset);
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

async function listRecoveryActionEvents(shop, experienceId) {
  if (!shop) return [];

  const events = await prisma.systemEvent.findMany({
    where: {
      shopDomain: shop,
      eventType: "abando.recovery_action.v1",
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return events.filter((event) => {
    const payload = event?.payload;
    if (!payload || typeof payload !== "object") return false;
    if (!experienceId) return true;
    return normalizeExperienceId(payload.experienceId) === experienceId;
  });
}

async function findShopForExperienceId(experienceId) {
  const normalizedExperienceId = normalizeExperienceId(experienceId);
  if (!normalizedExperienceId) return "";

  const events = await prisma.systemEvent.findMany({
    where: {
      eventType: {
        in: [
          "abando.experience_send.v1",
          "abando.recovery_action.v1",
          "abando.recovery_sent.v1",
          "abando.customer_return.v1",
          "abando.recovery_returned.v1",
          "abando.recovery_attribution.v1",
        ],
      },
    },
    orderBy: { createdAt: "desc" },
    take: 250,
  });

  for (const event of events) {
    const payload = event?.payload;
    if (!payload || typeof payload !== "object") continue;
    if (normalizeExperienceId(payload.experienceId) !== normalizedExperienceId) continue;
    const shopDomain = normalizeShop(String(event.shopDomain || payload.shop || "").trim().toLowerCase());
    if (shopDomain) return shopDomain;
  }

  return "";
}

function buildPublicExperienceStatus(status) {
  const returned = Boolean(status?.return?.returned);
  const returnedAt = status?.return?.returnedAt || null;
  const orderRevenueCents = Number(
    status?.return?.attribution?.recoveredRevenue?.cents
    || status?.attribution?.order_total_price_cents
    || 0,
  ) || 0;
  const purchased = Boolean(
    status?.verified
    || status?.return?.attribution?.verified
    || status?.attribution?.proof_status === "verified_shopify_order",
  );

  return {
    returned,
    returnedAt,
    purchased,
    revenue: purchased && orderRevenueCents > 0
      ? Number((orderRevenueCents / 100).toFixed(2))
      : null,
    channel: status?.return?.attribution?.channel || status?.send?.channel || null,
  };
}

function isSyntheticCheckoutValue(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return false;
  return normalized.startsWith("auto-proof-")
    || normalized.startsWith("abando-test-")
    || normalized.startsWith("proof-cart-")
    || normalized.startsWith("validation-cart")
    || normalized.startsWith("test-cart-");
}

function isPreCheckoutIntentStorefrontPayload(payload) {
  if (!payload || typeof payload !== "object") return false;
  if (String(payload.event_type || "").trim().toLowerCase() !== "checkout_started") return false;
  if (String(payload.source || "").trim().toLowerCase() !== "live_storefront") return false;

  const context = resolveCheckoutContextFromEventPayload(payload);
  const metadata = payload?.metadata && typeof payload.metadata === "object" ? payload.metadata : {};
  const checkoutPath = String(payload?.checkoutPath || payload?.checkout_path || context.checkoutPath || "").trim();
  const proofCaptureStage = String(payload?.proofCaptureStage || metadata?.proofCaptureStage || "").trim().toLowerCase();
  const preCheckoutIntent = payload?.checkoutPageReached === false
    || metadata?.checkoutPageReached === false
    || payload?.preCheckoutIntent === true
    || metadata?.preCheckoutIntent === true
    || proofCaptureStage === "pre_checkout_intent";

  if (!preCheckoutIntent) return false;
  if (!context.storefrontHost) return false;
  if (!checkoutPath.startsWith("/") || (!checkoutPath.startsWith("/checkout") && !checkoutPath.includes("/checkouts/"))) {
    return false;
  }
  return true;
}

function isRealStorefrontCheckoutPayload(payload, { allowPreCheckoutIntent = false } = {}) {
  if (!payload || typeof payload !== "object") return false;
  if (String(payload.event_type || "").trim().toLowerCase() !== "checkout_started") return false;
  if (String(payload.source || "").trim().toLowerCase() !== "live_storefront") return false;

  const context = resolveCheckoutContextFromEventPayload(payload);
  if (allowPreCheckoutIntent && isPreCheckoutIntentStorefrontPayload(payload)) return true;
  if (!context.storefrontHost) return false;
  if (!context.checkoutId && !context.checkoutPath) return false;
  if (isSyntheticCheckoutValue(context.checkoutId) || isSyntheticCheckoutValue(context.checkoutSessionId)) return false;
  if (context.checkoutPath && !context.checkoutPath.includes("/checkouts/")) return false;

  return true;
}

async function findLatestCheckoutStartedEvent(shop, { requireRealStorefront = false, allowPreCheckoutIntent = false } = {}) {
  if (!shop) return null;

  const events = await prisma.systemEvent.findMany({
    where: {
      shopDomain: shop,
      eventType: "abando.checkout_event.v1",
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const checkoutStartedEvents = events.filter((event) => {
    const payload = event?.payload;
    return payload
      && typeof payload === "object"
      && String(payload.event_type || "").trim().toLowerCase() === "checkout_started";
  });

  const latestRealStorefrontEvent = checkoutStartedEvents.find((event) =>
    isRealStorefrontCheckoutPayload(event?.payload, { allowPreCheckoutIntent }),
  ) || null;

  if (requireRealStorefront) {
    return latestRealStorefrontEvent;
  }

  return latestRealStorefrontEvent || checkoutStartedEvents[0] || null;
}

async function findLatestRecoveryActionEvent(shop) {
  if (!shop) return null;

  return prisma.systemEvent.findFirst({
    where: {
      shopDomain: shop,
      eventType: "abando.recovery_action.v1",
    },
    orderBy: { createdAt: "desc" },
  });
}

function generateQuickstartExperienceId() {
  return `quickstart-${Date.now().toString(36)}-${randomBytes(2).toString("hex")}`;
}

async function createQuickstartCheckoutEvent({ shop, experienceId }) {
  const occurredAt = new Date().toISOString();
  const checkoutId = `quickstart_checkout_${randomBytes(6).toString("hex")}`;
  const sessionId = `quickstart_session_${randomBytes(6).toString("hex")}`;

  const event = await prisma.systemEvent.create({
    data: {
      shopDomain: shop,
      eventType: "abando.checkout_event.v1",
      visibility: "merchant",
      payload: {
        id: `quickstart_event_${randomBytes(8).toString("hex")}`,
        shop,
        experienceId,
        session_id: sessionId,
        checkout_id: checkoutId,
        checkout_session_id: sessionId,
        checkoutPath: "/checkout",
        storefrontHost: shop,
        timestamp: occurredAt,
        occurredAt,
        event_type: "checkout_started",
        stage: "checkout",
        source: "live_storefront",
        device_type: "unknown",
        checkoutPageReached: false,
        preCheckoutIntent: true,
        proofCaptureStage: "pre_checkout_intent",
        metadata: {
          path: "/checkout",
          storefrontHost: shop,
          emittedBy: "api/quickstart/run",
          quickstart: true,
          preCheckoutIntent: true,
          checkoutPageReached: false,
          proofCaptureStage: "pre_checkout_intent",
        },
      },
    },
  });

  console.log("[QUICKSTART] injected checkout event", {
    shop,
    experienceId,
    eventId: event.id,
  });

  return event;
}

async function ensureQuickstartCheckoutEvent({ shop, experienceId }) {
  const latestCheckoutEvent = await findLatestCheckoutStartedEvent(shop, {
    requireRealStorefront: true,
    allowPreCheckoutIntent: true,
  });

  if (latestCheckoutEvent) {
    return latestCheckoutEvent;
  }

  return createQuickstartCheckoutEvent({ shop, experienceId });
}

async function runQuickstartFlow({ req, shop, email }) {
  const normalizedShop = normalizeShop(String(shop || "").trim().toLowerCase());
  const normalizedEmail = normalizeEmail(email);
  const emailReadiness = getEmailReadiness();

  console.log("[QUICKSTART] started", {
    shop: normalizedShop || null,
    email: normalizedEmail || null,
  });

  if (!normalizedShop) {
    return { ok: false, status: 400, error: "Missing shop" };
  }

  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    return { ok: false, status: 400, error: "Enter a valid email address." };
  }

  if (!emailReadiness.ready) {
    return {
      ok: false,
      status: 503,
      error: "Email not configured",
      missing: emailReadiness.missing,
    };
  }

  const shopRecord = await prisma.shop.findUnique({
    where: { key: normalizedShop },
    select: { key: true },
  });

  if (!shopRecord) {
    return { ok: false, status: 404, error: "Store not found" };
  }

  const experienceId = generateQuickstartExperienceId();
  const checkoutEvent = await ensureQuickstartCheckoutEvent({
    shop: normalizedShop,
    experienceId,
  });
  const checkoutPayload = checkoutEvent?.payload && typeof checkoutEvent.payload === "object"
    ? checkoutEvent.payload
    : {};
  const checkoutOccurredAt =
    String(checkoutPayload.occurredAt || checkoutPayload.timestamp || checkoutEvent?.createdAt?.toISOString?.() || new Date().toISOString());
  const checkoutContext = resolveCheckoutContextFromEventPayload(checkoutPayload, experienceId);

  console.log("[QUICKSTART] event ready", {
    shop: normalizedShop,
    experienceId,
    checkoutEventId: checkoutEvent.id,
    source: checkoutPayload.source || null,
  });

  const recoveryMessage = buildExperienceRecoveryMessage({
    req,
    shop: normalizedShop,
    eventData: checkoutPayload,
    timestamp: checkoutOccurredAt,
    experienceId,
    tonePreset: "direct",
    channel: "email",
  });

  const deliveryAction = await prisma.systemEvent.create({
    data: {
      shopDomain: normalizedShop,
      eventType: "abando.recovery_action.v1",
      visibility: "merchant",
      payload: {
        recovery_id: null,
        status: "created",
        source: "quickstart",
        createdAt: new Date().toISOString(),
        experienceId,
        tone_preset: "direct",
        channel_requested: "email",
        checkout_id: checkoutContext.checkoutId || null,
        checkout_session_id: checkoutContext.checkoutSessionId || null,
        source_event_id: String(checkoutPayload.id || "").trim() || null,
      },
    },
  });

  async function logDeliveryAttempt(channel, outcome, detail = {}) {
    await prisma.systemEvent.create({
      data: {
        shopDomain: normalizedShop,
        eventType: "abando.recovery_delivery.v1",
        visibility: "merchant",
        relatedJobId: deliveryAction.id,
        payload: {
          channel,
          outcome,
          at: new Date().toISOString(),
          quickstart: true,
          ...detail,
        },
      },
    });
  }

  console.log("[QUICKSTART] recovery triggered", {
    shop: normalizedShop,
    experienceId,
    email: normalizedEmail,
  });

  const sendResult = await executeRecoverySend({
    shop: normalizedShop,
    email: normalizedEmail,
    phone: "",
    recoveryMessage,
    actionId: deliveryAction.id,
    testMode: true,
    logDeliveryAttempt,
  });
  const summary = summarizeSendResult(sendResult);
  const timestamp = new Date().toISOString();

  await prisma.systemEvent.update({
    where: { id: deliveryAction.id },
    data: {
      payload: {
        recovery_id: deliveryAction.id,
        status: summary.success ? "sent" : "created",
        source: "quickstart",
        createdAt: deliveryAction.payload?.createdAt || new Date().toISOString(),
        experienceId,
        tone_preset: "direct",
        channel_requested: "email",
        checkout_id: checkoutContext.checkoutId || null,
        checkout_session_id: checkoutContext.checkoutSessionId || null,
        source_event_id: String(checkoutPayload.id || "").trim() || null,
        channel: summary.channels[0] || "email",
        channels: sendResult.successfulChannels,
        delivery: sendResult.delivery,
        messageId: sendResult.messageId,
        sentAt: sendResult.sentAt || null,
        attemptedRealSend: sendResult.successfulChannels.length > 0 || sendResult.failedChannels.length > 0,
        lastError: sendResult.sendError || null,
      },
    },
  });

  if (!summary.success) {
    return {
      ok: false,
      status: 502,
      error: "Send failed",
      details: sendResult.sendError || "provider_send_failed",
      experienceId,
      proofUrl: `/proof/recovery?eid=${encodeURIComponent(experienceId)}`,
    };
  }

  const proofLoop = await recordProofLoopSend({
    shop: normalizedShop,
    experienceId,
    channel: "email",
    sendTimestamp: timestamp,
    sendStatus: "sent",
    deliveryStatus: "sent_confirmed",
    valueEstimate: 0,
    source: "quickstart",
    variantId: "quickstart",
    messageAngle: "quickstart",
    tonePreset: "direct",
    leadDomain: "",
    leadSegmentKey: "",
    providerAccepted: Boolean(sendResult.messageId),
  });

  await persistExperienceSendRecords({
    shop: normalizedShop,
    experienceId,
    sendResult,
    proofLoopId: proofLoop?.loop_id || "",
    tonePreset: "direct",
    recoveryId: deliveryAction.id,
    recoveryActionId: deliveryAction.id,
    checkoutId: checkoutContext.checkoutId,
    checkoutSessionId: checkoutContext.checkoutSessionId,
    sourceEventId: String(checkoutPayload.id || "").trim(),
  });

  await prisma.systemEvent.create({
    data: {
      shopDomain: normalizedShop,
      eventType: "abando.recovery_sent.v1",
      visibility: "merchant",
      relatedJobId: deliveryAction.id,
      payload: {
        shop: normalizedShop,
        recovery_id: deliveryAction.id,
        recovery_action_id: deliveryAction.id,
        experienceId,
        checkout_id: checkoutContext.checkoutId || null,
        checkout_session_id: checkoutContext.checkoutSessionId || null,
        channel: "email",
        target: normalizedEmail,
        sent_at: timestamp,
        provider_accepted: Boolean(sendResult.messageId),
        message_id: sendResult.messageId || null,
        proofLoopId: proofLoop?.loop_id || null,
        source: "quickstart",
      },
    },
  });

  await persistRecoveryAttributionFromSend(prisma, {
    recovery_id: deliveryAction.id,
    recovery_action_id: deliveryAction.id,
    experienceId,
    proof_loop_id: proofLoop?.loop_id || "",
    shop: normalizedShop,
    checkout_id: checkoutContext.checkoutId,
    checkout_session_id: checkoutContext.checkoutSessionId,
    source_event_id: String(checkoutPayload.id || "").trim(),
    channel: "email",
    target: normalizedEmail,
    sent_at: timestamp,
    provider_message_id: sendResult.messageId || "",
  }).catch(() => {});

  const proofUrl = `/proof/recovery?eid=${encodeURIComponent(experienceId)}`;

  await prisma.systemEvent.create({
    data: {
      shopDomain: normalizedShop,
      eventType: "abando.quickstart.v1",
      visibility: "merchant",
      relatedJobId: deliveryAction.id,
      payload: {
        shop: normalizedShop,
        experienceId,
        email: normalizedEmail,
        proofUrl,
        messageId: sendResult.messageId || null,
        sent_at: timestamp,
      },
    },
  });

  console.log("[QUICKSTART] recovery sent", {
    shop: normalizedShop,
    experienceId,
    email: normalizedEmail,
    messageId: sendResult.messageId || null,
  });
  console.log("[QUICKSTART] proof generated", {
    shop: normalizedShop,
    experienceId,
    proofUrl,
  });

  return {
    ok: true,
    status: 200,
    shop: normalizedShop,
    experienceId,
    sent: true,
    proofUrl,
    recoveryLink: recoveryMessage.returnLink || null,
    messageId: sendResult.messageId || null,
  };
}

async function findLatestEventByType(shop, eventType, experienceId = "") {
  if (!shop || !eventType) return null;

  const events = await prisma.systemEvent.findMany({
    where: {
      shopDomain: shop,
      eventType,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  if (!experienceId) return events[0] || null;

  return events.find((event) => {
    const payload = event?.payload;
    return payload
      && typeof payload === "object"
      && normalizeExperienceId(payload.experienceId) === experienceId;
  }) || null;
}

function pickIsoTimestamp(...values) {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text) return text;
  }
  return null;
}

const DEMO_DEDUPE_WINDOW_MS = 10 * 60 * 1000;

function getRecentExperienceSendMatch(events, { email = "", phone = "", windowMs = DEMO_DEDUPE_WINDOW_MS }) {
  const now = Date.now();
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);

  for (const event of events || []) {
    const payload = event?.payload;
    if (!payload || typeof payload !== "object") continue;
    const channel = String(payload.channel || "").trim().toLowerCase();
    const target = channel === "email"
      ? normalizeEmail(payload.target)
      : channel === "sms"
        ? normalizePhone(payload.target)
        : "";
    const sentAt = new Date(String(payload.sentAt || event?.createdAt || ""));
    if (Number.isNaN(sentAt.getTime())) continue;
    if ((now - sentAt.getTime()) > windowMs) continue;
    if (channel === "email" && normalizedEmail && target === normalizedEmail) return payload;
    if (channel === "sms" && normalizedPhone && target === normalizedPhone) return payload;
  }

  return null;
}

async function persistExperienceSendRecords({
  shop,
  experienceId,
  sendResult,
  proofLoopId = "",
  tonePreset = "direct",
  recoveryId = "",
  recoveryActionId = "",
  checkoutId = "",
  checkoutSessionId = "",
  sourceEventId = "",
}) {
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
          recovery_id: recoveryId || null,
          recovery_action_id: recoveryActionId || null,
          experienceId,
          proofLoopId,
          shop,
          channel,
          tone_preset: normalizeTonePreset(tonePreset),
          checkout_id: checkoutId || null,
          checkout_session_id: checkoutSessionId || null,
          source_event_id: sourceEventId || null,
          target,
          status: "sent",
          sentAt,
          returned: false,
          returnedAt: null,
          providerId,
          providerStatus: channel === "sms" ? (sendResult.smsStatus || null) : "accepted",
          providerAccepted: channel === "sms" ? Boolean(sendResult.smsSid) : Boolean(sendResult.messageId),
          twilioMessage: channel === "sms" ? (sendResult.twilioMessage || null) : null,
          twilioInterpretation: channel === "sms" ? (sendResult.twilioInterpretation || null) : null,
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
  const [events, recoveryActionEvents, latestCheckoutStartedEvent, latestBillingStartedEvent, latestBillingCompletedEvent, latestBillingState, latestAttribution] = await Promise.all([
    listExperienceSendEvents(shop, experienceId),
    listRecoveryActionEvents(shop, experienceId),
    findLatestCheckoutStartedEvent(shop),
    findLatestEventByType(shop, "abando.billing_started.v1", experienceId),
    findLatestEventByType(shop, "abando.billing_completed.v1", experienceId),
    getLatestMerchantBillingState(shop),
    getLatestRecoveryAttributionForExperience(prisma, { shopDomain: shop, experienceId }),
  ]);
  const payloads = events
    .map((event) => (event?.payload && typeof event.payload === "object" ? event.payload : null))
    .filter(Boolean);
  const latestRecoveryAction = recoveryActionEvents
    .map((event) => {
      const payload = event?.payload;
      if (!payload || typeof payload !== "object") return null;
      const createdAt =
        String(payload.createdAt || "") ||
        event?.createdAt?.toISOString?.() ||
        "";
      const sentAt = String(payload.sentAt || "") || "";
      const sortKey = sentAt || createdAt;
      return {
        payload,
        createdAt,
        sentAt,
        sortKey,
      };
    })
    .filter(Boolean)
    .sort((a, b) => String(b.sortKey || "").localeCompare(String(a.sortKey || "")))[0] || null;
  const channels = [...new Set(payloads.map((payload) => String(payload.channel || "")).filter(Boolean))];
  const targets = [...new Set(payloads.map((payload) => String(payload.target || "")).filter(Boolean))];
  const returnedPayloads = payloads.filter((payload) => payload.returned === true);
  const lastReturnedAt = returnedPayloads
    .map((payload) => String(payload.returnedAt || ""))
    .filter(Boolean)
    .sort()
    .at(-1) || null;
  const firstPayload = payloads[0] || null;
  const latestActionPayload = latestRecoveryAction?.payload && typeof latestRecoveryAction.payload === "object"
    ? latestRecoveryAction.payload
    : null;
  const smsContext = String(latestActionPayload?.channel || firstPayload?.channel || "") === "sms";
  const latestSmsSid = smsContext
    ? String(
        latestActionPayload?.smsSid
        || latestActionPayload?.twilioMessage?.sid
        || firstPayload?.providerId
        || firstPayload?.twilioMessage?.sid
        || "",
      ).trim()
    : "";
  const latestTwilioLookup = (
    (String(latestActionPayload?.channel || "") === "sms" || String(firstPayload?.channel || "") === "sms")
    && latestSmsSid
  )
    ? await fetchTwilioMessageStatus({ sid: latestSmsSid }).catch(() => null)
    : null;
  const latestTwilioMessage = latestTwilioLookup?.success
    ? latestTwilioLookup.message
    : (latestActionPayload?.twilioMessage || firstPayload?.twilioMessage || null);
  const latestTwilioInterpretation = latestTwilioLookup?.success
    ? latestTwilioLookup.interpretation
    : (latestActionPayload?.twilioInterpretation || firstPayload?.twilioInterpretation || null);
  const latestSmsStatus = smsContext
    ? (String(
        latestTwilioMessage?.status
        || latestActionPayload?.smsStatus
        || firstPayload?.providerStatus
        || "",
      ).trim() || null)
    : null;
  const sendSource = firstPayload || latestActionPayload || null;
  const sendChannel = channels.length > 1
    ? channels.join("+")
    : channels[0] || String(latestActionPayload?.channel || "") || null;
  const sendTarget = targets.length > 1
    ? targets.join(", ")
    : targets[0] || String(latestActionPayload?.delivery?.[0]?.to || "") || null;
  const recoveredValue = returnedPayloads.length > 0
    ? await resolveExperienceRecoveredValue({ shop, experienceId })
    : null;
  const latestCheckoutPayload = latestCheckoutStartedEvent?.payload && typeof latestCheckoutStartedEvent.payload === "object"
    ? latestCheckoutStartedEvent.payload
    : null;
  const latestBillingStartedPayload = latestBillingStartedEvent?.payload && typeof latestBillingStartedEvent.payload === "object"
    ? latestBillingStartedEvent.payload
    : null;
  const latestBillingCompletedPayload = latestBillingCompletedEvent?.payload && typeof latestBillingCompletedEvent.payload === "object"
    ? latestBillingCompletedEvent.payload
    : null;
  const recoveryActionCreatedAt = pickIsoTimestamp(
    latestRecoveryAction?.createdAt,
    latestRecoveryAction?.sentAt,
  );
  const recoverySentAt = pickIsoTimestamp(
    sendSource?.sentAt,
    latestActionPayload?.sentAt,
    latestRecoveryAction?.sentAt,
  );
  const billingRuntime = getBillingRuntimeReadiness();
  const billingActive = Boolean(
    latestBillingState
    && (latestBillingState.billing_status === "active" || latestBillingState.billing_status === "trialing")
  );
  const recoveryReady = Boolean(latestCheckoutStartedEvent);
  const recoverySent = Boolean(recoverySentAt);
  const returnDetected = returnedPayloads.length > 0;
  const billingStartedAt = pickIsoTimestamp(
    latestBillingStartedPayload?.started_at,
    latestBillingStartedEvent?.createdAt?.toISOString?.(),
  );
  const billingCompletedAt = pickIsoTimestamp(
    latestBillingCompletedPayload?.completed_at,
    latestBillingState?.checkout_completed_at,
    latestBillingCompletedEvent?.createdAt?.toISOString?.(),
  );
  const billingAvailable = Boolean(billingRuntime.billing_route_active && recoverySent);
  const currentState = billingActive
    ? "billing_active"
    : billingAvailable
      ? "billing_available"
      : returnDetected
        ? "return_detected"
        : recoverySent
          ? "recovery_sent"
          : recoveryReady
            ? "recovery_ready"
            : "connected";
  const attribution = latestAttribution
    ? {
        recovery_id: latestAttribution.recovery_id || null,
        recovery_action_id: latestAttribution.recovery_action_id || null,
        experience_id: latestAttribution.experienceId || null,
        attribution_status: latestAttribution.attribution_status || null,
        proof_status: latestAttribution.proof_status || null,
        source_of_proof: latestAttribution.source_of_proof || null,
        channel: latestAttribution.channel || null,
        target: latestAttribution.target || null,
        sent_at: latestAttribution.sent_at || null,
        return_clicked_at: latestAttribution.return_clicked_at || null,
        order_id: latestAttribution.order_id || null,
        order_name: latestAttribution.order_name || null,
        order_created_at: latestAttribution.order_created_at || null,
        order_total_price_cents: latestAttribution.order_total_price_cents
          ? Number(latestAttribution.order_total_price_cents || 0) || 0
          : null,
        currency: latestAttribution.currency || null,
      }
    : null;
  const verified = Boolean(attribution?.proof_status === "verified_shopify_order");

  return {
    configured: {
      email: emailConfigured,
      sms: smsConfigured,
    },
    send: {
      status: sendSource ? String(sendSource.status || "sent") : null,
      channel: sendChannel,
      target: sendTarget,
      sentAt: sendSource ? String(sendSource.sentAt || latestRecoveryAction?.sentAt || "") || null : null,
      providerAccepted: smsContext
        ? Boolean(firstPayload?.providerAccepted || firstPayload?.providerId || latestActionPayload?.smsSid || latestSmsSid)
        : Boolean(sendSource?.sentAt || latestRecoveryAction?.sentAt),
      smsStatus: smsContext ? latestSmsStatus : null,
      twilioSid: smsContext ? (latestSmsSid || null) : null,
      twilioInterpretation: smsContext ? (latestTwilioInterpretation || null) : null,
    },
    return: {
      returned: returnedPayloads.length > 0,
      returnedAt: lastReturnedAt,
      recoveredValue,
      attribution: attribution
        ? {
            recoveryId: attribution.recovery_id,
            attributionStatus: attribution.attribution_status,
            proofStatus: attribution.proof_status,
            sourceOfProof: attribution.source_of_proof,
            channel: attribution.channel,
            target: attribution.target,
            sentAt: attribution.sent_at,
            returnClickedAt: attribution.return_clicked_at,
            orderId: attribution.order_id,
            orderName: attribution.order_name,
            orderCreatedAt: attribution.order_created_at,
            recoveredRevenue: attribution.order_total_price_cents
              ? {
                  cents: attribution.order_total_price_cents,
                  currency: attribution.currency || "USD",
                }
              : null,
            verified,
          }
        : null,
    },
    attribution,
    verified,
    loop: {
      current_state: currentState,
      checkout_started: recoveryReady,
      recovery_ready: recoveryReady,
      recovery_action_created: Boolean(recoveryActionCreatedAt),
      recovery_sent: recoverySent,
      message_delivered: Boolean(
        smsContext
          ? (firstPayload?.providerAccepted || firstPayload?.providerId || latestActionPayload?.smsSid || latestSmsSid)
          : recoverySent,
      ),
      link_clicked: returnDetected,
      return_detected: returnDetected,
      recovered_revenue_shown: Boolean(returnDetected && Number(recoveredValue?.cents || 0) > 0),
      billing_available: billingAvailable,
      billing_started: Boolean(billingStartedAt),
      billing_completed: Boolean(billingCompletedAt),
      billing_active: billingActive,
      events: {
        checkout_started: {
          observed: recoveryReady,
          at: pickIsoTimestamp(
            latestCheckoutPayload?.occurredAt,
            latestCheckoutPayload?.timestamp,
            latestCheckoutStartedEvent?.createdAt?.toISOString?.(),
          ),
          source_event_type: latestCheckoutStartedEvent ? "abando.checkout_event.v1" : null,
        },
        recovery_action_created: {
          observed: Boolean(recoveryActionCreatedAt),
          at: recoveryActionCreatedAt,
          source_event_type: latestRecoveryAction ? "abando.recovery_action.v1" : null,
        },
        recovery_sent: {
          observed: recoverySent,
          at: recoverySentAt,
          source_event_type: recoverySent ? "abando.experience_send.v1" : null,
        },
        recovery_returned: {
          observed: returnDetected,
          at: lastReturnedAt,
          source_event_type: returnDetected ? "abando.customer_return.v1" : null,
        },
        billing_started: {
          observed: Boolean(billingStartedAt),
          at: billingStartedAt,
          source_event_type: latestBillingStartedEvent ? "abando.billing_started.v1" : null,
        },
        billing_completed: {
          observed: Boolean(billingCompletedAt),
          at: billingCompletedAt,
          source_event_type: latestBillingCompletedEvent || latestBillingState ? BILLING_STATE_EVENT : null,
        },
      },
    },
    latest_action: latestRecoveryAction
      ? {
          status: String(latestActionPayload?.status || ""),
          createdAt: latestRecoveryAction.createdAt || null,
          sentAt: latestRecoveryAction.sentAt || null,
          channel: String(latestActionPayload?.channel || "") || null,
          destination: String(
            latestActionPayload?.delivery?.[0]?.to
            || latestActionPayload?.target
            || "",
          ) || null,
          messageId: String(latestActionPayload?.messageId || "") || null,
          smsSid: latestSmsSid || null,
          smsStatus: latestSmsStatus,
          twilioInterpretation: latestTwilioInterpretation || null,
          twilioErrorCode: latestTwilioMessage?.errorCode || null,
          twilioErrorMessage: latestTwilioMessage?.errorMessage || null,
          providerAccepted: String(latestActionPayload?.channel || "") === "sms"
            ? Boolean(latestActionPayload?.smsSid || latestSmsSid)
            : Boolean(latestActionPayload?.messageId),
          deduped: latestActionPayload?.status === "deduped",
        }
      : null,
  };
}

function extractRecoveredValueCentsFromPayload(payload) {
  if (!payload || typeof payload !== "object") return 0;
  const candidates = [
    payload.recoveredRevenueCents,
    payload.attributedOrderValueCents,
    payload.cartValueCents,
    payload.revenueCents,
    payload.amountCents,
    typeof payload.amount === "number" ? Math.round(payload.amount * 100) : null,
  ];

  for (const value of candidates) {
    const cents = Number(value || 0);
    if (Number.isFinite(cents) && cents > 0) {
      return Math.round(cents);
    }
  }

  return 0;
}

async function resolveExperienceRecoveredValue({ shop, experienceId }) {
  const fallbackCents = Math.max(0, Number(getProofValueTier(shop).recoveredOrder || 0) * 100);

  if (!shop) {
    return {
      cents: fallbackCents,
      source: "fallback-source",
    };
  }

  const events = await prisma.systemEvent.findMany({
    where: { shopDomain: shop },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const normalizedExperienceId = normalizeExperienceId(experienceId);

  const verifiedAttributionEvent = events.find((event) => {
    const payload = event?.payload;
    if (!payload || typeof payload !== "object") return false;
    if (String(event?.eventType || "") !== RECOVERY_ATTRIBUTION_EVENT) return false;
    return normalizedExperienceId && normalizeExperienceId(payload.experienceId) === normalizedExperienceId;
  });
  const verifiedAttributionCents = extractRecoveredValueCentsFromPayload(verifiedAttributionEvent?.payload);
  if (verifiedAttributionCents > 0) {
    return {
      cents: verifiedAttributionCents,
      source: "verified-shopify-order",
    };
  }

  const matchedEvent = events.find((event) => {
    const payload = event?.payload;
    if (!payload || typeof payload !== "object") return false;
    if (normalizedExperienceId && normalizeExperienceId(payload.experienceId) === normalizedExperienceId) return true;
    return false;
  });

  const matchedValueCents = extractRecoveredValueCentsFromPayload(matchedEvent?.payload);
  if (matchedValueCents > 0) {
    return {
      cents: matchedValueCents,
      source: "real-source",
    };
  }

  const durableRecoveryEvent = events.find((event) => {
    const payload = event?.payload;
    if (!payload || typeof payload !== "object") return false;
    const eventType = String(event?.eventType || "");
    return (
      eventType === "abando.customer_return.v1"
      || eventType === "abando.live_test_send.v1"
      || eventType === "abando.recovery_event.v1"
      || payload.source === "recovery_link"
      || payload.status === "recovered"
    );
  });

  const durableValueCents = extractRecoveredValueCentsFromPayload(durableRecoveryEvent?.payload);
  if (durableValueCents > 0) {
    return {
      cents: durableValueCents,
      source: "demo-source",
    };
  }

  return {
    cents: fallbackCents,
    source: "fallback-source",
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
  let smsStatus = null;
  let twilioMessage = null;
  let twilioInterpretation = null;
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
    logRecoverySendLifecycle("attempting send", {
      shop,
      actionId,
      testMode,
      channel: "email",
      to: emailRecipient,
    });
    const result = await sendRecoveryEmail({
      to: emailRecipient,
      subject: recoveryMessage.emailSubject,
      html: String(recoveryMessage.emailHtml || "").trim() || `<div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.5;"><p>${escapeHtml(recoveryMessage.emailBody).replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>")}</p></div>`,
      text: recoveryMessage.emailBody,
    });
    if (result.success) {
      messageId = result.messageId || null;
      successfulChannels.push("email");
      console.log("DELIVERY_SUCCESS", {
        provider: "smtp",
        destination: emailRecipient,
        channel: "email",
        messageId,
      });
      logRecoverySendLifecycle("send success", {
        shop,
        actionId,
        testMode,
        channel: "email",
        to: emailRecipient,
        messageId,
      });
      await record("email", "sent", { to: emailRecipient, messageId });
    } else {
      const error = result.error || "email_send_failed";
      failedChannels.push("email");
      sendError = sendError || error;
      console.log("DELIVERY_FAILURE", {
        provider: "smtp",
        destination: emailRecipient,
        channel: "email",
        error,
      });
      logRecoverySendLifecycle("send failed", {
        shop,
        actionId,
        testMode,
        channel: "email",
        to: emailRecipient,
        error,
      });
      await record("email", "failed", { to: emailRecipient, error });
    }
  } else {
    if (emailRecipient && !emailConfigured) {
      logRecoverySendLifecycle("provider missing", {
        shop,
        actionId,
        testMode,
        channel: "email",
        to: emailRecipient,
        missingEnvVars: getMissingEmailEnvVars(),
      });
    }
    await record("email", emailRecipient ? "skipped_not_configured" : "skipped_missing_recipient", {
      to: emailRecipient || null,
    });
  }

  if (smsConfigured && smsRecipient) {
    logRecoverySendLifecycle("attempting send", {
      shop,
      actionId,
      testMode,
      channel: "sms",
      to: smsRecipient,
    });
    const result = await sendRecoverySMS({
      to: smsRecipient,
      message: recoveryMessage.smsText,
    });
    if (result.success) {
      smsSid = result.sid || null;
      smsStatus = result.status || result.twilioMessage?.status || null;
      twilioMessage = result.twilioMessage || null;
      twilioInterpretation = result.interpretation || interpretTwilioDeliveryStatus(smsStatus);
      successfulChannels.push("sms");
      console.log("DELIVERY_SUCCESS", {
        provider: "twilio",
        destination: smsRecipient,
        channel: "sms",
        sid: smsSid,
        status: smsStatus,
        errorCode: twilioMessage?.errorCode || null,
      });
      logRecoverySendLifecycle("send success", {
        shop,
        actionId,
        testMode,
        channel: "sms",
        to: smsRecipient,
        sid: smsSid,
        status: smsStatus,
        interpretation: twilioInterpretation?.label || null,
      });
      await record("sms", "sent", {
        to: smsRecipient,
        sid: smsSid,
        status: smsStatus,
        providerAccepted: true,
        interpretation: twilioInterpretation?.label || null,
        errorCode: twilioMessage?.errorCode || null,
        errorMessage: twilioMessage?.errorMessage || null,
        dateCreated: twilioMessage?.dateCreated || null,
        dateUpdated: twilioMessage?.dateUpdated || null,
        dateSent: twilioMessage?.dateSent || null,
        messagingServiceSid: twilioMessage?.messagingServiceSid || null,
        accountSid: twilioMessage?.accountSid || null,
        direction: twilioMessage?.direction || null,
      });
    } else {
      const error = result.error || result.reason || "sms_send_failed";
      smsStatus = result.status || result.twilioMessage?.status || null;
      twilioMessage = result.twilioMessage || null;
      twilioInterpretation = result.interpretation || interpretTwilioDeliveryStatus(smsStatus);
      failedChannels.push("sms");
      sendError = sendError || error;
      console.log("DELIVERY_FAILURE", {
        provider: "twilio",
        destination: smsRecipient,
        channel: "sms",
        error,
        status: smsStatus,
        errorCode: twilioMessage?.errorCode || null,
      });
      logRecoverySendLifecycle("send failed", {
        shop,
        actionId,
        testMode,
        channel: "sms",
        to: smsRecipient,
        error,
        status: smsStatus,
      });
      await record("sms", "failed", {
        to: smsRecipient,
        error,
        status: smsStatus,
        interpretation: twilioInterpretation?.label || null,
        errorCode: twilioMessage?.errorCode || null,
        errorMessage: twilioMessage?.errorMessage || null,
        dateCreated: twilioMessage?.dateCreated || null,
        dateUpdated: twilioMessage?.dateUpdated || null,
        messagingServiceSid: twilioMessage?.messagingServiceSid || null,
        accountSid: twilioMessage?.accountSid || null,
        direction: twilioMessage?.direction || null,
      });
    }
  } else {
    if (smsRecipient && !smsConfigured) {
      logRecoverySendLifecycle("provider missing", {
        shop,
        actionId,
        testMode,
        channel: "sms",
        to: smsRecipient,
        missingEnvVars: getMissingSmsEnvVars(),
      });
    }
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
    smsStatus,
    twilioMessage,
    twilioInterpretation,
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

async function readJsonArrayFile(filePath) {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function readJsonObjectFile(filePath) {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

async function writeJsonArrayFile(filePath, records) {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

async function readProofRegistry() {
  const parsed = await readJsonObjectFile(abandoProofEventsPath);
  const loops = Array.isArray(parsed?.loops) ? parsed.loops : [];
  return { loops };
}

async function writeProofRegistry(registry) {
  await mkdir(dirname(abandoProofEventsPath), { recursive: true });
  await writeFile(abandoProofEventsPath, `${JSON.stringify({
    loops: Array.isArray(registry?.loops) ? registry.loops : [],
  }, null, 2)}\n`, "utf8");
}

function buildProofLoopUrls({ shop, eid }) {
  const params = new URLSearchParams();
  if (shop) params.set("shop", shop);
  if (eid) params.set("eid", eid);

  const proofParams = new URLSearchParams();
  if (shop) proofParams.set("shop", shop);
  proofParams.set("flow", "demo");
  if (eid) proofParams.set("eid", eid);

  const impactParams = new URLSearchParams(proofParams);
  impactParams.set("state", "recovered");

  return {
    proof_url: `/proof?${proofParams.toString()}`,
    experience_url: `/experience?${params.toString()}`,
    returned_url: `/experience/returned?${params.toString()}`,
    impact_url: `/proof?${impactParams.toString()}`,
  };
}

async function recordProofLoopSend({
  shop,
  experienceId,
  channel,
  sendTimestamp,
  sendStatus,
  deliveryStatus,
  valueEstimate = 0,
  source = "live",
  manualRecoveryLink = "",
  proofLoopId = "",
  variantId = "unknown",
  messageAngle = "unknown",
  tonePreset = "direct",
  leadDomain = "",
  leadSegmentKey = "",
  providerStatus = "",
  providerAccepted = false,
  twilioMessage = null,
  twilioInterpretation = null,
}) {
  if (!shop || !experienceId) return null;

  const registry = await readProofRegistry();
  const loopId = proofLoopId || (crypto.randomUUID ? crypto.randomUUID() : `loop_${Date.now()}_${randomBytes(4).toString("hex")}`);
  const nextLoop = {
    loop_id: loopId,
    shop,
    eid: experienceId,
    channel: channel || "",
    send_timestamp: sendTimestamp || new Date().toISOString(),
    send_status: sendStatus || "sent",
    delivery_status: deliveryStatus || "sent_confirmed",
    return_detected: false,
    return_timestamp: "",
    install_status: "none",
    install_timestamp: "",
    value_estimate: Number(valueEstimate || 0),
    source,
    verified: false,
    variant_id: variantId || "unknown",
    message_angle: messageAngle || "unknown",
    tone_preset: normalizeTonePreset(tonePreset),
    outcome: "none",
    outcome_timestamp: "",
    outcome_value: 0,
    lead_domain: leadDomain || "",
    lead_segment_key: leadSegmentKey || "",
    provider_status: providerStatus || "",
    provider_accepted: Boolean(providerAccepted),
    twilio_message: twilioMessage || null,
    twilio_interpretation: twilioInterpretation || null,
    latest_error: "",
    manual_recovery_link: manualRecoveryLink || "",
    ...buildProofLoopUrls({ shop, eid: experienceId }),
  };

  registry.loops.push(nextLoop);
  await writeProofRegistry(registry);
  return nextLoop;
}

async function updateProofLoopRecord(loopId, updater) {
  return updateProofLoopById(loopId, updater);
}

async function findProofLoopForExperience({ shop, experienceId, channel = "" }) {
  const registry = await readProofRegistry();
  const loops = Array.isArray(registry.loops) ? registry.loops : [];
  const matchingLoops = loops
    .filter((loop) => String(loop?.shop || "") === String(shop || ""))
    .filter((loop) => String(loop?.eid || "") === String(experienceId || ""))
    .filter((loop) => !channel || String(loop?.channel || "") === String(channel || ""))
    .sort((a, b) => String(b.send_timestamp || "").localeCompare(String(a.send_timestamp || "")));
  return matchingLoops.find((loop) => !loop?.verified) || matchingLoops[0] || null;
}

function normalizeInstallAttributionValue(value = "") {
  return normalizeStoreInput(String(value || "").trim());
}

async function appendInstallEvent(event) {
  const records = await readJsonArrayFile(leadsInstallEventsPath);
  records.push({
    ...event,
    created_at: new Date().toISOString(),
  });
  await writeJsonArrayFile(leadsInstallEventsPath, records);
}

async function updateOutreachInstallTracking({
  targetDomain,
  installStatus,
  installedShop = "",
  installStartedAt = "",
  installedAt = "",
}) {
  const normalizedTarget = normalizeInstallAttributionValue(targetDomain);
  if (!normalizedTarget) {
    return { ok: false, reason: "missing_target_domain" };
  }

  const queue = await readJsonArrayFile(leadsOutreachQueuePath);
  const targetIndex = queue.findIndex(
    (entry) => normalizeInstallAttributionValue(entry?.domain || "") === normalizedTarget,
  );
  if (targetIndex < 0) {
    return { ok: false, reason: "target_not_found" };
  }

  const entry = queue[targetIndex] || {};
  const conversion = entry?.conversion && typeof entry.conversion === "object" ? { ...entry.conversion } : {};
  conversion.install_status = String(installStatus || conversion.install_status || "none");
  if (installStartedAt) {
    conversion.install_started_at = installStartedAt;
  }
  if (installedAt) {
    conversion.installed_at = installedAt;
  }
  if (installedShop) {
    conversion.installed_shop = normalizeInstallAttributionValue(installedShop) || String(installedShop).trim();
  }
  entry.conversion = conversion;
  entry.updated_at = new Date().toISOString();
  queue[targetIndex] = entry;
  await writeJsonArrayFile(leadsOutreachQueuePath, queue);
  return { ok: true };
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
  return resolveConfiguredAppBaseUrl();
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

function normalizeBaseUrl(value = "") {
  return String(value || "").trim().replace(/\/+$/, "");
}

function resolveMerchantFacingBaseUrl() {
  return normalizeBaseUrl(getPublicAppBaseUrl());
}

function toMerchantFacingUrl(path = "") {
  return canonicalizePublicAppUrl(path) || path;
}

function isTryCloudflareHost(value = "") {
  return /(^|[/.])trycloudflare\.com$/i.test(
    (() => {
      try {
        const raw = String(value || "").trim();
        if (!raw) return "";
        const url = raw.includes("://") ? new URL(raw) : new URL(`http://${raw}`);
        return String(url.hostname || "").trim().toLowerCase();
      } catch {
        return String(value || "").trim().toLowerCase();
      }
    })(),
  );
}

function resolveConfiguredAppBaseUrl() {
  return resolveMerchantFacingBaseUrl();
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
  const destination = `/dashboard/${buildEmbeddedQueryString(req, { forceEmbedded: false })}`;
  applyShopifyEmbeddedAppHeaders(res);
  res.setHeader("Location", destination);
  return res.status(307).end();
}

function resolveRequestOrigin(req) {
  const originHeader = String(req.get("origin") || "").trim();
  const publicBaseUrl = resolveConfiguredAppBaseUrl();
  const localOrigin = originHeader && isLocalHostLike(originHeader)
    ? originHeader.replace(/\/+$/, "")
    : "";
  const proto = String(req.get("x-forwarded-proto") || req.protocol || "http")
    .split(",")[0]
    .trim() || "http";
  const host = String(req.get("x-forwarded-host") || req.get("host") || "")
    .split(",")[0]
    .trim();
  const localHostOrigin = host && isLocalHostLike(host)
    ? `${proto}://${host}`.replace(/\/+$/, "")
    : "";

  if (localOrigin) {
    return localOrigin;
  }

  if (localHostOrigin) {
    return localHostOrigin;
  }

  if (originHeader && !isLocalHostLike(originHeader)) {
    const normalizedOrigin = originHeader.replace(/\/+$/, "");
    if (!isTryCloudflareHost(normalizedOrigin)) {
      return normalizedOrigin;
    }
  }

  if (!host) {
    return publicBaseUrl || "http://127.0.0.1:8081";
  }

  const requestOrigin = `${proto}://${host}`.replace(/\/+$/, "");
  if (!isTryCloudflareHost(requestOrigin)) {
    return requestOrigin;
  }

  return publicBaseUrl || "http://127.0.0.1:8081";
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
      getStripeWebhookSecret(),
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
  const preCheckoutCaptured = Boolean(summary?.preCheckoutCaptured);
  const checkoutPageReached = Boolean(summary?.checkoutPageReached);
  const sendReady = Boolean(summary?.sendReady);
  const proofCaptureStage = String(summary?.proofCaptureStage || "none");
  const status = summary?.connectionStatus === "connected"
    ? sendReady || checkoutEventCount >= 1
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
    proofCaptureStage,
    preCheckoutCaptured,
    checkoutPageReached,
    sendReady,
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
  applyShopifyEmbeddedAppHeaders(res);

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
  applyShopifyEmbeddedAppHeaders(res);

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
installShopifyAppListingRoute(app);
installRunAuditRoute(app);
installRevenueLeakageEntryRoute(app);
installShopify(app, { getShopRecord });
installInviteRoutes(app);
installSnippet(app);
installCheckoutSignals(app);
installInternalTestRoutes(app);

async function hasRecoveryAlreadyTriggeredForCheckout({ shop, sourceEventId = "", checkoutId = "", sessionId = "" }) {
  const events = await prisma.systemEvent.findMany({
    where: {
      shopDomain: shop,
      eventType: "abando.recovery_action.v1",
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return events.some((event) => {
    const payload = event?.payload;
    if (!payload || typeof payload !== "object") return false;
    const payloadSourceEventId = String(payload.source_event_id || "").trim();
    const payloadCheckoutId = String(payload.checkout_id || "").trim();
    const payloadSessionId = String(payload.checkout_session_id || "").trim();
    return (
      (sourceEventId && payloadSourceEventId === sourceEventId)
      || (checkoutId && payloadCheckoutId === checkoutId)
      || (sessionId && payloadSessionId === sessionId)
    );
  });
}

function buildAutomaticRecoveryPacket({ shop, checkoutEvent }) {
  const payload = checkoutEvent?.payload && typeof checkoutEvent.payload === "object"
    ? checkoutEvent.payload
    : null;
  if (!payload || !shop) return null;

  const sourceEventId = String(payload.id || "").trim();
  const checkoutId = String(payload.checkout_id || payload.session_id || "").trim();
  const sessionId = String(payload.session_id || "").trim();
  if (!checkoutId || !sessionId) return null;

  return {
    type: "recovery_trigger",
    shop,
    checkout_id: checkoutId,
    session_id: sessionId,
    source_event_id: sourceEventId || null,
    trigger_type: "automatic",
  };
}

async function executeAutomaticRecoveryPacket({ packet, checkoutEvent }) {
  const payload = checkoutEvent?.payload && typeof checkoutEvent.payload === "object"
    ? checkoutEvent.payload
    : null;
  if (!payload || !packet) return { ok: false, reason: "missing_payload" };

  const shop = String(packet.shop || "").trim();
  const sourceEventId = String(packet.source_event_id || "").trim();
  const checkoutId = String(packet.checkout_id || "").trim();
  const sessionId = String(packet.session_id || "").trim();

  if (await hasRecoveryAlreadyTriggeredForCheckout({ shop, sourceEventId, checkoutId, sessionId })) {
    return { ok: true, deduped: true, reason: "already_triggered" };
  }

  const createdAt = new Date().toISOString();
  const basedOnEventAt = String(payload.occurredAt || payload.timestamp || createdAt);
  const recoveryMessage = generateRecoveryMessage({
    shop,
    eventData: payload,
    timestamp: basedOnEventAt,
    baseUrl: resolveAutomaticRecoveryBaseUrl(),
  });
  const emailRecipient = normalizeEmail(payload.customerEmail || payload.email || payload.metadata?.customerEmail || payload.metadata?.email || "");
  const smsRecipient = normalizePhone(payload.customerPhone || payload.phone || payload.metadata?.customerPhone || payload.metadata?.phone || "");
  const delivery = [];
  const actionType = smsRecipient && !emailRecipient ? "recovery_sms" : emailRecipient ? "recovery_email" : "recovery_email";

  const action = await prisma.systemEvent.create({
    data: {
      shopDomain: shop,
      eventType: "abando.recovery_action.v1",
      visibility: "merchant",
      payload: {
        status: "created",
        experienceId: null,
        action_type: actionType,
        createdAt,
        source: "automatic_checkout_monitor",
        basedOnEventAt,
        tone_preset: "direct",
        channel_requested: null,
        trigger_type: "automatic",
        recovery_triggered_at: createdAt,
        source_event_id: sourceEventId || null,
        checkout_id: checkoutId || null,
        checkout_session_id: sessionId || null,
        execution_packet: packet,
        execution_started_at: createdAt,
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

  console.log("AUTO_RECOVERY_TRIGGERED", {
    checkout_id: checkoutId,
    shop,
    timestamp: createdAt,
  });

  const sendResult = await executeRecoverySend({
    shop,
    email: emailRecipient,
    phone: smsRecipient,
    recoveryMessage,
    actionId: action.id,
    testMode: false,
    logDeliveryAttempt,
  });

  const finalStatus = sendResult.successfulChannels.length > 0
    ? "sent"
    : (sendResult.failedChannels.length > 0 || sendResult.sendError)
      ? "failed"
      : "created";
  const finalActionType =
    sendResult.successfulChannels.includes("email") ? "recovery_email" :
    sendResult.successfulChannels.includes("sms") ? "recovery_sms" :
    actionType;
  const executedAt = new Date().toISOString();

  await prisma.systemEvent.update({
    where: { id: action.id },
    data: {
      payload: {
        status: finalStatus,
        experienceId: null,
        action_type: finalActionType,
        createdAt,
        source: "automatic_checkout_monitor",
        basedOnEventAt,
        tone_preset: "direct",
        channel_requested: null,
        trigger_type: "automatic",
        recovery_triggered_at: createdAt,
        source_event_id: sourceEventId || null,
        checkout_id: checkoutId || null,
        checkout_session_id: sessionId || null,
        execution_packet: packet,
        execution_started_at: createdAt,
        execution_completed_at: executedAt,
        execution_outcome: finalStatus,
        delivery: sendResult.delivery,
        lastError: sendResult.sendError,
        emailConfigured: sendResult.emailConfigured,
        smsConfigured: sendResult.smsConfigured,
        sendNotConfigured: !sendResult.emailConfigured,
        channel: sendResult.successfulChannels[0] || null,
        channels: sendResult.successfulChannels,
        messageId: sendResult.messageId,
        smsSid: sendResult.smsSid,
        smsStatus: sendResult.smsStatus,
        twilioMessage: sendResult.twilioMessage,
        twilioInterpretation: sendResult.twilioInterpretation,
        sentAt: sendResult.sentAt,
        attemptedRealSend: sendResult.successfulChannels.length > 0 || sendResult.failedChannels.length > 0,
      },
    },
  });

  return {
    ok: true,
    actionId: action.id,
    status: finalStatus,
    checkoutId,
    sourceEventId,
    channels: sendResult.successfulChannels,
  };
}

async function runAutomaticRecoveryScanForShop(shop) {
  if (!shop) return [];
  const now = Date.now();
  const cutoff = now - AUTO_RECOVERY_DELAY_MS;
  const events = await prisma.systemEvent.findMany({
    where: {
      shopDomain: shop,
      eventType: "abando.checkout_event.v1",
      createdAt: { gte: new Date(now - AUTO_RECOVERY_LOOKBACK_MS) },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const payloads = events
    .map((event) => ({ event, payload: event?.payload && typeof event.payload === "object" ? event.payload : null }))
    .filter((entry) => entry.payload && entry.payload.session_id);
  const latestCandidateBySession = new Map();

  for (const entry of payloads) {
    const payload = entry.payload;
    const sessionId = String(payload.session_id || "");
    if (latestCandidateBySession.has(sessionId)) continue;
    if (!["checkout_started", "checkout_abandon"].includes(String(payload.event_type || ""))) continue;
    latestCandidateBySession.set(sessionId, entry);
  }

  const packets = [];
  for (const entry of latestCandidateBySession.values()) {
    const payload = entry.payload;
    const occurredAtMs = getCheckoutEventOccurredAt(payload);
    if (!occurredAtMs || occurredAtMs > cutoff) continue;
    if (hasPurchaseCompletedAfterEvent(payloads.map((item) => item.payload), payload.session_id, occurredAtMs)) continue;
    const packet = buildAutomaticRecoveryPacket({
      shop,
      checkoutEvent: entry.event,
    });
    if (!packet) continue;
    if (await hasRecoveryAlreadyTriggeredForCheckout({
      shop,
      sourceEventId: packet.source_event_id,
      checkoutId: packet.checkout_id,
      sessionId: packet.session_id,
    })) continue;
    console.log("RECOVERY_PACKET_CREATED", {
      type: packet.type,
      shop: packet.shop,
      checkout_id: packet.checkout_id,
      session_id: packet.session_id,
      source_event_id: packet.source_event_id,
      trigger_type: packet.trigger_type,
      timestamp: new Date().toISOString(),
    });
    packets.push({
      packet,
      checkoutEvent: entry.event,
    });
  }

  return packets;
}

let autoRecoveryScanInFlight = false;

async function runAutomaticRecoveryScan() {
  if (autoRecoveryScanInFlight) return;
  autoRecoveryScanInFlight = true;
  try {
    const recentEvents = await prisma.systemEvent.findMany({
      where: {
        eventType: "abando.checkout_event.v1",
        createdAt: { gte: new Date(Date.now() - AUTO_RECOVERY_LOOKBACK_MS) },
      },
      select: { shopDomain: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    const shops = [...new Set(recentEvents.map((event) => String(event.shopDomain || "")).filter(Boolean))];
    console.log("SCHEDULER_SCAN_STARTED", {
      timestamp: new Date().toISOString(),
      shop_count: shops.length,
    });
    for (const shop of shops) {
      const packets = await runAutomaticRecoveryScanForShop(shop);
      for (const entry of packets) {
        const result = await executeAutomaticRecoveryPacket(entry);
        console.log("RECOVERY_EXECUTED", {
          shop: entry.packet.shop,
          checkout_id: entry.packet.checkout_id,
          source_event_id: entry.packet.source_event_id,
          trigger_type: entry.packet.trigger_type,
          status: result?.status || result?.reason || "unknown",
          timestamp: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    console.error("[auto-recovery] scan failed", error instanceof Error ? error.message : String(error));
  } finally {
    autoRecoveryScanInFlight = false;
  }
}

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

    for (const event of events) {
      if (String(event?.event_type || "").trim().toLowerCase() === "checkout_started") {
        console.log("[EVENT] checkout_started received", {
          shop: event.shop,
          source: event.source,
          occurredAt: event.occurredAt || event.timestamp || null,
          checkoutId: event.checkout_id || null,
          checkoutPath: event.checkoutPath || event.metadata?.path || null,
        });
      }
    }

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

app.get("/api/debug/recovery-state", async (req, res) => {
  try {
    const shop = normalizeShop(String(req.query?.shop || "").trim().toLowerCase());
    if (!shop) {
      return res.status(400).json({ ok: false, error: "missing_shop" });
    }

    const latestCheckoutEvent = await findLatestCheckoutStartedEvent(shop, {
      requireRealStorefront: true,
      allowPreCheckoutIntent: true,
    });
    const latestRecoveryAction = await findLatestRecoveryActionEvent(shop);
    const latestCheckoutPayload = latestCheckoutEvent?.payload && typeof latestCheckoutEvent.payload === "object"
      ? latestCheckoutEvent.payload
      : null;
    const latestRecoveryPayload = latestRecoveryAction?.payload && typeof latestRecoveryAction.payload === "object"
      ? latestRecoveryAction.payload
      : null;
    const lastCheckoutEventAt =
      latestCheckoutPayload?.occurredAt ||
      latestCheckoutPayload?.timestamp ||
      latestCheckoutEvent?.createdAt?.toISOString?.() ||
      null;
    const lastRecoveryActionAt =
      latestRecoveryPayload?.createdAt ||
      latestRecoveryPayload?.sentAt ||
      latestRecoveryAction?.createdAt?.toISOString?.() ||
      null;
    const recoveryReady = Boolean(latestCheckoutEvent);

    if (recoveryReady) {
      console.log(`[RECOVERY] ready for shop: ${shop}`, {
        lastCheckoutEventAt,
      });
    }

    return res.json({
      shop,
      hasCheckoutEvent: Boolean(latestCheckoutEvent),
      lastCheckoutEventAt,
      hasRecoveryAction: Boolean(latestRecoveryAction),
      lastRecoveryActionAt,
      recoveryReady,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.post("/api/debug/trigger-recovery", async (req, res) => {
  try {
    const shop = normalizeShop(String(req.body?.shop || "").trim().toLowerCase());
    if (!shop) {
      return res.status(400).json({ ok: false, error: "missing_shop" });
    }

    const latestCheckoutEvent = await findLatestCheckoutStartedEvent(shop, {
      requireRealStorefront: true,
      allowPreCheckoutIntent: true,
    });

    if (!latestCheckoutEvent) {
      return res.status(409).json({
        ok: false,
        error: "no_checkout_event",
        details: "No qualifying checkout_started event exists for this shop.",
      });
    }

    const latestCheckoutPayload = latestCheckoutEvent?.payload && typeof latestCheckoutEvent.payload === "object"
      ? latestCheckoutEvent.payload
      : null;
    const latestEventAt =
      latestCheckoutPayload?.occurredAt ||
      latestCheckoutPayload?.timestamp ||
      latestCheckoutEvent?.createdAt?.toISOString?.() ||
      new Date().toISOString();
    const action = await prisma.systemEvent.create({
      data: {
        shopDomain: shop,
        eventType: "abando.recovery_action.v1",
        visibility: "merchant",
        payload: {
          status: "created",
          action_type: "debug_recovery_trigger",
          createdAt: new Date().toISOString(),
          source: "debug_trigger",
          basedOnEventAt: latestEventAt,
          debug: true,
        },
      },
    });

    console.log(`[DEBUG] recovery triggered for shop: ${shop}`, {
      recoveryActionId: action.id,
      basedOnEventAt: latestEventAt,
    });
    console.log(`[RECOVERY] triggered for shop: ${shop}`, {
      recoveryActionId: action.id,
      basedOnEventAt: latestEventAt,
    });

    return res.json({
      ok: true,
      triggered: true,
      shop,
      recoveryActionId: action.id,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.post("/api/debug/inject-checkout", async (req, res) => {
  try {
    const shop = normalizeShop(String(req.body?.shop || "").trim().toLowerCase());
    if (!shop) {
      return res.status(400).json({ ok: false, error: "missing_shop" });
    }

    const injectedEvent = await prisma.systemEvent.create({
      data: {
        shopDomain: shop,
        eventType: "abando.checkout_event.v1",
        visibility: "merchant",
        payload: {
          id: `debug_checkout_${randomBytes(8).toString("hex")}`,
          shop,
          session_id: `debug_session_${randomBytes(8).toString("hex")}`,
          checkout_id: `debug_checkout_${randomBytes(6).toString("hex")}`,
          checkout_session_id: `debug_checkout_${randomBytes(6).toString("hex")}`,
          checkoutPath: "/checkout",
          storefrontHost: shop,
          timestamp: new Date().toISOString(),
          occurredAt: new Date().toISOString(),
          event_type: "checkout_started",
          stage: "checkout",
          source: "manual_dev",
          device_type: "unknown",
          order_id: null,
          customerEmail: null,
          customerPhone: null,
          metadata: {
            path: "/checkout",
            storefrontHost: shop,
            emittedBy: "api/debug/inject-checkout",
            debug: true,
          },
        },
      },
    });

    console.log("[EVENT] checkout_started received", {
      shop,
      source: "manual_dev",
      occurredAt: injectedEvent.createdAt?.toISOString?.() || null,
      checkoutId: "debug_injected",
      checkoutPath: "/checkout",
    });

    return res.json({
      ok: true,
      injected: true,
      shop,
      eventId: injectedEvent.id,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.post("/api/quickstart/run", async (req, res) => {
  try {
    const result = await runQuickstartFlow({
      req,
      shop: String(req.body?.shop || ""),
      email: String(req.body?.email || ""),
    });

    if (!result.ok) {
      return res.status(result.status || 500).json({
        ok: false,
        error: result.error || "quickstart_failed",
        details: result.details || "",
        missing: result.missing || [],
        experienceId: result.experienceId || null,
        proofUrl: result.proofUrl || null,
      });
    }

    return res.json({
      ok: true,
      shop: result.shop,
      experienceId: result.experienceId,
      sent: true,
      proofUrl: result.proofUrl,
      recoveryLink: result.recoveryLink,
      messageId: result.messageId || null,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.post("/api/recovery-actions/create", async (req, res) => {
  try {
    const shop = normalizeShop(String(req.body?.shop || "").trim().toLowerCase());
    const experienceId = normalizeExperienceId(req.body?.experienceId);
    const requestedChannel = normalizeRecoveryChannel(req.body?.channel);
    const tonePreset = normalizeTonePreset(req.body?.tone_preset);
    console.log("[recovery-actions/create] request start", {
      shop,
      experienceId: experienceId || null,
      channel: requestedChannel || null,
      tonePreset,
      hasEmail: Boolean(req.body?.email),
      hasPhone: Boolean(req.body?.phone),
    });
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
    const recoveryMessage = experienceId
      ? buildExperienceRecoveryMessage({
          req,
          shop,
          eventData: latestEventPayload || {},
          timestamp: latestEventAt || new Date().toISOString(),
          experienceId,
          tonePreset,
          channel: requestedChannel || (requestedPhone ? "sms" : "email"),
        })
      : generateRecoveryMessage({
          shop,
          eventData: latestEventPayload || {},
          timestamp: latestEventAt || new Date().toISOString(),
          baseUrl: resolveMerchantFacingBaseUrl(),
        });
    const emailRecipient = requestedChannel === "sms"
      ? ""
      : (
        requestedEmail ||
        normalizeEmail(latestEventPayload?.customerEmail) ||
        normalizeEmail(latestEventPayload?.email)
      );
    const smsRecipient = requestedChannel === "email"
      ? ""
      : (
        requestedPhone ||
        normalizePhone(latestEventPayload?.customerPhone) ||
        normalizePhone(latestEventPayload?.phone)
      );

    const emailConfigured = isEmailSenderConfigured();
    const smsConfigured = isSmsSenderConfigured();
    const recentExperienceSend = experienceId
      ? getRecentExperienceSendMatch(
          await listExperienceSendEvents(shop, experienceId),
          { email: emailRecipient, phone: smsRecipient },
        )
      : null;

    if (recentExperienceSend) {
      const createdAt = new Date().toISOString();
      const dedupeFlowUrls = buildExperienceFlowUrls({
        req,
        shop,
        experienceId,
        channel: recentExperienceSend.channel || "email",
      });
      const dedupedAction = await prisma.systemEvent.create({
        data: {
          shopDomain: shop,
          eventType: "abando.recovery_action.v1",
          visibility: "merchant",
          payload: {
            status: "deduped",
            experienceId: experienceId || null,
            action_type: recentExperienceSend.channel === "sms" ? "recovery_sms" : "recovery_email",
            createdAt,
            source: "merchant_dashboard",
            basedOnEventAt: latestEventAt,
            tone_preset: tonePreset,
            channel_requested: requestedChannel || null,
            channel: recentExperienceSend.channel || null,
            channels: recentExperienceSend.channel ? [recentExperienceSend.channel] : [],
            sentAt: String(recentExperienceSend.sentAt || "") || null,
            deduped: true,
            delivery: recentExperienceSend.channel
              ? [{
                  channel: recentExperienceSend.channel,
                  outcome: "deduped",
                  at: createdAt,
                  to: recentExperienceSend.target || null,
                  providerId: recentExperienceSend.providerId || null,
                }]
              : [],
          },
        },
      });
      console.log("DELIVERY_DEDUPED", {
        shop,
        experienceId,
        channel: recentExperienceSend.channel || null,
        tonePreset,
        destination: recentExperienceSend.target || null,
        sentAt: recentExperienceSend.sentAt || null,
      });
      return res.json({
        ok: true,
        shop,
        experienceId: experienceId || null,
        recoveryActionStatus: "deduped",
        deduped: true,
        dedupeWindowMinutes: Math.round(DEMO_DEDUPE_WINDOW_MS / 60000),
        lastRecoveryActionAt: String(recentExperienceSend.sentAt || "") || null,
        lastRecoveryActionType: recentExperienceSend.channel === "sms" ? "recovery_sms" : "recovery_email",
        recoveryActionId: dedupedAction.id,
        tone_preset: tonePreset,
        sentAt: String(recentExperienceSend.sentAt || "") || null,
        channels: recentExperienceSend.channel ? [recentExperienceSend.channel] : [],
        experienceUrl: dedupeFlowUrls.experienceUrl,
        returnUrl: dedupeFlowUrls.returnUrl,
        returnedUrl: dedupeFlowUrls.returnedUrl,
        proofRecoveredUrl: dedupeFlowUrls.proofRecoveredUrl,
        delivery: recentExperienceSend.channel
          ? [{
              channel: recentExperienceSend.channel,
              outcome: "deduped",
              at: new Date().toISOString(),
              to: recentExperienceSend.target || null,
              providerId: recentExperienceSend.providerId || null,
            }]
          : [],
        message: "already_sent",
      });
    }

    if (
      latestRecoveryPayload
      && typeof latestRecoveryPayload.basedOnEventAt === "string"
      && latestEventAt
      && latestRecoveryPayload.basedOnEventAt === latestEventAt
      && (
        !experienceId
        || normalizeExperienceId(latestRecoveryPayload.experienceId) === experienceId
      )
      && !requestedEmail
      && !requestedPhone
      && ["created", "sent"].includes(String(latestRecoveryPayload.status || ""))
    ) {
      return res.json({
        ok: true,
        shop,
        experienceId: experienceId || null,
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
          experienceId: experienceId || null,
          action_type: actionType,
          createdAt,
          source: "merchant_dashboard",
          basedOnEventAt: latestEventAt,
          tone_preset: tonePreset,
          channel_requested: requestedChannel || null,
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
          experienceId: experienceId || null,
          action_type: finalActionType,
          createdAt,
          source: "merchant_dashboard",
          basedOnEventAt: latestEventAt,
          tone_preset: tonePreset,
          channel_requested: requestedChannel || null,
          delivery: sendResult.delivery,
          lastError: sendResult.sendError,
          emailConfigured: sendResult.emailConfigured,
          smsConfigured: sendResult.smsConfigured,
          sendNotConfigured,
          channel: sendResult.successfulChannels[0] || null,
          channels: sendResult.successfulChannels,
          messageId: sendResult.messageId,
          smsSid: sendResult.smsSid,
          smsStatus: sendResult.smsStatus,
          twilioMessage: sendResult.twilioMessage,
          twilioInterpretation: sendResult.twilioInterpretation,
          sentAt: sendResult.sentAt,
          attemptedRealSend: sendResult.successfulChannels.length > 0 || sendResult.failedChannels.length > 0,
        },
      },
    });

    if (experienceId) {
      await persistExperienceSendRecords({
        shop,
        experienceId,
        sendResult,
        tonePreset,
      });
    }

    if (finalStatus === "sent") {
      await prisma.systemEvent.create({
        data: {
          shopDomain: shop,
          eventType: "abando.recovery_sent.v1",
          visibility: "merchant",
          relatedJobId: action.id,
          payload: {
            shop,
            experienceId: experienceId || null,
            channel: sendResult.successfulChannels[0] || null,
            target: sendResult.successfulChannels[0] === "sms" ? smsRecipient || null : emailRecipient || null,
            sent_at: sendResult.sentAt || new Date().toISOString(),
            provider_accepted: sendResult.successfulChannels[0] === "sms"
              ? Boolean(sendResult.smsSid)
              : Boolean(sendResult.messageId),
            message_id: sendResult.messageId || null,
            sms_sid: sendResult.smsSid || null,
          },
        },
      });
    }

    return res.json({
      ok: true,
      shop,
      experienceId: experienceId || null,
      recoveryActionStatus: finalStatus,
      tone_preset: tonePreset,
      channel_requested: requestedChannel || null,
      lastRecoveryActionAt: createdAt,
      lastRecoveryActionType: finalActionType,
      recoveryActionId: action.id,
      sentAt: sendResult.sentAt,
      channels: sendResult.successfulChannels,
      messageId: sendResult.messageId,
      smsSid: sendResult.smsSid,
      smsStatus: sendResult.smsStatus,
      twilioMessage: sendResult.twilioMessage,
      twilioInterpretation: sendResult.twilioInterpretation,
      delivery: sendResult.delivery,
      ...buildExperienceFlowUrls({
        req,
        shop,
        experienceId,
        channel: sendResult.successfulChannels[0] || requestedChannel || "email",
      }),
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
    const checkoutContext = resolveCheckoutContextFromEventPayload(latestEventPayload || {}, experienceId);
    const checkoutId = checkoutContext.checkoutId;
    const checkoutSessionId = checkoutContext.checkoutSessionId;
    const sourceEventId = String(latestEventPayload?.id || "").trim();
    const email = "rossstafford1@gmail.com";
    const phone = normalizePhone("+16172703075");
    const recoveryMessage = generateRecoveryMessage({
      shop,
      eventData: latestEventPayload || {},
      timestamp: latestEventAt,
      baseUrl: resolveMerchantFacingBaseUrl(),
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
          smsStatus: sendResult.smsStatus,
          twilioMessage: sendResult.twilioMessage,
          twilioInterpretation: sendResult.twilioInterpretation,
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
      smsStatus: sendResult.smsStatus,
      twilioMessage: sendResult.twilioMessage,
      twilioInterpretation: sendResult.twilioInterpretation,
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
    const requestedChannel = normalizeRecoveryChannel(req.body?.channel);
    const tonePreset = normalizeTonePreset(req.body?.tone_preset);
    console.log("[recovery-send] entering handler", {
      route: "/api/recovery-actions/send-live-test",
      shop: String(req.body?.shop || "").trim().toLowerCase(),
      channel: requestedChannel || null,
      tonePreset,
      hasEmail: Boolean(String(req.body?.email || "").trim()),
      hasPhone: Boolean(String(req.body?.phone || "").trim()),
      experienceId: normalizeExperienceId(req.body?.experienceId),
    });
    const shop = normalizeShop(String(req.body?.shop || "").trim().toLowerCase());
    if (!shop) {
      return res.status(400).json({ ok: false, error: "Missing shop", provider: "", details: "" });
    }

    const experienceId = normalizeExperienceId(req.body?.experienceId);
    const requestedEmail = normalizeEmail(req.body?.email);
    const rawPhone = String(req.body?.phone || "");
    const requestedPhone = normalizePhone(rawPhone);
    const email = requestedChannel === "sms" ? "" : requestedEmail;
    const phone = requestedChannel === "email" ? "" : requestedPhone;
    const leadDomain = String(req.body?.lead_domain || "").trim().toLowerCase();
    const requestedVariantId = String(req.body?.variant_id || "").trim();
    const requestedMessageAngle = String(req.body?.message_angle || "").trim();
    let assignedVariant = null;
    if (leadDomain) {
      assignedVariant = await getAssignedVariantForLead(leadDomain) || await assignVariantForLead(leadDomain);
    }
    const experimentStatus = await getExperimentStatus();
    const variantId = requestedVariantId || String(assignedVariant?.assigned_variant_id || "unknown").trim() || "unknown";
    const messageAngle = requestedMessageAngle || String(assignedVariant?.assigned_message_angle || "unknown").trim() || "unknown";

    if (!email && !rawPhone.trim()) {
      return res.status(400).json({ ok: false, error: "Enter an email or phone number.", provider: "", details: "" });
    }

    if (email && !isValidEmail(email)) {
      return res.status(400).json({ ok: false, error: "Enter a valid email address.", provider: "smtp", details: "" });
    }

    if (rawPhone.trim() && !phone) {
      return res.status(400).json({ ok: false, error: "Enter a valid mobile phone number.", provider: "twilio", details: "" });
    }

    const emailReadiness = getEmailReadiness();
    const emailConfigured = emailReadiness.ready;
    const smsConfigured = isSmsSenderConfigured();
    const missingEnvVars = [
      ...(emailConfigured ? [] : emailReadiness.missing),
      ...(smsConfigured ? [] : getMissingSmsEnvVars()),
    ];
    const providerStatuses = [
      ...(emailConfigured ? [] : ["email_not_configured"]),
      ...(smsConfigured ? [] : ["sms_not_configured"]),
    ];

    if ((!email || !emailConfigured) && (!phone || !smsConfigured)) {
      logRecoverySendLifecycle("provider missing", {
        shop,
        testMode: true,
        email: email || null,
        phone: phone || null,
        missingEnvVars,
      });
      return res.status(503).json({
        ok: false,
        error: "Send not configured",
        provider: !emailConfigured && email ? "smtp" : (!smsConfigured && phone ? "twilio" : ""),
        details: missingEnvVars.join(", "),
        sent: false,
        missing: missingEnvVars,
        channels: [],
        providerStatuses,
        missingEnvVars,
        experienceId: experienceId || null,
        variant_id: variantId,
        message_angle: messageAngle,
        tone_preset: tonePreset,
        lead_domain: leadDomain || null,
        experiment_name: assignedVariant?.experiment_name || experimentStatus?.active_experiment?.name || null,
        experiment_active: Boolean(experimentStatus?.active),
        timestamp: new Date().toISOString(),
      });
    }

    const shopRecord = await prisma.shop.findUnique({
      where: { key: shop },
      select: { key: true },
    });

    if (!shopRecord) {
      return res.status(404).json({ ok: false, error: "Store not found", provider: "", details: "" });
    }

    const checkoutEventCount = await prisma.systemEvent.count({
      where: {
        shopDomain: shop,
        eventType: "abando.checkout_event.v1",
      },
    });

    if (checkoutEventCount < 1) {
      return res.status(409).json({ ok: false, error: "Recovery is not ready for this store yet.", provider: "", details: "" });
    }

    const latestCheckoutEvent = await findLatestCheckoutStartedEvent(shop, {
      requireRealStorefront: true,
      allowPreCheckoutIntent: true,
    });

    if (!latestCheckoutEvent) {
      return res.status(409).json({
        ok: false,
        error: "real_checkout_not_captured",
        provider: "",
        details: "No live storefront checkout has been captured for this store yet.",
        experienceId: experienceId || null,
        timestamp: new Date().toISOString(),
      });
    }

    const latestEventPayload = latestCheckoutEvent?.payload && typeof latestCheckoutEvent.payload === "object"
      ? latestCheckoutEvent.payload
      : null;
    const latestEventAt =
      latestEventPayload?.occurredAt ||
      latestEventPayload?.timestamp ||
      latestCheckoutEvent?.createdAt?.toISOString?.() ||
      new Date().toISOString();
    const checkoutContext = resolveCheckoutContextFromEventPayload(latestEventPayload || {}, experienceId);
    const checkoutId = checkoutContext.checkoutId;
    const checkoutSessionId = checkoutContext.checkoutSessionId;
    const sourceEventId = String(latestEventPayload?.id || "").trim();
    const checkoutResumeUrl = buildShopifyCheckoutResumeUrl({
      shop,
      checkoutId,
      checkoutPath: checkoutContext.checkoutPath,
      storefrontHost: checkoutContext.storefrontHost,
    });
    const checkoutVerification = await verifyShopifyCheckoutResumeUrl(checkoutResumeUrl);

    if (!checkoutVerification.ok) {
      return res.status(409).json({
        ok: false,
        error: "real_checkout_not_resumable",
        provider: "",
        details: checkoutVerification.error || `Shopify checkout returned HTTP ${checkoutVerification.status || 0}.`,
        experienceId: experienceId || null,
        checkout_source: String(latestEventPayload?.source || "").trim().toLowerCase() || null,
        checkout_id: checkoutId || null,
        checkout_session_id: checkoutSessionId || null,
        checkout_resume_url: checkoutResumeUrl || null,
        checkout_resume_status: checkoutVerification.status || 0,
        timestamp: new Date().toISOString(),
      });
    }

    const recoveryMessage = experienceId
      ? buildExperienceRecoveryMessage({
          req,
          shop,
          eventData: latestEventPayload || {},
          timestamp: latestEventAt,
          experienceId,
          tonePreset,
          channel: requestedChannel || (phone ? "sms" : "email"),
        })
      : generateRecoveryMessage({
          shop,
          eventData: latestEventPayload || {},
          timestamp: latestEventAt,
          baseUrl: resolveMerchantFacingBaseUrl(),
        });

    const deliveryAction = await prisma.systemEvent.create({
      data: {
        shopDomain: shop,
        eventType: "abando.recovery_action.v1",
        visibility: "merchant",
        payload: {
          recovery_id: null,
          status: "created",
          source: "live_test",
          createdAt: new Date().toISOString(),
          experienceId: experienceId || null,
          tone_preset: tonePreset,
          channel_requested: requestedChannel || null,
          checkout_id: checkoutId || null,
          checkout_session_id: checkoutSessionId || null,
          source_event_id: sourceEventId || null,
        },
      },
    });

    async function logDeliveryAttempt(channel, outcome, detail = {}) {
      await prisma.systemEvent.create({
        data: {
          shopDomain: shop,
          eventType: "abando.recovery_delivery.v1",
          visibility: "merchant",
          relatedJobId: deliveryAction.id,
          payload: {
            channel,
            outcome,
            at: new Date().toISOString(),
            ...detail,
          },
        },
      });
    }

    console.log("[recovery-send] before provider call", {
      shop,
      hasEmail: Boolean(email),
      hasPhone: Boolean(phone),
      experienceId: experienceId || null,
      tonePreset,
    });
    const sendResult = await executeRecoverySend({
      shop,
      email,
      phone,
      recoveryMessage,
      actionId: deliveryAction.id,
      testMode: true,
      logDeliveryAttempt,
    });
    console.log("[recovery-send] after provider call", {
      shop,
      successfulChannels: sendResult.successfulChannels,
      failedChannels: sendResult.failedChannels,
      status: sendResult.status,
      sendError: sendResult.sendError,
    });

    const timestamp = new Date().toISOString();
    const summary = summarizeSendResult(sendResult);
    const liveTestActionStatus = summary.success ? "sent" : "created";
    await prisma.systemEvent.update({
      where: { id: deliveryAction.id },
      data: {
        payload: {
          recovery_id: deliveryAction.id,
          status: liveTestActionStatus,
          source: "live_test",
          createdAt: deliveryAction.payload?.createdAt || new Date().toISOString(),
          experienceId: experienceId || null,
          tone_preset: tonePreset,
          channel_requested: requestedChannel || null,
          checkout_id: checkoutId || null,
          checkout_session_id: checkoutSessionId || null,
          source_event_id: sourceEventId || null,
          channel: summary.channels[0] || null,
          channels: sendResult.successfulChannels,
          delivery: sendResult.delivery,
          messageId: sendResult.messageId,
          smsSid: sendResult.smsSid,
          smsStatus: sendResult.smsStatus,
          twilioMessage: sendResult.twilioMessage,
          twilioInterpretation: sendResult.twilioInterpretation,
          sentAt: sendResult.sentAt || null,
          attemptedRealSend: sendResult.successfulChannels.length > 0 || sendResult.failedChannels.length > 0,
          lastError: sendResult.sendError || null,
        },
      },
    });
    const proofLoop = summary.success
      ? await recordProofLoopSend({
        shop,
        experienceId,
        channel: summary.channels[0] || "",
        sendTimestamp: timestamp,
        sendStatus: "sent",
        deliveryStatus: "sent_confirmed",
        valueEstimate: 0,
        source: "live",
        variantId,
        messageAngle,
        tonePreset,
        leadDomain,
        leadSegmentKey: String(assignedVariant?.lead_segment_key || ""),
        providerStatus: sendResult.smsStatus || "",
        providerAccepted: summary.channels[0] === "sms" ? Boolean(sendResult.smsSid) : Boolean(sendResult.messageId),
        twilioMessage: sendResult.twilioMessage || null,
        twilioInterpretation: sendResult.twilioInterpretation || null,
      })
      : null;
    await generateMessagePerformanceSummary();
    await persistExperienceSendRecords({
      shop,
      experienceId,
      sendResult,
      proofLoopId: proofLoop?.loop_id || "",
      tonePreset,
      recoveryId: deliveryAction.id,
      recoveryActionId: deliveryAction.id,
      checkoutId,
      checkoutSessionId,
      sourceEventId,
    });

    if (summary.success) {
      await prisma.systemEvent.create({
        data: {
          shopDomain: shop,
          eventType: "abando.recovery_sent.v1",
          visibility: "merchant",
          relatedJobId: deliveryAction.id,
          payload: {
            shop,
            recovery_id: deliveryAction.id,
            recovery_action_id: deliveryAction.id,
            experienceId: experienceId || null,
            checkout_id: checkoutId || null,
            checkout_session_id: checkoutSessionId || null,
            channel: summary.channels[0] || null,
            target: summary.channels[0] === "sms" ? phone || null : email || null,
            sent_at: timestamp,
            provider_accepted: summary.channels[0] === "sms"
              ? Boolean(sendResult.smsSid)
              : Boolean(sendResult.messageId),
            message_id: sendResult.messageId || null,
            sms_sid: sendResult.smsSid || null,
            proofLoopId: proofLoop?.loop_id || null,
          },
        },
      });

      await persistRecoveryAttributionFromSend(prisma, {
        recovery_id: deliveryAction.id,
        recovery_action_id: deliveryAction.id,
        experienceId,
        proof_loop_id: proofLoop?.loop_id || "",
        shop,
        checkout_id: checkoutId,
        checkout_session_id: checkoutSessionId,
        source_event_id: sourceEventId,
        channel: summary.channels[0] || "",
        target: summary.channels[0] === "sms" ? phone || "" : email || "",
        sent_at: timestamp,
        provider_message_id: sendResult.messageId || "",
        provider_sms_sid: sendResult.smsSid || "",
      }).catch(() => {});
    }

    await prisma.systemEvent.create({
      data: {
        shopDomain: shop,
        eventType: "abando.live_test_send.v1",
        visibility: "merchant",
        payload: {
          shop,
          actionId: deliveryAction.id,
          experienceId: experienceId || null,
          proofLoopId: proofLoop?.loop_id || null,
          variant_id: variantId,
          message_angle: messageAngle,
          tone_preset: tonePreset,
          channel_requested: requestedChannel || null,
          lead_domain: leadDomain || null,
          experiment_name: assignedVariant?.experiment_name || experimentStatus?.active_experiment?.name || null,
          experiment_active: Boolean(experimentStatus?.active),
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
          smsStatus: sendResult.smsStatus,
          twilioMessage: sendResult.twilioMessage,
          twilioInterpretation: sendResult.twilioInterpretation,
        },
      },
    });

    if (!summary.success) {
      return res.status(502).json({
        ok: false,
        error: "Send failed",
        provider: sendResult.failedChannels.includes("email") ? "smtp" : (sendResult.failedChannels.includes("sms") ? "twilio" : ""),
        details: sendResult.sendError || "provider_send_failed",
        channels: summary.channels,
        failedChannels: sendResult.failedChannels,
        experienceId: experienceId || null,
        proofLoopId: proofLoop?.loop_id || null,
        variant_id: variantId,
        message_angle: messageAngle,
        tone_preset: tonePreset,
        lead_domain: leadDomain || null,
        experiment_name: assignedVariant?.experiment_name || experimentStatus?.active_experiment?.name || null,
        experiment_active: Boolean(experimentStatus?.active),
        providerStatuses: summary.providerStatuses,
        missingEnvVars: summary.missingEnvVars,
        messageId: sendResult.messageId,
        smsSid: sendResult.smsSid,
        smsStatus: sendResult.smsStatus,
        twilioMessage: sendResult.twilioMessage,
        twilioInterpretation: sendResult.twilioInterpretation,
        delivery: sendResult.delivery,
        timestamp,
      });
    }

    return res.json({
      ok: true,
      sent: true,
      channel: summary.channels[0] || "",
      provider: summary.channels[0] === "email" ? "smtp" : (summary.channels[0] === "sms" ? "twilio" : ""),
      status: "sent",
      sender: resolveFromEmail(),
      sender_branded: resolveFromEmail() === "hello@abando.ai",
      subject: recoveryMessage.emailSubject,
      failedChannels: sendResult.failedChannels,
      experienceId: experienceId || null,
      proofLoopId: proofLoop?.loop_id || null,
      variant_id: variantId,
      message_angle: messageAngle,
      tone_preset: tonePreset,
      channel_requested: requestedChannel || null,
      lead_domain: leadDomain || null,
      experiment_name: assignedVariant?.experiment_name || experimentStatus?.active_experiment?.name || null,
      experiment_active: Boolean(experimentStatus?.active),
      providerStatuses: summary.providerStatuses,
      missingEnvVars: summary.missingEnvVars,
      messageId: sendResult.messageId,
      smsSid: sendResult.smsSid,
      smsStatus: sendResult.smsStatus,
      twilioMessage: sendResult.twilioMessage,
      twilioInterpretation: sendResult.twilioInterpretation,
      delivery: sendResult.delivery,
      checkout_source: String(latestEventPayload?.source || "").trim().toLowerCase() || null,
      checkout_id: checkoutId || null,
      checkout_session_id: checkoutSessionId || null,
      checkout_resume_url: checkoutVerification.finalUrl || checkoutResumeUrl || null,
      recoveryLink: recoveryMessage.returnLink || null,
      ...buildExperienceFlowUrls({
        req,
        shop,
        experienceId,
        channel: summary.channels[0] || requestedChannel || "email",
      }),
      timestamp,
    });
  } catch (error) {
    logRecoverySendLifecycle("send failed", {
      route: "/api/recovery-actions/send-live-test",
      error: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      provider: "",
      details: error instanceof Error ? error.stack || error.message : String(error),
    });
  }
});

app.get("/api/recovery-actions/email-readiness", (_req, res) => {
  const readiness = getEmailReadiness();
  const configured = readiness.ready;
  const missingEnvVars = readiness.missing;

  return res.json({
    ok: true,
    ready: configured,
    missing: missingEnvVars,
    email: {
      configured,
      missingEnvVars,
      sender: readiness.sender || resolveFromEmail(),
      sender_branded: resolveFromEmail() === "hello@abando.ai",
    },
  });
});

app.get("/api/experience/status", async (req, res) => {
  try {
    let shop = normalizeShop(String(req.query?.shop || "").trim().toLowerCase());
    const experienceId = normalizeExperienceId(req.query?.eid);

    if (!shop && experienceId) {
      shop = await findShopForExperienceId(experienceId);
    }

    if (!shop) {
      return res.status(400).json({ ok: false, error: "missing_shop" });
    }

    const status = await getExperienceStatus(shop, experienceId);
    const publicStatus = buildPublicExperienceStatus(status);

    if (publicStatus.purchased) {
      console.log(`[PURCHASE] matched to experienceId=${experienceId || "unknown"}`, {
        shop,
        revenue: publicStatus.revenue,
        returnedAt: publicStatus.returnedAt,
      });
      if (publicStatus.revenue !== null) {
        console.log(`[RECOVERED] revenue=${publicStatus.revenue}`, {
          shop,
          experienceId: experienceId || null,
          channel: publicStatus.channel,
        });
      }
    }

    return res.json({
      ok: true,
      shop,
      experienceId: experienceId || null,
      ...publicStatus,
      ...status,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.get("/api/billing/readiness", async (req, res) => {
  try {
    const shop = normalizeStoreInput(String(req.query?.shop || "").trim().toLowerCase());
    const runtime = getBillingRuntimeReadiness();
    const billingState = shop ? await getLatestMerchantBillingState(shop) : null;
    const merchantPayingNow = Boolean(
      billingState && (billingState.billing_status === "active" || billingState.billing_status === "trialing"),
    );
    const failingComponents = [
      runtime.stripe_configured ? "" : "stripe_configured",
      runtime.price_ids_present ? "" : "price_ids_present",
      runtime.billing_route_active ? "" : "billing_route_active",
      runtime.persistence_wired ? "" : "persistence_wired",
      merchantPayingNow || !shop ? "" : "merchant_paying_now",
    ].filter(Boolean);

    return res.json({
      ok: true,
      shop: shop || null,
      canonical_billing_start_route: runtime.canonical_billing_path,
      stripe_configured: runtime.stripe_configured,
      price_ids_present: runtime.price_ids_present,
      billing_route_active: runtime.billing_route_active,
      persistence_wired: runtime.persistence_wired,
      payout_destination: runtime.payout_destination,
      current_billing_state: billingState,
      collectable_now: Boolean(runtime.billing_route_active),
      merchant_paying_now: merchantPayingNow,
      failing_components: failingComponents,
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

    await prisma.systemEvent.create({
      data: {
        shopDomain: parsed.shop,
        eventType: "abando.recovery_returned.v1",
        visibility: "merchant",
        payload: {
          shop: parsed.shop,
          returned_at: timestamp,
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
    let shop = normalizeShop(String(req.query?.shop || "").trim().toLowerCase());
    const experienceId = normalizeExperienceId(req.query?.eid);
    const requestedChannel = String(req.query?.channel || "").trim().toLowerCase();

    if (!shop && experienceId) {
      shop = await findShopForExperienceId(experienceId);
    }

    if (!shop) {
      return res.status(400).type("html").send("<h1>Missing shop</h1>");
    }

    if (!experienceId) {
      return res.status(400).type("html").send("<h1>Missing experience id</h1>");
    }

    const events = await listExperienceSendEvents(shop, experienceId);
    const normalizedRequestedChannel = ["email", "sms"].includes(requestedChannel) ? requestedChannel : "";
    const matchingEvent = events.find((event) => {
      const payload = event?.payload;
      return payload
        && typeof payload === "object"
        && (
          !normalizedRequestedChannel
          || String(payload.channel || "").toLowerCase() === normalizedRequestedChannel
        );
    });

    if (!matchingEvent) {
      return res.status(404).type("html").send("<h1>Recovery send not found</h1>");
    }

    const payload = matchingEvent.payload && typeof matchingEvent.payload === "object"
      ? matchingEvent.payload
      : {};
    const channel = String(payload.channel || normalizedRequestedChannel || "").toLowerCase();
    if (!["email", "sms"].includes(channel)) {
      return res.status(400).type("html").send("<h1>Invalid channel</h1>");
    }
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

    await persistRecoveryAttributionFromReturn(prisma, {
      recovery_id: String(payload.recovery_id || matchingEvent.id || ""),
      recovery_action_id: String(payload.recovery_action_id || ""),
      proof_loop_id: String(payload.proofLoopId || ""),
      experienceId,
      shop,
      checkout_id: String(payload.checkout_id || ""),
      checkout_session_id: String(payload.checkout_session_id || ""),
      source_event_id: String(payload.source_event_id || ""),
      channel,
      target: String(payload.target || ""),
      sent_at: String(payload.sentAt || ""),
      return_clicked_at: returnedAt,
      provider_message_id: String(payload.providerId || ""),
      provider_sms_sid: String(payload.smsSid || ""),
    }).catch(() => {});

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

    await prisma.systemEvent.create({
      data: {
        shopDomain: shop,
        eventType: "abando.recovery_returned.v1",
        visibility: "merchant",
        payload: {
          shop,
          returned_at: returnedAt,
          source: "recovery_link",
          experienceId,
          channel,
        },
      },
    });

    const proofLoop = await findProofLoopForExperience({
      shop,
      experienceId,
      channel,
    });
    if (proofLoop?.loop_id) {
      const recoveredValue = await resolveExperienceRecoveredValue({ shop, experienceId });
      await updateProofLoopRecord(proofLoop.loop_id, (current) => ({
        ...current,
        return_detected: true,
        return_timestamp: returnedAt,
        value_estimate: Number(recoveredValue?.cents || current?.value_estimate || 0),
        verified: Boolean(current?.send_timestamp),
        }));
    }

    const latestCheckoutStartedEvent = await findLatestCheckoutStartedEvent(shop, {
      requireRealStorefront: false,
      allowPreCheckoutIntent: true,
    });
    const latestCheckoutPayload = latestCheckoutStartedEvent?.payload && typeof latestCheckoutStartedEvent.payload === "object"
      ? latestCheckoutStartedEvent.payload
      : {};
    const checkoutContext = resolveCheckoutContextFromEventPayload({
      ...latestCheckoutPayload,
      checkout_id: String(payload.checkout_id || latestCheckoutPayload.checkout_id || latestCheckoutPayload.checkoutId || ""),
      checkout_session_id: String(payload.checkout_session_id || latestCheckoutPayload.checkout_session_id || latestCheckoutPayload.session_id || ""),
    }, experienceId);
    const checkoutResumeUrl = buildShopifyCheckoutResumeUrl({
      shop,
      checkoutId: checkoutContext.checkoutId,
      checkoutPath: checkoutContext.checkoutPath,
      storefrontHost: checkoutContext.storefrontHost,
    });
    const returnedUrl = `${resolveMerchantFacingBaseUrl()}/experience/returned?shop=${encodeURIComponent(shop)}&eid=${encodeURIComponent(experienceId)}`;

    console.log("[RETURN] user returned via recovery link", {
      shop,
      experienceId,
      channel,
      returnedAt,
      redirectTo: checkoutResumeUrl || returnedUrl,
    });
    console.log(`[RETURN] experienceId=${experienceId}`, {
      shop,
      channel,
      returnedAt,
    });

    return res.redirect(302, checkoutResumeUrl || returnedUrl);
  } catch (error) {
    return res.status(400).type("html").send(`<h1>${escapeHtml(error instanceof Error ? error.message : String(error))}</h1>`);
  }
});

app.get("/recover/:token", async (req, res) => {
  try {
    const token = String(req.params?.token || "").trim();
    const parsed = parseRecoveryToken(token);
    const shop = normalizeShop(String(parsed?.shop || "").trim().toLowerCase());
    const experienceId = normalizeExperienceId(parsed?.experienceId);
    const timestamp = new Date().toISOString();

    await prisma.systemEvent.create({
      data: {
        shopDomain: shop,
        eventType: "abando.customer_return.v1",
        visibility: "merchant",
        payload: {
          shop,
          timestamp,
          source: "recovery_link",
          token,
          experienceId: experienceId || null,
        },
      },
    });

    await prisma.systemEvent.create({
      data: {
        shopDomain: shop,
        eventType: "abando.recovery_returned.v1",
        visibility: "merchant",
        payload: {
          shop,
          returned_at: timestamp,
          source: "recovery_link",
          token,
          experienceId: experienceId || null,
        },
      },
    });

    if (shop && experienceId) {
      const events = await listExperienceSendEvents(shop, experienceId);
      const matchingEvent = events.find((event) => {
        const payload = event?.payload;
        if (!payload || typeof payload !== "object") return false;
        const payloadCheckoutId = String(payload.checkout_id || "").trim();
        const payloadCheckoutSessionId = String(payload.checkout_session_id || "").trim();
        return (
          (parsed.checkout_id && payloadCheckoutId === String(parsed.checkout_id))
          || (parsed.checkout_session_id && payloadCheckoutSessionId === String(parsed.checkout_session_id))
        );
      }) || events[0] || null;

      if (matchingEvent) {
        const payload = matchingEvent.payload && typeof matchingEvent.payload === "object"
          ? matchingEvent.payload
          : {};

        await prisma.systemEvent.update({
          where: { id: matchingEvent.id },
          data: {
            payload: {
              ...payload,
              returned: true,
              returnedAt: timestamp,
            },
          },
        }).catch(() => {});

        await persistRecoveryAttributionFromReturn(prisma, {
          recovery_id: String(payload.recovery_id || matchingEvent.id || ""),
          recovery_action_id: String(payload.recovery_action_id || ""),
          proof_loop_id: String(payload.proofLoopId || ""),
          experienceId,
          shop,
          checkout_id: String(parsed.checkout_id || payload.checkout_id || ""),
          checkout_session_id: String(parsed.checkout_session_id || payload.checkout_session_id || ""),
          source_event_id: String(payload.source_event_id || ""),
          channel: String(payload.channel || ""),
          target: String(payload.target || parsed.customer_email || ""),
          sent_at: String(payload.sentAt || ""),
          return_clicked_at: timestamp,
          provider_message_id: String(payload.providerId || ""),
          provider_sms_sid: String(payload.smsSid || ""),
        }).catch(() => {});
      }

      const proofLoop = await findProofLoopForExperience({
        shop,
        experienceId,
        channel: "",
      });
      if (proofLoop?.loop_id) {
        const recoveredValue = await resolveExperienceRecoveredValue({ shop, experienceId });
        await updateProofLoopRecord(proofLoop.loop_id, (current) => ({
          ...current,
          return_detected: true,
          return_timestamp: timestamp,
          value_estimate: Number(recoveredValue?.cents || current?.value_estimate || 0),
          verified: true,
        }));
      }
    }

    const checkoutResumeUrl = buildShopifyCheckoutResumeUrl({
      shop,
      checkoutId: String(parsed.checkout_id || "").trim(),
      checkoutPath: String(parsed.checkout_path || "").trim(),
      storefrontHost: String(parsed.storefront_host || "").trim(),
    });
    if (checkoutResumeUrl) {
      return res.redirect(302, checkoutResumeUrl);
    }

    if (shop && experienceId) {
      return res.redirect(
        302,
        `${resolveMerchantFacingBaseUrl()}/experience/returned?shop=${encodeURIComponent(shop)}&eid=${encodeURIComponent(experienceId)}`,
      );
    }

    return res.redirect(
      302,
      `/checkout-placeholder?shop=${encodeURIComponent(shop)}&source=recovery_link`,
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
  const connectionState = typeof req.query?.state === "string" ? req.query.state.trim().toLowerCase() : "";
  const billingRuntime = getBillingRuntimeReadiness();
  const latestBillingState = shop ? await getLatestMerchantBillingState(shop) : null;
  const billingAvailable = Boolean(billingRuntime.billing_route_active);
  const billingActive = Boolean(
    latestBillingState
    && (latestBillingState.billing_status === "active" || latestBillingState.billing_status === "trialing")
  );
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
      connectionState,
      billingAvailable,
      billingActive,
    }),
  );
});

app.get("/experience/returned", async (req, res) => {
  const shop = normalizeShop(String(req.query?.shop || "").trim().toLowerCase());
  const experienceId = normalizeExperienceId(req.query?.eid);
  if (shop && experienceId) {
    const proofLoop = await findProofLoopForExperience({
      shop,
      experienceId,
    });
    if (proofLoop?.loop_id) {
      await updateProofLoopRecord(proofLoop.loop_id, (current) => ({
        ...current,
        install_status: current?.install_status === "completed" ? "completed" : "started",
        install_timestamp: current?.install_timestamp || new Date().toISOString(),
      }));
    }
  }
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
  const recoveredValue = await resolveExperienceRecoveredValue({
    shop,
    experienceId,
  });

  return res.status(200).type("html").send(
    renderExperienceReturnedPage({
      shop,
      experienceId,
      experienceStatus,
      recoveredValue,
    }),
  );
});

app.get("/audit", (_req, res) => {
  return res.redirect(302, "/shopifixer/audit");
});

app.get("/shopifixer", (_req, res) => {
  return res.redirect(302, "/shopifixer/audit");
});

app.get("/shopifixer/audit", (_req, res) => {
  return res.status(200).type("html").send(renderAuditPage());
});

app.get("/merchant", async (req, res) => {
  const requestedShop = normalizeStoreInput(String(req.query?.shop || "").trim().toLowerCase());
  const merchantState = await getMerchantSurfaceState(requestedShop || "mvp-demo-proof.myshopify.com");
  return res.status(200).type("html").send(renderMerchantPage(merchantState));
});

app.get("/leads", async (_req, res) => {
  const leadsState = await getLeadsCommandCenterState();
  return res.status(200).type("html").send(renderLeadsPage(leadsState));
});

app.get("/api/operator/leads", async (_req, res) => {
  try {
    const rows = await getOperatorLeadsState();
    return res.json(rows.map((row) => ({
      shop: row.shop,
      installed_at: row.installed_at,
      recovery_sent: row.recovery_sent,
      return_detected: row.return_detected,
      billing_clicked: row.billing_clicked,
      billing_active: row.billing_active,
      last_event_at: row.last_event_at,
      lead_score: row.lead_score,
    })));
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.get("/operator/leads", async (_req, res) => {
  const rows = await getOperatorLeadsState();
  return res.status(200).type("html").send(renderOperatorLeadsPage(rows));
});

app.get("/outreach", async (_req, res) => {
  const outreachState = await getOutreachCommandCenterState();
  return res.status(200).type("html").send(renderOutreachPage(outreachState));
});

app.get("/contact-research", async (_req, res) => {
  const researchState = await getContactResearchCommandCenterState();
  return res.status(200).type("html").send(renderContactResearchPage(researchState));
});

app.get("/proof", async (req, res) => {
  const requestedShop = normalizeStoreInput(String(req.query?.shop || "").trim().toLowerCase());
  const source = String(req.query?.src || req.query?.source || "").trim();
  const target = String(req.query?.target || req.query?.domain || "").trim();
  const plan = String(req.query?.plan || "").trim().toLowerCase();
  const flow = String(req.query?.flow || "").trim().toLowerCase();
  const state = String(req.query?.state || "").trim().toLowerCase();
  const shop = requestedShop || (flow === "demo" ? ABANDO_PUBLIC_DEMO_SHOP : "");
  const experienceId = normalizeExperienceId(req.query?.eid) || (flow === "demo" ? "proof-demo" : "");
  let summary = buildAbandoMerchantSummaryResponse(null, { notes: [] });

  if (shop) {
    try {
      const dashboardSummary = await getDashboardSummary(prisma, shop);
      summary = buildAbandoMerchantSummaryResponse(dashboardSummary, { notes: [] });
    } catch (_error) {
      summary = buildAbandoMerchantSummaryResponse(null, { notes: [] });
    }
  }

  const recoveredValue = state === "recovered"
    ? await resolveExperienceRecoveredValue({ shop, experienceId })
    : null;

  return res.status(200).type("html").send(renderProofPage({
    shop,
    summary,
    source,
    target,
    plan,
    flow,
    state,
    recoveredValue,
  }));
});

app.get("/proof/leak", async (req, res) => {
  const shop = normalizeStoreInput(String(req.query?.shop || "").trim().toLowerCase());
  const emailReadiness = getEmailReadiness();
  let summary = buildAbandoMerchantSummaryResponse(null, { notes: [] });

  if (shop) {
    try {
      const dashboardSummary = await getDashboardSummary(prisma, shop);
      summary = buildAbandoMerchantSummaryResponse(dashboardSummary, { notes: [] });
    } catch (_error) {
      summary = buildAbandoMerchantSummaryResponse(null, { notes: [] });
    }
  }

  console.log("[PROOF] leak map viewed", {
    shop: shop || null,
    status: summary?.status || null,
    eventCount: Number(summary?.eventCount || 0),
  });

  return res.status(200).type("html").send(renderProofLeakPage({
    shop,
    summary,
    emailReadiness,
  }));
});

app.get("/proof/recovery", async (req, res) => {
  const requestedShop = normalizeStoreInput(String(req.query?.shop || "").trim().toLowerCase());
  const experienceId = normalizeExperienceId(req.query?.eid);
  const shop = requestedShop || await findShopForExperienceId(experienceId);

  if (!experienceId) {
    return res.status(400).type("html").send("<h1>Missing experience id</h1>");
  }

  if (!shop) {
    return res.status(404).type("html").send("<h1>Recovery proof not found</h1>");
  }

  const status = await getExperienceStatus(shop, experienceId);
  const publicStatus = buildPublicExperienceStatus(status);

  console.log("[PROOF] recovery receipt viewed", {
    shop,
    experienceId,
    returned: publicStatus.returned,
    purchased: publicStatus.purchased,
    revenue: publicStatus.revenue,
  });

  return res.status(200).type("html").send(renderProofRecoveryPage({
    shop,
    experienceId,
    publicStatus,
  }));
});

app.get("/proof/payment", async (req, res) => {
  const shop = normalizeStoreInput(String(req.query?.shop || "").trim().toLowerCase());
  const source = String(req.query?.src || req.query?.source || "proof").trim() || "proof";
  const target = String(req.query?.target || req.query?.domain || shop || "").trim();
  const plan = String(req.query?.plan || "starter").trim().toLowerCase() === "pro" ? "pro" : "starter";
  const directPaymentUrl = getDirectPaymentUrl();
  const priceIds = getStripePriceIds();
  const experienceId = normalizeExperienceId(req.query?.eid);
  const logBillingStarted = async (extra = {}) => {
    if (!(shop && source === "connected_experience")) return;
    await prisma.systemEvent.create({
      data: {
        shopDomain: shop,
        eventType: "abando.billing_started.v1",
        visibility: "merchant",
        payload: {
          shop,
          source,
          target,
          plan,
          experienceId: experienceId || null,
          started_at: new Date().toISOString(),
          ...extra,
        },
      },
    }).catch(() => {});
  };

  if (shop && source === "connected_experience") {
    const status = await getExperienceStatus(shop, experienceId);
    const proofComplete = Boolean(
      status?.loop?.recovery_sent
      || status?.loop?.return_detected,
    );

    if (!proofComplete) {
      const params = new URLSearchParams({ shop, state: "connected" });
      if (experienceId) params.set("eid", experienceId);
      return res.redirect(`/experience?${params.toString()}`);
    }
  }

  if (shop && source === "connected_experience") {
    await prisma.systemEvent.create({
      data: {
        shopDomain: shop,
        eventType: "abando.billing_click.v1",
        visibility: "merchant",
        payload: {
          shop,
          source,
          target,
          plan,
          clicked_at: new Date().toISOString(),
        },
      },
    }).catch(() => {});
  }

  if (directPaymentUrl) {
    try {
      const url = new URL(directPaymentUrl);
      if (shop) url.searchParams.set("shop", shop);
      if (source) url.searchParams.set("src", source);
      if (target) url.searchParams.set("target", target);
      url.searchParams.set("plan", plan);
      await logBillingStarted({
        route: "direct_payment_url",
        destination: url.toString(),
      });
      return res.redirect(url.toString());
    } catch {
      await logBillingStarted({
        route: "direct_payment_url",
        destination: directPaymentUrl,
      });
      return res.redirect(directPaymentUrl);
    }
  }

  if (!stripe) {
    if (source === "connected_experience") {
      const params = new URLSearchParams({ shop, state: "connected" });
      if (experienceId) params.set("eid", experienceId);
      return res.redirect(`/experience?${params.toString()}`);
    }
    return res.redirect(`/proof?shop=${encodeURIComponent(shop)}&src=${encodeURIComponent(source)}&target=${encodeURIComponent(target)}&plan=${encodeURIComponent(plan)}`);
  }

  const price = plan === "pro" ? priceIds.pro : priceIds.starter;
  if (!price) {
    if (source === "connected_experience") {
      const params = new URLSearchParams({ shop, state: "connected" });
      if (experienceId) params.set("eid", experienceId);
      return res.redirect(`/experience?${params.toString()}`);
    }
    return res.redirect(`/proof?shop=${encodeURIComponent(shop)}&src=${encodeURIComponent(source)}&target=${encodeURIComponent(target)}&plan=${encodeURIComponent(plan)}`);
  }

  try {
    const baseUrl = resolveMerchantFacingBaseUrl();
    const completeParams = new URLSearchParams({
      shop,
      src: source,
      target,
      plan,
      session_id: "{CHECKOUT_SESSION_ID}",
    });
    if (experienceId) completeParams.set("eid", experienceId);
    const cancelConnectedUrl = `${baseUrl}/experience?shop=${encodeURIComponent(shop)}&state=connected`;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      success_url: `${baseUrl}/billing/complete?${completeParams.toString()}`,
      cancel_url: source === "connected_experience"
        ? cancelConnectedUrl
        : `${baseUrl}/proof?shop=${encodeURIComponent(shop)}&src=${encodeURIComponent(source)}&target=${encodeURIComponent(target)}&plan=${encodeURIComponent(plan)}`,
      metadata: {
        source,
        target,
        shop,
        plan,
      },
    });

    if (session?.url) {
      await logBillingStarted({
        route: "/proof/payment",
        checkout_session_id: session.id || null,
        destination: session.url,
      });
      return res.redirect(session.url);
    }
  } catch (error) {
    console.error("[proof payment] checkout error", {
      shop,
      source,
      target,
      plan,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return res.redirect(`/proof?shop=${encodeURIComponent(shop)}&src=${encodeURIComponent(source)}&target=${encodeURIComponent(target)}&plan=${encodeURIComponent(plan)}`);
});

app.get("/billing/complete", async (req, res) => {
  const shop = normalizeStoreInput(String(req.query?.shop || "").trim().toLowerCase());
  const source = String(req.query?.src || req.query?.source || "connected_experience").trim() || "connected_experience";
  const target = String(req.query?.target || req.query?.domain || shop || "").trim();
  const plan = String(req.query?.plan || "starter").trim().toLowerCase() === "pro" ? "pro" : "starter";
  const sessionId = String(req.query?.session_id || "").trim();
  const experienceId = normalizeExperienceId(req.query?.eid);

  if (!shop || !sessionId || !stripe) {
    const params = new URLSearchParams({ shop, state: "connected" });
    if (experienceId) params.set("eid", experienceId);
    return res.redirect(`/experience?${params.toString()}`);
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });
    const persistedState = await persistMerchantBillingState({
      shop,
      plan,
      source,
      session,
    });
    await prisma.systemEvent.create({
      data: {
        shopDomain: shop,
        eventType: "abando.billing_completed.v1",
        visibility: "merchant",
        payload: {
          shop,
          plan,
          source,
          experienceId: experienceId || null,
          completed_at: persistedState.checkout_completed_at || new Date().toISOString(),
          billing_status: persistedState.billing_status,
          payment_status: persistedState.payment_status,
          checkout_session_id: persistedState.checkout_session_id,
          stripe_subscription_id: persistedState.stripe_subscription_id,
        },
      },
    }).catch(() => {});
    const params = new URLSearchParams({ shop, state: "connected" });
    if (experienceId) params.set("eid", experienceId);
    return res.redirect(`/experience?${params.toString()}`);
  } catch (error) {
    console.error("[billing complete] session verification failed", {
      shop,
      source,
      target,
      plan,
      sessionId,
      error: error instanceof Error ? error.message : String(error),
    });
    const params = new URLSearchParams({ shop, state: "connected" });
    if (experienceId) params.set("eid", experienceId);
    return res.redirect(`/experience?${params.toString()}`);
  }
});

app.get("/acceptance", (req, res) => {
  const shop = normalizeStoreInput(String(req.query?.shop || "").trim().toLowerCase());
  const source = String(req.query?.src || req.query?.source || "proof").trim() || "proof";
  const target = String(req.query?.target || req.query?.domain || shop || "").trim();
  const plan = String(req.query?.plan || "").trim().toLowerCase();
  return res.status(200).type("html").send(renderAcceptancePage({
    shop,
    source,
    target,
    plan,
  }));
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

app.get("/", sendRootHtml);
app.get("/marketing", sendRootHtml);
app.use(express.static(publicDir, { redirect: false, index: false }));
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
const APP_URL            =
  process.env.APP_URL ||
  process.env.ABANDO_PUBLIC_APP_ORIGIN ||
  process.env.NEXT_PUBLIC_ABANDO_PUBLIC_APP_ORIGIN ||
  process.env.RENDER_EXTERNAL_URL ||
  "https://cart-agent-api.onrender.com";
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

const ABANDO_PUBLIC_DEMO_SHOP = "mvp-recovery-proof.myshopify.com";
const AUTO_RECOVERY_DELAY_MS = Math.max(2 * 60 * 1000, Number(process.env.ABANDO_AUTO_RECOVERY_DELAY_MS || 2 * 60 * 1000));
const AUTO_RECOVERY_SCAN_INTERVAL_MS = Math.max(30 * 1000, Number(process.env.ABANDO_AUTO_RECOVERY_SCAN_INTERVAL_MS || 60 * 1000));
const AUTO_RECOVERY_LOOKBACK_MS = 24 * 60 * 60 * 1000;
const autoRecoveryScanTimer = setInterval(() => {
  runAutomaticRecoveryScan().catch(() => {});
}, AUTO_RECOVERY_SCAN_INTERVAL_MS);
if (typeof autoRecoveryScanTimer.unref === "function") {
  autoRecoveryScanTimer.unref();
}

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
    checkout_id: String(
      input.checkout_id
      || input.checkoutId
      || input.checkout_token
      || input.metadata?.cartToken
      || session_id
    ).trim(),
    checkout_session_id: String(
      input.checkout_session_id
      || input.checkoutSessionId
      || input.checkout_token
      || session_id
    ).trim(),
    checkoutPath: String(
      input.checkoutPath
      || input.checkout_path
      || input.metadata?.path
      || ""
    ).trim(),
    storefrontHost: String(
      input.storefrontHost
      || input.storefront_host
      || input.metadata?.storefrontHost
      || input.metadata?.storefront_host
      || ""
    )
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .split("/")[0]
      .split("?")[0]
      .split("#")[0]
      .toLowerCase(),
    timestamp: new Date(parsedTimestamp).toISOString(),
    occurredAt: new Date(parsedTimestamp).toISOString(),
    event_type,
    stage,
    source,
    device_type,
    order_id: input.order_id ? String(input.order_id) : null,
    customerEmail: normalizeEmail(
      input.customerEmail
      || input.customer_email
      || input.email
      || input.metadata?.customerEmail
      || input.metadata?.customer_email
      || input.metadata?.email
      || "",
    ) || null,
    customerPhone: normalizePhone(
      input.customerPhone
      || input.customer_phone
      || input.phone
      || input.metadata?.customerPhone
      || input.metadata?.customer_phone
      || input.metadata?.phone
      || "",
    ) || null,
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
  connectionState,
  billingAvailable,
  billingActive,
}) {
  const isConnected = connectionState === "connected" && Boolean(shop);
  const effectiveExperienceId = experienceId || (isConnected && shop ? `connected-${shop.replace(/[^a-z0-9]+/gi, "-")}` : "");
  const hasParams = Boolean(shop && effectiveExperienceId);
  const billingStartUrl = shop ? toMerchantFacingUrl(buildCanonicalBillingStartPath({
    shop,
    source: "connected_experience",
    target: shop,
    plan: "starter",
    experienceId: effectiveExperienceId,
  })) : toMerchantFacingUrl("/proof/payment");
  const preferredChannel = experienceStatus?.latest_action?.channel === "sms" || experienceStatus?.send?.channel === "sms"
    ? "sms"
    : "email";
  const hasReturned = Boolean(experienceStatus?.return?.returned);
  const hasSent = experienceStatus?.send?.status === "sent";
  const hasDeduped = Boolean(experienceStatus?.latest_action?.deduped);
  const initialState = hasReturned
    ? "returned"
    : (hasDeduped || hasSent)
      ? "sent"
      : "idle";
  const operatorTestInbox = String(
    process.env.ABANDO_OPERATOR_TEST_EMAIL
    || process.env.OPERATOR_TEST_EMAIL
    || process.env.ABANDO_RECOVERY_TEST_EMAIL
    || "",
  ).trim();
  const billingButtonVisible = Boolean(isConnected && billingAvailable && !billingActive && (hasSent || hasReturned));
  const recoveredValueLabel = `Recovered revenue: ${formatUsdFromCents(experienceStatus?.return?.recoveredValue?.cents || 0)}`;
  const merchantState = billingActive
    ? "billing_active"
    : hasReturned
      ? "return_detected"
      : hasSent
        ? "recovery_sent"
        : isConnected
          ? "recovery_ready"
          : "connected";
  const heroEyebrow = billingActive
    ? "Billing active"
    : hasReturned
      ? "Return detected"
      : hasSent
        ? "Recovery sent"
        : isConnected
          ? "Connected to your store"
          : "Connected";
  const heroTitle = billingActive
    ? "Abando is now active on your store."
    : hasReturned
      ? "Recovered revenue is already showing."
      : hasSent
        ? "Your recovery is on the way."
        : "Connected to your store";
  const heroCopy = billingActive
    ? "Your paid plan is active and Abando is ready to keep recovering lost checkout revenue automatically."
    : hasReturned
      ? "You completed the return path successfully. This is the moment the loop becomes real for a merchant."
      : hasSent
        ? "Open the message you just sent to yourself and follow the recovery link to watch the loop complete."
        : "Send a recovery to yourself and watch the loop complete.";
  const supportHref = "mailto:hello@abando.ai";
  const clientSafeExperienceStatus = {
    send: experienceStatus?.send
      ? {
          status: experienceStatus.send.status || null,
          channel: experienceStatus.send.channel || null,
          target: experienceStatus.send.target || null,
          sentAt: experienceStatus.send.sentAt || null,
          smsStatus: experienceStatus.send.smsStatus || null,
        }
      : null,
    return: experienceStatus?.return
      ? {
          returned: Boolean(experienceStatus.return.returned),
          returnedAt: experienceStatus.return.returnedAt || null,
          recoveredValue: experienceStatus.return.recoveredValue
            ? { cents: Number(experienceStatus.return.recoveredValue.cents || 0) || 0 }
            : null,
        }
      : null,
    loop: experienceStatus?.loop
      ? {
          current_state: experienceStatus.loop.current_state || null,
          billing_available: Boolean(experienceStatus.loop.billing_available),
          billing_active: Boolean(experienceStatus.loop.billing_active),
        }
      : null,
    latest_action: experienceStatus?.latest_action
      ? {
          status: experienceStatus.latest_action.status || null,
          sentAt: experienceStatus.latest_action.sentAt || null,
          channel: experienceStatus.latest_action.channel || null,
          destination: experienceStatus.latest_action.destination || null,
          smsStatus: experienceStatus.latest_action.smsStatus || null,
          deduped: Boolean(experienceStatus.latest_action.deduped),
        }
      : null,
  };

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Abando</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background: radial-gradient(circle at top, rgba(34, 197, 94, 0.12), transparent 38%), #020617;
      color: #e5eef8;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      display: grid;
      place-items: center;
      padding: 28px 18px;
    }
    .shell { width: 100%; max-width: 460px; }
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
      background: rgba(15, 23, 42, 0.88);
      border: 1px solid rgba(148, 163, 184, 0.16);
      border-radius: 28px;
      padding: 30px 24px 24px;
      box-shadow: 0 28px 80px rgba(2, 6, 23, 0.42);
    }
    .eyebrow {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 32px;
      padding: 0 12px;
      border-radius: 999px;
      margin: 0 auto 16px;
      background: rgba(34, 197, 94, 0.12);
      border: 1px solid rgba(34, 197, 94, 0.24);
      color: #dcfce7;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
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
    .hero-card {
      margin-top: 22px;
      padding: 22px 20px;
      border-radius: 20px;
      background: rgba(2, 6, 23, 0.44);
      border: 1px solid rgba(148, 163, 184, 0.12);
      display: grid;
      gap: 10px;
      text-align: left;
    }
    .hero-status {
      color: #f8fafc;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .hero-headline {
      color: #f8fafc;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.05;
    }
    .hero-copy {
      color: #cbd5e1;
      font-size: 15px;
      line-height: 1.6;
    }
    .progress-strip {
      margin-top: 16px;
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 8px;
    }
    .progress-step {
      padding: 12px 10px;
      border-radius: 16px;
      background: rgba(15, 23, 42, 0.58);
      border: 1px solid rgba(148, 163, 184, 0.12);
      text-align: center;
    }
    .progress-step.active {
      border-color: rgba(34, 197, 94, 0.34);
      background: rgba(34, 197, 94, 0.12);
    }
    .progress-kicker {
      color: #94a3b8;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .progress-step.active .progress-kicker {
      color: #dcfce7;
    }
    .progress-label {
      margin-top: 6px;
      color: #e2e8f0;
      font-size: 12px;
      line-height: 1.35;
      font-weight: 700;
    }
    .section-label {
      display: block;
      margin-top: 28px;
      margin-bottom: 10px;
      color: #cbd5e1;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: -0.01em;
    }
    .label {
      display: block;
      margin: 0 0 10px;
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
    .input::placeholder { color: #64748b; }
    .input:focus {
      border-color: rgba(125, 211, 252, 0.5);
      box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.08);
    }
    .input-row { display: grid; gap: 12px; }
    .segmented-control {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      margin-top: 12px;
    }
    .segment-button {
      min-height: 48px;
      border-radius: 16px;
      border: 1px solid rgba(148, 163, 184, 0.18);
      background: rgba(2, 6, 23, 0.54);
      color: #cbd5e1;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }
    .segment-button.active {
      border-color: rgba(125, 211, 252, 0.6);
      background: rgba(15, 23, 42, 0.92);
      color: #f8fafc;
    }
    .field-block.hidden { display: none; }
    .input-helper {
      margin-top: 10px;
      color: #94a3b8;
      font-size: 13px;
      line-height: 1.5;
    }
    .input-error {
      margin-top: 10px;
      color: #fda4af;
      font-size: 13px;
      line-height: 1.5;
      display: none;
    }
    .input-error.active { display: block; }
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
    .button:disabled { opacity: 0.72; cursor: wait; }
    .button-secondary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      margin-top: 12px;
      min-height: 52px;
      border-radius: 16px;
      background: rgba(15, 23, 42, 0.7);
      color: #f8fafc;
      border: 1px solid rgba(148, 163, 184, 0.18);
      text-decoration: none;
      font: inherit;
      font-weight: 800;
      letter-spacing: -0.01em;
    }
    .button-secondary.hidden { display: none; }
    .next-steps {
      margin-top: 18px;
      padding: 16px;
      border-radius: 18px;
      background: rgba(15, 23, 42, 0.62);
      border: 1px solid rgba(148, 163, 184, 0.12);
    }
    .next-steps-title {
      color: #f8fafc;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .next-steps-list {
      margin: 12px 0 0;
      padding-left: 18px;
      color: #cbd5e1;
      font-size: 14px;
      line-height: 1.6;
      display: grid;
      gap: 6px;
    }
    .status {
      margin-top: 18px;
      padding: 18px 16px;
      border-radius: 20px;
      background: rgba(2, 6, 23, 0.44);
      border: 1px solid rgba(148, 163, 184, 0.12);
      display: none;
    }
    .status.active { display: block; }
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
    .status-meta {
      margin-top: 10px;
      color: #e2e8f0;
      font-size: 14px;
      line-height: 1.55;
    }
    .status-helper {
      margin-top: 10px;
      color: #94a3b8;
      font-size: 13px;
      line-height: 1.5;
    }
    .status.recovered .status-title { color: #dcfce7; }
    .status.billing .status-title { color: #dcfce7; }
    .value-line {
      margin-top: 10px;
      color: #f8fafc;
      font-size: 28px;
      font-weight: 900;
      letter-spacing: -0.04em;
    }
    .support-line {
      margin-top: 18px;
      text-align: center;
      color: #94a3b8;
      font-size: 13px;
      line-height: 1.5;
    }
    .support-line a {
      color: #e2e8f0;
      text-decoration: none;
      border-bottom: 1px solid rgba(226, 232, 240, 0.2);
    }
    .fineprint {
      margin-top: 12px;
      text-align: center;
      color: #64748b;
      font-size: 12px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <main class="shell">
    <div class="brand">${renderMerchantLogoMarkup({ href: resolveMerchantFacingBaseUrl() })}</div>
    <section class="panel">
      <div class="eyebrow">Live recovery</div>
      <h1>Recover lost revenue automatically.</h1>
      <p class="lede">Test it on yourself in seconds.</p>

      <div class="hero-card">
        <div class="hero-status">${escapeHtml(heroEyebrow)}</div>
        <div class="hero-headline">${escapeHtml(heroTitle)}</div>
        <div class="hero-copy">${escapeHtml(heroCopy)}</div>
        <div class="progress-strip">
          <div class="progress-step active">
            <div class="progress-kicker">Step 1</div>
            <div class="progress-label">Connected</div>
          </div>
          <div class="progress-step ${hasSent || hasReturned || billingActive ? "active" : ""}">
            <div class="progress-kicker">Step 2</div>
            <div class="progress-label">Recovery sent</div>
          </div>
          <div class="progress-step ${hasReturned || billingActive ? "active" : ""}">
            <div class="progress-kicker">Step 3</div>
            <div class="progress-label">Return detected</div>
          </div>
          <div class="progress-step ${billingActive ? "active" : ""}">
            <div class="progress-kicker">Step 4</div>
            <div class="progress-label">Paid plan</div>
          </div>
        </div>
      </div>

      <div class="section-label">Send a recovery to yourself</div>
      ${hasParams ? "" : `<div class="input-helper">Open this page from your connected store to send a live proof.</div>`}
      <div class="segmented-control">
        <button type="button" class="segment-button ${preferredChannel === "email" ? "active" : ""}" data-experience-channel="email" ${hasParams ? "" : "disabled"}>Email</button>
        <button type="button" class="segment-button ${preferredChannel === "sms" ? "active" : ""}" data-experience-channel="sms" ${hasParams ? "" : "disabled"}>SMS</button>
      </div>
      <div class="input-row" style="margin-top:12px;">
        <div class="field-block ${preferredChannel === "email" ? "" : "hidden"}" data-experience-field="email">
          <label class="label" for="experienceEmail">Email</label>
          <input id="experienceEmail" class="input" type="email" placeholder="you@example.com" value="${escapeHtml(operatorTestInbox)}" inputmode="email" autocomplete="email" ${hasParams ? "" : "disabled"} />
        </div>
        <div class="field-block ${preferredChannel === "sms" ? "" : "hidden"}" data-experience-field="sms">
          <label class="label" for="experiencePhone">Phone</label>
          <input id="experiencePhone" class="input" type="tel" placeholder="Enter your phone" inputmode="tel" autocomplete="tel" ${hasParams ? "" : "disabled"} />
        </div>
      </div>
      <div class="input-helper">Use your own inbox or phone so you can watch the recovery happen end to end.</div>
      <div class="input-helper">Once it sends, Abando keeps watching for the return automatically.</div>
      <div class="input-error" data-experience-input-error>Email is required.</div>
      <button type="button" class="button" id="experienceSendButton" ${hasParams ? "" : "disabled"}>Send recovery to myself</button>
      ${billingAvailable ? `<a class="button-secondary ${billingButtonVisible ? "" : "hidden"}" id="experienceBillingButton" href="${escapeHtml(billingStartUrl)}">Start paid plan</a>` : ""}

      <div class="next-steps">
        <div class="next-steps-title">What happens next</div>
        <ol class="next-steps-list">
          <li>Abando sends the recovery</li>
          <li>You open it like a customer would</li>
          <li>Abando detects the return and shows recovered revenue</li>
        </ol>
      </div>

      <div class="status ${initialState === "idle" ? "active" : ""}" data-experience-state="idle">
        <div class="status-title">${escapeHtml(isConnected ? "Recovery ready" : "Connected to your store")}</div>
        <div class="status-body">Everything is set for a live self-test. Send a recovery to yourself to confirm the full loop on this store.</div>
      </div>

      <div class="status" data-experience-state="prepared">
        <div class="status-title">Sending...</div>
        <div class="status-body">Abando is sending your live recovery now.</div>
      </div>

      <div class="status ${hasSent && !hasReturned ? "active" : ""}" data-experience-state="sent">
        <div class="status-title">Recovery sent</div>
        <div class="status-body">Your recovery is out. Open the message and follow the link the way a shopper would.</div>
        <div class="status-meta" data-experience-sent-meta></div>
        <div class="status-helper" data-experience-next-step></div>
      </div>

      <div class="status recovered ${hasReturned ? "active" : ""}" data-experience-state="returned">
        <div class="status-title">Return detected</div>
        <div class="status-body">Abando detected the return and attributed the recovered revenue to this flow.</div>
        <div class="value-line" data-experience-recovered-value>${escapeHtml(recoveredValueLabel)}</div>
      </div>

      <div class="status billing ${billingButtonVisible ? "active" : ""}" data-experience-state="billing-available">
        <div class="status-title">Start paid plan</div>
        <div class="status-body">You’ve verified the recovery loop on your own store. You can start your paid plan whenever you’re ready.</div>
      </div>

      <div class="status billing ${billingActive ? "active" : ""}" data-experience-state="billing-active">
        <div class="status-title">Billing active</div>
        <div class="status-body">Your paid plan is active and Abando is ready to keep recovering lost checkout revenue automatically.</div>
      </div>

      <div class="support-line">Need help? <a href="${escapeHtml(supportHref)}">hello@abando.ai</a></div>
      <div class="fineprint">Abando catches revenue before it slips away and brings the customer back automatically.</div>
    </section>
  </main>
  <script>
    (function () {
      var shop = ${JSON.stringify(shop)};
      var experienceId = ${JSON.stringify(effectiveExperienceId)};
      var initialExperienceStatus = ${JSON.stringify(clientSafeExperienceStatus)};
      var pollTimer = null;

      function setActiveState(next) {
        document.querySelectorAll("[data-experience-state]").forEach(function (node) {
          var state = node.getAttribute("data-experience-state");
          var isActive = state === next;
          node.classList.toggle("active", isActive);
        });
      }

      var button = document.getElementById("experienceSendButton");
      var billingButton = document.getElementById("experienceBillingButton");
      var emailInput = document.getElementById("experienceEmail");
      var phoneInput = document.getElementById("experiencePhone");
      var channelButtons = document.querySelectorAll("[data-experience-channel]");
      var emailField = document.querySelector("[data-experience-field='email']");
      var smsField = document.querySelector("[data-experience-field='sms']");
      var selectedChannel = ${JSON.stringify(preferredChannel)};
      var sentMeta = document.querySelector("[data-experience-sent-meta]");
      var nextStep = document.querySelector("[data-experience-next-step]");
      var recoveredValueNode = document.querySelector("[data-experience-recovered-value]");
      var inputError = document.querySelector("[data-experience-input-error]");
      var merchantState = ${JSON.stringify(merchantState)};

      function setBillingVisibility(visible) {
        if (!billingButton) return;
        billingButton.classList.toggle("hidden", !visible);
      }

      function clearInlineError() {
        if (inputError) {
          inputError.textContent = "Email is required.";
          inputError.classList.remove("active");
        }
      }

      function setInlineError(message) {
        if (inputError) {
          inputError.textContent = message;
          inputError.classList.add("active");
        }
      }

      function normalizePhone(raw) {
        var digits = String(raw || "").replace(/\\D+/g, "");
        if (!digits) return "";
        if (digits.length === 10) return "+1" + digits;
        if (digits.length === 11 && digits.charAt(0) === "1") return "+" + digits;
        if (String(raw || "").trim().charAt(0) === "+" && digits.length >= 10) return "+" + digits;
        return "";
      }

      function applyChannelUi() {
        channelButtons.forEach(function (node) {
          node.classList.toggle("active", node.getAttribute("data-experience-channel") === selectedChannel);
        });
        if (emailField) emailField.classList.toggle("hidden", selectedChannel !== "email");
        if (smsField) smsField.classList.toggle("hidden", selectedChannel !== "sms");
        if (emailInput) emailInput.disabled = !${JSON.stringify(hasParams)} || selectedChannel !== "email";
        if (phoneInput) phoneInput.disabled = !${JSON.stringify(hasParams)} || selectedChannel !== "sms";
      }

      function setSuccessCopy(channel, detail) {
        var sentTitle = document.querySelector("[data-experience-state='sent'] .status-title");
        var sentBody = document.querySelector("[data-experience-state='sent'] .status-body");
        var isUndelivered = channel === "sms" && detail && detail.smsStatus === "undelivered";
        if (sentTitle) sentTitle.textContent = "Recovery sent";
        if (sentBody) {
          sentBody.textContent = isUndelivered
            ? "Delivery is still settling. If it doesn’t arrive, try again."
            : channel === "sms"
              ? "Check your phone and open the recovery link."
              : "Check your inbox and open the recovery link.";
        }
        if (nextStep) nextStep.textContent = "Waiting for return...";
        setBillingVisibility(true);
      }

      function setSentMeta(data, email, phone) {
        if (!sentMeta) return;
        var parts = [];
        var destination = data && data.destination ? String(data.destination) : "";
        var channel = data && data.channel ? String(data.channel) : "";
        var smsStatus = data && data.smsStatus ? String(data.smsStatus) : "";
        if (!destination && channel === "email") destination = email || "";
        if (!destination && channel === "sms") destination = phone || "";
        if (channel) parts.push("Channel: " + channel.toUpperCase());
        if (destination) parts.push("Sent to: " + destination);
        if (channel === "sms" && smsStatus) parts.push("Delivery update: " + smsStatus);
        sentMeta.textContent = parts.join(" · ");
      }

      function setRecoveredValue(payload) {
        if (!recoveredValueNode) return;
        var cents = payload && payload.return && payload.return.recoveredValue && payload.return.recoveredValue.cents
          ? Number(payload.return.recoveredValue.cents)
          : 0;
        recoveredValueNode.textContent = cents > 0
          ? "Recovered revenue: " + new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100)
          : ${JSON.stringify(recoveredValueLabel)};
      }

      function updateStatusUi(payload) {
        var currentState = payload && payload.loop && payload.loop.current_state
          ? String(payload.loop.current_state)
          : "";
        if (currentState === "billing_active") {
          setBillingVisibility(false);
          setActiveState("billing-active");
          return;
        }

        if (payload.return && payload.return.returned) {
          setRecoveredValue(payload);
          setBillingVisibility(true);
          setActiveState("returned");
          if (pollTimer) {
            window.clearInterval(pollTimer);
            pollTimer = null;
          }
          return;
        }

        if (payload.latest_action && payload.latest_action.deduped) {
          setBillingVisibility(true);
          setActiveState("sent");
          return;
        }

        if (payload.send && payload.send.status === "sent") {
          var activeChannel = payload.latest_action && payload.latest_action.channel
            ? payload.latest_action.channel
            : (payload.send.channel || selectedChannel);
          setSuccessCopy(activeChannel, payload.latest_action || payload.send || null);
          setSentMeta(payload.latest_action || payload.send || {}, emailInput ? emailInput.value : "", phoneInput ? phoneInput.value : "");
          setActiveState("sent");
          if (payload.loop && payload.loop.billing_available) {
            setBillingVisibility(true);
          }
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

      channelButtons.forEach(function (buttonNode) {
        buttonNode.addEventListener("click", function () {
          selectedChannel = buttonNode.getAttribute("data-experience-channel") || "email";
          clearInlineError();
          applyChannelUi();
        });
      });

      applyChannelUi();
      setBillingVisibility(${JSON.stringify(billingButtonVisible)});
      if (merchantState === "billing_active") {
        setActiveState("billing-active");
      } else if (${JSON.stringify(hasReturned)}) {
        setRecoveredValue(initialExperienceStatus);
        if (${JSON.stringify(billingButtonVisible)}) {
          setActiveState("returned");
        }
      } else if (${JSON.stringify(hasSent && !hasReturned)}) {
        var initialStatusDetail = initialExperienceStatus && initialExperienceStatus.latest_action
          ? initialExperienceStatus.latest_action
          : (initialExperienceStatus && initialExperienceStatus.send ? initialExperienceStatus.send : null);
        setSuccessCopy(selectedChannel, initialStatusDetail);
        setSentMeta(initialStatusDetail || {}, "", "");
      }

      if (button) {
        button.addEventListener("click", async function () {
          clearInlineError();
          if (!shop) {
            setInlineError("Not ready yet.");
            setActiveState("idle");
            return;
          }
          var email = emailInput ? String(emailInput.value || "").trim() : "";
          var phone = phoneInput ? String(phoneInput.value || "").trim() : "";
          var normalizedPhone = normalizePhone(phone);

          if (selectedChannel === "email") {
            if (!email) {
              setInlineError("Email is required.");
              if (emailInput && typeof emailInput.focus === "function") emailInput.focus();
              return;
            }
            if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
              setInlineError("Enter a valid email.");
              if (emailInput && typeof emailInput.focus === "function") emailInput.focus();
              return;
            }
          }

          if (selectedChannel === "sms") {
            if (!phone) {
              setInlineError("Phone is required.");
              if (phoneInput && typeof phoneInput.focus === "function") phoneInput.focus();
              return;
            }
            if (!normalizedPhone) {
              setInlineError("Enter a valid US mobile number.");
              if (phoneInput && typeof phoneInput.focus === "function") phoneInput.focus();
              return;
            }
          }

          button.disabled = true;
          button.textContent = "Sending...";
          setActiveState("prepared");
          try {
            var payload = {
              shop: shop,
              channel: selectedChannel,
              tone_preset: "direct",
              experienceId: experienceId
            };
            if (selectedChannel === "email") {
              payload.email = email;
            } else {
              payload.phone = normalizedPhone;
            }
            var response = await fetch(${JSON.stringify(isConnected ? "/api/recovery-actions/send-live-test" : "/api/recovery-actions/create")}, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });
            var data = await response.json();
            if (!response.ok) {
              throw new Error((data && (data.error || data.details)) || "Not ready yet.");
            }

            var liveSendSucceeded = data && data.ok && (
              data.status === "sent"
              || data.recoveryActionStatus === "sent"
            );
            if (liveSendSucceeded) {
              var activeChannel = Array.isArray(data.channels) && data.channels[0] ? data.channels[0] : selectedChannel;
              setSuccessCopy(activeChannel, data);
              setSentMeta({
                channel: activeChannel,
                destination: activeChannel === "sms" ? (data.delivery && data.delivery[0] && data.delivery[0].to) || normalizedPhone : (data.delivery && data.delivery[0] && data.delivery[0].to) || email,
                smsStatus: data.smsStatus || "",
              }, email, normalizedPhone);
              setActiveState("sent");
              startPolling();
              await pollStatus();
              return;
            }

            if (data && data.ok && data.recoveryActionStatus === "deduped") {
              setBillingVisibility(true);
              if (nextStep) nextStep.textContent = "Waiting for return...";
              setActiveState("sent");
              return;
            }

            if (data && data.ok && data.recoveryActionStatus === "created") {
              setInlineError("Not ready yet.");
              setActiveState("idle");
              return;
            }

            setInlineError("Not ready yet.");
            setActiveState("idle");
          } catch (error) {
            setInlineError(error && error.message ? error.message : "Not ready yet.");
            setActiveState("idle");
          } finally {
            button.disabled = false;
            button.textContent = "Send recovery to myself";
          }
        });
      }

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
  recoveredValue,
}) {
  const recoveredValueLabel = formatUsdFromCents(recoveredValue?.cents || 0);
  const returnedChannel = String(
    experienceStatus?.return?.attribution?.channel
    || experienceStatus?.send?.channel
    || "",
  ).trim().toLowerCase();
  const returnedAt = String(
    experienceStatus?.return?.attribution?.returnClickedAt
    || experienceStatus?.return?.returnedAt
    || "",
  ).trim();
  const receiptTimestamp = returnedAt
    ? new Date(returnedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
    : "";
  const purchaseVerified = Boolean(
    experienceStatus?.verified
    || experienceStatus?.return?.attribution?.verified,
  );
  const receiptLabel = returnedChannel
    ? `Channel: ${returnedChannel.toUpperCase()}`
    : "Channel: recovery link";
  const receiptTimestampLabel = receiptTimestamp
    ? `Timestamp: ${receiptTimestamp}`
    : "Timestamp: pending";
  const proofImpactParams = new URLSearchParams();
  if (shop) proofImpactParams.set("shop", shop);
  proofImpactParams.set("flow", "demo");
  proofImpactParams.set("state", "recovered");
  if (experienceId) proofImpactParams.set("eid", experienceId);
  const proofImpactUrl = toMerchantFacingUrl(`/proof?${proofImpactParams.toString()}`);
  const billingRuntime = getBillingRuntimeReadiness();
  const billingAvailable = Boolean(
    billingRuntime.billing_route_active
    && experienceStatus?.loop?.recovery_sent,
  );
  const billingStartUrl = shop ? toMerchantFacingUrl(buildCanonicalBillingStartPath({
    shop,
    source: "connected_experience",
    target: shop,
    plan: "starter",
    experienceId,
  })) : toMerchantFacingUrl("/proof/payment");
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
    .brand a {
      display: inline-flex;
      align-items: center;
      justify-content: center;
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
    .value-block {
      margin-top: 22px;
      padding: 20px 18px;
      border-radius: 20px;
      border: 1px solid rgba(148, 163, 184, 0.16);
      background: linear-gradient(180deg, rgba(15, 23, 42, 0.88), rgba(2, 6, 23, 0.92));
      text-align: left;
    }
    .value-label {
      color: #94a3b8;
      font-size: 11px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      font-weight: 700;
    }
    .value-line {
      margin-top: 10px;
      color: #f8fafc;
      font-size: clamp(34px, 8vw, 48px);
      font-weight: 800;
      letter-spacing: -0.05em;
      line-height: 0.98;
    }
    .value-copy {
      margin-top: 10px;
      color: #e2e8f0;
      font-size: 15px;
      line-height: 1.55;
    }
    .actions {
      display: grid;
      gap: 12px;
      margin-top: 22px;
    }
    a {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-top: 22px;
      padding: 12px 16px;
      border-radius: 16px;
      background: linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 100%);
      color: #020617;
      text-decoration: none;
      font-weight: 800;
    }
    .secondary {
      background: rgba(15, 23, 42, 0.7);
      color: #f8fafc;
      border: 1px solid rgba(148, 163, 184, 0.18);
    }
    .support {
      margin-top: 16px;
      color: #94a3b8;
      font-size: 13px;
      line-height: 1.5;
    }
    .support a {
      margin-top: 0;
      padding: 0;
      border-radius: 0;
      background: transparent;
      color: #e2e8f0;
      font-weight: 600;
    }
    .receipt {
      margin-top: 18px;
      padding: 14px 16px;
      border-radius: 18px;
      border: 1px solid rgba(148, 163, 184, 0.16);
      background: rgba(15, 23, 42, 0.56);
      text-align: left;
    }
    .receipt strong {
      display: block;
      color: #f8fafc;
      font-size: 14px;
      margin-bottom: 6px;
    }
    .receipt span {
      display: block;
      color: #cbd5e1;
      font-size: 13px;
      line-height: 1.55;
    }
  </style>
</head>
<body>
  <main class="shell">
    <div class="brand">${renderMerchantLogoMarkup({ href: resolveMerchantFacingBaseUrl() })}</div>
    <section class="panel">
      <h1>Return detected.</h1>
      <p>Your self-test completed the full recovery loop on this store.</p>
      <p>${purchaseVerified ? "This purchase was recovered by Abando." : "This return was recovered by Abando."}</p>
      <div class="receipt">
        <strong>${purchaseVerified ? "Recovered purchase receipt" : "Recovered return receipt"}</strong>
        <span>${receiptLabel}</span>
        <span>${receiptTimestampLabel}</span>
      </div>
      <div class="value-block">
        <div class="value-label">Recovered revenue</div>
        <div class="value-line">${escapeHtml(recoveredValueLabel)}</div>
        <div class="value-copy">This is the amount this return put back in play through the recovery flow you just verified.</div>
      </div>
      <div class="actions">
        ${billingAvailable ? `<a href="${escapeHtml(billingStartUrl)}">Start paid plan</a>` : ""}
        <a class="${billingAvailable ? "secondary" : ""}" href="${escapeHtml(proofImpactUrl)}">${billingAvailable ? "See proof details" : "See the impact"}</a>
      </div>
      <div class="support">Questions? <a href="mailto:hello@abando.ai">hello@abando.ai</a></div>
    </section>
  </main>
</body>
</html>`;
}

function humanizeLeakStatus(status) {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "recovery_ready") return "Recovery Ready";
  if (normalized === "listening") return "Listening";
  if (normalized === "connected") return "Connected";
  if (normalized === "not_connected") return "Connected";
  return "Connected";
}

function renderProofLeakPage({
  shop,
  summary,
  emailReadiness,
}) {
  const statusLabel = humanizeLeakStatus(summary?.status);
  const eventCount = Number(summary?.eventCount || 0);
  const lastEventAt = summary?.lastEventAt ? formatProofTimestamp(summary.lastEventAt) : "No checkout event detected yet";
  const recoveryReadiness = summary?.sendReady || summary?.status === "recovery_ready" ? "Ready" : "Not ready";
  const lastRecoveryAction = summary?.lastRecoveryActionAt
    ? `${humanizeProofAction(summary?.lastRecoveryActionType || "recovery_email")} · ${formatProofTimestamp(summary.lastRecoveryActionAt)}`
    : "No recovery action recorded yet";
  const emailState = emailReadiness?.ready ? "Configured" : "Not configured";
  const missingEmail = Array.isArray(emailReadiness?.missing) && emailReadiness.missing.length > 0
    ? emailReadiness.missing.join(", ")
    : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Abando Leak Map</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background:
        radial-gradient(circle at top, rgba(59, 130, 246, 0.16), transparent 38%),
        linear-gradient(180deg, #020617 0%, #0f172a 100%);
      color: #e2e8f0;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      display: grid;
      place-items: center;
      padding: 28px 18px;
    }
    .shell {
      width: 100%;
      max-width: 760px;
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
      border: 1px solid rgba(148, 163, 184, 0.18);
      border-radius: 28px;
      padding: 30px 24px 24px;
      box-shadow: 0 28px 80px rgba(2, 6, 23, 0.42);
    }
    h1 {
      margin: 0;
      color: #f8fafc;
      font-size: clamp(34px, 6vw, 52px);
      line-height: 1.02;
      letter-spacing: -0.05em;
      text-align: center;
    }
    .lede {
      margin: 14px auto 0;
      max-width: 560px;
      color: #cbd5e1;
      line-height: 1.6;
      font-size: 16px;
      text-align: center;
    }
    .hero {
      margin-top: 24px;
      padding: 22px 20px;
      border-radius: 22px;
      background: linear-gradient(180deg, rgba(30, 41, 59, 0.78), rgba(15, 23, 42, 0.94));
      border: 1px solid rgba(148, 163, 184, 0.16);
      text-align: center;
    }
    .hero-label {
      color: #93c5fd;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }
    .hero-value {
      margin-top: 12px;
      font-size: clamp(34px, 7vw, 54px);
      font-weight: 800;
      color: #f8fafc;
      letter-spacing: -0.06em;
      line-height: 0.96;
    }
    .hero-copy {
      margin-top: 10px;
      color: #cbd5e1;
      font-size: 15px;
      line-height: 1.6;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 14px;
      margin-top: 22px;
    }
    .card {
      padding: 18px 16px;
      border-radius: 20px;
      background: rgba(15, 23, 42, 0.72);
      border: 1px solid rgba(148, 163, 184, 0.14);
    }
    .card-label {
      color: #94a3b8;
      font-size: 11px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      font-weight: 700;
    }
    .card-value {
      margin-top: 10px;
      color: #f8fafc;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.04em;
      line-height: 1.1;
    }
    .card-copy {
      margin-top: 8px;
      color: #cbd5e1;
      font-size: 14px;
      line-height: 1.55;
    }
    .fineprint {
      margin-top: 18px;
      text-align: center;
      color: #94a3b8;
      font-size: 13px;
      line-height: 1.55;
    }
  </style>
</head>
<body>
  <main class="shell">
    <div class="brand">Abando Leak Map</div>
    <section class="panel">
      <h1>Recover lost revenue automatically.</h1>
      <p class="lede">Open this page to see whether your store is detecting abandoned checkouts, whether recovery is ready, and whether delivery can actually fire.</p>
      <div class="hero">
        <div class="hero-label">Status</div>
        <div class="hero-value">${escapeHtml(statusLabel)}</div>
        <div class="hero-copy">Your store is ${eventCount > 0 ? "detecting abandoned checkouts." : "connected, but no qualifying checkout activity has been captured yet."}</div>
      </div>
      <div class="grid">
        <div class="card">
          <div class="card-label">Checkout Events</div>
          <div class="card-value">${escapeHtml(String(eventCount))}</div>
          <div class="card-copy">Last event: ${escapeHtml(lastEventAt)}</div>
        </div>
        <div class="card">
          <div class="card-label">Recovery State</div>
          <div class="card-value">${escapeHtml(recoveryReadiness)}</div>
          <div class="card-copy">Last recovery action: ${escapeHtml(lastRecoveryAction)}</div>
        </div>
        <div class="card">
          <div class="card-label">Message Delivery</div>
          <div class="card-value">${escapeHtml(emailState)}</div>
          <div class="card-copy">${escapeHtml(missingEmail ? `Missing env: ${missingEmail}` : "Email delivery is configured and ready for recovery sends.")}</div>
        </div>
      </div>
      <div class="fineprint">Shop: ${escapeHtml(shop || "Unknown store")} · Screenshot-ready proof of leak visibility and recovery readiness.</div>
    </section>
  </main>
</body>
</html>`;
}

function renderProofRecoveryPage({
  shop,
  experienceId,
  publicStatus,
}) {
  const returnedLabel = publicStatus?.returned ? "Yes" : "No";
  const returnedAtLabel = publicStatus?.returnedAt ? formatProofTimestamp(publicStatus.returnedAt) : "Not yet";
  const purchasedLabel = publicStatus?.purchased ? "Yes" : "Unknown / not yet matched";
  const revenueLabel = publicStatus?.revenue !== null && publicStatus?.revenue !== undefined
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(publicStatus.revenue || 0))
    : "Revenue not verified yet";
  const channelLabel = String(publicStatus?.channel || "").trim() ? String(publicStatus.channel).toUpperCase() : "UNKNOWN";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Abando Recovery Receipt</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background:
        radial-gradient(circle at top, rgba(16, 185, 129, 0.16), transparent 38%),
        linear-gradient(180deg, #020617 0%, #0f172a 100%);
      color: #e2e8f0;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      display: grid;
      place-items: center;
      padding: 28px 18px;
    }
    .shell {
      width: 100%;
      max-width: 560px;
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
      background: rgba(15, 23, 42, 0.88);
      border: 1px solid rgba(148, 163, 184, 0.16);
      border-radius: 28px;
      padding: 30px 24px 24px;
      box-shadow: 0 28px 80px rgba(2, 6, 23, 0.42);
      text-align: center;
    }
    h1 {
      margin: 0;
      color: #f8fafc;
      font-size: clamp(34px, 7vw, 48px);
      line-height: 1.02;
      letter-spacing: -0.05em;
    }
    p {
      margin: 14px 0 0;
      color: #cbd5e1;
      line-height: 1.6;
      font-size: 15px;
    }
    .grid {
      display: grid;
      gap: 12px;
      margin-top: 22px;
      text-align: left;
    }
    .row {
      padding: 16px 16px;
      border-radius: 18px;
      background: rgba(15, 23, 42, 0.72);
      border: 1px solid rgba(148, 163, 184, 0.14);
    }
    .row-label {
      color: #94a3b8;
      font-size: 11px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      font-weight: 700;
    }
    .row-value {
      margin-top: 8px;
      color: #f8fafc;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.04em;
      line-height: 1.15;
    }
    .footer {
      margin-top: 18px;
      color: #94a3b8;
      font-size: 13px;
      line-height: 1.55;
    }
  </style>
</head>
<body>
  <main class="shell">
    <div class="brand">Abando Recovery Receipt</div>
    <section class="panel">
      <h1>Recovery Completed</h1>
      <p>This customer returned through an Abando recovery.</p>
      <div class="grid">
        <div class="row">
          <div class="row-label">Returned</div>
          <div class="row-value">${escapeHtml(returnedLabel)}</div>
        </div>
        <div class="row">
          <div class="row-label">Returned At</div>
          <div class="row-value">${escapeHtml(returnedAtLabel)}</div>
        </div>
        <div class="row">
          <div class="row-label">Channel</div>
          <div class="row-value">${escapeHtml(channelLabel)}</div>
        </div>
        <div class="row">
          <div class="row-label">Purchased</div>
          <div class="row-value">${escapeHtml(purchasedLabel)}</div>
        </div>
        <div class="row">
          <div class="row-label">Revenue</div>
          <div class="row-value">${escapeHtml(revenueLabel)}</div>
        </div>
      </div>
      <div class="footer">Powered by Abando · Shop: ${escapeHtml(shop || "Unknown store")} · Experience: ${escapeHtml(experienceId || "Unknown")}</div>
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
    .brand a {
      display: inline-flex;
      align-items: center;
      justify-content: center;
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
        <div class="result-copy">Abando automatically recovers abandoned checkout revenue.</div>

        <a href="#" class="result-cta" data-audit-cta>See recovery in action</a>
        <div class="result-note">This audit surfaces likely recovery gaps.</div>
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
  const dashboardSummary = await getDashboardSummary(prisma, shop).catch(() => null);
  const merchantSummary = buildAbandoMerchantSummaryResponse(dashboardSummary, { notes: [] });
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
  const valueTier = getProofValueTier(shop);
  const actualRecoveredRevenueCents = Number(dashboardSummary?.realAttributedRevenueCents || 0);
  const derivedRecoveredRevenueCents = actualRecoveredRevenueCents > 0
    ? actualRecoveredRevenueCents
    : Number(recoveredSessions || 0) > 0
      ? Number(recoveredSessions || 0) * valueTier.recoveredOrder * 100
      : ["recovered", "returned"].includes(String(merchantSummary?.status || "").toLowerCase())
        ? valueTier.recoveredOrder * 100
        : 0;
  const recoveryActive = ["created", "recovery_ready", "sent"].includes(String(merchantSummary?.recoveryStatus || "").toLowerCase())
    || ["recovery_ready", "at_risk", "active"].includes(String(merchantSummary?.status || "").toLowerCase());
  const activeOpportunityCount = Math.max(
    1,
    Math.min(
      3,
      Number(merchantSummary?.eventCount || 0) > 0
        ? Number(merchantSummary.eventCount)
        : recoveryActive
          ? 2
          : 1,
    ),
  );
  const revenueAtRiskCents = recoveryActive
    ? Math.max(valueTier.daily * 100, activeOpportunityCount * valueTier.recoveredOrder * 100)
    : Math.round(valueTier.daily * 0.75 * 100);

  const opportunityStatuses = recoveryActive
    ? ["Recovering now", "Pending", "Monitoring"]
    : ["Pending", "Monitoring", "Monitoring"];
  const opportunityTypes = [
    humanizeProofEvent(merchantSummary?.lastEventSeen || "checkout_started"),
    "Returning user hesitation",
    "Product revisit",
  ];
  const opportunityValues = [
    Math.max(valueTier.recoveredOrder, Math.round((revenueAtRiskCents / 100) * 0.5)),
    Math.max(42, Math.round((revenueAtRiskCents / 100) * 0.32)),
    Math.max(28, Math.round((revenueAtRiskCents / 100) * 0.18)),
  ];

  const opportunities = opportunityTypes.map((type, index) => ({
    valueLabel: formatUsdWhole(opportunityValues[index]),
    type,
    status: opportunityStatuses[index],
  }));

  const timeline = [
    { label: humanizeProofEvent(merchantSummary?.lastEventSeen || "checkout_started"), detail: merchantSummary?.lastEventAt ? formatProofTimestamp(merchantSummary.lastEventAt) : "Recent activity" },
    { label: "Drop-off detected", detail: recoveryActive ? "Revenue opportunity opened" : "Monitoring for return" },
    merchantSummary?.lastRecoveryActionType
      ? { label: `${humanizeProofAction(merchantSummary.lastRecoveryActionType)} triggered`, detail: merchantSummary?.lastRecoveryActionAt ? formatProofTimestamp(merchantSummary.lastRecoveryActionAt) : "Recovery active" }
      : { label: "Recovery triggered", detail: recoveryActive ? "Recovery active" : "Not triggered yet" },
    latestReturnEvent || ["recovered", "returned"].includes(String(merchantSummary?.status || "").toLowerCase())
      ? { label: "Customer returned", detail: latestReturnEvent?.createdAt ? formatProofTimestamp(latestReturnEvent.createdAt) : "Return tracked" }
      : { label: "Customer return pending", detail: "Waiting on recovery completion" },
    derivedRecoveredRevenueCents > 0
      ? { label: `${formatUsdFromCents(derivedRecoveredRevenueCents)} recovered`, detail: "Revenue captured" }
      : { label: "Recovery value still at risk", detail: formatUsdFromCents(revenueAtRiskCents) },
  ];

  const insight = derivedRecoveredRevenueCents > 0
    ? "Recovery active. Returning customers are already converting back into revenue."
    : recoveryActive
      ? "Recovery is active. Most opportunities close quickly once shoppers are brought back with the right trigger."
      : "Recovery signals are being monitored. Most recoveries happen shortly after checkout intent is re-engaged.";

  return {
    shop,
    recoveredRevenueLabel: formatUsdFromCents(derivedRecoveredRevenueCents),
    revenueAtRiskLabel: formatUsdFromCents(revenueAtRiskCents),
    activeOpportunityCount,
    opportunities,
    timeline,
    insight,
  };
}

function renderMerchantPage({
  shop,
  recoveredRevenueLabel,
  revenueAtRiskLabel,
  activeOpportunityCount,
  opportunities,
  timeline,
  insight,
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
      padding: 28px 18px;
    }
    .shell {
      width: 100%;
      max-width: 920px;
      margin: 0 auto;
    }
    .brand {
      text-align: left;
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
      font-size: clamp(34px, 6vw, 48px);
      line-height: 1.02;
      letter-spacing: -0.05em;
    }
    .lede {
      margin: 14px 0 0;
      color: #94a3b8;
      font-size: 15px;
      line-height: 1.6;
    }
    .metric-grid {
      margin-top: 20px;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }
    .metric-card,
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
      font-size: 28px;
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
    .opportunity-list,
    .timeline-list {
      margin-top: 14px;
      display: grid;
      gap: 10px;
    }
    .opportunity-row,
    .timeline-row,
    .control-row {
      display: flex;
      justify-content: space-between;
      gap: 14px;
      align-items: start;
      padding: 14px;
      border-radius: 16px;
      background: rgba(15, 23, 42, 0.68);
      border: 1px solid rgba(148, 163, 184, 0.12);
    }
    .opportunity-row strong,
    .timeline-row strong,
    .control-row strong {
      color: #f8fafc;
    }
    .opportunity-meta,
    .timeline-meta {
      color: #94a3b8;
      font-size: 14px;
      line-height: 1.5;
      text-align: right;
    }
    .insight-copy {
      margin-top: 10px;
      color: #cbd5e1;
      font-size: 15px;
      line-height: 1.7;
    }
    @media (max-width: 720px) {
      .metric-grid {
        grid-template-columns: 1fr;
      }
      .opportunity-row,
      .timeline-row,
      .control-row {
        flex-direction: column;
      }
      .opportunity-meta,
      .timeline-meta {
        text-align: left;
      }
    }
  </style>
</head>
<body>
  <main class="shell">
    <div class="brand">Abando</div>
    <section class="panel">
      <h1>Revenue engine active</h1>
      <p class="lede">Recovered revenue, live revenue at risk, and recovery movement for ${escapeHtml(shop)}.</p>

      <section class="metric-grid">
        <div class="metric-card">
          <div class="section-label">Recovered revenue (last 7 days)</div>
          <div class="section-value">${escapeHtml(recoveredRevenueLabel)}</div>
        </div>
        <div class="metric-card">
          <div class="section-label">Active revenue opportunities</div>
          <div class="section-value">${escapeHtml(revenueAtRiskLabel)}</div>
        </div>
      </section>

      <section class="section">
        <div class="section-label">Active opportunities</div>
        <div class="opportunity-list">
          ${(opportunities || []).slice(0, 3).map((item) => `
            <div class="opportunity-row">
              <div><strong>${escapeHtml(item.valueLabel)}</strong> — ${escapeHtml(item.type)}</div>
              <div class="opportunity-meta">${escapeHtml(item.status)}</div>
            </div>
          `).join("")}
        </div>
      </section>

      <section class="section">
        <div class="section-label">Recovery timeline</div>
        <div class="timeline-list">
          ${(timeline || []).map((item) => `
            <div class="timeline-row">
              <div><strong>${escapeHtml(item.label)}</strong></div>
              <div class="timeline-meta">${escapeHtml(item.detail)}</div>
            </div>
          `).join("")}
        </div>
      </section>

      <section class="section">
        <div class="section-label">System insight</div>
        <div class="insight-copy">${escapeHtml(insight)}</div>
        <div class="insight-copy">Most recoveries happen within 10 minutes. High-value carts respond faster to urgency. Returning customers convert with less friction.</div>
      </section>

      <section class="section">
        <div class="section-label">Recovery mode</div>
        <div class="control-row">
          <div><strong>Recovery Mode</strong></div>
          <div class="timeline-meta">Balanced</div>
        </div>
      </section>
    </section>
  </main>
</body>
</html>`;
}

function deriveLeadNextAction(status = "routed") {
  if (status === "audit_opened") return "Open experience";
  if (status === "experience_opened") return "Send recovery";
  if (status === "recovery_sent") return "Check return";
  if (status === "return_tracked") return "Review / close";
  if (status === "closed") return "Complete";
  return "Open audit";
}

function normalizeOutreachStatus(entry = {}) {
  const current = String(entry?.outreach_status || entry?.status || "").trim().toLowerCase();
  if (["draft", "ready", "sent", "responded", "closed"].includes(current)) return current;
  if (entry?.closed || current === "closed") return "closed";
  if (entry?.responded || entry?.replied || current === "responded" || current === "replied") return "responded";
  if (entry?.sent || current === "sent") return "sent";
  if (current === "ready" || current === "queued" || entry?.approved) return "ready";
  if (current === "draft" || current === "routed") return "draft";
  return "draft";
}

function deriveOutreachNextAction(entry = {}) {
  const status = normalizeOutreachStatus(entry);
  if (status === "closed" || entry?.closed) return "Complete";
  if (entry?.conversion?.install_status === "installed") return "Close / capture testimonial";
  if (entry?.conversion?.install_status === "started") return "Support install";
  if (entry?.conversion?.install_status === "sent") return "Wait for install";
  if (entry?.conversion?.demo_completed && (entry?.conversion?.install_status || "none") === "none") return "Send install";
  if (entry?.conversion?.demo_scheduled) return "Prepare demo";
  if (entry?.response?.call_booked) return "Prepare demo";
  if (status === "responded" || entry?.responded) return "Reply / schedule call";
  if (status === "sent") return "Wait / follow up";
  if (status === "ready") return "Send";
  return "Approve";
}

function deriveContactResearchNextAction(entry = {}) {
  const researchStatus = String(entry?.research_status || "");
  const contactStatus = String(entry?.contact_status || "");
  const explicitNext = String(entry?.next_contact_action || "").trim();

  if (researchStatus === "closed") return "Complete";
  if (researchStatus === "ready_for_outreach") return "Queue outreach";
  if (researchStatus === "contact_found") return "Mark ready for outreach";
  if (researchStatus === "researching") return "Continue research";
  if (researchStatus === "no_contact_found") return "Revisit later";
  if (contactStatus === "contact_page_ready") return "Review contact page";
  if (contactStatus === "social_ready") return "Review social profile";
  if (contactStatus === "no_contact_found") return "Research manually";
  return explicitNext || "Research manually";
}

function renderOutreachTemplate(template = "", row = {}) {
  return String(template || "")
    .replace(/\{\{greeting\}\}/g, String(row.greeting || "Hi there —"))
    .replace(/\{\{audit_link\}\}/g, String(row.audit_link || ""))
    .replace(/\{\{experience_link\}\}/g, String(row.experience_link || ""))
    .replace(/\{\{proof_link\}\}/g, String(row.proof_link || ""));
}

function buildOutreachBodyPreview(body = "", maxLength = 240) {
  const normalized = String(body || "").trim();
  if (!normalized) {
    return "No rendered message yet.";
  }
  const clipped = normalized.length > maxLength ? `${normalized.slice(0, maxLength).trimEnd()}...` : normalized;
  return escapeHtml(clipped).replace(/\n/g, "<br />");
}

function getOutreachResponseStatus(entry = {}) {
  if (entry?.response?.call_booked) return "call booked";
  if (entry?.response?.received) return "responded";
  return "no response";
}

function getOutreachSentAgeLabel(sentAt = "") {
  if (!sentAt) return "Not sent yet";
  const sentTime = new Date(sentAt).getTime();
  if (!Number.isFinite(sentTime)) return "Not sent yet";
  const diffMs = Date.now() - sentTime;
  const days = Math.max(0, Math.floor(diffMs / (24 * 60 * 60 * 1000)));
  return `Sent ${days} day${days === 1 ? "" : "s"} ago`;
}

function getOutreachFollowUpState(entry = {}) {
  const responseReceived = Boolean(entry?.response?.received);
  const callBooked = Boolean(entry?.response?.call_booked);
  const status = normalizeOutreachStatus(entry);
  const followUp = entry?.follow_up || {};
  if (status !== "sent" || !entry?.sent_at || responseReceived || callBooked) {
    return {
      status: followUp.follow_up_count > 0 ? "completed" : "none",
      next_follow_up_at: "",
      follow_up_count: Number(followUp.follow_up_count || 0),
    };
  }
  if (Number(followUp.follow_up_count || 0) >= 2) {
    return {
      status: "stale",
      next_follow_up_at: "",
      follow_up_count: Number(followUp.follow_up_count || 0),
    };
  }
  return {
    status: String(followUp.status || "not due"),
    next_follow_up_at: String(followUp.next_follow_up_at || ""),
    follow_up_count: Number(followUp.follow_up_count || 0),
  };
}

function getOutreachConversionState(entry = {}) {
  const conversion = entry?.conversion || {};
  return {
    demo_status: conversion.demo_completed ? "completed" : (conversion.demo_scheduled ? "scheduled" : "not scheduled"),
    demo_date: String(conversion.demo_date || ""),
    install_status: String(conversion.install_status || "none"),
    install_link: String(conversion.install_link || ""),
    install_started_at: String(conversion.install_started_at || ""),
    installed_at: String(conversion.installed_at || ""),
    installed_shop: String(conversion.installed_shop || ""),
  };
}

function getOutreachSendReadiness(entry = {}) {
  const readyStatus = normalizeOutreachStatus(entry) === "ready";
  const approved = Boolean(entry?.approved);
  const email = String(entry?.contact_email || "").trim();
  const subject = String(entry?.subject || "").trim();
  const body = String(entry?.body || "").trim();
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  return readyStatus && approved && emailValid && Boolean(subject) && Boolean(body) ? "ready" : "not ready";
}

function deriveUnifiedOutreachStage(entry = {}) {
  const status = normalizeOutreachStatus(entry);
  const conversion = entry?.conversion || {};
  if (conversion.install_status === "installed") return "Installed";
  if (status === "closed" || entry?.closed) return "Closed";
  if (conversion.install_status === "sent" || conversion.install_status === "started") return "Install Sent";
  if (conversion.demo_scheduled || conversion.demo_completed || entry?.response?.call_booked) return "Demo Scheduled";
  if (status === "responded" || entry?.response?.received) return "Responded";
  if (status === "sent") return "Outreach Sent";
  if (status === "ready") return "Outreach Ready";
  return "Outreach Draft";
}

function deriveUnifiedContactStage(entry = {}, outreachEntry = null) {
  if (outreachEntry) return deriveUnifiedOutreachStage(outreachEntry);
  if (String(entry?.research_status || "") === "ready_for_outreach") return "Outreach Draft";
  return "Contact Research";
}

function deriveUnifiedLeadStage({ leadStatus = "", contactEntry = null, outreachEntry = null } = {}) {
  if (outreachEntry) return deriveUnifiedOutreachStage(outreachEntry);
  if (contactEntry) return deriveUnifiedContactStage(contactEntry, null);
  if (leadStatus === "closed") return "Closed";
  return "Qualified";
}

function renderOperatorNav(current = "") {
  const items = [
    { href: "/leads", label: "Leads" },
    { href: "/contact-research", label: "Contact Research" },
    { href: "/outreach", label: "Outreach" },
  ];
  return `<div class="page-links">${items.map((item) => `<a href="${item.href}"${item.href === current ? ` class="active"` : ""}>${item.label}</a>`).join("")}</div>`;
}

function renderOperatorRecordLinks(current = "") {
  const links = [
    { href: "/leads", label: "View in Leads" },
    { href: "/contact-research", label: "View in Contact Research" },
    { href: "/outreach", label: "View in Outreach" },
  ].filter((item) => item.href !== current);
  return `<div class="record-links">${links.map((item) => `<a href="${item.href}">${item.label}</a>`).join(" · ")}</div>`;
}

function normalizeIcpTier(value = "") {
  const tier = String(value || "").trim().toLowerCase();
  if (tier === "high" || tier === "medium" || tier === "low") return tier;
  return "low";
}

function formatIcpTierLabel(value = "") {
  const tier = normalizeIcpTier(value);
  if (tier === "high") return "High";
  if (tier === "medium") return "Medium";
  return "Low";
}

async function getLeadsCommandCenterState() {
  const topTargets = await readJsonArrayFile(leadsTopTargetsPath);
  const outcomes = await readJsonArrayFile(leadsOutcomesPath);
  const contactResearchQueue = await readJsonArrayFile(leadsContactResearchQueuePath);
  const outreachQueue = await readJsonArrayFile(leadsOutreachQueuePath);
  const outcomeByDomain = new Map(
    outcomes.map((entry) => [normalizeStoreInput(entry?.domain || ""), entry]),
  );
  const contactByDomain = new Map(
    contactResearchQueue.map((entry) => [normalizeStoreInput(entry?.domain || ""), entry]),
  );
  const outreachByDomain = new Map(
    outreachQueue.map((entry) => [normalizeStoreInput(entry?.domain || ""), entry]),
  );

  const rows = topTargets.map((target) => {
    const domain = normalizeStoreInput(target?.domain || "");
    const outcome = outcomeByDomain.get(domain) || null;
    const contactEntry = contactByDomain.get(domain) || null;
    const outreachEntry = outreachByDomain.get(domain) || null;
    const status = String(outcome?.status || "routed");
    const stage = deriveUnifiedLeadStage({ leadStatus: status, contactEntry, outreachEntry });
    const nextAction = outreachEntry
      ? deriveOutreachNextAction(outreachEntry)
      : contactEntry
        ? deriveContactResearchNextAction(contactEntry)
        : deriveLeadNextAction(status);
    return {
      domain,
      score: Number(outcome?.score ?? target?.score ?? 0),
      icp_score: Number(outcome?.icp_score ?? target?.icp_score ?? 0),
      icp_tier: normalizeIcpTier(outcome?.icp_tier ?? target?.icp_tier ?? "low"),
      status,
      stage,
      audit_link: String(outcome?.audit_link || target?.audit_link || ""),
      experience_link: String(outcome?.experience_link || target?.experience_link || ""),
      notes: String(outcome?.notes || target?.notes || "").trim(),
      nextAction,
    };
  });

  const counts = {
    routed: 0,
    audit_opened: 0,
    experience_opened: 0,
    recovery_sent: 0,
    return_tracked: 0,
  };

  rows.forEach((row) => {
    if (Object.prototype.hasOwnProperty.call(counts, row.status)) {
      counts[row.status] += 1;
    }
  });

  return { rows, counts };
}

function formatLeadStatusRow(lead) {
  const parts = [];
  if (lead.billing_active) {
    parts.push("Billing active");
  } else if (lead.billing_clicked) {
    parts.push("Billing started");
  }
  if (lead.return_detected) {
    parts.push("Return detected");
  } else if (lead.recovery_sent) {
    parts.push("Recovery sent");
  } else if (lead.installed_at) {
    parts.push("Connected");
  }
  return parts[0] || "Connected";
}

function formatLeadLastAction(lead) {
  if (lead.billing_active) return "Billing active";
  if (lead.billing_clicked) return "Billing clicked";
  if (lead.return_detected) return "Return detected";
  if (lead.recovery_sent) return "Recovery sent";
  if (lead.installed_at) return "Installed";
  return "No activity yet";
}

async function getOperatorLeadsState() {
  const [shops, installEvents, systemEvents] = await Promise.all([
    prisma.shop.findMany({
      orderBy: { createdAt: "desc" },
      select: { key: true, createdAt: true },
    }),
    readJsonArrayFile(leadsInstallEventsPath),
    prisma.systemEvent.findMany({
      where: {
        eventType: {
          in: [
            "abando.recovery_action.v1",
            "abando.live_test_send.v1",
            "abando.customer_return.v1",
            BILLING_STATE_EVENT,
            "abando.billing_click.v1",
          ],
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const leadMap = new Map();

  function ensureLead(shop) {
    const normalizedShop = normalizeStoreInput(shop);
    if (!normalizedShop) return null;
    if (!leadMap.has(normalizedShop)) {
      leadMap.set(normalizedShop, {
        shop: normalizedShop,
        installed_at: null,
        recovery_sent: false,
        return_detected: false,
        billing_clicked: false,
        billing_active: false,
        last_event_at: null,
        lead_score: 0,
      });
    }
    return leadMap.get(normalizedShop);
  }

  function bumpLastEvent(lead, timestamp) {
    const value = String(timestamp || "").trim();
    if (!value) return;
    if (!lead.last_event_at || value > lead.last_event_at) {
      lead.last_event_at = value;
    }
  }

  for (const shop of shops) {
    const lead = ensureLead(shop.key);
    if (!lead) continue;
    lead.installed_at = shop.createdAt?.toISOString?.() || null;
    bumpLastEvent(lead, lead.installed_at);
  }

  for (const event of installEvents) {
    const installedShop = normalizeStoreInput(event?.shopDomain || event?.installed_shop || event?.installedShop || "");
    const lead = ensureLead(installedShop || event?.targetDomain || event?.target_domain);
    if (!lead) continue;
    const installedAt = String(event?.installedAt || event?.installed_at || event?.created_at || "").trim();
    if (installedAt) {
      lead.installed_at = installedAt;
      bumpLastEvent(lead, installedAt);
    }
  }

  for (const event of systemEvents) {
    const payload = event?.payload && typeof event.payload === "object" ? event.payload : {};
    const lead = ensureLead(event.shopDomain || payload.shop || payload.shopDomain);
    if (!lead) continue;
    const createdAt = event.createdAt?.toISOString?.() || null;
    bumpLastEvent(lead, createdAt);

    if (event.eventType === "abando.live_test_send.v1") {
      const status = String(payload.status || "").trim().toLowerCase();
      if (status === "sent") {
        lead.recovery_sent = true;
      }
    }

    if (event.eventType === "abando.recovery_action.v1") {
      const status = String(payload.status || "").trim().toLowerCase();
      if (status === "sent") {
        lead.recovery_sent = true;
      }
    }

    if (event.eventType === "abando.customer_return.v1") {
      lead.return_detected = true;
    }

    if (event.eventType === "abando.billing_click.v1") {
      lead.billing_clicked = true;
    }

    if (event.eventType === BILLING_STATE_EVENT) {
      const billingStatus = String(payload.billing_status || "").trim().toLowerCase();
      if (billingStatus === "active" || billingStatus === "trialing") {
        lead.billing_active = true;
      }
    }
  }

  const rows = Array.from(leadMap.values())
    .filter((lead) => {
      const shop = normalizeStoreInput(lead.shop);
      return Boolean(shop && shop !== "unknown store");
    })
    .map((lead) => {
      let leadScore = 0;
      if (lead.recovery_sent) leadScore += 3;
      if (lead.return_detected) leadScore += 5;
      if (lead.billing_clicked) leadScore += 10;
      if (lead.billing_active) leadScore += 20;
      return {
        ...lead,
        lead_score: leadScore,
        status: formatLeadStatusRow(lead),
        last_action: formatLeadLastAction(lead),
      };
    })
    .sort((a, b) => {
      if (b.lead_score !== a.lead_score) return b.lead_score - a.lead_score;
      return String(b.last_event_at || "").localeCompare(String(a.last_event_at || ""));
    });

  return rows;
}

function renderOperatorLeadsPage(rows) {
  const cards = rows.map((row) => `\
<section class="lead-row">
  <div class="lead-main">
    <div class="lead-shop">${escapeHtml(row.shop)}</div>
    <div class="lead-status">${escapeHtml(row.status)}</div>
  </div>
  <div class="lead-side">
    <div class="lead-score">Score ${Number(row.lead_score || 0)}</div>
    <div class="lead-last">${escapeHtml(row.last_action)}</div>
  </div>
</section>`).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Operator Leads</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background: #020617;
      color: #e5eef8;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      padding: 28px 18px 60px;
    }
    .shell { max-width: 760px; margin: 0 auto; }
    h1 {
      margin: 0;
      font-size: clamp(30px, 6vw, 40px);
      letter-spacing: -0.04em;
      color: #f8fafc;
    }
    .lede {
      margin: 10px 0 20px;
      color: #94a3b8;
      font-size: 15px;
    }
    .lead-row {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      padding: 18px 20px;
      border-radius: 20px;
      background: rgba(15, 23, 42, 0.86);
      border: 1px solid rgba(148, 163, 184, 0.16);
      margin-top: 12px;
      align-items: center;
    }
    .lead-shop {
      color: #f8fafc;
      font-size: 18px;
      font-weight: 800;
    }
    .lead-status, .lead-last {
      color: #94a3b8;
      font-size: 14px;
      margin-top: 6px;
    }
    .lead-score {
      color: #dcfce7;
      font-size: 16px;
      font-weight: 800;
      text-align: right;
    }
    .lead-side { text-align: right; }
  </style>
</head>
<body>
  <main class="shell">
    <h1>Hot merchants</h1>
    <p class="lede">Highest conversion readiness first.</p>
    ${cards || '<div class="lede">No merchant activity yet.</div>'}
  </main>
</body>
</html>`;
}

async function getOutreachCommandCenterState() {
  const queue = await readJsonArrayFile(leadsOutreachQueuePath);
  const templates = await readJsonObjectFile(leadsOutreachTemplatesPath);

  const rows = queue.map((entry) => {
    const messageType = String(entry?.message_type || "abando_proof_invite");
    const template = templates[messageType] || {};
    const contactName = String(entry?.contact_name || "").trim();
    const greeting = contactName ? `Hey ${contactName.split(/\s+/)[0]} —` : "Hi there —";
    const subject = String(entry?.subject || template.subject || "").trim();
    const body = String(entry?.body || renderOutreachTemplate(template.body, { ...entry, greeting }) || "").trim();
    const outreachStatus = normalizeOutreachStatus(entry);
    return {
      domain: normalizeStoreInput(entry?.domain || ""),
      score: Number(entry?.score || 0),
      icp_score: Number(entry?.icp_score || 0),
      icp_tier: normalizeIcpTier(entry?.icp_tier || "low"),
      stage: deriveUnifiedOutreachStage(entry),
      contact_name: contactName,
      contact_role: String(entry?.contact_role || "").trim(),
      contact_email: String(entry?.contact_email || "").trim(),
      outreach_status: outreachStatus,
      closed: Boolean(entry?.closed),
      responded: Boolean(entry?.responded),
      response: {
        received: Boolean(entry?.response?.received),
        received_at: String(entry?.response?.received_at || ""),
        channel: String(entry?.response?.channel || "").trim(),
        summary: String(entry?.response?.summary || "").trim(),
        intent: String(entry?.response?.intent || "").trim(),
        next_step: String(entry?.response?.next_step || "").trim(),
        call_booked: Boolean(entry?.response?.call_booked),
        call_date: String(entry?.response?.call_date || "").trim(),
        notes: String(entry?.response?.notes || "").trim(),
      },
      response_status: getOutreachResponseStatus(entry),
      sent_age_label: getOutreachSentAgeLabel(entry?.sent_at),
      follow_up: {
        status: getOutreachFollowUpState(entry).status,
        next_follow_up_at: getOutreachFollowUpState(entry).next_follow_up_at,
        follow_up_count: getOutreachFollowUpState(entry).follow_up_count,
      },
      conversion: getOutreachConversionState(entry),
      sending: {
        last_attempt_at: String(entry?.sending?.last_attempt_at || "").trim(),
        last_result: String(entry?.sending?.last_result || "").trim(),
        last_error: String(entry?.sending?.last_error || "").trim(),
        provider_message_id: String(entry?.sending?.provider_message_id || "").trim(),
        readiness: getOutreachSendReadiness(entry),
      },
      subject,
      body,
      proof_link: String(entry?.proof_link || ""),
      notes: String(entry?.notes || "").trim(),
      nextAction: deriveOutreachNextAction(entry),
    };
  });

  const counts = {
    draft: 0,
    ready: 0,
    sent: 0,
    responded: 0,
    closed: 0,
  };

  rows.forEach((row) => {
    if (Object.prototype.hasOwnProperty.call(counts, row.outreach_status)) {
      counts[row.outreach_status] += 1;
    }
  });

  return { rows, counts };
}

async function getContactResearchCommandCenterState() {
  const queue = await readJsonArrayFile(leadsContactResearchQueuePath);
  const outreachQueue = await readJsonArrayFile(leadsOutreachQueuePath);
  const outreachByDomain = new Map(
    outreachQueue.map((entry) => [normalizeStoreInput(entry?.domain || ""), entry]),
  );

  const rows = queue.map((entry) => {
    const domain = normalizeStoreInput(entry?.domain || "");
    const outreachEntry = outreachByDomain.get(domain) || null;
    return {
      domain,
      score: Number(entry?.score || 0),
      icp_score: Number(entry?.icp_score || 0),
      icp_tier: normalizeIcpTier(entry?.icp_tier || "low"),
      stage: deriveUnifiedContactStage(entry, outreachEntry),
      contact_status: String(entry?.contact_status || "no_contact_found"),
      research_status: String(entry?.research_status || "needs_research"),
      contact_page_url: String(entry?.contact_page_url || ""),
      social_links: {
        instagram: String(entry?.social_links?.instagram || ""),
        linkedin: String(entry?.social_links?.linkedin || ""),
        facebook: String(entry?.social_links?.facebook || ""),
      },
      contact_email: String(entry?.contact_email || "").trim(),
      contact_name: String(entry?.contact_name || "").trim(),
      contact_role: String(entry?.contact_role || "").trim(),
      notes: String(entry?.notes || "").trim(),
      nextAction: outreachEntry ? deriveOutreachNextAction(outreachEntry) : deriveContactResearchNextAction(entry),
    };
  });

  const counts = {
    needs_research: 0,
    researching: 0,
    contact_found: 0,
    ready_for_outreach: 0,
    no_contact_found: 0,
  };

  rows.forEach((row) => {
    if (Object.prototype.hasOwnProperty.call(counts, row.research_status)) {
      counts[row.research_status] += 1;
    }
  });

  return { rows, counts };
}

function renderLeadsPage({ rows, counts }) {
  const cards = rows.map((row) => `\
<section class="target-card">
  <div class="target-top">
    <div>
      <div class="target-domain">${escapeHtml(row.domain || "Unknown store")}</div>
      <div class="target-meta">Score ${Number(row.score || 0)} · ICP ${Number(row.icp_score || 0)}</div>
    </div>
    <div class="status-badge">${escapeHtml(row.stage)}</div>
  </div>
  <div class="target-grid">
    <div class="target-line"><span>Stage</span><strong>${escapeHtml(row.stage)}</strong></div>
    <div class="target-line"><span>ICP tier</span><strong><span class="icp-badge icp-${escapeHtml(row.icp_tier)}">${escapeHtml(formatIcpTierLabel(row.icp_tier))}</span></strong></div>
    <div class="target-line"><span>ICP score</span><strong>${Number(row.icp_score || 0)}</strong></div>
    <div class="target-line"><span>Audit link</span><a href="${escapeHtml(row.audit_link)}" target="_blank" rel="noopener">Open audit</a></div>
    <div class="target-line"><span>Experience link</span><a href="${escapeHtml(row.experience_link)}" target="_blank" rel="noopener">Open experience</a></div>
    <div class="target-line"><span>Notes</span><strong>${escapeHtml(row.notes || "No notes yet.")}</strong></div>
    <div class="target-line action-line"><span>Next action</span><strong class="primary-action">${escapeHtml(row.nextAction)}</strong></div>
    ${renderOperatorRecordLinks("/leads")}
  </div>
</section>`).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Leads Command Center</title>
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
      place-items: start center;
      padding: 28px 18px 60px;
    }
    .shell {
      width: 100%;
      max-width: 760px;
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
    .panel,
    .target-card {
      background: rgba(15, 23, 42, 0.86);
      border: 1px solid rgba(148, 163, 184, 0.16);
      border-radius: 28px;
      box-shadow: 0 28px 80px rgba(2, 6, 23, 0.42);
    }
    .panel {
      padding: 30px 24px 24px;
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
    .summary-row {
      margin-top: 22px;
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 10px;
    }
    .summary-card {
      padding: 14px 12px;
      border-radius: 18px;
      background: rgba(2, 6, 23, 0.44);
      border: 1px solid rgba(148, 163, 184, 0.12);
      text-align: center;
    }
    .summary-card span {
      display: block;
      color: #94a3b8;
      font-size: 11px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .summary-card strong {
      display: block;
      margin-top: 8px;
      color: #f8fafc;
      font-size: 22px;
      letter-spacing: -0.03em;
    }
    .page-links {
      margin-top: 18px;
      display: flex;
      justify-content: center;
      gap: 14px;
      flex-wrap: wrap;
    }
    .page-links a {
      color: #cbd5e1;
      font-size: 13px;
      text-decoration: none;
      border-bottom: 1px solid rgba(148, 163, 184, 0.28);
      padding-bottom: 2px;
    }
    .page-links a.active {
      color: #f8fafc;
      border-bottom-color: rgba(248, 250, 252, 0.72);
    }
    .targets {
      margin-top: 18px;
      display: grid;
      gap: 14px;
    }
    .target-card {
      padding: 18px 18px 16px;
    }
    .target-top {
      display: flex;
      justify-content: space-between;
      align-items: start;
      gap: 12px;
    }
    .target-domain {
      color: #f8fafc;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.03em;
      word-break: break-word;
    }
    .target-meta {
      margin-top: 6px;
      color: #94a3b8;
      font-size: 13px;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      min-height: 32px;
      padding: 0 12px;
      border-radius: 999px;
      background: rgba(2, 6, 23, 0.52);
      border: 1px solid rgba(148, 163, 184, 0.16);
      color: #cbd5e1;
      font-size: 12px;
      font-weight: 700;
      text-transform: lowercase;
      white-space: nowrap;
    }
    .icp-badge {
      display: inline-flex;
      align-items: center;
      min-height: 28px;
      padding: 0 10px;
      border-radius: 999px;
      border: 1px solid rgba(148, 163, 184, 0.18);
      font-size: 12px;
      font-weight: 700;
    }
    .icp-high {
      color: #bbf7d0;
      background: rgba(20, 83, 45, 0.42);
      border-color: rgba(74, 222, 128, 0.28);
    }
    .icp-medium {
      color: #fde68a;
      background: rgba(113, 63, 18, 0.42);
      border-color: rgba(250, 204, 21, 0.28);
    }
    .icp-low {
      color: #cbd5e1;
      background: rgba(51, 65, 85, 0.42);
      border-color: rgba(148, 163, 184, 0.2);
    }
    .icp-badge {
      display: inline-flex;
      align-items: center;
      min-height: 28px;
      padding: 0 10px;
      border-radius: 999px;
      border: 1px solid rgba(148, 163, 184, 0.18);
      font-size: 12px;
      font-weight: 700;
    }
    .icp-high {
      color: #bbf7d0;
      background: rgba(20, 83, 45, 0.42);
      border-color: rgba(74, 222, 128, 0.28);
    }
    .icp-medium {
      color: #fde68a;
      background: rgba(113, 63, 18, 0.42);
      border-color: rgba(250, 204, 21, 0.28);
    }
    .icp-low {
      color: #cbd5e1;
      background: rgba(51, 65, 85, 0.42);
      border-color: rgba(148, 163, 184, 0.2);
    }
    .icp-badge {
      display: inline-flex;
      align-items: center;
      min-height: 28px;
      padding: 0 10px;
      border-radius: 999px;
      border: 1px solid rgba(148, 163, 184, 0.18);
      font-size: 12px;
      font-weight: 700;
    }
    .icp-high {
      color: #bbf7d0;
      background: rgba(20, 83, 45, 0.42);
      border-color: rgba(74, 222, 128, 0.28);
    }
    .icp-medium {
      color: #fde68a;
      background: rgba(113, 63, 18, 0.42);
      border-color: rgba(250, 204, 21, 0.28);
    }
    .icp-low {
      color: #cbd5e1;
      background: rgba(51, 65, 85, 0.42);
      border-color: rgba(148, 163, 184, 0.2);
    }
    .target-grid {
      margin-top: 14px;
      display: grid;
      gap: 10px;
    }
    .target-line {
      display: flex;
      justify-content: space-between;
      gap: 14px;
      align-items: start;
      color: #cbd5e1;
      font-size: 14px;
      line-height: 1.5;
    }
    .target-line span {
      color: #94a3b8;
      min-width: 110px;
    }
    .target-line strong,
    .target-line a {
      color: #e5eef8;
      text-align: right;
      word-break: break-word;
    }
    .primary-action {
      color: #f8fafc;
      font-size: 15px;
    }
    .record-links {
      color: #64748b;
      font-size: 12px;
      line-height: 1.5;
      text-align: right;
    }
    .record-links a {
      color: #94a3b8;
      text-decoration: none;
    }
    .empty {
      margin-top: 18px;
      padding: 20px 18px;
      border-radius: 20px;
      background: rgba(2, 6, 23, 0.44);
      border: 1px solid rgba(148, 163, 184, 0.12);
      color: #94a3b8;
      text-align: center;
    }
    @media (max-width: 720px) {
      .summary-row {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .target-line {
        flex-direction: column;
      }
      .target-line strong,
      .target-line a {
        text-align: left;
      }
      .record-links {
        text-align: left;
      }
    }
  </style>
</head>
<body>
  <main class="shell">
    <div class="brand">Abando</div>
    <section class="panel">
      <h1>Leads Command Center</h1>
      <p class="lede">Routed targets for Abando revenue recovery.</p>
      ${renderOperatorNav("/leads")}
      <div class="summary-row">
        <div class="summary-card"><span>routed</span><strong>${counts.routed}</strong></div>
        <div class="summary-card"><span>audit_opened</span><strong>${counts.audit_opened}</strong></div>
        <div class="summary-card"><span>experience_opened</span><strong>${counts.experience_opened}</strong></div>
        <div class="summary-card"><span>recovery_sent</span><strong>${counts.recovery_sent}</strong></div>
        <div class="summary-card"><span>return_tracked</span><strong>${counts.return_tracked}</strong></div>
      </div>
    </section>
    ${rows.length > 0 ? `<section class="targets">${cards}</section>` : `<section class="empty">No routed targets yet.</section>`}
  </main>
</body>
</html>`;
}

function renderOutreachPage({ rows, counts }) {
  const cards = rows.map((row) => `\
<section class="target-card">
  <div class="target-top">
    <div>
      <div class="target-domain">${escapeHtml(row.domain || "Unknown domain")}</div>
      <div class="target-meta">Score ${Number(row.score || 0)} · ICP ${Number(row.icp_score || 0)}</div>
    </div>
    <div class="status-badge">${escapeHtml(row.stage)}</div>
  </div>
  <div class="target-grid">
    <div class="target-line"><span>Stage</span><strong>${escapeHtml(row.stage)}</strong></div>
    <div class="target-line"><span>ICP tier</span><strong><span class="icp-badge icp-${escapeHtml(row.icp_tier)}">${escapeHtml(formatIcpTierLabel(row.icp_tier))}</span></strong></div>
    <div class="target-line"><span>ICP score</span><strong>${Number(row.icp_score || 0)}</strong></div>
    <div class="target-line"><span>Contact</span><strong>${escapeHtml(row.contact_name || "No contact name yet")}</strong></div>
    <div class="target-line"><span>Role</span><strong>${escapeHtml(row.contact_role || "No role yet")}</strong></div>
    <div class="target-line"><span>Email</span><strong>${escapeHtml(row.contact_email || "No contact email yet")}</strong></div>
    <div class="target-line"><span>Subject</span><strong>${escapeHtml(row.subject || "No subject yet")}</strong></div>
    <div class="target-line"><span>Body</span><div class="body-preview">${buildOutreachBodyPreview(row.body)}</div></div>
    <div class="target-line"><span>Proof link</span><a href="${escapeHtml(row.proof_link)}" target="_blank" rel="noopener">Open proof</a></div>
    <div class="target-line"><span>Sent</span><strong>${escapeHtml(row.sent_age_label)}</strong></div>
    <div class="target-line"><span>Follow-up status</span><strong>${escapeHtml(row.follow_up.status || "none")}</strong></div>
    <div class="target-line"><span>Next follow-up</span><strong>${escapeHtml(row.follow_up.status === "due" ? "now" : (row.follow_up.next_follow_up_at || "not scheduled"))}</strong></div>
    <div class="target-line"><span>Follow-up count</span><strong>${escapeHtml(String(row.follow_up.follow_up_count || 0))}</strong></div>
    <div class="target-line"><span>Response</span><strong>${escapeHtml(row.response_status)}</strong></div>
    <div class="target-line"><span>Response summary</span><strong>${escapeHtml(row.response.summary || "No response logged.")}</strong></div>
    <div class="target-line"><span>Call status</span><strong>${escapeHtml(row.response.call_booked ? "booked" : "not booked")}</strong></div>
    <div class="target-line"><span>Call date</span><strong>${escapeHtml(row.response.call_date || "No call booked.")}</strong></div>
    ${row.response.received ? `
    <div class="target-line"><span>Demo status</span><strong>${escapeHtml(row.conversion.demo_status)}</strong></div>
    <div class="target-line"><span>Demo date</span><strong>${escapeHtml(row.conversion.demo_date || "No demo scheduled.")}</strong></div>
    <div class="target-line"><span>Install status</span><strong>${escapeHtml(row.conversion.install_status === "none" ? "not sent" : row.conversion.install_status)}</strong></div>
    <div class="target-line"><span>Install link</span>${row.conversion.install_link ? `<a href="${escapeHtml(row.conversion.install_link)}" target="_blank" rel="noopener">Open install</a>` : `<strong>Not sent yet.</strong>`}</div>
    <div class="target-line"><span>Install started</span><strong>${escapeHtml(row.conversion.install_started_at || "Not started.")}</strong></div>
    <div class="target-line"><span>Installed at</span><strong>${escapeHtml(row.conversion.installed_at || "Not installed.")}</strong></div>
    <div class="target-line"><span>Installed shop</span><strong>${escapeHtml(row.conversion.installed_shop || "Not recorded.")}</strong></div>
    ` : ""}
    <div class="target-line"><span>Send readiness</span><strong>${escapeHtml(row.sending.readiness)}</strong></div>
    <div class="target-line"><span>Last send attempt</span><strong>${escapeHtml(row.sending.last_attempt_at || "No send attempt yet.")}</strong></div>
    <div class="target-line"><span>Last send result</span><strong>${escapeHtml(row.sending.last_result || "No result yet.")}</strong></div>
    <div class="target-line"><span>Provider message id</span><strong>${escapeHtml(row.sending.provider_message_id || "No provider id yet.")}</strong></div>
    <div class="target-line"><span>Notes</span><strong>${escapeHtml(row.notes || "No notes yet.")}</strong></div>
    <div class="target-line action-line"><span>Next action</span><strong class="primary-action">${escapeHtml(row.nextAction)}</strong></div>
    ${renderOperatorRecordLinks("/outreach")}
    <div class="helper-line">approve: node staffordos/leads/outreach.js approve ${escapeHtml(row.domain)}</div>
    <div class="helper-line">render: node staffordos/leads/outreach.js render ${escapeHtml(row.domain)}</div>
    <div class="helper-line">mark-sent: node staffordos/leads/outreach.js mark-sent ${escapeHtml(row.domain)}</div>
    <div class="helper-line">mark-responded: node staffordos/leads/outreach.js mark-responded ${escapeHtml(row.domain)}</div>
    <div class="helper-line">log-response: node staffordos/leads/outreach.js log-response ${escapeHtml(row.domain)} positive "Interested, asked for demo"</div>
    <div class="helper-line">book-call: node staffordos/leads/outreach.js book-call ${escapeHtml(row.domain)} "2026-03-28T15:00:00Z"</div>
    <div class="helper-line">schedule-demo: node staffordos/leads/outreach.js schedule-demo ${escapeHtml(row.domain)} "2026-03-28T15:00:00Z"</div>
    <div class="helper-line">complete-demo: node staffordos/leads/outreach.js complete-demo ${escapeHtml(row.domain)}</div>
    <div class="helper-line">send-install: node staffordos/leads/outreach.js send-install ${escapeHtml(row.domain)}</div>
    <div class="helper-line">mark-install-started: node staffordos/leads/outreach.js mark-install-started ${escapeHtml(row.domain)} my-real-shop.myshopify.com</div>
    <div class="helper-line">mark-installed: node staffordos/leads/outreach.js mark-installed ${escapeHtml(row.domain)}</div>
    <div class="helper-line">followup-generate: node staffordos/leads/outreach.js followup-generate ${escapeHtml(row.domain)}</div>
    <div class="helper-line">followup-mark: node staffordos/leads/outreach.js followup-mark ${escapeHtml(row.domain)}</div>
  </div>
</section>`).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Outreach Queue</title>
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
      place-items: start center;
      padding: 28px 18px 60px;
    }
    .shell {
      width: 100%;
      max-width: 760px;
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
    .panel,
    .target-card {
      background: rgba(15, 23, 42, 0.86);
      border: 1px solid rgba(148, 163, 184, 0.16);
      border-radius: 28px;
      box-shadow: 0 28px 80px rgba(2, 6, 23, 0.42);
    }
    .panel {
      padding: 30px 24px 24px;
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
    .summary-row {
      margin-top: 22px;
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 10px;
    }
    .summary-card {
      padding: 14px 12px;
      border-radius: 18px;
      background: rgba(2, 6, 23, 0.44);
      border: 1px solid rgba(148, 163, 184, 0.12);
      text-align: center;
    }
    .summary-card span {
      display: block;
      color: #94a3b8;
      font-size: 11px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .summary-card strong {
      display: block;
      margin-top: 8px;
      color: #f8fafc;
      font-size: 22px;
      letter-spacing: -0.03em;
    }
    .page-links {
      margin-top: 18px;
      display: flex;
      justify-content: center;
      gap: 14px;
      flex-wrap: wrap;
    }
    .page-links a {
      color: #cbd5e1;
      font-size: 13px;
      text-decoration: none;
      border-bottom: 1px solid rgba(148, 163, 184, 0.28);
      padding-bottom: 2px;
    }
    .page-links a.active {
      color: #f8fafc;
      border-bottom-color: rgba(248, 250, 252, 0.72);
    }
    .targets {
      margin-top: 18px;
      display: grid;
      gap: 14px;
    }
    .target-card {
      padding: 18px 18px 16px;
    }
    .target-top {
      display: flex;
      justify-content: space-between;
      align-items: start;
      gap: 12px;
    }
    .target-domain {
      color: #f8fafc;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.03em;
      word-break: break-word;
    }
    .target-meta {
      margin-top: 6px;
      color: #94a3b8;
      font-size: 13px;
      line-height: 1.5;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      min-height: 32px;
      padding: 0 12px;
      border-radius: 999px;
      background: rgba(2, 6, 23, 0.52);
      border: 1px solid rgba(148, 163, 184, 0.16);
      color: #cbd5e1;
      font-size: 12px;
      font-weight: 700;
      text-transform: lowercase;
      white-space: nowrap;
    }
    .target-grid {
      margin-top: 14px;
      display: grid;
      gap: 10px;
    }
    .target-line {
      display: flex;
      justify-content: space-between;
      gap: 14px;
      align-items: start;
      color: #cbd5e1;
      font-size: 14px;
      line-height: 1.5;
    }
    .target-line span {
      color: #94a3b8;
      min-width: 110px;
    }
    .target-line strong,
    .target-line a,
    .body-preview {
      color: #e5eef8;
      text-align: right;
      word-break: break-word;
    }
    .body-preview {
      max-width: 420px;
    }
    .helper-line {
      color: #64748b;
      font-size: 12px;
      line-height: 1.5;
      word-break: break-word;
      opacity: 0.72;
    }
    .primary-action {
      color: #f8fafc;
      font-size: 15px;
    }
    .record-links {
      color: #64748b;
      font-size: 12px;
      line-height: 1.5;
      text-align: right;
    }
    .record-links a {
      color: #94a3b8;
      text-decoration: none;
    }
    .empty {
      margin-top: 18px;
      padding: 20px 18px;
      border-radius: 20px;
      background: rgba(2, 6, 23, 0.44);
      border: 1px solid rgba(148, 163, 184, 0.12);
      color: #94a3b8;
      text-align: center;
    }
    @media (max-width: 720px) {
      .summary-row {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .target-line {
        flex-direction: column;
      }
      .target-line strong,
      .target-line a,
      .body-preview {
        text-align: left;
      }
      .record-links {
        text-align: left;
      }
    }
  </style>
</head>
<body>
  <main class="shell">
    <div class="brand">Abando</div>
    <section class="panel">
      <h1>Outreach Queue</h1>
      <p class="lede">Operator review for merchant outreach.</p>
      ${renderOperatorNav("/outreach")}
      <div class="summary-row">
        <div class="summary-card"><span>draft</span><strong>${counts.draft}</strong></div>
        <div class="summary-card"><span>ready</span><strong>${counts.ready}</strong></div>
        <div class="summary-card"><span>sent</span><strong>${counts.sent}</strong></div>
        <div class="summary-card"><span>responded</span><strong>${counts.responded}</strong></div>
        <div class="summary-card"><span>closed</span><strong>${counts.closed}</strong></div>
      </div>
    </section>
    ${rows.length > 0 ? `<section class="targets">${cards}</section>` : `<section class="empty">No outreach items yet.</section>`}
  </main>
</body>
</html>`;
}

function renderContactResearchPage({ rows, counts }) {
  const cards = rows.map((row) => {
    const socialLinks = [
      row.social_links.instagram ? `<a href="${escapeHtml(row.social_links.instagram)}" target="_blank" rel="noopener">Instagram</a>` : "",
      row.social_links.linkedin ? `<a href="${escapeHtml(row.social_links.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>` : "",
      row.social_links.facebook ? `<a href="${escapeHtml(row.social_links.facebook)}" target="_blank" rel="noopener">Facebook</a>` : "",
    ].filter(Boolean).join(" · ");

    return `\
<section class="target-card">
  <div class="target-top">
    <div>
      <div class="target-domain">${escapeHtml(row.domain || "Unknown domain")}</div>
      <div class="target-meta">Score ${Number(row.score || 0)} · ICP ${Number(row.icp_score || 0)}</div>
    </div>
    <div class="status-badge">${escapeHtml(row.stage)}</div>
  </div>
  <div class="target-grid">
    <div class="target-line"><span>Stage</span><strong>${escapeHtml(row.stage)}</strong></div>
    <div class="target-line"><span>ICP tier</span><strong><span class="icp-badge icp-${escapeHtml(row.icp_tier)}">${escapeHtml(formatIcpTierLabel(row.icp_tier))}</span></strong></div>
    <div class="target-line"><span>ICP score</span><strong>${Number(row.icp_score || 0)}</strong></div>
    <div class="target-line"><span>Contact status</span><strong>${escapeHtml(row.contact_status)}</strong></div>
    <div class="target-line"><span>Research status</span><strong>${escapeHtml(row.research_status)}</strong></div>
    <div class="target-line"><span>Contact page</span>${row.contact_page_url ? `<a href="${escapeHtml(row.contact_page_url)}" target="_blank" rel="noopener">Open contact page</a>` : `<strong>Not found</strong>`}</div>
    <div class="target-line"><span>Social links</span><strong>${socialLinks || "Not found"}</strong></div>
    <div class="target-line"><span>Contact email</span><strong>${escapeHtml(row.contact_email || "Not found")}</strong></div>
    <div class="target-line"><span>Contact name</span><strong>${escapeHtml(row.contact_name || "Not set")}</strong></div>
    <div class="target-line"><span>Contact role</span><strong>${escapeHtml(row.contact_role || "Not set")}</strong></div>
    <div class="target-line"><span>Notes</span><strong>${escapeHtml(row.notes || "No notes yet.")}</strong></div>
    <div class="target-line action-line"><span>Next action</span><strong class="primary-action">${escapeHtml(row.nextAction)}</strong></div>
    ${renderOperatorRecordLinks("/contact-research")}
    <div class="helper-line">start: node staffordos/leads/contact_research.js start ${escapeHtml(row.domain)}</div>
    <div class="helper-line">add-contact: node staffordos/leads/contact_research.js add-contact ${escapeHtml(row.domain)} owner@store.com "Name" "Role"</div>
    <div class="helper-line">ready: node staffordos/leads/contact_research.js ready ${escapeHtml(row.domain)}</div>
  </div>
</section>`;
  }).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Contact Research Queue</title>
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
      place-items: start center;
      padding: 28px 18px 60px;
    }
    .shell {
      width: 100%;
      max-width: 760px;
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
    .panel,
    .target-card {
      background: rgba(15, 23, 42, 0.86);
      border: 1px solid rgba(148, 163, 184, 0.16);
      border-radius: 28px;
      box-shadow: 0 28px 80px rgba(2, 6, 23, 0.42);
    }
    .panel {
      padding: 30px 24px 24px;
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
    .summary-row {
      margin-top: 22px;
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 10px;
    }
    .summary-card {
      padding: 14px 12px;
      border-radius: 18px;
      background: rgba(2, 6, 23, 0.44);
      border: 1px solid rgba(148, 163, 184, 0.12);
      text-align: center;
    }
    .summary-card span {
      display: block;
      color: #94a3b8;
      font-size: 11px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .summary-card strong {
      display: block;
      margin-top: 8px;
      color: #f8fafc;
      font-size: 22px;
      letter-spacing: -0.03em;
    }
    .page-links {
      margin-top: 18px;
      display: flex;
      justify-content: center;
      gap: 14px;
      flex-wrap: wrap;
    }
    .page-links a {
      color: #cbd5e1;
      font-size: 13px;
      text-decoration: none;
      border-bottom: 1px solid rgba(148, 163, 184, 0.28);
      padding-bottom: 2px;
    }
    .page-links a.active {
      color: #f8fafc;
      border-bottom-color: rgba(248, 250, 252, 0.72);
    }
    .targets {
      margin-top: 18px;
      display: grid;
      gap: 14px;
    }
    .target-card {
      padding: 18px 18px 16px;
    }
    .target-top {
      display: flex;
      justify-content: space-between;
      align-items: start;
      gap: 12px;
    }
    .target-domain {
      color: #f8fafc;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.03em;
      word-break: break-word;
    }
    .target-meta {
      margin-top: 6px;
      color: #94a3b8;
      font-size: 13px;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      min-height: 32px;
      padding: 0 12px;
      border-radius: 999px;
      background: rgba(2, 6, 23, 0.52);
      border: 1px solid rgba(148, 163, 184, 0.16);
      color: #cbd5e1;
      font-size: 12px;
      font-weight: 700;
      text-transform: lowercase;
      white-space: nowrap;
    }
    .target-grid {
      margin-top: 14px;
      display: grid;
      gap: 10px;
    }
    .target-line {
      display: flex;
      justify-content: space-between;
      gap: 14px;
      align-items: start;
      color: #cbd5e1;
      font-size: 14px;
      line-height: 1.5;
    }
    .target-line span {
      color: #94a3b8;
      min-width: 130px;
    }
    .target-line strong,
    .target-line a {
      color: #e5eef8;
      text-align: right;
      word-break: break-word;
    }
    .helper-line {
      color: #64748b;
      font-size: 12px;
      line-height: 1.5;
      word-break: break-word;
      opacity: 0.72;
    }
    .primary-action {
      color: #f8fafc;
      font-size: 15px;
    }
    .record-links {
      color: #64748b;
      font-size: 12px;
      line-height: 1.5;
      text-align: right;
    }
    .record-links a {
      color: #94a3b8;
      text-decoration: none;
    }
    .empty {
      margin-top: 18px;
      padding: 20px 18px;
      border-radius: 20px;
      background: rgba(2, 6, 23, 0.44);
      border: 1px solid rgba(148, 163, 184, 0.12);
      color: #94a3b8;
      text-align: center;
    }
    @media (max-width: 720px) {
      .summary-row {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .target-line {
        flex-direction: column;
      }
      .target-line strong,
      .target-line a {
        text-align: left;
      }
      .record-links {
        text-align: left;
      }
    }
  </style>
</head>
<body>
  <main class="shell">
    <div class="brand">Abando</div>
    <section class="panel">
      <h1>Contact Research Queue</h1>
      <p class="lede">Operator review for real merchant contact discovery.</p>
      ${renderOperatorNav("/contact-research")}
      <div class="summary-row">
        <div class="summary-card"><span>needs_research</span><strong>${counts.needs_research}</strong></div>
        <div class="summary-card"><span>researching</span><strong>${counts.researching}</strong></div>
        <div class="summary-card"><span>contact_found</span><strong>${counts.contact_found}</strong></div>
        <div class="summary-card"><span>ready_for_outreach</span><strong>${counts.ready_for_outreach}</strong></div>
        <div class="summary-card"><span>no_contact_found</span><strong>${counts.no_contact_found}</strong></div>
      </div>
    </section>
    ${rows.length > 0 ? `<section class="targets">${cards}</section>` : `<section class="empty">No contact research items yet.</section>`}
  </main>
</body>
</html>`;
}

function buildProofStoreName(shop = "") {
  const base = String(shop || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\.myshopify\.com$/, "")
    .split("/")[0]
    .split("?")[0]
    .split("#")[0]
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!base) {
    return "Your Store";
  }

  return base
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getProofValueTier(shop = "") {
  const value = String(shop || "").toLowerCase();
  const premiumKeywords = ["lux", "atelier", "studio", "collective", "premium"];
  const midKeywords = ["home", "bath", "pets", "kitchen", "gear", "fit"];

  if (premiumKeywords.some((keyword) => value.includes(keyword))) {
    return {
      tier: "premium",
      monthly: 4800,
      daily: 160,
      hourly: 7,
      recoveredOrder: 126,
    };
  }

  if (midKeywords.some((keyword) => value.includes(keyword))) {
    return {
      tier: "mid",
      monthly: 3200,
      daily: 107,
      hourly: 4,
      recoveredOrder: 84,
    };
  }

  return {
    tier: "general",
    monthly: 1800,
    daily: 60,
    hourly: 3,
    recoveredOrder: 52,
  };
}

function formatUsdWhole(amount = 0, suffix = "") {
  return `$${Number(amount || 0).toLocaleString("en-US")}${suffix}`;
}

function formatProofTimestamp(value = "") {
  if (!value) return "No timestamp yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function humanizeProofEvent(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "checkout_started") return "Checkout started";
  if (normalized === "recovery_email") return "Recovery email triggered";
  if (normalized === "recovery_sms") return "Recovery SMS triggered";
  if (!normalized || normalized === "none" || normalized === "unknown") return "Recent checkout activity";
  return normalized.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function humanizeProofRecoveryStatus(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  if (["created", "recovery_ready", "sent"].includes(normalized)) return "Triggered";
  if (!normalized || normalized === "none" || normalized === "null" || normalized === "missing") return "Not triggered";
  return normalized.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function humanizeProofRevenueStatus(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  if (["recovery_ready", "at_risk", "active"].includes(normalized)) return "At risk";
  if (["recovered", "returned"].includes(normalized)) return "Recovery active";
  return "Monitoring";
}

function humanizeProofAction(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "recovery_email") return "Recovery email";
  if (normalized === "recovery_sms") return "Recovery SMS";
  return normalized ? normalized.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) : "Recovery action";
}

function buildProofContactUrl({ shop, source, target }) {
  const params = new URLSearchParams();
  params.set("subject", `Abando contact for ${shop || "your Shopify store"}`);
  params.set(
    "body",
    `I want to talk about Abando for ${shop || "my store"}.\n\nStore: ${shop || ""}\nSource: ${source || "proof"}\nTarget: ${target || shop || ""}`,
  );
  return {
    href: `mailto:support@abando.ai?${params.toString()}`,
    available: true,
    label: "Contact available",
  };
}

function buildProofPaymentConfig({ shop, source, target, plan }) {
  const directPaymentUrl = getDirectPaymentUrl();
  const selectedPlan = plan === "pro" ? "pro" : "starter";
  const priceIds = getStripePriceIds();
  const hasStripeCheckout = hasCollectableBillingConfig() && Boolean(stripe) && Boolean(
    selectedPlan === "pro" ? priceIds.pro : priceIds.starter,
  );

  if (directPaymentUrl) {
    try {
      const url = new URL(directPaymentUrl);
      if (shop) url.searchParams.set("shop", shop);
      if (source) url.searchParams.set("src", source);
      if (target) url.searchParams.set("target", target);
      url.searchParams.set("plan", selectedPlan);
      return { available: true, href: url.toString(), label: "Payment available" };
    } catch {
      return { available: true, href: directPaymentUrl, label: "Payment available" };
    }
  }

  if (hasStripeCheckout) {
    const params = new URLSearchParams();
    if (shop) params.set("shop", shop);
    if (source) params.set("src", source);
    if (target) params.set("target", target);
    params.set("plan", selectedPlan);
    return { available: true, href: `/proof/payment?${params.toString()}`, label: "Payment available" };
  }

  return { available: false, href: "", label: "Payment not yet enabled" };
}

function renderProofPage({ shop, summary, source = "", target = "", plan = "", flow = "", state = "", recoveredValue = null }) {
  const normalizedShop = shop || (flow === "demo" ? ABANDO_PUBLIC_DEMO_SHOP : "your-store.myshopify.com");
  const storeName = buildProofStoreName(normalizedShop);
  const valueTier = getProofValueTier(normalizedShop);
  const monthlyRevenueLabel = `${formatUsdWhole(valueTier.monthly)}/month`;
  const exposedRevenueLabel = formatUsdWhole(valueTier.recoverable);
  const resolvedSource = source || "proof";
  const resolvedTarget = target || normalizedShop;
  const installParams = new URLSearchParams();
  if (normalizedShop) installParams.set("shop", normalizedShop);
  installParams.set("src", resolvedSource);
  installParams.set("target", resolvedTarget);
  if (plan) installParams.set("plan", plan);
  const installUrl = toMerchantFacingUrl(`/install/shopify?${installParams.toString()}`);
  const pricingUrl = toMerchantFacingUrl("/pricing");
  const experienceUrl = toMerchantFacingUrl(`/experience?shop=${encodeURIComponent(normalizedShop)}&eid=proof-demo`);
  const freshProofExperienceId = `proof-run-${Date.now().toString(36)}-${randomBytes(2).toString("hex")}`;
  const freshProofUrl = toMerchantFacingUrl(`/experience?shop=${encodeURIComponent(normalizedShop)}&eid=${encodeURIComponent(freshProofExperienceId)}`);
  const proofRecoveredState = String(state || "").trim().toLowerCase() === "recovered";
  const recoveredLoopValueLabel = proofRecoveredState ? formatUsdFromCents(recoveredValue?.cents || 0) : "";
  const loopSteps = [
    "Customer reached checkout",
    "Customer left before paying",
    "Abando sent the recovery path",
    "Revenue came back",
  ];
  const loopHtml = loopSteps.map((step, index) => `\
        <div class="loop-step ${index === loopSteps.length - 1 ? "is-final" : ""}">
          <div class="loop-index">${index + 1}</div>
          <div class="loop-label">${escapeHtml(step)}</div>
        </div>`).join("");
  const nextSteps = proofRecoveredState
    ? [
        "Recovery message was sent through the live path",
        "The customer returned through the recovery link",
        "Recovered value was verified",
        "Install Abando on Shopify to protect the store continuously",
      ]
    : [
        "Trigger the exact live recovery path",
        "Receive the same message your customer would receive",
        "Click the recovery link and watch the customer return",
        "See recovered value, then install Abando on Shopify",
      ];
  const nextStepsHtml = nextSteps.map((step, index) => `\
        <div class="loop-step ${index === nextSteps.length - 1 ? "is-final" : ""}">
          <div class="loop-index">${index + 1}</div>
          <div class="loop-label">${escapeHtml(step)}</div>
        </div>`).join("");
  const headline = proofRecoveredState
    ? `${storeName} just recovered lost checkout revenue.`
    : `${storeName} can verify the Abando recovery loop right now.`;
  const lede = proofRecoveredState
    ? "One recovery path has now been verified end-to-end. The next move is to install Abando on the live store and start the product journey there."
    : "This page explains the live recovery loop in plain merchant language: send the recovery, click back through the link, detect the return, and then install on your own store.";
  const transitionCopy = proofRecoveredState
    ? "The proof is complete. Install Abando on Shopify, land in the connected experience, then move into a paid plan when billing is available."
    : "Start with proof, then install on Shopify, connect the store, and test the same recovery loop on yourself.";
  const primaryCtaLabel = proofRecoveredState ? "Install Abando" : "Send a recovery to yourself";
  const primaryCtaUrl = proofRecoveredState ? installUrl : experienceUrl;
  const secondaryCtaLabel = proofRecoveredState ? "See pricing" : "Install on Shopify";
  const secondaryCtaUrl = proofRecoveredState ? pricingUrl : installUrl;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Abando Proof</title>
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
      place-items: start center;
      padding: 32px 18px 60px;
    }
    .shell {
      width: 100%;
      max-width: 720px;
    }
    .panel {
      background: rgba(15, 23, 42, 0.86);
      border: 1px solid rgba(148, 163, 184, 0.16);
      border-radius: 30px;
      box-shadow: 0 28px 80px rgba(2, 6, 23, 0.42);
      padding: 34px 26px 26px;
    }
    .brand {
      display: inline-flex;
      text-align: center;
      color: #cbd5e1;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin-bottom: 18px;
      text-decoration: none;
    }
    h1 {
      margin: 0;
      color: #f8fafc;
      font-size: clamp(38px, 8vw, 48px);
      line-height: 1.02;
      letter-spacing: -0.05em;
      text-align: center;
    }
    .lede {
      margin: 14px auto 0;
      max-width: 580px;
      color: #94a3b8;
      font-size: 15px;
      line-height: 1.6;
      text-align: center;
    }
    .value-card,
    .outcome-card,
    .loop-card,
    .bridge-card {
      margin-top: 24px;
      padding: 22px 20px;
      border-radius: 22px;
      background: rgba(2, 6, 23, 0.5);
      border: 1px solid rgba(148, 163, 184, 0.14);
    }
    .card-label {
      color: #94a3b8;
      font-size: 12px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .value-card {
      text-align: center;
    }
    .value-main {
      margin-top: 10px;
      color: #f8fafc;
      font-size: clamp(34px, 8vw, 46px);
      font-weight: 800;
      letter-spacing: -0.05em;
    }
    .outcome-main {
      margin-top: 10px;
      color: #d9f99d;
      font-size: clamp(34px, 8vw, 46px);
      font-weight: 800;
      letter-spacing: -0.05em;
      text-align: center;
    }
    .value-subtext,
    .trust-note,
    .cta-subtext {
      margin-top: 14px;
      color: #cbd5e1;
      font-size: 14px;
      line-height: 1.6;
      text-align: center;
    }
    .loop-list {
      margin-top: 16px;
      display: grid;
      gap: 12px;
    }
    .loop-step {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 14px;
      border-radius: 18px;
      background: rgba(2, 6, 23, 0.42);
      border: 1px solid rgba(148, 163, 184, 0.12);
    }
    .loop-step.is-final {
      border-color: rgba(226, 232, 240, 0.28);
      background: rgba(15, 23, 42, 0.82);
    }
    .loop-index {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      border-radius: 999px;
      background: rgba(148, 163, 184, 0.12);
      color: #e2e8f0;
      font-size: 13px;
      font-weight: 700;
    }
    .loop-label {
      color: #f8fafc;
      font-size: 15px;
      font-weight: 700;
    }
    .bridge-copy {
      margin-top: 12px;
      color: #e5eef8;
      font-size: 15px;
      line-height: 1.6;
      text-align: left;
    }
    .actions {
      margin-top: 24px;
      display: flex;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 48px;
      padding: 0 18px;
      border-radius: 999px;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      transition: transform 140ms ease, opacity 140ms ease;
    }
    .button:hover {
      transform: translateY(-1px);
      opacity: 0.96;
    }
    .button-primary {
      background: #f8fafc;
      color: #020617;
      min-width: 320px;
      font-size: 15px;
    }
    .button-secondary {
      background: rgba(15, 23, 42, 0.82);
      color: #e5eef8;
      border: 1px solid rgba(148, 163, 184, 0.18);
    }
    .footer-grid {
      margin-top: 18px;
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 14px;
    }
    .footer-card {
      border-radius: 18px;
      border: 1px solid rgba(148, 163, 184, 0.12);
      background: rgba(2, 6, 23, 0.42);
      padding: 16px;
    }
    .footer-card strong {
      display: block;
      margin-bottom: 8px;
      color: #f8fafc;
    }
    .footer-card a {
      display: block;
      color: #94a3b8;
      line-height: 1.9;
      text-decoration: none;
    }
    .footer-note {
      margin-top: 18px;
      color: #64748b;
      font-size: 13px;
      text-align: center;
    }
    @media (max-width: 720px) {
      .actions {
        flex-direction: column;
      }
      .button {
        width: 100%;
      }
      .footer-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <main class="shell">
    <a class="brand" href="${escapeHtml(resolveMerchantFacingBaseUrl())}">${renderMerchantLogoMarkup()}</a>
    <section class="panel">
      <h1>${escapeHtml(headline)}</h1>
      <p class="lede">${escapeHtml(lede)}</p>

      <div class="value-card">
        <div class="card-label">${proofRecoveredState ? "Recovered proof" : "Exposed revenue"}</div>
        <div class="value-main">${proofRecoveredState ? escapeHtml(recoveredLoopValueLabel) : escapeHtml(exposedRevenueLabel)}</div>
        <div class="value-subtext">${proofRecoveredState
          ? "Recovered in one verified proof loop."
          : `Estimated recovery upside for this store: ${escapeHtml(monthlyRevenueLabel)}.`}</div>
        <div class="trust-note">${proofRecoveredState
          ? "This proof shows the recovery path completing from message to return."
          : "This proof shows what happens after install: send the recovery, watch the return, then move into a paid plan when the loop is proven."}</div>
      </div>

      ${proofRecoveredState ? `
      <div class="outcome-card">
        <div class="card-label">Recovered in this loop</div>
        <div class="outcome-main" data-proof-recovered-value data-target-cents="${Number(recoveredValue?.cents || 0)}">${escapeHtml(recoveredLoopValueLabel)}</div>
        <div class="value-subtext">The customer came back. One recovery path has now been verified.</div>
      </div>
      ` : ""}

      <div class="loop-card">
        <div class="card-label">Proof loop</div>
        <div class="loop-list">
${loopHtml}
        </div>
      </div>

      <div class="bridge-card">
        <div class="card-label">What you verify next</div>
        <div class="loop-list">
${nextStepsHtml}
        </div>
      </div>

      <div class="bridge-card">
        <div class="card-label">${proofRecoveredState ? "Why install now" : "What happens after proof"}</div>
        <div class="bridge-copy">${escapeHtml(transitionCopy)}</div>
      </div>

      <div class="actions">
        <a class="button button-primary" href="${escapeHtml(primaryCtaUrl)}">${escapeHtml(primaryCtaLabel)}</a>
        <a class="button button-secondary" href="${escapeHtml(secondaryCtaUrl)}">${escapeHtml(secondaryCtaLabel)}</a>
        <a class="button button-secondary" href="${escapeHtml(proofRecoveredState ? freshProofUrl : pricingUrl)}">${escapeHtml(proofRecoveredState ? "Run another proof" : "See pricing")}</a>
      </div>
      <div class="cta-subtext">${proofRecoveredState
        ? "Proof first, then install, then paid billing when the store is ready."
        : "Proof first. Install second. Paid plan after the loop has been verified."}</div>

      <div class="footer-grid">
        <div class="footer-card">
          <strong>Product</strong>
          <a href="${escapeHtml(installUrl)}">Install Abando</a>
          <a href="${escapeHtml(pricingUrl)}">Pricing</a>
        </div>
        <div class="footer-card">
          <strong>Proof</strong>
          <a href="${escapeHtml(experienceUrl)}">Try the connected experience</a>
          <a href="${escapeHtml(proofRecoveredState ? freshProofUrl : primaryCtaUrl)}">${escapeHtml(proofRecoveredState ? "Run another proof" : "Send a recovery to yourself")}</a>
        </div>
        <div class="footer-card">
          <strong>Support</strong>
          <a href="mailto:hello@abando.ai">hello@abando.ai</a>
        </div>
        <div class="footer-card">
          <strong>Privacy</strong>
          <a href="${escapeHtml(toMerchantFacingUrl("/privacy"))}">Privacy</a>
        </div>
      </div>
      <div class="footer-note">Abando keeps the journey simple: proof first, install second, paid billing only when the recovery loop has already earned trust.</div>
    </section>
  </main>
  ${proofRecoveredState ? `<script>
    (function () {
      var node = document.querySelector("[data-proof-recovered-value]");
      if (!node) return;
      var targetCents = Number(node.getAttribute("data-target-cents") || "0");
      if (!Number.isFinite(targetCents) || targetCents <= 0) return;
      var start = window.performance && typeof window.performance.now === "function" ? window.performance.now() : Date.now();
      var duration = 760;
      function formatUsd(cents) {
        return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
      }
      function tick(now) {
        var elapsed = Math.min(duration, now - start);
        var progress = elapsed / duration;
        var current = Math.round(targetCents * progress);
        node.textContent = formatUsd(current);
        if (elapsed < duration) {
          window.requestAnimationFrame(tick);
        } else {
          node.textContent = formatUsd(targetCents);
        }
      }
      window.requestAnimationFrame(tick);
    })();
  </script>` : ""}
</body>
</html>`;
}

function renderAcceptancePage({ shop, source = "", target = "", plan = "" }) {
  const normalizedShop = shop || "your-store.myshopify.com";
  const storeName = buildProofStoreName(normalizedShop);
  const resolvedSource = source || "proof";
  const resolvedTarget = target || normalizedShop;
  const installParams = new URLSearchParams();
  if (normalizedShop) installParams.set("shop", normalizedShop);
  installParams.set("src", resolvedSource);
  installParams.set("target", resolvedTarget);
  if (plan) installParams.set("plan", plan);

  const marketingUrl = "/marketing";
  const proofUrl = `/proof?shop=${encodeURIComponent(normalizedShop)}`;
  const installUrl = `/install/shopify?${installParams.toString()}`;
  const contactConfig = buildProofContactUrl({ shop: normalizedShop, source: resolvedSource, target: resolvedTarget });
  const paymentConfig = buildProofPaymentConfig({ shop: normalizedShop, source: resolvedSource, target: resolvedTarget, plan });
  const noDeadCtaDetected = Boolean(installUrl) && Boolean(contactConfig.href) && (!paymentConfig.available || Boolean(paymentConfig.href));
  const checklist = [
    { label: "Marketing page available", status: "pass", detail: marketingUrl },
    { label: "Proof page available", status: "pass", detail: proofUrl },
    { label: "Install page available", status: "pass", detail: installUrl },
    { label: "Contact CTA available", status: contactConfig.href ? "pass" : "fail", detail: contactConfig.href || "Missing contact path" },
    { label: "Payment CTA status", status: paymentConfig.available ? "pass" : "warn", detail: paymentConfig.label },
    { label: "Store-owned headline present", status: storeName ? "pass" : "fail", detail: `${storeName} is currently losing recoverable checkout revenue.` },
    { label: "Value block present", status: "pass", detail: `Estimated recoverable revenue: ${formatUsdWhole(getProofValueTier(normalizedShop).monthly)}/month` },
    { label: "No dead CTA detected", status: noDeadCtaDetected ? "pass" : "fail", detail: noDeadCtaDetected ? "Primary and secondary actions resolve cleanly." : "One or more CTA targets are missing." },
  ];

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Merchant Acceptance</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background: radial-gradient(circle at top, rgba(30, 41, 59, 0.22), transparent 42%), #020617;
      color: #e5eef8;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      padding: 32px 18px 60px;
    }
    .shell { width: 100%; max-width: 860px; margin: 0 auto; }
    .panel {
      background: rgba(15, 23, 42, 0.86);
      border: 1px solid rgba(148, 163, 184, 0.16);
      border-radius: 28px;
      box-shadow: 0 28px 80px rgba(2, 6, 23, 0.42);
      padding: 30px 24px;
    }
    .eyebrow {
      color: #94a3b8;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    h1 {
      margin: 12px 0 8px;
      color: #f8fafc;
      font-size: clamp(30px, 6vw, 42px);
      line-height: 1.05;
      letter-spacing: -0.04em;
    }
    .lede {
      margin: 0;
      color: #94a3b8;
      line-height: 1.6;
    }
    .link-row {
      margin-top: 18px;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .link-row a {
      display: inline-flex;
      align-items: center;
      padding: 10px 14px;
      border-radius: 999px;
      border: 1px solid rgba(148, 163, 184, 0.16);
      background: rgba(15, 23, 42, 0.72);
      color: #e5eef8;
      text-decoration: none;
      font-size: 13px;
      font-weight: 700;
    }
    .checklist {
      margin-top: 24px;
      display: grid;
      gap: 12px;
    }
    .item {
      display: grid;
      grid-template-columns: 88px 1fr;
      gap: 14px;
      padding: 16px;
      border-radius: 18px;
      border: 1px solid rgba(148, 163, 184, 0.12);
      background: rgba(2, 6, 23, 0.5);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 34px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .badge.pass { background: rgba(34, 197, 94, 0.18); color: #bbf7d0; }
    .badge.warn { background: rgba(245, 158, 11, 0.18); color: #fde68a; }
    .badge.fail { background: rgba(239, 68, 68, 0.18); color: #fecaca; }
    .item strong {
      display: block;
      color: #f8fafc;
      margin-bottom: 6px;
    }
    .item div:last-child {
      color: #94a3b8;
      line-height: 1.5;
      word-break: break-word;
    }
  </style>
</head>
<body>
  <main class="shell">
    <section class="panel">
      <div class="eyebrow">Merchant acceptance checklist</div>
      <h1>${escapeHtml(storeName)} merchant flow QA</h1>
      <p class="lede">Operator check before sending proof or install flow to a merchant.</p>
      <div class="link-row">
        <a href="${escapeHtml(marketingUrl)}">Open marketing</a>
        <a href="${escapeHtml(proofUrl)}">Open proof</a>
        <a href="${escapeHtml(installUrl)}">Open install</a>
      </div>
      <div class="checklist">
        ${checklist.map((item) => `
          <div class="item">
            <div><span class="badge ${item.status}">${item.status}</span></div>
            <div>
              <strong>${escapeHtml(item.label)}</strong>
              <div>${escapeHtml(item.detail)}</div>
            </div>
          </div>
        `).join("")}
      </div>
    </section>
  </main>
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
  const storeName = buildProofStoreName(shopDomain);
  const inviteState = buildInviteState({ shopDomain, cartsRecovered, cartsTotal, emailsSent });
  const surfaceBadge = embedded ? "Live store protection" : "Recovery verification";
  const surfaceNote = embedded
    ? "This view shows whether this store is exposed, protected, or actively recovering right now."
    : "This view shows whether this store is exposed, protected, or actively recovering right now.";
  const embeddedContextReady = embedded && embeddedContext?.hasHost && embeddedContext?.hasShop;
  const embeddedDegraded = embedded && !embeddedContextReady;
  const embeddedStatusLabel = embeddedDegraded ? "Embedded session needs refresh" : "Embedded session active";
  const embeddedStatusSubvalue = !embedded
    ? ""
    : embeddedDegraded
      ? "Shopify admin context is incomplete right now. Reopen Abando from Shopify Admin Apps for this store, or refresh the current CLI-managed dev session if the tunnel rotated."
      : "Shop and host context are present for this Shopify admin session. This session still depends on the currently live CLI-managed tunnel and is not yet a permanent infrastructure guarantee.";
  const connectParams = new URLSearchParams();
  if (embeddedContext?.shop) connectParams.set("shop", embeddedContext.shop);
  if (embeddedContext?.host) connectParams.set("host", embeddedContext.host);
  if (embeddedContext?.embedded) connectParams.set("embedded", "1");
  const connectUrl = embeddedContext?.shop
    ? `/auth?${connectParams.toString()}`
    : "/install/shopify";
  const showConnectPanel = connectionStatus !== "connected";
  const appBridgeScriptTag = embedded
    ? `<script src="${SHOPIFY_APP_BRIDGE_URL}" data-api-key="${escapeHtml(SHOPIFY_API_KEY)}"${embeddedContext?.host ? ` data-host="${escapeHtml(embeddedContext.host)}"` : ""}></script>`
    : "";
  const storeStatus = connectionStatus === "connected" ? "Connected" : "Not connected";
  const lastEventSeen = latestEventType || "No event yet";
  const lastEventTime = lastCheckoutEventAt || latestEventTimestamp || "—";
  const recoveryStatusLabel = merchantRecoveryStatus || "Not active";
  const recoveryChannelLabel = Array.isArray(lastRecoveryChannels) && lastRecoveryChannels.length > 0
    ? lastRecoveryChannels.join(" + ")
    : "";
  const recoveryActionLabel = recoveryActionStatus === "created"
    ? (sendNotConfigured ? "Send not configured" : "Recovery prepared")
    : recoveryActionStatus === "sent"
      ? recoveryChannelLabel
        ? `Recovery sent (${recoveryChannelLabel})`
        : "Recovery sent"
      : recoveryActionStatus === "failed"
        ? "Recovery failed"
        : "Not active";
  const recoveryStatusSubvalue =
    recoveryStatusLabel === "Recovery ready"
      ? "A customer left checkout. This revenue can still be saved."
      : recoveryStatusLabel === "Listening for checkout activity"
        ? "This store is protected and waiting for the next checkout drop-off."
        : recoveryStatusLabel === "Not connected"
          ? "This store is exposed until Abando is connected."
          : "Recovery state changes the moment the next checkout drop-off appears.";
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
    ? `Customer returned through this recovery path${lastCustomerReturnAt ? ` · ${lastCustomerReturnAt}` : ""}`
    : "Customer has not returned through this recovery path yet.";
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
      : "Most recent live recovery delivery.";
  const heroEyebrow = recoveryStatusLabel === "Recovery ready"
    ? "ABANDO — LIVE RECOVERY"
    : "ABANDO — LIVE RECOVERY";
  const heroHeadline = recoveryStatusLabel === "Recovery ready"
    ? "A customer left checkout."
    : connectionStatus === "connected"
      ? "Your store is protected and listening for checkout drop-off."
      : "Your store is not protected yet.";
  const heroLead = recoveryStatusLabel === "Recovery ready"
    ? "A customer left checkout. This revenue can still be saved."
    : connectionStatus === "connected"
      ? "Your store is protected and listening for the next checkout drop-off."
      : "This store is exposed until Abando is connected.";
  const heroTension = recoveryStatusLabel === "Recovery ready"
    ? "If nothing is sent, this revenue is lost."
    : "";
  const storyTitle = "What is happening";
  const storyBody = recoveryStatusLabel === "Recovery ready"
    ? "Recovery is prepared. Send it now before the moment is gone."
    : connectionStatus === "connected"
      ? "The next lost checkout can become recovery immediately."
      : "If a customer leaves checkout now, nothing brings them back.";
  const whyThisMattersBody = "When a customer leaves checkout, revenue does not disappear all at once. There is a short window where intent is still alive. Abando is built to act inside that window.";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(CANONICAL_APP_NAME)}</title>
  ${appBridgeScriptTag}
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
    .review-panel,
    .connect-panel {
      margin-top: 20px;
      border-radius: 18px;
      padding: 18px;
    }
    .review-panel {
      border: 1px solid rgba(125, 211, 252, 0.18);
      background: rgba(2, 6, 23, 0.56);
    }
    .connect-panel {
      border: 1px solid rgba(125, 211, 252, 0.24);
      background: rgba(8, 47, 73, 0.26);
    }
    .review-steps {
      margin: 12px 0 0;
      padding-left: 18px;
      color: #cbd5e1;
      font-size: 15px;
      line-height: 1.65;
    }
    .review-steps li + li {
      margin-top: 6px;
    }
    .connect-actions {
      margin-top: 14px;
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
    }
    .connect-button {
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
    <div class="brand">${escapeHtml(CANONICAL_APP_NAME)}</div>
    <section class="panel">
      <div class="label">${escapeHtml(heroEyebrow)}</div>
      <h1>${escapeHtml(heroHeadline)}</h1>
      <p class="lead">${escapeHtml(heroLead)}</p>
      ${heroTension ? `<p class="lead" style="margin-top:12px; color:#f8fafc;">${escapeHtml(heroTension)}</p>` : ""}
      <div class="status">${abandoStatus}</div>
      <div class="surface-note">${surfaceBadge} · ${surfaceNote}</div>
      <section class="review-panel">
        <div class="label">${escapeHtml(storyTitle)}</div>
        <div class="subvalue">${escapeHtml(storyBody)}</div>
      </section>
      ${showConnectPanel ? `
        <section class="connect-panel">
          <div class="label">Store connection</div>
          <div class="value">Protect this store</div>
          <div class="subvalue">${embeddedContext?.shop
            ? `This store is not connected yet. Use the Shopify session for ${escapeHtml(embeddedContext.shop)} to complete connection.`
            : "Shopify session context is missing. Reopen the app from Shopify Admin, then connect the store."}</div>
          <div class="connect-actions">
            ${embeddedContext?.shop ? `<a class="connect-button" href="${escapeHtml(connectUrl)}">Protect this store</a>` : ""}
            <div class="subvalue">${embeddedContext?.shop ? "No manual myshopify domain entry is required from this screen." : "If shop context is missing, reopen Abando from Shopify Admin for the current test store."}</div>
          </div>
        </section>
      ` : ""}
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
        connectUrl,
      })}
      <section class="recovery-experience">
        <h2>What the customer would receive</h2>
        <p>The exact message. The exact path back.</p>
        <div class="recovery-preview-grid">
          <div class="recovery-preview-card">
            <div class="label">Recovery message</div>
            <div class="value">Email</div>
            <div class="subvalue">${escapeHtml(recoveryMessage.emailSubject)}</div>
            <pre>${escapeHtml(recoveryMessage.emailBody)}</pre>
          </div>
          <div class="recovery-preview-card">
            <div class="label">Return path</div>
            <div class="value">Recovery link</div>
            <div class="subvalue">Exact path back to checkout</div>
            <pre>${escapeHtml(recoveryMessage.smsText)}</pre>
            <code data-abando-return-link>${escapeHtml(recoveryMessage.returnLink)}</code>
            <p class="subvalue" data-abando-customer-return>${escapeHtml(recoveryReturnLabel)}</p>
          </div>
        </div>
        <p>This is the exact recovery your customer will receive.</p>
        <div class="recovery-actions">
          <button type="button" class="recovery-button" disabled>${recoverySendConfigured ? "Recovery ready to send" : "Send not configured"}</button>
          <button
            type="button"
            class="recovery-button secondary"
            data-abando-send-test-recovery
            data-shop-domain="${escapeHtml(shopDomain)}"
          >
            Send recovery
          </button>
          <div class="recovery-status-note">${recoverySendConfigured ? "Live delivery appears only after a real send succeeds." : "Send not configured. Abando will not mark sent until SMTP is configured and a real send succeeds."}</div>
        </div>
        <div class="recovery-live-test">
          <div class="label">Send the exact recovery</div>
          <p>Send the exact recovery created for this checkout event.</p>
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
              Send recovery
            </button>
            <div class="recovery-live-test-status" data-abando-live-test-status></div>
          </div>
        </div>
      </section>
      <section class="review-panel">
        <div class="label">Why this matters</div>
        <div class="subvalue">${escapeHtml(whyThisMattersBody)}</div>
      </section>
      <div class="grid">
        <div class="card">
          <div class="label">Store Status</div>
          <div class="value">${storeStatus}</div>
          <div class="subvalue">${escapeHtml(shopDomain)}</div>
        </div>
        <div class="card">
          <div class="label">Recovery state for this store</div>
          <div class="value">${recoveryStatusLabel}</div>
          <div class="subvalue">${recoveryStatusSubvalue}</div>
        </div>
        <div class="card">
          <div class="label">Latest customer signal</div>
          <div class="value">${escapeHtml(lastEventSeen)}</div>
          <div class="subvalue">Most recent checkout-related event recorded for this store.</div>
        </div>
        <div class="card">
          <div class="label">Last Event Timestamp</div>
          <div class="value">${escapeHtml(lastEventTime)}</div>
          <div class="subvalue">When the latest checkout event was recorded.</div>
        </div>
        <div class="card">
          <div class="label">Detected drop-off signals</div>
          <div class="value">${checkoutEventCount ?? 0}</div>
          <div class="subvalue">Normalized checkout/cart signals recorded for this connected store.</div>
        </div>
        <div class="card">
          <div class="label">Recovery state</div>
          <div class="value">${recoveryActionLabel}</div>
          <div class="subvalue">${recoveryActionStatus === "created" ? (sendNotConfigured ? "A recovery record exists, but outbound send is not configured." : "A live recovery path has already been prepared for this store.") : recoveryActionStatus === "sent" ? `A real recovery was sent${recoveryChannelLabel ? ` via ${recoveryChannelLabel}` : ""}.` : recoveryActionStatus === "failed" ? "The last recovery send failed." : "No recovery path has been prepared yet."}</div>
        </div>
        <div class="card">
          <div class="label">Most recent recovery created</div>
          <div class="value">${escapeHtml(lastRecoveryActionLabel)}</div>
          <div class="subvalue">Most recent durable recovery action recorded for this store.</div>
        </div>
        <div class="card">
          <div class="label">Most recent recovery delivery</div>
          <div class="value" data-abando-last-send-status-card>${escapeHtml(lastSendStatusLabel)}</div>
          <div class="subvalue">${escapeHtml(lastSendSubvalue)}</div>
        </div>
        <div class="card">
          <div class="label">Latest recovery send time</div>
          <div class="value" data-abando-last-send-time-card>${escapeHtml(lastSendTime || "—")}</div>
          <div class="subvalue">Most recent merchant test send timestamp.</div>
        </div>
        <div class="card">
          <div class="label">Active recovery channel</div>
          <div class="value" data-abando-last-send-channels-card>${escapeHtml(lastSendChannelsLabel)}</div>
          <div class="subvalue">Successful channels from the latest merchant test send.</div>
        </div>
        <div class="card">
          <div class="label">Getting Started</div>
          <div class="value">${connectionStatus === "connected" ? "Simulate checkout drop-off" : "Protect this store"}</div>
          <div class="subvalue">${connectionStatus === "connected"
            ? "Use the checkout drop-off simulation to verify protection, then prepare recovery after the first signal arrives."
            : "Finish Shopify connection first. After that, Abando starts listening for checkout drop-off."}</div>
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
      if (statusNode) statusNode.textContent = "Simulating checkout drop-off…";

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

        if (titleNode) titleNode.textContent = "A customer dropped off. Recovery is now live.";
        if (pillNode) pillNode.textContent = "Recovery live";
        if (descriptionNode) descriptionNode.textContent = "Abando has already prepared the recovery path for this checkout event.";
        if (subtextNode) subtextNode.textContent = "Latest customer signal: " + (data.lastEventTimestamp || now);
        if (metaNode) metaNode.textContent = "Detected drop-off signals: " + String(currentCount + 1);
        if (statusNode) statusNode.textContent = "Drop-off detected";

        window.setTimeout(function () {
          if (titleNode) titleNode.textContent = "A customer dropped off. Recovery is now live.";
          if (pillNode) pillNode.textContent = "Recovery live";
          if (descriptionNode) descriptionNode.textContent = "Abando has already prepared the recovery path for this checkout event.";
          if (statusNode) statusNode.textContent = "Recovery prepared";
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
      if (statusNode) statusNode.textContent = "Preparing recovery…";

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
            ? (channelLabel ? "Recovery sent (" + channelLabel + ")" : "Recovery sent")
            : data.recoveryActionStatus === "created" && channels.length === 0 && !data.sentAt
              ? "Send not configured"
              : "Recovery prepared";

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
      if (statusNode) statusNode.textContent = "Sending recovery…";

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
      if (statusNode) statusNode.textContent = "Sending recovery…";

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
          messages.push("Recovery sent to your phone");
        } else if (Array.isArray(data.providerStatuses) && data.providerStatuses.indexOf("sms_not_configured") !== -1 && payload.phone) {
          messages.push("SMS not configured");
        }

        if (Array.isArray(data.channels) && data.channels.indexOf("email") !== -1) {
          messages.push("Recovery sent to your inbox");
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
  const redirectUri = encodeURIComponent("https://app.abando.ai/auth/callback");
  console.log("[OAUTH] redirect_uri FIXED → https://app.abando.ai/auth/callback");
  return `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${encodeURIComponent(SHOPIFY_SCOPES)}&redirect_uri=${redirectUri}&state=${state}&grant_options[]=per-user`;
}

function startShopifyOAuth(req, res) {
  const embeddedContext = getEmbeddedContext(req);
  let shop = embeddedContext.shop;
  const inviteId = normalizeInviteId(req.query.invite);
  const installSource = String(req.query.src || req.query.source || "").trim().toLowerCase();
  const installTarget = normalizeInstallAttributionValue(req.query.target || req.query.domain || "");

  if (!shop || !shop.endsWith(".myshopify.com")) {
    return res.status(400).send("Missing/invalid ?shop=your-store.myshopify.com");
  }

  if (!SHOPIFY_API_KEY || !SHOPIFY_API_SECRET || !APP_URL) {
    return res.status(500).send("Shopify OAuth is not configured. Required env: SHOPIFY_API_KEY, SHOPIFY_API_SECRET, APP_URL.");
  }

  const embedded = embeddedContext.embedded;
  const callbackBaseUrl = getConfiguredPublicBaseUrl() || APP_URL;
  const state = buildOAuthState(inviteId);
  const parsedState = parseOAuthState(state);
  res.cookie("shopify_state", parsedState.nonce, { httpOnly: true, sameSite: "none", secure: true, path: "/" });
  if (installSource) {
    res.cookie("abando_install_source", installSource, { httpOnly: true, sameSite: "none", secure: true, path: "/" });
  }
  if (installTarget) {
    res.cookie("abando_install_target", installTarget, { httpOnly: true, sameSite: "none", secure: true, path: "/" });
  }
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
  appendInstallEvent({
    phase: "install_started",
    shop,
    source: installSource || "",
    target_domain: installTarget || "",
  }).catch(() => {});
  if (installTarget) {
    updateOutreachInstallTracking({
      targetDomain: installTarget,
      installStatus: "started",
      installedShop: shop,
      installStartedAt: new Date().toISOString(),
    }).catch(() => {});
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
  const installSource = String(req.cookies?.abando_install_source || req.query.src || req.query.source || "").trim().toLowerCase();
  const installTarget = normalizeInstallAttributionValue(req.cookies?.abando_install_target || req.query.target || req.query.domain || "");
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
    await appendInstallEvent({
      phase: "install_completed",
      shop,
      source: installSource || "",
      target_domain: installTarget || "",
    }).catch(() => {});
    if (installTarget) {
      await updateOutreachInstallTracking({
        targetDomain: installTarget,
        installStatus: "installed",
        installedShop: shop,
        installedAt: installedAt,
      }).catch(() => {});
    }
    res.clearCookie("abando_install_source", { path: "/" });
    res.clearCookie("abando_install_target", { path: "/" });

    const redirectQuery = new URLSearchParams();
    redirectQuery.set("shop", shop);
    redirectQuery.set("state", "connected");
    const redirectTarget = `/experience?${redirectQuery.toString()}`;
    console.log("[OAUTH] callback success redirect", {
      trace,
      shop,
      inviteId: inviteId || null,
      state: "connected",
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
  return res.redirect(buildCanonicalBillingStartPath({
    shop,
    source: "connected_experience",
    target: shop,
    plan: "starter",
  }));
});
app.get("/shopify/billing/return", async (req, res) => {
  const shop = normalizeShop(req.query.shop);
  return res.redirect(`/experience?shop=${encodeURIComponent(shop || "")}&state=connected`);
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
const HOST = String(process.env.HOST || "").trim() || (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1");
app.listen(PORT, HOST, () => {
  console.log(`[server] listening on ${HOST}:${PORT}`);
  console.log("[server] runtime", {
    pid: process.pid,
    entrypoint: fileURLToPath(import.meta.url),
    host: HOST,
    port: PORT,
  });
  console.log("[env-debug]", {
    SMTP_HOST_present: String(process.env.SMTP_HOST || "").trim() ? "yes" : "no",
    SMTP_USER_present: String(process.env.SMTP_USER || "").trim() ? "yes" : "no",
    TWILIO_ACCOUNT_SID_present: String(process.env.TWILIO_ACCOUNT_SID || "").trim() ? "yes" : "no",
    TWILIO_FROM_present: (String(process.env.TWILIO_FROM || "").trim() || String(process.env.TWILIO_FROM_NUMBER || "").trim()) ? "yes" : "no",
  });
  console.log(`[env-check] SMTP configured: ${isEmailSenderConfigured() ? "yes" : "no"}`);
  console.log(`[env-check] TWILIO configured: ${isSmsSenderConfigured() ? "yes" : "no"}`);
});
// Public Stripe checkout (no auth)
app.post("/api/billing/checkout", async (req, res) => {
  try {
    const Stripe = (await import("stripe")).default;
    const stripeKey = getStripeSecretKey();
    const { starter: priceStarter, pro: pricePro } = getStripePriceIds();
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
