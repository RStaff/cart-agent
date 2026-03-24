import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { listCandidateOpportunities } from "../candidate_opportunities/index.js";
import { resolveExecutionMode } from "../staffordos/execution/resolveExecutionMode.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = join(__dirname, "registry.json");

const WEIGHTS = {
  impact_score: 0.35,
  frequency_score: 0.25,
  ease_score: 0.2,
  strategic_fit_score: 0.2,
};

async function readRegistry() {
  const raw = await readFile(REGISTRY_PATH, "utf8");
  return JSON.parse(raw);
}

async function writeRegistry(scores) {
  await writeFile(REGISTRY_PATH, JSON.stringify(scores, null, 2) + "\n", "utf8");
}

function normalizeScoreValue(value) {
  const parsed = Number(value) || 0;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function normalizeFivePointScore(value) {
  return Math.max(0, Math.min(5, Number((normalizeScoreValue(value) / 20).toFixed(2))));
}

function normalizeOptimizationConfidence(opportunity) {
  if (opportunity?.confidenceScore !== undefined && opportunity?.confidenceScore !== null) {
    const numeric = Number(opportunity.confidenceScore);
    return Number.isFinite(numeric) ? Math.max(0, Math.min(5, numeric)) : 3;
  }

  const confidence = String(opportunity?.confidence || "").toLowerCase();
  if (confidence === "high") return 5;
  if (confidence === "medium") return 3;
  if (confidence === "low") return 1;
  return 3;
}

function optimizationScoreForOpportunity(opportunity) {
  const revenuePotential = Number(
    opportunity?.revenuePotential
      ?? opportunity?.estimatedRevenueUpside
      ?? opportunity?.estimatedRevenueImpact
      ?? 0,
  ) || 0;
  const currentRecoveryRate = Number(opportunity?.currentRecoveryRate ?? opportunity?.recoveryRate ?? 0) || 0;
  const trafficVolume = Number(opportunity?.trafficVolume ?? opportunity?.monthlyCheckoutSessions ?? 0) || 0;
  const confidence = normalizeOptimizationConfidence(opportunity);

  const subscores = {
    revenue_potential: revenuePotential > 2000 ? 5 : revenuePotential > 1000 ? 4 : revenuePotential > 500 ? 3 : 1,
    performance_gap: currentRecoveryRate < 3 ? 5 : currentRecoveryRate < 5 ? 4 : currentRecoveryRate < 7 ? 3 : 1,
    traffic_volume: trafficVolume > 10000 ? 5 : trafficVolume > 5000 ? 4 : trafficVolume > 1000 ? 3 : 1,
    confidence,
  };

  return {
    score: Number(
      (
        subscores.revenue_potential
        + subscores.performance_gap
        + subscores.traffic_volume
        + subscores.confidence
      ).toFixed(2)
    ),
    subscores,
  };
}

function legacyScoreForOpportunity(opportunity) {
  const impactScore = normalizeScoreValue(opportunity?.impact_score);
  const frequencyScore = normalizeScoreValue(opportunity?.frequency_score);
  const easeScore = normalizeScoreValue(opportunity?.ease_score);
  const strategicFitScore = normalizeScoreValue(opportunity?.strategic_fit_score);

  const weightedScore =
    impactScore * WEIGHTS.impact_score +
    frequencyScore * WEIGHTS.frequency_score +
    easeScore * WEIGHTS.ease_score +
    strategicFitScore * WEIGHTS.strategic_fit_score;

  return {
    score: Number((weightedScore / 5).toFixed(2)),
    subscores: {
      impact_score: normalizeFivePointScore(impactScore),
      frequency_score: normalizeFivePointScore(frequencyScore),
      ease_score: normalizeFivePointScore(easeScore),
      strategic_fit_score: normalizeFivePointScore(strategicFitScore),
    },
  };
}

export function scoreOpportunity(opportunity = {}) {
  const hasLegacyInputs = [
    opportunity?.impact_score,
    opportunity?.frequency_score,
    opportunity?.ease_score,
    opportunity?.strategic_fit_score,
  ].some((value) => value !== undefined && value !== null);

  const scored = hasLegacyInputs
    ? legacyScoreForOpportunity(opportunity)
    : optimizationScoreForOpportunity(opportunity);

  const resolved = resolveExecutionMode(opportunity, scored);

  return {
    score: scored.score,
    subscores: scored.subscores,
    decision: resolved.decision,
    executionMode: resolved.executionMode,
    reasons: resolved.reasons,
  };
}

export async function listOpportunityScores() {
  const scores = await readRegistry();
  return scores.sort((a, b) => {
    if ((b.score || 0) !== (a.score || 0)) {
      return (b.score || 0) - (a.score || 0);
    }
    const timeA = Date.parse(a.created_at || "") || 0;
    const timeB = Date.parse(b.created_at || "") || 0;
    return timeB - timeA;
  });
}

export async function scoreOpportunities() {
  const opportunities = await listCandidateOpportunities();
  const scores = opportunities
    .map((opportunity) => ({
      id: `opportunity_score__${opportunity.id}`,
      opportunity_id: opportunity.id,
      ...scoreOpportunity(opportunity),
      created_at: new Date().toISOString(),
    }))
    .sort((a, b) => b.score - a.score || a.opportunity_id.localeCompare(b.opportunity_id));

  await writeRegistry(scores);

  return {
    scores,
    count: scores.length,
    recommended_next_action:
      scores.length > 0
        ? "Use the top-ranked scored opportunities as the next input to slice generation."
        : "Generate candidate opportunities before running opportunity scoring.",
    reasoning_summary:
      "Opportunity scores were calculated deterministically from existing candidate opportunity scoring fields using transparent v1 weights.",
  };
}

export async function getTopOpportunities(limit = 3) {
  const scores = await listOpportunityScores();
  return scores.slice(0, Math.max(1, Number(limit) || 3));
}
