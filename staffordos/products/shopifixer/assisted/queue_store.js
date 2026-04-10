import fs from "node:fs";
import path from "node:path";
import { buildShopifixerFixUrl, getShopifixerFixBaseUrl } from "./fix_link.js";
import { normalizeStoreUrl } from "./resolve_contact.js";

const CANONICAL_ROOT = "/Users/rossstafford/projects/cart-agent";
export const QUEUE_PATH = path.join(
  CANONICAL_ROOT,
  "staffordos/products/shopifixer/outreach/shopifixer_outreach_queue.json"
);

const DEFAULT_QUEUE = [
  {
    id: "1",
    company_name: "Veloura Style",
    store_url: "https://veloura-style.com",
    niche: "fashion",
    contact_name: "Taylor",
    contact_email: "owner@veloura-style.com",
    issue_hypothesis: "",
    recommended_template: "observation",
    selected_template: "observation",
    subject: "",
    body: "",
    audit_url: getShopifixerFixBaseUrl(),
    prefilled_audit_url: getShopifixerFixBaseUrl(),
    status: "queued",
    notes: "",
    last_status_changed_at: ""
  },
  {
    id: "2",
    company_name: "Northline Home",
    store_url: "https://northline-home.com",
    niche: "home decor",
    contact_name: "Avery",
    contact_email: "founder@northline-home.com",
    issue_hypothesis: "",
    recommended_template: "observation",
    selected_template: "observation",
    subject: "",
    body: "",
    audit_url: getShopifixerFixBaseUrl(),
    prefilled_audit_url: getShopifixerFixBaseUrl(),
    status: "queued",
    notes: "",
    last_status_changed_at: ""
  }
];

export const ALLOWED_STATUSES = [
  "queued",
  "draft_generated",
  "review_needed",
  "sent",
  "archived",
  "rejected",
];

const ALLOWED_TRANSITIONS = {
  queued: new Set(["draft_generated", "review_needed", "sent", "archived", "rejected"]),
  draft_generated: new Set(["review_needed", "sent", "archived", "rejected"]),
  review_needed: new Set(["queued", "archived", "rejected"]),
  sent: new Set(["queued", "archived"]),
  archived: new Set([]),
  rejected: new Set([]),
};

function cleanText(value) {
  return String(value || "").trim();
}

function normalizeComparableUrl(value) {
  const raw = cleanText(value).toLowerCase();
  if (!raw) return "";

  try {
    const candidate = /^https?:\/\//.test(raw) ? raw : `https://${raw}`;
    const parsed = new URL(candidate);
    const host = parsed.hostname.replace(/^www\./, "");
    const pathname = parsed.pathname.replace(/\/+$/, "");
    return `${host}${pathname}`;
  } catch {
    return raw
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/+$/, "");
  }
}

function normalizeComparableEmail(value) {
  return cleanText(value).toLowerCase();
}

function buildPrefilledAuditUrl(storeUrl) {
  return buildShopifixerFixUrl(storeUrl);
}

function inferStatusFromAdmission(admissionDecision) {
  if (admissionDecision === "review_needed") return "review_needed";
  if (admissionDecision === "reject") return "rejected";
  return "queued";
}

function cleanStatus(value, admissionDecision = "admit") {
  const normalized = cleanText(value);
  if (!ALLOWED_STATUSES.includes(normalized)) {
    return inferStatusFromAdmission(admissionDecision);
  }

  if ((normalized === "queued" || normalized === "draft_generated") && admissionDecision === "review_needed") {
    return "review_needed";
  }

  if ((normalized === "queued" || normalized === "draft_generated") && admissionDecision === "reject") {
    return "rejected";
  }

  return normalized;
}

function cleanAdmissionDecision(value) {
  const normalized = cleanText(value);
  return ["admit", "review_needed", "reject"].includes(normalized) ? normalized : "admit";
}

function cleanConfidence(value) {
  const normalized = cleanText(value);
  return ["high", "medium", "low"].includes(normalized) ? normalized : "low";
}

function cleanTemplate(value, fallback = "observation") {
  const normalized = cleanText(value);
  return ["observation", "short_direct", "authority"].includes(normalized) ? normalized : fallback;
}

function cleanPriority(value) {
  const normalized = cleanText(value);
  return ["high", "medium", "low"].includes(normalized) ? normalized : "low";
}

function cleanReasons(value) {
  return Array.isArray(value)
    ? value.map((item) => cleanText(item)).filter(Boolean)
    : [];
}

