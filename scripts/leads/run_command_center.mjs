#!/usr/bin/env node

import "../dev/load_secrets.mjs";

import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { exportSendConsoleData } from "./export_send_console_data.mjs";
import { runAction } from "../../staffordos/actions/run_action.mjs";
import { sendOutreach } from "../../staffordos/outreach/send_outreach.mjs";
import { prepareGithubComment } from "../../staffordos/outreach/prepare_github_comment.mjs";
import { generatePaymentSuggestionMessage } from "../../staffordos/outreach/generateMessage.js";
import { detectReplyType } from "../../staffordos/replies/detect_reply_type.mjs";
import { suggestCloseResponse } from "../../staffordos/replies/suggest_close_response.mjs";
import { routeRevenueOpportunity } from "../../staffordos/router/router_v1_1.js";
import { updateStatus, loadLeads, appendMessage } from "./pipeline_manager.mjs";
import {
  findLatestSubmissionForLead,
  linkIntakeToLead,
  listFixIntakeSubmissions,
} from "../../staffordos/fix/intake_store.mjs";
import {
  deriveLeadStageFromTruth,
  deriveNextActionFromTruth,
  deriveTruthBooleans,
  getLeadTruth,
  loadLeadTruthStore,
  markCommentSent,
  recordReplyTruth,
  resetAllTruthForLead,
  resetCommentTruth,
  resetPaymentTruth,
  resetReplyTruth,
  sendPaymentLinkTruth,
} from "../../staffordos/truth/lead_truth_store.mjs";
import { createFixCheckoutSession } from "../../web/src/lib/fixCheckout.js";

const repoRoot = resolve(dirname(new URL(import.meta.url).pathname), "..", "..");
process.chdir(repoRoot);

const PORT = 4320;
const UI_ROOT = resolve(repoRoot, "staffordos/ui/command-center");
const SEND_CONSOLE_DATA_PATH = ".tmp/send_console_data.json";
const PAYMENT_OFFERS_PATH = ".tmp/payment_offers.json";
const DELIVERIES_PATH = ".tmp/deliveries.json";
const DIAGNOSES_PATH = ".tmp/command_center_diagnoses.json";
const PREP_PATH = ".tmp/github_comment_prep.json";
const REPLY_MEMORY_PATH = ".tmp/reply_memory.json";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

async function readJson(path, fallback = []) {
  try {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return fallback;
    }
    throw error;
  }
}

async function writeJson(path, payload) {
  await mkdir(resolve(repoRoot, ".tmp"), { recursive: true });
  await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(`${JSON.stringify(payload, null, 2)}\n`);
}

