import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const INPUT_PATH = join(__dirname, "low_score_leads.json");
const OUTPUT_PATH = join(__dirname, "shopifixer_backlog.csv");

const HEADER = [
  "company",
  "url",
  "email",
  "niche",
  "observed_issue",
  "why_it_matters",
  "confidence",
  "lead_quality",
  "shopify_confidence",
  "priority_score",
  "contact_page",
  "contact_hint",
];

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

function deriveCompany(domain) {
  const cleanDomain = normalizeDomain(domain);
  if (!cleanDomain) {
    return "";
  }

  return cleanDomain.split(".")[0].replace(/[^a-z0-9]/gi, " ").trim().replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");
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
  if (numericScore <= 60) return "medium";
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

function deriveContactPage(domain) {
  const normalizedDomain = normalizeDomain(domain);
  return normalizedDomain ? `https://${normalizedDomain}/contact` : "";
}

function deriveContactHint() {
  return "Check the contact page or LinkedIn for a founder or marketing lead.";
}

function csvEscape(value) {
  const stringValue = String(value ?? "");
  return `"${stringValue.replace(/"/g, "\"\"")}"`;
}

function deriveObservedIssue(topFriction) {
  const normalizedFriction = String(topFriction ?? "").trim();
  return ISSUE_MAP[normalizedFriction] || "Checkout friction detected that may impact conversion.";
}

function deriveWhyItMatters(topFriction) {
  const normalizedFriction = String(topFriction ?? "").trim();
  return WHY_MAP[normalizedFriction] || "This checkout issue may be reducing conversion and increasing abandonment.";
}

function buildCsvRow(lead) {
  const domain = normalizeDomain(lead?.store);
  const shopifyConfidence = deriveShopifyConfidence(lead?.store);
  const row = {
    company: deriveCompany(domain),
    url: domain,
    email: "",
    niche: typeof lead?.niche === "string" ? lead.niche.trim() : "",
    observed_issue: deriveObservedIssue(lead?.top_friction),
    why_it_matters: deriveWhyItMatters(lead?.top_friction),
    confidence: deriveConfidence(lead?.checkout_score),
    lead_quality: deriveLeadQuality(lead?.checkout_score),
    shopify_confidence: shopifyConfidence,
    priority_score: derivePriorityScore(lead, shopifyConfidence),
    contact_page: deriveContactPage(domain),
    contact_hint: deriveContactHint(),
  };

  return HEADER.map((column) => csvEscape(row[column])).join(",");
}

async function readLowScoreLeads() {
  let raw;

  try {
    raw = await readFile(INPUT_PATH, "utf8");
  } catch (error) {
    if (error && error.code === "ENOENT") {
      throw new Error(`input_file_missing:${INPUT_PATH}`);
    }
    throw error;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`input_file_invalid_json:${INPUT_PATH}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error("input_not_array");
  }

  return parsed;
}

async function main() {
  const leads = await readLowScoreLeads();
  const sortedLeads = [...leads].sort((left, right) => {
    const leftScore = derivePriorityScore(left, deriveShopifyConfidence(left?.store));
    const rightScore = derivePriorityScore(right, deriveShopifyConfidence(right?.store));
    if (rightScore !== leftScore) {
      return rightScore - leftScore;
    }

    return normalizeDomain(left?.store).localeCompare(normalizeDomain(right?.store));
  });
  const rows = [
    HEADER.join(","),
    ...sortedLeads.map((lead) => buildCsvRow(lead)),
  ];

  await writeFile(OUTPUT_PATH, rows.join("\n") + "\n", "utf8");
  console.log(`Exported ${sortedLeads.length} low-score leads to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error("[export-low-score-leads-to-shopifixer-csv] failed", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
