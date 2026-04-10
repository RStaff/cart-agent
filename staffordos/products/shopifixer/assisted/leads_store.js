import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { buildShopifixerFixUrl, getShopifixerFixBaseUrl } from "./fix_link.js";

const CANONICAL_ROOT = "/Users/rossstafford/projects/cart-agent";
export const LEADS_STORE_PATH = path.join(
  CANONICAL_ROOT,
  "staffordos/data/leads_store.json"
);
export const SHOPIFIXER_LEADS_DB_PATH = process.env.SHOPIFIXER_CANONICAL_DB_PATH
  || path.join(CANONICAL_ROOT, "web/prisma/dev.db");

export const LEAD_STATUSES = [
  "backlog",
  "active",
  "sent",
  "archived",
];

export const ACTIVE_QUEUE_STATUSES = [
  "queued",
  "draft_generated",
  "review_needed",
];

const REQUIRED_FIELDS = [
  "company",
  "url",
  "observed_issue",
  "why_it_matters",
  "confidence",
  "lead_quality",
];

const PRIORITY_RANK = {
  high: 3,
  medium: 2,
  low: 1,
};

const DB_TABLE_NAME = "shopifixer_canonical_leads";

function cleanText(value) {
  return String(value ?? "").trim();
}

function sqlString(value) {
  return `'${String(value ?? "").replace(/'/g, "''")}'`;
}

function cleanOptionalScore(value) {
  const raw = cleanText(value);
  if (!raw) return "";
  const numeric = Number(raw);
  if (!Number.isFinite(numeric)) {
    return raw;
  }
  return String(Math.max(0, Math.round(numeric)));
}

function cleanShopifyConfidence(value) {
  const normalized = cleanText(value).toLowerCase();
  return ["high", "medium", "low"].includes(normalized) ? normalized : "";
}

function cleanConfidence(value) {
  const normalized = cleanText(value).toLowerCase();
  return ["high", "medium", "low"].includes(normalized) ? normalized : "";
}

function cleanLeadQuality(value) {
  const normalized = cleanText(value).toLowerCase();
  return ["strong", "maybe", "weak"].includes(normalized) ? normalized : "";
}

function cleanSource(value) {
  const normalized = cleanText(value).toLowerCase();
  return ["manual", "landing_page", "csv"].includes(normalized) ? normalized : "manual";
}

function cleanPriority(value) {
  const normalized = cleanText(value).toLowerCase();
  return ["high", "medium", "low"].includes(normalized) ? normalized : "low";
}