function cleanTracking(value) {
  const tracking = value && typeof value === "object" ? value : {};
  const fixPageView = cleanText(tracking.fix_page_view);
  const fixCtaClick = cleanText(tracking.fix_cta_click);

  return {
    ...(fixPageView ? { fix_page_view: fixPageView } : {}),
    ...(fixCtaClick ? { fix_cta_click: fixCtaClick } : {}),
  };
}

function isLegacyGuessedEmail(email, storeUrl, contactSource) {
  const normalizedEmail = cleanText(email).toLowerCase();
  if (!normalizedEmail || cleanText(contactSource)) {
    return false;
  }

  const emailMatch = normalizedEmail.match(/^([^@]+)@(.+)$/);
  if (!emailMatch) {
    return false;
  }

  const [, localPart, emailHost] = emailMatch;
  const normalizedStore = normalizeStoreUrl(storeUrl).host;
  if (!normalizedStore) {
    return false;
  }

  return ["hello", "owner", "support"].includes(localPart)
    && emailHost === normalizedStore;
}

function normalizeRow(row) {
  const auditUrl = cleanText(row?.audit_url) || getShopifixerFixBaseUrl();
  const prefilledAuditUrl = cleanText(row?.prefilled_audit_url) || auditUrl;
  const recommendedTemplate = cleanTemplate(row?.recommended_template, "observation");
  const normalizedStore = cleanText(row?.normalized_store_url) || normalizeStoreUrl(row?.store_url).normalized_store_url;
  const contactSource = cleanText(row?.contact_source);
  const legacyGuessedEmail = isLegacyGuessedEmail(row?.contact_email, row?.store_url, contactSource);
  const contactEmail = legacyGuessedEmail ? "" : cleanText(row?.contact_email);
  const validContactStatus = legacyGuessedEmail
    ? "legacy_guessed_email_removed"
    : cleanText(row?.valid_contact_status);
  const admissionDecision = legacyGuessedEmail
    ? "reject"
    : cleanAdmissionDecision(row?.admission_decision);
  const contactNotes = legacyGuessedEmail
    ? "legacy_guessed_email_removed"
    : cleanText(row?.contact_notes);
  const normalizedStatus = cleanStatus(row?.status, admissionDecision);

  return {
    id: cleanText(row?.id),
    company_name: cleanText(row?.company_name),
    store_url: cleanText(row?.store_url),
    normalized_store_url: normalizedStore,
    niche: cleanText(row?.niche),
    contact_name: cleanText(row?.contact_name),
    contact_email: contactEmail,
    site_reachable: Boolean(row?.site_reachable),
    contact_source: contactSource,
    contact_confidence: cleanConfidence(row?.contact_confidence),
    has_real_contact_path: Boolean(row?.has_real_contact_path),
    valid_contact_status: validContactStatus,
    admission_decision: admissionDecision,
    contact_notes: contactNotes,
    issue_hypothesis: cleanText(row?.issue_hypothesis),
    recommended_template: recommendedTemplate,
    selected_template: cleanTemplate(row?.selected_template, recommendedTemplate),
    subject: cleanText(row?.subject),
    body: cleanText(row?.body),
    audit_url: auditUrl,
    prefilled_audit_url: prefilledAuditUrl,
    icp_score: Number(row?.icp_score || 0) || 0,
    icp_reasons: cleanReasons(row?.icp_reasons),
    queue_priority: cleanPriority(row?.queue_priority),
    status: normalizedStatus,
    notes: cleanText(row?.notes),
    last_status_changed_at: cleanText(row?.last_status_changed_at),
    tracking: cleanTracking(row?.tracking),
  };
}

function ensureQueueFile() {
  fs.mkdirSync(path.dirname(QUEUE_PATH), { recursive: true });
  if (!fs.existsSync(QUEUE_PATH)) {
    fs.writeFileSync(QUEUE_PATH, `${JSON.stringify(DEFAULT_QUEUE, null, 2)}\n`, "utf8");
  }
}

export function readQueue() {
  ensureQueueFile();
  const parsed = JSON.parse(fs.readFileSync(QUEUE_PATH, "utf8"));
  return Array.isArray(parsed) ? parsed.map(normalizeRow) : DEFAULT_QUEUE.map(normalizeRow);
}

