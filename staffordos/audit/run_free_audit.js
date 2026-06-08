#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "..", "..");

const SCORECARDS_PATH = resolve(repoRoot, "staffordos", "scorecards", "scorecards_output.json");
const OUTPUT_PATH = resolve(repoRoot, "staffordos", "audit", "audit_result_surface.json");

function readJson(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`Missing source file: ${relativeToRepo(filePath)}`);
  }

  return JSON.parse(readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function relativeToRepo(filePath) {
  return filePath.replace(`${repoRoot}/`, "");
}

function normalizeStoreInput(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "")
    .split("/")[0]
    .split("?")[0]
    .split("#")[0];
}

function slugifyStoreInput(value) {
  return normalizeStoreInput(value)
    .replace(/\.myshopify\.com$/, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function scorecardTimestamp(scorecard) {
  const parsed = Date.parse(scorecard?.createdAt || scorecard?.updated_at || "1970-01-01T00:00:00.000Z");
  return Number.isFinite(parsed) ? parsed : 0;
}

function selectScorecard(scorecards, storeInput) {
  if (!Array.isArray(scorecards) || scorecards.length === 0) {
    throw new Error("No scorecards available to materialize audit result surface.");
  }

  const normalizedInput = normalizeStoreInput(storeInput);
  const slugInput = slugifyStoreInput(storeInput);

  if (normalizedInput) {
    const matched = scorecards.find((scorecard) => {
      const domain = normalizeStoreInput(scorecard?.domain);
      const slug = String(scorecard?.slug || slugifyStoreInput(domain));

      return normalizedInput === domain || normalizedInput === slug || slugInput === slug;
    });

    if (!matched) {
      throw new Error(`No scorecard source found for requested store: ${storeInput}`);
    }

    return matched;
  }

  return [...scorecards].sort((left, right) => scorecardTimestamp(right) - scorecardTimestamp(left))[0];
}

function firstAvailable(...values) {
  for (const value of values) {
    const normalized = String(value || "").trim();
    if (normalized) {
      return normalized;
    }
  }

  return "Unavailable";
}

function sourceNote(status, source, note = null) {
  return {
    status,
    source,
    note,
  };
}

function buildAuditResultSurface(scorecard, scorecardPayload) {
  const topFindings = Array.isArray(scorecard.topFindings) ? scorecard.topFindings : [];
  const generatedAt = new Date().toISOString();
  const auditScore =
    typeof scorecard.checkoutScore === "number" && Number.isFinite(scorecard.checkoutScore)
      ? scorecard.checkoutScore
      : "Unavailable";
  const estimatedRevenueLeak = firstAvailable(
    scorecard.revenueOpportunityDisplay,
    typeof scorecard.revenueOpportunityCents === "number" ? `${scorecard.revenueOpportunityCents} cents` : "",
  );
  const topIssue = firstAvailable(topFindings[0], scorecard.benchmarkSummary);
  const benchmarkSummary = firstAvailable(scorecard.benchmarkSummary, topFindings[1]);
  const fixRecommendation = firstAvailable(
    topFindings[2],
    "Review the ShopiFixer Fix Sprint against the surfaced checkout issue.",
  );
  const proofPlan = [
    "Treat this scorecard-backed audit result as the before-state summary.",
    "Capture before evidence for the top issue before any scoped fix begins.",
    "Attach after-state evidence and completion notes before claiming a completed ShopiFixer outcome.",
  ];
  const scorecardSource = "staffordos/scorecards/scorecards_output.json";

  return {
    schema: "staffordos.audit.audit_result_surface.v1",
    generated_at: generatedAt,
    store_domain: firstAvailable(scorecard.domain),
    audit_score: auditScore,
    estimated_revenue_leak: estimatedRevenueLeak,
    revenue_claim_scope: "benchmark_estimate_not_live_revenue",
    top_issue: topIssue,
    benchmark_summary: benchmarkSummary,
    fix_recommendation: fixRecommendation,
    recommended_action: fixRecommendation,
    proof_plan: proofPlan,
    confidence: firstAvailable(scorecard.confidence, "Unavailable"),
    updated_at: generatedAt,
    source: {
      primary: scorecardSource,
      source_generated_at: scorecardPayload.generatedAt || null,
      source_audit_updated_at: scorecardPayload.sourceUpdatedAt?.audit || null,
      source_store_scores_updated_at: scorecardPayload.sourceUpdatedAt?.storeScores || null,
      scorecard_created_at: scorecard.createdAt || null,
      audit_id: scorecard.source?.auditId || null,
      score_band: scorecard.source?.scoreBand || null,
    },
    field_sources: {
      store_domain: sourceNote("source", `${scorecardSource}: scorecards[].domain`),
      audit_score: sourceNote("source", `${scorecardSource}: scorecards[].checkoutScore`),
      estimated_revenue_leak: sourceNote(
        "source_estimate",
        `${scorecardSource}: scorecards[].revenueOpportunityDisplay`,
        "Existing benchmark estimate only; not tracked live recovered revenue.",
      ),
      top_issue: sourceNote("source", `${scorecardSource}: scorecards[].topFindings[0]`),
      benchmark_summary: sourceNote("source", `${scorecardSource}: scorecards[].benchmarkSummary`),
      fix_recommendation: sourceNote("source", `${scorecardSource}: scorecards[].topFindings[2]`),
      proof_plan: sourceNote(
        "derived",
        "staffordos/governance/shopifixer_before_after_conversion_model/shopifixer_before_after_conversion_model_v1.md",
        "Plan only; the governance model says the ShopiFixer before/after proof package is still missing.",
      ),
      updated_at: sourceNote("generated", relativeToRepo(OUTPUT_PATH)),
    },
  };
}

export function materializeAuditResultSurface({ storeDomain = "" } = {}) {
  const scorecardPayload = readJson(SCORECARDS_PATH);
  const scorecards = Array.isArray(scorecardPayload.scorecards) ? scorecardPayload.scorecards : [];
  const scorecard = selectScorecard(scorecards, storeDomain);
  const surface = buildAuditResultSurface(scorecard, scorecardPayload);

  writeJson(OUTPUT_PATH, surface);
  return surface;
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  try {
    const storeDomain = process.argv[2] || "";
    const surface = materializeAuditResultSurface({ storeDomain });

    console.log(JSON.stringify({
      ok: true,
      output: relativeToRepo(OUTPUT_PATH),
      store_domain: surface.store_domain,
      audit_score: surface.audit_score,
      estimated_revenue_leak: surface.estimated_revenue_leak,
    }, null, 2));
  } catch (error) {
    console.error(JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }, null, 2));
    process.exit(1);
  }
}
