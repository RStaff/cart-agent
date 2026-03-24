import crypto from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const repoRoot = resolve(dirname(new URL(import.meta.url).pathname), "..", "..");
const truthPath = resolve(repoRoot, ".tmp", "lead_truth.json");
const pipelinePath = resolve(repoRoot, ".tmp", "leads_pipeline.json");

function nowIso() {
  return new Date().toISOString();
}

function blankLeadTruth(leadId, githubIssueUrl = "") {
  return {
    leadId,
    githubIssueUrl: githubIssueUrl || null,
    firstComment: {
      sent: false,
      timestamp: null,
      messageHash: null,
      note: null,
    },
    reply: {
      exists: false,
      timestamp: null,
      text: null,
      note: null,
    },
    payment: {
      status: "none",
      timestamp: null,
      paymentUrl: null,
      offerId: null,
      note: null,
    },
  };
}

function blankReply() {
  return {
    exists: false,
    timestamp: null,
    text: null,
    note: null,
  };
}

function blankPayment() {
  return {
    status: "none",
    timestamp: null,
    paymentUrl: null,
    offerId: null,
    note: null,
  };
}

async function readJson(path, fallback) {
  try {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeTruth(data) {
  await mkdir(resolve(repoRoot, ".tmp"), { recursive: true });
  await writeFile(truthPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export function messageHash(message = "") {
  return message
    ? crypto.createHash("sha256").update(String(message), "utf8").digest("hex")
    : null;
}

export function deriveLeadStageFromTruth(truth) {
  const firstCommentSent = Boolean(truth?.firstComment?.sent);
  const replyExists = Boolean(truth?.reply?.exists);
  const paymentStatus = String(truth?.payment?.status || "none");

  if (!firstCommentSent) {
    return "new";
  }
  if (firstCommentSent && !replyExists && paymentStatus === "none") {
    return "contacted";
  }
  if (replyExists && paymentStatus === "none") {
    return "replied";
  }
  if (paymentStatus === "link_sent") {
    return "payment_link_sent";
  }
  if (paymentStatus === "paid") {
    return "paid";
  }
  return "new";
}

export function deriveTruthBooleans(truth) {
  const paymentStatus = String(truth?.payment?.status || "none");
  const firstCommentSent = Boolean(truth?.firstComment?.sent);
  const replyExists = Boolean(truth?.reply?.exists);

  return {
    canSendFirstComment: !firstCommentSent,
    canRecordReply: firstCommentSent && !replyExists,
    canSendPaymentLink: firstCommentSent && paymentStatus === "none",
    canMarkPaid: paymentStatus === "link_sent",
  };
}

export function deriveNextActionFromTruth(truth) {
  const stage = deriveLeadStageFromTruth(truth);
  switch (stage) {
    case "new":
      return {
        nextBestAction: "mark_comment_sent",
        nextBestActionLabel: "Mark Comment Sent",
        nextBestActionReason: "No first comment has been recorded yet.",
      };
    case "contacted":
      return {
        nextBestAction: "wait_for_reply",
        nextBestActionLabel: "Wait for Reply",
        nextBestActionReason: "A first comment is recorded, but no reply exists yet.",
      };
    case "replied":
      return {
        nextBestAction: "send_payment_link",
        nextBestActionLabel: "Send Payment Link",
        nextBestActionReason: "A reply exists and payment has not been recorded yet.",
      };
    case "payment_link_sent":
      return {
        nextBestAction: "mark_paid",
        nextBestActionLabel: "Mark Paid",
        nextBestActionReason: "A payment link was recorded as sent. Mark paid only after operator confirmation.",
      };
    case "paid":
      return {
        nextBestAction: "paid",
        nextBestActionLabel: "Paid",
        nextBestActionReason: "Payment is already marked paid locally.",
      };
    default:
      return {
        nextBestAction: "mark_comment_sent",
        nextBestActionLabel: "Mark Comment Sent",
        nextBestActionReason: "No first comment has been recorded yet.",
      };
  }
}

export async function loadLeadTruthStore() {
  const [existing, pipeline] = await Promise.all([readJson(truthPath, null), readJson(pipelinePath, [])]);

  const store =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? existing
      : { version: 1, updatedAt: nowIso(), leads: {} };

  store.version = 1;
  store.updatedAt = store.updatedAt || nowIso();
  store.leads = store.leads && typeof store.leads === "object" ? store.leads : {};

  for (const lead of Array.isArray(pipeline) ? pipeline : []) {
    const leadId = String(lead?.id || "").trim();
    if (!leadId) continue;
    const record = store.leads[leadId] || blankLeadTruth(leadId, String(lead?.url || "").trim());
    if (!record.githubIssueUrl && lead?.url) {
      record.githubIssueUrl = String(lead.url);
    }

    store.leads[leadId] = record;
  }

  await writeTruth(store);
  return store;
}

export async function saveLeadTruthStore(store) {
  store.version = 1;
  store.updatedAt = nowIso();
  await writeTruth(store);
  return store;
}

export async function ensureLeadTruth(leadId, githubIssueUrl = "") {
  const store = await loadLeadTruthStore();
  const id = String(leadId || "").trim();
  if (!id) {
    throw new Error("lead_id_required");
  }
  if (!store.leads[id]) {
    store.leads[id] = blankLeadTruth(id, githubIssueUrl);
    await saveLeadTruthStore(store);
  } else if (!store.leads[id].githubIssueUrl && githubIssueUrl) {
    store.leads[id].githubIssueUrl = githubIssueUrl;
    await saveLeadTruthStore(store);
  }
  return { store, truth: store.leads[id] };
}

export async function getLeadTruth(leadId, githubIssueUrl = "") {
  const { truth } = await ensureLeadTruth(leadId, githubIssueUrl);
  return truth;
}

export async function markCommentSent(leadId, githubIssueUrl = "", message = "", note = "") {
  const { store, truth } = await ensureLeadTruth(leadId, githubIssueUrl);
  if (truth.firstComment.sent) {
    return { ok: false, reason: "already_marked_sent", truth };
  }
  truth.firstComment = {
    sent: true,
    timestamp: nowIso(),
    messageHash: messageHash(message),
    note: String(note || "").trim() || null,
  };
  await saveLeadTruthStore(store);
  return { ok: true, truth };
}

export async function recordReplyTruth(leadId, githubIssueUrl = "", text = "", note = "") {
  const { store, truth } = await ensureLeadTruth(leadId, githubIssueUrl);
  if (!truth.firstComment.sent) {
    return { ok: false, reason: "cannot_record_reply_before_comment", truth };
  }
  truth.reply = {
    exists: true,
    timestamp: nowIso(),
    text: String(text || "").trim() || null,
    note: String(note || "").trim() || null,
  };
  await saveLeadTruthStore(store);
  return { ok: true, truth };
}

export async function sendPaymentLinkTruth(leadId, githubIssueUrl = "", paymentUrl = "", offerId = "", note = "", force = false) {
  const { store, truth } = await ensureLeadTruth(leadId, githubIssueUrl);
  if (!truth.firstComment.sent) {
    return { ok: false, reason: "cannot_send_payment_before_comment", truth };
  }
  if (truth.payment.status === "link_sent" && !force) {
    return { ok: false, reason: "payment_link_already_sent", truth };
  }
  truth.payment = {
    status: "link_sent",
    timestamp: nowIso(),
    paymentUrl: String(paymentUrl || "").trim() || null,
    offerId: String(offerId || "").trim() || null,
    note: String(note || "").trim() || null,
  };
  await saveLeadTruthStore(store);
  return { ok: true, truth };
}

export async function markPaidTruth(leadId, githubIssueUrl = "", note = "") {
  const { store, truth } = await ensureLeadTruth(leadId, githubIssueUrl);
  if (truth.payment.status !== "link_sent") {
    return { ok: false, reason: "cannot_mark_paid_before_link_sent", truth };
  }
  truth.payment = {
    ...truth.payment,
    status: "paid",
    timestamp: nowIso(),
    note: String(note || "").trim() || truth.payment.note || null,
  };
  await saveLeadTruthStore(store);
  return { ok: true, truth };
}

export async function resetReplyTruth(leadId, githubIssueUrl = "") {
  const { store, truth } = await ensureLeadTruth(leadId, githubIssueUrl);
  truth.reply = blankReply();
  await saveLeadTruthStore(store);
  return { ok: true, truth };
}

export async function resetPaymentTruth(leadId, githubIssueUrl = "") {
  const { store, truth } = await ensureLeadTruth(leadId, githubIssueUrl);
  truth.payment = blankPayment();
  await saveLeadTruthStore(store);
  return { ok: true, truth };
}

export async function resetCommentTruth(leadId, githubIssueUrl = "") {
  const { store, truth } = await ensureLeadTruth(leadId, githubIssueUrl);
  truth.firstComment = {
    sent: false,
    timestamp: null,
    messageHash: null,
    note: null,
  };
  truth.reply = blankReply();
  truth.payment = blankPayment();
  await saveLeadTruthStore(store);
  return { ok: true, truth };
}

export async function resetAllTruthForLead(leadId, githubIssueUrl = "") {
  const { store } = await ensureLeadTruth(leadId, githubIssueUrl);
  store.leads[String(leadId || "").trim()] = blankLeadTruth(leadId, githubIssueUrl);
  await saveLeadTruthStore(store);
  return { ok: true, truth: store.leads[String(leadId || "").trim()] };
}
