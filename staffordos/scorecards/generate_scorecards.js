#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const projectRoot = path.resolve(repoRoot, "..");

const AUDIT_INPUT_PATH = path.resolve(projectRoot, "staffordos", "audit", "audit_factory_output.json");
const STORE_SCORES_PATH = path.resolve(projectRoot, "staffordos", "discovery", "store_scores.json");
const OUTPUT_PATH = path.resolve(__dirname, "scorecards_output.json");

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function normalizeDomain(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split("?")[0]
    .split("#")[0];
}

function toSlug(domain) {
  return normalizeDomain(domain)
    .replace(/\.myshopify\.com$/, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseUsdToCents(value) {
  const raw = String(value || "").replace(/[^0-9.]/g, "");
  if (!raw) {
    return 0;
  }

  const dollars = Number(raw);
  if (!Number.isFinite(dollars)) {
    return 0;
  }

  return Math.round(dollars * 100);
}

function formatUsd(cents) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format((Number(cents) || 0) / 100);
}

function selectLatestAuditRuns(runs) {
  const byDomain = new Map();

  for (const run of Array.isArray(runs) ? runs : []) {
    const domain = normalizeDomain(run.store_domain || run.domain || run.audit_result?.store_domain);
    if (!domain || !run.audit_result) {
      continue;
    }

    const currentTime = Date.parse(
      run.audit_result?.created_at || run.processed_at || run.created_at || "1970-01-01T00:00:00.000Z",
    );
    const existing = byDomain.get(domain);
    const existingTime = existing
      ? Date.parse(
          existing.audit_result?.created_at || existing.processed_at || existing.created_at || "1970-01-01T00:00:00.000Z",
        )
      : 0;

    if (!existing || currentTime >= existingTime) {
      byDomain.set(domain, run);
    }
  }

  return [...byDomain.values()];
}

function findTopFindingTexts(auditResult, scoreEntry, breakdown) {
  const findings = [];
  const topIssue = String(auditResult?.top_issue || "").trim();
  const benchmark = String(auditResult?.benchmark_comparison || "").trim();
  const recommendedAction = String(auditResult?.recommended_action || "").trim();

  if (topIssue) {
    findings.push(capitalizeSentence(topIssue));
  }

  if (benchmark) {
    findings.push(benchmark);
  }

  if (recommendedAction) {
    findings.push(recommendedAction);
  }

  if (findings.length < 3) {
    const derived = Object.entries(breakdown)
      .filter(([, cents]) => Number(cents) > 0)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .map(([key]) => findingFromBreakdownKey(key));

    for (const item of derived) {
      if (item && !findings.includes(item)) {
        findings.push(item);
      }
      if (findings.length >= 3) {
        break;
      }
    }
  }

  if (findings.length < 3 && scoreEntry?.score_band) {
    findings.push(`Current opportunity band is ${String(scoreEntry.score_band).toLowerCase()}.`);
  }

  return findings.slice(0, 4);
}

function capitalizeSentence(value) {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
}

function breakdownTemplate() {
  return {
    checkoutFrictionCents: 0,
    trustSignalsCents: 0,
    faqGapCents: 0,
    urgencyGapCents: 0,
  };
}

function deriveOpportunityBreakdown(auditResult, totalCents) {
  const breakdown = breakdownTemplate();
  const issue = String(auditResult?.top_issue || "").toLowerCase();
  const action = String(auditResult?.recommended_action || "").toLowerCase();
  const haystack = `${issue} ${action}`;

  let category = "checkoutFrictionCents";
  if (haystack.includes("trust") || haystack.includes("proof") || haystack.includes("reassurance")) {
    category = "trustSignalsCents";
  } else if (
    haystack.includes("faq") ||
    haystack.includes("pricing explanation") ||
    haystack.includes("clarify pricing") ||
    haystack.includes("value explanation")
  ) {
    category = "faqGapCents";
  } else if (
    haystack.includes("urgency") ||
    haystack.includes("discount") ||
    haystack.includes("incentive")
  ) {
    category = "urgencyGapCents";
  }

  breakdown[category] = totalCents;
  return breakdown;
}

function findingFromBreakdownKey(key) {
  if (key === "checkoutFrictionCents") {
    return "Checkout friction is likely reducing completion rate.";
  }
  if (key === "trustSignalsCents") {
    return "Trust signals near purchase appear weaker than benchmark.";
  }
  if (key === "faqGapCents") {
    return "Pricing or FAQ clarity appears insufficient before purchase.";
  }
  if (key === "urgencyGapCents") {
    return "Urgency and incentive framing may be underdeveloped.";
  }
  return "";
}

function buildScorecardEntry(run, scoreEntry) {
  const domain = normalizeDomain(run.store_domain || run.domain || run.audit_result?.store_domain);
  const slug = toSlug(domain);
  const auditResult = run.audit_result || {};
  const revenueOpportunityCents = parseUsdToCents(auditResult.estimated_revenue_leak);
  const opportunityBreakdown = deriveOpportunityBreakdown(auditResult, revenueOpportunityCents);
  const createdAt =
    auditResult.created_at ||
    run.processed_at ||
    scoreEntry?.scored_at ||
    new Date().toISOString();

  return {
    domain,
    slug,
    publicUrl: `/scorecard/${slug}`,
    conversion: "Unavailable",
    shopifyMedian: "Unavailable",
    revenueOpportunityCents,
    revenueOpportunityDisplay: formatUsd(revenueOpportunityCents),
    opportunityBreakdown,
    topFindings: findTopFindingTexts(auditResult, scoreEntry, opportunityBreakdown),
    installPath: `/install/shopify?shop=${encodeURIComponent(domain)}`,
    createdAt,
    benchmarkSummary: auditResult.benchmark_comparison || null,
    checkoutScore: Number(auditResult.audit_score || scoreEntry?.opportunity_score || 0),
    confidence: auditResult.confidence || null,
    source: {
      auditId: run.audit_id || auditResult.audit_id || null,
      scoreBand: scoreEntry?.score_band || run.score_band || null,
      componentBreakdown: scoreEntry?.component_breakdown || null,
    },
  };
}

export function generateScorecards() {
  const auditOutput = readJson(AUDIT_INPUT_PATH, { runs: [] });
  const storeScores = readJson(STORE_SCORES_PATH, { stores: [] });
  const latestRuns = selectLatestAuditRuns(auditOutput.runs);
  const scoreMap = new Map(
    (Array.isArray(storeScores.stores) ? storeScores.stores : []).map((entry) => [normalizeDomain(entry.domain), entry]),
  );

  const scorecards = latestRuns
    .map((run) => {
      const domain = normalizeDomain(run.store_domain || run.domain || run.audit_result?.store_domain);
      return buildScorecardEntry(run, scoreMap.get(domain));
    })
    .filter((entry) => entry.domain);

  const output = {
    generatedAt: new Date().toISOString(),
    sourceUpdatedAt: {
      audit: auditOutput.updated_at || null,
      storeScores: storeScores.updated_at || null,
    },
    scorecards,
  };

  writeJson(OUTPUT_PATH, output);
  return output;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(generateScorecards(), null, 2));
}
