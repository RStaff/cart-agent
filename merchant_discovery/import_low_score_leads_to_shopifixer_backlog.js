import { readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const INPUT_PATH = join(__dirname, "low_score_leads.json");
const REPORT_PATH = join(__dirname, "import_low_score_leads_to_shopifixer_backlog.report.json");
const LEADS_STORE_PATH = join(__dirname, "..", "staffordos", "data", "leads_store.json");

const ISSUE_MAP = {
  shipping_cost_surprise: "Shipping costs appear late in checkout, creating hesitation before purchase.",
  slow_checkout: "Checkout flow appears slower than expected, increasing drop-off risk.",
  hidden_fees: "Additional costs are introduced late in checkout, reducing purchase confidence.",
  unclear_checkout_entry: "It's not immediately clear how to begin checkout, which may cause user drop-off.",
  cart_value_hidden_until_checkout: "Total cart value isn't fully visible until late in checkout, which can reduce conversion.",
};

const WHY_MAP = {
  shipping_cost_surprise: "This can cause shoppers to abandon checkout when unexpected costs appear late.",
  slow_checkout: "Slower checkout flow increases drop-off, especially on mobile or lower-intent visits.",
  hidden_fees: "Unexpected fees reduce trust and make shoppers reconsider the purchase.",
  unclear_checkout_entry: "If checkout entry is unclear, shoppers may hesitate before starting the purchase flow.",
  cart_value_hidden_until_checkout: "When total value is revealed late, purchase confidence drops and abandonment risk rises.",
};

function fail(message) {
  throw new Error(message);
}

function normalizeDomain(rawValue) {
  const original = String(rawValue ?? "").trim();
  if (!original) {
    return "";
  }

  const candidate = /^(https?:)?\/\//i.test(original) ? original : `https://${original}`;

  try {
    const hostname = new URL(candidate).hostname;
    return hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "").trim();
  } catch {
    return "";
  }
}

function normalizeStoreIdentity(rawValue) {
  return normalizeDomain(rawValue);
}