async function serveFile(res, path) {
  const body = await readFile(path);
  res.writeHead(200, {
    "Content-Type": MIME_TYPES[extname(path)] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  res.end(body);
}

async function readRequestBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function byLeadId(items) {
  return new Map(
    (Array.isArray(items) ? items : [])
      .map((item) => [String(item?.leadId || item?.id || "").trim(), item])
      .filter(([key]) => key),
  );
}

function formatCaseType(caseType = "") {
  return String(caseType || "")
    .trim()
    .split("_")
    .filter(Boolean)
    .map((part, index) => (index === 0 ? part : part))
    .join(" ");
}

function buildClientDiagnosis(intakeSubmission, diagnosis) {
  const source = intakeSubmission?.diagnosis || diagnosis || null;
  if (!source) {
    return null;
  }

  const likelyIssue = formatCaseType(source.caseType || "shopify_dev_path_issue") || "shopify dev path issue";
  const explanation =
    intakeSubmission?.explanation ||
    "The setup likely has a broken handoff between the public URL, app config, and Shopify embedded render path.";
  const whatIWouldFix = Array.isArray(intakeSubmission?.whatIWouldFix)
    ? intakeSubmission.whatIWouldFix
    : Array.isArray(source?.suggestedFix)
      ? source.suggestedFix
      : [];
  const inScope = intakeSubmission
    ? intakeSubmission.recommendedNextStep === "payment"
    : Number(source?.confidence || 0) >= 0.55;

  return {
    likelyIssue,
    explanation,
    whatIWouldFix,
    inScope,
  };
}

function parseTime(value) {
  const timestamp = Date.parse(String(value || ""));
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function textHasAny(text, patterns) {
  return patterns.some((pattern) => text.includes(pattern));
}

function buildReplyPreview(text, maxLength = 180) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (!normalized) {
    return null;
  }
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function buildRouterInputForLead(lead, truth) {
  const combinedText = normalizeText(
    [
      lead?.issueTitle,
      lead?.problemSummary,
      truth?.reply?.text,
    ]
      .filter(Boolean)
      .join(" "),
  );

  const hasBrokenPages = textHasAny(combinedText, [
    "broken page",
    "blank page",
    "page not found",
    "404",
    "500",
  ])
    ? true
    : "unknown";

  const hasAppEmbedIssue = textHasAny(combinedText, [
    "embedded",
    "iframe",
    "shopify admin",
    "redirect loop",
    "invalid path",
    "host parameter",
  ])
    ? true
    : "unknown";

  const hasThemeRenderIssue = textHasAny(combinedText, [
    "theme extension",
    "theme render",
    "render issue",
    "metaobject",
    "liquid",
  ])
    ? true
    : "unknown";

  const checkoutAccessible = textHasAny(combinedText, [
    "checkout inaccessible",
    "checkout unavailable",
    "cannot access checkout",
    "can't access checkout",
    "checkout down",
  ])
    ? false
    : "unknown";

  const hasPerformanceDegradation = textHasAny(combinedText, [
    "slow",
    "flaky",
    "unstable",
    "stuck",
    "timeout",
    "timed out",
    "etimedout",
    "econnreset",
    "silent",
    "swallows server logs",
    "reverse proxy error",
    "keeps changing",
    "then breaks",
    "breaks",
    "dies",
    "not working",
    "is not working",
    "beta requirements not met",
    "cors",
    "cloudflare issue",
    "tunnel",
    "preview",
    "dev workflow issue",
  ])
    ? true
    : "unknown";

  return {
    store: {
      storeUrl: String(lead?.sendTarget || lead?.id || "unknown-lead"),
    },
    technical: {
      hasBrokenPages,
      hasAppEmbedIssue,
      hasThemeRenderIssue,
      checkoutAccessible,
      hasPerformanceDegradation,
    },
    traffic: {
      hasMeaningfulTraffic: "unknown",
    },
    conversion: {
      checkoutFlowVisible: "unknown",
    },
    cartRecovery: {
      cartRecoveryOpportunity: "unknown",
    },
    inventory: {
      inventoryActivationOpportunity: "unknown",
    },
  };
}

function selectLatestCheckoutOffer(offers, leadId) {
  const now = Date.now();
  const items = (Array.isArray(offers) ? offers : [])
    .filter((item) => item && item.leadId === leadId)
    .sort((left, right) => parseTime(right?.createdAt) - parseTime(left?.createdAt));

  const latest = items[0] || null;
  const latestFresh = items.find((item) => {
    const expiresAt = parseTime(item?.expiresAt);
    return typeof item?.paymentUrl === "string" && item.paymentUrl.startsWith("https://") && expiresAt > now;
  }) || null;

  return { latest, latestFresh };
}

async function loadCommandCenterData() {
  await exportSendConsoleData();

  const [base, offers, deliveries, diagnoses, prep, replies, submissions, truthStore] = await Promise.all([
    readJson(SEND_CONSOLE_DATA_PATH, []),
    readJson(PAYMENT_OFFERS_PATH, []),
    readJson(DELIVERIES_PATH, []),
    readJson(DIAGNOSES_PATH, []),
    readJson(PREP_PATH, []),
    readJson(REPLY_MEMORY_PATH, []),
    listFixIntakeSubmissions(),
    loadLeadTruthStore(),
  ]);

  const deliveryByLeadId = byLeadId(deliveries);
  const diagnosisByLeadId = byLeadId(diagnoses);
  const prepByLeadId = byLeadId(prep);
  const latestReplyByLeadId = new Map();
  for (const entry of Array.isArray(replies) ? replies : []) {
    const leadId = String(entry?.leadId || "").trim();
    if (!leadId) continue;
    const current = latestReplyByLeadId.get(leadId);
    if (!current || String(entry.detectedAt || "") > String(current.detectedAt || "")) {
      latestReplyByLeadId.set(leadId, entry);
    }
  }

  return (Array.isArray(base) ? base : []).map((item) => {
    const { latest: latestOffer, latestFresh: freshOffer } = selectLatestCheckoutOffer(offers, item.id);
    const offer = freshOffer || latestOffer || null;
    const delivery = deliveryByLeadId.get(item.id) || null;
    const diagnosis = diagnosisByLeadId.get(item.id) || null;
    const prepared = prepByLeadId.get(item.id) || null;
    const replyAnalysis = latestReplyByLeadId.get(item.id) || null;
    const intakeSubmission = findLatestSubmissionForLead(submissions, item) || null;
    const outreachStatus = prepared ? "ready_to_post" : item.status === "contacted" ? "contacted" : "not_prepared";
    const truth = truthStore?.leads?.[item.id] || {
      leadId: item.id,
      githubIssueUrl: item.sendTarget || null,
      firstComment: { sent: false, timestamp: null, messageHash: null, note: null },
      reply: { exists: false, timestamp: null, text: null, note: null },
      payment: { status: "none", timestamp: null, paymentUrl: null, offerId: null, note: null },
    };
    const record = {
      id: item.id,
      name: item.name,
      status: item.status,
      problemSummary: item.problemSummary,
      issueTitle: item.issueTitle,
      source: item.source,
      sendTarget: item.sendTarget,
      message: item.message,
      followUpMessage: item.followUpMessage,
      paymentStatus: truth.payment.status,
      paymentUrl: truth.payment.paymentUrl,
      availablePaymentUrl: freshOffer?.paymentUrl || null,
      availableOfferId: freshOffer?.offerId || freshOffer?.id || null,
      availableSessionId: freshOffer?.checkoutSessionId || null,
      availableCheckoutExpiresAt: freshOffer?.expiresAt || null,
      availableRecoveryUrl: freshOffer?.recoveryUrl || null,
      latestCheckoutUrl: offer?.paymentUrl || null,
      latestCheckoutSessionId: offer?.checkoutSessionId || null,
      latestCheckoutExpiresAt: offer?.expiresAt || null,
      latestCheckoutExpired: Boolean(offer?.expiresAt) && parseTime(offer.expiresAt) <= Date.now(),
      paymentPriceUsd: offer?.priceUsd || item.paymentPriceUsd || null,
      deliveryStatus: delivery?.status || null,
      diagnosis: diagnosis
        ? {
            caseType: diagnosis.caseType,
            confidence: diagnosis.confidence,
            suggestedFix: diagnosis.suggestedFix,
          }
        : null,
      intakeSubmission: intakeSubmission
        ? {
            submissionId: intakeSubmission.submissionId,
            issueText: intakeSubmission.issueText,
            githubIssueUrl: intakeSubmission.githubIssueUrl,
            repoOrSetupUrl: intakeSubmission.repoOrSetupUrl,
            diagnosis: intakeSubmission.diagnosis,
            explanation: intakeSubmission.explanation,
            typicalSymptoms: intakeSubmission.typicalSymptoms,
            whatIWouldFix: intakeSubmission.whatIWouldFix,
            recommendedNextStep: intakeSubmission.recommendedNextStep,
            createdAt: intakeSubmission.createdAt,
          }
        : null,
      replyAnalysis: replyAnalysis
        ? {
            replyText: replyAnalysis.replyText,
            replyType: replyAnalysis.replyType,
            confidence: replyAnalysis.confidence,
            matchedSignals: replyAnalysis.matchedSignals,
            intentSummary: replyAnalysis.intentSummary,
          }
        : null,
      outreachPrepStatus: outreachStatus,
      outreachPreparedAt: prepared?.preparedAt || null,
      nextAction: item.nextAction,
      truth,
    };

    record.clientDiagnosis = buildClientDiagnosis(record.intakeSubmission, record.diagnosis);
    const leadStage = deriveLeadStageFromTruth(truth);
    const truthBooleans = deriveTruthBooleans(truth);
    const workflow = deriveNextActionFromTruth(truth);
    const routerInput = buildRouterInputForLead(record, truth);
    const routerResult = routeRevenueOpportunity(routerInput);
    const replyDetected = Boolean(truth.reply?.exists);
    const isHotLead = Boolean(truth.firstComment?.sent) && replyDetected && truth.payment?.status === "none";
    const shouldSuggestPayment = isHotLead && routerResult.primaryEngine === "FIX";
    const paymentSuggestionReason = shouldSuggestPayment
      ? "Lead replied and this routes to FIX. Payment link is the next commercial step."
      : null;
    const replyPreview = replyDetected ? buildReplyPreview(truth.reply?.text || "") : null;
    const paymentSuggestionDraft = shouldSuggestPayment
      ? generatePaymentSuggestionMessage({
          lead: record,
          checkoutUrl: freshOffer?.paymentUrl || null,
        })
      : null;

    return {
      ...record,
      leadStage,
      nextBestAction: workflow.nextBestAction,
      nextBestActionLabel: workflow.nextBestActionLabel,
      nextBestActionReason: workflow.nextBestActionReason,
      replyDetected,
      isHotLead,
      shouldSuggestPayment,
      suggestedAction: shouldSuggestPayment ? "send_payment_link" : workflow.nextBestAction,
      paymentSuggestionReason,
      replyPreview,
      paymentSuggestionDraft,
      ...truthBooleans,
    };
  });
}

async function saveDiagnosis(result) {
  const diagnoses = await readJson(DIAGNOSES_PATH, []);
  const list = Array.isArray(diagnoses) ? diagnoses : [];
  const existing = list.find((item) => item.leadId === result.leadId);
  const record = {
    leadId: result.leadId,
    caseType: result.caseType,
    confidence: result.confidence,
    suggestedFix: result.suggestedFix,
    updatedAt: new Date().toISOString(),
  };
  if (existing) {
    Object.assign(existing, record);
  } else {
    list.push(record);
  }
  await writeJson(DIAGNOSES_PATH, list);
}

async function createFreshCheckoutForLead(leadId, source = "command_center") {
  const lead = await findLeadRecord(leadId);
  if (!lead) {
    throw new Error(`lead_not_found:${leadId}`);
  }

  return createFixCheckoutSession({
    leadId,
    source,
    name: lead.name || "",
    githubIssueUrl: lead.sendTarget || "",
    returnBaseUrl: process.env.FIX_RETURN_BASE_URL || "http://127.0.0.1:8081",
  });
}

async function markCommentPosted(leadId, note = "") {
  const leads = await loadLeads();
  const lead = leads.find((item) => item.id === leadId);
  if (!lead) {
    throw new Error(`lead_not_found:${leadId}`);
  }

  await updateStatus(leadId, "contacted");
  if (String(note || "").trim()) {
    await appendMessage(leadId, "note", String(note).trim());
  }

  const prep = await readJson(PREP_PATH, []);
  const updatedPrep = (Array.isArray(prep) ? prep : []).filter((item) => item.leadId !== leadId);
  await writeJson(PREP_PATH, updatedPrep);

  const refreshed = (await loadLeads()).find((item) => item.id === leadId);
  return refreshed;
}

async function saveReplyNote(leadId, text, replyType, suggestedResponse) {
  const noteParts = [
    "Reply Assistant note:",
    `reply=${String(text || "").trim()}`,
    `replyType=${String(replyType || "").trim() || "unknown"}`,
    `suggestedResponse=${String(suggestedResponse || "").trim()}`,
  ];
  await appendMessage(leadId, "note", noteParts.join("\n"));
}

async function findLeadRecord(leadId) {
  const records = await loadCommandCenterData();
  return records.find((item) => item.id === leadId) || null;
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", "http://127.0.0.1");

    if (req.method === "GET" && url.pathname === "/api/command-center-data") {
      const records = await loadCommandCenterData();
      sendJson(res, 200, { ok: true, records });
      return;
    }

    if (req.method === "GET" && url.pathname.startsWith("/api/truth/")) {
      const leadId = decodeURIComponent(url.pathname.replace("/api/truth/", "")).trim();
      const lead = await findLeadRecord(leadId);
      const truth = await getLeadTruth(leadId, lead?.sendTarget || "");
      sendJson(res, 200, { ok: true, truth });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/fix-intake-submissions") {
      const submissions = await listFixIntakeSubmissions();
      sendJson(res, 200, { ok: true, submissions });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/run-action") {
      const payload = JSON.parse((await readRequestBody(req)) || "{}");
      const action = String(payload?.action || "").trim();
      const leadId = String(payload?.leadId || "").trim();
      let result;
      if (action === "generate_payment") {
        const checkout = await createFreshCheckoutForLead(leadId, "command_center");
        result = {
          status: "success",
          action: "generate_payment",
          leadId,
          offerId: checkout.offerId,
          paymentUrl: checkout.checkoutUrl,
          sessionId: checkout.sessionId,
          expiresAt: checkout.expiresAt,
        };
      } else {
        result = await runAction({
          action,
          leadId,
          caseType: String(payload?.caseType || "").trim(),
        });
      }
      if (result.action === "diagnose") {
        await saveDiagnosis(result);
      }
      const records = await loadCommandCenterData();
      sendJson(res, 200, { ok: true, result, records });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/truth/mark-comment-sent") {
      const payload = JSON.parse((await readRequestBody(req)) || "{}");
      const leadId = String(payload?.leadId || "").trim();
      const lead = await findLeadRecord(leadId);
      const result = await markCommentSent(
        leadId,
        lead?.sendTarget || "",
        String(payload?.message || "").trim(),
        String(payload?.note || "").trim(),
      );
      const records = await loadCommandCenterData();
      sendJson(res, result.ok ? 200 : 409, { ...result, records });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/truth/record-reply") {
      const payload = JSON.parse((await readRequestBody(req)) || "{}");
      const leadId = String(payload?.leadId || "").trim();
      const lead = await findLeadRecord(leadId);
      const result = await recordReplyTruth(
        leadId,
        lead?.sendTarget || "",
        String(payload?.text || "").trim(),
        String(payload?.note || "").trim(),
      );
      const records = await loadCommandCenterData();
      sendJson(res, result.ok ? 200 : 409, { ...result, records });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/truth/send-payment-link") {
      const payload = JSON.parse((await readRequestBody(req)) || "{}");
      const leadId = String(payload?.leadId || "").trim();
      const lead = await findLeadRecord(leadId);
      const checkout = await createFreshCheckoutForLead(leadId, "command_center");
      const result = await sendPaymentLinkTruth(
        leadId,
        lead?.sendTarget || "",
        checkout.checkoutUrl,
        checkout.offerId,
        String(payload?.note || "").trim(),
        Boolean(payload?.force),
      );
      const records = await loadCommandCenterData();
      sendJson(res, result.ok ? 200 : 409, { ...result, checkout, records });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/truth/mark-paid") {
      const records = await loadCommandCenterData();
      sendJson(res, 409, {
        ok: false,
        reason: "manual_mark_paid_disabled_use_stripe_webhook",
        records,
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/truth/reset-reply") {
      const payload = JSON.parse((await readRequestBody(req)) || "{}");
      const leadId = String(payload?.leadId || "").trim();
      const lead = await findLeadRecord(leadId);
      const result = await resetReplyTruth(leadId, lead?.sendTarget || "");
      const records = await loadCommandCenterData();
      sendJson(res, 200, { ...result, records });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/truth/reset-payment") {
      const payload = JSON.parse((await readRequestBody(req)) || "{}");
      const leadId = String(payload?.leadId || "").trim();
      const lead = await findLeadRecord(leadId);
      const result = await resetPaymentTruth(leadId, lead?.sendTarget || "");
      const records = await loadCommandCenterData();
      sendJson(res, 200, { ...result, records });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/truth/reset-comment") {
      const payload = JSON.parse((await readRequestBody(req)) || "{}");
      const leadId = String(payload?.leadId || "").trim();
      const lead = await findLeadRecord(leadId);
      const result = await resetCommentTruth(leadId, lead?.sendTarget || "");
      const records = await loadCommandCenterData();
      sendJson(res, 200, { ...result, records });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/truth/reset-all-for-lead") {
      const payload = JSON.parse((await readRequestBody(req)) || "{}");
      const leadId = String(payload?.leadId || "").trim();
      const lead = await findLeadRecord(leadId);
      const result = await resetAllTruthForLead(leadId, lead?.sendTarget || "");
      const records = await loadCommandCenterData();
      sendJson(res, 200, { ...result, records });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/generate-message") {
      const payload = JSON.parse((await readRequestBody(req)) || "{}");
      const result = await sendOutreach(String(payload?.leadId || "").trim());
      sendJson(res, 200, {
        ok: true,
        message: result.message,
        copyReady: result.copyReady,
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/prepare-github-comment") {
      const payload = JSON.parse((await readRequestBody(req)) || "{}");
      const result = await prepareGithubComment(String(payload?.leadId || "").trim());
      sendJson(res, result.ok ? 200 : 404, result);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/mark-comment-posted") {
      const payload = JSON.parse((await readRequestBody(req)) || "{}");
      const leadId = String(payload?.leadId || "").trim();
      const note = String(payload?.note || "").trim();
      const updatedLead = await markCommentPosted(leadId, note);
      const records = await loadCommandCenterData();
      sendJson(res, 200, { ok: true, lead: updatedLead, records });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/detect-reply") {
      const payload = JSON.parse((await readRequestBody(req)) || "{}");
      const detection = await detectReplyType(
        String(payload?.leadId || "").trim(),
        String(payload?.text || "").trim(),
      );
      sendJson(res, 200, detection);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/suggest-reply") {
      const payload = JSON.parse((await readRequestBody(req)) || "{}");
      const leadId = String(payload?.leadId || "").trim();
      const text = String(payload?.text || "").trim();
      const detection = await detectReplyType(leadId, text);
      const records = await loadCommandCenterData();
      const lead = records.find((item) => item.id === leadId) || {};
      const suggestion = await suggestCloseResponse(leadId, detection.replyType, text, {
        hasDiagnosis: Boolean(lead?.intakeSubmission?.diagnosis || lead?.diagnosis),
        hasIntake: Boolean(lead?.intakeSubmission),
        paymentStatus: lead?.paymentStatus || null,
      });
      sendJson(res, 200, { ok: true, detection, suggestion });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/save-reply-note") {
      const payload = JSON.parse((await readRequestBody(req)) || "{}");
      const leadId = String(payload?.leadId || "").trim();
      await saveReplyNote(
        leadId,
        String(payload?.text || "").trim(),
        String(payload?.replyType || "").trim(),
        String(payload?.suggestedResponse || "").trim(),
      );
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/link-intake-to-lead") {
      const payload = JSON.parse((await readRequestBody(req)) || "{}");
      const record = await linkIntakeToLead(
        String(payload?.submissionId || "").trim(),
        String(payload?.leadId || "").trim(),
      );
      const records = await loadCommandCenterData();
      sendJson(res, 200, { ok: true, submission: record, records });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/mark-paid") {
      const records = await loadCommandCenterData();
      sendJson(res, 409, {
        ok: false,
        reason: "manual_mark_paid_disabled_use_stripe_webhook",
        records,
      });
      return;
    }

    if (req.method === "GET" && url.pathname.startsWith("/.tmp/")) {
      const path = resolve(repoRoot, `.${url.pathname}`);
      await serveFile(res, path);
      return;
    }

    const filePath = join(UI_ROOT, url.pathname === "/" ? "index.html" : url.pathname.replace(/^\//, ""));
    if (!filePath.startsWith(UI_ROOT)) {
      sendJson(res, 403, { ok: false, error: "forbidden" });
      return;
    }

    await serveFile(res, filePath);
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

async function main() {
  await loadLeads();
  server.listen(PORT, "127.0.0.1", () => {
    console.log(`[command-center] running at http://127.0.0.1:${PORT}`);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error("[command-center] fatal:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
