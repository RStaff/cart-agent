const DECISION_THRESHOLDS = {
  REVIEW: 12,
  ELIGIBLE_FOR_TASK: 16,
};

function clampDimensionScore(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(5, Math.round(numeric)));
}

function normalizeRevenuePotential(opportunity) {
  return Number(
    opportunity?.revenuePotential
      ?? opportunity?.estimatedRevenueUpside
      ?? opportunity?.revenue_potential
      ?? opportunity?.monthlyRevenueLeak
      ?? opportunity?.monthlyRevenueLeakDollars
      ?? 0,
  ) || 0;
}

function normalizeCurrentRecoveryRate(opportunity) {
  return Number(
    opportunity?.currentRecoveryRate
      ?? opportunity?.current_recovery_rate
      ?? opportunity?.recoveryRate
      ?? 0,
  ) || 0;
}

function normalizeTrafficVolume(opportunity) {
  return Number(
    opportunity?.trafficVolume
      ?? opportunity?.monthlyCheckoutSessions
      ?? opportunity?.monthlyCheckoutVolume
      ?? opportunity?.traffic_volume
      ?? 0,
  ) || 0;
}

function normalizeConfidence(opportunity) {
  if (opportunity?.confidenceScore === undefined || opportunity?.confidenceScore === null) {
    return 3;
  }
  return clampDimensionScore(opportunity.confidenceScore);
}

function scoreRevenuePotential(value) {
  if (value > 2000) return 5;
  if (value > 1000) return 4;
  if (value > 500) return 3;
  return 1;
}

function scorePerformanceGap(currentRecoveryRate) {
  if (currentRecoveryRate < 3) return 5;
  if (currentRecoveryRate < 5) return 4;
  if (currentRecoveryRate < 7) return 3;
  return 1;
}

function scoreTrafficVolume(value) {
  if (value > 10000) return 5;
  if (value > 5000) return 4;
  if (value > 1000) return 3;
  return 1;
}

function strategicDecision(score) {
  if (score >= DECISION_THRESHOLDS.ELIGIBLE_FOR_TASK) {
    return "ELIGIBLE_FOR_TASK";
  }
  if (score >= DECISION_THRESHOLDS.REVIEW) {
    return "REVIEW";
  }
  return "AUTOMATE_ONLY";
}

export function evaluateOpportunity(opportunity = {}) {
  const revenuePotentialValue = normalizeRevenuePotential(opportunity);
  const currentRecoveryRate = normalizeCurrentRecoveryRate(opportunity);
  const trafficVolumeValue = normalizeTrafficVolume(opportunity);
  const confidenceValue = normalizeConfidence(opportunity);

  const breakdown = {
    revenue_potential: {
      value: revenuePotentialValue,
      score: scoreRevenuePotential(revenuePotentialValue),
    },
    performance_gap: {
      value: currentRecoveryRate,
      score: scorePerformanceGap(currentRecoveryRate),
    },
    traffic_volume: {
      value: trafficVolumeValue,
      score: scoreTrafficVolume(trafficVolumeValue),
    },
    confidence: {
      value: confidenceValue,
      score: clampDimensionScore(confidenceValue),
    },
  };

  const score = Object.values(breakdown).reduce((total, item) => total + item.score, 0);
  const decision = strategicDecision(score);

  return {
    score,
    decision,
    breakdown,
    thresholds: { ...DECISION_THRESHOLDS },
    evaluationSummary: `Abando Optimization Engine scored this opportunity ${score}/20 and classified it as ${decision}.`,
    validationMode: Boolean(opportunity?.validationMode),
  };
}