function deriveCompany(domain) {
  const cleanDomain = normalizeDomain(domain);
  if (!cleanDomain) {
    return "";
  }

  return cleanDomain
    .split(".")[0]
    .replace(/[^a-z0-9]/gi, " ")
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function deriveObservedIssue(topFriction) {
  const normalizedFriction = String(topFriction ?? "").trim();
  return ISSUE_MAP[normalizedFriction] || "Checkout friction detected that may impact conversion.";
}

function deriveWhyItMatters(topFriction) {
  const normalizedFriction = String(topFriction ?? "").trim();
  return WHY_MAP[normalizedFriction] || "This checkout issue may be reducing conversion and increasing abandonment.";
}

function deriveConfidence(score) {
  const numericScore = Number(score);
  if (numericScore <= 40) return "high";
  if (numericScore <= 60) return "medium";
  return "low";
}

function deriveLeadQuality(score) {
  const numericScore = Number(score);
  if (numericScore <= 40) return "strong";
  if (numericScore <= 60) return "maybe";
  return "weak";
}

function deriveShopifyConfidence(domain) {
  const normalizedDomain = normalizeDomain(domain);
  if (!normalizedDomain) {
    return "low";
  }

  if (normalizedDomain.includes("myshopify.com")) {
    return "high";
  }

  if (
    normalizedDomain === "prose.com"
    || normalizedDomain === "cocokind.com"
    || normalizedDomain.split(".").length === 2
  ) {
    return "medium";
  }

  return "low";
}

function derivePriorityScore(lead, shopifyConfidence) {
  const checkoutScore = Number(lead?.checkout_score) || 0;
  const estimatedRevenueOpportunity = Number(lead?.estimated_revenue_opportunity) || 0;
  let priority = 100 - checkoutScore;

  if (shopifyConfidence === "high") {
    priority += 20;
  } else if (shopifyConfidence === "medium") {
    priority += 10;
  }

  if (estimatedRevenueOpportunity > 100000) {
    priority += 10;
  }

  return Math.max(0, Math.min(100, priority));
}

function deriveQueuePriority(priorityScore) {
  if (priorityScore >= 80) return "high";
  if (priorityScore >= 50) return "medium";
  return "low";
}

function deriveContactPage(domain) {
  const normalizedDomain = normalizeDomain(domain);
  return normalizedDomain ? `https://${normalizedDomain}/contact` : "";
}

function deriveContactHint() {
  return "Check the contact page or LinkedIn for a founder or marketing lead.";
}

function derivePrefilledAuditUrl(domain) {
  const normalizedDomain = normalizeDomain(domain);
  return normalizedDomain
    ? `https://app.abando.ai/fix?store=${encodeURIComponent(normalizedDomain)}`
    : "https://app.abando.ai/fix";
}

function deriveNotes(lead) {
  const notes = [];
  if (lead?.tier) {
    notes.push(`Tier: ${lead.tier}`);
  }
  if (lead?.benchmark_badge) {
    notes.push(`Benchmark: ${lead.benchmark_badge}`);
  }
  if (Number.isFinite(Number(lead?.estimated_revenue_opportunity))) {
    notes.push(`Estimated revenue opportunity: ${Number(lead.estimated_revenue_opportunity)}`);
  }
  return notes.join(" | ");
}

async function readJsonFile(path, missingErrorPrefix, invalidErrorPrefix) {
  let raw;

  try {
    raw = await readFile(path, "utf8");
  } catch (error) {
    if (error && error.code === "ENOENT") {
      fail(`${missingErrorPrefix}:${path}`);
    }
    throw error;
  }

  try {
    return JSON.parse(raw);
  } catch {
    fail(`${invalidErrorPrefix}:${path}`);
  }
}

async function readLowScoreLeads() {
  const parsed = await readJsonFile(INPUT_PATH, "input_file_missing", "input_file_invalid_json");
  if (!Array.isArray(parsed)) {
    fail("input_not_array");
  }
  return parsed;
}

async function readCanonicalLeads() {
  const parsed = await readJsonFile(LEADS_STORE_PATH, "canonical_store_missing", "canonical_store_invalid_json");
  if (!Array.isArray(parsed)) {
    fail("canonical_store_not_array");
  }
  return parsed;
}

function buildCanonicalLead(lead) {
  const domain = normalizeDomain(lead?.store);
  const now = new Date().toISOString();
  const detectedAt = typeof lead?.detected_at === "string" && lead.detected_at.trim() ? lead.detected_at : now;
  const shopifyConfidence = deriveShopifyConfidence(domain);
  const priorityScore = derivePriorityScore(lead, shopifyConfidence);
  const observedIssue = deriveObservedIssue(lead?.top_friction);
  const whyItMatters = deriveWhyItMatters(lead?.top_friction);
  const contactPage = deriveContactPage(domain);

  return {
    id: randomUUID(),
    company: deriveCompany(domain),
    url: domain ? `https://${domain}` : "",
    email: "",
    niche: typeof lead?.niche === "string" ? lead.niche.trim() : "",
    observed_issue: observedIssue,
    why_it_matters: whyItMatters,
    confidence: deriveConfidence(lead?.checkout_score),
    lead_quality: deriveLeadQuality(lead?.checkout_score),
    contact_page: contactPage,
    contact_hint: deriveContactHint(),
    shopify_confidence: shopifyConfidence,
    priority_score: priorityScore,
    status: "backlog",
    source: "merchant_discovery",
    created_at: detectedAt,
    updated_at: now,
    contact_name: "",
    site_reachable: false,
    contact_source: "",
    contact_confidence: "low",
    has_real_contact_path: Boolean(contactPage),
    valid_contact_status: "",
    contact_notes: "",
    issue_hypothesis: observedIssue,
    recommended_template: "observation",
    selected_template: "observation",
    subject: "",
    body: "",
    audit_url: "https://app.abando.ai/fix",
    prefilled_audit_url: derivePrefilledAuditUrl(domain),
    icp_score: Number(lead?.checkout_score) || 0,
    icp_reasons: [
      `checkout_score:${Number(lead?.checkout_score) || 0}`,
      `score_gap:${Number(lead?.score_gap) || 0}`,
    ],
    queue_priority: deriveQueuePriority(priorityScore),
    notes: deriveNotes(lead),
    gmail_draft_url: "",
    last_status_changed_at: now,
    outreach_status: "",
    tracking: {},
  };
}

async function main() {
  const lowScoreLeads = await readLowScoreLeads();
  const existingLeads = await readCanonicalLeads();
  const existingIdentities = new Set(
    existingLeads
      .map((lead) => normalizeStoreIdentity(lead?.url || lead?.store || ""))
      .filter(Boolean),
  );

  const importedLeads = [];
  const duplicateDomains = [];
  const skippedInputs = [];

  for (const lead of lowScoreLeads) {
    const normalizedDomain = normalizeStoreIdentity(lead?.store);

    if (!normalizedDomain) {
      skippedInputs.push({
        input: lead?.store ?? "",
        reason: "invalid_store",
      });
      continue;
    }

    if (existingIdentities.has(normalizedDomain)) {
      duplicateDomains.push(normalizedDomain);
      continue;
    }

    const canonicalLead = buildCanonicalLead(lead);
    importedLeads.push(canonicalLead);
    existingIdentities.add(normalizedDomain);
  }

  if (importedLeads.length > 0) {
    const updatedLeads = [...importedLeads, ...existingLeads];
    await writeFile(LEADS_STORE_PATH, `${JSON.stringify(updatedLeads, null, 2)}\n`, "utf8");
  }

  const report = {
    input_count: lowScoreLeads.length,
    imported_count: importedLeads.length,
    duplicate_count: duplicateDomains.length,
    skipped_count: skippedInputs.length,
    imported_domains: importedLeads.map((lead) => normalizeStoreIdentity(lead.url)),
    duplicate_domains: duplicateDomains,
    skipped_inputs: skippedInputs,
  };

  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(
    "[import-low-score-leads-to-shopifixer-backlog] failed",
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});