export function writeQueue(rows) {
  const normalizedRows = Array.isArray(rows) ? rows.map(normalizeRow) : [];
  ensureQueueFile();
  const tempPath = `${QUEUE_PATH}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(normalizedRows, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, QUEUE_PATH);
  return normalizedRows;
}

export function getQueueRow(rowId) {
  const normalizedId = cleanText(rowId);
  return readQueue().find((row) => row.id === normalizedId) || null;
}

export function updateQueueRow(rowId, updates = {}) {
  const normalizedId = cleanText(rowId);
  const rows = readQueue();
  const index = rows.findIndex((row) => row.id === normalizedId);
  if (index === -1) {
    throw new Error(`unknown_queue_row:${normalizedId}`);
  }

  rows[index] = normalizeRow({
    ...rows[index],
    ...updates,
    id: rows[index].id,
  });

  writeQueue(rows);
  return rows[index];
}

export function transitionQueueState(rowId, targetStatus) {
  const normalizedId = cleanText(rowId);
  const nextStatus = cleanStatus(targetStatus);
  const rows = readQueue();
  const index = rows.findIndex((row) => row.id === normalizedId);

  if (index === -1) {
    return {
      ok: true,
      no_op: true,
      reason: "row_not_found",
      row: null,
      queue: rows,
    };
  }

  const currentRow = rows[index];
  const currentStatus = cleanStatus(currentRow.status, currentRow.admission_decision);

  if (currentStatus === nextStatus) {
    return {
      ok: true,
      no_op: true,
      reason: "already_in_target_status",
      row: currentRow,
      queue: rows,
    };
  }

  const allowedTargets = ALLOWED_TRANSITIONS[currentStatus] || new Set();
  if (!allowedTargets.has(nextStatus)) {
    return {
      ok: false,
      no_op: true,
      reason: "invalid_transition",
      row: currentRow,
      queue: rows,
    };
  }

  const updatedAdmissionDecision = nextStatus === "review_needed"
    ? "review_needed"
    : nextStatus === "rejected"
      ? "reject"
      : currentRow.admission_decision === "review_needed" && nextStatus === "queued"
        ? "admit"
        : currentRow.admission_decision === "reject" && nextStatus === "queued"
          ? "admit"
          : currentRow.admission_decision;

  rows[index] = normalizeRow({
    ...currentRow,
    status: nextStatus,
    admission_decision: updatedAdmissionDecision,
    last_status_changed_at: new Date().toISOString(),
  });

  const queue = writeQueue(rows);
  return {
    ok: true,
    no_op: false,
    reason: "transition_applied",
    row: queue[index],
    queue,
  };
}

export function addQueueRow(input = {}) {
  const rows = readQueue();
  const inputUrl = normalizeComparableUrl(input.store_url);
  const inputEmail = normalizeComparableEmail(input.contact_email);
  const duplicateRow = rows.find((row) =>
    (inputUrl && normalizeComparableUrl(row.store_url) === inputUrl)
    || (inputEmail && normalizeComparableEmail(row.contact_email) === inputEmail)
  );

  if (duplicateRow) {
    return {
      inserted: false,
      duplicate: true,
      row: duplicateRow,
      queue: rows,
    };
  }

  const timestampId = `lead_${Date.now()}`;
  const nextRow = normalizeRow({
    id: timestampId,
    company_name: cleanText(input.company_name),
    store_url: cleanText(input.store_url),
    normalized_store_url: cleanText(input.normalized_store_url) || normalizeStoreUrl(input.store_url).normalized_store_url,
    contact_email: cleanText(input.contact_email),
    niche: cleanText(input.niche),
    contact_name: cleanText(input.contact_name),
    site_reachable: Object.prototype.hasOwnProperty.call(input, "site_reachable") ? Boolean(input.site_reachable) : true,
    contact_source: cleanText(input.contact_source) || "manual",
    contact_confidence: cleanText(input.contact_confidence) || "high",
    has_real_contact_path: Object.prototype.hasOwnProperty.call(input, "has_real_contact_path") ? Boolean(input.has_real_contact_path) : true,
    valid_contact_status: cleanText(input.valid_contact_status) || "manual_contact",
    admission_decision: cleanText(input.admission_decision) || "admit",
    contact_notes: cleanText(input.contact_notes),
    issue_hypothesis: "",
    recommended_template: "observation",
    selected_template: "observation",
    subject: "",
    body: "",
    audit_url: getShopifixerFixBaseUrl(),
    prefilled_audit_url: buildPrefilledAuditUrl(input.store_url),
    icp_score: Number(input.icp_score || 0) || 0,
    icp_reasons: cleanReasons(input.icp_reasons),
    queue_priority: cleanPriority(input.queue_priority),
    status: cleanText(input.status) || inferStatusFromAdmission(cleanText(input.admission_decision) || "admit"),
    notes: "",
    last_status_changed_at: "",
  });

  const nextQueue = writeQueue([...rows, nextRow]);
  return {
    inserted: true,
    duplicate: false,
    row: nextRow,
    queue: nextQueue,
  };
}