function cleanTemplate(value, fallback = "observation") {
  const normalized = cleanText(value);
  return ["observation", "short_direct", "authority"].includes(normalized) ? normalized : fallback;
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

function normalizeLeadUrl(value) {
  const raw = cleanText(value);
  if (!raw) return "";

  try {
    const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const parsed = new URL(candidate);
    parsed.protocol = "https:";
    parsed.hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return raw.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
  }
}

function cleanLeadStatus(value) {
  const normalized = cleanText(value).toLowerCase();

  if (LEAD_STATUSES.includes(normalized)) {
    return normalized;
  }

  if (normalized === "sent") {
    return "sent";
  }

  if (normalized === "archived") {
    return "archived";
  }

  return "backlog";
}

function cleanOutreachStatus(value, leadStatus) {
  if (leadStatus === "sent") {
    return "sent";
  }

  if (leadStatus !== "active") {
    return "";
  }

  const normalized = cleanText(value).toLowerCase();
  return ACTIVE_QUEUE_STATUSES.includes(normalized) ? normalized : "queued";
}

function leadSortTime(lead) {
  const updated = lead.updated_at ? Date.parse(lead.updated_at) : 0;
  const created = lead.created_at ? Date.parse(lead.created_at) : 0;
  return updated || created || 0;
}

function hasRequiredFields(lead) {
  return REQUIRED_FIELDS.every((field) => cleanText(lead[field]));
}

function backlogSortTime(lead) {
  const created = lead.created_at ? Date.parse(lead.created_at) : 0;
  const updated = lead.updated_at ? Date.parse(lead.updated_at) : 0;
  return created || updated || 0;
}

function sortBacklogLeads(leads) {
  return [...leads].sort((left, right) =>
    backlogSortTime(left) - backlogSortTime(right)
    || cleanText(left.id).localeCompare(cleanText(right.id))
  );
}

function normalizeLead(lead) {
  const createdAt = cleanText(lead?.created_at);
  const updatedAt = cleanText(lead?.updated_at) || createdAt;
  const status = cleanLeadStatus(lead?.status);
  const recommendedTemplate = cleanTemplate(lead?.recommended_template, "observation");
  const auditUrl = cleanText(lead?.audit_url) || getShopifixerFixBaseUrl();
  const url = normalizeLeadUrl(lead?.url);
  const prefilledAuditUrl = cleanText(lead?.prefilled_audit_url) || (url ? buildShopifixerFixUrl(url) : auditUrl);

  return {
    id: cleanText(lead?.id),
    company: cleanText(lead?.company),
    url,
    email: cleanText(lead?.email),
    niche: cleanText(lead?.niche),
    observed_issue: cleanText(lead?.observed_issue),
    why_it_matters: cleanText(lead?.why_it_matters),
    confidence: cleanConfidence(lead?.confidence),
    lead_quality: cleanLeadQuality(lead?.lead_quality),
    contact_page: cleanText(lead?.contact_page),
    contact_hint: cleanText(lead?.contact_hint),
    shopify_confidence: cleanShopifyConfidence(lead?.shopify_confidence),
    priority_score: cleanOptionalScore(lead?.priority_score),
    status,
    source: cleanSource(lead?.source),
    created_at: createdAt,
    updated_at: updatedAt,
    contact_name: cleanText(lead?.contact_name),
    site_reachable: Boolean(lead?.site_reachable),
    contact_source: cleanText(lead?.contact_source),
    contact_confidence: cleanText(lead?.contact_confidence) || "low",
    has_real_contact_path: Boolean(lead?.has_real_contact_path),
    valid_contact_status: cleanText(lead?.valid_contact_status),
    contact_notes: cleanText(lead?.contact_notes),
    issue_hypothesis: cleanText(lead?.issue_hypothesis),
    recommended_template: recommendedTemplate,
    selected_template: cleanTemplate(lead?.selected_template, recommendedTemplate),
    subject: cleanText(lead?.subject),
    body: cleanText(lead?.body),
    audit_url: auditUrl,
    prefilled_audit_url: prefilledAuditUrl,
    icp_score: Number(lead?.icp_score || 0) || 0,
    icp_reasons: cleanReasons(lead?.icp_reasons),
    queue_priority: cleanPriority(lead?.queue_priority),
    notes: cleanText(lead?.notes),
    gmail_draft_url: cleanText(lead?.gmail_draft_url),
    last_status_changed_at: cleanText(lead?.last_status_changed_at),
    outreach_status: cleanOutreachStatus(lead?.outreach_status, status),
    tracking: cleanTracking(lead?.tracking),
  };
}

function canUseDb() {
  if (cleanText(process.env.SHOPIFIXER_CANONICAL_DB_MODE).toLowerCase() === "file") {
    return false;
  }

  if (!cleanText(SHOPIFIXER_LEADS_DB_PATH)) {
    return false;
  }

  if (!fs.existsSync(SHOPIFIXER_LEADS_DB_PATH)) {
    return false;
  }

  try {
    execFileSync("sqlite3", ["-version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function runSqlite(dbPath, args) {
  return execFileSync("sqlite3", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function ensureDbTable() {
  if (!canUseDb()) {
    return false;
  }

  runSqlite(SHOPIFIXER_LEADS_DB_PATH, [
    SHOPIFIXER_LEADS_DB_PATH,
    `
      CREATE TABLE IF NOT EXISTS ${DB_TABLE_NAME} (
        id TEXT PRIMARY KEY,
        normalized_url TEXT NOT NULL,
        company TEXT NOT NULL,
        status TEXT NOT NULL,
        outreach_status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        lead_json TEXT NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS ${DB_TABLE_NAME}_normalized_url_idx
        ON ${DB_TABLE_NAME}(normalized_url);
      CREATE INDEX IF NOT EXISTS ${DB_TABLE_NAME}_status_idx
        ON ${DB_TABLE_NAME}(status);
      CREATE INDEX IF NOT EXISTS ${DB_TABLE_NAME}_updated_at_idx
        ON ${DB_TABLE_NAME}(updated_at);
    `,
  ]);
  return true;
}

function getDbLeadCount() {
  const output = runSqlite(SHOPIFIXER_LEADS_DB_PATH, [
    SHOPIFIXER_LEADS_DB_PATH,
    `SELECT COUNT(*) AS count FROM ${DB_TABLE_NAME};`,
  ]).trim();
  return Number(output || 0) || 0;
}

function readLeadsFromFile() {
  ensureStoreFile();
  const parsed = JSON.parse(fs.readFileSync(LEADS_STORE_PATH, "utf8"));
  const deduped = dedupeLeads(parsed);

  if (Array.isArray(parsed) && deduped.length !== parsed.length) {
    writeLeadsToFile(deduped);
  }

  return deduped;
}

function writeLeadsToFile(leads) {
  ensureStoreFile();
  const normalized = dedupeLeads(leads);
  const tempPath = `${LEADS_STORE_PATH}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, LEADS_STORE_PATH);
  return normalized;
}

function writeLeadsToDb(leads) {
  const normalized = dedupeLeads(leads);
  ensureDbTable();

  const statements = [
    "BEGIN IMMEDIATE;",
    `DELETE FROM ${DB_TABLE_NAME};`,
    ...normalized.map((lead) => {
      const normalizedUrl = normalizeLeadUrl(lead.url);
      return `
        INSERT INTO ${DB_TABLE_NAME} (
          id,
          normalized_url,
          company,
          status,
          outreach_status,
          created_at,
          updated_at,
          lead_json
        ) VALUES (
          ${sqlString(lead.id)},
          ${sqlString(normalizedUrl)},
          ${sqlString(lead.company)},
          ${sqlString(lead.status)},
          ${sqlString(lead.outreach_status || "")},
          ${sqlString(lead.created_at)},
          ${sqlString(lead.updated_at)},
          ${sqlString(JSON.stringify(lead))}
        );
      `;
    }),
    "COMMIT;",
  ];

  runSqlite(SHOPIFIXER_LEADS_DB_PATH, [
    SHOPIFIXER_LEADS_DB_PATH,
    statements.join("\n"),
  ]);

  return normalized;
}

function readLeadsFromDb() {
  ensureDbTable();

  const output = runSqlite(SHOPIFIXER_LEADS_DB_PATH, [
    "-json",
    SHOPIFIXER_LEADS_DB_PATH,
    `SELECT lead_json FROM ${DB_TABLE_NAME} ORDER BY datetime(updated_at) DESC, id DESC;`,
  ]).trim();

  if (!output) {
    return [];
  }

  const rows = JSON.parse(output);
  return dedupeLeads(
    Array.isArray(rows)
      ? rows.map((row) => {
        try {
          return JSON.parse(row.lead_json);
        } catch {
          return null;
        }
      }).filter(Boolean)
      : []
  );
}

export function bootstrapLeadsDbFromFile() {
  if (!canUseDb()) {
    return {
      ok: false,
      backend: "file",
      imported_count: 0,
      total_in_db: 0,
      error: "db_unavailable",
    };
  }

  ensureDbTable();
  const existingCount = getDbLeadCount();
  if (existingCount > 0) {
    return {
      ok: true,
      backend: "db",
      imported_count: 0,
      total_in_db: existingCount,
      bootstrapped: false,
    };
  }

  const fileLeads = readLeadsFromFile();
  const written = writeLeadsToDb(fileLeads);

  return {
    ok: true,
    backend: "db",
    imported_count: written.length,
    total_in_db: written.length,
    bootstrapped: true,
  };
}

function readLeadsFromPreferredStore() {
  if (!canUseDb()) {
    return {
      backend: "file",
      leads: readLeadsFromFile(),
      fallback_reason: "db_unavailable",
    };
  }

  try {
    ensureDbTable();
    if (getDbLeadCount() === 0) {
      bootstrapLeadsDbFromFile();
    }

    return {
      backend: "db",
      leads: readLeadsFromDb(),
      fallback_reason: "",
    };
  } catch (error) {
    return {
      backend: "file",
      leads: readLeadsFromFile(),
      fallback_reason: error instanceof Error ? error.message : "db_read_failed",
    };
  }
}

function writeLeadsToPreferredStore(leads) {
  if (!canUseDb()) {
    return {
      backend: "file",
      leads: writeLeadsToFile(leads),
      fallback_reason: "db_unavailable",
    };
  }

  try {
    ensureDbTable();
    return {
      backend: "db",
      leads: writeLeadsToDb(leads),
      fallback_reason: "",
    };
  } catch (error) {
    return {
      backend: "file",
      leads: writeLeadsToFile(leads),
      fallback_reason: error instanceof Error ? error.message : "db_write_failed",
    };
  }
}

export function getCanonicalLeadStorageInfo() {
  const preferred = readLeadsFromPreferredStore();
  return {
    backend: preferred.backend,
    db_path: SHOPIFIXER_LEADS_DB_PATH,
    file_path: LEADS_STORE_PATH,
    fallback_reason: preferred.fallback_reason || "",
    lead_count: preferred.leads.length,
  };
}

function ensureStoreFile() {
  fs.mkdirSync(path.dirname(LEADS_STORE_PATH), { recursive: true });
  if (!fs.existsSync(LEADS_STORE_PATH)) {
    fs.writeFileSync(LEADS_STORE_PATH, "[]\n", "utf8");
  }
}

function dedupeLeads(leads) {
  const byId = new Map();

  for (const rawLead of Array.isArray(leads) ? leads : []) {
    const lead = normalizeLead(rawLead);
    if (!lead.id) {
      continue;
    }

    const existing = byId.get(lead.id);
    if (!existing || leadSortTime(lead) >= leadSortTime(existing)) {
      byId.set(lead.id, lead);
    }
  }

  return Array.from(byId.values()).sort((left, right) => leadSortTime(right) - leadSortTime(left));
}

function findDuplicateLead(existingLeads, lead, ignoreId = "") {
  const normalizedUrl = normalizeLeadUrl(lead.url);
  const normalizedEmail = cleanText(lead.email).toLowerCase();

  return existingLeads.find((item) => {
    if (!item.id || item.id === ignoreId) {
      return false;
    }

    const sameUrl = normalizedUrl && normalizeLeadUrl(item.url) === normalizedUrl;
    const sameEmail = normalizedEmail && cleanText(item.email).toLowerCase() === normalizedEmail;
    return Boolean(sameUrl || sameEmail);
  }) || null;
}

function sortQueueRows(rows) {
  return [...rows].sort((left, right) => {
    const leftIsActive = left.status === "queued" || left.status === "draft_generated";
    const rightIsActive = right.status === "queued" || right.status === "draft_generated";

    if (leftIsActive !== rightIsActive) {
      return leftIsActive ? -1 : 1;
    }

    return (PRIORITY_RANK[right.queue_priority] - PRIORITY_RANK[left.queue_priority])
      || (Number(right.icp_score || 0) - Number(left.icp_score || 0))
      || (leadSortTime(right._lead) - leadSortTime(left._lead));
  });
}

export function readLeads() {
  return readLeadsFromPreferredStore().leads;
}

export function writeLeads(leads) {
  return writeLeadsToPreferredStore(leads).leads;
}

export function validateLeadInput(input) {
  const lead = normalizeLead(input);
  const errors = REQUIRED_FIELDS
    .filter((field) => !cleanText(lead[field]))
    .map((field) => `${field}_required`);

  return { lead, errors };
}

export function createLead(input) {
  const { lead, errors } = validateLeadInput(input);
  const existingLeads = readLeads();
  const duplicate = findDuplicateLead(existingLeads, lead);

  if (duplicate) {
    return { ok: false, error: "duplicate_lead", errors: ["duplicate_lead"], lead: duplicate, leads: existingLeads };
  }

  if (errors.length) {
    return { ok: false, errors, lead: null, leads: existingLeads };
  }

  const now = new Date().toISOString();
  const nextLead = normalizeLead({
    ...lead,
    id: lead.id || crypto.randomUUID(),
    status: "backlog",
    outreach_status: "",
    created_at: now,
    updated_at: now,
  });
  const leads = writeLeads([nextLead, ...existingLeads]);

  return { ok: true, errors: [], lead: nextLead, leads };
}

export function updateLead(leadId, updates = {}) {
  const normalizedId = cleanText(leadId);
  if (!normalizedId) {
    return { ok: false, error: "lead_id_required", lead: null, leads: readLeads() };
  }

  const existingLeads = readLeads();
  const currentLead = existingLeads.find((lead) => lead.id === normalizedId);
  if (!currentLead) {
    return { ok: false, error: "lead_not_found", lead: null, leads: existingLeads };
  }

  const nextLeadDraft = normalizeLead({
    ...currentLead,
    ...updates,
    id: currentLead.id,
    created_at: currentLead.created_at,
    updated_at: new Date().toISOString(),
  });

  const duplicate = findDuplicateLead(existingLeads, nextLeadDraft, currentLead.id);
  if (duplicate) {
    return { ok: false, error: "duplicate_lead", errors: ["duplicate_lead"], lead: duplicate, leads: existingLeads };
  }

  const { lead, errors } = validateLeadInput({
    ...nextLeadDraft,
    source: currentLead.source,
  });
  if (errors.length) {
    return { ok: false, error: "invalid_lead_update", errors, lead: null, leads: existingLeads };
  }

  const updatedLead = normalizeLead({
    ...lead,
    ...nextLeadDraft,
    id: currentLead.id,
    source: cleanSource(updates.source || currentLead.source),
    created_at: currentLead.created_at,
    updated_at: new Date().toISOString(),
  });

  const leads = writeLeads(existingLeads.map((item) => (item.id === normalizedId ? updatedLead : item)));
  return { ok: true, error: "", errors: [], lead: updatedLead, leads };
}

export function archiveLead(leadId) {
  return updateLead(leadId, { status: "archived", outreach_status: "" });
}

export function getLeadById(leadId) {
  const normalizedId = cleanText(leadId);
  return readLeads().find((lead) => lead.id === normalizedId) || null;
}

export function getLeadByStoreDomain(storeDomain) {
  const normalizedDomain = normalizeLeadUrl(storeDomain)
    .replace(/^https:\/\//, "")
    .split("/")[0];

  return readLeads().find((lead) =>
    normalizeLeadUrl(lead.url).replace(/^https:\/\//, "").split("/")[0] === normalizedDomain
  ) || null;
}

export function buildQueueRowFromLead(lead) {
  const normalizedLead = normalizeLead(lead);
  const queueStatus = normalizedLead.status === "sent"
    ? "sent"
    : normalizedLead.status === "active"
      ? (normalizedLead.outreach_status || "queued")
      : "queued";

  return {
    id: normalizedLead.id,
    source_lead_id: normalizedLead.id,
    company_name: normalizedLead.company,
    store_url: normalizedLead.url,
    normalized_store_url: normalizedLead.url,
    niche: normalizedLead.niche,
    contact_name: normalizedLead.contact_name,
    contact_email: normalizedLead.email,
    site_reachable: normalizedLead.site_reachable,
    contact_source: normalizedLead.contact_source || normalizedLead.source,
    contact_confidence: normalizedLead.contact_confidence || "low",
    has_real_contact_path: normalizedLead.has_real_contact_path,
    valid_contact_status: normalizedLead.valid_contact_status,
    admission_decision: queueStatus === "review_needed" ? "review_needed" : "admit",
    contact_notes: normalizedLead.contact_notes,
    issue_hypothesis: normalizedLead.issue_hypothesis || normalizedLead.observed_issue,
    recommended_template: normalizedLead.recommended_template,
    selected_template: normalizedLead.selected_template,
    subject: normalizedLead.subject,
    body: normalizedLead.body,
    audit_url: normalizedLead.audit_url,
    prefilled_audit_url: normalizedLead.prefilled_audit_url,
    icp_score: normalizedLead.icp_score,
    icp_reasons: normalizedLead.icp_reasons,
    queue_priority: normalizedLead.queue_priority,
    status: queueStatus,
    notes: normalizedLead.notes || normalizedLead.why_it_matters,
    gmail_draft_url: normalizedLead.gmail_draft_url,
    last_status_changed_at: normalizedLead.last_status_changed_at,
    tracking: normalizedLead.tracking,
    _lead: normalizedLead,
  };
}

export function readDerivedQueue() {
  const leads = readLeads();
  const rows = leads
    .filter((lead) => lead.status === "active")
    .map(buildQueueRowFromLead);

  return sortQueueRows(rows).map(({ _lead, ...row }) => row);
}

export function getQueueRow(leadId) {
  const normalizedId = cleanText(leadId);
  return readDerivedQueue().find((row) => row.id === normalizedId) || null;
}

export function getEligibleBacklogLeads(limit = 10) {
  return sortBacklogLeads(
    readLeads().filter((lead) => lead.status === "backlog" && hasRequiredFields(lead))
  )
    .slice(0, Math.max(1, Number(limit) || 10));
}

export function promoteLeadToActive(leadId) {
  const normalizedId = cleanText(leadId);
  const leads = readLeads();
  const lead = leads.find((item) => item.id === normalizedId);

  if (!lead) {
    return { ok: false, error: "lead_not_found", leads, lead: null, queue: readDerivedQueue(), queue_row: null };
  }

  if (lead.status === "sent") {
    return { ok: false, error: "lead_already_sent", leads, lead, queue: readDerivedQueue(), queue_row: getQueueRow(lead.id) };
  }

  if (lead.status === "archived") {
    return { ok: false, error: "lead_archived", leads, lead, queue: readDerivedQueue(), queue_row: null };
  }

  if (lead.status === "active") {
    const queue = readDerivedQueue();
    return { ok: true, no_op: true, lead, leads, queue, queue_row: queue.find((row) => row.source_lead_id === lead.id) || null };
  }

  const now = new Date().toISOString();
  const nextLeads = writeLeads(leads.map((item) => {
    if (item.id === lead.id) {
      return normalizeLead({
        ...item,
        status: "active",
        outreach_status: item.outreach_status || "queued",
        last_status_changed_at: now,
        updated_at: now,
      });
    }
    return item;
  }));
  const updatedLead = nextLeads.find((item) => item.id === lead.id) || normalizeLead({
    ...lead,
    status: "active",
    outreach_status: "queued",
    last_status_changed_at: now,
    updated_at: now,
  });
  const queue = readDerivedQueue();

  return {
    ok: true,
    no_op: false,
    lead: updatedLead,
    leads: nextLeads,
    queue,
    queue_row: queue.find((row) => row.source_lead_id === updatedLead.id) || null,
  };
}

export function refillQueueFromBacklog(limit = 10) {
  const nextLeads = getEligibleBacklogLeads(limit);
  const existingLeads = readLeads();

  if (!nextLeads.length) {
    return {
      ok: true,
      promoted_count: 0,
      message: "No eligible qualified leads",
      promoted_leads: [],
      leads: existingLeads,
      queue: readDerivedQueue(),
      next_active_row_id: "",
    };
  }

  const leadIds = new Set(nextLeads.map((lead) => lead.id));
  const now = new Date().toISOString();
  const leads = writeLeads(existingLeads.map((lead) => {
    if (!leadIds.has(lead.id)) {
      return lead;
    }

    return normalizeLead({
      ...lead,
      status: "active",
      outreach_status: lead.outreach_status || "queued",
      last_status_changed_at: now,
      updated_at: now,
    });
  }));
  const promotedLeads = nextLeads
    .map((lead) => leads.find((item) => item.id === lead.id))
    .filter(Boolean);
  const queue = readDerivedQueue();

  return {
    ok: true,
    promoted_count: promotedLeads.length,
    message: "",
    promoted_leads: promotedLeads,
    leads,
    queue,
    next_active_row_id: promotedLeads[0]?.id || queue[0]?.id || "",
  };
}

export function updateLeadOutreachFields(leadId, updates = {}) {
  const normalizedId = cleanText(leadId);
  const existingLead = getLeadById(normalizedId);

  if (!existingLead) {
    return { ok: false, error: "lead_not_found", lead: null, queue_row: null, leads: readLeads(), queue: readDerivedQueue() };
  }

  const result = updateLead(normalizedId, {
    company: cleanText(updates.company_name) || existingLead.company,
    url: cleanText(updates.store_url) || existingLead.url,
    email: cleanText(updates.contact_email) || existingLead.email,
    niche: cleanText(updates.niche) || existingLead.niche,
    contact_name: cleanText(updates.contact_name) || existingLead.contact_name,
    site_reachable: Object.prototype.hasOwnProperty.call(updates, "site_reachable") ? Boolean(updates.site_reachable) : existingLead.site_reachable,
    contact_source: cleanText(updates.contact_source) || existingLead.contact_source,
    contact_confidence: cleanText(updates.contact_confidence) || existingLead.contact_confidence,
    has_real_contact_path: Object.prototype.hasOwnProperty.call(updates, "has_real_contact_path") ? Boolean(updates.has_real_contact_path) : existingLead.has_real_contact_path,
    valid_contact_status: cleanText(updates.valid_contact_status) || existingLead.valid_contact_status,
    contact_notes: cleanText(updates.contact_notes) || existingLead.contact_notes,
    issue_hypothesis: cleanText(updates.issue_hypothesis) || existingLead.issue_hypothesis,
    recommended_template: cleanText(updates.recommended_template) || existingLead.recommended_template,
    selected_template: cleanText(updates.selected_template) || existingLead.selected_template,
    subject: cleanText(updates.subject) || existingLead.subject,
    body: cleanText(updates.body) || existingLead.body,
    audit_url: cleanText(updates.audit_url) || existingLead.audit_url,
    prefilled_audit_url: cleanText(updates.prefilled_audit_url) || existingLead.prefilled_audit_url,
    icp_score: Number(updates.icp_score ?? existingLead.icp_score) || 0,
    icp_reasons: Array.isArray(updates.icp_reasons) ? updates.icp_reasons : existingLead.icp_reasons,
    queue_priority: cleanText(updates.queue_priority) || existingLead.queue_priority,
    notes: cleanText(updates.notes) || existingLead.notes,
    gmail_draft_url: cleanText(updates.gmail_draft_url) || existingLead.gmail_draft_url,
    tracking: updates.tracking || existingLead.tracking,
  });

  if (!result.ok) {
    return { ...result, queue_row: null, queue: readDerivedQueue() };
  }

  const queue = readDerivedQueue();
  return {
    ...result,
    queue,
    queue_row: queue.find((row) => row.source_lead_id === result.lead.id) || buildQueueRowFromLead(result.lead),
  };
}

const ACTIVE_TRANSITIONS = {
  queued: new Set(["draft_generated", "review_needed", "sent", "archived"]),
  draft_generated: new Set(["queued", "review_needed", "sent", "archived"]),
  review_needed: new Set(["queued", "archived"]),
  sent: new Set(["archived"]),
};

export function transitionLeadQueueState(leadId, targetStatus) {
  const normalizedId = cleanText(leadId);
  const requestedStatus = cleanText(targetStatus).toLowerCase() === "rejected" ? "archived" : cleanText(targetStatus).toLowerCase();
  const lead = getLeadById(normalizedId);
  const leads = readLeads();

  if (!lead) {
    return { ok: true, no_op: true, reason: "row_not_found", lead: null, queue_row: null, leads, queue: readDerivedQueue() };
  }

  const currentStatus = lead.status === "sent"
    ? "sent"
    : lead.status === "active"
      ? (lead.outreach_status || "queued")
      : "";

  if (!currentStatus) {
    return { ok: false, no_op: true, reason: "lead_not_active", lead, queue_row: null, leads, queue: readDerivedQueue() };
  }

  if (currentStatus === requestedStatus) {
    const queue = readDerivedQueue();
    return {
      ok: true,
      no_op: true,
      reason: "already_in_target_status",
      lead,
      queue_row: queue.find((row) => row.source_lead_id === lead.id) || buildQueueRowFromLead(lead),
      leads,
      queue,
    };
  }

  const allowedTargets = ACTIVE_TRANSITIONS[currentStatus] || new Set();
  if (!allowedTargets.has(requestedStatus)) {
    return { ok: false, no_op: true, reason: "invalid_transition", lead, queue_row: null, leads, queue: readDerivedQueue() };
  }

  const now = new Date().toISOString();
  const updates = requestedStatus === "sent"
    ? {
        status: "sent",
        outreach_status: "sent",
        last_status_changed_at: now,
      }
    : requestedStatus === "archived"
      ? {
          status: "archived",
          outreach_status: "",
          last_status_changed_at: now,
        }
      : {
          status: "active",
          outreach_status: requestedStatus,
          last_status_changed_at: now,
        };

  const result = updateLead(normalizedId, updates);
  if (!result.ok) {
    return { ...result, queue_row: null, queue: readDerivedQueue() };
  }

  const queue = readDerivedQueue();
  return {
    ok: true,
    no_op: false,
    reason: "transition_applied",
    lead: result.lead,
    queue_row: queue.find((row) => row.source_lead_id === result.lead.id) || buildQueueRowFromLead(result.lead),
    leads: result.leads,
    queue,
  };
}

export function trackLeadOutcomeByStore({ event, store, at = new Date().toISOString() } = {}) {
  const normalizedEvent = cleanText(event);
  if (!["fix_page_view", "fix_cta_click"].includes(normalizedEvent)) {
    throw new Error("invalid_tracking_event");
  }

  const lead = getLeadByStoreDomain(store);
  if (!lead) {
    return {
      ok: true,
      matched: false,
      lead: null,
      leads: readLeads(),
    };
  }

  const result = updateLead(lead.id, {
    tracking: {
      ...(lead.tracking || {}),
      [normalizedEvent]: at,
    },
  });

  return {
    ok: true,
    matched: Boolean(result.ok && result.lead),
    lead: result.lead,
    leads: result.leads,
  };
}
